import type { Env, QuizLeadPayload } from './types';
import { buildQuizAutoReplyEmail, buildQuizConfirmationEmail, normalizeLang, sendEmail } from './email';
import type { Lang, Space } from './email';

/**
 * Réponses automatiques aux demandes de devis (questionnaire du site).
 * Des règles, testées dans l'ordre, choisissent un message préconçu selon les réponses (prestation, formule, profil,
 * délai, budget, tarif partenaire) ; aucune règle ne correspond → message par défaut. Tout se règle dans l'admin
 * (rubrique « Réponses aux devis »). Configuration : KV `autoreply:config` ; journal des 150 dernières demandes : KV `autoreply:log`.
 */

type L = { fr: string; en: string };
export interface ARTemplate { id: string; name: string; subject: L; body: L; recap: boolean; steps: boolean }
export interface ARRule {
  id: string; label: string; enabled: boolean; templateId: string;
  cats: string[]; tiers: string[]; profiles: string[]; delays: string[];
  budgetMin: number | null; budgetMax: number | null; partner: 'any' | 'yes' | 'no';
}
export interface ARConfig { enabled: boolean; fallback: string; rules: ARRule[]; templates: ARTemplate[]; updatedAt?: string }
export interface ARFacts {
  name: string; email: string; lang: Lang;
  cat: string; tier: string; profile: string; delay: string; budget: number | null; partner: boolean;
  categoryLabel: string; formuleLabel: string; budgetLabel: string; delayLabel: string; city: string;
}
export interface ARLogEntry { at: string; facts: ARFacts; templateId: string; ruleId: string; manual?: boolean; error?: boolean }

const KEY = 'autoreply:config';
const LOG_KEY = 'autoreply:log';

/* Libellés (ids du questionnaire du site, js/script.js : CATS, TIERS, POLAS, SUBS, PROFILES, DELAY_LABELS). */
export const AR_OPTIONS = {
  cats: { 'photo-part': { fr: 'Séance photo — particuliers', en: 'Portrait session — individuals' }, corporate: { fr: 'Corporate & Personal Branding', en: 'Corporate & Personal Branding' }, mode: { fr: 'Mode, agence et mannequins', en: 'Fashion, agencies & models' }, commercial: { fr: 'Commercial & produits', en: 'Commercial & products' }, event: { fr: 'Événementiel', en: 'Events' }, lumen: { fr: 'Lumen — photobooth', en: 'Lumen — photobooth' } } as Record<string, L>,
  tiers: { deco: { fr: 'Découverte', en: 'Discovery' }, lanc: { fr: 'Lancement', en: 'Launch' }, sig: { fr: 'Signature', en: 'Signature' }, prem: { fr: 'Premium', en: 'Premium' }, edit: { fr: 'Éditorial Bunkaio', en: 'Bunkaio editorial' }, grossesse: { fr: 'Book grossesse', en: 'Maternity book' }, polas: { fr: 'Polas', en: 'Polas' }, sub: { fr: 'Studio Continu (abonnement)', en: 'Studio Continu (subscription)' } } as Record<string, L>,
  profiles: { seul: { fr: 'Seul(e)', en: 'Solo' }, couple: { fr: 'En couple', en: 'As a couple' }, groupe: { fr: 'En groupe', en: 'Group' }, entrepreneur: { fr: 'Entrepreneur(e) / indépendant(e)', en: 'Entrepreneur / freelancer' }, equipe: { fr: 'Équipe / entreprise', en: 'Team / company' }, modele: { fr: 'Modèle émergent(e)', en: 'Emerging model' }, mannequin: { fr: 'Mannequin', en: 'Model' }, createur: { fr: 'Créateur(trice) de contenu', en: 'Content creator' }, marque: { fr: 'Marque / label', en: 'Brand / label' }, agence: { fr: 'Agence / studio', en: 'Agency / studio' }, ei: { fr: 'Entreprise individuelle', en: 'Sole proprietorship' }, gastro: { fr: 'Restaurateur / hôtelier', en: 'Restaurant / hotel owner' }, artisan: { fr: 'Artisan / créateur', en: 'Artisan / maker' }, event: { fr: 'Agence événementielle', en: 'Event agency' }, autre: { fr: 'Autre', en: 'Other' } } as Record<string, L>,
  delays: { urgent: { fr: 'Urgent (moins de 2 semaines)', en: 'Urgent (under 2 weeks)' }, '1_mois': { fr: 'Dans le mois', en: 'Within a month' }, '2_3_mois': { fr: '2 à 3 mois', en: '2 to 3 months' }, flexible: { fr: 'Flexible / pas de contrainte', en: 'Flexible / no constraint' } } as Record<string, L>,
};

const tpl = (id: string, name: string, subject: L, body: L, recap = true, steps = true): ARTemplate => ({ id, name, subject, body, recap, steps });
const rule = (id: string, label: string, templateId: string, c: Partial<ARRule>): ARRule => ({ id, label, enabled: true, templateId, cats: [], tiers: [], profiles: [], delays: [], budgetMin: null, budgetMax: null, partner: 'any', ...c });

/** Messages et règles proposés au départ (modifiables dans l'admin). Ton : Aya travaille seule, « je ». */
export function defaultConfig(): ARConfig {
  return {
    enabled: true,
    fallback: 'general',
    templates: [
      tpl('general', 'Confirmation générale',
        { fr: 'Bunkaio — Votre demande de devis est bien reçue', en: 'Bunkaio — Your quote request has been received' },
        { fr: "Merci pour votre demande de devis ({prestation}). Je l'ai bien reçue et je l'étudie personnellement.\n\nJe reviens vers vous sous 48 h ouvrées avec une proposition adaptée à votre projet. Si vous avez des précisions à ajouter (lieu, inspirations, date idéale), il suffit de répondre à cet email.",
          en: "Thank you for your quote request ({prestation}). I have received it and I am reviewing it personally.\n\nI will get back to you within 48 business hours with a proposal tailored to your project. If you would like to add details (location, inspiration, ideal date), simply reply to this email." }),
      tpl('urgent', 'Projet urgent (moins de 2 semaines)',
        { fr: 'Bunkaio — Votre demande urgente est bien reçue', en: 'Bunkaio — Your urgent request has been received' },
        { fr: "Merci pour votre demande ({prestation}, formule {formule}). J'ai bien noté que votre projet est urgent : je la traite en priorité et je vérifie mes disponibilités dès maintenant.\n\nPour gagner du temps, indiquez-moi en réponse à cet email vos dates possibles et le lieu envisagé. Vous pouvez aussi m'appeler au 07 58 57 31 61.",
          en: "Thank you for your request ({prestation}, {formule} package). I have noted that your project is urgent: I am handling it as a priority and checking my availability right now.\n\nTo save time, reply to this email with your possible dates and the intended location. You can also call me on +33 7 58 57 31 61." }),
      tpl('entrepreneurs', 'Entrepreneurs & personal branding',
        { fr: 'Bunkaio — Votre projet de photos professionnelles', en: 'Bunkaio — Your professional photo project' },
        { fr: "Merci pour votre demande (formule {formule}). Le but : des images professionnelles qui vous ressemblent, prises là où vous travaillez ou en extérieur.\n\nPour préparer la séance, vous pouvez déjà réfléchir à trois choses : le lieu (bureau, atelier, boutique, extérieur), les usages de vos photos (site, LinkedIn, réseaux, presse) et les tenues que vous portez au quotidien.\n\nJe reviens vers vous sous 48 h ouvrées pour fixer la date et le lieu. Vous pouvez aussi répondre directement à cet email.",
          en: "Thank you for your request ({formule} package). The goal: professional images that look like you, taken where you work or outdoors.\n\nTo prepare the session, you can already think about three things: the location (office, workshop, shop, outdoors), how you will use the photos (website, LinkedIn, social media, press) and the outfits you wear day to day.\n\nI will get back to you within 48 business hours to set the date and location. You can also reply directly to this email." }),
      tpl('mode', 'Mode, mannequins & agences',
        { fr: 'Bunkaio — Votre projet mode', en: 'Bunkaio — Your fashion project' },
        { fr: "Merci pour votre demande (formule {formule}). Book, polas ou lookbook : chaque séance est construite autour de votre objectif (agence, casting, collection, réseaux).\n\nSi vous en avez, envoyez-moi en réponse quelques photos récentes sans retouche, vos mensurations et vos références visuelles : je pourrai vous faire une proposition précise.\n\nJe reviens vers vous sous 48 h ouvrées.",
          en: "Thank you for your request ({formule} package). Book, polas or lookbook: each session is built around your goal (agency, casting, collection, social media).\n\nIf you have them, reply with a few recent unretouched photos, your measurements and your visual references: this will let me send you a precise proposal.\n\nI will get back to you within 48 business hours." }),
      tpl('marques', 'Marques, produits & commercial',
        { fr: 'Bunkaio — Votre projet de marque', en: 'Bunkaio — Your brand project' },
        { fr: "Merci pour votre demande (formule {formule}). Pour vous faire une proposition juste, indiquez-moi en réponse à cet email :\n- le nombre de produits ou de références à photographier ;\n- les usages prévus (site e-commerce, réseaux, campagne, print) ;\n- votre date limite de mise en ligne.\n\nJe reviens vers vous sous 48 h ouvrées.",
          en: "Thank you for your request ({formule} package). To send you an accurate proposal, please reply to this email with:\n- the number of products or items to photograph;\n- the intended uses (e-commerce site, social media, campaign, print);\n- your deadline for going live.\n\nI will get back to you within 48 business hours." }),
      tpl('evenement', 'Événementiel',
        { fr: 'Bunkaio — Votre événement', en: 'Bunkaio — Your event' },
        { fr: "Merci pour votre demande (formule {formule}). Pour vérifier mes disponibilités et préparer la couverture de votre événement, indiquez-moi en réponse : la date, le lieu, les horaires et le nombre approximatif d'invités.\n\nJe reviens vers vous sous 48 h ouvrées.",
          en: "Thank you for your request ({formule} package). To check my availability and prepare the coverage of your event, please reply with: the date, the venue, the timings and the approximate number of guests.\n\nI will get back to you within 48 business hours." }),
      tpl('particuliers', 'Particuliers & book grossesse',
        { fr: 'Bunkaio — Votre séance photo', en: 'Bunkaio — Your photo session' },
        { fr: "Merci pour votre demande (formule {formule}). Pas besoin d'être à l'aise devant l'objectif : je vous guide pendant toute la séance, pour des photos qui vous ressemblent vraiment.\n\nSi vous avez déjà des envies (lieu, ambiance, tenues), répondez simplement à cet email. Je reviens vers vous sous 48 h ouvrées pour fixer la date.",
          en: "Thank you for your request ({formule} package). No need to feel at ease in front of the camera: I guide you throughout the session, for photos that truly look like you.\n\nIf you already have ideas (location, mood, outfits), simply reply to this email. I will get back to you within 48 business hours to set the date." }),
    ],
    rules: [
      rule('r_urgent', 'Projet urgent', 'urgent', { delays: ['urgent'] }),
      rule('r_corporate', 'Entrepreneurs (Corporate & Personal Branding)', 'entrepreneurs', { cats: ['corporate'] }),
      rule('r_mode', 'Mode, agences et mannequins', 'mode', { cats: ['mode'] }),
      rule('r_commercial', 'Marques et produits', 'marques', { cats: ['commercial'] }),
      rule('r_event', 'Événementiel', 'evenement', { cats: ['event'] }),
      rule('r_part', 'Particuliers', 'particuliers', { cats: ['photo-part'] }),
    ],
  };
}

const str = (v: unknown, n: number): string => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, n) : '');
const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && /^[a-z0-9_-]{1,30}$/.test(x)).slice(0, 30) : []);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.round(v) : null);
const slugId = (v: unknown): string => str(v, 40).toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '');

/** Nettoie une configuration envoyée par l'admin. */
export function cleanConfig(raw: unknown): ARConfig | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const seen = new Set<string>();
  const templates = (Array.isArray(r.templates) ? r.templates : []).slice(0, 40).map((t): ARTemplate | null => {
    const o = (t ?? {}) as Record<string, unknown>;
    const id = slugId(o.id);
    if (!id || seen.has(id)) return null;
    seen.add(id);
    const sub = (o.subject ?? {}) as Record<string, unknown>, body = (o.body ?? {}) as Record<string, unknown>;
    return { id, name: str(o.name, 80) || id, subject: { fr: str(sub.fr, 200), en: str(sub.en, 200) }, body: { fr: str(body.fr, 6000), en: str(body.en, 6000) }, recap: o.recap !== false, steps: o.steps !== false };
  }).filter((t): t is ARTemplate => !!t && !!t.subject.fr && !!t.body.fr);
  if (!templates.length) return null;
  const has = (id: string): boolean => templates.some((t) => t.id === id);
  const rules = (Array.isArray(r.rules) ? r.rules : []).slice(0, 60).map((x, i): ARRule | null => {
    const o = (x ?? {}) as Record<string, unknown>;
    const templateId = slugId(o.templateId);
    if (!has(templateId)) return null;
    return { id: slugId(o.id) || `r_${i}`, label: str(o.label, 80) || `Règle ${i + 1}`, enabled: o.enabled !== false, templateId, cats: ids(o.cats), tiers: ids(o.tiers), profiles: ids(o.profiles), delays: ids(o.delays), budgetMin: num(o.budgetMin), budgetMax: num(o.budgetMax), partner: o.partner === 'yes' || o.partner === 'no' ? o.partner : 'any' };
  }).filter((x): x is ARRule => !!x);
  const fallback = has(slugId(r.fallback)) ? slugId(r.fallback) : templates[0]!.id;
  return { enabled: r.enabled !== false, fallback, rules, templates, updatedAt: new Date().toISOString() };
}

export async function getConfig(env: Env): Promise<ARConfig> {
  try { const raw = await env.ACCOUNTS_KV.get(KEY); if (raw) return JSON.parse(raw) as ARConfig; } catch { /* configuration illisible : valeurs proposées */ }
  return defaultConfig();
}
export async function saveConfig(env: Env, raw: unknown): Promise<ARConfig | null> {
  const c = cleanConfig(raw);
  if (c) await env.ACCOUNTS_KV.put(KEY, JSON.stringify(c));
  return c;
}

/* Ancien questionnaire sans identifiants : la prestation se retrouve par son libellé. */
const catFromLabel = (label: string): string => {
  const l = label.toLowerCase();
  if (l.includes('particulier')) return 'photo-part';
  if (l.includes('corporate') || l.includes('branding')) return 'corporate';
  if (l.includes('mode') || l.includes('mannequin')) return 'mode';
  if (l.includes('commercial') || l.includes('produit')) return 'commercial';
  if (l.includes('événement') || l.includes('evenement')) return 'event';
  if (l.includes('lumen')) return 'lumen';
  return '';
};
const delayFromLabel = (label: string): string => Object.entries(AR_OPTIONS.delays).find(([, v]) => v.fr === label || v.en === label)?.[0] ?? '';

export function factsFromLead(b: QuizLeadPayload): ARFacts {
  const lang = normalizeLang(b.lang);
  const cat = slugId(b.categoryId).replace(/_/g, '-') || catFromLabel(b.category);
  const tier = slugId(b.tierId);
  const delay = slugId(b.delayId) || delayFromLabel(b.delaiSouhaite ?? '');
  const L = (m: Record<string, L>, id: string, dflt: string): string => (m[id] ? m[id]![lang] : dflt);
  return {
    name: str(b.name, 120).trim(), email: str(b.email, 200).trim().toLowerCase(), lang,
    cat, tier, profile: slugId(b.profileId), delay,
    budget: typeof b.budgetMontantEur === 'number' && Number.isFinite(b.budgetMontantEur) ? b.budgetMontantEur : null,
    partner: /TARIF PARTENAIRE/i.test(b.formule ?? ''),
    categoryLabel: L(AR_OPTIONS.cats, cat, str(b.category, 120)),
    formuleLabel: L(AR_OPTIONS.tiers, tier, str(b.formule, 160).replace(/\s*\(.*$/, '')),
    budgetLabel: str(b.budgetEstime, 120),
    delayLabel: L(AR_OPTIONS.delays, delay, str(b.delaiSouhaite, 80)),
    city: str(b.villePrestation, 80),
  };
}

export function matchRule(r: ARRule, f: ARFacts): boolean {
  if (!r.enabled) return false;
  if (r.cats.length && !r.cats.includes(f.cat)) return false;
  if (r.tiers.length && !r.tiers.includes(f.tier)) return false;
  if (r.profiles.length && !r.profiles.includes(f.profile)) return false;
  if (r.delays.length && !r.delays.includes(f.delay)) return false;
  if (r.budgetMin !== null && (f.budget === null || f.budget < r.budgetMin)) return false;
  if (r.budgetMax !== null && (f.budget === null || f.budget > r.budgetMax)) return false;
  if (r.partner === 'yes' && !f.partner) return false;
  if (r.partner === 'no' && f.partner) return false;
  return true;
}

/** Message choisi pour une demande : première règle qui correspond, sinon le message par défaut. */
export function pickTemplate(c: ARConfig, f: ARFacts): { template: ARTemplate; ruleId: string } {
  const r = c.rules.find((x) => matchRule(x, f));
  const template = (r && c.templates.find((t) => t.id === r.templateId)) || c.templates.find((t) => t.id === c.fallback) || c.templates[0]!;
  return { template, ruleId: r && r.templateId === template.id ? r.id : '' };
}

export function renderAutoReply(t: ARTemplate, f: ARFacts, space?: Space): { subject: string; html: string; text: string } {
  const lang = f.lang;
  const first = f.name.split(/\s+/)[0] ?? '';
  const vars: Record<string, string> = { prenom: first, nom: f.name, prestation: f.categoryLabel, formule: f.formuleLabel, budget: f.budgetLabel, delai: f.delayLabel, ville: f.city };
  const fill = (s: string): string => s.replace(/\{(prenom|nom|prestation|formule|budget|delai|ville)\}/g, (_, k: string) => vars[k] || '').replace(/\(\s*,\s*/g, '(').replace(/\s*\(\s*\)/g, '').replace(/ {2,}/g, ' ');
  const subject = fill((lang === 'en' && t.subject.en) || t.subject.fr);
  const body = fill((lang === 'en' && t.body.en) || t.body.fr);
  const T = (fr: string, en: string): string => (lang === 'en' ? en : fr);
  const recap = t.recap ? [
    { label: T('Prestation', 'Service'), value: f.categoryLabel },
    { label: T('Formule', 'Package'), value: f.formuleLabel },
    { label: T('Budget estimé', 'Estimated budget'), value: f.budgetLabel },
    { label: T('Délai souhaité', 'Preferred timing'), value: f.delayLabel },
    { label: T('Lieu', 'Location'), value: f.city },
  ] : [];
  return buildQuizAutoReplyEmail({ lang, space, customerName: f.name, subject, body, tpl: 'reponse_devis_' + t.id, recap, steps: t.steps });
}

export async function getLog(env: Env): Promise<ARLogEntry[]> {
  try { const raw = await env.ACCOUNTS_KV.get(LOG_KEY); return raw ? (JSON.parse(raw) as ARLogEntry[]) : []; } catch { return []; }
}
async function appendLog(env: Env, e: ARLogEntry): Promise<void> {
  const log = await getLog(env);
  log.unshift(e);
  await env.ACCOUNTS_KV.put(LOG_KEY, JSON.stringify(log.slice(0, 150)));
}

/** Envoi automatique après une demande de devis. Réponses personnalisées désactivées → email de confirmation d'origine. */
export async function sendQuizAutoReply(env: Env, lead: QuizLeadPayload, space: Space): Promise<void> {
  const c = await getConfig(env);
  const f = factsFromLead(lead);
  if (!c.enabled) {
    const m = buildQuizConfirmationEmail({ customerName: lead.name, lang: f.lang, space });
    await sendEmail(env, lead.email, m.subject, m.html, m.text);
    await appendLog(env, { at: new Date().toISOString(), facts: f, templateId: '', ruleId: '' }).catch(() => undefined);
    return;
  }
  const { template, ruleId } = pickTemplate(c, f);
  const m = renderAutoReply(template, f, space);
  let error = false;
  try { await sendEmail(env, lead.email, m.subject, m.html, m.text, 'reponse_devis_' + template.id); } catch (err) { error = true; throw err; }
  finally { await appendLog(env, { at: new Date().toISOString(), facts: f, templateId: template.id, ruleId, ...(error ? { error } : {}) }).catch(() => undefined); }
}

/** Envoi manuel depuis l'admin (une demande du journal + le message choisi), ou envoi de test. */
export async function sendManualAutoReply(env: Env, f: ARFacts, templateId: string, space: Space, test?: string): Promise<{ ok: boolean; error?: string }> {
  const c = await getConfig(env);
  const t = c.templates.find((x) => x.id === templateId);
  if (!t) return { ok: false, error: 'message_inconnu' };
  const m = renderAutoReply(t, f, space);
  const to = test || f.email;
  try { await sendEmail(env, to, (test ? '[TEST] ' : '') + m.subject, m.html, m.text, 'reponse_devis_' + t.id); } catch { return { ok: false, error: 'send_error' }; }
  if (!test) await appendLog(env, { at: new Date().toISOString(), facts: f, templateId, ruleId: '', manual: true }).catch(() => undefined);
  return { ok: true };
}

/** Demande fictive pour l'aperçu et le test dans l'admin. */
export function sampleFacts(raw: unknown): ARFacts {
  const o = (raw ?? {}) as Record<string, unknown>;
  const lang: Lang = o.lang === 'en' ? 'en' : 'fr';
  const cat = slugId(o.cat).replace(/_/g, '-') || 'corporate', tier = slugId(o.tier) || 'lanc', delay = slugId(o.delay) || '1_mois';
  const L = (m: Record<string, L>, id: string): string => (m[id] ? m[id]![lang] : '');
  const budget = num(o.budget) ?? 320;
  return { name: str(o.name, 120) || 'Camille Martin', email: str(o.email, 200), lang, cat, tier, profile: slugId(o.profile), delay, budget, partner: o.partner === true, categoryLabel: L(AR_OPTIONS.cats, cat), formuleLabel: L(AR_OPTIONS.tiers, tier), budgetLabel: `${budget} €`, delayLabel: L(AR_OPTIONS.delays, delay), city: str(o.city, 80) || 'Montpellier' };
}
