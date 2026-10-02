import { getAccount, listAccounts } from './accounts';
import { isDemo } from './config';
import { listQuotes, putQuote } from './quotes';
import {
  buildQuoteEmail,
  buildAdminAlertEmail,
  buildAfterSessionEmail,
  buildMoodboardReminderEmail,
  buildQuoteFollowUpEmail,
  buildSeanceEmail,
  normalizeLang,
  sendEmail,
} from './email';
import type { Env } from './types';

/**
 * Automatisations quotidiennes (cron) : rappel de séance à J-2, rappel de
 * moodboard après l'acompte, relance unique d'un devis resté sans suite.
 * Les marqueurs vivent dans ACCOUNTS_KV sous des préfixes distincts de
 * `account:` (ils n'apparaissent donc jamais dans la liste admin).
 */
const DAY = 24 * 3600 * 1000;
const norm = (email: string): string => email.trim().toLowerCase();

export interface LeadMarker { name: string; lang: string; date: string }

/** Prospect ayant rempli le quiz : sert à la relance de devis. */
export async function markLead(env: Env, email: string, name: string, lang: string): Promise<void> {
  const marker: LeadMarker = { name, lang, date: new Date().toISOString() };
  await env.ACCOUNTS_KV.put(`lead:${norm(email)}`, JSON.stringify(marker), { expirationTtl: 60 * DAY / 1000 });
}
/** Facture d'acompte créée : le devis a eu une suite, plus de relance. */
export async function markInvoiced(env: Env, email: string): Promise<void> {
  await env.ACCOUNTS_KV.put(`inv:${norm(email)}`, '1', { expirationTtl: 120 * DAY / 1000 });
}
/** Acompte payé : sert au rappel de moodboard. */
export async function markDepositPaid(env: Env, email: string, name: string, lang: string): Promise<void> {
  const marker: LeadMarker = { name, lang, date: new Date().toISOString() };
  await env.ACCOUNTS_KV.put(`dep:${norm(email)}`, JSON.stringify(marker), { expirationTtl: 90 * DAY / 1000 });
}

/** Facture de solde créée : on sait que la livraison est en cours (évite l'alerte admin). */
export async function markBalanceInvoiced(env: Env, email: string): Promise<void> {
  await env.ACCOUNTS_KV.put(`bal:${norm(email)}`, '1', { expirationTtl: 120 * DAY / 1000 });
}
/** Date du jour à Paris au format AAAA-MM-JJ, décalée de `offsetDays`. */
function parisDate(offsetDays: number): string {
  const d = new Date(Date.now() + offsetDays * DAY);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

async function readMarker(env: Env, key: string): Promise<LeadMarker | null> {
  const raw = await env.ACCOUNTS_KV.get(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as LeadMarker; } catch { return null; }
}

async function sendSeanceReminders(env: Env): Promise<void> {
  const target = parisDate(2);
  for (const summary of await listAccounts(env)) {
    if (isDemo(summary.email)) continue;
    const account = await getAccount(env, summary.type, summary.email);
    const s = account?.seance;
    if (!account || !s || s.statut === 'annulee' || s.date !== target) continue;
    const flag = `rem:${norm(account.email)}:${s.date}`;
    if (await env.ACCOUNTS_KV.get(flag)) continue;
    try {
      const m = buildSeanceEmail({ kind: 'reminder', customerName: account.nom ?? '', seance: s, space: account.type, lang: normalizeLang(account.lang) });
      await sendEmail(env, account.email, m.subject, m.html, m.text);
      await env.ACCOUNTS_KV.put(flag, '1', { expirationTtl: 30 * DAY / 1000 });
      console.log('[automatisation] rappel de séance envoyé', { email: account.email, date: s.date });
    } catch (err) {
      console.error('[automatisation] échec rappel de séance', err);
    }
  }
}

async function sendMoodboardReminders(env: Env): Promise<void> {
  const list = await env.ACCOUNTS_KV.list({ prefix: 'dep:', limit: 1000 });
  const today = parisDate(0);
  for (const k of list.keys) {
    const email = k.name.slice(4);
    const marker = await readMarker(env, k.name);
    if (!marker || Date.now() - Date.parse(marker.date) < 3 * DAY) continue;
    if (await env.ACCOUNTS_KV.get(`mbr:${email}`)) continue;
    // Un compte est nécessaire : le rappel renvoie vers l'espace où se crée le moodboard.
    const account = (await getAccount(env, 'client', email)) ?? (await getAccount(env, 'partner', email));
    if (!account) continue;
    if ((account.moodboards ?? []).length > 0) continue;
    if (account.seance && account.seance.date < today) continue;
    try {
      const m = buildMoodboardReminderEmail({ customerName: account.nom || marker.name, space: account.type, lang: normalizeLang(account.lang ?? marker.lang) });
      await sendEmail(env, account.email, m.subject, m.html, m.text);
      await env.ACCOUNTS_KV.put(`mbr:${email}`, '1', { expirationTtl: 120 * DAY / 1000 });
      console.log('[automatisation] rappel moodboard envoyé', { email });
    } catch (err) {
      console.error('[automatisation] échec rappel moodboard', err);
    }
  }
}

async function sendQuoteFollowUps(env: Env): Promise<void> {
  const list = await env.ACCOUNTS_KV.list({ prefix: 'lead:', limit: 1000 });
  for (const k of list.keys) {
    const email = k.name.slice(5);
    const marker = await readMarker(env, k.name);
    if (!marker || Date.now() - Date.parse(marker.date) < 7 * DAY) continue;
    // Un devis envoyé a sa propre relance : pas de relance « quiz » en plus.
    if ((await env.ACCOUNTS_KV.get(`inv:${email}`)) || (await env.ACCOUNTS_KV.get(`dep:${email}`)) || (await env.ACCOUNTS_KV.get(`fu:${email}`)) || (await env.ACCOUNTS_KV.get(`qsent:${email}`))) continue;
    const isPartner = !!(await getAccount(env, 'partner', email));
    try {
      const m = buildQuoteFollowUpEmail({ customerName: marker.name, space: isPartner ? 'partner' : 'client', lang: normalizeLang(marker.lang) });
      await sendEmail(env, email, m.subject, m.html, m.text);
      await env.ACCOUNTS_KV.put(`fu:${email}`, '1', { expirationTtl: 120 * DAY / 1000 });
      console.log('[automatisation] relance de devis envoyée', { email });
    } catch (err) {
      console.error('[automatisation] échec relance de devis', err);
    }
  }
}

/** Lendemain de la séance : remerciement + date de livraison estimée. */
async function sendAfterSessionMails(env: Env): Promise<void> {
  const target = parisDate(-1);
  for (const summary of await listAccounts(env)) {
    if (isDemo(summary.email)) continue;
    const account = await getAccount(env, summary.type, summary.email);
    const s = account?.seance;
    if (!account || !s || s.statut === 'annulee' || s.date !== target) continue;
    const flag = `thx:${norm(account.email)}:${s.date}`;
    if (await env.ACCOUNTS_KV.get(flag)) continue;
    try {
      const m = buildAfterSessionEmail({ customerName: account.nom ?? '', livraison: s.livraison, space: account.type, lang: normalizeLang(account.lang) });
      await sendEmail(env, account.email, m.subject, m.html, m.text);
      await env.ACCOUNTS_KV.put(flag, '1', { expirationTtl: 30 * DAY / 1000 });
    } catch (err) {
      console.error('[automatisation] échec mail après séance', err);
    }
  }
}

/** Alertes pour l'admin : livraison à échéance sans facture de solde, ou séance passée sans date de livraison. */
async function sendAdminDeliveryAlerts(env: Env): Promise<void> {
  const today = parisDate(0);
  const twoDaysAgo = parisDate(-2);
  for (const summary of await listAccounts(env)) {
    if (isDemo(summary.email)) continue;
    const account = await getAccount(env, summary.type, summary.email);
    const s = account?.seance;
    if (!account || !s || s.statut === 'annulee' || account.photosAcces) continue;
    const who = `${account.nom || account.email} <${account.email}>`;
    const invoiced = !!(await env.ACCOUNTS_KV.get(`bal:${norm(account.email)}`));
    let alert: { key: string; subject: string; lines: string[] } | null = null;
    if (s.livraison && s.livraison <= today && !invoiced) {
      alert = { key: `alv:${norm(account.email)}:${s.livraison}`, subject: `Livraison à faire — ${account.nom || account.email}`,
        lines: [`La livraison estimée (${s.livraison}) est arrivée pour ${who}.`, "Aucune facture de solde n'a été créée : crée-la dans l'admin quand les photos sont prêtes (le client reçoit le mail « Vos photos sont prêtes »)."] };
    } else if (!s.livraison && s.date === twoDaysAgo) {
      alert = { key: `adt:${norm(account.email)}:${s.date}`, subject: `Date de livraison à saisir — ${account.nom || account.email}`,
        lines: [`La séance de ${who} a eu lieu le ${s.date}.`, "Aucune date de livraison estimée n'est saisie dans son compte (section Séance)."] };
    }
    if (!alert || (await env.ACCOUNTS_KV.get(alert.key))) continue;
    try {
      const m = buildAdminAlertEmail({ subject: alert.subject, lines: alert.lines });
      await sendEmail(env, env.ADMIN_NOTIFICATION_EMAIL, m.subject, m.html, m.text);
      await env.ACCOUNTS_KV.put(alert.key, '1', { expirationTtl: 30 * DAY / 1000 });
    } catch (err) {
      console.error('[automatisation] échec alerte admin', err);
    }
  }
}

/** Devis envoyés : relance unique 5 jours après l'envoi s'ils ne sont pas signés, puis expiration à la date de validité. */
async function processQuotes(env: Env): Promise<void> {
  const today = parisDate(0);
  for (const q of await listQuotes(env)) {
    if (q.status !== 'envoye' || isDemo(q.email)) continue;
    if (q.validUntil < today) { q.status = 'expire'; await putQuote(env, q); continue; }
    if (q.reminderSentAt || !q.sentAt || Date.now() - Date.parse(q.sentAt) < 5 * DAY) continue;
    try {
      const isPartner = !!(await getAccount(env, 'partner', q.email));
      const m = buildQuoteEmail({ customerName: q.client.contact || q.client.nom, number: q.number, prestation: q.prestation, totalHT: q.totalHT, validUntil: q.validUntil, url: `https://bunkaio.com/signature/?d=${q.id}&k=${q.token}`, abonnement: q.abonnement, reminder: true, lang: q.lang, space: isPartner ? 'partner' : 'client' });
      await sendEmail(env, q.email, m.subject, m.html, m.text);
      q.reminderSentAt = new Date().toISOString();
      await putQuote(env, q);
    } catch (err) {
      console.error('[automatisation] relance de devis en échec', err);
    }
  }
}

export async function runDailyAutomations(env: Env): Promise<void> {
  for (const job of [processQuotes, sendSeanceReminders, sendAfterSessionMails, sendAdminDeliveryAlerts, sendMoodboardReminders, sendQuoteFollowUps]) {
    try { await job(env); } catch (err) { console.error('[automatisation] tâche en échec', job.name, err); }
  }
}

/** Accusé de réception des formulaires : un seul envoi par adresse/type et par heure (anti-abus). */
export async function claimAckSlot(env: Env, kind: string, email: string): Promise<boolean> {
  const key = `ack:${kind}:${norm(email)}`;
  if (await env.ACCOUNTS_KV.get(key)) return false;
  await env.ACCOUNTS_KV.put(key, '1', { expirationTtl: 3600 });
  return true;
}
