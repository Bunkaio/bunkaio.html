/* ═══════════════════════════════════════════════════════════════════
   📁  CONFIGURATION DES MÉDIAS — config/media.js
   ═══════════════════════════════════════════════════════════════════

   C'EST L'UNIQUE FICHIER À MODIFIER pour changer une image ou une vidéo.
   Le code JS (js/script.js) lit ce fichier automatiquement — vous n'avez
   jamais besoin d'ouvrir script.js pour un changement de visuel.

   ┌─────────────────────────────────────────────────────────────────┐
   │  COMMENT REMPLACER UN VISUEL EN 3 ÉTAPES                        │
   │                                                                   │
   │  1. Uploadez votre fichier dans GitHub (dans le bon dossier)    │
   │  2. Remplacez le chemin ci-dessous par le nom exact du fichier  │
   │  3. Commitez — le site se met à jour automatiquement            │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │  FORMATS RECOMMANDÉS                                             │
   │                                                                   │
   │  Héros Accueil (home) 2400 × 2400 px (carré, sujet centré)     │
   │                       → image plein écran fixe derrière le      │
   │                         titre, affichée aussi bien en grand      │
   │                         écran large (paysage) qu'en mobile      │
   │                         (portrait) : un format proche du carré  │
   │                         avec le sujet bien centré évite que     │
   │                         le recadrage automatique ne coupe       │
   │                         l'essentiel de la photo dans un sens     │
   │                         ou dans l'autre.                         │
   │  Héros carrousel      1920 × 820 px   (ratio 21:9, paysage)     │
   │                       → toutes les autres rubriques (Services,  │
   │                         Drone, Portfolio, Contact, Partenaires) │
   │  Photos services      900 × 1200 px  (ratio 3:4, portrait)     │
   │  Illustration devis   900 × 700 px   (ratio 9:7, paysage)      │
   │  Vignettes drone      640 × 400 px   (ratio 16:10, paysage)    │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │  STRUCTURE DES DOSSIERS                                          │
   │                                                                   │
   │  images/                                                          │
   │    logo.png              Logo principal (fichier à la racine de  │
   │                          images/ — 42×42px ou SVG recommandé)   │
   │    hero/                 Carrousels d'en-tête (21:9)            │
   │    services/             Photo par catégorie (filtre services)   │
   │    devis/                Illustration section Devis & déroulé   │
   │    drone/                Vignettes miniatures projets drone      │
   │    portfolio/            Grille portfolio — par catégorie        │
   │      immobilier/         Nommez vos photos 1.webp, 2.webp, ...    │
   │      archi/                                                       │
   │      cuisine/                                                     │
   │      piscine/                                                     │
   │      artisan/                                                     │
   │      photo-part/                                                  │
   │      mode/                                                        │
   │      event/                                                       │
   └─────────────────────────────────────────────────────────────────┘

   NOTE : Les chemins ci-dessous pointent vers vos futurs fichiers locaux.
   Uploadez chaque fichier dans le bon dossier, puis ce fichier sera
   automatiquement à jour. Pas besoin de modifier autre chose.
   ═══════════════════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════════════════
   🌐  BASE URL MÉDIA — Cloudflare R2 via Worker
   Les images sont servies par le Worker Cloudflare depuis un bucket R2.
   Pour uploader vos photos : ouvrez admin/media.html sur le site.
   ═══════════════════════════════════════════════════════════════════ */
const MEDIA_BASE = 'https://bunkaio-quiz-stripe.bunkaio.workers.dev/media';


/* ═══════════════════════════════════════════════════════════════════
   🖼  IMAGES DU SITE
   ═══════════════════════════════════════════════════════════════════ */
const IMG = {

  /* ──────────────────────────────────────────────────────────────────
     FONDS DE PAGE (image en arrière-plan, très atténuée — opacité 6%)
     Visible derrière le contenu de chaque rubrique.
     Conseil : utilisez la même image que le 1er slide du carrousel héros.
     Format : paysage large, ~1920×1080px minimum
     ────────────────────────────────────────────────────────────────── */
  home:      '',                                       // Fond page Accueil — vide car la vidéo (homeVideo) est utilisée exclusivement
  homeVideo: 'videos/home-bg.mp4?v=5',                // Vidéo de fond Accueil (qualité maximale d'origine, ≈ 13 Mo, lecture progressive) — incrémenter ?v=X à chaque remplacement pour casser le cache mobile
  homeVideoMobile: 'videos/home-bg-m.mp4?v=2',        // Même vidéo allégée (1280 px, haute qualité) servie sur petit écran (≤ 820 px)
  missionVideo: 'videos/mission-bg.mp4?v=3',          // Vidéo de fond de la section « Pourquoi Bunkaio existe » (accueil, qualité d'origine ≈ 13 Mo) — chargée seulement quand la section approche
  missionVideoMobile: 'videos/mission-bg-m.mp4?v=2',  // Version allégée (1280 px, haute qualité) sur petit écran
  quiz:      MEDIA_BASE + '/hero/quiz-1.webp',       // Fond page Questionnaire devis
  services:  MEDIA_BASE + '/hero/services-1.webp',   // Fond page Services
  /* Vidéo de fond plein écran optionnelle de la page Services — remplace
     automatiquement les 3 photos de bannière ci-dessus dès qu'un fichier
     existe à ce chemin. Chemin pré-câblé vers R2 : déposez le fichier
     depuis admin/media.html (rubrique "Vidéos de fond") pour l'activer,
     rien à modifier ici. Tant qu'aucun fichier n'existe (404), repli
     automatique et silencieux sur les 3 photos ci-dessus. */
  servicesVideo: MEDIA_BASE + '/services/bg-video.mp4',
  drone:     MEDIA_BASE + '/hero/drone-1.webp',      // Fond page 4K Drone
  portfolio: MEDIA_BASE + '/hero/portfolio-1.webp',  // Fond page Portfolio
  contact:   MEDIA_BASE + '/hero/contact-1.webp',    // Fond page Contact
  about:     MEDIA_BASE + '/hero/contact-1.webp',    // Fond page À propos
  service:   MEDIA_BASE + '/hero/services-1.webp',   // Fond des pages de prestation (/services/…)
  advice:    MEDIA_BASE + '/hero/services-1.webp',   // Fond de la page Conseils
  discover:  MEDIA_BASE + '/hero/services-1.webp',   // Fond de la page « Découvrir chaque prestation »
  article:   MEDIA_BASE + '/hero/services-1.webp',   // Fond des articles
  /* Textes alternatifs du portfolio (SEO images) : un tableau par catégorie, INDEXÉ PAR NUMÉRO DE FICHIER (1.webp = 1re entrée, 2.webp = 2e, etc.). Supprimer une photo ne décale donc pas les textes des autres.
     Décrivez ce qu'on voit, sans bourrer de mots-clés. Ex. : 'photo-part': ['Portrait en lumière naturelle d'une femme sur un pont à Béziers', ...]
     Si une entrée manque, un texte générique est utilisé. */
  portfolioAlt: {},
  /* Texte alternatif de la photo de chaque page prestation (clé = id de la catégorie : 'photo-part', 'mode', 'commercial', 'event', 'lumen').
     Décrivez ce que montre réellement l'image. Vide = texte générique « Exemple de … réalisé par BUNKAIO ». */
  serviceAlt: {},
  aboutPhoto: '',                                     // Portrait de la photographe (À propos) — ex. MEDIA_BASE + '/about/aya.webp' après dépôt dans l'admin média
  partners:  MEDIA_BASE + '/hero/partners-1.webp',   // Fond page Partenaires
  legal:     MEDIA_BASE + '/hero/contact-1.webp',    // Fond page FAQ & confidentialité
  login:     MEDIA_BASE + '/hero/login-1.webp',      // Fond page Connexion
  account:   MEDIA_BASE + '/hero/account-1.webp',    // Fond page Espace client

  /* ──────────────────────────────────────────────────────────────────
     ILLUSTRATION LATÉRALE — SECTION "DEVIS & DÉROULÉ"
     Visible dans Services → onglet "Devis & déroulé", colonne de droite.
     Format : paysage, ~900×700px
     ────────────────────────────────────────────────────────────────── */
  devis: MEDIA_BASE + '/devis/illustration.webp',
  /* Vidéo optionnelle à la place de l'illustration ci-dessus — chemin
     pré-câblé vers R2 : déposez le fichier depuis admin/media.html
     (rubrique "Vidéos de fond") pour l'activer, rien à modifier ici.
     Tant qu'aucun fichier n'existe à ce chemin, repli automatique et
     silencieux sur l'illustration fixe ci-dessus. */
  devisVideo: MEDIA_BASE + '/devis/illustration-video.mp4',

  /* ──────────────────────────────────────────────────────────────────
     ILLUSTRATION LATÉRALE — PARTENAIRES → ONGLET "COLLABORATION"
     Visible dans Partenaires → onglet "Collaboration", en haut de la
     colonne de gauche. Format : portrait ou paysage, ~900×1100px.
     ────────────────────────────────────────────────────────────────── */
  collab: MEDIA_BASE + '/partners/collaboration.webp',

  /* (Interne — graine pour les placeholders portfolio, ne pas modifier) */
  portfolioSeed: 'bk-pf',

  /* ──────────────────────────────────────────────────────────────────
     CARROUSELS HÉROS — EN-TÊTE DE CHAQUE RUBRIQUE
     Chaque tableau = une rubrique. Règles :
       ├─ Plusieurs images → défilement auto toutes les 5 secondes
       ├─ Un seul élément  → image fixe (pas de défilement)
       └─ Tableau vide []  → section héros masquée pour cette rubrique
     Format : grand paysage, ~1920×820px (ratio 21:9)
     ────────────────────────────────────────────────────────────────── */
  heroImages: {

    /* ① Accueil — vide : la vidéo (homeVideo) est utilisée exclusivement
       en fond, sur mobile comme en desktop. */
    home: [],

    /* ② Questionnaire devis — même fond fixe que les autres rubriques,
       pour la cohérence visuelle (et pour que la navbar ait toujours
       un fond derrière elle). C'est un calque position:fixed, il n'ajoute
       aucune hauteur de scroll supplémentaire. */
    quiz: [
      MEDIA_BASE + '/hero/quiz-1.webp',
    ],

    /* ③ Services */
    services: [
      MEDIA_BASE + '/hero/services-1.webp',
      MEDIA_BASE + '/hero/services-2.webp',
      MEDIA_BASE + '/hero/services-3.webp',
    ],

    /* ④ 4K Drone */
    drone: [
      MEDIA_BASE + '/hero/drone-1.webp',
      MEDIA_BASE + '/hero/drone-2.webp',
    ],

    /* ⑤ Portfolio */
    portfolio: [
      MEDIA_BASE + '/hero/portfolio-1.webp',
      MEDIA_BASE + '/hero/portfolio-2.webp',
      MEDIA_BASE + '/hero/portfolio-3.webp',
    ],

    /* Conseils et articles — même fond que Services */
    advice: [MEDIA_BASE + '/hero/services-1.webp'],
    discover: [MEDIA_BASE + '/hero/services-1.webp'],
    article: [MEDIA_BASE + '/hero/services-1.webp'],

    /* Pages de prestation — même fond que Services */
    service: [
      MEDIA_BASE + '/hero/services-1.webp',
    ],

    /* ⑥-bis À propos — même fond que Contact ; la photo de portrait de la
       photographe se renseigne via IMG.about (plus haut). */
    about: [
      MEDIA_BASE + '/hero/contact-1.webp',
      MEDIA_BASE + '/hero/contact-2.webp',
    ],

    /* ⑥ Contact */
    contact: [
      MEDIA_BASE + '/hero/contact-1.webp',
      MEDIA_BASE + '/hero/contact-2.webp',
    ],

    /* ⑦ Partenaires */
    partners: [
      MEDIA_BASE + '/hero/partners-1.webp',
      MEDIA_BASE + '/hero/partners-2.webp',
    ],

    /* ⑦bis FAQ & politique de confidentialité — réutilise la photo de
       la page Contact (même thématique éditoriale, pas de doublon à gérer). */
    legal: [
      MEDIA_BASE + '/hero/contact-1.webp',
    ],

    /* ⑧ Connexion */
    login: [
      MEDIA_BASE + '/hero/login-1.webp',
    ],

    /* ⑨ Espace client / partenaire */
    account: [
      MEDIA_BASE + '/hero/account-1.webp',
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     PHOTOS DE CATÉGORIE — GRILLE SERVICES
     Apparaît à gauche de la grille quand l'utilisateur filtre par catégorie.
     Une image par catégorie. Format : portrait, ~900×1200px (ratio 3:4)
     ────────────────────────────────────────────────────────────────── */
  servicePhotos: {
    immobilier:   MEDIA_BASE + '/services/immobilier.webp',    // Immobilier prestige
    archi:        MEDIA_BASE + '/services/archi.webp',         // Architecture & design
    cuisine:      MEDIA_BASE + '/services/cuisine.webp',       // Cuisines haut de gamme
    piscine:      MEDIA_BASE + '/services/piscine.webp',       // Piscines & extérieurs
    artisan:      MEDIA_BASE + '/services/artisan.webp',       // Artisanat d'art
    'photo-part': MEDIA_BASE + '/services/photo-part.webp',   // Séance photo particuliers
    corporate:    MEDIA_BASE + '/services/corporate.webp',     // Corporate — portraits professionnels
    mode:         MEDIA_BASE + '/services/mode.webp',          // Mode, agence et mannequins
    commercial:   MEDIA_BASE + '/services/commercial.webp',    // Commercial & produits
    event:        MEDIA_BASE + '/services/event.webp',         // Événementiel
    lumen:        MEDIA_BASE + '/services/lumen.webp',          // Lumen — photobooth IA mariages
  },

  /* ──────────────────────────────────────────────────────────────────
     GRILLE PORTFOLIO — RÉALISATIONS PAR CATÉGORIE
     RIEN À CONFIGURER ICI : contrairement aux autres sections de ce
     fichier, le portfolio ne se liste pas manuellement. Le site
     détecte automatiquement les photos présentes à chaque chemin
     portfolio/<catégorie>/1.webp, 2.webp, 3.webp… (jusqu'à 24) — déposez
     vos fichiers dans admin/media.html → section Portfolio, numérotés
     dans l'ordre d'affichage souhaité, et ils apparaissent directement
     sur le site, sans toucher à ce fichier. Une catégorie sans aucune
     photo affiche "Visuels à venir" à la place. Format : portrait,
     ~900×1200px.
     ────────────────────────────────────────────────────────────────── */
};


/* ═══════════════════════════════════════════════════════════════════
   🎬  VIGNETTES ET VIDÉOS DRONE
   ═══════════════════════════════════════════════════════════════════
   Une entrée par projet drone, organisée par catégorie.
   ├─ thumb : miniature cliquable (format 640×400px, ratio 16:10)
   └─ video : fichier vidéo (.mp4) lancé au clic sur la miniature —
     comme les autres médias, déposée directement via admin/media.html
     (rubrique 4K Drone, repliée tant que la page est en pause). Tant
     qu'aucun fichier n'existe à ce chemin, le clic sur la vignette
     échoue silencieusement (404) — sans conséquence tant que la page
     Drone elle-même est en "Bientôt disponible".

   Pour ajouter un projet : ajoutez un objet { thumb, video } dans
   le tableau de la catégorie correspondante.
   ═══════════════════════════════════════════════════════════════════ */
const DRONE_MEDIA = {

  /* ① Immobilier & architecture */
  immo: [
    { thumb: MEDIA_BASE + '/drone/immo-1.webp',    video: MEDIA_BASE + '/drone/immo-1.mp4'    },  // Villa contemporaine — Hérault
    { thumb: MEDIA_BASE + '/drone/immo-2.webp',    video: MEDIA_BASE + '/drone/immo-2.mp4'    },  // Domaine viticole — vente prestige
  ],

  /* ② Piscines & paysages */
  outdoor: [
    { thumb: MEDIA_BASE + '/drone/outdoor-1.webp', video: MEDIA_BASE + '/drone/outdoor-1.mp4' },  // Piscine miroir
    { thumb: MEDIA_BASE + '/drone/outdoor-2.webp', video: MEDIA_BASE + '/drone/outdoor-2.mp4' },  // Jardin paysager méditerranéen
  ],

  /* ③ Événementiel */
  event: [
    { thumb: MEDIA_BASE + '/drone/event-1.webp',   video: MEDIA_BASE + '/drone/event-1.mp4'   },  // Réception privée — domaine
    { thumb: MEDIA_BASE + '/drone/event-2.webp',   video: MEDIA_BASE + '/drone/event-2.mp4'   },  // Événement corporate
  ],

  /* ④ Marques & lifestyle */
  brand: [
    { thumb: MEDIA_BASE + '/drone/brand-1.webp',   video: MEDIA_BASE + '/drone/brand-1.mp4'   },  // Film de marque artisanale
    { thumb: MEDIA_BASE + '/drone/brand-2.webp',   video: MEDIA_BASE + '/drone/brand-2.mp4'   },  // Campagne lifestyle été
  ],
};

/* Lien « laisser un avis » de la fiche Google Business Profile (https://g.page/r/.../review). Vide = aucun bouton affiché. */
const GOOGLE_REVIEW_URL = 'https://g.page/r/CaRPlLV6GmYlECE/review';
