import type { AccountBilling, AccountType } from './types';

export const FORMES = ['ei', 'sas', 'sarl', 'sa', 'association', 'autre'];

/**
 * Informations nécessaires à l'édition d'un devis et d'une facture.
 * Obligatoires pour valider l'espace client/partenaire. SIRET : optionnel pour un client,
 * obligatoire pour un partenaire (qui est toujours un professionnel).
 */
export function billingErrors(
  type: AccountType,
  nom: string | undefined,
  telephone: string | undefined,
  f: AccountBilling | undefined,
): string[] {
  const errors: string[] = [];
  if (!nom?.trim()) errors.push('nom');
  if (!telephone?.trim() || telephone.replace(/\D/g, '').length < 6) errors.push('telephone');
  if (!f) return [...errors, 'profil', 'rue', 'codePostal', 'ville', 'pays', ...(type === 'partner' ? ['siret'] : [])];
  const profil = type === 'partner' ? 'professionnel' : f.profil;
  if (profil !== 'particulier' && profil !== 'professionnel') errors.push('profil');
  if (profil === 'professionnel' && !f.contact?.trim()) errors.push('contact');
  if (profil === 'professionnel' && !FORMES.includes(f.forme ?? '')) errors.push('forme');
  if (!f.rue?.trim()) errors.push('rue');
  if (!f.codePostal?.trim()) errors.push('codePostal');
  if (!f.ville?.trim()) errors.push('ville');
  if (!f.pays?.trim()) errors.push('pays');
  const siret = (f.siret ?? '').replace(/\s/g, '');
  if (type === 'partner' && !siret) errors.push('siret');
  if (siret && !/^\d{14}$/.test(siret)) errors.push('siret');
  const tva = (f.tvaIntra ?? '').replace(/\s/g, '');
  if (tva && !/^[A-Za-z]{2}[0-9A-Za-z]{2,12}$/.test(tva)) errors.push('tvaIntra');
  return [...new Set(errors)];
}

/** Adresse sur une ligne (compatibilité avec le champ historique `adresse`). */
export function composeAddress(f: AccountBilling): string {
  return [f.rue, [f.codePostal, f.ville].filter(Boolean).join(' '), f.pays].map((s) => (s ?? '').trim()).filter(Boolean).join(', ');
}

/** Nettoie les champs (espaces, SIRET sans espaces, TVA en majuscules). */
export function cleanBilling(type: AccountType, f: AccountBilling): AccountBilling {
  const t = (s: string | undefined): string => (s ?? '').trim().slice(0, 200);
  return {
    profil: type === 'partner' ? 'professionnel' : f.profil,
    contact: t(f.contact) || undefined,
    rue: t(f.rue),
    codePostal: t(f.codePostal),
    ville: t(f.ville),
    pays: t(f.pays),
    forme: type === 'partner' || f.profil === 'professionnel' ? t(f.forme) || undefined : undefined,
    siret: (f.siret ?? '').replace(/\s/g, '') || undefined,
    tvaIntra: (f.tvaIntra ?? '').replace(/\s/g, '').toUpperCase() || undefined,
  };
}
