import PostalMime from 'postal-mime';
import type { Env } from './types';

/**
 * Boîte de réception : les emails reçus sur contact@bunkaio.com sont aiguillés par Cloudflare
 * Email Routing vers ce Worker (handler `email`), enregistrés ici, puis (si INBOX_FORWARD_TO est
 * défini) transférés tels quels vers la vraie boîte mail — l'original n'est donc jamais perdu.
 * Les pièces jointes ne sont pas conservées dans le tableau de bord (seulement leur liste).
 */
export interface InboxMessage {
  id: string;
  date: string;
  fromName: string;
  fromEmail: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: Array<{ filename: string; size: number; type: string }>;
  messageId: string;
  read: boolean;
  starred: boolean;
  archived: boolean;
  repliedAt?: string;
  note?: string;
}

const PREFIX = 'inbox:';
const TTL = 2 * 365 * 24 * 3600;
const TEXT_MAX = 30_000;
const HTML_MAX = 120_000;
const MAX_RAW = 12 * 1024 * 1024;

const cut = (s: string | undefined, n: number): string => (s ?? '').slice(0, n);
const randomHex = (n: number): string => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');

export async function storeIncoming(env: Env, raw: ArrayBuffer | Uint8Array | ReadableStream, envelopeFrom: string, envelopeTo: string): Promise<InboxMessage> {
  const parsed = await PostalMime.parse(raw as ArrayBuffer);
  const from = parsed.from;
  const now = new Date();
  const date = parsed.date && !Number.isNaN(Date.parse(parsed.date)) ? new Date(parsed.date) : now;
  const msg: InboxMessage = {
    id: `${now.toISOString()}~${randomHex(3)}`,
    date: (date.getTime() > now.getTime() + 864e5 ? now : date).toISOString(),
    fromName: cut(from?.name, 200),
    fromEmail: cut(from?.address || envelopeFrom, 250).toLowerCase(),
    to: cut(envelopeTo, 250),
    subject: cut(parsed.subject || '(sans objet)', 300),
    text: cut(parsed.text, TEXT_MAX),
    html: cut(parsed.html, HTML_MAX),
    attachments: (parsed.attachments ?? []).slice(0, 20).map((a) => ({ filename: cut(a.filename || 'pièce jointe', 200), size: typeof a.content === 'string' ? a.content.length : a.content?.byteLength ?? 0, type: cut(a.mimeType, 100) })),
    messageId: cut(parsed.messageId, 300),
    read: false,
    starred: false,
    archived: false,
  };
  await env.ACCOUNTS_KV.put(PREFIX + msg.id, JSON.stringify(msg), { expirationTtl: TTL, metadata: summary(msg) });
  return msg;
}

/** Métadonnées stockées avec la clé : la liste se lit sans relire chaque message complet. */
function summary(m: InboxMessage): Record<string, unknown> {
  return { d: m.date, fn: m.fromName.slice(0, 60), fe: m.fromEmail, s: m.subject.slice(0, 120), p: m.text.replace(/\s+/g, ' ').slice(0, 110), r: m.read, st: m.starred, a: m.archived, att: m.attachments.length, rep: !!m.repliedAt };
}

export interface InboxItem { id: string; date: string; fromName: string; fromEmail: string; subject: string; preview: string; read: boolean; starred: boolean; archived: boolean; attachments: number; replied: boolean }

export async function listInbox(env: Env): Promise<InboxItem[]> {
  const out: InboxItem[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.ACCOUNTS_KV.list<Record<string, unknown>>({ prefix: PREFIX, limit: 1000, cursor });
    for (const k of page.keys) {
      const m = k.metadata;
      if (!m) continue;
      out.push({ id: k.name.slice(PREFIX.length), date: String(m.d ?? ''), fromName: String(m.fn ?? ''), fromEmail: String(m.fe ?? ''), subject: String(m.s ?? ''), preview: String(m.p ?? ''), read: m.r === true, starred: m.st === true, archived: m.a === true, attachments: Number(m.att ?? 0), replied: m.rep === true });
    }
    cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
  } while (cursor && out.length < 3000);
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export async function getInboxMessage(env: Env, id: string): Promise<InboxMessage | null> {
  const raw = await env.ACCOUNTS_KV.get(PREFIX + id);
  return raw ? (JSON.parse(raw) as InboxMessage) : null;
}

export async function updateInbox(env: Env, id: string, change: Partial<Pick<InboxMessage, 'read' | 'starred' | 'archived' | 'note'>> & { remove?: boolean }): Promise<boolean> {
  const msg = await getInboxMessage(env, id);
  if (!msg) return false;
  if (change.remove) { await env.ACCOUNTS_KV.delete(PREFIX + id); return true; }
  for (const k of ['read', 'starred', 'archived'] as const) if (typeof change[k] === 'boolean') msg[k] = change[k]!;
  if (typeof change.note === 'string') msg.note = change.note.slice(0, 2000);
  await env.ACCOUNTS_KV.put(PREFIX + id, JSON.stringify(msg), { expirationTtl: TTL, metadata: summary(msg) });
  return true;
}

const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Réponse envoyée depuis le tableau de bord, avec le chaînage standard (In-Reply-To / References)
 * pour que la conversation reste groupée chez le destinataire. Adresse d'expédition : EMAIL_FROM.
 */
export async function replyTo(env: Env, id: string, body: string, subject?: string): Promise<void> {
  const msg = await getInboxMessage(env, id);
  if (!msg) throw new Error('not_found');
  const text = body.trim();
  if (!text) throw new Error('empty');
  const re = subject?.trim() || (/^re\s*:/i.test(msg.subject) ? msg.subject : `Re: ${msg.subject}`);
  const quoted = msg.text.split('\n').slice(0, 40).map((l) => `> ${l}`).join('\n');
  const when = new Date(msg.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' });
  const signature = 'Aya Nascimento\nBUNKAIO — Photographe professionnelle\n07 58 57 31 61 · contact@bunkaio.com · bunkaio.com';
  const fullText = `${text}\n\n--\n${signature}\n\nLe ${when}, ${msg.fromName || msg.fromEmail} a écrit :\n${quoted}`;
  const html = `<div style="font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#0a0a0c;">${esc(text).replace(/\n/g, '<br>')}<br><br><span style="color:#76717f;">--<br>${esc(signature).replace(/\n/g, '<br>')}</span><blockquote style="margin:20px 0 0;padding:0 0 0 14px;border-left:3px solid #d9cdf5;color:#76717f;font-size:13.5px;">Le ${esc(when)}, ${esc(msg.fromName || msg.fromEmail)} a écrit :<br><br>${esc(msg.text.slice(0, 4000)).replace(/\n/g, '<br>')}</blockquote></div>`;
  const headers: Record<string, string> = {};
  if (msg.messageId) { headers['In-Reply-To'] = msg.messageId; headers['References'] = msg.messageId; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: msg.fromEmail, subject: re, html, text: fullText, headers, reply_to: env.ADMIN_NOTIFICATION_EMAIL }),
  });
  if (!res.ok) throw new Error(`resend_error: ${res.status} ${(await res.text()).slice(0, 120)}`);
  msg.repliedAt = new Date().toISOString();
  msg.read = true;
  await env.ACCOUNTS_KV.put(PREFIX + id, JSON.stringify(msg), { expirationTtl: TTL, metadata: summary(msg) });
  // Trace de la réponse dans l'historique du contact (même journal que les emails automatiques).
  const key = `maillog:${msg.fromEmail}`;
  let log: Array<{ t: string; s: string; d: string; ok: boolean }> = [];
  try { log = JSON.parse((await env.ACCOUNTS_KV.get(key)) ?? '[]'); } catch { log = []; }
  const entry = { t: 'reponse', s: re.slice(0, 200), d: msg.repliedAt, ok: true };
  log.push(entry);
  await env.ACCOUNTS_KV.put(key, JSON.stringify(log.slice(-80)), { metadata: { last: entry.d, t: 'reponse', n: log.length, ok: true }, expirationTtl: 3 * 365 * 24 * 3600 });
}

export { MAX_RAW };
