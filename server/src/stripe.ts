import Stripe from 'stripe';
import type { QuizLeadPayload, UpsertResult } from './types';

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

/**
 * Crée un Customer Stripe à partir d'une soumission de quiz, ou met à jour
 * le Customer existant si un client partage déjà cet email (déduplication).
 *
 * Conçu pour être réutilisé tel quel par de futures routes (devis, facture,
 * réservation) : ces routes pourront chercher le Customer par email avec la
 * même logique avant de créer une Quote/Invoice Stripe associée.
 */
export async function upsertQuizCustomer(
  stripe: Stripe,
  payload: QuizLeadPayload
): Promise<UpsertResult> {
  const metadata = buildMetadata(payload);

  const existing = await stripe.customers.list({ email: payload.email, limit: 1 });
  const match = existing.data[0];

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
