/* Séries du Portfolio (nov. 2026) : présentées par projet sur la page Portfolio (titre FR/EN, client, année, univers, numéros des
   photos de la catégorie, texte court). Éditées dans l'admin (Média > Séries du Portfolio), lues par le site (GET public
   /portfolio-series, sans donnée personnelle). Liste vide = le site présente un chapitre par univers. */
import type { Env } from './types';

const KEY = 'portfolio:series';
const CATS = ['photo-part', 'corporate', 'mode', 'commercial', 'event', 'collaboration'];
export interface Series { id: string; title: { fr: string; en: string }; client: string; year: string; cat: string; photos: (number | string)[]; text: { fr: string; en: string }; hidden?: boolean; }

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

export function cleanSeries(input: unknown): Series[] {
  const list = Array.isArray(input) ? input.slice(0, 60) : [];
  const out: Series[] = []; const ids = new Set<string>();
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const t = (r.title ?? {}) as Record<string, unknown>, x = (r.text ?? {}) as Record<string, unknown>;
    const title = { fr: str(t.fr, 90), en: str(t.en, 90) };
    if (!title.fr && !title.en) continue;
    const cat = CATS.includes(String(r.cat)) ? String(r.cat) : '';
    if (!cat) continue;
    /* Une photo = un numéro de l'univers de la série, ou « univers:numéro » pour une photo d'un autre univers. */
    const photos: (number | string)[] = [];
    for (const n of (Array.isArray(r.photos) ? r.photos : [])) {
      const m = String(n).match(/^(?:([a-z-]+):)?(\d+)$/); if (!m || !m[2]) continue;
      const num = parseInt(m[2], 10); if (num < 1 || num > 60) continue;
      const pc = m[1] || cat; if (!CATS.includes(pc)) continue;
      photos.push(pc === cat ? num : pc + ':' + num);
    }
    let id = slug(str(r.id, 60) || title.fr || title.en) || 'serie';
    while (ids.has(id)) id += '-2';
    ids.add(id);
    out.push({ id, title, client: str(r.client, 80), year: str(r.year, 9), cat, photos: [...new Set(photos)].slice(0, 60), text: { fr: str(x.fr, 400), en: str(x.en, 400) }, hidden: r.hidden === true });
  }
  return out;
}
export async function getSeries(env: Env): Promise<Series[]> {
  const raw = await env.ACCOUNTS_KV.get(KEY);
  if (!raw) return [];
  try { return cleanSeries(JSON.parse(raw)); } catch { return []; }
}
export async function saveSeries(env: Env, input: unknown): Promise<Series[]> {
  const list = cleanSeries(input);
  await env.ACCOUNTS_KV.put(KEY, JSON.stringify(list));
  return list;
}
