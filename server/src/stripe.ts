import Stripe from 'stripe';
import type { BalanceInvoiceResult, DepositInvoiceInput, DepositInvoiceResult, QuizLeadPayload, UpsertResult } from './types';

/**
 * Crée un client Stripe compatible avec le runtime Cloudflare Workers.
 * Le SDK Stripe utilise `fetch` au lieu des modules Node natifs (http/https),
 * indispensable car les Workers n'ont pas d'accès à l'API Node standard.
 */
export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
    httpClient: Stripe.createFetchHttpClient(),
    // Le SDK tente sinon d'utiliser des API Node absentes du runtime Workers.
    telemetry: false,
  });
}

/**
 * Tronque une chaîne pour respecter la limite Stripe de 500 caractères
 * par valeur de metadata.
 */
function truncateForMetadata(value: string, maxLength = 490): string {
  return value.length > maxLength ? value.slice(0, maxLength) + '…' : value;
}

/**
 * Construit l'objet metadata Stripe à partir des réponses du quiz.
 * `source: quiz_bunkaio` permet de filtrer ces prospects depuis le dashboard Stripe.
 */
function buildMetadata(payload: QuizLeadPayload): Record<string, string> {
  return {
    source: 'quiz_bunkaio',
    type_projet: payload.category,
    profil: payload.profile,
    formule_recommandee: payload.formule,
    budget_estime: payload.budgetEstime,
    delai_souhaite: payload.delaiSouhaite || 'non précisé',
    options_choisies: payload.optionsChoisies || 'aucune',
    description_projet: truncateForMetadata(payload.project),
    interet_communication: payload.interetCommunication ? 'oui' : 'non',
    derniere_soumission_quiz: new Date().toISOString(),
  };
}

/** Retrouve le Customer Stripe associé à un email, ou `null` s'il n'existe pas encore. */
async function findCustomerByEmail(stripe: Stripe, email: string): Promise<Stripe.Customer | null> {
  const existing = await stripe.customers.list({ email, limit: 1 });
  return existing.data[0] ?? null;
}

/**
 * Crée un Customer Stripe à partir d'une soumission de quiz, ou met à jour
 * le Customer existant si un client partage déjà cet email (déduplication).
 */
export async function upsertQuizCustomer(
  stripe: Stripe,
  payload: QuizLeadPayload
): Promise<UpsertResult> {
  const metadata = buildMetadata(payload);
  const match = await findCustomerByEmail(stripe, payload.email);

  if (match) {
    const updated = await stripe.customers.update(match.id, {
      name: payload.name,
      phone: payload.phone || undefined,
      metadata: { ...match.metadata, ...metadata },
    });
    return { customerId: updated.id, created: false };
  }

  const created = await stripe.customers.create({
    name: payload.name,
    email: payload.email,
    phone: payload.phone || undefined,
    metadata,
  });
  return { customerId: created.id, created: true };
}

/**
 * Crée une facture Stripe pour une fraction du montant total (acompte 30 %
 * ou solde 70 %), pour un Customer déjà existant (créé via le quiz).
 * Utilisée par les routes /create-deposit-invoice et /create-balance-invoice,
 * appelées depuis la page d'administration (admin/index.html).
 *
 * La facture est finalisée (ce qui génère son lien de paiement hébergé par
 * Stripe) mais n'est volontairement PAS envoyée via `stripe.invoices.sendInvoice` :
 * cette action est bloquée sur ce compte ("This invoice cannot be sent right
 * now"). L'email au client est envoyé séparément par le Worker lui-même
 * (voir email.ts), avec le lien généré ici.
 */
async function createFractionalInvoice(
  stripe: Stripe,
  input: DepositInvoiceInput,
  fraction: number,
  metadataType: 'acompte_30' | 'solde_70',
  itemDescriptionPrefix: string
): Promise<{ invoiceId: string; hostedInvoiceUrl: string; invoicePdfUrl: string; amountEur: number; customerName: string }> {
  const customer = await findCustomerByEmail(stripe, input.email);
  if (!customer) {
    throw new Error('customer_not_found');
  }

  const amountEur = Math.round(input.totalAmountEur * fraction * 100) / 100;

  await stripe.invoiceItems.create({
    customer: customer.id,
    currency: 'eur',
    amount: Math.round(amountEur * 100),
    description: `${itemDescriptionPrefix} — ${input.description}`,
  });

  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: 7,
    auto_advance: true,
    // Sans ce paramètre, Stripe exclut par défaut la ligne qu'on vient de
    // créer ci-dessus : la facture se finalise alors vide (0€) et est
    // auto-marquée payée. C'est la cause des anciennes factures de test à 0€.
    pending_invoice_items_behavior: 'include',
    metadata: {
      type: metadataType,
      description: input.description,
      montant_total_ht: String(input.totalAmountEur),
    },
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

  return {
    invoiceId: finalized.id,
    hostedInvoiceUrl: finalized.hosted_invoice_url ?? '',
    invoicePdfUrl: finalized.invoice_pdf ?? '',
    amountEur,
    customerName: customer.name ?? '',
  };
}

/** Facture d'acompte (30 % du montant total HT). */
export async function createDepositInvoice(stripe: Stripe, input: DepositInvoiceInput): Promise<DepositInvoiceResult> {
  const result = await createFractionalInvoice(stripe, input, 0.3, 'acompte_30', 'Acompte 30 %');
  const { amountEur, ...rest } = result;
  return { ...rest, depositAmountEur: amountEur };
}

/** Facture de solde (70 % du montant total HT, à générer quand souhaité). */
export async function createBalanceInvoice(stripe: Stripe, input: DepositInvoiceInput): Promise<BalanceInvoiceResult> {
  const result = await createFractionalInvoice(stripe, input, 0.7, 'solde_70', 'Solde 70 %');
  const { amountEur, ...rest } = result;
  return { ...rest, balanceAmountEur: amountEur };
}

/**
 * Enregistre le paiement d'une facture (acompte ou solde) directement dans
 * les metadata du Customer Stripe correspondant, pour pouvoir voir d'un
 * coup d'œil dans la fiche client qui a payé quoi, sans ouvrir chaque
 * facture. Préserve les metadata existantes (déduplication quiz, etc.) —
 * Stripe remplace tout l'objet metadata à chaque update, jamais un merge.
 */
export async function recordPaymentOnCustomer(
  stripe: Stripe,
  customerId: string,
  kind: 'acompte' | 'solde',
  amountEur: number
): Promise<void> {
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const key = kind === 'acompte' ? 'acompte_paye' : 'solde_paye';
  await stripe.customers.update(customerId, {
    metadata: {
      ...customer.metadata,
      [key]: 'oui',
      [`${key}_le`]: new Date().toISOString().slice(0, 10),
      [`${key}_montant_eur`]: String(amountEur),
    },
  });
}

/**
 * Crée un coupon Stripe à usage unique (15 % de réduction, valable un an) et
 * l'attache directement au Customer : Stripe l'applique alors automatiquement
 * à sa prochaine facture (acompte ou solde) sans action supplémentaire de
 * notre part, puis le retire après cette unique utilisation (duration: 'once').
 * Appelé dès l'envoi de l'email de demande d'avis Google, suite au solde payé.
 */
export async function grantReviewDiscount(stripe: Stripe, customerId: string): Promise<void> {
  const suffixBytes = new Uint8Array(4);
  crypto.getRandomValues(suffixBytes);
  const suffix = Array.from(suffixBytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const coupon = await stripe.coupons.create({
    percent_off: 15,
    duration: 'once',
    max_redemptions: 1,
    redeem_by: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
    name: `Avis Google — ${suffix}`,
  });

  await stripe.customers.update(customerId, { coupon: coupon.id });
}

/**
 * Recherche les factures d'acompte/solde encore impayées dont l'échéance
 * est dépassée et qui n'ont pas déjà reçu de relance, pour la route
 * planifiée (cron) qui envoie un rappel automatique au client.
 */
export async function findOverdueInvoices(stripe: Stripe): Promise<Stripe.Invoice[]> {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const openInvoices = await stripe.invoices.list({ status: 'open', limit: 100 });

  return openInvoices.data.filter((invoice) => {
    const type = invoice.metadata?.type;
    const isOwnInvoice = type === 'acompte_30' || type === 'solde_70';
    const isOverdue = invoice.due_date !== null && invoice.due_date <= nowSeconds;
    const alreadyReminded = invoice.metadata?.relance_envoyee === 'oui';
    return isOwnInvoice && isOverdue && !alreadyReminded;
  });
}

/** Marque une facture comme relancée, pour ne jamais envoyer deux rappels pour la même facture. */
export async function markInvoiceReminded(stripe: Stripe, invoice: Stripe.Invoice): Promise<void> {
  await stripe.invoices.update(invoice.id, {
    metadata: { ...invoice.metadata, relance_envoyee: 'oui' },
  });
}

/**
 * Vérifie la signature d'un événement webhook Stripe et le décode.
 * Utilise un CryptoProvider basé sur SubtleCrypto (Web Crypto API) au lieu
 * du module `crypto` natif de Node, indisponible dans le runtime Workers.
 * Lève une erreur si la signature est invalide (requête non envoyée par Stripe).
 */
export async function verifyWebhookEvent(
  stripe: Stripe,
  payload: string,
  signature: string,
  secret: string
): Promise<Stripe.Event> {
  const cryptoProvider = Stripe.createSubtleCryptoProvider();
  return stripe.webhooks.constructEventAsync(payload, signature, secret, undefined, cryptoProvider);
}
