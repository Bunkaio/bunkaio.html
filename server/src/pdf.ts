import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont } from 'pdf-lib';
import { IMAGE_USES } from './quotes';
import type { Quote, FrozenLegal, ConsentEvent } from './quotes';

/**
 * PDF du devis signé : généré une seule fois à la signature, stocké tel quel (KV `quotepdf:<id>`), jamais régénéré.
 * Contenu : devis et clauses figés (texte du document envoyé), autorisations d'image choisies, bloc de preuve.
 * Polices PDF standard : les caractères hors alphabet Windows-1252 sont remplacés.
 */

const CP1252_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
const MAP: Record<string, string> = { '\u202f': ' ', '\u2009': ' ', '≈': '~', '→': '->', '←': '<-', '✓': 'v', '✦': '*', '⊹': '+', '−': '-' };
export const winText = (s: string): string =>
  [...s].map((ch) => (MAP[ch] ?? (ch.charCodeAt(0) <= 0xff || CP1252_EXTRA.has(ch) ? ch : ch === '\n' ? '\n' : '?'))).join('');

const ENT: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ', '&apos;': "'" };
const decode = (s: string): string => s.replace(/&(amp|lt|gt|quot|#39|nbsp|apos);/g, (m) => ENT[m] ?? m);

/** Convertit le HTML du devis en lignes de texte (titres marqués par « ## », puces par « • »). */
export function htmlToLines(html: string): string[] {
  const t = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<h1[^>]*>/gi, '\n## ').replace(/<h2[^>]*>/gi, '\n## ')
    .replace(/<\/h1>|<\/h2>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|div|tr|ul|table|section)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/th>/gi, ' : ')
    .replace(/<\/td>/gi, ' ')
    .replace(/<[^>]+>/g, '');
  return decode(t).split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter((l, i, a) => l || (a[i - 1] ?? ' '));
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (font.widthOfTextAtSize(test, size) <= width) line = test;
      else { if (line) out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

const USE_LABEL: Record<string, string> = {
  site: 'Site internet et portfolio de BUNKAIO',
  social: 'Reseaux sociaux de BUNKAIO',
  print: 'Supports commerciaux et de communication de BUNKAIO',
  ads: 'Campagnes publicitaires numeriques de BUNKAIO',
};

export interface PdfInput {
  quote: Quote;
  legal: FrozenLegal | null;
  documentHtml: string;
  generatedAt: string;
  quoteHash: string;
  log: ConsentEvent[];
}

export async function buildSignedPdf(input: PdfInput): Promise<Uint8Array> {
  const { quote: q, legal } = input;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Devis n° ${q.number} signé — BUNKAIO`);
  pdf.setAuthor('BUNKAIO');
  pdf.setSubject('Exemplaire signé et figé du devis, des clauses et des autorisations');
  pdf.setCreationDate(new Date(input.generatedAt));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89, M = 48, CW = W - 2 * M;
  let page = pdf.addPage([W, H]);
  let y = H - M;
  const pages = [page];
  const newPage = (): void => { page = pdf.addPage([W, H]); pages.push(page); y = H - M; };
  const ensure = (h: number): void => { if (y - h < M + 28) newPage(); };
  const line = (txt: string, o: { size?: number; b?: boolean; color?: [number, number, number]; indent?: number; gap?: number } = {}): void => {
    const size = o.size ?? 9.5, f = o.b ? bold : font, indent = o.indent ?? 0, lh = size * 1.38;
    for (const l of wrap(winText(txt), f, size, CW - indent)) {
      ensure(lh);
      y -= lh;
      page.drawText(l, { x: M + indent, y, size, font: f, color: rgb(...(o.color ?? [0.04, 0.04, 0.05])) });
    }
    y -= o.gap ?? 0;
  };
  const fdt = (iso: string): string => new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'medium' });

  line('BUNKAIO', { size: 20, b: true, gap: 2 });
  line(`Exemplaire signé du devis n° ${q.number}`, { size: 13, b: true, gap: 2 });
  line(`${q.prestation} — ${q.client.nom}`, { size: 10, color: [0.3, 0.28, 0.4], gap: 10 });
  line(`Document figé généré le ${fdt(input.generatedAt)} (heure de Paris). Version des clauses : ${legal?.version ?? 'antérieure au système de versions'}. Ce document ne peut plus être modifié : toute modification donne lieu à un nouveau devis.`, { size: 8.5, color: [0.4, 0.4, 0.45], gap: 12 });

  for (const l of htmlToLines(input.documentHtml)) {
    if (l.startsWith('## ')) { y -= 6; line(l.slice(3).toUpperCase(), { size: 9, b: true, color: [0.43, 0.35, 0.66], gap: 2 }); }
    else if (l.startsWith('• ')) line(l, { indent: 8 });
    else line(l, { gap: 1 });
  }

  /* Autorisations d'image du signataire */
  y -= 10;
  line('AUTORISATIONS D\'IMAGE ENREGISTREES A LA SIGNATURE', { size: 9, b: true, color: [0.43, 0.35, 0.66], gap: 2 });
  const sg = q.signature;
  if (sg?.imageUse) {
    for (const u of IMAGE_USES) line(`${sg.imageUse[u] === 'oui' ? '[X] Autorise' : '[ ] Refuse '}  —  ${USE_LABEL[u]}`, { indent: 8 });
    if (sg.persons) line(`Personnes photographiees declarees : ${sg.persons === 'self' ? 'le signataire uniquement' : sg.persons === 'self_others' ? 'le signataire et d\'autres personnes' : 'uniquement d\'autres personnes'}${sg.minors ? ' (dont au moins un mineur)' : ''}.`, { size: 9, gap: 2 });
    line('Ces choix sont independants, sans effet sur la prestation ni sur le prix, et reversibles a tout moment (contact@bunkaio.com ou bunkaio.com/retrait-autorisation/).', { size: 8.5, color: [0.4, 0.4, 0.45] });
  } else {
    line(`Utilisation du portfolio : ${sg?.portfolio ? 'autorisee' : 'refusee'} (devis anterieur au systeme d'autorisations detaillees).`, { indent: 8 });
  }

  /* Bloc de preuve */
  y -= 12;
  ensure(150);
  line('PREUVE DE LA SIGNATURE ELECTRONIQUE', { size: 9, b: true, color: [0.43, 0.35, 0.66], gap: 2 });
  const rows: [string, string][] = [
    ['Signataire', sg?.name ?? ''],
    ['Email du client', q.email],
    ['Date et heure de signature', sg ? `${fdt(sg.at)} (UTC : ${sg.at})` : ''],
    ['Mode de signature', q.signedVia === 'en_ligne' ? 'En ligne (page securisee, lien personnel)' : q.signedVia === 'yousign' ? 'Yousign' : 'Saisie manuelle par BUNKAIO'],
    ['Adresse IP', sg?.ip || 'non collectee'],
    ['Navigateur', sg?.ua || 'non collecte'],
    ['Version des clauses', legal?.version ?? 'n/a'],
    ['Empreinte des clauses (SHA-256)', sg?.snapshotHash ?? legal?.hash ?? 'n/a'],
    ['Empreinte du devis (SHA-256)', input.quoteHash],
  ];
  for (const [k, v] of rows) line(`${k} : ${v}`, { size: 8.5, indent: 8 });
  const events = input.log.filter((e) => e.type === 'choix').slice(0, 40);
  if (events.length) {
    y -= 6;
    line('Journal des choix (extrait)', { size: 8.5, b: true });
    for (const e of events) line(`${e.at} · ${e.who} · ${e.usage} : ${e.choice}`, { size: 8, indent: 8, color: [0.35, 0.35, 0.4] });
  }

  pages.forEach((p, i) => {
    p.drawText(winText(`BUNKAIO — devis n° ${q.number} signe — page ${i + 1}/${pages.length} — clauses ${legal?.version ?? 'n/a'}`), { x: M, y: 24, size: 7.5, font, color: rgb(0.5, 0.5, 0.55) });
  });
  return pdf.save();
}
