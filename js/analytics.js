/* ═══════════════════════════════════════════════════════════
   js/analytics.js — mesure d'audience anonyme (sans cookie).
   Expose window.track(nom, propriété?) et gère les clics suivis.
   Désactivée si : navigateur en « Ne pas me suivre » (DNT / GPC), visiteur
   ayant choisi de ne pas être mesuré, ou domaine hors config (ex. local).
   Pour vous exclure vous-même : ouvrez  https://bunkaio.com/?notrack=1  une fois
   sur chaque appareil (réactiver : ?track=1).
   ═══════════════════════════════════════════════════════════ */
(function(){
  const CFG = (typeof ANALYTICS_CONFIG !== 'undefined') ? ANALYTICS_CONFIG : {};
  const KEY = 'bunkaio_notrack';
  const store = {
    get(){ try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } },
    set(v){ try { v ? localStorage.setItem(KEY, '1') : localStorage.removeItem(KEY); } catch (e) {} },
  };
  const q = new URLSearchParams(location.search);
  if (q.get('notrack') === '1') store.set(true);
  if (q.get('track') === '1') store.set(false);

  function disabled(){
    if (!CFG.endpoint) return true;
    if (!(CFG.hosts || []).includes(location.hostname)) return true;
    if (store.get()) return true;
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return true;
    return false;
  }
  const device = () => { const w = window.innerWidth; return w < 700 ? 'mobile' : w < 1100 ? 'tablet' : 'desktop'; };
  const refHost = () => {
    try { const h = new URL(document.referrer).hostname; return h && h !== location.hostname ? h.replace(/^www\./, '') : ''; } catch (e) { return ''; }
  };
  let firstPageview = true;

  /* Matomo (optionnel, sans cookie) */
  if (CFG.matomoUrl && CFG.matomoSiteId && !disabled()) {
    window._paq = window._paq || [];
    _paq.push(['disableCookies'], ['setTrackerUrl', CFG.matomoUrl + '/matomo.php'], ['setSiteId', String(CFG.matomoSiteId)]);
    const s = document.createElement('script'); s.async = true; s.src = CFG.matomoUrl + '/matomo.js'; document.head.appendChild(s);
  }

  window.track = function(name, prop){
    if (disabled()) return;
    const body = JSON.stringify({ e: name, p: location.pathname, r: name === 'pageview' && firstPageview ? refHost() : undefined, d: device(), l: document.documentElement.lang || 'fr', v: prop });
    if (name === 'pageview') firstPageview = false;
    try { navigator.sendBeacon(CFG.endpoint, new Blob([body], { type: 'text/plain' })); }
    catch (e) { try { fetch(CFG.endpoint, { method: 'POST', body, keepalive: true, mode: 'no-cors' }); } catch (e2) {} }
    if (window._paq) {
      if (name === 'pageview') { _paq.push(['setCustomUrl', location.href], ['setDocumentTitle', document.title], ['trackPageView']); }
      else _paq.push(['trackEvent', name, prop || '']);
    }
  };

  window.trackingEnabled = () => !disabled();
  window.toggleTracking = function(){
    store.set(!store.get());
    const el = document.getElementById('trackToggleState');
    if (el) el.textContent = store.get() ? (document.documentElement.lang === 'en' ? 'Measurement is off' : 'Mesure désactivée') : (document.documentElement.lang === 'en' ? 'Measurement is on' : 'Mesure activée');
    return false;
  };

  /* Clics suivis (délégation) : CTA, téléphone, email, réseaux, langue */
  const placeOf = (el) => el.closest('nav') ? 'nav' : el.closest('footer') ? 'footer' : (el.closest('.view') ? el.closest('.view').id.replace('view-', '') : 'page');
  document.addEventListener('click', (e) => {
    const t = e.target.closest ? e.target.closest('a, button') : null;
    if (!t) return;
    const href = t.getAttribute('href') || '';
    if (href.startsWith('tel:')) return track('tel_click');
    if (href.startsWith('mailto:')) return track('mail_click');
    if (/instagram\.com/.test(href)) return track('social_click', 'instagram');
    if (t.matches('.lang-toggle')) return track('lang_toggle');
    /* CTA d'une offre précise : <a data-track="lancement"> → cta_click « lancement@<vue> » (même événement, propriété plus fine). */
    if (t.dataset && t.dataset.track) return track('cta_click', t.dataset.track + '@' + placeOf(t));
    if (t.matches('.cta-primary, .nav-cta, .hero-start')) return track('cta_click', 'estimer@' + placeOf(t));
    if (t.matches('.hero-access')) return track('cta_click', 'acces@home');
    if (t.matches('.pf-cta-btn')) return track('cta_click', 'devis@' + placeOf(t));
    if (t.matches('.cs-btn')) return track('cta_click', 'espace_client@' + placeOf(t));
  }, true);
})();
