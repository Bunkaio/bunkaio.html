import type Stripe from 'stripe';
import {
  buildAdminPaymentNotificationEmail,
  buildBalanceInvoiceEmail,
  buildDepositInvoiceEmail,
  buildOverdueReminderEmail,
  buildPaymentConfirmationEmail,
  buildQuizConfirmationEmail,
  buildReviewRequestEmail,
  sendEmail,
} from './email';
import {
  createBalanceInvoice,
  createDepositInvoice,
  createStripeClient,
  findOverdueInvoices,
  grantReviewDiscount,
  listLeads,
  markInvoiceReminded,
  recordPaymentOnCustomer,
  upsertQuizCustomer,
  verifyWebhookEvent,
} from './stripe';
import type { DepositInvoiceInput, Env, QuizLeadPayload } from './types';

const QUIZ_LEAD_ROUTE = '/quiz-lead';
const DEPOSIT_INVOICE_ROUTE = '/create-deposit-invoice';
const BALANCE_INVOICE_ROUTE = '/create-balance-invoice';
const STRIPE_WEBHOOK_ROUTE = '/stripe-webhook';
const REVIEW_GATEWAY_ROUTE = '/avis';
const LEADS_ROUTE = '/leads';

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
    (b.interetCommunication === undefined || typeof b.interetCommunication === 'boolean')
  );
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
      const { subject, html, text } = buildQuizConfirmationEmail({ customerName: body.name });
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

  console.log('[stripe-webhook] facture payée', { invoiceId: invoice.id, kind, amountEur, customerEmail });

  if (customerEmail) {
    try {
      const { subject, html, text } = buildPaymentConfirmationEmail({ customerName, description, amountEur, invoiceType: kind });
      await sendEmail(env, customerEmail, subject, html, text);
    } catch (err) {
      console.error('[stripe-webhook] échec email de confirmation client', err);
    }

    // Le solde payé marque la fin du projet : on en profite pour demander un avis.
    // Le lien pointe vers notre propre passerelle (/avis) plutôt que directement
    // vers Google : elle enregistre le clic puis redirige, ce qui permet de
    // n'accorder la réduction de 15 % qu'au moment où le client ouvre vraiment
    // la page d'avis (voir handleReviewGateway) — pas dès l'envoi de l'email.
    if (kind === 'solde') {
      const reviewGatewayUrl = customerId
        ? `${new URL(request.url).origin}${REVIEW_GATEWAY_ROUTE}?c=${encodeURIComponent(customerId)}`
        : env.GOOGLE_REVIEW_URL;
      try {
        const { subject, html, text } = buildReviewRequestEmail({ customerName, reviewUrl: reviewGatewayUrl });
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
 * la vraie page d'avis tout en enregistrant le clic sur sa fiche Customer
 * Stripe, et n'accorde la réduction de 15 % qu'à cet instant précis (pas dès
 * l'envoi de l'email) — on sait alors qu'il a au moins ouvert la page d'avis.
 * Honnêteté importante : un clic ne prouve pas qu'un avis a été posté, Google
 * ne fournissant aucun moyen de le vérifier ; c'est la meilleure approximation
 * possible avec les outils disponibles.
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
        await grantReviewDiscount(stripe, customerId);
        console.log('[avis] clic enregistré, réduction accordée', { customerId });
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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
    return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
      await sendOverdueInvoiceReminders(env);
    } catch (err) {
      console.error('[relance-facture] échec de la vérification planifiée', err);
    }
  },
};
