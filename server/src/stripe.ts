import Stripe from 'stripe';
import type { DepositInvoiceInput, DepositInvoiceResult, QuizLeadPayload, UpsertResult } from './types';

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
 * Crée une facture Stripe pour l'acompte de 30 % (modalité de paiement déjà
 * annoncée sur le site), pour un Customer déjà existant (créé via le quiz).
 * Utilisée par la route /create-deposit-invoice, appelée depuis la page
 * d'administration (admin/index.html).
 *
 * La facture est finalisée (ce qui génère son lien de paiement hébergé par
 * Stripe) mais n'est volontairement PAS envoyée via `stripe.invoices.sendInvoice` :
 * cette action est bloquée sur ce compte ("This invoice cannot be sent right
 * now"). L'email au client est envoyé séparément par le Worker lui-même
 * (voir email.ts), avec le lien généré ici.
 */
export async function createDepositInvoice(
  stripe: Stripe,
  input: DepositInvoiceInput
): Promise<DepositInvoiceResult> {
  const customer = await findCustomerByEmail(stripe, input.email);
  if (!customer) {
    throw new Error('customer_not_found');
  }

  const depositAmountEur = Math.round(input.totalAmountEur * 0.3 * 100) / 100;

  await stripe.invoiceItems.create({
    customer: customer.id,
    currency: 'eur',
    amount: Math.round(depositAmountEur * 100),
    description: `Acompte 30 % — ${input.description}`,
  });

  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: 'send_invoice',
    days_until_due: 7,
    auto_advance: true,
    // Sans ce paramètre, Stripe exclut par défaut la ligne d'acompte qu'on
    // vient de créer ci-dessus : la facture se finalise alors vide (0€) et
    // est auto-marquée payée. C'est la cause des anciennes factures de test
    // à 0€.
    pending_invoice_items_behavior: 'include',
    metadata: {
      type: 'acompte_30',
      description: input.description,
      montant_total_ht: String(input.totalAmountEur),
    },
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

  return {
    invoiceId: finalized.id,
    hostedInvoiceUrl: finalized.hosted_invoice_url ?? '',
    invoicePdfUrl: finalized.invoice_pdf ?? '',
    depositAmountEur,
    customerName: customer.name ?? '',
  };
}
