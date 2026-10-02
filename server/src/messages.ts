import type { Env } from './types';

/**
 * Messages des formulaires du site (contact, collaboration, candidature partenaire,
 * demande d'espace, témoignage), conservés pour le tableau de bord admin.
 * Durée de conservation : 3 ans (durée usuelle pour des données de prospects).
 */
export type MessageKind = 'contact' | 'collab' | 'partner' | 'account' | 'share';
export const MESSAGE_KINDS: MessageKind[] = ['contact', 'collab', 'partner', 'account', 'share'];
export interface FormMessage {
  id: string;
  kind: MessageKind;
  date: string;
  name: string;
  email: string;
  lang: string;
  details: Record<string, string>;
  status: 'nouveau' | 'traite';
}

const PREFIX = 'msg:';
const TTL = 3 * 365 * 24 * 3600;

/** Ne garde que des chaînes courtes (anti-abus : le formulaire est public). */
export function cleanDetails(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 15)) {
    if (!/^[a-zA-Z_]{1,30}$/.test(k)) continue;
    if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue;
    const s = String(v).trim().slice(0, 3000);
    if (s) out[k] = s;
  }
  return out;
}

export async function storeMessage(env: Env, msg: Omit<FormMessage, 'id' | 'date' | 'status'>): Promise<FormMessage> {
  const date = new Date().toISOString();
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('');
  const full: FormMessage = { ...msg, id: `${date}:${rand}`, date, status: 'nouveau' };
  await env.ACCOUNTS_KV.put(PREFIX + full.id, JSON.stringify(full), { expirationTtl: TTL });
  return full;
}

export async function listMessages(env: Env): Promise<FormMessage[]> {
  const keys = (await env.ACCOUNTS_KV.list({ prefix: PREFIX, limit: 1000 })).keys;
  const all = await Promise.all(keys.map(async (k) => {
    try { return JSON.parse((await env.ACCOUNTS_KV.get(k.name)) ?? 'null') as FormMessage | null; } catch { return null; }
  }));
  return all.filter((m): m is FormMessage => !!m).sort((a, b) => b.date.localeCompare(a.date));
}

export async function updateMessage(env: Env, id: string, change: { status?: FormMessage['status']; remove?: boolean }): Promise<boolean> {
  const key = PREFIX + id;
  const raw = await env.ACCOUNTS_KV.get(key);
  if (!raw) return false;
  if (change.remove) { await env.ACCOUNTS_KV.delete(key); return true; }
  const msg = JSON.parse(raw) as FormMessage;
  if (change.status) msg.status = change.status;
  await env.ACCOUNTS_KV.put(key, JSON.stringify(msg), { expirationTtl: TTL });
  return true;
}

export async function deleteMessagesOf(env: Env, email: string): Promise<number> {
  const target = email.trim().toLowerCase();
  let n = 0;
  for (const m of await listMessages(env)) {
    if (m.email.toLowerCase() === target) { await env.ACCOUNTS_KV.delete(PREFIX + m.id); n++; }
  }
  return n;
}
