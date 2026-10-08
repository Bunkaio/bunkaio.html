/* ═══════════════ FORMSPREE → contact@bunkaio.com ═══════════════ */
const FORMSPREE_URL = 'https://formspree.io/f/mnjybndv';

/* ═══════════════ FRAIS DE DÉPLACEMENT — source unique ═══════════════
   Offerts jusqu'à TRAVEL_FREE_KM autour de Montpellier ou de Béziers ; au-delà, TRAVEL_PER_KM € par km
   (aller-retour) sur la distance dépassant ce rayon, arrondi aux 5 € près. Exemples = estimations
   (distance routière depuis le pôle le plus proche). Modifier ici pour changer tous les textes du site. */
const TRAVEL_FREE_KM = 30;
const TRAVEL_PER_KM = '0,60';
const TRAVEL_TOULOUSE_FEE = 50;
const TRAVEL_TXT = {
  fr: {
    list: 'Déplacements offerts jusqu\'à ' + TRAVEL_FREE_KM + ' km autour de Montpellier et de Béziers, forfait de ' + TRAVEL_TOULOUSE_FEE + ' € à Toulouse',
    note: 'Déplacements offerts jusqu\'à ' + TRAVEL_FREE_KM + ' km autour de Montpellier et de Béziers ; forfait de ' + TRAVEL_TOULOUSE_FEE + ' € à Toulouse et son agglomération ; ailleurs, ' + TRAVEL_PER_KM + ' € par km (aller-retour) au-delà de ' + TRAVEL_FREE_KM + ' km. Calculé automatiquement dans votre devis en ligne.',
    full: 'Les déplacements sont offerts dans un rayon de ' + TRAVEL_FREE_KM + ' km autour de Montpellier et de Béziers. Toulouse et son agglomération : forfait de ' + TRAVEL_TOULOUSE_FEE + ' €. Ailleurs, ils sont facturés ' + TRAVEL_PER_KM + ' € par km, aller-retour, sur la distance qui dépasse ces ' + TRAVEL_FREE_KM + ' km, arrondie aux 5 € près (estimations : Nîmes ≈ 35 €, Carcassonne ≈ 70 €, Perpignan ≈ 80 €). Le devis en ligne calcule le montant à partir de la ville de la prestation ; il est confirmé sur votre devis, avant toute signature.'
  },
  en: {
    list: 'Free travel within ' + TRAVEL_FREE_KM + ' km of Montpellier and Béziers, flat €' + TRAVEL_TOULOUSE_FEE + ' in Toulouse',
    note: 'Free travel within ' + TRAVEL_FREE_KM + ' km of Montpellier and Béziers; flat €' + TRAVEL_TOULOUSE_FEE + ' in Toulouse and its suburbs; elsewhere, €' + TRAVEL_PER_KM.replace(',', '.') + ' per km (round trip) beyond ' + TRAVEL_FREE_KM + ' km. Calculated automatically in your online quote.',
    full: 'Travel is free within ' + TRAVEL_FREE_KM + ' km of Montpellier and Béziers. Toulouse and its suburbs: flat fee of €' + TRAVEL_TOULOUSE_FEE + '. Elsewhere it is charged at €' + TRAVEL_PER_KM.replace(',', '.') + ' per km, round trip, on the distance exceeding those ' + TRAVEL_FREE_KM + ' km, rounded to the nearest €5 (estimates: Nîmes ≈ €35, Carcassonne ≈ €70, Perpignan ≈ €80). The online quote calculates the amount from the session city; it is confirmed on your quote, before you sign anything.'
  }
};

/* Calculateur du devis en ligne : la ville saisie est localisée (API publique geo.api.gouv.fr, repli sur une
   liste locale) puis comparée aux deux pôles. Distance routière estimée = distance à vol d'oiseau × 1,25. */
const TRAVEL_POLES = [{ lat: 43.6108, lon: 3.8767 }, { lat: 43.3442, lon: 3.2158 }];   /* Montpellier, Béziers */
const TRAVEL_TOULOUSE = { lat: 43.6047, lon: 1.4442, radiusKm: 15 };
const TRAVEL_ROAD = 1.25, TRAVEL_RATE = 0.6, TRAVEL_MAX_KM = 350;
const TRAVEL_FALLBACK = {
  'montpellier':[43.6108,3.8767],'beziers':[43.3442,3.2158],'sete':[43.4075,3.6967],'agde':[43.3108,3.4758],'narbonne':[43.1839,3.0036],
  'nimes':[43.8367,4.3601],'lunel':[43.6750,4.1350],'pezenas':[43.4611,3.4244],'carcassonne':[43.2130,2.3491],'perpignan':[42.6887,2.8948],
  'ales':[44.1250,4.0817],'albi':[43.9298,2.1480],'castres':[43.6056,2.2400],'toulouse':[43.6047,1.4442],'blagnac':[43.6366,1.3903],
  'tarbes':[43.2328,0.0781],'rodez':[44.3498,2.5750],'cahors':[44.4475,1.4417],'mende':[44.5180,3.5010],'auch':[43.6459,0.5854],
  'montauban':[44.0175,1.3550],'foix':[42.9650,1.6050],'saint-gaudens':[43.1086,0.7253],'millau':[44.0997,3.0780],'sommieres':[43.7850,4.0870]
};
function travelNorm(x){ return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s*\(\d+[ab]?\)\s*$/i, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function travelKm(a, b, c, d){
  const r = x => x * Math.PI / 180, dl = r(c - a), dn = r(d - b);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(dn / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
function travelFromCoords(lat, lon, label){
  if (travelKm(lat, lon, TRAVEL_TOULOUSE.lat, TRAVEL_TOULOUSE.lon) <= TRAVEL_TOULOUSE.radiusKm) return { kind: 'flat', fee: TRAVEL_TOULOUSE_FEE, km: null, city: label };
  const km = Math.round(Math.min(...TRAVEL_POLES.map(p => travelKm(lat, lon, p.lat, p.lon))) * TRAVEL_ROAD);
  if (km <= TRAVEL_FREE_KM) return { kind: 'free', fee: 0, km, city: label };
  if (km > TRAVEL_MAX_KM) return { kind: 'quote', fee: null, km, city: label };
  return { kind: 'km', fee: Math.round((km - TRAVEL_FREE_KM) * 2 * TRAVEL_RATE / 5) * 5, km, city: label };
}
/* Le déplacement ne s'applique ni à l'abonnement, ni au format Polas (studio), ni à une séance en studio. */
function travelApplies(){ return !!S.tier && S.tier !== 'sub' && !(isSpecialTier() && S.cat === 'mode') && !S.studio; }
function travelFee(){ return travelApplies() && S.travel && typeof S.travel.fee === 'number' ? S.travel.fee : 0; }
function travelMessage(tr){
  const fr = LANG === 'fr', c = tr.city;
  if (tr.kind === 'free') return fr ? `${c} : déplacement offert.` : `${c}: travel is free.`;
  if (tr.kind === 'flat') return fr ? `${c} : forfait déplacement de ${tr.fee} €, ajouté à votre estimation.` : `${c}: flat travel fee of €${tr.fee}, added to your estimate.`;
  if (tr.kind === 'km') return fr ? `${c} · ≈ ${tr.km} km : déplacement estimé à ${tr.fee} €, ajouté à votre estimation.` : `${c} · ≈ ${tr.km} km: travel estimated at €${tr.fee}, added to your estimate.`;
  if (tr.kind === 'quote') return fr ? `${c} : trop éloignée pour une estimation automatique, le déplacement sera chiffré sur votre devis.` : `${c}: too far for an automatic estimate, travel will be priced on your quote.`;
  return fr ? 'Ville non reconnue : vérifiez l\'orthographe, sinon le déplacement sera précisé sur votre devis.' : 'City not recognised: check the spelling, otherwise travel will be specified on your quote.';
}
function renderTravelResult(state){
  const el = document.getElementById('qTravelEst');
  if (!el) return;
  if (state === 'loading') { el.className = 'travel-est'; el.textContent = LANG === 'fr' ? 'Calcul en cours…' : 'Calculating…'; return; }
  if (!S.travel) { el.className = 'travel-est'; el.textContent = ''; return; }
  el.className = 'travel-est ' + (S.travel.kind === 'unknown' ? 'warn' : 'ok');
  el.textContent = travelMessage(S.travel) + (['unknown', 'quote'].includes(S.travel.kind) ? '' : (LANG === 'fr' ? ' Estimation confirmée sur votre devis.' : ' Estimate confirmed on your quote.'));
}
function travelSummary(){
  if (!travelApplies() || !S.city) return { fee: 0, text: '' };
  const tr = S.travel;
  if (!tr) return { fee: 0, text: 'Déplacement : ' + S.city + ' (à chiffrer sur devis)' };
  if (tr.kind === 'free') return { fee: 0, text: 'Déplacement : ' + tr.city + ' (offert)' };
  if (tr.kind === 'flat') return { fee: tr.fee, text: 'Déplacement : ' + tr.city + ' (forfait Toulouse +' + tr.fee + '€)' };
  if (tr.kind === 'km') return { fee: tr.fee, text: 'Déplacement : ' + tr.city + ' (≈ ' + tr.km + ' km, +' + tr.fee + '€)' };
  return { fee: 0, text: 'Déplacement : ' + (tr.city || S.city) + ' (à chiffrer sur devis)' };
}
let _travelTimer = null, _travelReq = 0;
function onTravelCityInput(){
  const inp = document.getElementById('qCity');
  S.city = inp ? inp.value.trim() : '';
  S.travel = null;
  clearTimeout(_travelTimer);
  if (S.city.length < 2) { renderTravelResult(); updateQuizPayReassurance(); checkQuizForm(); return; }
  renderTravelResult('loading');
  checkQuizForm();
  _travelTimer = setTimeout(estimateTravel, 450);
}
async function estimateTravel(){
  const raw = S.city, q = raw.replace(/\s*\(\d+[ab]?\)\s*$/i, '');
  const id = ++_travelReq;
  let hit = null, list = [];
  try {
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 4500);
    const r = await fetch('https://geo.api.gouv.fr/communes?nom=' + encodeURIComponent(q) + '&fields=nom,centre,departement&boost=population&limit=6', { signal: ctrl.signal });
    clearTimeout(to);
    list = (await r.json()).filter(c => c && c.centre && c.centre.coordinates);
  } catch (e) { list = []; }
  if (id !== _travelReq) return;
  const dl = document.getElementById('qCityList');
  if (dl) dl.innerHTML = list.map(c => `<option value="${c.nom} (${c.departement ? c.departement.code : ''})"></option>`).join('');
  const label = c => c.nom + (c.departement ? ' (' + c.departement.code + ')' : '');
  const exact = list.find(c => label(c).toLowerCase() === raw.toLowerCase()) || list.find(c => travelNorm(c.nom) === travelNorm(q)) || list[0];
  if (exact) hit = { lat: exact.centre.coordinates[1], lon: exact.centre.coordinates[0], label: label(exact) };
  else {
    const fb = TRAVEL_FALLBACK[travelNorm(q)];
    if (fb) hit = { lat: fb[0], lon: fb[1], label: q.charAt(0).toUpperCase() + q.slice(1) };
  }
  S.travel = hit ? travelFromCoords(hit.lat, hit.lon, hit.label) : { kind: 'unknown', fee: null, city: raw };
  renderTravelResult();
  updateQuizPayReassurance();
  checkQuizForm();
}
function renderTravelField(){
  const g = document.getElementById('qCityGroup');
  if (!g) return;
  const on = travelApplies();
  g.style.display = on ? '' : 'none';
  if (!on) { S.city = ''; S.travel = null; const i = document.getElementById('qCity'); if (i) i.value = ''; }
  else if (S.city) onTravelCityInput();
  renderTravelResult();
}


/* ═══════════════ STRIPE LEAD CAPTURE (Cloudflare Worker — voir /server) ═══════════════
   À remplacer par l'URL réelle après déploiement du Worker (voir server/README.md).
   Tant que cette URL n'est pas configurée, sendQuizLeadToStripe() échoue silencieusement
   et n'a aucun impact sur le quiz (fire-and-forget, voir submitQuiz()). */
/* Accusé de réception par email (envoyé par le Worker) — best-effort, ne bloque jamais le formulaire. */
function sendAck(kind, name, email, space, details){
  try {
    fetch('https://bunkaio-quiz-stripe.bunkaio.workers.dev/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, name: name, email: email, space: space || 'client', lang: (typeof LANG !== 'undefined' ? LANG : 'fr'), details: details || {} }),
      keepalive: true
    }).catch(() => {});
  } catch (e) {}
}
const QUIZ_LEAD_WORKER_URL = 'https://bunkaio-quiz-stripe.bunkaio.workers.dev/quiz-lead';

const DELAY_LABELS = {
  urgent:   { fr: 'Urgent (moins de 2 semaines)', en: 'Urgent (under 2 weeks)' },
  '1_mois': { fr: 'Dans le mois', en: 'Within a month' },
  '2_3_mois': { fr: '2 à 3 mois', en: '2 to 3 months' },
  flexible: { fr: 'Flexible / pas de contrainte', en: 'Flexible / no constraint' }
};

/**
 * Envoie la soumission du quiz au Worker Stripe en arrière-plan.
 * Fire-and-forget volontaire : ne renvoie rien d'utile au flux du quiz et
 * n'est jamais attendu (await) par submitQuiz(), pour garantir qu'aucune
 * latence ni erreur Stripe ne puisse retarder ou bloquer la fin du quiz
 * pour le visiteur. Toute erreur est avalée ici et seulement loggée
 * en console pour le debug.
 */
function sendQuizLeadToStripe(payload){
  if (!QUIZ_LEAD_WORKER_URL || QUIZ_LEAD_WORKER_URL.includes('TON-SOUS-DOMAINE')) {
    console.warn('[quiz-lead] QUIZ_LEAD_WORKER_URL non configurée — synchronisation Stripe ignorée.');
    return;
  }
  /* La langue du site au moment de la demande détermine la langue des emails envoyés ensuite au client. */
  fetch(QUIZ_LEAD_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ lang: LANG }, payload))
  })
    .then(r => r.json())
    .then(data => console.log('[quiz-lead] réponse Worker Stripe', data))
    .catch(err => console.warn('[quiz-lead] échec d\'envoi au Worker Stripe (sans impact pour le visiteur)', err));
}

/* IMG et DRONE_MEDIA sont définis dans config/media.js — chargé avant ce fichier */

/* ═══════════════ LANGUE ═══════════════ */
let LANG = 'fr';

const I18N = {
  fr: {
    'estimate':'Devis','services':'Services','portfolio':'Portfolio','drone':'4K Drone','contact':'Contact','partners':'Collaboration','nav-legal':'FAQ',
    'hero-kicker':'Photographe professionnel · Occitanie','cred-lead':'BUNKAIO est un studio de photographie professionnelle mobile, basé à Montpellier : séances portrait, portraits professionnels, mode et mannequins, photo de produit, événementiel et photobooth IA Lumen, à Béziers, Montpellier et Toulouse. Retrouvez chaque <a href="/services/" data-nav="services">prestation et ses tarifs</a>.','quiz-h1':'Devis photo en ligne','hero-word1':'Estimez','hero-word2':'votre','hero-word3':'projet','start':'Estimer mon projet',
    'step-cat':'01 — Catégorie','q-cat':'Quel est votre domaine\u00a0?','q-cat-sub':'Sélectionnez l\'univers de votre projet.',
    'step-prof':'02 — Profil','q-prof':'Quel profil êtes-vous\u00a0?','q-prof-sub':'Identifiez-vous pour que nous comprenions précisément votre besoin.',
    'step-tier':'03 — Prestation','q-tier':'Quel niveau de prestation\u00a0?',
    'step-recap':'04 — Votre prestation','q-recap':'Ce qui est inclus','q-recap-sub':'Le détail de votre prestation, et les options pour aller plus loin.',
    'options':'Options supplémentaires',
    'step-coords':'05 — Coordonnées','q-coords':'Vos coordonnées','q-coords-sub':'Nous étudions chaque demande personnellement. Réponse assurée sous 48h.',
    'name-label':'Nom / Société *','email-label':'Email *','phone-label':'Téléphone','phone-label-opt':'Téléphone — optionnel','project-label':'Votre projet *','message-label':'Message *',
    'city-label':'Ville de la prestation *','city-ph':'Ex. : Béziers, Nîmes, Toulouse…','city-hint':'Le montant du déplacement est estimé automatiquement et ajouté à votre devis.','delay-label':'Délai souhaité *','delay-opt-select':'Sélectionnez…','delay-opt-urgent':'Urgent (moins de 2 semaines)','delay-opt-1m':'Dans le mois','delay-opt-2-3m':'2 à 3 mois','delay-opt-flex':'Flexible / pas de contrainte',
    'back':'← Retour','continue':'Suivant →','next':'Suivant →','submit':'Confirmez ma demande de devis',
    'quiz-back':'Retour','quiz-home':'Accueil',
    'success-label':'Demande reçue','success-title':'Votre demande a bien été envoyée',
    'success-text1':'Merci pour votre confiance. Votre demande de devis est entre nos mains : elle sera étudiée et vous recevrez une réponse sous <strong>48 heures</strong>.',
    'success-text2':'Chaque demande est évaluée individuellement et n\'est acceptée que si elle correspond à la <strong>ligne éditoriale de BUNKAIO</strong>. Nous travaillons uniquement avec des projets qui résonnent avec notre univers — c\'est ce qui garantit la qualité de chaque collaboration.',
    'success-text3':'Une fois votre devis confirmé, direction votre espace client : vous pourrez y construire votre <strong>moodboard</strong> pour partager votre vision — direction artistique, ambiance, inspirations — et nous arriver parfaitement alignés le jour du shooting.',
    'home-btn':'Retour à l\'accueil','see-portfolio':'Voir tout le portfolio',
    'pf-cta-title':'Prêt à donner vie à votre projet&nbsp;?','pf-cta-sub':'Chaque collaboration commence par une estimation — simple, rapide, sans engagement.','pf-cta-btn':'Recevoir mon devis personnalisé','footer-cta-headline':'Un projet en tête&nbsp;?',
    'aria-next':'Suivant','aria-prev':'Précédent','aria-back':'Retour','aria-menu':'Menu','aria-home':'Accueil',
    'svc-reserve':'Je réserve ma séance','studio-reserve':'Je réserve ma séance en ligne','svc-discover':'Découvrir chaque prestation','ft-discover':'Découvrir chaque prestation','scroll-hint':'Scroll','services-title':'Prestations & tarifs photo','services-sub':'Photographe professionnel à Béziers, Montpellier et Toulouse : des images haut de gamme, en HD, pour mettre en valeur votre projet. Nos prestations et leurs tarifs, par univers.',
    'svc-all':'Tous','svc-cta':'Estimer ce projet →','svc-sub-label':'Abonnement mensuel',
    'svc-trust1-title':'Réponse sous 48h','svc-trust1-text':'Chaque demande est étudiée puis traitée personnellement — jamais de réponse automatique.',
    'svc-trust2-title':'Un parcours accompagné','svc-trust2-text':'De la demande à la livraison, 7 étapes claires — dont la création de votre moodboard pour partager votre vision — <span class="svc-trust-link" onclick="goToProcess()">voir le déroulé complet</span>.',
    'svc-trust3-title':'Vos droits garantis','svc-trust3-text':'Les visuels livrés vous appartiennent, avec des conditions d\'usage définies noir sur blanc dès le devis.',
    'svc-trust4-title':'Un interlocuteur unique','svc-trust4-text':'Du premier échange à la livraison finale, vous échangez toujours avec la même personne.',
    'drone-title':'4K Drone & vidéo',
    'drone-intro':'Derrière chaque image aérienne, il y a une formation, des certifications et un matériel choisi avec exigence. Voici ce qui garantit la qualité — et la légalité — de chacune de nos productions.',
    'nav-soon':'Bientôt',
    'drone-soon-title':'Cette rubrique sera bientôt disponible',
    'drone-soon-sub':'Nos prestations drone sont en cours de déploiement. Revenez prochainement.',
    'drone-placeholder-title':'En cours de réalisation',
    'drone-placeholder-text':'Nous préparons cette prestation avec le même soin que le reste du studio — formules, certifications et portfolio aérien seront bientôt en ligne. En attendant, estimons ensemble votre projet.',
    'cred-label':'Formation, certifications & matériel',
    'cred1-title':'BTS Photographie — ETPA','cred1-text':'Formation supérieure en photographie à l\'ETPA, école de référence. Maîtrise complète de la lumière, de la composition et de la postproduction.',
    'cred2-title':'6 ans d\'expérience terrain','cred2-text':'Six années de photographie de terrain, au contact direct des sujets et des contraintes réelles : lumière changeante, délais, exigence du résultat. Une expérience affinée reportage après reportage.',
    'cred3-title':'Pilote drone certifié A1/A3 & A2','cred3-text':'Certifications européennes catégorie ouverte (A1/A3 et A2) délivrées par la DGAC. Vols déclarés, assurés et conformes à la réglementation en vigueur.',
    'cred4-title':'Un matériel professionnel','cred4-text':'Drone DJI Mavic 3 Pro — capteur 4/3 Hasselblad, vidéo 4K HDR. Boîtier hybride Sony Alpha 7 III et optiques G Master pour la photo et la vidéo au sol.',
    'gear-label':'Équipement','gear-cert':'Certifié A1/A3 · A2',
    'drone-explore':'Explorez nos productions',
    'portfolio-title':'Portfolio photo','portfolio-sub':'Une sélection de projets réalisés par le studio, classés par univers.',
    'contact-title':'Contacter votre photographe','contact-sub':'Une question, un projet, une collaboration\u00a0? Écrivez-nous — nous répondons sous 24h.',
    'company-label':'Entreprise','follow-label':'Suivez-nous','contact-btn':'Nous contacter',
    'ct-success-title':'Message envoyé','ct-success-text':'Merci pour votre message. Nous reviendrons vers vous sous 24 heures.',
    'partners-title':'Partenariat et collaboration',
    'legal-title':'FAQ : questions fréquentes',
    'legal-sub':'Les réponses aux questions les plus fréquentes, ainsi que nos engagements en matière de confidentialité et de droits d\'utilisation des visuels.',
    'ctab-contact':'Contact','ctab-about':'À propos','vat-note':'Prix nets : TVA non applicable (art. 293 B du CGI). Le prix affiché est le prix payé, sans calcul supplémentaire.','svr-kicker':'Nos prestations','svr-title':'Une image juste pour chaque projet','svr-catalog':'Voir le catalogue complet','svr-aria':'Nos prestations',
    'legaltab-faq':'FAQ','legaltab-privacy':'Politique de confidentialité','legaltab-cgv':'Conditions générales de vente','legal-title-cgv':'Conditions générales de vente','ft-cgv':'Conditions générales de vente',
    'p-why':'Pourquoi Bunkaio existe',
    'p-why-1':'Nous vivons dans un monde où les contenus se multiplient, mais où les histoires se raréfient. Chaque jour, des milliers d\'images sont publiées puis oubliées.',
    'p-why-2':'Pourtant, derrière chaque lieu, chaque objet et chaque réalisation se cache une histoire qui mérite d\'être racontée.',
    'p-why-3':'Chez Bunkaio, nous croyons que la valeur d\'un projet ne réside pas uniquement dans son résultat final, mais également dans la vision, les défis et le savoir-faire qui ont permis son existence.',
    'p-mission':'Nous ne documentons pas des projets. Nous révélons ce qui les rend uniques.',
    'reassure1-title':'Devis gratuit sous 48h',
    'reassure1-text':'Aucun engagement, aucune carte bancaire. Vous recevez une proposition claire et chiffrée en moins de 48 heures.',
    'reassure2-title':'Créneaux limités chaque mois',
    'reassure2-text':'Pour garantir la qualité de chaque prestation, nous acceptons un nombre restreint de projets. Réservez votre créneau dès maintenant.',
    'reassure3-title':'Vos droits, clairs dès le départ',
    'reassure3-text':'Vos visuels vous appartiennent. Conditions d\'usage définies noir sur blanc avant chaque prestation — aucune mauvaise surprise.',
    'reassure4-title':'Un interlocuteur unique',
    'reassure4-text':'De la première prise de contact à la livraison finale, vous échangez avec la même personne. Pas de standard, pas de sous-traitance.',
    'cred-mini1':'Basé à Montpellier — mobile à Béziers, Montpellier, Toulouse',
    'cred-mini2':'Photographe professionnelle diplômée de l\'ETPA — BTS Photographie 2018',
    'cred-mini3':'Matériel professionnel haut de gamme',
    'cred-mini4':'8 ans d\'expérience · 200+ projets réalisés',
    'cred-faq-link':'Des questions ? Consultez notre FAQ →',
    'testi-share-btn':'Partager mon expérience',
    'share-title':'Partager mon expérience',
    'about-title':'Aya Nascimento, photographe portraitiste professionnelle',
    'about-partner-h':'Vous êtes un professionnel de l\'image, de la beauté ou de l\'événementiel ?',
    'about-partner-p':'Coiffeurs, maquilleurs, stylistes, agences, wedding planners, lieux de réception : BUNKAIO propose un <a href="/collaboration/" data-nav="partners">programme de partenariat</a> avec un tarif partenaire permanent, des missions collaboratives et un réseau de professionnels.',
    'about-cta-quote':'Estimer mon projet',
    'ct-extra-h':'Pour recevoir une réponse rapide',
    'ct-extra-intro':'Précisez dans votre message :',
    'ct-extra-1':'le type de projet (portrait, mode, produits, événement…)',
    'ct-extra-2':'la date souhaitée et le lieu (Béziers, Montpellier, Toulouse ou autre)',
    'ct-extra-3':'l\'usage prévu des photos (personnel, réseaux, site, publicité)',
    'ct-extra-4':'un budget indicatif, si vous en avez un',
    'ct-extra-links':'Vous préférez une estimation immédiate ? Utilisez le <a href="/devis/" data-nav="quiz">devis en ligne</a> (2 minutes) ou consultez la <a href="/faq/" data-nav="faq">FAQ</a>.',
    'about-sub':'La photographe derrière BUNKAIO : des images haut de gamme, en HD, pour mettre en valeur vos projets.',
    'about-h-bio':'Une photographe, un regard',
    'about-p1':'Aya Nascimento est photographe portraitiste professionnelle, diplômée de l\'ETPA (BTS Photographie, 2018). Elle est la photographe de BUNKAIO.',
    'about-p2':'Spécialisée en photographie de mode, de produit, corporate et événementielle, elle accompagne les particuliers, les marques et les entreprises avec des images premium en haute définition, retouchées avec soin.',
    'about-h-zone':'Un studio mobile en Occitanie',
    'about-zone-text':'BUNKAIO est basé à Montpellier et se déplace : pas d\'adresse de studio, mais une intervention à Béziers, Montpellier et Toulouse. ' + TRAVEL_TXT.fr.full + ' Besoin d\'idées de lieux de séance ? Voir <a href="/conseils/lieux-seance-photo-montpellier-beziers-toulouse/" data-nav="article:lieux-seance-photo-montpellier-beziers-toulouse">où faire une séance photo à Montpellier, Béziers ou Toulouse</a>.',
    'about-stat1':'ans d\'expérience','about-stat2':'projets réalisés','about-stat3':'diplômée de l\'ETPA · BTS Photographie',
    'about-h-spec':'Spécialités',
    'about-spec1':'Portrait & lifestyle','about-spec2':'Mode, agences et mannequins','about-spec3':'Photo de produit & commercial','about-spec4':'Corporate & entreprises','about-spec5':'Événementiel & mariage (Lumen)',
    'about-h-method':'Comment ça se passe',
    'about-step1':'Devis personnalisé sous 48 h','about-step2':'Shooting à la date convenue','about-step3':'Retouche et post-production','about-step4':'Livraison en HD dans une galerie privée, depuis votre espace client',
    'about-cta-portfolio':'Voir le portfolio','about-cta-contact':'Contacter BUNKAIO',
    'ft-about':'À propos','ft-privacy':'Confidentialité et mentions légales','legal-title-privacy':'Politique de confidentialité et mentions légales','acc-h1':'Mon espace','ft-advice':'Conseils photo','ft-review':'Laisser un avis Google','cred-about-link':'Qui est derrière BUNKAIO ? →',
    'hours-label':'Horaires','hours-value':'Du lundi au samedi, de 9h à 18h','zone-label':'Zone d\'intervention','zone-value':'Basé à Montpellier — intervient à Béziers, Montpellier et Toulouse',
    'share-sub':'Vous avez travaillé avec BUNKAIO ? Votre avis Google aide d\'autres clients à nous trouver et à nous faire confiance.',
    'share-info-label':'Comment ça marche',
    'share-info-value':'Le bouton ouvre notre fiche Google : vous y déposez votre avis en moins d\'une minute.',
    'share-cta':'Laisser mon avis sur Google',
    'share-note':'Avis Google public. S\'il est partagé sur ce site, il pourra être anonymisé.',
    'share-note-short':'Avis Google, anonymisable si partagé',
    'share-specialty-label':'Prestation concernée *',
    'share-specialty-opt0':'Sélectionnez…',
    'share-specialty-opt1':'Portrait extérieur',
    'share-specialty-opt2':'Photo produits',
    'share-specialty-opt3':'Campagne corporate',
    'share-specialty-opt4':'Événementiel',
    'share-specialty-opt5':'Autre',
    'share-text-label':'Votre expérience *',
    'share-btn':'Envoyer mon témoignage',
    'share-success-title':'Merci pour votre retour',
    'share-success-text':'Votre témoignage a bien été reçu. Nous vous recontacterons si nous souhaitons le publier.',
    'trust-label':'Ils ont fait confiance à BUNKAIO',
    'testi1-tag':'Portrait extérieur',
    'testi1-text':'Je redoutais la séance, comme beaucoup. Bunkaio a pris le temps qu\'il fallait pour que j\'oublie l\'appareil — les photos ne ressemblent à aucune photo de profil que j\'ai eue avant. J\'y ressemble enfin.',
    'testi1-role':'Consultant indépendant · Aix-en-Provence',
    'testi2-tag':'Photo produits',
    'testi2-text':'J\'avais peur que mes bijoux paraissent froids en photo. C\'est l\'inverse qui s\'est produit — chaque pièce a l\'air presque vivante. Mes clientes me disent qu\'elles ont "senti" la matière avant même d\'ouvrir le colis.',
    'testi2-role':'Fondatrice · Atelier Maren, joaillerie, Paris',
    'testi3-tag':'Campagne corporate',
    'testi3-text':'Personne dans l\'équipe n\'aime être pris en photo. Bunkaio a réussi à capturer 40 personnes qui n\'ont jamais eu l\'air aussi naturelles. Notre rapport annuel a enfin une âme.',
    'testi3-role':'Directeur de la communication · Lyon',
    'testi4-tag':'Événementiel',
    'testi4-text':'200 invités, une seule soirée, aucun droit à l\'erreur. Bunkaio était partout sans jamais se faire remarquer. Le lendemain matin, tout le monde avait déjà ses photos — c\'est rare, et ça change tout.',
    'testi4-role':'Chargée d\'événementiel · Bordeaux',
    'testi5-tag':'Portrait extérieur',
    'testi5-text':'On a marché dans le vieux Lyon pendant une heure, sans jamais vraiment poser. Le résultat est le portrait le plus honnête qu\'on ait jamais fait de moi. Mes proches n\'arrêtent pas de me le dire.',
    'testi5-role':'Coach en reconversion · Lyon',
    'testi6-tag':'Photo produits',
    'testi6-text':'On avait déjà fait photographier nos produits ailleurs, sans grande conviction. Avec Bunkaio, on a enfin compris pourquoi certaines marques donnent envie et d\'autres non. C\'est une question de lumière, de patience, de regard.',
    'testi6-role':'Co-fondateur · Marque de cosmétiques bio, Nantes',
    'testi7-tag':'Campagne corporate',
    'testi7-text':'On voulait éviter les clichés habituels — costumes figés, sourires forcés. Le résultat raconte vraiment qui on est en tant qu\'entreprise, pas seulement ce qu\'on fait.',
    'testi7-role':'Responsable RH · PME industrielle, Toulouse',
    'testi8-tag':'Événementiel',
    'testi8-text':'Ce que j\'ai préféré, c\'est n\'avoir jamais eu à diriger qui que ce soit. Les meilleurs moments de la soirée ont été capturés sans qu\'on s\'en aperçoive. C\'est ça, la vraie différence.',
    'testi8-role':'Organisateur d\'événements d\'entreprise · Marseille',
    'p-who':'Qui peut devenir Partenaire Fondateur\u00a0?',
    'p-who-text':'Le programme Partenaires Fondateurs est réservé aux entreprises et professionnels dont les réalisations, les valeurs et l\'exigence correspondent à l\'univers Bunkaio. Nous recherchons notamment\u00a0:',
    'p-list-1':'Portrait & lifestyle — coiffeurs, maquilleurs, coachs en image, instituts, studios',
    'p-list-2':'Mode & mannequins — créateurs, agences de mannequins, stylistes, bijoutiers',
    'p-list-3':'Commercial & produits — marques, artisans, cosmétique, restaurateurs, agences',
    'p-list-4':'Événementiel — organisateurs, lieux de réception, traiteurs, décorateurs, animation',
    'p-list-5':'Mariage & Lumen — wedding planners, domaines, fleuristes, créateurs de robes, traiteurs',
    'p-who-note':'Le programme n\'est pas ouvert à tous. Chaque candidature est étudiée individuellement afin de préserver la cohérence éditoriale de Bunkaio.',
    'p-benefits':'Les avantages du programme',
    'p-b1-title':'Une mise en lumière éditoriale.','p-b1-text':'Votre activité n\'est pas présentée comme une simple prestation : elle est racontée à travers une histoire, selon la méthode éditoriale Bunkaio — la Découverte, la Vision, le Défi, le Savoir-Faire, Mon Regard, la Révélation.',
    'p-b2-title':'Une visibilité renforcée.','p-b2-text':'Présence privilégiée sur le site Bunkaio, les réseaux sociaux et les futurs supports éditoriaux de la marque.',
    'p-b3-title':'Une relation privilégiée.','p-b3-text':'Accès prioritaire aux disponibilités, offres préférentielles de lancement et collaboration sur le long terme.',
    'p-b4-title':'Une appartenance à un écosystème.','p-b4-text':'Rejoindre Bunkaio, c\'est intégrer un cercle de professionnels partageant l\'exigence, le goût du détail et l\'amour du travail bien fait.',
    'p-places':'Les places disponibles',
    'p-places-text':'Afin de préserver la qualité des collaborations, le nombre de partenaires fondateurs est volontairement limité\u00a0: 10 places par univers (portrait & lifestyle, mode & mannequins, commercial & produits, événementiel, mariage & Lumen), soit un maximum de <strong>60 partenaires fondateurs</strong> sur l\'ensemble du territoire.',
    'p-places-note':'Une fois ce quota atteint, les nouvelles candidatures seront placées sur liste d\'attente.',
    'p-process':'Le processus de sélection',
    'p-step1':'<strong>Étape 1 — Présentation du projet.</strong> Le candidat complète le questionnaire Bunkaio et présente son activité, ses réalisations, ses objectifs et son univers.',
    'p-step2':'<strong>Étape 2 — Étude de la candidature.</strong> Chaque projet est analysé selon la qualité des réalisations, la cohérence avec l\'univers Bunkaio, le potentiel éditorial et les valeurs de l\'entreprise.',
    'p-step3':'<strong>Étape 3 — Réponse.</strong> Projet sélectionné, projet compatible (collaboration ponctuelle) ou projet réorienté vers une autre solution, notamment via Agency Nascimento.',
    'p-step4':'<strong>Étape 4 — Lancement.</strong> Onboarding personnalisé, feuille de route éditoriale et accompagnement adapté à votre activité.',
    'p-cta-title':'Rejoindre le réseau de partenaires BUNKAIO',
    'p-cta-text':'Bunkaio n\'a pas vocation à travailler avec tout le monde. Nous recherchons des projets qui ont quelque chose à raconter. Si vous pensez que votre histoire mérite d\'être racontée, nous serons heureux de la découvrir.',
    'p-cta-btn':'Candidater',
    'ptab-program':'Programme Partenaires','ptab-apply':'Candidater','ptab-collab':'Collaboration',
    'apply-title':'Candidature — Devenir partenaire','apply-benefits-label':'Ce que vous obtenez en devenant partenaire',
    'apply-sub':'Complétez ce formulaire pour candidater au programme Partenaires Fondateurs. Chaque candidature est étudiée individuellement — réponse personnalisée sous 5 jours ouvrés.',
    'apply-who-label':'Qui peut candidater',
    'apply-who-value':'Les entreprises et professionnels dont les réalisations correspondent à l\'univers Bunkaio — portrait & lifestyle, mode & mannequins, commercial & produits, événementiel, mariage & Lumen.',
    'apply-eval-label':'Ce qui est évalué',
    'apply-eval-value':'La qualité de vos réalisations et la cohérence avec la ligne éditoriale Bunkaio. 10 places par univers, 60 partenaires fondateurs au total.',
    'apply-delay-value':'Sous 5 jours ouvrés.',
    'apply-web-label':'Site web / réseaux sociaux *',
    'apply-sector-label':'Votre type de prestataire *',
    'apply-sector-opt1':'Portrait & lifestyle','apply-sector-opt2':'Mode & mannequins','apply-sector-opt3':'Commercial & produits','apply-sector-opt4':'Événementiel','apply-sector-opt5':'Mariage & Lumen',
    'apply-sector-error':'Sélectionnez votre type de prestataire ci-dessus.',
    'apply-project-label':'Présentez votre activité et vos réalisations *',
    'apply-btn':'Envoyer ma candidature',
    'apply-success-title':'Candidature envoyée',
    'apply-success-text':'Merci pour votre candidature. Nous l\'étudions selon notre processus de sélection et revenons vers vous sous 5 jours ouvrés.',
    'partner-redirect-title':'Vous êtes aussi un professionnel dont le travail mérite d\'être raconté ?',
    'partner-redirect-text':'BUNKAIO sélectionne chaque année un nombre limité de Partenaires Fondateurs — portrait, mode, commercial, événementiel, mariage. Découvrez le programme et candidatez.',
    'partner-redirect-btn':'Découvrir le programme partenaires',
    'collab-title':'Proposer une collaboration',
    'collab-sub':'Marque, lieu, média, autre créateur·rice — BUNKAIO est ouvert aux collaborations qui ont du sens avec son univers, en dehors de ses prestations sur-mesure habituelles.',
    'collab-select-label':'Une sélection au cas par cas',
    'collab-select-value':'BUNKAIO se réserve le choix de ses collaborations : chaque proposition est étudiée individuellement selon le projet, sa cohérence avec notre univers et nos disponibilités du moment. Vous recevez une réponse personnalisée, y compris en cas de refus.',
    'collab-delay-label':'Délai de réponse','collab-delay-value':'Sous 5 jours ouvrés.',
    'collab-web-label':'Site web / réseaux sociaux',
    'collab-type-label':'Type de collaboration *',
    'collab-type-opt1':'Partenariat de marque','collab-type-opt2':'Échange lieu / prestation','collab-type-opt3':'Co-création avec un·e créateur·rice','collab-type-opt4':'Relation presse / média','collab-type-opt5':'Autre',
    'collab-type-error':'Sélectionnez un type de collaboration ci-dessus.',
    'collab-project-label':'Présentez votre projet *',
    'collab-btn':'Envoyer ma proposition',
    'collab-success-title':'Proposition envoyée',
    'collab-success-text':'Merci pour votre proposition. Nous l\'étudions et revenons vers vous sous 5 jours ouvrés.',
    'footer-claim':'Photographe professionnel — des images premium en HD qui mettent en valeur vos projets.',
    'access-client':'Accès client','access-partner':'Accès partenaire','nav-connect':'Connexion','nav-account-client':'Espace client','nav-account-partner':'Espace partenaire',
    'login-title-client':'Espace client','login-title-partner':'Espace partenaire',
    'login-title':'Espace client',
    'login-sub':'Connectez-vous avec votre email et le code d\'accès qui vous a été transmis par BUNKAIO.',
    'tab-client':'Client','tab-partner':'Partenaire',
    'login-code':'Code d\'accès *','login-btn':'Se connecter',
    'login-error':'Identifiants introuvables. Vérifiez votre email et votre code d\'accès, ou créez un compte ci-dessous.',
    'login-no-account':'Pas encore de compte\u00a0?','login-create':'Créer un compte',
    'register-info':'Complétez ce formulaire : votre demande nous est transmise directement et vous recevrez votre <strong>code d\'accès personnel par email sous 24h</strong>.',
    'register-activity':'Votre activité *','register-btn':'Demander mon accès',
    'register-error':'Merci de remplir tous les champs obligatoires.',
    'register-has-account':'Déjà un compte\u00a0?','register-login':'Se connecter',
    'register-success-title':'Demande envoyée',
    'register-success-text':'Votre demande de création de compte a bien été transmise. Vous recevrez votre code d\'accès personnel par email sous 24 heures.',
    'logout':'Déconnexion',
    'acc-client-badge':'Espace client','acc-partner-badge':'Espace partenaire',
    'acc-orders':'Mes commandes','acc-subs':'Mes abonnements','acc-payments':'Mes paiements','acc-factures':'Mes factures','acc-portfolio':'Mon portfolio','acc-infos':'Mes informations',
    'acc-subs-empty-title':'Aucun abonnement actif',
    'acc-subs-empty-text':'Découvrez Studio Continu : nos formules d\'abonnement mensuel pour un suivi photo et vidéo continu, avec un tarif préférentiel sur toutes les options.',
    'acc-subs-discover-btn':'Découvrir Studio Continu',
    'acc-subs-since':'Abonné depuis le','acc-subs-next':'Prochaine facture le','acc-subs-month':'/mois',
    'acc-subs-included':'Inclus ce mois-ci','acc-subs-usage':'Utilisation du mois en cours',
    'acc-subs-manage-title':'Besoin d\'ajuster votre abonnement ?',
    'acc-subs-manage-text':'Mettre en pause, résilier ou changer de formule — écrivez-nous directement.',
    'acc-subs-manage-btn':'Nous écrire',
    'acc-subs-upsell-title':'Un projet ponctuel en plus de votre abonnement ?',
    'acc-subs-upsell-text':'Vos options supplémentaires sont au tarif partenaire (-20%).',
    'acc-subs-upsell-btn':'Estimer un projet',
    'acc-upsell-title':'Un nouveau projet en tête ?',
    'acc-upsell-text':'Estimez votre prochain projet en quelques minutes.',
    'acc-upsell-btn':'Estimer mon projet',
    'acc-moodboards':'Mes moodboards',
    'acc-partenariat':'Mon partenariat',
    'partner-no-sector':'Secteur non renseigné',
    'partner-since':'Partenaire Fondateur depuis le',
    'partner-pending-sub':'Candidature en cours d\'étude',
    'partner-statut-attente':'En attente',
    'partner-article-label':'Votre mise en lumière éditoriale',
    'partner-article-link':'Voir votre article',
    'partner-benefits-label':'Les avantages du programme',
    'partner-places-label':'Places disponibles',
    'mb-toolbar-text':'Un moodboard par shooting pour partager votre vision avec l\'équipe Bunkaio — direction artistique, ambiance, inspirations.',
    'mb-new-btn':'Nouveau moodboard',
    'mb-empty-title':'Aucun moodboard pour le moment',
    'mb-empty-text':'Créez votre premier moodboard pour exprimer vos idées et aider l\'équipe Bunkaio à visualiser votre projet avant le shooting.',
    'mb-ref-future':'Projet à venir — pas encore réservé',
    'mb-back':'← Retour à mes moodboards',
    'mb-wizard-title-new':'Nouveau moodboard',
    'mb-wizard-title-edit':'Modifier le moodboard',
    'mb-step1-title':'Votre projet',
    'mb-step1-sub':'Donnez un nom à ce moodboard et reliez-le à l\'un de vos shootings, ou laissez "Projet à venir" si vous n\'avez pas encore réservé.',
    'mb-field-titre':'Titre du moodboard *',
    'mb-field-titre-ph':'Ex. Shooting produit — automne',
    'mb-field-commande':'Shooting lié',
    'mb-field-type-projet':'Type de projet',
    'mb-type-particulier':'Particulier',
    'mb-type-marque':'Marque / Entreprise',
    'mb-field-products':'Collection / produits à présenter',
    'mb-field-products-sub':'Listez les pièces à mettre en avant lors du shooting — vêtements, produits cosmétiques, accessoires…',
    'mb-product-add-btn':'+ Ajouter un produit',
    'mb-product-nom-ph':'Nom de la pièce / du produit',
    'mb-product-lien-ph':'Lien ou référence — optionnel',
    'mb-step-collab-title':'Collaborateurs & prestataires',
    'mb-step-collab-sub':'Si d\'autres prestataires sont impliqués dans ce projet (styliste, maquilleuse, traiteur, lieu…), indiquez-les ici avec leur type de prestataire.',
    'mb-collab-add-btn':'+ Ajouter un collaborateur',
    'mb-collab-nom-ph':'Nom du prestataire',
    'mb-collab-domaine-ph':'Type de prestataire…',
    'mb-collab-role-ph':'Rôle — optionnel (ex. maquilleuse, traiteur)',
    'mb-step2-title':'Direction artistique',
    'mb-step2-sub':'Choisissez l\'orientation qui parle le plus à votre projet.',
    'mb-step3-title':'Ambiance',
    'mb-step3-sub':'Sélectionnez tous les mots qui résonnent avec votre vision — autant que vous voulez.',
    'mb-step4-title':'Palette de couleurs',
    'mb-step4-sub':'La gamme de teintes qui se rapproche le plus de ce que vous imaginez.',
    'mb-step5-title':'Inspirations',
    'mb-step5-sub':'Un tableau Pinterest et/ou des liens vers des visuels qui vous inspirent — Instagram, un site, une image trouvée en ligne.',
    'mb-field-pinterest':'Lien vers votre tableau Pinterest — optionnel',
    'mb-field-refs':'Autres liens d\'inspiration',
    'mb-ref-url-ph':'Lien (Instagram, image, site…)',
    'mb-ref-note-ph':'Note — optionnel',
    'mb-ref-add-btn':'+ Ajouter un lien',
    'mb-step6-title':'Votre vision',
    'mb-step6-sub':'Décrivez en quelques mots l\'ambiance recherchée, ce que vous aimez, ce que vous voulez éviter.',
    'mb-field-notes-ph':'Décrivez votre vision en quelques mots…',
    'mb-error':'Donnez au moins un titre à votre moodboard.',
    'mb-save-btn':'Enregistrer les modifications',
    'mb-create-btn':'Créer ce moodboard',
    'mb-save-error':'Erreur lors de l\'enregistrement. Réessayez ou écrivez à contact@bunkaio.com',
    'mb-edit-btn':'Modifier',
    'mb-pinterest-link':'Voir le tableau Pinterest',
    'mb-comments-title':'Échanges avec l\'équipe Bunkaio',
    'mb-comments-empty':'Aucun commentaire pour le moment.',
    'mb-comment-ph':'Ajouter un commentaire…',
    'mb-comment-link-ph':'Lien à joindre — optionnel',
    'mb-comment-btn':'Envoyer',
    'th-date':'Date','th-service':'Prestation','th-amount':'Montant','th-status':'Statut','th-ref':'Référence','th-method':'Méthode','th-invoice':'Facture','th-invoice-num':'Numéro',
    'empty-orders':'Aucune commande pour le moment. Vos prestations apparaîtront ici dès leur validation.',
    'empty-payments':'Aucun paiement enregistré pour le moment.',
    'empty-factures':'Aucune facture pour le moment.',
    'acc-invoice-view':'Voir',
    'lr-title':'Votre portfolio sur Adobe Lightroom',
    'lr-text':'Votre album est hébergé sur Adobe Lightroom : il vous suffit de créer un compte Adobe Lightroom pour l\'ouvrir. Vos photos restent accessibles à tout moment ; la post-production reste interactive, des ajustements peuvent être apportés si besoin, et vous exportez vos visuels dans les formats de votre choix en toute autonomie. L\'usage de vos visuels suit les droits cédés négociés dans votre devis signé.',
    'lr-locked':'Votre album s\'ouvre dès le règlement du solde : vous recevez alors le lien par email et il apparaît ici, de façon permanente.',
    'lr-btn':'Accéder à Lightroom',
    'acc-step-devis':'Devis confirmé','acc-step-shoot':'Shooting planifié','acc-step-post':'Post-production','acc-step-livre':'Livré',
    'acc-help-title':'Une question sur votre projet ?','acc-help-sub':'Votre interlocuteur BUNKAIO vous répond directement.','acc-help-btn':'Nous écrire',
    'acc-info-forme':'Forme juridique *','acc-forme-choose':'Choisir…','acc-forme-ei':'Entreprise individuelle / micro-entreprise','acc-forme-sas':'SAS / SASU','acc-forme-sarl':'SARL / EURL','acc-forme-sa':'SA','acc-forme-asso':'Association','acc-forme-autre':'Autre',
    'acc-info-status':'Statut de votre espace','acc-info-valid':'Espace validé','acc-info-incomplete':'Informations à compléter',
    'acc-info-banner':'Pour valider votre espace, complétez vos informations : elles servent à établir vos devis et vos factures.',
    'acc-info-profile':'Type de client *','acc-info-profile-part':'Particulier','acc-info-profile-pro':'Professionnel (société, indépendant, association)',
    'acc-info-name-part':'Nom et prénom *','acc-info-name-pro':'Raison sociale *','acc-info-contact':'Contact (prénom et nom) *',
    'acc-info-phone':'Téléphone *','acc-info-street':'Adresse (numéro et rue) *','acc-info-zip':'Code postal *','acc-info-city':'Ville *','acc-info-country':'Pays *',
    'acc-info-siret-opt':'SIRET — optionnel','acc-info-siret-req':'SIRET *','acc-info-vat':'N° de TVA intracommunautaire — optionnel',
    'acc-info-req-note':'Ces informations servent à établir vos devis et vos factures. Tous les champs marqués d\'un * sont obligatoires pour valider votre espace.',
    'acc-info-address':'Adresse de facturation *',
    'acc-info-not-set':'Non renseigné',
    'acc-info-edit-btn':'Modifier mes informations',
    'acc-info-save-btn':'Enregistrer les modifications',
    'acc-info-cancel-btn':'Annuler',
    'acc-info-note':'Pour changer votre email de connexion, contactez-nous directement.',
    'acc-info-success-title':'Modifications enregistrées',
    'acc-info-success-text':'Vos informations ont bien été mises à jour.',
    'comm-kicker':'Pour aller plus loin',
    'comm-title':'Besoin d\'accompagnement en communication digitale\u00a0?',
    'comm-text':'Notre partenaire Agency Nascimento accompagne les clients BUNKAIO au-delà de l\'image : création de site web, référencement (SEO), publicité en ligne (SEA, Ads), stratégie réseaux sociaux et analyse de données.',
    'comm-check':'Je suis potentiellement intéressé(e)',
    'comm-redirect-title':'Votre communication digitale, avec notre partenaire',
    'comm-redirect-text':'Vous avez exprimé un intérêt pour des services de communication complémentaires. Agency Nascimento, partenaire de BUNKAIO, accompagne nos clients sur la création de site, le SEO, la publicité en ligne et les réseaux sociaux. Découvrez leur approche.',
    'comm-redirect-btn':'Découvrir Agency Nascimento',
    'home-claim-kicker':'Le studio',
    'home-claim-text':'Nous ne documentons pas des projets. Nous révélons ce qui les rend uniques.',
    'ft-services':'Services','ft-studio':'Le studio',
    'footer-claim2':'Photographe mobile · Béziers · Montpellier · Toulouse',
    'stab-catalogue':'Catalogue & prix','stab-devis':'Devis & déroulé',
    'p-trust':'Ils nous ont fait confiance',
    'process-payment-info':'<strong>Modalités de paiement :</strong> 30 % à la commande à la signature du devis, solde à la livraison des livrables. Chaque versement est réglable en 3x sans frais avec Klarna, par carte bancaire.',
    'process-cancel-info':'<strong>Annulation :</strong> une fois le devis validé, l\'acompte de 30 % versé à la commande reste acquis à BUNKAIO et n\'est pas remboursé en cas d\'annulation de votre part.',
    'process-delay-info':'Les délais indiqués sur chaque formule démarrent à la date du shooting.',
    'process-rights-info':'L\'ensemble des droits d\'utilisation des visuels livrés vous sont cédés pour une utilisation commerciale sans limite de durée.',
    'pay-flex-kicker':'Paiement flexible',
    'pay-flex-text':'<strong>3x sans frais avec Klarna</strong>, carte bancaire — ou en 2 fois, acompte 30 % puis solde. Sans aucun frais supplémentaire.',
    'pay-flex-pill-klarna':'3x sans frais',
    'pay-flex-pill-card':'Carte bancaire',
    'pay-flex-pill-split':'Acompte + solde',
    'ph-name':'Votre nom ou société',
    'ph-email':'vous@societe.fr',
    'ph-phone':'06 00 00 00 00',
    'ph-project':'Décrivez votre projet en quelques mots…',
    'ph-message':'Votre message…',
    'ph-code':'BKO-0000',
    'ph-activity':'Décrivez votre activité en quelques mots…',
    'ph-ct-name':'Votre nom ou société',
    'ph-ct-email':'vous@societe.fr',
    'ph-reg-name':'Votre nom ou société',
    'ph-reg-email':'vous@societe.fr',
    'ph-apply-name':'Votre nom ou votre société',
    'ph-apply-project':'Décrivez votre activité, vos réalisations marquantes, ce que vous recherchez dans ce partenariat…',
    'ph-collab-name':'Votre nom ou votre marque',
    'ph-collab-project':'Décrivez votre proposition : contexte, ce que vous imaginez, ce que vous proposez en échange…',
    'skip-link':'Aller au contenu'
  },
  en: {
    'estimate':'Quote','services':'Services','portfolio':'Portfolio','drone':'4K Drone','contact':'Contact','partners':'Collaboration','nav-legal':'FAQ',
    'hero-kicker':'Professional photographer · Occitanie','cred-lead':'BUNKAIO is a mobile professional photography studio based in Montpellier: portrait sessions, professional portraits, fashion and models, product photography, events and the Lumen AI photobooth, in Béziers, Montpellier and Toulouse. Browse each <a href="/services/" data-nav="services">service and its rates</a>.','quiz-h1':'Online photo quote','hero-word1':'Estimate','hero-word2':'your','hero-word3':'project','start':'Estimate my project',
    'step-cat':'01 — Category','q-cat':'What is your field?','q-cat-sub':'Select the universe your project belongs to.',
    'step-prof':'02 — Profile','q-prof':'Which profile are you?','q-prof-sub':'Tell us who you are so we can understand exactly what you need.',
    'step-tier':'03 — Service level','q-tier':'Which level of service?',
    'step-recap':'04 — Your package','q-recap':'What\'s included','q-recap-sub':'The full details of your package, plus options to take it further.',
    'options':'Additional options',
    'step-coords':'05 — Your details','q-coords':'Your details','q-coords-sub':'Every request is reviewed personally. We reply within 48 hours.',
    'name-label':'Name / Company *','email-label':'Email *','phone-label':'Phone','phone-label-opt':'Phone — optional','project-label':'Your project *','message-label':'Message *',
    'city-label':'Session city *','city-ph':'E.g. Béziers, Nîmes, Toulouse…','city-hint':'Travel is estimated automatically and added to your quote.','delay-label':'Desired timeline *','delay-opt-select':'Select…','delay-opt-urgent':'Urgent (under 2 weeks)','delay-opt-1m':'Within a month','delay-opt-2-3m':'2 to 3 months','delay-opt-flex':'Flexible / no constraint',
    'back':'← Back','continue':'Next →','next':'Next →','submit':'Confirm my quote request',
    'quiz-back':'Back','quiz-home':'Home',
    'success-label':'Request received','success-title':'Your request has been sent',
    'success-text1':'Thank you for your trust. Your quote request is in our hands: it will be carefully reviewed and you will receive a reply within <strong>48 hours</strong>.',
    'success-text2':'Every request is assessed individually and is only accepted if it aligns with <strong>BUNKAIO\'s editorial line</strong>. We work exclusively with projects that resonate with our universe — this is what guarantees the quality of every collaboration.',
    'success-text3':'Once your quote is confirmed, head to your client area: you\'ll be able to build your <strong>moodboard</strong> there to share your vision — art direction, mood, inspirations — so we arrive on the day perfectly aligned with your project.',
    'home-btn':'Back to home','see-portfolio':'View the full portfolio',
    'pf-cta-title':'Ready to bring your project to life?','pf-cta-sub':'Every collaboration starts with an estimate — simple, quick, no commitment.','pf-cta-btn':'Get my personalised quote','footer-cta-headline':'Got a project in mind?',
    'aria-next':'Next','aria-prev':'Previous','aria-back':'Back','aria-menu':'Menu','aria-home':'Home',
    'svc-reserve':'Book my session','studio-reserve':'Book my session online','svc-discover':'Explore each service','ft-discover':'Explore each service','scroll-hint':'Scroll','services-title':'Photography services & rates','services-sub':'Professional photographer in Béziers, Montpellier and Toulouse: premium, high-definition images that showcase your project. Our services and rates, by universe.',
    'svc-all':'All','svc-cta':'Get a quote for this →','svc-sub-label':'Monthly plan',
    'svc-trust1-title':'Reply within 48h','svc-trust1-text':'Every request is reviewed and handled personally — never an automated reply.',
    'svc-trust2-title':'A guided journey','svc-trust2-text':'From request to delivery, 7 clear steps — including building your moodboard to share your vision — <span class="svc-trust-link" onclick="goToProcess()">see the full process</span>.',
    'svc-trust3-title':'Your rights guaranteed','svc-trust3-text':'The delivered visuals belong to you, with usage terms clearly defined from the quote onward.',
    'svc-trust4-title':'One single point of contact','svc-trust4-text':'From the first exchange to final delivery, you always speak with the same person.',
    'drone-title':'4K Drone & video',
    'drone-intro':'Behind every aerial image lies proper training, official certifications and carefully chosen equipment. Here is what guarantees the quality — and the legality — of every one of our productions.',
    'nav-soon':'Soon',
    'drone-soon-title':'This section is coming soon',
    'drone-soon-sub':'Our drone services are being deployed. Check back soon.',
    'drone-placeholder-title':'Coming soon',
    'drone-placeholder-text':'We\'re preparing this service with the same care as the rest of the studio — plans, certifications and aerial portfolio will be online soon. In the meantime, let\'s estimate your project.',
    'cred-label':'Training, certifications & equipment',
    'cred1-title':'Advanced Diploma in Photography — ETPA','cred1-text':'Higher education in photography at ETPA, one of France\'s leading photography schools. Full command of light, composition and post-production.',
    'cred2-title':'6 years of field experience','cred2-text':'Six years of photography in the field, working directly with subjects and real-world constraints: changing light, tight schedules, demanding results. An expertise sharpened with every assignment.',
    'cred3-title':'Certified drone pilot — A1/A3 & A2','cred3-text':'European open-category certifications (A1/A3 and A2) issued by the French civil aviation authority (DGAC). Every flight is declared, insured and fully compliant with current regulations.',
    'cred4-title':'Professional-grade equipment','cred4-text':'DJI Mavic 3 Pro drone — 4/3 Hasselblad sensor, 4K HDR video. Sony Alpha 7 III mirrorless body and G Master lenses for ground photography and video.',
    'gear-label':'Equipment','gear-cert':'Certified A1/A3 · A2',
    'drone-explore':'Explore our work',
    'portfolio-title':'Photography portfolio','portfolio-sub':'A selection of projects produced by the studio, organised by universe.',
    'contact-title':'Contact your photographer','contact-sub':'A question, a project, a collaboration? Write to us — we reply within 24 hours.',
    'company-label':'Company','follow-label':'Follow us','contact-btn':'Get in touch',
    'ct-success-title':'Message sent','ct-success-text':'Thank you for your message. We will get back to you within 24 hours.',
    'partners-title':'Partnership & collaboration',
    'legal-title':'FAQ: frequently asked questions',
    'legal-sub':'Answers to the most frequently asked questions, along with our commitments on data privacy and image/video usage rights.',
    'ctab-contact':'Contact','ctab-about':'About','vat-note':'Net prices: VAT not applicable (art. 293 B of the French Tax Code). The price shown is the price you pay, with nothing to add.','svr-kicker':'Our services','svr-title':'The right image for every project','svr-catalog':'See the full catalogue','svr-aria':'Our services',
    'legaltab-faq':'FAQ','legaltab-privacy':'Privacy policy','legaltab-cgv':'Terms of sale','legal-title-cgv':'General terms of sale','ft-cgv':'Terms of sale',
    'p-why':'Why Bunkaio exists',
    'p-why-1':'We live in a world where content keeps multiplying, yet stories are becoming rare. Every day, thousands of images are published and then forgotten.',
    'p-why-2':'And yet, behind every place, every object and every achievement lies a story that deserves to be told.',
    'p-why-3':'At Bunkaio, we believe the value of a project lies not only in its final result, but also in the vision, the challenges and the craftsmanship that brought it to life.',
    'p-mission':'We don\'t document projects. We reveal what makes them unique.',
    'reassure1-title':'Free quote within 48h',
    'reassure1-text':'No commitment, no credit card. You receive a clear, priced proposal in under 48 hours.',
    'reassure2-title':'Limited slots every month',
    'reassure2-text':'To guarantee quality on every project, we accept a limited number of bookings. Reserve your slot now.',
    'reassure3-title':'Your rights, clear from day one',
    'reassure3-text':'Your visuals belong to you. Usage terms defined in writing before every project — no surprises.',
    'reassure4-title':'A single point of contact',
    'reassure4-text':'From first contact to final delivery, you deal with the same person. No call centre, no subcontracting.',
    'cred-mini1':'Based in Montpellier — mobile in Béziers, Montpellier, Toulouse',
    'cred-mini2':'Professional photographer, ETPA graduate — BTS Photography 2018',
    'cred-mini3':'Professional-grade equipment',
    'cred-mini4':'8 years of experience · 200+ projects completed',
    'cred-faq-link':'Any questions? Check our FAQ →',
    'testi-share-btn':'Share my experience',
    'share-title':'Share my experience',
    'about-title':'Aya Nascimento, professional portrait photographer',
    'about-partner-h':'Are you an image, beauty or events professional?',
    'about-partner-p':'Hairstylists, make-up artists, stylists, agencies, wedding planners, venues: BUNKAIO offers a <a href="/collaboration/" data-nav="partners">partnership programme</a> with a permanent partner rate, collaborative missions and a professional network.',
    'about-cta-quote':'Estimate my project',
    'ct-extra-h':'To get a quick reply',
    'ct-extra-intro':'Please mention in your message:',
    'ct-extra-1':'the type of project (portrait, fashion, products, event…)',
    'ct-extra-2':'the desired date and place (Béziers, Montpellier, Toulouse or elsewhere)',
    'ct-extra-3':'the intended use of the photos (personal, social, website, advertising)',
    'ct-extra-4':'an indicative budget, if you have one',
    'ct-extra-links':'Prefer an instant estimate? Use the <a href="/devis/" data-nav="quiz">online quote</a> (2 minutes) or read the <a href="/faq/" data-nav="faq">FAQ</a>.',
    'about-sub':'The photographer behind BUNKAIO: premium, high-definition images that showcase your projects.',
    'about-h-bio':'One photographer, one eye',
    'about-p1':'Aya Nascimento is a professional portrait photographer, a graduate of ETPA (BTS Photography, 2018). She is the photographer of BUNKAIO.',
    'about-p2':'Specialised in fashion, product, corporate and event photography, she works with individuals, brands and companies, delivering premium high-definition images, carefully retouched.',
    'about-h-zone':'A mobile studio in Occitanie',
    'about-zone-text':'BUNKAIO is based in Montpellier and travels to you: no studio address, but shoots in Béziers, Montpellier and Toulouse. ' + TRAVEL_TXT.en.full,
    'about-stat1':'years of experience','about-stat2':'projects completed','about-stat3':'ETPA graduate · BTS Photography',
    'about-h-spec':'Specialities',
    'about-spec1':'Portrait & lifestyle','about-spec2':'Fashion, agencies and models','about-spec3':'Product & commercial photography','about-spec4':'Corporate & businesses','about-spec5':'Events & weddings (Lumen)',
    'about-h-method':'How it works',
    'about-step1':'Personalised quote within 48 hours','about-step2':'Shoot on the agreed date','about-step3':'Retouching and post-production','about-step4':'HD delivery in a private gallery, from your client area',
    'about-cta-portfolio':'See the portfolio','about-cta-contact':'Contact BUNKAIO',
    'ft-about':'About','ft-privacy':'Privacy and legal notice','legal-title-privacy':'Privacy policy and legal notice','acc-h1':'My space','ft-advice':'Photo advice','ft-review':'Leave a Google review','cred-about-link':'Who is behind BUNKAIO? →',
    'hours-label':'Opening hours','hours-value':'Monday to Saturday, 9am to 6pm','zone-label':'Service area','zone-value':'Based in Montpellier — works in Béziers, Montpellier and Toulouse',
    'share-sub':'Have you worked with BUNKAIO? Your Google review helps other clients find us and trust us.',
    'share-info-label':'How it works',
    'share-info-value':'The button opens our Google listing, where you can leave your review in under a minute.',
    'share-cta':'Leave my Google review',
    'share-note':'Public Google review. If it is shared on this site, it may be anonymised.',
    'share-note-short':'Google review, may be anonymised if shared',
    'share-specialty-label':'Service concerned *',
    'share-specialty-opt0':'Select…',
    'share-specialty-opt1':'Outdoor portrait',
    'share-specialty-opt2':'Product photography',
    'share-specialty-opt3':'Corporate campaign',
    'share-specialty-opt4':'Events',
    'share-specialty-opt5':'Other',
    'share-text-label':'Your experience *',
    'share-btn':'Send my testimonial',
    'share-success-title':'Thank you for your feedback',
    'share-success-text':'Your testimonial has been received. We will get back to you if we would like to publish it.',
    'trust-label':'They trusted BUNKAIO',
    'testi1-tag':'Outdoor portrait',
    'testi1-text':'I dreaded the session, like most people do. Bunkaio took exactly the time needed for me to forget the camera was there — these photos look nothing like any profile picture I\'ve had before. I finally recognise myself in them.',
    'testi1-role':'Independent consultant · Aix-en-Provence',
    'testi2-tag':'Product photography',
    'testi2-text':'I was afraid my jewellery would look cold in photos. The opposite happened — each piece feels almost alive. My customers tell me they could "feel" the material before even opening the box.',
    'testi2-role':'Founder · Atelier Maren, jewellery, Paris',
    'testi3-tag':'Corporate campaign',
    'testi3-text':'No one on the team likes having their photo taken. Bunkaio managed to capture 40 people who have never looked so natural. Our annual report finally has a soul.',
    'testi3-role':'Head of communications · Lyon',
    'testi4-tag':'Events',
    'testi4-text':'200 guests, one single evening, no room for error. Bunkaio was everywhere without ever being noticed. By the next morning, everyone already had their photos — that\'s rare, and it changes everything.',
    'testi4-role':'Event manager · Bordeaux',
    'testi5-tag':'Outdoor portrait',
    'testi5-text':'We walked through old Lyon for an hour, never really posing. The result is the most honest portrait anyone has ever taken of me. My friends keep telling me so.',
    'testi5-role':'Career transition coach · Lyon',
    'testi6-tag':'Product photography',
    'testi6-text':'We\'d had our products photographed elsewhere before, without much conviction. With Bunkaio, we finally understood why some brands make you want to buy and others don\'t. It\'s a matter of light, patience, and a certain eye.',
    'testi6-role':'Co-founder · Organic cosmetics brand, Nantes',
    'testi7-tag':'Corporate campaign',
    'testi7-text':'We wanted to avoid the usual clichés — stiff suits, forced smiles. The result truly tells who we are as a company, not just what we do.',
    'testi7-role':'HR manager · Industrial SME, Toulouse',
    'testi8-tag':'Events',
    'testi8-text':'What I appreciated most is that I never had to direct anyone. The best moments of the evening were captured without anyone noticing. That\'s the real difference.',
    'testi8-role':'Corporate event organiser · Marseille',
    'p-who':'Who can become a Founding Partner?',
    'p-who-text':'The Founding Partners programme is reserved for companies and professionals whose work, values and standards align with the Bunkaio universe. We are particularly looking for:',
    'p-list-1':'Portrait & lifestyle — hairstylists, make-up artists, image coaches, wellness studios, studios',
    'p-list-2':'Fashion & models — designers, model agencies, stylists, jewellers',
    'p-list-3':'Commercial & products — brands, artisans, cosmetics, restaurateurs, agencies',
    'p-list-4':'Events — planners, reception venues, caterers, decorators, entertainment',
    'p-list-5':'Weddings & Lumen — wedding planners, estates, florists, gown designers, caterers',
    'p-who-note':'The programme is not open to everyone. Every application is reviewed individually in order to preserve Bunkaio\'s editorial coherence.',
    'p-benefits':'Programme benefits',
    'p-b1-title':'An editorial spotlight.','p-b1-text':'Your work is not presented as a mere service: it is told as a story, following the Bunkaio editorial method — Discovery, Vision, Challenge, Craftsmanship, My Perspective, Revelation.',
    'p-b2-title':'Enhanced visibility.','p-b2-text':'A privileged presence on the Bunkaio website, our social channels and the brand\'s future editorial publications.',
    'p-b3-title':'A privileged relationship.','p-b3-text':'Priority access to our schedule, preferential launch rates and a long-term working relationship.',
    'p-b4-title':'Belonging to an ecosystem.','p-b4-text':'Joining Bunkaio means entering a circle of professionals who share the same high standards, eye for detail and love of work well done.',
    'p-places':'Available places',
    'p-places-text':'To preserve the quality of every collaboration, the number of founding partners is deliberately limited: 10 places per universe (portrait & lifestyle, fashion & models, commercial & products, events, weddings & Lumen), for a maximum of <strong>60 founding partners</strong> nationwide.',
    'p-places-note':'Once this quota is reached, new applications will be placed on a waiting list.',
    'p-process':'The selection process',
    'p-step1':'<strong>Step 1 — Presenting your project.</strong> The candidate completes the Bunkaio questionnaire and presents their activity, their work, their goals and their universe.',
    'p-step2':'<strong>Step 2 — Application review.</strong> Each project is assessed on the quality of its work, its fit with the Bunkaio universe, its editorial potential and the company\'s values.',
    'p-step3':'<strong>Step 3 — Response.</strong> Project selected, project compatible (one-off collaboration), or project redirected towards another solution, notably through Agency Nascimento.',
    'p-step4':'<strong>Step 4 — Launch.</strong> Personalised onboarding, an editorial roadmap and support tailored to your business.',
    'p-cta-title':'Join the BUNKAIO partner network',
    'p-cta-text':'Bunkaio was never meant to work with everyone. We look for projects that have something to say. If you believe your story deserves to be told, we would be delighted to discover it.',
    'p-cta-btn':'Apply',
    'ptab-program':'Partner Programme','ptab-apply':'Apply','ptab-collab':'Collaboration',
    'apply-title':'Application — Become a partner','apply-benefits-label':'What you get as a partner',
    'apply-sub':'Fill in this form to apply to the Founding Partners programme. Every application is reviewed individually — a personal reply within 5 working days.',
    'apply-who-label':'Who can apply',
    'apply-who-value':'Companies and professionals whose work aligns with the Bunkaio universe — portrait & lifestyle, fashion & models, commercial & products, events, weddings & Lumen.',
    'apply-eval-label':'What we assess',
    'apply-eval-value':'The quality of your work and its fit with the Bunkaio editorial line. 10 places per universe, 60 founding partners in total.',
    'apply-delay-value':'Within 5 working days.',
    'apply-web-label':'Website / social media *',
    'apply-sector-label':'Your provider type *',
    'apply-sector-opt1':'Portrait & lifestyle','apply-sector-opt2':'Fashion & models','apply-sector-opt3':'Commercial & products','apply-sector-opt4':'Events','apply-sector-opt5':'Weddings & Lumen',
    'apply-sector-error':'Please select your provider type above.',
    'apply-project-label':'Tell us about your business and your work *',
    'apply-btn':'Send my application',
    'apply-success-title':'Application sent',
    'apply-success-text':'Thank you for your application. We\'re reviewing it as part of our selection process and will get back to you within 5 working days.',
    'partner-redirect-title':'Are you also a professional whose work deserves to be told?',
    'partner-redirect-text':'Every year BUNKAIO selects a limited number of Founding Partners — portrait, fashion, commercial, events, weddings. Discover the programme and apply.',
    'partner-redirect-btn':'Discover the partner programme',
    'collab-title':'Propose a collaboration',
    'collab-sub':'Brand, venue, media, another creator — BUNKAIO is open to collaborations that make sense with its universe, outside of its usual bespoke services.',
    'collab-select-label':'Reviewed case by case',
    'collab-select-value':'BUNKAIO reserves the choice of its collaborations: each proposal is reviewed individually based on the project, its fit with our universe and our current availability. You\'ll receive a personal reply either way.',
    'collab-delay-label':'Response time','collab-delay-value':'Within 5 working days.',
    'collab-web-label':'Website / social media',
    'collab-type-label':'Type of collaboration *',
    'collab-type-opt1':'Brand partnership','collab-type-opt2':'Venue / service exchange','collab-type-opt3':'Co-creation with another creator','collab-type-opt4':'Press / media','collab-type-opt5':'Other',
    'collab-type-error':'Please select a collaboration type above.',
    'collab-project-label':'Tell us about your project *',
    'collab-btn':'Send my proposal',
    'collab-success-title':'Proposal sent',
    'collab-success-text':'Thank you for your proposal. We\'re reviewing it and will get back to you within 5 working days.',
    'footer-claim':'Professional photographer — premium HD images that showcase your projects.',
    'access-client':'Client area','access-partner':'Partner area','nav-connect':'Sign in','nav-account-client':'Client area','nav-account-partner':'Partner area',
    'login-title-client':'Client area','login-title-partner':'Partner area',
    'login-title':'Client area',
    'login-sub':'Sign in with your email and the access code provided to you by BUNKAIO.',
    'tab-client':'Client','tab-partner':'Partner',
    'login-code':'Access code *','login-btn':'Sign in',
    'login-error':'Account not found. Please check your email and access code, or create an account below.',
    'login-no-account':'No account yet?','login-create':'Create an account',
    'register-info':'Fill in this form: your request is sent to us directly and you will receive your <strong>personal access code by email within 24 hours</strong>.',
    'register-activity':'Your business *','register-btn':'Request my access',
    'register-error':'Please fill in all required fields.',
    'register-has-account':'Already have an account?','register-login':'Sign in',
    'register-success-title':'Request sent',
    'register-success-text':'Your account request has been sent successfully. You will receive your personal access code by email within 24 hours.',
    'logout':'Sign out',
    'acc-client-badge':'Client area','acc-partner-badge':'Partner area',
    'acc-orders':'My orders','acc-subs':'My subscriptions','acc-payments':'My payments','acc-factures':'My invoices','acc-portfolio':'My portfolio','acc-infos':'My information',
    'acc-subs-empty-title':'No active subscription',
    'acc-subs-empty-text':'Discover Studio Continu: our monthly subscription packages for ongoing photo and video coverage, with a preferential rate on every add-on.',
    'acc-subs-discover-btn':'Discover Studio Continu',
    'acc-subs-since':'Subscribed since','acc-subs-next':'Next invoice on','acc-subs-month':'/month',
    'acc-subs-included':'Included this month','acc-subs-usage':'Current month usage',
    'acc-subs-manage-title':'Need to adjust your subscription?',
    'acc-subs-manage-text':'Pause, cancel or change plan — write to us directly.',
    'acc-subs-manage-btn':'Write to us',
    'acc-subs-upsell-title':'A one-off project alongside your subscription?',
    'acc-subs-upsell-text':'Your add-ons are billed at partner rate (-20%).',
    'acc-subs-upsell-btn':'Estimate a project',
    'acc-upsell-title':'A new project in mind?',
    'acc-upsell-text':'Estimate your next project in a few minutes.',
    'acc-upsell-btn':'Estimate my project',
    'acc-moodboards':'My moodboards',
    'acc-partenariat':'My partnership',
    'partner-no-sector':'Sector not set',
    'partner-since':'Founding Partner since',
    'partner-pending-sub':'Application under review',
    'partner-statut-attente':'Pending',
    'partner-article-label':'Your editorial spotlight',
    'partner-article-link':'View your article',
    'partner-benefits-label':'Programme benefits',
    'partner-places-label':'Available places',
    'mb-toolbar-text':'One moodboard per shoot to share your vision with the Bunkaio team — art direction, mood, inspirations.',
    'mb-new-btn':'New moodboard',
    'mb-empty-title':'No moodboard yet',
    'mb-empty-text':'Create your first moodboard to express your ideas and help the Bunkaio team visualise your project before the shoot.',
    'mb-ref-future':'Upcoming project — not booked yet',
    'mb-back':'← Back to my moodboards',
    'mb-wizard-title-new':'New moodboard',
    'mb-wizard-title-edit':'Edit moodboard',
    'mb-step1-title':'Your project',
    'mb-step1-sub':'Name this moodboard and link it to one of your shoots, or leave "Upcoming project" if you haven\'t booked yet.',
    'mb-field-titre':'Moodboard title *',
    'mb-field-titre-ph':'E.g. Product shoot — autumn',
    'mb-field-commande':'Linked shoot',
    'mb-field-type-projet':'Project type',
    'mb-type-particulier':'Individual',
    'mb-type-marque':'Brand / Business',
    'mb-field-products':'Collection / products to feature',
    'mb-field-products-sub':'List the pieces to feature during the shoot — clothing, cosmetic products, accessories…',
    'mb-product-add-btn':'+ Add a product',
    'mb-product-nom-ph':'Product / piece name',
    'mb-product-lien-ph':'Link or reference — optional',
    'mb-step-collab-title':'Collaborators & vendors',
    'mb-step-collab-sub':'If other vendors are involved in this project (stylist, makeup artist, caterer, venue…), list them here with their domain.',
    'mb-collab-add-btn':'+ Add a collaborator',
    'mb-collab-nom-ph':'Vendor name',
    'mb-collab-domaine-ph':'Provider type…',
    'mb-collab-role-ph':'Role — optional (e.g. makeup artist, caterer)',
    'mb-step2-title':'Art direction',
    'mb-step2-sub':'Pick the direction that speaks most to your project.',
    'mb-step3-title':'Mood',
    'mb-step3-sub':'Select every word that resonates with your vision — as many as you like.',
    'mb-step4-title':'Colour palette',
    'mb-step4-sub':'The range of tones closest to what you have in mind.',
    'mb-step5-title':'Inspirations',
    'mb-step5-sub':'A Pinterest board and/or links to visuals that inspire you — Instagram, a website, an image found online.',
    'mb-field-pinterest':'Link to your Pinterest board — optional',
    'mb-field-refs':'Other inspiration links',
    'mb-ref-url-ph':'Link (Instagram, image, website…)',
    'mb-ref-note-ph':'Note — optional',
    'mb-ref-add-btn':'+ Add a link',
    'mb-step6-title':'Your vision',
    'mb-step6-sub':'Describe in a few words the mood you\'re after, what you love, what to avoid.',
    'mb-field-notes-ph':'Describe your vision in a few words…',
    'mb-error':'Give your moodboard at least a title.',
    'mb-save-btn':'Save changes',
    'mb-create-btn':'Create this moodboard',
    'mb-save-error':'Error while saving. Try again or write to contact@bunkaio.com',
    'mb-edit-btn':'Edit',
    'mb-pinterest-link':'View the Pinterest board',
    'mb-comments-title':'Exchanges with the Bunkaio team',
    'mb-comments-empty':'No comments yet.',
    'mb-comment-ph':'Add a comment…',
    'mb-comment-link-ph':'Link to attach — optional',
    'mb-comment-btn':'Send',
    'th-date':'Date','th-service':'Service','th-amount':'Amount','th-status':'Status','th-ref':'Reference','th-method':'Method','th-invoice':'Invoice','th-invoice-num':'Number',
    'empty-orders':'No orders yet. Your services will appear here as soon as they are confirmed.',
    'empty-payments':'No payments recorded yet.',
    'empty-factures':'No invoices yet.',
    'acc-invoice-view':'View',
    'lr-title':'Your portfolio on Adobe Lightroom',
    'lr-text':'Your album is hosted on Adobe Lightroom: you only need to create an Adobe Lightroom account to open it. Your photos stay available at any time; post-production remains interactive, adjustments can be made if needed, and you export your visuals in the formats of your choice, on your own. The use of your visuals follows the assigned rights negotiated in your signed quote.',
    'lr-locked':'Your album opens as soon as the balance is paid: you then receive the link by email and it appears here, permanently.',
    'lr-btn':'Go to Lightroom',
    'acc-step-devis':'Quote confirmed','acc-step-shoot':'Shoot scheduled','acc-step-post':'Post-production','acc-step-livre':'Delivered',
    'acc-help-title':'Any question about your project?','acc-help-sub':'Your BUNKAIO contact replies to you directly.','acc-help-btn':'Write to us',
    'acc-info-forme':'Legal form *','acc-forme-choose':'Choose…','acc-forme-ei':'Sole proprietorship / micro-business','acc-forme-sas':'SAS / SASU','acc-forme-sarl':'SARL / EURL','acc-forme-sa':'SA','acc-forme-asso':'Association','acc-forme-autre':'Other',
    'acc-info-status':'Your area status','acc-info-valid':'Area validated','acc-info-incomplete':'Information to complete',
    'acc-info-banner':'To validate your area, please complete your information: it is used to prepare your quotes and invoices.',
    'acc-info-profile':'Client type *','acc-info-profile-part':'Individual','acc-info-profile-pro':'Business (company, freelancer, association)',
    'acc-info-name-part':'First and last name *','acc-info-name-pro':'Company name *','acc-info-contact':'Contact (first and last name) *',
    'acc-info-phone':'Phone *','acc-info-street':'Address (number and street) *','acc-info-zip':'Postal code *','acc-info-city':'City *','acc-info-country':'Country *',
    'acc-info-siret-opt':'SIRET — optional','acc-info-siret-req':'SIRET *','acc-info-vat':'EU VAT number — optional',
    'acc-info-req-note':'This information is used to prepare your quotes and invoices. All fields marked with * are required to validate your area.',
    'acc-info-address':'Billing address *',
    'acc-info-not-set':'Not provided',
    'acc-info-edit-btn':'Edit my information',
    'acc-info-save-btn':'Save changes',
    'acc-info-cancel-btn':'Cancel',
    'acc-info-note':'To change your login email, please contact us directly.',
    'acc-info-success-title':'Changes saved',
    'acc-info-success-text':'Your information has been updated.',
    'comm-kicker':'Going further',
    'comm-title':'Need support with your digital communication?',
    'comm-text':'Our partner Agency Nascimento supports BUNKAIO clients beyond imagery: website creation, search engine optimisation (SEO), online advertising (SEA, Ads), social media strategy and data analysis.',
    'comm-check':'I may be interested',
    'comm-redirect-title':'Your digital communication, with our partner',
    'comm-redirect-text':'You expressed an interest in complementary communication services. Agency Nascimento, a BUNKAIO partner, supports our clients with website creation, SEO, online advertising and social media. Discover their approach.',
    'comm-redirect-btn':'Discover Agency Nascimento',
    'home-claim-kicker':'The studio',
    'home-claim-text':'We don\'t document projects. We reveal what makes them unique.',
    'ft-services':'Services','ft-studio':'The studio',
    'footer-claim2':'Mobile photographer · Béziers · Montpellier · Toulouse',
    'stab-catalogue':'Catalogue & rates','stab-devis':'Quote & process',
    'p-trust':'They trusted us',
    'process-payment-info':'<strong>Payment terms:</strong> 30% deposit upon signing the quote, balance due on delivery of your deliverables. Each payment can be split into 3 interest-free instalments with Klarna, by credit card.',
    'process-cancel-info':'<strong>Cancellation:</strong> once the quote is accepted, the 30% deposit paid at booking is retained by BUNKAIO and is non-refundable if you cancel.',
    'process-delay-info':'The delivery timelines indicated on each package begin on the day of the shoot.',
    'process-rights-info':'Full commercial usage rights for all delivered visuals are granted to you with no time limit.',
    'pay-flex-kicker':'Flexible payment',
    'pay-flex-text':'<strong>3 interest-free instalments with Klarna</strong>, credit card — or in two payments, 30% deposit then balance. No extra fees, ever.',
    'pay-flex-pill-klarna':'3x interest-free',
    'pay-flex-pill-card':'Credit card',
    'pay-flex-pill-split':'Deposit + balance',
    'ph-name':'Your name or company',
    'ph-email':'you@company.com',
    'ph-phone':'Your phone number',
    'ph-project':'Describe your project in a few words…',
    'ph-message':'Your message…',
    'ph-code':'BKO-0000',
    'ph-activity':'Describe your activity in a few words…',
    'ph-ct-name':'Your name or company',
    'ph-ct-email':'you@company.com',
    'ph-reg-name':'Your name or company',
    'ph-reg-email':'you@company.com',
    'ph-apply-name':'Your name or company',
    'ph-apply-project':'Describe your business, your key achievements and what you are looking for in this partnership…',
    'ph-collab-name':'Your name or brand',
    'ph-collab-project':'Describe your proposal: context, what you have in mind, what you offer in exchange…',
    'skip-link':'Skip to content'
  }
};

Object.assign(I18N.fr, { 'acc-promotions':'Mes promotions', 'acc-reseau':'Mon réseau', 'acc-collabs':'Mes collaborations' });
Object.assign(I18N.en, { 'acc-promotions':'My promotions', 'acc-reseau':'My network', 'acc-collabs':'My collaborations' });

function t(obj){ return typeof obj === 'object' ? obj[LANG] : obj; }

function updatePlaceholders(){
  const PH = {
    'qName':'ph-name','qEmail':'ph-email','qPhone':'ph-phone','qProject':'ph-project','qCity':'city-ph',
    'ctName':'ph-ct-name','ctEmail':'ph-ct-email','ctPhone':'ph-phone','ctMsg':'ph-message',
    'logEmail':'ph-email','logCode':'ph-code',
    'regName':'ph-reg-name','regEmail':'ph-reg-email','regPhone':'ph-phone','regActivity':'ph-activity',
    'applyName':'ph-apply-name','applyEmail':'ph-email','applyProject':'ph-apply-project',
    'collabName':'ph-collab-name','collabEmail':'ph-email','collabProject':'ph-collab-project'
  };
  Object.entries(PH).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el && I18N[LANG][key]) el.placeholder = I18N[LANG][key];
  });
}

function updateLang(){
  document.querySelectorAll('[data-lang]').forEach(el => {
    const key = el.getAttribute('data-lang');
    if (I18N[LANG][key] !== undefined) el.innerHTML = I18N[LANG][key];
  });
  document.querySelectorAll('[data-lang-aria]').forEach(el => { const v = I18N[LANG][el.getAttribute('data-lang-aria')]; if (v) el.setAttribute('aria-label', v); });
  document.querySelectorAll('img[data-alt-en]').forEach(im => { if (!im.dataset.altFr) im.dataset.altFr = im.getAttribute('alt') || ''; im.setAttribute('alt', LANG === 'en' ? im.dataset.altEn : im.dataset.altFr); });
  document.documentElement.lang = LANG;
  applySeoMeta(currentView, currentSub);
  document.querySelectorAll('.lang-toggle').forEach(el => el.textContent = LANG === 'fr' ? 'EN' : 'FR');
  updatePlaceholders();
  refreshDynamic();
  syncNavHeight();
}

function toggleLang(){
  LANG = LANG === 'fr' ? 'en' : 'fr';
  updateLang();
}

function syncNavHeight(){
  const nav = document.querySelector('nav');
  if (nav) document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
}

function updateHeroScrollFx(){
  const wrap = document.getElementById('pageHeroWrap');
  if (!wrap) return;
  const heroH = window.innerHeight;
  const fadeStart = heroH * 0.7;
  const fadeRange = heroH * 0.3 || 1;
  const progress = Math.min(Math.max((window.scrollY - fadeStart) / fadeRange, 0), 1);
  wrap.style.opacity = String(1 - progress);
  wrap.style.visibility = progress >= 1 ? 'hidden' : 'visible';

  /* Disparaît dès le premier geste de scroll — inutile de le garder */
  const hint = document.getElementById('scrollHint');
  if (hint) hint.classList.toggle('is-hidden', window.scrollY > 40);
}

function initHeroScrollFx(){
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking){
      requestAnimationFrame(() => { updateHeroScrollFx(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  updateHeroScrollFx();
}

function updateNavScrollState(){
  const nav = document.querySelector('nav');
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 16);
  syncNavHeight();
}

function initNavScrollState(){
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking){
      requestAnimationFrame(() => { updateNavScrollState(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  updateNavScrollState();
}

function toggleMobileMenu(){
  const isOpen = document.body.classList.contains('menu-open');
  if (isOpen) closeMobileMenu(); else openMobileMenu();
}

function openMobileMenu(){
  document.body.classList.add('menu-open');
  document.getElementById('navBurger').setAttribute('aria-expanded', 'true');
}

function closeMobileMenu(){
  document.body.classList.remove('menu-open');
  const burger = document.getElementById('navBurger');
  if (burger) burger.setAttribute('aria-expanded', 'false');
}

function refreshDynamic(){
  renderClientSpotlights();
  if (currentView === 'portfolio') renderPortfolioLinks();
  if (currentView === 'services') renderServiceLinks();
  renderGoogleReview();
  if (currentView === 'service') renderServicePage(currentSub);
  if (currentView === 'article') renderArticlePage(currentSub);
  if (currentView === 'advice') renderAdvicePage();
  if (currentView === 'discover') renderDiscoverPage();
  renderAdviceTeaser();
  renderSvcAssure();
  renderCats();
  renderMissionServices();
  renderFooterServices();
  if (S.cat && document.getElementById('qs-2').classList.contains('active')) renderProfiles();
  if (S.cat && document.getElementById('qs-3').classList.contains('active')) renderTiers();
  if (S.cat && S.tier && document.getElementById('qs-4').classList.contains('active')) { renderRecap(); renderOptions(); }
  if (S.cat && S.tier && document.getElementById('qs-5').classList.contains('active')) updateQuizPayReassurance();
  if (S.cat && document.getElementById('qs-6').classList.contains('active')) renderQuizPortfolio();
  if (document.getElementById('view-services').classList.contains('active')) { renderServices(); if (activeSvcTab === 'devis') renderProcessSteps(); }
  if (document.getElementById('view-drone').classList.contains('active')) { renderDroneCats(); renderDroneProjects(activeDroneCat); }
  if (document.getElementById('view-partners').classList.contains('active')) { renderPartnersAccordion(); renderApplyBenefits(); renderApplyTypePicker(); }
  if (document.getElementById('view-legal').classList.contains('active')) { renderFaqAccordion(); renderPrivacyAccordion(); renderCgvAccordion(); }
  if (document.getElementById('view-portfolio').classList.contains('active')) {
    const curPfCat = document.querySelector('#pfTabs .pf-cat-tab.active')?.dataset.cat || PF_CATS[0].id;
    renderPfTabs();
    selectPfTab(curPfCat);
  }
  if (document.getElementById('view-login').classList.contains('active')) setLoginType(loginType);
  if (USER && document.getElementById('view-account').classList.contains('active')) renderAccount();
}

/* ═══════════════ DONNÉES ═══════════════ */
/* ════ ARCHIVE — Catégories suspendues (à réactiver en décommentant) ════
const CATS_ARCHIVE_SUSPENDED = [
  { id:'immobilier',
    name:{fr:'Immobilier prestige', en:'Luxury real estate'},
    tag:{fr:'Vente · location · promotion', en:'Sales · rentals · development'},
    icon:'promo',
    tiers:{
      deco:{ price:390, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['8 photos HD retouchées','Pièces principales + extérieurs','Galerie privée de téléchargement'],
        en:['8 retouched HD photos','Main rooms + exteriors','Private download gallery'] } },
      sig:{ price:790, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['20 photos HD retouchées','Cadrage et lumière travaillés pièce par pièce','Galerie privée de téléchargement'],
        en:['20 retouched HD photos','Framing and lighting refined room by room','Private download gallery'] } },
      prem:{ price:1190, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['30 photos HD retouchées','10 photos aériennes par drone certifié','Mise en valeur du bien et de son environnement','Galerie privée de téléchargement'],
        en:['30 retouched HD photos','10 aerial photos by certified drone','Property and surroundings showcased','Private download gallery'] } },
      edit:{ price:1890, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['35 photos HD retouchées','10 photos aériennes par drone certifié','1 film principal (60–90 secondes)','1 Reel vertical pour les réseaux','Valorisation éditoriale du bien','Publication sur les supports Bunkaio'],
        en:['35 retouched HD photos','10 aerial photos by certified drone','1 main film (60–90 seconds)','1 vertical Reel for social media','Editorial storytelling of the property','Featured on Bunkaio channels'] } }
    }},
  { id:'archi',
    name:{fr:'Architecture & design', en:'Architecture & design'},
    tag:{fr:'Architectes · intérieurs · agenceurs', en:'Architects · interiors · fitters'},
    icon:'agency',
    tiers:{
      deco:{ price:490, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['8 photos HD retouchées','Lecture d\'un espace signature','Galerie privée de téléchargement'],
        en:['8 retouched HD photos','A reading of one signature space','Private download gallery'] } },
      sig:{ price:990, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['20 photos HD retouchées','Lecture architecturale complète : volumes, lignes, matériaux','Galerie privée de téléchargement'],
        en:['20 retouched HD photos','Full architectural reading: volumes, lines, materials','Private download gallery'] } },
      prem:{ price:1590, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['30 photos HD retouchées','1 film principal (90 secondes)','1 Reel vertical pour les réseaux','1 format Stories optimisé (15s)','Galerie privée de téléchargement'],
        en:['30 retouched HD photos','1 main film (90 seconds)','1 vertical Reel for social media','1 optimised Stories format (15s)','Private download gallery'] } },
      edit:{ price:2390, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['35 photos HD retouchées','12 photos aériennes par drone certifié','1 film principal (2 minutes)','2 Reels verticaux','Storytelling complet du projet','Publication sur les supports Bunkaio'],
        en:['35 retouched HD photos','12 aerial photos by certified drone','1 main film (2 minutes)','2 vertical Reels','Complete project storytelling','Featured on Bunkaio channels'] } }
    }},
  { id:'artisan',
    name:{fr:'Artisanat d\'art', en:'Master craftsmanship'},
    tag:{fr:'Ébénistes · marbriers · créateurs', en:'Cabinetmakers · marble workers · makers'},
    icon:'artisan',
    tiers:{
      deco:{ price:290, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['8 photos HD retouchées','Une série atelier ou produits','Galerie privée de téléchargement'],
        en:['8 retouched HD photos','One workshop or product series','Private download gallery'] } },
      sig:{ price:690, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['20 photos HD retouchées','Mise en lumière du geste et de la matière','Galerie privée de téléchargement'],
        en:['20 retouched HD photos','Highlighting the craft and the material','Private download gallery'] } },
      prem:{ price:1090, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['30 photos HD retouchées','1 Reel vertical pour les réseaux','Galerie privée de téléchargement'],
        en:['30 retouched HD photos','1 vertical Reel for social media','Private download gallery'] } },
      edit:{ price:1690, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['35 photos HD retouchées','1 film principal','2 Reels verticaux','Storytelling de l\'atelier et du savoir-faire','Publication sur les supports Bunkaio'],
        en:['35 retouched HD photos','1 main film','2 vertical Reels','Workshop and craftsmanship storytelling','Featured on Bunkaio channels'] } }
    }},
];
════════════════════════════════════════════════════════════════════════ */

const CATS = [
  { id:'photo-part',
    name:{fr:'Séance photo — particuliers', en:'Portrait & lifestyle — individuals'},
    tag:{fr:'Extérieur · studio · solo · couple · groupe · book grossesse', en:'Outdoor · studio · solo · couple · group · maternity book'},
    pitch:{fr:'Pas besoin d\'être à l\'aise devant l\'objectif : c\'est notre rôle de vous mettre en confiance. Résultat, des photos qui vous ressemblent vraiment — livrées en 5 jours.',
      en:'No need to feel at ease in front of the camera — that\'s our job. The result: photos that truly look like you, delivered in 5 days.'},
    icon:'camera',
    tiers:{
      deco:{ price:250, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['1h de séance — extérieur ou studio (+60€)','8 photos HD retouchées','Sélection guidée incluse','Galerie privée de téléchargement'],
        en:['1h session — outdoor or studio (+€60)','8 retouched HD photos','Guided selection included','Private download gallery'] } },
      sig:{ price:420, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['2h de séance','15 photos HD retouchées','Direction de pose incluse','Galerie privée de téléchargement'],
        en:['2h session','15 retouched HD photos','Posing guidance included','Private download gallery'] } },
      prem:{ price:650, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Demi-journée (4h) — jusqu\'à 2 ambiances','25 photos HD retouchées','2 tenues différentes','Direction artistique complète','Galerie privée de téléchargement'],
        en:['Half-day (4h) — up to 2 moods','25 retouched HD photos','2 different outfits','Full art direction','Private download gallery'] } },
      edit:{ price:1090, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['Journée complète — 4 lieux différents','4 tenues différentes','30 photos HD retouchées','1 film court (30 secondes)','Direction artistique & stylisme','Publication sur les supports Bunkaio'],
        en:['Full day — 4 different locations','4 different outfits','30 retouched HD photos','1 short film (30 seconds)','Art direction & styling','Featured on Bunkaio channels'] } }
    }},
  { id:'corporate',
    name:{fr:'Corporate — portraits professionnels', en:'Corporate — professional portraits'},
    tag:{fr:'Profil LinkedIn · site web · équipe · dirigeants', en:'LinkedIn profile · website · team · executives'},
    pitch:{fr:'Une image professionnelle naturelle et soignée, qui inspire confiance dès le premier regard : photo de profil, site web, présentation d\'équipe.',
      en:'A natural, polished professional image that builds trust at first glance: profile photo, website, team presentation.'},
    icon:'agency',
    tiers:{
      deco:{ price:290, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['1h de séance — extérieur ou studio (+60€)','8 photos HD retouchées','Sélection guidée incluse','Galerie privée de téléchargement'],
        en:['1h session — outdoor or studio (+€60)','8 retouched HD photos','Guided selection included','Private download gallery'] } },
      sig:{ price:490, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['2h de séance','15 photos HD retouchées','Direction de pose incluse','Galerie privée de téléchargement'],
        en:['2h session','15 retouched HD photos','Posing guidance included','Private download gallery'] } },
      prem:{ price:790, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Demi-journée (4h) — jusqu\'à 2 ambiances','25 photos HD retouchées','2 tenues différentes','Direction artistique complète','Galerie privée de téléchargement'],
        en:['Half-day (4h) — up to 2 moods','25 retouched HD photos','2 different outfits','Full art direction','Private download gallery'] } },
      edit:{ price:1290, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['Journée complète — 4 lieux différents','4 tenues différentes','30 photos HD retouchées','1 film court (30 secondes)','Direction artistique & stylisme','Publication sur les supports Bunkaio'],
        en:['Full day — 4 different locations','4 different outfits','30 retouched HD photos','1 short film (30 seconds)','Art direction & styling','Featured on Bunkaio channels'] } }
    }},
  { id:'mode',
    name:{fr:'Mode, agence et mannequins', en:'Fashion, agencies & models'},
    tag:{fr:'Marques · agences · e-commerce · lookbook', en:'Brands · agencies · e-commerce · lookbook'},
    pitch:{fr:'Des visuels qui vendent, pas seulement qui plaisent. Chaque lookbook est pensé pour votre stratégie de marque, du shooting jusqu\'à la publication.',
      en:'Visuals that sell, not just visuals that please. Every lookbook is built around your brand strategy, from shoot to publication.'},
    icon:'marque',
    tiers:{
      deco:{ price:450, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['Mini-série — 8 photos HD retouchées','Un produit ou une silhouette','Direction artistique incluse'],
        en:['Mini series — 8 retouched HD photos','One product or one look','Art direction included'] } },
      sig:{ price:890, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Lookbook — 20 photos HD retouchées','1 Reel vertical pour les réseaux','Direction artistique incluse'],
        en:['Lookbook — 20 retouched HD photos','1 vertical Reel for social media','Art direction included'] } },
      prem:{ price:1390, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Lookbook — 30 photos HD retouchées','1 film principal','2 Reels verticaux','Direction artistique incluse'],
        en:['Lookbook — 30 retouched HD photos','1 main film','2 vertical Reels','Art direction included'] } },
      edit:{ price:2190, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['Campagne — 35 photos HD retouchées','1 film publicitaire (2 minutes)','3 Reels verticaux','Storytelling de marque','Publication sur les supports Bunkaio'],
        en:['Campaign — 35 retouched HD photos','1 commercial film (2 minutes)','3 vertical Reels','Brand storytelling','Featured on Bunkaio channels'] } }
    }},
  { id:'commercial',
    name:{fr:'Commercial & produits', en:'Commercial & products'},
    tag:{fr:'Packshots · produits · marques · entreprises', en:'Packshots · products · brands · businesses'},
    pitch:{fr:'Des packshots nets et lumineux, prêts à convertir — sur votre site comme sur vos réseaux. La même exigence qu\'une campagne, quel que soit le nombre de produits.',
      en:'Crisp, bright packshots built to convert — on your site and your socials alike. Campaign-level quality, whatever the size of your catalogue.'},
    icon:'product',
    tiers:{
      deco:{ price:290, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['Jusqu\'à 5 produits — 10 photos HD retouchées','Fond neutre studio','Galerie privée de téléchargement'],
        en:['Up to 5 products — 10 retouched HD photos','Neutral studio backdrop','Private download gallery'] } },
      sig:{ price:590, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['Jusqu\'à 12 produits — 20 photos HD retouchées','Mise en scène incluse','Galerie privée de téléchargement'],
        en:['Up to 12 products — 20 retouched HD photos','Styled setup included','Private download gallery'] } },
      prem:{ price:990, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Jusqu\'à 25 produits — 35 photos HD retouchées','Mise en scène incluse','1 Reel vertical produit','Galerie privée de téléchargement'],
        en:['Up to 25 products — 35 retouched HD photos','Styled setup included','1 vertical product Reel','Private download gallery'] } },
      edit:{ price:1790, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['Catalogue complet — 50 photos HD retouchées','1 film de marque (90 secondes)','2 Reels verticaux','Publication sur les supports Bunkaio'],
        en:['Full catalogue — 50 retouched HD photos','1 brand film (90 seconds)','2 vertical Reels','Featured on Bunkaio channels'] } }
    }},
  { id:'event',
    name:{fr:'Événementiel', en:'Events'},
    tag:{fr:'Domaines · entreprises · réceptions', en:'Estates · corporate · receptions'},
    pitch:{fr:'Votre journée ne se rejoue pas deux fois. Nous restons discrets pour que vous puissiez la vivre pleinement, pendant que nous en capturons chaque instant.',
      en:'Your day only happens once. We stay discreet so you can live it fully, while we capture every moment that matters.'},
    icon:'event',
    tiers:{
      deco:{ price:390, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['20 photos HD retouchées','Couverture de 2 heures — les moments essentiels','Galerie privée de téléchargement'],
        en:['20 retouched HD photos','2-hour coverage — the essential moments','Private download gallery'] } },
      sig:{ price:690, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['40 photos HD retouchées','Couverture jusqu\'à 4 heures — moments clés et ambiance','Galerie privée de téléchargement'],
        en:['40 retouched HD photos','Up to 4-hour coverage — key moments and atmosphere','Private download gallery'] } },
      prem:{ price:1190, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['80 photos HD retouchées','Couverture complète de l\'événement','1 teaser vidéo (30 secondes)','Galerie privée de téléchargement'],
        en:['80 retouched HD photos','Full event coverage','1 video teaser (30 seconds)','Private download gallery'] } },
      edit:{ price:1990, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['100 photos HD retouchées','1 aftermovie (2 minutes)','2 Reels verticaux','Mise en lumière éditoriale de l\'événement','Publication sur les supports Bunkaio'],
        en:['100 retouched HD photos','1 aftermovie (2 minutes)','2 vertical Reels','Editorial spotlight on the event','Featured on Bunkaio channels'] } }
    }},
  { id:'lumen',
    lumen: true,
    comingSoon: true,
    name:{fr:'Lumen — Photobooth IA (location)', en:'Lumen — AI photobooth (rental)'},
    tag:{fr:'Location de photobooth IA — mariages haut de gamme', en:'AI photobooth rental — luxury weddings'},
    pitch:{fr:'Un souvenir unique, généré par IA en quelques secondes, sans jamais sacrifier l\'élégance de votre réception. Vos invités repartent avec bien plus qu\'une photo.',
      en:'A one-of-a-kind keepsake, AI-generated in seconds, without ever compromising the elegance of your event. Your guests leave with far more than a photo.'},
    icon:'lumen',
    tiers:{}
  }
];

/* ════════════════════════════════════════════════════════════════
   📅  ABONNEMENTS MENSUELS — Engagement minimum 6 mois
   Prix volontairement inférieurs à la formule Signature individuelle.
   ════════════════════════════════════════════════════════════════ */
const SUBS = {
  /* Studio Continu : proposé uniquement aux modèles émergents et mannequins (voir SUB_PROFILES). */
  mode: {
    price: 850,
    audience:{fr:'modèles et mannequins', en:'models'},
    name:{fr:'Studio Continu — Modèles & mannequins', en:'Studio Continu — Models'},
    items:{
      fr:['1 session lifestyle ou lookbook par mois (jusqu\'à 25 photos HD)','2 Reels verticaux par mois, prêts pour vos réseaux et vos candidatures','Direction artistique continue — cohérence visuelle toute l\'année','Options supplémentaires au tarif partenaire (-20%)'],
      en:['1 lifestyle or lookbook session per month (up to 25 HD photos)','2 vertical Reels per month, ready for your social channels and applications','Ongoing art direction — full-year visual consistency','All add-ons at partner rate (-20%)'] }
  }
};
const SUB_PROFILES = ['modele', 'mannequin'];
const subAvailable = cat => !!SUBS[cat] && (!SUB_PROFILES.length || cat !== 'mode' || SUB_PROFILES.includes(S.prof));

/* Formule spécialisée "Polas" — uniquement Mode & créateurs. Tarif tout compris : studio obligatoire et inclus.
   Polas (digitals) = photos brutes et sans retouche, destinées exclusivement aux agences pour évaluer
   la morphologie, la posture et le potentiel brut du mannequin — aucune mise en scène. */
const POLAS = {
  /* Formule « Book grossesse » — séance photo particuliers. Tarif haut de gamme, lieu (studio ou extérieur) inclus. */
  'photo-part': {
    id: 'grossesse', price: 450, studio: 0,
    name:{fr:'Book grossesse', en:'Maternity book'},
    badge:{fr:'Spécial grossesse', en:'Maternity special'},
    label:{fr:'Book grossesse', en:'Maternity book'},
    delay:{fr:'7 jours ouvrés', en:'7 working days'},
    studioNote:{fr:'Studio ou extérieur au choix, inclus', en:'Studio or outdoor, included'},
    short:{fr:'Solo ou en couple · studio ou extérieur inclus', en:'Solo or as a couple · studio or outdoor included'},
    sub:{fr:'quatre formules, de la découverte à l\'expérience éditoriale complète, ainsi qu\'un book grossesse sur mesure.', en:'four packages, from the starter offer to the complete editorial experience, plus a tailor-made maternity book.'},
    optNote:{fr:'<strong>Bon à savoir :</strong> le book grossesse est une expérience clé en main — studio ou extérieur au choix, sans option additionnelle. Précisez vos envies (lieu, tenues, présence du conjoint) dans le champ « commentaire » : nous organisons le reste avec vous. La séance se programme idéalement entre la 28<sup>e</sup> et la 36<sup>e</sup> semaine.', en:'<strong>Good to know:</strong> the maternity book is a turnkey experience — studio or outdoor, with no additional options. Tell us what you have in mind (location, outfits, partner joining) in the comment field and we will plan the rest with you. The ideal window is between weeks 28 and 36.'},
    items:{
      fr:['Séance de 1h30, en studio ou en extérieur au choix','20 photos HD retouchées, retouche naturelle','Jusqu\'à 2 tenues (les vôtres, nous vous conseillons en amont)','Direction de pose douce et bienveillante, adaptée à chaque étape','Possibilité de venir en couple (conjoint·e, enfant)','Galerie privée de téléchargement'],
      en:['1.5-hour session, studio or outdoor of your choice','20 retouched HD photos, natural retouching','Up to 2 outfits (your own, with styling advice beforehand)','Gentle, reassuring posing guidance for every stage','Partner or child welcome to join','Private download gallery'] }
  },
  mode: {
    id: 'polas', studio: 0,
    badge:{fr:'Spécial mannequins', en:'For models'},
    label:{fr:'Pour les agences', en:'For agencies'},
    studioNote:{fr:'Studio inclus', en:'Studio included'},
    short:{fr:'Digitals bruts · studio inclus', en:'Raw digitals · studio included'},
    sub:{fr:'un format Polas pour mannequins, ainsi que quatre formules, de la découverte à l\'expérience éditoriale complète.', en:'a Polas format for models, plus four packages, from the starter offer to the complete editorial experience.'},
    optNote:{fr:'<strong>Bon à savoir :</strong> le format Polas est une expérience clé en main — studio inclus, sans option additionnelle.', en:'<strong>Good to know:</strong> the Polas format is a turnkey experience — studio included, no additional options.'},
    price: 100,
    name:{fr:'Polas', en:'Polas'},
    delay:{fr:'Livraison HD sous 24h', en:'HD delivery within 24h'},
    items:{
      fr:['Séance studio de 30 min sur fond blanc, lumière neutre','10 photos brutes, sans retouche ni mise en scène','Visage, profils, trois-quarts et plans corps entier','Fichiers HD prêts à transmettre à votre agence'],
      en:['30-minute studio session on a plain white background, neutral lighting','10 raw shots, no retouching or styling','Face, profiles, three-quarter and full-body shots','HD files ready to send to your agency'] }
  }
};

/* Photo propre à chaque formule (dossier formulas/ de l'admin média). Repli : photo de la catégorie, sinon rien. */
function formulaPhotoHTML(cat, tierId, cls){
  if (!IMG.formulas || !cat || !tierId) return '';
  const fb = (IMG.servicePhotos && IMG.servicePhotos[cat]) || '';
  const url = `${IMG.formulas}/${cat}-${tierId}.webp`;
  const framed = /^(tier-photo|fx-photo|recap-photo)$/.test(cls || '');
  const err = framed
    ? "var f=this.dataset.fb;if(f){this.dataset.fb='';this.src=f;this.parentNode.style.setProperty('--ph','url('+f+')')}else{this.parentNode.remove()}"
    : "var f=this.dataset.fb;if(f){this.dataset.fb='';this.src=f}else{this.remove()}";
  const img = `<img class="formula-photo ${cls || ''}" src="${url}" alt="" loading="lazy" decoding="async" data-fb="${fb}" onerror="${err}">`;
  /* Cadre « photo entière » : l'image n'est jamais recadrée, le fond reprend la même photo en flou. */
  return framed ? `<span class="fp" style="--ph:url('${url}')">${img}</span>` : img;
}
/* Supplément « studio » des formules Découverte (photo particuliers et corporate). */
const STUDIO_FEE = 60;
const specialTotal = sp => sp.price + sp.studio;
const isSpecialTier = () => !!(S.tier && POLAS[S.cat] && S.tier === POLAS[S.cat].id);

/* ════════════════════════════════════════════════════════════════
   🔧  OPTIONS — disponibles pour toutes les catégories pro
   ════════════════════════════════════════════════════════════════ */
const OPTIONS = [
  { id:'photo', icon:'📷',
    price: null,
    name:{fr:'Photographies additionnelles', en:'Additional photographs'},
    note:{fr:'Complétez votre reportage avec des visuels supplémentaires.',
          en:'Complement your shoot with extra visuals.'},
    packs:[
      { id:'p1',  label:{fr:'1 photo à l\'unité',            en:'1 photo (unit price)'},   price:40 },
      { id:'p10', label:{fr:'Pack 10 photos supplémentaires', en:'Pack of 10 extra photos'}, price:340 },
      { id:'p15', label:{fr:'Pack 15 photos supplémentaires', en:'Pack of 15 extra photos'}, price:470 },
      { id:'p20', label:{fr:'Pack 20 photos supplémentaires', en:'Pack of 20 extra photos'}, price:600 },
    ]},
  { id:'drone', icon:'🚁', price:'À partir de 390€', comingSoon: true,
    name:{fr:'Prises de vue drone additionnelles', en:'Additional drone footage'},
    note:{fr:'Perspectives aériennes supplémentaires par pilote certifié A1/A3 & A2. Précisez le volume souhaité dans votre message.',
          en:'Additional aerial perspectives by A1/A3 & A2 certified pilot. Specify the volume needed in your message.'} },
  { id:'video', icon:'🎬', price:'À partir de 250€',
    name:{fr:'Film additionnel', en:'Additional film'},
    note:{fr:'Reel vertical 60s à partir de 250€ · Film court 60-90s à partir de 490€ · Film principal 2min à partir de 790€. Précisez le format souhaité.',
          en:'Vertical Reel 60s from €250 · Short film 60-90s from €490 · Main film 2min from €790. Specify the format needed.'} },
  { id:'social', icon:'📱', price:'240€',
    name:{fr:'Pack réseaux renforcé', en:'Enhanced social media pack'},
    note:{fr:'Déclinaisons optimisées pour Instagram, TikTok et LinkedIn — 3 formats × 3 réseaux.',
          en:'Cuts optimised for Instagram, TikTok and LinkedIn — 3 formats × 3 platforms.'} },
  { id:'express', icon:'⚡', price:'+20%',
    name:{fr:'Livraison express 72h', en:'72-hour express delivery'},
    note:{fr:'Vos livrables passent en priorité absolue et vous sont remis sous 72 heures.',
          en:'Your deliverables become our absolute priority and reach you within 72 hours.'} }
];

/* Options spéciales par catégorie+tier */
const SPECIAL_OPTIONS = {
  'photo-part_edit': [
    { id:'makeup', icon:'💄', price:'Sur devis',
      name:{fr:'Mise en beauté', en:'Beauty styling'},
      note:{fr:'Une make up artiste partenaire et/ou une coiffeuse prend en charge votre mise en beauté avant la séance. Prestation confiée à nos partenaires professionnels.',
            en:'A partner make-up artist and/or hairstylist handles your styling before the shoot. Performed by our professional partners.'} }
  ]
};

/* ════════════════════════════════════════════════════════════════
   📸  LUMEN — Photobooth IA · mariages haut de gamme
   ════════════════════════════════════════════════════════════════ */
const LUMEN_TIERS = [
  { id:'dec',  name:{fr:'Découverte',  en:'Starter'},
    badge:{fr:'Pour essayer', en:'To try it'},
    price: 290, priceUSD: 320,
    delay:{fr:'7 jours ouvrés', en:'7 working days'},
    items:{
      fr:['Location du photobooth IA, installé et opérationnel','2 heures de prestation','100 impressions incluses','Galerie privée livrée sous 7 jours'],
      en:['AI photobooth rental, set up and ready','2 hours service','100 prints included','Private gallery delivered within 7 days'] }
  },
  { id:'ess',  name:{fr:'Essentiel',  en:'Essentials'},
    badge: null,
    price: 490, priceUSD: 540,
    delay:{fr:'7 jours ouvrés', en:'7 working days'},
    items:{
      fr:['Location du photobooth IA, installé et opérationnel','Jusqu\'à 4 heures de prestation','Impressions illimitées incluses','Galerie privée livrée sous 7 jours'],
      en:['AI photobooth rental, set up and ready','Up to 4 hours service','Unlimited prints included','Private gallery delivered within 7 days'] }
  },
  { id:'sig',  name:{fr:'Signature',  en:'Signature'},
    badge:{fr:'Le plus choisi', en:'Most popular'},
    price: 790, priceUSD: 870,
    delay:{fr:'5 jours ouvrés', en:'5 working days'},
    items:{
      fr:['Location du photobooth IA, installé et opérationnel','Jusqu\'à 6 heures de prestation','Style personnalisé (fond, habillage, palette)','Impressions illimitées incluses','Galerie privée livrée sous 5 jours'],
      en:['AI photobooth rental, set up and ready','Up to 6 hours service','Custom style (backdrop, branding, palette)','Unlimited prints included','Private gallery delivered within 5 days'] }
  },
  { id:'surm', name:{fr:'Sur-mesure', en:'Bespoke'},
    badge:{fr:'Entièrement personnalisé', en:'Fully bespoke'},
    price: 1190, priceUSD: 1300,
    delay:{fr:'Sur accord', en:'On agreement'},
    items:{
      fr:['Devis personnalisé selon votre projet','Durée, style et options définis ensemble'],
      en:['Personalised quote based on your project','Duration, style and options defined together'] }
  }
];

const LUMEN_PROFILES = [
  { id:'mariage', name:{fr:'Mariage',                       en:'Wedding'},               icon:'couple',
    desc:{fr:'Vous préparez votre mariage et souhaitez offrir une expérience mémorable à vos invités. Lumen installe un photobooth IA élégant et discret, adapté à l\'ambiance de votre réception.',
          en:'You are planning your wedding and want to offer your guests a memorable experience. Lumen sets up an elegant, discreet AI photobooth suited to your reception atmosphere.'} },
  { id:'wedding-planner', name:{fr:'Wedding planner / agence', en:'Wedding planner / agency'}, icon:'agency',
    desc:{fr:'Vous organisez des mariages pour le compte de vos clients. Lumen s\'intègre à votre offre premium comme une option haut de gamme, sans contrainte logistique pour vous.',
          en:'You organise weddings on behalf of your clients. Lumen integrates into your premium offering as a high-end option, with no logistical burden on your side.'} },
  { id:'corp', name:{fr:'Entreprise / événement corporate', en:'Company / corporate event'},   icon:'event',
    desc:{fr:'Vous organisez un événement d\'entreprise — soirée annuelle, séminaire, lancement. Lumen apporte une animation haut de gamme, personnalisée à vos couleurs.',
          en:'You are organising a corporate event — annual dinner, seminar, launch. Lumen delivers a premium experience, customised to your brand.'} }
];

const LUMEN_OPTIONS = [
  { id:'lumen-style', icon:'🎨', price: null,
    name:{fr:'Style personnalisé', en:'Custom style'},
    note:{fr:'Fond dédié, habillage aux couleurs de votre événement, typographie sur mesure. Inclus dans la formule Signature.',
          en:'Dedicated backdrop, branding matching your event colours, bespoke typography. Included in the Signature package.'} },
  { id:'lumen-heure', icon:'⏱', price: 120,
    name:{fr:'Heure supplémentaire', en:'Additional hour'},
    note:{fr:'Prolongez votre prestation d\'une heure. Facturable par heure additionnelle.',
          en:'Extend your service by one hour. Billed per additional hour.'} },
  { id:'lumen-print', icon:'🖨', price: null,
    name:{fr:'Impressions illimitées', en:'Unlimited prints'},
    note:{fr:'Tirages photo illimités pendant toute la durée de la prestation. Illimitées dans les formules Essentiel et Signature (100 impressions incluses dans la formule Découverte).',
          en:'Unlimited photo prints throughout the service. Unlimited in the Essentials and Signature packages (100 prints included in the Starter package).'} }
];

const PROFILES = [
  { id:'agence',   name:{fr:'Agence / studio',          en:'Agency / studio'},         icon:'agency'  },
  { id:'promo',    name:{fr:'Propriétaire / promoteur',  en:'Owner / developer'},       icon:'promo'   },
  { id:'marque',   name:{fr:'Marque / label',            en:'Brand / label'},           icon:'marque'  },
  { id:'artisan',  name:{fr:'Artisan / créateur',        en:'Artisan / maker'},         icon:'artisan' },
  { id:'modele',   name:{fr:'Modèle émergent(e)',        en:'Emerging model'},          icon:'person'  },
  { id:'mannequin',name:{fr:'Mannequin',                 en:'Model'},                   icon:'marque'  },
  { id:'createur', name:{fr:'Créateur(trice) de contenu',en:'Content creator'},         icon:'camera'  },
  { id:'ei',       name:{fr:'Entreprise individuelle',   en:'Sole proprietorship'},     icon:'artisan' },
  { id:'equipe',   name:{fr:'Équipe / entreprise',       en:'Team / company'},          icon:'agency'  },
  { id:'gastro',   name:{fr:'Restaurateur / hôtelier',   en:'Restaurant / hotel owner'},icon:'gastro'  },
  { id:'paysage',  name:{fr:'Pisciniste / paysagiste',   en:'Pool builder / landscaper'},icon:'paysage'},
  { id:'event',    name:{fr:'Agence événementielle',     en:'Event agency'},            icon:'event'   },
  { id:'autre',    name:{fr:'Autre',                     en:'Other'},                   icon:'autre'   }
];

/* Profils cohérents affichés à l'étape "Quel profil êtes-vous ?" selon le domaine choisi à l'étape précédente. */
const CAT_PROFILES = {
  immobilier: ['agence', 'promo', 'marque', 'autre'],
  archi:      ['agence', 'promo', 'marque', 'autre'],
  artisan:    ['artisan', 'marque', 'autre'],
  corporate:  ['ei', 'equipe', 'autre'],
  mode:       ['modele', 'mannequin', 'createur', 'marque', 'agence', 'ei', 'autre'],
  commercial: ['marque', 'agence', 'ei', 'gastro', 'artisan', 'autre'],
  event:      ['event', 'agence', 'marque', 'ei', 'autre']
};

const PHOTO_PART_PROFILES = [
  { id:'seul',   name:{fr:'Seul(e)',   en:'Solo'},          icon:'person',
    desc:{fr:'Vous venez seul(e) : portrait, lifestyle ou expression créative. La séance est entièrement centrée sur vous — mise en valeur personnelle, projet artistique ou photos professionnelles.',
          en:'You come alone: portrait, lifestyle or creative expression. The session is entirely centred on you — personal image, artistic project or professional photos.'} },
  { id:'couple', name:{fr:'En couple', en:'As a couple'},   icon:'couple',
    desc:{fr:'Séance en couple : complicité, naturel, instants partagés. Fiançailles, anniversaire de mariage ou simplement des souvenirs à conserver, nous capturons ce qui vous unit.',
          en:'Session for two: complicity, naturalness, shared moments. Engagement, anniversary or simply memories to keep, we capture what brings you together.'} },
  { id:'groupe', name:{fr:'En groupe', en:'Group'},          icon:'group',
    desc:{fr:'Séance en groupe : famille, amis, équipe. Nous adaptons la mise en scène au nombre de personnes et à l\'énergie du groupe pour des images authentiques et vivantes.',
          en:'Group session: family, friends, team. We adapt the setup to the group size and energy for authentic, vibrant images.'} }
];

const PROFILE_DESCRIPTIONS = {
  equipe: {
    fr:'Vous représentez une entreprise ou une équipe. Des portraits cohérents entre eux, pour votre site, vos présentations et vos recrutements : même lumière, même esprit, chacun à son avantage.',
    en:'You represent a company or a team. Consistent portraits for your website, presentations and recruitment: the same light, the same spirit, everyone at their best.'
  },
  modele: {
    fr:'Vous débutez et construisez votre book. Nous vous aidons à vous présenter sous votre meilleur jour : des images naturelles et soignées, pensées pour convaincre agences et marques.',
    en:'You are starting out and building your portfolio. We help you show your best side: natural, polished images designed to win over agencies and brands.'
  },
  mannequin: {
    fr:'Vous travaillez avec des agences et des marques. Nous produisons des images précises et élégantes pour mettre à jour votre book et valoriser votre polyvalence.',
    en:'You work with agencies and brands. We produce precise, elegant images to refresh your portfolio and showcase your versatility.'
  },
  createur: {
    fr:'Vous publiez régulièrement et votre image est votre outil de travail. Nous créons des visuels cohérents avec votre univers, pour vos réseaux, votre marque personnelle et vos collaborations.',
    en:'You publish regularly and your image is your working tool. We create visuals consistent with your universe, for your social channels, personal brand and collaborations.'
  },
  ei: {
    fr:'Vous êtes à votre compte et votre image fait partie de votre offre. Des images soignées, à la mesure de votre activité, pour vos réseaux, votre site et vos clients.',
    en:'You work for yourself and your image is part of your offer. Polished images that fit your business, for your social channels, website and clients.'
  },
  agence: {
    fr:'Vous concevez des espaces, des identités, des projets. Vos réalisations méritent une documentation à la hauteur de votre exigence créative : des images précises, fidèles à vos intentions, que vous pourrez présenter à vos clients, à la presse ou en concours.',
    en:'You design spaces, identities, projects. Your work deserves documentation that matches your creative standards: precise images, faithful to your intentions, that you can present to clients, the press or competitions alike.'
  },
  promo: {
    fr:'Vous vendez ou commercialisez des biens d\'exception. Votre enjeu : déclencher le coup de cœur avant même la première visite. Nous mettons en scène la lumière, les volumes et l\'art de vivre de chaque bien.',
    en:'You sell or market exceptional properties. Your challenge: sparking that emotional connection before the very first visit. We stage the light, the volumes and the lifestyle of each property.'
  },
  marque: {
    fr:'Votre marque raconte une histoire, et vos clients achètent un univers autant qu\'un produit. Nous construisons des images cohérentes avec votre positionnement, pensées pour vos campagnes et vos réseaux.',
    en:'Your brand tells a story, and your customers buy into a universe as much as a product. We craft imagery consistent with your positioning, designed for your campaigns and social channels.'
  },
  artisan: {
    fr:'Votre valeur est dans le geste, la matière et le temps que vous y consacrez. Nous documentons votre savoir-faire avec respect et précision, pour révéler ce que vos clients ne voient jamais : l\'atelier, le détail, l\'exigence.',
    en:'Your value lies in the craft, the material and the time you devote to it. We document your expertise with respect and precision, revealing what your clients never get to see: the workshop, the detail, the dedication.'
  },
  gastro: {
    fr:'Votre établissement vend une expérience autant qu\'un service. Nous capturons l\'atmosphère, les textures, les gestes et les instants qui donnent envie de réserver.',
    en:'Your establishment sells an experience as much as a service. We capture the atmosphere, the textures, the gestures and the moments that make people want to book.'
  },
  paysage: {
    fr:'Vos créations transforment des extérieurs en véritables lieux de vie. Lumière naturelle, reflets de l\'eau, perspectives aériennes : nous valorisons l\'harmonie de vos réalisations sous leur meilleur jour.',
    en:'Your creations turn outdoor spaces into true living spaces. Natural light, water reflections, aerial perspectives: we showcase the harmony of your work at its very best.'
  },
  event: {
    fr:'Chaque événement est unique et ne se reproduira jamais. Nous documentons les moments clés avec discrétion et précision — l\'émotion, les détails, l\'ambiance — pour prolonger l\'expérience.',
    en:'Every event is unique and will never happen again. We document the key moments with discretion and precision — the emotion, the details, the atmosphere.'
  },
  autre: {
    fr:'Votre activité ne rentre dans aucune case ? C\'est peut-être exactement ce qui la rend intéressante. Décrivez-nous votre univers dans le champ « Votre projet ».',
    en:'Your business doesn\'t fit into any box? That might be exactly what makes it interesting. Tell us about your universe in the "Your project" field.'
  }
};

/* Promotions ponctuelles : ajoutez un champ `promo:{fr:'...',en:'...'}`
   directement sur le palier concerné, dans l'objet `tiers` de la
   catégorie visée plus bas dans CATS (ex. CATS[0].tiers.sig.promo =
   {fr:'-15% ce mois-ci', en:'-15% this month'}) ou sur une formule de
   SUBS. Affiché automatiquement en badge violet clair — à la fois dans
   le questionnaire de devis (renderTiers()) et sur la page Services
   (renderServices()) — sans autre changement de code. Aucune promotion
   n'est activée par défaut : à ajouter au cas par cas selon les offres
   réellement en cours. */
const TIERS = [
  { id:'deco', name:{fr:'Découverte', en:'Starter'},         badge:{fr:'Pour découvrir',     en:'To get started'} },
  { id:'sig',  name:{fr:'Signature',  en:'Signature'},        badge:null },
  { id:'prem', name:{fr:'Premium',    en:'Premium'},           badge:{fr:'Le plus choisi',     en:'Most popular'} },
  { id:'edit', name:{fr:'Éditorial Bunkaio', en:'Bunkaio editorial'}, badge:{fr:'Expérience complète', en:'The complete experience'} }
];

/* Portfolio : aligné sur le catalogue actuel. Les rubriques suspendues (immobilier,
   architecture, artisanat) sont à ré-ajouter ici si elles reviennent au catalogue :
     { id:'immobilier', label:{fr:'Immobilier', en:'Real estate'} },
     { id:'archi',      label:{fr:'Architecture', en:'Architecture'} },
     { id:'artisan',    label:{fr:'Artisanat', en:'Craftsmanship'} } */
const PF_CATS = [
  { id:'photo-part',  label:{fr:'Séance photo',en:'Portrait'} },
  { id:'corporate',   label:{fr:'Corporate',   en:'Corporate'} },
  { id:'mode',        label:{fr:'Mode',        en:'Fashion'} },
  { id:'commercial',  label:{fr:'Commercial',  en:'Commercial'} },
  { id:'event',       label:{fr:'Événementiel',en:'Events'} },
  { id:'lumen',       label:{fr:'Lumen',       en:'Lumen'} },
  { id:'collaboration', label:{fr:'Collaboration', en:'Collaboration'} }
];

const DRONE_CATS = [
  { id:'immo', name:{fr:'Immobilier & architecture', en:'Real estate & architecture'},
    projects:[
      { title:{fr:'Villa contemporaine — Hérault', en:'Contemporary villa — Hérault'},
        desc:{fr:'Mise en valeur aérienne d\'une villa d\'architecte : travelling, révélation progressive de la piscine à débordement et lecture du dialogue entre le bâti et le paysage.',
              en:'Aerial showcase of an architect-designed villa: a tracking approach, the gradual reveal of the infinity pool, and the dialogue between the building and its landscape.'},
        thumb:DRONE_MEDIA.immo[0].thumb, video:DRONE_MEDIA.immo[0].video },
      { title:{fr:'Domaine viticole — vente prestige', en:'Wine estate — premium sale'},
        desc:{fr:'Film aérien pour la mise en vente d\'un domaine : vue d\'ensemble du terrain, des dépendances et des vignes, montage rythmé pour les plateformes haut de gamme.',
              en:'Aerial film for the sale of an estate: overview of the grounds, outbuildings and vineyards, edited with pace for premium real estate platforms.'},
        thumb:DRONE_MEDIA.immo[1].thumb, video:DRONE_MEDIA.immo[1].video }
    ]},
  { id:'outdoor', name:{fr:'Piscines & paysages', en:'Pools & landscapes'},
    projects:[
      { title:{fr:'Piscine miroir — réalisation pisciniste', en:'Mirror pool — pool builder showcase'},
        desc:{fr:'Captation au lever du soleil pour saisir les reflets parfaits du bassin. Plans aériens combinés à des plans au sol Sony Alpha pour un rendu éditorial complet.',
              en:'Captured at sunrise to seize the pool\'s perfect reflections. Aerial shots combined with Sony Alpha ground footage for a complete editorial result.'},
        thumb:DRONE_MEDIA.outdoor[0].thumb, video:DRONE_MEDIA.outdoor[0].video },
      { title:{fr:'Jardin paysager méditerranéen', en:'Mediterranean landscaped garden'},
        desc:{fr:'Documentation d\'un projet paysager : structure des terrasses, jeux d\'ombres des oliviers et intégration dans l\'environnement naturel.',
              en:'Documentation of a landscaping project: terraced structure, olive trees\' play of shadows, and integration into the natural surroundings.'},
        thumb:DRONE_MEDIA.outdoor[1].thumb, video:DRONE_MEDIA.outdoor[1].video }
    ]},
  { id:'event', name:{fr:'Événementiel', en:'Events'},
    projects:[
      { title:{fr:'Réception privée — domaine de caractère', en:'Private reception — characterful estate'},
        desc:{fr:'Aftermovie mêlant plans aériens du domaine au crépuscule et instants captés au sol : l\'arrivée des invités, les lumières, l\'atmosphère.',
              en:'An aftermovie blending aerial shots of the estate at dusk with ground-level moments: guests arriving, the lights, the atmosphere.'},
        thumb:DRONE_MEDIA.event[0].thumb, video:DRONE_MEDIA.event[0].video },
      { title:{fr:'Événement d\'entreprise — lancement produit', en:'Corporate event — product launch'},
        desc:{fr:'Couverture vidéo complète : plans aériens du site, interviews, moments clés. Livré en format long et en déclinaisons réseaux.',
              en:'Full video coverage: aerial establishing shots, interviews, key moments. Delivered as long-form film plus social media cuts.'},
        thumb:DRONE_MEDIA.event[1].thumb, video:DRONE_MEDIA.event[1].video }
    ]},
  { id:'brand', name:{fr:'Marques & lifestyle', en:'Brands & lifestyle'},
    projects:[
      { title:{fr:'Film de marque — maison artisanale', en:'Brand film — artisan house'},
        desc:{fr:'Récit visuel d\'une maison artisanale : l\'atelier filmé au Sony Alpha, le territoire saisi par drone. Deux échelles qui racontent ensemble l\'ancrage et le savoir-faire.',
              en:'The visual story of an artisan house: the workshop on Sony Alpha, the land captured by drone. Two scales that together convey heritage and craftsmanship.'},
        thumb:DRONE_MEDIA.brand[0].thumb, video:DRONE_MEDIA.brand[0].video },
      { title:{fr:'Campagne lifestyle — collection été', en:'Lifestyle campaign — summer collection'},
        desc:{fr:'Production complète : direction artistique, captation photo et vidéo, plans aériens des lieux de shooting. Cohérence visuelle sur tous les supports.',
              en:'Full production: art direction, photo and video capture, aerial shots of the locations. Visual consistency across every medium.'},
        thumb:DRONE_MEDIA.brand[1].thumb, video:DRONE_MEDIA.brand[1].video }
    ]}
];

/* ═══════════════ ÉTAT ═══════════════ */
const S = { cat:null, tier:null, prof:null, opts:[], comm:false, studio:false, photoPack:null, name:'', email:'', phone:'', project:'', delay:'', city:'', travel:null };


const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      if (e.target.classList.contains('ph')) setTimeout(() => e.target.classList.add('revealed'), 80);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
/* Apparition progressive au défilement, sur tout le site : les blocs situés sous la ligne de flottaison
   reçoivent la classe .rv (voir observe()), avec un léger décalage entre frères. Les blocs déjà visibles
   à l'arrivée restent affichés tout de suite (pas de clignotement). */
const AUTO_REVEAL = '.read-panel, .svcp-panel, .fx, .advice-card, .accordion-item, .art-item, .cat-item, .reassure-item, .pf-link-card, .svcp-chip, .gear-pill, .cred-item, .drone-price-card, .about-card, .ct-info-block, .service-card, .tier-card';
function autoReveal(viewEl){
  if (!viewEl || REDUCED_MOTION) return;
  const vh = window.innerHeight || 800;
  const kids = new Map();
  viewEl.querySelectorAll(AUTO_REVEAL).forEach(el => {
    if (el.classList.contains('rv') || el.closest('.qstep, .mission-video-wrap, .rv.in, .adv-row')) return;
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.92 && r.bottom > 0) return;
    const par = el.parentElement; const n = (kids.get(par) || 0); kids.set(par, n + 1);
    el.style.setProperty('--rv-d', Math.min(n, 5) * 0.07 + 's');
    el.classList.add('rv');
  });
}
/* Barre de progression de lecture (fine ligne en haut de page) */
function initScrollProgress(){
  const bar = document.getElementById('scrollProgress'); if (!bar || REDUCED_MOTION) return;
  let tick = false;
  const upd = () => { tick = false; const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); upd();
}

function observe(el){ io.observe(el); }

/* Variante à déclenchement plus tardif (l'élément doit être nettement
   visible, pas juste effleurer le bas de l'écran) : utilisée pour les
   sections dont l'animation d'entrée doit être perçue par l'utilisateur
   et non déjà terminée quand son regard y arrive. */
const ioLate = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      ioLate.unobserve(e.target);
    }
  });
}, { threshold: 0.35 });
function observeLate(el){ ioLate.observe(el); }

/* ═══════════════ I18N ═══════════════ */





/* ═══════════════ VIDÉO DE FOND — utilitaire réutilisable ═══════════════
   Crée un <video> en autoplay/muet/boucle, fiable sur mobile comme desktop,
   invisible tant que la lecture n'a pas réellement démarré (jamais de
   bouton "play" visible). Utilisé par le hero Accueil et par toute autre
   section vidéo (ex: section Mission de la page Partenaires). */

/* Registre de toutes les vidéos de fond créées, pour pouvoir les relancer
   globalement (changement d'onglet, retour sur une vue, etc.). */
const _bgVideos = [];

/* Relance toutes les vidéos de fond. Un navigateur mobile peut figer une
   vidéo masquée (display:none) sans la marquer « en pause » : on vérifie
   donc aussi que le temps de lecture avance et, sinon, on recharge la
   vidéo (déjà en cache) puis on relance la lecture. */
function resumeAllBgVideos(){
  _bgVideos.forEach(vid => {
    if (!vid.isConnected) return;
    /* Une vidéo masquée reste en pause (économie de batterie, et elle repart
       d'un état propre quand on la ré-affiche). */
    if (vid.getClientRects().length === 0) return;
    if (vid.paused) {
      const p = vid.play();
      if (p && p.catch) p.catch(() => {});
    }
    const t0 = vid.currentTime;
    setTimeout(() => {
      if (!vid.isConnected || vid.getClientRects().length === 0) return;
      if (vid.readyState >= 2 && vid.currentTime === t0) {
        try { vid.load(); } catch (e) {}
        const q = vid.play();
        if (q && q.catch) q.catch(() => {});
      }
    }, 900);
  });
}
/* Mobile : quitter l'onglet/l'app ou verrouiller l'écran met en pause les
   vidéos en fond — on les relance dès que la page redevient visible. */
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resumeAllBgVideos();
});
window.addEventListener('pageshow', resumeAllBgVideos);
window.addEventListener('focus', resumeAllBgVideos);

/* Pas de vidéo de fond en mode économie de données ou sur connexion très lente
   (le fond noir du hero reste lisible) : évite plusieurs dizaines de Mo inutiles. */
function bgVideoAllowed(){
  const c = navigator.connection;
  return !(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')));
}

/* Qualité d'origine pour tout le monde ; la version allégée (1280 px) n'est servie qu'en économie de données
   ou sur connexion lente (3G) — là où la vidéo d'origine retarderait l'affichage de la page. */
function pickBgVideo(desktop, mobile){
  const c = navigator.connection;
  const slow = c && (c.saveData || /(^|-)3g$/.test(c.effectiveType || ''));
  return (mobile && slow) ? mobile : desktop;
}

function createBgVideo(src){
  const vid = document.createElement('video');
  /* Attributs posés AVANT le src : requis par Safari/iOS pour autoriser
     l'autoplay muet sans intervention de l'utilisateur. */
  vid.setAttribute('muted', '');
  vid.setAttribute('autoplay', '');
  vid.setAttribute('loop', '');
  vid.setAttribute('playsinline', '');
  vid.setAttribute('webkit-playsinline', '');
  vid.setAttribute('preload', 'auto');
  vid.setAttribute('controls', 'false');
  vid.setAttribute('disableRemotePlayback', '');
  vid.controls = false;
  vid.muted = true;
  vid.disablePictureInPicture = true;
  vid.style.width = '100%';
  vid.style.height = '100%';
  /* Pas de poster : certains navigateurs mobiles affichent un bouton
     "play" par-dessus une image poster tant que la lecture n'a pas
     commencé. Sans poster, rien à afficher -> rien à cliquer. */
  vid.src = src;

  vid.addEventListener('playing', () => vid.classList.add('is-playing'));
  const tryPlay = () => {
    const p = vid.play();
    if (p && p.catch) p.catch(() => {});
  };
  tryPlay();
  vid.addEventListener('loadedmetadata', tryPlay);
  vid.addEventListener('canplay', tryPlay);
  /* Filet de sécurité boucle : si l'attribut loop n'est pas honoré par
     un navigateur (certaines versions mobiles), on relance à la main. */
  vid.addEventListener('ended', () => { vid.currentTime = 0; tryPlay(); });
  /* Filet de sécurité autoplay : si le navigateur bloque quand même,
     la vidéo démarre au premier geste de l'utilisateur, sans bouton visible. */
  const resumeOnGesture = () => { tryPlay(); };
  ['touchstart', 'click'].forEach(ev => document.addEventListener(ev, resumeOnGesture, { once: true, passive: true }));
  _bgVideos.push(vid);
  return vid;
}

/* ═══════════════ CARROUSEL HERO ═══════════════ */
let _carouselTimer = null;

function clearHeroCarousel(){
  if (_carouselTimer){ clearInterval(_carouselTimer); _carouselTimer = null; }
}

function initHeroCarousel(viewKey){
  clearHeroCarousel();
  setPageBg(viewKey);
  const wrap = document.getElementById('pageHeroWrap');
  if (!wrap) return;
  wrap.style.opacity = ''; wrap.style.visibility = '';
  const viewEl = document.getElementById('view-' + viewKey);

  /* Repli photos de bannière habituel — factorisé pour pouvoir aussi
     servir de filet de sécurité si une vidéo de fond générique (voir
     plus bas) ne charge pas (pas encore déposée dans l'admin média). */
  const showHeroImages = () => {
    let images = IMG.heroImages && IMG.heroImages[viewKey];
    if (!images || (Array.isArray(images) && images.length === 0)){
      wrap.style.display = 'none'; return;
    }
    if (!Array.isArray(images)) images = [images];
    wrap.style.display = '';
    wrap.querySelectorAll('.hero-slide').forEach(s => s.remove());
    const overlay = wrap.querySelector('.page-hero-overlay');
    images.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'hero-slide' + (i === 0 ? ' active' : '');
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.loading = i === 0 ? 'eager' : 'lazy';
      slide.appendChild(img);
      wrap.insertBefore(slide, overlay || null);
    });
    if (images.length > 1){
      let cur = 0;
      _carouselTimer = setInterval(() => {
        const slides = wrap.querySelectorAll('.hero-slide');
        if (!slides.length) return;
        slides[cur].classList.remove('active');
        cur = (cur + 1) % slides.length;
        slides[cur].classList.add('active');
        document.documentElement.style.setProperty('--page-bg-url','url('+images[cur]+')');
      }, 5000);
    }
  };

  /* ── Vidéo de fond (page Accueil uniquement si IMG.homeVideo est défini) ──
     Créée UNE SEULE FOIS : la retirer/recréer à chaque retour sur l'accueil
     la faisait repartir de zéro (perte de la boucle en cours, nouveau
     risque de blocage autoplay par le navigateur à chaque navigation).
     On se contente désormais de la montrer/masquer, l'élément <video>
     continue de jouer en arrière-plan même quand on quitte la page.
     Chaque vidéo (accueil, ou une rubrique via IMG.<vue>Video plus bas)
     a son propre calque identifié par data-view, pour coexister sans
     se marcher dessus au fil de la navigation. */
  const allVideoWraps = () => wrap.querySelectorAll('.hero-video-wrap');
  const videoWrapFor = (key) => wrap.querySelector('.hero-video-wrap[data-view="' + key + '"]');
  /* Affiche un seul calque vidéo et met les autres réellement en pause :
     au retour, play() repart d'un état propre au lieu d'une vidéo figée. */
  const showOnlyVideoWrap = (active) => allVideoWraps().forEach(v => {
    const on = v === active;
    v.style.display = on ? '' : 'none';
    const vd = v.querySelector('video');
    if (vd && !on) vd.pause();
  });

  if (viewKey === 'home' && IMG.homeVideo && !bgVideoAllowed()) {
    wrap.classList.add('is-dark');
    wrap.style.display = '';
    showOnlyVideoWrap(null);
    return;
  }

  if (viewKey === 'home' && IMG.homeVideo) {
    wrap.classList.add('is-dark');
    if (viewEl) viewEl.classList.remove('has-bg-video');
    wrap.style.display = '';
    let vw = videoWrapFor('home');
    if (!vw) {
      vw = document.createElement('div');
      vw.className = 'hero-video-wrap';
      vw.dataset.view = 'home';
      const vid = createBgVideo(pickBgVideo(IMG.homeVideo, IMG.homeVideoMobile));
      vw.appendChild(vid);
      const overlay = wrap.querySelector('.page-hero-overlay');
      wrap.insertBefore(vw, overlay || null);
    }
    showOnlyVideoWrap(vw);
    wrap.querySelectorAll('.hero-slide').forEach(s => s.remove());
    resumeAllBgVideos();
    return;
  }

  /* ── Vidéo de fond générique par rubrique (ex. IMG.servicesVideo) ──
     Le chemin est pré-câblé vers R2 (voir config/media.js) : dès qu'un
     fichier est déposé au même chemin depuis admin/media.html, cette
     vidéo prend le relais automatiquement, sans toucher au code. Tant
     qu'aucun fichier n'existe à ce chemin (404), repli silencieux sur
     les photos de bannière habituelles — aucune régression possible en
     attendant l'upload. */
  const genericVideoSrc = IMG[viewKey + 'Video'];
  if (genericVideoSrc) {
    wrap.classList.add('is-dark');
    if (viewEl) viewEl.classList.add('has-bg-video');
    wrap.style.display = '';
    let gvw = videoWrapFor(viewKey);
    if (!gvw) {
      gvw = document.createElement('div');
      gvw.className = 'hero-video-wrap';
      gvw.dataset.view = viewKey;
      const vid = createBgVideo(genericVideoSrc);
      vid.addEventListener('error', () => {
        gvw.style.display = 'none';
        wrap.classList.remove('is-dark');
        if (viewEl) viewEl.classList.remove('has-bg-video');
        showHeroImages();
      }, { once: true });
      gvw.appendChild(vid);
      const overlay = wrap.querySelector('.page-hero-overlay');
      wrap.insertBefore(gvw, overlay || null);
      /* Dès que la lecture démarre vraiment, les photos de bannière (affichées pendant le chargement) s'effacent. */
      vid.addEventListener('playing', () => setTimeout(() => {
        wrap.querySelectorAll('.hero-slide').forEach(sl => sl.remove());
        clearHeroCarousel();
      }, 900), { once: true });
    }
    showOnlyVideoWrap(gvw);
    const gv = gvw.querySelector('video');
    if (gv && gv.classList.contains('is-playing')) {
      wrap.querySelectorAll('.hero-slide').forEach(sl => sl.remove());
    } else {
      /* Pas d'écran noir pendant le chargement de la vidéo : photos de bannière dessous, la vidéo apparaît en fondu par-dessus. */
      showHeroImages();
      wrap.querySelectorAll('.hero-slide').forEach(sl => wrap.insertBefore(sl, gvw));
    }
    resumeAllBgVideos();
    return;
  }

  wrap.classList.toggle('is-dark', false);
  if (viewEl) viewEl.classList.remove('has-bg-video');
  showOnlyVideoWrap(null);
  showHeroImages();
}

/* ═══════════════ ROUTES (URL réelles) ═══════════════
   config/routes.js (SEO_ROUTES) associe chaque vue à une URL propre, avec
   son titre et sa description. goView() met à jour l'URL (History API) et
   les balises <head> ; les pages HTML statiques générées par
   tools/build-routes.mjs servent les mêmes URL aux moteurs de recherche. */
let currentView = 'home';
let currentSub = null;
function seoRouteFor(v, sub){
  if (typeof SEO_ROUTES === 'undefined') return null;
  if (v === 'service') return SEO_ROUTES.find(r => r.view === 'service' && r.cat === sub) || null;
  if (v === 'article') return SEO_ROUTES.find(r => r.view === 'article' && r.slug === sub) || null;
  const same = SEO_ROUTES.filter(r => r.view === v);
  return same.find(r => (r.sub || null) === (sub || null)) || same.find(r => !r.sub) || null;
}
/* Lien crawlable vers la page d'une prestation (repli sur /services/ si inconnue). */
function servicePath(catId){ const r = seoRouteFor('service', catId); return r ? r.path : '/services/'; }
function seoRouteForPath(path){
  if (typeof SEO_ROUTES === 'undefined') return null;
  const p = path.replace(/index\.html$/, '');
  return SEO_ROUTES.find(r => r.path === p) || null;
}
function setHeadAttr(sel, attr, val){ const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); }
function applySeoMeta(v, sub){
  const r = seoRouteFor(v, sub);
  if (!r) return;
  const en = LANG === 'en';
  const title = en && r.titleEn ? r.titleEn : r.title;
  const desc = en && r.descriptionEn ? r.descriptionEn : r.description;
  document.title = title;
  setHeadAttr('meta[name="description"]', 'content', desc);
  setHeadAttr('link[rel="canonical"]', 'href', 'https://bunkaio.com' + r.path);
  setHeadAttr('meta[property="og:url"]', 'content', 'https://bunkaio.com' + r.path);
  setHeadAttr('meta[property="og:title"]', 'content', title);
  setHeadAttr('meta[property="og:description"]', 'content', desc);
  setHeadAttr('meta[name="twitter:title"]', 'content', title);
  setHeadAttr('meta[name="twitter:description"]', 'content', desc);
  setHeadAttr('meta[name="robots"]', 'content', r.index ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, nofollow');
}
/* Clic sur un vrai lien <a href> : navigation SPA, sauf clic modifié (nouvel onglet). */
function navLink(e, v, subTab){
  if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1)) return true;
  closeMobileMenu();
  goView(v, subTab);
  return false;
}
window.addEventListener('popstate', () => {
  const r = seoRouteForPath(location.pathname);
  goView(r ? r.view : 'home', r ? (r.cat || r.slug || r.sub || null) : null, { fromPop: true });
});

function goView(v, subTab, opts){
  opts = opts || {};
  currentView = v;
  currentSub = (v === 'service' || v === 'article' || v === 'legal') ? (subTab || null) : null;
  const route = seoRouteFor(v, subTab);
  if (route && !opts.fromPop && !opts.initial && location.pathname.replace(/index\.html$/, '') !== route.path) {
    history.pushState({ v }, '', route.path);
  }
  applySeoMeta(v, subTab);
  if (!opts.initial && window.track) track('pageview');
  const run = () => {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');
    document.body.dataset.view = v;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === ((v === 'service' || v === 'discover') ? 'services' : v === 'about' ? 'contact' : v)));
    window.scrollTo({ top:0, behavior:'instant' });
    updateHeroScrollFx();
    updateNavScrollState();
    closeMobileMenu();
    if (v !== 'quiz') setProgress(0);
    const quizNav = document.getElementById('quizNavRow');
    if (quizNav) quizNav.style.display = (v === 'quiz') ? '' : 'none';
    setPageBg(v);
    initHeroCarousel(v);
    /* Bannière "Un projet en tête ?" du footer : masquée sur l'accueil
       (déjà plusieurs CTA "Estimer mon projet" sur cette page), visible
       partout ailleurs. */
    const footerCta = document.querySelector('.footer-cta-row');
    if (footerCta) footerCta.style.display = (v === 'home') ? 'none' : '';
    /* Revenir sur une vue peut avoir mis en pause ses vidéos de fond
       (navigateurs mobiles) — on les relance systématiquement. */
    resumeAllBgVideos();
    if (v === 'services') { renderServices(); renderServiceLinks(); setSvcTab('catalogue'); }
    if (v === 'share') renderGoogleReview();
    if (v === 'drone') { renderDroneCats(); renderDroneProjects(activeDroneCat); }
    if (v === 'portfolio') {
      /* Toujours re-rendre : la langue a pu changer depuis la dernière visite de cette vue */
      const curPfCat = pfLoaded ? (document.querySelector('#pfTabs .pf-cat-tab.active')?.dataset.cat || PF_CATS[0].id) : PF_CATS[0].id;
      renderPfTabs(); selectPfTab(curPfCat); pfLoaded = true;
    }
    if (v === 'portfolio') renderPortfolioLinks();
    if (v === 'partners') {
      renderPartnersAccordion(); renderLogoCarousel();
      setPartnersTab(subTab === 'collab' || subTab === 'apply' ? subTab : 'program');
      const img = document.getElementById('img-partners-banner'); if (img && !img.src) img.src = IMG.partners;
      const imgCollab = document.getElementById('img-collab-side'); if (imgCollab && !imgCollab.src) imgCollab.src = IMG.collab;
    }
    if (v === 'service') renderServicePage(subTab);
    if (v === 'article') renderArticlePage(subTab);
    if (v === 'advice') renderAdvicePage();
    if (v === 'discover') renderDiscoverPage();
    if (v === 'legal') { renderFaqAccordion(); renderPrivacyAccordion(); renderCgvAccordion(); setLegalTab(subTab === 'privacy' || subTab === 'cgv' ? subTab : 'faq', true); }
    if (v === 'about') initAboutStats();
    if (v === 'about') { const ph = document.getElementById('img-about'); if (ph && IMG.aboutPhoto && !ph.getAttribute('src')) { ph.src = IMG.aboutPhoto; ph.hidden = false; } }
    /* Anime au scroll tous les éléments .rv de la vue active — cohérent
       sur l'ensemble du site, plus besoin de le câbler page par page.
       .reassure-section utilise un seuil de déclenchement plus tardif
       pour que l'animation soit visible plutôt que déjà terminée. */
    autoReveal(document.getElementById('view-' + v));
    document.querySelectorAll('#view-' + v + ' .rv:not(.in):not(.reassure-section)').forEach(observe);
    document.querySelectorAll('#view-' + v + ' .reassure-section:not(.in)').forEach(observeLate);
  };
  if (opts.initial) { run(); return; }
  const veil = document.getElementById('veil');
  veil.classList.remove('sweep');
  void veil.offsetWidth;
  veil.classList.add('sweep');
  setTimeout(run, 420);
}

/* ═══════════════ QUIZ ═══════════════ */
let currentStep = 1;
function setProgress(p){ document.getElementById('progressFill').style.width = p + '%'; }

/* Fond de la page « Devis » : il suit le choix du client — photo de la catégorie dès qu'elle est choisie,
   puis photo de la formule (la même illustration que dans la liste des formules). Retour à l'étape 1 = fond d'origine. */
function quizBgPhoto(){
  if (currentView !== 'quiz') return;
  const wrap = document.getElementById('pageHeroWrap'); if (!wrap) return;
  const reset = () => { wrap.querySelectorAll('.hero-slide.dyn-slide').forEach(x => x.remove()); wrap.querySelectorAll('.hero-slide').forEach((x, i) => x.classList.toggle('active', i === 0)); setPageBg('quiz'); };
  if (!S.cat || currentStep < 2) { reset(); return; }
  const catUrl = IMG.servicePhotos && IMG.servicePhotos[S.cat];
  const useTier = S.tier && currentStep >= 3 && IMG.formulas;
  const url = useTier ? `${IMG.formulas}/${S.cat}-${S.tier}.webp` : catUrl;
  if (!url) { reset(); return; }
  clearHeroCarousel();
  wrap.style.display = '';
  wrap.querySelectorAll('.hero-slide').forEach(x => x.classList.remove('active'));
  let slide = [...wrap.querySelectorAll('.hero-slide.dyn-slide')].find(x => x.dataset.url === url);
  if (!slide) {
    slide = document.createElement('div'); slide.className = 'hero-slide dyn-slide'; slide.dataset.url = url;
    const img = document.createElement('img'); img.alt = ''; img.src = url; img.loading = 'eager';
    img.onerror = () => { if (catUrl && img.src !== catUrl) { img.src = catUrl; slide.dataset.url = catUrl; document.documentElement.style.setProperty('--page-bg-url', 'url(' + catUrl + ')'); } else slide.remove(); };
    slide.appendChild(img);
    wrap.insertBefore(slide, wrap.querySelector('.page-hero-overlay') || null);
  }
  void slide.offsetWidth; slide.classList.add('active');
  const dyn = [...wrap.querySelectorAll('.hero-slide.dyn-slide')]; while (dyn.length > 3) { const old = dyn.shift(); if (old !== slide) old.remove(); }
  document.documentElement.style.setProperty('--page-bg-url', 'url(' + url + ')');
}

function quizStep(n){
  currentStep = n;
  if (n >= 2 && n <= 5 && window.track) track('quiz_step', String(n));
  document.querySelectorAll('.qstep').forEach(s => s.classList.remove('active'));
  document.getElementById('qs-' + n).classList.add('active');
  setProgress(n / 6 * 100);
  /* Scroll instantané (pas 'smooth') : l'apparition en fondu du contenu
     de l'étape démarre au même instant que le changement de classe
     .active — avec un scroll animé, si l'utilisateur était loin en bas
     de l'étape précédente, l'animation se jouait hors champ pendant la
     remontée et l'étape apparaissait déjà entièrement visible, sans que
     personne n'ait le temps de voir l'effet. */
  window.scrollTo({ top:0, behavior:'instant' });
  if (n === 5) { renderTravelField(); updateQuizPayReassurance(); }
  updateQuizNext();
  quizBgPhoto();
}

/* Bouton « Suivant » manuel : actif seulement quand le choix de l'étape est fait. */
function updateQuizNext(){
  const ok = { 2: !!S.prof, 3: !!S.tier };
  document.querySelectorAll('.qnext').forEach(b => { b.disabled = !ok[+b.dataset.step]; });
}
function quizNext(){
  if (currentStep === 2 && S.prof) goToTiers();
  else if (currentStep === 3 && S.tier) { renderRecap(); renderOptions(); quizStep(4); }
}
function pickTier(id, card){
  S.tier = id;
  document.querySelectorAll('#tierList .tier-card').forEach(x => { x.classList.toggle('selected', x === card); x.classList.toggle('open', x === card); });
  renderRecap(); renderOptions(); updateQuizNext();
  quizBgPhoto();
}

/* Bouton "Retour" toujours visible du questionnaire : remonte d'une
   étape, ou renvoie à l'accueil si on est déjà sur la première. */
function quizGoBack(){
  if (currentStep > 1) quizStep(currentStep - 1);
  else goView('home');
}

function updateQuizPayReassurance(){
  const el = document.getElementById('quizReassurancePay');
  if (!el || !S.tier) return;
  if (S.tier === 'sub') {
    el.innerHTML = LANG === 'fr'
      ? '<strong>Côté règlement :</strong> votre abonnement est réglable chaque mois par carte bancaire, sans engagement de paiement anticipé.'
      : '<strong>On the payment side:</strong> your subscription is billed monthly by credit card, with no upfront payment required.';
    return;
  }
  const res = computeTotal();
  const threeX = Math.round((res.amount + travelFee()) / 3).toLocaleString('fr-FR');
  el.innerHTML = LANG === 'fr'
    ? `<strong>Côté règlement :</strong> soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, ou acompte 30 % + solde. Sans aucun frais supplémentaire.`
    : `<strong>On the payment side:</strong> that's 3 × €${threeX} interest-free with Klarna — or credit card, or a 30% deposit + balance. No extra fees.`;
}

function goToTiers(){
  renderTiers();
  quizStep(3);
}

function goToCoords(){
  quizStep(5);
  checkQuizForm();
}

/* Va directement à l'étape "profil" du formulaire de devis pour une
   catégorie donnée — utilisé par le carrousel de prestations de la
   section "Le studio" (saute l'étape de choix de catégorie, déjà
   fait via le clic sur la carte). */
/* Prestation « bientôt disponible » (Lumen) : pas de réservation en ligne, on propose d'être prévenu de l'ouverture. */
const isComingSoon = id => { const c = CATS.find(x => x.id === id); return !!(c && c.comingSoon); };
function goToComingSoon(catId){
  const c = CATS.find(x => x.id === catId);
  goView('contact');
  setTimeout(() => {
    const m = document.getElementById('ctMsg');
    if (m && !m.value) m.value = t({fr:'Bonjour, je souhaite être prévenu(e) de l\'ouverture des réservations de ', en:'Hello, I would like to be notified when bookings open for '}) + (c ? t(c.name) : '') + '.';
  }, 450);
  scrollToContactForm();
}
/* Amène en haut du formulaire de contact. Le haut de la page contact (bannière, photos) finit de se charger
   après l'arrivée : la position est donc recalée plusieurs fois, sauf si le visiteur reprend la main. */
function scrollToContactForm(){
  let cancelled = false;
  const stop = () => { cancelled = true; };
  const evs = ['wheel', 'touchstart', 'keydown', 'mousedown'];
  evs.forEach(ev => window.addEventListener(ev, stop, { once: true, passive: true }));
  const nav = (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 90) + 16;
  const go = behavior => {
    if (cancelled) return;
    const f = document.getElementById('ctForm'); if (!f) return;
    const top = f.getBoundingClientRect().top + window.scrollY - nav;
    if (Math.abs(top - window.scrollY) > 4) window.scrollTo({ top, behavior });
  };
  [[500, 'smooth'], [1200, 'instant'], [2200, 'instant'], [3600, 'instant']].forEach(([ms, b]) => setTimeout(() => go(b), ms));
  setTimeout(() => evs.forEach(ev => window.removeEventListener(ev, stop)), 4000);
}
function goToQuizCategory(catId){
  if (isComingSoon(catId)) { goToComingSoon(catId); return; }
  goView('quiz');
  S.cat = catId; S.tier = null; S.prof = null;
  const box = document.getElementById('profQBox');
  if (box) box.style.display = 'none';
  renderProfiles();
  quizStep(2);
}

/* Renvoie vers la page Services, filtrée sur la catégorie concernée —
   c'est le tableau de tarifs de ce domaine qui s'affiche directement. */
/* Depuis le carrousel d'accueil : page « Découvrir chaque prestation », rubrique de la catégorie choisie ouverte et centrée. */
let _discoverFocus = null;
function goToDiscover(catId){ _discoverFocus = catId || null; goView('discover'); }
document.addEventListener('click', (e) => {
  const a = e.target.closest ? e.target.closest('[data-discover]') : null;
  if (!a) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
  e.preventDefault(); goToDiscover(a.dataset.discover);
});
function goToServiceTable(catId){
  activeServiceFilter = catId;
  goView('services');
}

/* Prestations — section "Le studio" (page Accueil) : sélecteur + aperçu.
   Une pastille par prestation (barre de progression, avance seule toutes les 5,5 s) ; la carte d'aperçu
   montre la photo, le prix « dès », trois points forts et le bouton vers le devis de cette catégorie.
   Le fond de la section prend la photo de la prestation affichée. Survol ou clic = choisir ;
   le survol met le défilement en pause. */
let msIndex = 0, msTimer = null, msHover = false, msHold = false;
const MS_DELAY = 5500;
function missionPillName(c){ return c.lumen ? t({fr:'Photobooth Lumen · bientôt', en:'Lumen photobooth · soon'}) : String(t(c.name)).split(' — ')[0].split(',')[0]; }
function missionPreviewHTML(c){
  const f = catFacts(c), en = LANG === 'en';
  const to = t({fr:'à', en:'to'}), wd = t({fr:'jours ouvrés', en:'working days'});
  const dly = (f.dMin === f.dMax ? f.dMin : f.dMin + ' ' + to + ' ' + f.dMax) + ' ' + wd;
  const pts = [t({fr:'Livraison en ', en:'Delivery in '}) + dly];
  if (f.pMax) pts.push((f.pMin === f.pMax ? f.pMin : f.pMin + ' ' + to + ' ' + f.pMax) + ' ' + t({fr:'photos HD retouchées', en:'retouched HD photos'}));
  pts.push(f.hasVideo ? t({fr:'Vidéo et Reels selon la formule', en:'Video and Reels depending on the package'}) : t({fr:'Galerie privée de téléchargement', en:'Private download gallery'}));
  if (POLAS[c.id]) pts.push(t(POLAS[c.id].name) + ' — ' + specialTotal(POLAS[c.id]).toLocaleString('fr-FR') + ' €');
  const url = IMG.servicePhotos && IMG.servicePhotos[c.id];
  return `<a class="ms-im" href="${servicePath(c.id)}" aria-label="${t(c.name)}" onclick="return navLink(event,'service','${c.id}')"${url ? ` style="background-image:url('${url}')"` : ''}></a>
    <div class="ms-tx">
      ${c.comingSoon ? `<span class="soon-chip">${t({fr:'Bientôt disponible', en:'Coming soon'})}</span>` : ''}
      <h3><a href="${servicePath(c.id)}" onclick="return navLink(event,'service','${c.id}')">${t(c.name)}</a></h3>
      <div class="ms-from">${t({fr:'dès', en:'from'})} <b>${f.from.toLocaleString('fr-FR')} €</b></div>
      <ul>${pts.slice(0, 4).map(p => `<li>${p}</li>`).join('')}</ul>
      <div class="ms-actions"><a class="ms-cta" href="${servicePath(c.id)}" onclick="event.preventDefault();goToQuizCategory('${c.id}')">${c.comingSoon ? t({fr:'Me prévenir de l\'ouverture', en:'Notify me when it opens'}) : t({fr:'Estimer ce projet', en:'Estimate this project'})} →</a><a class="ms-link" href="${servicePath(c.id)}" onclick="return navLink(event,'service','${c.id}')">${t({fr:'Voir la prestation', en:'See the service'})}</a></div>
    </div>`;
}
function missionSelect(i, fromAuto){
  const sel = document.getElementById('missionServicesTrack'), prev = document.getElementById('missionPreview');
  if (!sel || !prev || !CATS.length) return;
  msIndex = ((i % CATS.length) + CATS.length) % CATS.length;
  const c = CATS[msIndex];
  [...sel.children].forEach((b, k) => { b.classList.remove('on'); b.setAttribute('aria-selected', String(k === msIndex)); if (k === msIndex) { void b.offsetWidth; b.classList.add('on'); } });
  prev.classList.remove('swap'); void prev.offsetWidth; prev.classList.add('swap');
  prev.innerHTML = missionPreviewHTML(c);
  missionShowBg(c.id);
  clearTimeout(msTimer);
  if (!msHover && !REDUCED_MOTION) msTimer = setTimeout(missionTick, MS_DELAY);
}
function missionTick(){
  const wrap = document.getElementById('missionVideoWrap');
  if (wrap && wrap.classList.contains('active') && !document.hidden && !msHover && !msHold) missionSelect(msIndex + 1, true);
  else { clearTimeout(msTimer); msTimer = setTimeout(missionTick, 1500); }
}
function renderMissionServices(){
  const sel = document.getElementById('missionServicesTrack');
  if (!sel || !CATS.length) return;
  sel.innerHTML = CATS.map((c, i) => `<button type="button" class="ms-pill" role="tab" data-i="${i}" data-cat="${c.id}">${missionPillName(c)}<i></i></button>`).join('');
  const bgs = document.getElementById('missionTileBgs');
  if (bgs && !bgs.children.length) bgs.innerHTML = CATS.map(c => { const u = IMG.servicePhotos && IMG.servicePhotos[c.id]; return `<div class="mt-bg" data-cat="${c.id}"${u ? ` style="background-image:url('${u}')"` : ''}></div>`; }).join('');
  missionSelect(msIndex);
}
function missionShowBg(catId){
  document.querySelectorAll('#missionTileBgs .mt-bg').forEach(b => b.classList.toggle('on', b.dataset.cat === catId));
}
function initMissionServicesAutoplay(){
  const box = document.getElementById('missionServices');
  if (!box || box.dataset.autoplayInit) return;
  box.dataset.autoplayInit = '1';
  box.addEventListener('mouseover', e => {
    const p = e.target.closest ? e.target.closest('.ms-pill') : null;
    if (p && matchMedia('(hover: hover)').matches && +p.dataset.i !== msIndex) missionSelect(+p.dataset.i);
  });
  /* Clic ou appui sur une pastille : affiche les infos de cette prestation dans le carrousel (sans changer de page) ;
     le défilement automatique reprend ensuite à partir de ce choix. */
  box.addEventListener('click', e => {
    const p = e.target.closest ? e.target.closest('.ms-pill') : null; if (!p) return;
    missionSelect(+p.dataset.i);
  });
  /* Mobile : glisser la carte d'aperçu vers la gauche / la droite pour parcourir les prestations. */
  const prev = document.getElementById('missionPreview');
  if (prev) {
    let sx = null, sy = 0;
    prev.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    prev.addEventListener('touchend', e => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) missionSelect(msIndex + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }
  /* Pause seulement pendant la lecture de la carte (souris dessus) ; les pastilles, elles, n'arrêtent pas le défilement. */
  if (prev) {
    prev.addEventListener('mouseenter', () => { msHover = true; box.classList.add('paused'); clearTimeout(msTimer); });
    prev.addEventListener('mouseleave', () => { msHover = false; box.classList.remove('paused'); missionSelect(msIndex); });
  }
}

function renderCats(){
  const el = document.getElementById('catList');
  el.innerHTML = '';
  CATS.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'cat-item stagger';
    d.style.animationDelay = (0.28 + i * 0.07) + 's';
    const photoUrl = IMG.servicePhotos && IMG.servicePhotos[c.id];
    d.innerHTML = `
      <div class="cat-left">
        <div class="cat-photo"${photoUrl ? ` style="background-image:url('${photoUrl}')"` : ''}></div>
        <div class="cat-name">${t(c.name)}</div>
      </div>
      <div class="cat-right">
        <div class="cat-tag">${c.comingSoon ? `<b class="soon-chip">${t({fr:'Bientôt disponible', en:'Coming soon'})}</b> ` : ''}${t(c.tag)}</div>
        <div class="cat-arrow"></div>
      </div>`;
    if (S.cat === c.id) d.classList.add('selected');
    d.onclick = () => {
      if (c.comingSoon) { goToComingSoon(c.id); return; }
      S.cat = c.id; S.tier = null; S.prof = null;
      document.querySelectorAll('#catList .cat-item').forEach(x => x.classList.toggle('selected', x === d));
      document.getElementById('profQBox').style.display = 'none';
      renderProfiles();
      quizStep(2); /* étape 1 : on avance directement au clic, sans bouton « Suivant » */
    };
    el.appendChild(d);
  });

  /* "Collaboration" — pas une prestation du catalogue (n'entre pas dans
     CATS, pour ne pas polluer la grille Services ni le carrousel
     accueil) : renvoie directement vers Partenaires → onglet
     Collaboration plutôt que de continuer le questionnaire de devis. */
  const collabItem = document.createElement('div');
  collabItem.className = 'cat-item stagger';
  collabItem.style.animationDelay = (0.28 + CATS.length * 0.07) + 's';
  const collabPhotoUrl = IMG.collab;
  collabItem.innerHTML = `
    <div class="cat-left">
      <div class="cat-photo"${collabPhotoUrl ? ` style="background-image:url('${collabPhotoUrl}')"` : ''}></div>
      <div class="cat-name">${t({ fr: 'Collaboration', en: 'Collaboration' })}</div>
    </div>
    <div class="cat-right">
      <div class="cat-tag">${t({ fr: 'Marque, lieu, média, créateur·rice', en: 'Brand, venue, media, another creator' })}</div>
      <div class="cat-arrow"></div>
    </div>`;
  collabItem.onclick = () => goView('partners', 'collab');
  el.appendChild(collabItem);
}

/* Centralise la recherche de description utilisée à la fois par le
   survol (aperçu) et le clic (sélection), pour ne l'écrire qu'une fois. */
function getProfileDescription(profId){
  if (S.cat === 'lumen') {
    const lp = LUMEN_PROFILES.find(x => x.id === profId);
    return lp ? lp.desc[LANG] : '';
  }
  if (S.cat === 'photo-part') {
    const pp = PHOTO_PART_PROFILES.find(x => x.id === profId);
    return pp ? pp.desc[LANG] : '';
  }
  return PROFILE_DESCRIPTIONS[profId] ? PROFILE_DESCRIPTIONS[profId][LANG] : '';
}
function showProfileDescription(profId){
  const box = document.getElementById('profQBox');
  if (!box) return;
  box.style.display = 'block';
  box.innerHTML = getProfileDescription(profId);
}

let _profAdvanceTimer = null;
function renderProfiles(){
  const el = document.getElementById('profGrid');
  el.innerHTML = '';
  const profiles = S.cat === 'lumen'
    ? LUMEN_PROFILES
    : S.cat === 'photo-part'
    ? PHOTO_PART_PROFILES
    : (CAT_PROFILES[S.cat] ? CAT_PROFILES[S.cat].map(id => PROFILES.find(p => p.id === id)).filter(Boolean) : PROFILES);
  profiles.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'prof-card stagger' + (S.prof === p.id ? ' selected' : '');
    d.style.animationDelay = (0.26 + i * 0.06) + 's';
    d.innerHTML = `
      <div class="prof-icon">${getIcon(p.icon)}</div>
      <div class="prof-name">${t(p.name)}</div>`;
    /* Survol = simple aperçu, ne sélectionne rien : on peut comparer
       librement les profils avant de choisir. En quittant la carte sans
       cliquer, l'encadré revient à la sélection en cours (ou se masque
       s'il n'y en a pas encore). */
    d.addEventListener('mouseenter', () => showProfileDescription(p.id));
    d.addEventListener('mouseleave', () => {
      if (S.prof) showProfileDescription(S.prof);
      else { const box = document.getElementById('profQBox'); if (box) box.style.display = 'none'; }
    });
    d.onclick = () => {
      document.querySelectorAll('.prof-card').forEach(x => x.classList.remove('selected'));
      d.classList.add('selected');
      S.prof = p.id;
      showProfileDescription(p.id);
      /* Délai volontairement généreux (c'était 820ms, bien trop court
         pour lire l'explication) : laisse le temps de lire avant
         d'avancer automatiquement. clearTimeout évite d'empiler
         plusieurs avances si on reclique vite sur une autre carte. */
      S.tier = null;
      updateQuizNext();
    };
    el.appendChild(d);
  });
  const phBox = document.getElementById('profQBox');
  if (phBox) phBox.dataset.ph = t({fr:'Touchez un profil pour voir sa description.', en:'Tap a profile to see its description.'});
  if (S.prof) showProfileDescription(S.prof);
}

function getIcon(type){
  /* currentColor plutôt qu'un hex figé : la couleur se pilote entièrement
     depuis .prof-icon en CSS (blanc par défaut sur la bannière photo, ou
     héritée du fond noir une fois la carte sélectionnée). */
  const stroke = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    agency:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><rect x="10" y="16" width="36" height="30" rx="2"/><line x1="10" y1="26" x2="46" y2="26"/><line x1="22" y1="26" x2="22" y2="46"/><line x1="34" y1="26" x2="34" y2="46"/><line x1="16" y1="10" x2="16" y2="16"/><line x1="40" y1="10" x2="40" y2="16"/></svg>`,
    promo:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M12 26 L28 12 L44 26"/><path d="M16 24 L16 44 L40 44 L40 24"/><rect x="24" y="32" width="8" height="12"/></svg>`,
    marque:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M18 14 L38 14 L42 22 L28 46 L14 22 Z"/><line x1="14" y1="22" x2="42" y2="22"/><line x1="22" y1="14" x2="28" y2="46"/><line x1="34" y1="14" x2="28" y2="46"/></svg>`,
    artisan: `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M20 12 L36 12 L36 22 Q36 28 28 28 Q20 28 20 22 Z"/><line x1="28" y1="28" x2="28" y2="38"/><path d="M22 44 L34 44"/><line x1="28" y1="38" x2="28" y2="44"/></svg>`,
    gastro:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M14 30 Q14 18 28 18 Q42 18 42 30 Z"/><line x1="10" y1="34" x2="46" y2="34"/><line x1="28" y1="12" x2="28" y2="18"/></svg>`,
    paysage: `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="40" cy="16" r="5"/><path d="M8 42 L20 28 L30 38 L38 30 L48 42"/><line x1="8" y1="46" x2="48" y2="46"/></svg>`,
    event:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M28 10 L32 22 L44 22 L34 30 L38 42 L28 34 L18 42 L22 30 L12 22 L24 22 Z"/></svg>`,
    autre:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="28" cy="28" r="16"/><path d="M24 24 Q24 20 28 20 Q32 20 32 24 Q32 27 28 28 L28 32"/><circle cx="28" cy="38" r="0.5"/></svg>`,
    camera:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M10 20h6l3-5h18l3 5h6a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V22a2 2 0 0 1 2-2z"/><circle cx="28" cy="32" r="8"/></svg>`,
    person:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="28" cy="20" r="9"/><path d="M12 46 Q12 32 28 32 Q44 32 44 46"/></svg>`,
    couple:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="20" cy="20" r="8"/><path d="M8 46 Q8 33 20 33 Q26 33 30 37"/><circle cx="36" cy="20" r="8"/><path d="M48 46 Q48 33 36 33 Q30 33 26 37"/></svg>`,
    group:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="14" cy="22" r="7"/><path d="M4 45 Q4 34 14 34 Q18 34 21 36"/><circle cx="28" cy="18" r="9"/><path d="M14 45 Q14 32 28 32 Q42 32 42 45"/><circle cx="42" cy="22" r="7"/><path d="M52 45 Q52 34 42 34 Q38 34 35 36"/></svg>`,
    lumen:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="28" cy="28" r="13"/><circle cx="28" cy="28" r="5"/><line x1="28" y1="10" x2="28" y2="15"/><line x1="28" y1="41" x2="28" y2="46"/><line x1="10" y1="28" x2="15" y2="28"/><line x1="41" y1="28" x2="46" y2="28"/><line x1="38.2" y1="17.8" x2="34.4" y2="21.6"/><line x1="17.8" y1="38.2" x2="21.6" y2="34.4"/><line x1="17.8" y1="17.8" x2="21.6" y2="21.6"/><line x1="38.2" y1="38.2" x2="34.4" y2="34.4"/></svg>`,
    product: `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M14 20 L28 12 L42 20 L42 38 L28 46 L14 38 Z"/><path d="M14 20 L28 28 L42 20"/><line x1="28" y1="28" x2="28" y2="46"/></svg>`
  };
  return icons[type] || icons.autre;
}

/* Niveaux de prestation en accordéon : une ligne par formule (photo, nom, badge, prix), le détail se déplie au choix. */
function tierAccordionize(){
  const list = document.getElementById('tierList'); if (!list) return;
  list.querySelectorAll('.tier-card').forEach(card => {
    if (card.classList.contains('tier-acc')) return;
    const head = card.querySelector('.tier-head'), badge = card.querySelector('.tier-badge'), photo = card.querySelector('.tier-photo');
    if (!head) return;
    card.classList.add('tier-acc');
    const sum = document.createElement('div'); sum.className = 'tier-sum';
    if (photo) { const th = photo.cloneNode(); th.className = 'formula-photo tier-thumb'; th.removeAttribute('loading'); sum.appendChild(th); }
    const mid = document.createElement('div'); mid.className = 'tier-mid';
    if (badge) mid.appendChild(badge);
    mid.appendChild(head);
    sum.appendChild(mid);
    const chev = document.createElement('i'); chev.className = 'tier-chev'; chev.setAttribute('aria-hidden', 'true'); sum.appendChild(chev);
    const more = document.createElement('div'); more.className = 'tier-more';
    const inner = document.createElement('div'); inner.className = 'tier-more-in';
    [...card.childNodes].forEach(n => inner.appendChild(n));
    more.appendChild(inner);
    card.append(sum, more);
    const isOpen = card.classList.contains('selected') || (!S.tier && badge && /(choisi|popular)/i.test(badge.textContent));
    card.classList.toggle('open', !!isOpen);
  });
}
function renderTiers(){
  renderTiersBase();
  tierAccordionize();
  const list = document.getElementById('tierList');
  if (list) list.insertAdjacentHTML('afterbegin', partnerQuizNotice());
}
function renderTiersBase(){
  const cat = CATS.find(c => c.id === S.cat);
  if (!cat) return;
  const subEl = document.getElementById('tierSub');
  const el = document.getElementById('tierList');
  el.innerHTML = '';
  /* ─── Lumen : trois formules propriétaires ─── */
  if (S.cat === 'lumen') {
    subEl.textContent = LANG === 'fr'
      ? 'Lumen by Bunkaio — quatre formules pour votre mariage, de la découverte (2 h) à l\'entièrement sur-mesure.'
      : 'Lumen by Bunkaio — four packages for your wedding, from a 2-hour starter to fully bespoke.';
    LUMEN_TIERS.forEach((lt, idx) => {
      const isSurm = lt.id === 'surm';
      const priceStr = isSurm
        ? (LANG === 'fr' ? 'À partir de ' : 'From ') + lt.price.toLocaleString('fr-FR') + '€'
        : pp(lt.price).toLocaleString('fr-FR') + '€';
      const chfLine = (LANG === 'en' && lt.priceUSD)
        ? `<div style="font-size:12px;color:var(--grey);margin-top:4px">$${lt.priceUSD.toLocaleString('en-US')}</div>`
        : '';
      const payLine = isSurm
        ? (LANG === 'fr' ? 'Devis personnalisé — réponse sous 48h ouvrées' : 'Personalised quote — reply within 48 working hours')
        : (LANG === 'fr'
            ? `Soit 3 × ${Math.round(pp(lt.price) / 3).toLocaleString('fr-FR')}€ sans frais`
            : `That's 3 × €${Math.round(pp(lt.price) / 3).toLocaleString('fr-FR')} interest-free`);
      const d = document.createElement('div');
      d.className = 'tier-card stagger';
      d.style.animationDelay = (0.24 + idx * 0.1) + 's';
      d.innerHTML = `
        ${lt.promo ? `<div class="tier-promo">${t(lt.promo)}</div>` : ''}${lt.badge ? `<div class="tier-badge">${t(lt.badge)}</div>` : ''}
        <div class="tier-head">
          <div class="tier-name">${t(lt.name)}</div>
          <div class="tier-price">${priceStr}</div>
        </div>
        ${chfLine}
        <div class="tier-pay-line">${payLine}</div>
        <div class="tier-detail">${t(lt.items).join(' · ')}</div>`;
      d.insertAdjacentHTML('afterbegin', formulaPhotoHTML(S.cat, lt.id, 'tier-photo')); d.dataset.tier = lt.id; if (S.tier === lt.id) d.classList.add('selected'); d.onclick = () => pickTier(lt.id, d);
      el.appendChild(d);
    });
    return;
  }
  subEl.textContent = t(cat.name) + ' — ' + (POLAS[S.cat]
    ? t(POLAS[S.cat].sub)
    : (LANG === 'fr' ? 'quatre formules, de la découverte à l\'expérience éditoriale complète.' : 'four packages, from the starter offer to the complete editorial experience.'));
  let slot = 0;
  if (POLAS[S.cat]) {
    const polas = POLAS[S.cat];
    const total = pp(specialTotal(polas));
    const threeX = Math.round(total / 3).toLocaleString('fr-FR');
    const payLine = LANG === 'fr' ? `Soit 3 × ${threeX}€ sans frais` : `That's 3 × €${threeX} interest-free`;
    const badge = t(polas.badge);
    const studioNote = t(polas.studioNote);
    const d = document.createElement('div');
    d.className = 'tier-card stagger';
    d.style.animationDelay = (0.24 + slot++ * 0.1) + 's';
    d.innerHTML = `
      ${polas.promo ? `<div class="tier-promo">${t(polas.promo)}</div>` : ''}<div class="tier-badge">${badge}</div>
      <div class="tier-head">
        <div class="tier-name">${t(polas.name)}</div>
        <div class="tier-price">${total.toLocaleString('fr-FR')}€</div>
      </div>
      <div class="tier-pay-line">${payLine}</div>
      <div class="tier-detail">${t(polas.items).join(' · ')} · ${studioNote}</div>`;
    d.insertAdjacentHTML('afterbegin', formulaPhotoHTML(S.cat, polas.id, 'tier-photo')); d.dataset.tier = polas.id; if (S.tier === polas.id) d.classList.add('selected'); d.onclick = () => pickTier(polas.id, d);
    el.appendChild(d);
  }
  TIERS.forEach((tier) => {
    const td = cat.tiers[tier.id];
    const threeX = Math.round(pp(td.price) / 3).toLocaleString('fr-FR');
    const payLine = LANG === 'fr' ? `Soit 3 × ${threeX}€ sans frais` : `That's 3 × €${threeX} interest-free`;
    const d = document.createElement('div');
    d.className = 'tier-card stagger';
    d.style.animationDelay = (0.24 + slot++ * 0.1) + 's';
    d.innerHTML = `
      ${td.promo ? `<div class="tier-promo">${t(td.promo)}</div>` : ''}${tier.badge ? `<div class="tier-badge">${t(tier.badge)}</div>` : ''}
      <div class="tier-head">
        <div class="tier-name">${t(tier.name)}</div>
        <div class="tier-price">${pp(td.price).toLocaleString('fr-FR')}€</div>
      </div>
      <div class="tier-pay-line">${payLine}</div>
      <div class="tier-detail">${t(td.items).join(' · ')}</div>`;
    d.insertAdjacentHTML('afterbegin', formulaPhotoHTML(S.cat, tier.id, 'tier-photo')); d.dataset.tier = tier.id; if (S.tier === tier.id) d.classList.add('selected'); d.onclick = () => pickTier(tier.id, d);
    el.appendChild(d);
  });
  if (S.tier === 'sub' && !subAvailable(S.cat)) S.tier = null;
  if (subAvailable(S.cat)) {
    const sub = SUBS[S.cat];
    const d = document.createElement('div');
    d.className = 'tier-card sub-card stagger';
    d.style.animationDelay = (0.24 + slot++ * 0.1) + 's';
    const badge = LANG === 'fr' ? 'Abonnement mensuel' : 'Monthly plan';
    const engagement = LANG === 'fr' ? 'Engagement minimum : 6 mois' : 'Minimum commitment: 6 months';
    const saving = LANG === 'fr' ? 'Bien plus avantageux qu\'un achat ponctuel' : 'Far better value than individual bookings';
    d.innerHTML = `
      ${sub.promo ? `<div class="tier-promo">${t(sub.promo)}</div>` : ''}<div class="tier-badge">${badge}</div>
      <div class="tier-head">
        <div class="tier-name">${t(sub.name)}</div>
        <div class="tier-price">${pp(sub.price).toLocaleString('fr-FR')}€<small>/${LANG === 'fr' ? 'mois' : 'mo'}</small></div>
      </div>
      <div class="tier-detail">${t(sub.items).join(' · ')}</div>
      <div class="sub-engagement">${engagement} · ${saving}</div>`;
    d.insertAdjacentHTML('afterbegin', formulaPhotoHTML(S.cat, 'sub', 'tier-photo')); d.dataset.tier = 'sub'; if (S.tier === 'sub') d.classList.add('selected'); d.onclick = () => pickTier('sub', d);
    el.appendChild(d);
  }
}

function renderRecap(){
  renderRecapBase();
  const box = document.getElementById('recapBox');
  if (box) {
    box.insertAdjacentHTML('afterbegin', formulaPhotoHTML(S.cat, S.tier, 'recap-photo'));
    box.insertAdjacentHTML('beforeend', partnerQuizNotice());
    /* Mobile : détail de la formule replié (nom + prix restent visibles), un bouton le déplie. */
    box.classList.remove('rc-open');
    box.insertAdjacentHTML('beforeend', `<button type="button" class="rc-toggle" onclick="this.parentElement.classList.toggle('rc-open');this.textContent=this.parentElement.classList.contains('rc-open')?'${t({fr:'Masquer le détail', en:'Hide details'})}':'${t({fr:'Voir le détail de la formule', en:'See package details'})}'">${t({fr:'Voir le détail de la formule', en:'See package details'})}</button>`);
  }
}
function renderRecapBase(){
  const cat = CATS.find(c => c.id === S.cat);
  const selLabel = LANG === 'fr' ? 'Votre sélection' : 'Your selection';
  const box = document.getElementById('recapBox');
  if (S.tier === 'sub') {
    const sub = SUBS[S.cat];
    const engagement = LANG === 'fr'
      ? 'Engagement minimum : 6 mois · Reconduction mensuelle ensuite'
      : 'Minimum commitment: 6 months · Monthly renewal afterwards';
    const payLine = LANG === 'fr'
      ? '💳 Réglable par carte bancaire, chaque mois.'
      : '💳 Payable by credit card, every month.';
    box.innerHTML = `
      <div class="recap-label">${selLabel}</div>
      <div class="recap-title">
        <span>${t(sub.name)}</span>
        <span>${pp(sub.price).toLocaleString('fr-FR')}€/${LANG === 'fr' ? 'mois' : 'mo'}</span>
      </div>
      <div class="recap-payment">${payLine}</div>
      <div class="travel-note">🚗 ${TRAVEL_TXT[LANG].note}</div>
      <ul class="recap-items">
        ${t(sub.items).map(i => `<li>${i}</li>`).join('')}
      </ul>
      <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${engagement}</div>`;
    return;
  }
  if (isSpecialTier()) {
    const polas = POLAS[S.cat];
    const total = pp(specialTotal(polas));
    const threeX = Math.round(total / 3).toLocaleString('fr-FR');
    const payLine = LANG === 'fr'
      ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, acompte 30 % + solde.`
      : `💳 That's 3 × €${threeX} interest-free with Klarna — or credit card, 30% deposit + balance.`;
    const studioLabel = t(polas.studioNote);
    box.innerHTML = `
      <div class="recap-label">${selLabel}</div>
      <div class="recap-title">
        <span>${t(cat.name)} — ${t(polas.name)}</span>
        <span>${total.toLocaleString('fr-FR')}€</span>
      </div>
      <div class="recap-payment">${payLine}</div>
      <div class="travel-note">🚗 ${TRAVEL_TXT[LANG].note}</div>
      <ul class="recap-items">
        ${t(polas.items).map(i => `<li>${i}</li>`).join('')}
        <li>${studioLabel}</li>
      </ul>
      <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${LANG === 'fr' ? 'Livraison' : 'Delivery'} : ${t(polas.delay)}</div>`;
    return;
  }
  if (S.cat === 'lumen') {
    const lt = LUMEN_TIERS.find(x => x.id === S.tier);
    if (!lt) return;
    const isSurm = lt.id === 'surm';
    const chfLine = (LANG === 'en' && lt.priceUSD) ? ` / $${lt.priceUSD.toLocaleString('en-US')}` : '';
    const pricePrefix = isSurm ? (LANG === 'fr' ? 'À partir de ' : 'From ') : '';
    const threeX = Math.round(pp(lt.price) / 3).toLocaleString('fr-FR');
    const payLine = isSurm
      ? (LANG === 'fr'
          ? '💳 Devis personnalisé — nous vous revenons sous 48h ouvrées.'
          : '💳 Personalised quote — we get back to you within 48 working hours.')
      : (LANG === 'fr'
          ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, acompte 30 % + solde.`
          : `💳 That's 3 × €${threeX} interest-free with Klarna — or credit card, 30% deposit + balance.`);
    box.innerHTML = `
      <div class="recap-label">${selLabel}</div>
      <div class="recap-title">
        <span>Lumen — ${t(lt.name)}</span>
        <span>${pricePrefix}${(isSurm ? lt.price : pp(lt.price)).toLocaleString('fr-FR')}€${chfLine}</span>
      </div>
      <div class="recap-payment">${payLine}</div>
      <div class="travel-note">🚗 ${TRAVEL_TXT[LANG].note}</div>
      <ul class="recap-items">
        ${t(lt.items).map(i => `<li>${i}</li>`).join('')}
      </ul>
      <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${LANG === 'fr' ? 'Livraison' : 'Delivery'} : ${t(lt.delay)}</div>`;
    return;
  }
  const tier = TIERS.find(x => x.id === S.tier);
  const td = cat.tiers[S.tier];
  const delivLabel = LANG === 'fr' ? 'Livraison' : 'Delivery';
  const studioSupplement = ((S.cat === 'photo-part' || S.cat === 'corporate') && S.studio) ? ' + ' + STUDIO_FEE + '€ studio' : '';
  const threeX = Math.round(pp(td.price) / 3).toLocaleString('fr-FR');
  const payLine = LANG === 'fr'
    ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, acompte 30 % + solde.`
    : `💳 That's 3 × €${threeX} interest-free with Klarna — or credit card, 30% deposit + balance.`;
  box.innerHTML = `
    <div class="recap-label">${selLabel}</div>
    <div class="recap-title">
      <span>${t(cat.name)} — ${t(tier.name)}</span>
      <span>${pp(td.price).toLocaleString('fr-FR')}€${studioSupplement}</span>
    </div>
    <div class="recap-payment">${payLine}</div>
      <div class="travel-note">🚗 ${TRAVEL_TXT[LANG].note}</div>
    <ul class="recap-items">
      ${t(td.items).map(i => `<li>${i}</li>`).join('')}
    </ul>
    <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${delivLabel} : ${t(td.delay)}</div>`;
}

function commEligible(){
  if (S.cat === 'lumen') return false;
  if (S.cat === 'mode') return false;
  if (S.cat === 'photo-part' || S.cat === 'corporate') return false;
  return ['immobilier','archi','cuisine','piscine','event','commercial'].includes(S.cat) || S.prof === 'marque';
}

function renderOptions(){
  const el = document.getElementById('optList');
  const label = document.getElementById('optLabel');
  el.innerHTML = '';
  S.opts = [];
  S.photoPack = null;
  S.studio = false;

  if (S.tier === 'sub') {
    label.style.display = 'none';
    const note = document.createElement('div');
    note.className = 'sub-options-note stagger';
    note.style.animationDelay = '0.4s';
    note.innerHTML = LANG === 'fr'
      ? '<strong>Bon à savoir :</strong> en tant qu\'abonné Studio Continu, vous bénéficiez de <strong>-20% (tarif partenaire) sur toutes les options</strong>, à ajouter sur chaque reportage mensuel.'
      : '<strong>Good to know:</strong> as a Studio Continu subscriber, you get <strong>20% off all options</strong> (partner rate), which you can freely add to any monthly shoot.';
    el.appendChild(note);
    renderCommBox();
    return;
  }

  if (isSpecialTier()) {
    if (POLAS[S.cat].studio) S.studio = true;
    label.style.display = 'none';
    const note = document.createElement('div');
    note.className = 'sub-options-note stagger';
    note.style.animationDelay = '0.4s';
    note.innerHTML = t(POLAS[S.cat].optNote);
    el.appendChild(note);
    renderCommBox();
    return;
  }

  label.style.display = 'block';

  /* ─── Options Lumen ─── */
  if (S.cat === 'lumen') {
    LUMEN_OPTIONS.forEach((o, i) => {
      const d = document.createElement('div');
      d.className = 'opt-item stagger';
      d.style.animationDelay = (0.42 + i * 0.08) + 's';
      const priceDisplay = typeof o.price === 'number'
        ? '+' + pp(o.price) + '€'
        : (LANG === 'fr' ? 'Inclus' : 'Included');
      d.innerHTML = `
        <div class="opt-icon">${o.icon}</div>
        <div class="opt-check"></div>
        <div class="opt-body">
          <div class="opt-name">${t(o.name)}</div>
          <div class="opt-note">${t(o.note)}</div>
        </div>
        <div class="opt-price">${priceDisplay}</div>`;
      d.onclick = () => {
        d.classList.toggle('selected');
        if (d.classList.contains('selected')) S.opts.push(o.id);
        else S.opts = S.opts.filter(x => x !== o.id);
      };
      el.appendChild(d);
    });
    renderCommBox();
    return;
  }

  /* ─── Studio ou extérieur (séance photo et corporate) ─── */
  if (S.cat === 'photo-part' || S.cat === 'corporate') {
    const studioDiv = document.createElement('div');
    studioDiv.className = 'stagger';
    studioDiv.style.cssText = 'animation-delay:0.38s; margin-bottom:28px';
    const studioLabel = LANG === 'fr'
      ? '<div class="opt-section-label" style="margin-top:0;margin-bottom:16px">Lieu de la séance</div>'
      : '<div class="opt-section-label" style="margin-top:0;margin-bottom:16px">Session location</div>';
    const extLabel = LANG === 'fr' ? 'Extérieur' : 'Outdoor';
    const stuLabel = LANG === 'fr' ? 'Studio (+' + STUDIO_FEE + '€ — utilisation du matériel studio)' : 'Studio (+€' + STUDIO_FEE + ' — studio equipment fee)';
    studioDiv.innerHTML = studioLabel + `
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div class="photo-pack" id="loc-ext" data-loc="ext" onclick="selectLocation('ext')" style="flex:1;min-width:130px">
          <span>📍 ${extLabel}</span><span class="photo-pack-price">${LANG==='fr'?'Inclus':'Included'}</span>
        </div>
        <div class="photo-pack" id="loc-stu" data-loc="stu" onclick="selectLocation('stu')" style="flex:1;min-width:130px">
          <span>🎞 ${stuLabel}</span><span class="photo-pack-price">+${STUDIO_FEE}€</span>
        </div>
      </div>`;
    el.insertBefore(studioDiv, el.firstChild);
  }

  OPTIONS.forEach((o, i) => {
    const d = document.createElement('div');
    d.className = 'opt-item stagger';
    d.style.animationDelay = (0.42 + i * 0.08) + 's';
    if (o.comingSoon) {
      const soonLabel = LANG === 'fr' ? 'Bientôt disponible' : 'Coming soon';
      d.style.opacity = '0.5';
      d.style.pointerEvents = 'none';
      d.innerHTML = `
        <div class="opt-icon">${o.icon}</div>
        <div class="opt-body">
          <div class="opt-name">${t(o.name)}</div>
          <div class="opt-note" style="color:var(--grey)">${soonLabel}</div>
        </div>
        <div class="opt-price" style="font-size:11px;letter-spacing:.04em;text-transform:uppercase">${soonLabel}</div>`;
      el.appendChild(d);
      return;
    }
    if (o.packs) {
      d.classList.add('opt-fold');
      d.addEventListener('click', e => { if (!e.target.closest('.photo-pack')) d.classList.toggle('open'); });
      d.innerHTML = `
        <div class="opt-icon">${o.icon}</div>
        <div class="opt-body">
          <div class="opt-name">${t(o.name)}</div>
          <div class="opt-note">${t(o.note)}</div>
          <div class="photo-pack-list" id="packList-${o.id}">
            ${o.packs.map(pk => `
              <div class="photo-pack" data-pack="${pk.id}" onclick="selectPhotoPack(event,'${o.id}','${pk.id}')">
                <span>${t(pk.label)}</span>
                <span class="photo-pack-price">${typeof pk.price==='number' ? '+'+pp(pk.price)+'€' : (LANG==='fr'?'Sur devis':'On request')}</span>
              </div>`).join('')}
          </div>
        </div>`;
    } else {
      const priceDisplay = typeof o.price === 'number' ? '+' + pp(o.price) + '€' : (o.price === '+20%' ? o.price : (LANG==='fr'?'Sur devis':'On request'));
      d.innerHTML = `
        <div class="opt-icon">${o.icon}</div>
        <div class="opt-check"></div>
        <div class="opt-body">
          <div class="opt-name">${t(o.name)}</div>
          <div class="opt-note">${t(o.note)}</div>
        </div>
        <div class="opt-price">${priceDisplay}</div>`;
      d.onclick = () => {
        d.classList.toggle('selected');
        if (d.classList.contains('selected')) S.opts.push(o.id);
        else S.opts = S.opts.filter(x => x !== o.id);
      };
    }
    el.appendChild(d);
  });

  /* ─── Options spéciales par catégorie + tier ─── */
  const specialKey = S.cat + '_' + S.tier;
  if (SPECIAL_OPTIONS[specialKey]) {
    SPECIAL_OPTIONS[specialKey].forEach((o, i) => {
      const d = document.createElement('div');
      d.className = 'opt-item stagger';
      d.style.animationDelay = (0.9 + i * 0.08) + 's';
      d.innerHTML = `
        <div class="opt-icon">${o.icon}</div>
        <div class="opt-check"></div>
        <div class="opt-body">
          <div class="opt-name">${t(o.name)}</div>
          <div class="opt-note">${t(o.note)}</div>
        </div>
        <div class="opt-price">${LANG==='fr'?'Sur devis':'On request'}</div>`;
      d.onclick = () => {
        d.classList.toggle('selected');
        if (d.classList.contains('selected')) S.opts.push(o.id);
        else S.opts = S.opts.filter(x => x !== o.id);
      };
      el.appendChild(d);
    });
  }

  renderCommBox();
}

function selectLocation(loc){
  S.studio = (loc === 'stu');
  const ext = document.getElementById('loc-ext');
  const stu = document.getElementById('loc-stu');
  if (ext) ext.classList.toggle('selected', loc === 'ext');
  if (stu) stu.classList.toggle('selected', loc === 'stu');
}

function selectPhotoPack(ev, optId, packId){
  ev.stopPropagation();
  const opt  = OPTIONS.find(x => x.id === optId);
  const pack = opt && opt.packs ? opt.packs.find(p => p.id === packId) : null;
  const list = document.getElementById('packList-' + optId);
  const clicked = list.querySelector('[data-pack="' + packId + '"]');
  const already = list.querySelector('.photo-pack.selected');
  if (already === clicked) {
    clicked.classList.remove('selected');
    S.photoPack = null;
    S.opts = S.opts.filter(x => x !== optId);
  } else {
    list.querySelectorAll('.photo-pack').forEach(p => p.classList.remove('selected'));
    clicked.classList.add('selected');
    S.photoPack = pack ? { id: packId, price: typeof pack.price === 'number' ? pack.price : null } : { id: packId, price: null };
    if (!S.opts.includes(optId)) S.opts.push(optId);
  }
}

function checkQuizForm(){
  S.name    = document.getElementById('qName').value.trim();
  S.email   = document.getElementById('qEmail').value.trim();
  S.project = document.getElementById('qProject').value.trim();
  S.delay   = document.getElementById('qDelay').value;
  const cityOk = !travelApplies() || S.city.length >= 2;
  document.getElementById('qSubmit').disabled = !(S.name && S.email && S.email.includes('@') && S.project.length > 0 && S.delay && cityOk);
}

function computeTotal(){
  if (S.tier === 'sub') return { amount: pp(SUBS[S.cat].price), surDevis: false };
  if (isSpecialTier()) return { amount: pp(specialTotal(POLAS[S.cat])), surDevis: false };
  if (S.cat === 'lumen') {
    const lt = LUMEN_TIERS.find(x => x.id === S.tier);
    if (!lt) return { amount: 0, surDevis: true };
    let total = lt.price;
    let hasSurDevis = lt.id === 'surm';
    S.opts.forEach(id => {
      const o = LUMEN_OPTIONS.find(x => x.id === id);
      if (o && typeof o.price === 'number') total += o.price;
      else if (o) hasSurDevis = true;
    });
    return { amount: lt.id === 'surm' ? total : pp(total), surDevis: hasSurDevis };
  }
  const cat = CATS.find(c => c.id === S.cat);
  let total = cat.tiers[S.tier].price;
  let express = false;
  let hasSurDevis = false;
  if ((S.cat === 'photo-part' || S.cat === 'corporate') && S.studio) total += STUDIO_FEE;
  S.opts.forEach(id => {
    const allOpts = [...OPTIONS, ...((SPECIAL_OPTIONS[S.cat+'_'+S.tier])||[])];
    const o = allOpts.find(x => x.id === id);
    if (o && typeof o.price === 'number') total += o.price;
    else if (o && o.id === 'express') express = true;
    else hasSurDevis = true;
  });
  if (express) total = Math.round(total * 1.2);
  return { amount: pp(total), surDevis: hasSurDevis };
}


function animatePriceCalc(){
  const box   = document.getElementById('priceCalcBox');
  const amtEl = document.getElementById('priceCalcAmt');
  const noteEl= document.getElementById('priceCalcNote');
  const payEl = document.getElementById('priceCalcPayment');
  if (!box || !amtEl) return;
  box.style.display = 'block';

  let targetAmount, isSub = false, surDevis = false, monthlyLabel = '';
  if (S.tier === 'sub') {
    targetAmount = SUBS[S.cat] ? pp(SUBS[S.cat].price) : 0;
    isSub = true;
    monthlyLabel = LANG === 'fr' ? '/mois' : '/mo';
  } else {
    const res = computeTotal();
    targetAmount = res.amount + travelFee();
    surDevis     = res.surDevis;
  }

  if (payEl) {
    if (isSub) {
      payEl.textContent = LANG === 'fr'
        ? '💳 Réglable chaque mois par carte bancaire.'
        : '💳 Billed monthly by credit card.';
    } else if (S.cat === 'lumen' && S.tier === 'surm') {
      payEl.textContent = LANG === 'fr'
        ? '💳 Devis personnalisé — réponse sous 48h ouvrées. Paiement : acompte 30 % + solde à la livraison.'
        : '💳 Personalised quote — reply within 48 working hours. Payment: 30% deposit + balance on delivery.';
    } else {
      const threeX = Math.round(targetAmount / 3).toLocaleString('fr-FR');
      payEl.textContent = LANG === 'fr'
        ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna, ou par carte bancaire.`
        : `💳 That's 3 × €${threeX} interest-free with Klarna, or by credit card.`;
    }
  }

  /* Counter animation */
  const duration = 1600;
  const startTime = performance.now();
  let frame;
  function step(now){
    const p = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const cur = Math.round(targetAmount * ease);
    amtEl.textContent = cur.toLocaleString('fr-FR') + '€' + (isSub ? monthlyLabel : '');
    if (p < 1) frame = requestAnimationFrame(step);
    else amtEl.textContent = targetAmount.toLocaleString('fr-FR') + '€' + (isSub ? monthlyLabel : '');
  }
  frame = requestAnimationFrame(step);

  /* Sur devis note */
  const trv = travelSummary();
  noteEl.style.display = (surDevis || trv.text) ? 'block' : 'none';
  noteEl.textContent = '';
  if (trv.text) noteEl.textContent = (LANG === 'fr' ? trv.text : trv.text.replace('Déplacement :', 'Travel:').replace('offert', 'free').replace('forfait Toulouse', 'Toulouse flat fee').replace('à chiffrer sur devis', 'to be priced on your quote')) + '. ';
  if (surDevis) {
    noteEl.textContent += LANG === 'fr'
      ? 'Certaines options sélectionnées sont proposées sur devis. Le montant indiqué ci-dessus correspond à votre formule de base. Le prix final sera ajusté selon ces options lors de l\'établissement du devis.'
      : 'Some selected options are priced on request. The amount shown above reflects your base package. The final price will be adjusted based on these options when the quote is issued.';
  }
}

function renderQuizPortfolio(){
  const cat = CATS.find(c => c.id === S.cat);
  if (!cat) return;
  /* ─── Price calculator ─── */
  animatePriceCalc();
  document.getElementById('pfPrevTitle').textContent =
    (LANG === 'fr' ? 'Réalisations — ' : 'Our work — ') + t(cat.name);
  document.getElementById('pfPrevSub').textContent =
    LANG === 'fr' ? 'Un aperçu de notre travail dans votre univers.' : 'A glimpse of our work in your universe.';
  const g = document.getElementById('pfPrevGallery');
  const catLabelPrev = t(cat.name);
  const emptyTextPrev = LANG === 'fr'
    ? `Visuels « ${catLabelPrev} » à venir — contactez-nous pour des exemples.`
    : `"${catLabelPrev}" visuals coming soon — get in touch for examples.`;
  renderPfGalleryInto(g, S.cat, catLabelPrev, 6, emptyTextPrev);
  document.querySelectorAll('#qs-6 .rv:not(.ph)').forEach(el => { el.classList.remove('in'); observe(el); });
}

function submitQuiz(e){
  e.preventDefault();
  S.phone   = document.getElementById('qPhone').value.trim();
  S.project = document.getElementById('qProject').value.trim();
  const cat  = CATS.find(c => c.id === S.cat);
  const prof = S.cat === 'lumen'
    ? (LUMEN_PROFILES.find(p => p.id === S.prof) || { name:{fr:S.prof,en:S.prof} })
    : S.cat === 'photo-part'
    ? (PHOTO_PART_PROFILES.find(p => p.id === S.prof) || { name:{fr:S.prof,en:S.prof} })
    : (PROFILES.find(p => p.id === S.prof) || { name:{fr:S.prof,en:S.prof} });
  let formuleLabel, montantLabel, budgetMontantEur;
  if (S.tier === 'sub') {
    const sub = SUBS[S.cat];
    formuleLabel = 'ABONNEMENT — ' + sub.name.fr + ' (' + pp(sub.price) + '€/mois, engagement 6 mois)';
    montantLabel = pp(sub.price) + '€/mois';
    budgetMontantEur = pp(sub.price);
  } else if (isSpecialTier()) {
    const polas = POLAS[S.cat];
    const res = computeTotal();
    formuleLabel = polas.name.fr + ' (' + res.amount + '€, ' + (polas.studio ? 'dont ' + polas.studio + '€ studio inclus' : polas.studioNote.fr.toLowerCase()) + ')';
    montantLabel = res.amount + '€';
    budgetMontantEur = res.amount;
  } else if (S.cat === 'lumen') {
    const lt = LUMEN_TIERS.find(x => x.id === S.tier);
    const res = computeTotal();
    const priceStr = lt.id === 'surm' ? 'à partir de ' + lt.price + '€' : pp(lt.price) + '€';
    formuleLabel = 'Lumen — ' + lt.name.fr + ' (' + priceStr + ')';
    montantLabel = lt.id === 'surm'
      ? 'Sur devis (à partir de ' + lt.price + '€)'
      : res.amount + '€' + (res.surDevis ? ' + options sur devis' : '');
    budgetMontantEur = lt.id === 'surm' ? lt.price : pp(lt.price);
  } else {
    const tier = TIERS.find(x => x.id === S.tier);
    const res = computeTotal();
    formuleLabel = tier.name.fr + ' (' + res.amount + '€' + (S.studio?', dont ' + STUDIO_FEE + '€ studio':'') + ')';
    montantLabel = res.amount + '€' + (res.surDevis ? ' + options sur devis' : '');
    budgetMontantEur = res.amount;
  }
  if (isPartnerUser() && !(S.cat === 'lumen' && S.tier === 'surm')) formuleLabel += ' — TARIF PARTENAIRE -' + PARTNER_DISCOUNT + '% (compte ' + USER.email + ')';
  const allOpts = S.cat === 'lumen'
    ? LUMEN_OPTIONS
    : [...OPTIONS, ...((SPECIAL_OPTIONS[S.cat+'_'+S.tier])||[])];
  const optNames = (S.tier !== 'sub' && S.opts.length)
    ? S.opts.map(id => { const o = allOpts.find(x => x.id === id); return o ? o.name.fr : id; }).filter(Boolean).join(' · ')
    : (S.tier === 'sub' ? '— (abonné : tarif partenaire -20% sur options)' : 'Aucune');
  const studioNote = isSpecialTier() ? POLAS[S.cat].studioNote.fr : (S.cat === 'photo-part' || S.cat === 'corporate') ? (S.studio ? 'Studio (+' + STUDIO_FEE + '€)' : 'Extérieur') : '';
  const trv = travelSummary();
  if (trv.fee) { budgetMontantEur += trv.fee; montantLabel += ' + déplacement ' + trv.fee + '€'; }
  const optsOut = [optNames === 'Aucune' ? '' : optNames, trv.text].filter(Boolean).join(' · ') || 'Aucune';
  document.getElementById('successName').textContent = S.name;
  document.getElementById('commRedirect').style.display = S.comm ? 'block' : 'none';
  document.getElementById('qSubmit').disabled = true;

  /* Capture du lead côté Stripe — fire-and-forget, voir sendQuizLeadToStripe().
     N'est jamais "await" ici : ne retarde et ne conditionne en rien la suite. */
  sendQuizLeadToStripe({
    name: S.name,
    email: S.email,
    phone: S.phone || undefined,
    project: S.project,
    category: cat.name.fr,
    profile: prof.name.fr,
    formule: formuleLabel,
    budgetEstime: montantLabel,
    budgetMontantEur: budgetMontantEur,
    delaiSouhaite: (DELAY_LABELS[S.delay] && DELAY_LABELS[S.delay].fr) || S.delay || undefined,
    optionsChoisies: optsOut,
    villePrestation: (travelApplies() && S.city) ? ((S.travel && S.travel.city) || S.city) : undefined,
    fraisDeplacementEur: (travelApplies() && S.city && S.travel && typeof S.travel.fee === 'number') ? S.travel.fee : undefined,
    deplacementType: (travelApplies() && S.city) ? ((S.travel && S.travel.kind) || 'unknown') : undefined,
    interetCommunication: S.comm
  });

  if (window.track) track('quiz_submit', cat.name.fr);
  fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: 'DEMANDE DE DEVIS CLIENT — ' + S.name,
      _replyto: S.email,
      nom_societe: S.name,
      email: S.email,
      telephone: S.phone || 'Non renseigné',
      profil: prof.name.fr,
      categorie: cat.name.fr,
      formule: formuleLabel,
      options_choisies: optsOut,
      ville_prestation: (travelApplies() && S.city) ? ((S.travel && S.travel.city) || S.city) : undefined,
      frais_deplacement_estimes: travelApplies() && S.city ? (trv.fee ? trv.fee + '€' : trv.text.replace('Déplacement : ', '')) : undefined,
      montant_total_estime: montantLabel,
      delai_souhaite: (DELAY_LABELS[S.delay] && DELAY_LABELS[S.delay].fr) || S.delay || 'Non renseigné',
      lieu_seance: [studioNote, (travelApplies() && S.city) ? 'Ville : ' + ((S.travel && S.travel.city) || S.city) : ''].filter(Boolean).join(' — ') || undefined,
      description_projet: S.project,
      interet_communication: S.comm ? 'OUI — potentiellement intéressé' : 'Non'
    })
  }).then(() => { renderQuizPortfolio(); quizStep(6); }).catch(() => { renderQuizPortfolio(); quizStep(6); });
}

/* ═══════════════ SERVICES ═══════════════ */
let activeServiceFilter = null;
let activeSvcTab = 'catalogue';

/* « Voir le déroulé complet » : ouvre l'onglet Devis & déroulé et y amène le lecteur. */
function goToProcess(){
  setSvcTab('devis');
  const tabs = document.querySelector('#view-services .svc-tabs');
  if (tabs) window.scrollTo({ top: tabs.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 90) - 16, behavior: 'smooth' });
}

/* Page d'une prestation (/services/<prestation>/) : tout est calculé depuis le catalogue
   (CATS / LUMEN_TIERS) — tarifs, délais, contenu des formules — pour rester exact. */
/* Texte éditorial de chaque prestation : positionnement, public, aide au choix de la formule.
   Uniquement des faits du catalogue ci-dessus. `choose` suit l'ordre des formules (Découverte → Éditorial). */
const SERVICE_COPY = {
  'photo-part': {
    lead:{fr:'BUNKAIO réalise des séances photo portrait et lifestyle pour les particuliers à Béziers, Montpellier et Toulouse : en extérieur ou en studio, en solo, en couple ou en groupe. Nous vous mettons en confiance et vous guidons sur les poses pour que les images vous ressemblent. La séance peut aussi servir un usage professionnel (<a href="/services/portrait-professionnel-corporate/" data-nav="service:corporate">portraits corporate pour LinkedIn, site ou équipe</a>), et nous vous aidons à <a href="/conseils/lieux-seance-photo-montpellier-beziers-toulouse/" data-nav="article:lieux-seance-photo-montpellier-beziers-toulouse">choisir le lieu</a> selon l\'ambiance recherchée.',
          en:'BUNKAIO shoots portrait and lifestyle sessions for individuals in Béziers, Montpellier and Toulouse: outdoors or in the studio, solo, as a couple or in a group. We put you at ease and guide your poses so the images look like you. A session can also serve a professional purpose (<a href="/services/portrait-professionnel-corporate/" data-nav="service:corporate">corporate portraits for LinkedIn, your website or your team</a>), and we help you <a href="/conseils/lieux-seance-photo-montpellier-beziers-toulouse/" data-nav="article:lieux-seance-photo-montpellier-beziers-toulouse">choose the location</a> to suit the mood you want.'},
    choose:[
      {fr:'pour un portrait ciblé, par exemple une photo de profil : 1 h de séance et 8 photos retouchées.', en:'for a targeted portrait, such as a profile photo: a 1-hour session and 8 retouched photos.'},
      {fr:'pour varier les poses et les cadrages : 2 h de séance, 15 photos retouchées et direction de pose.', en:'to vary poses and framing: a 2-hour session, 15 retouched photos and posing guidance.'},
      {fr:'pour changer d\'ambiance et de tenue : une demi-journée, jusqu\'à 2 ambiances, 2 tenues et 25 photos.', en:'to change mood and outfit: a half-day, up to 2 moods, 2 outfits and 25 photos.'},
      {fr:'pour une série complète : une journée, 4 lieux, 4 tenues, 30 photos et un film court de 30 secondes.', en:'for a complete series: a full day, 4 locations, 4 outfits, 30 photos and a 30-second short film.'}
    ]
  },
  'corporate': {
    lead:{fr:'BUNKAIO réalise des portraits professionnels pour les dirigeants, les indépendants, les entrepreneurs et les équipes à Béziers, Montpellier et Toulouse : photo de profil LinkedIn, site web, présentation d\'équipe, communication. La séance se fait en extérieur ou en studio, avec une direction de pose pour des images naturelles. Pour une équipe, précisez le nombre de personnes dans votre demande ; pour bien vous préparer, voir <a href="/conseils/portrait-professionnel-photo-profil-linkedin/" data-nav="article:portrait-professionnel-photo-profil-linkedin">comment réussir son portrait professionnel</a>.',
          en:'BUNKAIO shoots professional portraits for executives, freelancers, entrepreneurs and teams in Béziers, Montpellier and Toulouse: LinkedIn profile photo, website, team presentation, communication. Sessions are outdoors or in the studio, with posing guidance for natural images. For a team, state the number of people in your request; to prepare, see <a href="/conseils/portrait-professionnel-photo-profil-linkedin/" data-nav="article:portrait-professionnel-photo-profil-linkedin">how to get a great professional portrait</a>.'},
    choose:[
      {fr:'pour une photo de profil ou de signature de mail : 1 h de séance et 8 photos retouchées.', en:'for a profile or email-signature photo: a 1-hour session and 8 retouched photos.'},
      {fr:'pour varier les cadrages (profil, site, presse) : 2 h de séance, 15 photos retouchées et direction de pose.', en:'to vary framing (profile, website, press): a 2-hour session, 15 retouched photos and posing guidance.'},
      {fr:'pour couvrir plusieurs usages et tenues : une demi-journée, jusqu\'à 2 ambiances, 2 tenues et 25 photos.', en:'to cover several uses and outfits: a half-day, up to 2 moods, 2 outfits and 25 photos.'},
      {fr:'pour une série complète : une journée, 4 lieux, 4 tenues, 30 photos et un film court de 30 secondes.', en:'for a complete series: a full day, 4 locations, 4 outfits, 30 photos and a 30-second short film.'}
    ]
  },
  'mode': {
    lead:{fr:'BUNKAIO photographie la mode pour les marques, les créateurs, les agences et les mannequins : lookbooks, visuels e-commerce et books, avec direction artistique. Pour présenter un profil à une agence, la formule <a href="/conseils/polas-mannequin-digitals-agence/" data-nav="article:polas-mannequin-digitals-agence">Polas</a> propose des photos brutes en studio ; les modèles et mannequins qui veulent des images régulières peuvent opter pour l\'abonnement Studio Continu. Séances à Béziers, Montpellier et Toulouse.',
          en:'BUNKAIO shoots fashion for brands, designers, agencies and models: lookbooks, e-commerce visuals and portfolios, with art direction. To present a profile to an agency, the <a href="/conseils/polas-mannequin-digitals-agence/" data-nav="article:polas-mannequin-digitals-agence">Polas</a> package offers raw studio photos; models who want regular images can choose the Studio Continu subscription. Sessions in Béziers, Montpellier and Toulouse.'},
    choose:[
      {fr:'pour une première série sur un produit ou une silhouette : mini-série de 8 photos.', en:'for a first series on one product or silhouette: a mini-series of 8 photos.'},
      {fr:'pour un lookbook de 20 photos accompagné d\'un Reel vertical pour les réseaux.', en:'for a 20-photo lookbook with a vertical Reel for social media.'},
      {fr:'pour un lookbook de 30 photos, un film principal et 2 Reels verticaux.', en:'for a 30-photo lookbook, a main film and 2 vertical Reels.'},
      {fr:'pour une campagne : 35 photos, un film publicitaire de 2 minutes, 3 Reels et un storytelling de marque.', en:'for a campaign: 35 photos, a 2-minute advertising film, 3 Reels and brand storytelling.'}
    ]
  },
  'commercial': {
    lead:{fr:'BUNKAIO réalise des packshots et des photos de produits pour les marques, les artisans, les entrepreneurs et les entreprises à Béziers, Montpellier et Toulouse. Le fond neutre convient aux fiches produit, la mise en scène aux réseaux et à la communication : voir <a href="/conseils/packshot-ou-mise-en-scene-photo-produit/" data-nav="article:packshot-ou-mise-en-scene-photo-produit">packshot ou mise en scène, comment choisir</a>, et notre <a href="/conseils/preparer-shooting-photo-produit/" data-nav="article:preparer-shooting-photo-produit">check-list pour préparer le shooting</a>.',
          en:'BUNKAIO shoots packshots and product photos for brands, artisans, entrepreneurs and businesses in Béziers, Montpellier and Toulouse. A neutral backdrop suits product listings; styled setups suit social media and communication: see <a href="/conseils/packshot-ou-mise-en-scene-photo-produit/" data-nav="article:packshot-ou-mise-en-scene-photo-produit">packshot or styled shot, how to choose</a>, and our <a href="/conseils/preparer-shooting-photo-produit/" data-nav="article:preparer-shooting-photo-produit">checklist to prepare the shoot</a>.'},
    choose:[
      {fr:'pour quelques produits sur fond neutre, adaptés aux fiches produit : jusqu\'à 5 produits, 10 photos.', en:'for a few products on a neutral backdrop, suited to product listings: up to 5 products, 10 photos.'},
      {fr:'pour mettre en scène vos produits : jusqu\'à 12 produits, 20 photos.', en:'to style your products: up to 12 products, 20 photos.'},
      {fr:'pour une gamme plus large avec contenu vidéo : jusqu\'à 25 produits, 35 photos et 1 Reel vertical.', en:'for a wider range with video content: up to 25 products, 35 photos and 1 vertical Reel.'},
      {fr:'pour un catalogue complet : 50 photos, un film de marque de 90 secondes et 2 Reels.', en:'for a full catalogue: 50 photos, a 90-second brand film and 2 Reels.'}
    ]
  },
  'event': {
    lead:{fr:'BUNKAIO couvre en photo les événements — domaines, entreprises, réceptions — à Béziers, Montpellier et Toulouse, avec discrétion pour que vous puissiez vivre la journée. La couverture se choisit selon la durée : 2 h pour l\'essentiel, 4 h pour l\'ambiance, ou l\'événement complet. Pour comparer les prestataires, voir <a href="/conseils/choisir-photographe-evenementiel/" data-nav="article:choisir-photographe-evenementiel">comment choisir son photographe d\'événement</a> ; pour un mariage ou une réception, le photobooth <a href="/services/photobooth-ia-mariage-lumen/" data-nav="service:lumen">Lumen</a> complète la couverture.',
          en:'BUNKAIO covers events — estates, companies, receptions — in Béziers, Montpellier and Toulouse, discreetly so you can enjoy the day. Coverage is chosen by duration: 2 hours for the essentials, 4 hours for the atmosphere, or the full event. To compare providers, see <a href="/conseils/choisir-photographe-evenementiel/" data-nav="article:choisir-photographe-evenementiel">how to choose your event photographer</a>; for a wedding or reception, the <a href="/services/photobooth-ia-mariage-lumen/" data-nav="service:lumen">Lumen</a> photobooth complements the coverage.'},
    choose:[
      {fr:'pour les moments essentiels : couverture de 2 h et 20 photos.', en:'for the key moments: 2 hours of coverage and 20 photos.'},
      {fr:'pour les moments clés et l\'ambiance : couverture jusqu\'à 4 h et 40 photos.', en:'for key moments and atmosphere: up to 4 hours of coverage and 40 photos.'},
      {fr:'pour couvrir tout l\'événement : 80 photos et un teaser vidéo de 30 secondes.', en:'to cover the whole event: 80 photos and a 30-second video teaser.'},
      {fr:'pour valoriser l\'événement : 100 photos, un aftermovie de 2 minutes, 2 Reels et une mise en lumière éditoriale.', en:'to showcase the event: 100 photos, a 2-minute aftermovie, 2 Reels and editorial highlighting.'}
    ]
  },
  'lumen': {
    lead:{fr:'Lumen est le photobooth IA de BUNKAIO pour les mariages et les événements haut de gamme, proposé <strong>en location</strong> pour la durée de votre événement (vous ne l\'achetez pas) : un souvenir généré par IA en quelques secondes pour chaque invité, avec impressions illimitées et galerie privée selon la formule. Pour bien le choisir : <a href="/conseils/photobooth-mariage-bien-choisir/" data-nav="article:photobooth-mariage-bien-choisir">les critères à comparer</a>.',
          en:'Lumen is BUNKAIO\'s AI photobooth for weddings and high-end events, <strong>available for rental</strong> for the duration of your event (you do not buy it): a keepsake generated by AI in seconds for each guest, with unlimited prints and a private gallery depending on the package. To choose well: <a href="/conseils/photobooth-mariage-bien-choisir/" data-nav="article:photobooth-mariage-bien-choisir">the criteria to compare</a>.'}
  }
};

/* ═══════════════ PAGE « DÉCOUVRIR CHAQUE PRESTATION » ═══════════════
   Page d'orientation : à chaque besoin sa prestation. Complète /services/ (catalogue et tarifs) sans le doubler.
   Chiffres calculés à partir du catalogue (CATS, LUMEN_TIERS) : aucune donnée saisie à la main. */
const DISCOVER_COPY = {
  'photo-part': {
    for:{fr:'Particuliers : portrait, lifestyle, couple, famille ou groupe.', en:'Individuals: portrait, lifestyle, couple, family or group.'},
    why:{fr:'Des photos qui vous ressemblent, sans avoir besoin d\'être à l\'aise devant l\'objectif : nous vous mettons en confiance et vous guidons sur les poses, en extérieur ou en studio.', en:'Photos that truly look like you, even if you\'re not at ease in front of the camera: we put you at ease and guide your poses, outdoors or in the studio.'}
  },
  corporate: {
    for:{fr:'Dirigeants, entreprises individuelles et équipes.', en:'Executives, sole proprietors and teams.'},
    why:{fr:'Une image professionnelle naturelle pour votre profil LinkedIn, votre site web ou la présentation de votre équipe, avec direction de pose.', en:'A natural professional image for your LinkedIn profile, website or team presentation, with posing guidance.'}
  },
  mode: {
    for:{fr:'Mannequins, modèles émergents, créateurs de contenu, marques et agences.', en:'Models, emerging models, content creators, brands and agencies.'},
    why:{fr:'Lookbooks, books et visuels e-commerce avec direction artistique ; la formule Polas pour présenter un profil à une agence ; l\'abonnement Studio Continu pour les modèles et mannequins.', en:'Lookbooks, portfolios and e-commerce visuals with art direction; the Polas package to present a profile to an agency; the Studio Continu subscription for models.'}
  },
  commercial: {
    for:{fr:'Marques, artisans, entreprises individuelles, restaurateurs et agences.', en:'Brands, artisans, sole proprietors, restaurateurs and agencies.'},
    why:{fr:'Des packshots nets sur fond neutre pour vos fiches produit, et des mises en scène pour vos réseaux : de quelques produits jusqu\'au catalogue complet.', en:'Crisp packshots on a neutral backdrop for your product listings, and styled setups for social media: from a few products up to a full catalogue.'}
  },
  event: {
    for:{fr:'Domaines, entreprises, organisateurs et lieux de réception.', en:'Estates, companies, organisers and reception venues.'},
    why:{fr:'Une couverture discrète de 2 heures à l\'événement complet, avec teaser vidéo ou aftermovie selon la formule, pour garder chaque moment sans le vivre derrière un écran.', en:'Discreet coverage from 2 hours to the full event, with a video teaser or aftermovie depending on the package, so you keep every moment without watching it through a screen.'}
  },
  lumen: {
    for:{fr:'Mariages, wedding planners, domaines et événements haut de gamme.', en:'Weddings, wedding planners, estates and high-end events.'},
    why:{fr:'Un souvenir unique généré par IA en quelques secondes pour chaque invité, avec impressions illimitées et galerie privée selon la formule.', en:'A one-of-a-kind keepsake generated by AI in seconds for each guest, with unlimited prints and a private gallery depending on the package.'}
  }
};

function catFacts(c){
  const en = LANG === 'en';
  const tiers = c.lumen
    ? LUMEN_TIERS.filter(x => x.id !== 'surm' && x.price).map(x => ({ price: x.price, delay: x.delay, items: x.items }))
    : TIERS.map(tr => ({ price: c.tiers[tr.id].price, delay: c.tiers[tr.id].delay, items: c.tiers[tr.id].items }));
  const prices = tiers.map(x => x.price);
  const days = tiers.map(x => parseInt((en ? x.delay.en : x.delay.fr), 10)).filter(Boolean);
  const photos = tiers.map(x => { const m = (en ? x.items.en : x.items.fr).join(' ').match(/(\d+)\s+(?:retouched\s+)?(?:HD\s+)?(?:photos|photographs|retouched)/i); return m ? parseInt(m[1], 10) : 0; }).filter(Boolean);
  const hasVideo = tiers.some(x => (en ? x.items.en : x.items.fr).some(i => /(reel|film|vidéo|video|teaser|aftermovie)/i.test(i)));
  return { from: Math.min(...prices), dMin: Math.min(...days), dMax: Math.max(...days), pMin: photos.length ? Math.min(...photos) : 0, pMax: photos.length ? Math.max(...photos) : 0, hasVideo };
}

/* Page « Découvrir chaque prestation » : le fond change selon la prestation ouverte.
   Photos : IMG.discoverPhotos[catégorie] (admin média : discover/<catégorie>.webp), sinon photo de la catégorie, sinon fond de la page. */
function discoverPhotoUrl(catId){
  return (IMG.discoverPhotos && IMG.discoverPhotos[catId]) || (IMG.servicePhotos && IMG.servicePhotos[catId]) || '';
}
function discoverBgSync(){
  const wrap = document.getElementById('pageHeroWrap');
  const list = document.querySelector('.disc-acc');
  if (!wrap || !list || currentView !== 'discover') return;
  const cats = [...list.querySelectorAll('.cs-acc-item')].map(it => it.dataset.cat);
  if (!cats.length) return;
  if (!wrap.querySelector('.hero-slide.disc-slide')) {
    wrap.style.display = '';
    wrap.querySelectorAll('.hero-slide').forEach(sl => sl.remove());
    const overlay = wrap.querySelector('.page-hero-overlay');
    cats.forEach(id => {
      const url = discoverPhotoUrl(id); if (!url) return;
      const slide = document.createElement('div'); slide.className = 'hero-slide disc-slide'; slide.dataset.cat = id;
      const img = document.createElement('img'); img.alt = ''; img.src = url; img.loading = 'eager';
      const fb = IMG.servicePhotos && IMG.servicePhotos[id];
      img.onerror = () => { if (fb && img.src !== fb) img.src = fb; else slide.remove(); };
      slide.appendChild(img); wrap.insertBefore(slide, overlay || null);
    });
  }
  const open = list.querySelector('.cs-acc-item.open');
  const cur = open ? open.dataset.cat : cats[0];
  let url = '';
  wrap.querySelectorAll('.hero-slide.disc-slide').forEach(sl => { const on = sl.dataset.cat === cur; sl.classList.toggle('active', on); if (on) url = sl.querySelector('img').src; });
  if (url) document.documentElement.style.setProperty('--page-bg-url', 'url(' + url + ')');
}

function renderDiscoverPage(){
  const el = document.getElementById('discoverPageContent');
  if (!el) return;
  const en = LANG === 'en';
  const money = n => n.toLocaleString(en ? 'en-GB' : 'fr-FR') + ' €';
  const cats = CATS.filter(c => seoRouteFor('service', c.id));
  const facts = Object.fromEntries(cats.map(c => [c.id, catFacts(c)]));
  const allMin = Math.min(...cats.map(c => facts[c.id].dMin)), allMax = Math.max(...cats.map(c => facts[c.id].dMax));
  const steps = ['about-step1', 'about-step2', 'about-step3', 'about-step4'];
  const wd = t({fr:'jours ouvrés', en:'working days'}), to = t({fr:'à', en:'to'});
  const dly = f => (f.dMin === f.dMax ? f.dMin : f.dMin + ' ' + to + ' ' + f.dMax) + ' ' + wd;
  const phs = f => f.pMax ? (f.pMin === f.pMax ? f.pMin : f.pMin + ' ' + to + ' ' + f.pMax) + ' ' + t({fr:'photos retouchées', en:'retouched photos'}) : '';
  const rows = cats.map((c, k) => {
    const f = facts[c.id], cp = DISCOVER_COPY[c.id] || { for:{fr:'', en:''}, why:{fr:'', en:''} };
    const isOpen = _discoverFocus ? c.id === _discoverFocus : k === 0;
    return `<li class="cs-acc-item${isOpen ? ' open' : ''}" data-cat="${c.id}">
      <button type="button" class="cs-acc-head" aria-expanded="${isOpen}">
        <b class="disc-num">${String(k + 1).padStart(2, '0')}</b>
        <span class="disc-name">${t(c.name)}</span>
        <em class="disc-from">${t({fr:'dès', en:'from'})} ${money(f.from)}</em>
        <i class="cs-acc-chev" aria-hidden="true"></i>
      </button>
      <div class="cs-acc-panel"><div class="disc-panel">
        <p class="discover-for"><strong>${t({fr:'Pour qui', en:'For'})} :</strong> ${t(cp.for)}</p>
        <p class="svcp-text">${t(cp.why)}</p>
        <ul class="disc-chips"><li>${dly(f)}</li>${phs(f) ? `<li>${phs(f)}</li>` : ''}${f.hasVideo ? `<li>${t({fr:'Vidéo / Reels', en:'Video / Reels'})}</li>` : ''}</ul>
        <div class="discover-actions">
          <a class="btn btn-ghost" href="${servicePath(c.id)}" data-nav="service:${c.id}"><span>${t({fr:'Voir la prestation', en:'See the service'})}</span></a>
          ${quizLink(c.id, t({fr:'Estimer ce projet', en:'Estimate this project'}))}
        </div>
      </div></div>
    </li>`;
  }).join('');
  const stepItems = steps.map((k, i) => `<li class="disc-step"><b>${String(i + 1).padStart(2, '0')}</b><span>${I18N[LANG][k]}</span></li>`).join('');

  el.innerHTML = `
    <div class="breadcrumb" role="navigation" aria-label="${t({fr:'Fil d\'Ariane', en:'Breadcrumb'})}">
      <a href="/" data-nav="home">${t({fr:'Accueil', en:'Home'})}</a><span aria-hidden="true">›</span>
      <a href="/services/" data-nav="services">Services</a><span aria-hidden="true">›</span>
      <span>${t({fr:'Découvrir chaque prestation', en:'Explore each service'})}</span>
    </div>
    <h1 data-pageh1 class="page-title">${t({fr:'Découvrir chaque prestation', en:'Explore each service'})}</h1>
    <p class="page-sub" data-tw data-tw-delay="200">${t({fr:'Portrait, corporate, mode, produit, événementiel et photobooth IA : une prestation pour chaque besoin, à Montpellier, Béziers et Toulouse. Ouvrez celle qui vous correspond.', en:'Portrait, corporate, fashion, product, events and AI photobooth: a service for every need, in Montpellier, Béziers and Toulouse. Open the one that suits you.'})}</p>
    <div class="svcp-cta-row">
      ${quizLink('', t({fr:'Estimer mon projet', en:'Estimate my project'}))}
      <a class="btn btn-ghost" href="/services/" data-nav="services"><span>${t({fr:'Voir les tarifs détaillés', en:'See detailed rates'})}</span></a>
    </div>

    <section class="read-panel svcp-panel disc-live-box">
      <h2>${t({fr:'Quelle prestation pour quel besoin ?', en:'Which service for which need?'})}</h2>
      <ul class="cs-acc disc-acc">${rows}</ul>
    </section>

    <section class="read-panel svcp-panel">
      <h2>${t({fr:'Comment ça se passe', en:'How it works'})}</h2>
      <ol class="disc-steps">${stepItems}</ol>
      <ul class="disc-why">
        <li>${t({fr:TRAVEL_TXT.fr.list, en:TRAVEL_TXT.en.list})}</li>
        <li>${t({fr:'Droits d\'utilisation commerciale cédés sans limite de durée', en:'Commercial usage rights with no time limit'})}</li>
        <li>${t({fr:'Livraison HD en ' + allMin + ' à ' + allMax + ' jours ouvrés', en:'HD delivery in ' + allMin + ' to ' + allMax + ' working days'})}</li>
        <li>${t({fr:'Acompte de 30 %, paiement en 3 fois sans frais possible', en:'30% deposit, 3 interest-free instalments available'})}</li>
      </ul>
      <p class="svcp-text disc-author">${t({fr:'Par Aya Nascimento, photographe diplômée de l\'ETPA (BTS Photographie, 2018), plus de 8 ans d\'expérience et plus de 200 projets : ', en:'By Aya Nascimento, ETPA graduate (BTS Photography, 2018), 8+ years of experience and 200+ projects: '})}<a href="/a-propos/" data-nav="about">${t({fr:'en savoir plus', en:'learn more'})}</a>.</p>
    </section>

    <section class="read-panel svcp-panel">
      <h2>${t({fr:'Questions fréquentes', en:'Frequently asked questions'})}</h2>
      <div id="discoverFaq"></div>
    </section>

    <section class="read-panel svcp-panel article-cta">
      <h2>${t({fr:'Prêt à lancer votre projet ?', en:'Ready to start your project?'})}</h2>
      <p class="svcp-text">${t({fr:'Proposition chiffrée sous 48 h, sans engagement. Un doute ? Lisez nos guides, comme ', en:'Priced proposal within 48 hours, no commitment. In doubt? Read our guides, such as '})}<a href="/conseils/combien-coute-une-seance-photo/" data-nav="article:combien-coute-une-seance-photo">${t({fr:'combien coûte une séance photo', en:'how much a photo session costs'})}</a>${t({fr:', ou ', en:', or '})}<a href="/contact/" data-nav="contact">${t({fr:'écrivez-nous', en:'write to us'})}</a>.</p>
      <div class="svcp-cta-row" style="margin:0">${quizLink('', t({fr:'Estimer mon projet', en:'Estimate my project'}))}</div>
    </section>`;

  renderAccordionInto('discoverFaq', [
    { title: t({fr:'Comment choisir ma prestation ?', en:'How do I choose my service?'}),
      body: '<ul class="svcp-list">' + cats.map(c => `<li><strong>${t(c.name)}</strong> — ${t((DISCOVER_COPY[c.id] || { for:{fr:'', en:''} }).for)}</li>`).join('') + '</ul><p>' + t({fr:'Un doute entre deux prestations ? Le devis en ligne vous guide en quelques questions.', en:'Unsure between two services? The online quote guides you in a few questions.'}) + '</p>' },
    { title: t({fr:'Quels sont les délais et les tarifs ?', en:'What are the timelines and rates?'}),
      body: '<p>' + t({fr:'Livraison entre ' + allMin + ' et ' + allMax + ' jours ouvrés après le shooting, selon la prestation. Tarifs de départ : ', en:'Delivery between ' + allMin + ' and ' + allMax + ' working days after the shoot, depending on the service. Starting rates: '}) + cats.map(c => `${t(c.name)} ${t({fr:'dès', en:'from'})} ${money(facts[c.id].from)}`).join(' · ') + '. <a href="/services/" data-nav="services">' + t({fr:'Voir les formules', en:'See the packages'}) + '</a>.</p>' },
    { title: t({fr:'Où intervenez-vous ?', en:'Where do you work?'}),
      body: '<p>' + t({fr:'BUNKAIO est basé à Montpellier et intervient à Montpellier, Béziers et Toulouse, et dans toute l\'Occitanie. ' + TRAVEL_TXT.fr.full, en:'BUNKAIO is based in Montpellier and works in Montpellier, Béziers and Toulouse, and across Occitanie. ' + TRAVEL_TXT.en.full}) + '</p>' }
  ], { exclusive: true });
  initReassureLoop();
  if (_discoverFocus) {
    const target = el.querySelector('.cs-acc-item[data-cat="' + _discoverFocus + '"]');
    _discoverFocus = null;
    if (target) setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 350);
  }
  const live = el.querySelector('.disc-acc');
  if (live) { if (window.IntersectionObserver && !REDUCED_MOTION) { const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { live.classList.add('disc-live'); io.disconnect(); } }), { threshold: 0.15 }); io.observe(live); } else live.classList.add('disc-live'); }
  discoverBgSync();
}

/* Formules en accordéon (pages prestation) : une ligne par formule (nom, prix, délai), le détail s'ouvre au clic.
   La formule « la plus choisie » est ouverte par défaut ; une seule formule ouverte à la fois. */
function fxItem(catId, f){
  const en = LANG === 'en';
  const open = f.open ? ' open' : '';
  return `<div class="fx${f.special ? ' fx-special' : ''}${open}" data-fx="${f.id}">
    <button type="button" class="fx-head" aria-expanded="${!!f.open}">
      ${formulaPhotoHTML(catId, f.id, 'fx-thumb')}
      <span class="fx-title"><b>${f.name}</b>${f.badge && f.badge !== f.name ? `<em>${f.badge}</em>` : ''}<small>${f.delay}</small></span>
      <span class="fx-price">${f.price}</span>
      <i class="fx-chev" aria-hidden="true"></i>
    </button>
    <div class="fx-panel"><div class="fx-body">
      ${formulaPhotoHTML(catId, f.id, 'fx-photo')}
      <div class="fx-info">
        ${f.hint ? `<p class="fx-hint"><strong>${t({fr:'Notre conseil', en:'Our advice'})} :</strong> ${f.hint}</p>` : ''}
        <ul class="svcp-list">${f.items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>
        <div class="fx-actions">${quizLink(catId, t({fr:'Choisir cette formule', en:'Choose this package'}))}${f.extra || ''}</div>
      </div>
    </div></div>
  </div>`;
}
document.addEventListener('click', (e) => {
  const head = e.target.closest ? e.target.closest('.fx-head') : null; if (!head) return;
  const item = head.parentElement, list = item.parentElement;
  const willOpen = !item.classList.contains('open');
  list.querySelectorAll('.fx.open').forEach(x => { x.classList.remove('open'); x.querySelector('.fx-head').setAttribute('aria-expanded', 'false'); });
  if (willOpen) { item.classList.add('open'); head.setAttribute('aria-expanded', 'true'); }
});

/* Page de chaque prestation : le fond reprend la photo de la catégorie (admin média : discover/<catégorie>.webp,
   sinon services/<catégorie>.webp, sinon le fond habituel de la rubrique Services). */
function serviceBgSync(catId){
  const wrap = document.getElementById('pageHeroWrap');
  const url = discoverPhotoUrl(catId);
  if (!wrap || !url || currentView !== 'service') return;
  clearHeroCarousel();
  wrap.style.display = '';
  const prevSlide = wrap.querySelector('.hero-slide.svc-slide');
  if (prevSlide && prevSlide.dataset.cat === catId) { prevSlide.classList.add('active'); }
  else {
    wrap.querySelectorAll('.hero-slide').forEach(sl => sl.remove());
    const slide = document.createElement('div'); slide.className = 'hero-slide svc-slide active'; slide.dataset.cat = catId;
    const img = document.createElement('img'); img.alt = ''; img.src = url; img.loading = 'eager';
    const fb = IMG.servicePhotos && IMG.servicePhotos[catId];
    img.onerror = () => { if (fb && img.src !== fb) img.src = fb; else slide.remove(); };
    slide.appendChild(img);
    wrap.insertBefore(slide, wrap.querySelector('.page-hero-overlay') || null);
  }
  document.documentElement.style.setProperty('--page-bg-url', 'url(' + url + ')');
}

function renderServicePage(catId){
  const el = document.getElementById('servicePageContent');
  if (!el) return;
  const c = CATS.find(x => x.id === catId);
  const route = seoRouteFor('service', catId);
  if (!c || !route) { el.innerHTML = ''; return; }
  const en = LANG === 'en';
  const price = n => n.toLocaleString(en ? 'en-GB' : 'fr-FR') + ' €';
  const tiers = c.lumen
    ? LUMEN_TIERS.map(lt => ({ id: lt.id, name: lt.name, badge: lt.badge, quote: lt.id === 'surm', price: lt.price, delay: lt.delay, items: lt.items }))
    : TIERS.map(tr => ({ id: tr.id, name: tr.name, badge: tr.badge, price: c.tiers[tr.id].price, delay: c.tiers[tr.id].delay, items: c.tiers[tr.id].items }));
  const others = CATS.filter(x => x.id !== catId && seoRouteFor('service', x.id));
  const h1 = en && route.h1En ? route.h1En : route.h1;
  const sub = SUBS[catId];
  const steps = ['about-step1', 'about-step2', 'about-step3', 'about-step4'];
  const priceLine = tt => tt.quote ? t({fr:'Sur devis', en:'On quote'}) : price(tt.price);

  /* Questions propres à chaque prestation : calculées à partir du contenu réel des formules. */
  const FEATURES = [
    { fr: /(\d+)\s+(?:photos?|visuels)/i, en: /(\d+)\s+(?:retouched\s+)?(?:HD\s+)?photos?/i,
      q: t({fr:'Combien de photos sont livrées ?', en:'How many photos are delivered?'}) },
    { fr: /(reel|film|vidéo)/i, en: /(reel|film|video)/i,
      q: t({fr:'Quelles formules incluent de la vidéo ?', en:'Which packages include video?'}) },
    { fr: /(\d+\s?h\b|heures?|demi-journée|journée)/i, en: /(\d+\s?h\b|hours?|half-day|full day)/i,
      q: t({fr:'Combien de temps dure la prestation ?', en:'How long does the service last?'}) },
    { fr: /(tenue|ambiance|lieu)/i, en: /(outfit|mood|location|venue)/i,
      q: t({fr:'Peut-on prévoir plusieurs tenues, ambiances ou lieux ?', en:'Can I plan several outfits, moods or locations?'}) },
    { fr: /impression/i, en: /print/i,
      q: t({fr:'Les impressions sont-elles incluses ?', en:'Are prints included?'}) },
  ];
  const featureFaq = FEATURES.map(f => {
    const rows = tiers.map(tt => {
      const item = (en ? tt.items.en : tt.items.fr).find(i => (en ? f.en : f.fr).test(i));
      return item ? `<li><strong>${t(tt.name)}</strong> — ${escHtml(item)}</li>` : '';
    }).filter(Boolean);
    return rows.length ? { q: f.q, a: '<ul class="svcp-list">' + rows.join('') + '</ul>' } : null;
  }).filter(Boolean).slice(0, 3);
  const faq = [
    { q: t({fr:'Quels sont les tarifs ?', en:'What are the rates?'}),
      a: '<ul class="svcp-list">' + tiers.map(tt => `<li><strong>${t(tt.name)}</strong> — ${priceLine(tt)}</li>`).join('') + '</ul>' + (sub ? `<p>${t({fr:'Abonnement ', en:'Subscription '})}${t(sub.name)} : ${sub.price.toLocaleString(en ? 'en-GB' : 'fr-FR')} € ${t({fr:'par mois', en:'per month'})}.</p>` : '') },
    { q: t({fr:'Dans quels délais reçoit-on les photos ?', en:'How soon are the photos delivered?'}),
      a: '<ul class="svcp-list">' + tiers.map(tt => `<li><strong>${t(tt.name)}</strong> — ${t(tt.delay)}</li>`).join('') + '</ul><p>' + t({fr:'Les délais démarrent à la date du shooting, hors demandes de retouches complémentaires.', en:'Timelines start on the shoot date, excluding additional retouching requests.'}) + '</p>' },
    ...featureFaq,
    ...(catId === 'photo-part' ? [{ q: t({fr:'Proposez-vous un book grossesse ?', en:'Do you offer a maternity book?'}),
      a: `<p>${t({fr:'Oui : le book grossesse est une formule dédiée, à ' + price(POLAS[catId].price) + '. Séance de 1h30 en studio ou en extérieur (au choix, sans supplément), 20 photos HD retouchées avec une retouche naturelle, une direction de pose douce et bienveillante, et la possibilité de venir en couple. Le moment idéal : entre la 28e et la 36e semaine de grossesse.', en:'Yes: the maternity book is a dedicated package at ' + price(POLAS[catId].price) + '. A 1.5-hour session in the studio or outdoors (your choice, no extra cost), 20 retouched HD photos with natural retouching, gentle posing guidance, and the option to join as a couple. The ideal moment: between weeks 28 and 36 of pregnancy.'})}</p>` }] : []),
    ...(POLAS[catId] && POLAS[catId].id === 'polas' ? [{ q: t({fr:'Qu\'est-ce que la formule Polas ?', en:'What is the Polas package?'}),
      a: `<p>${t({fr:'Des photos brutes, sans retouche, destinées aux agences de mannequins : séance en studio de 30 minutes sur fond blanc, 10 photos brutes (visage, profils, trois-quarts et plans en pied), fichiers HD livrés sous 24 h. Tarif : ', en:'Raw, unretouched photos made for model agencies: 30-minute studio session on a white background, 10 raw photos (face, profiles, three-quarter and full-body shots), HD files delivered within 24 hours. Rate: '})}${price(POLAS[catId].price)}${t({fr:', studio inclus.', en:', studio included.'})}</p><p><a href="/conseils/polas-mannequin-digitals-agence/" data-nav="article:polas-mannequin-digitals-agence">${t({fr:'Polas et digitals de mannequin : à quoi servent-elles ?', en:'Polas and model digitals: what are they for?'})}</a></p>` }] : []),
    ...(catId === 'photo-part' ? [{ q: t({fr:'Peut-on faire une séance en couple ou en groupe ?', en:'Can we book a couple or group session?'}),
      a: `<p>${t({fr:'Oui : la séance se fait en solo, en couple ou en groupe, en extérieur ou en studio. Choisissez la formule selon la durée et le nombre de photos souhaités ; pour vous aider à préparer vos tenues, lisez ', en:'Yes: sessions are available solo, as a couple or in a group, outdoors or in the studio. Pick the package according to the session length and number of photos you want; to prepare your outfits, read '})}<a href="/conseils/que-porter-seance-photo/" data-nav="article:que-porter-seance-photo">${t({fr:'Que porter pour une séance photo ?', en:'What to wear for a photo session?'})}</a>.</p>` }] : []),
    ...(catId === 'photo-part' ? [{ q: t({fr:'Réalisez-vous des portraits professionnels ?', en:'Do you shoot professional portraits?'}),
      a: `<p>${t({fr:'Oui : photo de profil, site web, présentation d\'équipe. Ils ont leur propre page, avec les mêmes formules adaptées à l\'usage professionnel : ', en:'Yes: profile photo, website, team presentation. They have their own page, with the same packages adapted to professional use: '})}<a href="/services/portrait-professionnel-corporate/" data-nav="service:corporate">${t({fr:'portraits corporate', en:'corporate portraits'})}</a>.</p>` }] : []),
  ];
  const PARTNER_HINT = {
    mode: { fr: 'Créateur, styliste, agence de mannequins ou maquilleur·se ? Découvrez le <a href="/collaboration/" data-nav="partners">partenariat BUNKAIO</a>.', en: 'Designer, stylist, model agency or make-up artist? Discover the <a href="/collaboration/" data-nav="partners">BUNKAIO partnership</a>.' },
    event: { fr: 'Lieu de réception, traiteur, décorateur ou organisateur ? Découvrez le <a href="/collaboration/" data-nav="partners">partenariat BUNKAIO</a>.', en: 'Venue, caterer, decorator or planner? Discover the <a href="/collaboration/" data-nav="partners">BUNKAIO partnership</a>.' },
    lumen: { fr: 'Wedding planner, domaine ou fleuriste ? Découvrez le <a href="/collaboration/" data-nav="partners">partenariat BUNKAIO</a>.', en: 'Wedding planner, estate or florist? Discover the <a href="/collaboration/" data-nav="partners">BUNKAIO partnership</a>.' },
  };
  const hint = PARTNER_HINT[catId];
  const copyBlock = SERVICE_COPY[catId];
  /* Visuel de la prestation : vrai <img> (indexable par Google Images), texte alternatif modifiable via IMG.serviceAlt. */
  const SERVICE_ALT_DEFAULT = {
    corporate: {fr:'Exemple de portrait professionnel réalisé par BUNKAIO', en:'Example of a professional portrait by BUNKAIO'},
    'photo-part': {fr:'Exemple de séance photo portrait réalisée par BUNKAIO', en:'Example of a portrait photo session by BUNKAIO'},
    mode: {fr:'Exemple de photographie de mode réalisée par BUNKAIO', en:'Example of fashion photography by BUNKAIO'},
    commercial: {fr:'Exemple de photographie de produit réalisée par BUNKAIO', en:'Example of product photography by BUNKAIO'},
    event: {fr:'Exemple de reportage d\'événement réalisé par BUNKAIO', en:'Example of event photography by BUNKAIO'},
    lumen: {fr:'Lumen, le photobooth IA de BUNKAIO pour mariages et événements', en:'Lumen, the BUNKAIO AI photobooth for weddings and events'}
  };
  const svcPhoto = IMG.servicePhotos && IMG.servicePhotos[catId];
  const svcAlt = (IMG.serviceAlt && t(IMG.serviceAlt[catId])) || (SERVICE_ALT_DEFAULT[catId] ? t(SERVICE_ALT_DEFAULT[catId]) : '');
  const svcFigure = svcPhoto ? `<figure class="svcp-figure"><img src="${svcPhoto}" alt="${escHtml(svcAlt)}" width="900" height="1200" loading="lazy" decoding="async" onerror="this.closest('figure').classList.add('is-broken')"></figure>` : '';
  /* « Quelle formule choisir ? » est intégré à chaque ligne de l'accordéon (conseil « Idéal si… »). */
  const chooseHints = (copyBlock && copyBlock.choose && copyBlock.choose.length === tiers.length) ? copyBlock.choose.map(h => t(h)) : [];
  const specialHint = POLAS[catId] ? (POLAS[catId].id === 'grossesse'
    ? t({fr:'vous attendez un heureux événement ? Une séance douce de 1h30, en studio ou en extérieur, pour garder des images soignées de cette période (idéalement entre la 28e et la 36e semaine).', en:'expecting a baby? A gentle 1.5-hour session, in the studio or outdoors, to keep beautiful images of this time (ideally between weeks 28 and 36).'})
    : t({fr:'vous devez présenter votre profil à une agence ? 10 photos brutes, sans retouche ni mise en scène, pour juger la morphologie et le potentiel, livrées en HD sous 24 h (studio inclus).', en:'need to present your profile to an agency? 10 raw photos with no retouching or styling, to assess build and potential, delivered in HD within 24 h (studio included).'})) : '';
  const chooseHtml = '';
  const practical = t({
    fr: 'Nous intervenons à <strong>Béziers, Montpellier et Toulouse</strong>. Les droits d\'utilisation commerciale des visuels vous sont cédés sans limite de durée. Toutes les réponses sont dans la <a href="/faq/" data-nav="faq">FAQ</a>, et pour une question précise, <a href="/contact/" data-nav="contact">contactez-nous</a>.',
    en: 'We work in <strong>Béziers, Montpellier and Toulouse</strong>. Commercial usage rights to the visuals are transferred to you with no time limit. All the answers are in the <a href="/faq/" data-nav="faq">FAQ</a>, and for a specific question, <a href="/contact/" data-nav="contact">get in touch</a>.' });

  el.innerHTML = `
    <a class="svcp-back" href="/services/" onclick="return navLink(event,'services')"><span aria-hidden="true">←</span> ${t({fr:'Retour au catalogue', en:'Back to the catalogue'})}</a>
    <div class="breadcrumb" role="navigation" aria-label="${t({fr:'Fil d\'Ariane', en:'Breadcrumb'})}">
      <a href="/" onclick="return navLink(event,'home')">${t({fr:'Accueil', en:'Home'})}</a><span aria-hidden="true">›</span>
      <a href="/services/" onclick="return navLink(event,'services')">Services</a><span aria-hidden="true">›</span>
      <span>${t(c.name)}</span>
    </div>
    <h1 data-pageh1 class="page-title">${h1}</h1>
    <p class="page-sub">${t(c.tag)}${c.pitch ? ' — ' + t(c.pitch) : ''}</p>
    <div class="svcp-cta-row">
      ${quizLink(catId, t({fr:'Estimer ce projet', en:'Estimate this project'}))}
      <a class="btn btn-ghost" href="/portfolio/" onclick="return navLink(event,'portfolio')"><span>${t({fr:'Voir le portfolio', en:'See the portfolio'})}</span></a>
    </div>
    ${isComingSoon(catId) ? `<div class="soon-banner"><b>${t({fr:'Bientôt disponible', en:'Coming soon'})}</b> ${t({fr:'Lumen ouvre prochainement à la réservation. Les tarifs ci-dessous sont ceux de lancement ; laissez-nous un message pour être prévenu(e) en premier de l\'ouverture.', en:'Lumen will soon open for bookings. The rates below are the launch rates; leave us a message to be the first to know when it opens.'})}</div>` : ''}

    ${copyBlock && copyBlock.lead ? `<section class="read-panel svcp-panel"><div class="svcp-lead-grid${svcFigure ? ' has-figure' : ''}"><p class="svcp-text svcp-lead">${t(copyBlock.lead)}</p>${svcFigure}</div></section>` : ''}

    <section class="read-panel svcp-panel">
      <h2>${t({fr:'Formules et tarifs', en:'Packages and rates'})}</h2>
      <p class="vat-note">${I18N[LANG]['vat-note']}</p>
      <p class="vat-note travel-note">🚗 ${TRAVEL_TXT[LANG].note}</p>
      <div class="fx-list">
        ${tiers.map((tt, ti) => fxItem(catId, { hint: chooseHints[ti] || '', id: tt.id, name: t(tt.name), badge: tt.badge ? t(tt.badge) : '', price: priceLine(tt), delay: t(tt.delay), items: (en ? tt.items.en : tt.items.fr), open: !!tt.badge && /(choisi|popular)/i.test(t(tt.badge)) })).join('')}
        ${POLAS[catId] ? fxItem(catId, { id: POLAS[catId].id, name: t(POLAS[catId].name), badge: t(POLAS[catId].label), price: price(specialTotal(POLAS[catId])), delay: t(POLAS[catId].delay) + ' · ' + t(POLAS[catId].studioNote), items: t(POLAS[catId].items), special: true, hint: specialHint, extra: POLAS[catId].id === 'polas' ? `<a class="svcp-link" href="/conseils/polas-mannequin-digitals-agence/" onclick="return navLink(event,'article','polas-mannequin-digitals-agence')">${t({fr:'Comprendre les Polas →', en:'What are Polas? →'})}</a>` : '' }) : ''}
      </div>
      ${sub ? `<p class="svcp-note">${t({fr:'Besoin régulier ? ', en:'Regular need? '})}<strong>${t(sub.name)}</strong> — ${sub.price.toLocaleString(en ? 'en-GB' : 'fr-FR')} € ${t({fr:'/ mois', en:'/ month'})}.</p>` : ''}
    </section>

    ${chooseHtml}

    <section class="read-panel svcp-panel svcp-two">
      <div>
        <h2>${t({fr:'Comment ça se passe', en:'How it works'})}</h2>
        <ol class="about-list about-steps">${steps.map(k => `<li>${I18N[LANG][k]}</li>`).join('')}</ol>
      </div>
      <div>
        <h2>${t({fr:'La photographe', en:'The photographer'})}</h2>
        <p class="svcp-text">${t({fr:'Aya Nascimento, photographe portraitiste professionnelle diplômée de l\'ETPA (BTS Photographie, 2018) : plus de 8 ans d\'expérience et plus de 200 projets réalisés.', en:'Aya Nascimento, professional portrait photographer, ETPA graduate (BTS Photography, 2018): more than 8 years of experience and more than 200 projects completed.'})}</p>
        <a class="svcp-link" href="/a-propos/" onclick="return navLink(event,'about')">${t({fr:'En savoir plus sur Aya →', en:'More about Aya →'})}</a>
      </div>
    </section>

    <section class="read-panel svcp-panel">
      <h2>${t({fr:'Questions fréquentes', en:'Frequently asked questions'})}</h2>
      <div id="servicePageFaq"></div>
      <p class="svcp-note">${practical}${hint ? ' ' + t(hint) : ''}</p>
    </section>

    ${(typeof ARTICLES !== 'undefined' && ARTICLES.some(a => a.cat === catId)) ? `
    <section class="read-panel svcp-panel">
      <h2>${t({fr:'Nos conseils pour bien préparer', en:'Our tips to prepare'})}</h2>
      <div class="advice-grid adv-row">${ARTICLES.filter(a => a.cat === catId).map(a => adviceCard(a)).join('')}</div>
    </section>` : ''}
    <section class="read-panel svcp-panel svcp-others">
      <h2>${t({fr:'Autres prestations', en:'Other services'})}</h2>
      <div class="svcp-others-row">
        ${others.map(o => `<a class="svcp-chip" href="${servicePath(o.id)}" onclick="return navLink(event,'service','${o.id}')">${t(o.name)}</a>`).join('')}
        <a class="svcp-chip" href="/services/" onclick="return navLink(event,'services')">${t({fr:'Tout le catalogue', en:'Full catalogue'})}</a>
      </div>
    </section>
    <div class="svcp-back-row"><a class="svcp-back" href="/services/" onclick="return navLink(event,'services')"><span aria-hidden="true">←</span> ${t({fr:'Retour au catalogue', en:'Back to the catalogue'})}</a></div>`;
  renderAccordionInto('servicePageFaq', faq.map(f => ({ title: f.q, body: f.a })), { exclusive: true, closed: true });
  serviceBgSync(catId);
}

/* ═══════════════ CONSEILS PHOTO (config/articles.js) ═══════════════ */
function articlePath(slug){ const r = seoRouteFor('article', slug); return r ? r.path : '/conseils/'; }
function fmtDate(iso){ return new Date(iso + 'T12:00:00').toLocaleDateString(LANG === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
/* Article dans la langue courante (textes anglais dans config/articles.en.js ; repli sur le français). */
function artL(a){ return (LANG === 'en' && typeof ARTICLES_EN !== 'undefined' && ARTICLES_EN[a.slug]) ? Object.assign({}, a, ARTICLES_EN[a.slug]) : a; }
function adviceCard(a0){
  const a = artL(a0);
  return `<a class="advice-card" href="${articlePath(a.slug)}" data-nav="article:${a.slug}">
    <span class="advice-card-meta">${a.minutes} ${t({fr:'min de lecture', en:'min read'})}</span>
    <span class="advice-card-title">${a.h1}</span>
    <span class="advice-card-text">${a.excerpt}</span>
    <span class="advice-card-more">${t({fr:'Lire le guide →', en:'Read the guide →'})}</span>
  </a>`;
}
function renderAdviceTeaser(){
  const el = document.getElementById('adviceTeaser');
  if (!el || typeof ARTICLES === 'undefined') return;
  const picks = ARTICLES.filter((a, i, arr) => arr.findIndex(b => b.cat === a.cat) === i).slice(0, 3);
  const hook = t({fr:picks.length + ' guides pour arriver préparé(e) à votre séance ou à votre shooting — à lire en ' + picks.reduce((n, a) => n + a.minutes, 0) + ' minutes en tout.', en:picks.length + ' guides to arrive prepared for your session or shoot — ' + picks.reduce((n, a) => n + a.minutes, 0) + ' minutes in total.'});
  el.innerHTML = `
    <section class="advice-teaser rv in">
      <div class="advice-teaser-head">
        <div>
          <div class="cs-kicker">${t({fr:'Conseils photo', en:'Photo advice'})}</div>
          <h2 class="advice-teaser-title" data-tw data-tw-delay="100">${t({fr:'Bien préparer votre séance ou votre shooting', en:'Prepare your session or shoot'})}</h2>
          <p class="advice-hook">${hook}</p>
        </div>
        <a class="svcp-link" href="/conseils/" data-nav="advice">${t({fr:'Tous les conseils →', en:'All advice →'})}</a>
      </div>
      <div class="advice-grid">${picks.map(a => adviceCard(a)).join('')}</div>
    </section>`;
  bindTypewriters();
  initAdviceLive();
}
function renderAdvicePage(){
  const el = document.getElementById('advicePageContent');
  if (!el || typeof ARTICLES === 'undefined') return;
  el.innerHTML = `
    <div class="breadcrumb" role="navigation" aria-label="${t({fr:'Fil d\'Ariane', en:'Breadcrumb'})}">
      <a href="/" data-nav="home">${t({fr:'Accueil', en:'Home'})}</a><span aria-hidden="true">›</span><span>${t({fr:'Conseils photo', en:'Photo advice'})}</span>
    </div>
    <h1 data-pageh1 class="page-title">${t({fr:'Conseils photo', en:'Photo advice'})}</h1>
    <p class="page-sub">${t({fr:'Des guides pratiques pour préparer une séance portrait, choisir ses tenues, organiser un shooting produit, mode ou événementiel.', en:'Practical guides to prepare a portrait session, choose outfits, and plan a product, fashion or event shoot.'})}</p>
    <section class="read-panel svcp-panel"><div class="advice-grid">${ARTICLES.map(a => adviceCard(a)).join('')}</div></section>`;
}
/* Illustrations des articles : pictogrammes au trait aux couleurs du site, choisis selon le sujet de chaque section. */
const ART_ICONS = {
  tag:     '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.6"/>',
  hanger:  '<path d="M12 7a2.2 2.2 0 1 0-2.2-2.2"/><path d="M12 7v2.4L3 16.5a1.4 1.4 0 0 0 .9 2.5h16.2a1.4 1.4 0 0 0 .9-2.5L12 9.4"/>',
  pin:     '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.6"/>',
  list:    '<rect x="5" y="3" width="14" height="18" rx="2"/><polyline points="8.5 8.5 10 10 12.5 7"/><line x1="8.5" y1="14" x2="15.5" y2="14"/><line x1="8.5" y1="17.5" x2="13" y2="17.5"/>',
  scale:   '<line x1="12" y1="4" x2="12" y2="20"/><line x1="7" y1="20" x2="17" y2="20"/><path d="M5 7h14"/><path d="M5 7l-3 7a3 3 0 0 0 6 0z"/><path d="M19 7l-3 7a3 3 0 0 0 6 0z"/>',
  shield:  '<path d="M12 3l8 3v6c0 4.4-3.2 7.6-8 9-4.8-1.4-8-4.6-8-9V6z"/><polyline points="8.5 12 11 14.5 15.5 9.5"/>',
  box:     '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><polyline points="4 7.5 12 12 20 7.5"/><line x1="12" y1="12" x2="12" y2="21"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.1-.5-1.2.2-2.4 1.6-2.4H17a4 4 0 0 0 4-4C21 6.9 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.1"/><circle cx="10" cy="7" r="1.1"/><circle cx="14.5" cy="7" r="1.1"/>',
  warn:    '<path d="M12 4l9.5 16.5h-19z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.4" r=".6"/>',
  clock:   '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  gallery: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M3 17l5-4.5 4 3.5 3-2.5 6 4.5"/>',
  spark:   '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
  user:    '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6.5 8-6.5s8 2.5 8 6.5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="3" y1="10" x2="21" y2="10"/>',
  camera:  '<path d="M4 8h3.5l1.5-2.5h6L16.5 8H20a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.6"/>',
  sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'
};
const ART_ICON_RULES = [
  [/prix|tarif|co[uû]t|pay|acompte|budget|combien co/i, 'tag'],
  [/porter|tenue|v[eê]tement|mati[eè]re|accessoire|motif|chaussure/i, 'hanger'],
  [/lieu|ext[eé]rieur|studio|emplacement|ville|[ée]lectri/i, 'pin'],
  [/droit|licence|accord|image|usage/i, 'shield'],
  [/formule|crit[eè]re|comparer|choisir|questions|poser/i, 'scale'],
  [/erreur|[ée]viter|pi[eè]ge/i, 'warn'],
  [/dur[ée]e|temps|d[eé]roul[eé]|jour j|timing|programme/i, 'clock'],
  [/livraison|retouche|galerie|d[eé]lai|impression/i, 'gallery'],
  [/couleur|teinte|palette|brief|r[eé]f[eé]rence|direction|moodboard|ambiance/i, 'palette'],
  [/produit|packshot|fond neutre|pi[eè]ce/i, 'box'],
  [/photobooth|invit[eé]|animation|souvenir|lumen/i, 'spark'],
  [/mannequin|polas|digitals|coiffure|maquillage|portrait|profil|[eé]quipe/i, 'user'],
  [/[eé]v[eé]nement|r[eé]ception|mariage|r[eé]servation|r[eé]server/i, 'calendar'],
  [/pr[eé]parer|pr[eé]paration|check|avant|conseil|r[eé]sum[eé]|astuce/i, 'list'],
  [/lumi[eè]re|ensoleill/i, 'sun']
];
function artIconFor(heading, body, cat, used){
  const all = (txt) => ART_ICON_RULES.filter(([re]) => re.test(txt)).map(r => r[1]);
  const pool = ['list', 'scale', 'palette', 'gallery', 'clock', 'pin', 'shield', 'camera', 'sun', 'spark', 'user', 'box', 'calendar', 'tag', 'hanger', 'warn'];
  const h = all(heading), b = all(body);
  /* sujet du titre d'abord (même si l'icône a déjà servi), puis sujet du texte, puis icône encore inutilisée */
  const ic = h.find(x => !used.has(x)) || h[0] || b.find(x => !used.has(x)) || pool.find(x => !used.has(x)) || 'camera';
  used.add(ic);
  return ic;
}
function artIllus(icon, big){
  const g = ART_ICONS[icon] || ART_ICONS.camera;
  if (!big) return `<svg class="art-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${g}</svg>`;
  return `<svg class="art-illus" viewBox="0 0 120 120" aria-hidden="true">
    <rect width="120" height="120" rx="28" fill="#efeaf8"/>
    <circle cx="96" cy="24" r="11" fill="#dccff2"/><circle cx="22" cy="98" r="7" fill="#e6def5"/><circle cx="101" cy="92" r="4" fill="#b9a6dc"/>
    <g transform="translate(24 24) scale(3)" fill="none" stroke="#4b3d7a" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${g}</g>
  </svg>`;
}
const ART_ALT = {
  'photo-part': {fr:'Exemple de séance photo portrait réalisée par BUNKAIO', en:'Example of a portrait photo session by BUNKAIO'},
  corporate: {fr:'Exemple de portrait professionnel réalisé par BUNKAIO', en:'Example of a professional portrait by BUNKAIO'},
  mode: {fr:'Exemple de photographie de mode réalisée par BUNKAIO', en:'Example of fashion photography by BUNKAIO'},
  commercial: {fr:'Exemple de photographie de produit réalisée par BUNKAIO', en:'Example of product photography by BUNKAIO'},
  event: {fr:'Exemple de reportage d\'événement réalisé par BUNKAIO', en:'Example of event photography by BUNKAIO'},
  lumen: {fr:'Lumen, le photobooth IA de BUNKAIO', en:'Lumen, the BUNKAIO AI photobooth'}
};

function renderArticlePage(slug){
  const el = document.getElementById('articlePageContent');
  if (!el || typeof ARTICLES === 'undefined') return;
  const a0 = ARTICLES.find(x => x.slug === slug);
  if (!a0) { el.innerHTML = ''; return; }
  const a = artL(a0);
  const related = (a.related || []).map(sl => ARTICLES.find(x => x.slug === sl)).filter(Boolean);
  const cat = a.cat ? CATS.find(c => c.id === a.cat) : null;
  const heroSrc = IMG.servicePhotos && IMG.servicePhotos[a.cat];
  const heroAlt = (IMG.serviceAlt && t(IMG.serviceAlt[a.cat])) || (ART_ALT[a.cat] ? t(ART_ALT[a.cat]) : '');
  const heroFig = heroSrc ? `<figure class="art-hero"><img src="${heroSrc}" alt="${escHtml(heroAlt)}" width="1200" height="520" loading="lazy" decoding="async" onerror="this.closest('figure').classList.add('is-broken')"></figure>` : '';
  el.innerHTML = `
    <div class="breadcrumb" role="navigation" aria-label="${t({fr:'Fil d\'Ariane', en:'Breadcrumb'})}">
      <a href="/" data-nav="home">${t({fr:'Accueil', en:'Home'})}</a><span aria-hidden="true">›</span>
      <a href="/conseils/" data-nav="advice">${t({fr:'Conseils photo', en:'Photo advice'})}</a><span aria-hidden="true">›</span>
      <span>${a.h1}</span>
    </div>
    <h1 data-pageh1 class="page-title">${a.h1}</h1>
    <p class="page-sub article-meta"><time datetime="${a.date}">${fmtDate(a.date)}</time> · ${a.minutes} ${t({fr:'min de lecture', en:'min read'})} · ${t({fr:'Par', en:'By'})} <a href="/a-propos/" data-nav="about" rel="author">Aya Nascimento</a></p>
    ${heroFig}
    <article class="read-panel svcp-panel article">
      <div class="article-summary"><strong>${t({fr:'En bref', en:'In short'})}</strong><ul>${a.summary.map(x => `<li>${x}</li>`).join('')}</ul></div>
      <div class="art-toolbar"><span>${a.sections.length} ${t({fr:'rubriques', en:'sections'})}</span><button type="button" class="art-all" data-acc-all="#artAcc" data-label-open="${t({fr:'Tout déplier', en:'Expand all'})}" data-label-close="${t({fr:'Tout replier', en:'Collapse all'})}">${t({fr:'Tout déplier', en:'Expand all'})}</button></div>
      <div class="cs-acc art-acc acc-multi" id="artAcc">${(() => { const used = new Set(); return a.sections.map((sec, k) => {
        const ic = artIconFor(sec.h, String(sec.html).replace(/<[^>]+>/g, ' ').slice(0, 200), a.cat, used);
        return `<section class="cs-acc-item art-item${k === 0 ? ' open' : ''}">
          <h2 class="art-h2"><button type="button" class="cs-acc-head art-head" aria-expanded="${k === 0}"><span class="art-n">${String(k + 1).padStart(2, '0')}</span>${artIllus(ic, false)}<span class="art-t">${sec.h}</span><i class="cs-acc-chev" aria-hidden="true"></i></button></h2>
          <div class="cs-acc-panel"><div class="art-body">${artIllus(ic, true)}<div class="art-text">${sec.html}</div></div></div>
        </section>`;
      }).join(''); })()}</div>
      <h2>${t({fr:'Questions fréquentes', en:'Frequently asked questions'})}</h2>
      <div id="articleFaq"></div>
      <aside class="author-box" aria-label="${t({fr:'À propos de l\'auteure', en:'About the author'})}">
        <img src="/images/about/aya-nascimento-photographe-studio.webp" alt="${LANG==='fr'?'Aya Nascimento, photographe portraitiste':'Aya Nascimento, portrait photographer'}" width="72" height="72" loading="lazy" decoding="async">
        <div>
          <p class="author-name"><a href="/a-propos/" data-nav="about" rel="author">Aya Nascimento</a></p>
          <p class="author-role">${t({fr:'Photographe portraitiste professionnelle, diplômée de l\'ETPA (BTS Photographie, 2018). Plus de 8 ans d\'expérience et plus de 200 projets réalisés.', en:'Professional portrait photographer, ETPA graduate (BTS Photography, 2018). Over 8 years of experience and 200+ projects.'})}</p>
          <p class="author-sign">${t({fr:'Article rédigé et signé par Aya Nascimento, fondatrice de BUNKAIO.', en:'Article written and signed by Aya Nascimento, founder of BUNKAIO.'})}</p>
        </div>
      </aside>
    </article>
    <section class="read-panel svcp-panel article-cta">
      <h2>${t({fr:'Un projet de séance ou de shooting ?', en:'Planning a session or a shoot?'})}</h2>
      <p class="svcp-text">${t({fr:'Estimez votre projet en quelques minutes : réponse personnalisée sous 48 h. Une question avant de vous lancer ? Consultez la <a href="/faq/" data-nav="faq">FAQ</a> ou <a href="/contact/" data-nav="contact">contactez-nous</a>.', en:'Estimate your project in a few minutes: personal reply within 48 hours. A question first? See the <a href="/faq/" data-nav="faq">FAQ</a> or <a href="/contact/" data-nav="contact">get in touch</a>.'})}</p>
      <div class="svcp-cta-row" style="margin:0">
        ${quizLink(a.cat, t({fr:'Estimer mon projet', en:'Estimate my project'}))}
        ${cat ? `<a class="btn btn-ghost" href="${servicePath(a.cat)}" data-nav="service:${a.cat}"><span>${t(cat.name)}</span></a>` : ''}
      </div>
    </section>
    ${related.length ? `<section class="read-panel svcp-panel"><h2>${t({fr:'À lire aussi', en:'Keep reading'})}</h2><div class="advice-grid adv-row">${related.map(x => adviceCard(x)).join('')}</div></section>` : ''}`;
  renderAccordionInto('articleFaq', a.faq.map(f => ({ title: f.q, body: '<p>' + f.a + '</p>' })), { exclusive: true });
}

/* Liens internes déclarés par data-nav="vue[:sous-page]" (articles, cartes…) : navigation SPA
   sans rechargement, tout en gardant un vrai href pour les moteurs et le clic droit. */
const NAV_ALIASES = { faq: 'legal', conseils: 'advice' };
/* Lien vers le devis : un vrai <a href="/devis/"> (crawlable, ancre explicite) qui présélectionne l'univers. */
function quizLink(catId, label, cls){ if (catId && isComingSoon(catId)) label = t({fr:'Me prévenir de l\'ouverture', en:'Notify me when it opens'}); return `<a class="${cls || 'cta-primary'}" href="/devis/" data-quiz="${catId || ''}">${label}</a>`; }
document.addEventListener('click', (e) => {
  const a = e.target.closest ? e.target.closest('a[data-quiz]') : null;
  if (!a) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;
  e.preventDefault();
  closeMobileMenu();
  const cat = a.dataset.quiz;
  if (cat && isComingSoon(cat)) goToComingSoon(cat); else if (cat) goToQuizCategory(cat); else goView('quiz');
});
document.addEventListener('click', (e) => {
  const a = e.target.closest ? e.target.closest('a[data-nav]') : null;
  if (!a) return;
  const [view, sub] = a.dataset.nav.split(':');
  if (navLink(e, NAV_ALIASES[view] || view, sub || undefined) === false) e.preventDefault();
});

/* Garanties de la page Services : 4 puces, une seule ouverte à la fois. */
let svcAssureOpen = 0;
function toggleSvcAssure(i){ svcAssureOpen = svcAssureOpen === i ? 0 : i; renderSvcAssure(); }
function renderSvcAssure(){
  const root = document.getElementById('svcAssure');
  if (!root) return;
  root.querySelectorAll('.svc-chip').forEach(c => {
    const on = Number(c.dataset.i) === svcAssureOpen;
    c.classList.toggle('active', on);
    c.setAttribute('aria-expanded', String(on));
  });
  const panel = document.getElementById('svcAssurePanel');
  const txt = document.getElementById('svcAssureText');
  if (svcAssureOpen) txt.innerHTML = I18N[LANG]['svc-trust' + svcAssureOpen + '-text'];
  panel.classList.toggle('open', svcAssureOpen > 0);
}

/* « Je réserve ma séance » : amène directement au catalogue, plus bas sur la même page. */
function goToCatalogue(){
  setSvcTab('catalogue');
  const target = document.getElementById('servicesFilters');
  if (!target) return;
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 90;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 16, behavior: 'smooth' });
}

function setSvcTab(tab){
  activeSvcTab = tab;
  document.getElementById('stab-catalogue').classList.toggle('active', tab === 'catalogue');
  document.getElementById('stab-devis').classList.toggle('active', tab === 'devis');
  document.getElementById('ssec-catalogue').style.display = tab === 'catalogue' ? 'block' : 'none';
  document.getElementById('ssec-devis').style.display = tab === 'devis' ? 'block' : 'none';
  if (tab === 'devis') renderProcessSteps();
}

function updatePayFlexBanner(list){
  const el = document.getElementById('svcPayFlexText');
  const pricedList = list.filter(c => !c.lumen && c.tiers && c.tiers.deco);
  if (!el || !pricedList.length) return;
  const minPrice = Math.min(...pricedList.map(c => c.tiers.deco.price));
  const monthly = Math.round(minPrice / 3).toLocaleString('fr-FR');
  el.innerHTML = LANG === 'fr'
    ? `<strong>À partir de ${monthly}€/mois avec Klarna</strong>, carte bancaire — ou en 2 fois, acompte 30 % puis solde. Sans aucun frais supplémentaire.`
    : `<strong>From €${monthly}/mo with Klarna</strong>, credit card — or in 2 instalments, 30% deposit then balance. No extra fees.`;
}

function renderServices(){
  const fl = document.getElementById('servicesFilters');
  fl.innerHTML = '';
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn' + (activeServiceFilter === null ? ' active' : '');
  allBtn.textContent = I18N[LANG]['svc-all'];
  allBtn.onclick = () => { activeServiceFilter = null; renderServices(); };
  fl.appendChild(allBtn);
  CATS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'filter-btn' + (activeServiceFilter === c.id ? ' active' : '');
    b.textContent = t(c.name);
    b.onclick = () => { activeServiceFilter = c.id; renderServices(); };
    fl.appendChild(b);
  });
  const photoEl  = document.getElementById('svcCatPhoto');
  const photoImg = document.getElementById('svcCatPhotoImg');
  const layout   = document.getElementById('servicesLayout');
  if (photoEl && photoImg && activeServiceFilter && IMG.servicePhotos && IMG.servicePhotos[activeServiceFilter]) {
    photoEl.style.display = 'block';
    layout && layout.classList.add('has-photo');
    photoImg.classList.remove('loaded');
    photoImg.src = IMG.servicePhotos[activeServiceFilter];
    photoImg.onload = () => photoImg.classList.add('loaded');
  } else if (photoEl) {
    photoEl.style.display = 'none';
    layout && layout.classList.remove('has-photo');
  }
  const grid = document.getElementById('servicesGrid');
  grid.innerHTML = '';
  const list = activeServiceFilter ? CATS.filter(c => c.id === activeServiceFilter) : CATS;
  updatePayFlexBanner(list);
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'service-card rv';
    const subRow = SUBS[c.id] ? `
      <div class="service-sub-row">
        <span class="service-sub-label">${I18N[LANG]['svc-sub-label']}${SUBS[c.id].audience ? ' — ' + t(SUBS[c.id].audience) : ''}${SUBS[c.id].promo ? `<span class="service-tier-promo">${t(SUBS[c.id].promo)}</span>` : ''}</span>
        <span class="service-sub-price">${SUBS[c.id].price.toLocaleString('fr-FR')}€<small>/${LANG === 'fr' ? 'mois' : 'mo'}</small></span>
      </div>` : '';
    card.innerHTML = `
      <div class="service-head">
        <div class="service-icon">${getIcon(c.icon)}</div>
        <div class="service-name">${t(c.name)}</div>
        ${c.comingSoon ? `<span class="soon-chip">${t({fr:'Bientôt disponible', en:'Coming soon'})}</span>` : ''}<span class="service-from">${t({fr:'dès', en:'from'})} ${catFacts(c).from.toLocaleString('fr-FR')} €</span>
        <i class="service-chev" aria-hidden="true"></i>
      </div>
      <div class="service-tag">${t(c.tag)}</div>
      ${c.pitch ? `<p class="service-pitch">${t(c.pitch)}</p>` : ''}
      <div class="service-tiers">
        ${c.lumen
          ? LUMEN_TIERS.map(lt => `
              <div class="service-tier">
                <span class="service-tier-name">${t(lt.name)}${lt.promo ? `<span class="service-tier-promo">${t(lt.promo)}</span>` : ''}</span>
                <span class="service-tier-price">${lt.id === 'surm' ? (LANG === 'fr' ? 'Devis' : 'Quote') : lt.price.toLocaleString('fr-FR') + '€'}</span>
              </div>`).join('')
          : TIERS.map(tier => `
              <div class="service-tier">
                <span class="service-tier-name">${t(tier.name)}${c.tiers[tier.id].promo ? `<span class="service-tier-promo">${t(c.tiers[tier.id].promo)}</span>` : ''}</span>
                <span class="service-tier-price">${c.tiers[tier.id].price.toLocaleString('fr-FR')}€</span>
              </div>`).join('')}
      </div>
      ${subRow}
      ${POLAS[c.id] ? `<div class="service-polas"><span class="service-tier-name"><strong>${t(POLAS[c.id].name)}</strong> <span class="service-polas-tag">${t(POLAS[c.id].label)}</span><small>${t(POLAS[c.id].short)}</small></span><span class="service-tier-price">${specialTotal(POLAS[c.id]).toLocaleString('fr-FR')}€</span></div>` : ''}
      <button class="service-cta">${I18N[LANG]['svc-cta']}</button>
      <a class="service-more" href="${servicePath(c.id)}" onclick="return navLink(event,'service','${c.id}')">${t(c.name)} : ${t({fr:'détails et tarifs →', en:'details and rates →'})}</a>`;
    /* Mobile : fiches repliées (nom + prix « dès »), le détail s'ouvre au toucher ; un filtre actif ouvre la fiche. */
    if (activeServiceFilter) card.classList.add('is-open');
    card.querySelector('.service-head').addEventListener('click', () => card.classList.toggle('is-open'));
    if (c.comingSoon) card.querySelector('.service-cta').textContent = t({fr:'Me prévenir de l\'ouverture', en:'Notify me when it opens'});
    card.querySelector('.service-cta').onclick = () => {
      if (c.comingSoon) { goToComingSoon(c.id); return; }
      S.cat = c.id; S.tier = null; S.prof = null;
      /* profNext removed */
      document.getElementById('profQBox').style.display = 'none';
      renderProfiles();
      goView('quiz');
      setTimeout(() => quizStep(2), 500);
    };
    grid.appendChild(card);
    observe(card);
  });
}

/* ═══════════════ PROCESS DÉROULÉ ═══════════════ */
const PROCESS_STEPS = {
  fr:[
    { title:'Réception de votre demande',  text:'Nous analysons les informations transmises dans votre questionnaire.' },
    { title:'Étude de votre projet',       text:'Nous examinons vos besoins, vos objectifs et les éventuelles contraintes.' },
    { title:'Prise de contact',            text:'Nous revenons vers vous sous 48h ouvrées pour échanger sur votre projet.', badge:'Sous 48h' },
    { title:'Proposition personnalisée',   text:'Nous vous transmettons une proposition adaptée à vos besoins et à votre budget.' },
    { title:'Acompte & validation du rendez-vous', text:'Un acompte de 30% du montant total valide la réservation de votre date de séance.', badge:'Acompte 30%' },
    { title:'Votre moodboard',             text:'Dans votre espace client, vous partagez votre vision — direction artistique, ambiance, inspirations — pour que nous arrivions le jour J parfaitement alignés avec votre projet.', badge:'Optionnel' },
    { title:'Séance & livraison',          text:'Après la séance, le solde de 70% est à régler à réception de la commande. L\'accès à vos fichiers est ouvert dès le règlement effectué.', badge:'Solde 70%' },
  ],
  en:[
    { title:'Receiving your request',      text:'We review the information submitted in your questionnaire.' },
    { title:'Reviewing your project',      text:'We look at your needs, your goals and any specific constraints.' },
    { title:'Getting in touch',            text:'We get back to you within 48 working hours to discuss your project.', badge:'Within 48h' },
    { title:'Personalised proposal',       text:'We send you a proposal tailored to your needs and your budget.' },
    { title:'Deposit & booking confirmed', text:'A 30% deposit secures the booking of your session date.', badge:'30% deposit' },
    { title:'Your moodboard',              text:'In your client area, you share your vision — art direction, mood, inspirations — so we arrive on the day perfectly aligned with your project.', badge:'Optional' },
    { title:'Session & delivery',          text:'After the shoot, the remaining 70% is due on delivery of your order. File access opens as soon as payment is received.', badge:'70% balance' },
  ]
};

function renderProcessSteps(){
  const el = document.getElementById('processSteps');
  if (!el) return;
  const steps = PROCESS_STEPS[LANG];
  const kicker = LANG === 'fr' ? 'Les prochaines étapes' : 'What happens next';
  const sub = LANG === 'fr'
    ? 'Voici comment votre projet va être traité, étape par étape.'
    : 'Here\'s how your project will be handled, step by step.';
  el.innerHTML = `
    <div class="pt-card rv">
      <div class="pt-kicker">${kicker}</div>
      <div class="pt-sub">${sub}</div>
      <div class="pt-list">
        ${steps.map((s, i) => `
          <div class="pt-step">
            <div class="pt-num-col">
              <div class="pt-num">${i + 1}</div>
              <div class="pt-line"></div>
            </div>
            <div class="pt-body">
              <div class="pt-title-row">
                <span class="pt-title">${s.title}</span>
                ${s.badge ? `<span class="pt-badge">${s.badge}</span>` : ''}
              </div>
              <div class="pt-text">${s.text}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
  el.querySelectorAll('.rv').forEach(observe);
  /* Illustration latérale : vidéo si IMG.devisVideo pointe vers un
     fichier existant (voir config/media.js — chemin pré-câblé vers R2,
     déposé via admin/media.html), sinon l'image fixe habituelle. Le
     chemin est toujours défini (non vide) pour permettre l'activation
     sans toucher au code ; sans fichier réel à ce chemin, la vidéo
     échoue silencieusement (404) et on retombe sur l'image — même
     principe de repli que IMG.servicesVideo. */
  const sideImgBox = document.querySelector('#ssec-devis .side-img');
  if (sideImgBox) {
    const showImg = () => {
      sideImgBox.querySelectorAll('video').forEach(v => v.remove());
      let img = document.getElementById('img-devis-side');
      if (!img) {
        img = document.createElement('img');
        img.loading = 'lazy'; img.id = 'img-devis-side'; img.alt = 'Bunkaio — processus';
        sideImgBox.appendChild(img);
      }
      if (!img.src) img.src = IMG.devis;
    };
    if (IMG.devisVideo && !sideImgBox.querySelector('video')) {
      const vid = createBgVideo(IMG.devisVideo);
      vid.addEventListener('error', showImg, { once: true });
      sideImgBox.innerHTML = '';
      sideImgBox.appendChild(vid);
    } else if (!IMG.devisVideo) {
      showImg();
    }
  }
}

/* ═══════════════ 4K DRONE ═══════════════ */
let activeDroneCat = DRONE_CATS[0].id;

function renderDroneCats(){
  const el = document.getElementById('droneCats');
  if (!el) return; /* rubrique mise en pause (voir index.html) — élément absent du DOM */
  el.innerHTML = '';
  DRONE_CATS.forEach(c => {
    const d = document.createElement('div');
    d.className = 'drone-cat-card' + (activeDroneCat === c.id ? ' active' : '');
    const count = c.projects.length;
    const countLabel = LANG === 'fr' ? (count + ' projet' + (count > 1 ? 's' : '')) : (count + ' project' + (count > 1 ? 's' : ''));
    d.innerHTML = `<div class="drone-cat-name">${t(c.name)}</div><div class="drone-cat-count">${countLabel}</div>`;
    d.onclick = () => { activeDroneCat = c.id; renderDroneCats(); renderDroneProjects(c.id); };
    el.appendChild(d);
  });
}

function renderDroneProjects(catId){
  const el = document.getElementById('droneProjects');
  if (!el) return; /* rubrique mise en pause (voir index.html) — élément absent du DOM */
  const cat = DRONE_CATS.find(c => c.id === catId);
  el.innerHTML = '';
  cat.projects.forEach(p => {
    const d = document.createElement('div');
    d.className = 'drone-project rv';
    d.innerHTML = `
      <div class="drone-project-thumb"><img loading="lazy" src="${p.thumb}" alt="${t(p.title)}"></div>
      <div class="drone-project-body">
        <div class="drone-project-cat">${t(cat.name)}</div>
        <div class="drone-project-title">${t(p.title)}</div>
        <div class="drone-project-desc">${t(p.desc)}</div>
      </div>`;
    d.querySelector('.drone-project-thumb').onclick = () => openVideoModal(p.video);
    el.appendChild(d);
    observe(d);
  });
}

function openVideoModal(src){
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('modalVideo');
  video.src = src;
  modal.classList.add('active');
  video.play().catch(() => {});
}

function closeVideoModal(){
  const video = document.getElementById('modalVideo');
  video.pause(); video.src = '';
  document.getElementById('videoModal').classList.remove('active');
}

/* ═══════════════ PORTFOLIO ═══════════════ */
let pfLoaded = false;

/* Galerie portfolio — chargement dynamique, sans liste à maintenir dans
   config/media.js : on tente simplement de charger 1.webp, 2.webp...
   (le nommage déjà utilisé par admin/media.html à l'upload) jusqu'à
   max, et on ne garde que celles qui existent réellement (certaines
   peuvent 404 si moins de photos ont été déposées — comportement normal,
   pas une erreur). Déposer un fichier dans l'admin suffit donc à le
   faire apparaître ici, sans aucune autre manipulation. Un petit cache
   évite de re-sonder le réseau à chaque navigation entre onglets. */
const _pfGalleryCache = {};
/* Test d'existence par requête HEAD (aucun octet d'image téléchargé) ; repli sur
   le chargement de l'image si le navigateur refuse la requête. */
function probeImageExists(src){
  return fetch(src, { method: 'HEAD' })
    .then(r => r.ok)
    .catch(() => new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    }));
}
async function loadPortfolioPhotos(catId, max){
  if (_pfGalleryCache[catId]) return _pfGalleryCache[catId];
  const candidates = Array.from({ length: max }, (_, i) => MEDIA_BASE + '/portfolio/' + catId + '/' + (i + 1) + '.webp');
  const found = await Promise.all(candidates.map(probeImageExists));
  const photos = candidates.filter((_, i) => found[i]);
  _pfGalleryCache[catId] = photos;
  return photos;
}
/* Rend la galerie dans `container` une fois les photos trouvées — le
   DOM est mis à jour au retour de la sonde réseau (asynchrone), sans
   bloquer le reste de la page pendant ce temps. */
function renderPfGalleryInto(container, catId, catLabel, max, emptyText){
  container.innerHTML = '';
  loadPortfolioPhotos(catId, max).then(photos => {
    if (!container.isConnected) return; /* vue quittée entre-temps */
    container.innerHTML = '';
    if (photos.length === 0){
      const empty = document.createElement('div');
      empty.className = 'pf-empty rv';
      empty.textContent = emptyText;
      container.appendChild(empty);
      observe(empty);
      return;
    }
    photos.forEach((src, i) => {
      const ph = document.createElement('div');
      ph.className = 'ph rv';
      const fileNum = parseInt((src.match(/\/(\d+)\.webp/) || [])[1], 10) || (i + 1); /* l'ALT suit le numéro du fichier : supprimer une photo ne décale pas les autres */
      const customAlt = IMG.portfolioAlt && IMG.portfolioAlt[catId] && IMG.portfolioAlt[catId][fileNum - 1];
      ph.innerHTML = `<img loading="lazy" decoding="async" src="${src}" alt="${escHtml(customAlt || ((LANG === 'fr' ? 'Réalisation BUNKAIO — ' : 'BUNKAIO work — ') + catLabel.toLowerCase() + ' (' + (i + 1) + '/' + photos.length + ')'))}">`;
      container.appendChild(ph);
      observe(ph);
    });
  });
}

function renderPfTabs(){
  const el = document.getElementById('pfTabs');
  el.innerHTML = '';
  PF_CATS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'pf-cat-tab';
    b.textContent = t(c.label);
    b.dataset.cat = c.id;
    b.onclick = () => selectPfTab(c.id);
    el.appendChild(b);
  });
}

/* Liens vers chaque prestation, sous la galerie : maillage interne + texte indexable. */
function discoverPanel(text){
  return `<section class="read-panel svcp-panel pf-links"><h2>${t({fr:'Découvrir chaque prestation', en:'Explore each service'})}</h2>
    <p class="svcp-text">${text}</p>
    <div class="discover-cta"><a class="cta-primary" href="/decouvrir-chaque-prestation/" data-nav="discover"><span>${t({fr:'Découvrir chaque prestation →', en:'Explore each service →'})}</span></a></div>
    <div class="svcp-others-row">${CATS.filter(c => seoRouteFor('service', c.id)).map(c => `<a class="svcp-chip" href="${servicePath(c.id)}" data-nav="service:${c.id}">${t(c.name)}</a>`).join('')}</div></section>`;
}
function renderPortfolioLinks(){
  const el = document.getElementById('pfLinks');
  if (!el) return;
  el.innerHTML = discoverPanel(t({fr:'Vous aimez ce que vous voyez ? Découvrez pour qui est conçue chaque prestation, ce qu\'elle comprend, à partir de quel prix et sous quel délai : portrait, corporate, mode, produits, événementiel et photobooth Lumen.', en:'Like what you see? Find out who each service is designed for, what it includes, from what price and in what time: portrait, corporate, fashion, products, events and the Lumen photobooth.'}));
}
function renderServiceLinks(){
  const el = document.getElementById('svcLinks');
  if (!el) return;
  el.innerHTML = discoverPanel(t({fr:'Pas sûr de la prestation qui vous convient ? Parcourez chacune d\'elles : pour qui, ce qu\'elle apporte, ses tarifs de départ et ses délais, avec des conseils pour bien choisir.', en:'Not sure which service suits you? Browse each one: who it is for, what it brings, starting rates and delivery times, with tips to choose well.'}));
}
/* Avis Google : le lien (config/media.js → GOOGLE_REVIEW_URL) est renseigné une fois la fiche Google Business Profile créée.
   Tant qu'il est vide, aucun bouton n'est affiché. */
function renderGoogleReview(){
  const url = typeof GOOGLE_REVIEW_URL !== 'undefined' ? GOOGLE_REVIEW_URL : '';
  const btn = `<a class="cta-primary" href="${url}" target="_blank" rel="noopener"><span>${t({fr:'Laisser un avis sur Google', en:'Leave a Google review'})}</span></a>`;
  const box = document.getElementById('gReview');
  if (box) box.innerHTML = url ? `<div class="read-panel g-review"><h3>${t({fr:'Votre avis sur Google', en:'Your Google review'})}</h3><p>${t({fr:'Un avis sur Google aide d\'autres clients à nous trouver et à nous faire confiance. Cela prend moins d\'une minute.', en:'A Google review helps other clients find and trust us. It takes less than a minute.'})}</p>${btn}</div>` : '';
  const done = document.getElementById('gReviewDone');
  if (done) done.innerHTML = url ? `<p>${t({fr:'Si vous avez 1 minute, votre avis public sur Google nous aide énormément :', en:'If you have a minute, a public Google review helps us enormously:'})}</p>${btn}` : '';
  const li = document.getElementById('ftReviewLi');
  if (li) { li.hidden = !url; const a = li.querySelector('a'); if (a && url) a.href = url; }
}
function selectPfTab(id){
  document.querySelectorAll('.pf-cat-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.cat === id));
  const grid = document.getElementById('pfGrid');
  const catLabel = t(PF_CATS.find(c => c.id === id)?.label || {});
  const emptyText = LANG === 'fr'
    ? `Visuels « ${catLabel} » à venir — contactez-nous pour des exemples.`
    : `"${catLabel}" visuals coming soon — get in touch for examples.`;
  renderPfGalleryInto(grid, id, catLabel, 24, emptyText);
}

/* ═══════════════ CONTACT ═══════════════ */
function sendContact(e){
  e.preventDefault();
  if (window.track) track('contact_submit');
  const n = document.getElementById('ctName').value.trim();
  const em = document.getElementById('ctEmail').value.trim();
  const ph = document.getElementById('ctPhone').value.trim();
  const msg = document.getElementById('ctMsg').value.trim();
  const btn = document.querySelector('#ctForm .btn-solid');
  if (btn) btn.disabled = true;
  sendAck('contact', n, em, 'client', { telephone: ph, message: msg });
  fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ _subject: 'CONTACT SITE BUNKAIO — ' + n, _replyto: em, nom_societe: n, email: em, telephone: ph || 'Non renseigné', message: msg })
  }).then(() => {
    document.getElementById('ctForm').style.display = 'none';
    document.getElementById('ctSuccess').style.display = 'block';
  }).catch(() => {
    document.getElementById('ctForm').style.display = 'none';
    document.getElementById('ctSuccess').style.display = 'block';
  });
}

/* ═══════════════ PARTAGER MON EXPÉRIENCE (témoignage) ═══════════════ */
/* « Partager mon expérience » : ouvre directement la fiche Google (formulaire d'avis). */
function shareExperience(){
  if (window.track) track('share_google');
  const url = typeof GOOGLE_REVIEW_URL !== 'undefined' ? GOOGLE_REVIEW_URL : '';
  if (url) window.open(url, '_blank', 'noopener'); else goView('share');
}
function sendShare(e){
  e.preventDefault();
  if (window.track) track('share_submit');
  const n = document.getElementById('shName').value.trim();
  const em = document.getElementById('shEmail').value.trim();
  const spe = document.getElementById('shSpecialty').value;
  const txt = document.getElementById('shText').value.trim();
  const btn = document.querySelector('#shareForm .btn-solid');
  if (btn) btn.disabled = true;
  sendAck('share', n, em, 'client', { prestation: spe, temoignage: txt });
  fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: 'NOUVEAU TÉMOIGNAGE — ' + n,
      _replyto: em,
      nom: n,
      email: em,
      prestation_concernee: spe,
      temoignage: txt
    })
  }).then(() => {
    document.getElementById('shareForm').style.display = 'none';
    document.getElementById('shSuccess').style.display = 'block';
  }).catch(() => {
    document.getElementById('shareForm').style.display = 'none';
    document.getElementById('shSuccess').style.display = 'block';
  });
}

/* ═══════════════ PARTENAIRES — PROPOSER UNE COLLABORATION ═══════════════ */
/* Cartes cliquables (pas un simple menu déroulant) : chaque catégorie
   reste visuellement dissociée. Un seul type actif à la fois, repris
   dans le champ caché #collabType utilisé par sendCollab(). */
function selectCollabType(btn){
  document.querySelectorAll('.collab-type-card').forEach(c => c.classList.toggle('active', c === btn));
  document.getElementById('collabType').value = btn.dataset.value;
  const err = document.getElementById('collabTypeError');
  if (err) err.style.display = 'none';
}

function sendCollab(e){
  e.preventDefault();
  if (window.track) track('collab_submit');
  const n = document.getElementById('collabName').value.trim();
  const em = document.getElementById('collabEmail').value.trim();
  const web = document.getElementById('collabWeb').value.trim();
  const type = document.getElementById('collabType').value;
  const proj = document.getElementById('collabProject').value.trim();
  if (!type) {
    const err = document.getElementById('collabTypeError');
    if (err) err.style.display = 'block';
    document.getElementById('collabTypeGrid').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const btn = document.querySelector('#collabForm .btn-solid');
  if (btn) btn.disabled = true;
  sendAck('collab', n, em, 'client', { type: type, site: web, projet: proj });
  fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      /* Catégorie en tête de l'objet du mail : permet de trier/filtrer
         les propositions par type directement depuis la boîte mail
         (règle de filtrage sur "[Type…]" dans le logiciel de messagerie). */
      _subject: 'COLLABORATION [' + type + '] — ' + n,
      _replyto: em,
      type_de_collaboration: type,
      nom_societe: n,
      email: em,
      site_reseaux: web || 'Non renseigné',
      projet: proj
    })
  }).then(() => {
    document.getElementById('collabForm').style.display = 'none';
    document.getElementById('collabSuccess').style.display = 'block';
  }).catch(() => {
    document.getElementById('collabForm').style.display = 'none';
    document.getElementById('collabSuccess').style.display = 'block';
  });
}

/* ═══════════════ PARTENAIRES — CANDIDATER (Partenaire Fondateur) ═══════════════ */
/* Le candidat choisit son type de prestataire (mêmes catégories que
   PARTNER_PROVIDER_TYPES, regroupées par univers) : le secteur est déduit
   du type. Valeurs reprises dans les champs cachés #applySector/#applyType. */
let applyDraftType = null;
function renderApplyTypePicker(){
  const el = document.getElementById('applyTypePicker');
  if (!el) return;
  el.innerHTML = PARTNER_SECTORS.map(sec => `
    <div class="pt-group">
      <div class="pt-group-name">${t(sec.name)}</div>
      <div class="mb-chip-grid pt-chips">
        ${PARTNER_PROVIDER_TYPES.filter(p => p.sector === sec.id).map(p =>
          `<button type="button" class="mb-chip ${applyDraftType === p.id ? 'active' : ''}" onclick="selectApplyType('${p.id}')">${t(p.name)}</button>`).join('')}
      </div>
    </div>`).join('') + `
    <div class="pt-group">
      <div class="mb-chip-grid pt-chips">
        <button type="button" class="mb-chip ${applyDraftType === 'autre' ? 'active' : ''}" onclick="selectApplyType('autre')">${t({fr:'Autre', en:'Other'})}</button>
      </div>
    </div>`;
}
function selectApplyType(id){
  applyDraftType = id;
  const pt = partnerProviderType(id);
  const sec = pt ? PARTNER_SECTORS.find(x => x.id === pt.sector) : null;
  document.getElementById('applyType').value = pt ? t(pt.name) : t({fr:'Autre', en:'Other'});
  document.getElementById('applySector').value = sec ? t(sec.name) : t({fr:'Autre', en:'Other'});
  const err = document.getElementById('applySectorError');
  if (err) err.style.display = 'none';
  renderApplyTypePicker();
}

/* Accordéon « Ce que vous obtenez » : reprend les avantages du programme
   (remise permanente, promotions, missions, visibilité, réseau, espace). */
function renderApplyBenefits(){
  const el = document.getElementById('applyBenefitsAccordion');
  if (!el) return;
  const ex = CATS.find(c => c.id === 'commercial');
  const exPrice = ex && ex.tiers && ex.tiers.sig && ex.tiers.sig.price;
  const exLine = exPrice ? t({
    fr:`Exemple : le Pack Signature « Commercial & produits » passe de ${eur(exPrice)} à ${eur(partnerPrice(exPrice))}, soit ${eur(exPrice - partnerPrice(exPrice))} économisés.`,
    en:`Example: the "Commercial & products" Signature package goes from ${eur(exPrice)} to ${eur(partnerPrice(exPrice))} — you save ${eur(exPrice - partnerPrice(exPrice))}.`}) : '';
  const li = arr => '<ul class="ft-list" style="margin-top:12px">' + arr.map(x => `<li style="margin-bottom:8px">⊹ ${x}</li>`).join('') + '</ul>';
  const sections = LANG === 'fr' ? [
    { title:`-${PARTNER_DISCOUNT}% permanent sur tout le catalogue`, body:`<p>Un tarif partenaire appliqué automatiquement à tous vos devis, tant que votre partenariat est actif.</p>${li(['Toutes les prestations du catalogue, options comprises','Abonnements Studio Continu inclus','Remise visible dans le récapitulatif de votre devis'])}${exLine ? `<p style="margin-top:12px"><strong>${exLine}</strong></p>` : ''}` },
    { title:'Promotions supplémentaires sur certaines prestations', body:`<p>Bunkaio peut vous accorder des promotions ciblées, en plus de la remise permanente : offre de lancement, prestation offerte, tarif spécial sur une période. Elles apparaissent dans l'onglet <strong>« Mes promotions »</strong> de votre espace partenaire.</p>` },
    { title:'Des missions collaboratives rémunérées', body:`<p>Selon votre type de prestataire, Bunkaio vous sollicite pour intervenir sur des projets clients. Vous acceptez ou déclinez en un clic depuis <strong>« Mes collaborations »</strong>, et vous indiquez quand vous êtes disponible.</p>` },
    { title:'Visibilité et réseau', body:`<p>Une mise en lumière éditoriale de votre savoir-faire, une présence sur le site et les réseaux Bunkaio, et l'accès à l'<strong>annuaire du réseau</strong> pour trouver d'autres professionnels (traiteurs, lieux, créateurs…) et être mis en relation. Vous choisissez d'y être référencé·e ou non.</p>` },
    { title:'Un espace partenaire dédié', body:`<p>Vos promotions, votre réseau, vos collaborations, vos commandes et vos <strong>moodboards personnalisés</strong> (un par commande) au même endroit, avec un accès prioritaire à nos disponibilités.</p>` },
    { title:'Comment se passe la candidature ?', body:`<p>Vous candidatez ci-dessous, nous étudions votre profil individuellement et vous répondons sous 5 jours ouvrés. Une fois accepté·e, vous recevez vos accès et vous confirmez votre type de prestataire dans votre espace.</p>` },
  ] : [
    { title:`-${PARTNER_DISCOUNT}% permanent across the catalogue`, body:`<p>A partner rate applied automatically to all your quotes for as long as your partnership is active.</p>${li(['Every catalogue service, add-ons included','Studio Continu subscriptions included','Discount shown in your quote summary'])}${exLine ? `<p style="margin-top:12px"><strong>${exLine}</strong></p>` : ''}` },
    { title:'Extra promotions on selected services', body:`<p>Bunkaio can grant you targeted promotions on top of the permanent discount: launch offers, a free service, a special rate for a period. They appear in the <strong>"My promotions"</strong> tab of your partner space.</p>` },
    { title:'Paid collaborative missions', body:`<p>Depending on your provider type, Bunkaio calls on you for client projects. You accept or decline in one click from <strong>"My collaborations"</strong>, and you tell us when you are available.</p>` },
    { title:'Visibility and network', body:`<p>An editorial spotlight on your craft, a presence on Bunkaio's site and social channels, and access to the <strong>network directory</strong> to find other professionals (caterers, venues, designers…) and get introduced. You choose whether to be listed.</p>` },
    { title:'A dedicated partner space', body:`<p>Your promotions, network, collaborations, orders and <strong>personalised moodboards</strong> (one per order) in one place, with priority access to our schedule.</p>` },
    { title:'How does the application work?', body:`<p>Apply below, we review your profile individually and reply within 5 working days. Once accepted, you receive your access and confirm your provider type in your space.</p>` },
  ];
  renderAccordionInto('applyBenefitsAccordion', sections);
}

function sendApply(e){
  e.preventDefault();
  if (window.track) track('apply_submit');
  const n = document.getElementById('applyName').value.trim();
  const em = document.getElementById('applyEmail').value.trim();
  const ph = document.getElementById('applyPhone').value.trim();
  const web = document.getElementById('applyWeb').value.trim();
  const sector = document.getElementById('applySector').value;
  const provType = document.getElementById('applyType').value;
  const proj = document.getElementById('applyProject').value.trim();
  if (!sector || !provType) {
    const err = document.getElementById('applySectorError');
    if (err) err.style.display = 'block';
    document.getElementById('applyTypePicker').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const btn = document.querySelector('#applyForm .btn-solid');
  if (btn) btn.disabled = true;
  sendAck('partner', n, em, 'partner', { telephone: ph, site: web, secteur: sector, type: provType, projet: proj });
  fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      /* Secteur en tête de l'objet du mail, même convention que les
         demandes de collaboration : tri/filtrage des candidatures par
         secteur directement depuis la boîte mail. */
      _subject: 'CANDIDATURE PARTENAIRE [' + sector + ' · ' + provType + '] — ' + n,
      _replyto: em,
      secteur_activite: sector,
      type_prestataire: provType,
      nom_societe: n,
      email: em,
      telephone: ph || 'Non renseigné',
      site_reseaux: web,
      activite_realisations: proj
    })
  }).then(() => {
    document.getElementById('applyForm').style.display = 'none';
    document.getElementById('applySuccess').style.display = 'block';
  }).catch(() => {
    document.getElementById('applyForm').style.display = 'none';
    document.getElementById('applySuccess').style.display = 'block';
  });
}

/* ═══════════════ ESPACE CLIENT / PARTENAIRE ═══════════════ */
/* La base de comptes vit côté serveur (Cloudflare KV, voir server/src/
   accounts.ts) — le front ne lit plus jamais de fichier public, il
   n'appelle que /auth-login et /account-update sur le Worker, qui
   vérifient l'identité avant de renvoyer quoi que ce soit. USER_CODE
   garde le code d'accès en mémoire pour ré-authentifier /account-update ;
   il est aussi conservé dans localStorage (saveSession) pour que le client
   reste connecté d'une visite à l'autre — effacé à la déconnexion. */
const ACCOUNTS_API_BASE = 'https://bunkaio-quiz-stripe.bunkaio.workers.dev';
let loginType = 'client';
let USER = null;
let USER_CODE = null;

function openLogin(type){
  if (USER) { renderAccount(); goView('account'); return; }
  setLoginType(type);
  toggleLoginMode(false);
  document.getElementById('registerSuccess').style.display = 'none';
  goView('login');
}

function setLoginType(type){
  loginType = type;
  document.getElementById('ltab-client').classList.toggle('active', type === 'client');
  document.getElementById('ltab-partner').classList.toggle('active', type === 'partner');
  document.getElementById('loginTitle').textContent =
    I18N[LANG][type === 'client' ? 'login-title-client' : 'login-title-partner'];
  document.getElementById('loginError').style.display = 'none';
}

function toggleLoginMode(register){
  document.getElementById('loginForm').style.display = register ? 'none' : 'block';
  document.getElementById('registerForm').style.display = register ? 'block' : 'none';
  document.getElementById('registerSuccess').style.display = 'none';
  document.getElementById('loginError').style.display = 'none';
  document.getElementById('registerError').style.display = 'none';
}

function doLogin(){
  const email = document.getElementById('logEmail').value.trim().toLowerCase();
  const code  = document.getElementById('logCode').value.trim().toUpperCase();
  const err   = document.getElementById('loginError');
  err.style.display = 'none';
  if (!email || !code) { err.style.display = 'block'; return; }
  const btn = document.querySelector('#loginForm .btn-solid');
  if (btn) btn.disabled = true;
  fetch(ACCOUNTS_API_BASE + '/auth-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: loginType, email, code })
  })
    .then(r => r.json())
    .then(data => {
      if (btn) btn.disabled = false;
      if (!data.ok || !data.account) { err.style.display = 'block'; return; }
      USER = data.account;
      USER_CODE = code;
      saveSession();
      if (window.track) track('login', USER.type);
      updateNavLogin();
      renderAccount();
      goView('account');
    })
    .catch(() => { if (btn) btn.disabled = false; err.style.display = 'block'; });
}

function doRegister(){
  if (window.track) track('account_request', loginType);
  const n   = document.getElementById('regName').value.trim();
  const em  = document.getElementById('regEmail').value.trim();
  const ph  = document.getElementById('regPhone').value.trim();
  const act = document.getElementById('regActivity').value.trim();
  const err = document.getElementById('registerError');
  const btn = document.querySelector('#registerForm .btn-solid');
  err.style.display = 'none';
  if (!n || !em || !em.includes('@') || !act) { err.style.display = 'block'; return; }
  const typeLabel = loginType === 'client' ? 'CLIENT' : 'PARTENAIRE';
  if (btn) btn.disabled = true;
  sendAck('account', n, em, loginType === 'client' ? 'client' : 'partner', { espace: loginType === 'client' ? 'client' : 'partenaire', telephone: ph, activite: act });
  fetch(FORMSPREE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      _subject: 'CRÉATION DE COMPTE ' + typeLabel + ' — ' + n,
      _replyto: em,
      type: typeLabel,
      nom: n,
      email: em,
      telephone: ph || 'Non renseigné',
      activite: act,
      action_requise: 'Créer ce compte depuis le tableau de bord (bunkaio.com/admin/) puis envoyer le code d\'accès par email'
    })
  }).then(r => r.json()).then(data => {
    if (data.ok || data.next) {
      document.getElementById('registerForm').style.display = 'none';
      document.getElementById('registerSuccess').style.display = 'block';
    } else {
      if (btn) btn.disabled = false;
      err.textContent = 'Erreur lors de l\'envoi. Écrivez à contact@bunkaio.com';
      err.style.display = 'block';
    }
  }).catch(() => {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'block';
  });
}

function doLogout(){
  USER = null;
  USER_CODE = null;
  clearSession();
  document.getElementById('logEmail').value = '';
  document.getElementById('logCode').value = '';
  updateNavLogin();
  goView('home');
}

/* Session persistante : on ne garde que les identifiants (type, email, code
   d'accès — les mêmes que ceux saisis au login) ; le compte est rechargé
   depuis le Worker à chaque ouverture du site pour ne jamais afficher de
   données périmées. */
const SESSION_KEY = 'bunkaio_session';
function saveSession(){
  try { localStorage.setItem(SESSION_KEY, JSON.stringify({ type: USER.type, email: USER.email, code: USER_CODE })); } catch(e) {}
}
function clearSession(){
  try { localStorage.removeItem(SESSION_KEY); localStorage.removeItem('bunkaio_user'); } catch(e) {}
}
function restoreSession(){
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch(e) {}
  try { localStorage.removeItem('bunkaio_user'); } catch(e) {}
  if (!saved || !saved.type || !saved.email || !saved.code) return;
  fetch(ACCOUNTS_API_BASE + '/auth-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: saved.type, email: saved.email, code: saved.code })
  })
    .then(r => r.json())
    .then(data => {
      if (data && data.ok && data.account) {
        USER = data.account; USER_CODE = saved.code;
        updateNavLogin();
        if (location.pathname === '/espace-client/') { renderAccount(); goView('account', null, { initial: true }); }
        if (document.getElementById('view-account').classList.contains('active')) renderAccount();
      } else if (data && data.ok === false) clearSession();
    })
    .catch(() => {});
}

/* Mise en avant de l'espace client et du moodboard personnalisé par commande.
   Un seul gabarit injecté dans tous les emplacements .cs-slot (accueil,
   catalogue, confirmation de devis). */
/* ═══════════════ ANIMATIONS D'ÉCRITURE ═══════════════
   « Machine à écrire » compatible SEO : le texte complet reste dans la page (partie visible + partie transparente),
   la mise en page ne bouge pas, et seules les lettres apparaissent au fil de l'eau quand le bloc entre à l'écran. */
const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function bindTypewriters(){
  const els = document.querySelectorAll('[data-tw]:not([data-tw-bound])');
  if (!els.length) return;
  const run = (el) => {
    const full = el.dataset.twText;
    const v = el.querySelector('.tw-v'), r = el.querySelector('.tw-r');
    if (!v || !r) return;
    const delay = parseInt(el.dataset.twDelay || '0', 10);
    const per = full.length > 110 ? 9 : 22;           /* ms par caractère */
    setTimeout(() => {
      const t0 = performance.now();
      el.classList.add('tw-typing');
      const tick = (now) => {
        const n = Math.min(full.length, Math.floor((now - t0) / per));
        v.textContent = full.slice(0, n); r.textContent = full.slice(n);
        if (n < full.length) requestAnimationFrame(tick); else el.classList.remove('tw-typing');
      };
      requestAnimationFrame(tick);
    }, delay);
  };
  const io = window.IntersectionObserver ? new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); run(e.target); } }), { threshold: 0.35 }) : null;
  els.forEach(el => {
    el.dataset.twBound = '1';
    const full = el.textContent;
    el.dataset.twText = full;
    if (REDUCED_MOTION || !io) return;                 /* texte laissé tel quel */
    el.innerHTML = '<span class="tw-v"></span><span class="tw-r">' + full.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>';
    io.observe(el);
  });
}

/* Section « arguments numérotés » : animation permanente — l'argument mis en avant change toutes les 2,8 s tant que la section est visible. */
function initReassureLoop(){
  document.querySelectorAll('.reassure-section, .disc-steps').forEach(sec => {
    if (sec.dataset.loopBound) return; sec.dataset.loopBound = '1';
    const items = [...sec.querySelectorAll('.reassure-item, .disc-step')];
    if (!items.length || REDUCED_MOTION) return;
    let i = -1, timer = null;
    const step = () => { i = (i + 1) % items.length; items.forEach((it, k) => it.classList.toggle('is-lit', k === i)); };
    const start = () => { if (!timer) { step(); timer = setInterval(step, 2800); } };
    const stop = () => { clearInterval(timer); timer = null; items.forEach(it => it.classList.remove('is-lit')); };
    if (window.IntersectionObserver) new IntersectionObserver((es) => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.3 }).observe(sec);
    sec.querySelectorAll('.reassure-text').forEach((el, k) => { el.dataset.tw = ''; el.dataset.twDelay = String(500 + k * 320); });
  });
  bindTypewriters();
}

/* Accordéons (espace client, page Découvrir, articles) : un seul point ouvert à la fois, sauf listes « multi » (articles). */
document.addEventListener('click', (e) => {
  const head = e.target.closest ? e.target.closest('.cs-acc-head') : null;
  if (!head) return;
  const item = head.closest('.cs-acc-item'); if (!item) return;
  const list = item.parentElement;
  const willOpen = !item.classList.contains('open');
  if (!list.classList.contains('acc-multi')) list.querySelectorAll('.cs-acc-item').forEach(it => { it.classList.remove('open'); it.querySelector('.cs-acc-head').setAttribute('aria-expanded', 'false'); });
  item.classList.toggle('open', willOpen); head.setAttribute('aria-expanded', String(willOpen));
  if (list.classList.contains('disc-acc')) discoverBgSync();
});
document.addEventListener('click', (e) => {
  const b = e.target.closest ? e.target.closest('[data-acc-all]') : null;
  if (!b) return;
  const list = document.querySelector(b.dataset.accAll); if (!list) return;
  const open = b.dataset.state !== 'open';
  list.querySelectorAll('.cs-acc-item').forEach(it => { it.classList.toggle('open', open); it.querySelector('.cs-acc-head').setAttribute('aria-expanded', String(open)); });
  b.dataset.state = open ? 'open' : 'closed';
  b.textContent = open ? b.dataset.labelClose : b.dataset.labelOpen;
});

/* Conseils photo (accueil) : apparition en cascade des guides quand la section entre à l'écran. */
function initAdviceLive(){
  const sec = document.querySelector('.advice-teaser');
  if (!sec) return;
  if (!window.IntersectionObserver || REDUCED_MOTION) { sec.classList.add('adv-live'); return; }
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { sec.classList.add('adv-live'); io.disconnect(); } }), { threshold: 0.2 });
  io.observe(sec);
}

function renderClientSpotlights(){
  const slots = document.querySelectorAll('.cs-slot');
  if (!slots.length) return;
  const open = !!USER;
  const cta = open ? t({fr:'Ouvrir mon espace', en:'Open my space'}) : t({fr:'Accéder à mon espace client', en:'Access my client area'});
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 7.5"/></svg>';
  const points = [
    { head:t({fr:'Un moodboard par commande', en:'One moodboard per order'}),
      body:t({fr:'Direction artistique, ambiance, palette de couleurs, inspirations (Pinterest, liens) et prestataires impliqués. Vous le complétez depuis votre espace et échangez avec l\'équipe par commentaires.', en:'Art direction, mood, colour palette, inspiration (Pinterest, links) and the providers involved. You complete it from your space and chat with the team through comments.'}) },
    { head:t({fr:'Suivi de votre projet', en:'Track your project'}),
      body:t({fr:'Chaque commande affiche son avancement, du devis confirmé à la livraison de vos photos, étape par étape.', en:'Each order shows its progress, from the confirmed quote to the delivery of your photos, step by step.'}) },
    { head:t({fr:'Devis, factures, paiements et livrables', en:'Quotes, invoices, payments and deliverables'}),
      body:t({fr:'Retrouvez vos devis, vos factures et vos paiements, et téléchargez vos photos HD depuis votre galerie privée, à tout moment.', en:'Find your quotes, invoices and payments, and download your HD photos from your private gallery at any time.'}) },
  ];
  const act = `<button type="button" class="cs-btn" onclick="${open ? "renderAccount();goView('account')" : "openLogin('client')"}">${cta}</button>`;
  slots.forEach(el => {
    const compact = el.dataset.variant === 'compact';
    const noVisual = compact || el.dataset.visual === 'off';
    el.innerHTML = `
      <section class="cs-spotlight ${compact ? 'cs-compact' : ''} ${noVisual && !compact ? 'cs-novisual' : ''} rv in">
        <div class="cs-main">
          <div class="cs-kicker">${t({fr:'Votre espace client', en:'Your client area'})}</div>
          <h2 class="cs-title" data-tw data-tw-delay="150">${t({fr:'Une commande, un moodboard personnalisé', en:'One order, one personalised moodboard'})}</h2>
          <p class="cs-lead" data-tw data-tw-delay="900">${t({fr:'Dès votre devis confirmé, retrouvez tout au même endroit — et créez pour chaque commande un moodboard sur mesure pour nous partager votre vision.', en:'Once your quote is confirmed, find everything in one place — and create a tailor-made moodboard for each order to share your vision with us.'})}</p>
          ${compact ? '' : `<ul class="cs-points cs-acc">${points.map((x, k) => `<li class="cs-acc-item${k === 0 ? ' open' : ''}"><button type="button" class="cs-acc-head" aria-expanded="${k === 0}">${check}<span>${x.head}</span><i class="cs-acc-chev" aria-hidden="true"></i></button><div class="cs-acc-panel"><p>${x.body}</p></div></li>`).join('')}</ul>`}
          <div class="cs-actions">${act}${compact || open ? '' : `<button type="button" class="cta-primary" onclick="goView('quiz')">${t({fr:'Estimer mon projet', en:'Estimate my project'})}</button>`}</div>
        </div>
        ${noVisual ? '' : `
        <div class="cs-visual" aria-hidden="true">
          <div class="cs-board">
            <div class="cs-board-head"><span>${t({fr:'Moodboard', en:'Moodboard'})}</span><em>${t({fr:'Commande n°1', en:'Order #1'})}</em></div>
            <div class="cs-board-label">${t({fr:'Ambiance', en:'Mood'})}</div>
            <div class="cs-chips"><span class="on">${t({fr:'Intemporel', en:'Timeless'})}</span><span>${t({fr:'Lumineux', en:'Bright'})}</span><span class="on">${t({fr:'Épuré', en:'Minimal'})}</span><span>${t({fr:'Urbain', en:'Urban'})}</span></div>
            <div class="cs-board-label">${t({fr:'Palette', en:'Palette'})}</div>
            <div class="cs-palette"><i style="background:#e6def5"></i><i style="background:#b9a6dc"></i><i style="background:#3a3544"></i><i style="background:#0a0a0c"></i><i style="background:#f4f1f8"></i></div>
            <div class="cs-board-label">${t({fr:'Inspirations', en:'Inspiration'})}</div>
            <div class="cs-refs"><b></b><b></b><b></b></div>
          </div>
          <div class="cs-float cs-float-track">
            <div class="cs-float-title">${t({fr:'Suivi du projet', en:'Project tracking'})}</div>
            <div class="cs-steps"><span class="done">${t({fr:'Devis', en:'Quote'})}</span><span class="done">${t({fr:'Shooting', en:'Shoot'})}</span><span class="live">${t({fr:'Retouche', en:'Editing'})}</span><span>${t({fr:'Livraison', en:'Delivery'})}</span></div>
            <div class="cs-bar"><i></i></div>
          </div>
          <div class="cs-float cs-float-paid"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 7.5"/></svg><span>${t({fr:'Acompte réglé', en:'Deposit paid'})}</span></div>
          <div class="cs-float cs-float-gallery"><span>${t({fr:'Galerie prête', en:'Gallery ready'})}</span><em>${t({fr:'HD', en:'HD'})}</em></div>
        </div>`}
      </section>`;
  });
  /* Animations déclenchées quand la section entre à l'écran (et rejouées si la langue change). */
  if (window.IntersectionObserver) {
    const io = new IntersectionObserver((entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('cs-live'); io.unobserve(e.target); } }), { threshold: 0.18 });
    document.querySelectorAll('.cs-spotlight').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.cs-spotlight').forEach(el => el.classList.add('cs-live'));
  }
  bindTypewriters();
}

/* Indicateur de scroll noir : apparaît une seule fois, quand on passe de la vidéo au fond blanc (section « réassurance »),
   puis s'efface après quelques secondes ou dès que le visiteur a scrollé plus loin. */
function initWhiteScrollHint(){
  const hint = document.getElementById('scrollHint2');
  const mission = document.getElementById('homeClaimSection');
  const white = document.querySelector('.reassure-section');
  if (!hint || !mission || !white || !window.IntersectionObserver) return;
  /* Parcours : section « Le studio » (vidéo) → indicateur BLANC ; arrivée sur le fond blanc → il passe en NOIR,
     puis disparaît quand le texte commence à s'écrire. Se réinitialise quand on quitte la zone. */
  let state = 'idle', missionOn = false, whiteOn = false, timer = null;
  const reset = () => { clearTimeout(timer); state = 'idle'; hint.classList.remove('show'); hint.classList.remove('is-dark'); };
  const evaluate = () => {
    if (state === 'idle' && missionOn && !whiteOn) { state = 'white'; hint.classList.remove('is-dark'); hint.classList.add('show'); }
    else if (state === 'white' && whiteOn) {
      state = 'dark'; hint.classList.add('is-dark');
      timer = setTimeout(() => { hint.classList.remove('show'); state = 'done'; }, 900);
    }
    else if (state === 'white' && !missionOn && !whiteOn) reset();
    else if (state === 'done' && !missionOn && !whiteOn) reset();
  };
  new IntersectionObserver((es) => { es.forEach(e => { missionOn = e.isIntersecting && e.intersectionRatio >= 0.4; if (!e.isIntersecting) missionOn = false; }); evaluate(); }, { threshold: [0, 0.4] }).observe(mission);
  new IntersectionObserver((es) => { es.forEach(e => { whiteOn = e.isIntersecting && e.intersectionRatio >= 0.5; if (!e.isIntersecting) whiteOn = false; }); evaluate(); }, { threshold: [0, 0.5] }).observe(white);
}

function updateNavLogin(){
  const key = !USER ? 'nav-connect' : USER.type === 'partner' ? 'nav-account-partner' : 'nav-account-client';
  document.querySelectorAll('.nav-connect span').forEach(span => {
    span.setAttribute('data-lang', key);
    span.innerHTML = I18N[LANG][key];
  });
  renderClientSpotlights();
  syncNavHeight();
}

function setAccountTab(tab){
  if (tab !== 'infos' && enforceAccInfoGate()) return;
  ['orders','partenariat','promotions','reseau','collabs','subs','moodboards','payments','factures','portfolio','infos'].forEach(x => {
    document.getElementById('atab-' + x).classList.toggle('active', x === tab);
    document.getElementById('asec-' + x).classList.toggle('active', x === tab);
  });
}

function statusClass(statut){
  const s = (statut || '').toLowerCase();
  if (s.includes('livr') || s.includes('pay') || s.includes('termin') || s.includes('deliver') || s.includes('paid') || s.includes('complet')) return 'st-done';
  if (s.includes('cours') || s.includes('progress') || s.includes('production')) return 'st-progress';
  if (s.includes('annul') || s.includes('cancel') || s.includes('refus')) return 'st-cancel';
  return '';
}

/* Repère d'avancement affiché en haut de l'espace client, basé sur
   USER.etapeActuelle (1 à 4) dans comptes.json. Reflète le projet le
   plus récent du client — absent ou hors de cette plage, le repère
   reste masqué plutôt que d'afficher un état incorrect. */
const ACCOUNT_STEPS = ['acc-step-devis', 'acc-step-shoot', 'acc-step-post', 'acc-step-livre'];
function renderAccountStepper(){
  const el = document.getElementById('accStepper');
  const n = USER && USER.etapeActuelle;
  if (!el || !n || n < 1 || n > ACCOUNT_STEPS.length) { if (el) el.style.display = 'none'; return; }
  el.style.display = 'flex';
  el.innerHTML = ACCOUNT_STEPS.map((key, i) => {
    const step = i + 1;
    const state = step < n ? 'done' : step === n ? 'current' : '';
    return `<div class="ss-step ${state}"><div class="ss-dot">${step < n ? '✓' : step}</div><div class="ss-label">${I18N[LANG][key]}</div></div>`;
  }).join('');
}

/* ═══════════════ ESPACE CLIENT — MES ABONNEMENTS ═══════════════
   Studio Continu (voir SUBS plus haut) : seule la catégorie mode,
   pour les profils modèle et mannequin, propose l'option abonnement
   dans le questionnaire de devis. USER.abonnement (depuis la base de comptes)
   référence juste l'une de ces clés + statut/usage — le contenu du
   plan (nom, prix, inclus) est toujours lu depuis SUBS, jamais dupliqué
   dans le compte, pour rester automatiquement à jour si l'offre change. */
function renderAccSubs(){
  const el = document.getElementById('accSubsContent');
  if (!el || !USER) return;
  const sub = USER.abonnement;
  const plan = sub && SUBS[sub.categorie];

  if (!sub || !plan) {
    el.innerHTML = `
      <div class="acc-info-card acc-subs-empty">
        <div class="acc-subs-empty-title">${I18N[LANG]['acc-subs-empty-title']}</div>
        <p class="acc-subs-empty-text">${I18N[LANG]['acc-subs-empty-text']}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn btn-solid cta-primary" onclick="goView('quiz')"><span>${I18N[LANG]['acc-subs-discover-btn']}</span></button>
        </div>
      </div>`;
    return;
  }

  const items = (plan.items[LANG] || []).map(i => `<li>${i}</li>`).join('');
  const usage = Object.values(sub.utilisation || {}).map(u => {
    const pct = u.inclus > 0 ? Math.min(100, Math.round((u.utilises / u.inclus) * 100)) : 0;
    return `
      <div class="acc-sub-usage-row">
        <div class="acc-sub-usage-label"><span>${u.label || ''}</span><span>${u.utilises} / ${u.inclus}</span></div>
        <div class="acc-sub-usage-track"><div class="acc-sub-usage-fill" style="width:${pct}%"></div></div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="acc-info-card">
      <div class="acc-sub-head">
        <div>
          <div class="acc-sub-name">${t(plan.name)}</div>
          <div class="acc-sub-meta">
            ${sub.dateDebut ? `${I18N[LANG]['acc-subs-since']} ${sub.dateDebut}<br>` : ''}
            ${sub.prochaineFacture ? `${I18N[LANG]['acc-subs-next']} ${sub.prochaineFacture}` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <span class="status-pill ${statusClass(sub.statut)}" style="margin-bottom:10px;display:inline-block">${sub.statut || '—'}</span>
          <div class="acc-sub-price">${pp(plan.price)}€<small>${I18N[LANG]['acc-subs-month']}</small></div>
        </div>
      </div>
      <div class="acc-sub-section-title">${I18N[LANG]['acc-subs-included']}</div>
      <ul class="acc-sub-items">${items}</ul>
      ${usage ? `<div class="acc-sub-section-title">${I18N[LANG]['acc-subs-usage']}</div>${usage}` : ''}
      <div class="acc-sub-manage">
        <div>
          <div class="acc-sub-manage-title">${I18N[LANG]['acc-subs-manage-title']}</div>
          <div class="acc-sub-manage-text">${I18N[LANG]['acc-subs-manage-text']}</div>
        </div>
        <a class="btn btn-ghost" href="mailto:contact@bunkaio.com"><span>${I18N[LANG]['acc-subs-manage-btn']}</span></a>
      </div>
    </div>`;
}

/* CTA "nouvelle commande", toujours visible en bas de l'espace client —
   message adapté selon que le client a déjà un abonnement actif ou non
   (incite à un projet ponctuel complémentaire, au tarif partenaire, s'il
   est déjà abonné ; incite à découvrir Studio Continu ou à démarrer un
   premier projet sinon). */
function renderAccUpsell(){
  const el = document.getElementById('accUpsellCard');
  if (!el || !USER) return;
  const hasSub = USER.abonnement && SUBS[USER.abonnement.categorie];
  const titleKey = hasSub ? 'acc-subs-upsell-title' : 'acc-upsell-title';
  const textKey  = hasSub ? 'acc-subs-upsell-text'  : 'acc-upsell-text';
  const btnKey   = hasSub ? 'acc-subs-upsell-btn'    : 'acc-upsell-btn';
  el.innerHTML = `
    <div class="acc-help-text">
      <div class="acc-help-title">${I18N[LANG][titleKey]}</div>
      <div class="acc-help-sub">${I18N[LANG][textKey]}</div>
    </div>
    <button class="btn btn-solid cta-primary" onclick="goView('quiz')"><span>${I18N[LANG][btnKey]}</span></button>`;
}

/* ═══════════════ ESPACE PARTENAIRE — MON PARTENARIAT ═══════════════
   Onglet visible uniquement pour USER.type === 'partner' (voir le
   toggle dans renderAccount()). Mêmes identifiants de secteur que le
   formulaire de candidature (Partenaires → Candidater). Les 4 avantages
   et la mention des places disponibles reprennent tels quels le
   contenu statique de l'accordéon "Programme Partenaires" — un seul
   texte de référence pour ces informations, pas de duplication. */
const PARTNER_SECTORS = [
  { id:'portrait', name:{fr:'Portrait & lifestyle', en:'Portrait & lifestyle'} },
  { id:'mode', name:{fr:'Mode & mannequins', en:'Fashion & models'} },
  { id:'commercial', name:{fr:'Commercial & produits', en:'Commercial & products'} },
  { id:'evenementiel', name:{fr:'Événementiel', en:'Events'} },
  { id:'mariage', name:{fr:'Mariage & Lumen', en:'Weddings & Lumen'} },
];

/* Les 5 univers partenaires reprennent les prestations actuellement
   proposées au catalogue (Séance photo particuliers, Mode/agence/
   mannequins, Commercial & produits, Événementiel, Lumen). Types de
   prestataire regroupés par univers. Liste alignée côté Worker
   (PROVIDER_TYPE_IDS dans server/src/index.ts) : tout ajout ici doit y
   être reporté, sinon la sauvegarde sera refusée. */
const PARTNER_PROVIDER_TYPES = [
  { id:'coiffeur',        sector:'portrait',     name:{fr:'Coiffeur·se / barbier', en:'Hairstylist / barber'} },
  { id:'maquilleur',      sector:'portrait',     name:{fr:'Maquilleur·se', en:'Make-up artist'} },
  { id:'coach-image',     sector:'portrait',     name:{fr:'Coach en image / styliste personnel', en:'Image coach / personal stylist'} },
  { id:'bien-etre',       sector:'portrait',     name:{fr:'Institut de beauté / bien-être', en:'Beauty / wellness studio'} },
  { id:'studio-lieu',     sector:'portrait',     name:{fr:'Studio / lieu de shooting', en:'Studio / shoot location'} },
  { id:'createur-mode',   sector:'mode',         name:{fr:'Créateur de mode', en:'Fashion designer'} },
  { id:'agence-mannequin',sector:'mode',         name:{fr:'Agence de mannequins', en:'Model agency'} },
  { id:'styliste',        sector:'mode',         name:{fr:'Styliste / directeur artistique', en:'Stylist / art director'} },
  { id:'maquilleur-mode', sector:'mode',         name:{fr:'Maquilleur·se / coiffeur·se mode', en:'Fashion make-up / hair artist'} },
  { id:'bijoutier',       sector:'mode',         name:{fr:'Bijoutier / créateur d\'accessoires', en:'Jeweller / accessories maker'} },
  { id:'marque-produit',  sector:'commercial',   name:{fr:'Marque / e-commerçant', en:'Brand / online retailer'} },
  { id:'cosmetique',      sector:'commercial',   name:{fr:'Marque cosmétique', en:'Cosmetics brand'} },
  { id:'artisan-art',     sector:'commercial',   name:{fr:'Artisan / créateur de produits', en:'Artisan / product maker'} },
  { id:'restaurateur',    sector:'commercial',   name:{fr:'Restaurateur / chef', en:'Restaurateur / chef'} },
  { id:'agence-com',      sector:'commercial',   name:{fr:'Agence de communication / marketing', en:'Communication / marketing agency'} },
  { id:'event-planner',   sector:'evenementiel', name:{fr:'Organisateur d\'événements', en:'Event planner'} },
  { id:'lieu',            sector:'evenementiel', name:{fr:'Lieu de réception', en:'Event venue'} },
  { id:'traiteur',        sector:'evenementiel', name:{fr:'Traiteur', en:'Caterer'} },
  { id:'decorateur',      sector:'evenementiel', name:{fr:'Décorateur / fleuriste', en:'Decorator / florist'} },
  { id:'animation',       sector:'evenementiel', name:{fr:'DJ / animation / son & lumière', en:'DJ / entertainment / sound & lighting'} },
  { id:'wedding-planner', sector:'mariage',      name:{fr:'Wedding planner', en:'Wedding planner'} },
  { id:'lieu-mariage',    sector:'mariage',      name:{fr:'Domaine / lieu de mariage', en:'Wedding venue'} },
  { id:'fleuriste-mariage', sector:'mariage',    name:{fr:'Fleuriste de mariage', en:'Wedding florist'} },
  { id:'robe-mariee',     sector:'mariage',      name:{fr:'Créateur de robes / costumier', en:'Gown designer / tailor'} },
  { id:'traiteur-mariage',sector:'mariage',      name:{fr:'Traiteur / pâtissier mariage', en:'Wedding caterer / pastry chef'} },
];
const PARTNER_DISCOUNT = 20;

let partnerEditType = false;
let partnerDraftType = null;

function partnerProviderType(id){ return PARTNER_PROVIDER_TYPES.find(p => p.id === id); }

/* Écrit uniquement les champs partenaire modifiables par le partenaire
   (typePrestataire, disponibleCollab, presentation, reseau, réponses aux
   missions) — même ré-authentification par USER_CODE que saveMoodboards().
   Le Worker ignore tout autre champ de `partenariat` (statut, secteur…). */
function savePartnerData(extra, onSuccess, onError){
  fetch(ACCOUNTS_API_BASE + '/account-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: USER.type, email: USER.email, code: USER_CODE, ...extra })
  }).then(r => r.json()).then(data => {
    if (!data.ok || !data.account) { if (onError) onError(); return; }
    USER = data.account;
    if (onSuccess) onSuccess();
  }).catch(() => { if (onError) onError(); });
}

function renderAccPartner(){
  const el = document.getElementById('accPartnerContent');
  if (!el || !USER) return;
  const info = USER.partenariat || {};
  const ptype = partnerProviderType(info.typePrestataire);
  const sector = PARTNER_SECTORS.find(s => s.id === (ptype ? ptype.sector : info.secteur));
  const statut = info.statut || I18N[LANG]['partner-statut-attente'];
  const choosing = !ptype || partnerEditType;

  const typeBlock = choosing ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${t({fr:'Votre type de prestataire', en:'Your provider type'})}</div>
        <p class="acc-info-note">${t({fr:'Sélectionnez la catégorie qui décrit le mieux votre activité. Elle détermine votre statut au sein du réseau Bunkaio et les missions collaboratives qui peuvent vous être proposées.', en:'Pick the category that best describes your business. It sets your status within the Bunkaio network and the collaborative missions you may be offered.'})}</p>
        ${PARTNER_SECTORS.map(sec => `
          <div class="pt-group">
            <div class="pt-group-name">${t(sec.name)}</div>
            <div class="mb-chip-grid pt-chips">
              ${PARTNER_PROVIDER_TYPES.filter(p => p.sector === sec.id).map(p =>
                `<button type="button" class="mb-chip ${partnerDraftType === p.id ? 'active' : ''}" onclick="selectPartnerType('${p.id}')">${t(p.name)}</button>`).join('')}
            </div>
          </div>`).join('')}
        <div class="mb-wizard-actions pt-actions">
          <button type="button" class="btn btn-solid" id="ptSaveBtn" onclick="savePartnerType()" ${partnerDraftType ? '' : 'disabled'}><span>${t({fr:'Valider mon statut', en:'Confirm my status'})}</span></button>
          ${ptype ? `<button type="button" class="btn btn-ghost" onclick="cancelPartnerTypeEdit()"><span>${t({fr:'Annuler', en:'Cancel'})}</span></button>` : ''}
        </div>
      </div>` : `
      <div class="pt-status">
        <div class="pt-status-badge">
          <div class="pt-status-label">${t({fr:'Votre statut', en:'Your status'})}</div>
          <div class="pt-status-value">${t({fr:'Partenaire prestataire', en:'Partner provider'})} · ${t(ptype.name)}</div>
        </div>
        <button type="button" class="pt-link" onclick="editPartnerType()">${t({fr:'Modifier', en:'Change'})}</button>
      </div>`;

  const dispo = !!info.disponibleCollab;
  const advantages = ptype ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${t({fr:'Vos avantages de partenaire prestataire', en:'Your provider-partner benefits'})}</div>
        <div class="pt-adv-grid">
          <div class="pt-adv">
            <div class="pt-adv-big">-${PARTNER_DISCOUNT}%</div>
            <div class="pt-adv-title">${t({fr:'Sur chaque prestation du catalogue', en:'On every catalogue service'})}</div>
            <div class="pt-adv-text">${t({fr:'Tarif partenaire permanent sur toutes les prestations Bunkaio, options comprises. Détail dans « Mes promotions ».', en:'A permanent partner rate on every Bunkaio service, add-ons included. Details in "My promotions".'})}</div>
          </div>
          <div class="pt-adv">
            <div class="pt-adv-big pt-adv-icon">€</div>
            <div class="pt-adv-title">${t({fr:'Missions collaboratives rémunérées', en:'Paid collaborative missions'})}</div>
            <div class="pt-adv-text">${t({fr:'Bunkaio peut vous solliciter pour intervenir sur des projets clients, selon votre type de prestataire. Retrouvez-les dans « Mes collaborations ».', en:'Bunkaio may call on you for client projects, based on your provider type. Find them in "My collaborations".'})}</div>
          </div>
        </div>
      </div>

      <div class="mb-detail-block">
        <div class="mb-detail-label">${t({fr:'Disponibilité pour les collaborations', en:'Availability for collaborations'})}</div>
        <div class="mb-chip-grid pt-chips">
          <button type="button" class="mb-chip ${dispo ? 'active' : ''}" onclick="setCollabAvailability(true)">${t({fr:'Disponible', en:'Available'})}</button>
          <button type="button" class="mb-chip ${!dispo ? 'active' : ''}" onclick="setCollabAvailability(false)">${t({fr:'Indisponible pour le moment', en:'Not available right now'})}</button>
        </div>
      </div>

      <div class="mb-detail-block">
        <div class="mb-detail-label">${t({fr:'Annuaire BUNKAIO', en:'BUNKAIO directory'})}</div>
        <label class="pt-check">
          <input type="checkbox" id="ptDirectoryCheckbox" ${info.visibleInDirectory === true ? 'checked' : ''} onchange="setDirectoryVisibility(this.checked)">
          <span>${t({fr:'Je souhaite être référencé·e dans l\'annuaire BUNKAIO', en:'I would like to be listed in the BUNKAIO directory'})}</span>
        </label>
        <p class="acc-info-note" style="margin-top:10px">${t({fr:'Les autres partenaires pourront ainsi vous trouver et vous contacter. Vous pouvez décocher à tout moment.', en:'Other partners will be able to find and contact you. You can untick at any time.'})}</p>
      </div>

      <div class="mb-detail-block">
        <div class="mb-detail-label">${t({fr:'Votre présentation', en:'Your introduction'})}</div>
        <div class="fgroup" style="margin-bottom:14px">
          <textarea id="ptPresentation" maxlength="600" placeholder="${t({fr:'Votre savoir-faire, vos références, ce qui vous distingue — l\'équipe Bunkaio s\'en sert pour vous proposer les bonnes missions.', en:'Your craft, references and what sets you apart — the Bunkaio team uses this to offer you the right missions.'})}">${escHtml(info.presentation || '')}</textarea>
        </div>
        <button type="button" class="btn btn-ghost" id="ptPresBtn" onclick="savePartnerPresentation()"><span>${t({fr:'Enregistrer', en:'Save'})}</span></button>
      </div>` : '';

  el.innerHTML = `
    <div class="acc-info-card">
      <div class="mb-detail-head">
        <div>
          <div class="mb-detail-title">${sector ? t(sector.name) : I18N[LANG]['partner-no-sector']}</div>
          <div class="mb-detail-ref">${info.dateAdhesion ? I18N[LANG]['partner-since'] + ' ' + escHtml(info.dateAdhesion) : I18N[LANG]['partner-pending-sub']}</div>
        </div>
        <span class="status-pill ${statusClass(statut)}">${escHtml(statut)}</span>
      </div>

      ${typeBlock}
      ${advantages}

      ${info.articleUrl ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['partner-article-label']}</div>
        <a class="mb-ref-card" href="${escHtml(info.articleUrl)}" target="_blank" rel="noopener">
          <div class="mb-ref-card-dot"></div>
          <div class="mb-ref-card-url">${I18N[LANG]['partner-article-link']}</div>
        </a>
      </div>` : ''}

      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['partner-benefits-label']}</div>
        <div class="pt-prog-grid">
          <div class="cred-card"><div class="cred-num">01</div><div class="cred-title">${I18N[LANG]['p-b1-title']}</div><div class="cred-text">${I18N[LANG]['p-b1-text']}</div></div>
          <div class="cred-card"><div class="cred-num">02</div><div class="cred-title">${I18N[LANG]['p-b2-title']}</div><div class="cred-text">${I18N[LANG]['p-b2-text']}</div></div>
          <div class="cred-card"><div class="cred-num">03</div><div class="cred-title">${I18N[LANG]['p-b3-title']}</div><div class="cred-text">${I18N[LANG]['p-b3-text']}</div></div>
          <div class="cred-card"><div class="cred-num">04</div><div class="cred-title">${I18N[LANG]['p-b4-title']}</div><div class="cred-text">${I18N[LANG]['p-b4-text']}</div></div>
        </div>
      </div>

      <div class="mb-detail-block" style="margin-bottom:0">
        <div class="mb-detail-label">${I18N[LANG]['partner-places-label']}</div>
        <div class="mb-detail-vision">${I18N[LANG]['p-places-text']}</div>
      </div>
    </div>`;
}

function selectPartnerType(id){
  partnerDraftType = id;
  renderAccPartner();
}
function editPartnerType(){
  partnerEditType = true;
  partnerDraftType = (USER.partenariat || {}).typePrestataire || null;
  renderAccPartner();
}
function cancelPartnerTypeEdit(){
  partnerEditType = false; partnerDraftType = null;
  renderAccPartner();
}
function savePartnerType(){
  if (!partnerDraftType) return;
  const btn = document.getElementById('ptSaveBtn');
  if (btn) btn.disabled = true;
  savePartnerData({ partenariat: { typePrestataire: partnerDraftType } }, () => {
    partnerEditType = false; partnerDraftType = null;
    renderAccount(); setAccountTab('partenariat');
  }, () => { if (btn) btn.disabled = false; });
}
function setCollabAvailability(value){
  savePartnerData({ partenariat: { disponibleCollab: value } }, () => { renderAccPartner(); });
}
function setDirectoryVisibility(visible){
  savePartnerData({ partenariat: { visibleInDirectory: visible } }, () => { renderAccPartner(); }, () => { renderAccPartner(); });
}
function savePartnerPresentation(){
  const btn = document.getElementById('ptPresBtn');
  const value = document.getElementById('ptPresentation').value.trim();
  if (btn) btn.disabled = true;
  savePartnerData({ partenariat: { presentation: value } }, () => { renderAccPartner(); }, () => { if (btn) btn.disabled = false; });
}

/* ═══════════════ ESPACE PARTENAIRE — MES PROMOTIONS ═══════════════
   Le -20% est permanent et lu depuis PARTNER_DISCOUNT ; les prix du
   tableau sont calculés depuis CATS (jamais dupliqués). Les promotions
   additionnelles viennent de USER.promotions, renseignées par l'admin. */
function partnerPrice(price){ return Math.round(price * (100 - PARTNER_DISCOUNT) / 100); }
/* Remise partenaire appliquée au questionnaire de devis : -20% sur les
   prestations, abonnements et options pour un partenaire connecté
   (abonnements inclus, sauf la formule Lumen "Sur-mesure", sur devis). */
function isPartnerUser(){ return !!(USER && USER.type === 'partner'); }
function pp(price){ return isPartnerUser() && typeof price === 'number' ? partnerPrice(price) : price; }
function partnerQuizNotice(){
  if (!isPartnerUser() || (S.cat === 'lumen' && S.tier === 'surm')) return '';
  return `<div class="pt-quiz-notice">${t({fr:'Tarif partenaire -' + PARTNER_DISCOUNT + '% appliqué à cette sélection.', en:'Partner rate -' + PARTNER_DISCOUNT + '% applied to this selection.'})}</div>`;
}
function eur(n){ return n.toLocaleString(LANG === 'fr' ? 'fr-FR' : 'en-GB') + ' €'; }

function renderAccPromos(){
  const el = document.getElementById('accPromosContent');
  if (!el || !USER) return;
  const promos = USER.promotions || [];
  const rows = CATS.filter(c => c.tiers && TIERS.some(tr => c.tiers[tr.id] && typeof c.tiers[tr.id].price === 'number')).map(c => {
    const cells = TIERS.map(tr => {
      const p = c.tiers[tr.id] && c.tiers[tr.id].price;
      return typeof p === 'number'
        ? `<td><span class="pt-price-old">${eur(p)}</span> <strong>${eur(partnerPrice(p))}</strong></td>` : '<td>—</td>';
    }).join('');
    return `<tr><td>${t(c.name)}</td>${cells}</tr>`;
  }).join('');

  el.innerHTML = `
    <div class="acc-info-card pt-hero-promo">
      <div class="pt-hero-big">-${PARTNER_DISCOUNT}%</div>
      <div>
        <div class="pt-hero-title">${t({fr:'Tarif partenaire permanent', en:'Permanent partner rate'})}</div>
        <p class="acc-info-note" style="margin:0">${t({fr:'Sur chaque prestation du catalogue Bunkaio, options comprises, tant que votre partenariat est actif.', en:'On every Bunkaio catalogue service, add-ons included, for as long as your partnership is active.'})}</p>
      </div>
    </div>

    <div class="pt-section-label">${t({fr:'Promotions en cours', en:'Current promotions'})}</div>
    ${promos.length ? `<div class="pt-promo-list">${promos.map(p => `
      <div class="pt-promo">
        <div class="pt-promo-top">
          <div class="pt-promo-title">${escHtml(p.titre)}</div>
          ${p.remise ? `<span class="mb-tag">${escHtml(p.remise)}</span>` : ''}
        </div>
        ${p.description ? `<p class="pt-promo-text">${escHtml(p.description)}</p>` : ''}
        <div class="pt-promo-foot">
          ${p.code ? `<span class="pt-code">${escHtml(p.code)}</span>` : ''}
          ${p.validiteJusquAu ? `<span class="pt-promo-meta">${t({fr:'Valable jusqu\'au', en:'Valid until'})} ${escHtml(p.validiteJusquAu)}</span>` : ''}
          ${p.statut ? `<span class="status-pill ${statusClass(p.statut)}">${escHtml(p.statut)}</span>` : ''}
        </div>
      </div>`).join('')}</div>`
    : `<div class="acc-info-card"><div class="empty-note">${t({fr:'Aucune promotion additionnelle pour le moment. Vos offres exclusives apparaîtront ici.', en:'No additional promotions right now. Your exclusive offers will appear here.'})}</div></div>`}

    <div class="pt-section-label">${t({fr:'Vos prix partenaire', en:'Your partner prices'})}</div>
    <div class="table-wrap"><table class="data-table pt-price-table">
      <thead><tr><th>${t({fr:'Prestation', en:'Service'})}</th>${TIERS.map(tr => `<th>${t(tr.name)}</th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <p class="pt-foot-note">${t({fr:'Prix nets, TVA non applicable. Les options ajoutées à une prestation bénéficient également du tarif partenaire.', en:'Net prices, VAT not applicable. Add-ons on any service also get the partner rate.'})}</p>`;
}

/* ═══════════════ ESPACE PARTENAIRE — MON RÉSEAU ═══════════════
   Contacts du partenaire (ajoutés par lui, modifiables) + mises en
   relation faites par l'équipe Bunkaio (origine 'bunkaio', lecture
   seule — le Worker les conserve toujours à la sauvegarde). */
let reseauAdding = false;

function renderAccReseau(){
  const el = document.getElementById('accReseauContent');
  if (!el || !USER) return;
  const all = USER.reseau || [];
  const introduced = all.filter(c => c.origine === 'bunkaio');
  const own = all.filter(c => c.origine !== 'bunkaio');
  const ownNames = new Set(all.map(c => c.nom.toLowerCase()));

  const card = (c, removable) => `
    <div class="pt-contact">
      <div class="pt-contact-main">
        <div class="pt-contact-name">${escHtml(c.nom)}</div>
        <div class="pt-contact-role">${[c.domaine, c.role].filter(Boolean).map(escHtml).join(' · ') || '&nbsp;'}</div>
        ${c.contact ? `<div class="pt-contact-line">${escHtml(c.contact)}</div>` : ''}
        ${c.lien ? `<a class="pt-contact-line" href="${escHtml(c.lien)}" target="_blank" rel="noopener">${escHtml(c.lien)}</a>` : ''}
        ${c.note ? `<div class="pt-contact-note">${escHtml(c.note)}</div>` : ''}
      </div>
      ${removable ? `<button type="button" class="pt-link" onclick="removeNetworkContact('${escHtml(c.id)}')">${t({fr:'Retirer', en:'Remove'})}</button>` : ''}
    </div>`;

  el.innerHTML = `
    ${introduced.length ? `
      <div class="pt-section-label">${t({fr:'Mises en relation par Bunkaio', en:'Introduced by Bunkaio'})}</div>
      <div class="pt-contact-grid">${introduced.map(c => card(c, false)).join('')}</div>` : ''}

    <div class="pt-section-head">
      <div class="pt-section-label" style="margin:0">${t({fr:'Mes contacts', en:'My contacts'})}</div>
      ${reseauAdding ? '' : `<button type="button" class="btn btn-ghost" onclick="toggleNetworkForm(true)"><span>${t({fr:'+ Ajouter un contact', en:'+ Add a contact'})}</span></button>`}
    </div>

    ${reseauAdding ? `
    <div class="acc-info-card" style="margin-bottom:22px">
      <div class="pt-form-grid">
        <div class="fgroup"><label>${t({fr:'Nom / société *', en:'Name / company *'})}</label><input type="text" id="nwNom" maxlength="120"></div>
        <div class="fgroup"><label>${t({fr:'Domaine', en:'Field'})}</label>
          <select id="nwDomaine"><option value=""></option>${PARTNER_PROVIDER_TYPES.map(p => `<option value="${escHtml(t(p.name))}">${escHtml(t(p.name))}</option>`).join('')}</select></div>
        <div class="fgroup"><label>${t({fr:'Rôle / spécialité', en:'Role / speciality'})}</label><input type="text" id="nwRole" maxlength="300"></div>
        <div class="fgroup"><label>${t({fr:'Email ou téléphone', en:'Email or phone'})}</label><input type="text" id="nwContact" maxlength="300"></div>
        <div class="fgroup"><label>${t({fr:'Site ou Instagram', en:'Website or Instagram'})}</label><input type="text" id="nwLien" maxlength="300"></div>
        <div class="fgroup"><label>${t({fr:'Note', en:'Note'})}</label><input type="text" id="nwNote" maxlength="300"></div>
      </div>
      <div class="mb-wizard-actions" style="margin-left:0">
        <button type="button" class="btn btn-solid" id="nwSaveBtn" onclick="addNetworkContact()"><span>${t({fr:'Ajouter à mon réseau', en:'Add to my network'})}</span></button>
        <button type="button" class="btn btn-ghost" onclick="toggleNetworkForm(false)"><span>${t({fr:'Annuler', en:'Cancel'})}</span></button>
      </div>
    </div>` : ''}

    ${own.length ? `<div class="pt-contact-grid">${own.map(c => card(c, true)).join('')}</div>`
      : (reseauAdding ? '' : `<div class="acc-info-card"><div class="empty-note">${t({fr:'Votre réseau est vide. Ajoutez les professionnels avec qui vous travaillez — traiteurs, lieux, décorateurs, stylistes — pour les retrouver dans vos futures collaborations.', en:'Your network is empty. Add the professionals you work with — caterers, venues, decorators, stylists — to find them in future collaborations.'})}</div></div>`)}
    ${renderNetworkDirectory(ownNames)}`;
}

/* Annuaire du réseau Bunkaio — DONNÉES FICTIVES (démo), à remplacer par
   les vrais partenaires consentants (une route Worker dédiée) avant
   publication. Les ids de type reprennent PARTNER_PROVIDER_TYPES. */
const NETWORK_DIRECTORY_DEMO = [
  { nom:'Atelier Mérel',        type:'maquilleur',      ville:'Lyon',        desc:{fr:'Maquillage et beauté pour portraits et shootings.', en:'Make-up and beauty for portraits and shoots.'} },
  { nom:'Studio Valmont',       type:'studio-lieu',     ville:'Bordeaux',    desc:{fr:'Studio lumière naturelle, cycloramas et décors.', en:'Natural-light studio, cycloramas and sets.'} },
  { nom:'Maison Élise Varenne', type:'createur-mode',   ville:'Paris',       desc:{fr:'Prêt-à-porter féminin éthique.', en:'Ethical womenswear.'} },
  { nom:'Agence Solstice',      type:'agence-mannequin',ville:'Marseille',   desc:{fr:'Mannequins et talents pour campagnes et lookbooks.', en:'Models and talent for campaigns and lookbooks.'} },
  { nom:'Atelier Nour',         type:'bijoutier',       ville:'Montpellier', desc:{fr:'Bijoux artisanaux en séries limitées.', en:'Handmade jewellery in limited runs.'} },
  { nom:'Lumière Cosmétiques',  type:'cosmetique',      ville:'Grasse',      desc:{fr:'Soins naturels, parfumerie de niche.', en:'Natural skincare, niche perfumery.'} },
  { nom:'Terre & Feu',          type:'artisan-art',     ville:'Aix-en-Provence', desc:{fr:'Céramique d\'art et arts de la table.', en:'Art ceramics and tableware.'} },
  { nom:'Maison Gaspard',       type:'restaurateur',    ville:'Lyon',        desc:{fr:'Table gastronomique de saison.', en:'Seasonal fine dining.'} },
  { nom:'Maison Orsini Events', type:'event-planner',   ville:'Nice',        desc:{fr:'Événements d\'entreprise et soirées privées.', en:'Corporate events and private parties.'} },
  { nom:'Domaine des Oliviers', type:'lieu',            ville:'Luberon',     desc:{fr:'Lieu de réception pour séminaires et soirées.', en:'Venue for seminars and parties.'} },
  { nom:'Fleurs d\'Ysée',       type:'decorateur',      ville:'Paris',       desc:{fr:'Décors floraux événementiels.', en:'Event floral design.'} },
  { nom:'Camille & Co',         type:'wedding-planner', ville:'Béziers',     desc:{fr:'Organisation de mariages clé en main.', en:'Turnkey wedding planning.'} },
  { nom:'Château de Lauzun',    type:'lieu-mariage',    ville:'Narbonne',    desc:{fr:'Domaine de mariage, 150 couverts.', en:'Wedding estate, 150 guests.'} },
  { nom:'Atelier Céleste',      type:'robe-mariee',     ville:'Montpellier', desc:{fr:'Robes de mariée sur mesure.', en:'Bespoke wedding gowns.'} },
];
let networkDirSector = 'all';

function renderNetworkDirectory(ownNames){
  const sectors = PARTNER_SECTORS.map(sec => `<button type="button" class="mb-chip ${networkDirSector === sec.id ? 'active' : ''}" onclick="setNetworkDirSector('${sec.id}')">${t(sec.name)}</button>`).join('');
  const rows = NETWORK_DIRECTORY_DEMO.filter(m => {
    const pt = partnerProviderType(m.type);
    return networkDirSector === 'all' || (pt && pt.sector === networkDirSector);
  }).map(m => {
    const pt = partnerProviderType(m.type);
    const added = ownNames.has(m.nom.toLowerCase());
    return `
    <div class="pt-contact">
      <div class="pt-contact-main">
        <div class="pt-contact-name">${escHtml(m.nom)}</div>
        <div class="pt-contact-role">${pt ? escHtml(t(pt.name)) : ''} · ${escHtml(m.ville)}</div>
        <div class="pt-contact-line">${escHtml(t(m.desc))}</div>
      </div>
      <button type="button" class="pt-link" ${added ? 'disabled' : ''} onclick="addDirectoryContact('${escHtml(m.nom.replace(/'/g, "\\'"))}')">${added ? t({fr:'Ajouté', en:'Added'}) : t({fr:'Ajouter', en:'Add'})}</button>
    </div>`;
  }).join('');
  return `
    <div class="pt-section-label">${t({fr:'Annuaire du réseau Bunkaio', en:'Bunkaio network directory'})}</div>
    <div class="mb-chip-grid pt-chips pt-dir-filter">
      <button type="button" class="mb-chip ${networkDirSector === 'all' ? 'active' : ''}" onclick="setNetworkDirSector('all')">${t({fr:'Tous', en:'All'})}</button>${sectors}
    </div>
    <div class="pt-contact-grid">${rows}</div>`;
}
function setNetworkDirSector(id){ networkDirSector = id; renderAccReseau(); }
function addDirectoryContact(nom){
  const m = NETWORK_DIRECTORY_DEMO.find(x => x.nom === nom);
  if (!m) return;
  const pt = partnerProviderType(m.type);
  const contact = { id:'nw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), nom:m.nom, domaine: pt ? t(pt.name) : undefined, role:m.ville };
  savePartnerData({ reseau: [...networkOwnPayload(USER.reseau || []), contact] }, () => { renderAccReseau(); });
}

function toggleNetworkForm(open){ reseauAdding = open; renderAccReseau(); }

function networkOwnPayload(list){
  return list.filter(c => c.origine !== 'bunkaio').map(c => ({ id:c.id, nom:c.nom, domaine:c.domaine, role:c.role, contact:c.contact, lien:c.lien, note:c.note }));
}
function addNetworkContact(){
  const nom = document.getElementById('nwNom').value.trim();
  if (!nom) { document.getElementById('nwNom').focus(); return; }
  const val = id => document.getElementById(id).value.trim() || undefined;
  const contact = { id:'nw_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), nom, domaine:val('nwDomaine'), role:val('nwRole'), contact:val('nwContact'), lien:val('nwLien'), note:val('nwNote') };
  const btn = document.getElementById('nwSaveBtn');
  if (btn) btn.disabled = true;
  savePartnerData({ reseau: [...networkOwnPayload(USER.reseau || []), contact] },
    () => { reseauAdding = false; renderAccReseau(); }, () => { if (btn) btn.disabled = false; });
}
function removeNetworkContact(id){
  savePartnerData({ reseau: networkOwnPayload(USER.reseau || []).filter(c => c.id !== id) }, () => { renderAccReseau(); });
}

/* ═══════════════ ESPACE PARTENAIRE — MES COLLABORATIONS ═══════════════
   Missions rémunérées proposées par Bunkaio (créées côté admin). Le
   partenaire ne peut que répondre à une mission "Proposée" ; le Worker
   refuse toute autre transition. */
function renderAccCollabs(){
  const el = document.getElementById('accCollabsContent');
  if (!el || !USER) return;
  const list = USER.collaborations || [];
  const pending = list.filter(c => c.statut === 'Proposée');
  const rest = list.filter(c => c.statut !== 'Proposée');
  const info = USER.partenariat || {};

  const card = c => `
    <div class="pt-promo">
      <div class="pt-promo-top">
        <div class="pt-promo-title">${escHtml(c.titre)}</div>
        <span class="status-pill ${statusClass(c.statut)}">${escHtml(c.statut)}</span>
      </div>
      ${c.description ? `<p class="pt-promo-text">${escHtml(c.description)}</p>` : ''}
      <div class="pt-promo-foot">
        ${c.date ? `<span class="pt-promo-meta">${escHtml(c.date)}</span>` : ''}
        ${c.lieu ? `<span class="pt-promo-meta">${escHtml(c.lieu)}</span>` : ''}
        ${c.remuneration ? `<span class="pt-code">${escHtml(c.remuneration)}</span>` : ''}
      </div>
      ${c.statut === 'Proposée' ? `
      <div class="mb-wizard-actions" style="margin:18px 0 0">
        <button type="button" class="btn btn-solid" onclick="respondCollab('${escHtml(c.id)}','Acceptée')"><span>${t({fr:'Accepter', en:'Accept'})}</span></button>
        <button type="button" class="btn btn-ghost" onclick="respondCollab('${escHtml(c.id)}','Déclinée')"><span>${t({fr:'Décliner', en:'Decline'})}</span></button>
      </div>` : ''}
    </div>`;

  el.innerHTML = `
    <div class="acc-info-card pt-hero-promo">
      <div class="pt-hero-big pt-adv-icon">€</div>
      <div>
        <div class="pt-hero-title">${t({fr:'Prestations collaboratives rémunérées', en:'Paid collaborative missions'})}</div>
        <p class="acc-info-note" style="margin:0">${info.typePrestataire
          ? t({fr:'Bunkaio vous propose ici des missions adaptées à votre profil. Vous restez libre de les accepter ou non.', en:'Bunkaio offers missions here that match your profile. You are free to accept or decline.'})
          : t({fr:'Choisissez d\'abord votre type de prestataire dans « Mon partenariat » pour recevoir des missions adaptées.', en:'First choose your provider type in "My partnership" to receive matching missions.'})}</p>
      </div>
    </div>

    ${pending.length ? `<div class="pt-section-label">${t({fr:'À traiter', en:'Awaiting your reply'})}</div><div class="pt-promo-list">${pending.map(card).join('')}</div>` : ''}
    ${rest.length ? `<div class="pt-section-label">${t({fr:'Historique', en:'History'})}</div><div class="pt-promo-list">${rest.map(card).join('')}</div>` : ''}
    ${list.length ? '' : `<div class="acc-info-card"><div class="empty-note">${t({fr:'Aucune mission pour le moment. Les propositions de l\'équipe Bunkaio apparaîtront ici.', en:'No missions yet. Proposals from the Bunkaio team will appear here.'})}</div></div>`}`;
}

function respondCollab(id, statut){
  savePartnerData({ collaborationReponses: [{ id, statut }] }, () => { renderAccCollabs(); });
}

/* ═══════════════ ESPACE CLIENT — MES MOODBOARDS ═══════════════
   Le client crée et gère lui-même ses moodboards (un par shooting, ou
   "projet à venir" avant réservation) via un questionnaire guidé —
   direction artistique, ambiance, palette, inspirations (dont un lien
   Pinterest), vision libre — puis un fil de commentaires avec l'équipe
   Bunkaio. Tout vit dans USER.moodboards, sauvegardé en entier à
   chaque modification via /account-update (voir saveMoodboards()). */

function escHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
function mbNewId(){ return 'mb_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function mbToday(){ return new Date().toLocaleDateString(LANG === 'fr' ? 'fr-FR' : 'en-GB'); }

const MB_DIRECTIONS = [
  { id:'epure', name:{fr:'Épuré & minimaliste', en:'Clean & minimal'}, desc:{fr:'Lignes nettes, espace négatif, lumière douce et neutre.', en:'Clean lines, negative space, soft neutral light.'} },
  { id:'chaleureux', name:{fr:'Chaleureux & authentique', en:'Warm & authentic'}, desc:{fr:'Tons chauds, matières naturelles, lumière dorée.', en:'Warm tones, natural materials, golden light.'} },
  { id:'editorial', name:{fr:'Éditorial & contrasté', en:'Editorial & bold'}, desc:{fr:'Noir et blanc ou contrastes marqués, composition graphique.', en:'Black and white or bold contrast, graphic composition.'} },
  { id:'pastel', name:{fr:'Lumineux & pastel', en:'Bright & pastel'}, desc:{fr:'Teintes claires, ambiance aérienne, douceur.', en:'Light hues, airy mood, softness.'} },
  { id:'brut', name:{fr:'Brut & architectural', en:'Raw & architectural'}, desc:{fr:'Béton, lignes industrielles, lumière dure.', en:'Concrete, industrial lines, hard light.'} },
];
const MB_AMBIANCES = [
  { id:'naturel', name:{fr:'Naturel', en:'Natural'} },
  { id:'luxueux', name:{fr:'Luxueux', en:'Luxurious'} },
  { id:'intemporel', name:{fr:'Intemporel', en:'Timeless'} },
  { id:'urbain', name:{fr:'Urbain', en:'Urban'} },
  { id:'mineral', name:{fr:'Minéral', en:'Mineral'} },
  { id:'vegetal', name:{fr:'Végétal', en:'Botanical'} },
  { id:'dore', name:{fr:'Doré & chaleureux', en:'Golden & warm'} },
  { id:'monochrome', name:{fr:'Monochrome', en:'Monochrome'} },
  { id:'vintage', name:{fr:'Vintage', en:'Vintage'} },
  { id:'graphique', name:{fr:'Graphique', en:'Graphic'} },
  { id:'aerien', name:{fr:'Aérien', en:'Airy'} },
  { id:'brut', name:{fr:'Brut', en:'Raw'} },
];
const MB_PALETTES = [
  { id:'neutres', name:{fr:'Tons neutres & beiges', en:'Neutral & beige tones'}, colors:['#EDE6DA','#C9BBA3','#8C7A64','#3A332B'] },
  { id:'nb', name:{fr:'Noir & blanc contrasté', en:'Bold black & white'}, colors:['#0A0A0C','#4A4A4A','#BFBFBF','#FFFFFF'] },
  { id:'pastel', name:{fr:'Pastel doux', en:'Soft pastel'}, colors:['#F7E4E4','#E4EEF7','#F7F1E4','#E4F7EC'] },
  { id:'terracotta', name:{fr:'Vert & terracotta', en:'Green & terracotta'}, colors:['#4A5C44','#8C5A3C','#D9B48F','#2E3A28'] },
  { id:'dore', name:{fr:'Bleu profond & doré', en:'Deep blue & gold'}, colors:['#1B2A4A','#0A0A0C','#C9A24B','#EDE6DA'] },
];
const MB_PRODUCT_TYPES = [
  { id:'vetement', name:{fr:'Vêtement', en:'Clothing'} },
  { id:'cosmetique', name:{fr:'Cosmétique', en:'Cosmetics'} },
  { id:'accessoire', name:{fr:'Accessoire', en:'Accessory'} },
  { id:'bijou', name:{fr:'Bijou', en:'Jewellery'} },
  { id:'autre', name:{fr:'Autre', en:'Other'} },
];
/* Domaine d'un collaborateur externe = un type de prestataire (mêmes
   catégories que PARTNER_PROVIDER_TYPES, regroupées par univers). Les
   anciens moodboards qui stockaient une prestation du catalogue (CATS)
   restent lisibles grâce au repli de mbDomainName(). */
function mbDomainName(id){
  const pt = partnerProviderType(id);
  if (pt) return t(pt.name);
  const cat = CATS.find(c => c.id === id);
  return cat ? t(cat.name) : '';
}
function mbDomainOptions(selected){
  const legacy = selected && !partnerProviderType(selected) ? CATS.find(c => c.id === selected) : null;
  return PARTNER_SECTORS.map(sec => `
      <optgroup label="${escHtml(t(sec.name))}">
        ${PARTNER_PROVIDER_TYPES.filter(p => p.sector === sec.id).map(p => `<option value="${p.id}"${selected === p.id ? ' selected' : ''}>${escHtml(t(p.name))}</option>`).join('')}
      </optgroup>`).join('') +
    (legacy ? `<option value="${legacy.id}" selected>${escHtml(t(legacy.name))}</option>` : '');
}

let mbView = 'list'; // 'list' | 'wizard' | 'detail'
let mbActiveId = null;

function renderAccMoodboards(){
  const el = document.getElementById('accMoodboardsContent');
  if (!el || !USER) return;
  if (mbView === 'wizard') renderMbWizard(el);
  else if (mbView === 'detail') renderMbDetail(el);
  else renderMbList(el);
}

function openMbWizard(editId){ mbActiveId = editId || null; mbView = 'wizard'; renderAccMoodboards(); }
function openMbDetail(id){ mbActiveId = id; mbView = 'detail'; renderAccMoodboards(); }
function backToMbList(){ mbView = 'list'; mbActiveId = null; renderAccMoodboards(); }

/* Écrit le tableau complet des moodboards via /account-update, même
   ré-authentification par USER_CODE que saveAccInfo(). Le front garde
   toujours l'état courant (USER.moodboards) et renvoie tout le tableau
   à chaque sauvegarde — création, édition, ou simple ajout de
   commentaire passent tous par cette même fonction. */
function saveMoodboards(list, onSuccess, onError){
  fetch(ACCOUNTS_API_BASE + '/account-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: USER.type, email: USER.email, code: USER_CODE, moodboards: list })
  }).then(r => r.json()).then(data => {
    if (!data.ok || !data.account) { if (onError) onError(); return; }
    USER = data.account;
    if (onSuccess) onSuccess();
  }).catch(() => { if (onError) onError(); });
}

function renderMbList(el){
  const boards = USER.moodboards || [];
  const cards = boards.map(mb => {
    const palette = MB_PALETTES.find(p => p.id === mb.palette);
    const swatches = palette ? palette.colors.map(c => `<div class="mb-swatch" style="background:${c}"></div>`).join('') : '';
    const refLabel = (!mb.commandeRef || mb.commandeRef === 'future') ? I18N[LANG]['mb-ref-future'] : mb.commandeRef;
    return `
      <button type="button" class="mb-card" onclick="openMbDetail('${mb.id}')">
        <div class="mb-card-title">${escHtml(mb.titre)}</div>
        <div class="mb-card-ref">${escHtml(refLabel)}</div>
        ${swatches ? `<div class="mb-card-swatches">${swatches}</div>` : ''}
        <div class="mb-card-foot">
          <span style="display:flex;align-items:center;gap:8px">
            ${mb.typeProjet === 'marque' ? `<span class="mb-tag">${I18N[LANG]['mb-type-marque']}</span>` : ''}
            <span class="status-pill ${statusClass(mb.statut)}">${escHtml(mb.statut)}</span>
          </span>
          <span class="mb-card-date">${escHtml(mb.majLe)}</span>
        </div>
      </button>`;
  }).join('');

  el.innerHTML = `
    <div class="mb-toolbar">
      <p class="mb-toolbar-text">${I18N[LANG]['mb-toolbar-text']}</p>
      <button class="btn btn-solid" onclick="openMbWizard()"><span>${I18N[LANG]['mb-new-btn']}</span></button>
    </div>
    ${boards.length ? `<div class="mb-list-grid">${cards}</div>` : `
      <div class="acc-info-card acc-subs-empty">
        <div class="acc-subs-empty-title">${I18N[LANG]['mb-empty-title']}</div>
        <p class="acc-subs-empty-text">${I18N[LANG]['mb-empty-text']}</p>
        <div class="btn-row" style="justify-content:center">
          <button class="btn btn-solid" onclick="openMbWizard()"><span>${I18N[LANG]['mb-new-btn']}</span></button>
        </div>
      </div>`}
  `;
}

function selectMbDirection(btn){
  document.querySelectorAll('#mbDirectionGrid .mb-direction-card').forEach(c => c.classList.toggle('active', c === btn));
  document.getElementById('mbDirection').value = btn.dataset.value;
}
function toggleMbAmbiance(btn){ btn.classList.toggle('active'); }
function selectMbPalette(btn){
  document.querySelectorAll('#mbPaletteGrid .mb-palette-card').forEach(c => c.classList.toggle('active', c === btn));
  document.getElementById('mbPalette').value = btn.dataset.value;
}

/* Lignes de références ajoutées/retirées directement dans le DOM (pas de
   re-rendu du formulaire) pour ne jamais perdre ce qui est déjà saisi
   ailleurs dans le questionnaire — même logique que selectMbDirection()
   ci-dessus, qui ne touche que ce qui change. */
function addMbRefRow(url, note){
  const container = document.getElementById('mbRefRows');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'mb-ref-row';
  row.innerHTML = `
    <input type="text" class="mb-ref-url" placeholder="${I18N[LANG]['mb-ref-url-ph']}" value="${url ? escHtml(url) : ''}">
    <input type="text" class="mb-ref-note" placeholder="${I18N[LANG]['mb-ref-note-ph']}" value="${note ? escHtml(note) : ''}">
    <button type="button" onclick="this.closest('.mb-ref-row').remove()">✕</button>
  `;
  container.appendChild(row);
}

function renderMbWizard(el){
  const editing = mbActiveId ? (USER.moodboards || []).find(m => m.id === mbActiveId) : null;
  const commandOptions = (USER.commandes || []).map(c => c.prestation).filter(Boolean);

  el.innerHTML = `
    <div class="acc-info-card mb-wizard">
      <button type="button" class="mb-back-link" onclick="backToMbList()">${I18N[LANG]['mb-back']}</button>
      <h3 class="mb-wizard-heading">${editing ? I18N[LANG]['mb-wizard-title-edit'] : I18N[LANG]['mb-wizard-title-new']}</h3>

      <div class="mb-wizard-section">
        <div class="mb-wizard-title"><span class="mb-wizard-num">1</span>${I18N[LANG]['mb-step1-title']}</div>
        <p class="mb-wizard-sub">${I18N[LANG]['mb-step1-sub']}</p>
        <div class="mb-fields">
          <div class="fgroup">
            <label>${I18N[LANG]['mb-field-titre']}</label>
            <input type="text" id="mbTitre" placeholder="${I18N[LANG]['mb-field-titre-ph']}" value="${editing ? escHtml(editing.titre) : ''}">
          </div>
          <div class="fgroup">
            <label>${I18N[LANG]['mb-field-commande']}</label>
            <select id="mbCommandeRef">
              <option value="future">${I18N[LANG]['mb-ref-future']}</option>
              ${commandOptions.map(c => `<option value="${escHtml(c)}"${editing && editing.commandeRef === c ? ' selected' : ''}>${escHtml(c)}</option>`).join('')}
            </select>
          </div>
          <div class="fgroup" style="margin-bottom:0">
            <label>${I18N[LANG]['mb-field-type-projet']}</label>
            <select id="mbTypeProjet" onchange="toggleMbProductsModule()">
              <option value="particulier"${editing && editing.typeProjet === 'marque' ? '' : ' selected'}>${I18N[LANG]['mb-type-particulier']}</option>
              <option value="marque"${editing && editing.typeProjet === 'marque' ? ' selected' : ''}>${I18N[LANG]['mb-type-marque']}</option>
            </select>
          </div>
        </div>
        <div class="mb-refs" id="mbProductsModule" style="display:none;margin-top:22px">
          <label style="display:block;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--grey);margin-bottom:7px">${I18N[LANG]['mb-field-products']}</label>
          <p class="mb-wizard-sub" style="margin:0 0 14px">${I18N[LANG]['mb-field-products-sub']}</p>
          <div id="mbProductRows"></div>
          <button type="button" class="mb-ref-add" onclick="addMbProductRow()">${I18N[LANG]['mb-product-add-btn']}</button>
        </div>
      </div>

      <div class="mb-wizard-section">
        <div class="mb-wizard-title"><span class="mb-wizard-num">2</span>${I18N[LANG]['mb-step2-title']}</div>
        <p class="mb-wizard-sub">${I18N[LANG]['mb-step2-sub']}</p>
        <div class="mb-direction-grid" id="mbDirectionGrid">
          ${MB_DIRECTIONS.map(d => `
            <button type="button" class="mb-direction-card${editing && editing.direction === d.id ? ' active' : ''}" data-value="${d.id}" onclick="selectMbDirection(this)">
              <div class="mb-direction-name">${t(d.name)}</div>
              <div class="mb-direction-desc">${t(d.desc)}</div>
            </button>`).join('')}
        </div>
        <input type="hidden" id="mbDirection" value="${editing && editing.direction ? editing.direction : ''}">
      </div>

      <div class="mb-wizard-section">
        <div class="mb-wizard-title"><span class="mb-wizard-num">3</span>${I18N[LANG]['mb-step3-title']}</div>
        <p class="mb-wizard-sub">${I18N[LANG]['mb-step3-sub']}</p>
        <div class="mb-chip-grid" id="mbAmbianceGrid">
          ${MB_AMBIANCES.map(a => `<button type="button" class="mb-chip${editing && (editing.ambiance || []).includes(a.id) ? ' active' : ''}" data-value="${a.id}" onclick="toggleMbAmbiance(this)">${t(a.name)}</button>`).join('')}
        </div>
      </div>

      <div class="mb-wizard-section">
        <div class="mb-wizard-title"><span class="mb-wizard-num">4</span>${I18N[LANG]['mb-step4-title']}</div>
        <p class="mb-wizard-sub">${I18N[LANG]['mb-step4-sub']}</p>
        <div class="mb-palette-grid" id="mbPaletteGrid">
          ${MB_PALETTES.map(p => `
            <button type="button" class="mb-palette-card${editing && editing.palette === p.id ? ' active' : ''}" data-value="${p.id}" onclick="selectMbPalette(this)">
              <div class="mb-palette-swatches">${p.colors.map(c => `<div class="mb-swatch" style="background:${c}"></div>`).join('')}</div>
              <div class="mb-palette-name">${t(p.name)}</div>
            </button>`).join('')}
        </div>
        <input type="hidden" id="mbPalette" value="${editing && editing.palette ? editing.palette : ''}">
      </div>

      <div class="mb-wizard-section">
        <div class="mb-wizard-title"><span class="mb-wizard-num">5</span>${I18N[LANG]['mb-step5-title']}</div>
        <p class="mb-wizard-sub">${I18N[LANG]['mb-step5-sub']}</p>
        <div class="mb-refs">
          <div class="fgroup">
            <label>${I18N[LANG]['mb-field-pinterest']}</label>
            <input type="text" id="mbPinterest" placeholder="https://pinterest.com/votrecompte/votre-tableau" value="${editing && editing.pinterestUrl ? escHtml(editing.pinterestUrl) : ''}">
          </div>
          <label style="display:block;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:var(--grey);margin-bottom:7px">${I18N[LANG]['mb-field-refs']}</label>
          <div id="mbRefRows"></div>
          <button type="button" class="mb-ref-add" onclick="addMbRefRow()">${I18N[LANG]['mb-ref-add-btn']}</button>
        </div>
      </div>

      <div class="mb-wizard-section">
        <div class="mb-wizard-title"><span class="mb-wizard-num">6</span>${I18N[LANG]['mb-step-collab-title']}</div>
        <p class="mb-wizard-sub">${I18N[LANG]['mb-step-collab-sub']}</p>
        <div class="mb-refs">
          <div id="mbCollabRows"></div>
          <button type="button" class="mb-ref-add" onclick="addMbCollabRow()">${I18N[LANG]['mb-collab-add-btn']}</button>
        </div>
      </div>

      <div class="mb-wizard-section">
        <div class="mb-wizard-title"><span class="mb-wizard-num">7</span>${I18N[LANG]['mb-step6-title']}</div>
        <p class="mb-wizard-sub">${I18N[LANG]['mb-step6-sub']}</p>
        <div>
          <textarea id="mbNotes" style="min-height:120px" placeholder="${I18N[LANG]['mb-field-notes-ph']}">${editing ? escHtml(editing.notes || '') : ''}</textarea>
        </div>
      </div>

      <div class="login-error" id="mbError" style="display:none">${I18N[LANG]['mb-error']}</div>
      <div class="mb-wizard-actions">
        <button type="button" class="btn btn-ghost" onclick="backToMbList()"><span>${I18N[LANG]['acc-info-cancel-btn']}</span></button>
        <button type="button" class="btn btn-solid" id="mbSaveBtn" onclick="saveMbDraft()"><span>${editing ? I18N[LANG]['mb-save-btn'] : I18N[LANG]['mb-create-btn']}</span></button>
      </div>
    </div>
  `;

  const existingRefs = editing && editing.references && editing.references.length ? editing.references : [{ url:'', note:'' }];
  existingRefs.forEach(r => addMbRefRow(r.url, r.note));

  const existingProducts = editing && editing.produits && editing.produits.length ? editing.produits : [{ nom:'', type:'vetement', lien:'', note:'' }];
  existingProducts.forEach(p => addMbProductRow(p.nom, p.type, p.lien, p.note));
  toggleMbProductsModule();

  const existingCollabs = editing && editing.collaborateurs && editing.collaborateurs.length ? editing.collaborateurs : [{ nom:'', domaine:'', role:'' }];
  existingCollabs.forEach(c => addMbCollabRow(c.nom, c.domaine, c.role));
}

/* Module "Collection / Produits" — visible uniquement si le projet est
   pour une marque (voir #mbTypeProjet). N'efface jamais les lignes déjà
   saisies : seule la visibilité du bloc change. */
function toggleMbProductsModule(){
  const typeEl = document.getElementById('mbTypeProjet');
  const module = document.getElementById('mbProductsModule');
  if (!typeEl || !module) return;
  module.style.display = typeEl.value === 'marque' ? 'block' : 'none';
}

function addMbProductRow(nom, type, lien, note){
  const container = document.getElementById('mbProductRows');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'mb-ref-row';
  row.innerHTML = `
    <input type="text" class="mb-product-nom" placeholder="${I18N[LANG]['mb-product-nom-ph']}" value="${nom ? escHtml(nom) : ''}">
    <select class="mb-product-type">
      ${MB_PRODUCT_TYPES.map(pt => `<option value="${pt.id}"${type === pt.id ? ' selected' : ''}>${t(pt.name)}</option>`).join('')}
    </select>
    <input type="text" class="mb-product-lien" placeholder="${I18N[LANG]['mb-product-lien-ph']}" value="${lien ? escHtml(lien) : ''}">
    <input type="text" class="mb-product-note" placeholder="${I18N[LANG]['mb-ref-note-ph']}" value="${note ? escHtml(note) : ''}">
    <button type="button" onclick="this.closest('.mb-ref-row').remove()">✕</button>
  `;
  container.appendChild(row);
}

function addMbCollabRow(nom, domaine, role){
  const container = document.getElementById('mbCollabRows');
  if (!container) return;
  const row = document.createElement('div');
  row.className = 'mb-ref-row';
  row.innerHTML = `
    <input type="text" class="mb-collab-nom" placeholder="${I18N[LANG]['mb-collab-nom-ph']}" value="${nom ? escHtml(nom) : ''}">
    <select class="mb-collab-domaine">
      <option value="">${I18N[LANG]['mb-collab-domaine-ph']}</option>
      ${mbDomainOptions(domaine)}
    </select>
    <input type="text" class="mb-collab-role" placeholder="${I18N[LANG]['mb-collab-role-ph']}" value="${role ? escHtml(role) : ''}">
    <button type="button" onclick="this.closest('.mb-ref-row').remove()">✕</button>
  `;
  container.appendChild(row);
}

function saveMbDraft(){
  const titre = document.getElementById('mbTitre').value.trim();
  const err = document.getElementById('mbError');
  if (!titre) { err.style.display = 'block'; return; }
  err.style.display = 'none';

  const ambiance = Array.from(document.querySelectorAll('#mbAmbianceGrid .mb-chip.active')).map(c => c.dataset.value);
  const references = Array.from(document.querySelectorAll('#mbRefRows .mb-ref-row')).map(row => ({
    url: row.querySelector('.mb-ref-url').value.trim(),
    note: row.querySelector('.mb-ref-note').value.trim(),
  })).filter(r => r.url);
  const typeProjet = document.getElementById('mbTypeProjet').value;
  const produits = typeProjet === 'marque'
    ? Array.from(document.querySelectorAll('#mbProductRows .mb-ref-row')).map(row => ({
        nom: row.querySelector('.mb-product-nom').value.trim(),
        type: row.querySelector('.mb-product-type').value,
        lien: row.querySelector('.mb-product-lien').value.trim(),
        note: row.querySelector('.mb-product-note').value.trim(),
      })).filter(p => p.nom)
    : [];
  const collaborateurs = Array.from(document.querySelectorAll('#mbCollabRows .mb-ref-row')).map(row => ({
    nom: row.querySelector('.mb-collab-nom').value.trim(),
    domaine: row.querySelector('.mb-collab-domaine').value,
    role: row.querySelector('.mb-collab-role').value.trim(),
  })).filter(c => c.nom);

  const now = mbToday();
  const editing = mbActiveId ? (USER.moodboards || []).find(m => m.id === mbActiveId) : null;
  const board = {
    id: editing ? editing.id : mbNewId(),
    titre,
    commandeRef: document.getElementById('mbCommandeRef').value,
    statut: editing ? editing.statut : 'Envoyé',
    typeProjet,
    direction: document.getElementById('mbDirection').value || undefined,
    ambiance,
    palette: document.getElementById('mbPalette').value || undefined,
    pinterestUrl: document.getElementById('mbPinterest').value.trim() || undefined,
    references,
    produits,
    collaborateurs,
    notes: document.getElementById('mbNotes').value.trim(),
    commentaires: editing ? (editing.commentaires || []) : [],
    creeLe: editing ? editing.creeLe : now,
    majLe: now,
  };

  const list = USER.moodboards ? USER.moodboards.slice() : [];
  if (editing) { list[list.findIndex(m => m.id === editing.id)] = board; }
  else { list.unshift(board); }

  const btn = document.getElementById('mbSaveBtn');
  if (btn) btn.disabled = true;
  saveMoodboards(list, () => {
    mbActiveId = board.id;
    mbView = 'detail';
    renderAccMoodboards();
  }, () => {
    if (btn) btn.disabled = false;
    err.textContent = I18N[LANG]['mb-save-error'];
    err.style.display = 'block';
  });
}

function renderMbDetail(el){
  const mb = (USER.moodboards || []).find(m => m.id === mbActiveId);
  if (!mb) { mbView = 'list'; renderMbList(el); return; }

  const direction = MB_DIRECTIONS.find(d => d.id === mb.direction);
  const palette = MB_PALETTES.find(p => p.id === mb.palette);
  const ambianceLabels = (mb.ambiance || []).map(id => { const a = MB_AMBIANCES.find(x => x.id === id); return a ? t(a.name) : id; });
  const refLabel = (!mb.commandeRef || mb.commandeRef === 'future') ? I18N[LANG]['mb-ref-future'] : mb.commandeRef;

  const refCards = (mb.references || []).map(r => `
    <a class="mb-ref-card" href="${escHtml(r.url)}" target="_blank" rel="noopener">
      <div class="mb-ref-card-dot"></div>
      <div>
        <div class="mb-ref-card-url">${escHtml(r.url)}</div>
        ${r.note ? `<div class="mb-ref-card-note">${escHtml(r.note)}</div>` : ''}
      </div>
    </a>`).join('');

  const productCards = (mb.produits || []).map(p => {
    const pt = MB_PRODUCT_TYPES.find(x => x.id === p.type);
    return `
    <div class="mb-ref-card" style="cursor:default">
      <div class="mb-ref-card-dot"></div>
      <div>
        <div class="mb-ref-card-url">${escHtml(p.nom)}${pt ? ` — ${t(pt.name)}` : ''}</div>
        ${p.lien ? `<div class="mb-ref-card-note"><a href="${escHtml(p.lien)}" target="_blank" rel="noopener">${escHtml(p.lien)}</a></div>` : ''}
        ${p.note ? `<div class="mb-ref-card-note">${escHtml(p.note)}</div>` : ''}
      </div>
    </div>`;
  }).join('');

  const collabTags = (mb.collaborateurs || []).map(c => {
    const dom = mbDomainName(c.domaine);
    return `<span class="mb-tag">${escHtml(c.nom)}${dom ? ` · ${escHtml(dom)}` : ''}${c.role ? ` · ${escHtml(c.role)}` : ''}</span>`;
  }).join('');

  const comments = (mb.commentaires || []).map(c => `
    <div class="mb-comment${c.auteur === 'bunkaio' ? ' bunkaio' : ''}">
      <div class="mb-comment-meta">${c.auteur === 'bunkaio' ? 'BUNKAIO' : escHtml(USER.nom || USER.email)} · ${escHtml(c.date || '')}</div>
      <div class="mb-comment-text">${escHtml(c.texte)}</div>
      ${c.lien ? `<a class="mb-comment-link" href="${escHtml(c.lien)}" target="_blank" rel="noopener">${escHtml(c.lien)}</a>` : ''}
    </div>`).join('');

  el.innerHTML = `
    <div class="acc-info-card">
      <button type="button" class="mb-back-link" onclick="backToMbList()">${I18N[LANG]['mb-back']}</button>
      <div class="mb-detail-head">
        <div>
          <div class="mb-detail-title">${escHtml(mb.titre)}</div>
          <div class="mb-detail-ref">${escHtml(refLabel)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          ${mb.typeProjet === 'marque' ? `<span class="mb-tag">${I18N[LANG]['mb-type-marque']}</span>` : ''}
          <span class="status-pill ${statusClass(mb.statut)}">${escHtml(mb.statut)}</span>
          <button type="button" class="btn btn-ghost" style="padding:10px 18px" onclick="openMbWizard('${mb.id}')"><span>${I18N[LANG]['mb-edit-btn']}</span></button>
        </div>
      </div>

      ${(direction || ambianceLabels.length) ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['mb-step2-title']}</div>
        <div class="mb-tag-row">
          ${direction ? `<span class="mb-tag">${t(direction.name)}</span>` : ''}
          ${ambianceLabels.map(l => `<span class="mb-tag">${escHtml(l)}</span>`).join('')}
        </div>
      </div>` : ''}

      ${palette ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['mb-step4-title']}</div>
        <div class="mb-detail-swatches">${palette.colors.map(c => `<div class="mb-swatch" style="background:${c}"></div>`).join('')}</div>
      </div>` : ''}

      ${mb.pinterestUrl ? `
      <div class="mb-detail-block">
        <a class="mb-pinterest-card" href="${escHtml(mb.pinterestUrl)}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.37 9.29-.09-.79-.17-2 .04-2.86.19-.78 1.23-4.98 1.23-4.98s-.31-.63-.31-1.55c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.57 2.25-.87 3.5-.25 1.04.53 1.9 1.56 1.9 1.87 0 3.31-1.97 3.31-4.81 0-2.51-1.81-4.27-4.39-4.27-2.99 0-4.74 2.24-4.74 4.56 0 .9.35 1.87.78 2.39.09.1.1.2.07.3-.08.33-.26 1.04-.3 1.19-.05.19-.16.23-.37.14-1.38-.64-2.24-2.65-2.24-4.26 0-3.47 2.52-6.66 7.27-6.66 3.82 0 6.78 2.72 6.78 6.36 0 3.79-2.39 6.85-5.71 6.85-1.12 0-2.17-.58-2.53-1.27l-.69 2.62c-.25.96-.92 2.16-1.37 2.89.79.24 1.63.37 2.5.37 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
          <span>${I18N[LANG]['mb-pinterest-link']}</span>
        </a>
      </div>` : ''}

      ${refCards ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['mb-step5-title']}</div>
        <div class="mb-ref-cards">${refCards}</div>
      </div>` : ''}

      ${productCards ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['mb-field-products']}</div>
        <div class="mb-ref-cards">${productCards}</div>
      </div>` : ''}

      ${collabTags ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['mb-step-collab-title']}</div>
        <div class="mb-tag-row">${collabTags}</div>
      </div>` : ''}

      ${mb.notes ? `
      <div class="mb-detail-block">
        <div class="mb-detail-label">${I18N[LANG]['mb-step6-title']}</div>
        <div class="mb-detail-vision">${escHtml(mb.notes)}</div>
      </div>` : ''}

      <div class="mb-detail-block" style="margin-bottom:0">
        <div class="mb-detail-label">${I18N[LANG]['mb-comments-title']}</div>
        ${comments ? `<div class="mb-comments">${comments}</div>` : `<p class="mb-comment-empty">${I18N[LANG]['mb-comments-empty']}</p>`}
        <div class="mb-comment-form">
          <textarea id="mbCommentText" placeholder="${I18N[LANG]['mb-comment-ph']}"></textarea>
          <div class="mb-comment-form-row">
            <input type="text" id="mbCommentLink" placeholder="${I18N[LANG]['mb-comment-link-ph']}">
            <button type="button" class="btn btn-solid" id="mbCommentBtn" onclick="addMbComment()"><span>${I18N[LANG]['mb-comment-btn']}</span></button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function addMbComment(){
  const textEl = document.getElementById('mbCommentText');
  const linkEl = document.getElementById('mbCommentLink');
  const texte = textEl.value.trim();
  if (!texte) return;
  const mb = (USER.moodboards || []).find(m => m.id === mbActiveId);
  if (!mb) return;
  const comment = { auteur: 'client', texte, lien: linkEl.value.trim() || undefined, date: mbToday() };
  const list = USER.moodboards.map(m => m.id === mb.id ? { ...m, commentaires: [...(m.commentaires || []), comment], majLe: mbToday() } : m);
  const btn = document.getElementById('mbCommentBtn');
  if (btn) btn.disabled = true;
  saveMoodboards(list, () => { renderAccMoodboards(); }, () => { if (btn) btn.disabled = false; });
}

function renderAccount(){
  if (!USER) return;
  document.getElementById('accBadge').textContent =
    I18N[LANG][USER.type === 'client' ? 'acc-client-badge' : 'acc-partner-badge'];
  document.getElementById('accName').textContent = USER.nom || USER.email;
  const isPartner = USER.type === 'partner';
  document.getElementById('view-account').dataset.acct = USER.type;
  ['partenariat','promotions','reseau','collabs'].forEach(x => {
    document.getElementById('atab-' + x).style.display = isPartner ? '' : 'none';
  });
  if (isPartner) { renderAccPartner(); renderAccPromos(); renderAccReseau(); renderAccCollabs(); }
  renderAccountStepper();
  renderAccSubs();
  mbView = 'list'; mbActiveId = null;
  renderAccMoodboards();
  renderAccUpsell();
  const ob = document.getElementById('ordersBody');
  const orders = USER.commandes || [];
  ob.innerHTML = orders.length
    ? orders.map(o => `<tr><td>${o.date||'—'}</td><td>${o.prestation||'—'}</td><td>${o.montant||'—'}</td><td><span class="status-pill ${statusClass(o.statut)}">${o.statut||'—'}</span></td></tr>`).join('')
    : `<tr><td colspan="4"><div class="empty-note">${I18N[LANG]['empty-orders']}</div></td></tr>`;
  const pb = document.getElementById('paymentsBody');
  const payments = USER.paiements || [];
  pb.innerHTML = payments.length
    ? payments.map(p => `<tr><td>${p.date||'—'}</td><td>${p.reference||'—'}</td><td>${p.methode||'—'}</td><td>${p.montant||'—'}</td><td><span class="status-pill ${statusClass(p.statut)}">${p.statut||'—'}</span></td><td>${p.factureUrl ? `<a href="${p.factureUrl}" target="_blank" rel="noopener">${I18N[LANG]['acc-invoice-view']}</a>` : '—'}</td></tr>`).join('')
    : `<tr><td colspan="6"><div class="empty-note">${I18N[LANG]['empty-payments']}</div></td></tr>`;
  const fb = document.getElementById('facturesBody');
  const factures = USER.factures || [];
  fb.innerHTML = factures.length
    ? factures.map(f => `<tr><td>${f.numero||'—'}</td><td>${f.date||'—'}</td><td>${f.montant||'—'}</td><td><span class="status-pill ${statusClass(f.statut)}">${f.statut||'—'}</span></td><td>${f.url ? `<a href="${f.url}" target="_blank" rel="noopener">${I18N[LANG]['acc-invoice-view']}</a>` : '—'}</td></tr>`).join('')
    : `<tr><td colspan="5"><div class="empty-note">${I18N[LANG]['empty-factures']}</div></td></tr>`;
  const lrBtn = document.getElementById('accLightroomBtn');
  if (lrBtn) {
    const hasLr = !!USER.lightroomUrl;
    if (hasLr) lrBtn.href = USER.lightroomUrl;
    lrBtn.style.display = hasLr ? '' : 'none';
    const lrLocked = document.getElementById('accLightroomLocked');
    if (lrLocked) lrLocked.style.display = hasLr ? 'none' : '';
  }
  renderAccInfoView();
  toggleAccInfoEdit(false);
  /* Un compte partenaire atterrit directement sur son onglet dédié —
     "Mes commandes" n'a pas vraiment de sens pour lui par défaut. */
  setAccountTab(USER.type === 'partner' ? 'partenariat' : 'orders');
}

/* ═══════════════ ESPACE CLIENT — MES INFORMATIONS ═══════════════ */
/* Champs nécessaires à l'édition d'un devis et d'une facture. Obligatoires pour valider l'espace.
   SIRET : optionnel pour un client, obligatoire pour un partenaire (toujours professionnel). */
function accProfile(){
  if (USER && USER.type === 'partner') return 'professionnel';
  const sel = document.getElementById('accEditProfile');
  const editing = document.getElementById('accInfoEdit').style.display === 'block';
  if (editing && sel) return sel.value;
  return (USER && USER.facturation && USER.facturation.profil) || 'particulier';
}
function applyAccInfoProfile(profil){
  ['accInfoView','accInfoEdit'].forEach(id => { const el = document.getElementById(id); if (el) el.setAttribute('data-profil', profil); });
  const partner = USER && USER.type === 'partner';
  const wrap = document.getElementById('accEditProfileWrap');
  if (wrap) wrap.style.display = partner ? 'none' : '';
  const key = partner ? 'acc-info-siret-req' : 'acc-info-siret-opt';
  ['accSiretLabel','accSiretLabelView'].forEach(id => { const el = document.getElementById(id); if (el) { el.setAttribute('data-lang', key); el.textContent = I18N[LANG][key]; } });
}
function refreshAccInfoProfile(){ applyAccInfoProfile(document.getElementById('accEditProfile').value); }

/* Liste des champs manquants ou invalides (mêmes règles que le Worker : server/src/billing.ts). */
function accInfoMissing(u){
  const f = (u && u.facturation) || {};
  const partner = u && u.type === 'partner';
  const profil = partner ? 'professionnel' : f.profil;
  const m = [];
  if (!(u && u.nom && u.nom.trim())) m.push('nom');
  if (!(u && u.telephone && u.telephone.replace(/\D/g,'').length >= 6)) m.push('telephone');
  if (profil !== 'particulier' && profil !== 'professionnel') m.push('profil');
  if (profil === 'professionnel' && !(f.contact && f.contact.trim())) m.push('contact');
  if (profil === 'professionnel' && ['ei','sas','sarl','sa','association','autre'].indexOf(f.forme) < 0) m.push('forme');
  if (!(f.rue && f.rue.trim())) m.push('rue');
  if (!(f.codePostal && f.codePostal.trim())) m.push('codePostal');
  if (!(f.ville && f.ville.trim())) m.push('ville');
  if (!(f.pays && f.pays.trim())) m.push('pays');
  const siret = (f.siret || '').replace(/\s/g,'');
  if ((partner && !siret) || (siret && !/^\d{14}$/.test(siret))) m.push('siret');
  const tva = (f.tvaIntra || '').replace(/\s/g,'');
  if (tva && !/^[A-Za-z]{2}[0-9A-Za-z]{2,12}$/.test(tva)) m.push('tvaIntra');
  return m;
}
/* Le compte de démonstration n'est jamais bloqué par le verrou des informations. */
function accInfoComplete(){ return !!USER && (USER.email === 'demo@bunkaio.com' || accInfoMissing(USER).length === 0); }

function renderAccInfoView(){
  if (!USER) return;
  const notSet = I18N[LANG]['acc-info-not-set'];
  const f = USER.facturation || {};
  const profil = USER.type === 'partner' ? 'professionnel' : (f.profil || 'particulier');
  applyAccInfoProfile(profil);
  document.getElementById('accInfoProfile').textContent = profil === 'professionnel' ? I18N[LANG]['acc-info-profile-pro'] : I18N[LANG]['acc-info-profile-part'];
  document.getElementById('accInfoName').textContent = USER.nom || notSet;
  document.getElementById('accInfoContact').textContent = f.contact || notSet;
  document.getElementById('accInfoEmail').textContent = USER.email || notSet;
  document.getElementById('accInfoPhone').textContent = USER.telephone || notSet;
  document.getElementById('accInfoAddress').textContent = (f.rue ? [f.rue, [f.codePostal, f.ville].filter(Boolean).join(' '), f.pays].filter(Boolean).join(', ') : USER.adresse) || notSet;
  const formeKey = { ei:'acc-forme-ei', sas:'acc-forme-sas', sarl:'acc-forme-sarl', sa:'acc-forme-sa', association:'acc-forme-asso', autre:'acc-forme-autre' }[f.forme];
  document.getElementById('accInfoForme').textContent = formeKey ? I18N[LANG][formeKey] : notSet;
  document.getElementById('accInfoSiret').textContent = f.siret || notSet;
  document.getElementById('accInfoVat').textContent = f.tvaIntra || notSet;
  const ok = accInfoComplete();
  const st = document.getElementById('accInfoStatus');
  st.textContent = ok ? '✓ ' + I18N[LANG]['acc-info-valid'] : I18N[LANG]['acc-info-incomplete'];
  st.style.fontWeight = '600';
  document.getElementById('accInfoBanner').style.display = ok ? 'none' : 'block';
  document.getElementById('accInfoBanner').textContent = I18N[LANG]['acc-info-banner'];
}

/* Bascule lecture/édition. Les champs d'édition sont toujours repris
   depuis USER (jamais vidés), pour que l'utilisateur puisse revenir en
   arrière avec "Annuler" sans perdre ce qui était déjà enregistré. */
function toggleAccInfoEdit(edit){
  document.getElementById('accInfoView').style.display = edit ? 'none' : 'block';
  document.getElementById('accInfoEdit').style.display = edit ? 'block' : 'none';
  document.getElementById('accInfoSuccess').style.display = 'none';
  document.getElementById('accInfoError').style.display = 'none';
  if (edit && USER) {
    const f = USER.facturation || {};
    document.getElementById('accEditProfile').value = USER.type === 'partner' ? 'professionnel' : (f.profil || 'particulier');
    document.getElementById('accEditName').value = USER.nom || '';
    document.getElementById('accEditContact').value = f.contact || '';
    document.getElementById('accEditPhone').value = USER.telephone || '';
    document.getElementById('accEditStreet').value = f.rue || '';
    document.getElementById('accEditZip').value = f.codePostal || '';
    document.getElementById('accEditCity').value = f.ville || '';
    document.getElementById('accEditCountry').value = f.pays || 'France';
    document.getElementById('accEditForme').value = f.forme || '';
    document.getElementById('accEditSiret').value = f.siret || '';
    document.getElementById('accEditVat').value = f.tvaIntra || '';
    applyAccInfoProfile(document.getElementById('accEditProfile').value);
    /* Tant que l'espace n'est pas validé, on ne peut pas annuler l'édition. */
    document.getElementById('accInfoCancelBtn').style.display = accInfoComplete() ? '' : 'none';
  }
}

/* Verrou de validation : tant que les informations ne sont pas complètes, seul l'onglet
   « Mes informations » est accessible (en mode édition). */
function enforceAccInfoGate(){
  if (!USER || accInfoComplete()) return false;
  ['orders','partenariat','promotions','reseau','collabs','subs','moodboards','payments','factures','portfolio','infos'].forEach(x => {
    const tb = document.getElementById('atab-' + x), sc = document.getElementById('asec-' + x);
    if (tb) tb.classList.toggle('active', x === 'infos');
    if (sc) sc.classList.toggle('active', x === 'infos');
  });
  renderAccInfoView();
  toggleAccInfoEdit(true);
  return true;
}

/* Écrit directement dans la base de comptes via /account-update (voir
   server/src/index.ts → handleAccountUpdate) : la mise à jour est
   immédiate et définitive, plus une simple demande par email. Le code
   d'accès (USER_CODE, en mémoire depuis la connexion) ré-authentifie
   l'appel — l'email de connexion n'est volontairement pas modifiable
   ici (c'est la clé d'identité du compte). */
function saveAccInfo(){
  const partner = USER.type === 'partner';
  const profil = partner ? 'professionnel' : document.getElementById('accEditProfile').value;
  const val = id => document.getElementById(id).value.trim();
  const facturation = {
    profil: profil,
    contact: profil === 'professionnel' ? val('accEditContact') : '',
    rue: val('accEditStreet'), codePostal: val('accEditZip'), ville: val('accEditCity'), pays: val('accEditCountry'),
    forme: profil === 'professionnel' ? document.getElementById('accEditForme').value : '',
    siret: profil === 'professionnel' ? val('accEditSiret').replace(/\s/g,'') : '',
    tvaIntra: profil === 'professionnel' ? val('accEditVat').replace(/\s/g,'').toUpperCase() : ''
  };
  const draft = Object.assign({}, USER, { nom: val('accEditName'), telephone: val('accEditPhone'), facturation: facturation });
  const missing = accInfoMissing(draft);
  const err = document.getElementById('accInfoError');
  if (missing.length) {
    err.textContent = I18N[LANG]['register-error'] + (missing.includes('siret') ? (partner ? ' ' + (LANG === 'fr' ? 'SIRET : 14 chiffres, obligatoire pour un partenaire.' : 'SIRET: 14 digits, required for a partner.') : ' ' + (LANG === 'fr' ? 'SIRET : 14 chiffres.' : 'SIRET: 14 digits.')) : '') + (missing.includes('tvaIntra') ? ' ' + (LANG === 'fr' ? 'Numéro de TVA invalide.' : 'Invalid VAT number.') : '');
    err.style.display = 'block';
    return;
  }
  err.style.display = 'none';
  const btn = document.querySelector('#accInfoEdit .btn-solid');
  if (btn) btn.disabled = true;
  fetch(ACCOUNTS_API_BASE + '/account-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: USER.type, email: USER.email, code: USER_CODE, nom: draft.nom, telephone: draft.telephone, facturation: facturation })
  }).then(r => r.json()).then(data => {
    if (btn) btn.disabled = false;
    if (!data.ok || !data.account) {
      err.textContent = data.error === 'incomplete_info' ? I18N[LANG]['register-error'] : 'Erreur lors de l\'enregistrement. Écrivez à contact@bunkaio.com';
      err.style.display = 'block';
      return;
    }
    USER = data.account;
    document.getElementById('accName').textContent = USER.nom || USER.email;
    renderAccInfoView();
    toggleAccInfoEdit(false);
    document.getElementById('accInfoSuccess').style.display = 'block';
  }).catch(() => {
    if (btn) btn.disabled = false;
    err.textContent = 'Erreur réseau. Écrivez à contact@bunkaio.com';
    err.style.display = 'block';
  });
}

/* ═══════════════ COMM BOX ═══════════════ */
function renderCommBox(){
  const box = document.getElementById('commBox');
  if (!box) return;
  box.innerHTML = '';
  S.comm = false;
  if (!commEligible()) return;
  const d = document.createElement('div');
  d.className = 'comm-box stagger';
  d.style.animationDelay = '0.5s';
  const titleFR = 'Besoin d\'un accompagnement en communication digitale\u00a0?';
  const titleEN = 'Need support with your digital communication\u00a0?';
  const textFR  = 'Notre partenaire accompagne les clients Bunkaio au-delà de l\'image : création de site web, référencement (SEO), publicité en ligne (SEA / Ads) et stratégie réseaux sociaux.';
  const textEN  = 'Our partner supports Bunkaio clients beyond imagery: website creation, SEO, online advertising (SEA / Ads) and social media strategy.';
  d.innerHTML = `
    <div class="comm-kicker">${LANG === 'fr' ? 'Pour aller plus loin' : 'Going further'}</div>
    <div class="comm-title">${LANG === 'fr' ? titleFR : titleEN}</div>
    <div class="comm-text">${LANG === 'fr' ? textFR : textEN}</div>
    <div class="comm-check" id="commCheck">
      <div class="opt-check"></div>
      <span>${LANG === 'fr' ? 'Je suis potentiellement intéressé(e)' : 'I may be interested'}</span>
    </div>`;
  d.querySelector('#commCheck').onclick = function(){
    this.classList.toggle('selected');
    S.comm = this.classList.contains('selected');
  };
  box.appendChild(d);
}

/* Logo sous « Le studio » : s'efface en remontant, pour ne jamais passer par-dessus la phrase d'accroche. */
function initHomeLogoFade(){
  const sec = document.querySelector('.home-logo-gap'); const img = sec && sec.querySelector('img');
  if (!img) return;
  let tick = false;
  const upd = () => {
    tick = false;
    const r = sec.getBoundingClientRect();
    const p = (r.top + r.height / 2) / (window.innerHeight || 1);
    img.style.opacity = String(Math.max(0, Math.min(1, (p - 0.55) / 0.25)) * 0.9);
  };
  window.addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  window.addEventListener('resize', upd);
  upd();
}

/* ═══════════════ VIDÉO "LE STUDIO" — calque fixe plein écran (Accueil) ═══════════════
   Même mécanique que le hero : la vidéo vit dans un calque position:fixed
   partagé, et son opacité est pilotée par un IntersectionObserver dédié
   qui observe le déclencheur invisible .home-claim-trigger. Contrairement
   à position:sticky (peu fiable dès que la section fait 100vh sans
   "réserve" de scroll, notamment sur iOS Safari), ce calque reste
   réellement immobile à l'écran tant que le déclencheur est visible. */
let _homeClaimVideoInit = false;
function initHomeClaimVideo(){
  const box = document.getElementById('homeClaimVideoBg');
  const wrap = document.getElementById('missionVideoWrap');
  const trigger = document.getElementById('homeClaimSection');
  if (!box || !wrap || !trigger || _homeClaimVideoInit) return;
  if (!IMG.missionVideo) return; /* pas de vidéo définie -> fond noir uni du CSS */
  _homeClaimVideoInit = true;
  /* La vidéo (plusieurs Mo) n'est chargée que lorsque la section approche de l'écran : elle ne concurrence plus
     l'affichage initial de la page (LCP) et n'est pas téléchargée avec « économie de données » ou en 2G. */
  let missionVid = null;
  const ensureMissionVideo = () => {
    if (missionVid || !bgVideoAllowed()) return;
    missionVid = createBgVideo(pickBgVideo(IMG.missionVideo, IMG.missionVideoMobile));
    box.appendChild(missionVid);
  };
  new IntersectionObserver((entries, io) => {
    if (entries.some(e => e.isIntersecting)) { ensureMissionVideo(); io.disconnect(); }
  }, { rootMargin: '300px 0px' }).observe(trigger);

  /* Activation : dès que le déclencheur (100vh) entre à l'écran.
     Désactivation : dès que la section blanche suivante (réassurance)
     commence elle-même à apparaître, même d'un pixel — priorité au
     fond blanc. Combiné à un fondu rapide (0.25s en CSS), la vidéo a
     disparu avant que le texte (en retrait de 64px dans la section)
     ne devienne réellement lisible à l'écran. */
  const reassureEl = document.querySelector('.reassure-section');
  let triggerVisible = false;
  let reassureVisible = false;
  const updateMissionWrap = () => {
    wrap.classList.toggle('active', triggerVisible && !reassureVisible);
  };
  const missionIO = new IntersectionObserver(entries => {
    entries.forEach(e => { triggerVisible = e.isIntersecting; });
    updateMissionWrap();
  }, { threshold: 0 }); /* 0 (pas 0.15) : active dès la 1ère apparition du
    déclencheur — sinon un intervalle de scroll sépare la désactivation du
    calque "prestations" juste avant (dès la sortie de son propre
    déclencheur) et l'activation de celui-ci, laissant voir le fond blanc
    de la page entre les deux. */
  missionIO.observe(trigger);
  /* Fin de section : le texte et le sélecteur s'estompent, puis la vidéo reste seule à l'écran sur environ
     0,8 écran de défilement, avant que la suite de la page n'apparaisse. */
  const content = wrap.querySelector('.mission-video-content');
  const overlay = wrap.querySelector('.mission-video-overlay');
  let tick = false;
  const fadeContent = () => {
    tick = false;
    if (!triggerVisible) return;
    const vh = window.innerHeight || 800;
    const b = trigger.getBoundingClientRect().bottom / vh;
    const op = Math.max(0, Math.min(1, (b - 1.8) / 0.4));
    if (content) { content.style.opacity = String(op); content.style.pointerEvents = op < 0.25 ? 'none' : ''; }
    if (overlay) overlay.style.opacity = String(0.3 + 0.7 * op);
    /* Texte effacé : la photo de la prestation choisie reste fixe et devient plus visible, par-dessus la vidéo. */
    msHold = op < 0.6;
    wrap.style.setProperty('--mt-bg-op', String(0.5 + 0.35 * (1 - op)));
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(fadeContent); } }, { passive: true });
  addEventListener('resize', fadeContent);
  if (reassureEl) {
    const reassureIO = new IntersectionObserver(entries => {
      entries.forEach(e => { reassureVisible = e.isIntersecting; });
      updateMissionWrap();
    }, { threshold: 0 });
    reassureIO.observe(reassureEl);
  }
}

/* ═══════════════ PARTENAIRES — onglets ═══════════════ */
function setPartnersTab(tab){
  document.getElementById('ptab-program').classList.toggle('active', tab === 'program');
  document.getElementById('ptab-apply').classList.toggle('active', tab === 'apply');
  document.getElementById('ptab-collab').classList.toggle('active', tab === 'collab');
  document.getElementById('psec-program').style.display = tab === 'program' ? 'block' : 'none';
  document.getElementById('psec-apply').style.display = tab === 'apply' ? 'block' : 'none';
  document.getElementById('psec-collab').style.display = tab === 'collab' ? 'block' : 'none';
  if (tab === 'apply') { renderApplyBenefits(); renderApplyTypePicker(); }
}

/* ═══════════════ ACCORDÉON PARTENAIRES ═══════════════ */
/* ═══════════════ PAGE PARTENAIRES — ARGUMENTAIRE ═══════════════
   Bloc d'accroche au-dessus de l'accordéon : proposition de valeur,
   chiffres clés, avantages concrets, univers et parcours. Les chiffres
   (-20%, 60 places) viennent de PARTNER_DISCOUNT / du texte du
   programme ; l'exemple de prix est calculé depuis CATS. */
function renderPartnersPitch(){
  const el = document.getElementById('partnersPitch');
  if (!el) return;
  const ex = CATS.find(c => c.id === 'commercial');
  const exPrice = ex && ex.tiers && ex.tiers.sig && ex.tiers.sig.price;
  const benefits = [
    { n:'01', icon:'<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
      title:{fr:'Une mise en lumière éditoriale', en:'An editorial spotlight'},
      text:{fr:'Votre savoir-faire n\'est pas vendu comme une prestation : il est raconté. Un récit visuel signé Bunkaio, publié et durable.', en:'Your craft isn\'t sold as a service: it is told. A visual story signed by Bunkaio, published and lasting.'} },
    { n:'02', icon:'<path d="M5 19 19 5"/><circle cx="7" cy="7" r="2.4"/><circle cx="17" cy="17" r="2.4"/>', hl:'-' + PARTNER_DISCOUNT + '%',
      title:{fr:'-' + PARTNER_DISCOUNT + '% sur tout le catalogue', en:'-' + PARTNER_DISCOUNT + '% across the catalogue'},
      text:{fr:'Un tarif partenaire permanent sur chaque prestation Bunkaio, options et abonnements compris. Il s\'applique automatiquement à vos devis.', en:'A permanent partner rate on every Bunkaio service, add-ons and subscriptions included. It applies automatically to your quotes.'} },
    { n:'03', icon:'<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2c-.5-.8-1.5-1.2-2.8-1.2-1.6 0-2.7.8-2.7 2 0 3 5.6 1.4 5.6 4.2 0 1.2-1.1 2-2.9 2-1.4 0-2.5-.5-3-1.4M12 6.5V8m0 8v1.5"/>',
      title:{fr:'Des missions collaboratives rémunérées', en:'Paid collaborative missions'},
      text:{fr:'Selon votre métier, Bunkaio vous sollicite sur des projets clients. Vous acceptez ou déclinez, depuis votre espace, en un clic.', en:'Depending on your trade, Bunkaio calls on you for client projects. You accept or decline from your space in one click.'} },
    { n:'04', icon:'<circle cx="12" cy="12" r="3"/><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>',
      title:{fr:'Une visibilité renforcée', en:'Enhanced visibility'},
      text:{fr:'Présence privilégiée sur le site Bunkaio, les réseaux sociaux et les futurs supports éditoriaux de la marque.', en:'A privileged presence on the Bunkaio website, social channels and the brand\'s future editorial publications.'} },
    { n:'05', icon:'<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="7" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M8 8.5l3 7M16 8.5l-3 7M8.4 7h7.2"/>',
      title:{fr:'Un réseau de professionnels', en:'A professional network'},
      text:{fr:'Un annuaire de partenaires triés sur le volet et des mises en relation par l\'équipe : traiteurs, lieux, architectes, artisans.', en:'A directory of hand-picked partners and introductions by the team: caterers, venues, architects, craftspeople.'} },
    { n:'06', icon:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.5h16M9.5 9.5V20"/>',
      title:{fr:'Un espace partenaire dédié', en:'A dedicated partner space'},
      text:{fr:'Vos promotions, votre réseau, vos collaborations et vos moodboards au même endroit. Plus un accès prioritaire à nos disponibilités.', en:'Your promotions, network, collaborations and moodboards in one place. Plus priority access to our schedule.'} },
  ];
  const universes = [
    { id:'portrait', name:{fr:'Portrait & lifestyle', en:'Portrait & lifestyle'}, who:{fr:'Coiffeurs, maquilleurs, coachs en image, instituts, studios', en:'Hairstylists, make-up artists, image coaches, wellness studios, studios'} },
    { id:'mode', name:{fr:'Mode & mannequins', en:'Fashion & models'}, who:{fr:'Créateurs, agences de mannequins, stylistes, bijoutiers', en:'Designers, model agencies, stylists, jewellers'} },
    { id:'commercial', name:{fr:'Commercial & produits', en:'Commercial & products'}, who:{fr:'Marques, artisans, cosmétique, restaurateurs, agences', en:'Brands, artisans, cosmetics, restaurateurs, agencies'} },
    { id:'evenementiel', name:{fr:'Événementiel', en:'Events'}, who:{fr:'Organisateurs, lieux de réception, traiteurs, décorateurs, animation', en:'Planners, venues, caterers, decorators, entertainment'} },
    { id:'mariage', name:{fr:'Mariage & Lumen', en:'Weddings & Lumen'}, who:{fr:'Wedding planners, domaines, fleuristes, créateurs de robes, traiteurs', en:'Wedding planners, estates, florists, gown designers, caterers'} },
  ];
  const steps = [
    { n:'1', title:{fr:'Candidatez', en:'Apply'}, text:{fr:'Présentez votre activité et vos réalisations.', en:'Present your business and your work.'} },
    { n:'2', title:{fr:'Étude', en:'Review'}, text:{fr:'Réponse personnalisée sous 5 jours ouvrés.', en:'A personal reply within 5 working days.'} },
    { n:'3', title:{fr:'Choisissez votre statut', en:'Pick your status'}, text:{fr:'Sélectionnez votre type de prestataire dans votre espace.', en:'Select your provider type in your space.'} },
    { n:'4', title:{fr:'Profitez', en:'Benefit'}, text:{fr:'Tarif partenaire, missions, visibilité, réseau.', en:'Partner rate, missions, visibility, network.'} },
  ];
  const svg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

  window._ppSections = {
    benefits: `<div class="pp-benefits">
        ${benefits.map(b => `
          <div class="pp-benefit">
            <div class="pp-benefit-top"><span class="pp-benefit-icon">${svg(b.icon)}</span><span class="pp-benefit-num">${b.n}</span></div>
            <div class="pp-benefit-title">${t(b.title)}</div>
            <div class="pp-benefit-text">${t(b.text)}</div>
          </div>`).join('')}
      </div>
      ${exPrice ? `
      <div class="pp-example">
        <div class="pp-example-label">${t({fr:'Un exemple concret', en:'A concrete example'})}</div>
        <div class="pp-example-body">
          <div>${t({fr:'Pack Signature — Commercial & produits', en:'Signature package — Commercial & products'})}</div>
          <div class="pp-example-prices"><span class="pt-price-old">${eur(exPrice)} </span><strong>${eur(partnerPrice(exPrice))} </strong><em>${t({fr:'vous économisez', en:'you save'})} ${eur(exPrice - partnerPrice(exPrice))}</em></div>
        </div>
      </div>` : ''}`,
    universes: `<div class="pp-universes">
        ${universes.map(u => `
          <div class="pp-universe">
            <div class="pp-universe-name">${t(u.name)}</div>
            <div class="pp-universe-who">${t(u.who)}</div>
            <div class="pp-universe-spots">${t({fr:'10 places', en:'10 places'})}</div>
          </div>`).join('')}
      </div>
      <p class="pp-note">${t({fr:'Le programme n\'est pas ouvert à tous : chaque candidature est étudiée individuellement pour préserver la cohérence éditoriale de Bunkaio. Une fois les places pourvues, les nouvelles candidatures rejoignent une liste d\'attente.', en:'The programme is not open to everyone: each application is reviewed individually to preserve Bunkaio\'s editorial coherence. Once places are filled, new applications join a waiting list.'})}</p>`,
    steps: `<div class="pp-steps">
        ${steps.map(st => `
          <div class="pp-step"><div class="pp-step-num">${st.n}</div><div class="pp-step-title">${t(st.title)}</div><div class="pp-step-text">${t(st.text)}</div></div>`).join('')}
      </div>`
  };
  el.innerHTML = `
    <section class="pp-hero rv">
      <div class="pp-kicker">${t({fr:'Programme Partenaires Fondateurs · 60 places', en:'Founding Partners Programme · 60 places'})}</div>
      <h2 class="pp-title">${t({fr:'Votre savoir-faire mérite mieux qu\'une simple prestation.', en:'Your craft deserves more than a simple service.'})}</h2>
      <p class="pp-lead">${t({fr:'Rejoignez le cercle restreint des professionnels que Bunkaio met en lumière. Des images haut de gamme en HD, un tarif partenaire permanent, des missions rémunérées et un réseau d\'exception.', en:'Join the select circle of professionals Bunkaio puts in the spotlight. Premium HD imagery, a permanent partner rate, paid missions and an exceptional network.'})}</p>
      <div class="pp-cta-row">
        <button class="partner-cta-btn" onclick="goView('partners','apply')">${t({fr:'Candidater', en:'Apply'})}</button>
        <a class="pp-ghost" href="#partnersAccordion" onclick="event.preventDefault();openPartnersAccordion(0)">${t({fr:'Découvrir les avantages', en:'See the benefits'})}</a>
      </div>
      <div class="pp-stats">
        <div><div class="pp-stat-num">-${PARTNER_DISCOUNT}%</div><div class="pp-stat-label">${t({fr:'permanent sur le catalogue', en:'permanent on the catalogue'})}</div></div>
        <div><div class="pp-stat-num">60</div><div class="pp-stat-label">${t({fr:'partenaires fondateurs maximum', en:'founding partners maximum'})}</div></div>
        <div><div class="pp-stat-num">5</div><div class="pp-stat-label">${t({fr:'univers · 10 places chacun', en:'universes · 10 places each'})}</div></div>
        <div><div class="pp-stat-num">€</div><div class="pp-stat-label">${t({fr:'missions rémunérées', en:'paid missions'})}</div></div>
      </div>
    </section>`;
}

function renderPartnersAccordion(){
  renderPartnersPitch();
  const sec = window._ppSections || {};
  const sections = LANG === 'fr' ? [
    { title:'Ce que vous obtenez', body: sec.benefits },
    { title:'Pour qui ? Cinq univers, dix places chacun', body: `${sec.universes}<p style="margin-top:6px">Maximum <strong>60 partenaires fondateurs</strong>. Une fois les places pourvues, les nouvelles candidatures rejoignent une liste d'attente.</p>` },
    { title:'Comment ça marche', body: `${sec.steps}<p style="margin-top:18px">Chaque candidature est étudiée selon la qualité des réalisations et la cohérence avec l'univers Bunkaio : sélectionné, compatible (ponctuel) ou réorienté selon vos besoins.</p>` },
    { title:'Pourquoi Bunkaio existe', body:`<p>Bunkaio est un <strong>studio de photographie professionnel</strong>. Notre métier : produire des images haut de gamme, en haute définition, qui mettent en valeur votre projet — portrait, mode, produits, événements, mariage.</p><p>Chaque prise de vue est pensée, éclairée et retouchée avec exigence, pour un contenu premium prêt à être publié, imprimé ou diffusé.</p><p><strong>Nous ne sommes pas une agence de communication : nous sommes photographes, et la qualité de l'image est notre promesse.</strong></p>` },
  ] : [
    { title:'What you get', body: sec.benefits },
    { title:'Who is it for? Five universes, ten places each', body: `${sec.universes}<p style="margin-top:6px">A maximum of <strong>60 founding partners</strong>. Once places are filled, new applications join a waiting list.</p>` },
    { title:'How it works', body: `${sec.steps}<p style="margin-top:18px">Each application is assessed on the quality of your work and its fit with the Bunkaio universe: selected, compatible (one-off) or redirected according to your needs.</p>` },
    { title:'Why Bunkaio exists', body:`<p>Bunkaio is a <strong>professional photography studio</strong>. Our craft: producing premium, high-definition images that showcase your project — portrait, fashion, products, events, weddings.</p><p>Every shoot is planned, lit and retouched with care, for premium content ready to be published, printed or shared.</p><p><strong>We are not a communications agency: we are photographers, and image quality is our promise.</strong></p>` },
  ];
  renderAccordionInto('partnersAccordion', sections, { exclusive: true });
}
function openPartnersAccordion(i){
  const el = document.getElementById('partnersAccordion');
  if (!el) return;
  const trig = el.querySelectorAll('.accordion-trigger')[i];
  if (trig && trig.getAttribute('aria-expanded') !== 'true') toggleAccordion(trig, false);
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ═══════════════ CARROUSEL TÉMOIGNAGES — autoplay en boucle ═══════════════ */
let _testiPaused = false;
let _testiResumeTO = null;

function testiPauseTemp(ms){
  _testiPaused = true;
  clearTimeout(_testiResumeTO);
  _testiResumeTO = setTimeout(() => { _testiPaused = false; }, ms);
}

function testiScroll(dir){
  const track = document.getElementById('testiCarousel');
  if (!track) return;
  const card = track.querySelector('.testi-card');
  const amount = (card ? card.offsetWidth : 340) + 20;
  track.scrollBy({ left: dir * amount, behavior: 'smooth' });
  testiPauseTemp(6000);
}

function testiAutoStep(){
  if (_testiPaused) return;
  const track = document.getElementById('testiCarousel');
  if (!track) return;
  const card = track.querySelector('.testi-card');
  const amount = (card ? card.offsetWidth : 340) + 20;
  const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + amount, behavior: 'smooth' });
}

function initTestiAutoplay(){
  const track = document.getElementById('testiCarousel');
  if (!track) return;
  setInterval(testiAutoStep, 4500);
  /* Desktop : pause au survol souris */
  track.addEventListener('mouseenter', () => { _testiPaused = true; });
  track.addEventListener('mouseleave', () => { _testiPaused = false; });
  /* Mobile : pause quand l'utilisateur interagit avec le carrousel,
     reprise automatique après un temps d'inactivité */
  track.addEventListener('touchstart', () => testiPauseTemp(5000), { passive: true });
}

/* Anime l'ouverture/fermeture avec la hauteur réelle du contenu (et non un max-height de 6000 px,
   qui retardait la fermeture et décalait la page). */
function setAccordionOpen(trigger, body, open){
  trigger.setAttribute('aria-expanded', String(open));
  if (open) {
    body.classList.add('open');
    body.style.maxHeight = body.scrollHeight + 'px';
    setTimeout(() => { if (body.classList.contains('open')) body.style.maxHeight = ''; }, 760);
  } else {
    body.style.maxHeight = body.scrollHeight + 'px';
    void body.offsetHeight;
    body.classList.remove('open');
    body.style.maxHeight = '';
  }
}

function toggleAccordion(btn, pin){
  const body = btn.nextElementSibling;
  const open = body.classList.contains('open');
  /* Position du bouton cliqué : on la garde fixe à l'écran pendant l'animation, sinon la fermeture
     d'un item situé au-dessus fait « sauter » la page (surtout sur mobile). */
  const top0 = btn.getBoundingClientRect().top;
  /* Accordéon « exclusif » : ouvrir un item referme les autres, pour garder
     une page courte et dynamique. */
  const group = btn.closest('.accordion-item')?.parentElement;
  if (!open && group && group.dataset.exclusive) {
    group.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach(t => setAccordionOpen(t, t.nextElementSibling, false));
  }
  setAccordionOpen(btn, body, !open);
  if (pin === false) return;
  const t0 = performance.now();
  const hold = now => {
    const d = btn.getBoundingClientRect().top - top0;
    if (Math.abs(d) > 0.5) window.scrollBy({ top: d, behavior: 'instant' });
    if (now - t0 < 800) requestAnimationFrame(hold);
  };
  requestAnimationFrame(hold);
}

/* ═══════════════ FAQ & POLITIQUE DE CONFIDENTIALITÉ ═══════════════ */
function setLegalTab(tab, fromRoute){
  ['faq', 'privacy', 'cgv'].forEach(k => {
    document.getElementById('legaltab-' + k).classList.toggle('active', tab === k);
    document.getElementById('lsec-' + k).style.display = tab === k ? 'block' : 'none';
  });
  /* Chaque onglet a sa propre adresse : /faq/, /confidentialite/ et /conditions-generales-de-vente/ */
  const h1 = document.querySelector('#view-legal h1');
  if (h1) { const key = tab === 'privacy' ? 'legal-title-privacy' : tab === 'cgv' ? 'legal-title-cgv' : 'legal-title'; h1.setAttribute('data-lang', key); h1.innerHTML = I18N[LANG][key]; }
  if (!fromRoute) {
    currentSub = tab === 'faq' ? null : tab;
    const route = seoRouteFor('legal', currentSub);
    if (route && location.pathname !== route.path) history.pushState({ v: 'legal' }, '', route.path);
    applySeoMeta('legal', currentSub);
    if (window.track) track('pageview');
  }
}

function renderAccordionInto(elId, sections, opts){
  const el = document.getElementById(elId);
  if (!el) return;
  if (opts && opts.exclusive) el.dataset.exclusive = '1';
  const openFirst = !(opts && opts.closed);
  el.innerHTML = sections.map((s, i) => `
    <div class="accordion-item">
      <button class="accordion-trigger" aria-expanded="${i === 0 && openFirst ? 'true' : 'false'}" onclick="toggleAccordion(this)">
        <span>${s.title}</span>
        <span class="accordion-chevron"><svg viewBox="0 0 24 24" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></span>
      </button>
      <div class="accordion-body ${i === 0 && openFirst ? 'open' : ''}">
        <div class="accordion-content" style="font-size:14px;line-height:1.9;color:#3a3544">${s.body}</div>
      </div>
    </div>`).join('');
}

function renderFaqAccordion(){
  const sections = LANG === 'fr' ? [
    { title:'Quelles prestations proposez-vous ?', body:`<p>Bunkaio est un photographe professionnel : nous produisons des images haut de gamme, en HD, pour <strong>portrait & lifestyle</strong>, <strong>mode, agences et mannequins</strong>, <strong>commercial & produits</strong>, <strong>événementiel</strong>, et <strong>Lumen</strong>, le photobooth IA pour mariages. Chaque univers a ses formules détaillées dans notre <strong>catalogue & prix</strong>.</p>` },
    { title:'Quelle est la qualité des images livrées ?', body:`<p>Des photos <strong>haute définition, retouchées</strong> avec soin, prêtes à être publiées ou imprimées. Elles sont livrées dans une <strong>galerie privée</strong> à télécharger depuis votre espace client, et vous disposez des droits d'utilisation commerciale.</p>` },
    { title:'Comment se déroule une prestation, de la demande à la livraison ?', body:`<p>Quatre étapes simples : <strong>devis</strong> personnalisé sous 48h, <strong>shooting</strong> à la date convenue, <strong>post-production</strong> (tri, retouche, montage), puis <strong>livraison</strong> de vos visuels via votre espace client. Le détail complet est dans l'onglet « Devis & déroulé » de la page Services.</p>` },
    { title:'Je ne suis pas à l\'aise devant l\'objectif, est-ce un problème ?', body:`<p>Pas du tout : c'est notre rôle de vous mettre en confiance. Nous vous guidons sur les poses et l'ambiance pour obtenir des photos qui vous ressemblent vraiment. Pour vous préparer, consultez notre guide <a href="/conseils/preparer-seance-photo-portrait/" data-nav="article:preparer-seance-photo-portrait">Préparer sa séance photo portrait</a>.</p>` },
    { title:'Quels sont les délais de livraison ?', body:`<p>Ils varient selon la formule choisie et sont indiqués sur chaque offre du catalogue. Ils démarrent à la date du shooting, hors demandes de retouches complémentaires.</p>` },
    { title:'Comment fonctionne le paiement ?', body:`<p>30 % à la commande (signature du devis), solde à la livraison. Paiement par carte bancaire, ou en 3x sans frais avec Klarna.</p>` },
    { title:'Que se passe-t-il si j\'annule ma prestation ?', body:`<p>Votre date et votre créneau sont réservés dès la validation du devis et le versement de l'<strong>acompte de 30 %</strong>. Si vous annulez après cette validation, <strong>l'acompte reste acquis à Bunkaio et n'est pas remboursé</strong>. Pour toute difficulté, contactez-nous le plus tôt possible.</p>` },
    { title:'Puis-je utiliser les visuels pour un usage commercial ?', body:`<p>Oui. L'ensemble des droits d'utilisation des visuels livrés vous est cédé pour un usage commercial, sans limite de durée. Le détail des droits cédés est précisé dans l'onglet « Politique de confidentialité » ci-contre.</p>` },
    { title:'Comment accéder à mon espace client, et à quoi sert-il ?', body:`<p>Une fois votre devis confirmé, vous recevez par email votre <strong>code d'accès personnel</strong> : cliquez sur « Connexion » en haut du site. Vous restez connecté sur votre appareil jusqu'à votre déconnexion.</p><p>Vous y suivez l'avancement de votre projet, retrouvez vos <strong>commandes, devis, paiements et factures</strong>, téléchargez vos livrables, gérez vos abonnements et vos informations. Pas encore de code ? Demandez-le depuis la page de connexion : il vous est envoyé sous 24h.</p>` },
    { title:'Qu\'est-ce qu\'un moodboard, et est-il obligatoire ?', body:`<p>Non, il est facultatif mais très utile : un <strong>moodboard par commande</strong> pour nous partager votre vision — direction artistique, ambiance, palette de couleurs, inspirations (Pinterest, liens), et les prestataires impliqués. Vous le complétez depuis votre espace client et vous échangez avec l'équipe grâce aux commentaires.</p>` },
    { title:'Mes informations et mes images sont-elles en sécurité ?', body:`<p>Votre espace est protégé par votre email et un <strong>code d'accès personnel</strong>, conservé sous forme chiffrée. Vos données ne servent qu'à la réalisation de votre projet, et vos visuels vous sont livrés dans une galerie privée. Le détail est dans l'onglet « Politique de confidentialité ».</p>` },
    { title:'Où intervenez-vous ?', body:`<p>BUNKAIO est basé à <strong>Montpellier</strong> et intervient en déplacement à <strong>Montpellier, Béziers et Toulouse</strong>, et plus largement en Occitanie. Il n'y a pas de studio fixe : le lieu se choisit avec vous (<a href="/conseils/lieux-seance-photo-montpellier-beziers-toulouse/" data-nav="article:lieux-seance-photo-montpellier-beziers-toulouse">idées de lieux</a>). ${TRAVEL_TXT.fr.full}</p>` },
    { title:'Comment devenir partenaire, et que propose l\'espace partenaire ?', body:`<p>Candidatez depuis la page <strong>Partenariat et collaboration</strong> : réponse personnalisée sous 5 jours ouvrés. Une fois admis, votre espace partenaire vous donne <strong>-20 % permanent</strong> sur le catalogue, des promotions, des <strong>missions collaboratives rémunérées</strong> que vous acceptez ou déclinez en un clic, et l'accès au réseau de professionnels. Vous choisissez d'être référencé·e ou non dans l'annuaire.</p>` },
    { title:'Qu\'est-ce que Lumen by Bunkaio ?', body:`<p>Lumen est le photobooth IA de Bunkaio, conçu pour les mariages haut de gamme et les événements, et proposé en location pour la durée de votre événement : il offre aux invités une expérience mémorable et aux mariés des souvenirs durables. Quatre formules — Découverte (2 h), Essentiel, Signature et Sur-mesure — selon la durée et la personnalisation souhaitées.</p>` },
  ] : [
    { title:'What services do you offer?', body:`<p>Bunkaio is a professional photographer: we produce premium, high-definition images for <strong>portrait & lifestyle</strong>, <strong>fashion, agencies and models</strong>, <strong>commercial & products</strong>, <strong>events</strong>, and <strong>Lumen</strong>, the AI photobooth for weddings. Each universe has its packages detailed in our <strong>catalogue & rates</strong>.</p>` },
    { title:'What is the quality of the delivered images?', body:`<p><strong>High-definition, carefully retouched</strong> photos, ready to publish or print. They are delivered in a <strong>private gallery</strong> you can download from your client area, with commercial usage rights.</p>` },
    { title:'How does a project run, from request to delivery?', body:`<p>Four simple steps: a personalised <strong>quote</strong> within 48h, the <strong>shoot</strong> on the agreed date, <strong>post-production</strong> (selection, retouching, editing), then <strong>delivery</strong> via your client area. Full details are under the "Quote & process" tab on the Services page.</p>` },
    { title:'I\'m not comfortable in front of the camera — is that a problem?', body:`<p>Not at all: it's our job to put you at ease. We guide you on poses and mood so the photos truly look like you. To get ready, see our guide <a href="/conseils/preparer-seance-photo-portrait/" data-nav="article:preparer-seance-photo-portrait">Preparing your portrait photo session</a> (in French).</p>` },
    { title:'What are the delivery times?', body:`<p>They depend on the package chosen and are shown on each catalogue offer. They start from the shoot date, excluding any additional retouching requests.</p>` },
    { title:'How does payment work?', body:`<p>30% upon booking (quote signature), balance on delivery. Pay by card, or in 3 interest-free instalments with Klarna.</p>` },
    { title:'What happens if I cancel my booking?', body:`<p>Your date and time slot are reserved once the quote is accepted and the <strong>30% deposit</strong> is paid. If you cancel after that point, <strong>the deposit is retained by Bunkaio and is non-refundable</strong>. If you run into any difficulty, please contact us as early as possible.</p>` },
    { title:'Can I use the visuals for commercial purposes?', body:`<p>Yes. All usage rights to the delivered visuals are transferred to you for commercial use, with no time limit. Details are set out in the "Privacy policy" tab opposite.</p>` },
    { title:'How do I access my client area, and what is it for?', body:`<p>Once your quote is confirmed, you receive your <strong>personal access code</strong> by email: click "Sign in" at the top of the site. You stay signed in on your device until you sign out.</p><p>There you follow your project's progress, find your <strong>orders, quotes, payments and invoices</strong>, download your deliverables, and manage your subscriptions and details. No code yet? Request it from the sign-in page: it is sent within 24h.</p>` },
    { title:'What is a moodboard, and is it compulsory?', body:`<p>No, it is optional but very useful: <strong>one moodboard per order</strong> to share your vision — art direction, mood, colour palette, inspiration (Pinterest, links) and the providers involved. You complete it from your client area and chat with the team through comments.</p>` },
    { title:'Are my details and images safe?', body:`<p>Your space is protected by your email and a <strong>personal access code</strong>, stored in encrypted form. Your data is only used to carry out your project, and your visuals are delivered in a private gallery. Details are in the "Privacy policy" tab.</p>` },
    { title:'Where do you work?', body:`<p>BUNKAIO is based in <strong>Montpellier</strong> and travels to <strong>Montpellier, Béziers and Toulouse</strong>, and more broadly across Occitanie. ${TRAVEL_TXT.en.full}</p>` },
    { title:'How do I become a partner, and what does the partner area offer?', body:`<p>Apply from the <strong>Partnership & collaboration</strong> page: a personal reply within 5 working days. Once admitted, your partner area gives you a <strong>permanent 20% discount</strong> on the catalogue, promotions, <strong>paid collaborative missions</strong> you accept or decline in one click, and access to the professional network. You choose whether to be listed in the directory.</p>` },
    { title:'What is Lumen by Bunkaio?', body:`<p>Lumen is Bunkaio's AI photobooth, designed for luxury weddings and events and available for rental for the duration of your event: it gives guests a memorable experience and couples lasting memories. Four packages — Starter (2 h), Essentials, Signature and Bespoke — depending on duration and customisation.</p>` },
  ];
  renderAccordionInto('faqAccordion', sections, { exclusive: true });
}

function renderPrivacyAccordion(){
  const sections = LANG === 'fr' ? [
    { title:'Responsable du traitement des données', body:`<p>Ce site est édité par <strong>BUNKAIO</strong>, Entreprise Individuelle, SIRET 951 547 587 00034, France. Pour toute question relative à vos données personnelles, contactez-nous à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Éditeur et hébergement', body:`<p><strong>Éditeur :</strong> BUNKAIO, Entreprise Individuelle (Aya Nascimento), SIRET 951 547 587 00034, France. <strong>Contact :</strong> <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a> · <a href="tel:+33758573161">07 58 57 31 61</a>. <strong>Responsable de la publication :</strong> Aya Nascimento.</p><p><strong>Hébergement du site :</strong> GitHub Pages (GitHub, Inc., San Francisco, États-Unis). <strong>Gestion du domaine et services applicatifs :</strong> Cloudflare, Inc. (San Francisco, États-Unis).</p>` },
    { title:'Données collectées et finalités', body:`<p>Nous collectons uniquement les données que vous nous transmettez volontairement : nom, email, téléphone et informations relatives à votre projet via le formulaire de contact, le questionnaire de devis ou votre espace client/partenaire.</p><p>Ces données sont utilisées exclusivement pour répondre à vos demandes, établir vos devis et gérer votre compte. Votre numéro de téléphone peut servir à vous prévenir par SMS de l'avancement de votre commande (photos disponibles, accès à l'album, rappel de séance) ; vous pouvez refuser ces SMS à tout moment en nous écrivant. Elles ne sont ni vendues, ni cédées, ni partagées avec des tiers à des fins commerciales.</p>` },
    { title:'Base légale et durée de conservation', body:`<p>Le traitement repose sur l'exécution de la relation commerciale ou précontractuelle (devis, prestation) et sur notre intérêt légitime à répondre à vos demandes.</p><p>Vos données sont conservées pendant la durée de la relation commerciale, puis archivées le temps imposé par nos obligations légales et comptables, avant suppression ou anonymisation. Les messages envoyés via les formulaires du site sont conservés au plus 3 ans après leur réception.</p>` },
    { title:'Cookies et mesure d\'audience', body:`<p>Ce site n'utilise aucun cookie publicitaire ni traceur tiers. Nous mesurons l'audience de façon <strong>anonyme et sans cookie</strong>, avec un outil développé et hébergé par nos soins (sur notre compte Cloudflare) : pages vues, domaine de provenance, type d'appareil et clics sur les boutons principaux. Aucune adresse IP ni identifiant n'est conservé, aucune donnée n'est transmise à un service de mesure tiers, et les données sont supprimées au bout de 13 mois.</p><p>Cette mesure respecte l'option « Ne pas me suivre » de votre navigateur. Vous pouvez aussi la désactiver sur cet appareil : <button type="button" class="pt-link" onclick="toggleTracking()">Activer / désactiver la mesure</button> <span id="trackToggleState" style="font-size:12px;color:var(--grey)"></span></p>` },
    { title:'Vos droits', body:`<p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données.</p><p>Vous pouvez exercer ces droits à tout moment en écrivant à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>. Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>).</p>` },
    { title:'Hébergement et sécurité des données', body:`<p>Ce site est hébergé par GitHub, Inc. Les échanges sont sécurisés (HTTPS). Aucune base de données client n'est publiquement accessible : les informations transmises via nos formulaires sont traitées de façon confidentielle par BUNKAIO.</p>` },
    { title:'Politique d\'annulation et acompte', body:`<p>L'<strong>acompte de 30 %</strong> versé à la signature du devis réserve votre date et votre créneau. En cas d'<strong>annulation de votre part après la validation du devis</strong>, cet acompte reste acquis à BUNKAIO et n'est pas remboursé. Le solde n'est exigible qu'à la livraison des livrables.</p><p>Pour toute question, écrivez-nous à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Droits d\'auteur et droits d\'utilisation des photos & vidéos', body:`<p>BUNKAIO conserve l'intégralité de ses droits d'auteur (droit moral) sur l'ensemble des photographies et vidéos qu'elle réalise, conformément au Code de la propriété intellectuelle.</p><p>Les <strong>droits d'exploitation</strong> (droits d'utilisation commerciale) des visuels livrés sont cédés au client dans les conditions précisées au devis signé (usages, durée, territoire). La cession des droits d'utilisation est subordonnée au paiement intégral du prix.</p><p>BUNKAIO se réserve le droit d'utiliser les visuels produits dans le cadre de ses propres supports de communication, de son portfolio et de ses réseaux sociaux, sauf demande contraire et écrite du client. Toute réutilisation par un tiers autre que le client nécessite l'autorisation écrite préalable de BUNKAIO.</p>` },
    { title:'Mentions légales', body:`<p><strong>Éditeur du site :</strong> BUNKAIO, Entreprise Individuelle — SIRET 951 547 587 00034 — France. Contact : <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a> — 07 58 57 31 61.</p><p><strong>Hébergement :</strong> GitHub, Inc.</p><p><strong>Propriété intellectuelle :</strong> le contenu de ce site (textes, identité visuelle, code) est la propriété de BUNKAIO, sauf mention contraire, et ne peut être reproduit sans autorisation préalable.</p><p><strong>TVA :</strong> TVA non applicable, art. 293 B du CGI (franchise en base). Les prix affichés sur le site sont des prix nets, sans TVA à ajouter.</p><p><strong>Droit applicable :</strong> le présent site est soumis au droit français ; tout litige relève de la compétence des tribunaux français.</p><p><strong>Médiation de la consommation :</strong> ${mediationLine('fr')}</p><p>Les conditions applicables aux prestations sont détaillées dans nos <a href="/conditions-generales-de-vente/" onclick="return navLink(event,'legal','cgv')">conditions générales de vente</a>.</p>` },
  ] : [
    { title:'Data controller', body:`<p>This site is published by <strong>BUNKAIO</strong>, a French sole proprietorship (Entreprise Individuelle), SIRET 951 547 587 00034, France. For any question regarding your personal data, contact us at <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Publisher and hosting', body:`<p><strong>Publisher:</strong> BUNKAIO, sole proprietorship (Aya Nascimento), SIRET 951 547 587 00034, France. <strong>Contact:</strong> <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a> · <a href="tel:+33758573161">07 58 57 31 61</a>. <strong>Publication manager:</strong> Aya Nascimento.</p><p><strong>Site hosting:</strong> GitHub Pages (GitHub, Inc., San Francisco, United States). <strong>Domain management and application services:</strong> Cloudflare, Inc. (San Francisco, United States).</p>` },
    { title:'Data collected and purposes', body:`<p>We only collect the data you voluntarily provide: name, email, phone number and project details, via the contact form, the quote questionnaire, or your client/partner area.</p><p>This data is used exclusively to respond to your enquiries, prepare your quotes and manage your account. Your phone number may be used to notify you by SMS about your order (photos available, album access, session reminder); you can opt out at any time by writing to us. It is never sold, transferred or shared with third parties for commercial purposes.</p>` },
    { title:'Legal basis and retention period', body:`<p>Processing is based on the performance of the (pre-)contractual relationship (quote, service) and on our legitimate interest in responding to your requests.</p><p>Your data is kept for the duration of the business relationship, then archived for the period required by our legal and accounting obligations, before deletion or anonymisation. Messages sent through the site's forms are kept for up to 3 years after receipt.</p>` },
    { title:'Cookies and audience measurement', body:`<p>This site uses no advertising cookies and no third-party trackers. We measure audience <strong>anonymously and without cookies</strong>, with a tool built and hosted by us (on our own Cloudflare account): page views, referring domain, device type and clicks on the main buttons. No IP address or identifier is kept, no data is shared with a third-party measurement service, and data is deleted after 13 months.</p><p>This measurement honours your browser's "Do Not Track" setting. You can also turn it off on this device: <button type="button" class="pt-link" onclick="toggleTracking()">Turn measurement on / off</button> <span id="trackToggleState" style="font-size:12px;color:var(--grey)"></span></p>` },
    { title:'Your rights', body:`<p>In accordance with the GDPR and French data protection law, you have the right to access, rectify, erase, restrict, object to, and port your data.</p><p>You may exercise these rights at any time by writing to <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>. You also have the right to lodge a complaint with the CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>).</p>` },
    { title:'Hosting and data security', body:`<p>This site is hosted by GitHub, Inc. All exchanges are secured (HTTPS). No client database is publicly accessible: information submitted via our forms is handled confidentially by BUNKAIO.</p>` },
    { title:'Cancellation policy and deposit', body:`<p>The <strong>30% deposit</strong> paid when the quote is signed reserves your date and time slot. If <strong>you cancel after the quote has been accepted</strong>, the deposit is retained by BUNKAIO and is non-refundable. The balance is only due on delivery of the deliverables.</p><p>For any question, write to us at <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Copyright and usage rights for photos & videos', body:`<p>BUNKAIO retains full authorship rights (moral rights) over all photographs and videos it produces, in accordance with French intellectual property law.</p><p>The <strong>exploitation rights</strong> (commercial usage rights) to the delivered visuals are transferred to the client under the terms set out in the signed quote (uses, duration, territory). The assignment of usage rights is subject to payment in full of the price.</p><p>BUNKAIO reserves the right to use the visuals it produces for its own communication materials, portfolio and social media, unless the client requests otherwise in writing. Any reuse by a third party other than the client requires BUNKAIO's prior written authorisation.</p>` },
    { title:'Legal notice', body:`<p><strong>Site publisher:</strong> BUNKAIO, sole proprietorship — SIRET 951 547 587 00034 — France. Contact: <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a> — +33 7 58 57 31 61.</p><p><strong>Hosting:</strong> GitHub, Inc.</p><p><strong>Intellectual property:</strong> the content of this site (text, visual identity, code) is the property of BUNKAIO, unless otherwise stated, and may not be reproduced without prior authorisation.</p><p><strong>VAT:</strong> VAT not applicable, art. 293 B of the French Tax Code (small-business exemption). Prices shown on the site are net prices, with no VAT to add.</p><p><strong>Governing law:</strong> this site is governed by French law; any dispute falls under the jurisdiction of the French courts.</p><p><strong>Consumer mediation:</strong> ${mediationLine('en')}</p><p>The terms applying to our services are detailed in our <a href="/conditions-generales-de-vente/" onclick="return navLink(event,'legal','cgv')">general terms of sale</a>.</p>` },
  ];
  renderAccordionInto('privacyAccordion', sections);
}

/* Médiateur de la consommation (obligatoire pour tout professionnel qui vend à des particuliers, art. L612-1 du Code de la consommation).
   À REMPLIR une fois l'adhésion faite : name (nom du médiateur), site (adresse web), address (adresse postale du médiateur).
   Tant que name est vide, les pages affichent la formulation générique (coordonnées communiquées sur demande). */
const MEDIATEUR = { name: '', site: '', address: '' };

function mediationLine(lang){
  const m = MEDIATEUR;
  if (m.name) {
    const link = m.site ? ` — <a href="${m.site}" target="_blank" rel="noopener">${m.site.replace(/^https?:\/\//, '')}</a>` : '';
    const addr = m.address ? ` (${m.address})` : '';
    return lang === 'fr'
      ? `en cas de litige non résolu avec BUNKAIO, le client consommateur peut saisir gratuitement le médiateur de la consommation dont BUNKAIO relève : <strong>${m.name}</strong>${addr}${link}. Il doit au préalable avoir tenté de résoudre le litige directement auprès de BUNKAIO par une réclamation écrite.`
      : `if a dispute with BUNKAIO remains unresolved, the consumer may refer it free of charge to BUNKAIO's consumer mediator: <strong>${m.name}</strong>${addr}${link}. The consumer must first have tried to settle the matter directly with BUNKAIO by a written complaint.`;
  }
  return lang === 'fr'
    ? `en cas de litige non résolu avec BUNKAIO, le client consommateur peut recourir gratuitement à un médiateur de la consommation, après une première réclamation écrite adressée à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>. Les coordonnées du médiateur sont communiquées sur demande.`
    : `if a dispute with BUNKAIO remains unresolved, the consumer may use a consumer mediator free of charge, after a first written complaint sent to <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>. The mediator's contact details are provided on request.`;
}

function renderCgvAccordion(){
  const sections = LANG === 'fr' ? [
    { title:'1. Objet et champ d\'application', body:`<p>Les présentes conditions générales de vente (CGV) s'appliquent à toutes les prestations de photographie et de vidéo proposées par <strong>BUNKAIO</strong>, Entreprise Individuelle (Aya Nascimento), SIRET 951 547 587 00034, France, à des clients particuliers (consommateurs) comme à des clients professionnels.</p><p>Chaque prestation fait l'objet d'un devis personnalisé. En cas de différence entre les CGV et le devis signé, <strong>le devis signé prévaut</strong>. Toute commande implique l'acceptation des CGV.</p><p><em>Version du 6 octobre 2026.</em></p>` },
    { title:'2. Devis et commande', body:`<p>Le devis est gratuit et valable pendant la durée indiquée sur le document. Il précise la prestation, la date et le lieu prévus, le délai de livraison, le prix, les droits cédés et les conditions particulières.</p><p>La commande est ferme à la <strong>signature électronique</strong> du devis par le client (nom, date, heure, adresse IP et empreinte du devis enregistrés comme preuve). Un exemplaire signé est envoyé par email.</p>` },
    { title:'3. Prix', body:`<p>Les prix sont indiqués en euros. BUNKAIO bénéficie de la franchise en base de TVA : <strong>TVA non applicable, art. 293 B du CGI</strong> : les prix affichés sont des prix nets, sans TVA à ajouter, et correspondent au montant réellement facturé. Le prix applicable est celui du devis signé. Les frais de déplacement éventuels (au-delà de ${TRAVEL_FREE_KM} km autour de Montpellier ou de Béziers, ${TRAVEL_PER_KM} € par km aller-retour) y sont précisés.</p>` },
    { title:'4. Paiement', body:`<p>Sauf mention contraire au devis : un <strong>acompte de 30 %</strong> est payable à la signature (il réserve la date et le créneau) ; le <strong>solde de 70 %</strong> est facturé lorsque les photos sont prêtes, et son règlement donne accès à l'album.</p><p>Moyens de paiement : carte bancaire, ou paiement en 3 fois sans frais avec Klarna selon éligibilité. Les paiements sont traités de façon sécurisée par Stripe ; BUNKAIO ne conserve aucune donnée de carte.</p><p>Abonnement « Studio Continu » : facturation mensuelle par carte bancaire, sans acompte ni solde, dans les conditions précisées au devis.</p><p><strong>Clients professionnels :</strong> tout retard de paiement entraîne de plein droit des pénalités au taux de trois fois le taux d'intérêt légal et une indemnité forfaitaire de recouvrement de 40 € (art. L441-10 du Code de commerce).</p>` },
    { title:'5. Report et annulation', body:`<p>L'acompte réserve la date et le créneau. Une fois le devis validé, il <strong>reste acquis à BUNKAIO et n'est pas remboursé en cas d'annulation par le client</strong>.</p><p>Le client peut reporter la prestation <strong>une fois, sans frais, s'il prévient au moins 7 jours avant</strong> ; au-delà, ou en cas de second report, un nouvel acompte peut être demandé.</p><p>En cas d'empêchement de BUNKAIO ou de force majeure (maladie, météo pour une séance en extérieur), la prestation est reportée sans frais à une date convenue ensemble.</p>` },
    { title:'6. Réalisation et livraison', body:`<p>BUNKAIO réalise la prestation avec soin et dispose de la liberté artistique dans le cadre convenu. Le client veille à être présent, à l'heure et à fournir les informations nécessaires.</p><p>Les visuels sont livrés dans un <strong>album privé Adobe Lightroom</strong> (création d'un compte Adobe Lightroom par le client), dans le délai indiqué au devis. Un aller-retour de corrections est inclus ; les demandes supplémentaires sont facturées selon un tarif convenu à l'avance.</p><p>BUNKAIO sélectionne et retouche les visuels livrés ; les fichiers non retenus et les fichiers sources (RAW) ne sont pas cédés. Les fichiers livrés sont conservés <strong>12 mois</strong> après la livraison : le client est invité à les exporter et à les sauvegarder.</p>` },
    { title:'7. Droits d\'auteur et cession', body:`<p>BUNKAIO conserve l'intégralité de ses droits d'auteur, y compris le droit moral. Les droits d'utilisation (reproduction et représentation) sont cédés au client dans les limites précisées au devis : <strong>destination, étendue, territoire et durée</strong> (art. L131-3 du Code de la propriété intellectuelle). Tout usage non prévu nécessite un accord écrit préalable.</p><p><strong>La cession est subordonnée au paiement intégral du prix.</strong> Le client demande, dans la mesure du possible, la mention « Photo : BUNKAIO » lors de toute publication, et s'interdit de dénaturer les visuels (recadrages et déclinaisons de format autorisés).</p><p>Le client choisit à la signature d'autoriser ou non BUNKAIO à utiliser les visuels pour son portfolio et sa communication ; ce choix n'a aucune incidence sur la prestation ni sur le prix.</p>` },
    { title:'8. Droit de rétractation (consommateurs)', body:`<p>Le client consommateur dispose de <strong>14 jours à compter de la signature du devis</strong> pour se rétracter, sans motif, en écrivant à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p><p>Si la prestation est prévue avant la fin de ce délai, le client peut demander expressément (case à cocher à la signature) qu'elle commence avant son expiration. S'il se rétracte après le début de la prestation, il paie la part déjà exécutée ; il perd son droit de rétractation une fois la prestation pleinement exécutée, avec son accord préalable exprès et sa renonciation à ce droit.</p><p>Ce droit ne s'applique pas aux clients professionnels agissant dans le cadre de leur activité.</p>` },
    { title:'9. Responsabilité', body:`<p>BUNKAIO est tenue d'une obligation de moyens. Elle est responsable des dommages résultant de sa faute dans les conditions du droit commun ; <strong>à l'égard des clients professionnels</strong>, sa responsabilité est limitée au montant de la prestation, hors faute lourde ou dolosive. Elle ne répond pas des retards ou impossibilités dus à un cas de force majeure.</p><p>En cas de perte ou de détérioration des fichiers non imputable à BUNKAIO après le délai de conservation, aucune responsabilité ne peut lui être imputée.</p>` },
    { title:'10. Données personnelles', body:`<p>Les données collectées servent uniquement à la gestion de votre devis, de votre prestation et de la relation commerciale. Pour en savoir plus et exercer vos droits, consultez notre <a href="/confidentialite/" onclick="return navLink(event,'legal','privacy')">politique de confidentialité</a>.</p>` },
    { title:'11. Médiation de la consommation', body:`<p>Pour toute réclamation, écrivez d'abord à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a> : nous nous engageons à vous répondre rapidement.</p><p>${mediationLine('fr')}</p>` },
    { title:'12. Droit applicable et litiges', body:`<p>Les CGV sont soumises au droit français. Le client consommateur peut saisir, au choix, la juridiction du lieu où il demeurait au moment de la conclusion du contrat ou de la survenance du fait dommageable. Pour les clients professionnels, à défaut d'accord amiable, les tribunaux français compétents seront saisis.</p>` },
  ] : [
    { title:'1. Purpose and scope', body:`<p>These general terms of sale apply to all photography and video services provided by <strong>BUNKAIO</strong>, a French sole proprietorship (Aya Nascimento), SIRET 951 547 587 00034, France, to private clients (consumers) as well as business clients.</p><p>Each service is covered by a personalised quote. If these terms differ from the signed quote, <strong>the signed quote prevails</strong>. Placing an order implies acceptance of these terms.</p><p><em>Version of 6 October 2026.</em></p>` },
    { title:'2. Quote and order', body:`<p>The quote is free and valid for the period stated on the document. It specifies the service, the planned date and place, the delivery time, the price, the rights granted and any special conditions.</p><p>The order becomes binding when the client <strong>signs the quote electronically</strong> (name, date, time, IP address and quote fingerprint are recorded as proof). A signed copy is sent by email.</p>` },
    { title:'3. Prices', body:`<p>Prices are in euros. BUNKAIO benefits from the French VAT exemption for small businesses: <strong>VAT not applicable, art. 293 B of the French Tax Code (CGI)</strong>; the prices shown are net prices, with no VAT to add, and match the amount actually invoiced. The price that applies is the one on the signed quote. Any travel costs (beyond ${TRAVEL_FREE_KM} km around Montpellier or Béziers, €0.60 per km round trip) are specified in it.</p>` },
    { title:'4. Payment', body:`<p>Unless the quote says otherwise: a <strong>30% deposit</strong> is payable on signature (it reserves the date and time slot); the <strong>70% balance</strong> is invoiced once the photos are ready, and paying it gives access to the album.</p><p>Payment methods: bank card, or interest-free payment in 3 instalments with Klarna, subject to eligibility. Payments are processed securely by Stripe; BUNKAIO does not store any card data.</p><p>"Studio Continu" subscription: monthly billing by bank card, with no deposit or balance, under the conditions set out in the quote.</p><p><strong>Business clients:</strong> any late payment automatically incurs penalties at three times the legal interest rate and a flat recovery fee of €40 (art. L441-10 of the French Commercial Code).</p>` },
    { title:'5. Rescheduling and cancellation', body:`<p>The deposit reserves the date and time slot. Once the quote is accepted, it is <strong>retained by BUNKAIO and not refunded if the client cancels</strong>.</p><p>The client may reschedule <strong>once, free of charge, with at least 7 days' notice</strong>; beyond that, or for a second rescheduling, a new deposit may be requested.</p><p>If BUNKAIO is unable to attend, or in case of force majeure (illness, weather for an outdoor session), the service is rescheduled free of charge to a date agreed together.</p>` },
    { title:'6. Performance and delivery', body:`<p>BUNKAIO performs the service with care and has artistic freedom within the agreed framework. The client makes sure to be present, on time, and to provide the necessary information.</p><p>Visuals are delivered in a <strong>private Adobe Lightroom album</strong> (the client creates an Adobe Lightroom account), within the time stated in the quote. One round of corrections is included; additional requests are billed at a rate agreed in advance.</p><p>BUNKAIO selects and retouches the delivered visuals; unselected files and source (RAW) files are not transferred. Delivered files are kept for <strong>12 months</strong> after delivery: the client is invited to export and back them up.</p>` },
    { title:'7. Copyright and licence', body:`<p>BUNKAIO retains all of its copyright, including moral rights. Usage rights (reproduction and representation) are granted to the client within the limits set out in the quote: <strong>purpose, scope, territory and duration</strong> (art. L131-3 of the French Intellectual Property Code). Any use not provided for requires prior written agreement.</p><p><strong>The licence is subject to full payment of the price.</strong> The client is asked, where possible, to credit "Photo: BUNKAIO" on any publication, and agrees not to distort the visuals (cropping and format adaptations are allowed).</p><p>On signing, the client chooses whether BUNKAIO may use the visuals for its portfolio and communication; this choice has no effect on the service or the price.</p>` },
    { title:'8. Right of withdrawal (consumers)', body:`<p>A consumer client has <strong>14 days from signing the quote</strong> to withdraw, without giving a reason, by writing to <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p><p>If the service is scheduled before the end of this period, the client may expressly request (tick box on signing) that it starts before the period expires. If they withdraw after the service has started, they pay for the part already performed; the right of withdrawal is lost once the service has been fully performed, with the client's prior express agreement and waiver of that right.</p><p>This right does not apply to business clients acting within their professional activity.</p>` },
    { title:'9. Liability', body:`<p>BUNKAIO has an obligation of best efforts. It is liable for damage resulting from its fault under ordinary law; <strong>towards business clients</strong>, its liability is limited to the amount of the service, except in case of gross negligence or wilful misconduct. It is not liable for delays or impossibility caused by force majeure.</p><p>BUNKAIO cannot be held liable for loss or damage to files not attributable to it after the retention period.</p>` },
    { title:'10. Personal data', body:`<p>The data collected is used only to manage your quote, your service and the commercial relationship. To learn more and exercise your rights, see our <a href="/confidentialite/" onclick="return navLink(event,'legal','privacy')">privacy policy</a>.</p>` },
    { title:'11. Consumer mediation', body:`<p>For any complaint, first write to <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>: we undertake to reply promptly.</p><p>${mediationLine('en')}</p>` },
    { title:'12. Governing law and disputes', body:`<p>These terms are governed by French law. A consumer client may bring proceedings before the court of the place where they lived when the contract was concluded or when the damaging event occurred. For business clients, failing an amicable settlement, the competent French courts will hear the dispute.</p>` },
  ];
  renderAccordionInto('cgvAccordion', sections);
}

/* Chiffres clés « À propos » : décompte animé quand le bandeau entre à l'écran (le HTML garde les valeurs finales pour le SEO). */
let aboutStatsObs = null;
function initAboutStats(){
  const box = document.querySelector('.about-stats');
  if (!box) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nums = box.querySelectorAll('[data-count]');
  const run = () => {
    box.classList.add('is-live');
    if (reduce) return;
    nums.forEach(el => {
      const end = +el.dataset.count, from = +(el.dataset.from || 0), suffix = el.dataset.suffix || '';
      const t0 = performance.now(), dur = 1500;
      const step = now => {
        const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(from + (end - from) * e) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = from + suffix;
      requestAnimationFrame(step);
    });
  };
  box.classList.remove('is-live');
  if (aboutStatsObs) aboutStatsObs.disconnect();
  if (!('IntersectionObserver' in window)) { run(); return; }
  aboutStatsObs = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { aboutStatsObs.disconnect(); run(); } }, { threshold: 0.4 });
  aboutStatsObs.observe(box);
}

/* ═══════════════ LOGO CAROUSEL ═══════════════ */
const PARTNER_LOGOS = [
  { name:'Atelier Blanc',   mark:'<circle cx="12" cy="12" r="9"/><path d="M12 3v18"/>', style:'font-weight:300;letter-spacing:0.28em;text-transform:uppercase' },
  { name:'Maison Cuvée',    mark:'<path d="M12 3c4 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2-6 6-10z"/>', style:'font-family:Georgia,serif;font-weight:700;font-style:italic;letter-spacing:0' },
  { name:'STUDIO FORMA',    mark:'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h16M12 4v16"/>', style:'font-weight:800;letter-spacing:0.12em' },
  { name:'Domaine Vallier', mark:'<path d="M3 19 12 5l9 14z"/>', style:'font-family:Georgia,serif;font-weight:400;letter-spacing:0.08em;text-transform:uppercase' },
  { name:'Label Matière',   mark:'<path d="M5 12a7 7 0 0 1 14 0M5 12a7 7 0 0 0 14 0"/><circle cx="12" cy="12" r="1.6"/>', style:'font-weight:600;letter-spacing:0.02em' },
  { name:'Bloom',           mark:'<circle cx="12" cy="7" r="3"/><circle cx="7" cy="15" r="3"/><circle cx="17" cy="15" r="3"/>', style:'font-weight:700;letter-spacing:0.18em;text-transform:uppercase' },
  { name:'Event & Sens',    mark:'<path d="M12 3l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z"/>', style:'font-weight:500;letter-spacing:0.04em' },
  { name:'Artisans du Sud', mark:'<path d="M4 18c3-8 5-12 8-12s5 4 8 12"/><path d="M8 18h8"/>', style:'font-family:Georgia,serif;font-weight:700;letter-spacing:0.02em' },
  { name:'MARQUE CÉLESTE',  mark:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>', style:'font-weight:300;letter-spacing:0.2em' },
  { name:'Piscines Azur',   mark:'<path d="M3 15c3-3 6 3 9 0s6 3 9 0M3 10c3-3 6 3 9 0s6 3 9 0"/>', style:'font-weight:700;letter-spacing:-0.01em' },
  { name:'Nord & Cie',      mark:'<path d="M6 19V5l12 14V5"/>', style:'font-weight:800;letter-spacing:0.06em;text-transform:uppercase' },
  { name:'Espace Cuisine',  mark:'<path d="M7 4v7a2 2 0 0 0 2 2v7M7 4v5M11 4v5M15 4c-2 2-2 6 0 8v8"/>', style:'font-weight:500;letter-spacing:0.1em;text-transform:uppercase' }
];

function renderLogoCarousel(){
  const el = document.getElementById('logoTrack');
  if (!el) return;
  const make = () => PARTNER_LOGOS.map(l => `
    <div class="logo-item" aria-label="${l.name}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${l.mark}</svg>
      <span style="${l.style}">${l.name}</span>
    </div>`).join('');
  el.innerHTML = make() + make();
}


/* ═══════════════ FOOTER SERVICES ═══════════════ */
function renderFooterServices(){
  const el = document.getElementById('ftServices');
  if (!el) return;
  el.innerHTML = '';
  CATS.forEach(c => {
    const li = document.createElement('li');
    const b = document.createElement('a');
    b.href = servicePath(c.id);
    b.textContent = t(c.name);
    b.onclick = (e) => navLink(e, 'service', c.id);
    li.appendChild(b);
    el.appendChild(li);
  });
}

/* ═══════════════ PAGE BG ═══════════════ */
function setPageBg(viewKey){
  /* Use CSS variable on html::before — works on iOS too */
  const raw = IMG[viewKey] || IMG.home;
  const url = Array.isArray(raw) ? raw[0] : raw;
  if (url) {
    document.documentElement.style.setProperty('--page-bg-url', 'url(' + url + ')');
  } else {
    document.documentElement.style.setProperty('--page-bg-url', 'none');
  }
}

function applyImages(){
  setPageBg('home');
  const devisImg = document.getElementById('img-devis-side');
  if (devisImg) devisImg.src = IMG.devis;
  /* Set initial CSS variable */
  const homeImgs = IMG.heroImages && IMG.heroImages.home;
  const firstUrl = Array.isArray(homeImgs) ? homeImgs[0] : homeImgs;
  if (firstUrl) document.documentElement.style.setProperty('--page-bg-url', 'url(' + firstUrl + ')');
}

/* ═══════════════ INIT ═══════════════ */
renderCats();
renderMissionServices();
initMissionServicesAutoplay();
initHomeLogoFade();
initScrollProgress();
renderLogoCarousel();
renderFooterServices();
/* Hero image home : seulement si la page demandée est l'accueil (sinon la vidéo d'accueil se téléchargeait
   aussi sur /collaboration/, /services/, etc. alors qu'elle n'y est pas visible). Les autres vues l'initialisent via goView. */
{ const _bootRoute = seoRouteForPath(location.pathname); if (!_bootRoute || _bootRoute.view === 'home') initHeroCarousel('home'); }
initHomeClaimVideo();
initTestiAutoplay();
initWhiteScrollHint();
updatePlaceholders();
updateLang();
applyImages();
initReassureLoop();
document.querySelectorAll('.ph').forEach(observe);
document.querySelectorAll('#view-home .rv:not(.reassure-section)').forEach(observe);
document.querySelectorAll('#view-home .reassure-section').forEach(observeLate);
/* Accueil actif par défaut au chargement -> bannière footer masquée */
const _footerCtaInit = document.querySelector('.footer-cta-row');
if (_footerCtaInit) _footerCtaInit.style.display = 'none';
syncNavHeight();
window.addEventListener('resize', () => { syncNavHeight(); if (window.innerWidth > 1180) closeMobileMenu(); });
initHeroScrollFx();
initNavScrollState();

/* Route d'entrée : la page statique servie correspond déjà à la vue ; on
   aligne l'état JavaScript (sans animation de transition). */
(function initRoute(){
  const r = seoRouteForPath(location.pathname);
  const v = r ? r.view : 'home';
  document.body.dataset.view = v;
  history.replaceState({ v }, '', location.pathname + location.hash);
  if (window.track) track('pageview');
  if (v === 'home') { applySeoMeta('home'); return; }
  goView(v === 'account' ? 'login' : v, r ? (r.cat || r.slug || r.sub || null) : null, { initial: true });
})();

restoreSession();


/* Vidéo de fond de la page Prestations : on commence à la télécharger dès que le visiteur montre l'intention
   d'y aller (survol ou toucher d'un lien « Services »), pour qu'elle démarre quasi instantanément à l'ouverture. */
let _svcVideoWarm = false;
function warmServicesVideo(){
  if (_svcVideoWarm || !IMG.servicesVideo || !bgVideoAllowed()) return;
  _svcVideoWarm = true;
  fetch(IMG.servicesVideo, { mode: 'cors', credentials: 'omit' }).then(r => r.ok ? r.blob() : null).catch(() => {});
}
['pointerover', 'touchstart'].forEach(ev => document.addEventListener(ev, (e) => {
  const el = e.target && e.target.closest ? e.target.closest('[onclick*="\'services\'"], [data-nav="services"], a[href="/services/"]') : null;
  if (el) warmServicesVideo();
}, { passive: true }));
