/* ═══════════════════════════════════════════════════════════════
   tools/build-routes.cjs — génère les pages statiques SEO du site.

   Usage (à relancer après toute modification de contenu ou de
   config/routes.js) :
     NODE_PATH=<dossier des node_modules contenant playwright> node tools/build-routes.cjs

   Ce que fait le script :
   1. Lit config/routes.js (URL, titre, description de chaque page).
   2. Ouvre le site dans Chromium (Playwright) et récupère le HTML rendu
      par le JavaScript (catalogue, FAQ, partenaires…) pour chaque page.
   3. Écrit une page HTML par route (/services/index.html, /faq/index.html…)
      avec : <title>, description, canonical, Open Graph, UN SEUL <h1>, la
      bonne vue active et le contenu déjà présent dans le HTML.
   4. Réécrit index.html (accueil), sitemap.xml et 404.html.
   Le site reste une application à une seule page : le JavaScript reprend
   la main au chargement et ré-affiche tout normalement.
   ═══════════════════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');
const http = require('http');
const vm = require('vm');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://bunkaio.com';
const ROUTES = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config/routes.js'), 'utf8') + ';SEO_ROUTES', {});

/* Conteneurs remplis par le JavaScript, à pré-rendre dans le HTML. */
const SNAPS_BY_VIEW = {
  home: ['missionServicesTrack'],
  services: ['servicesFilters', 'servicesGrid', 'processSteps'],
  legal: ['faqAccordion', 'privacyAccordion'],
  partners: ['partnersPitch', 'partnersAccordion', 'applyBenefitsAccordion'],
};
const SNAPS_ALL = ['ftServices'];
const ENTITY = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/entity.json'), 'utf8'));
const IMG = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config/media.js'), 'utf8') + ';IMG', {});
const ALL_SNAP_IDS = [...new Set([...Object.values(SNAPS_BY_VIEW).flat(), ...SNAPS_ALL])];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.mp4': 'video/mp4', '.json': 'application/json', '.xml': 'application/xml' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    }).listen(0, () => resolve(srv));
  });
}

/* ── manipulation du HTML ── */
function normalize(html) {
  // Tous les H1 de page repassent en <h1> (la source reste lisible et idempotente).
  return html.replace(/<h([12])((?:\s[^>]*)?\sdata-pageh1[^>]*)>([\s\S]*?)<\/h\1>/g, '<h1$2>$3</h1>');
}
function setSnap(html, id, content) {
  const open = new RegExp('<(\\w+)[^>]*\\bid="' + id + '"[^>]*>');
  const m = open.exec(html);
  if (!m) return html;
  const end = m.index + m[0].length;
  if (html.startsWith('<!--snap-->', end)) {
    const close = html.indexOf('<!--/snap-->', end);
    return html.slice(0, end) + '<!--snap-->' + content + html.slice(close);
  }
  return html.slice(0, end) + '<!--snap-->' + content + '<!--/snap-->' + html.slice(end);
}
function esc(v) { return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function setMeta(html, re, replacement) { return re.test(html) ? html.replace(re, replacement) : html; }

/* Données structurées (JSON-LD) : un @graph par page, construit uniquement à partir de
   config/entity.json et des routes — aucune donnée inventée (pas d'avis, pas de note). */
function buildJsonLd(route) {
  const b = ENTITY.brand, per = ENTITY.person;
  const bizId = SITE + '/#business', siteId = SITE + '/#website', personId = SITE + '/a-propos/#aya';
  const url = SITE + route.path;
  const graph = [];
  graph.push({
    '@type': 'ProfessionalService', '@id': bizId,
    name: b.name, alternateName: b.alternateName, url: SITE + '/',
    logo: b.logo, image: b.logo, description: b.description,
    telephone: b.telephone, email: b.email, priceRange: b.priceRange, sameAs: b.sameAs,
    address: { '@type': 'PostalAddress', addressRegion: b.region, addressCountry: 'FR' },
    areaServed: [...b.cities.map((c) => ({ '@type': 'City', name: c })), { '@type': 'AdministrativeArea', name: b.region }],
    knowsAbout: per.knowsAbout,
    employee: { '@id': personId },
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: 'Prestations de photographie',
      itemListElement: b.services.map((sv) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: sv.name, description: sv.description, provider: { '@id': bizId }, areaServed: b.cities.map((c) => ({ '@type': 'City', name: c })) } })),
    },
  });
  graph.push({ '@type': 'WebSite', '@id': siteId, url: SITE + '/', name: b.name, inLanguage: 'fr-FR', publisher: { '@id': bizId } });
  if (route.view === 'home' || route.view === 'about') {
    graph.push({
      '@type': 'Person', '@id': personId, name: per.name, jobTitle: per.jobTitle, description: per.description,
      url: SITE + '/a-propos/', worksFor: { '@id': bizId },
      alumniOf: { '@type': 'EducationalOrganization', name: per.alumniOf },
      hasCredential: { '@type': 'EducationalOccupationalCredential', name: per.credential, credentialCategory: 'degree' },
      knowsAbout: per.knowsAbout,
    });
  }
  const pageType = route.view === 'about' ? 'AboutPage' : route.view === 'contact' ? 'ContactPage' : 'WebPage';
  const page = { '@type': pageType, '@id': url + '#webpage', url, name: route.title, description: route.description, inLanguage: 'fr-FR', isPartOf: { '@id': siteId }, about: { '@id': bizId } };
  if (route.view === 'about') page.mainEntity = { '@id': personId };
  if (route.path !== '/') page.breadcrumb = { '@id': url + '#breadcrumb' };
  graph.push(page);
  if (route.path !== '/') {
    const name = route.title.split('|')[0].trim();
    graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name, item: url },
    ] });
  }
  return '<script type="application/ld+json">\n' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2) + '\n</script>';
}

function buildPage(template, route, snaps) {
  let html = template;
  const url = SITE + route.path;
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(route.title) + '</title>');
  html = setMeta(html, /<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(route.description) + '">');
  html = setMeta(html, /<meta name="robots" content="[^"]*">/, '<meta name="robots" content="' + (route.index ? 'index, follow' : 'noindex, nofollow') + '">');
  html = setMeta(html, /<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + url + '">');
  html = setMeta(html, /<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + url + '">');
  html = setMeta(html, /<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(route.title) + '">');
  html = setMeta(html, /<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(route.description) + '">');
  html = setMeta(html, /<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="' + esc(route.title) + '">');
  html = setMeta(html, /<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="' + esc(route.description) + '">');

  // Image de fond de la page : déclarée dès le HTML (variable CSS) et préchargée, pour que le
  // navigateur la télécharge sans attendre l'exécution du JavaScript (meilleur LCP).
  const heroUrl = (IMG[route.view] && typeof IMG[route.view] === 'string') ? IMG[route.view] : '';
  html = html.replace(/<html lang="fr"[^>]*>/, heroUrl ? '<html lang="fr" style="--page-bg-url:url(\'' + heroUrl + '\')">' : '<html lang="fr">');
  html = html.replace(/<!--hero-preload-->[\s\S]*?<!--\/hero-preload-->\n?/, '');
  if (heroUrl) {
    const origin = new URL(heroUrl).origin;
    html = html.replace('</head>', '<!--hero-preload--><link rel="preconnect" href="' + origin + '"><link rel="preload" as="image" href="' + heroUrl + '" fetchpriority="high"><!--/hero-preload-->\n</head>');
  }

  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, buildJsonLd(route));

  // Vue active = celle de la route
  html = html.replace(/<div class="view( active)?" id="view-([a-z]+)"/g, (m, act, v) => '<div class="view' + (v === route.view ? ' active' : '') + '" id="view-' + v + '"');
  html = html.replace(/<(a|button) class="nav-link( mobile-link)?( active)?" data-view="([a-z]+)"/g, (m, tag, mob, act, v) => '<' + tag + ' class="nav-link' + (mob || '') + (v === route.view ? ' active' : '') + '" data-view="' + v + '"');

  // Un seul <h1> : celui de la vue de la page ; les autres deviennent <h2>
  let current = null;
  html = html.replace(/<div class="view[^"]*" id="view-([a-z]+)"|<h1\b([^>]*data-pageh1[^>]*)>([\s\S]*?)<\/h1>/g, (m, v, attrs, inner) => {
    if (v) { current = v; return m; }
    return current === route.view ? m : '<h2' + attrs + '>' + inner + '</h2>';
  });

  // Contenu pré-rendu
  for (const id of ALL_SNAP_IDS) html = setSnap(html, id, '');
  const ids = [...(SNAPS_BY_VIEW[route.view] || []), ...SNAPS_ALL];
  for (const id of ids) if (snaps[id]) html = setSnap(html, id, snaps[id]);
  return html;
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => console.warn('[page error]', e.message));
  await page.goto('http://localhost:' + port + '/index.html');
  await page.waitForTimeout(1500);

  // 1. Récupération du HTML rendu par le JavaScript, vue par vue (français)
  const snaps = {};
  const grab = async (ids) => {
    const out = await page.evaluate((list) => Object.fromEntries(list.map((id) => [id, (document.getElementById(id) || {}).innerHTML || ''])), ids);
    Object.assign(snaps, out);
  };
  await grab(['missionServicesTrack', 'ftServices']);
  await page.evaluate(() => goView('services', null, { initial: true }));
  await page.evaluate(() => { setSvcTab('devis'); });
  await page.waitForTimeout(300);
  await grab(['servicesFilters', 'servicesGrid', 'processSteps']);
  await page.evaluate(() => goView('legal', null, { initial: true }));
  await grab(['faqAccordion', 'privacyAccordion']);
  await page.evaluate(() => { goView('partners', null, { initial: true }); renderApplyBenefits(); });
  await grab(['partnersPitch', 'partnersAccordion', 'applyBenefitsAccordion']);
  await browser.close();
  srv.close();

  // 2. Génération des pages
  const template = normalize(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  for (const route of ROUTES) {
    const out = buildPage(template, route, snaps);
    const file = route.path === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, route.path, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, out);
    console.log('écrit', path.relative(ROOT, file), route.index ? '' : '(noindex)');
  }

  // 3. sitemap.xml (pages indexables uniquement)
  const today = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.filter((r) => r.index).map((r) => '  <url>\n    <loc>' + SITE + r.path + '</loc>\n    <lastmod>' + today + '</lastmod>\n  </url>').join('\n');
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n');

  // 4. 404.html
  fs.writeFileSync(path.join(ROOT, '404.html'), `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><base href="/"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page introuvable | BUNKAIO</title><meta name="robots" content="noindex, nofollow">
<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0c;color:#fff;font-family:'DM Sans',system-ui,sans-serif;text-align:center;padding:24px}
h1{font-size:clamp(28px,6vw,44px);margin:0 0 12px}p{color:rgba(255,255,255,.7);margin:0 0 24px}a{color:#fff;margin:0 10px;font-size:14px}</style></head>
<body><main><h1>Page introuvable</h1><p>Cette page n'existe pas ou a été déplacée.</p>
<a href="/">Accueil</a><a href="/services/">Prestations</a><a href="/portfolio/">Portfolio</a><a href="/devis/">Devis</a><a href="/contact/">Contact</a></main></body></html>\n`);
  console.log('sitemap.xml et 404.html écrits');
})();
