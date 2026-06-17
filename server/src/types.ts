/**
 * Bindings disponibles dans le Worker (variables d'env + secrets Cloudflare).
 * STRIPE_SECRET_KEY est injecté via `wrangler secret put` — jamais commité.
 */
export interface Env {
  STRIPE_SECRET_KEY: string;
  ALLOWED_ORIGINS: string;
}

/**
 * Forme exacte du payload envoyé par le quiz Bunkaio (js/script.js → submitQuiz).
 * Tout champ absent ou mal typé fait échouer la validation côté Worker.
 */
export interface QuizLeadPayload {
  name: string;
  email: string;
  phone?: string;
  project: string;
  category: string;
  profile: string;
  formule: string;
  budgetEstime: string;
  delaiSouhaite?: string;
  optionsChoisies?: string;
  interetCommunication?: boolean;
}

/** Résultat du create-or-update Stripe, renvoyé au front à titre informatif uniquement. */
export interface UpsertResult {
  customerId: string;
  created: boolean;
}
