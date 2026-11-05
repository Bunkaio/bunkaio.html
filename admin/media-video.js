/* Vidéos du site — centre de compression (admin/media.html), 6 nov. 2026.
   Regroupe toutes les vidéos du site. Pour chaque rubrique : on dépose n'importe quel fichier vidéo (MOV, MP4, MKV, WebM, HEVC…),
   il est analysé puis converti dans le format de la rubrique, directement dans le navigateur (ffmpeg.wasm, fichiers dans vendor/ffmpeg,
   rien n'est envoyé à un tiers), puis publié dans le stockage média du site.

   Qualité : « sans perte visible ». Une vidéo déjà en H.264 4:2:0, à la bonne taille et au bon nombre d'images/s est SEULEMENT remballée
   (copie du flux, aucune recompression = aucune perte, sans piste audio, démarrage rapide). Sinon : H.264 CRF 18 (qualité visuellement
   identique à la source), jamais agrandie, 30 i/s maximum, débit de pointe plafonné pour rester fluide.
   Dépend de media.html : getToken, WORKER_BASE, MEDIA_BASE, kb. */
(function () {
  const VSPEC = {
    hero:  { h: 1080, label: 'MP4 H.264 · 1080p max · 30 i/s · sans audio', maxrate: '10M' },
    clip:  { h: 1080, label: 'MP4 H.264 · 1080p max · 30 i/s · sans audio', maxrate: '10M' },
    small: { h: 720,  label: 'MP4 H.264 · 720p max · 30 i/s · sans audio',  maxrate: '5M' },
  };
  const SLOTS = [
    { id: 'home',     title: 'Accueil — vidéo du haut de page', spec: 'hero', path: 'videos/home-bg.mp4', origin: true,
      desc: 'Fond plein écran du premier écran de l\'accueil (lecture en boucle, sans son). Sans fichier ici, le site garde la vidéo d\'origine.' },
    { id: 'mission',  title: 'Accueil — séquence « Le studio »', spec: 'hero', path: 'videos/mission-bg.mp4', origin: true,
      desc: 'Fond de la séquence « Le studio » (carrousel des prestations et « L\'exigence BUNKAIO »). Sans fichier ici, le site garde la vidéo d\'origine.' },
    { id: 'services', title: 'Services — fond', spec: 'hero', path: 'services/bg-video.mp4',
      desc: 'Fond vidéo facultatif de la page Services ; sans fichier, la photo de bannière est utilisée.' },
    { id: 'portfolio', title: 'Portfolio — fond', spec: 'hero', path: 'portfolio/bg-video.mp4',
      desc: 'Fond vidéo facultatif du Portfolio ; sans fichier, la photo de bannière est utilisée.' },
    { id: 'devis',    title: 'Devis — illustration', spec: 'small', path: 'devis/illustration-video.mp4',
      desc: 'Petite vidéo en boucle à côté du parcours de devis ; sans fichier, la photo est utilisée.' },
    ...[['immo', 'Immobilier'], ['outdoor', 'Piscines & paysages'], ['event', 'Événementiel'], ['brand', 'Marques & lifestyle']]
      .flatMap(([k, n]) => [1, 2].map((i) => ({ id: 'drone-' + k + '-' + i, title: '4K Drone — ' + n + ' · projet ' + i, spec: 'clip', path: 'drone/' + k + '-' + i + '.mp4',
        desc: 'Vidéo lancée en plein écran au clic sur la vignette (rubrique en pause).' }))),
  ];

  let ffmpeg = null, ffLoading = null, busy = Promise.resolve(), logH = null, progH = null;
  const $ = (el, sel) => el.querySelector(sel);
  const fmtMo = (n) => (n / 1048576).toFixed(n > 10485760 ? 1 : 2).replace('.', ',') + ' Mo';
  const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function loadScript(src) {
    return new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => ko(new Error('chargement ' + src)); document.head.appendChild(s); });
  }
  async function getFFmpeg(onLog) {
    if (!ffLoading) ffLoading = (async () => {
      await loadScript('vendor/ffmpeg/ffmpeg.js');
      const { FFmpeg } = window.FFmpegWASM;
      const f = new FFmpeg();
      await f.load({
        coreURL: new URL('vendor/ffmpeg/ffmpeg-core.js', location.href).href,
        wasmURL: new URL('vendor/ffmpeg/ffmpeg-core.wasm', location.href).href,
        classWorkerURL: new URL('vendor/ffmpeg/814.ffmpeg.js', location.href).href,
      });
      ffmpeg = f; return f;
    })().catch((e) => { ffLoading = null; throw e; });
    const f = await ffLoading;
    if (logH) f.off('log', logH);
    logH = ({ message }) => onLog && onLog(message); f.on('log', logH);
    return f;
  }

  /* Analyse : on lit la sortie de « ffmpeg -i » (codec, pixel, taille, images/s, présence d'audio). */
  async function probe(f, name) {
    const lines = [];
    const h = ({ message }) => lines.push(message);
    f.on('log', h);
    try { await f.exec(['-hide_banner', '-i', name]); } catch (e) {}
    f.off('log', h);
    const txt = lines.join('\n');
    const v = txt.match(/Video: (\w+)[^\n]*?, (yuv\w+|[a-z0-9]+)(?:\([^)]*\))?[^\n]*?, (\d{2,5})x(\d{2,5})/);
    const fps = txt.match(/(\d+(?:\.\d+)?) fps/);
    const dur = txt.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
    const rot = txt.match(/rotate\s*:\s*(-?\d+)/);
    return {
      codec: v ? v[1] : '', pix: v ? v[2] : '', w: v ? +v[3] : 0, h: v ? +v[4] : 0,
      fps: fps ? parseFloat(fps[1]) : 0, audio: /Audio:/.test(txt), rotated: rot ? Math.abs(+rot[1]) % 180 === 90 : false,
      dur: dur ? (+dur[1]) * 3600 + (+dur[2]) * 60 + parseFloat(dur[3]) : 0, raw: txt,
    };
  }

  async function compress(file, spec, ui) {
    const f = await getFFmpeg((m) => ui.log(m));
    const ext = (file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
    const inName = 'in.' + ext;
    ui.step('Lecture du fichier…');
    await f.writeFile(inName, new Uint8Array(await file.arrayBuffer()));
    ui.step('Analyse de la vidéo…');
    const p = await probe(f, inName);
    if (!p.codec) throw new Error('Format vidéo non reconnu');
    ui.info(p.codec.toUpperCase() + ' ' + p.w + '×' + p.h + (p.fps ? ' · ' + Math.round(p.fps * 100) / 100 + ' i/s' : '') + (p.audio ? ' · avec audio (retiré)' : ''));
    const vh = p.rotated ? p.w : p.h;
    const okCodec = p.codec === 'h264' && /^yuvj?420p$/.test(p.pix);
    const okSize = vh <= spec.h && (!p.fps || p.fps <= 30.5);
    const bitrate = p.dur ? (file.size * 8) / p.dur : 0;
    const okRate = !bitrate || bitrate <= 14e6;
    let mode;
    const out = 'out.mp4';
    if (progH) f.off('progress', progH);
    progH = ({ progress }) => { if (progress >= 0 && progress <= 1) ui.progress(progress); }; f.on('progress', progH);
    if (okCodec && okSize && okRate && !p.rotated) {
      mode = 'copy';
      ui.step('Déjà au bon format : remballage sans recompression (aucune perte)…');
      await f.exec(['-i', inName, '-an', '-c:v', 'copy', '-tag:v', 'avc1', '-movflags', '+faststart', '-y', out]);
    } else {
      mode = 'encode';
      ui.step('Compression (qualité visuellement identique)… cela peut prendre quelques minutes, laisse cet onglet ouvert.');
      const vf = ["scale=-2:'min(ih," + spec.h + ")'"];
      if (p.fps > 30.5) vf.push('fps=30');
      await f.exec(['-i', inName, '-an', '-vf', vf.join(','), '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-maxrate', spec.maxrate, '-bufsize', String(parseInt(spec.maxrate, 10) * 2) + 'M',
        '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-tag:v', 'avc1', '-movflags', '+faststart', '-y', out]);
    }
    const data = await f.readFile(out);
    try { await f.deleteFile(inName); await f.deleteFile(out); } catch (e) {}
    if (!data || !data.length) throw new Error('La compression a échoué (fichier vide)');
    let blob = new Blob([data], { type: 'video/mp4' });
    return { blob, mode, probe: p, inSize: file.size };
  }

  function putXHR(path, blob, onProg) {
    return new Promise((ok, ko) => {
      const fd = new FormData(); fd.append('file', new File([blob], 'video.mp4', { type: 'video/mp4' })); fd.append('path', path);
      const x = new XMLHttpRequest(); x.open('POST', WORKER_BASE + '/upload-image'); x.setRequestHeader('Authorization', 'Bearer ' + getToken());
      x.upload.onprogress = (e) => { if (e.lengthComputable) onProg(e.loaded / e.total); };
      x.onload = () => { let d = {}; try { d = JSON.parse(x.responseText); } catch (e) {} x.status === 200 && d.ok ? ok() : ko(new Error(d.error === 'unauthorized' ? 'Token incorrect' : (d.error || 'Erreur ' + x.status))); };
      x.onerror = () => ko(new Error('Erreur réseau'));
      x.send(fd);
    });
  }

  async function refreshStatus(card, slot) {
    const st = $(card, '.vc-status'), del = $(card, '.vc-del'), pv = $(card, '.vc-live');
    try {
      const r = await fetch(MEDIA_BASE + '/' + slot.path + '?show=1', { method: 'HEAD' });
      if (r.ok) {
        const len = +r.headers.get('content-length') || 0;
        st.innerHTML = '<b>En ligne</b>' + (len ? ' · ' + fmtMo(len) : '');
        st.className = 'vc-status on'; if (del) del.style.display = '';
        if (pv) { pv.style.display = ''; pv.querySelector('video').src = MEDIA_BASE + '/' + slot.path + '?show=1&t=' + Date.now(); }
        return;
      }
    } catch (e) {}
    st.textContent = slot.origin ? 'Vidéo d\'origine du site (aucun fichier remplaçant)' : 'Aucun fichier — la photo de bannière est utilisée';
    st.className = 'vc-status'; if (del) del.style.display = 'none'; if (pv) pv.style.display = 'none';
  }

  function makeCard(slot) {
    const spec = VSPEC[slot.spec];
    const card = document.createElement('div');
    card.className = 'vc-card';
    card.innerHTML = `
      <div class="vc-head"><div class="vc-title">${esc(slot.title)}</div><div class="vc-status">…</div></div>
      <div class="vc-desc">${esc(slot.desc)}</div>
      <div class="vc-spec">Format du site : ${esc(spec.label)}</div>
      <div class="vc-live" style="display:none"><video muted loop playsinline controls preload="metadata"></video></div>
      <div class="vc-drop" tabindex="0">Glisse une vidéo ici ou clique pour choisir un fichier <small>(MOV, MP4, MKV, WebM… n'importe quel format)</small>
        <input type="file" accept="video/*,.mov,.mkv,.mp4,.m4v,.webm,.avi,.hevc" style="display:none"></div>
      <div class="vc-work" style="display:none">
        <div class="vc-step"></div><div class="vc-info"></div>
        <div class="vc-bar"><i></i></div>
        <div class="vc-result"></div>
      </div>
      <div class="vc-actions"><button type="button" class="vc-btn vc-del" style="display:none">Revenir à ${slot.origin ? 'la vidéo d\'origine' : 'la photo'}</button></div>`;
    const drop = $(card, '.vc-drop'), input = $(card, 'input'), work = $(card, '.vc-work'), stepEl = $(card, '.vc-step'), infoEl = $(card, '.vc-info'), bar = $(card, '.vc-bar i'), res = $(card, '.vc-result');
    const ui = {
      step: (t) => { stepEl.textContent = t; bar.style.width = '0%'; },
      info: (t) => { infoEl.textContent = 'Source : ' + t; },
      progress: (r) => { bar.style.width = Math.round(r * 100) + '%'; },
      log: () => {},
    };
    async function handle(file) {
      if (!file) return;
      if (!getToken()) { alert('Entre ton token admin en haut de page d\'abord.'); return; }
      if (!window.WebAssembly) { alert('Ce navigateur ne gère pas WebAssembly : utilise Chrome, Edge, Firefox ou Safari récent.'); return; }
      drop.style.display = 'none'; work.style.display = ''; res.innerHTML = '';
      bar.parentNode.style.display = '';
      /* un seul traitement à la fois (le moteur de compression est unique) */
      busy = busy.then(async () => {
        try {
          ui.step('Préparation du moteur de compression (première fois : chargement ~30 Mo)…');
          const out = await compress(file, spec, ui);
          bar.style.width = '100%';
          const url = URL.createObjectURL(out.blob);
          ui.step(out.mode === 'copy' ? 'Prête : aucune recompression nécessaire.' : 'Prête : compressée.');
          const gain = out.inSize ? Math.round((1 - out.blob.size / out.inSize) * 100) : 0;
          res.innerHTML = `<video src="${url}" muted loop playsinline controls preload="metadata"></video>
            <div class="vc-sum">${fmtMo(out.inSize)} → <b>${fmtMo(out.blob.size)}</b>${gain > 0 ? ' (−' + gain + ' %)' : ''} · ${out.mode === 'copy' ? 'copie du flux d\'origine, aucune perte' : 'H.264 CRF 18, qualité visuellement identique'}${out.blob.size > 90 * 1048576 ? '<br><span class="vc-warn">⚠ Plus de 90 Mo : trop lourd pour l\'envoi, raccourcis ou recadre la vidéo.</span>' : ''}</div>
            <div class="vc-actions"><button type="button" class="vc-btn vc-pub">Publier sur le site</button><button type="button" class="vc-btn ghost vc-cancel">Annuler</button></div>`;
          const reset = () => { URL.revokeObjectURL(url); res.innerHTML = ''; work.style.display = 'none'; drop.style.display = ''; input.value = ''; };
          $(res, '.vc-cancel').onclick = reset;
          $(res, '.vc-pub').onclick = async (e) => {
            const b = e.target; b.disabled = true; b.textContent = 'Envoi…';
            try { await putXHR(slot.path, out.blob, (r) => { b.textContent = 'Envoi… ' + Math.round(r * 100) + ' %'; }); reset(); refreshStatus(card, slot); stepEl.textContent = ''; alert('Vidéo publiée ✓ (les visiteurs la voient d\'ici une heure au plus, cache du navigateur).'); }
            catch (err) { b.disabled = false; b.textContent = 'Publier sur le site'; alert('Échec de l\'envoi : ' + err.message); }
          };
        } catch (err) {
          res.innerHTML = '<div class="vc-warn">Compression impossible : ' + esc(err.message || err) + '. Commande de repli : <code>ffmpeg -i source.mov -an -vf "scale=-2:\'min(ih,' + spec.h + ')\'" -c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart sortie.mp4</code></div><div class="vc-actions"><button type="button" class="vc-btn ghost vc-cancel">Réessayer</button></div>';
          $(res, '.vc-cancel').onclick = () => { res.innerHTML = ''; work.style.display = 'none'; drop.style.display = ''; input.value = ''; };
        }
      });
    }
    drop.addEventListener('click', () => input.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => handle(input.files[0]));
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => handle(e.dataTransfer.files[0]));
    $(card, '.vc-del').addEventListener('click', async () => {
      if (!confirm('Retirer cette vidéo publiée ? Le site reprendra ' + (slot.origin ? 'la vidéo d\'origine.' : 'la photo de bannière.'))) return;
      try {
        const r = await fetch(WORKER_BASE + '/delete-media', { method: 'POST', headers: { 'Authorization': 'Bearer ' + getToken(), 'Content-Type': 'application/json' }, body: JSON.stringify({ path: slot.path }) });
        const d = await r.json(); if (!r.ok || !d.ok) throw new Error(d.error || r.status);
      } catch (e) { alert('Suppression impossible : ' + e.message); }
      refreshStatus(card, slot);
    });
    card._refresh = () => refreshStatus(card, slot);
    return card;
  }

  const CSS = `
  .vc-wrap { margin-bottom: 40px; }
  .vc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; margin-top: 14px; }
  .vc-card { border: 1px solid #ddd; background: #fff; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  .vc-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; flex-wrap: wrap; }
  .vc-title { font-weight: 700; font-size: 14px; }
  .vc-status { font-size: 12px; color: #888; } .vc-status.on { color: #2f7a4a; }
  .vc-desc, .vc-spec { font-size: 12px; color: #666; line-height: 1.5; } .vc-spec { color: #111; font-weight: 600; }
  .vc-live video, .vc-result video { width: 100%; max-height: 200px; background: #111; display: block; }
  .vc-drop { border: 1.5px dashed #bbb; padding: 18px 12px; text-align: center; font-size: 13px; cursor: pointer; color: #444; }
  .vc-drop small { display: block; color: #999; margin-top: 4px; } .vc-drop:hover, .vc-drop.over { border-color: #111; background: #f3f1ee; }
  .vc-step { font-size: 13px; font-weight: 600; } .vc-info, .vc-sum { font-size: 12px; color: #555; margin-top: 4px; }
  .vc-bar { height: 4px; background: #e6e3df; margin: 8px 0; } .vc-bar i { display: block; height: 100%; width: 0; background: #6e5aa8; transition: width .3s; }
  .vc-warn { color: #b3261e; font-size: 12px; line-height: 1.5; } .vc-warn code { font-size: 11px; word-break: break-all; }
  .vc-actions { display: flex; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
  .vc-btn { font: inherit; font-size: 12px; font-weight: 600; padding: 9px 14px; border: 1px solid #111; background: #111; color: #fff; cursor: pointer; }
  .vc-btn.ghost, .vc-del { background: #fff; color: #111; } .vc-btn:hover { background: #e8c6c4; color: #111; } .vc-btn:disabled { opacity: .5; cursor: default; }`;

  window.buildVideoCenter = function () {
    if (!document.getElementById('vcStyle')) { const st = document.createElement('style'); st.id = 'vcStyle'; st.textContent = CSS; document.head.appendChild(st); }
    const wrap = document.createElement('div');
    wrap.className = 'vc-wrap section'; wrap.id = 'videoCenter';
    wrap.innerHTML = `<div class="section-header"><div class="section-title">🎬 Vidéos du site — import et compression automatiques</div>
      <div class="section-desc">Toutes les vidéos du site au même endroit. Dépose n'importe quel fichier vidéo : il est analysé puis converti au format de la rubrique, sans perte visible (une vidéo déjà au bon format n'est pas recompressée du tout), directement dans ton navigateur. La compression d'une vidéo de 1080p peut durer quelques minutes ; garde l'onglet ouvert. Fichier source conseillé : moins de 1 Go.</div></div>
      <div class="vc-grid"></div>`;
    const grid = $(wrap, '.vc-grid');
    const cards = SLOTS.map((s) => { const c = makeCard(s); grid.appendChild(c); return c; });
    wrap._refresh = () => cards.forEach((c) => c._refresh());
    setTimeout(wrap._refresh, 0);
    return wrap;
  };
})();
