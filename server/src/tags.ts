import type { Env } from './types';

/** Étiquettes de couleur sur les contacts (VIP, à rappeler…). Même palette que la boîte de réception, noms propres. */
export const TAG_KEYS = ['rouge', 'orange', 'jaune', 'vert', 'bleu', 'violet', 'rose', 'gris'] as const;
export const DEFAULT_TAG_NAMES: Record<string, string> = { rouge: 'À rappeler', orange: 'Prioritaire', jaune: 'À relancer', vert: 'VIP', bleu: 'Partenaire', violet: 'Presse', rose: 'Proche', gris: 'À archiver' };

export async function getTagNames(env: Env): Promise<Record<string, string>> {
  try { return { ...DEFAULT_TAG_NAMES, ...(JSON.parse((await env.ACCOUNTS_KV.get('contact-tag-names')) ?? '{}') as Record<string, string>) }; } catch { return { ...DEFAULT_TAG_NAMES }; }
}
export async function setTagNames(env: Env, names: Record<string, unknown>): Promise<void> {
  const clean: Record<string, string> = {};
  for (const k of TAG_KEYS) if (typeof names[k] === 'string' && (names[k] as string).trim()) clean[k] = (names[k] as string).trim().slice(0, 24);
  await env.ACCOUNTS_KV.put('contact-tag-names', JSON.stringify(clean));
}
export async function setContactTags(env: Env, email: string, tags: string[]): Promise<string[]> {
  const key = `tags:${email.trim().toLowerCase()}`;
  const clean = [...new Set(tags.filter((t) => (TAG_KEYS as readonly string[]).includes(t)))];
  if (clean.length) await env.ACCOUNTS_KV.put(key, clean.join(','), { metadata: { t: clean.join(',') } });
  else await env.ACCOUNTS_KV.delete(key);
  return clean;
}
