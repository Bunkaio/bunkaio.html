import type { Env } from './types';
import { notifyAdmin } from './push';

/* ════════════════════════════════════════════════════════════════
   VEILLE DU SITE — contrôle automatique toutes les 12 heures (cron)
   Vérifie le site public, les pages du sitemap, les fichiers JS/CSS,
   et les services du Worker (KV, base d'audience, Stripe, Resend).
   Chaque passage est gardé 30 jours dans KV et affiché dans l'admin
   (rubrique « Veille du site »). Une anomalie déclenche une notification.
   ════════════════════════════════════════════════════════════════ */

const SITE = 'https://bunkaio.com';
const RUN_PREFIX = 'watch:run:';
const RUN_TTL = 60 * 60 * 24 * 30;
/* Limite de requêtes sortantes d'un Worker : on plafonne le nombre de pages contrôlées. */
const MAX_PAGES = 24;
const SLOW_MS = 4000;

export interface WatchCheck { name: string; ok: boolean; detail: string; ms?: number }
export interface WatchRun { at: string; ok: boolean; checks: WatchCheck[]; failed: number; total: number }

async function timedFetch(url: string, init?: RequestInit): Promise<{ res: Response | null; ms: number; err?: string }> {
  const t = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow', cf: { cacheTtl: 0 }, ...init } as RequestInit);
    return { res, ms: Date.now() - t };
  } catch (e) {
    return { res: null, ms: Date.now() - t, err: (e as Error).message };
  }
}

async function checkUrl(name: string, url: string, mustContain?: string): Promise<WatchCheck> {
  const { res, ms, err } = await timedFetch(url, { headers: { 'User-Agent': 'BUNKAIO-veille/1.0' } });
  if (!res) return { name, ok: false, detail: `injoignable (${err})`, ms };
  if (res.status !== 200) return { name, ok: false, detail: `statut HTTP ${res.status}`, ms };
  if (mustContain) {
    const body = await res.text();
    if (!body.includes(mustContain)) return { name, ok: false, detail: `contenu attendu absent (« ${mustContain} »)`, ms };
  } else {
    await res.body?.cancel();
  }
  return { name, ok: true, detail: ms > SLOW_MS ? `lent (${ms} ms)` : 'OK', ms };
}

export async function runSiteWatch(env: Env): Promise<WatchRun> {
  const checks: WatchCheck[] = [];

  /* 1. Accueil + fichiers versionnés qu'il charge (un fichier manquant casse tout le site) */
  const home = await timedFetch(SITE + '/', { headers: { 'User-Agent': 'BUNKAIO-veille/1.0' } });
  let html = '';
  if (!home.res || home.res.status !== 200) {
    checks.push({ name: 'Accueil', ok: false, detail: home.res ? `statut HTTP ${home.res.status}` : `injoignable (${home.err})`, ms: home.ms });
  } else {
    html = await home.res.text();
    const okBrand = html.includes('BUNKAIO');
    checks.push({ name: 'Accueil', ok: okBrand, detail: okBrand ? (home.ms > SLOW_MS ? `lent (${home.ms} ms)` : 'OK') : 'page vide ou incomplète', ms: home.ms });
    const assets = [...html.matchAll(/(?:src|href)="\/?((?:js|css|config)\/[^"?]+\.(?:js|css)\?v=[^"]+)"/g)].map((m) => m[1] ?? '').filter(Boolean);
    for (const a of [...new Set(assets)].slice(0, 8)) checks.push(await checkUrl('Fichier ' + a.split('?')[0], `${SITE}/${a}`));
  }

  /* 2. Sitemap + pages publiques */
  const sm = await timedFetch(SITE + '/sitemap.xml');
  if (!sm.res || sm.res.status !== 200) {
    checks.push({ name: 'Sitemap', ok: false, detail: sm.res ? `statut HTTP ${sm.res.status}` : 'injoignable', ms: sm.ms });
  } else {
    const xml = await sm.res.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1] ?? '').filter((u) => u.startsWith(SITE) && !/\.(?:jpe?g|png|webp)$/i.test(u));
    checks.push({ name: 'Sitemap', ok: urls.length > 0, detail: `${urls.length} pages déclarées`, ms: sm.ms });
    /* On tourne sur l'ensemble des pages d'un passage à l'autre pour toutes les couvrir sans dépasser la limite. */
    const offset = urls.length ? Math.floor(Date.now() / (12 * 3600 * 1000)) * MAX_PAGES % urls.length : 0;
    const picked = urls.length <= MAX_PAGES ? urls : [...urls.slice(offset), ...urls.slice(0, offset)].slice(0, MAX_PAGES);
    const results = await Promise.all(picked.map((u) => checkUrl('Page ' + u.replace(SITE, ''), u, '</html>')));
    checks.push(...results);
  }

  /* 3. Services du Worker */
  try {
    const key = 'watch:probe';
    const stamp = String(Date.now());
    await env.ACCOUNTS_KV.put(key, stamp, { expirationTtl: 3600 });
    const back = await env.ACCOUNTS_KV.get(key);
    checks.push({ name: 'Stockage des comptes (KV)', ok: back === stamp, detail: back === stamp ? 'OK' : 'lecture incohérente' });
  } catch (e) {
    checks.push({ name: 'Stockage des comptes (KV)', ok: false, detail: (e as Error).message });
  }
  if (env.ANALYTICS_DB) {
    try {
      await env.ANALYTICS_DB.prepare('SELECT 1').first();
      checks.push({ name: 'Base d\'audience (D1)', ok: true, detail: 'OK' });
    } catch (e) {
      checks.push({ name: 'Base d\'audience (D1)', ok: false, detail: (e as Error).message });
    }
  }
  if (env.STRIPE_SECRET_KEY) {
    const r = await timedFetch('https://api.stripe.com/v1/balance', { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
    const ok = !!r.res && r.res.status === 200;
    await r.res?.body?.cancel();
    checks.push({ name: 'Stripe (paiements)', ok, detail: ok ? (env.STRIPE_SECRET_KEY.startsWith('sk_test') ? 'OK (mode test)' : 'OK') : `clé refusée ou service indisponible (${r.res?.status ?? r.err})`, ms: r.ms });
  } else {
    checks.push({ name: 'Stripe (paiements)', ok: false, detail: 'clé absente' });
  }
  if (env.RESEND_API_KEY) {
    const r = await timedFetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } });
    /* 401 restreint = clé valide mais limitée à l'envoi : c'est normal pour une clé « sending access ». */
    let ok = !!r.res && r.res.status === 200;
    let detail = ok ? 'OK' : `réponse ${r.res?.status ?? r.err}`;
    if (r.res && r.res.status !== 200) {
      const body = await r.res.text();
      if (/restricted/i.test(body)) { ok = true; detail = 'OK (clé limitée à l\'envoi)'; }
    } else {
      await r.res?.body?.cancel();
    }
    checks.push({ name: 'Resend (emails)', ok, detail, ms: r.ms });
  } else {
    checks.push({ name: 'Resend (emails)', ok: false, detail: 'clé absente' });
  }

  const failed = checks.filter((c) => !c.ok).length;
  const run: WatchRun = { at: new Date().toISOString(), ok: failed === 0, checks, failed, total: checks.length };
  await env.ACCOUNTS_KV.put(RUN_PREFIX + run.at, JSON.stringify(run), { expirationTtl: RUN_TTL });
  if (failed) {
    const first = checks.filter((c) => !c.ok).slice(0, 3).map((c) => c.name).join(', ');
    await notifyAdmin(env, { title: `Veille du site : ${failed} anomalie${failed > 1 ? 's' : ''}`, body: first, url: '/admin/#veille' }).catch(() => {});
  }
  return run;
}

/** Derniers passages (plus récent d'abord), pour l'admin. */
export async function listWatchRuns(env: Env, limit = 60): Promise<WatchRun[]> {
  const list = await env.ACCOUNTS_KV.list({ prefix: RUN_PREFIX });
  const keys = list.keys.map((k) => k.name).sort().reverse().slice(0, limit);
  const runs = await Promise.all(keys.map((k) => env.ACCOUNTS_KV.get(k, 'json') as Promise<WatchRun | null>));
  return runs.filter((r): r is WatchRun => !!r);
}
