import type { Env } from './types';

const LOGO_URL = 'https://bunkaio.com/images/logo.png';

/** Habillage HTML commun à tous les emails Bunkaio (logo, couleurs, pied de page). */
function emailShell(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f1fc;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1fc;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#0a0a0c;padding:32px;text-align:center;">
          <img src="${LOGO_URL}" alt="Bunkaio" width="160" style="display:block;margin:0 auto;">
        </td></tr>
        <tr><td style="padding:36px 32px;color:#0a0a0c;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f1ecfa;text-align:center;">
          <p style="margin:0;font-size:12px;color:#76717f;">BUNKAIO — Entreprise Individuelle</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Email envoyé au client avec le lien de paiement de l'acompte (remplace l'envoi Stripe bloqué). */
export function buildDepositInvoiceEmail(params: {
  customerName: string;
  description: string;
  depositAmountEur: number;
  hostedInvoiceUrl: string;
}): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Votre facture d'acompte</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Voici votre facture d'acompte (30 %) pour : <strong>${params.description}</strong>.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 28px;">${params.depositAmountEur.toFixed(2)} €</p>
    <a href="${params.hostedInvoiceUrl}" style="display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:15px;">
      Voir et payer la facture
    </a>
    <p style="font-size:13px;color:#76717f;margin:28px 0 0;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <a href="${params.hostedInvoiceUrl}" style="color:#76717f;">${params.hostedInvoiceUrl}</a>
    </p>
  `);
  const text = `${greeting}

Voici votre facture d'acompte (30 %) pour : ${params.description}.

Montant : ${params.depositAmountEur.toFixed(2)} €

Voir et payer la facture : ${params.hostedInvoiceUrl}

— BUNKAIO`;
  return { subject: `Bunkaio — Votre facture d'acompte (${params.depositAmountEur.toFixed(2)} €)`, html, text };
}

/** Email envoyé au client avec le lien de paiement du solde (remplace l'envoi Stripe bloqué). */
export function buildBalanceInvoiceEmail(params: {
  customerName: string;
  description: string;
  balanceAmountEur: number;
  hostedInvoiceUrl: string;
}): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Votre facture de solde</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Voici votre facture de solde (70 %) pour : <strong>${params.description}</strong>.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 28px;">${params.balanceAmountEur.toFixed(2)} €</p>
    <a href="${params.hostedInvoiceUrl}" style="display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:15px;">
      Voir et payer la facture
    </a>
    <p style="font-size:13px;color:#76717f;margin:28px 0 0;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <a href="${params.hostedInvoiceUrl}" style="color:#76717f;">${params.hostedInvoiceUrl}</a>
    </p>
  `);
  const text = `${greeting}

Voici votre facture de solde (70 %) pour : ${params.description}.

Montant : ${params.balanceAmountEur.toFixed(2)} €

Voir et payer la facture : ${params.hostedInvoiceUrl}

— BUNKAIO`;
  return { subject: `Bunkaio — Votre facture de solde (${params.balanceAmountEur.toFixed(2)} €)`, html, text };
}

/** Email de confirmation envoyé automatiquement après une soumission du quiz. */
export function buildQuizConfirmationEmail(params: { customerName: string }): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Merci pour votre demande</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Nous avons bien reçu votre demande via le quiz Bunkaio. Chaque projet est étudié individuellement —
      nous revenons vers vous rapidement s'il correspond à notre ligne éditoriale.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0;">À très vite,<br>L'équipe Bunkaio</p>
  `);
  const text = `${greeting}

Nous avons bien reçu votre demande via le quiz Bunkaio. Chaque projet est étudié individuellement — nous revenons vers vous rapidement s'il correspond à notre ligne éditoriale.

À très vite,
L'équipe Bunkaio`;
  return { subject: 'Bunkaio — Nous avons bien reçu votre demande', html, text };
}

/** Envoie un email transactionnel via l'API Resend (https://resend.com). */
export async function sendEmail(env: Env, to: string, subject: string, html: string, text: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html, text }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`resend_error: ${res.status} ${detail}`);
  }
}
