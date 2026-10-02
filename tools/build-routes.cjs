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
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://bunkaio.com';
const ARTICLES = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config/articles.js'), 'utf8') + ';ARTICLES', {});
const ROUTES = vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'config/articles.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'config/routes.js'), 'utf8') + ';SEO_ROUTES', {});

/* Conteneurs remplis par le JavaScript, à pré-rendre dans le HTML. */
const SNAPS_BY_VIEW = {
  home: ['missionServicesTrack', 'adviceTeaser', 'catShowcaseTrack', 'csSlotHome'],
  quiz: ['catList', 'csSlotQuiz'],
  portfolio: ['pfTabs', 'pfLinks'],
  services: ['servicesFilters', 'servicesGrid', 'svcLinks', 'processSteps', 'csSlotServices'],
  legal: ['faqAccordion', 'privacyAccordion'],
  partners: ['partnersPitch', 'partnersAccordion', 'applyBenefitsAccordion'],
  service: ['servicePageContent'],
  advice: ['advicePageContent'],
  article: ['articlePageContent'],
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
/* Les éléments traduits (data-lang) portent dans le HTML un texte de secours : on le remplace par le
   français actuellement affiché (I18N.fr), pour que le HTML brut et la page rendue disent la même chose. */
let I18N_FR = {};
function syncDataLang(html) {
  const VOID = new Set(['br', 'img', 'input', 'hr', 'meta', 'link', 'source']);
  const start = /<([a-z][a-z0-9]*)\b[^>]*\sdata-lang="([^"]+)"[^>]*>/gi;
  let out = '', last = 0, m;
  while ((m = start.exec(html))) {
    const tag = m[1].toLowerCase(), key = m[2];
    if (VOID.has(tag) || typeof I18N_FR[key] !== 'string' || m.index < last) continue;
    const open = new RegExp('<' + tag + '\\b[^>]*>|</' + tag + '>', 'gi');
    open.lastIndex = m.index + m[0].length;
    let depth = 1, end = -1, t;
    while ((t = open.exec(html))) {
      if (t[0][1] === '/') { depth--; if (!depth) { end = t.index; break; } } else if (!/\/>$/.test(t[0])) depth++;
    }
    if (end < 0) continue;
    out += html.slice(last, m.index + m[0].length) + I18N_FR[key];
    last = end;
    start.lastIndex = end;
  }
  return out + html.slice(last);
}
const OG_FONT_B64 = fs.readFileSync(path.join(ROOT, 'fonts/dm-sans-latin-opsz-normal.woff2')).toString('base64');
function ogCard(kicker, title) {
  const safe = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'DM Sans';src:url('data:font/woff2;base64,${OG_FONT_B64}') format('woff2');font-weight:100 1000}
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;background:radial-gradient(ellipse 80% 70% at 85% 0%,#3a2d55 0%,transparent 60%),linear-gradient(160deg,#241c32 0%,#0d0b12 55%,#000 100%);color:#fff;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;justify-content:space-between;padding:70px 80px}
.top{display:flex;align-items:baseline;gap:20px}.word{font-size:46px;font-weight:700;letter-spacing:.14em}.kick{font-size:20px;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.7);font-weight:600}
h1{font-size:${title.length > 60 ? 58 : title.length > 40 ? 68 : 80}px;line-height:1.08;letter-spacing:-.03em;font-weight:700;max-width:1000px}
.bar{display:flex;justify-content:space-between;align-items:flex-end;border-top:1px solid rgba(255,255,255,.25);padding-top:26px;font-size:24px;color:rgba(255,255,255,.85)}.bar b{font-weight:700;letter-spacing:.08em}
</style></head><body><div class="top"><div class="word">BUNKAIO</div><div class="kick">${safe(kicker)}</div></div><h1>${safe(title)}</h1>
<div class="bar"><span>Photographe professionnel · Béziers · Montpellier · Toulouse</span><b>bunkaio.com</b></div></body></html>`;
}
function esc(v) { return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function setMeta(html, re, replacement) { return re.test(html) ? html.replace(re, replacement) : html; }

/* Données structurées (JSON-LD) : un @graph par page, construit uniquement à partir de
   config/entity.json et des routes — aucune donnée inventée (pas d'avis, pas de note). */
function buildJsonLd(route, meta, snaps) {
  const b = ENTITY.brand, per = ENTITY.person;
  const bizId = SITE + '/#business', siteId = SITE + '/#website', personId = SITE + '/a-propos/#aya';
  const url = SITE + route.path;
  const graph = [];
  const hasPerson = route.view === 'home' || route.view === 'about';
  graph.push({
    '@type': 'ProfessionalService', '@id': bizId,
    name: b.name, alternateName: b.alternateName, url: SITE + '/',
    logo: b.logo, image: b.logo, description: b.description,
    telephone: b.telephone, email: b.email, priceRange: b.priceRange, sameAs: b.sameAs,
    identifier: { '@type': 'PropertyValue', propertyID: 'SIRET', value: b.siret },
    address: { '@type': 'PostalAddress', addressLocality: b.baseCity, addressRegion: b.region, addressCountry: 'FR' },
    areaServed: [...b.cities.map((c) => ({ '@type': 'City', name: c })), { '@type': 'AdministrativeArea', name: b.region }],
    knowsAbout: per.knowsAbout,
    ...(b.openingHours ? { openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: b.openingHours.days, opens: b.openingHours.opens, closes: b.openingHours.closes } } : {}),
    ...(hasPerson ? { employee: { '@id': personId } } : {}),
    hasOfferCatalog: {
      '@type': 'OfferCatalog', name: 'Prestations de photographie',
      itemListElement: b.services.map((sv) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: sv.name, description: sv.description, url: SITE + sv.path, provider: { '@id': bizId }, areaServed: b.cities.map((c) => ({ '@type': 'City', name: c })) } })),
    },
  });
  graph.push({ '@type': 'WebSite', '@id': siteId, url: SITE + '/', name: b.name, alternateName: b.siteAlternateNames, inLanguage: 'fr-FR', publisher: { '@id': bizId } });
  if (hasPerson) {
    graph.push({
      '@type': 'Person', '@id': personId, name: per.name, jobTitle: per.jobTitle, description: per.description,
      url: SITE + '/a-propos/', worksFor: { '@id': bizId },
      alumniOf: { '@type': 'EducationalOrganization', name: per.alumniOf },
      hasCredential: { '@type': 'EducationalOccupationalCredential', name: per.credential, credentialCategory: 'degree' },
      knowsAbout: per.knowsAbout,
      ...(per.photo ? { image: { '@id': SITE + '/a-propos/#portrait' } } : {}),
    });
    if (per.photo) graph.push({ '@type': 'ImageObject', '@id': SITE + '/a-propos/#portrait', url: SITE + per.photo.path, contentUrl: SITE + per.photo.path, width: per.photo.width, height: per.photo.height, caption: per.photo.caption, creditText: b.name, copyrightNotice: '© ' + b.name, creator: { '@id': personId } });
  }
  /* Image principale : photo de la prestation (si configurée dans config/media.js) ou carte de partage de l'article. */
  const fig = route.cat && snaps && snaps.servicePageContent && snaps.servicePageContent.match(/<figure class="svcp-figure[^"]*"><img src="([^"]+)" alt="([^"]*)"/);
  const unesc = (x) => x.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const imgMeta = { creator: { '@type': 'Organization', name: b.name }, creditText: b.name, copyrightNotice: '© ' + b.name, acquireLicensePage: undefined };
  delete imgMeta.acquireLicensePage;
  if (fig) graph.push({ '@type': 'ImageObject', '@id': url + '#primaryimage', url: fig[1], contentUrl: fig[1], caption: unesc(fig[2]), ...imgMeta });
  if (route.cat && meta) {
    const priced = meta.tiers.filter((t) => !t.quote && t.price);
    graph.push({
      '@type': 'Service', '@id': url + '#service', name: route.h1 || meta.name, serviceType: meta.name,
      description: route.description, provider: { '@id': bizId },
      areaServed: b.cities.map((c) => ({ '@type': 'City', name: c })),
      ...(fig ? { image: { '@id': url + '#primaryimage' } } : {}),
      offers: { '@type': 'AggregateOffer', priceCurrency: 'EUR', lowPrice: Math.min(...priced.map((t) => t.price)), highPrice: Math.max(...priced.map((t) => t.price)), offerCount: meta.tiers.length },
    });
  }
  const art = route.slug ? ARTICLES.find((x) => x.slug === route.slug) : null;
  if (art) {
    graph.push({
      '@type': 'Article', '@id': url + '#article', headline: art.h1, description: art.description,
      datePublished: art.date, dateModified: art.date, inLanguage: 'fr-FR',
      author: { '@id': bizId }, publisher: { '@id': bizId }, mainEntityOfPage: { '@id': url + '#webpage' },
      image: { '@id': url + '#primaryimage' }, articleSection: 'Conseils photo',
    });
    const artImg = SITE + (route.ogImage || '/images/og-default.jpg');
    graph.push({ '@type': 'ImageObject', '@id': url + '#primaryimage', url: artImg, contentUrl: artImg, width: 1200, height: 630, caption: art.h1 + ' — ' + b.name, ...imgMeta });
  }
  if (route.view === 'advice') {
    graph.push({ '@type': 'ItemList', '@id': url + '#list', itemListElement: ARTICLES.map((x, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/conseils/' + x.slug + '/', name: x.h1 })) });
  }
  const pageType = route.view === 'about' ? 'AboutPage' : route.view === 'contact' ? 'ContactPage' : route.view === 'advice' ? 'CollectionPage' : 'WebPage';
  const page = { '@type': pageType, '@id': url + '#webpage', url, name: route.title, description: route.description, inLanguage: 'fr-FR', isPartOf: { '@id': siteId }, about: { '@id': bizId } };
  if (route.view === 'about') page.mainEntity = { '@id': personId };
  if (route.cat) page.mainEntity = { '@id': url + '#service' };
  if (route.view === 'about' && per.photo) page.primaryImageOfPage = { '@id': SITE + '/a-propos/#portrait' };
  if (fig || art) page.primaryImageOfPage = { '@id': url + '#primaryimage' };
  if (art) page.mainEntity = { '@id': url + '#article' };
  if (route.view === 'advice') page.mainEntity = { '@id': url + '#list' };
  if (route.path !== '/') page.breadcrumb = { '@id': url + '#breadcrumb' };
  graph.push(page);
  if (route.path !== '/') {
    const name = route.cat && meta ? meta.name : route.slug && art ? art.h1 : route.view === 'advice' ? 'Conseils photo' : route.title.split('|')[0].trim();
    const crumbs = [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' }];
    if (route.cat) crumbs.push({ '@type': 'ListItem', position: 2, name: 'Services', item: SITE + '/services/' });
    if (route.slug) crumbs.push({ '@type': 'ListItem', position: 2, name: 'Conseils photo', item: SITE + '/conseils/' });
    crumbs.push({ '@type': 'ListItem', position: crumbs.length + 1, name, item: url });
    graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: crumbs });
  }
  return '<script type="application/ld+json">\n' + JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2) + '\n</script>';
}

/* Images du HTML statique : pas de src vide (le JS les renseigne au chargement), pas d'état « image cassée » figé par le pré-rendu. */
function fixStaticImages(html) {
  const swap = (id, attrs) => { html = html.replace(new RegExp('<img[^>]*id="' + id + '"[^>]*>'), (tag) => tag.replace(' src=""', attrs ? ' src="' + attrs.src + '"' + (attrs.dims || '') : '')); };
  swap('img-devis-side', IMG.devis ? { src: IMG.devis, dims: ' width="900" height="700"' } : null);
  swap('img-collab-side', IMG.collab ? { src: IMG.collab } : null);
  swap('svcCatPhotoImg', null);
  return html.replace(/(class="svcp-figure) is-broken"/g, '$1"');
}
function buildPage(template, route, snaps, meta) {
  let html = template;
  const url = SITE + route.path;
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(route.title) + '</title>');
  html = setMeta(html, /<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(route.description) + '">');
  html = setMeta(html, /<meta name="robots" content="[^"]*">/, '<meta name="robots" content="' + (route.index ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, nofollow') + '">');
  const ogImg = SITE + (route.ogImage || '/images/og-default.jpg');
  html = setMeta(html, /<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="' + ogImg + '">');
  html = setMeta(html, /<meta name="twitter:image" content="[^"]*">/, '<meta name="twitter:image" content="' + ogImg + '">');
  html = setMeta(html, /<meta property="og:image:alt" content="[^"]*">/, '<meta property="og:image:alt" content="' + esc(route.h1 || route.title.split('|')[0].trim()) + ' — BUNKAIO">');
  html = setMeta(html, /<meta name="twitter:image:alt" content="[^"]*">/, '<meta name="twitter:image:alt" content="' + esc(route.h1 || route.title.split('|')[0].trim()) + ' — BUNKAIO">');
  html = fixStaticImages(html);
  html = syncDataLang(html);
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

  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, buildJsonLd(route, meta, snaps));

  if (route.slug) {
    const art = ARTICLES.find((x) => x.slug === route.slug);
    html = html.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">\n<meta property="article:published_time" content="' + (art ? art.date : '') + '">');
  }

  // Vue active = celle de la route
  html = html.replace(/<div class="view( active)?" id="view-([a-z]+)"/g, (m, act, v) => '<div class="view' + (v === route.view ? ' active' : '') + '" id="view-' + v + '"');
  html = html.replace(/<(a|button) class="nav-link( mobile-link)?( active)?" data-view="([a-z]+)"/g, (m, tag, mob, act, v) => '<' + tag + ' class="nav-link' + (mob || '') + (v === (route.view === 'service' ? 'services' : route.view) ? ' active' : '') + '" data-view="' + v + '"');

  // Un seul <h1> : celui de la vue de la page ; les autres deviennent <h2>
  let current = null, keptH1 = false;
  html = html.replace(/<div class="view[^"]*" id="view-([a-z]+)"|<h1\b([^>]*data-pageh1[^>]*)>([\s\S]*?)<\/h1>/g, (m, v, attrs, inner) => {
    if (v) { current = v; return m; }
    if (current === route.view && !keptH1) { keptH1 = true; return m; }
    return '<h2' + attrs + '>' + inner + '</h2>';
  });

  // Contenu pré-rendu
  for (const id of ALL_SNAP_IDS) html = setSnap(html, id, '');
  let ids = [...(SNAPS_BY_VIEW[route.view] || []), ...SNAPS_ALL];
  if (route.view === 'legal') {
    const privacy = route.sub === 'privacy';
    ids = ids.filter((id) => id !== (privacy ? 'faqAccordion' : 'privacyAccordion'));
    html = html.replace(/<div id="lsec-faq"[^>]*>/, '<div id="lsec-faq"' + (privacy ? ' style="display:none"' : '') + '>');
    html = html.replace(/<div id="lsec-privacy"[^>]*>/, '<div id="lsec-privacy"' + (privacy ? '' : ' style="display:none"') + '>');
    html = html.replace(/id="legaltab-faq"/, 'id="legaltab-faq"').replace(/class="svc-tab( active)?" id="legaltab-(faq|privacy)"/g, (m0, a, t) => 'class="svc-tab' + ((t === 'privacy') === privacy ? ' active' : '') + '" id="legaltab-' + t + '"');
    if (privacy) html = html.replace(/(data-pageh1[^>]*data-lang=")legal-title(">)[^<]*/, '$1legal-title-privacy$2' + I18N_FR['legal-title-privacy']);
  }
  for (const id of ids) if (snaps[id]) html = setSnap(html, id, snaps[id]);
  return html;
}

/* Minification (esbuild, dispo dans server/node_modules) : les pages chargent css/style.min.css et
   js/script.min.js ; les sources lisibles restent css/style.css et js/script.js. La version dans l'URL
   (?v=) est l'empreinte du fichier : le cache se renouvelle tout seul à chaque changement. */
function minifyAssets() {
  const esbuild = require(path.join(ROOT, 'server/node_modules/esbuild'));
  esbuild.buildSync({ entryPoints: [path.join(ROOT, 'css/style.css')], minify: true, outfile: path.join(ROOT, 'css/style.min.css'), logLevel: 'error' });
  esbuild.buildSync({ entryPoints: [path.join(ROOT, 'js/script.js')], minify: true, outfile: path.join(ROOT, 'js/script.min.js'), logLevel: 'error' });
}
const hash8 = (file) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, file))).digest('hex').slice(0, 8);
function pinAssets(html) {
  const files = { 'css/style.min.css': 'css/style\\.(?:min\\.)?css', 'js/script.min.js': 'js/script\\.(?:min\\.)?js', 'js/analytics.js': 'js/analytics\\.js', 'config/analytics.js': 'config/analytics\\.js', 'config/articles.js': 'config/articles\\.js', 'config/routes.js': 'config/routes\\.js', 'config/media.js': 'config/media\\.js' };
  for (const [file, pattern] of Object.entries(files)) {
    html = html.replace(new RegExp('(?:' + pattern + ')\\?v=[^"\']*', 'g'), file + '?v=' + hash8(file));
  }
  return html;
}

(async () => {
  minifyAssets();
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('pageerror', (e) => console.warn('[page error]', e.message));
  await page.goto('http://localhost:' + port + '/index.html');
  await page.waitForTimeout(1500);

  // 1. Récupération du HTML rendu par le JavaScript, vue par vue (français)
  const snaps = {};
  I18N_FR = await page.evaluate(() => I18N.fr);
  const srvPort = port;
  const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  const grab = async (ids) => {
    const out = await page.evaluate((list) => Object.fromEntries(list.map((id) => [id, (document.getElementById(id) || {}).innerHTML || ''])), ids);
    Object.assign(snaps, out);
  };
  await grab(['missionServicesTrack', 'ftServices', 'catShowcaseTrack', 'csSlotHome', 'csSlotServices', 'csSlotQuiz']);
  await page.evaluate(() => goView('services', null, { initial: true }));
  await page.evaluate(() => { setSvcTab('devis'); });
  await page.waitForTimeout(300);
  await grab(['servicesFilters', 'servicesGrid', 'svcLinks', 'processSteps']);
  await page.evaluate(() => goView('legal', null, { initial: true }));
  await grab(['faqAccordion', 'privacyAccordion']);
  await page.evaluate(() => goView('portfolio', null, { initial: true }));
  await page.waitForTimeout(400);
  await grab(['pfTabs', 'pfLinks']);
  await page.evaluate(() => goView('quiz', null, { initial: true }));
  await grab(['catList']);
  await page.evaluate(() => { goView('partners', null, { initial: true }); renderApplyBenefits(); });
  await grab(['partnersPitch', 'partnersAccordion', 'applyBenefitsAccordion']);
  // Pages de prestation : contenu rendu + données pour le JSON-LD
  const serviceSnaps = {}, serviceMeta = {};
  for (const r of ROUTES.filter((x) => x.view === 'service')) {
    await page.evaluate((c) => goView('service', c, { initial: true }), r.cat);
    serviceSnaps[r.cat] = await page.evaluate(() => document.getElementById('servicePageContent').innerHTML);
    serviceMeta[r.cat] = await page.evaluate((c) => {
      const cat = CATS.find((x) => x.id === c);
      const tiers = cat.lumen ? LUMEN_TIERS.map((t) => ({ name: t.name.fr, price: t.price, quote: t.id === 'surm' })) : TIERS.map((t) => ({ name: t.name.fr, price: cat.tiers[t.id].price }));
      return { name: cat.name.fr, tiers };
    }, r.cat);
  }
  const articleSnaps = {};
  await page.evaluate(() => goView('advice', null, { initial: true }));
  await grab(['advicePageContent']);
  for (const r of ROUTES.filter((x) => x.view === 'article')) {
    await page.evaluate((sl) => goView('article', sl, { initial: true }), r.slug);
    articleSnaps[r.slug] = await page.evaluate(() => document.getElementById('articlePageContent').innerHTML);
  }
  await page.evaluate(() => goView('home', null, { initial: true }));
  await grab(['adviceTeaser']);
  // 1 bis. Image de partage 1200×630 par page (cache par contenu dans tools/og-cache.json)
  const ogCacheFile = path.join(ROOT, 'tools/og-cache.json');
  const ogCache = fs.existsSync(ogCacheFile) ? JSON.parse(fs.readFileSync(ogCacheFile, 'utf8')) : {};
  fs.mkdirSync(path.join(ROOT, 'images/og'), { recursive: true });
  for (const r of ROUTES.filter((x) => x.index && x.path !== '/')) {
    const name = r.path.replace(/^\/|\/$/g, '').replace(/\//g, '-');
    const kicker = r.view === 'article' ? 'Conseils photo' : r.view === 'service' ? 'Prestation' : 'BUNKAIO';
    const title = r.h1 || r.title.split('|')[0].trim();
    const key = crypto.createHash('sha1').update(kicker + '|' + title).digest('hex');
    const rel = 'images/og/' + name + '.jpg';
    r.ogImage = '/' + rel;
    if (ogCache[name] === key && fs.existsSync(path.join(ROOT, rel))) continue;
    await ogPage.setContent(ogCard(kicker, title));
    await ogPage.waitForTimeout(250);
    await ogPage.screenshot({ path: path.join(ROOT, rel), type: 'jpeg', quality: 84 });
    ogCache[name] = key;
  }
  fs.writeFileSync(ogCacheFile, JSON.stringify(ogCache, null, 2) + '\n');

  await browser.close();
  srv.close();

  // 2. Génération des pages
  const template = normalize(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  for (const route of ROUTES) {
    const sn = route.cat ? { ...snaps, servicePageContent: serviceSnaps[route.cat] } : route.slug ? { ...snaps, articlePageContent: articleSnaps[route.slug] } : snaps;
    const out = pinAssets(buildPage(template, route, sn, serviceMeta[route.cat]));
    const file = route.path === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, route.path, 'index.html');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, out);
    console.log('écrit', path.relative(ROOT, file), route.index ? '' : '(noindex)');
  }

  // 3. sitemap.xml (pages indexables uniquement) — lastmod = date du dernier changement réel du
  // contenu de la page (empreinte hors versions de fichiers), conservée dans tools/lastmod.json.
  const today = new Date().toISOString().slice(0, 10);
  const lmFile = path.join(ROOT, 'tools/lastmod.json');
  const lm = fs.existsSync(lmFile) ? JSON.parse(fs.readFileSync(lmFile, 'utf8')) : {};
  for (const route of ROUTES) {
    const file = route.path === '/' ? path.join(ROOT, 'index.html') : path.join(ROOT, route.path, 'index.html');
    const content = fs.readFileSync(file, 'utf8').replace(/\?v=[0-9a-f]{8}/g, '');
    const h = crypto.createHash('sha1').update(content).digest('hex');
    if (!lm[route.path] || lm[route.path].hash !== h) lm[route.path] = { hash: h, date: today };
  }
  fs.writeFileSync(lmFile, JSON.stringify(lm, null, 2) + '\n');
  const urls = ROUTES.filter((r) => r.index).map((r) => '  <url>\n    <loc>' + SITE + r.path + '</loc>\n    <lastmod>' + lm[r.path].date + '</lastmod>\n  </url>').join('\n');
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
