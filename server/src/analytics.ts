import type { Env } from './types';

/**
 * Mesure d'audience maison — anonyme et sans cookie.
 * - Aucune adresse IP ni User-Agent n'est stocké : ils servent uniquement à calculer
 *   une empreinte HMAC qui change chaque jour (comptage des visiteurs du jour,
 *   impossible à suivre d'un jour à l'autre).
 * - Les données sont supprimées après RETENTION_DAYS.
 * - Si la base D1 n'est pas configurée, la collecte est simplement ignorée.
 */
const RETENTION_DAYS = 400;
const EVENT_NAMES = new Set([
  'pageview', 'cta_click', 'quiz_step', 'quiz_submit', 'contact_submit', 'collab_submit',
  'apply_submit', 'share_submit', 'account_request', 'login', 'tel_click', 'mail_click',
  'social_click', 'lang_toggle',
]);
const DEVICES = new Set(['mobile', 'tablet', 'desktop']);
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|monitor|uptime/i;

interface CollectBody { e?: unknown; p?: unknown; r?: unknown; d?: unknown; l?: unknown; v?: unknown }

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max) : '';
}

async function dailyVisitorId(env: Env, day: string, ip: string, ua: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ADMIN_TOKEN || 'bunkaio'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(day + '|' + ip + '|' + ua));
  return [...new Uint8Array(sig)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** POST /collect — toujours 204 : le visiteur n'a jamais de retour, et les robots n'apprennent rien. */
export async function handleCollect(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const noContent = () => new Response(null, { status: 204, headers });
  if (request.method !== 'POST' || !env.ANALYTICS_DB) return noContent();

  const origin = request.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  if (!allowed.includes(origin)) return noContent();
  const ua = request.headers.get('User-Agent') ?? '';
  if (!ua || BOT_RE.test(ua)) return noContent();

  let body: CollectBody;
  try { body = JSON.parse(await request.text()) as CollectBody; } catch { return noContent(); }
  const name = clean(body.e, 32);
  const path = clean(body.p, 80);
  if (!EVENT_NAMES.has(name) || !/^\/[a-z0-9\-/]*$/.test(path)) return noContent();
  const device = DEVICES.has(clean(body.d, 10)) ? clean(body.d, 10) : 'desktop';
  const lang = clean(body.l, 2) === 'en' ? 'en' : 'fr';
  const ref = /^[a-z0-9.-]{1,80}$/i.test(clean(body.r, 80)) ? clean(body.r, 80).toLowerCase() : '';
  const prop = clean(body.v, 64);

  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const vid = await dailyVisitorId(env, day, request.headers.get('CF-Connecting-IP') ?? '', ua);
  try {
    await env.ANALYTICS_DB.prepare('INSERT INTO events (ts, day, name, path, prop, ref, device, lang, vid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(now, day, name, path, prop || null, ref || null, device, lang, vid).run();
  } catch (err) {
    console.error('[analytics] écriture impossible', err);
  }
  return noContent();
}

/** GET /stats?days=30 — protégé par ADMIN_TOKEN (même garde que les autres routes admin). */
export async function handleStats(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  if ((request.headers.get('Authorization') ?? '') !== `Bearer ${env.ADMIN_TOKEN}`) return json({ ok: false, error: 'unauthorized' }, 401);
  if (!env.ANALYTICS_DB) return json({ ok: false, error: 'analytics_db_not_configured' }, 503);

  const days = Math.min(365, Math.max(1, parseInt(new URL(request.url).searchParams.get('days') ?? '30', 10) || 30));
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  const db = env.ANALYTICS_DB;
  const all = async <T>(sql: string, ...binds: unknown[]): Promise<T[]> => (await db.prepare(sql).bind(...binds).all<T>()).results ?? [];

  const [daily, pages, referrers, devices, events, steps, totals] = await Promise.all([
    all<{ day: string; pv: number; uv: number }>("SELECT day, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv FROM events WHERE name='pageview' AND day>=? GROUP BY day ORDER BY day", since),
    all<{ path: string; pv: number; uv: number }>("SELECT path, COUNT(*) AS pv, COUNT(DISTINCT vid) AS uv FROM events WHERE name='pageview' AND day>=? GROUP BY path ORDER BY pv DESC LIMIT 15", since),
    all<{ ref: string; n: number }>("SELECT ref, COUNT(*) AS n FROM events WHERE name='pageview' AND ref IS NOT NULL AND day>=? GROUP BY ref ORDER BY n DESC LIMIT 15", since),
    all<{ device: string; n: number }>("SELECT device, COUNT(*) AS n FROM events WHERE name='pageview' AND day>=? GROUP BY device ORDER BY n DESC", since),
    all<{ name: string; prop: string | null; n: number }>("SELECT name, prop, COUNT(*) AS n FROM events WHERE name!='pageview' AND day>=? GROUP BY name, prop ORDER BY n DESC LIMIT 60", since),
    all<{ prop: string; n: number }>("SELECT prop, COUNT(DISTINCT day || vid) AS n FROM events WHERE name='quiz_step' AND day>=? GROUP BY prop ORDER BY prop", since),
    all<{ pv: number; uv: number }>("SELECT COUNT(*) AS pv, COUNT(DISTINCT day || vid) AS uv FROM events WHERE name='pageview' AND day>=?", since),
  ]);
  const quizVisitors = (await all<{ n: number }>("SELECT COUNT(DISTINCT day || vid) AS n FROM events WHERE name='pageview' AND path='/devis/' AND day>=?", since))[0]?.n ?? 0;
  const quizSubmits = (await all<{ n: number }>("SELECT COUNT(DISTINCT day || vid) AS n FROM events WHERE name='quiz_submit' AND day>=?", since))[0]?.n ?? 0;
  return json({ ok: true, days, since, totals: totals[0] ?? { pv: 0, uv: 0 }, daily, pages, referrers, devices, events, funnel: { quizVisitors, steps, quizSubmits } }, 200);
}

/** Suppression des données au-delà de la durée de conservation (appelée par le cron quotidien). */
export async function purgeOldAnalytics(env: Env): Promise<void> {
  if (!env.ANALYTICS_DB) return;
  const cutoff = Date.now() - RETENTION_DAYS * 86400000;
  try {
    await env.ANALYTICS_DB.prepare('DELETE FROM events WHERE ts < ?').bind(cutoff).run();
  } catch (err) {
    console.error('[analytics] purge impossible', err);
  }
}
