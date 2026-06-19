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

/** Email envoyé au client dès que Stripe confirme le paiement d'une facture (acompte ou solde), via le webhook. */
export function buildPaymentConfirmationEmail(params: {
  customerName: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
}): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const isDeposit = params.invoiceType === 'acompte';
  const message = isDeposit
    ? `Nous avons bien reçu votre acompte pour : <strong>${params.description}</strong>. Votre projet est officiellement lancé — nous revenons vers vous prochainement pour la suite.`
    : `Nous avons bien reçu le solde pour : <strong>${params.description}</strong>. Le règlement de votre prestation est désormais complet. Merci pour votre confiance !`;
  const messageText = isDeposit
    ? `Nous avons bien reçu votre acompte pour : ${params.description}. Votre projet est officiellement lancé — nous revenons vers vous prochainement pour la suite.`
    : `Nous avons bien reçu le solde pour : ${params.description}. Le règlement de votre prestation est désormais complet. Merci pour votre confiance !`;
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Paiement reçu</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${message}</p>
    <p style="font-size:24px;font-weight:700;margin:0 0 8px;">${params.amountEur.toFixed(2)} €</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 28px;">${isDeposit ? 'Acompte (30 %)' : 'Solde (70 %)'} réglé</p>
    <p style="font-size:15px;line-height:1.6;margin:0;">À très vite,<br>L'équipe Bunkaio</p>
  `);
  const text = `${greeting}

${messageText}

Montant réglé : ${params.amountEur.toFixed(2)} € (${isDeposit ? 'acompte 30 %' : 'solde 70 %'})

À très vite,
L'équipe Bunkaio`;
  return { subject: `Bunkaio — Paiement reçu (${params.amountEur.toFixed(2)} €)`, html, text };
}

/** Notification interne envoyée à l'administratrice dès qu'un paiement (acompte ou solde) est confirmé par Stripe. */
export function buildAdminPaymentNotificationEmail(params: {
  customerName: string;
  customerEmail: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
  invoiceId: string;
}): { subject: string; html: string; text: string } {
  const label = params.invoiceType === 'acompte' ? 'Acompte (30 %)' : 'Solde (70 %)';
  const lines = [
    `Client : ${params.customerName || '(sans nom)'} <${params.customerEmail}>`,
    `Projet : ${params.description}`,
    `Type : ${label}`,
    `Montant réglé : ${params.amountEur.toFixed(2)} €`,
    `Facture Stripe : ${params.invoiceId}`,
  ];
  const html = `<p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#0a0a0c;">
    💰 <strong>Paiement reçu</strong><br><br>
    ${lines.join('<br>')}
  </p>`;
  const text = `Paiement reçu\n\n${lines.join('\n')}`;
  return { subject: `💰 Paiement reçu — ${params.customerName || params.customerEmail} (${label})`, html, text };
}

/** Email demandant un avis Google, envoyé automatiquement une fois le solde (70 %) payé — projet entièrement réglé. */
export function buildReviewRequestEmail(params: {
  customerName: string;
  googleReviewUrl: string;
}): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Merci pour votre confiance !</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Votre prestation est désormais entièrement réglée — un grand merci pour votre confiance tout au long du projet.
      Si vous avez apprécié votre expérience avec Bunkaio, un avis ne prend que deux minutes et nous aide énormément.
    </p>
    <a href="${params.googleReviewUrl}" style="display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:15px;">
      Laisser un avis Google
    </a>
    <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">
      Pour vous remercier, <strong>15 % de réduction</strong> seront automatiquement appliqués sur votre prochaine prestation avec Bunkaio.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:20px 0 0;">À très vite,<br>L'équipe Bunkaio</p>
  `);
  const text = `${greeting}

Votre prestation est désormais entièrement réglée — un grand merci pour votre confiance tout au long du projet. Si vous avez apprécié votre expérience avec Bunkaio, un avis ne prend que deux minutes et nous aide énormément.

Laisser un avis Google : ${params.googleReviewUrl}

Pour vous remercier, 15 % de réduction seront automatiquement appliqués sur votre prochaine prestation avec Bunkaio.

À très vite,
L'équipe Bunkaio`;
  return { subject: 'Bunkaio — Merci pour votre confiance !', html, text };
}

/** Email de rappel envoyé automatiquement (cron) quand une facture d'acompte ou de solde reste impayée après son échéance. */
export function buildOverdueReminderEmail(params: {
  customerName: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
  hostedInvoiceUrl: string;
}): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const label = params.invoiceType === 'acompte' ? "d'acompte (30 %)" : 'de solde (70 %)';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Petit rappel</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Votre facture ${label} pour : <strong>${params.description}</strong> n'a pas encore été réglée.
      Vous trouverez ci-dessous le lien pour la payer en ligne.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 28px;">${params.amountEur.toFixed(2)} €</p>
    <a href="${params.hostedInvoiceUrl}" style="display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:15px;">
      Voir et payer la facture
    </a>
    <p style="font-size:13px;color:#76717f;margin:28px 0 0;">
      Si vous avez déjà réglé cette facture ou en cas de question, n'hésitez pas à nous répondre directement.
    </p>
  `);
  const text = `${greeting}

Votre facture ${label} pour : ${params.description} n'a pas encore été réglée. Voici le lien pour la payer en ligne :

${params.hostedInvoiceUrl}

Montant : ${params.amountEur.toFixed(2)} €

Si vous avez déjà réglé cette facture ou en cas de question, n'hésitez pas à nous répondre directement.

— BUNKAIO`;
  return { subject: `Bunkaio — Rappel : facture ${label} en attente`, html, text };
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
