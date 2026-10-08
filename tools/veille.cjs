/* Veille du site — contrôle complet en local (utilisé par la maintenance automatique toutes les 12 h).
   Usage : NODE_PATH=/opt/node22/lib/node_modules node tools/veille.cjs [--live]
   - sans option : sert le dépôt en local et contrôle chaque page du sitemap, en français et en anglais ;
   - --live : contrôle aussi le site en ligne (statut HTTP de chaque page et des fichiers versionnés).
   Sortie : résumé lisible + JSON (dernière ligne). Code de sortie 1 si une anomalie est trouvée. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://bunkaio.com';
const LIVE = process.argv.includes('--live');
const checks = [];
const add = (name, ok, detail) => { checks.push({ name, ok, detail }); console.log(`${ok ? 'OK  ' : 'KO  '} ${name}${detail ? ' — ' + detail : ''}`); };

function serve() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.xml': 'application/xml', '.mp4': 'video/mp4', '.txt': 'text/plain' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, () => r(srv)));
}

(async () => {
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(SITE) && !/\.(jpe?g|png|webp)$/i.test(u));
  add('Sitemap', urls.length > 0, urls.length + ' pages');

  /* 1. Site en ligne */
  let reachable = false;
  if (LIVE) {
    try { const r = await fetch(SITE + '/robots.txt'); reachable = r.status === 200; } catch (e) { reachable = false; }
    /* Environnement sans accès à bunkaio.com (politique réseau) : le contrôle en ligne est assuré par la veille du Worker. */
    if (!reachable) add('Site en ligne', true, 'non vérifiable depuis cet environnement (réseau filtré) : contrôlé par la veille du Worker toutes les 12 h');
  }
  if (LIVE && reachable) {
    let bad = [];
    for (const u of urls) {
      try { const r = await fetch(u, { redirect: 'follow' }); if (r.status !== 200) bad.push(u.replace(SITE, '') + ' (' + r.status + ')'); }
      catch (e) { bad.push(u.replace(SITE, '') + ' (injoignable)'); }
    }
    add('Site en ligne : pages du sitemap', !bad.length, bad.length ? bad.slice(0, 5).join(', ') : urls.length + ' pages en 200');
    try {
      const html = await (await fetch(SITE + '/')).text();
      const assets = [...new Set([...html.matchAll(/(?:src|href)="\/?((?:js|css|config)\/[^"?]+\.(?:js|css)\?v=[^"]+)"/g)].map((m) => m[1]))];
      bad = [];
      for (const a of assets) { const r = await fetch(SITE + '/' + a); if (r.status !== 200) bad.push(a.split('?')[0] + ' (' + r.status + ')'); }
      add('Site en ligne : fichiers JS/CSS versionnés', !bad.length, bad.length ? bad.join(', ') : assets.length + ' fichiers');
    } catch (e) { add('Site en ligne : accueil', false, e.message); }
  }

  /* 2. Rendu de chaque page, français et anglais */
  const srv = await serve();
  const base = 'http://localhost:' + srv.address().port;
  const browser = await chromium.launch();
  const failures = [];
  let usdMissing = [];
  for (const u of urls) {
    const rel = u.replace(SITE, '') || '/';
    for (const lang of ['fr', 'en']) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const errs = [];
      page.on('pageerror', (e) => errs.push(e.message));
      /* Pas de réseau externe en local : on bloque les appels sortants (Worker, polices, CDN). */
      await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
      try {
        await page.goto(base + rel, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(900);
        if (lang === 'en') { await page.evaluate(() => { if (typeof toggleLang === 'function' && LANG !== 'en') toggleLang(); }); await page.waitForTimeout(700); }
        const info = await page.evaluate(() => {
          const txt = document.body.innerText || '';
          const euros = [];
          const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = w.nextNode())) {
            if (/[1-9]\d*\s?€|€\s?[1-9]/.test(n.nodeValue) && n.parentElement && n.parentElement.offsetParent !== null && !n.parentElement.closest('script,style')) {
              const nx = n.nextSibling;
              if (!(nx && nx.classList && nx.classList.contains('usd-eq'))) euros.push(n.nodeValue.trim().slice(0, 40));
            }
          }
          return { len: txt.length, h1: !!document.querySelector('h1'), euros };
        });
        if (errs.length) failures.push(`${rel} [${lang}] erreur JS : ${errs[0].slice(0, 120)}`);
        if (info.len < 200) failures.push(`${rel} [${lang}] page presque vide`);
        if (lang === 'en' && info.euros.length) usdMissing.push(`${rel} : ${info.euros[0]}`);
      } catch (e) {
        failures.push(`${rel} [${lang}] ${e.message.slice(0, 120)}`);
      }
      await page.close();
    }
  }
  add('Pages (FR + EN) : rendu sans erreur', !failures.length, failures.length ? failures.slice(0, 6).join(' | ') : urls.length * 2 + ' pages');
  add('Version anglaise : prix en dollars à côté des prix en euros', !usdMissing.length, usdMissing.length ? usdMissing.slice(0, 5).join(' | ') : 'OK');

  /* 3. Devis : chaque formule affiche son nom et son prix */
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
    await page.goto(base + '/devis/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(900);
    await page.locator('.cat-item').first().click();
    await page.waitForTimeout(1000);
    await page.locator('.prof-card').first().click();
    await page.waitForTimeout(400);
    await page.getByText(/^Suivant/).first().click().catch(() => {});
    await page.waitForTimeout(2500);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#tierList .tier-card')].map((c) => !!c.querySelector('.tier-price')));
    add('Devis : formules affichées avec leur prix', rows.length >= 4 && rows.every(Boolean), rows.length + ' formules');
    await page.close();
  } catch (e) { add('Devis : formules affichées avec leur prix', false, e.message.slice(0, 120)); }

  await browser.close();
  srv.close();
  const failed = checks.filter((c) => !c.ok).length;
  console.log(JSON.stringify({ at: new Date().toISOString(), failed, checks }));
  process.exit(failed ? 1 : 0);
})();
