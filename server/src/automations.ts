import { getAccount, listAccounts } from './accounts';
import {
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
    if ((await env.ACCOUNTS_KV.get(`inv:${email}`)) || (await env.ACCOUNTS_KV.get(`dep:${email}`)) || (await env.ACCOUNTS_KV.get(`fu:${email}`))) continue;
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

export async function runDailyAutomations(env: Env): Promise<void> {
  for (const job of [sendSeanceReminders, sendMoodboardReminders, sendQuoteFollowUps]) {
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
