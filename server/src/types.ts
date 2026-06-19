/**
 * Bindings disponibles dans le Worker (variables d'env + secrets Cloudflare).
 * STRIPE_SECRET_KEY est injecté via `wrangler secret put` — jamais commité.
 */
export interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  ALLOWED_ORIGINS: string;
  ADMIN_TOKEN: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  ADMIN_NOTIFICATION_EMAIL: string;
  GOOGLE_REVIEW_URL: string;
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

/** Payload envoyé par admin/index.html pour générer une facture d'acompte. */
export interface DepositInvoiceInput {
  email: string;
  totalAmountEur: number;
  description: string;
}

/** Résultat renvoyé à admin/index.html après création de la facture d'acompte. */
export interface DepositInvoiceResult {
  invoiceId: string;
  hostedInvoiceUrl: string;
  invoicePdfUrl: string;
  depositAmountEur: number;
  customerName: string;
}

/** Résultat renvoyé à admin/index.html après création de la facture de solde. */
export interface BalanceInvoiceResult {
  invoiceId: string;
  hostedInvoiceUrl: string;
  invoicePdfUrl: string;
  balanceAmountEur: number;
  customerName: string;
}
