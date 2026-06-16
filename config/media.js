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
   │  Héros carrousel     1920 × 820 px   (ratio 21:9, paysage)     │
   │  Marquee accueil      600 × 750 px   (ratio 4:5, portrait)     │
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
   │    marquee/              Bande défilante page d'accueil (4:5)   │
   │    services/             Photo par catégorie (filtre services)   │
   │    devis/                Illustration section Devis & déroulé   │
   │    drone/                Vignettes miniatures projets drone      │
   │    portfolio/            Grille portfolio — par catégorie        │
   │      immobilier/         Nommez vos photos 1.jpg, 2.jpg, ...    │
   │      archi/                                                       │
   │      cuisine/                                                     │
   │      piscine/                                                     │
   │      artisan/                                                     │
   │      photo-part/                                                  │
   │      mode/                                                        │
   │      event/                                                       │
   │  videos/                                                          │
   │    drone/                Vidéos projets drone (.mp4)             │
   └─────────────────────────────────────────────────────────────────┘

   NOTE : Les chemins ci-dessous pointent vers vos futurs fichiers locaux.
   Uploadez chaque fichier dans le bon dossier, puis ce fichier sera
   automatiquement à jour. Pas besoin de modifier autre chose.
   ═══════════════════════════════════════════════════════════════════ */


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
  home:      'images/hero/home-1.jpg',       // Fond page Accueil
  quiz:      'images/hero/quiz-1.jpg',       // Fond page Questionnaire devis
  services:  'images/hero/services-1.jpg',   // Fond page Services
  drone:     'images/hero/drone-1.jpg',      // Fond page 4K Drone
  portfolio: 'images/hero/portfolio-1.jpg',  // Fond page Portfolio
  contact:   'images/hero/contact-1.jpg',    // Fond page Contact
  partners:  'images/hero/partners-1.jpg',   // Fond page Partenaires
  login:     'images/hero/login-1.jpg',      // Fond page Connexion
  account:   'images/hero/account-1.jpg',    // Fond page Espace client

  /* ──────────────────────────────────────────────────────────────────
     BANDE DÉFILANTE — PAGE D'ACCUEIL (section sous le héros)
     8 images en format portrait — défilement automatique en boucle.
     Pour changer le nombre d'images : ajoutez ou supprimez des lignes.
     Format : portrait, ~600×750px
     ────────────────────────────────────────────────────────────────── */
  marquee: [
    'images/marquee/1.jpg',   // Marquee image 1
    'images/marquee/2.jpg',   // Marquee image 2
    'images/marquee/3.jpg',   // Marquee image 3
    'images/marquee/4.jpg',   // Marquee image 4
    'images/marquee/5.jpg',   // Marquee image 5
    'images/marquee/6.jpg',   // Marquee image 6
    'images/marquee/7.jpg',   // Marquee image 7
    'images/marquee/8.jpg',   // Marquee image 8
  ],

  /* ──────────────────────────────────────────────────────────────────
     ILLUSTRATION LATÉRALE — SECTION "DEVIS & DÉROULÉ"
     Visible dans Services → onglet "Devis & déroulé", colonne de droite.
     Format : paysage, ~900×700px
     ────────────────────────────────────────────────────────────────── */
  devis: 'images/devis/illustration.jpg',

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

    /* ① Accueil */
    home: [
      'images/hero/home-1.jpg',
      'images/hero/home-2.jpg',
      'images/hero/home-3.jpg',
    ],

    /* ② Questionnaire devis */
    quiz: [
      'images/hero/quiz-1.jpg',
      'images/hero/quiz-2.jpg',
    ],

    /* ③ Services */
    services: [
      'images/hero/services-1.jpg',
      'images/hero/services-2.jpg',
      'images/hero/services-3.jpg',
    ],

    /* ④ 4K Drone */
    drone: [
      'images/hero/drone-1.jpg',
      'images/hero/drone-2.jpg',
    ],

    /* ⑤ Portfolio */
    portfolio: [
      'images/hero/portfolio-1.jpg',
      'images/hero/portfolio-2.jpg',
      'images/hero/portfolio-3.jpg',
    ],

    /* ⑥ Contact */
    contact: [
      'images/hero/contact-1.jpg',
      'images/hero/contact-2.jpg',
    ],

    /* ⑦ Partenaires */
    partners: [
      'images/hero/partners-1.jpg',
      'images/hero/partners-2.jpg',
    ],

    /* ⑧ Connexion */
    login: [
      'images/hero/login-1.jpg',
    ],

    /* ⑨ Espace client / partenaire */
    account: [
      'images/hero/account-1.jpg',
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     PHOTOS DE CATÉGORIE — GRILLE SERVICES
     Apparaît à gauche de la grille quand l'utilisateur filtre par catégorie.
     Une image par catégorie. Format : portrait, ~900×1200px (ratio 3:4)
     ────────────────────────────────────────────────────────────────── */
  servicePhotos: {
    immobilier:   'images/services/immobilier.jpg',    // Immobilier prestige
    archi:        'images/services/archi.jpg',         // Architecture & design
    cuisine:      'images/services/cuisine.jpg',       // Cuisines haut de gamme
    piscine:      'images/services/piscine.jpg',       // Piscines & extérieurs
    artisan:      'images/services/artisan.jpg',       // Artisanat d'art
    'photo-part': 'images/services/photo-part.jpg',   // Séance photo particuliers
    mode:         'images/services/mode.jpg',          // Mode & créateurs
    event:        'images/services/event.jpg',         // Événementiel
  },
};


/* ═══════════════════════════════════════════════════════════════════
   🎬  VIGNETTES ET VIDÉOS DRONE
   ═══════════════════════════════════════════════════════════════════
   Une entrée par projet drone, organisée par catégorie.
   ├─ thumb : miniature cliquable (format 640×400px, ratio 16:10)
   └─ video : fichier vidéo (.mp4) lancé au clic sur la miniature

   Pour ajouter un projet : ajoutez un objet { thumb, video } dans
   le tableau de la catégorie correspondante.
   ═══════════════════════════════════════════════════════════════════ */
const DRONE_MEDIA = {

  /* ① Immobilier & architecture */
  immo: [
    { thumb: 'images/drone/immo-1.jpg',    video: 'videos/drone/immo-1.mp4'    },  // Villa contemporaine — Hérault
    { thumb: 'images/drone/immo-2.jpg',    video: 'videos/drone/immo-2.mp4'    },  // Domaine viticole — vente prestige
  ],

  /* ② Piscines & paysages */
  outdoor: [
    { thumb: 'images/drone/outdoor-1.jpg', video: 'videos/drone/outdoor-1.mp4' },  // Piscine miroir
    { thumb: 'images/drone/outdoor-2.jpg', video: 'videos/drone/outdoor-2.mp4' },  // Jardin paysager méditerranéen
  ],

  /* ③ Événementiel */
  event: [
    { thumb: 'images/drone/event-1.jpg',   video: 'videos/drone/event-1.mp4'   },  // Réception privée — domaine
    { thumb: 'images/drone/event-2.jpg',   video: 'videos/drone/event-2.mp4'   },  // Événement corporate
  ],

  /* ④ Marques & lifestyle */
  brand: [
    { thumb: 'images/drone/brand-1.jpg',   video: 'videos/drone/brand-1.mp4'   },  // Film de marque artisanale
    { thumb: 'images/drone/brand-2.jpg',   video: 'videos/drone/brand-2.mp4'   },  // Campagne lifestyle été
  ],
};
