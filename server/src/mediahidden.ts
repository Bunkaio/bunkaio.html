/* Visibilité des images importées (admin > Médias, icône œil) : liste des chemins masqués, stockée dans KV `media:hidden`.
   Une image masquée n'est plus servie au public (404, comme si elle n'avait jamais été importée : tous les emplacements du site
   gèrent déjà une image absente) mais reste dans R2 et reste visible dans l'admin (`?show=1`). */
import type { Env } from './types';

const KEY = 'media:hidden';
let memo: { at: number; set: Set<string> } | null = null;

export async function getHiddenMedia(env: Env): Promise<Set<string>> {
  if (memo && Date.now() - memo.at < 10_000) return memo.set;
  let list: string[] = [];
  try { const v = JSON.parse((await env.ACCOUNTS_KV.get(KEY)) ?? '[]'); if (Array.isArray(v)) list = v.filter((x) => typeof x === 'string'); } catch { /* liste illisible : rien de masqué */ }
  memo = { at: Date.now(), set: new Set(list) };
  return memo.set;
}

export async function setMediaHidden(env: Env, path: string, hidden: boolean): Promise<string[]> {
  const set = new Set(await getHiddenMedia(env));
  if (hidden) set.add(path); else set.delete(path);
  const list = [...set].slice(0, 2000);
  await env.ACCOUNTS_KV.put(KEY, JSON.stringify(list));
  memo = { at: Date.now(), set: new Set(list) };
  return list;
}
