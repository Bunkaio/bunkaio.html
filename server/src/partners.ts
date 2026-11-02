import type { AccountRecord, Env } from './types';

/**
 * Places du Programme Partenaires Fondateurs : 5 par univers (réduit de 10 à 5 le 14 oct. 2026, soit 25 au total) (portrait, mode, commercial, evenementiel, mariage).
 * Une place est prise par un compte partenaire dont `partenariat.secteur` = l'univers et `partenariat.statut` = « Actif ».
 * « En attente » et « Terminé », comme un compte supprimé, libèrent (ou ne prennent pas) la place.
 * Partenaires déjà acceptés sans espace créé : liste FOUNDING_PARTNERS (Wolf Silveri en portrait, ÉCLAT en événementiel, nov. 2026).
 * Le décompte est recalculé à la demande depuis les comptes, puis gardé en cache KV 5 min ; le cache est effacé dès qu'un compte
 * partenaire est créé, modifié ou supprimé (putAccount, deleteContact), donc le site se met à jour sans attendre.
 */
export const PARTNER_UNIVERSES = ['portrait', 'mode', 'commercial', 'evenementiel', 'mariage'] as const;
export const PARTNER_CAPACITY = 5;
/** Partenaires fondateurs déjà acceptés dont l'espace n'est pas (encore) créé : ils occupent une place. Dès qu'un compte partenaire actif porte le même nom, il remplace cette ligne (jamais compté deux fois). */
export const FOUNDING_PARTNERS: { name: string; sector: typeof PARTNER_UNIVERSES[number] }[] = [
  { name: 'Wolf Silveri', sector: 'portrait' },
  { name: 'ÉCLAT', sector: 'evenementiel' },
];
const normName = (v: unknown): string => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const CACHE_KEY = 'partnerspots:v3';
const CACHE_TTL_S = 300;

export interface PartnerSpots { capacity: number; taken: Record<string, number>; left: Record<string, number>; at: string }

export async function invalidatePartnerSpots(env: Env): Promise<void> {
  await env.ACCOUNTS_KV.delete(CACHE_KEY).catch(() => undefined);
}

async function compute(env: Env): Promise<PartnerSpots> {
  const taken: Record<string, number> = Object.fromEntries(PARTNER_UNIVERSES.map((u) => [u, 0]));
  const countedNames = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await env.ACCOUNTS_KV.list<{ type?: string }>({ prefix: 'account:partner:', limit: 1000, cursor });
    for (const k of page.keys) {
      const raw = await env.ACCOUNTS_KV.get(k.name);
      if (!raw) continue;
      let acc: AccountRecord;
      try { acc = JSON.parse(raw) as AccountRecord; } catch { continue; }
      const p = acc.partenariat;
      const sector = String(p?.secteur ?? '').trim().toLowerCase();
      if (!p || String(p.statut ?? '').trim().toLowerCase() !== 'actif' || !(sector in taken)) continue;
      taken[sector] = (taken[sector] ?? 0) + 1;
      countedNames.add(normName(acc.nom));
    }
    cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
  } while (cursor);
  for (const f of FOUNDING_PARTNERS) {
    const n = normName(f.name);
    const hasAccount = [...countedNames].some((c) => c && (c === n || c.includes(n) || n.includes(c)));
    if (!hasAccount) taken[f.sector] = (taken[f.sector] ?? 0) + 1;
  }
  const left = Object.fromEntries(PARTNER_UNIVERSES.map((u) => [u, Math.max(0, PARTNER_CAPACITY - (taken[u] ?? 0))]));
  return { capacity: PARTNER_CAPACITY, taken, left, at: new Date().toISOString() };
}

export async function getPartnerSpots(env: Env): Promise<PartnerSpots> {
  try {
    const cached = await env.ACCOUNTS_KV.get(CACHE_KEY);
    if (cached) return JSON.parse(cached) as PartnerSpots;
  } catch { /* cache illisible : recalcul */ }
  const fresh = await compute(env);
  await env.ACCOUNTS_KV.put(CACHE_KEY, JSON.stringify(fresh), { expirationTtl: CACHE_TTL_S }).catch(() => undefined);
  return fresh;
}
