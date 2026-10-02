import type {
  AccountRecord,
  AdminAccountRecord,
  AccountType,
  AdminAccountSummary,
  AdminAccountUpsertPayload,
  Env,
  PublicAccountRecord,
} from './types';

const ACCOUNT_LIST_PREFIX = 'account:';

/** Clé KV d'un compte — un compte par couple (type, email), email normalisé en minuscules. */
function accountKey(type: AccountType, email: string): string {
  return `${ACCOUNT_LIST_PREFIX}${type}:${email.trim().toLowerCase()}`;
}

/**
 * Hash SHA-256 du code d'accès, encodé en hexadécimal. Le code n'est jamais
 * stocké ni renvoyé en clair — y compris à l'admin, qui doit en saisir un
 * nouveau pour en changer plutôt que de pouvoir lire l'existant.
 * crypto.subtle est natif au runtime Workers (Web Crypto API).
 */
export async function hashCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.trim().toUpperCase());
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getAccount(env: Env, type: AccountType, email: string): Promise<AccountRecord | null> {
  const raw = await env.ACCOUNTS_KV.get(accountKey(type, email));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AccountRecord;
  } catch (err) {
    console.error('[accounts] entrée KV illisible', { type, email, err });
    return null;
  }
}

/** Écrit le compte et met à jour sa métadonnée de liste (type/email/nom), lue par listAccounts()
    sans avoir à relire chaque valeur complète — évite un fetch par compte pour la liste admin. */
export async function putAccount(env: Env, record: AccountRecord): Promise<void> {
  await env.ACCOUNTS_KV.put(accountKey(record.type, record.email), JSON.stringify(record), {
    metadata: { type: record.type, email: record.email, nom: record.nom ?? '', derniereActivite: record.derniereActivite ?? '' },
  });
}

export function sanitizeAccount(record: AccountRecord): PublicAccountRecord {
  const { codeHash: _codeHash, journal: _journal, derniereActivite: _derniere, ...publicRecord } = record;
  return publicRecord;
}

/** Vue admin : comme sanitizeAccount mais conserve le journal d'activité. */
export function adminAccountView(record: AccountRecord): AdminAccountRecord {
  const { codeHash: _codeHash, ...adminRecord } = record;
  return adminRecord;
}

/**
 * Vérifie email + code pour le type de compte donné. Renvoie toujours la
 * même erreur générique côté appelant (pas de distinction "email inconnu"
 * vs "code incorrect") pour ne pas permettre l'énumération des emails
 * enregistrés.
 */
export async function verifyLogin(env: Env, type: AccountType, email: string, code: string): Promise<AccountRecord | null> {
  const record = await getAccount(env, type, email);
  if (!record) return null;
  const candidateHash = await hashCode(code);
  if (candidateHash !== record.codeHash) return null;
  return record;
}

/** Liste légère (type/email/nom) de tous les comptes, pour le sélecteur de l'admin. */
export async function listAccounts(env: Env): Promise<AdminAccountSummary[]> {
  const result = await env.ACCOUNTS_KV.list<{ type: AccountType; email: string; nom?: string; derniereActivite?: string }>({
    prefix: ACCOUNT_LIST_PREFIX,
    limit: 1000,
  });
  return result.keys
    .filter((k) => k.metadata)
    .map((k) => ({
      type: k.metadata!.type,
      email: k.metadata!.email,
      nom: k.metadata!.nom,
      derniereActivite: k.metadata!.derniereActivite || undefined,
    }));
}

/**
 * Crée ou met à jour un compte à partir du payload admin. `code` est
 * optionnel : omis à la mise à jour, le hash existant est conservé — fourni,
 * il remplace le code d'accès (création ou changement de code).
 */
export async function upsertAccountFromAdmin(env: Env, payload: AdminAccountUpsertPayload): Promise<AccountRecord> {
  const existing = await getAccount(env, payload.type, payload.email);
  if (!payload.code && !existing) {
    throw new Error('code_required_for_new_account');
  }
  const codeHash = payload.code ? await hashCode(payload.code) : existing!.codeHash;
  const record: AccountRecord = {
    type: payload.type,
    email: payload.email.trim(),
    codeHash,
    nom: payload.nom ?? existing?.nom,
    telephone: payload.telephone ?? existing?.telephone,
    adresse: payload.adresse ?? existing?.adresse,
    etapeActuelle: payload.etapeActuelle ?? existing?.etapeActuelle,
    lightroomUrl: payload.lightroomUrl ?? existing?.lightroomUrl,
    commandes: payload.commandes ?? existing?.commandes,
    paiements: payload.paiements ?? existing?.paiements,
    factures: payload.factures ?? existing?.factures,
    abonnement: payload.abonnement === null ? undefined : payload.abonnement ?? existing?.abonnement,
    moodboards: payload.moodboards ?? existing?.moodboards,
    partenariat: payload.partenariat === null ? undefined : payload.partenariat ?? existing?.partenariat,
    promotions: payload.promotions ?? existing?.promotions,
    reseau: payload.reseau ?? existing?.reseau,
    collaborations: payload.collaborations ?? existing?.collaborations,
    journal: existing?.journal,
    derniereActivite: existing?.derniereActivite,
  };
  await putAccount(env, record);
  return record;
}
