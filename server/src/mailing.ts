import {
  buildAfterSessionEmail,
  buildFreeEmail,
  buildMoodboardReminderEmail,
  buildOverdueReminderEmail,
  buildQuoteFollowUpEmail,
  buildReviewRequestEmail,
  buildSeanceEmail,
  normalizeLang,
  sendEmail,
  unsubscribeToken,
} from './email';
import type { MailLogEntry } from './email';
import { isDemo } from './config';
import type { Env } from './types';

/**
 * Mailing manuel depuis le tableau de bord : l'admin choisit un modèle et des destinataires dans
 * la base de contacts. Les données propres à chaque contact (nom, séance, facture ouverte…) sont
 * transmises par le tableau de bord (route protégée par ADMIN_TOKEN) ; le serveur construit
 * l'email, applique la désinscription et journalise l'envoi.
 */
export interface RecipientCtx {
  email: string;
  name?: string;
  lang?: string;
  space?: 'client' | 'partner';
  seance?: { date: string; heure?: string; lieu?: string; prestation?: string };
  invoice?: { description: string; amount: number; kind: 'acompte' | 'solde'; url: string };
  discount?: boolean;
  reviewUrl?: string;
}

export interface MailingParams {
  subject?: string;
  heading?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

export const MANUAL_TEMPLATES = ['libre', 'relance_devis_quiz', 'rappel_moodboard', 'seance_reminder', 'seance_confirmation', 'merci_seance', 'rappel_impaye', 'demande_avis'] as const;
export type ManualTemplate = typeof MANUAL_TEMPLATES[number];
/** Modèles « d'information » : soumis à la désinscription. Les autres sont liés à une relation en cours. */
export const MARKETING: ManualTemplate[] = ['libre'];

const SITE = 'https://bunkaio.com';
const WORKER_ORIGIN = 'https://bunkaio-quiz-stripe.bunkaio.workers.dev';

export async function isUnsubscribed(env: Env, email: string): Promise<boolean> {
  return !!(await env.ACCOUNTS_KV.get(`unsub:${email.trim().toLowerCase()}`));
}

export async function setUnsubscribed(env: Env, email: string, value: boolean): Promise<void> {
  const key = `unsub:${email.trim().toLowerCase()}`;
  if (value) await env.ACCOUNTS_KV.put(key, new Date().toISOString());
  else await env.ACCOUNTS_KV.delete(key);
}

/** Construit l'email d'un destinataire ; renvoie `{ skip }` si le modèle n'est pas applicable à ce contact. */
export async function buildManualMail(env: Env, template: ManualTemplate, r: RecipientCtx, p: MailingParams): Promise<{ subject: string; html: string; text: string } | { skip: string }> {
  const lang = normalizeLang(r.lang);
  const space = r.space === 'partner' ? 'partner' : 'client';
  const name = r.name ?? '';
  switch (template) {
    case 'libre': {
      if (!p.subject?.trim() || !p.body?.trim()) return { skip: 'objet ou message vide' };
      const token = await unsubscribeToken(env, r.email);
      return buildFreeEmail({ subject: p.subject, heading: p.heading, body: p.body, ctaLabel: p.ctaLabel, ctaUrl: p.ctaUrl, customerName: name, lang, unsubscribeUrl: `${WORKER_ORIGIN}/unsubscribe?e=${encodeURIComponent(r.email)}&s=${token}` });
    }
    case 'relance_devis_quiz':
      return buildQuoteFollowUpEmail({ customerName: name, space, lang });
    case 'rappel_moodboard':
      return buildMoodboardReminderEmail({ customerName: name, space, lang });
    case 'seance_reminder':
    case 'seance_confirmation':
      if (!r.seance?.date) return { skip: 'aucune séance planifiée' };
      return buildSeanceEmail({ kind: template === 'seance_reminder' ? 'reminder' : 'confirmation', customerName: name, seance: r.seance, space, lang });
    case 'merci_seance':
      return buildAfterSessionEmail({ customerName: name, livraison: undefined, space, lang });
    case 'rappel_impaye':
      if (!r.invoice?.url) return { skip: 'aucune facture en attente' };
      return buildOverdueReminderEmail({ customerName: name, description: r.invoice.description, amountEur: r.invoice.amount, invoiceType: r.invoice.kind, hostedInvoiceUrl: r.invoice.url, lang, space });
    case 'demande_avis':
      return buildReviewRequestEmail({ customerName: name, reviewUrl: r.reviewUrl || env.GOOGLE_REVIEW_URL, discount: r.discount === true, space, lang });
  }
}

export interface SendResult { email: string; status: 'envoye' | 'ignore' | 'erreur'; detail?: string }

/** Envoi en série (limite de débit du fournisseur d'emails). */
export async function sendMailing(env: Env, template: ManualTemplate, recipients: RecipientCtx[], p: MailingParams): Promise<SendResult[]> {
  const results: SendResult[] = [];
  const seen = new Set<string>();
  for (const r of recipients.slice(0, 100)) {
    const email = (r.email ?? '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || seen.has(email)) { results.push({ email, status: 'ignore', detail: 'adresse invalide ou en double' }); continue; }
    seen.add(email);
    if (isDemo(email)) { results.push({ email, status: 'ignore', detail: 'compte de démonstration' }); continue; }
    if (MARKETING.includes(template) && (await isUnsubscribed(env, email))) { results.push({ email, status: 'ignore', detail: 'désinscrit' }); continue; }
    try {
      const mail = await buildManualMail(env, template, { ...r, email }, p);
      if ('skip' in mail) { results.push({ email, status: 'ignore', detail: mail.skip }); continue; }
      await sendEmail(env, email, mail.subject, mail.html, mail.text);
      results.push({ email, status: 'envoye' });
    } catch (err) {
      results.push({ email, status: 'erreur', detail: err instanceof Error ? err.message.slice(0, 160) : 'erreur' });
    }
  }
  return results;
}

export interface Campaign { id: string; date: string; template: string; subject: string; sent: number; ignored: number; failed: number; recipients: number }

export async function saveCampaign(env: Env, c: Omit<Campaign, 'id' | 'date'>): Promise<void> {
  const date = new Date().toISOString();
  await env.ACCOUNTS_KV.put(`campaign:${date}`, JSON.stringify({ ...c, id: date, date }), { expirationTtl: 3 * 365 * 24 * 3600 });
}

export async function listCampaigns(env: Env): Promise<Campaign[]> {
  const keys = (await env.ACCOUNTS_KV.list({ prefix: 'campaign:', limit: 100 })).keys;
  const all = await Promise.all(keys.map(async (k) => { try { return JSON.parse((await env.ACCOUNTS_KV.get(k.name)) ?? 'null') as Campaign | null; } catch { return null; } }));
  return all.filter((c): c is Campaign => !!c).sort((a, b) => b.date.localeCompare(a.date));
}

export async function getMailLog(env: Env, email: string): Promise<MailLogEntry[]> {
  try { return JSON.parse((await env.ACCOUNTS_KV.get(`maillog:${email.trim().toLowerCase()}`)) ?? '[]') as MailLogEntry[]; } catch { return []; }
}

export { SITE };
