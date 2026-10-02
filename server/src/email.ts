import type { AccountType, ActivityEntry, Env } from './types';

const SITE = 'https://bunkaio.com';
/** Logo officiel (clair, fond transparent, PNG car les clients mail n'affichent pas le WebP) : posé sur fond noir. */
const LOGO_URL = `${SITE}/images/logo-email.png`;
/** Police du site (DM Sans, auto-hébergée). Les clients mail qui ne chargent pas les polices web (Gmail, Outlook) retombent sur Helvetica/Arial. */
const FONT_URL = `${SITE}/fonts/dm-sans-latin-opsz-normal.woff2`;
export const VAT_FR = 'TVA non applicable, art. 293 B du CGI';
export const VAT_EN = 'VAT not applicable, art. 293 B of the French Tax Code';
const FONT = "'DM Sans',Helvetica,Arial,sans-serif";

/** Langue des emails envoyés aux clients : celle du site au moment de leur demande (metadata Stripe `langue`). */
export type Lang = 'fr' | 'en';
export type Space = 'client' | 'partner';
export function normalizeLang(value: unknown): Lang { return value === 'en' ? 'en' : 'fr'; }
const tr = (lang: Lang, fr: string, en: string): string => (lang === 'en' ? en : fr);
const eur = (lang: Lang, n: number): string => (lang === 'en' ? `€${n.toFixed(2)}` : `${n.toFixed(2).replace('.', ',')} €`);

/** Signature unique, identique dans tous les emails (logo officiel, coordonnées, mentions légales). */
function signatureHtml(lang: Lang): string {
  const mute = 'color:rgba(255,255,255,0.62);';
  const link = 'color:#d9cdf5;text-decoration:none;';
  return `
        <tr><td style="background:#0a0a0c;padding:30px 32px 26px;">
          <img src="${LOGO_URL}" alt="Bunkaio" width="104" style="display:block;margin:0 0 18px;border:0;">
          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#ffffff;font-family:${FONT};">Aya Nascimento</p>
          <p style="margin:0 0 14px;font-size:13px;${mute}font-family:${FONT};">${tr(lang, 'Photographe professionnelle · Fondatrice de BUNKAIO', 'Professional photographer · Founder of BUNKAIO')}</p>
          <p style="margin:0 0 4px;font-size:13px;line-height:1.7;${mute}font-family:${FONT};">
            <a href="tel:+33758573161" style="${link}">07 58 57 31 61</a> · <a href="mailto:contact@bunkaio.com" style="${link}">contact@bunkaio.com</a><br>
            <a href="${SITE}" style="${link}">bunkaio.com</a> · <a href="https://instagram.com/bunkaio" style="${link}">Instagram @bunkaio</a>
          </p>
          <p style="margin:0 0 16px;font-size:12px;line-height:1.7;${mute}font-family:${FONT};">${tr(lang, 'Montpellier · Béziers · Toulouse — du lundi au samedi, 9h–18h', 'Montpellier · Béziers · Toulouse — Monday to Saturday, 9am–6pm')}</p>
          <p style="margin:0;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.4);font-family:${FONT};">${tr(lang, 'BUNKAIO — Entreprise Individuelle · SIRET 951 547 587 00034', 'BUNKAIO — Sole proprietorship · SIRET 951 547 587 00034')}<br>${tr(lang, VAT_FR, VAT_EN)}</p>
        </td></tr>`;
}
function signatureText(lang: Lang): string {
  return `Aya Nascimento
${tr(lang, 'Photographe professionnelle · Fondatrice de BUNKAIO', 'Professional photographer · Founder of BUNKAIO')}
07 58 57 31 61 · contact@bunkaio.com · bunkaio.com · Instagram @bunkaio
${tr(lang, 'Montpellier · Béziers · Toulouse — du lundi au samedi, 9h–18h', 'Montpellier · Béziers · Toulouse — Monday to Saturday, 9am–6pm')}
BUNKAIO — ${tr(lang, 'Entreprise Individuelle', 'Sole proprietorship')} · SIRET 951 547 587 00034
${tr(lang, VAT_FR, VAT_EN)}`;
}
/** Remplace la signature de fin de texte par la signature unique. */
function finalize(lang: Lang, mail: { subject: string; html: string; text: string }): { subject: string; html: string; text: string } {
  const body = mail.text.replace(/\n+(?:— BUNKAIO|À très vite,\nL'équipe Bunkaio|See you soon,\nThe Bunkaio team)\s*$/, '').replace(/\s+$/, '');
  return { ...mail, text: `${body}\n\n${tr(lang, 'À très vite,', 'See you soon,')}\n\n${signatureText(lang)}` };
}

/** Habillage HTML commun à tous les emails Bunkaio (logo, police du site, signature unique). */
function emailShell(bodyHtml: string, lang: Lang = 'fr'): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
@font-face { font-family: 'DM Sans'; font-style: normal; font-weight: 100 1000; src: url('${FONT_URL}') format('woff2'); }
body, table, td, p, h1, div, span, a { font-family: ${FONT}; }
</style></head>
<body style="margin:0;padding:0;background:#f6f1fc;font-family:${FONT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1fc;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr><td style="background:#0a0a0c;padding:30px 32px;text-align:center;">
          <img src="${LOGO_URL}" alt="Bunkaio" width="150" style="display:block;margin:0 auto;border:0;">
        </td></tr>
        <tr><td style="padding:36px 32px 30px;color:#0a0a0c;font-family:${FONT};">
          ${bodyHtml}
        </td></tr>${signatureHtml(lang)}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Bloc « votre espace » (client ou partenaire), adapté à l'étape du parcours où l'email est envoyé. */
type Stage = 'access' | 'quote' | 'deposit' | 'balance' | 'delivered' | 'invoice';
function spaceCopy(lang: Lang, space: Space, stage: Stage): { title: string; body: string; button: string } {
  const client = space === 'client';
  const T = (fr: string, en: string): string => tr(lang, fr, en);
  const btn = client ? T('Accéder à mon espace client', 'Go to my client area') : T('Accéder à mon espace partenaire', 'Go to my partner area');
  if (stage === 'access') return {
    title: T('Ce que vous y trouverez', 'What you will find there'),
    body: client
      ? T("Votre moodboard (direction artistique, ambiance, palette, inspirations), l'avancement de votre projet, vos devis, factures et paiements, et vos photos HD dans « Mon portfolio » une fois votre projet livré.",
          'Your moodboard (art direction, mood, palette, inspiration), your project’s progress, your quotes, invoices and payments, and your HD photos under “My portfolio” once your project is delivered.')
      : T("Votre tarif partenaire permanent (-20 %), vos promotions, votre réseau, vos collaborations, vos moodboards et l'avancement de votre projet.",
          'Your permanent partner rate (-20%), your promotions, your network, your collaborations, your moodboards and your project’s progress.'),
    button: btn };
  if (stage === 'quote') return client
    ? { title: T('Votre espace client', 'Your client area'),
        body: T("Dès que votre devis est confirmé, vous recevez votre code d'accès personnel. Votre espace client vous permet de créer votre moodboard (direction artistique, ambiance, palette, inspirations), de suivre l'avancement de votre projet, de retrouver vos devis, factures et paiements, et de récupérer vos photos HD dans votre galerie privée.",
                'As soon as your quote is confirmed, you receive your personal access code. Your client area lets you build your moodboard (art direction, mood, palette, inspiration), follow your project’s progress, find your quotes, invoices and payments, and collect your HD photos from your private gallery.'), button: T('Découvrir mon espace client', 'Discover my client area') }
    : { title: T('Votre espace partenaire', 'Your partner area'),
        body: T("Votre espace partenaire réunit votre tarif partenaire permanent (-20 %), vos promotions, votre réseau, vos collaborations et vos moodboards. Vous y suivez aussi l'avancement de votre projet.",
                'Your partner area brings together your permanent partner rate (-20%), your promotions, your network, your collaborations and your moodboards. You also follow your project’s progress there.'), button: T('Découvrir mon espace partenaire', 'Discover my partner area') };
  if (stage === 'deposit') return {
    title: T('Prochaine étape : votre moodboard', 'Next step: your moodboard'),
    body: client
      ? T("Une fois l'acompte réglé, votre date est réservée. Connectez-vous à votre espace client avec votre code d'accès pour créer votre moodboard avant le shooting : direction artistique, ambiance, palette de couleurs, inspirations. Vous y suivez aussi l'avancement de votre projet. Code perdu ? Répondez simplement à cet email.",
          'Once the deposit is paid, your date is booked. Sign in to your client area with your access code to build your moodboard before the shoot: art direction, mood, colour palette, inspiration. You also follow your project’s progress there. Lost your code? Simply reply to this email.')
      : T("Une fois l'acompte réglé, votre date est réservée. Dans votre espace partenaire, créez votre moodboard avant le shooting et retrouvez votre tarif partenaire (-20 %), vos promotions et vos collaborations. Code perdu ? Répondez simplement à cet email.",
          'Once the deposit is paid, your date is booked. In your partner area, build your moodboard before the shoot and find your partner rate (-20%), your promotions and your collaborations. Lost your code? Simply reply to this email.'),
    button: btn };
  if (stage === 'balance') return {
    title: T('Vos photos, juste après le règlement', 'Your photos, right after payment'),
    body: T("L'accès à vos fichiers HD s'ouvre dès le règlement du solde : vous les retrouvez dans votre espace, rubrique « Mon portfolio » (galerie privée Adobe Lightroom). Vos factures et paiements y restent consultables à tout moment.",
            'Access to your HD files opens as soon as the balance is paid: you will find them in your area, under “My portfolio” (private Adobe Lightroom gallery). Your invoices and payments also remain available there at any time.'),
    button: btn };
  if (stage === 'delivered') return {
    title: T('Vos photos vous attendent', 'Your photos are waiting for you'),
    body: T("Retrouvez vos photos HD dans votre espace, rubrique « Mon portfolio » (galerie privée Adobe Lightroom), à télécharger quand vous le souhaitez. Vos devis, factures et paiements restent disponibles dans « Mes factures » et « Mes paiements ».",
            'Find your HD photos in your area, under “My portfolio” (private Adobe Lightroom gallery), ready to download whenever you like. Your quotes, invoices and payments remain available under “My invoices” and “My payments”.'),
    button: btn };
  return {
    title: T('Retrouvez vos factures', 'Find your invoices'),
    body: T('Toutes vos factures et vos paiements sont aussi consultables dans votre espace, rubrique « Mes factures ».', 'All your invoices and payments can also be viewed in your area, under “My invoices”.'),
    button: btn };
}
function spaceBlock(lang: Lang, space: Space | undefined, stage: Stage): string {
  const sp = space ?? 'client';
  const c = spaceCopy(lang, sp, stage);
  const url = `${SITE}/connexion/`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 24px;">
      <tr><td style="background:#f6f1fc;border-radius:10px;padding:22px 22px 20px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6e5aa8;margin-bottom:8px;font-family:${FONT};">${tr(lang, sp === 'client' ? 'Votre espace client' : 'Votre espace partenaire', sp === 'client' ? 'Your client area' : 'Your partner area')}</div>
        <div style="font-size:16px;font-weight:700;color:#0a0a0c;margin-bottom:8px;font-family:${FONT};">${c.title}</div>
        <div style="font-size:13.5px;line-height:1.65;color:#3a3544;margin-bottom:16px;font-family:${FONT};">${c.body}</div>
        <a href="${url}" style="display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:11px 20px;border-radius:4px;font-weight:600;font-size:13.5px;font-family:${FONT};">${c.button} →</a>
      </td></tr>
    </table>`;
}
function spaceText(lang: Lang, space: Space | undefined, stage: Stage): string {
  const c = spaceCopy(lang, space ?? 'client', stage);
  return `${c.title.toUpperCase()}\n${c.body}\n${c.button} : ${SITE}/connexion/`;
}

/** Délais réels du catalogue (config du site) : 3 à 10 jours ouvrés selon la formule, comptés à partir du shooting. */
const deliveryNote = (lang: Lang): string => tr(lang,
  'Délai de livraison : celui indiqué sur votre formule (de 3 à 10 jours ouvrés selon la formule), à compter de la date du shooting.',
  'Delivery time: the one stated on your package (3 to 10 working days depending on the package), counted from the shoot date.');
const greet = (lang: Lang, name: string): string => (name ? tr(lang, `Bonjour ${name},`, `Hello ${name},`) : tr(lang, 'Bonjour,', 'Hello,'));
const payLineFor = (lang: Lang, amount: number): string => {
  const threeX = (amount / 3).toFixed(2);
  const threeXFr = threeX.replace('.', ',');
  return tr(lang,
    `Soit 3 × ${threeXFr} € sans frais avec Klarna — ou par carte bancaire, par prélèvement automatique, au choix sur la page de paiement.`,
    `That is 3 × €${threeX} interest-free with Klarna — or by bank card or direct debit, as you prefer on the payment page.`);
};
const btnStyle = 'display:inline-block;background:#0a0a0c;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:4px;font-weight:600;font-size:15px;';


/** Encadré « comment fonctionne votre album Lightroom » : rassure sur la démarche et rappelle les droits cédés. */
function lightroomExplainer(lang: Lang): { html: string; text: string } {
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const title = t('Comment accéder à vos photos', 'How to access your photos');
  const points = [
    t("Une seule démarche : créer un compte Adobe Lightroom pour ouvrir votre album privé. Rien d'autre à faire.", 'One simple step: create an Adobe Lightroom account to open your private album. Nothing else to do.'),
    t("Vous accédez à vos photos dès la fin de la post-production. Elle reste interactive : des ajustements peuvent être apportés si nécessaire.", 'You access your photos as soon as post-production is complete. It stays interactive: adjustments can be made if needed.'),
    t("Vous exportez vos visuels dans les formats de votre choix, en toute autonomie.", 'You export your visuals in the formats you choose, on your own.'),
    t("L'accès à votre album et l'usage de vos visuels suivent les droits cédés négociés dans votre devis signé.", 'Access to your album and the use of your visuals follow the assigned rights negotiated in your signed quote.'),
  ];
  const lis = points.map((p) => `<li style="margin:0 0 8px;">${p}</li>`).join('');
  const html = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;">
      <tr><td style="background:#f6f1fc;border-radius:10px;padding:20px 22px 12px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#6e5aa8;margin-bottom:10px;font-family:${FONT};">${title}</div>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13.5px;line-height:1.65;color:#3a3544;font-family:${FONT};">${lis}</ul>
      </td></tr>
    </table>`;
  return { html, text: `${title.toUpperCase()}\n${points.map((p) => `- ${p}`).join('\n')}` };
}

/** Email envoyé au client avec le lien de paiement de l'acompte (remplace l'envoi Stripe bloqué). */
export function buildDepositInvoiceEmail(params: {
  customerName: string;
  description: string;
  depositAmountEur: number;
  hostedInvoiceUrl: string;
  lang?: Lang;
  space?: Space;
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
    ${spaceBlock(lang, params.space, 'deposit')}
  `, lang);
  const text = lang === 'en' ? `${greeting}

Here is your deposit invoice (30%) for: ${params.description}.

Amount: ${amount}
${payLine}

Cancellation terms: this deposit secures your date and slot. Once the quote is validated, it is retained by BUNKAIO and is non-refundable if you cancel.

View and pay the invoice: ${params.hostedInvoiceUrl}

${spaceText(lang, params.space, 'deposit')}` : `${greeting}

Voici votre facture d'acompte (30 %) pour : ${params.description}.

Montant : ${amount}
${payLine}

Conditions d'annulation : cet acompte réserve votre date et votre créneau. Une fois le devis validé, il reste acquis à BUNKAIO et n'est pas remboursé en cas d'annulation de votre part.

Voir et payer la facture : ${params.hostedInvoiceUrl}

${spaceText(lang, params.space, 'deposit')}`;
  return finalize(lang, { subject: tr(lang, `Bunkaio — Votre facture d'acompte (${amount})`, `Bunkaio — Your deposit invoice (${amount})`), html, text });
}

/** « Vos photos sont prêtes » : envoyé à la création de la facture de solde. Le paiement du solde ouvre l'accès à l'album Lightroom. */
export function buildBalanceInvoiceEmail(params: {
  customerName: string;
  description: string;
  balanceAmountEur: number;
  hostedInvoiceUrl: string;
  lang?: Lang;
  space?: Space;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const payLine = payLineFor(lang, params.balanceAmountEur);
  const amount = eur(lang, params.balanceAmountEur);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const intro = t(`Bonne nouvelle : la post-production de votre projet <strong>${params.description}</strong> est terminée et vos photos sont prêtes.`,
    `Good news: post-production on your project <strong>${params.description}</strong> is complete and your photos are ready.`);
  const how = t("Pour y accéder, il suffit de régler le solde (70 %) de votre commande. Dès le paiement confirmé, vous recevez immédiatement par email le lien vers votre album.",
    'To access them, simply pay the balance (70%) of your order. As soon as payment is confirmed, you immediately receive the link to your album by email.');
  const lr = lightroomExplainer(lang);
  const html = emailShell(`
    <h1 style="font-size:22px;margin:0 0 16px;">${t('Vos photos sont prêtes', 'Your photos are ready')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${intro}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${how}</p>
    <p style="font-size:24px;font-weight:700;margin:0 0 12px;">${amount}</p>
    <p style="font-size:13px;color:#76717f;margin:0 0 24px;">${payLine}</p>
    <a href="${params.hostedInvoiceUrl}" style="${btnStyle}">${t('Régler le solde et accéder à mes photos', 'Pay the balance and access my photos')}</a>
    <p style="font-size:13px;color:#76717f;margin:20px 0 0;">${t('Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :', 'If the button does not work, copy this link into your browser:')}<br><a href="${params.hostedInvoiceUrl}" style="color:#76717f;">${params.hostedInvoiceUrl}</a></p>
    ${lr.html}
    ${spaceBlock(lang, params.space, 'balance')}
  `, lang);
  const text = `${greeting}

${intro.replace(/<[^>]+>/g, '')}

${how}

${t('Montant', 'Amount')} : ${amount}
${payLine}

${t('Régler le solde et accéder à mes photos', 'Pay the balance and access my photos')} : ${params.hostedInvoiceUrl}

${lr.text}

${spaceText(lang, params.space, 'balance')}`;
  return finalize(lang, { subject: t(`Bunkaio — Vos photos sont prêtes (solde ${amount})`, `Bunkaio — Your photos are ready (balance ${amount})`), html, text });
}

/** Email envoyé au client dès que Stripe confirme le paiement d'une facture (acompte ou solde), via le webhook. */
export function buildPaymentConfirmationEmail(params: {
  customerName: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
  lang?: Lang;
  space?: Space;
  /** Séance déjà planifiée dans l'espace du client (acompte uniquement). */
  seance?: SeanceInfo;
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
    <p style="font-size:13px;color:#76717f;margin:0 0 ${isDeposit ? '20px' : '28px'};">${paidLabel} ${tr(lang, 'réglé', 'paid')}</p>
    ${isDeposit ? (params.seance ? seanceCard(lang, params.seance) : `<p style="font-size:13px;line-height:1.6;color:#3a3544;margin:0 0 12px;">${tr(lang, 'La date, l\'heure et le lieu exacts de votre séance vous sont confirmés par email.', 'The exact date, time and location of your session will be confirmed to you by email.')}</p>`) : ''}
    ${isDeposit ? `<p style="font-size:13px;line-height:1.6;color:#3a3544;margin:0 0 8px;padding:12px 14px;background:#f6f1fc;border-radius:6px;">${deliveryNote(lang)}</p>` : ''}
    ${spaceBlock(lang, params.space, isDeposit ? 'deposit' : 'delivered')}
  `, lang);
  const text = lang === 'en' ? `${greeting}

${messageText}

Amount paid: ${amount} (${isDeposit ? 'deposit 30%' : 'balance 70%'})
${isDeposit ? '\n' + (params.seance ? seanceCardText(lang, params.seance) : tr(lang, "La date, l'heure et le lieu exacts de votre séance vous sont confirmés par email.", 'The exact date, time and location of your session will be confirmed to you by email.')) + '\n' : ''}${isDeposit ? '\n' + deliveryNote(lang) + '\n' : ''}
${spaceText(lang, params.space, isDeposit ? 'deposit' : 'delivered')}` : `${greeting}

${messageText}

Montant réglé : ${amount} (${isDeposit ? 'acompte 30 %' : 'solde 70 %'})
${isDeposit ? '\n' + (params.seance ? seanceCardText(lang, params.seance) : tr(lang, "La date, l'heure et le lieu exacts de votre séance vous sont confirmés par email.", 'The exact date, time and location of your session will be confirmed to you by email.')) + '\n' : ''}${isDeposit ? '\n' + deliveryNote(lang) + '\n' : ''}
${spaceText(lang, params.space, isDeposit ? 'deposit' : 'delivered')}`;
  return finalize(lang, { subject: tr(lang, `Bunkaio — Paiement reçu (${amount})`, `Bunkaio — Payment received (${amount})`), html, text });
}

/** Notification interne envoyée à l'administratrice dès qu'un paiement (acompte ou solde) est confirmé par Stripe. */
export function buildAdminPaymentNotificationEmail(params: {
  customerName: string;
  customerEmail: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
  invoiceId: string;
  /** Solde payé mais aucun lien Lightroom dans le compte : le client n'a pas reçu son accès. */
  lightroomMissing?: boolean;
}): { subject: string; html: string; text: string } {
  const label = params.invoiceType === 'acompte' ? 'Acompte (30 %)' : 'Solde (70 %)';
  const lines = [
    `Client : ${params.customerName || '(sans nom)'} <${params.customerEmail}>`,
    `Projet : ${params.description}`,
    `Type : ${label}`,
    `Montant réglé : ${params.amountEur.toFixed(2)} €`,
    `Facture Stripe : ${params.invoiceId}`,
    ...(params.lightroomMissing ? ['⚠ ACTION REQUISE : aucun lien Lightroom dans le compte — le client n\'a PAS reçu son accès. Saisis le lien dans admin/comptes puis coche « Envoyer le mail d\'accès aux photos ».'] : []),
  ];
  const html = `<p style="font-family:${FONT};font-size:14px;line-height:1.6;color:#0a0a0c;">
    💰 <strong>Paiement reçu</strong><br><br>
    ${lines.join('<br>')}
  </p>`;
  const text = `Paiement reçu\n\n${lines.join('\n')}`;
  return { subject: `💰 Paiement reçu — ${params.customerName || params.customerEmail} (${label})`, html, text };
}

/** Email de rappel envoyé automatiquement (cron) quand une facture d'acompte ou de solde reste impayée après son échéance. */
export function buildOverdueReminderEmail(params: {
  customerName: string;
  description: string;
  amountEur: number;
  invoiceType: 'acompte' | 'solde';
  hostedInvoiceUrl: string;
  lang?: Lang;
  space?: Space;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const isDeposit = params.invoiceType === 'acompte';
  const label = tr(lang, isDeposit ? "d'acompte (30 %)" : 'de solde (70 %)', isDeposit ? 'deposit (30%)' : 'balance (70%)');
  const amount = eur(lang, params.amountEur);
  const threeX = (params.amountEur / 3).toFixed(2);
  const payLine = tr(lang,
    `Rappel : soit 3 × ${threeX.replace('.', ',')} € sans frais avec Klarna, par carte bancaire ou par prélèvement automatique.`,
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
    ${spaceBlock(lang, params.space, 'invoice')}
  `, lang);
  const text = lang === 'en' ? `${greeting}

Your ${label} invoice for: ${params.description} has not been paid yet. Here is the link to pay it online:

${params.hostedInvoiceUrl}

Amount: ${amount}
${payLine}

If you have already paid this invoice or have a question, feel free to reply to us directly.

${spaceText(lang, params.space, 'invoice')}` : `${greeting}

Votre facture ${label} pour : ${params.description} n'a pas encore été réglée. Voici le lien pour la payer en ligne :

${params.hostedInvoiceUrl}

Montant : ${amount}
${payLine}

Si vous avez déjà réglé cette facture ou en cas de question, n'hésitez pas à nous répondre directement.

${spaceText(lang, params.space, 'invoice')}`;
  return finalize(lang, { subject: tr(lang, `Bunkaio — Rappel : facture ${label} en attente`, `Bunkaio — Reminder: ${label} invoice pending`), html, text });
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
      ? `<span style="display:inline-block;margin-left:8px;font-size:10px;font-weight:700;letter-spacing:0.05em;color:#0a0a0c;background:#f1ecfa;border-radius:100px;padding:3px 9px;vertical-align:middle;font-family:${FONT};">${step.badge}</span>`
      : '';
    return `
      <tr>
        <td width="34" valign="top" style="padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td align="center" style="width:28px;height:28px;border-radius:50%;border:1.5px solid rgba(241,236,250,0.4);color:#f1ecfa;font-family:${FONT};font-size:13px;font-weight:700;">${i + 1}</td>${connector}
          </tr></table>
        </td>
        <td style="padding:0 0 ${isLast ? '0' : '22px'} 14px;" valign="top">
          <div style="${badge ? 'margin-bottom:3px;' : `font-size:14px;font-weight:700;color:#ffffff;margin-bottom:3px;font-family:${FONT};`}">${
            badge
              ? `<span style="font-size:14px;font-weight:700;color:#ffffff;font-family:${FONT};">${step.title}</span>${badge}`
              : step.title
          }</div>
          <div style="font-size:13px;line-height:1.55;color:rgba(255,255,255,0.55);">${step.text}</div>
        </td>
      </tr>`;
  }).join('');

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr><td style="background:#0a0a0c;border-radius:10px;padding:30px 26px 26px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d9cdf5;margin-bottom:9px;font-family:${FONT};">
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
export function buildQuizConfirmationEmail(params: { customerName: string; lang?: Lang; space?: Space }): { subject: string; html: string; text: string } {
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
    ${spaceBlock(lang, params.space, 'quote')}
  `, lang);
  const stepsText = QUIZ_NEXT_STEPS[lang].map((s, i) => `${i + 1}. ${s.title}${s.badge ? ` (${s.badge})` : ''} — ${s.text}`).join('\n');
  const text = `${greeting}

${intro}

${tr(lang, 'LES PROCHAINES ÉTAPES', 'NEXT STEPS')}
${stepsText}

${spaceText(lang, params.space, 'quote')}`;
  return finalize(lang, { subject: tr(lang, 'Bunkaio — Nous avons bien reçu votre demande', 'Bunkaio — We have received your request'), html, text });
}

/** Email « vos accès » : envoyé quand l'admin crée un compte et coche l'envoi (le code n'est connu qu'à ce moment, il n'est jamais stocké en clair). */
export function buildAccessCodeEmail(params: { customerName: string; email: string; code: string; space: Space; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const client = params.space === 'client';
  const area = tr(lang, client ? 'espace client' : 'espace partenaire', client ? 'client area' : 'partner area');
  const url = `${SITE}/connexion/`;
  const intro = tr(lang,
    `Votre ${area} BUNKAIO est prêt. Voici vos identifiants de connexion personnels.`,
    `Your BUNKAIO ${area} is ready. Here are your personal login details.`);
  const labelEmail = tr(lang, 'Email', 'Email');
  const labelCode = tr(lang, "Code d'accès", 'Access code');
  const keep = tr(lang, "Conservez ce code précieusement. En cas de perte, répondez simplement à cet email : nous vous en enverrons un nouveau.", 'Keep this code safe. If you lose it, simply reply to this email and we will send you a new one.');
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${tr(lang, `Vos accès à votre ${area}`, `Your ${area} access`)}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr><td style="background:#0a0a0c;border-radius:10px;padding:22px 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#d9cdf5;margin-bottom:6px;font-family:${FONT};">${labelEmail}</div>
        <div style="font-size:15px;color:#ffffff;margin-bottom:16px;font-family:${FONT};">${escapeHtml(params.email)}</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#d9cdf5;margin-bottom:6px;font-family:${FONT};">${labelCode}</div>
        <div style="font-size:24px;font-weight:700;letter-spacing:0.12em;color:#ffffff;font-family:${FONT};">${escapeHtml(params.code)}</div>
      </td></tr>
    </table>
    <p style="font-size:13px;line-height:1.6;color:#76717f;margin:0 0 24px;">${keep}</p>
    <a href="${url}" style="${btnStyle}">${tr(lang, 'Me connecter', 'Sign in')}</a>
    ${spaceBlock(lang, params.space, 'access')}
  `, lang);
  const text = `${greeting}

${intro}

${labelEmail} : ${params.email}
${labelCode} : ${params.code}

${keep}

${tr(lang, 'Me connecter', 'Sign in')} : ${url}

${spaceText(lang, params.space, 'access')}`;
  return finalize(lang, { subject: tr(lang, `Bunkaio — Vos accès à votre ${area}`, `Bunkaio — Your ${area} access`), html, text });
}

/** Bloc « votre avis + remise de -15 % » inséré dans le mail d'accès aux photos (le client réagit à chaud). */
function reviewBlock(lang: Lang, reviewUrl: string): { html: string; text: string } {
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const head = t('Votre regard compte', 'Your opinion matters');
  const title = t("Vous aimez vos photos ? Dites-le en 1 minute", 'Happy with your photos? Tell us in 1 minute');
  const body = t("Avant de se lancer, beaucoup hésitent encore. Votre retour sincère aide d'autres porteurs de projet à avancer avec confiance.", 'Before getting started, many people still hesitate. Your honest feedback helps other project owners move forward with confidence.');
  const offerTitle = t('-15 % sur votre prochaine prestation', '-15% on your next service');
  const offer = t("Votre remise de 15 % est déjà réservée et s'appliquera automatiquement à votre prochaine prestation avec Bunkaio. Elle ne dépend pas de votre avis : c'est notre façon de vous remercier de votre confiance.", 'Your 15% discount is already reserved and will be applied automatically to your next service with Bunkaio. It does not depend on your review: it is our way of thanking you for your trust.');
  const btn = t('Partager mon expérience →', 'Share my experience →');
  const html = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;">
      <tr><td style="background:#0a0a0c;border-radius:10px;padding:28px 26px;text-align:center;">
        <div style="display:inline-block;background:#f1ecfa;color:#0a0a0c;font-size:22px;font-weight:700;border-radius:100px;padding:8px 20px;margin-bottom:12px;font-family:${FONT};">-15 %</div>
        <div style="font-size:17px;font-weight:700;color:#ffffff;margin-bottom:8px;font-family:${FONT};">${offerTitle}</div>
        <div style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,0.65);margin-bottom:24px;font-family:${FONT};">${offer}</div>
        <div style="height:1px;background:rgba(255,255,255,0.15);margin:0 0 22px;"></div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d9cdf5;margin-bottom:10px;font-family:${FONT};">${head}</div>
        <div style="font-size:17px;font-weight:700;color:#ffffff;line-height:1.4;margin-bottom:10px;font-family:${FONT};">${title}</div>
        <div style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,0.65);margin-bottom:22px;font-family:${FONT};">${body}</div>
        <a href="${reviewUrl}" style="display:inline-block;background:#ffffff;color:#0a0a0c;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:700;font-size:15px;font-family:${FONT};">${btn}</a>
      </td></tr>
    </table>`;
  const text = `${offerTitle.toUpperCase()}\n${offer}\n\n${head.toUpperCase()}\n${title}\n${body}\n${btn.replace(' →', '')} : ${reviewUrl}`;
  return { html, text };
}

/** Accès aux photos : envoyé dès le solde payé (ou renvoyé depuis l'admin), avec le lien d'album Lightroom permanent. */
export function buildPhotosReadyEmail(params: { customerName: string; lightroomUrl: string; space: Space; lang?: Lang; amountEur?: number; reviewUrl: string }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const paid = params.amountEur !== undefined ? t(`Votre solde de ${eur(lang, params.amountEur)} est bien réglé, merci !`, `Your balance of ${eur(lang, params.amountEur)} is paid, thank you!`) : '';
  const intro = t("Votre album est ouvert : vous pouvez dès maintenant consulter vos photos et les exporter dans les formats de votre choix.", 'Your album is now open: you can view your photos right away and export them in the formats you choose.');
  const perm = t("Ce lien est permanent : vous le retrouvez à tout moment dans votre espace, rubrique « Mon portfolio ».", 'This link is permanent: you can find it at any time in your area, under “My portfolio”.');
  const lr = lightroomExplainer(lang);
  const rv = reviewBlock(lang, params.reviewUrl);
  const html = emailShell(`
    <h1 style="font-size:22px;margin:0 0 16px;">${t('Votre album est accessible', 'Your album is open')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    ${paid ? `<p style="font-size:15px;line-height:1.6;margin:0 0 12px;">${paid}</p>` : ''}
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">${intro}</p>
    <a href="${params.lightroomUrl}" style="${btnStyle}">${t('Accéder à mes photos', 'Access my photos')}</a>
    <p style="font-size:13px;line-height:1.6;color:#76717f;margin:20px 0 0;">${perm}</p>
    ${rv.html}
    ${lr.html}
    ${spaceBlock(lang, params.space, 'delivered')}
  `, lang);
  const text = `${greeting}

${paid ? paid + '\n\n' : ''}${intro}

${t('Accéder à mes photos', 'Access my photos')} : ${params.lightroomUrl}

${perm}

${rv.text}

${lr.text}

${spaceText(lang, params.space, 'delivered')}`;
  return finalize(lang, { subject: t('Bunkaio — Votre album photo est accessible', 'Bunkaio — Your photo album is open'), html, text });
}

/** Remerciement envoyé le lendemain de la séance, avec la date de livraison estimée si elle est connue. */
export function buildAfterSessionEmail(params: { customerName: string; livraison?: string; space?: Space; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const thanks = t("Merci pour cette séance, c'était un plaisir de travailler avec vous. La post-production (tri, retouche) démarre maintenant.", 'Thank you for this session, it was a pleasure working with you. Post-production (selection, retouching) starts now.');
  const delay = params.livraison
    ? t(`Vos photos seront prêtes autour du <strong>${fmtDate('fr', params.livraison)}</strong>.`, `Your photos will be ready around <strong>${fmtDate('en', params.livraison)}</strong>.`)
    : t("Vos photos seront prêtes dans le délai indiqué sur votre formule (de 3 à 10 jours ouvrés selon la formule), à compter de la date du shooting.", 'Your photos will be ready within the time stated on your package (3 to 10 working days depending on the package), counted from the shoot date.');
  const next = t("Dès qu'elles sont prêtes, vous recevez un email avec le lien pour régler le solde (70 %) : le paiement ouvre aussitôt l'accès à votre album Lightroom privé.", 'As soon as they are ready, you receive an email with the link to pay the balance (70%): payment immediately opens access to your private Lightroom album.');
  const lr = lightroomExplainer(lang);
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Merci pour votre séance', 'Thank you for your session')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${thanks}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${delay}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">${next}</p>
    ${lr.html}
    ${spaceBlock(lang, params.space, 'balance')}
  `, lang);
  const text = `${greeting}\n\n${thanks}\n\n${delay.replace(/<[^>]+>/g, '')}\n\n${next}\n\n${lr.text}\n\n${spaceText(lang, params.space, 'balance')}`;
  return finalize(lang, { subject: t('Bunkaio — Merci pour votre séance', 'Bunkaio — Thank you for your session'), html, text });
}

/** Alerte interne : une livraison arrive à échéance (ou un point reste à traiter). */
export function buildAdminAlertEmail(params: { subject: string; lines: string[] }): { subject: string; html: string; text: string } {
  const html = `<p style="font-family:${FONT};font-size:14px;line-height:1.6;color:#0a0a0c;">${params.lines.map(escapeHtml).join('<br>')}</p>`;
  return { subject: params.subject, html, text: params.lines.join('\n') };
}

const fmtDate = (lang: Lang, iso: string): string => {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};

/** Carte « détails de la séance » (date, heure, lieu, prestation). */
function seanceCard(lang: Lang, s: SeanceInfo): string {
  const rows: Array<[string, string]> = [[tr(lang, 'Date', 'Date'), fmtDate(lang, s.date)]];
  if (s.heure) rows.push([tr(lang, 'Heure', 'Time'), s.heure]);
  if (s.lieu) rows.push([tr(lang, 'Lieu', 'Location'), s.lieu]);
  if (s.prestation) rows.push([tr(lang, 'Prestation', 'Service'), s.prestation]);
  const cells = rows.map(([k, v]) => `<tr><td style="padding:6px 0;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#d9cdf5;width:110px;vertical-align:top;font-family:${FONT};">${k}</td><td style="padding:6px 0;font-size:15px;color:#ffffff;font-family:${FONT};">${escapeHtml(v)}</td></tr>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:#0a0a0c;border-radius:10px;padding:18px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cells}</table></td></tr></table>`;
}
const seanceCardText = (lang: Lang, s: SeanceInfo): string => [
  `${tr(lang, 'Date', 'Date')} : ${fmtDate(lang, s.date)}`,
  s.heure ? `${tr(lang, 'Heure', 'Time')} : ${s.heure}` : '',
  s.lieu ? `${tr(lang, 'Lieu', 'Location')} : ${s.lieu}` : '',
  s.prestation ? `${tr(lang, 'Prestation', 'Service')} : ${s.prestation}` : '',
].filter(Boolean).join('\n');

export interface SeanceInfo { date: string; heure?: string; lieu?: string; prestation?: string }

/** Emails liés à la séance : confirmation, rappel J-2, report, annulation. */
export function buildSeanceEmail(params: {
  kind: 'confirmation' | 'reminder' | 'report' | 'cancel';
  customerName: string;
  seance: SeanceInfo;
  /** Pour un report : la nouvelle date/heure/lieu. */
  newSeance?: SeanceInfo;
  motif?: string;
  space?: Space;
  lang?: Lang;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const phone = '07 58 57 31 61';
  const motif = params.motif ? escapeHtml(params.motif) : '';
  let title: string; let subject: string; let intro: string; let card: SeanceInfo | undefined = params.seance; let after = ''; let afterText = ''; let stage: Stage | null = null;
  if (params.kind === 'confirmation') {
    title = t('Votre séance est confirmée', 'Your session is confirmed');
    subject = t('Bunkaio — Votre séance est confirmée', 'Bunkaio — Your session is confirmed');
    intro = t('Voici les informations de votre séance. Vous recevrez un rappel deux jours avant.', 'Here are the details of your session. You will receive a reminder two days before.');
    stage = 'deposit';
  } else if (params.kind === 'reminder') {
    title = t('Votre séance approche', 'Your session is coming up');
    subject = t('Bunkaio — Rappel : votre séance dans 2 jours', 'Bunkaio — Reminder: your session in 2 days');
    intro = t('Petit rappel : votre séance a lieu dans deux jours. Voici les informations à garder sous la main.', 'A quick reminder: your session takes place in two days. Here are the details to keep handy.');
    after = t(`Un imprévu ou une question ? Appelez-nous au ${phone} ou répondez simplement à cet email.`, `An unexpected change or a question? Call us on ${phone} or simply reply to this email.`);
    stage = 'deposit';
  } else if (params.kind === 'report') {
    title = t('Votre séance est reportée', 'Your session has been rescheduled');
    subject = t('Bunkaio — Votre séance est reportée', 'Bunkaio — Your session has been rescheduled');
    intro = t('Votre séance est reportée. Voici la nouvelle date, qui remplace la précédente.', 'Your session has been rescheduled. Here is the new date, which replaces the previous one.');
    card = params.newSeance ?? params.seance;
    after = motif ? t(`Motif : ${motif}`, `Reason: ${motif}`) : '';
  } else {
    title = t('Votre séance est annulée', 'Your session has been cancelled');
    subject = t('Bunkaio — Annulation de votre séance', 'Bunkaio — Your session has been cancelled');
    intro = t("Nous vous confirmons l'annulation de la séance suivante :", 'We confirm the cancellation of the following session:');
    after = (motif ? t(`Motif : ${motif}. `, `Reason: ${motif}. `) : '') + t("Pour toute question (acompte, nouvelle date), répondez simplement à cet email : nous trouverons la meilleure solution avec vous.", 'For any question (deposit, new date), simply reply to this email: we will find the best solution with you.');
  }
  const afterHtml = after ? `<p style="font-size:14px;line-height:1.6;color:#3a3544;margin:0 0 8px;">${after}</p>` : '';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${title}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    ${seanceCard(lang, card)}
    ${afterHtml}
    ${stage ? spaceBlock(lang, params.space, stage) : ''}
  `, lang);
  const text = `${greeting}

${intro}

${seanceCardText(lang, card)}
${after ? '\n' + after.replace(/<[^>]+>/g, '') + '\n' : ''}${stage ? '\n' + spaceText(lang, params.space, stage) : ''}`;
  void afterText;
  return finalize(lang, { subject, html, text });
}

/** Accusé de réception des formulaires du site (contact, collaboration, candidature partenaire, demande d'espace). */
export function buildAcknowledgementEmail(params: {
  kind: 'contact' | 'collab' | 'partner' | 'account';
  customerName: string;
  space?: Space;
  lang?: Lang;
}): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const copy = {
    contact: { title: t('Nous avons bien reçu votre message', 'We have received your message'),
      subject: t('Bunkaio — Nous avons bien reçu votre message', 'Bunkaio — We have received your message'),
      body: t("Merci de nous avoir écrit. Votre message est bien arrivé et nous vous répondons dans les meilleurs délais (du lundi au samedi, 9h–18h).", 'Thank you for writing to us. Your message has arrived and we will reply as soon as possible (Monday to Saturday, 9am–6pm).') },
    collab: { title: t('Nous avons bien reçu votre proposition', 'We have received your proposal'),
      subject: t('Bunkaio — Nous avons bien reçu votre proposition de collaboration', 'Bunkaio — We have received your collaboration proposal'),
      body: t("Merci pour votre proposition de collaboration. Chaque projet est étudié individuellement : s'il correspond à notre ligne éditoriale, nous revenons vers vous.", 'Thank you for your collaboration proposal. Each project is reviewed individually: if it matches our editorial line, we will get back to you.') },
    partner: { title: t('Nous avons bien reçu votre candidature', 'We have received your application'),
      subject: t('Bunkaio — Nous avons bien reçu votre candidature partenaire', 'Bunkaio — We have received your partner application'),
      body: t("Merci pour votre candidature au réseau de partenaires BUNKAIO. Nous l'étudions avec attention et revenons vers vous. Si elle est retenue, votre espace partenaire est créé et vos accès vous sont envoyés par email.", 'Thank you for applying to the BUNKAIO partner network. We are reviewing it carefully and will get back to you. If it is accepted, your partner area is created and your login details are sent to you by email.') },
    account: { title: t("Votre demande d'espace est bien reçue", 'Your area request has been received'),
      subject: t("Bunkaio — Nous avons bien reçu votre demande d'espace", 'Bunkaio — We have received your area request'),
      body: t("Merci pour votre demande. Votre espace est créé par notre équipe, puis votre code d'accès personnel vous est envoyé par email.", 'Thank you for your request. Your area is created by our team, then your personal access code is sent to you by email.') },
  }[params.kind];
  const block = params.kind === 'partner' ? spaceBlock(lang, 'partner', 'quote') : params.kind === 'account' ? spaceBlock(lang, params.space, 'access') : '';
  const blockText = params.kind === 'partner' ? '\n\n' + spaceText(lang, 'partner', 'quote') : params.kind === 'account' ? '\n\n' + spaceText(lang, params.space, 'access') : '';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${copy.title}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">${copy.body}</p>
    ${block}
  `, lang);
  return finalize(lang, { subject: copy.subject, html, text: `${greeting}\n\n${copy.body}${blockText}` });
}

/** Relance unique si le prospect n'a pas donné suite à son devis. */
export function buildQuoteFollowUpEmail(params: { customerName: string; space?: Space; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const body = t(
    "Nous revenons vers vous au sujet de votre demande de devis. Avez-vous eu le temps d'y réfléchir ? Si vous avez la moindre question, ou si vous souhaitez ajuster le projet (formule, options, date), répondez simplement à cet email : nous en discutons avec plaisir.",
    'We are following up on your quote request. Have you had time to think it over? If you have any question, or if you would like to adjust the project (package, options, date), simply reply to this email: we will be happy to discuss it.');
  const body2 = t("Pour réserver votre date, l'acompte de 30 % valide votre créneau.", 'To book your date, a 30% deposit secures your slot.');
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Où en êtes-vous de votre projet ?', 'How is your project coming along?')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${body}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">${body2}</p>
    ${spaceBlock(lang, params.space, 'quote')}
  `, lang);
  return finalize(lang, { subject: t('Bunkaio — Où en est votre projet ?', 'Bunkaio — How is your project coming along?'), html, text: `${greeting}\n\n${body}\n\n${body2}\n\n${spaceText(lang, params.space, 'quote')}` });
}

/** Rappel envoyé quand l'acompte est réglé mais le moodboard n'a pas été créé. */
export function buildMoodboardReminderEmail(params: { customerName: string; space?: Space; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const body = t(
    "Votre acompte est bien enregistré et votre date est réservée. Il vous reste une étape pour que votre séance soit parfaitement préparée : créer votre moodboard. Quelques minutes suffisent pour nous partager votre vision (direction artistique, ambiance, palette, inspirations).",
    'Your deposit is registered and your date is booked. One step remains to prepare your session perfectly: creating your moodboard. A few minutes is all it takes to share your vision (art direction, mood, palette, inspiration).');
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Votre moodboard vous attend', 'Your moodboard is waiting')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">${body}</p>
    ${spaceBlock(lang, params.space, 'deposit')}
  `, lang);
  return finalize(lang, { subject: t('Bunkaio — Créez votre moodboard avant la séance', 'Bunkaio — Create your moodboard before the session'), html, text: `${greeting}\n\n${body}\n\n${spaceText(lang, params.space, 'deposit')}` });
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
