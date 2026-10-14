import type { AccountRecord, Env } from './types';

/**
 * Places du Programme Partenaires Fondateurs : 10 par univers (portrait, mode, commercial, evenementiel, mariage).
 * Une place est prise par un compte partenaire dont `partenariat.secteur` = l'univers et `partenariat.statut` = « Actif ».
 * « En attente » et « Terminé », comme un compte supprimé, libèrent (ou ne prennent pas) la place.
 * Le décompte est recalculé à la demande depuis les comptes, puis gardé en cache KV 5 min ; le cache est effacé dès qu'un compte
 * partenaire est créé, modifié ou supprimé (putAccount, deleteContact), donc le site se met à jour sans attendre.
 */
export const PARTNER_UNIVERSES = ['portrait', 'mode', 'commercial', 'evenementiel', 'mariage'] as const;
export const PARTNER_CAPACITY = 10;
const CACHE_KEY = 'partnerspots:v1';
const CACHE_TTL_S = 300;

export interface PartnerSpots { capacity: number; taken: Record<string, number>; left: Record<string, number>; at: string }

export async function invalidatePartnerSpots(env: Env): Promise<void> {
  await env.ACCOUNTS_KV.delete(CACHE_KEY).catch(() => undefined);
}

async function compute(env: Env): Promise<PartnerSpots> {
  const taken: Record<string, number> = Object.fromEntries(PARTNER_UNIVERSES.map((u) => [u, 0]));
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
    }
    cursor = page.list_complete ? undefined : (page as { cursor?: string }).cursor;
  } while (cursor);
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
