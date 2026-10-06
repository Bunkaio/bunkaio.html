import { getAccount } from './accounts';
import { buildReplyEmail, sendEmail } from './email';
import { notifyAdmin } from './push';
import type { Env } from './types';

/**
 * Boîte de réception : la messagerie (Zoho) transfère une copie de contact@bunkaio.com vers une adresse de
 * réception Resend ; le Worker la relève par l'API Resend. L'original reste dans la messagerie Zoho.
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
  /** Épinglé : reste en haut de la liste. */
  pinned?: boolean;
  /** Clés de couleur (voir LABEL_KEYS). */
  labels?: string[];
  archived: boolean;
  /** Rangé automatiquement (ou à la main) dans le dossier Spam. */
  spam?: boolean;
  repliedAt?: string;
  note?: string;
}

const PREFIX = 'inbox:';
const TTL = 2 * 365 * 24 * 3600;
const TEXT_MAX = 30_000;
const HTML_MAX = 120_000;

const cut = (s: string | undefined, n: number): string => (s ?? '').slice(0, n);
const randomHex = (n: number): string => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, '0')).join('');

const RESEND = 'https://api.resend.com';
interface ResendAttachment { filename?: string; size?: number; content_type?: string; contentType?: string }
interface ResendReceived { id: string; from?: string; to?: string[] | string; subject?: string; html?: string | null; text?: string | null; created_at?: string; message_id?: string; reply_to?: string[] | string | null; headers?: Record<string, string> | null; attachments?: ResendAttachment[] }

/** « Nom <adresse> » → { nom, adresse }. */
function parseAddress(raw: string | undefined): { name: string; email: string } {
  const s = (raw ?? '').trim();
  const m = s.match(/^(.*?)<([^>]+)>\s*$/);
  if (m) return { name: m[1]!.replace(/^["'\s]+|["'\s]+$/g, ''), email: m[2]!.trim().toLowerCase() };
  return { name: '', email: s.toLowerCase() };
}
const firstOf = (v: string[] | string | null | undefined): string => (Array.isArray(v) ? v[0] : v) ?? '';

async function resendGet<T>(env: Env, path: string): Promise<T> {
  const res = await fetch(`${RESEND}${path}`, { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } });
  if (!res.ok) throw new Error(`resend_${res.status}`);
  return (await res.json()) as T;
}

/**
 * Relève les emails reçus par Resend (adresse de réception dédiée, vers laquelle Zoho transfère une copie
 * de contact@bunkaio.com) et les range dans la boîte de réception. Sans webhook : appelé par la tâche
 * planifiée (toutes les 5 minutes) et par le bouton « Relever le courrier ». Chaque email n'est enregistré
 * qu'une fois (repère par identifiant Resend).
 */
export async function syncResendInbox(env: Env): Promise<{ added: number; checked: number }> {
  const list = await resendGet<{ data?: Array<{ id: string }>; emails?: Array<{ id: string }> }>(env, '/emails/receiving?limit=50');
  const items = list.data ?? list.emails ?? [];
  let added = 0;
  let lastStored: InboxMessage | null = null;
  for (const it of items) {
    if (!it?.id || (await env.ACCOUNTS_KV.get(`inbox-rid:${it.id}`))) continue;
    try {
      const m = await resendGet<ResendReceived>(env, `/emails/receiving/${encodeURIComponent(it.id)}`);
      const stored = await storeReceived(env, m);
      await env.ACCOUNTS_KV.put(`inbox-rid:${it.id}`, '1', { expirationTtl: 90 * 86400 });
      if (stored.spam) continue;
      added++;
      lastStored = stored;
    } catch (err) {
      console.error('[inbox] email non relevé', it.id, err);
    }
  }
  if (added && lastStored) {
    const from = lastStored.fromName || lastStored.fromEmail;
    await notifyAdmin(env, added > 1 ? { title: `${added} nouveaux emails`, body: `Dont « ${lastStored.subject} » de ${from}`, url: '/admin/#inbox' } : { title: `Email de ${from}`, body: lastStored.subject, url: '/admin/#inbox' });
  }
  return { added, checked: items.length };
}

async function storeReceived(env: Env, m: ResendReceived): Promise<InboxMessage> {
  const now = new Date();
  const from = parseAddress(m.from);
  // Un email transféré par Zoho garde normalement l'expéditeur d'origine ; sinon on prend l'adresse de réponse.
  const replyTo = parseAddress(firstOf(m.reply_to));
  const forwarder = !from.email || /@(bunkaio\.com|zoho\.[a-z]+|zohomail\.[a-z]+)$/.test(from.email);
  const who = forwarder && replyTo.email ? replyTo : from;
  const created = m.created_at && !Number.isNaN(Date.parse(m.created_at)) ? new Date(m.created_at) : now;
  const msg: InboxMessage = {
    id: `${created.toISOString()}~${(m.id || randomHex(3)).replace(/[^a-z0-9]/gi, '').slice(0, 8)}`,
    date: created.toISOString(),
    fromName: cut(who.name, 200),
    fromEmail: cut(who.email, 250),
    to: cut(firstOf(m.to), 250),
    subject: cut(m.subject || '(sans objet)', 300),
    text: cut(m.text ?? '', TEXT_MAX),
    html: cut(m.html ?? '', HTML_MAX),
    attachments: (m.attachments ?? []).slice(0, 20).map((a) => ({ filename: cut(a.filename || 'pièce jointe', 200), size: a.size ?? 0, type: cut(a.content_type || a.contentType, 100) })),
    messageId: cut(m.message_id, 300),
    read: false,
    starred: false,
    archived: false,
  };
  if (await looksLikeSpam(env, msg)) { msg.spam = true; msg.read = true; }
  await env.ACCOUNTS_KV.put(PREFIX + msg.id, JSON.stringify(msg), { expirationTtl: TTL, metadata: summary(msg) });
  return msg;
}

/** Métadonnées stockées avec la clé : la liste se lit sans relire chaque message complet. */
export const LABEL_KEYS = ['rouge', 'orange', 'jaune', 'vert', 'bleu', 'violet', 'rose', 'gris'] as const;
export const DEFAULT_LABELS: Record<string, string> = { rouge: 'Urgent', orange: 'À traiter', jaune: 'Devis', vert: 'Client', bleu: 'Partenaire', violet: 'À répondre', rose: 'Personnel', gris: 'Info' };

function summary(m: InboxMessage): Record<string, unknown> {
  // Métadonnées KV limitées à 1 024 octets : champs tronqués (accents = 2 octets).
  const s = { d: m.date, fn: m.fromName.slice(0, 40), fe: m.fromEmail.slice(0, 80), s: m.subject.slice(0, 90), p: m.text.replace(/\s+/g, ' ').slice(0, 90), r: m.read, st: m.starred, pi: m.pinned === true, lb: (m.labels ?? []).join(','), a: m.archived, sp: m.spam === true, att: m.attachments.length, rep: !!m.repliedAt };
  if (JSON.stringify(s).length > 900) s.p = s.p.slice(0, 30);
  return s;
}

export async function getLabelNames(env: Env): Promise<Record<string, string>> {
  try { return { ...DEFAULT_LABELS, ...(JSON.parse((await env.ACCOUNTS_KV.get('inbox-labels')) ?? '{}') as Record<string, string>) }; } catch { return { ...DEFAULT_LABELS }; }
}
export async function setLabelNames(env: Env, names: Record<string, unknown>): Promise<void> {
  const clean: Record<string, string> = {};
  for (const k of LABEL_KEYS) if (typeof names[k] === 'string' && (names[k] as string).trim()) clean[k] = (names[k] as string).trim().slice(0, 24);
  await env.ACCOUNTS_KV.put('inbox-labels', JSON.stringify(clean));
}

export interface InboxItem { id: string; date: string; fromName: string; fromEmail: string; subject: string; preview: string; read: boolean; starred: boolean; pinned: boolean; labels: string[]; archived: boolean; spam: boolean; attachments: number; replied: boolean }

export async function listInbox(env: Env): Promise<InboxItem[]> {
  const out: InboxItem[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.ACCOUNTS_KV.list<Record<string, unknown>>({ prefix: PREFIX, limit: 1000, cursor });
    for (const k of page.keys) {
      const m = k.metadata;
      if (!m) continue;
      out.push({ id: k.name.slice(PREFIX.length), date: String(m.d ?? ''), fromName: String(m.fn ?? ''), fromEmail: String(m.fe ?? ''), subject: String(m.s ?? ''), preview: String(m.p ?? ''), read: m.r === true, starred: m.st === true, pinned: m.pi === true, labels: typeof m.lb === 'string' && m.lb ? m.lb.split(',') : [], archived: m.a === true, spam: m.sp === true, attachments: Number(m.att ?? 0), replied: m.rep === true });
    }
    cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
  } while (cursor && out.length < 3000);
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/* ── Filtre anti-spam ──
   Règles propres au site (expéditeurs bloqués et mots-clés, modifiables dans le tableau de bord) + une courte liste de
   formulations très typiques. Un contact connu (compte client/partenaire) n'est jamais classé en spam, ni un email
   déjà traité (favori, épinglé, étiqueté, répondu). Les emails classés en spam ne déclenchent pas de notification. */
export interface SpamRules { senders: string[]; keywords: string[] }
export const DEFAULT_SPAM_KEYWORDS = ['viagra', 'cialis', 'casino en ligne', 'online casino', 'bitcoin', 'crypto-monnaie', 'cryptomonnaie', 'investissement garanti', 'gagnez de l\'argent', 'gagner de l\'argent', 'loterie', 'héritage', 'backlinks', 'première page de google', 'premiere page de google', 'augmenter votre trafic', 'referencement garanti', 'référencement garanti', 'rencontres adultes', 'prêt rapide sans justificatif', 'bark.com'];

export async function getSpamRules(env: Env): Promise<SpamRules> {
  try {
    const r = JSON.parse((await env.ACCOUNTS_KV.get('inbox-spam-rules')) ?? '{}') as Partial<SpamRules>;
    return { senders: Array.isArray(r.senders) ? r.senders.map(String) : [], keywords: Array.isArray(r.keywords) ? r.keywords.map(String) : [] };
  } catch { return { senders: [], keywords: [] }; }
}
export async function setSpamRules(env: Env, input: Partial<Record<keyof SpamRules, unknown>>): Promise<SpamRules> {
  const clean = (v: unknown, max: number): string[] => [...new Set((Array.isArray(v) ? v : []).map((x) => String(x).trim().toLowerCase()).filter((x) => x.length >= 3 && x.length <= max))].slice(0, 200);
  const rules = { senders: clean(input.senders, 120), keywords: clean(input.keywords, 80) };
  await env.ACCOUNTS_KV.put('inbox-spam-rules', JSON.stringify(rules));
  return rules;
}

async function isKnownContact(env: Env, email: string): Promise<boolean> {
  if (!email) return false;
  try {
    if (await getAccount(env, 'client', email)) return true;
    if (await getAccount(env, 'partner', email)) return true;
    if (await env.ACCOUNTS_KV.get(`lead:${email}`)) return true;
  } catch { /* en cas de doute, on ne bloque rien */ }
  return false;
}

function matchesSpam(msg: Pick<InboxMessage, 'fromEmail' | 'subject' | 'text'>, rules: SpamRules): string | null {
  const email = msg.fromEmail.toLowerCase();
  const domain = email.split('@')[1] ?? '';
  for (const s of rules.senders) if (s.includes('@') ? email === s : (domain === s || domain.endsWith('.' + s))) return `expéditeur ${s}`;
  const hay = `${msg.subject}\n${msg.text.slice(0, 4000)}`.toLowerCase();
  for (const k of [...rules.keywords, ...DEFAULT_SPAM_KEYWORDS]) if (hay.includes(k.toLowerCase())) return `mot-clé « ${k} »`;
  return null;
}

async function looksLikeSpam(env: Env, msg: InboxMessage): Promise<boolean> {
  if (await isKnownContact(env, msg.fromEmail)) return false;
  return matchesSpam(msg, await getSpamRules(env)) !== null;
}

/** Applique les règles aux emails déjà reçus (hors favoris, épinglés, étiquetés ou déjà traités). */
export async function rescanSpam(env: Env): Promise<{ moved: number; checked: number }> {
  const rules = await getSpamRules(env);
  const items = await listInbox(env);
  let moved = 0, checked = 0;
  for (const it of items) {
    if (it.spam || it.starred || it.pinned || it.labels.length || it.replied) continue;
    checked++;
    const msg = await getInboxMessage(env, it.id);
    if (!msg || msg.repliedAt || msg.starred || msg.pinned) continue;
    if (await isKnownContact(env, msg.fromEmail)) continue;
    if (matchesSpam(msg, rules)) { await updateInbox(env, it.id, { spam: true, read: true }); moved++; }
  }
  return { moved, checked };
}

export async function getInboxMessage(env: Env, id: string): Promise<InboxMessage | null> {
  const raw = await env.ACCOUNTS_KV.get(PREFIX + id);
  return raw ? (JSON.parse(raw) as InboxMessage) : null;
}

export async function updateInbox(env: Env, id: string, change: Partial<Pick<InboxMessage, 'read' | 'starred' | 'pinned' | 'archived' | 'spam' | 'note'>> & { labels?: string[]; remove?: boolean }): Promise<boolean> {
  const msg = await getInboxMessage(env, id);
  if (!msg) return false;
  if (change.remove) { await env.ACCOUNTS_KV.delete(PREFIX + id); return true; }
  for (const k of ['read', 'starred', 'pinned', 'archived', 'spam'] as const) if (typeof change[k] === 'boolean') msg[k] = change[k]!;
  if (Array.isArray(change.labels)) msg.labels = [...new Set(change.labels.filter((l): l is string => (LABEL_KEYS as readonly string[]).includes(l)))];
  if (typeof change.note === 'string') msg.note = change.note.slice(0, 2000);
  await env.ACCOUNTS_KV.put(PREFIX + id, JSON.stringify(msg), { expirationTtl: TTL, metadata: summary(msg) });
  return true;
}

/**
 * Réponse envoyée depuis le tableau de bord, avec le chaînage standard (In-Reply-To / References)
 * pour que la conversation reste groupée chez le destinataire. Adresse d'expédition : EMAIL_FROM.
 */
async function buildReplyFor(env: Env, id: string, body: string, subject?: string): Promise<{ msg: InboxMessage; mail: { subject: string; html: string; text: string }; headers: Record<string, string> }> {
  const msg = await getInboxMessage(env, id);
  if (!msg) throw new Error('not_found');
  if (!body.trim()) throw new Error('empty');
  const re = subject?.trim() || (/^re\s*:/i.test(msg.subject) ? msg.subject : `Re: ${msg.subject}`);
  const when = new Date(msg.date).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' });
  const mail = buildReplyEmail({ subject: re, body, quotedFrom: msg.fromName || msg.fromEmail, quotedDate: when, quotedText: msg.text });
  const headers: Record<string, string> = {};
  if (msg.messageId) { headers['In-Reply-To'] = msg.messageId; headers['References'] = msg.messageId; }
  return { msg, mail, headers };
}

/** Aperçu exact de la réponse (même gabarit que les emails automatiques), sans l'envoyer. */
export async function previewReply(env: Env, id: string, body: string, subject?: string): Promise<{ subject: string; html: string }> {
  const { mail } = await buildReplyFor(env, id, body, subject);
  return { subject: mail.subject, html: mail.html };
}

/**
 * Réponse envoyée depuis le tableau de bord : même gabarit et même signature que les emails automatiques,
 * avec le chaînage standard (In-Reply-To / References) pour que la conversation reste groupée chez le destinataire.
 */
export async function replyTo(env: Env, id: string, body: string, subject?: string): Promise<void> {
  const { msg, mail, headers } = await buildReplyFor(env, id, body, subject);
  await sendEmail(env, msg.fromEmail, mail.subject, mail.html, mail.text, undefined, { headers, replyTo: env.ADMIN_NOTIFICATION_EMAIL });
  msg.repliedAt = new Date().toISOString();
  msg.read = true;
  await env.ACCOUNTS_KV.put(PREFIX + id, JSON.stringify(msg), { expirationTtl: TTL, metadata: summary(msg) });
}
