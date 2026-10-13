import type { Env } from './types';

/**
 * Liens courts suivis (campagne) : bunkaio.com/go/<code> → 404.html du site redirige ici → /go/<code> compte le clic
 * (événement anonyme `go_click` dans la base d'audience, même règles que /collect : pas de cookie, pas d'IP stockée)
 * puis redirige vers la page du site avec ses paramètres UTM. Liste des liens : KV `golinks` (une fiche JSON, 300 liens max).
 */
export interface GoLink { code: string; label: string; page: string; source: string; medium: string; campaign: string; content: string; createdAt: string; archived?: boolean }

const KEY = 'golinks';
const SITE = 'https://bunkaio.com';
const CODE_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|monitor|uptime/i;
const slug = (v: unknown): string => (typeof v === 'string' ? v : '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const text = (v: unknown, n: number): string => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n) : '');

export async function listGoLinks(env: Env): Promise<GoLink[]> {
  try {
    const raw = await env.ACCOUNTS_KV.get(KEY);
    return raw ? ((JSON.parse(raw) as { links?: GoLink[] }).links ?? []) : [];
  } catch { return []; }
}

/** Adresse finale (page du site + UTM) d'un lien court. */
export function goTarget(l: GoLink): string {
  const q: [string, string][] = ([['utm_source', l.source], ['utm_medium', l.medium], ['utm_campaign', l.campaign], ['utm_content', l.content]] as [string, string][]).filter((x) => x[1]);
  return SITE + l.page + (q.length ? '?' + q.map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&') : '');
}

/** Création / modification (code inchangeable une fois créé : il est peut-être déjà imprimé) ou suppression. */
export async function saveGoLink(env: Env, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string; links: GoLink[] }> {
  const links = await listGoLinks(env);
  const code = slug(body.code).replace(/[._]/g, '-');
  if (!CODE_RE.test(code)) return { ok: false, error: 'code_invalide', links };
  const i = links.findIndex((l) => l.code === code);
  if (body.action === 'delete') {
    if (i >= 0) links.splice(i, 1);
  } else {
    const page = text(body.page, 120);
    if (!/^\/[a-z0-9\-/]*$/.test(page)) return { ok: false, error: 'page_invalide', links };
    if (body.action === 'create' && i >= 0) return { ok: false, error: 'code_existant', links };
    if (i < 0 && links.length >= 300) return { ok: false, error: 'trop_de_liens', links };
    const l: GoLink = {
      code, label: text(body.label, 80), page,
      source: slug(body.source), medium: slug(body.medium), campaign: slug(body.campaign), content: slug(body.content),
      createdAt: i >= 0 ? links[i]!.createdAt : new Date().toISOString(), archived: body.archived === true || undefined,
    };
    if (i >= 0) links[i] = l; else links.unshift(l);
  }
  await env.ACCOUNTS_KV.put(KEY, JSON.stringify({ links }));
  return { ok: true, links };
}

/** Clics par code : sur la période et au total (400 jours, durée de conservation de la mesure d'audience). */
export async function goClicks(env: Env, days: number): Promise<Record<string, { period: number; total: number }>> {
  const out: Record<string, { period: number; total: number }> = {};
  if (!env.ANALYTICS_DB) return out;
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  try {
    const r = await env.ANALYTICS_DB.prepare(
      "SELECT prop, COUNT(*) AS total, SUM(CASE WHEN day >= ? THEN 1 ELSE 0 END) AS period FROM events WHERE name='go_click' GROUP BY prop",
    ).bind(since).all<{ prop: string; total: number; period: number }>();
    for (const row of r.results ?? []) if (row.prop) out[row.prop] = { period: row.period ?? 0, total: row.total ?? 0 };
  } catch { /* base indisponible : pas de compteur */ }
  return out;
}

async function dailyVisitorId(env: Env, day: string, ip: string, ua: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.ADMIN_TOKEN || 'bunkaio'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(day + '|' + ip + '|' + ua));
  return [...new Uint8Array(sig)].slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** GET /go/<code> : redirection 302 (lien inconnu ou archivé → accueil), clic compté hors robots. */
export async function handleGo(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const code = slug(new URL(request.url).pathname.replace(/^\/go\/?/, '').replace(/\/+$/, ''));
  const link = CODE_RE.test(code) ? (await listGoLinks(env)).find((l) => l.code === code && !l.archived) : undefined;
  const target = link ? goTarget(link) : SITE + '/';
  const ua = request.headers.get('User-Agent') ?? '';
  if (link && env.ANALYTICS_DB && ua && !BOT_RE.test(ua)) {
    ctx.waitUntil((async () => {
      const now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
      const vid = await dailyVisitorId(env, day, request.headers.get('CF-Connecting-IP') ?? '', ua);
      const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|iphone|android/i.test(ua) ? 'mobile' : 'desktop';
      const utm = [link.source, link.medium, link.campaign, link.content].join('/');
      try {
        await env.ANALYTICS_DB!.prepare('INSERT INTO events (ts, day, name, path, prop, ref, device, lang, vid, utm) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(now, day, 'go_click', '/go/' + code, code, null, device, 'fr', vid, utm).run();
      } catch {
        await env.ANALYTICS_DB!.prepare('INSERT INTO events (ts, day, name, path, prop, ref, device, lang, vid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(now, day, 'go_click', '/go/' + code, code, null, device, 'fr', vid).run().catch(() => undefined);
      }
    })());
  }
  return new Response(null, { status: 302, headers: { Location: target, 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
}
