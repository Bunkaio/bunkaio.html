import { createDepositInvoice, createStripeClient, upsertQuizCustomer } from './stripe';
import type { DepositInvoiceInput, Env, QuizLeadPayload } from './types';

const QUIZ_LEAD_ROUTE = '/quiz-lead';
const DEPOSIT_INVOICE_ROUTE = '/create-deposit-invoice';

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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    console.log('[create-deposit-invoice] facture créée et envoyée', result);
    return jsonResponse({ ok: true, ...result }, 200, headers);
  } catch (err) {
    if (err instanceof Error && err.message === 'customer_not_found') {
      console.error('[create-deposit-invoice] aucun client Stripe pour cet email', body.email);
      return jsonResponse({ ok: false, error: 'customer_not_found' }, 404, headers);
    }
    console.error('[create-deposit-invoice] échec de la création de facture', err);
    return jsonResponse({ ok: false, error: 'stripe_error' }, 502, headers);
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
    return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
  },
};
