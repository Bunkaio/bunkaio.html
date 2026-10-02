import { sendEmail, buildClientActivityEmail } from './email';
import type { AccountRecord, ActivityEntry, Collaboration, Env, Moodboard, PendingActivityNotification } from './types';

const NOTIF_PREFIX = 'notif:';
const NOTIF_TTL_SECONDS = 7 * 24 * 3600;
/** Les modifications d'un même compte sont regroupées tant que le client continue d'enregistrer. */
const QUIET_WINDOW_MS = 3 * 60 * 1000;
const MAX_JOURNAL_ENTRIES = 200;

function short(value: string | undefined, max = 280): string {
  const v = (value ?? '').trim();
  return v.length > max ? v.slice(0, max) + '…' : v;
}

function moodboardLines(m: Moodboard): string[] {
  const lines: string[] = [`Statut : ${m.statut}`];
  if (m.commandeRef) lines.push(`Commande : ${m.commandeRef}`);
  if (m.typeProjet) lines.push(`Type de projet : ${m.typeProjet}`);
  if (m.direction) lines.push(`Direction artistique : ${short(m.direction)}`);
  if (m.ambiance?.length) lines.push(`Ambiance : ${m.ambiance.join(', ')}`);
  if (m.palette) lines.push(`Palette : ${short(m.palette)}`);
  if (m.pinterestUrl) lines.push(`Pinterest : ${short(m.pinterestUrl, 200)}`);
  if (m.references?.length) lines.push(`Inspirations : ${m.references.map((r) => r.url).join(' · ')}`);
  if (m.produits?.length) lines.push(`Produits : ${m.produits.map((p) => p.nom).join(', ')}`);
  if (m.collaborateurs?.length) lines.push(`Collaborateurs : ${m.collaborateurs.map((c) => c.nom).join(', ')}`);
  if (m.notes) lines.push(`Notes : ${short(m.notes)}`);
  const dernier = m.commentaires?.[m.commentaires.length - 1];
  if (dernier?.auteur === 'client') lines.push(`Dernier commentaire : ${short(dernier.texte)}`);
  return lines;
}

/**
 * Compare le compte avant/après une mise à jour par le client et décrit ce
 * qui a changé. Ne produit rien si rien d'utile n'a bougé (ex. simple
 * ré-enregistrement identique) — aucune notification parasite.
 */
export function diffAccountActivity(before: AccountRecord, after: AccountRecord, nowIso: string): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  const push = (type: ActivityEntry['type'], resume: string, details?: string[], silent?: boolean) =>
    entries.push({ id: `${Date.parse(nowIso).toString(36)}${Math.random().toString(36).slice(2, 7)}`, date: nowIso, type, resume, details, ...(silent ? { silent: true } : {}) });

  const prevMb = new Map((before.moodboards ?? []).map((m) => [m.id, m]));
  const nextMb = new Map((after.moodboards ?? []).map((m) => [m.id, m]));
  for (const [id, m] of nextMb) {
    const old = prevMb.get(id);
    // Un brouillon est journalisé mais ne déclenche pas d'email : le client n'a pas encore envoyé son moodboard.
    const draft = m.statut === 'Brouillon';
    if (!old) push('moodboard', `Moodboard créé : « ${m.titre} »`, moodboardLines(m), draft);
    else if (JSON.stringify(old) !== JSON.stringify(m)) {
      push('moodboard', old.statut !== m.statut ? `Moodboard « ${m.titre} » : ${old.statut} → ${m.statut}` : `Moodboard modifié : « ${m.titre} »`, moodboardLines(m), draft);
    }
  }
  for (const [id, m] of prevMb) if (!nextMb.has(id)) push('moodboard', `Moodboard supprimé : « ${m.titre} »`);

  const infoChanges: string[] = [];
  const fields: Array<['nom' | 'telephone' | 'adresse', string]> = [['nom', 'Nom / société'], ['telephone', 'Téléphone'], ['adresse', 'Adresse de facturation']];
  for (const [key, label] of fields) {
    if ((before[key] ?? '') !== (after[key] ?? '')) infoChanges.push(`${label} : ${short(after[key]) || '(vide)'}`);
  }
  if (infoChanges.length) push('infos', 'Coordonnées modifiées', infoChanges);

  const prevCollab = new Map((before.collaborations ?? []).map((c) => [c.id, c]));
  for (const c of after.collaborations ?? []) {
    const old: Collaboration | undefined = prevCollab.get(c.id);
    if (old && old.statut !== c.statut) push('collaboration', `Collaboration « ${c.titre} » : ${c.statut}`);
  }

  const pBefore = before.partenariat ?? {};
  const pAfter = after.partenariat ?? {};
  const partnerChanges: string[] = [];
  if (pBefore.typePrestataire !== pAfter.typePrestataire) partnerChanges.push(`Type de prestataire : ${pAfter.typePrestataire ?? '(aucun)'}`);
  if ((pBefore.disponibleCollab ?? false) !== (pAfter.disponibleCollab ?? false)) partnerChanges.push(`Disponible pour des collaborations : ${pAfter.disponibleCollab ? 'oui' : 'non'}`);
  if ((pBefore.visibleInDirectory ?? false) !== (pAfter.visibleInDirectory ?? false)) partnerChanges.push(`Référencé dans l'annuaire : ${pAfter.visibleInDirectory ? 'oui' : 'non'}`);
  if ((pBefore.presentation ?? '') !== (pAfter.presentation ?? '')) partnerChanges.push(`Présentation : ${short(pAfter.presentation) || '(vide)'}`);
  if (partnerChanges.length) push('partenariat', 'Profil partenaire mis à jour', partnerChanges);

  return entries;
}

/** Ajoute les entrées au journal du compte (borné) et met à jour la date de dernière activité. */
export function appendJournal(account: AccountRecord, entries: ActivityEntry[]): AccountRecord {
  if (!entries.length) return account;
  const journal = [...(account.journal ?? []), ...entries].slice(-MAX_JOURNAL_ENTRIES);
  return { ...account, journal, derniereActivite: entries[entries.length - 1]!.date };
}

function pendingKey(type: string, email: string): string {
  return `${NOTIF_PREFIX}${type}:${email.trim().toLowerCase()}`;
}

/** Met les modifications en file : un seul email récapitulatif sera envoyé une fois le client « calme ». */
export async function queueActivityNotification(env: Env, account: AccountRecord, allEntries: ActivityEntry[]): Promise<void> {
  let entries = allEntries;
  entries = entries.filter((e) => !e.silent);
  if (!entries.length) return;
  const key = pendingKey(account.type, account.email);
  const raw = await env.ACCOUNTS_KV.get(key);
  let pending: PendingActivityNotification | null = null;
  try { pending = raw ? (JSON.parse(raw) as PendingActivityNotification) : null; } catch { pending = null; }
  const merged: PendingActivityNotification = {
    type: account.type,
    email: account.email,
    nom: account.nom,
    entries: [...(pending?.entries ?? []), ...entries].slice(-50),
    lastAt: Date.now(),
  };
  await env.ACCOUNTS_KV.put(key, JSON.stringify(merged), { expirationTtl: NOTIF_TTL_SECONDS });
}

/**
 * Envoie un email par compte dont les modifications sont « posées » depuis
 * au moins QUIET_WINDOW_MS. Appelée par le cron toutes les 5 minutes. Une
 * entrée n'est supprimée qu'après envoi réussi : en cas d'échec Resend,
 * elle est retentée au passage suivant.
 */
export async function flushActivityNotifications(env: Env): Promise<void> {
  const listed = await env.ACCOUNTS_KV.list({ prefix: NOTIF_PREFIX, limit: 100 });
  for (const k of listed.keys) {
    try {
      const raw = await env.ACCOUNTS_KV.get(k.name);
      if (!raw) continue;
      const pending = JSON.parse(raw) as PendingActivityNotification;
      if (Date.now() - pending.lastAt < QUIET_WINDOW_MS) continue;
      const mail = buildClientActivityEmail({ type: pending.type, email: pending.email, nom: pending.nom, entries: pending.entries });
      await sendEmail(env, env.ADMIN_NOTIFICATION_EMAIL, mail.subject, mail.html, mail.text);
      await env.ACCOUNTS_KV.delete(k.name);
    } catch (err) {
      console.error('[activity] échec de l\'envoi du récapitulatif', { key: k.name, err });
    }
  }
}
