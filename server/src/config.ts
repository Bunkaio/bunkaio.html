/**
 * Adresse légale de l'entreprise : volontairement absente du dépôt (public) et du site.
 * Elle est injectée au runtime via la variable/secret Cloudflare BUSINESS_ADDRESS
 * (`npx wrangler secret put BUSINESS_ADDRESS`) et n'apparaît que sur les emails et les factures.
 */
let businessAddress = '';

export function configureBusiness(env: { BUSINESS_ADDRESS?: string }): void {
  businessAddress = (env.BUSINESS_ADDRESS ?? '').trim();
}

export function getBusinessAddress(): string {
  return businessAddress;
}
