/* Éditeur visuel des médias (5 nov. 2026) — remplace les images directement sur le site, avec un aperçu en direct.
   Le site réel s'affiche dans un cadre ; en mode « Éditer » on survole une image (contour violet), on clique, puis on dépose un fichier (glisser, coller ou choisir) :
   l'image est convertie avec les MÊMES réglages d'export que la liste (IMAGE_SPECS / toWebP, inchangés), affichée aussitôt dans le site à sa vraie place,
   puis « Publier » l'envoie au Worker (/upload-image). Plusieurs changements peuvent être préparés puis publiés d'un coup.
   S'appuie sur media.html : getToken, WORKER_BASE, MEDIA_BASE, specFor, toWebP, kb, SECTIONS, DISABLED_SECTIONS, PF_CATS. */
(function () {
  'use strict';
  const PAGES = [
    ['/', 'Accueil'], ['/services/', 'Services'], ['/portfolio/', 'Portfolio'], ['/collaboration/', 'Collaboration'], ['/a-propos/', 'À propos'],
    ['/contact/', 'Contact'], ['/conseils/', 'Conseils'], ['/decouvrir-chaque-prestation/', 'Découvrir chaque prestation'], ['/devis/', 'Devis'],
    ['/services/personal-branding-entrepreneurs/', 'Prestation · Personal Branding'], ['/services/portrait-professionnel-corporate/', 'Prestation · Corporate'],
    ['/services/photographe-mode-mannequins/', 'Prestation · Mode'], ['/services/photo-produits-packshots/', 'Prestation · Commercial'],
    ['/services/photographe-evenementiel/', 'Prestation · Événementiel'], ['/services/seance-photo-particuliers/', 'Prestation · Particuliers'],
    ['/photographe-montpellier/', 'Ville · Montpellier'], ['/photographe-toulouse/', 'Ville · Toulouse'], ['/photographe-france/', 'Ville · France'], ['/faq/', 'FAQ']
  ];
  const css = `
  .ed-btn-card { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding: 18px 20px; margin: 0 0 36px; border: 1px solid #111; background: #fff; }
  .ed-btn-card b { font-size: 15px; display: block; margin-bottom: 3px; }
  .ed-btn-card span { font-size: 12px; color: #6b6b70; line-height: 1.5; }
  .ed-btn-card button { margin-left: auto; background: #111; color: #fff; border: 0; padding: 12px 18px; font: 600 13px inherit; cursor: pointer; }
  .ed-btn-card button:hover { background: #6e5aa8; }
  .ed { position: fixed; inset: 0; z-index: 1000; display: none; flex-direction: column; background: #ecebe8; font-family: 'Inter Tight', -apple-system, sans-serif; color: #111; }
  .ed.on { display: flex; }
  .ed-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 10px 14px; background: #111; color: #fff; }
  .ed-bar b { font-size: 14px; margin-right: 6px; }
  .ed-bar select, .ed-bar button { font: 500 12px 'Inter Tight', sans-serif; padding: 8px 10px; border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff; cursor: pointer; }
  .ed-bar select option { color: #111; }
  .ed-bar button.on { background: #fff; color: #111; }
  .ed-bar .ed-sp { flex: 1; }
  .ed-bar .ed-pub { background: #6e5aa8; border-color: #6e5aa8; font-weight: 700; }
  .ed-bar .ed-pub[disabled] { opacity: .4; cursor: default; }
  .ed-main { flex: 1; min-height: 0; display: flex; }
  .ed-stage { flex: 1; min-width: 0; display: flex; justify-content: center; align-items: stretch; background: #d8d6d1; position: relative; overflow: hidden; }
  .ed-frame { border: 0; background: #fff; width: 100%; height: 100%; transition: width .3s; }
  .ed-stage.mobile .ed-frame { width: 390px; box-shadow: 0 0 0 1px rgba(0,0,0,.2), 0 18px 60px rgba(0,0,0,.25); margin: 14px 0; height: calc(100% - 28px); }
  .ed-hint { position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); background: rgba(17,17,17,.88); color: #fff; padding: 9px 14px; font-size: 12px; pointer-events: none; max-width: 80%; text-align: center; transition: opacity .4s; }
  .ed-panel { width: 360px; flex: none; background: #faf9f6; border-left: 1px solid #111; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
  .ed-panel h3 { font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #6b6b70; }
  .ed-search { width: 100%; padding: 9px 10px; border: 1px solid #111; font: 13px 'Inter Tight', sans-serif; background: #fff; }
  .ed-results { max-height: 180px; overflow-y: auto; border: 1px solid #e3e1dc; background: #fff; display: none; }
  .ed-results.on { display: block; }
  .ed-results button { display: block; width: 100%; text-align: left; padding: 8px 10px; border: 0; border-bottom: 1px solid #eee; background: none; font: 12px 'Inter Tight', sans-serif; cursor: pointer; }
  .ed-results button:hover { background: #ecebe8; }
  .ed-results small { display: block; color: #6b6b70; font-size: 10.5px; }
  .ed-sel { border: 1px solid #111; background: #fff; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
  .ed-sel .ed-name { font-size: 15px; font-weight: 700; letter-spacing: -.01em; }
  .ed-sel .ed-path { font: 11px ui-monospace, Menlo, monospace; color: #6b6b70; word-break: break-all; }
  .ed-sel .ed-spec { font-size: 11.5px; color: #3a3a40; line-height: 1.5; }
  .ed-thumb { width: 100%; aspect-ratio: 4 / 3; background: #ecebe8 center / contain no-repeat; border: 1px solid #e3e1dc; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #6b6b70; }
  .ed-drop { border: 2px dashed #6e5aa8; padding: 18px 12px; text-align: center; font-size: 12.5px; color: #3a3a40; cursor: pointer; background: rgba(110,90,168,.05); line-height: 1.5; }
  .ed-drop.over { background: rgba(110,90,168,.18); }
  .ed-drop b { color: #111; }
  .ed-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .ed-row button { flex: 1; padding: 10px; font: 600 12px 'Inter Tight', sans-serif; cursor: pointer; border: 1px solid #111; background: #fff; }
  .ed-row button.pri { background: #111; color: #fff; }
  .ed-row button[disabled] { opacity: .4; cursor: default; }
  .ed-msg { font-size: 12px; line-height: 1.5; padding: 8px 10px; background: #fff; border-left: 3px solid #6e5aa8; }
  .ed-msg.warn { border-left-color: #ff9500; } .ed-msg.err { border-left-color: #ff3b30; } .ed-msg.ok { border-left-color: #34c759; }
  .ed-pend { display: flex; flex-direction: column; gap: 6px; }
  .ed-pend div { display: flex; gap: 8px; align-items: center; padding: 6px; border: 1px solid #e3e1dc; background: #fff; font-size: 11.5px; cursor: pointer; }
  .ed-pend img { width: 34px; height: 34px; object-fit: cover; flex: none; }
  .ed-pend span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ed-pend i { font-style: normal; color: #6e5aa8; font-weight: 700; }
  @media (max-width: 900px) { .ed-main { flex-direction: column; } .ed-panel { width: auto; max-height: 46%; border-left: 0; border-top: 1px solid #111; } }`;

  const E = { frame: null, doc: null, mode: 'edit', sel: null, pending: new Map(), labels: new Map(), all: [], page: PAGES[0][0], ov: null, mo: null, busy: false };
  const $ = (s, r) => (r || document).querySelector(s);

  function buildLabels() {
    const push = (path, label, ctx) => { if (path && !E.labels.has(path)) { E.labels.set(path, { label, ctx }); E.all.push({ path, label, ctx }); } };
    try { (SECTIONS || []).concat(DISABLED_SECTIONS || []).forEach(s => (s.slots || []).forEach(sl => push(sl.path, sl.label, s.title.replace(/^[^\wÀ-ÿ]+/, '')))); } catch (e) {}
    try { (PF_CATS || []).forEach(c => { for (let i = 1; i <= 24; i++) push('portfolio/' + c.id + '/' + i + '.webp', (c.label && (c.label.fr || c.label)) + ' · photo ' + i, 'Portfolio'); }); } catch (e) {}
    for (let i = 1; i <= 5; i++) push('hero/partners-' + i + '.webp', 'Bannière Collaboration ' + i, 'Collaboration');
  }
  function pathOfUrl(u) {
    if (!u) return null;
    const base = MEDIA_BASE + '/';
    if (u.indexOf(base) !== 0) return null;
    return decodeURIComponent(u.slice(base.length).split(/[?#]/)[0]);
  }
  function pathOfImg(img) { return img.dataset.edPath || pathOfUrl(img.currentSrc || img.src); }
  function labelFor(path) {
    const l = E.labels.get(path); if (l) return l;
    const m = path.match(/^portfolio\/([^/]+)\/(\d+)\.webp$/); if (m) return { label: 'Portfolio · ' + m[1] + ' · photo ' + m[2], ctx: 'Portfolio' };
    return { label: path.split('/').pop().replace('.webp', ''), ctx: path.split('/')[0] };
  }

  /* ── Cadre du site ── */
  function loadPage(path) {
    E.page = path; E.sel = null; render();
    E.frame.onload = () => { try { E.doc = E.frame.contentDocument; hookDoc(); applyPending(); } catch (e) { E.doc = null; toast('Impossible d\'inspecter le site dans ce cadre.', 'err'); } };
    E.frame.src = '..' + path + (path.indexOf('?') < 0 ? '?edit=1' : '');
  }
  function hookDoc() {
    const d = E.doc; if (!d) return;
    if (!d.getElementById('ed-style')) {
      const st = d.createElement('style'); st.id = 'ed-style';
      st.textContent = '#ed-ov{position:fixed;z-index:2147483647;pointer-events:none;border:2px solid #6e5aa8;background:rgba(110,90,168,.14);display:none;box-sizing:border-box}#ed-ov span{position:absolute;left:-2px;top:-24px;background:#6e5aa8;color:#fff;font:600 11px/1 system-ui;padding:6px 8px;white-space:nowrap;max-width:90vw;overflow:hidden;text-overflow:ellipsis}#ed-ov.sel{border-color:#34c759;background:rgba(52,199,89,.12)}#ed-ov.sel span{background:#34c759}';
      d.head.appendChild(st);
    }
    let ov = d.getElementById('ed-ov'); if (!ov) { ov = d.createElement('div'); ov.id = 'ed-ov'; ov.innerHTML = '<span></span>'; d.body.appendChild(ov); }
    E.ov = ov;
    const imgAt = (x, y) => { const els = d.elementsFromPoint(x, y); for (const e of els) if (e.tagName === 'IMG' && pathOfImg(e)) return e; return null; };
    const show = (img, sel) => {
      if (!img) { ov.style.display = 'none'; return; }
      const r = img.getBoundingClientRect(), p = pathOfImg(img);
      Object.assign(ov.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
      ov.classList.toggle('sel', !!sel); ov.firstChild.textContent = (sel ? '✓ ' : '✎ ') + labelFor(p).label;
    };
    d.addEventListener('mousemove', e => { if (E.mode !== 'edit') { ov.style.display = 'none'; return; } show(imgAt(e.clientX, e.clientY)); }, true);
    d.addEventListener('mouseleave', () => { ov.style.display = 'none'; }, true);
    d.addEventListener('click', e => {
      if (E.mode !== 'edit') return;
      e.preventDefault(); e.stopPropagation();
      const img = imgAt(e.clientX, e.clientY);
      if (img) select(pathOfImg(img)); else toast('Pas d\'image modifiable ici — clique sur une photo (contour violet).', 'warn');
    }, true);
    d.addEventListener('dragover', e => { if (E.mode !== 'edit') return; e.preventDefault(); show(imgAt(e.clientX, e.clientY)); }, true);
    d.addEventListener('drop', e => {
      if (E.mode !== 'edit') return; e.preventDefault(); e.stopPropagation();
      const img = imgAt(e.clientX, e.clientY), f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (!f) return;
      if (!img) { toast('Dépose le fichier directement sur une photo du site.', 'warn'); return; }
      select(pathOfImg(img)); stage(pathOfImg(img), f);
    }, true);
    if (E.mo) E.mo.disconnect();
    let t; E.mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(applyPending, 150); });
    E.mo.observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }
  function applyPending() {
    const d = E.doc; if (!d || !E.pending.size) return;
    E.mo && E.mo.disconnect();
    d.querySelectorAll('img').forEach(img => {
      const p = pathOfImg(img), pe = p && E.pending.get(p);
      if (pe && img.src !== pe.url) { img.dataset.edPath = p; img.removeAttribute('srcset'); img.src = pe.url; img.style.visibility = ''; }
    });
    d.querySelectorAll('[style*="background"]').forEach(el => { E.pending.forEach((pe, p) => { if ((el.getAttribute('style') || '').indexOf(p) >= 0) el.style.backgroundImage = 'url("' + pe.url + '")'; }); });
    if (E.mo) E.mo.observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }
  function resetOnSite(path) {
    const d = E.doc; if (!d) return;
    const fresh = MEDIA_BASE + '/' + path + '?t=' + Date.now();
    d.querySelectorAll('img').forEach(img => { if (img.dataset.edPath === path) { img.src = fresh; } });
  }

  /* ── Sélection / préparation / publication ── */
  function select(path) { E.sel = path; render(); highlightSel(); }
  function highlightSel() {
    if (!E.doc || !E.ov || !E.sel) return;
    const img = [...E.doc.querySelectorAll('img')].find(i => pathOfImg(i) === E.sel);
    if (img) { img.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => { const r = img.getBoundingClientRect(); Object.assign(E.ov.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); E.ov.classList.add('sel'); E.ov.firstChild.textContent = '✓ ' + labelFor(E.sel).label; }, 500); }
  }
  async function stage(path, file) {
    if (!file || !/^image\//.test(file.type)) { toast('Ce fichier n\'est pas une image.', 'err'); return; }
    const spec = specFor(path);
    let out = await toWebP(file, spec.maxSide, spec.quality), w = 0, h = 0;
    try { const bm = await createImageBitmap(out); w = bm.width; h = bm.height; } catch (e) {}
    const old = E.pending.get(path); if (old) URL.revokeObjectURL(old.url);
    E.pending.set(path, { file: out, url: URL.createObjectURL(out), orig: file.size, w, h, spec, name: file.name });
    applyPending(); render();
    toast('Aperçu appliqué sur le site — « Publier » pour l\'enregistrer.', 'ok');
  }
  function cancel(path) { const pe = E.pending.get(path); if (!pe) return; URL.revokeObjectURL(pe.url); E.pending.delete(path); resetOnSite(path); render(); }
  async function publish(paths) {
    const token = getToken(); if (!token) { toast('Entre ton token admin en haut de la page Médias d\'abord.', 'err'); return; }
    E.busy = true; render();
    let ok = 0, fail = 0;
    for (const path of paths) {
      const pe = E.pending.get(path); if (!pe) continue;
      const fd = new FormData(); fd.append('file', pe.file); fd.append('path', path);
      try {
        const res = await fetch(WORKER_BASE + '/upload-image', { method: 'POST', headers: { 'Authorization': 'Bearer ' + token }, body: fd });
        const data = await res.json();
        if (res.ok && data.ok) {
          ok++; const fresh = MEDIA_BASE + '/' + path + '?t=' + Date.now();
          if (E.doc) E.doc.querySelectorAll('img').forEach(img => { if (img.dataset.edPath === path) img.src = fresh; });
          document.querySelectorAll('img').forEach(img => { if ((img.src || '').indexOf(MEDIA_BASE + '/' + path) === 0 && !img.closest('.ed')) img.src = fresh; });
          URL.revokeObjectURL(pe.url); E.pending.delete(path);
        } else { fail++; toast((data.error === 'unauthorized' ? 'Token incorrect' : (data.error || 'Erreur')) + ' — ' + path, 'err'); }
      } catch (e) { fail++; toast('Erreur réseau — ' + path, 'err'); }
    }
    E.busy = false; render();
    if (ok) toast(ok + ' image' + (ok > 1 ? 's' : '') + ' publiée' + (ok > 1 ? 's' : '') + ' ✓ (visible sur le site après quelques secondes).', fail ? 'warn' : 'ok');
  }

  /* ── Interface ── */
  let toastT;
  function toast(msg, kind) { const h = $('#edHint'); if (!h) return; h.textContent = msg; h.style.opacity = 1; h.style.background = kind === 'err' ? '#c62828' : kind === 'warn' ? '#b26a00' : kind === 'ok' ? '#1b7a34' : ''; clearTimeout(toastT); toastT = setTimeout(() => { h.style.opacity = 0; }, 4500); }
  function render() {
    const p = $('#edPanel'); if (!p) return;
    const pend = [...E.pending.entries()];
    $('#edPubAll').disabled = !pend.length || E.busy; $('#edPubAll').textContent = pend.length ? 'Publier tout (' + pend.length + ')' : 'Rien à publier';
    let sel = '';
    if (E.sel) {
      const L = labelFor(E.sel), pe = E.pending.get(E.sel), spec = specFor(E.sel);
      const cur = E.doc && [...E.doc.querySelectorAll('img')].find(i => pathOfImg(i) === E.sel && !i.dataset.edPath);
      const dim = cur && cur.naturalWidth ? cur.naturalWidth + '×' + cur.naturalHeight + ' px actuellement' : 'emplacement vide ou non visible sur cette page';
      const warns = [];
      if (pe) { if (pe.w && pe.w < spec.minW) warns.push('Largeur ' + pe.w + ' px : ' + spec.minW + ' px minimum conseillés pour un rendu net.'); if (pe.file.size > spec.maxKo * 1024) warns.push('Poids ' + kb(pe.file.size) + ' : au-dessus des ' + spec.maxKo + ' Ko conseillés.'); }
      sel = `<div class="ed-sel"><div><div class="ed-name">${L.label}</div><div class="ed-spec">${L.ctx ? L.ctx + ' · ' : ''}${spec.label}</div><div class="ed-path">${E.sel}</div></div>
        <div class="ed-thumb" style="background-image:url('${pe ? pe.url : MEDIA_BASE + '/' + E.sel + '?t=' + 1}')">${pe ? '' : (cur ? '' : 'Aucune image')}</div>
        <div class="ed-spec">${pe ? 'Nouveau : ' + (pe.w ? pe.w + '×' + pe.h + ' px · ' : '') + kb(pe.orig) + ' → ' + kb(pe.file.size) : dim}</div>
        ${warns.map(w => '<div class="ed-msg warn">' + w + '</div>').join('')}
        <div class="ed-drop" id="edDrop"><b>${pe ? 'Remplacer encore' : 'Déposer une image ici'}</b><br>glisser · coller (Ctrl+V) · ou cliquer pour choisir<input type="file" id="edFile" accept="image/*" hidden></div>
        <div class="ed-row"><button class="pri" id="edPub" ${pe && !E.busy ? '' : 'disabled'}>${E.busy ? 'Envoi…' : 'Publier cette image'}</button><button id="edCancel" ${pe ? '' : 'disabled'}>Annuler</button></div></div>`;
    } else sel = '<div class="ed-msg">1. Choisis une page ci-dessus.<br>2. Survole puis clique une photo du site (ou cherche un emplacement).<br>3. Dépose ton fichier : tu le vois tout de suite à sa vraie place.<br>4. « Publier ».</div>';
    p.innerHTML = `<div><h3>Chercher un emplacement</h3><input class="ed-search" id="edSearch" placeholder="ex. portrait Aya, bannière Collaboration, mode…"><div class="ed-results" id="edRes"></div></div>${sel}
      ${pend.length ? `<div><h3>En attente de publication</h3><div class="ed-pend">${pend.map(([k, v]) => `<div data-p="${k}"><img src="${v.url}" alt=""><span>${labelFor(k).label}</span><i>✎</i></div>`).join('')}</div></div>` : ''}`;
    const drop = $('#edDrop'), file = $('#edFile');
    if (drop) {
      drop.onclick = () => file.click(); file.onchange = () => file.files[0] && stage(E.sel, file.files[0]);
      drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); }; drop.ondragleave = () => drop.classList.remove('over');
      drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); if (e.dataTransfer.files[0]) stage(E.sel, e.dataTransfer.files[0]); };
      $('#edPub').onclick = () => publish([E.sel]); $('#edCancel').onclick = () => cancel(E.sel);
    }
    p.querySelectorAll('.ed-pend div').forEach(d => d.onclick = () => select(d.dataset.p));
    const s = $('#edSearch'), res = $('#edRes');
    s.oninput = () => {
      const q = s.value.trim().toLowerCase(); if (q.length < 2) { res.classList.remove('on'); return; }
      const hits = E.all.filter(x => (x.label + ' ' + x.ctx + ' ' + x.path).toLowerCase().indexOf(q) >= 0).slice(0, 30);
      res.innerHTML = hits.map(x => `<button data-p="${x.path}">${x.label}<small>${x.ctx} · ${x.path}</small></button>`).join('') || '<button disabled>Aucun résultat</button>';
      res.classList.add('on'); res.querySelectorAll('button[data-p]').forEach(b => b.onclick = () => { select(b.dataset.p); });
    };
  }
  function build() {
    if ($('#edRoot')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const root = document.createElement('div'); root.className = 'ed'; root.id = 'edRoot';
    root.innerHTML = `<div class="ed-bar"><b>Éditeur visuel</b>
      <select id="edPage">${PAGES.map(p => `<option value="${p[0]}">${p[1]}</option>`).join('')}</select>
      <button id="edModeE" class="on" title="Cliquer sur une photo pour la modifier">✎ Éditer</button><button id="edModeN" title="Naviguer dans le site (liens actifs)">↗ Naviguer</button>
      <button id="edDevD" class="on">Ordinateur</button><button id="edDevM">Mobile</button><button id="edReload">↻</button>
      <span class="ed-sp"></span><button class="ed-pub" id="edPubAll" disabled>Rien à publier</button><button id="edClose">✕ Fermer</button></div>
      <div class="ed-main"><div class="ed-stage" id="edStage"><iframe class="ed-frame" id="edFrame" title="Aperçu du site"></iframe><div class="ed-hint" id="edHint" style="opacity:0"></div></div><div class="ed-panel" id="edPanel"></div></div>`;
    document.body.appendChild(root);
    E.frame = $('#edFrame');
    $('#edPage').onchange = e => loadPage(e.target.value);
    const setMode = m => { E.mode = m; $('#edModeE').classList.toggle('on', m === 'edit'); $('#edModeN').classList.toggle('on', m === 'nav'); if (E.ov) E.ov.style.display = 'none'; toast(m === 'edit' ? 'Mode édition : clique une photo pour la modifier.' : 'Mode navigation : les liens du site sont actifs.'); };
    $('#edModeE').onclick = () => setMode('edit'); $('#edModeN').onclick = () => setMode('nav');
    const setDev = m => { $('#edStage').classList.toggle('mobile', m === 'm'); $('#edDevD').classList.toggle('on', m === 'd'); $('#edDevM').classList.toggle('on', m === 'm'); };
    $('#edDevD').onclick = () => setDev('d'); $('#edDevM').onclick = () => setDev('m');
    $('#edReload').onclick = () => loadPage(E.page);
    $('#edPubAll').onclick = () => publish([...E.pending.keys()]);
    $('#edClose').onclick = close;
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('on')) close(); });
    document.addEventListener('paste', e => { if (!root.classList.contains('on') || !E.sel) return; const it = [...(e.clipboardData ? e.clipboardData.items : [])].find(i => i.type.indexOf('image') === 0); if (it) { e.preventDefault(); stage(E.sel, it.getAsFile()); } });
    /* Suit la page ouverte dans le cadre quand on navigue : met à jour la liste déroulante. */
    E.frame.addEventListener('load', () => { try { const p = E.frame.contentWindow.location.pathname.replace(/^\/?(\.\.)?/, ''); const opt = [...$('#edPage').options].find(o => o.value === '/' + p.replace(/^\//, '').replace(/index\.html$/, '')); if (opt) $('#edPage').value = opt.value; } catch (e) {} });
  }
  function open(startPath) {
    buildLabels(); build();
    $('#edRoot').classList.add('on');
    loadPage(startPath || PAGES[0][0]); $('#edPage').value = startPath || PAGES[0][0];
    toast('Clique une photo du site pour la remplacer. Aperçu en direct avant de publier.');
  }
  function close() {
    if (E.pending.size && !confirm(E.pending.size + ' image(s) préparée(s) ne sont pas publiées. Fermer quand même ?')) return;
    E.pending.forEach(v => URL.revokeObjectURL(v.url)); E.pending.clear(); E.sel = null;
    $('#edRoot').classList.remove('on'); E.frame.src = 'about:blank';
  }
  window.BKMediaEditor = { open, close, _state: E };

  function mountEntry() {
    const host = document.getElementById('sections'); if (!host || $('.ed-btn-card')) return;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const card = document.createElement('div'); card.className = 'ed-btn-card';
    card.innerHTML = '<div><b>✨ Éditeur visuel — modifier les images directement sur le site</b><span>Ouvre le vrai site, clique une photo, dépose ton fichier : tu vois le rendu en direct (ordinateur ou mobile) avant de publier. Plusieurs images à la fois, collage direct, conversion automatique. La liste complète des emplacements reste disponible plus bas.</span></div><button type="button">Ouvrir l\'éditeur</button>';
    card.querySelector('button').onclick = () => open();
    if (document.documentElement.classList.contains('embed')) { const b2 = document.createElement('button'); b2.type = 'button'; b2.textContent = 'Plein écran dans un onglet ↗'; b2.style.cssText = 'margin-left:0;background:#fff;color:#111;border:1px solid #111'; b2.onclick = () => window.open('media.html', '_blank'); card.appendChild(b2); }
    host.parentNode.insertBefore(card, host);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountEntry); else mountEntry();
})();
