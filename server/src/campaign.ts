import type { Env } from './types';

/**
 * Campagnes & publicités : trafic par campagne (mesure maison, colonne `utm` des événements), dépenses et publications
 * saisies à la main (Google Ads et Instagram n'exposent pas leurs chiffres sans API payante ou validation Meta).
 * Données manuelles dans KV `campaign:data` (une seule fiche JSON, bornée).
 */
export interface CampaignPost { id: string; date: string; type: string; titre: string; contenu: string; portee: number; impressions: number; enregistrements: number; partages: number; visitesProfil: number; clicsLien: number; note?: string }
export interface CampaignSpend { id: string; date: string; plateforme: string; campagne: string; montant: number; clics?: number; impressions?: number; note?: string }
export interface CampaignData { posts: CampaignPost[]; spend: CampaignSpend[]; updatedAt?: string }

const KEY = 'campaign:data';
const str = (v: unknown, n: number): string => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n) : '');
const num = (v: unknown, max = 1e9): number => { const x = Number(v); return Number.isFinite(x) && x >= 0 ? Math.min(max, Math.round(x * 100) / 100) : 0; };
const day = (v: unknown): string => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '');
const rid = (v: unknown): string => str(v, 40).replace(/[^\w-]/g, '') || 'c-' + crypto.randomUUID().slice(0, 8);

export async function getCampaignData(env: Env): Promise<CampaignData> {
  try {
    const raw = await env.ACCOUNTS_KV.get(KEY);
    const d = raw ? (JSON.parse(raw) as CampaignData) : null;
    return { posts: d?.posts ?? [], spend: d?.spend ?? [], updatedAt: d?.updatedAt };
  } catch { return { posts: [], spend: [] }; }
}

/** Remplace posts et/ou dépenses (listes nettoyées, 500 lignes maximum chacune). */
export async function putCampaignData(env: Env, body: Record<string, unknown>): Promise<CampaignData> {
  const cur = await getCampaignData(env);
  if (Array.isArray(body.posts)) {
    cur.posts = (body.posts as Record<string, unknown>[]).slice(0, 500).map((p) => ({
      id: rid(p.id), date: day(p.date), type: str(p.type, 20) || 'post', titre: str(p.titre, 120), contenu: str(p.contenu, 60).replace(/[^\w.\-]/g, ''),
      portee: num(p.portee), impressions: num(p.impressions), enregistrements: num(p.enregistrements), partages: num(p.partages), visitesProfil: num(p.visitesProfil), clicsLien: num(p.clicsLien), note: str(p.note, 300) || undefined,
    })).filter((p) => p.date);
  }
  if (Array.isArray(body.spend)) {
    cur.spend = (body.spend as Record<string, unknown>[]).slice(0, 500).map((s) => ({
      id: rid(s.id), date: day(s.date), plateforme: str(s.plateforme, 30) || 'google', campagne: str(s.campagne, 80), montant: num(s.montant, 1e7),
      clics: num(s.clics) || undefined, impressions: num(s.impressions) || undefined, note: str(s.note, 200) || undefined,
    })).filter((s) => s.date);
  }
  cur.updatedAt = new Date().toISOString();
  await env.ACCOUNTS_KV.put(KEY, JSON.stringify(cur));
  return cur;
}

export interface CampaignTraffic { utm: string; pv: number; uv: number; cta: number; form: number; submit: number; contact: number }

/** Trafic et conversions par campagne (utm = « source/support/campagne/contenu »), sur `days` jours. `supported:false` tant que la migration 0002 n'est pas appliquée. */
export async function campaignTraffic(env: Env, days: number): Promise<{ supported: boolean; configured: boolean; rows: CampaignTraffic[]; totalPv: number }> {
  if (!env.ANALYTICS_DB) return { supported: false, configured: false, rows: [], totalPv: 0 };
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  try {
    const r = await env.ANALYTICS_DB.prepare(
      `SELECT utm,
        SUM(CASE WHEN name='pageview' THEN 1 ELSE 0 END) AS pv,
        COUNT(DISTINCT CASE WHEN name='pageview' THEN day || vid END) AS uv,
        SUM(CASE WHEN name='cta_click' THEN 1 ELSE 0 END) AS cta,
        SUM(CASE WHEN name='form_start' THEN 1 ELSE 0 END) AS form,
        SUM(CASE WHEN name='quiz_submit' THEN 1 ELSE 0 END) AS submit,
        SUM(CASE WHEN name IN ('contact_submit','tel_click','mail_click') THEN 1 ELSE 0 END) AS contact
       FROM events WHERE utm IS NOT NULL AND utm != '' AND day >= ? GROUP BY utm ORDER BY pv DESC LIMIT 200`,
    ).bind(since).all<CampaignTraffic>();
    const rows = r.results ?? [];
    const tot = await env.ANALYTICS_DB.prepare("SELECT COUNT(*) AS n FROM events WHERE name='pageview' AND day >= ?").bind(since).first<{ n: number }>();
    return { supported: true, configured: true, rows, totalPv: tot?.n ?? 0 };
  } catch {
    return { supported: false, configured: true, rows: [], totalPv: 0 };
  }
}
