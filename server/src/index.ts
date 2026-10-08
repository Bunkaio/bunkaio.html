import type Stripe from 'stripe';
import { adminAccountView, getAccount, listAccounts, putAccount, sanitizeAccount, upsertAccountFromAdmin, verifyLogin } from './accounts';
import { handleCollect, handleStats, purgeOldAnalytics } from './analytics';
import { appendJournal, diffAccountActivity, flushActivityNotifications, queueActivityNotification } from './activity';
import { billingErrors, cleanBilling, composeAddress } from './billing';
import { buildDashboard, deleteContact, removeInvoice } from './admin';
import { getLastPush, getVapid, notifyAdmin, removeSubscription, saveSubscription } from './push';
import { setContactTags, setTagNames } from './tags';
import { autoSms, getSmsSettings, sendSms, setSmsSettings, smsProvider, toE164 } from './sms';
import { getInboxMessage, getSpamRules, previewReply, replyTo, rescanSpam, setLabelNames, setSpamRules, syncResendInbox, updateInbox } from './inbox';
import { buildManualMail, getMailLog, isUnsubscribed, listCampaigns, MANUAL_TEMPLATES, saveCampaign, sendMailing, setUnsubscribed } from './mailing';
import type { ManualTemplate, MailingParams, RecipientCtx } from './mailing';
import { unsubscribeToken } from './email';
import { cleanQuoteInput, createQuote, getQuote, isExpired, listQuotes, missingQuoteFields, prepareSend, publicQuote, putQuote, quoteHash, tokenMatches } from './quotes';
import type { Quote } from './quotes';
import { getBusinessAddress } from './config';
import { cleanDetails, MESSAGE_KINDS, storeMessage, updateMessage } from './messages';
import type { MessageKind } from './messages';
import { configureBusiness } from './config';
import { claimAckSlot, markBalanceInvoiced, markDepositPaid, markInvoiced, markLead, runDailyAutomations } from './automations';
import {
  buildQuoteEmail,
  buildQuoteSignedEmail,
  buildAdminAlertEmail,
  buildAcknowledgementEmail,
  buildSeanceEmail,
  buildAccessCodeEmail,
  buildPhotosReadyEmail,
  buildAdminPaymentNotificationEmail,
  buildBalanceInvoiceEmail,
  buildDepositInvoiceEmail,
  buildOverdueReminderEmail,
  buildPaymentConfirmationEmail,
  buildQuizConfirmationEmail,
    normalizeLang,
  sendEmail,
} from './email';
import {
  createBalanceInvoice,
  createDepositInvoice,
  createStripeClient,
  ensureCustomer,
  syncCustomerBilling,
  findOverdueInvoices,
  getCustomerLang,
  grantReviewDiscount,
  listLeads,
  markInvoiceReminded,
  recordPaymentOnCustomer,
  upsertQuizCustomer,
  verifyWebhookEvent,
} from './stripe';
import type {
  AccountSelfUpdatePayload,
  AccountType,
  AdminAccountUpsertPayload,
  AuthLoginPayload,
  DepositInvoiceInput,
  Env,
  QuizLeadPayload,
} from './types';

const QUIZ_LEAD_ROUTE = '/quiz-lead';
const DEPOSIT_INVOICE_ROUTE = '/create-deposit-invoice';
const BALANCE_INVOICE_ROUTE = '/create-balance-invoice';
const STRIPE_WEBHOOK_ROUTE = '/stripe-webhook';
const REVIEW_GATEWAY_ROUTE = '/avis';
const LEADS_ROUTE = '/leads';
const UPLOAD_IMAGE_ROUTE = '/upload-image';
const LIST_MEDIA_ROUTE = '/list-media';
const DELETE_MEDIA_ROUTE = '/delete-media';
const MEDIA_ROUTE_PREFIX = '/media/';
const AUTH_LOGIN_ROUTE = '/auth-login';
const ACCOUNT_UPDATE_ROUTE = '/account-update';
const ACCOUNTS_ROUTE = '/accounts';

/**
 * Détermine l'en-tête Access-Control-Allow-Origin à renvoyer : on échoue
 * fermé (pas de wildcard "*") en ne reflétant que les origines listées dans
 * ALLOWED_ORIGINS (séparées par des virgules dans wrangler.toml).
 */
function resolveAllowedOrigin(requestOrigin: string | null, allowedOrigins: string): string {
  const allowed = allowedOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  if (requestOrigin && allowed.includes(requestOrigin)) return requestOrigin;
  return allowed[0] ?? '';
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

/** Garde de type stricte : valide la forme du payload reçu pour la facture d'acompte. */
function isValidDepositInvoiceInput(body: unknown): body is DepositInvoiceInput {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.email === 'string' && b.email.includes('@') &&
    typeof b.totalAmountEur === 'number' && Number.isFinite(b.totalAmountEur) && b.totalAmountEur > 0 &&
    typeof b.description === 'string' && b.description.trim().length > 0
  );
}

/** Garde de type stricte : valide la forme du payload reçu avant tout appel Stripe. */
function isValidQuizLeadPayload(body: unknown): body is QuizLeadPayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.name === 'string' && b.name.trim().length > 0 &&
    typeof b.email === 'string' && b.email.includes('@') &&
    typeof b.project === 'string' &&
    typeof b.category === 'string' &&
    typeof b.profile === 'string' &&
    typeof b.formule === 'string' &&
    typeof b.budgetEstime === 'string' &&
    (b.budgetMontantEur === undefined || (typeof b.budgetMontantEur === 'number' && Number.isFinite(b.budgetMontantEur))) &&
    (b.phone === undefined || typeof b.phone === 'string') &&
    (b.delaiSouhaite === undefined || typeof b.delaiSouhaite === 'string') &&
    (b.optionsChoisies === undefined || typeof b.optionsChoisies === 'string') &&
    (b.villePrestation === undefined || typeof b.villePrestation === 'string') &&
    (b.fraisDeplacementEur === undefined || (typeof b.fraisDeplacementEur === 'number' && Number.isFinite(b.fraisDeplacementEur))) &&
    (b.deplacementType === undefined || typeof b.deplacementType === 'string') &&
    (b.interetCommunication === undefined || typeof b.interetCommunication === 'boolean') &&
    (b.lang === undefined || typeof b.lang === 'string')
  );
}

function isValidAccountType(value: unknown): value is AccountType {
  return value === 'client' || value === 'partner';
}

function isValidAuthLoginPayload(body: unknown): body is AuthLoginPayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isValidAccountType(b.type) &&
    typeof b.email === 'string' && b.email.includes('@') &&
    typeof b.code === 'string' && b.code.trim().length > 0
  );
}

/**
 * Validation légère des moodboards — le client (pas seulement l'admin) écrit
 * ce champ via /account-update, donc contrairement à commandes/paiements/
 * factures (simples Array.isArray, remplis uniquement par l'admin) on vérifie
 * ici la forme minimale de chaque entrée pour éviter d'écrire n'importe quoi
 * en base depuis le front.
 */
function isValidMoodboardArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((m) => {
    if (typeof m !== 'object' || m === null) return false;
    const mb = m as Record<string, unknown>;
    return (
      typeof mb.id === 'string' && mb.id.length > 0 &&
      typeof mb.titre === 'string' &&
      typeof mb.statut === 'string' &&
      typeof mb.creeLe === 'string' &&
      typeof mb.majLe === 'string' &&
      (mb.commandeRef === undefined || typeof mb.commandeRef === 'string') &&
      (mb.typeProjet === undefined || typeof mb.typeProjet === 'string') &&
      (mb.direction === undefined || typeof mb.direction === 'string') &&
      (mb.ambiance === undefined || Array.isArray(mb.ambiance)) &&
      (mb.palette === undefined || typeof mb.palette === 'string') &&
      (mb.pinterestUrl === undefined || typeof mb.pinterestUrl === 'string') &&
      (mb.references === undefined || Array.isArray(mb.references)) &&
      (mb.produits === undefined || Array.isArray(mb.produits)) &&
      (mb.collaborateurs === undefined || Array.isArray(mb.collaborateurs)) &&
      (mb.notes === undefined || typeof mb.notes === 'string') &&
      (mb.commentaires === undefined || Array.isArray(mb.commentaires))
    );
  });
}

/** Doit rester aligné sur PARTNER_PROVIDER_TYPES dans js/script.js. */
const PROVIDER_TYPE_IDS = new Set([
  'coiffeur', 'maquilleur', 'coach-image', 'bien-etre', 'studio-lieu',
  'createur-mode', 'agence-mannequin', 'styliste', 'maquilleur-mode', 'bijoutier',
  'marque-produit', 'cosmetique', 'artisan-art', 'restaurateur', 'agence-com',
  'event-planner', 'lieu', 'traiteur', 'decorateur', 'animation',
  'wedding-planner', 'lieu-mariage', 'fleuriste-mariage', 'robe-mariee', 'traiteur-mariage',
]);

function isValidSelfPartenariat(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.typePrestataire === undefined || (typeof v.typePrestataire === 'string' && PROVIDER_TYPE_IDS.has(v.typePrestataire))) &&
    (v.disponibleCollab === undefined || typeof v.disponibleCollab === 'boolean') &&
    (v.visibleInDirectory === undefined || typeof v.visibleInDirectory === 'boolean') &&
    (v.presentation === undefined || (typeof v.presentation === 'string' && v.presentation.length <= 600))
  );
}

function isValidSelfReseau(value: unknown): boolean {
  if (!Array.isArray(value) || value.length > 100) return false;
  return value.every((c) => {
    if (typeof c !== 'object' || c === null) return false;
    const x = c as Record<string, unknown>;
    return (
      typeof x.id === 'string' && x.id.length > 0 &&
      typeof x.nom === 'string' && x.nom.trim().length > 0 && x.nom.length <= 120 &&
      ['domaine', 'role', 'contact', 'lien', 'note'].every((k) => x[k] === undefined || (typeof x[k] === 'string' && (x[k] as string).length <= 300))
    );
  });
}

function isValidCollaborationReponses(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  return value.every((r) => {
    if (typeof r !== 'object' || r === null) return false;
    const x = r as Record<string, unknown>;
    return typeof x.id === 'string' && (x.statut === 'Acceptée' || x.statut === 'Déclinée');
  });
}

function isValidBillingShape(v: unknown): boolean {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  const s = (x: unknown): boolean => x === undefined || (typeof x === 'string' && x.length <= 200);
  return (f.profil === 'particulier' || f.profil === 'professionnel') && s(f.contact) && s(f.rue) && s(f.codePostal) && s(f.ville) && s(f.pays) && s(f.siret) && s(f.tvaIntra) && s(f.forme);
}

function isValidAccountSelfUpdatePayload(body: unknown): body is AccountSelfUpdatePayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isValidAccountType(b.type) &&
    typeof b.email === 'string' && b.email.includes('@') &&
    typeof b.code === 'string' && b.code.trim().length > 0 &&
    (b.nom === undefined || typeof b.nom === 'string') &&
    (b.telephone === undefined || typeof b.telephone === 'string') &&
    (b.adresse === undefined || typeof b.adresse === 'string') &&
    (b.facturation === undefined || isValidBillingShape(b.facturation)) &&
    (b.moodboards === undefined || isValidMoodboardArray(b.moodboards)) &&
    (b.partenariat === undefined || isValidSelfPartenariat(b.partenariat)) &&
    (b.reseau === undefined || isValidSelfReseau(b.reseau)) &&
    (b.collaborationReponses === undefined || isValidCollaborationReponses(b.collaborationReponses))
  );
}

function isValidAdminAccountUpsertPayload(body: unknown): body is AdminAccountUpsertPayload {
  if (typeof body !== 'object' || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    isValidAccountType(b.type) &&
    typeof b.email === 'string' && b.email.includes('@') &&
    (b.code === undefined || typeof b.code === 'string') &&
    (b.nom === undefined || typeof b.nom === 'string') &&
    (b.telephone === undefined || typeof b.telephone === 'string') &&
    (b.adresse === undefined || typeof b.adresse === 'string') &&
    (b.etapeActuelle === undefined || typeof b.etapeActuelle === 'number') &&
    (b.lightroomUrl === undefined || (typeof b.lightroomUrl === 'string' && b.lightroomUrl.length <= 600 && (b.lightroomUrl === '' || /^https:\/\/[^\s]+$/.test(b.lightroomUrl)))) &&
    (b.sendAccessMail === undefined || typeof b.sendAccessMail === 'boolean') &&
    (b.sendPhotosMail === undefined || typeof b.sendPhotosMail === 'boolean') &&
    (b.photosAcces === undefined || typeof b.photosAcces === 'boolean') &&
    (b.revokePhotos === undefined || typeof b.revokePhotos === 'boolean') &&
    (b.lang === undefined || b.lang === 'fr' || b.lang === 'en') &&
    (b.facturation === undefined || isValidBillingShape(b.facturation)) &&
    (b.seance === undefined || b.seance === null || (typeof b.seance === 'object' && typeof (b.seance as Record<string, unknown>).date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(String((b.seance as Record<string, unknown>).date)))) &&
    (b.sendSeanceMail === undefined || b.sendSeanceMail === 'confirmation' || b.sendSeanceMail === 'report' || b.sendSeanceMail === 'cancel') &&
    (b.motif === undefined || typeof b.motif === 'string') &&
    (b.commandes === undefined || Array.isArray(b.commandes)) &&
    (b.paiements === undefined || Array.isArray(b.paiements)) &&
    (b.factures === undefined || Array.isArray(b.factures)) &&
    (b.abonnement === undefined || b.abonnement === null || typeof b.abonnement === 'object') &&
    (b.moodboards === undefined || isValidMoodboardArray(b.moodboards)) &&
    (b.partenariat === undefined || b.partenariat === null || typeof b.partenariat === 'object') &&
    (b.promotions === undefined || Array.isArray(b.promotions)) &&
    (b.reseau === undefined || Array.isArray(b.reseau)) &&
    (b.collaborations === undefined || Array.isArray(b.collaborations))
  );
}

/**
 * Connexion espace client/partenaire. Remplace l'ancien comptes.json servi
 * publiquement : la base de comptes (ACCOUNTS_KV) n'est accessible que via
 * ce Worker, jamais directement. Erreur volontairement générique (pas de
 * distinction email inconnu / code incorrect) pour ne pas permettre
 * l'énumération des emails enregistrés.
 */
async function handleAuthLogin(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
  }
  if (!isValidAuthLoginPayload(body)) {
    return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
  }

  const account = await verifyLogin(env, body.type, body.email, body.code);
  if (!account) {
    return jsonResponse({ ok: false, error: 'invalid_credentials' }, 401, headers);
  }
  return jsonResponse({ ok: true, account: sanitizeAccount(account) }, 200, headers);
}

/**
 * Mise à jour "Mes informations" par le client lui-même — ré-authentifie
 * avec son code d'accès actuel à chaque appel (pas de session persistée),
 * puis écrase uniquement nom/téléphone/adresse. Email et type de compte ne
 * sont volontairement pas modifiables ici : ce sont les clés d'identité du
 * compte (changer l'email reviendrait à en créer un autre).
 */
async function handleAccountUpdate(request: Request, env: Env, headers: Record<string, string>, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
  }
  if (!isValidAccountSelfUpdatePayload(body)) {
    return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
  }

  const account = await verifyLogin(env, body.type, body.email, body.code);
  if (!account) {
    return jsonResponse({ ok: false, error: 'invalid_credentials' }, 401, headers);
  }

  const isPartner = account.type === 'partner';
  const ownContacts = (body.reseau ?? []).map((c) => ({
    id: c.id, nom: c.nom.trim(), domaine: c.domaine, role: c.role, contact: c.contact, lien: c.lien, note: c.note,
    origine: 'partenaire' as const,
  }));
  const reseau = isPartner && body.reseau
    ? [...(account.reseau ?? []).filter((c) => c.origine === 'bunkaio'), ...ownContacts]
    : account.reseau;
  const collaborations = isPartner && body.collaborationReponses
    ? (account.collaborations ?? []).map((c) => {
        const r = body.collaborationReponses!.find((x) => x.id === c.id);
        return r && c.statut === 'Proposée' ? { ...c, statut: r.statut } : c;
      })
    : account.collaborations;
  // Liste blanche : un partenaire ne peut pas s'attribuer statut, date d'adhésion, article, etc.
  const selfPartenariat = body.partenariat
    ? Object.fromEntries(
        (['typePrestataire', 'disponibleCollab', 'visibleInDirectory', 'presentation'] as const)
          .filter((k) => body.partenariat![k] !== undefined)
          .map((k) => [k, body.partenariat![k]]),
      )
    : undefined;
  const partenariat = isPartner && selfPartenariat
    ? { ...account.partenariat, ...selfPartenariat }
    : account.partenariat;

  const nom = body.nom ?? account.nom;
  const telephone = body.telephone ?? account.telephone;
  const facturation = body.facturation ? cleanBilling(body.type, body.facturation) : account.facturation;
  // Le formulaire d'informations envoie toujours les coordonnées de facturation : elles doivent être complètes.
  if (body.facturation) {
    const missing = billingErrors(body.type, nom, telephone, facturation);
    if (missing.length) return jsonResponse({ ok: false, error: 'incomplete_info', fields: missing }, 400, headers);
  }

  const updated = {
    ...account,
    reseau,
    collaborations,
    partenariat,
    nom,
    telephone,
    facturation,
    adresse: body.facturation && facturation ? composeAddress(facturation) : body.adresse ?? account.adresse,
    moodboards: body.moodboards ?? account.moodboards,
  };
  const entries = diffAccountActivity(account, updated, new Date().toISOString());
  const withJournal = appendJournal(updated, entries);
  await putAccount(env, withJournal);
  // File d'attente de l'email récapitulatif : un échec ne doit jamais faire échouer l'enregistrement du client.
  if (entries.length) ctx.waitUntil(queueActivityNotification(env, withJournal, entries).catch((err) => console.error('[activity] mise en file impossible', err)));
  if (body.facturation) ctx.waitUntil(syncCustomerBilling(createStripeClient(env.STRIPE_SECRET_KEY), withJournal).catch((err) => console.error('[account-update] synchro Stripe', err)));
  console.log('[account-update] informations mises à jour', { type: body.type, email: body.email, changes: entries.length });
  return jsonResponse({ ok: true, account: sanitizeAccount(withJournal) }, 200, headers);
}

/**
 * Gestion des comptes côté admin (protégée par ADMIN_TOKEN, même garde que
 * les autres routes admin). GET liste tous les comptes (résumé léger), ou
 * un seul compte en détail avec ?type=&email=. POST crée ou met à jour un
 * compte — voir upsertAccountFromAdmin().
 */
async function handleAdminAccounts(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const email = url.searchParams.get('email');
    if (type && email) {
      if (!isValidAccountType(type)) {
        return jsonResponse({ ok: false, error: 'invalid_type' }, 400, headers);
      }
      const account = await getAccount(env, type, email);
      if (!account) {
        return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
      }
      return jsonResponse({ ok: true, account: adminAccountView(account) }, 200, headers);
    }
    const accounts = await listAccounts(env);
    return jsonResponse({ ok: true, accounts }, 200, headers);
  }

  if (request.method === 'POST') {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
    }
    if (!isValidAdminAccountUpsertPayload(body)) {
      return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    }
    try {
      const account = await upsertAccountFromAdmin(env, body);
      if (body.facturation) await syncCustomerBilling(createStripeClient(env.STRIPE_SECRET_KEY), account).catch((err) => console.error('[accounts] synchro Stripe', err));
      if (body.revokePhotos && account.photosAcces) {
        account.photosAcces = false;
        await putAccount(env, account);
        console.log('[accounts] accès aux photos retiré par l\'admin', { email: account.email });
      }
      console.log('[accounts] compte créé/mis à jour par l\'admin', { type: account.type, email: account.email });
      const lang = normalizeLang(body.lang);
      const emails: { access?: boolean; photos?: boolean | string; seance?: boolean | string; sms?: string } = {};
      if (body.sendAccessMail && body.code) {
        try {
          const m = buildAccessCodeEmail({ customerName: account.nom ?? '', email: account.email, code: body.code, space: account.type, lang });
          await sendEmail(env, account.email, m.subject, m.html, m.text);
          emails.access = true;
        } catch (err) {
          console.error("[accounts] échec email d'accès", err);
          emails.access = false;
        }
      } else if (body.sendAccessMail) {
        emails.access = false; // le code n'est connu qu'à la saisie : impossible de l'envoyer sans le retaper
      }
      if (body.sendPhotosMail) {
        if (account.lightroomUrl && !account.photosAcces) {
          account.photosAcces = true;
          await putAccount(env, account);
        }
        if (!account.lightroomUrl) {
          emails.photos = 'no_lightroom_url';
        } else {
          try {
            const m = buildPhotosReadyEmail({ customerName: account.nom ?? '', lightroomUrl: account.lightroomUrl, space: account.type, lang, reviewUrl: env.GOOGLE_REVIEW_URL });
            const first = (account.nom ?? '').trim().split(/\s+/)[0] ?? '';
            const smsP = autoSms(env, 'access', { email: account.email, phone: account.telephone, ref: `${account.email}:manuel:${Date.now()}`, text: `BUNKAIO : Bonjour${first ? ' ' + first : ''}, vos photos sont disponibles ! Votre album : ${account.lightroomUrl}` });
            await Promise.all([sendEmail(env, account.email, m.subject, m.html, m.text), smsP]);
            emails.photos = true;
            emails.sms = await smsP;
          } catch (err) {
            console.error('[accounts] échec email photos prêtes', err);
            emails.photos = false;
          }
        }
      }
      if (body.sendSeanceMail) {
        if (!account.seance) {
          emails.seance = 'no_seance';
        } else {
          try {
            if (body.sendSeanceMail === 'cancel') {
              account.seance = { ...account.seance, statut: 'annulee' };
              await putAccount(env, account);
            }
            const m = buildSeanceEmail({ kind: body.sendSeanceMail, customerName: account.nom ?? '', seance: account.seance, motif: body.motif, space: account.type, lang });
            await sendEmail(env, account.email, m.subject, m.html, m.text);
            emails.seance = true;
          } catch (err) {
            console.error('[accounts] échec email de séance', err);
            emails.seance = false;
          }
        }
      }
      return jsonResponse({ ok: true, account: sanitizeAccount(account), emails }, 200, headers);
    } catch (err) {
      if (err instanceof Error && err.message === 'code_required_for_new_account') {
        return jsonResponse({ ok: false, error: 'code_required_for_new_account' }, 400, headers);
      }
      console.error('[accounts] échec création/mise à jour', err);
      return jsonResponse({ ok: false, error: 'kv_error' }, 502, headers);
    }
  }

  return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
}

/** Un compte partenaire existe pour cet email → les mails parlent de l'espace partenaire, sinon espace client. */
async function detectSpace(env: Env, email: string): Promise<'client' | 'partner'> {
  try {
    return (await getAccount(env, 'partner', email)) ? 'partner' : 'client';
  } catch {
    return 'client';
  }
}

/** Accusé de réception des formulaires du site (public, limité à 1 envoi/heure par adresse et par type). */
async function handleAck(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
  }
  const kind = body.kind;
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!MESSAGE_KINDS.includes(kind as MessageKind) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
  }
  // Le message est conservé pour le tableau de bord admin (rubrique Messages), même sans accusé de réception.
  try {
    await storeMessage(env, { kind: kind as MessageKind, name, email: email.toLowerCase(), lang: normalizeLang(body.lang), details: cleanDetails(body.details) });
    const labels: Record<string, string> = { contact: 'Message de contact', collab: 'Proposition de collaboration', partner: 'Candidature partenaire', account: "Demande d'espace", share: 'Témoignage' };
    await notifyAdmin(env, { title: labels[kind as string] ?? 'Nouveau message', body: name || email, url: '/admin/#messages' });
  } catch (err) {
    console.error('[ack] message non enregistré', err);
  }
  // Les témoignages n'ont pas d'accusé de réception.
  if (kind === 'share') return jsonResponse({ ok: true }, 200, headers);
  if (!(await claimAckSlot(env, kind as string, email))) return jsonResponse({ ok: true, skipped: true }, 200, headers);
  try {
    const m = buildAcknowledgementEmail({ kind: kind as 'contact' | 'collab' | 'partner' | 'account', customerName: name, space: body.space === 'partner' ? 'partner' : 'client', lang: normalizeLang(body.lang) });
    await sendEmail(env, email, m.subject, m.html, m.text);
    return jsonResponse({ ok: true }, 200, headers);
  } catch (err) {
    console.error('[ack] échec envoi', err);
    return jsonResponse({ ok: false, error: 'email_error' }, 502, headers);
  }
}

/** Séance planifiée (non annulée) dans le compte du client, s'il existe déjà. */
async function findSeance(env: Env, email: string): Promise<{ date: string; heure?: string; lieu?: string; prestation?: string } | undefined> {
  try {
    const account = (await getAccount(env, 'client', email)) ?? (await getAccount(env, 'partner', email));
    return account?.seance && account.seance.statut !== 'annulee' ? account.seance : undefined;
  } catch {
    return undefined;
  }
}

/** Vrai si aucun lien Lightroom n'est saisi dans le compte du client : à la réception du solde il n'aurait pas son accès. */
/** Vrai si le client n'a pas de compte validé (coordonnées de facturation incomplètes) au moment d'émettre une facture. */
async function infosIncomplete(env: Env, email: string): Promise<boolean> {
  try {
    const account = (await getAccount(env, 'client', email)) ?? (await getAccount(env, 'partner', email));
    return !account?.infosCompletes;
  } catch {
    return true;
  }
}

async function lightroomMissing(env: Env, email: string): Promise<boolean> {
  try {
    const account = (await getAccount(env, 'client', email)) ?? (await getAccount(env, 'partner', email));
    return !account?.lightroomUrl;
  } catch {
    return true;
  }
}

/** Tableau de bord admin : base de contacts fusionnée + factures (lecture seule), et lancement manuel des automatisations. */
async function handleAdminDashboard(request: Request, env: Env, headers: Record<string, string>, path: string): Promise<Response> {
  if ((request.headers.get('Authorization') ?? '') !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }
  if (path === '/admin/dashboard' && request.method === 'GET') {
    try {
      return jsonResponse(await buildDashboard(env, createStripeClient(env.STRIPE_SECRET_KEY)), 200, headers);
    } catch (err) {
      console.error('[admin] tableau de bord indisponible', err);
      return jsonResponse({ ok: false, error: 'dashboard_error' }, 502, headers);
    }
  }
  if (path === '/admin/run-automations' && request.method === 'POST') {
    // Mêmes tâches que le cron quotidien ; chacune est idempotente (marqueurs), donc sans risque de doublon.
    await runDailyAutomations(env);
    try {
      await sendOverdueInvoiceReminders(env);
    } catch (err) {
      console.error('[admin] relances de factures en échec', err);
    }
    return jsonResponse({ ok: true, ranAt: new Date().toISOString() }, 200, headers);
  }
  if (path === '/admin/message' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown; status?: unknown; remove?: unknown };
    if (typeof body.id !== 'string' || (body.status !== undefined && body.status !== 'nouveau' && body.status !== 'traite')) {
      return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    }
    const ok = await updateMessage(env, body.id, { status: body.status as 'nouveau' | 'traite' | undefined, remove: body.remove === true });
    return jsonResponse({ ok }, ok ? 200 : 404, headers);
  }
  if (path === '/admin/delete' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown; type?: unknown; purge?: unknown };
    if (typeof body.email !== 'string' || !body.email.includes('@') || (body.type !== undefined && !isValidAccountType(body.type))) {
      return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    }
    try {
      const summary = await deleteContact(env, createStripeClient(env.STRIPE_SECRET_KEY), body.email, body.type as AccountType | undefined, body.purge === true);
      console.log('[admin] suppression', summary);
      return jsonResponse({ ok: true, summary }, 200, headers);
    } catch (err) {
      console.error('[admin] suppression en échec', err);
      return jsonResponse({ ok: false, error: 'delete_error' }, 502, headers);
    }
  }
  if (path === '/admin/extra' && request.method === 'GET') {
    const email = (new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase();
    if (!email.includes('@')) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    return jsonResponse({ ok: true, mails: (await getMailLog(env, email)).reverse(), note: (await env.ACCOUNTS_KV.get(`note:${email}`)) ?? '', unsub: await isUnsubscribed(env, email) }, 200, headers);
  }
  if (path === '/admin/invoices-delete' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { ids?: unknown };
    if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 50 || !body.ids.every((x) => typeof x === 'string' && /^in_[A-Za-z0-9]+$/.test(x))) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const results: Array<Record<string, unknown>> = [];
    for (const id of body.ids as string[]) {
      try { results.push(await removeInvoice(env, stripe, id)); } catch (err) { results.push({ id, action: 'erreur', detail: err instanceof Error ? err.message.slice(0, 140) : 'erreur' }); }
    }
    console.log('[admin] suppression de factures', results);
    return jsonResponse({ ok: true, results }, 200, headers);
  }
  if (path === '/admin/tags' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown; tags?: unknown; names?: unknown };
    if (typeof body.names === 'object' && body.names !== null) { await setTagNames(env, body.names as Record<string, unknown>); return jsonResponse({ ok: true }, 200, headers); }
    if (typeof body.email !== 'string' || !body.email.includes('@') || !Array.isArray(body.tags)) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    return jsonResponse({ ok: true, tags: await setContactTags(env, body.email, body.tags.filter((x): x is string => typeof x === 'string')) }, 200, headers);
  }
  if (path === '/admin/sms' && request.method === 'GET') {
    return jsonResponse({ ok: true, provider: smsProvider(env), settings: await getSmsSettings(env) }, 200, headers);
  }
  if (path === '/admin/sms/settings' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const pick = (k: string): boolean | undefined => (typeof body[k] === 'boolean' ? (body[k] as boolean) : undefined);
    return jsonResponse({ ok: true, settings: await setSmsSettings(env, { enabled: pick('enabled'), ready: pick('ready'), access: pick('access'), reminder: pick('reminder') }) }, 200, headers);
  }
  if (path === '/admin/sms/send' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { to?: unknown; text?: unknown; email?: unknown };
    if (typeof body.to !== 'string' || typeof body.text !== 'string' || !body.text.trim() || !toE164(body.to)) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    if (!smsProvider(env)) return jsonResponse({ ok: false, error: 'sms_not_configured' }, 400, headers);
    try {
      await sendSms(env, { to: body.to, text: body.text, email: typeof body.email === 'string' ? body.email : undefined, tpl: 'sms_manuel' });
      return jsonResponse({ ok: true }, 200, headers);
    } catch (err) {
      return jsonResponse({ ok: false, error: err instanceof Error ? err.message.slice(0, 160) : 'sms_error' }, 502, headers);
    }
  }
  if (path === '/admin/sms/optout' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown; value?: unknown };
    if (typeof body.email !== 'string' || !body.email.includes('@') || typeof body.value !== 'boolean') return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    const key = `smsoff:${body.email.trim().toLowerCase()}`;
    if (body.value) await env.ACCOUNTS_KV.put(key, '1'); else await env.ACCOUNTS_KV.delete(key);
    return jsonResponse({ ok: true }, 200, headers);
  }
  if (path === '/admin/push/key' && request.method === 'GET') {
    return jsonResponse({ ok: true, publicKey: (await getVapid(env)).publicKey }, 200, headers);
  }
  if (path === '/admin/push/subscribe' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { subscription?: { endpoint?: unknown }; unsubscribe?: unknown };
    if (!body.subscription) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    if (body.unsubscribe === true && typeof body.subscription.endpoint === 'string') { await removeSubscription(env, body.subscription.endpoint); return jsonResponse({ ok: true }, 200, headers); }
    return jsonResponse({ ok: await saveSubscription(env, body.subscription) }, 200, headers);
  }
  if (path === '/admin/push/last' && request.method === 'GET') {
    return jsonResponse({ ok: true, event: await getLastPush(env) }, 200, headers);
  }
  if (path === '/admin/push/test' && request.method === 'POST') {
    await notifyAdmin(env, { title: 'BUNKAIO ⊹', body: 'Les notifications fonctionnent sur cet appareil.', url: '/admin/' });
    return jsonResponse({ ok: true }, 200, headers);
  }
  if (path === '/admin/inbox/sync' && request.method === 'POST') {
    try {
      return jsonResponse({ ok: true, ...(await syncResendInbox(env)) }, 200, headers);
    } catch (err) {
      console.error('[inbox] relève impossible', err);
      return jsonResponse({ ok: false, error: err instanceof Error ? err.message : 'sync_error' }, 502, headers);
    }
  }
  if (path === '/admin/inbox/message' && request.method === 'GET') {
    const msg = await getInboxMessage(env, new URL(request.url).searchParams.get('id') ?? '');
    if (!msg) return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
    return jsonResponse({ ok: true, message: msg }, 200, headers);
  }
  if (path === '/admin/inbox/update' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown; read?: unknown; starred?: unknown; pinned?: unknown; labels?: unknown; archived?: unknown; spam?: unknown; note?: unknown; remove?: unknown };
    if (typeof body.id !== 'string') return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    const ok = await updateInbox(env, body.id, {
      spam: typeof body.spam === 'boolean' ? body.spam : undefined,
      read: typeof body.read === 'boolean' ? body.read : undefined,
      starred: typeof body.starred === 'boolean' ? body.starred : undefined,
      pinned: typeof body.pinned === 'boolean' ? body.pinned : undefined,
      labels: Array.isArray(body.labels) ? body.labels.filter((x): x is string => typeof x === 'string') : undefined,
      archived: typeof body.archived === 'boolean' ? body.archived : undefined,
      note: typeof body.note === 'string' ? body.note : undefined,
      remove: body.remove === true,
    });
    return jsonResponse({ ok }, ok ? 200 : 404, headers);
  }
  if (path === '/admin/inbox/labels' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { names?: unknown };
    if (typeof body.names !== 'object' || body.names === null) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    await setLabelNames(env, body.names as Record<string, unknown>);
    return jsonResponse({ ok: true }, 200, headers);
  }
  if (path === '/admin/inbox/spam-rules' && request.method === 'GET') {
    return jsonResponse({ ok: true, rules: await getSpamRules(env) }, 200, headers);
  }
  if (path === '/admin/inbox/spam-rules' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { senders?: unknown; keywords?: unknown; rescan?: unknown };
    const rules = await setSpamRules(env, { senders: body.senders, keywords: body.keywords });
    const scan = body.rescan === true ? await rescanSpam(env) : null;
    return jsonResponse({ ok: true, rules, scan }, 200, headers);
  }
  if (path === '/admin/inbox/reply' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { id?: unknown; body?: unknown; subject?: unknown; preview?: unknown };
    if (typeof body.id !== 'string' || typeof body.body !== 'string' || !body.body.trim()) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    try {
      if (body.preview === true) return jsonResponse({ ok: true, ...(await previewReply(env, body.id, body.body, typeof body.subject === 'string' ? body.subject : undefined)) }, 200, headers);
      await replyTo(env, body.id, body.body, typeof body.subject === 'string' ? body.subject : undefined);
      return jsonResponse({ ok: true }, 200, headers);
    } catch (err) {
      console.error('[inbox] réponse non envoyée', err);
      return jsonResponse({ ok: false, error: err instanceof Error && err.message === 'not_found' ? 'not_found' : 'send_error' }, 502, headers);
    }
  }
  if (path === '/admin/note' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown; note?: unknown };
    if (typeof body.email !== 'string' || !body.email.includes('@') || typeof body.note !== 'string') return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    const key = `note:${body.email.trim().toLowerCase()}`;
    if (body.note.trim()) await env.ACCOUNTS_KV.put(key, body.note.trim().slice(0, 4000)); else await env.ACCOUNTS_KV.delete(key);
    return jsonResponse({ ok: true }, 200, headers);
  }
  if (path === '/admin/unsub' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { email?: unknown; value?: unknown };
    if (typeof body.email !== 'string' || !body.email.includes('@') || typeof body.value !== 'boolean') return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    await setUnsubscribed(env, body.email, body.value);
    return jsonResponse({ ok: true }, 200, headers);
  }
  if (path === '/admin/campaigns' && request.method === 'GET') {
    return jsonResponse({ ok: true, campaigns: await listCampaigns(env) }, 200, headers);
  }
  if (path === '/admin/mailing' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { action?: unknown; template?: unknown; params?: unknown; recipients?: unknown };
    const template = body.template as ManualTemplate;
    if (!MANUAL_TEMPLATES.includes(template) || !Array.isArray(body.recipients) || !body.recipients.length) return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
    const recipients = body.recipients as RecipientCtx[];
    const params = (body.params ?? {}) as MailingParams;
    if (body.action === 'preview') {
      const mail = await buildManualMail(env, template, recipients[0]!, params);
      if ('skip' in mail) return jsonResponse({ ok: true, skip: mail.skip }, 200, headers);
      return jsonResponse({ ok: true, subject: mail.subject, html: mail.html }, 200, headers);
    }
    if (body.action === 'test') {
      const to = env.ADMIN_NOTIFICATION_EMAIL;
      const mail = await buildManualMail(env, template, { ...recipients[0]!, email: to }, params);
      if ('skip' in mail) return jsonResponse({ ok: false, error: mail.skip }, 400, headers);
      try { await sendEmail(env, to, `[TEST] ${mail.subject}`, mail.html, mail.text); } catch (err) { return jsonResponse({ ok: false, error: 'send_error' }, 502, headers); }
      return jsonResponse({ ok: true, to }, 200, headers);
    }
    if (body.action === 'send') {
      const results = await sendMailing(env, template, recipients, params);
      const sent = results.filter((x) => x.status === 'envoye').length;
      await saveCampaign(env, { template, subject: params.subject ?? '', recipients: results.length, sent, ignored: results.filter((x) => x.status === 'ignore').length, failed: results.filter((x) => x.status === 'erreur').length }).catch(() => undefined);
      return jsonResponse({ ok: true, results }, 200, headers);
    }
    return jsonResponse({ ok: false, error: 'unknown_action' }, 400, headers);
  }
  if (path === '/admin/quote' && request.method === 'POST') {
    return handleAdminQuote(request, env, headers);
  }
  return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
}

const SIGN_URL = (q: Quote): string => `https://bunkaio.com/signature/?d=${q.id}&k=${q.token}`;

/** Crée et envoie la facture d'acompte d'un devis signé (fiche Stripe créée si besoin). */
async function depositForQuote(env: Env, q: Quote): Promise<void> {
  const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
  await ensureCustomer(stripe, { email: q.email, name: q.client.nom, lang: q.lang, phone: q.client.telephone });
  const result = await createDepositInvoice(stripe, { email: q.email, totalAmountEur: q.totalHT, description: `Devis n° ${q.number} — ${q.prestation}` });
  await markInvoiced(env, q.email).catch(() => undefined);
  q.depositInvoice = { id: result.invoiceId, url: result.hostedInvoiceUrl, amount: result.depositAmountEur };
  const m = buildDepositInvoiceEmail({ customerName: q.client.contact || q.client.nom, description: `${q.prestation} (devis n° ${q.number})`, depositAmountEur: result.depositAmountEur, hostedInvoiceUrl: result.hostedInvoiceUrl, lang: q.lang, space: await detectSpace(env, q.email) });
  await sendEmail(env, q.email, m.subject, m.html, m.text);
}

/** Actions admin sur les devis : enregistrer, envoyer, renvoyer, marquer signé, acompte, annuler, dupliquer, supprimer. */
async function handleAdminQuote(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = body.action;
  const reply = (q: Quote | null, status = 200, extra: Record<string, unknown> = {}): Response => jsonResponse({ ok: status < 300, quote: q, ...extra }, status, headers);
  if (action === 'save') {
    const data = cleanQuoteInput((body.quote ?? {}) as Record<string, unknown>);
    if (!data) return jsonResponse({ ok: false, error: 'invalid_quote' }, 400, headers);
    if (typeof body.id === 'string' && body.id) {
      const q = await getQuote(env, body.id);
      if (!q) return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
      if (q.status !== 'brouillon') return jsonResponse({ ok: false, error: 'not_editable' }, 409, headers);
      const merged = { ...q, ...data } as Quote;
      await putQuote(env, merged);
      return reply(merged);
    }
    return reply(await createQuote(env, data));
  }
  const q = typeof body.id === 'string' ? await getQuote(env, body.id) : null;
  if (!q) return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);

  if (action === 'send' || action === 'resend') {
    if (action === 'send') {
      if (q.status !== 'brouillon') return jsonResponse({ ok: false, error: 'not_draft' }, 409, headers);
      const missing = missingQuoteFields(q);
      if (missing.length) return jsonResponse({ ok: false, error: 'incomplete', fields: missing }, 400, headers);
      await prepareSend(q);
      await putQuote(env, q);
      await env.ACCOUNTS_KV.put(`qsent:${q.email}`, q.id, { expirationTtl: 120 * 86400 });
    } else if (q.status !== 'envoye') {
      return jsonResponse({ ok: false, error: 'not_sent' }, 409, headers);
    }
    try {
      const m = buildQuoteEmail({ customerName: q.client.contact || q.client.nom, number: q.number, prestation: q.prestation, totalHT: q.totalHT, validUntil: q.validUntil, url: SIGN_URL(q), abonnement: q.abonnement, lang: q.lang, space: await detectSpace(env, q.email) });
      await sendEmail(env, q.email, m.subject, m.html, m.text);
      return reply(q, 200, { emailSent: true, url: SIGN_URL(q) });
    } catch (err) {
      console.error('[devis] email non envoyé', err);
      return reply(q, 200, { emailSent: false, url: SIGN_URL(q) });
    }
  }
  if (action === 'mark-signed') {
    if (q.status !== 'envoye' && q.status !== 'brouillon') return jsonResponse({ ok: false, error: 'not_signable' }, 409, headers);
    if (!q.contentHash) q.contentHash = await quoteHash(q);
    const at = new Date().toISOString();
    q.status = 'signe';
    q.signedAt = at;
    q.signedVia = body.via === 'yousign' ? 'yousign' : 'manuel';
    q.signature = { name: q.client.contact || q.client.nom, at, ip: '', ua: '', portfolio: body.portfolio === true, retractationWaiver: body.retractationWaiver === true, hash: q.contentHash };
    await putQuote(env, q);
    if (body.createDeposit === true && !q.abonnement) {
      try { await depositForQuote(env, q); await putQuote(env, q); }
      catch (err) { console.error('[devis] acompte non créé', err); return reply(q, 200, { depositError: true }); }
    }
    return reply(q);
  }
  if (action === 'create-deposit') {
    if (q.status !== 'signe' || q.depositInvoice || q.abonnement) return jsonResponse({ ok: false, error: 'not_applicable' }, 409, headers);
    try { await depositForQuote(env, q); await putQuote(env, q); return reply(q); }
    catch (err) { console.error('[devis] acompte non créé', err); return jsonResponse({ ok: false, error: 'stripe_error' }, 502, headers); }
  }
  if (action === 'cancel' || action === 'refuse') {
    if (q.status === 'signe') return jsonResponse({ ok: false, error: 'already_signed' }, 409, headers);
    q.status = action === 'cancel' ? 'annule' : 'refuse';
    q.closedAt = new Date().toISOString();
    await putQuote(env, q);
    return reply(q);
  }
  if (action === 'duplicate') {
    const { id: _i, number: _n, token: _t, status: _s, createdAt: _c, updatedAt: _u, sentAt: _se, viewedAt: _v, signedAt: _si, closedAt: _cl, contentHash: _h, signature: _sg, signedVia: _sv, depositInvoice: _d, reminderSentAt: _r, ...content } = q;
    const copy = await createQuote(env, { ...content, validUntil: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) });
    return reply(copy);
  }
  if (action === 'delete') {
    if (q.status !== 'brouillon' && q.status !== 'annule') return jsonResponse({ ok: false, error: 'not_deletable' }, 409, headers);
    await env.ACCOUNTS_KV.delete('quote:' + q.id);
    return jsonResponse({ ok: true }, 200, headers);
  }
  return jsonResponse({ ok: false, error: 'unknown_action' }, 400, headers);
}

/** Page publique de signature : lecture (GET /quote) et signature (POST /quote/sign). */
async function handlePublicQuote(request: Request, env: Env, headers: Record<string, string>, path: string): Promise<Response> {
  const url = new URL(request.url);
  if (path === '/quote' && request.method === 'GET') {
    const q = await getQuote(env, url.searchParams.get('d') ?? '');
    if (!q || !tokenMatches(q, url.searchParams.get('k'))) return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
    if (isExpired(q)) { q.status = 'expire'; await putQuote(env, q); }
    if (!q.viewedAt && q.status === 'envoye') { q.viewedAt = new Date().toISOString(); await putQuote(env, q); }
    return jsonResponse({ ok: true, quote: publicQuote(q), business: { address: getBusinessAddress() } }, 200, headers);
  }
  if (path === '/quote/sign' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const q = await getQuote(env, typeof body.d === 'string' ? body.d : '');
    if (!q || !tokenMatches(q, body.k)) return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
    if (q.status === 'signe') return jsonResponse({ ok: true, quote: publicQuote(q), already: true }, 200, headers);
    if (isExpired(q)) { q.status = 'expire'; await putQuote(env, q); }
    if (q.status !== 'envoye') return jsonResponse({ ok: false, error: q.status }, 409, headers);
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    if (body.accept !== true || name.length < 3) return jsonResponse({ ok: false, error: 'invalid_signature' }, 400, headers);
    const hash = await quoteHash(q);
    if (hash !== q.contentHash) return jsonResponse({ ok: false, error: 'content_changed' }, 409, headers);
    const at = new Date().toISOString();
    q.status = 'signe';
    q.signedAt = at;
    q.signedVia = 'en_ligne';
    q.signature = { name, at, ip: request.headers.get('CF-Connecting-IP') ?? '', ua: (request.headers.get('User-Agent') ?? '').slice(0, 300), portfolio: body.portfolio === true, retractationWaiver: body.retractationWaiver === true, hash };
    await putQuote(env, q);

    let depositError = false;
    if (!q.abonnement) {
      try { await depositForQuote(env, q); await putQuote(env, q); }
      catch (err) { console.error('[devis] acompte non créé après signature', err); depositError = true; }
    }
    try {
      const m = buildQuoteSignedEmail({ customerName: q.client.contact || q.client.nom, number: q.number, url: SIGN_URL(q), depositAmount: q.depositInvoice?.amount, depositUrl: q.depositInvoice?.url, abonnement: q.abonnement, lang: q.lang, space: await detectSpace(env, q.email) });
      await sendEmail(env, q.email, m.subject, m.html, m.text);
    } catch (err) { console.error('[devis] confirmation non envoyée', err); }
    await notifyAdmin(env, { title: `Devis n° ${q.number} signé`, body: `${q.client.nom} · ${q.totalHT.toFixed(2)} €`, url: '/admin/#quotes' });
    try {
      const a = buildAdminAlertEmail({
        subject: `✍️ Devis n° ${q.number} signé — ${q.client.nom} (${q.totalHT.toFixed(2)} €)`,
        lines: [
          `Devis n° ${q.number} signé en ligne par ${name} le ${new Date(at).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}.`,
          `Client : ${q.client.nom} <${q.email}> — ${q.prestation}`,
          q.abonnement ? 'Abonnement : à mettre en place (pas de facture d\'acompte automatique).' : depositError ? '⚠ La facture d\'acompte n\'a pas pu être créée : créez-la depuis le tableau de bord (Devis → Créer l\'acompte).' : `Facture d'acompte de ${(q.depositInvoice?.amount ?? 0).toFixed(2)} € envoyée automatiquement.`,
          `Portfolio : ${q.signature.portfolio ? 'autorisé' : 'refusé'}${q.client.profil === 'particulier' ? ` · Exécution avant fin de rétractation : ${q.signature.retractationWaiver ? 'demandée' : 'non demandée'}` : ''}`,
        ],
      });
      await sendEmail(env, env.ADMIN_NOTIFICATION_EMAIL, a.subject, a.html, a.text);
    } catch (err) { console.error('[devis] alerte admin non envoyée', err); }
    return jsonResponse({ ok: true, quote: publicQuote(q), depositError }, 200, headers);
  }
  return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
}

async function handleQuizLead(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    console.error('[quiz-lead] corps de requête JSON invalide', err);
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
  }

  if (!isValidQuizLeadPayload(body)) {
    console.error('[quiz-lead] payload rejeté par la validation', body);
    return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
  }

  console.log('[quiz-lead] soumission reçue', {
    email: body.email,
    category: body.category,
    formule: body.formule,
  });

  // Toute erreur Stripe est interceptée ici : le front ignore déjà la
  // réponse de cet appel (fetch fire-and-forget), donc une erreur ici
  // n'impacte jamais l'expérience du visiteur — elle ne fait que manquer
  // la synchronisation Stripe, visible dans les logs ci-dessous.
  try {
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const result = await upsertQuizCustomer(stripe, body);
    await markLead(env, body.email, body.name, normalizeLang(body.lang)).catch((err) => console.error('[quiz-lead] marqueur de relance', err));
    console.log('[quiz-lead] client Stripe synchronisé', result);

    // Email de confirmation au prospect — best-effort, ne doit jamais faire
    // échouer la synchronisation Stripe qui vient de réussir.
    try {
      const { subject, html, text } = buildQuizConfirmationEmail({ customerName: body.name, lang: normalizeLang(body.lang), space: await detectSpace(env, body.email) });
      await sendEmail(env, body.email, subject, html, text);
    } catch (emailErr) {
      console.error("[quiz-lead] échec de l'envoi de l'email de confirmation", emailErr);
    }

    return jsonResponse({ ok: true, ...result }, 200, headers);
  } catch (err) {
    console.error('[quiz-lead] échec de la synchronisation Stripe', err);
    return jsonResponse({ ok: false, error: 'stripe_error' }, 502, headers);
  }
}

async function handleCreateDepositInvoice(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    console.error('[create-deposit-invoice] token admin invalide ou manquant');
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    console.error('[create-deposit-invoice] corps de requête JSON invalide', err);
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
  }

  if (!isValidDepositInvoiceInput(body)) {
    console.error('[create-deposit-invoice] payload rejeté par la validation', body);
    return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
  }

  try {
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const result = await createDepositInvoice(stripe, body);
    await markInvoiced(env, body.email).catch((err) => console.error('[create-deposit-invoice] marqueur', err));
    console.log('[create-deposit-invoice] facture créée', result);

    try {
      const { subject, html, text } = buildDepositInvoiceEmail({
        customerName: result.customerName,
        description: body.description,
        depositAmountEur: result.depositAmountEur,
        hostedInvoiceUrl: result.hostedInvoiceUrl,
        lang: result.customerLang,
        space: await detectSpace(env, body.email),
      });
      await sendEmail(env, body.email, subject, html, text);
      console.log('[create-deposit-invoice] email envoyé au client');
      return jsonResponse({ ok: true, ...result, emailSent: true, infosIncomplete: await infosIncomplete(env, body.email) }, 200, headers);
    } catch (emailErr) {
      // La facture existe déjà côté Stripe même si l'email échoue : on le
      // signale au front pour qu'il affiche le lien à transmettre à la main.
      console.error("[create-deposit-invoice] facture créée mais email non envoyé", emailErr);
      return jsonResponse({ ok: true, ...result, emailSent: false }, 200, headers);
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'customer_not_found') {
      console.error('[create-deposit-invoice] aucun client Stripe pour cet email', body.email);
      return jsonResponse({ ok: false, error: 'customer_not_found' }, 404, headers);
    }
    console.error('[create-deposit-invoice] échec de la création de facture', err);
    return jsonResponse({ ok: false, error: 'stripe_error' }, 502, headers);
  }
}

async function handleCreateBalanceInvoice(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    console.error('[create-balance-invoice] token admin invalide ou manquant');
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    console.error('[create-balance-invoice] corps de requête JSON invalide', err);
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
  }

  if (!isValidDepositInvoiceInput(body)) {
    console.error('[create-balance-invoice] payload rejeté par la validation', body);
    return jsonResponse({ ok: false, error: 'invalid_payload' }, 400, headers);
  }

  try {
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const result = await createBalanceInvoice(stripe, body);
    await markBalanceInvoiced(env, body.email).catch((err) => console.error('[create-balance-invoice] marqueur', err));
    console.log('[create-balance-invoice] facture créée', result);

    try {
      const { subject, html, text } = buildBalanceInvoiceEmail({
        customerName: result.customerName,
        description: body.description,
        balanceAmountEur: result.balanceAmountEur,
        hostedInvoiceUrl: result.hostedInvoiceUrl,
        lang: result.customerLang,
        space: await detectSpace(env, body.email),
      });
      // Email et SMS partent en même temps.
      const acc = (await getAccount(env, 'client', body.email)) ?? (await getAccount(env, 'partner', body.email));
      const first = (result.customerName || '').trim().split(/\s+/)[0] ?? '';
      const smsP = autoSms(env, 'ready', { email: body.email, phone: acc?.telephone ?? result.customerPhone, ref: result.invoiceId, text: `BUNKAIO : Bonjour${first ? ' ' + first : ''}, vos photos sont disponibles ! Réglez le solde pour y accéder : ${result.hostedInvoiceUrl}` });
      await Promise.all([sendEmail(env, body.email, subject, html, text), smsP]);
      console.log('[create-balance-invoice] email (et SMS) envoyés au client');
      return jsonResponse({ ok: true, ...result, emailSent: true, lightroomMissing: await lightroomMissing(env, body.email), infosIncomplete: await infosIncomplete(env, body.email) }, 200, headers);
    } catch (emailErr) {
      console.error("[create-balance-invoice] facture créée mais email non envoyé", emailErr);
      return jsonResponse({ ok: true, ...result, emailSent: false }, 200, headers);
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'customer_not_found') {
      console.error('[create-balance-invoice] aucun client Stripe pour cet email', body.email);
      return jsonResponse({ ok: false, error: 'customer_not_found' }, 404, headers);
    }
    console.error('[create-balance-invoice] échec de la création de facture', err);
    return jsonResponse({ ok: false, error: 'stripe_error' }, 502, headers);
  }
}

/**
 * Reçoit les événements webhook Stripe. Déclenche un email de confirmation
 * au client et une notification interne dès qu'une facture d'acompte ou de
 * solde (créées par les routes ci-dessus) est marquée payée par Stripe.
 *
 * `invoice.paid` est utilisé plutôt que `invoice.payment_succeeded` car il
 * se déclenche aussi pour les paiements marqués manuellement (hors carte).
 *
 * La signature est vérifiée via `STRIPE_WEBHOOK_SECRET` (distinct de la clé
 * API Stripe) — c'est ce qui garantit que la requête vient bien de Stripe.
 */
async function handleStripeWebhook(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    console.error('[stripe-webhook] en-tête stripe-signature manquant');
    return jsonResponse({ ok: false, error: 'missing_signature' }, 400, headers);
  }

  // Le corps doit être lu en texte brut (pas en JSON) : la vérification de
  // signature recalcule un HMAC sur les octets exacts envoyés par Stripe.
  const payload = await request.text();
  const stripe = createStripeClient(env.STRIPE_SECRET_KEY);

  let event: Stripe.Event;
  try {
    event = await verifyWebhookEvent(stripe, payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] signature invalide', err);
    return jsonResponse({ ok: false, error: 'invalid_signature' }, 400, headers);
  }

  // Litige ouvert par le client (carte, prélèvement, Klarna) : on prévient l'admin pour qu'elle puisse
  // répondre dans les délais et, si besoin, couper l'accès à l'album Lightroom.
  if (event.type === 'charge.dispute.created') {
    const dispute = event.data.object as Stripe.Dispute;
    try {
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      const charge = chargeId ? await stripe.charges.retrieve(chargeId) : null;
      const who = charge?.billing_details?.email || charge?.receipt_email || '(client inconnu)';
      const m = buildAdminAlertEmail({
        subject: `⚠ Litige Stripe — ${who}`,
        lines: [
          `Un litige a été ouvert : ${(dispute.amount / 100).toFixed(2)} € (${dispute.reason}).`,
          `Client : ${who}`,
          'À faire : répondre dans Stripe (Paiements → Litiges) avec le devis signé et les échanges, et couper l\'accès à l\'album Lightroom si nécessaire.',
        ],
      });
      await sendEmail(env, env.ADMIN_NOTIFICATION_EMAIL, m.subject, m.html, m.text);
    } catch (err) {
      console.error('[stripe-webhook] échec alerte litige', err);
    }
    return jsonResponse({ ok: true }, 200, headers);
  }

  if (event.type !== 'invoice.paid') {
    return jsonResponse({ ok: true, ignored: true }, 200, headers);
  }

  const invoice = event.data.object as Stripe.Invoice;
  const invoiceType = invoice.metadata?.type;
  if (invoiceType !== 'acompte_30' && invoiceType !== 'solde_70') {
    // Facture payée mais pas créée par nos automatisations (ex. facture manuelle) — on ignore.
    return jsonResponse({ ok: true, ignored: true }, 200, headers);
  }

  const customerName = invoice.customer_name ?? '';
  const customerEmail = invoice.customer_email ?? '';
  const description = invoice.metadata?.description ?? '';
  const amountEur = invoice.amount_paid / 100;
  const kind: 'acompte' | 'solde' = invoiceType === 'acompte_30' ? 'acompte' : 'solde';
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;

  const customerLang = await getCustomerLang(stripe, customerId);
  console.log('[stripe-webhook] facture payée', { invoiceId: invoice.id, kind, amountEur, customerEmail, customerLang });
  if (kind === 'acompte' && customerEmail) {
    await markDepositPaid(env, customerEmail, customerName, customerLang).catch((err) => console.error('[stripe-webhook] marqueur acompte', err));
  }

  let lightroomMissing = false;
  if (customerEmail) {
    const space = await detectSpace(env, customerEmail);
    // Solde payé : l'accès à l'album s'ouvre. Le lien Lightroom (saisi dans le compte) est envoyé dans le même email
    // que la confirmation de paiement, puis rendu visible dans l'espace du client (« Mon portfolio »).
    const reviewGatewayUrl = customerId
      ? `${new URL(request.url).origin}${REVIEW_GATEWAY_ROUTE}?c=${encodeURIComponent(customerId)}`
      : env.GOOGLE_REVIEW_URL;
    let accessSent = false;
    if (kind === 'solde') {
      try {
        const account = (await getAccount(env, 'client', customerEmail)) ?? (await getAccount(env, 'partner', customerEmail));
        if (account) {
          account.photosAcces = true;
          await putAccount(env, account);
        }
        if (account?.lightroomUrl) {
          const m = buildPhotosReadyEmail({ customerName, lightroomUrl: account.lightroomUrl, space: account.type, lang: normalizeLang(account.lang ?? customerLang), amountEur, reviewUrl: reviewGatewayUrl });
          const first = (customerName || '').trim().split(/\s+/)[0] ?? '';
          const smsP = autoSms(env, 'access', { email: customerEmail, phone: account.telephone ?? invoice.customer_phone, ref: invoice.id, text: `BUNKAIO : merci${first ? ' ' + first : ''}, paiement enregistré ! Votre album photo : ${account.lightroomUrl}` });
          await Promise.all([sendEmail(env, customerEmail, m.subject, m.html, m.text), smsP]);
          accessSent = true;
        } else {
          lightroomMissing = true;
        }
      } catch (err) {
        console.error("[stripe-webhook] échec email d'accès aux photos", err);
        lightroomMissing = true;
      }
    }
    if (!accessSent) {
      try {
        const { subject, html, text } = buildPaymentConfirmationEmail({ customerName, description, amountEur, invoiceType: kind, lang: customerLang, space, seance: kind === 'acompte' ? await findSeance(env, customerEmail) : undefined });
        await sendEmail(env, customerEmail, subject, html, text);
      } catch (err) {
        console.error('[stripe-webhook] échec email de confirmation client', err);
      }
    }

    // La réduction de 15 % est offerte à TOUS les clients dont le projet est entièrement
    // réglé, jamais en échange d'un avis (ce que Google interdit). La demande d'avis est
    // dans le mail d'accès aux photos ; son lien passe par /avis qui n'enregistre que le clic.
    if (kind === 'solde' && customerId) {
      try {
        await grantReviewDiscount(stripe, customerId);
      } catch (err) {
        console.error('[stripe-webhook] échec attribution réduction fidélité', err);
      }
    }
  }

  await notifyAdmin(env, { title: kind === 'acompte' ? 'Acompte reçu' : 'Solde reçu', body: `${customerName || customerEmail} · ${amountEur.toFixed(2)} €`, url: '/admin/#invoices' });
  try {
    const { subject, html, text } = buildAdminPaymentNotificationEmail({
      customerName,
      customerEmail,
      description,
      amountEur,
      invoiceType: kind,
      invoiceId: invoice.id,
      lightroomMissing,
    });
    await sendEmail(env, env.ADMIN_NOTIFICATION_EMAIL, subject, html, text);
  } catch (err) {
    console.error('[stripe-webhook] échec notification admin', err);
  }

  // Visible directement sur la fiche client Stripe (metadata) — best-effort,
  // ne doit jamais faire échouer la confirmation qui vient de réussir.
  if (customerId) {
    try {
      await recordPaymentOnCustomer(stripe, customerId, kind, amountEur);
    } catch (err) {
      console.error('[stripe-webhook] échec mise à jour metadata client', err);
    }
  }

  return jsonResponse({ ok: true }, 200, headers);
}

/**
 * Passerelle de clic pour la demande d'avis Google : redirige le client vers
 * la vraie page d'avis en enregistrant simplement le clic (mesure d'engagement)
 * sur sa fiche Customer Stripe. N'accorde et ne conditionne plus rien à ce
 * clic — la réduction de 15 % est déjà accordée à tous dès le solde payé (voir
 * handleStripeWebhook), précisément pour ne jamais l'offrir "en échange" d'un
 * avis, ce que Google interdit explicitement.
 * La redirection a toujours lieu, même si l'enregistrement échoue.
 */
async function handleReviewGateway(request: Request, env: Env): Promise<Response> {
  const customerId = new URL(request.url).searchParams.get('c');

  if (customerId) {
    try {
      const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.metadata?.avis_clique !== 'oui') {
        await stripe.customers.update(customerId, {
          metadata: {
            ...customer.metadata,
            avis_clique: 'oui',
            avis_clique_le: new Date().toISOString().slice(0, 10),
          },
        });
        console.log('[avis] clic enregistré', { customerId });
      }
    } catch (err) {
      console.error('[avis] échec enregistrement du clic', { customerId, err });
    }
  }

  return Response.redirect(env.GOOGLE_REVIEW_URL, 302);
}

/**
 * Liste les leads issus du quiz, triés du plus chaud au plus froid, pour la
 * tableau de bord admin. Protégée par le même jeton ADMIN_TOKEN que les
 * routes de facturation.
 */
async function handleListLeads(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }

  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    console.error('[leads] token admin invalide ou manquant');
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  try {
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const leads = await listLeads(stripe);
    return jsonResponse({ ok: true, leads }, 200, headers);
  } catch (err) {
    console.error('[leads] échec de la récupération des leads', err);
    return jsonResponse({ ok: false, error: 'stripe_error' }, 502, headers);
  }
}

/**
 * Relance automatique (cron quotidien) des factures d'acompte/solde dont
 * l'échéance est dépassée. Une seule relance par facture (marquée via
 * metadata `relance_envoyee`), jamais de double envoi.
 */
async function sendOverdueInvoiceReminders(env: Env): Promise<void> {
  const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
  const overdueInvoices = await findOverdueInvoices(stripe);

  for (const invoice of overdueInvoices) {
    const invoiceType = invoice.metadata?.type;
    const kind: 'acompte' | 'solde' = invoiceType === 'acompte_30' ? 'acompte' : 'solde';
    const customerEmail = invoice.customer_email ?? '';
    const customerName = invoice.customer_name ?? '';
    const description = invoice.metadata?.description ?? '';
    const amountEur = invoice.amount_due / 100;

    if (!customerEmail) {
      continue;
    }

    try {
      const { subject, html, text } = buildOverdueReminderEmail({
        customerName,
        description,
        amountEur,
        invoiceType: kind,
        hostedInvoiceUrl: invoice.hosted_invoice_url ?? '',
        lang: await getCustomerLang(stripe, typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id),
        space: await detectSpace(env, customerEmail),
      });
      await sendEmail(env, customerEmail, subject, html, text);
      await markInvoiceReminded(stripe, invoice);
      console.log('[relance-facture] relance envoyée', { invoiceId: invoice.id, kind, customerEmail });
    } catch (err) {
      // On ne marque pas la facture comme relancée si l'email échoue,
      // pour retenter automatiquement au prochain passage du cron.
      console.error('[relance-facture] échec envoi relance', { invoiceId: invoice.id, err });
    }
  }
}

function getContentType(path: string): string {
  const ext = (path.split('.').pop() ?? '').toLowerCase();
  const map: Record<string, string> = {
    webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', gif: 'image/gif', mp4: 'video/mp4',
    heic: 'image/heic', heif: 'image/heif',
  };
  return map[ext] ?? 'application/octet-stream';
}

function isValidMediaPath(path: string): boolean {
  return /^[\w][\w\-]*(\/[\w][\w\-]*)*\.(webp|jpg|jpeg|png|gif|mp4|heic|heif)$/i.test(path);
}

async function handleUploadImage(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }
  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_form_data' }, 400, headers);
  }

  const file = formData.get('file') as File | null;
  const path = formData.get('path') as string | null;

  if (!file || !path) {
    return jsonResponse({ ok: false, error: 'missing_file_or_path' }, 400, headers);
  }
  if (!isValidMediaPath(path)) {
    return jsonResponse({ ok: false, error: 'invalid_path' }, 400, headers);
  }

  const contentType = (file as File).type || getContentType(path);
  const arrayBuffer = await (file as File).arrayBuffer();
  await env.MEDIA_BUCKET.put(path, arrayBuffer, {
    httpMetadata: { contentType },
  });

  console.log('[upload-image] fichier uploadé', { path, contentType, size: arrayBuffer.byteLength });
  return jsonResponse({ ok: true, path }, 200, headers);
}

async function handleMediaServe(request: Request, env: Env, mediaPath: string): Promise<Response> {
  if (!mediaPath || !isValidMediaPath(mediaPath)) {
    return new Response('Not found', { status: 404 });
  }
  /* Requêtes Range : indispensables pour que les vidéos démarrent sans télécharger tout le fichier (et pour iOS/Safari). */
  const wantsRange = request.headers.has('Range');
  const object = await env.MEDIA_BUCKET.get(mediaPath, wantsRange ? { range: request.headers } : undefined);
  if (!object) {
    return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const contentType = object.httpMetadata?.contentType ?? getContentType(mediaPath);
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=3600',
    'ETag': `"${object.etag}"`,
    'Accept-Ranges': 'bytes',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length',
  };
  const range = (object as unknown as { range?: { offset?: number; length?: number; suffix?: number } }).range;
  if (wantsRange && range) {
    let start = 0;
    let end = object.size - 1;
    if (range.suffix !== undefined) {
      start = Math.max(0, object.size - range.suffix);
    } else {
      start = range.offset ?? 0;
      end = range.length !== undefined ? start + range.length - 1 : object.size - 1;
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${object.size}`;
    headers['Content-Length'] = String(end - start + 1);
    return new Response(object.body, { status: 206, headers });
  }
  headers['Content-Length'] = String(object.size);
  return new Response(object.body, { headers });
}

async function handleListMedia(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'GET') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }
  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }
  const prefix = new URL(request.url).searchParams.get('prefix') ?? '';
  const listed = await env.MEDIA_BUCKET.list({ prefix, limit: 500 });
  const keys = listed.objects.map((obj) => obj.key);
  /* `objects` : taille (octets) et date d'envoi de chaque fichier, pour repérer les images trop lourdes dans l'admin. */
  const objects = listed.objects.map((obj) => ({ key: obj.key, size: obj.size, uploaded: obj.uploaded }));
  return jsonResponse({ ok: true, keys, objects }, 200, headers);
}

/* Suppression d'un média (admin/media.html). POST { path } — protégé par ADMIN_TOKEN, chemin validé comme à l'upload. */
async function handleDeleteMedia(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, headers);
  }
  const authHeader = request.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return jsonResponse({ ok: false, error: 'unauthorized' }, 401, headers);
  }
  let path = '';
  try {
    const body = (await request.json()) as { path?: string };
    path = String(body.path ?? '');
  } catch {
    return jsonResponse({ ok: false, error: 'invalid_json' }, 400, headers);
  }
  if (!isValidMediaPath(path)) {
    return jsonResponse({ ok: false, error: 'invalid_path' }, 400, headers);
  }
  await env.MEDIA_BUCKET.delete(path);
  console.log('[delete-media] fichier supprimé', { path });
  return jsonResponse({ ok: true, path }, 200, headers);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    configureBusiness(env);
    const headers = corsHeaders(resolveAllowedOrigin(request.headers.get('Origin'), env.ALLOWED_ORIGINS));

    // Préflight CORS — le navigateur l'envoie avant le vrai POST.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (url.pathname === '/unsubscribe') {
      const email = (url.searchParams.get('e') ?? '').trim().toLowerCase();
      const valid = email.includes('@') && url.searchParams.get('s') === (await unsubscribeToken(env, email));
      if (valid) await setUnsubscribed(env, email, true);
      const msg = valid ? `Vous êtes désinscrit(e) : <b>${email.replace(/[<>&"]/g, '')}</b> ne recevra plus nos emails d'information. Vous continuerez à recevoir les messages liés à vos projets en cours (devis, factures, séances).` : 'Ce lien de désinscription n\'est pas valide. Écrivez-nous à contact@bunkaio.com.';
      return new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Désinscription — BUNKAIO</title><body style="margin:0;background:#0a0a0c;color:#fff;font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;padding:24px"><div style="max-width:440px;text-align:center"><h1 style="font-size:22px">BUNKAIO</h1><p style="line-height:1.6;color:rgba(255,255,255,.75)">${msg}</p><p><a href="https://bunkaio.com" style="color:#d9cdf5">bunkaio.com</a></p></div></body></html>`, { status: valid ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'no-referrer' } });
    }
    if (url.pathname === '/quote' || url.pathname === '/quote/sign') {
      return handlePublicQuote(request, env, headers, url.pathname);
    }
    if (url.pathname.startsWith('/admin/')) {
      return handleAdminDashboard(request, env, headers, url.pathname);
    }
    if (url.pathname === '/ack') {
      return handleAck(request, env, headers);
    }
    if (url.pathname === QUIZ_LEAD_ROUTE) {
      return handleQuizLead(request, env, headers);
    }
    if (url.pathname === DEPOSIT_INVOICE_ROUTE) {
      return handleCreateDepositInvoice(request, env, headers);
    }
    if (url.pathname === BALANCE_INVOICE_ROUTE) {
      return handleCreateBalanceInvoice(request, env, headers);
    }
    if (url.pathname === STRIPE_WEBHOOK_ROUTE) {
      return handleStripeWebhook(request, env, headers);
    }
    if (url.pathname === REVIEW_GATEWAY_ROUTE) {
      return handleReviewGateway(request, env);
    }
    if (url.pathname === LEADS_ROUTE) {
      return handleListLeads(request, env, headers);
    }
    if (url.pathname === UPLOAD_IMAGE_ROUTE) {
      return handleUploadImage(request, env, headers);
    }
    if (url.pathname === LIST_MEDIA_ROUTE) {
      return handleListMedia(request, env, headers);
    }
    if (url.pathname === DELETE_MEDIA_ROUTE) {
      return handleDeleteMedia(request, env, headers);
    }
    if (url.pathname === AUTH_LOGIN_ROUTE) {
      return handleAuthLogin(request, env, headers);
    }
    if (url.pathname === ACCOUNT_UPDATE_ROUTE) {
      return handleAccountUpdate(request, env, headers, ctx);
    }
    if (url.pathname === '/collect') {
      return handleCollect(request, env, headers);
    }
    if (url.pathname === '/stats') {
      return handleStats(request, env, headers);
    }
    if (url.pathname === ACCOUNTS_ROUTE) {
      return handleAdminAccounts(request, env, headers);
    }
    if (url.pathname.startsWith(MEDIA_ROUTE_PREFIX)) {
      const mediaPath = url.pathname.slice(MEDIA_ROUTE_PREFIX.length);
      return handleMediaServe(request, env, mediaPath);
    }
    return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    configureBusiness(env);
    // Cron "*/5" : envoi des récapitulatifs d'activité clients. Cron quotidien : relances de factures.
    if (event.cron === '*/5 * * * *') {
      await syncResendInbox(env).catch((err) => console.error('[inbox] relève planifiée en échec', err));
      await flushActivityNotifications(env);
      return;
    }
    await purgeOldAnalytics(env);
    await runDailyAutomations(env);
    try {
      await sendOverdueInvoiceReminders(env);
    } catch (err) {
      console.error('[relance-facture] échec de la vérification planifiée', err);
    }
  },
};
