import { logMail } from './email';
import type { Env } from './types';

/**
 * SMS automatiques aux clients (photos prêtes, accès à l'album, rappel de séance).
 * Envoi via un fournisseur de SMS (Brevo ou Twilio), choisi par la variable SMS_PROVIDER ; sans clé API configurée,
 * rien n'est envoyé. Le lien de l'album n'est JAMAIS envoyé avant le paiement du solde.
 */
export interface SmsSettings { enabled: boolean; ready: boolean; access: boolean; reminder: boolean }
const DEFAULTS: SmsSettings = { enabled: false, ready: true, access: true, reminder: true };

export async function getSmsSettings(env: Env): Promise<SmsSettings> {
  try { return { ...DEFAULTS, ...(JSON.parse((await env.ACCOUNTS_KV.get('sms-settings')) ?? '{}') as Partial<SmsSettings>) }; } catch { return { ...DEFAULTS }; }
}
export async function setSmsSettings(env: Env, p: Partial<SmsSettings>): Promise<SmsSettings> {
  const cur = await getSmsSettings(env);
  const next: SmsSettings = { enabled: p.enabled ?? cur.enabled, ready: p.ready ?? cur.ready, access: p.access ?? cur.access, reminder: p.reminder ?? cur.reminder };
  await env.ACCOUNTS_KV.put('sms-settings', JSON.stringify(next));
  return next;
}

export function smsProvider(env: Env): 'brevo' | 'twilio' | null {
  if (env.SMS_PROVIDER === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM) return 'twilio';
  if (env.SMS_PROVIDER === 'brevo' && env.BREVO_API_KEY) return 'brevo';
  return null;
}

/** Numéro → format international (+33…). Renvoie '' si le numéro n'est pas exploitable. */
export function toE164(raw: string | undefined | null): string {
  let n = (raw ?? '').replace(/[\s.\-()]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  if (n.startsWith('0') && /^0\d{9}$/.test(n)) n = '+33' + n.slice(1);
  else if (/^33\d{9}$/.test(n)) n = '+' + n;
  return /^\+\d{8,15}$/.test(n) ? n : '';
}

/** Remplace les caractères hors alphabet SMS standard (GSM 7 bits) pour rester sur un SMS de 160 caractères. */
export function gsmSafe(t: string): string {
  const map: Record<string, string> = { ê: 'e', ë: 'e', â: 'a', ä: 'a', î: 'i', ï: 'i', ô: 'o', ö: 'o', û: 'u', ü: 'u', ç: 'c', œ: 'oe', Œ: 'OE', À: 'A', Â: 'A', É: 'E', È: 'E', Ê: 'E', Ô: 'O', Î: 'I', Ç: 'C', '’': "'", '‘': "'", '“': '"', '”': '"', '«': '"', '»': '"', '–': '-', '—': '-', '…': '...', ' ': ' ', ' ': ' ', '⊹': '' };
  return t.replace(/[^\x00-\x7F]/g, (c) => ('éèùàìòÉ'.includes(c) && c !== 'É' ? c : map[c] ?? '')).replace(/\s{2,}/g, ' ').trim();
}

async function deliver(env: Env, to: string, text: string): Promise<void> {
  const provider = smsProvider(env);
  if (!provider) throw new Error('sms_not_configured');
  if (provider === 'brevo') {
    const res = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: { 'api-key': env.BREVO_API_KEY!, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ sender: (env.SMS_SENDER || 'BUNKAIO').slice(0, 11), recipient: to.replace('+', ''), content: text, type: 'transactional' }),
    });
    if (!res.ok) throw new Error(`brevo_${res.status}: ${(await res.text()).slice(0, 120)}`);
    return;
  }
  const form = new URLSearchParams({ To: to, From: env.TWILIO_FROM!, Body: text });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  if (!res.ok) throw new Error(`twilio_${res.status}: ${(await res.text()).slice(0, 120)}`);
}

/** Envoi d'un SMS + trace dans l'historique du contact. Lève une erreur en cas d'échec. */
export async function sendSms(env: Env, p: { to: string; text: string; email?: string; tpl: string }): Promise<void> {
  const to = toE164(p.to);
  if (!to) throw new Error('invalid_phone');
  const text = gsmSafe(p.text).slice(0, 460);
  let err: unknown = null;
  try { await deliver(env, to, text); } catch (e) { err = e; }
  if (p.email) await logMail(env, p.email, p.tpl, 'SMS : ' + text.slice(0, 150), !err).catch(() => undefined);
  if (err) throw err;
}

export type SmsKind = 'ready' | 'access' | 'reminder';
export const SMS_TPL: Record<SmsKind, string> = { ready: 'sms_photos_pretes', access: 'sms_acces_album', reminder: 'sms_rappel_seance' };

/**
 * SMS automatique : appliqué seulement si les SMS sont activés (et ce type), si le contact ne les a pas refusés,
 * si le numéro est valide et si ce SMS n'a pas déjà été envoyé pour `ref`. Ne lève jamais d'erreur.
 */
export async function autoSms(env: Env, kind: SmsKind, p: { email: string; phone?: string | null; text: string; ref: string }): Promise<void> {
  try {
    const st = await getSmsSettings(env);
    if (!st.enabled || !st[kind] || !smsProvider(env)) return;
    const email = p.email.trim().toLowerCase();
    if (await env.ACCOUNTS_KV.get(`smsoff:${email}`)) return;
    if (!toE164(p.phone)) return;
    const flag = `smsent:${kind}:${p.ref}`;
    if (await env.ACCOUNTS_KV.get(flag)) return;
    await sendSms(env, { to: p.phone!, text: p.text, email, tpl: SMS_TPL[kind] });
    await env.ACCOUNTS_KV.put(flag, '1', { expirationTtl: 120 * 86400 });
  } catch (err) {
    console.error('[sms] envoi automatique en échec', kind, err);
  }
}
