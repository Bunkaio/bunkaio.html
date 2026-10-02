import type { AccountType, ActivityEntry, Env } from './types';

/** Logo en PNG (les clients mail n'affichent pas le WebP) : carré sombre à coins arrondis, lisible sur l'en-tête noir. */
const LOGO_URL = 'https://bunkaio.com/images/logo-bunkaio-512.png';

/** Langue des emails envoyés aux clients : celle du site au moment de leur demande (metadata Stripe `langue`). */
export type Lang = 'fr' | 'en';
export function normalizeLang(value: unknown): Lang { return value === 'en' ? 'en' : 'fr'; }
const tr = (lang: Lang, fr: string, en: string): string => (lang === 'en' ? en : fr);
const eur = (lang: Lang, n: number): string => (lang === 'en' ? `€${n.toFixed(2)}` : `${n.toFixed(2)} €`);

/** Habillage HTML commun à tous les emails Bunkaio (logo, couleurs, pied de page). */
function emailShell(bodyHtml: string, lang: Lang = 'fr'): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f1fc;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1fc;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#0a0a0c;padding:28px;text-align:center;">
          <img src="${LOGO_URL}" alt="Bunkaio" width="96" height="96" style="display:block;margin:0 auto;border-radius:20px;">
        </td></tr>
        <tr><td style="padding:36px 32px;color:#0a0a0c;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f1ecfa;text-align:center;">
          <p style="margin:0;font-size:12px;color:#76717f;">${tr(lang, 'BUNKAIO — Entreprise Individuelle', 'BUNKAIO — Sole proprietorship')}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const greet = (lang: Lang, name: string): string => (name ? tr(lang, `Bonjour ${name},`, `Hello ${name},`) : tr(lang, 'Bonjour,', 'Hello,'));
const payLineFor = (lang: Lang, amount: number): string => {
  const threeX = (amount / 3).toFixed(2);
  return tr(lang,
    `Soit 3 × ${threeX} € sans frais avec Klarna — ou par carte bancaire, par prélèvement automatique, au choix sur la page de paiement.`,
    `That is 3 × €${threeX} interest-free with Klarna — or by bank card or direct debit, as you prefer on the payment page.`);
};
const btnStyle = 'display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:15px;';

/** Email envoyé au client avec le lien de paiement de l'acompte (remplace l'envoi Stripe bloqué). */
export function buildDepositInvoiceEmail(params: {
  customerName: string;
  description: string;
  depositAmountEur: number;
  hostedInvoiceUrl: string;
  lang?: Lang;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const payLine = payLineFor(lang, params.depositAmountEur);
  const amount = eur(lang, params.depositAmountEur);
  const cancelFr = "<strong>Conditions d'annulation :</strong> cet acompte réserve votre date et votre créneau. Une fois le devis validé, il reste acquis à BUNKAIO et n'est pas remboursé en cas d'annulation de votre part.";
  const cancelEn = '<strong>Cancellation terms:</strong> this deposit secures your date and slot. Once the quote is validated, it is retained by BUNKAIO and is non-refundable if you cancel.';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${tr(lang, "Votre facture d'acompte", 'Your deposit invoice')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${tr(lang, "Voici votre facture d'acompte (30 %) pour :", 'Here is your deposit invoice (30%) for:')} <strong>${params.description}</strong>.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 12px;">${amount}</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 16px;">
      ${payLine}
    </p>
    <p style="font-size:13px;line-height:1.6;color:#3a3544;margin:0 0 28px;padding:12px 14px;background:#f6f1fc;border-radius:6px;">
      ${tr(lang, cancelFr, cancelEn)}
    </p>
    <a href="${params.hostedInvoiceUrl}" style="${btnStyle}">
      ${tr(lang, 'Voir et payer la facture', 'View and pay the invoice')}
    </a>
    <p style="font-size:13px;color:#76717f;margin:28px 0 0;">
      ${tr(lang, 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :', 'If the button does not work, copy this link into your browser:')}<br>
      <a href="${params.hostedInvoiceUrl}" style="color:#76717f;">${params.hostedInvoiceUrl}</a>
    </p>
  `, lang);
  const text = lang === 'en' ? `${greeting}

Here is your deposit invoice (30%) for: ${params.description}.

Amount: ${amount}
${payLine}

Cancellation terms: this deposit secures your date and slot. Once the quote is validated, it is retained by BUNKAIO and is non-refundable if you cancel.

View and pay the invoice: ${params.hostedInvoiceUrl}

— BUNKAIO` : `${greeting}

Voici votre facture d'acompte (30 %) pour : ${params.description}.

Montant : ${amount}
${payLine}

Conditions d'annulation : cet acompte réserve votre date et votre créneau. Une fois le devis validé, il reste acquis à BUNKAIO et n'est pas remboursé en cas d'annulation de votre part.

Voir et payer la facture : ${params.hostedInvoiceUrl}

— BUNKAIO`;
  return { subject: tr(lang, `Bunkaio — Votre facture d'acompte (${amount})`, `Bunkaio — Your deposit invoice (${amount})`), html, text };
}

/** Email envoyé au client avec le lien de paiement du solde (remplace l'envoi Stripe bloqué). */
export function buildBalanceInvoiceEmail(params: {
  customerName: string;
  description: string;
  balanceAmountEur: number;
  hostedInvoiceUrl: string;
  lang?: Lang;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const payLine = payLineFor(lang, params.balanceAmountEur);
  const amount = eur(lang, params.balanceAmountEur);
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${tr(lang, 'Votre facture de solde', 'Your balance invoice')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${tr(lang, 'Voici votre facture de solde (70 %) pour :', 'Here is your balance invoice (70%) for:')} <strong>${params.description}</strong>.
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 12px;">${amount}</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 28px;">
      ${payLine}
    </p>
    <a href="${params.hostedInvoiceUrl}" style="${btnStyle}">
      ${tr(lang, 'Voir et payer la facture', 'View and pay the invoice')}
    </a>
    <p style="font-size:13px;color:#76717f;margin:28px 0 0;">
      ${tr(lang, 'Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :', 'If the button does not work, copy this link into your browser:')}<br>
      <a href="${params.hostedInvoiceUrl}" style="color:#76717f;">${params.hostedInvoiceUrl}</a>
    </p>
  `, lang);
  const text = lang === 'en' ? `${greeting}

Here is your balance invoice (70%) for: ${params.description}.

Amount: ${amount}
${payLine}

View and pay the invoice: ${params.hostedInvoiceUrl}

— BUNKAIO` : `${greeting}

Voici votre facture de solde (70 %) pour : ${params.description}.

Montant : ${amount}
${payLine}

Voir et payer la facture : ${params.hostedInvoiceUrl}

— BUNKAIO`;
  return { subject: tr(lang, `Bunkaio — Votre facture de solde (${amount})`, `Bunkaio — Your balance invoice (${amount})`), html, text };
}

/** Email envoyé au client dès que Stripe confirme le paiement d'une facture (acompte ou solde), via le webhook. */
export function buildPaymentConfirmationEmail(params: {
  customerName: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
  lang?: Lang;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const isDeposit = params.invoiceType === 'acompte';
  const amount = eur(lang, params.amountEur);
  const msgFr = isDeposit
    ? `Nous avons bien reçu votre acompte pour : <strong>${params.description}</strong>. Votre projet est officiellement lancé — nous revenons vers vous prochainement pour la suite.`
    : `Nous avons bien reçu le solde pour : <strong>${params.description}</strong>. Le règlement de votre prestation est désormais complet. Merci pour votre confiance !`;
  const msgEn = isDeposit
    ? `We have received your deposit for: <strong>${params.description}</strong>. Your project is officially under way — we will get back to you shortly with the next steps.`
    : `We have received the balance for: <strong>${params.description}</strong>. Payment for your service is now complete. Thank you for your trust!`;
  const message = tr(lang, msgFr, msgEn);
  const messageText = message.replace(/<[^>]+>/g, '');
  const paidLabel = tr(lang, isDeposit ? 'Acompte (30 %)' : 'Solde (70 %)', isDeposit ? 'Deposit (30%)' : 'Balance (70%)');
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${tr(lang, 'Paiement reçu', 'Payment received')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${message}</p>
    <p style="font-size:24px;font-weight:700;margin:0 0 8px;">${amount}</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 28px;">${paidLabel} ${tr(lang, 'réglé', 'paid')}</p>
    <p style="font-size:15px;line-height:1.6;margin:0;">${tr(lang, "À très vite,<br>L'équipe Bunkaio", 'See you soon,<br>The Bunkaio team')}</p>
  `, lang);
  const text = lang === 'en' ? `${greeting}

${messageText}

Amount paid: ${amount} (${isDeposit ? 'deposit 30%' : 'balance 70%'})

See you soon,
The Bunkaio team` : `${greeting}

${messageText}

Montant réglé : ${amount} (${isDeposit ? 'acompte 30 %' : 'solde 70 %'})

À très vite,
L'équipe Bunkaio`;
  return { subject: tr(lang, `Bunkaio — Paiement reçu (${amount})`, `Bunkaio — Payment received (${amount})`), html, text };
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
  lang?: Lang;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const html = emailShell(`
    <h1 style="font-size:22px;margin:0 0 18px;letter-spacing:-0.01em;">${t('Projet livré.', 'Project delivered.')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${t("Votre prestation est désormais intégralement réglée — votre projet est officiellement achevé. Merci d'avoir fait confiance à Bunkaio pour le mener à bien, du premier échange jusqu'à la livraison finale.",
          'Your service is now fully paid — your project is officially complete. Thank you for trusting Bunkaio to see it through, from our first exchange to final delivery.')}
    </p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 32px;">
      ${t("En signe de reconnaissance pour cette collaboration, un avantage de <strong>15 % vous est dès à présent réservé</strong> sur votre prochaine prestation avec Bunkaio — sans démarche de votre part, il s'appliquera automatiquement.",
          'As a token of appreciation for this collaboration, a <strong>15% benefit is now reserved for you</strong> on your next service with Bunkaio — no action is needed on your part, it will be applied automatically.')}
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="background:#0a0a0c;border-radius:10px;padding:32px 28px;text-align:center;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d9cdf5;margin-bottom:12px;font-family:Helvetica,Arial,sans-serif;">
          ${t('Votre regard compte', 'Your opinion matters')}
        </div>
        <div style="font-size:18px;font-weight:700;color:#ffffff;line-height:1.4;margin-bottom:14px;font-family:Helvetica,Arial,sans-serif;">
          ${t("Votre expérience peut éclairer d'autres porteurs de projet", 'Your experience can guide other project owners')}
        </div>
        <div style="font-size:14px;line-height:1.6;color:rgba(255,255,255,0.6);margin-bottom:24px;">
          ${t("Avant de se lancer, beaucoup hésitent encore. Un retour sincère comme le vôtre peut les aider à avancer avec confiance — et à rejoindre, eux aussi, l'aventure Bunkaio.",
              'Before getting started, many people still hesitate. Honest feedback like yours can help them move forward with confidence — and join the Bunkaio adventure too.')}
        </div>
        <a href="${params.reviewUrl}" style="display:inline-block;background:#ffffff;color:#0a0a0c;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:700;font-size:15px;letter-spacing:0.01em;">
          ${t('Partager mon expérience →', 'Share my experience →')}
        </a>
      </td></tr>
    </table>
    <p style="font-size:15px;line-height:1.6;margin:0;">${t("À très vite,<br>L'équipe Bunkaio", 'See you soon,<br>The Bunkaio team')}</p>
  `, lang);
  const text = lang === 'en' ? `${greeting}

Your service is now fully paid — your project is officially complete. Thank you for trusting Bunkaio to see it through, from our first exchange to final delivery.

As a token of appreciation for this collaboration, a 15% benefit is now reserved for you on your next service with Bunkaio — no action is needed on your part, it will be applied automatically.

YOUR OPINION MATTERS
Your experience can guide other project owners
Before getting started, many people still hesitate. Honest feedback like yours can help them move forward with confidence — and join the Bunkaio adventure too.

Share my experience: ${params.reviewUrl}

See you soon,
The Bunkaio team` : `${greeting}

Votre prestation est désormais intégralement réglée — votre projet est officiellement achevé. Merci d'avoir fait confiance à Bunkaio pour le mener à bien, du premier échange jusqu'à la livraison finale.

En signe de reconnaissance pour cette collaboration, un avantage de 15 % vous est dès à présent réservé sur votre prochaine prestation avec Bunkaio — sans démarche de votre part, il s'appliquera automatiquement.

VOTRE REGARD COMPTE
Votre expérience peut éclairer d'autres porteurs de projet
Avant de se lancer, beaucoup hésitent encore. Un retour sincère comme le vôtre peut les aider à avancer avec confiance — et à rejoindre, eux aussi, l'aventure Bunkaio.

Partager mon expérience : ${params.reviewUrl}

À très vite,
L'équipe Bunkaio`;
  return { subject: t('Bunkaio — Votre projet est officiellement livré', 'Bunkaio — Your project is officially delivered'), html, text };
}

/** Email de rappel envoyé automatiquement (cron) quand une facture d'acompte ou de solde reste impayée après son échéance. */
export function buildOverdueReminderEmail(params: {
  customerName: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
  hostedInvoiceUrl: string;
  lang?: Lang;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const isDeposit = params.invoiceType === 'acompte';
  const label = tr(lang, isDeposit ? "d'acompte (30 %)" : 'de solde (70 %)', isDeposit ? 'deposit (30%)' : 'balance (70%)');
  const amount = eur(lang, params.amountEur);
  const threeX = (params.amountEur / 3).toFixed(2);
  const payLine = tr(lang,
    `Rappel : soit 3 × ${threeX} € sans frais avec Klarna, par carte bancaire ou par prélèvement automatique.`,
    `Reminder: that is 3 × €${threeX} interest-free with Klarna, by bank card or by direct debit.`);
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${tr(lang, 'Petit rappel', 'A quick reminder')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">
      ${tr(lang, `Votre facture ${label} pour : <strong>${params.description}</strong> n'a pas encore été réglée. Vous trouverez ci-dessous le lien pour la payer en ligne.`,
                 `Your ${label} invoice for: <strong>${params.description}</strong> has not been paid yet. You will find the link below to pay it online.`)}
    </p>
    <p style="font-size:24px;font-weight:700;margin:0 0 12px;">${amount}</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 28px;">
      ${payLine}
    </p>
    <a href="${params.hostedInvoiceUrl}" style="${btnStyle}">
      ${tr(lang, 'Voir et payer la facture', 'View and pay the invoice')}
    </a>
    <p style="font-size:13px;color:#76717f;margin:28px 0 0;">
      ${tr(lang, "Si vous avez déjà réglé cette facture ou en cas de question, n'hésitez pas à nous répondre directement.", 'If you have already paid this invoice or have a question, feel free to reply to us directly.')}
    </p>
  `, lang);
  const text = lang === 'en' ? `${greeting}

Your ${label} invoice for: ${params.description} has not been paid yet. Here is the link to pay it online:

${params.hostedInvoiceUrl}

Amount: ${amount}
${payLine}

If you have already paid this invoice or have a question, feel free to reply to us directly.

— BUNKAIO` : `${greeting}

Votre facture ${label} pour : ${params.description} n'a pas encore été réglée. Voici le lien pour la payer en ligne :

${params.hostedInvoiceUrl}

Montant : ${amount}
${payLine}

Si vous avez déjà réglé cette facture ou en cas de question, n'hésitez pas à nous répondre directement.

— BUNKAIO`;
  return { subject: tr(lang, `Bunkaio — Rappel : facture ${label} en attente`, `Bunkaio — Reminder: ${label} invoice pending`), html, text };
}

/** Étape de la frise "prochaines étapes" affichée dans l'email de confirmation du quiz. */
type QuizStep = { title: string; text: string; badge?: string };
const QUIZ_NEXT_STEPS: Record<Lang, QuizStep[]> = {
  fr: [
    { title: 'Réception de votre demande', text: 'Nous analysons les informations transmises dans votre questionnaire.' },
    { title: 'Étude de votre projet', text: 'Nous examinons vos besoins, vos objectifs et les éventuelles contraintes.' },
    { title: 'Prise de contact', text: 'Nous revenons vers vous sous 48h ouvrées pour échanger sur votre projet.', badge: 'SOUS 48H' },
    { title: 'Proposition personnalisée', text: 'Nous vous transmettons une proposition adaptée à vos besoins et à votre budget.' },
    { title: 'Acompte & validation du rendez-vous', text: 'Un acompte de 30% du montant total valide la réservation de votre date de séance.', badge: 'ACOMPTE 30%' },
    { title: 'Séance & livraison', text: "Après la séance, le solde de 70% est à régler à réception de la commande. L'accès à vos fichiers est ouvert dès le règlement effectué.", badge: 'SOLDE 70%' },
  ],
  en: [
    { title: 'Request received', text: 'We are analysing the information provided in your questionnaire.' },
    { title: 'Project review', text: 'We review your needs, your goals and any constraints.' },
    { title: 'Getting in touch', text: 'We get back to you within 48 business hours to discuss your project.', badge: 'WITHIN 48H' },
    { title: 'Personalised proposal', text: 'We send you a proposal tailored to your needs and your budget.' },
    { title: 'Deposit & booking confirmation', text: 'A 30% deposit of the total amount secures your session date.', badge: '30% DEPOSIT' },
    { title: 'Session & delivery', text: 'After the session, the 70% balance is due upon receipt of the order. Access to your files opens once payment is made.', badge: '70% BALANCE' },
  ],
};

/** Frise HTML "prochaines étapes" (fond noir, accents lavande) insérée dans l'email de confirmation du quiz. */
function quizNextStepsHtml(lang: Lang): string {
  const steps = QUIZ_NEXT_STEPS[lang];
  const rows = steps.map((step, i) => {
    const isLast = i === steps.length - 1;
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
          ${tr(lang, 'Les prochaines étapes', 'Next steps')}
        </div>
        <div style="font-size:13px;line-height:1.6;color:rgba(255,255,255,0.55);margin-bottom:26px;">
          ${tr(lang, 'Voici comment votre projet va être traité, étape par étape.', 'Here is how your project will be handled, step by step.')}
        </div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>
    </table>`;
}

/** Email de confirmation envoyé automatiquement après une soumission du quiz. */
export function buildQuizConfirmationEmail(params: { customerName: string; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const intro = tr(lang,
    "Nous avons bien reçu votre demande via le quiz Bunkaio. Chaque projet est étudié individuellement — nous revenons vers vous rapidement s'il correspond à notre ligne éditoriale.",
    'We have received your request via the Bunkaio quiz. Each project is reviewed individually — we get back to you quickly if it matches our editorial line.');
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${tr(lang, 'Merci pour votre demande', 'Thank you for your request')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 28px;">
      ${intro}
    </p>
    ${quizNextStepsHtml(lang)}
    <p style="font-size:15px;line-height:1.6;margin:0;">${tr(lang, "À très vite,<br>L'équipe Bunkaio", 'See you soon,<br>The Bunkaio team')}</p>
  `, lang);
  const stepsText = QUIZ_NEXT_STEPS[lang].map((s, i) => `${i + 1}. ${s.title}${s.badge ? ` (${s.badge})` : ''} — ${s.text}`).join('\n');
  const text = `${greeting}

${intro}

${tr(lang, 'LES PROCHAINES ÉTAPES', 'NEXT STEPS')}
${stepsText}

${tr(lang, "À très vite,\nL'équipe Bunkaio", 'See you soon,\nThe Bunkaio team')}`;
  return { subject: tr(lang, 'Bunkaio — Nous avons bien reçu votre demande', 'Bunkaio — We have received your request'), html, text };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const ACTIVITY_LABELS: Record<ActivityEntry['type'], string> = {
  moodboard: 'Moodboard',
  infos: 'Coordonnées',
  collaboration: 'Collaboration',
  partenariat: 'Profil partenaire',
};

/** Récapitulatif envoyé à l'équipe Bunkaio quand un client/partenaire a modifié son espace. Tout contenu saisi par l'utilisateur est échappé. */
export function buildClientActivityEmail(params: { type: AccountType; email: string; nom?: string; entries: ActivityEntry[] }): { subject: string; html: string; text: string } {
  const who = params.nom?.trim() || params.email;
  const space = params.type === 'partner' ? 'partenaire' : 'client';
  const count = params.entries.length;
  const subject = `Bunkaio — Espace ${space} : ${who} (${count} modification${count > 1 ? 's' : ''})`;
  const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const blocks = params.entries.map((en) => `
    <div style="margin:0 0 18px;padding:14px 16px;background:#f6f1fc;border-radius:6px;">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#76717f;">${escapeHtml(ACTIVITY_LABELS[en.type])} · ${escapeHtml(fmt(en.date))}</p>
      <p style="margin:0;font-size:14px;font-weight:700;">${escapeHtml(en.resume)}</p>
      ${en.details?.length ? `<ul style="margin:8px 0 0;padding-left:18px;font-size:13px;line-height:1.7;color:#3a3544;">${en.details.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');
  const html = emailShell(`
    <h1 style="margin:0 0 6px;font-size:20px;">Espace ${space} mis à jour</h1>
    <p style="margin:0 0 22px;font-size:14px;color:#3a3544;"><strong>${escapeHtml(who)}</strong> — ${escapeHtml(params.email)}</p>
    ${blocks}
    <p style="margin:24px 0 0;font-size:13px;"><a href="https://bunkaio.com/admin/comptes.html" style="color:#0a0a0c;">Ouvrir la fiche dans l'admin</a></p>`);
  const text = `Espace ${space} mis à jour — ${who} (${params.email})\n\n` + params.entries.map((en) =>
    `[${ACTIVITY_LABELS[en.type]} · ${fmt(en.date)}] ${en.resume}` + (en.details?.length ? '\n' + en.details.map((d) => `  - ${d}`).join('\n') : '')).join('\n\n') +
    '\n\nFiche : https://bunkaio.com/admin/comptes.html';
  return { subject, html, text };
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
