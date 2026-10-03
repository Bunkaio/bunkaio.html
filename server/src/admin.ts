import type Stripe from 'stripe';
import { adminAccountView, getAccount, listAccounts } from './accounts';
import { getBusinessAddress, isDemo } from './config';
import { getLabelNames, listInbox } from './inbox';
import { getTagNames } from './tags';
import type { InboxItem } from './inbox';
import { listQuotes, putQuote } from './quotes';
import type { Quote } from './quotes';
import { deleteMessagesOf, listMessages } from './messages';
import type { FormMessage } from './messages';
import type { AccountRecord, AccountType, Env } from './types';

/**
 * Tableau de bord admin : une seule réponse qui fusionne toutes les sources
 * (leads du quiz et clients Stripe, factures, espaces client/partenaire, marqueurs
 * d'automatisation) en une base de contacts indexée par email. Lecture seule.
 */

const norm = (email: string | null | undefined): string => (email ?? '').trim().toLowerCase();

export interface DashboardInvoice {
  id: string;
  number: string | null;
  email: string;
  name: string;
  kind: 'acompte' | 'solde' | 'autre';
  description: string;
  status: string;
  overdue: boolean;
  amount: number;
  amountPaid: number;
  amountRemaining: number;
  created: string;
  dueDate: string | null;
  paidAt: string | null;
  url: string | null;
  pdf: string | null;
  /** false = facture créée avec la clé de test Stripe. */
  live: boolean;
}

export interface DashboardContact {
  email: string;
  name: string;
  phone: string;
  lang: string;
  roles: string[];
  stage: string;
  lead: Record<string, string | number> | null;
  customerId: string | null;
  totalPaid: number;
  totalDue: number;
  invoices: DashboardInvoice[];
  accounts: ReturnType<typeof adminAccountView>[];
  messages: FormMessage[];
  quotes: Omit<Quote, 'token'>[];
  mail: { last: string; tpl: string; n: number; ok: boolean } | null;
  tags: string[];
  unsub: boolean;
  hasNote: boolean;
  markers: Record<string, string>;
  lastActivity: string;
  createdAt: string;
}

function iso(ts: number | null | undefined): string | null {
  return ts ? new Date(ts * 1000).toISOString() : null;
}

function toInvoice(inv: Stripe.Invoice): DashboardInvoice {
  const type = inv.metadata?.type;
  const dueDate = iso(inv.due_date);
  return {
    id: inv.id,
    number: inv.number ?? null,
    email: norm(inv.customer_email),
    name: inv.customer_name ?? '',
    kind: type === 'acompte_30' ? 'acompte' : type === 'solde_70' ? 'solde' : 'autre',
    description: inv.metadata?.description || inv.description || inv.lines?.data?.[0]?.description || '',
    status: inv.status ?? 'draft',
    overdue: inv.status === 'open' && !!inv.due_date && inv.due_date * 1000 < Date.now(),
    amount: inv.total / 100,
    amountPaid: inv.amount_paid / 100,
    amountRemaining: inv.amount_remaining / 100,
    created: iso(inv.created) ?? '',
    dueDate,
    paidAt: iso(inv.status_transitions?.paid_at),
    url: inv.hosted_invoice_url ?? null,
    pdf: inv.invoice_pdf ?? null,
    live: inv.livemode,
  };
}

/** Étape du parcours client, de la demande à la livraison. */
function computeStage(c: DashboardContact, now: string): string {
  const acc = c.accounts.find((a) => a.type === 'client') ?? c.accounts[0];
  const inv = c.invoices;
  const depositPaid = inv.some((i) => i.kind === 'acompte' && i.status === 'paid');
  const depositOpen = inv.some((i) => i.kind === 'acompte' && i.status === 'open');
  const balancePaid = inv.some((i) => i.kind === 'solde' && i.status === 'paid');
  const balanceOpen = inv.some((i) => i.kind === 'solde' && i.status === 'open');
  if (acc?.seance?.statut === 'annulee' && !balancePaid) return 'annule';
  if (balancePaid || acc?.photosAcces) return 'livre';
  if (balanceOpen) return 'solde';
  if (depositPaid) return acc?.seance?.date && acc.seance.date < now ? 'postprod' : 'reserve';
  if (depositOpen) return 'acompte';
  if (c.quotes.some((q) => q.status === 'signe')) return 'acompte';
  if (c.quotes.some((q) => q.status === 'envoye')) return 'devis';
  if (c.lead) return 'lead';
  if (c.roles.includes('partner')) return 'partenaire';
  return 'contact';
}

export async function buildDashboard(env: Env, stripe: Stripe): Promise<Record<string, unknown>> {
  const contacts = new Map<string, DashboardContact>();
  const get = (email: string): DashboardContact => {
    const key = norm(email);
    let c = contacts.get(key);
    if (!c) {
      c = { email: key, name: '', phone: '', lang: 'fr', roles: [], stage: 'contact', lead: null, customerId: null, totalPaid: 0, totalDue: 0, invoices: [], accounts: [], messages: [], quotes: [], mail: null, tags: [], unsub: false, hasNote: false, markers: {}, lastActivity: '', createdAt: '' };
      contacts.set(key, c);
    }
    return c;
  };
  const touch = (c: DashboardContact, date: string | null | undefined): void => {
    if (date && date > c.lastActivity) c.lastActivity = date;
    if (date && (!c.createdAt || date < c.createdAt)) c.createdAt = date;
  };
  const errors: string[] = [];

  // 1. Clients Stripe (dont les leads du quiz) et factures.
  let customers: Stripe.Customer[] = [];
  let invoices: Stripe.Invoice[] = [];
  try {
    [customers, invoices] = await Promise.all([
      stripe.customers.list({ limit: 100 }).autoPagingToArray({ limit: 1000 }),
      stripe.invoices.list({ limit: 100 }).autoPagingToArray({ limit: 1000 }),
    ]);
  } catch (err) {
    console.error('[admin] lecture Stripe impossible', err);
    errors.push('stripe');
  }
  for (const cu of customers) {
    if (!cu.email || isDemo(cu.email)) continue;
    const c = get(cu.email);
    c.customerId = cu.id;
    c.name ||= cu.name ?? '';
    c.phone ||= cu.phone ?? '';
    const m = cu.metadata ?? {};
    if (m.langue) c.lang = m.langue;
    touch(c, iso(cu.created));
    if (cu.discount) c.markers.remise15 = 'oui';
    if (m.avis_clique === 'oui') c.markers.avisClique = m.avis_clique_le || 'oui';
    if (m.source === 'quiz_bunkaio') {
      if (!c.roles.includes('lead')) c.roles.push('lead');
      c.lead = {
        score: Number(m.lead_score ?? 0),
        temperature: m.lead_temperature || 'froid',
        category: m.type_projet ?? '',
        profile: m.profil ?? '',
        formule: m.formule_recommandee ?? '',
        budget: m.budget_estime ?? '',
        delai: m.delai_souhaite ?? '',
        options: m.options_choisies ?? '',
        description: m.description_projet ?? '',
        communication: m.interet_communication ?? '',
        date: m.derniere_soumission_quiz ?? '',
      };
      touch(c, m.derniere_soumission_quiz);
    }
  }
  // Factures masquées à la demande de l'admin (une facture payée ne peut pas être supprimée chez Stripe).
  const hidden = new Set<string>();
  try { for (const k of (await env.ACCOUNTS_KV.list({ prefix: 'invhide:', limit: 1000 })).keys) hidden.add(k.name.slice(8)); } catch { /* sans masquage */ }
  const allInvoices = invoices.filter((i) => !hidden.has(i.id)).map(toInvoice);
  for (const inv of allInvoices) {
    if (!inv.email || isDemo(inv.email) || inv.status === 'draft' || inv.status === 'void') continue;
    const c = get(inv.email);
    c.name ||= inv.name;
    c.invoices.push(inv);
    if (inv.status === 'paid') c.totalPaid += inv.amountPaid;
    if (inv.status === 'open') c.totalDue += inv.amountRemaining;
    touch(c, inv.paidAt ?? inv.created);
    if (inv.status === 'paid' && !c.roles.includes('client')) c.roles.push('client');
  }

  // 2. Espaces client / partenaire (fiche complète, journal compris).
  try {
    const summaries = await listAccounts(env);
    const records = await Promise.all(summaries.map((s) => getAccount(env, s.type, s.email)));
    for (const rec of records.filter((r): r is AccountRecord => !!r && !isDemo(r.email))) {
      const c = get(rec.email);
      c.accounts.push(adminAccountView(rec));
      c.name ||= rec.nom ?? '';
      c.phone ||= rec.telephone ?? '';
      if (rec.lang) c.lang = rec.lang;
      const role = rec.type === 'partner' ? 'partner' : 'espace';
      if (!c.roles.includes(role)) c.roles.push(role);
      touch(c, rec.derniereActivite);
    }
  } catch (err) {
    console.error('[admin] lecture des comptes impossible', err);
    errors.push('accounts');
  }

  // 3. Messages des formulaires du site.
  let messages: FormMessage[] = [];
  try {
    messages = (await listMessages(env)).filter((m) => !isDemo(m.email));
    for (const m of messages) {
      const c = get(m.email);
      c.messages.push(m);
      c.name ||= m.name;
      if (m.details.telephone && !c.phone) c.phone = m.details.telephone;
      if (!c.roles.includes('message')) c.roles.push('message');
      touch(c, m.date);
    }
  } catch (err) {
    console.error('[admin] lecture des messages impossible', err);
    errors.push('messages');
  }

  // 4. Devis.
  let quotes: Omit<Quote, 'token'>[] = [];
  try {
    quotes = (await listQuotes(env)).filter((q) => !isDemo(q.email)).map(({ token: _t, ...rest }) => rest);
    for (const q of quotes) {
      const c = get(q.email);
      c.quotes.push(q);
      c.name ||= q.client?.nom ?? '';
      touch(c, q.signedAt ?? q.sentAt ?? q.createdAt);
    }
  } catch (err) {
    console.error('[admin] lecture des devis impossible', err);
    errors.push('quotes');
  }

  // 5. Journal des emails (métadonnées seulement), désinscriptions et notes.
  try {
    for (const k of (await env.ACCOUNTS_KV.list<{ last: string; t: string; n: number; ok: boolean }>({ prefix: 'maillog:', limit: 1000 })).keys) {
      const c = contacts.get(k.name.slice(8));
      if (c && k.metadata) c.mail = { last: k.metadata.last, tpl: k.metadata.t, n: k.metadata.n, ok: k.metadata.ok };
    }
    for (const k of (await env.ACCOUNTS_KV.list({ prefix: 'unsub:', limit: 1000 })).keys) { const c = contacts.get(k.name.slice(6)); if (c) c.unsub = true; }
    for (const k of (await env.ACCOUNTS_KV.list<{ t: string }>({ prefix: 'tags:', limit: 1000 })).keys) { const c = contacts.get(k.name.slice(5)); if (c && k.metadata?.t) c.tags = k.metadata.t.split(','); }
    for (const k of (await env.ACCOUNTS_KV.list({ prefix: 'note:', limit: 1000 })).keys) { const c = contacts.get(k.name.slice(5)); if (c) c.hasNote = true; }
  } catch (err) {
    console.error('[admin] lecture du journal des emails impossible', err);
    errors.push('maillog');
  }

  // 6. Marqueurs d'automatisation (relances, rappels…).
  const prefixes: Record<string, string> = { 'lead:': 'quizLe', 'inv:': 'acompteCree', 'dep:': 'acomptePaye', 'bal:': 'soldeCree', 'fu:': 'relanceDevis', 'mbr:': 'rappelMoodboard', 'qsent:': 'qsent' };
  try {
    for (const [prefix, label] of Object.entries(prefixes)) {
      const list = await env.ACCOUNTS_KV.list({ prefix, limit: 1000 });
      for (const k of list.keys) {
        const email = k.name.slice(prefix.length);
        const c = contacts.get(email);
        if (!c) continue;
        let value = 'oui';
        if (prefix === 'lead:' || prefix === 'dep:') {
          const raw = await env.ACCOUNTS_KV.get(k.name);
          try { value = (JSON.parse(raw ?? '{}') as { date?: string }).date ?? 'oui'; } catch { /* valeur brute */ }
        }
        c.markers[label] = value;
      }
    }
  } catch (err) {
    console.error('[admin] lecture des marqueurs impossible', err);
    errors.push('markers');
  }

  let inbox: InboxItem[] = [];
  let inboxLabels: Record<string, string> = {};
  let tagNames: Record<string, string> = {};
  try { tagNames = await getTagNames(env); } catch { /* noms par défaut côté tableau de bord */ }
  try { inboxLabels = await getLabelNames(env); } catch { /* étiquettes par défaut côté tableau de bord */ }
  try { inbox = await listInbox(env); } catch (err) { console.error('[admin] lecture de la boîte de réception impossible', err); errors.push('inbox'); }

  const today = new Date().toISOString().slice(0, 10);
  const list = [...contacts.values()];
  for (const c of list) {
    c.invoices.sort((a, b) => b.created.localeCompare(a.created));
    c.stage = computeStage(c, today);
  }
  list.sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    errors,
    contacts: list,
    messages,
    inbox,
    inboxLabels,
    tagNames,
    quotes,
    business: { address: getBusinessAddress() },
    invoices: allInvoices.filter((i) => i.status !== 'draft' && !isDemo(i.email)).sort((a, b) => b.created.localeCompare(a.created)),
  };
}

/**
 * Suppression demandée depuis le tableau de bord.
 * - `type` fourni : supprime uniquement cet espace (client ou partenaire).
 * - sinon : supprime tout le contact (espaces, messages, marqueurs d'automatisation). Côté Stripe,
 *   le client est supprimé s'il n'a aucune facture ; s'il en a, il est conservé (obligation de
 *   conservation comptable des factures) mais ses réponses au devis sont effacées.
 */
export async function deleteContact(env: Env, stripe: Stripe, email: string, type?: AccountType, purge = false): Promise<Record<string, unknown>> {
  const key = norm(email);
  const summary: Record<string, unknown> = { email: key };
  const types: AccountType[] = type ? [type] : ['client', 'partner'];
  let accounts = 0;
  for (const t of types) {
    const k = `account:${t}:${key}`;
    if (await env.ACCOUNTS_KV.get(k)) { await env.ACCOUNTS_KV.delete(k); accounts++; }
  }
  summary.accounts = accounts;
  if (type) return summary;

  summary.messages = await deleteMessagesOf(env, key);
  // Les devis envoyés ou signés sont des documents contractuels : seuls les brouillons sont supprimés.
  let quotesDeleted = 0;
  for (const q of await listQuotes(env)) {
    if (q.email === key && (q.status === 'brouillon' || q.status === 'annule')) { await env.ACCOUNTS_KV.delete('quote:' + q.id); quotesDeleted++; }
  }
  summary.quotesDeleted = quotesDeleted;
  let markers = 0;
  for (const p of ['lead:', 'inv:', 'dep:', 'bal:', 'fu:', 'mbr:']) {
    if (await env.ACCOUNTS_KV.get(p + key)) { await env.ACCOUNTS_KV.delete(p + key); markers++; }
  }
  for (const p of [`rem:${key}:`, `thx:${key}:`, `alv:${key}:`, `adt:${key}:`, `ack:contact:${key}`, `ack:collab:${key}`, `ack:partner:${key}`, `ack:account:${key}`]) {
    for (const k of (await env.ACCOUNTS_KV.list({ prefix: p })).keys) { await env.ACCOUNTS_KV.delete(k.name); markers++; }
  }
  summary.markers = markers;

  const customers = (await stripe.customers.list({ email: key, limit: 10 })).data;
  let stripeDeleted = 0;
  let stripeKept = 0;
  for (const cu of customers) {
    const invs = await stripe.invoices.list({ customer: cu.id, limit: 100 });
    if (purge) {
      // Suppression complète (données de test) : brouillons supprimés, factures ouvertes annulées, puis fiche client supprimée.
      for (const inv of invs.data) await removeInvoice(env, stripe, inv.id).catch((err) => console.error('[admin] facture non supprimée', inv.id, err));
      await stripe.customers.del(cu.id);
      stripeDeleted++;
    } else if (invs.data.length) {
      const cleared: Record<string, string> = {};
      for (const k of Object.keys(cu.metadata ?? {})) cleared[k] = '';
      await stripe.customers.update(cu.id, { metadata: cleared });
      stripeKept++;
    } else {
      await stripe.customers.del(cu.id);
      stripeDeleted++;
    }
  }
  summary.stripeDeleted = stripeDeleted;
  summary.stripeKeptWithInvoices = stripeKept;
  return summary;
}

/**
 * Supprime « proprement » une facture du point de vue du tableau de bord :
 * - brouillon : supprimé définitivement chez Stripe ;
 * - ouverte : annulée (void) chez Stripe, ce qui désactive son lien de paiement et ses relances, puis masquée ;
 * - payée : Stripe interdit toute suppression (conservation légale) → seulement masquée du tableau de bord.
 * Nettoie aussi les marqueurs d'automatisation et les devis qui pointaient vers cette facture.
 */
export async function removeInvoice(env: Env, stripe: Stripe, id: string): Promise<{ id: string; action: 'supprimee' | 'annulee' | 'masquee'; livemode: boolean }> {
  const inv = await stripe.invoices.retrieve(id);
  const email = norm(inv.customer_email);
  let action: 'supprimee' | 'annulee' | 'masquee';
  if (inv.status === 'draft') {
    await stripe.invoices.del(id);
    action = 'supprimee';
  } else if (inv.status === 'open' || inv.status === 'uncollectible') {
    await stripe.invoices.voidInvoice(id);
    action = 'annulee';
  } else if (inv.status === 'void') {
    action = 'annulee';
  } else {
    action = 'masquee';
  }
  await env.ACCOUNTS_KV.put(`invhide:${id}`, new Date().toISOString());

  if (email) {
    // Si plus aucune facture active de ce type, on efface les marqueurs qui en dépendaient (relances, rappels…).
    const remaining = (await stripe.invoices.list({ customer: typeof inv.customer === 'string' ? inv.customer : inv.customer?.id, limit: 100 })).data
      .filter((i) => i.id !== id && i.status !== 'void' && i.status !== 'draft');
    const kind = inv.metadata?.type;
    const hasDeposit = remaining.some((i) => i.metadata?.type === 'acompte_30');
    const hasBalance = remaining.some((i) => i.metadata?.type === 'solde_70');
    if (kind === 'acompte_30' && !hasDeposit) { await env.ACCOUNTS_KV.delete(`inv:${email}`); await env.ACCOUNTS_KV.delete(`dep:${email}`); await env.ACCOUNTS_KV.delete(`mbr:${email}`); }
    if (kind === 'solde_70' && !hasBalance) await env.ACCOUNTS_KV.delete(`bal:${email}`);
    for (const q of await listQuotes(env)) {
      if (q.depositInvoice?.id === id) { delete q.depositInvoice; await putQuote(env, q); }
    }
  }
  return { id, action, livemode: inv.livemode };
}
