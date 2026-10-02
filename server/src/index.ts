import type Stripe from 'stripe';
import { adminAccountView, getAccount, listAccounts, putAccount, sanitizeAccount, upsertAccountFromAdmin, verifyLogin } from './accounts';
import { handleCollect, handleStats, purgeOldAnalytics } from './analytics';
import { appendJournal, diffAccountActivity, flushActivityNotifications, queueActivityNotification } from './activity';
import {
  buildAdminPaymentNotificationEmail,
  buildBalanceInvoiceEmail,
  buildDepositInvoiceEmail,
  buildOverdueReminderEmail,
  buildPaymentConfirmationEmail,
  buildQuizConfirmationEmail,
  buildReviewRequestEmail,
  normalizeLang,
  sendEmail,
} from './email';
import {
  createBalanceInvoice,
  createDepositInvoice,
  createStripeClient,
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
    (b.lightroomUrl === undefined || typeof b.lightroomUrl === 'string') &&
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

  const updated = {
    ...account,
    reseau,
    collaborations,
    partenariat,
    nom: body.nom ?? account.nom,
    telephone: body.telephone ?? account.telephone,
    adresse: body.adresse ?? account.adresse,
    moodboards: body.moodboards ?? account.moodboards,
  };
  const entries = diffAccountActivity(account, updated, new Date().toISOString());
  const withJournal = appendJournal(updated, entries);
  await putAccount(env, withJournal);
  // File d'attente de l'email récapitulatif : un échec ne doit jamais faire échouer l'enregistrement du client.
  if (entries.length) ctx.waitUntil(queueActivityNotification(env, withJournal, entries).catch((err) => console.error('[activity] mise en file impossible', err)));
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
      console.log('[accounts] compte créé/mis à jour par l\'admin', { type: account.type, email: account.email });
      return jsonResponse({ ok: true, account: sanitizeAccount(account) }, 200, headers);
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
    console.log('[quiz-lead] client Stripe synchronisé', result);

    // Email de confirmation au prospect — best-effort, ne doit jamais faire
    // échouer la synchronisation Stripe qui vient de réussir.
    try {
      const { subject, html, text } = buildQuizConfirmationEmail({ customerName: body.name, lang: normalizeLang(body.lang) });
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
    console.log('[create-deposit-invoice] facture créée', result);

    try {
      const { subject, html, text } = buildDepositInvoiceEmail({
        customerName: result.customerName,
        description: body.description,
        depositAmountEur: result.depositAmountEur,
        hostedInvoiceUrl: result.hostedInvoiceUrl,
        lang: result.customerLang,
      });
      await sendEmail(env, body.email, subject, html, text);
      console.log('[create-deposit-invoice] email envoyé au client');
      return jsonResponse({ ok: true, ...result, emailSent: true }, 200, headers);
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
    console.log('[create-balance-invoice] facture créée', result);

    try {
      const { subject, html, text } = buildBalanceInvoiceEmail({
        customerName: result.customerName,
        description: body.description,
        balanceAmountEur: result.balanceAmountEur,
        hostedInvoiceUrl: result.hostedInvoiceUrl,
        lang: result.customerLang,
      });
      await sendEmail(env, body.email, subject, html, text);
      console.log('[create-balance-invoice] email envoyé au client');
      return jsonResponse({ ok: true, ...result, emailSent: true }, 200, headers);
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

  if (customerEmail) {
    try {
      const { subject, html, text } = buildPaymentConfirmationEmail({ customerName, description, amountEur, invoiceType: kind, lang: customerLang });
      await sendEmail(env, customerEmail, subject, html, text);
    } catch (err) {
      console.error('[stripe-webhook] échec email de confirmation client', err);
    }

    // Le solde payé marque la fin du projet : on en profite pour demander un avis.
    // La réduction de 15 % est offerte à TOUS les clients dont le projet est
    // entièrement réglé, qu'ils cliquent ou non sur le lien d'avis — jamais en
    // échange d'un avis (ce que Google interdit explicitement). Elle est donc
    // accordée ici, immédiatement, indépendamment de tout clic.
    // Le lien pointe vers notre propre passerelle (/avis) plutôt que directement
    // vers Google : elle se contente d'enregistrer le clic à titre de mesure
    // d'engagement avant de rediriger (voir handleReviewGateway) — sans rien
    // accorder, ni conditionner quoi que ce soit à ce clic.
    if (kind === 'solde') {
      if (customerId) {
        try {
          await grantReviewDiscount(stripe, customerId);
        } catch (err) {
          console.error('[stripe-webhook] échec attribution réduction fidélité', err);
        }
      }
      const reviewGatewayUrl = customerId
        ? `${new URL(request.url).origin}${REVIEW_GATEWAY_ROUTE}?c=${encodeURIComponent(customerId)}`
        : env.GOOGLE_REVIEW_URL;
      try {
        const { subject, html, text } = buildReviewRequestEmail({ customerName, reviewUrl: reviewGatewayUrl, lang: customerLang });
        await sendEmail(env, customerEmail, subject, html, text);
      } catch (err) {
        console.error("[stripe-webhook] échec email de demande d'avis", err);
      }
    }
  }

  try {
    const { subject, html, text } = buildAdminPaymentNotificationEmail({
      customerName,
      customerEmail,
      description,
      amountEur,
      invoiceType: kind,
      invoiceId: invoice.id,
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
 * page admin/leads.html. Protégée par le même jeton ADMIN_TOKEN que les
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
    const headers = corsHeaders(resolveAllowedOrigin(request.headers.get('Origin'), env.ALLOWED_ORIGINS));

    // Préflight CORS — le navigateur l'envoie avant le vrai POST.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
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
    // Cron "*/5" : envoi des récapitulatifs d'activité clients. Cron quotidien : relances de factures.
    if (event.cron === '*/5 * * * *') {
      await flushActivityNotifications(env);
      return;
    }
    await purgeOldAnalytics(env);
    try {
      await sendOverdueInvoiceReminders(env);
    } catch (err) {
      console.error('[relance-facture] échec de la vérification planifiée', err);
    }
  },
};
