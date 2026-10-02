import type Stripe from 'stripe';
import { adminAccountView, getAccount, listAccounts } from './accounts';
import type { AccountRecord, Env } from './types';

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
      c = { email: key, name: '', phone: '', lang: 'fr', roles: [], stage: 'contact', lead: null, customerId: null, totalPaid: 0, totalDue: 0, invoices: [], accounts: [], markers: {}, lastActivity: '', createdAt: '' };
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
    if (!cu.email) continue;
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
  const allInvoices = invoices.map(toInvoice);
  for (const inv of allInvoices) {
    if (!inv.email || inv.status === 'draft' || inv.status === 'void') continue;
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
    for (const rec of records.filter((r): r is AccountRecord => !!r)) {
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

  // 3. Marqueurs d'automatisation (relances, rappels…).
  const prefixes: Record<string, string> = { 'lead:': 'quizLe', 'inv:': 'acompteCree', 'dep:': 'acomptePaye', 'bal:': 'soldeCree', 'fu:': 'relanceDevis', 'mbr:': 'rappelMoodboard' };
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
    invoices: allInvoices.filter((i) => i.status !== 'draft').sort((a, b) => b.created.localeCompare(a.created)),
  };
}
