import { getBusinessAddress } from './config';
import type { AccountType, ActivityEntry, Env } from './types';
import { LOGO_CID, LOGO_PNG_BASE64 } from './logo-inline';

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
          <img src="${LOGO_URL}" alt="BUNKAIO" width="104" height="47" style="display:block;margin:0 0 18px;border:0;color:#ffffff;font-family:${FONT};font-size:18px;font-weight:700;letter-spacing:0.14em;">
          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#ffffff;font-family:${FONT};">Aya Nascimento</p>
          <p style="margin:0 0 14px;font-size:13px;${mute}font-family:${FONT};">${tr(lang, 'Photographe professionnelle · Fondatrice de BUNKAIO', 'Professional photographer · Founder of BUNKAIO')}</p>
          <p style="margin:0 0 4px;font-size:13px;line-height:1.7;${mute}font-family:${FONT};">
            <a href="tel:+33758573161" style="${link}">07 58 57 31 61</a> · <a href="mailto:contact@bunkaio.com" style="${link}">contact@bunkaio.com</a><br>
            <a href="${SITE}" style="${link}">bunkaio.com</a> · <a href="https://instagram.com/bunkaio" style="${link}">Instagram @bunkaio</a>
          </p>
          <p style="margin:0 0 16px;font-size:12px;line-height:1.7;${mute}font-family:${FONT};">${tr(lang, 'Montpellier · Toulouse — du lundi au samedi, 9h–18h', 'Montpellier · Toulouse — Monday to Saturday, 9am–6pm')}</p>
          <p style="margin:0;font-size:11px;line-height:1.6;color:rgba(255,255,255,0.4);font-family:${FONT};">${tr(lang, 'BUNKAIO — Entreprise Individuelle · SIRET 951 547 587 00034', 'BUNKAIO — Sole proprietorship · SIRET 951 547 587 00034')}${getBusinessAddress() ? `<br>${escapeHtml(getBusinessAddress())}` : ''}<br>${tr(lang, VAT_FR, VAT_EN)}</p>
        </td></tr>`;
}
function signatureText(lang: Lang): string {
  return `Aya Nascimento
${tr(lang, 'Photographe professionnelle · Fondatrice de BUNKAIO', 'Professional photographer · Founder of BUNKAIO')}
07 58 57 31 61 · contact@bunkaio.com · bunkaio.com · Instagram @bunkaio
${tr(lang, 'Montpellier · Toulouse — du lundi au samedi, 9h–18h', 'Montpellier · Toulouse — Monday to Saturday, 9am–6pm')}
BUNKAIO — ${tr(lang, 'Entreprise Individuelle', 'Sole proprietorship')} · SIRET 951 547 587 00034${getBusinessAddress() ? `\n${getBusinessAddress()}` : ''}
${tr(lang, VAT_FR, VAT_EN)}`;
}
/** Remplace la signature de fin de texte par la signature unique. */
function finalize(lang: Lang, mail: { subject: string; html: string; text: string; tpl?: string }): { subject: string; html: string; text: string } {
  const body = mail.text.replace(/\n+(?:— BUNKAIO|À très vite,\nL'équipe Bunkaio|See you soon,\nThe Bunkaio team)\s*$/, '').replace(/\s+$/, '');
  const { tpl, ...rest } = mail;
  return { ...rest, html: tpl ? `${rest.html}<!--bk-tpl:${tpl}-->` : rest.html, text: `${body}\n\n${tr(lang, 'À très vite,', 'See you soon,')}\n\n${signatureText(lang)}` };
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
          <img src="${LOGO_URL}" alt="BUNKAIO" width="150" height="68" style="display:block;margin:0 auto;border:0;color:#ffffff;font-family:${FONT};font-size:22px;font-weight:700;letter-spacing:0.14em;">
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
    `Soit 3 × ${threeXFr} € sans frais avec Klarna (sous réserve d'éligibilité) — ou par carte bancaire, au choix sur la page de paiement.`,
    `That is 3 × €${threeX} interest-free with Klarna (subject to eligibility) — or by bank card, as you prefer on the payment page.`);
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
  return finalize(lang, { tpl: `facture_acompte`, subject: tr(lang, `Bunkaio — Votre facture d'acompte (${amount})`, `Bunkaio — Your deposit invoice (${amount})`), html, text });
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
  return finalize(lang, { tpl: `photos_pretes_solde`, subject: t(`Bunkaio — Vos photos sont prêtes (solde ${amount})`, `Bunkaio — Your photos are ready (balance ${amount})`), html, text });
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
  return finalize(lang, { tpl: `paiement_recu`, subject: tr(lang, `Bunkaio — Paiement reçu (${amount})`, `Bunkaio — Payment received (${amount})`), html, text });
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
    `Rappel : soit 3 × ${threeX.replace('.', ',')} € sans frais avec Klarna (sous réserve d'éligibilité), par carte bancaire.`,
    `Reminder: that is 3 × €${threeX} interest-free with Klarna (subject to eligibility), by bank card.`);
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
  return finalize(lang, { tpl: `rappel_impaye`, subject: tr(lang, `Bunkaio — Rappel : facture ${label} en attente`, `Bunkaio — Reminder: ${label} invoice pending`), html, text });
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
  return finalize(lang, { tpl: `confirmation_devis_quiz`, subject: tr(lang, 'Bunkaio — Nous avons bien reçu votre demande', 'Bunkaio — We have received your request'), html, text });
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
  return finalize(lang, { tpl: `acces_espace`, subject: tr(lang, `Bunkaio — Vos accès à votre ${area}`, `Bunkaio — Your ${area} access`), html, text });
}

/** Bloc « votre avis + remise de -15 % » inséré dans le mail d'accès aux photos (le client réagit à chaud). */
function reviewBlock(lang: Lang, reviewUrl: string, discount = true): { html: string; text: string } {
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
        ${discount ? `<div style="display:inline-block;background:#f1ecfa;color:#0a0a0c;font-size:22px;font-weight:700;border-radius:100px;padding:8px 20px;margin-bottom:12px;font-family:${FONT};">-15 %</div>
        <div style="font-size:17px;font-weight:700;color:#ffffff;margin-bottom:8px;font-family:${FONT};">${offerTitle}</div>
        <div style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,0.65);margin-bottom:24px;font-family:${FONT};">${offer}</div>
        <div style="height:1px;background:rgba(255,255,255,0.15);margin:0 0 22px;"></div>` : ''}
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#d9cdf5;margin-bottom:10px;font-family:${FONT};">${head}</div>
        <div style="font-size:17px;font-weight:700;color:#ffffff;line-height:1.4;margin-bottom:10px;font-family:${FONT};">${title}</div>
        <div style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,0.65);margin-bottom:22px;font-family:${FONT};">${body}</div>
        <a href="${reviewUrl}" style="display:inline-block;background:#ffffff;color:#0a0a0c;text-decoration:none;padding:14px 32px;border-radius:4px;font-weight:700;font-size:15px;font-family:${FONT};">${btn}</a>
      </td></tr>
    </table>`;
  const text = `${discount ? offerTitle.toUpperCase() + '\n' + offer + '\n\n' : ''}${head.toUpperCase()}\n${title}\n${body}\n${btn.replace(' →', '')} : ${reviewUrl}`;
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
  return finalize(lang, { tpl: `album_accessible`, subject: t('Bunkaio — Votre album photo est accessible', 'Bunkaio — Your photo album is open'), html, text });
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
  return finalize(lang, { tpl: `merci_seance`, subject: t('Bunkaio — Merci pour votre séance', 'Bunkaio — Thank you for your session'), html, text });
}

/** Alerte interne : une livraison arrive à échéance (ou un point reste à traiter). */
export function buildAdminAlertEmail(params: { subject: string; lines: string[] }): { subject: string; html: string; text: string } {
  const html = `<p style="font-family:${FONT};font-size:14px;line-height:1.6;color:#0a0a0c;">${params.lines.map(escapeHtml).join('<br>')}</p>`;
  return { subject: params.subject, html, text: params.lines.join('\n') };
}

/** Alerte interne « devis signé » : synthèse en sections (devis, acompte, droit à l'image) au lieu d'un bloc de texte. */
export interface QuoteSignedAdminParams {
  number: string;
  test?: boolean;
  signerName: string;
  signedAtLabel: string;
  clientName: string;
  clientEmail: string;
  prestation: string;
  totalHT: number;
  mode: string;
  deposit: { kind: 'sent' | 'error' | 'abonnement' | 'test' | 'none'; amount?: number };
  handwritten: boolean;
  image?: { version: string; uses: { label: string; yes: boolean }[]; persons: string; minors: boolean; othersToCollect: boolean };
  retractationWaiver?: boolean;
  particulier?: boolean;
  adminUrl: string;
}
export function buildQuoteSignedAdminEmail(p: QuoteSignedAdminParams): { subject: string; html: string; text: string } {
  const eurFmt = (n: number): string => n.toFixed(2).replace('.', ',') + ' €';
  const th = `padding:7px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#76717f;width:170px;vertical-align:top;font-family:${FONT};`;
  const td = `padding:7px 0;font-size:14px;color:#0a0a0c;vertical-align:top;font-family:${FONT};`;
  const row = (k: string, v: string): string => `<tr><td style="${th}">${escapeHtml(k)}</td><td style="${td}">${v}</td></tr>`;
  const section = (title: string, inner: string): string => `<tr><td style="padding:22px 28px 6px;"><div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#6e5aa8;font-family:${FONT};padding-bottom:6px;border-bottom:1px solid #ece7f5;">${escapeHtml(title)}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">${inner}</table></td></tr>`;
  const pill = (yes: boolean): string => yes
    ? `<span style="display:inline-block;background:#e7f4ec;color:#2f7d4f;font-weight:700;font-size:12px;padding:3px 10px;border-radius:99px;">✓ Autorisé</span>`
    : `<span style="display:inline-block;background:#f1eff5;color:#5a5566;font-weight:700;font-size:12px;padding:3px 10px;border-radius:99px;">✕ Refusé</span>`;
  const depositMsg = p.deposit.kind === 'sent' ? `Facture d'acompte de <b>${eurFmt(p.deposit.amount ?? 0)}</b> envoyée automatiquement au client.`
    : p.deposit.kind === 'error' ? `<b style="color:#b3261e;">⚠ La facture d'acompte n'a pas pu être créée.</b> Créez-la depuis le tableau de bord (Devis → Créer l'acompte).`
    : p.deposit.kind === 'abonnement' ? `Abonnement : <b>à mettre en place</b> (pas de facture d'acompte automatique).`
    : p.deposit.kind === 'test' ? `Devis de test : aucune facture créée.` : 'Aucune facture d\'acompte.';
  const imageSection = p.image ? section(`Droit à l'image · clauses ${p.image.version}`,
    p.image.uses.map((u) => row(u.label, pill(u.yes))).join('') +
    row('Personnes photographiées', escapeHtml(p.image.persons) + (p.image.minors ? ' <b style="color:#b3261e;">· dont au moins un mineur</b>' : '')) +
    (p.image.othersToCollect ? row('À faire', 'Collecter les autorisations individuelles des autres personnes (fiche du devis → Suivi). <b>N\'utilisez pas leurs images sans autorisation.</b>') : '')) : '';
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f1fc;font-family:${FONT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1fc;padding:28px 0;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden;">
  <tr><td style="background:#0a0a0c;padding:22px 28px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#d9cdf5;font-family:${FONT};">${p.test ? 'Devis de test · ' : ''}Devis signé</div>
    <div style="font-size:22px;font-weight:700;color:#ffffff;margin-top:4px;font-family:${FONT};">✍️ Devis n° ${escapeHtml(p.number)}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.65);margin-top:2px;font-family:${FONT};">${escapeHtml(p.clientName)} · ${eurFmt(p.totalHT)}</div>
  </td></tr>
  ${section('Le devis', row('Client', `<b>${escapeHtml(p.clientName)}</b><br><a href="mailto:${escapeHtml(p.clientEmail)}" style="color:#6e5aa8;text-decoration:none;">${escapeHtml(p.clientEmail)}</a>`) + row('Prestation', escapeHtml(p.prestation)) + row('Montant', `<b>${eurFmt(p.totalHT)}</b> net (TVA non applicable)`))}
  ${section('La signature', row('Signataire', escapeHtml(p.signerName)) + row('Date et heure', escapeHtml(p.signedAtLabel)) + row('Mode', escapeHtml(p.mode)) + row('Preuve', (p.handwritten ? '✓ Mention « Bon pour accord » saisie et signature manuscrite' : 'Signature électronique (nom, date, IP, empreinte)') + (p.retractationWaiver === undefined || !p.particulier ? '' : `<br>Exécution avant fin de rétractation : <b>${p.retractationWaiver ? 'demandée' : 'non demandée'}</b>`)))}
  ${section('Facture d\'acompte', row('Statut', depositMsg))}
  ${imageSection}
  <tr><td style="padding:24px 28px 28px;"><a href="${escapeHtml(p.adminUrl)}" style="${btnStyle}">Ouvrir le devis dans l'admin</a><div style="font-size:12px;color:#76717f;margin-top:12px;font-family:${FONT};">Le PDF signé est dans la fiche du devis (Suivi → Droit à l'image → PDF signé).</div></td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    `${p.test ? '[TEST] ' : ''}Devis n° ${p.number} signé`,
    '',
    'LE DEVIS', `Client : ${p.clientName} <${p.clientEmail}>`, `Prestation : ${p.prestation}`, `Montant : ${eurFmt(p.totalHT)} net`,
    '', 'LA SIGNATURE', `Signataire : ${p.signerName}`, `Date et heure : ${p.signedAtLabel}`, `Mode : ${p.mode}`, `Preuve : ${p.handwritten ? 'mention + signature manuscrite' : 'signature électronique'}`,
    '', "FACTURE D'ACOMPTE", depositMsg.replace(/<[^>]+>/g, ''),
    ...(p.image ? ['', `DROIT À L'IMAGE (clauses ${p.image.version})`, ...p.image.uses.map((u) => `${u.label} : ${u.yes ? 'Autorisé' : 'Refusé'}`), `Personnes photographiées : ${p.image.persons}${p.image.minors ? ' (dont mineur)' : ''}`, ...(p.image.othersToCollect ? ['À faire : collecter les autorisations individuelles des autres personnes.'] : [])] : []),
    '', `Admin : ${p.adminUrl}`,
  ].join('\n');
  return { subject: `${p.test ? '[TEST] ' : ''}✍️ Devis n° ${p.number} signé — ${p.clientName} (${eurFmt(p.totalHT)})`, html, text };
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
  return finalize(lang, { tpl: `seance_${params.kind}`, subject, html, text });
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
  return finalize(lang, { tpl: `accuse_${params.kind}`, subject: copy.subject, html, text: `${greeting}\n\n${copy.body}${blockText}` });
}

/** Relance unique si le prospect n'a pas donné suite à son devis. */
export function buildQuoteFollowUpEmail(params: { customerName: string; space?: Space; lang?: Lang; step?: 1 | 2 }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  if (params.step === 1) {
    /* Relance J+2 : courte, utile, sans pression — une question, un ajustement, ou la suite du parcours. */
    const b1 = t(
      "Merci encore pour votre demande de devis. Nous la préparons avec attention : avant de vous faire une proposition, avez-vous une question sur la formule, le lieu de la séance ou les délais ?",
      'Thank you again for your quote request. We are preparing it carefully: before we send you a proposal, do you have any question about the package, the location of the session or the timing?');
    const b2 = t(
      "Répondez simplement à cet email (une phrase suffit) : vous échangez directement avec la photographe, votre seul interlocuteur du brief à la livraison.",
      'Simply reply to this email (one sentence is enough): you talk directly to the photographer, your single point of contact from the brief to delivery.');
    const html1 = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Une question sur votre projet ?', 'Any question about your project?')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">${b1}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">${b2}</p>
    ${spaceBlock(lang, params.space, 'quote')}
  `, lang);
    return finalize(lang, { tpl: `relance_devis_j2`, subject: t('Bunkaio — Une question sur votre projet ?', 'Bunkaio — Any question about your project?'), html: html1, text: `${greeting}\n\n${b1}\n\n${b2}\n\n${spaceText(lang, params.space, 'quote')}` });
  }
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
  return finalize(lang, { tpl: `relance_devis_quiz`, subject: t('Bunkaio — Où en est votre projet ?', 'Bunkaio — How is your project coming along?'), html, text: `${greeting}\n\n${body}\n\n${body2}\n\n${spaceText(lang, params.space, 'quote')}` });
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
  return finalize(lang, { tpl: `rappel_moodboard`, subject: t('Bunkaio — Créez votre moodboard avant la séance', 'Bunkaio — Create your moodboard before the session'), html, text: `${greeting}\n\n${body}\n\n${spaceText(lang, params.space, 'deposit')}` });
}

/** Devis à consulter et signer en ligne. */
export function buildQuoteEmail(params: { customerName: string; number: string; prestation: string; totalHT: number; validUntil: string; url: string; abonnement?: boolean; reminder?: boolean; space?: Space; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const amount = eur(lang, params.totalHT) + (params.abonnement ? t(' / mois', ' / month') : '');
  const until = fmtDate(lang, params.validUntil);
  const intro = params.reminder
    ? t(`Petit rappel : votre devis n° ${params.number} est toujours disponible. Si vous avez la moindre question ou souhaitez un ajustement, répondez simplement à cet email.`,
        `A quick reminder: your quote no. ${params.number} is still available. If you have any question or would like an adjustment, simply reply to this email.`)
    : t(`Merci pour votre confiance. Voici votre devis personnalisé n° ${params.number} : vous pouvez le consulter et le signer en ligne en quelques secondes.`,
        `Thank you for your trust. Here is your personalised quote no. ${params.number}: you can review and sign it online in a few seconds.`);
  const how = params.abonnement
    ? t("Une fois le devis signé, nous mettons en place votre abonnement mensuel.", 'Once the quote is signed, we set up your monthly subscription.')
    : t("Dès la signature, vous recevez automatiquement la facture d'acompte (30 %) : son règlement confirme la réservation de votre date.", 'As soon as you sign, you automatically receive the deposit invoice (30%): paying it confirms your booking.');
  const card = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr><td style="background:#0a0a0c;border-radius:10px;padding:20px 24px;">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#d9cdf5;margin-bottom:6px;font-family:${FONT};">${t('Devis', 'Quote')} n° ${escapeHtml(params.number)}</div>
    <div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:6px;font-family:${FONT};">${escapeHtml(params.prestation)}</div>
    <div style="font-size:22px;font-weight:700;color:#ffffff;font-family:${FONT};">${amount}</div>
    <div style="font-size:12.5px;color:rgba(255,255,255,0.6);margin-top:6px;font-family:${FONT};">${t('Valable jusqu\'au', 'Valid until')} ${until}</div></td></tr></table>`;
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${params.reminder ? t('Votre devis vous attend', 'Your quote is waiting') : t('Votre devis est prêt', 'Your quote is ready')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    ${card}
    <a href="${params.url}" style="${btnStyle}">${t('Consulter et signer mon devis', 'Review and sign my quote')}</a>
    <p style="font-size:13px;line-height:1.6;color:#76717f;margin:20px 0 0;">${how}</p>
    ${spaceBlock(lang, params.space, 'quote')}
  `, lang);
  const text = `${greeting}\n\n${intro}\n\n${t('Devis', 'Quote')} n° ${params.number} — ${params.prestation}\n${amount}\n${t('Valable jusqu\'au', 'Valid until')} ${until}\n\n${t('Consulter et signer mon devis', 'Review and sign my quote')} : ${params.url}\n\n${how}\n\n${spaceText(lang, params.space, 'quote')}`;
  return finalize(lang, { tpl: `${params.reminder ? 'relance_devis_envoye' : 'devis_a_signer'}`, subject: params.reminder ? t(`Bunkaio — Rappel : votre devis n° ${params.number}`, `Bunkaio — Reminder: your quote no. ${params.number}`) : t(`Bunkaio — Votre devis n° ${params.number}`, `Bunkaio — Your quote no. ${params.number}`), html, text });
}

/** Confirmation de signature, avec le lien vers l'exemplaire signé. */
export function buildQuoteSignedEmail(params: { customerName: string; number: string; url: string; depositAmount?: number; depositUrl?: string; abonnement?: boolean; space?: Space; lang?: Lang; consents?: { label: string; yes: boolean }[]; legalVersion?: string; groupUrl?: string; pdfAttached?: boolean }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const intro = t(`Votre devis n° ${params.number} est bien signé, merci ! Vous pouvez consulter et enregistrer votre exemplaire signé à tout moment.`, `Your quote no. ${params.number} has been signed, thank you! You can view and save your signed copy at any time.`);
  const next = params.abonnement
    ? t('Nous revenons vers vous pour mettre en place votre abonnement.', 'We will get back to you to set up your subscription.')
    : params.depositUrl
      ? t(`Votre facture d'acompte de ${eur(lang, params.depositAmount ?? 0)} vous est envoyée dans un email séparé : son règlement confirme la réservation de votre date.`, `Your deposit invoice of ${eur(lang, params.depositAmount ?? 0)} is sent in a separate email: paying it confirms your booking.`)
      : t("Votre facture d'acompte vous est envoyée très prochainement.", 'Your deposit invoice will be sent to you shortly.');
  const yes = (params.consents ?? []).filter((c) => c.yes).length;
  const consentList = (params.consents ?? []).map((c) => `<li>${escapeHtml(c.label)} : <strong>${c.yes ? t('autorisé', 'allowed') : t('refusé', 'refused')}</strong></li>`).join('');
  const withdrawUrl = 'https://bunkaio.com/retrait-autorisation/';
  const legalBlock = params.consents && params.consents.length ? `
    <div style="margin:22px 0 0;padding:16px 18px;background:#f7f5fb;border-radius:10px;font-size:14px;line-height:1.6;">
      <strong>${t('Vos autorisations d\'image', 'Your image permissions')}</strong>${params.legalVersion ? ` <span style="color:#76717f;">(${t('clauses', 'clauses')} ${params.legalVersion})</span>` : ''}
      <ul style="margin:8px 0 8px;padding-left:18px;">${consentList}</ul>
      <span style="color:#3a3544;">${yes ? t('Ces choix, libres, n\'ont aucun effet sur votre prestation. Vous pouvez les modifier ou les retirer à tout moment, sans motif : ', 'These choices, which were entirely yours, have no effect on your service. You can change or withdraw them at any time, without giving a reason: ') : t('Vous n\'avez autorisé aucune utilisation promotionnelle : cela n\'a aucun effet sur votre prestation. Vous pouvez changer d\'avis à tout moment : ', 'You have not allowed any promotional use: this has no effect on your service. You can change your mind at any time: ')}<a href="${withdrawUrl}" style="color:#6e5aa8;">${t('gérer mes autorisations', 'manage my permissions')}</a>.</span>
    </div>
    ${params.groupUrl ? `<p style="font-size:14px;line-height:1.6;margin:16px 0 0;">${t('D\'autres personnes seront photographiées ? Chacune donne son propre accord via ce lien personnel à leur transmettre :', 'Will other people be photographed? Each person gives their own consent through this link, to pass on to them:')} <a href="${params.groupUrl}" style="color:#6e5aa8;word-break:break-all;">${params.groupUrl}</a></p>` : ''}
    <p style="font-size:12.5px;line-height:1.6;color:#76717f;margin:16px 0 0;">${t('Vos données (identité, coordonnées, photographies, preuve de votre signature) sont traitées par BUNKAIO pour exécuter votre devis et conserver la preuve de votre accord, pendant 5 ans après la fin de notre relation (factures : 10 ans). Droits d\'accès, de rectification, d\'effacement et d\'opposition : contact@bunkaio.com. Détails : bunkaio.com/confidentialite/.', 'Your data (identity, contact details, photographs, proof of your signature) is processed by BUNKAIO to perform your quote and keep proof of your agreement, for 5 years after the end of our relationship (invoices: 10 years). Rights of access, rectification, erasure and objection: contact@bunkaio.com. Details: bunkaio.com/confidentialite/.')}${params.pdfAttached ? ' ' + t('Votre exemplaire signé est joint à cet email (PDF).', 'Your signed copy is attached to this email (PDF).') : ''}</p>` : '';
  const legalText = params.consents && params.consents.length ? `${t('Vos autorisations d\'image', 'Your image permissions')} :\n${(params.consents ?? []).map((c) => `- ${c.label} : ${c.yes ? t('autorisé', 'allowed') : t('refusé', 'refused')}`).join('\n')}\n${t('Modifier ou retirer : ', 'Change or withdraw: ')}${withdrawUrl}\n${params.groupUrl ? `${t('Lien à transmettre aux autres personnes photographiées : ', 'Link for other people being photographed: ')}${params.groupUrl}\n` : ''}\n` : '';
  const spaceName = (params.space ?? 'client') === 'partner' ? t('espace partenaire', 'partner area') : t('espace client', 'client area');
  const findNote = params.abonnement
    ? t(`Retrouvez à tout moment votre devis signé, son PDF et vos autorisations d'image dans votre ${spaceName}, rubrique <strong>« Mes devis »</strong>.`, `You can find your signed quote, its PDF and your image permissions at any time in your ${spaceName}, under <strong>"My quotes"</strong>.`)
    : t(`Retrouvez à tout moment votre devis signé, son PDF et vos autorisations d'image dans votre ${spaceName}, rubrique <strong>« Mes devis »</strong>, et votre facture d'acompte dans <strong>« Mes factures »</strong>.`, `You can find your signed quote, its PDF and your image permissions at any time in your ${spaceName}, under <strong>"My quotes"</strong>, and your deposit invoice under <strong>"My invoices"</strong>.`);
  const findHtml = `<p style="font-size:14px;line-height:1.65;margin:20px 0 0;padding:14px 16px;background:#f6f1fc;border-radius:10px;color:#3a3544;">${findNote}</p>`;
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Devis signé', 'Quote signed')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    <a href="${params.url}" style="${btnStyle}">${t('Voir mon devis signé', 'View my signed quote')}</a>
    ${params.depositUrl ? `<p style="font-size:15px;line-height:1.6;margin:22px 0 0;">${next} <a href="${params.depositUrl}" style="color:#6e5aa8;">${t('Régler l\'acompte', 'Pay the deposit')}</a></p>` : `<p style="font-size:15px;line-height:1.6;margin:22px 0 0;">${next}</p>`}
    ${findHtml}
    ${legalBlock}
    ${spaceBlock(lang, params.space, 'deposit')}
  `, lang);
  const text = `${greeting}\n\n${intro}\n\n${t('Voir mon devis signé', 'View my signed quote')} : ${params.url}\n\n${next}${params.depositUrl ? '\n' + params.depositUrl : ''}\n\n${findNote.replace(/<[^>]+>/g, '')}\n\n${legalText}${spaceText(lang, params.space, 'deposit')}`;
  return finalize(lang, { tpl: `devis_signe`, subject: t(`Bunkaio — Devis n° ${params.number} signé`, `Bunkaio — Quote no. ${params.number} signed`), html, text });
}

/** Demande d'avis seule (envoi manuel) ; la mention de la remise de 15 % n'apparaît que si le client y a droit. */
export function buildReviewRequestEmail(params: { customerName: string; reviewUrl: string; discount?: boolean; space?: Space; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const greeting = greet(lang, params.customerName);
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const intro = t("Nous espérons que vos photos vous plaisent ! Si vous avez une minute, votre avis nous aide beaucoup : il rassure celles et ceux qui hésitent encore à nous confier leur projet.", 'We hope you enjoy your photos! If you have a minute, your review helps us a lot: it reassures those who are still hesitating to entrust us with their project.');
  const rv = reviewBlock(lang, params.reviewUrl, params.discount === true);
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Votre avis nous intéresse', 'We would love your feedback')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 8px;">${intro}</p>
    ${rv.html}
  `, lang);
  return finalize(lang, { tpl: 'demande_avis', subject: t('Bunkaio — Votre avis compte', 'Bunkaio — Your opinion matters'), html, text: `${greeting}\n\n${intro}\n\n${rv.text}` });
}

/** Lien de désinscription signé (HMAC dérivé du token admin) : pas de base d'abonnés à maintenir côté client. */
export async function unsubscribeToken(env: Env, email: string): Promise<string> {
  const data = new TextEncoder().encode(`${env.ADMIN_TOKEN}:unsub:${email.trim().toLowerCase()}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Email libre (information, offre, annonce…) rédigé dans le tableau de bord. Le texte est échappé :
 * paragraphes séparés par une ligne vide, sauts de ligne conservés, {prenom} et {nom} remplacés.
 * `marketing` ajoute le lien de désinscription obligatoire pour une communication non transactionnelle.
 */
export function buildFreeEmail(params: { subject: string; heading?: string; body: string; ctaLabel?: string; ctaUrl?: string; customerName: string; unsubscribeUrl?: string; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const first = (params.customerName || '').trim().split(/\s+/)[0] ?? '';
  const fill = (s: string): string => s.replace(/\{prenom\}/gi, first).replace(/\{nom\}/gi, params.customerName || first);
  const greeting = first ? tr(lang, `Bonjour ${first},`, `Hello ${first},`) : tr(lang, 'Bonjour,', 'Hello,');
  const paragraphs = fill(params.body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const bodyHtml = paragraphs.map((p) => `<p style="font-size:15px;line-height:1.65;margin:0 0 16px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  const cta = params.ctaLabel && params.ctaUrl && /^https:\/\//.test(params.ctaUrl)
    ? `<p style="margin:24px 0 8px;"><a href="${escapeHtml(params.ctaUrl)}" style="${btnStyle}">${escapeHtml(fill(params.ctaLabel))}</a></p>` : '';
  const unsub = params.unsubscribeUrl
    ? `<p style="font-size:11.5px;line-height:1.6;color:#9a95a6;margin:28px 0 0;">${tr(lang, "Vous recevez cet email car vous êtes en relation avec BUNKAIO. Pour ne plus recevoir nos emails d'information :", 'You are receiving this email because you are in contact with BUNKAIO. To stop receiving our information emails:')} <a href="${params.unsubscribeUrl}" style="color:#9a95a6;">${tr(lang, 'se désinscrire', 'unsubscribe')}</a></p>` : '';
  const html = emailShell(`
    ${params.heading ? `<h1 style="font-size:20px;margin:0 0 16px;">${escapeHtml(fill(params.heading))}</h1>` : ''}
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    ${bodyHtml}${cta}${unsub}
  `, lang);
  const text = `${greeting}\n\n${paragraphs.join('\n\n')}${params.ctaLabel && params.ctaUrl ? `\n\n${fill(params.ctaLabel)} : ${params.ctaUrl}` : ''}${params.unsubscribeUrl ? `\n\n${tr(lang, 'Se désinscrire', 'Unsubscribe')} : ${params.unsubscribeUrl}` : ''}`;
  return finalize(lang, { tpl: 'libre', subject: fill(params.subject), html, text });
}

/**
 * Réponse à un email reçu : exactement la même mise en page que les emails automatiques (en-tête logo,
 * typographie, signature unique). Le texte est celui rédigé par l'admin ; le message d'origine est cité en bas.
 */
export function buildReplyEmail(params: { subject: string; body: string; quotedFrom: string; quotedDate: string; quotedText: string; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const paragraphs = params.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const bodyHtml = paragraphs.map((p) => `<p style="font-size:15px;line-height:1.65;margin:0 0 16px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
  const quote = params.quotedText.trim()
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 8px;"><tr><td style="border-left:3px solid #d9cdf5;padding:4px 0 4px 16px;">
        <div style="font-size:12.5px;color:#76717f;margin-bottom:8px;font-family:${FONT};">${tr(lang, 'Le', 'On')} ${escapeHtml(params.quotedDate)}, ${escapeHtml(params.quotedFrom)} ${tr(lang, 'a écrit :', 'wrote:')}</div>
        <div style="font-size:13.5px;line-height:1.6;color:#76717f;font-family:${FONT};">${escapeHtml(params.quotedText.slice(0, 4000)).replace(/\n/g, '<br>')}</div></td></tr></table>` : '';
  const html = emailShell(`${bodyHtml}${quote}`, lang) + '<!--bk-tpl:reponse-->';
  const text = `${paragraphs.join('\n\n')}\n\n${signatureText(lang)}${params.quotedText.trim() ? `\n\n${tr(lang, 'Le', 'On')} ${params.quotedDate}, ${params.quotedFrom} ${tr(lang, 'a écrit :', 'wrote:')}\n${params.quotedText.split('\n').slice(0, 40).map((l) => `> ${l}`).join('\n')}` : ''}`;
  return { subject: params.subject, html, text };
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
    <p style="margin:24px 0 0;font-size:13px;"><a href="https://bunkaio.com/admin/#contacts" style="color:#0a0a0c;">Ouvrir la fiche dans l'admin</a></p>`);
  const text = `Espace ${space} mis à jour — ${who} (${params.email})\n\n` + params.entries.map((en) =>
    `[${ACTIVITY_LABELS[en.type]} · ${fmt(en.date)}] ${en.resume}` + (en.details?.length ? '\n' + en.details.map((d) => `  - ${d}`).join('\n') : '')).join('\n\n') +
    '\n\nFiche : https://bunkaio.com/admin/#contacts';
  return { subject, html, text };
}

/** Envoie un email transactionnel via l'API Resend (https://resend.com). */
export async function sendEmail(env: Env, to: string, subject: string, html: string, text: string, tplOverride?: string, extra?: { headers?: Record<string, string>; replyTo?: string; from?: string; attachments?: { filename: string; content: string }[] }): Promise<void> {
  // Le modèle est repéré par un commentaire HTML invisible posé par les constructeurs (voir finalize).
  const tpl = tplOverride ?? html.match(/<!--bk-tpl:([a-z_]+)-->/)?.[1] ?? '';
  let error = '';
  /* Logo intégré à l'email (pièce jointe « inline », référencée par cid:) : les lecteurs de mail qui bloquent les images
     distantes l'affichent quand même. Si Resend refusait l'image intégrée, l'email repart avec le logo distant (jamais bloquant). */
  const inlineHtml = html.split(`src="${LOGO_URL}"`).join(`src="cid:${LOGO_CID}"`);
  const useInline = inlineHtml !== html;
  const send = (body: string, inline: boolean) => fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: extra?.from || env.EMAIL_FROM, to, subject, html: body, text,
      ...(extra?.headers && Object.keys(extra.headers).length ? { headers: extra.headers } : {}),
      ...(extra?.replyTo ? { reply_to: extra.replyTo } : {}),
      ...((extra?.attachments?.length || inline) ? { attachments: [...(extra?.attachments ?? []), ...(inline ? [{ filename: 'bunkaio-logo.png', content: LOGO_PNG_BASE64, content_type: 'image/png', content_id: LOGO_CID }] : [])] } : {}),
    }),
  });
  try {
    let res = await send(useInline ? inlineHtml : html, useInline);
    if (!res.ok && useInline && res.status >= 400 && res.status < 500 && res.status !== 429) {
      console.error('[email] logo intégré refusé, envoi avec le logo distant', res.status, await res.text().catch(() => ''));
      res = await send(html, false);
    }
    if (!res.ok) {
      const detail = await res.text();
      error = `resend_error: ${res.status} ${detail}`;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'network_error';
  }
  // Journal des envois au client (historique visible dans le tableau de bord) — jamais bloquant.
  if (tpl && to.toLowerCase() !== (env.ADMIN_NOTIFICATION_EMAIL ?? '').toLowerCase()) {
    await logMail(env, to, tpl, subject, !error).catch((err) => console.error('[maillog] écriture impossible', err));
  }
  if (error) throw new Error(error);
}

const MAILLOG_MAX = 80;
export interface MailLogEntry { t: string; s: string; d: string; ok: boolean }
export async function logMail(env: Env, to: string, tpl: string, subject: string, ok: boolean): Promise<void> {
  const key = `maillog:${to.trim().toLowerCase()}`;
  let log: MailLogEntry[] = [];
  try { log = JSON.parse((await env.ACCOUNTS_KV.get(key)) ?? '[]') as MailLogEntry[]; } catch { log = []; }
  const entry: MailLogEntry = { t: tpl, s: subject.slice(0, 200), d: new Date().toISOString(), ok };
  log.push(entry);
  if (log.length > MAILLOG_MAX) log = log.slice(-MAILLOG_MAX);
  await env.ACCOUNTS_KV.put(key, JSON.stringify(log), { metadata: { last: entry.d, t: tpl, n: log.length, ok }, expirationTtl: 3 * 365 * 24 * 3600 });
}

/** Invitation envoyée à une personne photographiée pour qu'elle choisisse elle-même ses autorisations. */
export function buildSubjectInviteEmail(params: { name: string; number: string; url: string; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const greeting = greet(lang, params.name);
  const intro = t(`Vous allez être photographié(e) par BUNKAIO dans le cadre du devis n° ${params.number}. Avant la séance, vous pouvez choisir vous-même, usage par usage, si BUNKAIO peut utiliser vos photos pour sa promotion. Vous devez répondre à chacun des usages, mais votre choix est libre et sans effet sur la prestation.`, `You are going to be photographed by BUNKAIO as part of quote no. ${params.number}. Before the session you can choose yourself, use by use, whether BUNKAIO may use your photos for its own promotion. You must answer for each use, but your choice is free and has no effect on the service.`);
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Votre autorisation d\'image', 'Your image permission')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">${intro}</p>
    <a href="${params.url}" style="${btnStyle}">${t('Choisir mes autorisations', 'Choose my permissions')}</a>
    <p style="font-size:12.5px;line-height:1.6;color:#76717f;margin:20px 0 0;">${t('Pour un mineur, ce choix doit être fait par un titulaire de l\'autorité parentale.', 'For a minor, this choice must be made by a holder of parental authority.')}</p>
  `, lang);
  const text = `${greeting}\n\n${intro}\n\n${t('Choisir mes autorisations', 'Choose my permissions')} : ${params.url}\n\n${t('Pour un mineur, ce choix doit être fait par un titulaire de l\'autorité parentale.', 'For a minor, this choice must be made by a holder of parental authority.')}`;
  return finalize(lang, { tpl: 'autorisation_invitation', subject: t(`BUNKAIO — Votre autorisation d'image (devis n° ${params.number})`, `BUNKAIO — Your image permission (quote no. ${params.number})`), html, text });
}

/** Confirmation remise à la personne photographiée une fois ses choix enregistrés. */
export function buildSubjectConsentEmail(params: { name: string; number: string; consents: { label: string; yes: boolean }[]; legalVersion: string; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const greeting = greet(lang, params.name);
  const list = params.consents.map((c) => `<li>${escapeHtml(c.label)} : <strong>${c.yes ? t('autorisé', 'allowed') : t('refusé', 'refused')}</strong></li>`).join('');
  const url = 'https://bunkaio.com/retrait-autorisation/';
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Vos choix sont enregistrés', 'Your choices are recorded')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">${t(`Voici les autorisations que vous avez enregistrées pour le devis n° ${params.number} (clauses ${params.legalVersion}) :`, `Here are the permissions you recorded for quote no. ${params.number} (clauses ${params.legalVersion}):`)}</p>
    <ul style="font-size:15px;line-height:1.6;margin:0 0 16px;padding-left:18px;">${list}</ul>
    <p style="font-size:14px;line-height:1.6;margin:0;">${t('Vous pouvez modifier ou retirer une autorisation à tout moment, sans motif : ', 'You can change or withdraw a permission at any time, without giving a reason: ')}<a href="${url}" style="color:#6e5aa8;">${t('gérer mes autorisations', 'manage my permissions')}</a>.</p>
    <p style="font-size:12.5px;line-height:1.6;color:#76717f;margin:16px 0 0;">${t('Vos données (nom, email, choix, date, adresse IP) sont conservées par BUNKAIO comme preuve de votre accord pendant 5 ans après la fin de la relation. Droits : contact@bunkaio.com — bunkaio.com/confidentialite/.', 'Your data (name, email, choices, date, IP address) is kept by BUNKAIO as proof of your agreement for 5 years after the end of the relationship. Rights: contact@bunkaio.com — bunkaio.com/confidentialite/.')}</p>
  `, lang);
  const text = `${greeting}\n\n${t('Autorisations enregistrées', 'Recorded permissions')} (${params.legalVersion}) :\n${params.consents.map((c) => `- ${c.label} : ${c.yes ? t('autorisé', 'allowed') : t('refusé', 'refused')}`).join('\n')}\n\n${t('Modifier ou retirer : ', 'Change or withdraw: ')}${url}`;
  return finalize(lang, { tpl: 'autorisation_confirmation', subject: t(`BUNKAIO — Vos autorisations d'image (devis n° ${params.number})`, `BUNKAIO — Your image permissions (quote no. ${params.number})`), html, text });
}

/** Accusé de réception d'une demande de retrait d'autorisation. */
export function buildWithdrawalAckEmail(params: { name: string; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const greeting = greet(lang, params.name);
  const body = t("Nous avons bien reçu votre demande de retrait d'autorisation. BUNKAIO cesse toute nouvelle utilisation promotionnelle de vos images concernées et retire les publications en ligne dans un délai de 30 jours. Les supports déjà imprimés ou diffusés ne peuvent pas être rappelés. Nous vous confirmons le traitement par email.", 'We have received your request to withdraw a permission. BUNKAIO stops any new promotional use of the images concerned and removes online publications within 30 days. Materials already printed or distributed cannot be recalled. We will confirm by email once it is done.');
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Demande de retrait reçue', 'Withdrawal request received')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0;">${body}</p>
  `, lang);
  return finalize(lang, { tpl: 'autorisation_retrait', subject: t('BUNKAIO — Votre demande de retrait', 'BUNKAIO — Your withdrawal request'), html, text: `${greeting}\n\n${body}` });
}

/** Confirmation du traitement d'un retrait (envoyée depuis l'admin). */
export function buildWithdrawalDoneEmail(params: { name: string; usages: string[]; lang?: Lang }): { subject: string; html: string; text: string } {
  const lang = params.lang ?? 'fr';
  const t = (fr: string, en: string): string => tr(lang, fr, en);
  const greeting = greet(lang, params.name);
  const body = t(`Votre retrait est enregistré pour : ${params.usages.join(', ')}. BUNKAIO n'effectue plus de nouvelle utilisation de vos images pour ces usages et retire les publications en ligne dans un délai de 30 jours.`, `Your withdrawal is recorded for: ${params.usages.join(', ')}. BUNKAIO no longer makes new uses of your images for these purposes and removes online publications within 30 days.`);
  const html = emailShell(`
    <h1 style="font-size:20px;margin:0 0 16px;">${t('Retrait enregistré', 'Withdrawal recorded')}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px;">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;margin:0;">${escapeHtml(body)}</p>
  `, lang);
  return finalize(lang, { tpl: 'autorisation_retrait_ok', subject: t('BUNKAIO — Retrait enregistré', 'BUNKAIO — Withdrawal recorded'), html, text: `${greeting}\n\n${body}` });
}
