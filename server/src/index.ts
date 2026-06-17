import { createStripeClient, upsertQuizCustomer } from './stripe';
import type { Env, QuizLeadPayload } from './types';

const ROUTE = '/quiz-lead';

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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const headers = corsHeaders(resolveAllowedOrigin(request.headers.get('Origin'), env.ALLOWED_ORIGINS));

    // Préflight CORS — le navigateur l'envoie avant le vrai POST.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (url.pathname !== ROUTE) {
      return jsonResponse({ ok: false, error: 'not_found' }, 404, headers);
    }

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
  },
};
