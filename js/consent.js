/* ═══════════════════════════════════════════════════════════
   js/consent.js — consentement aux cookies et traceurs (maison, sans CMP tierce).
   - Lit config/consent.js (CONSENT_CONFIG). Aucun service déclaré = aucun bandeau.
   - Un service n'est chargé qu'après accord de sa catégorie ; le retrait efface ses cookies et recharge la page.
   - Google Consent Mode v2 : valeurs « refusé » par défaut, mise à jour après choix, scripts Google non chargés avant accord.
   - Choix enregistré en localStorage (bunkaio_consent : version, date, catégories), valable ttlDays jours.
   - Expose window.BKConsent { open, close, get, has, set, needsConsent, onChange }.
   La mesure d'audience maison (js/analytics.js) est anonyme et sans cookie : elle n'est pas soumise à consentement,
   son refus (opposition) est proposé dans le centre de préférences.
   ═══════════════════════════════════════════════════════════ */
(function(){
  const CFG = (typeof CONSENT_CONFIG !== 'undefined') ? CONSENT_CONFIG : { version: 1, ttlDays: 180, google: {}, meta: {}, vendors: [] };
  const KEY = 'bunkaio_consent', NOTRACK = 'bunkaio_notrack';
  const CATS = ['analytics', 'marketing', 'external'];
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'fr');

  const TXT = {
    fr: {
      title: 'Vos choix concernant les cookies',
      intro: 'BUNKAIO utilise des cookies et traceurs pour mesurer l\'audience et, si vous l\'acceptez, pour la publicité. Vous pouvez tout accepter, tout refuser ou choisir service par service. Refuser ne limite pas l\'accès au site.',
      acceptAll: 'Tout accepter', refuseAll: 'Tout refuser', custom: 'Personnaliser', save: 'Enregistrer mes choix', close: 'Fermer',
      more: 'En savoir plus', policy: 'Politique des cookies',
      panelTitle: 'Gérer mes cookies', panelIntro: 'Choisissez les catégories que vous autorisez. Vous pouvez modifier ou retirer votre choix à tout moment depuis « Gérer mes cookies » en bas de page.',
      necessary: 'Nécessaires', necessaryText: 'Indispensables au fonctionnement du site (par exemple, rester connecté à votre espace client). Toujours actifs, sans collecte à des fins de suivi.',
      analytics: 'Statistiques', marketing: 'Marketing et publicité', external: 'Contenus externes',
      none: 'Aucun service de cette catégorie n\'est utilisé sur ce site.',
      audience: 'Mesure d\'audience anonyme BUNKAIO', audienceText: 'Mesure sans cookie, hébergée par BUNKAIO : pages vues, provenance, type d\'appareil, clics sur les boutons principaux. Aucun identifiant durable, aucun partage avec un tiers. Exemptée de consentement ; vous pouvez vous y opposer ici.',
      on: 'Activée', off: 'Désactivée', provider: 'Fournisseur', purpose: 'Finalité', duration: 'Durée',
      saved: 'Vos choix sont enregistrés.',
      ga4: 'Google Analytics 4', ga4p: 'Google Ireland Ltd (transferts possibles vers Google LLC, États-Unis)', ga4f: 'Mesure d\'audience détaillée du site.', ga4d: 'Jusqu\'à 13 mois',
      ads: 'Google Ads', adsp: 'Google Ireland Ltd (transferts possibles vers Google LLC, États-Unis)', adsf: 'Mesure des conversions des publicités Google.', adsd: 'Jusqu\'à 13 mois',
      meta: 'Meta Pixel', metap: 'Meta Platforms Ireland Ltd (transferts possibles vers les États-Unis)', metaf: 'Mesure des conversions des publicités Facebook et Instagram.', metad: '3 mois (cookies _fbp / _fbc)',
    },
    en: {
      title: 'Your cookie choices',
      intro: 'BUNKAIO uses cookies and trackers to measure audience and, if you agree, for advertising. You can accept all, refuse all or choose service by service. Refusing does not limit access to the site.',
      acceptAll: 'Accept all', refuseAll: 'Refuse all', custom: 'Customise', save: 'Save my choices', close: 'Close',
      more: 'Learn more', policy: 'Cookie policy',
      panelTitle: 'Manage my cookies', panelIntro: 'Choose the categories you allow. You can change or withdraw your choice at any time from “Manage my cookies” at the bottom of the page.',
      necessary: 'Necessary', necessaryText: 'Required for the site to work (for example, staying signed in to your client area). Always on, no tracking collection.',
      analytics: 'Statistics', marketing: 'Marketing and advertising', external: 'External content',
      none: 'No service in this category is used on this site.',
      audience: 'BUNKAIO anonymous audience measurement', audienceText: 'Cookie-free measurement hosted by BUNKAIO: page views, referrer, device type, clicks on main buttons. No lasting identifier, no sharing with third parties. Exempt from consent; you can opt out here.',
      on: 'On', off: 'Off', provider: 'Provider', purpose: 'Purpose', duration: 'Duration',
      saved: 'Your choices are saved.',
      ga4: 'Google Analytics 4', ga4p: 'Google Ireland Ltd (possible transfers to Google LLC, United States)', ga4f: 'Detailed audience measurement of the site.', ga4d: 'Up to 13 months',
      ads: 'Google Ads', adsp: 'Google Ireland Ltd (possible transfers to Google LLC, United States)', adsf: 'Conversion measurement for Google ads.', adsd: 'Up to 13 months',
      meta: 'Meta Pixel', metap: 'Meta Platforms Ireland Ltd (possible transfers to the United States)', metaf: 'Conversion measurement for Facebook and Instagram ads.', metad: '3 months (_fbp / _fbc cookies)',
    },
  };
  const T = (k) => (TXT[lang()] || TXT.fr)[k] || TXT.fr[k] || k;

  /* ── Services déclarés ── */
  const G = CFG.google || {}, M = CFG.meta || {};
  const googleIds = [G.ga4, G.ads].filter(Boolean);
  const builtin = [];
  if (G.ga4) builtin.push({ id: 'ga4', category: 'analytics', t: 'ga4', cookies: ['^_ga'], google: true });
  if (G.ads) builtin.push({ id: 'gads', category: 'marketing', t: 'ads', cookies: ['^_gcl', '^_gac', '^IDE$', '^test_cookie$'], google: true });
  if (M.pixel) builtin.push({ id: 'meta', category: 'marketing', t: 'meta', cookies: ['^_fbp$', '^_fbc$', '^fr$'], meta: true });
  const vendors = builtin.concat((CFG.vendors || []).filter((v) => v && CATS.includes(v.category)));
  const needsConsent = () => vendors.length > 0;
  const vName = (v) => (v.t ? T(v.t) : v.name);
  const vProv = (v) => (v.t ? T(v.t + 'p') : v.provider || '');
  const vPurp = (v) => (v.t ? T(v.t + 'f') : v.purpose || '');
  const vDur = (v) => (v.t ? T(v.t + 'd') : v.duration || '');
  window.__bkConsentVendors = () => vendors.map((v) => ({ id: v.id, category: v.category, name: vName(v), provider: vProv(v), purpose: vPurp(v), duration: vDur(v) }));

  /* ── Choix enregistré ── */
  let state = readState();
  const listeners = [];
  function readState(){
    try {
      const o = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!o || o.v !== CFG.version || !o.ts || Date.now() - o.ts > (CFG.ttlDays || 180) * 864e5) return null;
      return o;
    } catch (e) { return null; }
  }
  function writeState(c){
    state = { v: CFG.version, ts: Date.now(), analytics: !!c.analytics, marketing: !!c.marketing, external: !!c.external };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  const has = (cat) => !!(state && state[cat]);

  /* ── Google Consent Mode v2 : valeurs par défaut « refusé », avant tout script Google ── */
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  const hasGoogle = vendors.some((v) => v.google);
  if (hasGoogle) {
    window.gtag = window.gtag || gtag;
    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', wait_for_update: 500 });
    gtag('set', 'ads_data_redaction', true);
    gtag('set', 'url_passthrough', false);
  }
  const consentSignals = () => ({
    analytics_storage: has('analytics') ? 'granted' : 'denied',
    ad_storage: has('marketing') ? 'granted' : 'denied',
    ad_user_data: has('marketing') ? 'granted' : 'denied',
    ad_personalization: has('marketing') ? 'granted' : 'denied',
  });

  /* ── Chargement conditionnel ── */
  const loaded = {};
  function addScript(src){ const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); return s; }
  function loadVendors(){
    if (hasGoogle) {
      const anyGoogle = vendors.some((v) => v.google && has(v.category));
      if (anyGoogle) {
        gtag('consent', 'update', consentSignals());
        if (!loaded.gtag) {
          loaded.gtag = true;
          gtag('js', new Date());
          addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(googleIds[0]));
        }
        if (G.ga4 && has('analytics') && !loaded.ga4) { loaded.ga4 = true; gtag('config', G.ga4); }
        if (G.ads && has('marketing') && !loaded.gads) { loaded.gads = true; gtag('config', G.ads); }
      }
    }
    if (M.pixel && has('marketing') && !loaded.meta) {
      loaded.meta = true;
      /* Chargeur Meta standard : n'est exécuté qu'après accord. */
      (function(f, b, e, v){ if (f.fbq) return; const n = f.fbq = function(){ n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []; const t = b.createElement(e); t.async = true; t.src = v; b.head.appendChild(t); })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', M.pixel); window.fbq('track', 'PageView');
    }
    (CFG.vendors || []).forEach((v) => { if (v && v.src && CATS.includes(v.category) && has(v.category) && !loaded['v:' + v.id]) { loaded['v:' + v.id] = true; addScript(v.src); } });
  }

  /* ── Effacement des cookies d'un service dont le consentement est retiré ── */
  function purgeCookies(cats){
    const pats = [];
    vendors.forEach((v) => { if (cats.includes(v.category)) (v.cookies || []).forEach((p) => pats.push(new RegExp(p))); });
    const host = location.hostname, parts = host.split('.');
    const domains = ['', host, '.' + host]; if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach((c) => {
      const name = c.split('=')[0].trim();
      if (pats.some((r) => r.test(name))) domains.forEach((d) => { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : ''); });
    });
  }

  /* ── Enregistrement d'un choix ── */
  function set(choice){
    const before = state ? { analytics: !!state.analytics, marketing: !!state.marketing, external: !!state.external } : { analytics: false, marketing: false, external: false };
    writeState(choice || {});
    const revoked = CATS.filter((c) => before[c] && !state[c]);
    const wasLoaded = Object.keys(loaded).length > 0;
    if (revoked.length) { purgeCookies(revoked); if (hasGoogle) gtag('consent', 'update', consentSignals()); }
    listeners.forEach((fn) => { try { fn(Object.assign({}, state)); } catch (e) {} });
    closeBanner();
    if (revoked.length && wasLoaded) { location.reload(); return; }
    loadVendors();
  }

  /* ── Interface ── */
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let banner = null, panel = null, lastFocus = null;
  const policyHref = () => '/politique-cookies/';
  const btn = (label, action) => { const b = el('button', 'bkc-btn', esc(label)); b.type = 'button'; b.setAttribute('data-bkc', action); return b; };

  function closeBanner(){ if (banner) { banner.remove(); banner = null; } }
  function showBanner(){
    if (banner || !needsConsent() || state) return;
    banner = el('div', 'bkc-banner');
    banner.setAttribute('role', 'dialog'); banner.setAttribute('aria-label', T('title'));
    banner.innerHTML = '<div class="bkc-text"><strong>' + esc(T('title')) + '</strong><p>' + esc(T('intro')) + ' <a href="' + policyHref() + '" data-nav="legal:cookies">' + esc(T('more')) + '</a></p></div>';
    const row = el('div', 'bkc-row');
    row.appendChild(btn(T('refuseAll'), 'refuse')); row.appendChild(btn(T('custom'), 'custom')); row.appendChild(btn(T('acceptAll'), 'accept'));
    banner.appendChild(row);
    document.body.appendChild(banner);
  }

  function audienceOn(){ try { return localStorage.getItem(NOTRACK) !== '1'; } catch (e) { return true; } }
  function setAudience(on){ try { on ? localStorage.removeItem(NOTRACK) : localStorage.setItem(NOTRACK, '1'); } catch (e) {} const s = document.getElementById('trackToggleState'); if (s) s.textContent = on ? (lang() === 'en' ? 'Measurement is on' : 'Mesure activée') : (lang() === 'en' ? 'Measurement is off' : 'Mesure désactivée'); }

  function sw(id, checked, disabled, label){
    return '<label class="bkc-sw"><input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '><span class="bkc-track" aria-hidden="true"></span><span class="bkc-sw-l">' + esc(label) + '</span></label>';
  }
  function openPanel(){
    if (panel) return false;
    lastFocus = document.activeElement;
    closeBanner();
    panel = el('div', 'bkc-overlay');
    const box = el('div', 'bkc-panel'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', T('panelTitle'));
    let h = '<h2>' + esc(T('panelTitle')) + '</h2><p class="bkc-lead">' + esc(T('panelIntro')) + '</p>';
    h += '<section class="bkc-cat"><div class="bkc-cat-h"><h3>' + esc(T('necessary')) + '</h3>' + sw('bkcNec', true, true, T('on')) + '</div><p>' + esc(T('necessaryText')) + '</p></section>';
    h += '<section class="bkc-cat"><div class="bkc-cat-h"><h3>' + esc(T('audience')) + '</h3>' + sw('bkcAud', audienceOn(), false, '') + '</div><p>' + esc(T('audienceText')) + '</p></section>';
    CATS.forEach((c) => {
      const list = vendors.filter((v) => v.category === c);
      h += '<section class="bkc-cat"><div class="bkc-cat-h"><h3>' + esc(T(c)) + '</h3>' + (list.length ? sw('bkc-' + c, has(c), false, '') : '') + '</div>';
      if (!list.length) h += '<p>' + esc(T('none')) + '</p>';
      else h += '<ul class="bkc-v">' + list.map((v) => '<li><b>' + esc(vName(v)) + '</b><span>' + esc(T('provider')) + ' : ' + esc(vProv(v)) + '</span><span>' + esc(T('purpose')) + ' : ' + esc(vPurp(v)) + '</span><span>' + esc(T('duration')) + ' : ' + esc(vDur(v)) + '</span></li>').join('') + '</ul>';
      h += '</section>';
    });
    h += '<p class="bkc-pol"><a href="' + policyHref() + '" data-nav="legal:cookies">' + esc(T('policy')) + '</a></p>';
    box.innerHTML = h;
    const row = el('div', 'bkc-row');
    row.appendChild(btn(T('refuseAll'), 'p-refuse')); row.appendChild(btn(T('save'), 'p-save')); row.appendChild(btn(T('acceptAll'), 'p-accept'));
    box.appendChild(row);
    const x = el('button', 'bkc-x', '×'); x.type = 'button'; x.setAttribute('aria-label', T('close')); x.setAttribute('data-bkc', 'p-close'); box.appendChild(x);
    panel.appendChild(box); document.body.appendChild(panel);
    const first = box.querySelector('.bkc-btn'); if (first) first.focus();
    return false;
  }
  function closePanel(){ if (panel) { panel.remove(); panel = null; } if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} } showBanner(); }
  function readPanel(all){
    const g = (c) => { const i = document.getElementById('bkc-' + c); return all === true ? true : all === false ? false : !!(i && i.checked); };
    const aud = document.getElementById('bkcAud');
    setAudience(all === true ? true : all === false ? false : !!(aud && aud.checked));
    return { analytics: g('analytics') && needed('analytics'), marketing: g('marketing') && needed('marketing'), external: g('external') && needed('external') };
  }
  const needed = (c) => vendors.some((v) => v.category === c);

  document.addEventListener('click', (e) => {
    const b = e.target.closest ? e.target.closest('[data-bkc]') : null;
    if (b) {
      const a = b.getAttribute('data-bkc');
      if (a === 'accept') set({ analytics: needed('analytics'), marketing: needed('marketing'), external: needed('external') });
      else if (a === 'refuse') set({});
      else if (a === 'custom') openPanel();
      else if (a === 'p-accept') { const c = { analytics: needed('analytics'), marketing: needed('marketing'), external: needed('external') }; setAudience(true); closePanel0(); set(c); }
      else if (a === 'p-refuse') { setAudience(false); closePanel0(); set({}); }
      else if (a === 'p-save') { const c = readPanel(); closePanel0(); set(c); }
      else if (a === 'p-close') closePanel();
      return;
    }
    if (panel && e.target === panel) { closePanel(); return; }
    const lk = e.target.closest ? e.target.closest('.bkc-panel a[data-nav], .bkc-banner a[data-nav]') : null;
    if (lk && panel) closePanel0();
  });
  function closePanel0(){ if (panel) { panel.remove(); panel = null; } }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel) closePanel(); });

  window.BKConsent = {
    open: openPanel, close: closePanel, set, has,
    get: () => (state ? Object.assign({}, state) : null),
    needsConsent,
    vendors: () => window.__bkConsentVendors(),
    onChange: (fn) => { if (typeof fn === 'function') listeners.push(fn); },
  };

  /* ── Démarrage ── */
  loadVendors();
  const start = () => showBanner();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
