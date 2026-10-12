import type { Env } from './types';
import { IMAGE_USES, appendConsent, computeConsent, getConsentLog, getFrozenLegal, getQuote, listQuotes, putQuote, quoteHash, sha256Hex } from './quotes';
import type { ImageUse, ImageUseId, Quote, Subject, UseChoice } from './quotes';
import { buildAdminAlertEmail, buildSubjectConsentEmail, buildSubjectInviteEmail, buildWithdrawalAckEmail, buildWithdrawalDoneEmail, sendEmail } from './email';
import { buildSignedPdf } from './pdf';

/**
 * Droit à l'image : autorisations individuelles (salariés, invités, mineurs, modèles), demandes de retrait,
 * PDF signé figé. Chaque choix est enregistré dans le journal en ajout seul (`consentlog:<devis>`) avec la
 * version des clauses figées ; aucune ligne n'est jamais modifiée ni supprimée.
 */

const USE_LABEL_FR: Record<ImageUseId, string> = {
  site: 'Site internet et portfolio',
  social: 'Réseaux sociaux',
  print: 'Supports commerciaux et de communication',
  ads: 'Publicité numérique',
};
export const useLabel = (u: ImageUseId): string => USE_LABEL_FR[u];

export const newToken = (bytes: number): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
const randomHex = (bytes: number): string => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), (b) => b.toString(16).padStart(2, '0')).join('');
const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const json = (body: unknown, status: number, headers: Record<string, string>): Response => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

/** Un choix explicite (oui / non) pour chacun des quatre usages ; une réponse manquante invalide la signature. */
export function parseImageUse(raw: unknown): ImageUse | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const out = {} as ImageUse;
  for (const u of IMAGE_USES) {
    if (o[u] !== 'oui' && o[u] !== 'non') return null;
    out[u] = o[u] as UseChoice;
  }
  return out;
}

const parseUsages = (raw: unknown): ImageUseId[] => {
  if (raw === 'all') return [...IMAGE_USES];
  return Array.isArray(raw) ? IMAGE_USES.filter((u) => raw.includes(u)) : [];
};

export const groupUrl = (q: Quote): string => `https://bunkaio.com/autorisation/?q=${q.id}&g=${q.groupToken}`;
export const subjectUrl = (q: Quote, s: Subject): string => `https://bunkaio.com/autorisation/?q=${q.id}&s=${s.id}&k=${s.token}`;

/* ───────────── PDF signé : généré une seule fois, jamais régénéré ───────────── */

const PDFKEY = 'quotepdf:';
function fallbackHtml(q: Quote): string {
  const esc = (v: string): string => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<h2>Devis n° ${esc(q.number)}</h2><p>${esc(q.prestation)}</p><h2>Client</h2><p>${esc(q.client.nom)}<br>${esc(q.client.adresse ?? '')}<br>${esc(q.email)}</p>
<h2>Contenu</h2><p>${esc(q.contenu).replace(/\n/g, '<br>')}</p><h2>Prix</h2><p>${q.totalHT.toFixed(2)} € — TVA non applicable, art. 293 B du CGI. Délai : ${esc(q.delai)}</p>
<h2>Cession des droits d'auteur</h2><p>${esc(q.droits.destination)} Durée : ${esc(q.droits.duree)}.</p><h2>Conditions</h2><ul>${q.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>`;
}

export async function ensureSignedPdf(env: Env, q: Quote): Promise<{ bytes: Uint8Array; hash: string; created: boolean } | null> {
  const existing = await env.ACCOUNTS_KV.get(PDFKEY + q.id, 'arrayBuffer');
  if (existing) return { bytes: new Uint8Array(existing), hash: q.signature?.pdfHash ?? '', created: false };
  if (q.status !== 'signe' || !q.signature) return null;
  const legal = await getFrozenLegal(env, q.id);
  const sigImg = q.signature.sigImage ? await env.ACCOUNTS_KV.get('quotesigimg:' + q.id, 'arrayBuffer') : null;
  const bytes = await buildSignedPdf({ signatureImage: sigImg ? new Uint8Array(sigImg) : undefined, quote: q, legal, documentHtml: legal?.html ?? fallbackHtml(q), generatedAt: new Date().toISOString(), quoteHash: q.signature.hash || (await quoteHash(q)), log: await getConsentLog(env, q.id) });
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((x) => x.toString(16).padStart(2, '0')).join('');
  await env.ACCOUNTS_KV.put(PDFKEY + q.id, bytes);
  q.signature.pdfHash = hash;
  await putQuote(env, q);
  return { bytes, hash, created: true };
}
export async function getSignedPdf(env: Env, id: string): Promise<Uint8Array | null> {
  const b = await env.ACCOUNTS_KV.get(PDFKEY + id, 'arrayBuffer');
  return b ? new Uint8Array(b) : null;
}
export const bytesToBase64 = (bytes: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/* ───────────── Pages publiques : autorisation individuelle ───────────── */

const OPEN = (q: Quote): boolean => q.status === 'envoye' || q.status === 'signe';

export async function handleSubjectPublic(request: Request, env: Env, headers: Record<string, string>, path: string): Promise<Response> {
  const url = new URL(request.url);
  const body = request.method === 'POST' ? ((await request.json().catch(() => ({}))) as Record<string, unknown>) : {};
  const qid = request.method === 'POST' ? str(body.q, 40) : url.searchParams.get('q') ?? '';
  const sid = request.method === 'POST' ? str(body.s, 40) : url.searchParams.get('s') ?? '';
  const key = request.method === 'POST' ? str(body.k, 80) : url.searchParams.get('k') ?? '';
  const grp = request.method === 'POST' ? str(body.g, 80) : url.searchParams.get('g') ?? '';
  const q = await getQuote(env, qid);
  const legal = q ? await getFrozenLegal(env, q.id) : null;
  if (!q || !legal || !OPEN(q)) return json({ ok: false, error: 'not_found' }, 404, headers);
  let subject: Subject | undefined;
  if (sid) {
    subject = q.subjects?.find((s) => s.id === sid);
    if (!subject || !key || subject.token !== key) return json({ ok: false, error: 'not_found' }, 404, headers);
  } else if (!grp || !q.groupToken || grp !== q.groupToken) return json({ ok: false, error: 'not_found' }, 404, headers);

  if (path === '/subject' && request.method === 'GET') {
    return json({ ok: true, quote: { number: q.number, prestation: q.prestation, lang: q.lang }, legal: { version: legal.version, uses: legal.uses, notice: legal.notice }, subject: subject ? { name: subject.name, minor: subject.minor, status: subject.status, imageUse: subject.imageUse, withdrawnUses: subject.withdrawnUses } : null, group: !subject }, 200, headers);
  }
  if (path === '/subject/sign' && request.method === 'POST') {
    const imageUse = parseImageUse(body.imageUse);
    const name = str(body.name, 120);
    const email = str(body.email, 200).toLowerCase();
    const minor = body.minor === true;
    const guardianName = str(body.guardianName, 120);
    const guardianRelation = str(body.guardianRelation, 80);
    if (body.accept !== true || !imageUse || name.length < 3) return json({ ok: false, error: 'invalid' }, 400, headers);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: 'invalid_email' }, 400, headers);
    if (minor && (guardianName.length < 3 || !guardianRelation)) return json({ ok: false, error: 'guardian_required' }, 400, headers);
    const at = new Date().toISOString();
    if (!subject) {
      if ((q.subjects?.length ?? 0) >= 300) return json({ ok: false, error: 'limit' }, 409, headers);
      subject = { id: randomHex(6), token: randomHex(16), name, minor, status: 'invite', createdAt: at };
      q.subjects = [...(q.subjects ?? []), subject];
    } else if (subject.status === 'signe') {
      return json({ ok: false, error: 'already_signed' }, 409, headers);
    }
    Object.assign(subject, { name, email: email || subject.email, minor, guardianName: minor ? guardianName : undefined, guardianRelation: minor ? guardianRelation : undefined, status: 'signe', imageUse, signedAt: at, ip: request.headers.get('CF-Connecting-IP') ?? '', ua: (request.headers.get('User-Agent') ?? '').slice(0, 300), legalVersion: legal.version, snapshotHash: legal.hash });
    subject.hash = await sha256Hex(JSON.stringify({ q: q.id, id: subject.id, name, email: subject.email, minor, guardianName: subject.guardianName, guardianRelation: subject.guardianRelation, imageUse, at, v: legal.version, h: legal.hash }));
    await putQuote(env, q);
    await appendConsent(env, q.id, IMAGE_USES.map((u) => ({ type: 'choix' as const, who: `subject:${subject!.id}`, usage: u, choice: imageUse[u], ip: subject!.ip })));
    if (subject.email) {
      try {
        const m = buildSubjectConsentEmail({ name: minor ? guardianName : name, number: q.number, consents: IMAGE_USES.map((u) => ({ label: useLabel(u), yes: imageUse[u] === 'oui' })), legalVersion: legal.version, lang: q.lang });
        await sendEmail(env, subject.email, m.subject, m.html, m.text);
      } catch (err) { console.error('[autorisation] confirmation non envoyée', err); }
    }
    return json({ ok: true, subject: { name: subject.name, status: subject.status, imageUse }, legalVersion: legal.version }, 200, headers);
  }
  return json({ ok: false, error: 'not_found' }, 404, headers);
}

/* ───────────── Demande de retrait d'une autorisation ───────────── */

/** Enregistre une demande (jamais un retrait automatique : BUNKAIO vérifie puis le valide depuis l'admin). Réponse identique que l'email soit connu ou non. */
export async function handleWithdrawPublic(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const email = str(body.email, 200).toLowerCase();
  const name = str(body.name, 120);
  const number = str(body.number, 20);
  const message = str(body.message, 1500);
  const usages = parseUsages(body.usages);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || !usages.length) return json({ ok: false, error: 'invalid' }, 400, headers);
  const all = await listQuotes(env);
  let matched = 0;
  for (const q of all) {
    if (number && q.number !== number) continue;
    const isClient = q.email.toLowerCase() === email && q.status === 'signe';
    const subs = (q.subjects ?? []).filter((s) => (s.email ?? '').toLowerCase() === email && s.status === 'signe');
    if (!isClient && !subs.length) continue;
    matched++;
    const at = new Date().toISOString();
    if (isClient) q.consent = computeConsent({ ...q, consent: { ...(q.consent ?? { status: 'en_attente' as const }), withdrawalRequestedAt: at, withdrawnAt: undefined } });
    for (const s of subs) s.withdrawalRequestedAt = at;
    await putQuote(env, q);
    await appendConsent(env, q.id, [
      ...(isClient ? [{ type: 'retrait_demande' as const, who: 'client', usage: usages.length === IMAGE_USES.length ? ('all' as const) : usages[0], note: `${name} — ${usages.join(', ')}${message ? ' — ' + message : ''}` }] : []),
      ...subs.map((s) => ({ type: 'retrait_demande' as const, who: `subject:${s.id}`, usage: usages.length === IMAGE_USES.length ? ('all' as const) : usages[0], note: `${name} — ${usages.join(', ')}${message ? ' — ' + message : ''}` })),
    ]);
  }
  try {
    const a = buildAdminAlertEmail({ subject: `⚠ Demande de retrait d'autorisation d'image — ${name}`, lines: [`Demande de retrait reçue de ${name} <${email}>.`, `Usages : ${usages.map(useLabel).join(', ')}`, number ? `Devis indiqué : ${number}` : 'Aucun numéro de devis indiqué', matched ? `${matched} dossier(s) retrouvé(s) : statut « retrait demandé » dans l'admin (Devis → Suivi → Droit à l'image). Délai de traitement : 30 jours.` : 'Aucun dossier retrouvé avec cet email : vérifiez manuellement.', message ? `Message : ${message}` : ''].filter(Boolean) });
    await sendEmail(env, env.ADMIN_NOTIFICATION_EMAIL, a.subject, a.html, a.text);
    if (matched) { const m = buildWithdrawalAckEmail({ name }); await sendEmail(env, email, m.subject, m.html, m.text); }
  } catch (err) { console.error('[retrait] email non envoyé', err); }
  return json({ ok: true }, 200, headers);
}

/* ───────────── Actions admin sur le droit à l'image ───────────── */

export async function adminConsentAction(env: Env, q: Quote, body: Record<string, unknown>, headers: Record<string, string>): Promise<Response | null> {
  const action = body.action;
  const reply = (extra: Record<string, unknown> = {}): Response => json({ ok: true, quote: q, ...extra }, 200, headers);
  if (action === 'group-link') {
    if (!OPEN(q) || !q.legal) return json({ ok: false, error: 'not_applicable' }, 409, headers);
    if (!q.groupToken) { q.groupToken = randomHex(12); await putQuote(env, q); }
    return reply({ url: groupUrl(q) });
  }
  if (action === 'subject-add') {
    if (q.status === 'annule' || q.status === 'refuse') return json({ ok: false, error: 'not_applicable' }, 409, headers);
    const name = str(body.name, 120);
    if (name.length < 2 || (q.subjects?.length ?? 0) >= 300) return json({ ok: false, error: 'invalid' }, 400, headers);
    const email = str(body.email, 200).toLowerCase();
    const minor = body.minor === true;
    const s: Subject = { id: randomHex(6), token: randomHex(16), name, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined, role: str(body.role, 80) || undefined, minor, status: 'invite', createdAt: new Date().toISOString() };
    q.subjects = [...(q.subjects ?? []), s];
    await putQuote(env, q);
    return reply({ url: q.legal && OPEN(q) ? subjectUrl(q, s) : undefined });
  }
  const sid = str(body.sid, 40);
  const subject = sid ? q.subjects?.find((s) => s.id === sid) : undefined;
  if (action === 'subject-remove') {
    if (!subject || subject.status === 'signe') return json({ ok: false, error: 'not_applicable' }, 409, headers);
    q.subjects = (q.subjects ?? []).filter((s) => s.id !== sid);
    await putQuote(env, q);
    return reply();
  }
  if (action === 'subject-link') {
    if (!subject || !q.legal || !OPEN(q)) return json({ ok: false, error: 'not_applicable' }, 409, headers);
    return reply({ url: subjectUrl(q, subject) });
  }
  if (action === 'subject-invite') {
    if (!subject || !subject.email || !q.legal || !OPEN(q) || subject.status === 'signe') return json({ ok: false, error: 'not_applicable' }, 409, headers);
    try {
      const m = buildSubjectInviteEmail({ name: subject.name, number: q.number, url: subjectUrl(q, subject), lang: q.lang });
      await sendEmail(env, subject.email, m.subject, m.html, m.text);
    } catch (err) { console.error('[autorisation] invitation non envoyée', err); return json({ ok: false, error: 'email_error' }, 502, headers); }
    subject.invitedAt = new Date().toISOString();
    await putQuote(env, q);
    await appendConsent(env, q.id, [{ type: 'invitation', who: `subject:${subject.id}`, note: subject.email }]);
    return reply();
  }
  if (action === 'withdraw') {
    const usages = parseUsages(body.usages);
    const note = str(body.note, 500);
    const target = str(body.who, 40) || 'client';
    if (!usages.length) return json({ ok: false, error: 'invalid' }, 400, headers);
    const at = new Date().toISOString();
    let person = q.client.contact || q.client.nom;
    let email = q.email;
    if (target === 'client') {
      if (!q.signature?.imageUse) return json({ ok: false, error: 'not_applicable' }, 409, headers);
      const prev = q.consent ?? { status: 'en_attente' as const };
      const withdrawn = [...new Set([...(prev.withdrawnUses ?? []), ...usages])];
      q.consent = computeConsent({ ...q, consent: { ...prev, withdrawnUses: withdrawn, withdrawnAt: at, withdrawalRequestedAt: undefined } });
    } else {
      const s = q.subjects?.find((x) => x.id === target);
      if (!s || s.status !== 'signe') return json({ ok: false, error: 'not_applicable' }, 409, headers);
      s.withdrawnUses = [...new Set([...(s.withdrawnUses ?? []), ...usages])];
      s.withdrawalRequestedAt = undefined;
      person = s.minor ? (s.guardianName ?? s.name) : s.name;
      email = s.email ?? '';
    }
    await putQuote(env, q);
    await appendConsent(env, q.id, usages.map((u) => ({ type: 'retrait' as const, who: target === 'client' ? 'client' : `subject:${target}`, usage: u, choice: 'non' as const, note: note || undefined })));
    if (body.notify === true && email) {
      try { const m = buildWithdrawalDoneEmail({ name: person, usages: usages.map(useLabel), lang: q.lang }); await sendEmail(env, email, m.subject, m.html, m.text); } catch (err) { console.error('[retrait] confirmation non envoyée', err); }
    }
    return reply();
  }
  return null;
}

/* ───────────── Vue « Mes devis » de l'espace client / partenaire ───────────── */

export interface AccountQuote {
  number: string;
  prestation: string;
  status: 'envoye' | 'signe';
  test?: boolean;
  validUntil: string;
  signedAt?: string;
  url: string;
  image?: { status: string; uses: Record<string, 'oui' | 'non' | 'retire'>; version?: string; persons?: string; minors?: boolean; withdrawalRequestedAt?: string; subjects: { total: number; signed: number }; groupUrl?: string };
}

/** Devis envoyés (à signer) et signés de ce client, avec l'état de ses autorisations d'image. Les devis de test sont inclus (repérés « TEST ») : seul le titulaire de l'adresse les voit, ce qui permet de vérifier l'onglet. */
export async function accountQuotes(env: Env, email: string): Promise<AccountQuote[]> {
  const mail = email.toLowerCase();
  const out: AccountQuote[] = [];
  for (const q of await listQuotes(env)) {
    if (q.email.toLowerCase() !== mail || (q.status !== 'envoye' && q.status !== 'signe')) continue;
    const url = `https://bunkaio.com/signature/?d=${q.id}&k=${q.token}`;
    const item: AccountQuote = { number: q.number, prestation: q.prestation, status: q.status, ...(q.test ? { test: true } : {}), validUntil: q.validUntil, signedAt: q.signedAt, url };
    const sg = q.signature;
    if (q.status === 'signe' && sg?.imageUse) {
      const c = q.consent ?? computeConsent(q);
      const withdrawn = c.withdrawnUses ?? [];
      const subs = q.subjects ?? [];
      item.image = {
        status: c.status,
        uses: Object.fromEntries(IMAGE_USES.map((u) => [u, withdrawn.includes(u) ? 'retire' : sg.imageUse![u]])) as Record<string, 'oui' | 'non' | 'retire'>,
        version: sg.legalVersion,
        persons: sg.persons,
        minors: sg.minors,
        withdrawalRequestedAt: c.withdrawalRequestedAt,
        subjects: { total: subs.length, signed: subs.filter((x) => x.status === 'signe').length },
        groupUrl: q.groupToken && (sg.persons !== 'self' || sg.minors) ? groupUrl(q) : undefined,
      };
    }
    out.push(item);
  }
  return out.sort((a, b) => (b.signedAt ?? b.validUntil).localeCompare(a.signedAt ?? a.validUntil));
}
