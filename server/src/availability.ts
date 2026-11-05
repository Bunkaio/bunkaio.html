/* Calendrier des disponibilités (nov. 2026, demande de la propriétaire).
   Sources des indisponibilités : séances saisies dans les comptes clients/partenaires, blocages et fermetures saisis dans l'admin,
   pré-réservations (« options » de 48 h) posées par les prospects, et l'agenda personnel de la propriétaire (liens iCal secrets
   Google Agenda / iCloud). La route publique ne renvoie que des plages occupées anonymes (aucun titre, aucun nom). */
import type { Env } from './types';

const CONFIG_KEY = 'cal:config';
const HOLDS_KEY = 'cal:holds';
const BUSY_CACHE = 'cal:busy:v1';
const ICS_CACHE = 'cal:ics:v1';
const ACCOUNT_PREFIX = 'account:';

export interface CalBlock { id: string; from: string; to: string; start?: string; end?: string; note?: string }
export interface CalRules {
  minNoticeH: number; onePerDay: boolean; sundayEvent: boolean;
  open: string; close: string; eventClose: string; bufferMin: number; holdHours: number;
}
export interface CalConfig { icalUrls: string[]; blocks: CalBlock[]; rules: CalRules }
export interface CalHold {
  id: string; date: string; start: string; end: string; cat: string; tier?: string; label?: string;
  name: string; email: string; phone?: string; lang?: string;
  createdAt: string; expiresAt: string; status: 'option' | 'confirmed' | 'released';
}
/** Une journée : plages occupées en minutes depuis minuit, `taken` = une séance y est déjà posée (règle « 1 séance par jour »), `full` = journée fermée. */
export interface CalDay { busy: [number, number][]; taken?: boolean; full?: boolean }

const CATS = ['photo-part', 'corporate', 'mode', 'commercial', 'event'];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DEFAULT_RULES: CalRules = { minNoticeH: 72, onePerDay: true, sundayEvent: true, open: '09:00', close: '18:00', eventClose: '23:00', bufferMin: 60, holdHours: 48 };

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const toMin = (hm: string) => { const [h, m] = hm.split(':').map(Number); return (h ?? 0) * 60 + (m ?? 0); };
const pad = (n: number) => String(n).padStart(2, '0');
const isoDay = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (day: string, n: number) => { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return isoDay(d); };

export function cleanConfig(input: unknown): CalConfig {
  const r = (input ?? {}) as Record<string, unknown>;
  const urls = (Array.isArray(r.icalUrls) ? r.icalUrls : []).map((u) => str(u, 600).replace(/^webcal:/i, 'https:')).filter((u) => /^https:\/\//i.test(u)).slice(0, 5);
  const blocks: CalBlock[] = (Array.isArray(r.blocks) ? r.blocks : []).map((b): CalBlock | null => {
    const x = (b ?? {}) as Record<string, unknown>;
    const from = str(x.from, 10), to = str(x.to, 10) || from;
    if (!DATE_RE.test(from) || !DATE_RE.test(to)) return null;
    const start = str(x.start, 5), end = str(x.end, 5);
    return { id: str(x.id, 40) || crypto.randomUUID().slice(0, 8), from, to: to < from ? from : to, ...(TIME_RE.test(start) && TIME_RE.test(end) ? { start, end } : {}), note: str(x.note, 120) };
  }).filter((b): b is CalBlock => !!b).slice(0, 300);
  const rr = (r.rules ?? {}) as Record<string, unknown>;
  const num = (v: unknown, d: number, lo: number, hi: number) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : d; };
  const hm = (v: unknown, d: string) => (typeof v === 'string' && TIME_RE.test(v) ? v : d);
  const rules: CalRules = {
    minNoticeH: num(rr.minNoticeH, DEFAULT_RULES.minNoticeH, 0, 24 * 30),
    onePerDay: rr.onePerDay === undefined ? DEFAULT_RULES.onePerDay : rr.onePerDay === true,
    sundayEvent: rr.sundayEvent === undefined ? DEFAULT_RULES.sundayEvent : rr.sundayEvent === true,
    open: hm(rr.open, DEFAULT_RULES.open), close: hm(rr.close, DEFAULT_RULES.close), eventClose: hm(rr.eventClose, DEFAULT_RULES.eventClose),
    bufferMin: num(rr.bufferMin, DEFAULT_RULES.bufferMin, 0, 240), holdHours: num(rr.holdHours, DEFAULT_RULES.holdHours, 1, 24 * 14),
  };
  return { icalUrls: urls, blocks, rules };
}

export async function getCalConfig(env: Env): Promise<CalConfig> {
  try { return cleanConfig(JSON.parse((await env.ACCOUNTS_KV.get(CONFIG_KEY)) ?? '{}')); } catch { return cleanConfig({}); }
}
export async function saveCalConfig(env: Env, input: unknown): Promise<CalConfig> {
  const cfg = cleanConfig(input);
  await env.ACCOUNTS_KV.put(CONFIG_KEY, JSON.stringify(cfg));
  await env.ACCOUNTS_KV.delete(BUSY_CACHE);
  await env.ACCOUNTS_KV.delete(ICS_CACHE);
  return cfg;
}

export async function getHolds(env: Env): Promise<CalHold[]> {
  try { const l = JSON.parse((await env.ACCOUNTS_KV.get(HOLDS_KEY)) ?? '[]'); return Array.isArray(l) ? l : []; } catch { return []; }
}
async function putHolds(env: Env, holds: CalHold[]): Promise<void> {
  // On garde les options actives, les confirmées et l'historique récent (90 jours) — 500 entrées au plus.
  const cut = Date.now() - 90 * 86400000;
  const keep = holds.filter((h) => h.status === 'confirmed' || Date.parse(h.createdAt) > cut).slice(-500);
  await env.ACCOUNTS_KV.put(HOLDS_KEY, JSON.stringify(keep));
  await env.ACCOUNTS_KV.delete(BUSY_CACHE);
}
const holdActive = (h: CalHold, now = Date.now()) => h.status === 'confirmed' || (h.status === 'option' && Date.parse(h.expiresAt) > now);

/* ── Lecture iCal (Google Agenda / iCloud) ─────────────────────────────────────────────── */
interface IcsEvent { start: Date; end: Date; allDay: boolean }
const PARIS = 'Europe/Paris';
/** Heure locale Paris → instant UTC (gère l'heure d'été). */
function parisToUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: PARIS, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(guess));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asParis = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute'));
  return new Date(guess - (asParis - guess));
}
function parseIcsDate(line: string): { d: Date; allDay: boolean } | null {
  const v = line.slice(line.indexOf(':') + 1).trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (!m[4]) return { d: new Date(Date.UTC(y, mo - 1, d)), allDay: true };
  const h = Number(m[4]), mi = Number(m[5]);
  if (m[7] === 'Z') return { d: new Date(Date.UTC(y, mo - 1, d, h, mi)), allDay: false };
  // Heure « flottante » ou TZID : on considère l'heure de Paris (agenda de la propriétaire).
  return { d: parisToUtc(y, mo, d, h, mi), allDay: false };
}
function parseIcs(text: string, rangeStart: Date, rangeEnd: Date): IcsEvent[] {
  const lines = text.replace(/\r\n[ \t]/g, '').split(/\r?\n/);
  const out: IcsEvent[] = [];
  let ev: Record<string, string> | null = null;
  const exdates: string[] = [];
  for (const raw of lines) {
    if (raw === 'BEGIN:VEVENT') { ev = {}; exdates.length = 0; continue; }
    if (raw === 'END:VEVENT' && ev) {
      const s = ev.DTSTART ? parseIcsDate(ev.DTSTART) : null;
      let e = ev.DTEND ? parseIcsDate(ev.DTEND) : null;
      const transparent = /TRANSPARENT/i.test(ev.TRANSP ?? '') || /CANCELLED/i.test(ev.STATUS ?? '');
      if (s && !transparent) {
        if (!e) e = { d: new Date(s.d.getTime() + (s.allDay ? 86400000 : 3600000)), allDay: s.allDay };
        const dur = Math.max(15 * 60000, e.d.getTime() - s.d.getTime());
        const push = (start: Date) => { const end = new Date(start.getTime() + dur); if (end > rangeStart && start < rangeEnd) out.push({ start, end, allDay: s.allDay }); };
        const rule = ev.RRULE;
        if (!rule) push(s.d);
        else {
          // Récurrences simples : DAILY / WEEKLY (BYDAY) / MONTHLY / YEARLY, avec INTERVAL, COUNT, UNTIL ; EXDATE ignorées individuellement si exactes.
          const p = Object.fromEntries(rule.split(';').map((kv) => kv.split('=')) as [string, string][]);
          const freq = p.FREQ, interval = Math.max(1, Number(p.INTERVAL) || 1), count = Number(p.COUNT) || 0;
          const until = p.UNTIL ? parseIcsDate('X:' + p.UNTIL)?.d : undefined;
          const days = (p.BYDAY ?? '').split(',').filter(Boolean).map((x) => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(x.slice(-2)));
          const ex = new Set(exdates);
          let n = 0; const cur = new Date(s.d);
          for (let i = 0; i < 2000; i++) {
            if (until && cur > until) break;
            if (cur > rangeEnd) break;
            const candidates: Date[] = [];
            if (freq === 'WEEKLY' && days.length) {
              const weekStart = new Date(cur); weekStart.setUTCDate(cur.getUTCDate() - cur.getUTCDay());
              for (const wd of days.sort()) { const c = new Date(weekStart); c.setUTCDate(weekStart.getUTCDate() + wd); if (c >= s.d) candidates.push(c); }
            } else candidates.push(new Date(cur));
            for (const c of candidates) {
              if (until && c > until) continue;
              if (count && n >= count) break;
              n++;
              if (!ex.has(c.toISOString())) push(c);
            }
            if (count && n >= count) break;
            if (freq === 'DAILY') cur.setUTCDate(cur.getUTCDate() + interval);
            else if (freq === 'WEEKLY') cur.setUTCDate(cur.getUTCDate() + 7 * interval);
            else if (freq === 'MONTHLY') cur.setUTCMonth(cur.getUTCMonth() + interval);
            else if (freq === 'YEARLY') cur.setUTCFullYear(cur.getUTCFullYear() + interval);
            else break;
          }
        }
      }
      ev = null; continue;
    }
    if (!ev) continue;
    const key = raw.split(/[;:]/)[0] ?? '';
    if (key === 'EXDATE') { for (const v of raw.slice(raw.indexOf(':') + 1).split(',')) { const d = parseIcsDate('X:' + v.trim()); if (d) exdates.push(d.d.toISOString()); } continue; }
    if (['DTSTART', 'DTEND', 'RRULE', 'TRANSP', 'STATUS'].includes(key)) ev[key] = key === 'RRULE' ? raw.slice(raw.indexOf(':') + 1) : raw;
  }
  return out;
}
async function icsEvents(env: Env, cfg: CalConfig, from: Date, to: Date): Promise<{ events: IcsEvent[]; errors: string[] }> {
  if (!cfg.icalUrls.length) return { events: [], errors: [] };
  const cached = await env.ACCOUNTS_KV.get(ICS_CACHE);
  if (cached) { try { const c = JSON.parse(cached) as { events: { s: number; e: number; a: boolean }[]; errors: string[] }; return { events: c.events.map((x) => ({ start: new Date(x.s), end: new Date(x.e), allDay: x.a })), errors: c.errors }; } catch { /* relecture */ } }
  const events: IcsEvent[] = []; const errors: string[] = [];
  for (const url of cfg.icalUrls) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'BUNKAIO-Calendar/1.0' } });
      if (!r.ok) { errors.push(`HTTP ${r.status}`); continue; }
      events.push(...parseIcs(await r.text(), from, to));
    } catch (err) { errors.push(String((err as Error).message ?? err).slice(0, 80)); }
  }
  await env.ACCOUNTS_KV.put(ICS_CACHE, JSON.stringify({ events: events.map((e) => ({ s: e.start.getTime(), e: e.end.getTime(), a: e.allDay })), errors }), { expirationTtl: 600 });
  return { events, errors };
}

/** Découpe un instant UTC en (jour de Paris, minutes depuis minuit à Paris). */
function parisParts(d: Date): { day: string; min: number } {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: PARIS, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return { day: `${g('year')}-${g('month')}-${g('day')}`, min: (Number(g('hour')) % 24) * 60 + Number(g('minute')) };
}
function durationMin(s?: string): number {
  if (!s) return 180;
  const t = s.toLowerCase();
  if (/journ[ée]e/.test(t) && !/demi/.test(t)) return 600;
  if (/demi/.test(t)) return 300;
  const m = t.match(/(\d+)\s*h\s*(\d{2})?/); if (m) return Number(m[1]) * 60 + Number(m[2] ?? 0);
  const mm = t.match(/(\d+)\s*min/); if (mm) return Number(mm[1]);
  return 180;
}

/** Plages occupées par jour (Paris), de `from` à `to` inclus. Mise en cache 5 min. */
export async function computeBusy(env: Env, from: string, to: string): Promise<{ days: Record<string, CalDay>; rules: CalRules; icsErrors: string[] }> {
  const cfg = await getCalConfig(env);
  const days: Record<string, CalDay> = {};
  const day = (d: string) => (days[d] ??= { busy: [] });
  const cachedRaw = await env.ACCOUNTS_KV.get(BUSY_CACHE);
  let all: Record<string, CalDay> | null = null; let icsErrors: string[] = [];
  if (cachedRaw) { try { const c = JSON.parse(cachedRaw); all = c.days; icsErrors = c.icsErrors ?? []; } catch { all = null; } }
  if (!all) {
    const rangeFrom = new Date(Date.now() - 86400000), rangeTo = new Date(Date.UTC(2028, 0, 1));
    // Séances des comptes (clients et partenaires).
    const keys = (await env.ACCOUNTS_KV.list({ prefix: ACCOUNT_PREFIX, limit: 1000 })).keys;
    for (const k of keys) {
      try {
        const acc = JSON.parse((await env.ACCOUNTS_KV.get(k.name)) ?? 'null') as { seance?: { date: string; heure?: string; duree?: string; statut?: string } } | null;
        const se = acc?.seance;
        if (!se || !DATE_RE.test(se.date) || se.statut === 'annulee') continue;
        const d = day(se.date); d.taken = true;
        if (se.heure && TIME_RE.test(se.heure)) { const s = toMin(se.heure); d.busy.push([s, s + durationMin(se.duree)]); } else d.full = true;
      } catch { /* compte illisible : ignoré */ }
    }
    // Pré-réservations actives et confirmées.
    for (const h of (await getHolds(env)).filter((x) => holdActive(x))) { const d = day(h.date); d.taken = true; d.busy.push([toMin(h.start), toMin(h.end)]); }
    // Blocages et fermetures de l'admin.
    for (const b of cfg.blocks) {
      for (let d = b.from, i = 0; d <= b.to && i < 800; d = addDays(d, 1), i++) {
        if (b.start && b.end) day(d).busy.push([toMin(b.start), toMin(b.end)]); else day(d).full = true;
      }
    }
    // Agenda personnel (iCal).
    const ics = await icsEvents(env, cfg, rangeFrom, rangeTo); icsErrors = ics.errors;
    for (const ev of ics.events) {
      if (ev.allDay) { for (let d = isoDay(ev.start); d < isoDay(ev.end); d = addDays(d, 1)) day(d).full = true; continue; }
      const a = parisParts(ev.start), b = parisParts(ev.end);
      if (a.day === b.day) day(a.day).busy.push([a.min, b.min]);
      else { day(a.day).busy.push([a.min, 24 * 60]); for (let d = addDays(a.day, 1); d < b.day; d = addDays(d, 1)) day(d).full = true; if (b.min > 0) day(b.day).busy.push([0, b.min]); }
    }
    for (const d of Object.values(days)) d.busy.sort((x, y) => x[0] - y[0]);
    all = days;
    await env.ACCOUNTS_KV.put(BUSY_CACHE, JSON.stringify({ days: all, icsErrors }), { expirationTtl: 300 });
  }
  const out: Record<string, CalDay> = {};
  for (const [d, v] of Object.entries(all)) if (d >= from && d <= to) out[d] = v;
  return { days: out, rules: cfg.rules, icsErrors };
}

/** Vérifie qu'un créneau respecte les règles et ne chevauche rien (même logique que le site). */
export function slotAllowed(dayInfo: CalDay | undefined, date: string, start: string, end: string, cat: string, rules: CalRules, now = new Date()): string | null {
  const s = toMin(start), e = toMin(end);
  if (e <= s) return 'creneau_invalide';
  const wd = new Date(date + 'T12:00:00Z').getUTCDay();
  if (wd === 0 && !(rules.sundayEvent && cat === 'event')) return 'jour_ferme';
  const close = cat === 'event' ? toMin(rules.eventClose) : toMin(rules.close);
  if (s < toMin(rules.open) || e > close) return 'hors_horaires';
  const startUtc = parisToUtc(Number(date.slice(0, 4)), Number(date.slice(5, 7)), Number(date.slice(8, 10)), Math.floor(s / 60), s % 60);
  if (startUtc.getTime() - now.getTime() < rules.minNoticeH * 3600000) return 'delai_trop_court';
  if (!dayInfo) return null;
  if (dayInfo.full) return 'jour_complet';
  if (rules.onePerDay && dayInfo.taken) return 'jour_complet';
  const buf = rules.bufferMin;
  if (dayInfo.busy.some(([a, b]) => s < b + buf && e + buf > a)) return 'creneau_pris';
  return null;
}

export async function createHold(env: Env, input: Record<string, unknown>): Promise<{ ok: true; hold: CalHold } | { ok: false; error: string }> {
  const date = str(input.date, 10), start = str(input.start, 5), end = str(input.end, 5), cat = str(input.cat, 20);
  const email = str(input.email, 200).toLowerCase(), name = str(input.name, 120);
  if (!DATE_RE.test(date) || !TIME_RE.test(start) || !TIME_RE.test(end) || !CATS.includes(cat)) return { ok: false, error: 'invalid_payload' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) return { ok: false, error: 'invalid_contact' };
  if (date > '2027-12-31') return { ok: false, error: 'hors_calendrier' };
  const holds = await getHolds(env);
  // Une seule option active par adresse : la nouvelle remplace l'ancienne.
  for (const h of holds) if (h.email === email && h.status === 'option') h.status = 'released';
  await putHolds(env, holds);
  const { days, rules } = await computeBusy(env, date, date);
  const why = slotAllowed(days[date], date, start, end, cat, rules);
  if (why) return { ok: false, error: why };
  const now = new Date();
  const hold: CalHold = {
    id: crypto.randomUUID().slice(0, 12), date, start, end, cat, tier: str(input.tier, 20) || undefined, label: str(input.label, 120) || undefined,
    name, email, phone: str(input.phone, 40) || undefined, lang: input.lang === 'en' ? 'en' : 'fr',
    createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + rules.holdHours * 3600000).toISOString(), status: 'option',
  };
  holds.push(hold);
  await putHolds(env, holds);
  return { ok: true, hold };
}

export async function setHoldStatus(env: Env, id: string, status: 'option' | 'confirmed' | 'released', hours?: number): Promise<CalHold | null> {
  const holds = await getHolds(env);
  const h = holds.find((x) => x.id === id); if (!h) return null;
  h.status = status;
  if (status === 'option') { const cfg = await getCalConfig(env); h.expiresAt = new Date(Date.now() + (hours ?? cfg.rules.holdHours) * 3600000).toISOString(); }
  await putHolds(env, holds);
  return h;
}

/** Lien iCal : test de lecture depuis l'admin (nombre d'événements trouvés d'ici fin 2027). */
export async function testIcal(url: string): Promise<{ ok: boolean; events?: number; error?: string }> {
  try {
    const u = url.replace(/^webcal:/i, 'https:');
    if (!/^https:\/\//i.test(u)) return { ok: false, error: 'adresse_invalide' };
    const r = await fetch(u, { headers: { 'User-Agent': 'BUNKAIO-Calendar/1.0' } });
    if (!r.ok) return { ok: false, error: 'HTTP ' + r.status };
    const t = await r.text();
    if (!/BEGIN:VCALENDAR/.test(t)) return { ok: false, error: 'pas_un_agenda_ical' };
    return { ok: true, events: parseIcs(t, new Date(), new Date(Date.UTC(2028, 0, 1))).length };
  } catch (err) { return { ok: false, error: String((err as Error).message ?? err).slice(0, 80) }; }
}
