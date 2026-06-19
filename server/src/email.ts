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
  const threeX = (params.depositAmountEur / 3).toFixed(2);
  const payLine = `Soit 3 × ${threeX} € sans frais avec Klarna — ou par carte bancaire, par prélèvement automatique, au choix sur la page de paiement.`;
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Votre facture d'acompte</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Voici votre facture d'acompte (30 %) pour : <strong>${params.description}</strong>.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 12px;">${params.depositAmountEur.toFixed(2)} €</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 28px;">
      ${payLine}
    </p>
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
${payLine}

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
  const threeX = (params.balanceAmountEur / 3).toFixed(2);
  const payLine = `Soit 3 × ${threeX} € sans frais avec Klarna — ou par carte bancaire, par prélèvement automatique, au choix sur la page de paiement.`;
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Votre facture de solde</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Voici votre facture de solde (70 %) pour : <strong>${params.description}</strong>.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 12px;">${params.balanceAmountEur.toFixed(2)} €</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 28px;">
      ${payLine}
    </p>
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
${payLine}

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
  reviewUrl: string;
}): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Merci pour votre confiance !</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Votre prestation est désormais entièrement réglée — un grand merci pour votre confiance tout au long du projet.
      Pour vous remercier, <strong>15 % de réduction</strong> seront automatiquement appliqués sur votre prochaine prestation avec Bunkaio.
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Si vous avez apprécié votre expérience avec Bunkaio, un avis ne prend que deux minutes et nous aide énormément.
    </p>
    <a href="${params.reviewUrl}" style="display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:15px;">
      Laisser un avis Google
    </a>
    <p style="font-size:15px;line-height:1.6;margin:28px 0 0;">À très vite,<br>L'équipe Bunkaio</p>
  `);
  const text = `${greeting}

Votre prestation est désormais entièrement réglée — un grand merci pour votre confiance tout au long du projet. Pour vous remercier, 15 % de réduction seront automatiquement appliqués sur votre prochaine prestation avec Bunkaio.

Si vous avez apprécié votre expérience avec Bunkaio, un avis ne prend que deux minutes et nous aide énormément.

Laisser un avis Google : ${params.reviewUrl}

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
  const threeX = (params.amountEur / 3).toFixed(2);
  const payLine = `Rappel : soit 3 × ${threeX} € sans frais avec Klarna, par carte bancaire ou par prélèvement automatique.`;
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Petit rappel</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      Votre facture ${label} pour : <strong>${params.description}</strong> n'a pas encore été réglée.
      Vous trouverez ci-dessous le lien pour la payer en ligne.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 12px;">${params.amountEur.toFixed(2)} €</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 28px;">
      ${payLine}
    </p>
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
${payLine}

Si vous avez déjà réglé cette facture ou en cas de question, n'hésitez pas à nous répondre directement.

— BUNKAIO`;
  return { subject: `Bunkaio — Rappel : facture ${label} en attente`, html, text };
}

/** Email de confirmation envoyé automatiquement après une soumission du quiz. */
/** Étape de la frise "prochaines étapes" affichée dans l'email de confirmation du quiz. */
const QUIZ_NEXT_STEPS: { title: string; text: string; badge?: string }[] = [
  { title: 'Réception de votre demande', text: 'Nous analysons les informations transmises dans votre questionnaire.' },
  { title: 'Étude de votre projet', text: 'Nous examinons vos besoins, vos objectifs et les éventuelles contraintes.' },
  { title: 'Prise de contact', text: 'Nous revenons vers vous sous 48h ouvrées pour échanger sur votre projet.', badge: 'SOUS 48H' },
  { title: 'Proposition personnalisée', text: 'Nous vous transmettons une proposition adaptée à vos besoins et à votre budget.' },
  { title: 'Acompte & validation du rendez-vous', text: 'Un acompte de 30% du montant total valide la réservation de votre date de séance.', badge: 'ACOMPTE 30%' },
  { title: 'Séance & livraison', text: 'Après la séance, le solde de 70% est à régler à réception de la commande. L\'accès à vos fichiers est ouvert dès le règlement effectué.', badge: 'SOLDE 70%' },
];

/** Frise HTML "prochaines étapes" (fond noir, accents lavande) insérée dans l'email de confirmation du quiz. */
function quizNextStepsHtml(): string {
  const rows = QUIZ_NEXT_STEPS.map((step, i) => {
    const isLast = i === QUIZ_NEXT_STEPS.length - 1;
    const connector = isLast ? '' : `
      </tr><tr>
        <td align="center" style="padding:3px 0;"><div style="width:1px;height:28px;background:rgba(241,236,250,0.22);margin:0 auto;"></div></td>`;
    const badge = step.badge
      ? `<span style="display:inline-block;margin-left:8px;font-size:10px;font-weight:700;letter-spacing:0.05em;color:#0a0a0c;background:#f1ecfa;border-radius:100px;padding:3px 9px;vertical-align:middle;font-family:Helvetica,Arial,sans-serif;">${step.badge}</span>`
      : '';
    return `
      <tr>
        <td width="34" valign="top" style="padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="width:28px;height:28px;border-radius:50%;border:1.5px solid rgba(241,236,250,0.4);color:#f1ecfa;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;">${i + 1}</td>${connector}
          </tr></table>
        </td>
        <td style="padding:0 0 ${isLast ? '0' : '22px'} 14px;" valign="top">
          <div style="${badge ? 'margin-bottom:3px;' : 'font-size:14px;font-weight:700;color:#ffffff;margin-bottom:3px;font-family:Helvetica,Arial,sans-serif;'}">${
            badge
              ? `<span style="font-size:14px;font-weight:700;color:#ffffff;font-family:Helvetica,Arial,sans-serif;">${step.title}</span>${badge}`
              : step.title
          }</div>
          <div style="font-size:13px;line-height:1.55;color:rgba(255,255,255,0.55);">${step.text}</div>
        </td>
      </tr>`;
  }).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="background:#0a0a0c;border-radius:10px;padding:30px 26px 26px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d9cdf5;margin-bottom:9px;font-family:Helvetica,Arial,sans-serif;">
          Les prochaines étapes
        </div>
        <div style="font-size:13px;line-height:1.6;color:rgba(255,255,255,0.55);margin-bottom:26px;">
          Voici comment votre projet va être traité, étape par étape.
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>
    </table>`;
}

export function buildQuizConfirmationEmail(params: { customerName: string }): { subject: string; html: string; text: string } {
  const greeting = params.customerName ? `Bonjour ${params.customerName},` : 'Bonjour,';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">Merci pour votre demande</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 28px;">
      Nous avons bien reçu votre demande via le quiz Bunkaio. Chaque projet est étudié individuellement —
      nous revenons vers vous rapidement s'il correspond à notre ligne éditoriale.
    </p>
    ${quizNextStepsHtml()}
    <p style="font-size:15px;line-height:1.6;margin:0;">À très vite,<br>L'équipe Bunkaio</p>
  `);
  const stepsText = QUIZ_NEXT_STEPS.map((s, i) => `${i + 1}. ${s.title}${s.badge ? ` (${s.badge})` : ''} — ${s.text}`).join('\n');
  const text = `${greeting}

Nous avons bien reçu votre demande via le quiz Bunkaio. Chaque projet est étudié individuellement — nous revenons vers vous rapidement s'il correspond à notre ligne éditoriale.

LES PROCHAINES ÉTAPES
${stepsText}

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
