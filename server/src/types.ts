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
  MEDIA_BUCKET: R2Bucket;
  ACCOUNTS_KV: KVNamespace;
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
  budgetMontantEur?: number;
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

/** Une ligne de la liste des leads renvoyée à admin/leads.html (route /leads). */
export interface LeadSummary {
  customerId: string;
  name: string;
  email: string;
  category: string;
  budgetEstime: string;
  leadScore: number;
  leadTemperature: 'froid' | 'tiede' | 'chaud';
  derniereSoumission: string;
}

/* ════════════════════════════════════════════════════════════════
   ESPACE CLIENT / PARTENAIRE — comptes stockés dans ACCOUNTS_KV
   ════════════════════════════════════════════════════════════════
   Remplace l'ancien comptes.json (fichier statique public). Chaque
   compte est une entrée KV sous la clé `account:<type>:<email>` —
   voir accounts.ts. Le code d'accès n'est jamais stocké en clair :
   seul son hash SHA-256 (codeHash) est persisté.
   ════════════════════════════════════════════════════════════════ */

export type AccountType = 'client' | 'partner';

/** Une ligne de l'historique "Mes commandes". */
export interface AccountOrder {
  date?: string;
  prestation?: string;
  montant?: string;
  statut?: string;
}

/** Une ligne de l'historique "Mes paiements". */
export interface AccountPayment {
  date?: string;
  reference?: string;
  methode?: string;
  montant?: string;
  statut?: string;
  factureUrl?: string;
}

/** Une ligne de l'onglet "Mes factures". */
export interface AccountInvoice {
  numero?: string;
  date?: string;
  montant?: string;
  statut?: string;
  url?: string;
}

/** Suivi d'usage mensuel d'un abonnement Studio Continu (voir SUBS dans js/script.js). */
export interface AccountSubscriptionUsage {
  label?: string;
  utilises: number;
  inclus: number;
}

/** Onglet "Mes abonnements" — présent seulement si le client est abonné. */
export interface AccountSubscription {
  categorie: string; // clé SUBS correspondante : 'immobilier' | 'artisan' | 'mode'
  statut: string; // 'Actif' | 'En pause' | 'Résilié'
  dateDebut?: string;
  prochaineFacture?: string;
  utilisation?: Record<string, AccountSubscriptionUsage>;
}

/** Un lien de référence/inspiration dans un moodboard (Pinterest, Instagram, image…). */
export interface MoodboardReference {
  url: string;
  note?: string;
}

/** Un commentaire dans le fil d'échange d'un moodboard — client ou équipe Bunkaio.
    `lien` permet d'attacher une référence (ex. un pin Pinterest précis) au commentaire. */
export interface MoodboardComment {
  auteur: 'client' | 'bunkaio';
  texte: string;
  lien?: string;
  date: string;
}

/** Onglet "Mes moodboards" — un moodboard par shooting (ou "à venir"), construit par le
    client via le questionnaire interactif (voir renderMoodboardWizard() dans js/script.js). */
export interface Moodboard {
  id: string;
  titre: string;
  commandeRef?: string; // libellé d'une commande existante, ou 'future' si pas encore réservé
  statut: string; // 'Brouillon' | 'Envoyé' | 'Validé' | 'À ajuster'
  direction?: string;
  ambiance?: string[];
  palette?: string;
  pinterestUrl?: string;
  references?: MoodboardReference[];
  notes?: string;
  commentaires?: MoodboardComment[];
  creeLe: string;
  majLe: string;
}

/** Enregistrement complet d'un compte, tel que stocké dans ACCOUNTS_KV. */
export interface AccountRecord {
  type: AccountType;
  email: string;
  codeHash: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  etapeActuelle?: number;
  lightroomUrl?: string;
  commandes?: AccountOrder[];
  paiements?: AccountPayment[];
  factures?: AccountInvoice[];
  abonnement?: AccountSubscription;
  moodboards?: Moodboard[];
}

/** Version du compte renvoyée au front — jamais le hash du code. */
export type PublicAccountRecord = Omit<AccountRecord, 'codeHash'>;

/** Payload de /auth-login. */
export interface AuthLoginPayload {
  type: AccountType;
  email: string;
  code: string;
}

/** Payload de /account-update — le client ré-authentifie avec son code actuel.
    `moodboards`, fourni en entier à chaque sauvegarde (le front garde l'état
    courant en mémoire et renvoie tout le tableau), remplace la liste existante
    — c'est aussi par ce même champ que le client ajoute un commentaire ou crée
    un nouveau moodboard, pas de route dédiée. */
export interface AccountSelfUpdatePayload {
  type: AccountType;
  email: string;
  code: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  moodboards?: Moodboard[];
}

/** Payload de POST /accounts (admin) — crée ou met à jour un compte. `code` est optionnel
    à la mise à jour (laisse le hash existant inchangé s'il est omis). */
export interface AdminAccountUpsertPayload {
  type: AccountType;
  email: string;
  code?: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  etapeActuelle?: number;
  lightroomUrl?: string;
  commandes?: AccountOrder[];
  paiements?: AccountPayment[];
  factures?: AccountInvoice[];
  abonnement?: AccountSubscription | null;
  moodboards?: Moodboard[];
}

/** Ligne légère renvoyée par GET /accounts (sans le détail commandes/paiements/etc.). */
export interface AdminAccountSummary {
  type: AccountType;
  email: string;
  nom?: string;
}
