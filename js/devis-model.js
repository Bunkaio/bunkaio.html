/* ═══════════════ MODÈLE DE DEVIS BUNKAIO ═══════════════
   Partagé entre l'administration (création, aperçu) et la page de
   signature client (/signature/). Les modèles ci-dessous ne servent
   qu'à pré-remplir un nouveau devis : une fois créé, le devis stocke
   ses propres textes et s'affiche toujours à l'identique, même si ce
   fichier évolue ensuite. Clauses rédigées comme usages courants :
   à faire valider par un juriste ou le comptable. */
(function (root) {
  'use strict';

  var COMMON_REAL = [
    "Choix des visuels : BUNKAIO sélectionne et retouche les visuels livrés. Les fichiers non retenus et les fichiers sources (RAW) ne sont pas cédés.",
    "Respect de l'œuvre : les visuels ne peuvent être dénaturés ou retouchés de façon portant atteinte à l'œuvre sans accord de l'auteur ; recadrages et déclinaisons de format sont autorisés.",
    "Conservation : BUNKAIO conserve les fichiers livrés pendant 12 mois après la livraison ; le client est invité à les exporter et à les sauvegarder.",
    "Responsabilité : la responsabilité de BUNKAIO est limitée au montant de la prestation, hors faute lourde ou dolosive."
  ];

  var REPORT_STD = "L'acompte réserve la date et le créneau. Une fois le devis validé, il reste acquis à BUNKAIO et n'est pas remboursé en cas d'annulation par le client. Le client peut reporter la prestation une fois, sans frais, s'il prévient au moins 7 jours avant ; au-delà, ou en cas de second report, un nouvel acompte peut être demandé. En cas d'empêchement de BUNKAIO ou de force majeure (maladie, météo pour l'extérieur), la prestation est reportée sans frais à une date convenue ensemble.";

  var TEMPLATES = {
    part: { label: 'Séance photo — particuliers', profil: 'particulier', category: /particulier|portrait & lifestyle/i,
      prestation: 'Séance photo', contenuHint: 'Durée de séance, nombre de visuels retouchés, tenues, lieu studio ou extérieur, options',
      delai: 'jours ouvrés à compter de la date du shooting',
      destination: "Usage personnel et familial : partage avec les proches, réseaux sociaux personnels, tirages et objets pour un usage privé. Sont exclus, sauf accord écrit : tout usage commercial ou publicitaire, revente, cession à des tiers.",
      duree: 'Illimitée (usage personnel)',
      real: [
        "Séance en extérieur : en cas d'intempéries, la séance est reportée sans frais à une date convenue ensemble.",
        "Préparation : le client peut créer son moodboard dans son espace client pour partager son ambiance et ses inspirations.",
        "Mineurs : un représentant légal est présent et signe le devis ; il consent à la prise de vue et à la diffusion prévue.",
        "Prestations partenaires (mise en beauté) : si elles sont proposées, elles sont confiées à des professionnels partenaires et font l'objet d'un devis distinct."
      ] },
    corp: { label: 'Corporate — portraits professionnels', profil: 'professionnel', category: /corporate/i,
      prestation: 'Portraits professionnels', contenuHint: 'Nombre de collaborateurs, durée par personne, fond, nombre de visuels retouchés par personne, formats',
      delai: 'jours ouvrés à compter de la date du shooting',
      destination: "Communication du client : site web, réseaux sociaux (LinkedIn, Instagram…), signatures mail, dossiers de presse, plaquettes et supports imprimés de l'entreprise, annuaires internes. Sont exclus, sauf accord écrit : revente ou cession à des tiers, publicité nationale ou affichage grand format.",
      duree: '5 ans à compter de la livraison',
      real: [
        "Collaborateurs : le client s'assure que chaque personne photographiée accepte la prise de vue et l'usage prévu ; il est responsable des autorisations de ses salariés.",
        "Usage individuel : chaque personne photographiée peut utiliser son portrait pour son usage professionnel personnel (profil en ligne, CV).",
        "Planning : le client communique la liste et les créneaux de passage ; tout retard important peut réduire le nombre de portraits réalisés sans modifier le prix.",
        "Départ d'un collaborateur : le client cesse d'utiliser son portrait dans un délai raisonnable à sa demande, conformément au droit à l'image."
      ] },
    /* Formule Lancement (Personal Branding) : une personne, ses propres supports ; droits alignés sur ce que le site annonce
       (« droits d'utilisation commerciale sans limite de durée »). Clauses à faire valider comme les autres modèles. */
    brand: { label: 'Personal Branding — Lancement (entrepreneurs)', profil: 'professionnel', category: /Personal Branding|lancement/i,
      prestation: 'Shooting Personal Branding — formule Lancement', contenuHint: "1h30 de shooting (studio ou dans les locaux du client), 2 tenues, 2 ambiances ou mises en situation, 12 photos HD retouchées, brief préparatoire, conseils tenues et attitudes, direction de pose, sélection guidée, galerie privée, formats web et réseaux",
      delai: 'jours ouvrés à compter de la date du shooting',
      destination: "Communication professionnelle du client et de son activité : site web, réseaux sociaux, fiche Google, newsletters, presse, dossiers commerciaux, présentations, supports imprimés et publicité du client. Sont exclus, sauf accord écrit : revente ou cession des visuels à des tiers.",
      duree: 'Sans limite de durée',
      real: [
        "Lieu : lorsque le shooting a lieu dans les locaux du client ou dans un lieu qu'il choisit, le client garantit l'accès et l'autorisation de photographier sur place (propriétaire, bailleur, autres occupants).",
        "Personnes et marques visibles : le client informe les personnes présentes (salariés, clients) et obtient leur accord s'ils apparaissent ; il est responsable des marques et œuvres visibles dans son lieu.",
        "Préparation : le brief (activité, usages, tenues, ambiances) est échangé avant la séance, par exemple via le moodboard de l'espace client.",
        "Déplacement : offert dans un rayon de 30 km autour de Montpellier, de Toulouse et dans l\'ouest de l\'Hérault ; au-delà, chiffré sur le présent devis selon la grille publiée sur bunkaio.com."
      ] },
    mode: { label: 'Mode, agence et mannequins', profil: 'professionnel', category: /mode|mannequin/i,
      prestation: 'Shooting mode', contenuHint: 'Studio / extérieur, nombre de tenues, nombre de visuels retouchés, direction artistique, options (Polas : livraison HD sous 24 h)',
      delai: 'jours ouvrés à compter de la date du shooting',
      destination: "Communication de la marque ou du modèle : site web, e-commerce, réseaux sociaux, lookbooks, dossiers de candidature et books d'agence. Sont exclus, sauf accord écrit : publicité nationale, affichage grand format, revente ou cession à des tiers. Les Polas sont des photos brutes destinées exclusivement à la transmission aux agences.",
      duree: '5 ans à compter de la livraison (books et candidatures : sans limite de durée)',
      real: [
        "Autorisation des modèles : le client fournit ou obtient les autorisations d'exploitation de l'image de chaque modèle pour l'usage prévu. Pour un mineur, l'autorisation du représentant légal est obligatoire.",
        "Direction artistique : les visuels suivent le moodboard validé ; un changement important de direction le jour du shooting peut nécessiter un avenant.",
        "Vêtements et accessoires : les pièces fournies par le client restent sous sa responsabilité (transport, assurance) ; BUNKAIO en prend soin pendant la séance.",
        "Studio : l'option studio, lorsqu'elle est choisie, est détaillée et chiffrée dans le présent devis."
      ] },
    prod: { label: 'Commercial & produits', profil: 'professionnel', category: /commercial|produit|immobilier|architecture|artisanat/i,
      prestation: 'Photographie commerciale / produits', contenuHint: 'Nombre de produits ou de lieux, fonds, angles par produit, détourage, formats, nombre de visuels retouchés',
      delai: 'jours ouvrés à compter de la date du shooting',
      destination: "Communication commerciale du client : fiches produits, site e-commerce, places de marché, réseaux sociaux, catalogues, dossiers de presse et publicités en ligne du client. Sont exclus, sauf accord écrit : cession ou revente à des tiers, publicité nationale ou affichage grand format, usage pour des produits autres que ceux photographiés.",
      duree: '5 ans à compter de la livraison',
      real: [
        "Produits confiés : le transport (aller et retour) et l'assurance des produits sont à la charge du client ; BUNKAIO en prend soin pendant la séance et les restitue à son issue.",
        "Lieux (immobilier, architecture) : le client garantit l'accès au lieu et les autorisations de photographier, y compris auprès du propriétaire ou des occupants.",
        "Marques et œuvres tierces : le client est responsable des droits sur les marques, œuvres et éléments visibles sur les produits ou dans les lieux.",
        "Conformité : le client vérifie les visuels (couleurs, mentions) avant leur mise en ligne ; les écarts de rendu entre écrans ne constituent pas un défaut."
      ] },
    evt: { label: 'Événementiel', profil: 'professionnel', category: /événement|evenement|event/i,
      prestation: "Couverture d'événement", contenuHint: "Plage horaire couverte, nombre de visuels livrés, options (film, réseaux)",
      delai: "jours ouvrés à compter de la date de l'événement",
      destination: "Communication de l'organisateur sur l'événement : site web, réseaux sociaux, presse, rapport d'activité, supports imprimés et newsletter. Sont exclus, sauf accord écrit : revente ou cession à des tiers, publicité nationale, usage hors événement.",
      duree: '5 ans à compter de la livraison',
      real: [
        "Plage horaire : la prestation couvre la plage horaire indiquée ; tout dépassement est facturé au tarif convenu à l'avance.",
        "Droit à l'image des participants : l'organisateur informe les participants qu'ils peuvent être photographiés et gère les éventuelles oppositions ; BUNKAIO peut exclure de la livraison une personne qui s'y oppose.",
        "Accès : l'organisateur garantit à BUNKAIO l'accès à tous les lieux utiles (badge, stationnement, repas si la journée est longue).",
        "Imprévus : en cas d'annulation de l'événement par l'organisateur, les conditions d'annulation ci-dessus s'appliquent."
      ] },
    /* Lumen : prototype, modèle inactif (non proposé à la création d'un devis). */
    lumen: { inactive: true, label: 'Photobooth IA Lumen (inactif : prototype)', profil: 'particulier', category: /lumen|photobooth/i,
      prestation: 'Photobooth IA Lumen', contenuHint: "Durée (4 h Découverte, 6 h Signature, sur mesure en Premium), style personnalisé, impressions illimitées incluses, horaires d'installation",
      delai: 'jours ouvrés après l\'événement (7 pour Découverte, 5 pour Signature)',
      destination: "Usage personnel et familial des visuels générés (partage avec les invités et les proches, réseaux sociaux personnels, souvenirs imprimés) ; pour un événement d'entreprise : communication du client sur ses propres supports. Sont exclus, sauf accord écrit : revente, cession à des tiers, usage publicitaire.",
      duree: 'Illimitée pour un usage personnel ; 5 ans pour un client professionnel',
      real: [
        "Installation : le client garantit un emplacement adapté (surface, alimentation électrique, accès, horaires d'installation et de démontage) communiqué avant l'événement.",
        "Images des invités : les invités sont informés de la captation ; les photos générées sont remises au client via la galerie privée. Le client est responsable de l'information de ses invités.",
        "Matériel : le matériel reste la propriété de BUNKAIO ; le client veille à sa bonne utilisation par les invités ; toute dégradation volontaire peut être facturée.",
        "Impressions : les impressions illimitées s'entendent dans la plage horaire de prestation, consommables inclus."
      ] },
    sub: { label: 'Studio Continu (abonnement)', profil: 'particulier', abonnement: true, category: /studio continu/i,
      prestation: 'Studio Continu — Modèles & mannequins', contenuHint: '1 session lifestyle ou lookbook par mois (jusqu\'à 25 photos HD), 2 Reels verticaux par mois, direction artistique continue, options au tarif partenaire (-20 %)',
      delai: 'Livrables remis dans le mois suivant chaque session',
      destination: "Communication personnelle et professionnelle du modèle : réseaux sociaux, book, dossiers de candidature et agences. Sont exclus, sauf accord écrit : publicité nationale, affichage, revente ou cession à des tiers.",
      duree: 'Illimitée pour les visuels livrés (usage lié à la carrière du modèle)',
      real: [
        "Sessions non utilisées : une session mensuelle non consommée n'est pas reportable et n'est pas remboursée.",
        "Engagement et résiliation : l'abonnement comporte un engagement minimum de 6 mois (comme indiqué sur bunkaio.com) ; au-delà, le client peut y mettre fin pour la période suivante en prévenant avant le renouvellement.",
        "Mineurs : l'autorisation du représentant légal est obligatoire.",
        "Direction artistique : les visuels suivent le moodboard validé dans l'espace client."
      ] }
  };

  var FORMES = { ei: 'Entreprise individuelle', sas: 'SAS / SASU', sarl: 'SARL / EURL', sa: 'SA', association: 'Association', autre: '' };

  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function nl(v) { return esc(v).replace(/\n/g, '<br>'); }
  function eur(n) { return (Number(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  function fdate(d, long) {
    if (!d) return '';
    var x = new Date(String(d).length === 10 ? d + 'T12:00:00' : d);
    if (isNaN(x)) return esc(d);
    return x.toLocaleDateString('fr-FR', long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' });
  }
  function guessTemplate(category) {
    for (var k in TEMPLATES) if (!TEMPLATES[k].inactive && TEMPLATES[k].category.test(category || '')) return k;
    return 'part';
  }

  var CSS = '' +
    '.dv{font-family:"DM Sans",system-ui,sans-serif;color:#0a0a0c;background:#fff;line-height:1.6;font-size:14px;max-width:820px;margin:0 auto;padding:clamp(20px,5vw,48px);border:1px solid rgba(20,10,40,.09);border-radius:14px}' +
    '.dv-top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;border-bottom:2px solid #0a0a0c;padding-bottom:18px;margin-bottom:22px}' +
    '.dv-top img{width:64px;height:64px;border-radius:12px;display:block;margin-bottom:12px}' +
    '.dv-top h1{font-size:24px;letter-spacing:-.02em;margin:0}' +
    '.dv-top .meta{color:#76717f;font-size:13px;text-align:right}' +
    '.dv-parties{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr));gap:18px;margin-bottom:8px}' +
    '.dv-parties>div{background:#f7f5fb;border-radius:10px;padding:14px 16px;min-width:0;word-break:break-word}' +
    '.dv h2{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#6e5aa8;margin:26px 0 10px}' +
    '.dv-parties h2{margin-top:0}' +
    '.dv table{width:100%;border-collapse:collapse;font-size:13.5px}' +
    '.dv th,.dv td{text-align:left;vertical-align:top;padding:9px 8px;border-bottom:1px solid rgba(20,10,40,.09)}' +
    '.dv th{width:32%;color:#76717f;font-weight:600;text-transform:none;letter-spacing:0;font-size:13.5px;background:none;white-space:normal}' +
    '.dv .total td{font-weight:800;font-size:15px}' +
    '.dv ul{margin:0;padding-left:18px}.dv li{margin-bottom:5px}' +
    '.dv p{margin:0 0 8px}.dv .mu{color:#76717f;font-size:12.5px}' +
    '.dv .key{background:#f1ecfa;border-radius:8px;padding:10px 12px;font-weight:700}' +
    '.dv-sign{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:16px;margin-top:12px}' +
    '.dv-sign>div{border:1px dashed rgba(20,10,40,.2);border-radius:10px;padding:14px;min-height:90px}' +
    '.dv-sign .ok{border:1px solid #2f7d4f;background:#e7f4ec}' +
    '@media print{.dv{border:0;padding:0;max-width:none}.dv h2{break-after:avoid}.dv-sign{break-inside:avoid}}';


  /* ───────────── Droit à l'image : clauses versionnées (à faire valider par un avocat ou un DPO avant usage commercial) ─────────────
     La version est figée avec le texte à l'envoi du devis : modifier ces clauses ne change jamais un devis déjà envoyé ou signé. */
  var LEGAL_VERSION = 'DI-1.0';
  var USES = [
    { id: 'site', label: 'Site internet et portfolio', text: 'Site internet bunkaio.com et portfolio en ligne : pages de présentation, galeries, articles.' },
    { id: 'social', label: 'Réseaux sociaux', text: 'Comptes de BUNKAIO sur les réseaux sociaux (Instagram, Facebook, TikTok, LinkedIn, Pinterest) : publications, stories, vidéos courtes.' },
    { id: 'print', label: 'Supports commerciaux et de communication', text: 'Supports de BUNKAIO : brochures, affiches, présentations aux prospects et partenaires, dossiers commerciaux, publications professionnelles.' },
    { id: 'ads', label: 'Publicité numérique', text: 'Campagnes publicitaires numériques de BUNKAIO (annonces sponsorisées en ligne).' }
  ];
  var IMAGE_DURATION = '5 ans à compter de la livraison des photographies';

  /** person : le client est photographié ; company : entreprise, salariés ; event : plusieurs personnes ; product : peu ou pas de personnes. */
  function imageMode(q) {
    var t = q.template || '';
    return t === 'corp' ? 'company' : t === 'evt' ? 'event' : t === 'prod' ? 'product' : 'person';
  }

  function whoParagraph(q) {
    var m = imageMode(q);
    var base = '<p><strong>Qui donne l\'autorisation.</strong> ';
    if (m === 'company') return base + 'Le client signe pour son entreprise : sa signature n\'engage pas personnellement les salariés ou collaborateurs photographiés. Chaque personne photographiée donne elle-même son autorisation pour l\'utilisation promotionnelle par BUNKAIO, par un lien individuel ou par un lien collectif que le client lui transmet. Le client s\'engage à informer ses collaborateurs de la séance, de l\'usage prévu de leur portrait et de ce lien. Les choix ci-dessous concernent le signataire et les visuels de l\'entreprise (locaux, produits, équipe de direction qu\'il représente) ; ils ne valent jamais autorisation pour un tiers.</p>';
    if (m === 'event') return base + 'Plusieurs personnes peuvent apparaître : le client, qui commande la prestation, n\'est pas nécessairement la personne photographiée. Il s\'engage à informer les participants de la présence d\'un photographe et de l\'usage des images (mention sur l\'invitation ou affichage à l\'entrée). Les choix ci-dessous sont ceux du signataire ; BUNKAIO n\'utilise pas pour sa promotion une image sur laquelle une personne est clairement identifiable et mise en avant sans son accord individuel, recueilli par un lien individuel ou collectif transmis par le client.</p>';
    if (m === 'product') return base + 'La prestation porte sur des produits. Si une personne identifiable apparaît sur les photographies (mannequin, équipe, client), BUNKAIO ne l\'utilise pour sa promotion qu\'avec son accord individuel ; les choix ci-dessous concernent les visuels de la prestation et le signataire.</p>';
    return base + 'Le signataire est la personne photographiée et donne lui-même ces autorisations. Si d\'autres personnes seront photographiées (conjoint, enfants, proches, collaborateurs, modèles), il l\'indique au moment de la signature : chacune est invitée à faire son propre choix par un lien individuel ; à défaut, aucune photographie où elle est reconnaissable n\'est utilisée par BUNKAIO pour sa promotion.</p>';
  }

  function imageSection(q) {
    var li = USES.map(function (u) { return '<li><strong>' + esc(u.label) + '</strong> : ' + esc(u.text) + '</li>'; }).join('');
    return '<h2>8. Droit à l\'image et utilisation promotionnelle des visuels</h2>' +
      '<p class="mu">Clauses version ' + LEGAL_VERSION + '. Le droit à l\'image (autorisation de la personne photographiée) est distinct du droit d\'auteur du photographe, traité à l\'article 3 : les choix de cet article 8 ne modifient pas la cession de l\'article 3, et inversement.</p>' +
      '<p><strong>8.1 Ce qui n\'est pas soumis à votre choix.</strong> La prise de vue, la retouche, le stockage temporaire des fichiers, leur remise au client (album privé) et les échanges nécessaires à la prestation sont indispensables à l\'exécution du contrat. Ils ne demandent aucune autorisation supplémentaire et ne dépendent pas des choix ci-dessous.</p>' +
      '<p><strong>8.2 Utilisation promotionnelle par BUNKAIO (facultative).</strong> BUNKAIO ne peut utiliser pour sa propre promotion les photographies sur lesquelles une personne est identifiable que si cette personne l\'a expressément autorisé, usage par usage. Chaque choix est indépendant des autres. Refuser n\'a aucun effet sur la prestation, sur le prix ni sur la qualité du service. Aucune case n\'est cochée par défaut : à la signature, le client répond Oui ou Non à chaque usage.</p><ul>' + li + '</ul>' +
      '<p><strong>Durée :</strong> ' + IMAGE_DURATION + ', ou jusqu\'au retrait de l\'autorisation si celui-ci intervient avant. <strong>Territoire :</strong> monde entier pour la diffusion en ligne, par nature mondiale ; France pour les supports imprimés. <strong>Restrictions :</strong> pas de cession des photographies à des tiers, pas de montage, de légende ou de contexte portant atteinte à la dignité, à la vie privée ou à la réputation de la personne (article 9 du Code civil), pas d\'usage étranger aux catégories ci-dessus. Toute nouvelle finalité ou tout nouveau support non prévu ici nécessite une nouvelle autorisation, expresse et préalable.</p>' +
      whoParagraph(q) +
      '<p><strong>8.3 Mineurs.</strong> Pour une personne mineure, l\'autorisation est donnée par un titulaire de l\'autorité parentale ou un tuteur, jamais par un participant ou par le client s\'il n\'a pas cette qualité. Aucune utilisation promotionnelle de l\'image d\'un mineur n\'a lieu sans cette autorisation écrite, recueillie par un lien individuel.</p>' +
      '<p><strong>8.4 Retrait.</strong> L\'autorisation promotionnelle peut être retirée à tout moment, sans motif et sans frais, par email à contact@bunkaio.com ou sur bunkaio.com/retrait-autorisation/. Le retrait ne remet pas en cause les utilisations antérieures conformes à l\'autorisation. À réception, BUNKAIO cesse toute nouvelle utilisation, retire les publications en ligne dans un délai de 30 jours et n\'imprime ni ne diffuse de nouveau support ; les supports déjà imprimés ou diffusés ne peuvent pas être rappelés. Le retrait n\'affecte ni la prestation, ni les droits d\'utilisation des photographies cédés au client à l\'article 3.</p>';
  }

  function dataSection() {
    return '<h2>9. Données personnelles et preuve de la signature</h2>' +
      '<p><strong>Responsable du traitement :</strong> BUNKAIO (contact@bunkaio.com). <strong>Données :</strong> identité, coordonnées, éléments de facturation, photographies, choix d\'autorisation, date, heure, adresse IP et navigateur de la signature, version des clauses.</p>' +
      '<ul><li><strong>Exécution du contrat</strong> (devis, séance, retouche, livraison, facturation) : durée du contrat, puis 5 ans (prescription civile) ; factures : 10 ans (obligation comptable).</li>' +
      '<li><strong>Preuve de votre accord</strong> (signature, choix, version des clauses, adresse IP, navigateur, empreinte du document) : intérêt légitime de BUNKAIO à pouvoir démontrer ce qui a été accepté ; conservée 5 ans après la fin de la relation.</li>' +
      '<li><strong>Utilisation promotionnelle des images</strong> : votre consentement, retirable à tout moment (article 8.4) sans conséquence sur la prestation ; durée de l\'autorisation ou retrait.</li>' +
      '<li><strong>Photographies livrées :</strong> conservées 12 mois après la livraison dans l\'album privé.</li></ul>' +
      '<p><strong>Destinataires :</strong> BUNKAIO et ses prestataires techniques (hébergement, paiement, envoi d\'emails, album privé Adobe Lightroom), qui n\'agissent que sur instruction. Certains sont établis aux États-Unis : les transferts sont encadrés par les garanties de ces prestataires. Aucune revente de données. <strong>Vos droits :</strong> accès, rectification, effacement, limitation, opposition, portabilité, retrait du consentement, en écrivant à contact@bunkaio.com ; réclamation possible auprès de la CNIL (cnil.fr). Détails : bunkaio.com/confidentialite/.</p>';
  }

  function subjectNotice(q) {
    return '<p>BUNKAIO (contact@bunkaio.com) réalise une prestation photographique (devis n° ' + esc(q.number || '') + ') dans laquelle vous allez apparaître. <strong>Vos choix ci-dessous sont facultatifs</strong> : ils concernent uniquement l\'utilisation de vos images par BUNKAIO pour sa propre promotion, et n\'ont aucun effet sur la prestation. La remise des photographies au client reste, elle, nécessaire à l\'exécution du contrat.</p>' +
      '<p>Chaque usage est indépendant ; rien n\'est coché par défaut. Durée : ' + IMAGE_DURATION + ', ou jusqu\'au retrait. Territoire : monde entier en ligne ; France pour l\'imprimé. Pas de cession à des tiers, pas d\'usage portant atteinte à votre dignité ou à votre réputation. Une nouvelle utilisation non prévue nécessitera une nouvelle autorisation de votre part.</p>' +
      '<p><strong>Mineur :</strong> le choix est fait par un titulaire de l\'autorité parentale ou un tuteur.</p>' +
      '<p><strong>Retrait :</strong> à tout moment, sans motif, sur bunkaio.com/retrait-autorisation/ ou à contact@bunkaio.com. BUNKAIO cesse alors toute nouvelle utilisation et retire les publications en ligne sous 30 jours ; les supports déjà imprimés ou diffusés ne peuvent pas être rappelés, et les utilisations antérieures restent valables.</p>' +
      '<p><strong>Vos données</strong> (nom, email, choix, date, adresse IP, navigateur, version des clauses ' + LEGAL_VERSION + ') sont conservées par BUNKAIO comme preuve de votre accord pendant 5 ans après la fin de la relation (intérêt légitime ; l\'utilisation promotionnelle repose sur votre consentement). Droits d\'accès, de rectification, d\'effacement, d\'opposition et de portabilité : contact@bunkaio.com ; réclamation possible auprès de la CNIL. Détails : bunkaio.com/confidentialite/.</p>';
  }

  /** Paquet figé à l'envoi : version, HTML complet du devis (sans bloc de signature), description des usages, notice des personnes photographiées. */
  function legalPack(q, biz) {
    return { version: LEGAL_VERSION, html: render(q, biz, { legal: true, noSign: true }).replace(/ onerror="[^"]*"/g, ''), uses: USES.map(function (u) { return { id: u.id, label: u.label, text: u.text }; }), notice: subjectNotice(q) };
  }

  var CHOICE_LABEL = { oui: 'Autorisé', non: 'Refusé' };
  var PERSONS_LABEL = { self: 'le signataire uniquement', self_others: 'le signataire et d\'autres personnes', others: 'uniquement d\'autres personnes (le signataire n\'est pas photographié)' };

  /** Autorisations réellement enregistrées (données, pas du texte de clause) : s'affiche sous le devis figé. */
  function consentBlock(q) {
    var sg = q.signature;
    if (!sg || !sg.imageUse) return '';
    var rows = USES.map(function (u) { return '<tr><th>' + esc(u.label) + '</th><td><strong>' + CHOICE_LABEL[sg.imageUse[u.id]] + '</strong></td></tr>'; }).join('');
    return '<h2>Autorisations d\'image enregistrées à la signature</h2><table>' + rows +
      (sg.persons ? '<tr><th>Personnes photographiées</th><td>' + esc(PERSONS_LABEL[sg.persons] || '') + (sg.minors ? ' — dont au moins un mineur (autorisation du représentant légal)' : '') + '</td></tr>' : '') +
      '<tr><th>Version des clauses</th><td>' + esc(sg.legalVersion || '') + '</td></tr></table>' +
      '<p class="mu">Choix indépendants, sans effet sur la prestation ni sur le prix, modifiables ou révocables à tout moment (contact@bunkaio.com ou bunkaio.com/retrait-autorisation/).</p>';
  }

  function signBlock(q) {
    var h = ['<h2>Bon pour accord</h2><div class="dv-sign">'];
    if (q.signature) {
      var sg = q.signature;
      h.push('<div class="ok"><strong>Le client</strong><br>' + (q.signedVia === 'en_ligne'
        ? 'Signé électroniquement par <strong>' + esc(sg.name) + '</strong><br>le ' + new Date(sg.at).toLocaleString('fr-FR') + '<br><span class="mu">Mention « Bon pour accord » acceptée · empreinte ' + esc((sg.hash || '').slice(0, 16)) + '</span>'
        : 'Devis signé le ' + fdate(sg.at) + (q.signedVia === 'yousign' ? ' via Yousign' : '')) + '</div>');
    } else {
      h.push('<div><strong>Le client</strong><br><span class="mu">Nom, date, signature précédés de « Bon pour accord »</span></div>');
    }
    h.push('<div><strong>BUNKAIO — Aya Nascimento</strong><br><span class="mu">Émis le ' + fdate(q.createdAt) + '</span></div></div>');
    return h.join('');
  }

  /** Rendu HTML d'un devis enregistré (q) — biz : { address } du prestataire. opts.legal : clauses d'image (devis envoyés après le système DI-1.0) ; opts.noSign : sans bloc de signature. */
  function render(q, biz, opts) {
    biz = biz || {};
    opts = opts || {};
    var lg = !!(opts.legal || q.legal);
    var c = q.client || {};
    var pro = c.profil === 'professionnel';
    var dep = Math.round((q.totalHT || 0) * (q.acomptePct || 30)) / 100;
    var bal = Math.round(((q.totalHT || 0) - dep) * 100) / 100;
    var s = q.seance || {};
    var h = [];
    h.push('<div class="dv">');
    h.push('<div class="dv-top"><div><img src="/images/logo-bunkaio-512.png" alt="BUNKAIO" onerror="this.style.display=\'none\'"><h1>Devis n° ' + esc(q.number || '—') + '</h1><div class="mu">' + esc(q.prestation || '') + '</div></div>' +
      '<div class="meta">Émis le ' + fdate(q.createdAt) + '<br>Valable jusqu\'au ' + fdate(q.validUntil) + '</div></div>');
    h.push('<div class="dv-parties"><div><h2>Prestataire</h2><p><strong>BUNKAIO</strong> — Entreprise Individuelle<br>Aya Nascimento, photographe<br>SIRET 951 547 587 00034' +
      (biz.address ? '<br>' + esc(biz.address) : '') + '<br>contact@bunkaio.com · 07 58 57 31 61<br>TVA non applicable, art. 293 B du CGI</p></div>');
    h.push('<div><h2>Client</h2><p><strong>' + esc(c.nom) + '</strong>' + (pro && c.forme && FORMES[c.forme] ? ' — ' + esc(FORMES[c.forme]) : '') +
      (pro && c.contact ? '<br>Représenté par ' + esc(c.contact) : '') + (c.adresse ? '<br>' + esc(c.adresse) : '') +
      '<br>' + esc(q.email) + (c.telephone ? ' · ' + esc(c.telephone) : '') + (c.siret ? '<br>SIRET ' + esc(c.siret) : '') + (c.tvaIntra ? '<br>TVA ' + esc(c.tvaIntra) : '') +
      '<br><span class="mu">' + (pro ? 'Client professionnel' : 'Client particulier') + '</span></p></div></div>');

    h.push('<h2>1. Objet et description de la prestation</h2><table>' +
      '<tr><th>Prestation</th><td>' + esc(q.prestation) + '</td></tr>' +
      '<tr><th>Contenu / livrables</th><td>' + nl(q.contenu) + '</td></tr>' +
      (q.abonnement ? '<tr><th>Première session</th><td>' + (s.date ? fdate(s.date, true) : 'À convenir') + (s.lieu ? ' — ' + esc(s.lieu) : '') + '</td></tr>'
        : '<tr><th>Date, heure, lieu</th><td>' + (s.date ? fdate(s.date, true) : 'Date à convenir') + (s.heure ? ' à ' + esc(s.heure) : '') + (s.lieu ? ' — ' + esc(s.lieu) : '') + '</td></tr>') +
      '<tr><th>Délai de livraison</th><td>' + esc(q.delai) + '</td></tr>' +
      '<tr><th>Livraison</th><td>Album privé Adobe Lightroom (création d\'un compte Adobe Lightroom par le client). La post-production reste interactive : un aller-retour de corrections est inclus ; les demandes supplémentaires sont facturées selon un tarif convenu à l\'avance. Le client exporte ses visuels dans les formats de son choix.</td></tr>' +
      (q.notes ? '<tr><th>Précisions</th><td>' + nl(q.notes) + '</td></tr>' : '') + '</table>');

    h.push('<h2>2. Prix et paiement</h2><table>' + (q.abonnement
      ? '<tr class="total"><td>Prix</td><td>' + eur(q.totalHT) + ' / mois — net à payer (TVA non applicable, art. 293 B du CGI)</td></tr><tr><th>Facturation</th><td>Mensuelle, par carte bancaire ; sans acompte ni solde</td></tr>'
      : '<tr class="total"><td>Prix total</td><td>' + eur(q.totalHT) + ' — net à payer (TVA non applicable, art. 293 B du CGI)</td></tr>' +
        '<tr><th>Acompte à la signature (' + (q.acomptePct || 30) + ' %)</th><td>' + eur(dep) + ' — réserve la date et le créneau</td></tr>' +
        '<tr><th>Solde (' + (100 - (q.acomptePct || 30)) + ' %)</th><td>' + eur(bal) + ' — facture envoyée lorsque les photos sont prêtes ; son règlement ouvre l\'accès à l\'album</td></tr>' +
        '<tr><th>Moyens de paiement</th><td>Carte bancaire ; paiement en 3 fois sans frais avec Klarna, selon éligibilité</td></tr>') + '</table>');
    h.push('<p class="mu">' + (pro ? 'En cas de retard de paiement' : 'Client professionnel uniquement : en cas de retard de paiement') + ', pénalités au taux de trois fois le taux d\'intérêt légal et indemnité forfaitaire de recouvrement de 40 € (art. L441-10 du Code de commerce).</p>');

    var d = q.droits || {};
    h.push('<h2>3. Cession des droits d\'auteur</h2><p>Conformément à l\'article L131-3 du Code de la propriété intellectuelle, la cession est délimitée comme suit :</p><ul>' +
      '<li><strong>Droits cédés :</strong> droit de reproduction et droit de représentation des visuels livrés.</li>' +
      '<li><strong>Destination :</strong> ' + esc(d.destination) + '</li>' +
      '<li><strong>Étendue :</strong> ' + esc(d.exclusivite || 'Non exclusive') + ' (BUNKAIO conserve la propriété de ses œuvres).</li>' +
      '<li><strong>Territoire :</strong> ' + esc(d.territoire || 'Monde entier (diffusion en ligne)') + '.</li>' +
      '<li><strong>Durée :</strong> ' + esc(d.duree) + '.</li>' +
      '<li><strong>Mention du nom de l\'auteur :</strong> crédit « Photo : BUNKAIO » demandé lors de toute publication, dans la mesure du possible.</li></ul>' +
      '<p class="key">La cession des droits d\'utilisation est subordonnée au paiement intégral du prix.</p>' +
      '<p>Tout usage non prévu ci-dessus nécessite un accord écrit préalable et peut donner lieu à un avenant. ' + (lg
        ? 'Le paiement du prix n\'emporte pas cession de l\'ensemble des droits d\'auteur : seuls les droits énumérés ci-dessus sont cédés, dans les limites de la destination, de l\'étendue, du territoire et de la durée indiqués. Recadrages et déclinaisons de format sont autorisés ; toute modification dénaturant l\'œuvre ne l\'est pas. L\'utilisation des visuels par BUNKAIO pour sa propre promotion relève du droit à l\'image (article 8) et non de la présente cession.'
        : 'Utilisation des visuels par BUNKAIO pour son portfolio et sa communication : ' + (q.signature ? (q.signature.portfolio ? '<strong>autorisée par le client</strong>' : '<strong>refusée par le client</strong>') : 'au choix du client lors de la signature') + '.') + '</p>');

    h.push('<h2>4. Report et annulation</h2><p>' + nl(q.report || REPORT_STD) + '</p>');
    h.push('<h2>5. Conditions de réalisation</h2><ul>' + (q.conditions || []).concat(COMMON_REAL).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    if (!pro) {
      h.push('<h2>6. Droit de rétractation</h2><p>Le client consommateur dispose d\'un délai de 14 jours à compter de la signature pour se rétracter, sans motif, en écrivant à contact@bunkaio.com. Si la prestation est fixée avant la fin de ce délai, le client peut demander expressément qu\'elle commence avant son expiration ; s\'il se rétracte après le début de la prestation, il paie la part déjà exécutée, et il perd son droit de rétractation une fois la prestation pleinement exécutée.</p>' +
        (q.signature ? '<p class="mu">Exécution avant la fin du délai de rétractation : ' + (q.signature.retractationWaiver ? 'demandée par le client' : 'non demandée') + '.</p>' : ''));
    } else {
      h.push('<h2>6. Rétractation</h2><p>Le client agit à des fins professionnelles : le droit de rétractation prévu pour les consommateurs ne s\'applique pas, sauf disposition légale contraire.</p>');
    }
    h.push('<h2>7. Médiation, données personnelles, litiges</h2>' +
      (!pro ? '<p>En cas de litige non résolu, le client consommateur peut recourir gratuitement au médiateur de la consommation : ' + (q.mediateur ? esc(q.mediateur) : '<em>coordonnées communiquées sur demande</em>') + '.</p>' : '') +
      '<p>' + (lg ? 'Les données personnelles et la preuve de la signature sont décrites à l\'article 9. ' : 'Les données personnelles sont traitées pour l\'exécution du contrat (voir la politique de confidentialité sur bunkaio.com). ') + 'Droit applicable : droit français.' + (q.tribunal ? ' Tribunal compétent : ' + esc(q.tribunal) + '.' : '') + '</p>');
    if (lg) { h.push(imageSection(q)); h.push(dataSection()); }

    if (!opts.noSign) h.push(signBlock(q));
    if (!opts.noSign && lg) h.push(consentBlock(q));
    h.push('</div>');
    return h.join('');
  }

  root.BunkaioDevis = { LEGAL_VERSION: LEGAL_VERSION, USES: USES, legalPack: legalPack, signBlock: signBlock, consentBlock: consentBlock, subjectNotice: subjectNotice, TEMPLATES: TEMPLATES, COMMON_REAL: COMMON_REAL, REPORT_STD: REPORT_STD, FORMES: FORMES, CSS: CSS, render: render, guessTemplate: guessTemplate };
})(typeof window !== 'undefined' ? window : globalThis);
