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
   │      immobilier/         Nommez vos photos 1.webp, 2.webp, ...    │
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
  home:      'images/hero/home-1.webp',       // Fond page Accueil
  quiz:      'images/hero/quiz-1.webp',       // Fond page Questionnaire devis
  services:  'images/hero/services-1.webp',   // Fond page Services
  drone:     'images/hero/drone-1.webp',      // Fond page 4K Drone
  portfolio: 'images/hero/portfolio-1.webp',  // Fond page Portfolio
  contact:   'images/hero/contact-1.webp',    // Fond page Contact
  partners:  'images/hero/partners-1.webp',   // Fond page Partenaires
  login:     'images/hero/login-1.webp',      // Fond page Connexion
  account:   'images/hero/account-1.webp',    // Fond page Espace client

  /* ──────────────────────────────────────────────────────────────────
     BANDE DÉFILANTE — PAGE D'ACCUEIL (section sous le héros)
     8 images en format portrait — défilement automatique en boucle.
     Pour changer le nombre d'images : ajoutez ou supprimez des lignes.
     Format : portrait, ~600×750px
     ────────────────────────────────────────────────────────────────── */
  marquee: [
    'images/marquee/1.webp',   // Marquee image 1
    'images/marquee/2.webp',   // Marquee image 2
    'images/marquee/3.webp',   // Marquee image 3
    'images/marquee/4.webp',   // Marquee image 4
    'images/marquee/5.webp',   // Marquee image 5
    'images/marquee/6.webp',   // Marquee image 6
    'images/marquee/7.webp',   // Marquee image 7
    'images/marquee/8.webp',   // Marquee image 8
  ],

  /* ──────────────────────────────────────────────────────────────────
     ILLUSTRATION LATÉRALE — SECTION "DEVIS & DÉROULÉ"
     Visible dans Services → onglet "Devis & déroulé", colonne de droite.
     Format : paysage, ~900×700px
     ────────────────────────────────────────────────────────────────── */
  devis: 'images/devis/illustration.webp',

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
      'images/hero/home-1.webp',
      'images/hero/home-2.webp',
      'images/hero/home-3.webp',
    ],

    /* ② Questionnaire devis */
    quiz: [
      'images/hero/quiz-1.webp',
      'images/hero/quiz-2.webp',
    ],

    /* ③ Services */
    services: [
      'images/hero/services-1.webp',
      'images/hero/services-2.webp',
      'images/hero/services-3.webp',
    ],

    /* ④ 4K Drone */
    drone: [
      'images/hero/drone-1.webp',
      'images/hero/drone-2.webp',
    ],

    /* ⑤ Portfolio */
    portfolio: [
      'images/hero/portfolio-1.webp',
      'images/hero/portfolio-2.webp',
      'images/hero/portfolio-3.webp',
    ],

    /* ⑥ Contact */
    contact: [
      'images/hero/contact-1.webp',
      'images/hero/contact-2.webp',
    ],

    /* ⑦ Partenaires */
    partners: [
      'images/hero/partners-1.webp',
      'images/hero/partners-2.webp',
    ],

    /* ⑧ Connexion */
    login: [
      'images/hero/login-1.webp',
    ],

    /* ⑨ Espace client / partenaire */
    account: [
      'images/hero/account-1.webp',
    ],
  },

  /* ──────────────────────────────────────────────────────────────────
     PHOTOS DE CATÉGORIE — GRILLE SERVICES
     Apparaît à gauche de la grille quand l'utilisateur filtre par catégorie.
     Une image par catégorie. Format : portrait, ~900×1200px (ratio 3:4)
     ────────────────────────────────────────────────────────────────── */
  servicePhotos: {
    immobilier:   'images/services/immobilier.webp',    // Immobilier prestige
    archi:        'images/services/archi.webp',         // Architecture & design
    cuisine:      'images/services/cuisine.webp',       // Cuisines haut de gamme
    piscine:      'images/services/piscine.webp',       // Piscines & extérieurs
    artisan:      'images/services/artisan.webp',       // Artisanat d'art
    'photo-part': 'images/services/photo-part.webp',   // Séance photo particuliers
    mode:         'images/services/mode.webp',          // Mode & créateurs
    event:        'images/services/event.webp',         // Événementiel
  },

  /* ──────────────────────────────────────────────────────────────────
     GRILLE PORTFOLIO — RÉALISATIONS PAR CATÉGORIE
     Photos affichées dans l'onglet Portfolio et dans l'aperçu du quiz
     ("Réalisations — [catégorie]"). Une catégorie vide ([]) affiche un
     message "Visuels à venir" au lieu d'images aléatoires.
     Nommez vos fichiers 1.webp, 2.webp, ... dans le dossier correspondant
     (images/portfolio/<catégorie>/) puis listez-les ci-dessous, dans
     l'ordre d'affichage souhaité. Format : portrait, ~900×1200px.
     ────────────────────────────────────────────────────────────────── */
  portfolioMedia: {
    immobilier:   [], // images/portfolio/immobilier/1.webp, 2.webp, ...
    archi:        [], // images/portfolio/archi/1.webp, 2.webp, ...
    cuisine:      [], // images/portfolio/cuisine/1.webp, 2.webp, ...
    piscine:      [], // images/portfolio/piscine/1.webp, 2.webp, ...
    artisan:      [], // images/portfolio/artisan/1.webp, 2.webp, ...
    'photo-part': [], // images/portfolio/photo-part/1.webp, 2.webp, ...
    mode:         [], // images/portfolio/mode/1.webp, 2.webp, ...
    event:        [], // images/portfolio/event/1.webp, 2.webp, ...
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
    { thumb: 'images/drone/immo-1.webp',    video: 'videos/drone/immo-1.mp4'    },  // Villa contemporaine — Hérault
    { thumb: 'images/drone/immo-2.webp',    video: 'videos/drone/immo-2.mp4'    },  // Domaine viticole — vente prestige
  ],

  /* ② Piscines & paysages */
  outdoor: [
    { thumb: 'images/drone/outdoor-1.webp', video: 'videos/drone/outdoor-1.mp4' },  // Piscine miroir
    { thumb: 'images/drone/outdoor-2.webp', video: 'videos/drone/outdoor-2.mp4' },  // Jardin paysager méditerranéen
  ],

  /* ③ Événementiel */
  event: [
    { thumb: 'images/drone/event-1.webp',   video: 'videos/drone/event-1.mp4'   },  // Réception privée — domaine
    { thumb: 'images/drone/event-2.webp',   video: 'videos/drone/event-2.mp4'   },  // Événement corporate
  ],

  /* ④ Marques & lifestyle */
  brand: [
    { thumb: 'images/drone/brand-1.webp',   video: 'videos/drone/brand-1.mp4'   },  // Film de marque artisanale
    { thumb: 'images/drone/brand-2.webp',   video: 'videos/drone/brand-2.mp4'   },  // Campagne lifestyle été
  ],
};
