import type { Env } from './types';

/**
 * Devis : créés et envoyés depuis le tableau de bord admin, signés en ligne par le client
 * (page /signature/ du site). Le devis envoyé est figé : son empreinte SHA-256 est calculée
 * à l'envoi et revérifiée à la signature. Toute modification passe par l'annulation puis
 * la duplication du devis.
 */
export type QuoteStatus = 'brouillon' | 'envoye' | 'signe' | 'refuse' | 'expire' | 'annule';

export interface QuoteClient {
  nom: string;
  profil: 'particulier' | 'professionnel';
  contact?: string;
  forme?: string;
  adresse?: string;
  telephone?: string;
  siret?: string;
  tvaIntra?: string;
}

export interface QuoteSignature {
  name: string;
  at: string;
  ip: string;
  ua: string;
  portfolio: boolean;
  retractationWaiver: boolean;
  hash: string;
}

export interface Quote {
  id: string;
  number: string;
  token: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  signedAt?: string;
  closedAt?: string;
  email: string;
  lang: 'fr' | 'en';
  template: string;
  client: QuoteClient;
  prestation: string;
  contenu: string;
  notes?: string;
  seance?: { date?: string; heure?: string; lieu?: string };
  delai: string;
  totalHT: number;
  acomptePct: number;
  abonnement?: boolean;
  droits: { destination: string; duree: string; territoire?: string; exclusivite?: string };
  report?: string;
  conditions: string[];
  validUntil: string;
  mediateur?: string;
  tribunal?: string;
  contentHash?: string;
  signature?: QuoteSignature;
  signedVia?: 'en_ligne' | 'yousign' | 'manuel';
  depositInvoice?: { id: string; url: string; amount: number };
  reminderSentAt?: string;
}

const PREFIX = 'quote:';
const s = (v: unknown, max = 4000): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Champs modifiables par l'admin tant que le devis est un brouillon (tout le reste est géré par le serveur). */
export function cleanQuoteInput(input: Record<string, unknown>): Partial<Quote> | null {
  const email = s(input.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const c = (input.client ?? {}) as Record<string, unknown>;
  const d = (input.droits ?? {}) as Record<string, unknown>;
  const se = (input.seance ?? {}) as Record<string, unknown>;
  const total = Number(input.totalHT);
  if (!Number.isFinite(total) || total <= 0 || total > 1_000_000) return null;
  const date = (v: unknown): string | undefined => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  return {
    email,
    lang: input.lang === 'en' ? 'en' : 'fr',
    template: s(input.template, 20) || 'part',
    client: {
      nom: s(c.nom, 200),
      profil: c.profil === 'professionnel' ? 'professionnel' : 'particulier',
      contact: s(c.contact, 200) || undefined,
      forme: s(c.forme, 30) || undefined,
      adresse: s(c.adresse, 400) || undefined,
      telephone: s(c.telephone, 50) || undefined,
      siret: s(c.siret, 20).replace(/\s/g, '') || undefined,
      tvaIntra: s(c.tvaIntra, 20).replace(/\s/g, '').toUpperCase() || undefined,
    },
    prestation: s(input.prestation, 300),
    contenu: s(input.contenu),
    notes: s(input.notes) || undefined,
    seance: { date: date(se.date), heure: s(se.heure, 30) || undefined, lieu: s(se.lieu, 300) || undefined },
    delai: s(input.delai, 300),
    totalHT: Math.round(total * 100) / 100,
    acomptePct: 30,
    abonnement: input.abonnement === true,
    droits: { destination: s(d.destination), duree: s(d.duree, 300), territoire: s(d.territoire, 200) || undefined, exclusivite: s(d.exclusivite, 100) || undefined },
    report: s(input.report) || undefined,
    conditions: Array.isArray(input.conditions) ? input.conditions.map((x) => s(x, 1000)).filter(Boolean).slice(0, 20) : [],
    validUntil: date(input.validUntil) ?? new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
    mediateur: s(input.mediateur, 400) || undefined,
    tribunal: s(input.tribunal, 200) || undefined,
  };
}

export function missingQuoteFields(q: Partial<Quote>): string[] {
  const m: string[] = [];
  if (!q.client?.nom) m.push('nom du client');
  if (!q.client?.adresse) m.push('adresse du client');
  if (q.client?.profil === 'professionnel' && !q.client.contact) m.push('contact (professionnel)');
  if (!q.prestation) m.push('prestation');
  if (!q.contenu) m.push('contenu / livrables');
  if (!q.delai) m.push('délai de livraison');
  if (!q.droits?.destination || !q.droits.duree) m.push('cession des droits');
  return m;
}

const randomHex = (bytes: number): string => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');

export async function getQuote(env: Env, id: string): Promise<Quote | null> {
  if (!/^[a-z0-9-]{6,40}$/.test(id)) return null;
  const raw = await env.ACCOUNTS_KV.get(PREFIX + id);
  return raw ? (JSON.parse(raw) as Quote) : null;
}

export async function putQuote(env: Env, q: Quote): Promise<void> {
  q.updatedAt = new Date().toISOString();
  await env.ACCOUNTS_KV.put(PREFIX + q.id, JSON.stringify(q));
}

export async function listQuotes(env: Env): Promise<Quote[]> {
  const keys = (await env.ACCOUNTS_KV.list({ prefix: PREFIX, limit: 1000 })).keys;
  const all = await Promise.all(keys.map(async (k) => {
    try { return JSON.parse((await env.ACCOUNTS_KV.get(k.name)) ?? 'null') as Quote | null; } catch { return null; }
  }));
  return all.filter((q): q is Quote => !!q).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Numérotation chronologique continue par année : AAAA-001, AAAA-002… */
async function nextNumber(env: Env): Promise<string> {
  const year = new Date().getFullYear();
  const key = `quote-seq:${year}`;
  const n = Number((await env.ACCOUNTS_KV.get(key)) ?? '0') + 1;
  await env.ACCOUNTS_KV.put(key, String(n));
  return `${year}-${String(n).padStart(3, '0')}`;
}

export async function createQuote(env: Env, data: Partial<Quote>): Promise<Quote> {
  const now = new Date().toISOString();
  const q = {
    ...data,
    id: `q-${randomHex(8)}`,
    number: await nextNumber(env),
    token: '',
    status: 'brouillon',
    createdAt: now,
    updatedAt: now,
  } as Quote;
  await putQuote(env, q);
  return q;
}

/** Empreinte du contenu contractuel (hors statut, dates techniques, signature). */
export async function quoteHash(q: Quote): Promise<string> {
  const { email, client, prestation, contenu, notes, seance, delai, totalHT, acomptePct, abonnement, droits, report, conditions, validUntil, mediateur, tribunal, number } = q;
  const canonical = JSON.stringify({ number, email, client, prestation, contenu, notes, seance, delai, totalHT, acomptePct, abonnement, droits, report, conditions, validUntil, mediateur, tribunal });
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function prepareSend(q: Quote): Promise<Quote> {
  q.token = q.token || randomHex(24);
  q.contentHash = await quoteHash(q);
  q.status = 'envoye';
  q.sentAt = new Date().toISOString();
  return q;
}

/** Vue publique pour la page de signature : sans le jeton ni les champs internes. */
export function publicQuote(q: Quote): Omit<Quote, 'token' | 'depositInvoice' | 'reminderSentAt'> & { depositUrl?: string } {
  const { token: _t, depositInvoice, reminderSentAt: _r, ...rest } = q;
  return { ...rest, ...(depositInvoice ? { depositUrl: depositInvoice.url } : {}) };
}

export function tokenMatches(q: Quote, token: unknown): boolean {
  if (typeof token !== 'string' || !q.token || token.length !== q.token.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ q.token.charCodeAt(i);
  return diff === 0;
}

export function isExpired(q: Quote): boolean {
  return q.status === 'envoye' && q.validUntil < new Date().toISOString().slice(0, 10);
}
