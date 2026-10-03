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
  /** Adresse légale (secret Cloudflare) — jamais dans le dépôt ni sur le site. */
  BUSINESS_ADDRESS?: string;
  /** SMS : 'brevo' ou 'twilio' (secrets BREVO_API_KEY, ou TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM). */
  SMS_PROVIDER?: string;
  SMS_SENDER?: string;
  BREVO_API_KEY?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM?: string;
  MEDIA_BUCKET: R2Bucket;
  ACCOUNTS_KV: KVNamespace;
  ANALYTICS_DB?: D1Database; // mesure d'audience — optionnelle (voir migrations/0001_analytics.sql)
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
  /** Langue du site au moment de la demande : détermine la langue des emails envoyés au client ('fr' par défaut). */
  lang?: string;
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
  /** Téléphone de la fiche client Stripe (sert aux SMS). */
  customerPhone?: string;
  /** Langue du client (metadata Stripe `langue`). */
  customerLang?: 'fr' | 'en';
}

/** Résultat renvoyé à admin/index.html après création de la facture de solde. */
export interface BalanceInvoiceResult {
  invoiceId: string;
  hostedInvoiceUrl: string;
  invoicePdfUrl: string;
  balanceAmountEur: number;
  customerName: string;
  customerPhone?: string;
  customerLang?: 'fr' | 'en';
}

/** Une ligne de la liste des leads renvoyée au tableau de bord admin (route /leads). */
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

/** Un produit/pièce de la collection à mettre en avant (module "marque" du moodboard). */
export interface MoodboardProduct {
  nom: string;
  type?: string; // 'vetement' | 'cosmetique' | 'accessoire' | 'bijou' | 'autre'
  lien?: string;
  note?: string;
}

/** Un prestataire externe impliqué dans le projet (traiteur, lieu, styliste…).
    `domaine` reprend volontairement les mêmes identifiants que CATS dans
    js/script.js (les domaines du questionnaire de devis) plutôt qu'une
    taxonomie propre au moodboard — une seule liste de référence à tenir
    à jour sur tout le site. */
export interface MoodboardCollaborator {
  nom: string;
  domaine?: string;
  role?: string;
}

/** Onglet "Mes moodboards" — un moodboard par shooting (ou "à venir"), construit par le
    client via le questionnaire interactif (voir renderMoodboardWizard() dans js/script.js). */
export interface Moodboard {
  id: string;
  titre: string;
  commandeRef?: string; // libellé d'une commande existante, ou 'future' si pas encore réservé
  statut: string; // 'Brouillon' | 'Envoyé' | 'Validé' | 'À ajuster'
  typeProjet?: string; // 'particulier' | 'marque'
  direction?: string;
  ambiance?: string[];
  palette?: string;
  pinterestUrl?: string;
  references?: MoodboardReference[];
  produits?: MoodboardProduct[]; // module "marque" — collection à présenter
  collaborateurs?: MoodboardCollaborator[];
  notes?: string;
  commentaires?: MoodboardComment[];
  creeLe: string;
  majLe: string;
}

/** Onglet "Mon partenariat" — uniquement pour les comptes type 'partner'
    (Programme Partenaires Fondateurs). `secteur` reprend les identifiants
    du formulaire de candidature (voir PARTNER_SECTORS dans js/script.js) :
    portrait, mode, commercial, evenementiel, mariage (les prestations du catalogue). */
export interface AccountPartnerInfo {
  secteur?: string;
  statut?: string; // 'En attente' | 'Actif' | 'Terminé'
  dateAdhesion?: string;
  articleUrl?: string; // lien vers leur mise en avant éditoriale, une fois publiée
  typePrestataire?: string; // id d'un type de PARTNER_PROVIDER_TYPES (js/script.js) — choisi par le partenaire
  disponibleCollab?: boolean; // ouvert aux prestations collaboratives rémunérées
  visibleInDirectory?: boolean; // coché par le partenaire pour figurer dans l'annuaire BUNKAIO (absent = non référencé)
  presentation?: string; // courte présentation affichée à l'équipe Bunkaio
}

/** Promotion accordée à un partenaire (en plus du -20% permanent). Renseignée par l'admin. */
export interface AccountPromotion {
  titre: string;
  description?: string;
  code?: string;
  remise?: string; // libellé libre, ex. "-10% supplémentaires"
  validiteJusquAu?: string;
  statut?: string; // 'Active' | 'Expirée' | 'Utilisée'
}

/** Contact du réseau d'un partenaire. `origine: 'bunkaio'` = mise en relation par l'équipe (lecture seule côté partenaire). */
export interface NetworkContact {
  id: string;
  nom: string;
  domaine?: string;
  role?: string;
  contact?: string;
  lien?: string;
  note?: string;
  origine?: 'partenaire' | 'bunkaio';
}

/** Mission collaborative rémunérée proposée par Bunkaio. Le partenaire ne peut que l'accepter ou la décliner. */
export interface Collaboration {
  id: string;
  titre: string;
  description?: string;
  date?: string;
  lieu?: string;
  remuneration?: string;
  statut: string; // 'Proposée' | 'Acceptée' | 'Déclinée' | 'Terminée' | 'Payée'
}

/** Réponse du partenaire à une mission proposée (payload /account-update). */
export interface CollaborationResponse {
  id: string;
  statut: 'Acceptée' | 'Déclinée';
}

/** Enregistrement complet d'un compte, tel que stocké dans ACCOUNTS_KV. */
/** Coordonnées de facturation structurées (devis et factures). */
export interface AccountBilling {
  profil: 'particulier' | 'professionnel';
  /** Prénom et nom du contact (professionnels : `nom` est alors la raison sociale). */
  contact?: string;
  rue: string;
  codePostal: string;
  ville: string;
  pays: string;
  /** Optionnel pour un client, obligatoire pour un partenaire. */
  siret?: string;
  tvaIntra?: string;
  /** Forme juridique (professionnels) : ei, sas, sarl, sa, association, autre. */
  forme?: string;
}

export interface AccountSeance { /** Date de livraison estimée des photos (AAAA-MM-JJ), saisie admin. */ livraison?: string; date: string; heure?: string; lieu?: string; prestation?: string; statut?: 'prevue' | 'annulee' }

export interface AccountRecord {
  type: AccountType;
  /** Coordonnées de facturation complètes — l'espace n'est validé que lorsqu'elles sont toutes renseignées. */
  facturation?: AccountBilling;
  infosCompletes?: boolean;
  email: string;
  codeHash: string;
  nom?: string;
  telephone?: string;
  adresse?: string;
  etapeActuelle?: number;
  lightroomUrl?: string;
  /** Langue des emails envoyés à ce compte. */
  lang?: 'fr' | 'en';
  /** Vrai une fois le solde payé : le lien Lightroom n'est alors exposé au client dans son espace. */
  photosAcces?: boolean;
  /** Prochaine séance (saisie admin) : alimente rappel J-2, confirmation, report et annulation. */
  seance?: AccountSeance;
  commandes?: AccountOrder[];
  paiements?: AccountPayment[];
  factures?: AccountInvoice[];
  abonnement?: AccountSubscription;
  moodboards?: Moodboard[];
  partenariat?: AccountPartnerInfo;
  promotions?: AccountPromotion[];
  reseau?: NetworkContact[];
  collaborations?: Collaboration[];
  journal?: ActivityEntry[]; // historique horodaté des modifications faites par le client — lu par l'admin uniquement
  derniereActivite?: string; // ISO — date de la dernière entrée du journal
}

/** Une modification faite par le client/partenaire dans son espace (voir activity.ts). */
export type ActivityType = 'moodboard' | 'infos' | 'collaboration' | 'partenariat';
export interface ActivityEntry {
  id: string;
  date: string; // ISO
  type: ActivityType;
  resume: string;
  details?: string[];
  silent?: boolean; // journalisé mais sans email (ex. moodboard encore en brouillon)
}

/** Modifications en attente d'envoi : regroupées par compte jusqu'à la fin de la fenêtre de calme. */
export interface PendingActivityNotification {
  type: AccountType;
  email: string;
  nom?: string;
  entries: ActivityEntry[];
  lastAt: number; // ms epoch de la dernière modification
}

/** Version du compte renvoyée au front — jamais le hash du code. */
/** Vue renvoyée au client : sans code d'accès ni journal interne. */
export type PublicAccountRecord = Omit<AccountRecord, 'codeHash' | 'journal' | 'derniereActivite'>;
/** Vue renvoyée à l'admin : tout sauf le hash du code. */
export type AdminAccountRecord = Omit<AccountRecord, 'codeHash'>;

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
  facturation?: AccountBilling;
  moodboards?: Moodboard[];
  /** Partenaires uniquement — seuls ces 3 champs de `partenariat` sont modifiables par le partenaire. */
  partenariat?: Pick<AccountPartnerInfo, 'typePrestataire' | 'disponibleCollab' | 'visibleInDirectory' | 'presentation'>;
  /** Partenaires uniquement — remplace les contacts ajoutés par le partenaire ; ceux de Bunkaio sont conservés. */
  reseau?: NetworkContact[];
  collaborationReponses?: CollaborationResponse[];
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
  /** Actions d'envoi d'email déclenchées par l'admin à l'enregistrement (non stockées). */
  sendAccessMail?: boolean;
  sendPhotosMail?: boolean;
  lang?: 'fr' | 'en';
  facturation?: AccountBilling;
  photosAcces?: boolean;
  /** Referme l'accès aux photos : le lien Lightroom disparaît de l'espace du client. */
  revokePhotos?: boolean;
  seance?: AccountSeance | null;
  /** Envoie l'email de séance correspondant (confirmation, report ou annulation) à l'enregistrement. */
  sendSeanceMail?: 'confirmation' | 'report' | 'cancel';
  motif?: string;
  commandes?: AccountOrder[];
  paiements?: AccountPayment[];
  factures?: AccountInvoice[];
  abonnement?: AccountSubscription | null;
  moodboards?: Moodboard[];
  partenariat?: AccountPartnerInfo | null;
  promotions?: AccountPromotion[];
  reseau?: NetworkContact[];
  collaborations?: Collaboration[];
}

/** Ligne légère renvoyée par GET /accounts (sans le détail commandes/paiements/etc.). */
export interface AdminAccountSummary {
  type: AccountType;
  email: string;
  nom?: string;
  derniereActivite?: string;
}
