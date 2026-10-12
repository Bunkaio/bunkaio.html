import type { Env } from './types';

/**
 * Devis : créés et envoyés depuis le tableau de bord admin, signés en ligne par le client
 * (page /signature/ du site). Le devis envoyé est figé : son empreinte SHA-256 est calculée
 * à l'envoi et revérifiée à la signature. Toute modification passe par l'annulation puis
 * la duplication du devis.
 */
export type QuoteStatus = 'brouillon' | 'envoye' | 'signe' | 'refuse' | 'expire' | 'annule';

export interface QuoteClient {
  nom: string;
  profil: 'particulier' | 'professionnel';
  contact?: string;
  forme?: string;
  adresse?: string;
  telephone?: string;
  siret?: string;
  tvaIntra?: string;
}

/** Usages promotionnels de l'image par BUNKAIO : chacun fait l'objet d'un choix distinct, jamais pré-coché. */
export const IMAGE_USES = ['site', 'social', 'print', 'ads'] as const;
export type ImageUseId = (typeof IMAGE_USES)[number];
export type UseChoice = 'oui' | 'non';
export type ImageUse = Record<ImageUseId, UseChoice>;
export type ImageStatus = 'en_attente' | 'accepte' | 'refuse' | 'partiel' | 'retrait_demande' | 'retire';

/** Clauses d'image figées à l'envoi (version + empreinte) ; le texte intégral est dans KV `quotelegal:<id>`. */
export interface QuoteLegal {
  version: string;
  snapshotHash: string;
  frozenAt: string;
}

/** Personne photographiée autre que le signataire (salarié, invité, enfant, modèle…). */
export interface Subject {
  id: string;
  token: string;
  name: string;
  email?: string;
  role?: string;
  minor: boolean;
  guardianName?: string;
  guardianRelation?: string;
  status: 'invite' | 'signe';
  imageUse?: ImageUse;
  createdAt: string;
  invitedAt?: string;
  signedAt?: string;
  ip?: string;
  ua?: string;
  legalVersion?: string;
  snapshotHash?: string;
  hash?: string;
  withdrawnUses?: ImageUseId[];
  withdrawalRequestedAt?: string;
}

/** État courant du droit à l'image du signataire (calculé à partir de la signature et du journal). */
export interface QuoteConsent {
  status: ImageStatus;
  uses?: ImageUse;
  consentAt?: string;
  withdrawalRequestedAt?: string;
  withdrawnAt?: string;
  withdrawnUses?: ImageUseId[];
}

export interface QuoteSignature {
  name: string;
  at: string;
  ip: string;
  ua: string;
  portfolio: boolean;
  retractationWaiver: boolean;
  hash: string;
  /** Choix détaillés (devis envoyés avec clauses d'image). */
  imageUse?: ImageUse;
  persons?: 'self' | 'self_others' | 'others';
  minors?: boolean;
  legalVersion?: string;
  snapshotHash?: string;
  pdfHash?: string;
  /** Mention saisie par le signataire (« Bon pour accord ») et présence d'une signature manuscrite (image dans KV `quotesigimg:<id>`). */
  mention?: string;
  sigImage?: boolean;
}

export interface Quote {
  id: string;
  number: string;
  token: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  closedAt?: string;
  email: string;
  lang: 'fr' | 'en';
  template: string;
  client: QuoteClient;
  prestation: string;
  contenu: string;
  notes?: string;
  seance?: { date?: string; heure?: string; lieu?: string };
  delai: string;
  totalHT: number;
  acomptePct: number;
  abonnement?: boolean;
  droits: { destination: string; duree: string; territoire?: string; exclusivite?: string };
  report?: string;
  conditions: string[];
  validUntil: string;
  mediateur?: string;
  tribunal?: string;
  contentHash?: string;
  signature?: QuoteSignature;
  signedVia?: 'en_ligne' | 'yousign' | 'manuel';
  legal?: QuoteLegal;
  consent?: QuoteConsent;
  subjects?: Subject[];
  groupToken?: string;
  depositInvoice?: { id: string; url: string; amount: number };
  /** Facture de solde rattachée à ce devis (créée depuis l'admin, Factures → solde). */
  balanceInvoice?: { id: string; url: string; amount: number };
  reminderSentAt?: string;
  /** Devis de test créé depuis l'admin : aucune facture Stripe, numérotation hors séquence, exclu des indicateurs. */
  test?: boolean;
  /** Une seule nouvelle tentative automatique de création de la facture d'acompte après un échec à la signature. */
  depositRetryAt?: string;
}

const PREFIX = 'quote:';
const s = (v: unknown, max = 4000): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Champs modifiables par l'admin tant que le devis est un brouillon (tout le reste est géré par le serveur). */
export function cleanQuoteInput(input: Record<string, unknown>): Partial<Quote> | null {
  const email = s(input.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const c = (input.client ?? {}) as Record<string, unknown>;
  const d = (input.droits ?? {}) as Record<string, unknown>;
  const se = (input.seance ?? {}) as Record<string, unknown>;
  const total = Number(input.totalHT);
  if (!Number.isFinite(total) || total <= 0 || total > 1_000_000) return null;
  const date = (v: unknown): string | undefined => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  return {
    email,
    lang: input.lang === 'en' ? 'en' : 'fr',
    template: s(input.template, 20) || 'part',
    client: {
      nom: s(c.nom, 200),
      profil: c.profil === 'professionnel' ? 'professionnel' : 'particulier',
      contact: s(c.contact, 200) || undefined,
      forme: s(c.forme, 30) || undefined,
      adresse: s(c.adresse, 400) || undefined,
      telephone: s(c.telephone, 50) || undefined,
      siret: s(c.siret, 20).replace(/\s/g, '') || undefined,
      tvaIntra: s(c.tvaIntra, 20).replace(/\s/g, '').toUpperCase() || undefined,
    },
    prestation: s(input.prestation, 300),
    contenu: s(input.contenu),
    notes: s(input.notes) || undefined,
    seance: { date: date(se.date), heure: s(se.heure, 30) || undefined, lieu: s(se.lieu, 300) || undefined },
    delai: s(input.delai, 300),
    totalHT: Math.round(total * 100) / 100,
    acomptePct: 30,
    abonnement: input.abonnement === true,
    droits: { destination: s(d.destination), duree: s(d.duree, 300), territoire: s(d.territoire, 200) || undefined, exclusivite: s(d.exclusivite, 100) || undefined },
    report: s(input.report) || undefined,
    conditions: Array.isArray(input.conditions) ? input.conditions.map((x) => s(x, 1000)).filter(Boolean).slice(0, 20) : [],
    validUntil: date(input.validUntil) ?? new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    mediateur: s(input.mediateur, 400) || undefined,
    tribunal: s(input.tribunal, 200) || undefined,
  };
}

export function missingQuoteFields(q: Partial<Quote>): string[] {
  const m: string[] = [];
  if (!q.client?.nom) m.push('nom du client');
  if (!q.client?.adresse) m.push('adresse du client');
  if (q.client?.profil === 'professionnel' && !q.client.contact) m.push('contact (professionnel)');
  if (!q.prestation) m.push('prestation');
  if (!q.contenu) m.push('contenu / livrables');
  if (!q.delai) m.push('délai de livraison');
  if (!q.droits?.destination || !q.droits.duree) m.push('cession des droits');
  return m;
}

const randomHex = (bytes: number): string => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');

export async function getQuote(env: Env, id: string): Promise<Quote | null> {
  if (!/^[a-z0-9-]{6,40}$/.test(id)) return null;
  const raw = await env.ACCOUNTS_KV.get(PREFIX + id);
  return raw ? (JSON.parse(raw) as Quote) : null;
}

export async function putQuote(env: Env, q: Quote): Promise<void> {
  q.updatedAt = new Date().toISOString();
  await env.ACCOUNTS_KV.put(PREFIX + q.id, JSON.stringify(q));
}

export async function listQuotes(env: Env): Promise<Quote[]> {
  const keys = (await env.ACCOUNTS_KV.list({ prefix: PREFIX, limit: 1000 })).keys;
  const all = await Promise.all(keys.map(async (k) => {
    try { return JSON.parse((await env.ACCOUNTS_KV.get(k.name)) ?? 'null') as Quote | null; } catch { return null; }
  }));
  return all.filter((q): q is Quote => !!q).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Numérotation chronologique continue par année : AAAA-001, AAAA-002… */
async function nextNumber(env: Env): Promise<string> {
  const year = new Date().getFullYear();
  const key = `quote-seq:${year}`;
  const n = Number((await env.ACCOUNTS_KV.get(key)) ?? '0') + 1;
  await env.ACCOUNTS_KV.put(key, String(n));
  return `${year}-${String(n).padStart(3, '0')}`;
}

export async function createQuote(env: Env, data: Partial<Quote>): Promise<Quote> {
  const now = new Date().toISOString();
  const q = {
    ...data,
    id: `q-${randomHex(8)}`,
    number: await nextNumber(env),
    token: '',
    status: 'brouillon',
    createdAt: now,
    updatedAt: now,
  } as Quote;
  await putQuote(env, q);
  return q;
}

/** Empreinte du contenu contractuel (hors statut, dates techniques, signature). */
export async function quoteHash(q: Quote): Promise<string> {
  const { email, client, prestation, contenu, notes, seance, delai, totalHT, acomptePct, abonnement, droits, report, conditions, validUntil, mediateur, tribunal, number } = q;
  const legalHash = q.legal ? q.legal.snapshotHash : undefined;
  const canonical = JSON.stringify(legalHash ? { number, email, client, prestation, contenu, notes, seance, delai, totalHT, acomptePct, abonnement, droits, report, conditions, validUntil, mediateur, tribunal, legalHash } : { number, email, client, prestation, contenu, notes, seance, delai, totalHT, acomptePct, abonnement, droits, report, conditions, validUntil, mediateur, tribunal });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function prepareSend(q: Quote): Promise<Quote> {
  q.token = q.token || randomHex(24);
  q.contentHash = await quoteHash(q);
  q.status = 'envoye';
  q.sentAt = new Date().toISOString();
  return q;
}

/** Vue publique pour la page de signature : sans le jeton ni les champs internes. */
export function publicQuote(q: Quote): Omit<Quote, 'token' | 'depositInvoice' | 'reminderSentAt' | 'subjects' | 'groupToken'> & { depositUrl?: string; groupUrl?: string } {
  const { token: _t, depositInvoice, reminderSentAt: _r, subjects: _s, groupToken, ...rest } = q;
  /* L'adresse IP et le navigateur du signataire ne sont pas renvoyés au navigateur : ils restent dans le dossier de preuve. */
  const signature = rest.signature ? { ...rest.signature, ip: '', ua: '' } : undefined;
  return { ...rest, ...(signature ? { signature } : {}), ...(depositInvoice ? { depositUrl: depositInvoice.url } : {}), ...(groupToken && q.status === 'signe' ? { groupUrl: `https://bunkaio.com/autorisation/?q=${q.id}&g=${groupToken}` } : {}) };
}

export function tokenMatches(q: Quote, token: unknown): boolean {
  if (typeof token !== 'string' || !q.token || token.length !== q.token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ q.token.charCodeAt(i);
  return diff === 0;
}

export function isExpired(q: Quote): boolean {
  return q.status === 'envoye' && q.validUntil < new Date().toISOString().slice(0, 10);
}

/* ───────────── Clauses figées, journal des consentements, preuve ───────────── */

export interface FrozenLegal {
  version: string;
  html: string;
  /** Description des usages et notice remise aux personnes photographiées (figées avec la version). */
  uses: { id: ImageUseId; label: string; text: string }[];
  notice: string;
  hash: string;
  at: string;
}

export const sha256Hex = async (text: string): Promise<string> =>
  [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function putFrozenLegal(env: Env, quoteId: string, f: FrozenLegal): Promise<void> {
  await env.ACCOUNTS_KV.put('quotelegal:' + quoteId, JSON.stringify(f));
}
export async function getFrozenLegal(env: Env, quoteId: string): Promise<FrozenLegal | null> {
  const raw = await env.ACCOUNTS_KV.get('quotelegal:' + quoteId);
  return raw ? (JSON.parse(raw) as FrozenLegal) : null;
}

/** Valide et fige les clauses transmises à l'envoi (texte unique, jamais réécrit ensuite). */
export async function freezeLegal(input: unknown): Promise<FrozenLegal | null> {
  if (!input || typeof input !== 'object') return null;
  const o = input as Record<string, unknown>;
  const version = typeof o.version === 'string' ? o.version : '';
  const html = typeof o.html === 'string' ? o.html : '';
  const notice = typeof o.notice === 'string' ? o.notice : '';
  if (!/^DI-\d{1,3}\.\d{1,3}$/.test(version) || html.length < 500 || html.length > 400_000 || notice.length > 40_000) return null;
  if (/<script|javascript:|\son[a-z]+\s*=/i.test(html + notice)) return null;
  const rawUses = Array.isArray(o.uses) ? (o.uses as Record<string, unknown>[]) : [];
  const uses = IMAGE_USES.map((id) => {
    const u = rawUses.find((x) => x && x.id === id);
    return { id, label: String(u?.label ?? '').slice(0, 300), text: String(u?.text ?? '').slice(0, 1500) };
  });
  if (uses.some((u) => !u.label)) return null;
  const at = new Date().toISOString();
  return { version, html, uses, notice, hash: await sha256Hex(JSON.stringify({ version, html, uses, notice })), at };
}

export type ConsentEventType = 'choix' | 'retrait_demande' | 'retrait' | 'invitation' | 'note';
export interface ConsentEvent {
  at: string;
  type: ConsentEventType;
  /** 'client' ou 'subject:<id>' ou 'admin'. */
  who: string;
  usage?: ImageUseId | 'all';
  choice?: UseChoice;
  note?: string;
  ip?: string;
}

const LOGKEY = 'consentlog:';
export async function getConsentLog(env: Env, quoteId: string): Promise<ConsentEvent[]> {
  const raw = await env.ACCOUNTS_KV.get(LOGKEY + quoteId);
  return raw ? (JSON.parse(raw) as ConsentEvent[]) : [];
}
/** Journal en ajout seul : on ne modifie ni ne supprime jamais une ligne existante. */
export async function appendConsent(env: Env, quoteId: string, events: Omit<ConsentEvent, 'at'>[]): Promise<void> {
  const log = await getConsentLog(env, quoteId);
  const at = new Date().toISOString();
  for (const e of events) log.push({ at, ...e });
  await env.ACCOUNTS_KV.put(LOGKEY + quoteId, JSON.stringify(log));
}

/** Choix en vigueur du signataire : dernier choix, moins les usages retirés. */
export function computeConsent(q: Quote): QuoteConsent {
  const sg = q.signature;
  if (!sg || !sg.imageUse) {
    /* Anciens devis : un seul choix « portfolio ». */
    if (sg && q.status === 'signe') {
      const uses: ImageUse = { site: sg.portfolio ? 'oui' : 'non', social: 'non', print: 'non', ads: 'non' };
      return { status: sg.portfolio ? 'partiel' : 'refuse', uses, consentAt: sg.at };
    }
    return { status: 'en_attente' };
  }
  const prev = q.consent ?? { status: 'en_attente' as ImageStatus };
  const withdrawn = prev.withdrawnUses ?? [];
  const uses = { ...sg.imageUse } as ImageUse;
  for (const u of withdrawn) uses[u] = 'non';
  const yes = IMAGE_USES.filter((u) => sg.imageUse![u] === 'oui');
  const stillYes = yes.filter((u) => !withdrawn.includes(u));
  let status: ImageStatus;
  if (yes.length && !stillYes.length) status = 'retire';
  else if (prev.withdrawalRequestedAt && !prev.withdrawnAt) status = 'retrait_demande';
  else if (!yes.length) status = 'refuse';
  else if (yes.length === IMAGE_USES.length && !withdrawn.length) status = 'accepte';
  else status = 'partiel';
  return { ...prev, status, uses, consentAt: sg.at };
}
