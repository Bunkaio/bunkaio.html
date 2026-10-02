/* ═══════════════ FORMSPREE → contact@bunkaio.com ═══════════════ */
const FORMSPREE_URL = 'https://formspree.io/f/mnjybndv';

/* ═══════════════ STRIPE LEAD CAPTURE (Cloudflare Worker — voir /server) ═══════════════
   À remplacer par l'URL réelle après déploiement du Worker (voir server/README.md).
   Tant que cette URL n'est pas configurée, sendQuizLeadToStripe() échoue silencieusement
   et n'a aucun impact sur le quiz (fire-and-forget, voir submitQuiz()). */
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
  fetch(QUIZ_LEAD_WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
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
    'estimate':'Devis','services':'Services','portfolio':'Portfolio','drone':'4K Drone','contact':'Contact','partners':'Partenaires','nav-legal':'FAQ',
    'hero-kicker':'Photographe professionnel · Occitanie','quiz-h1':'Devis photo en ligne','hero-word1':'Estimez','hero-word2':'votre','hero-word3':'projet','start':'Estimer mon projet',
    'step-cat':'01 — Catégorie','q-cat':'Quel est votre domaine\u00a0?','q-cat-sub':'Sélectionnez l\'univers de votre projet.',
    'step-prof':'02 — Profil','q-prof':'Quel profil êtes-vous\u00a0?','q-prof-sub':'Identifiez-vous pour que nous comprenions précisément votre besoin.',
    'step-tier':'03 — Prestation','q-tier':'Quel niveau de prestation\u00a0?',
    'step-recap':'04 — Votre prestation','q-recap':'Ce qui est inclus','q-recap-sub':'Le détail de votre prestation, et les options pour aller plus loin.',
    'options':'Options supplémentaires',
    'step-coords':'05 — Coordonnées','q-coords':'Vos coordonnées','q-coords-sub':'Nous étudions chaque demande personnellement. Réponse assurée sous 48h.',
    'name-label':'Nom / Société *','email-label':'Email *','phone-label':'Téléphone','phone-label-opt':'Téléphone — optionnel','project-label':'Votre projet *','message-label':'Message *',
    'delay-label':'Délai souhaité *','delay-opt-select':'Sélectionnez…','delay-opt-urgent':'Urgent (moins de 2 semaines)','delay-opt-1m':'Dans le mois','delay-opt-2-3m':'2 à 3 mois','delay-opt-flex':'Flexible / pas de contrainte',
    'back':'← Retour','continue':'Continuer','submit':'Confirmez ma demande de devis',
    'quiz-back':'Retour','quiz-home':'Accueil',
    'success-label':'Demande reçue','success-title':'Votre demande a bien été envoyée',
    'success-text1':'Merci pour votre confiance. Votre demande de devis est entre nos mains : elle sera étudiée et vous recevrez une réponse sous <strong>48 heures</strong>.',
    'success-text2':'Chaque demande est évaluée individuellement et n\'est acceptée que si elle correspond à la <strong>ligne éditoriale de BUNKAIO</strong>. Nous travaillons uniquement avec des projets qui résonnent avec notre univers — c\'est ce qui garantit la qualité de chaque collaboration.',
    'success-text3':'Une fois votre devis confirmé, direction votre espace client : vous pourrez y construire votre <strong>moodboard</strong> pour partager votre vision — direction artistique, ambiance, inspirations — et nous arriver parfaitement alignés le jour du shooting.',
    'home-btn':'Retour à l\'accueil','see-portfolio':'Voir tout le portfolio',
    'svc-reserve':'Je réserve ma séance','services-title':'Prestations & tarifs photo','services-sub':'Photographe professionnel : des images haut de gamme, en HD, pour mettre en valeur votre projet. Nos prestations et leurs tarifs, par univers.',
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
    'legal-title':'FAQ & politique de confidentialité',
    'legal-sub':'Les réponses aux questions les plus fréquentes, ainsi que nos engagements en matière de confidentialité et de droits d\'utilisation des visuels.',
    'legaltab-faq':'FAQ','legaltab-privacy':'Politique de confidentialité',
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
    'cred-mini1':'Photographe mobile — Béziers, Montpellier, Toulouse',
    'cred-mini2':'Photographe professionnelle diplômée de l\'ETPA — BTS Photographie 2018',
    'cred-mini3':'Matériel professionnel haut de gamme',
    'cred-mini4':'8 ans d\'expérience · 200+ projets réalisés',
    'cred-faq-link':'Des questions ? Consultez notre FAQ →',
    'testi-share-btn':'Partager mon expérience',
    'share-title':'Partager mon expérience',
    'about-title':'Aya Nascimento, photographe portraitiste professionnelle',
    'about-sub':'La photographe derrière BUNKAIO : des images haut de gamme, en HD, pour mettre en valeur vos projets.',
    'about-h-bio':'Une photographe, un regard',
    'about-p1':'Aya Nascimento est photographe portraitiste professionnelle, diplômée de l\'ETPA (BTS Photographie, 2018). Elle est la photographe de BUNKAIO.',
    'about-p2':'Spécialisée en photographie de mode, de produit, corporate et événementielle, elle accompagne les particuliers, les marques et les entreprises avec des images premium en haute définition, retouchées avec soin.',
    'about-h-zone':'Un studio mobile en Occitanie',
    'about-zone-text':'BUNKAIO se déplace : pas d\'adresse de studio, mais une intervention à Béziers, Montpellier et Toulouse. Pour un projet ailleurs, chaque demande est étudiée avec des frais de déplacement calculés selon la distance.',
    'about-stat1':'ans d\'expérience','about-stat2':'projets réalisés','about-stat3':'diplômée de l\'ETPA · BTS Photographie',
    'about-h-spec':'Spécialités',
    'about-spec1':'Portrait & lifestyle','about-spec2':'Mode, agences et mannequins','about-spec3':'Photo de produit & commercial','about-spec4':'Corporate & entreprises','about-spec5':'Événementiel & mariage (Lumen)',
    'about-h-method':'Comment ça se passe',
    'about-step1':'Devis personnalisé sous 48 h','about-step2':'Shooting à la date convenue','about-step3':'Retouche et post-production','about-step4':'Livraison en HD dans une galerie privée, depuis votre espace client',
    'about-cta-portfolio':'Voir le portfolio','about-cta-contact':'Contacter BUNKAIO',
    'ft-about':'À propos','cred-about-link':'Qui est derrière BUNKAIO ? →',
    'zone-label':'Zone d\'intervention','zone-value':'Photographe mobile — Béziers, Montpellier, Toulouse',
    'share-sub':'Vous avez travaillé avec BUNKAIO ? Votre retour aide d\'autres clients à se projeter — et compte énormément pour nous.',
    'share-info-label':'Comment ça marche',
    'share-info-value':'Votre message nous est envoyé directement. Avec votre accord, il pourra être publié (de façon anonymisée si vous le souhaitez) dans la section témoignages du site.',
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
    'lr-text':'Vos livrables sont hébergés sur Adobe Lightroom. Connectez-vous avec les identifiants qui vous ont été transmis pour consulter et télécharger vos images.',
    'lr-btn':'Accéder à Lightroom',
    'acc-step-devis':'Devis confirmé','acc-step-shoot':'Shooting planifié','acc-step-post':'Post-production','acc-step-livre':'Livré',
    'acc-help-title':'Une question sur votre projet ?','acc-help-sub':'Votre interlocuteur BUNKAIO vous répond directement.','acc-help-btn':'Nous écrire',
    'acc-info-address':'Adresse de facturation — optionnel',
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
    'process-payment-info':'<strong>Modalités de paiement :</strong> 30 % à la commande à la signature du devis, solde à la livraison des livrables. Chaque versement est réglable en 3x sans frais avec Klarna, par carte bancaire ou par prélèvement automatique.',
    'process-cancel-info':'<strong>Annulation :</strong> une fois le devis validé, l\'acompte de 30 % versé à la commande reste acquis à BUNKAIO et n\'est pas remboursé en cas d\'annulation de votre part.',
    'process-delay-info':'Les délais indiqués sur chaque formule démarrent à la date du shooting.',
    'process-rights-info':'L\'ensemble des droits d\'utilisation des visuels livrés vous sont cédés pour une utilisation commerciale sans limite de durée.',
    'pay-flex-kicker':'Paiement flexible',
    'pay-flex-text':'<strong>3x sans frais avec Klarna</strong>, carte bancaire ou prélèvement automatique — ou en 2 fois, acompte 30 % puis solde. Sans aucun frais supplémentaire.',
    'pay-flex-pill-klarna':'3x sans frais',
    'pay-flex-pill-card':'Carte bancaire',
    'pay-flex-pill-debit':'Prélèvement auto',
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
    'ph-reg-email':'vous@societe.fr'
  },
  en: {
    'estimate':'Quote','services':'Services','portfolio':'Portfolio','drone':'4K Drone','contact':'Contact','partners':'Partners','nav-legal':'FAQ',
    'hero-kicker':'Professional photographer · Occitanie','quiz-h1':'Online photo quote','hero-word1':'Estimate','hero-word2':'your','hero-word3':'project','start':'Estimate My Project',
    'step-cat':'01 — Category','q-cat':'What is your field\u00a0?','q-cat-sub':'Select the universe your project belongs to.',
    'step-prof':'02 — Profile','q-prof':'Which profile are you\u00a0?','q-prof-sub':'Tell us who you are so we can understand exactly what you need.',
    'step-tier':'03 — Service level','q-tier':'Which level of service\u00a0?',
    'step-recap':'04 — Your package','q-recap':'What\'s included','q-recap-sub':'The full details of your package, plus options to take it further.',
    'options':'Additional options',
    'step-coords':'05 — Your details','q-coords':'Your details','q-coords-sub':'Every request is reviewed personally. We reply within 48 hours.',
    'name-label':'Name / Company *','email-label':'Email *','phone-label':'Phone','phone-label-opt':'Phone — optional','project-label':'Your project *','message-label':'Message *',
    'delay-label':'Desired timeline *','delay-opt-select':'Select…','delay-opt-urgent':'Urgent (under 2 weeks)','delay-opt-1m':'Within a month','delay-opt-2-3m':'2 to 3 months','delay-opt-flex':'Flexible / no constraint',
    'back':'← Back','continue':'Continue','submit':'Confirm my quote request',
    'quiz-back':'Back','quiz-home':'Home',
    'success-label':'Request received','success-title':'Your request has been sent',
    'success-text1':'Thank you for your trust. Your quote request is in our hands: it will be carefully reviewed and you will receive a reply within <strong>48 hours</strong>.',
    'success-text2':'Every request is assessed individually and is only accepted if it aligns with <strong>BUNKAIO\'s editorial line</strong>. We work exclusively with projects that resonate with our universe — this is what guarantees the quality of every collaboration.',
    'success-text3':'Once your quote is confirmed, head to your client space : you\'ll be able to build your <strong>moodboard</strong> there to share your vision — art direction, mood, inspirations — so we arrive on the day perfectly aligned with your project.',
    'home-btn':'Back to home','see-portfolio':'View the full portfolio',
    'svc-reserve':'Book my session','services-title':'Photography services & rates','services-sub':'Professional photographer: premium, high-definition images that showcase your project. Our services and rates, by universe.',
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
    'contact-title':'Contact your photographer','contact-sub':'A question, a project, a collaboration\u00a0? Write to us — we reply within 24 hours.',
    'company-label':'Company','follow-label':'Follow us','contact-btn':'Get in touch',
    'ct-success-title':'Message sent','ct-success-text':'Thank you for your message. We will get back to you within 24 hours.',
    'partners-title':'Partnership & collaboration',
    'legal-title':'FAQ & privacy policy',
    'legal-sub':'Answers to the most frequently asked questions, along with our commitments on data privacy and image/video usage rights.',
    'legaltab-faq':'FAQ','legaltab-privacy':'Privacy policy',
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
    'cred-mini1':'Mobile photographer — Béziers, Montpellier, Toulouse',
    'cred-mini2':'Professional photographer, ETPA graduate — BTS Photography 2018',
    'cred-mini3':'Professional-grade equipment',
    'cred-mini4':'8 years of experience · 200+ projects completed',
    'cred-faq-link':'Any questions? Check our FAQ →',
    'testi-share-btn':'Share my experience',
    'share-title':'Share my experience',
    'about-title':'Aya Nascimento, professional portrait photographer',
    'about-sub':'The photographer behind BUNKAIO: premium, high-definition images that showcase your projects.',
    'about-h-bio':'One photographer, one eye',
    'about-p1':'Aya Nascimento is a professional portrait photographer, a graduate of ETPA (BTS Photography, 2018). She is the photographer of BUNKAIO.',
    'about-p2':'Specialised in fashion, product, corporate and event photography, she works with individuals, brands and companies, delivering premium high-definition images, carefully retouched.',
    'about-h-zone':'A mobile studio in Occitanie',
    'about-zone-text':'BUNKAIO travels to you: no studio address, but shoots in Béziers, Montpellier and Toulouse. For a project elsewhere, every request is reviewed with travel costs based on distance.',
    'about-stat1':'years of experience','about-stat2':'projects completed','about-stat3':'ETPA graduate · BTS Photography',
    'about-h-spec':'Specialities',
    'about-spec1':'Portrait & lifestyle','about-spec2':'Fashion, agencies and models','about-spec3':'Product & commercial photography','about-spec4':'Corporate & businesses','about-spec5':'Events & weddings (Lumen)',
    'about-h-method':'How it works',
    'about-step1':'Personalised quote within 48 hours','about-step2':'Shoot on the agreed date','about-step3':'Retouching and post-production','about-step4':'HD delivery in a private gallery, from your client area',
    'about-cta-portfolio':'See the portfolio','about-cta-contact':'Contact BUNKAIO',
    'ft-about':'About','cred-about-link':'Who is behind BUNKAIO? →',
    'zone-label':'Service area','zone-value':'Mobile photographer — Béziers, Montpellier, Toulouse',
    'share-sub':'Have you worked with BUNKAIO? Your feedback helps other clients picture what to expect — and it means a great deal to us.',
    'share-info-label':'How it works',
    'share-info-value':'Your message is sent to us directly. With your consent, it may be published (anonymised if you prefer) in the testimonials section of the site.',
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
    'p-who':'Who can become a Founding Partner\u00a0?',
    'p-who-text':'The Founding Partners programme is reserved for companies and professionals whose work, values and standards align with the Bunkaio universe. We are particularly looking for\u00a0:',
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
    'p-places-text':'To preserve the quality of every collaboration, the number of founding partners is deliberately limited\u00a0: 10 places per universe (portrait & lifestyle, fashion & models, commercial & products, events, weddings & Lumen), for a maximum of <strong>60 founding partners</strong> nationwide.',
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
    'partner-redirect-title':'Are you also a professional whose work deserves to be told ?',
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
    'login-no-account':'No account yet\u00a0?','login-create':'Create an account',
    'register-info':'Fill in this form: your request is sent to us directly and you will receive your <strong>personal access code by email within 24 hours</strong>.',
    'register-activity':'Your business *','register-btn':'Request my access',
    'register-error':'Please fill in all required fields.',
    'register-has-account':'Already have an account\u00a0?','register-login':'Sign in',
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
    'acc-subs-manage-title':'Need to adjust your subscription ?',
    'acc-subs-manage-text':'Pause, cancel or change plan — write to us directly.',
    'acc-subs-manage-btn':'Write to us',
    'acc-subs-upsell-title':'A one-off project alongside your subscription ?',
    'acc-subs-upsell-text':'Your add-ons are billed at partner rate (-20%).',
    'acc-subs-upsell-btn':'Estimate a project',
    'acc-upsell-title':'A new project in mind ?',
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
    'lr-text':'Your deliverables are hosted on Adobe Lightroom. Sign in with the credentials provided to you to view and download your images.',
    'lr-btn':'Go to Lightroom',
    'acc-step-devis':'Quote confirmed','acc-step-shoot':'Shoot scheduled','acc-step-post':'Post-production','acc-step-livre':'Delivered',
    'acc-help-title':'Any question about your project ?','acc-help-sub':'Your BUNKAIO contact replies to you directly.','acc-help-btn':'Write to us',
    'acc-info-address':'Billing address — optional',
    'acc-info-not-set':'Not provided',
    'acc-info-edit-btn':'Edit my information',
    'acc-info-save-btn':'Save changes',
    'acc-info-cancel-btn':'Cancel',
    'acc-info-note':'To change your login email, please contact us directly.',
    'acc-info-success-title':'Changes saved',
    'acc-info-success-text':'Your information has been updated.',
    'comm-kicker':'Going further',
    'comm-title':'Need support with your digital communication\u00a0?',
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
    'process-payment-info':'<strong>Payment terms:</strong> 30% deposit upon signing the quote, balance due on delivery of your deliverables. Each payment can be split into 3 interest-free instalments with Klarna, by credit card or by direct debit.',
    'process-cancel-info':'<strong>Cancellation:</strong> once the quote is accepted, the 30% deposit paid at booking is retained by BUNKAIO and is non-refundable if you cancel.',
    'process-delay-info':'The delivery timelines indicated on each package begin on the day of the shoot.',
    'process-rights-info':'Full commercial usage rights for all delivered visuals are granted to you with no time limit.',
    'pay-flex-kicker':'Flexible payment',
    'pay-flex-text':'<strong>3 interest-free instalments with Klarna</strong>, credit card or direct debit — or in two payments, 30% deposit then balance. No extra fees, ever.',
    'pay-flex-pill-klarna':'3x interest-free',
    'pay-flex-pill-card':'Credit card',
    'pay-flex-pill-debit':'Direct debit',
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
    'ph-reg-email':'you@company.com'
  }
};

Object.assign(I18N.fr, { 'acc-promotions':'Mes promotions', 'acc-reseau':'Mon réseau', 'acc-collabs':'Mes collaborations' });
Object.assign(I18N.en, { 'acc-promotions':'My promotions', 'acc-reseau':'My network', 'acc-collabs':'My collaborations' });

function t(obj){ return typeof obj === 'object' ? obj[LANG] : obj; }

function updatePlaceholders(){
  const PH = {
    'qName':'ph-name','qEmail':'ph-email','qPhone':'ph-phone','qProject':'ph-project',
    'ctName':'ph-ct-name','ctEmail':'ph-ct-email','ctPhone':'ph-phone','ctMsg':'ph-message',
    'logEmail':'ph-email','logCode':'ph-code',
    'regName':'ph-reg-name','regEmail':'ph-reg-email','regPhone':'ph-phone','regActivity':'ph-activity'
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
  document.documentElement.lang = LANG;
  applySeoMeta(currentView);
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
  if (document.getElementById('view-legal').classList.contains('active')) { renderFaqAccordion(); renderPrivacyAccordion(); }
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
    tag:{fr:'Extérieur · studio · solo · couple · groupe', en:'Outdoor · studio · solo · couple · group'},
    pitch:{fr:'Pas besoin d\'être à l\'aise devant l\'objectif : c\'est notre rôle de vous mettre en confiance. Résultat, des photos qui vous ressemblent vraiment — livrées en 5 jours.',
      en:'No need to feel at ease in front of the camera — that\'s our job. The result: photos that truly look like you, delivered in 5 days.'},
    icon:'camera',
    tiers:{
      deco:{ price:230, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['1h de séance — extérieur ou studio (+60€)','8 photos HD retouchées','Sélection guidée incluse','Galerie privée de téléchargement'],
        en:['1h session — outdoor or studio (+€60)','8 retouched HD photos','Guided selection included','Private download gallery'] } },
      sig:{ price:390, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['2h de séance','15 photos HD retouchées','Direction de pose incluse','Galerie privée de téléchargement'],
        en:['2h session','15 retouched HD photos','Posing guidance included','Private download gallery'] } },
      prem:{ price:590, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Demi-journée (4h) — jusqu\'à 2 ambiances','25 photos HD retouchées','2 tenues différentes','Direction artistique complète','Galerie privée de téléchargement'],
        en:['Half-day (4h) — up to 2 moods','25 retouched HD photos','2 different outfits','Full art direction','Private download gallery'] } },
      edit:{ price:990, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
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
      deco:{ price:490, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['Mini-série — 8 photos HD retouchées','Un produit ou une silhouette','Direction artistique incluse'],
        en:['Mini series — 8 retouched HD photos','One product or one look','Art direction included'] } },
      sig:{ price:990, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Lookbook — 20 photos HD retouchées','1 Reel vertical pour les réseaux','Direction artistique incluse'],
        en:['Lookbook — 20 retouched HD photos','1 vertical Reel for social media','Art direction included'] } },
      prem:{ price:1590, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Lookbook — 30 photos HD retouchées','1 film principal','2 Reels verticaux','Direction artistique incluse'],
        en:['Lookbook — 30 retouched HD photos','1 main film','2 vertical Reels','Art direction included'] } },
      edit:{ price:2390, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
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
      deco:{ price:350, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['Jusqu\'à 5 produits — 10 photos HD retouchées','Fond neutre studio','Galerie privée de téléchargement'],
        en:['Up to 5 products — 10 retouched HD photos','Neutral studio backdrop','Private download gallery'] } },
      sig:{ price:690, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['Jusqu\'à 12 produits — 20 photos HD retouchées','Mise en scène incluse','Galerie privée de téléchargement'],
        en:['Up to 12 products — 20 retouched HD photos','Styled setup included','Private download gallery'] } },
      prem:{ price:1290, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['Jusqu\'à 25 produits — 35 photos HD retouchées','Mise en scène incluse','1 Reel vertical produit','Galerie privée de téléchargement'],
        en:['Up to 25 products — 35 retouched HD photos','Styled setup included','1 vertical product Reel','Private download gallery'] } },
      edit:{ price:2190, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
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
    name:{fr:'Lumen', en:'Lumen'},
    tag:{fr:'Photobooth IA — mariages haut de gamme', en:'IA Photobooth — luxury weddings'},
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
  immobilier: {
    price: 550,
    name:{fr:'Studio Continu — Immobilier', en:'Studio Continu — Real Estate'},
    items:{
      fr:['1 reportage photo par mois (jusqu\'à 25 photos HD, 1 ou 2 biens)','1 Reel vertical par mois (annonces + réseaux)','Priorité planning 48h — vos biens en avant-première','Options supplémentaires au tarif partenaire (-20%)'],
      en:['1 photo shoot per month (up to 25 HD photos, 1 or 2 properties)','1 vertical Reel per month (listings + social)','48-hour priority scheduling on every new listing','All add-ons at partner rate (-20%)'] }
  },
  artisan: {
    price: 350,
    name:{fr:'Studio Continu — Atelier', en:'Studio Continu — Workshop'},
    items:{
      fr:['1 session atelier par mois (jusqu\'à 20 photos HD)','1 Reel storytelling : le geste, la matière, la pièce','Votre fil Instagram devient un carnet de création vivant','Options supplémentaires au tarif partenaire (-20%)'],
      en:['1 workshop session per month (up to 20 HD photos)','1 storytelling Reel: the craft, the material, the piece','Your Instagram feed becomes a living creative journal','All add-ons at partner rate (-20%)'] }
  },
  mode: {
    price: 750,
    name:{fr:'Studio Continu — Marque', en:'Studio Continu — Brand'},
    items:{
      fr:['1 session lifestyle ou lookbook par mois (jusqu\'à 25 photos HD)','2 Reels verticaux par mois, prêts pour vos campagnes','Direction artistique continue — cohérence visuelle toute l\'année','Options supplémentaires au tarif partenaire (-20%)'],
      en:['1 lifestyle or lookbook session per month (up to 25 HD photos)','2 vertical Reels per month, ready for your campaigns','Ongoing art direction — full-year visual consistency','All add-ons at partner rate (-20%)'] }
  }
};

/* Formule spécialisée "Polas" — uniquement Mode & créateurs. Studio obligatoire (+60€, voir computeTotal).
   Polas (digitals) = photos brutes et sans retouche, destinées exclusivement aux agences pour évaluer
   la morphologie, la posture et le potentiel brut du mannequin — aucune mise en scène. */
const POLAS = {
  mode: {
    price: 190,
    name:{fr:'Polas', en:'Polas'},
    delay:{fr:'Livraison HD sous 24h', en:'HD delivery within 24h'},
    items:{
      fr:['Séance studio sur fond blanc, lumière neutre','Photos brutes, sans retouche ni mise en scène','Visage, profils et plans corps entier','Fichiers HD prêts à transmettre à votre agence'],
      en:['Studio session on a plain white background, neutral lighting','Raw shots, no retouching or styling','Face, profiles and full-body shots','HD files ready to send to your agency'] }
  }
};

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
      { id:'p1',  label:{fr:'1 photo à l\'unité',            en:'1 photo (unit price)'},   price:35 },
      { id:'p10', label:{fr:'Pack 10 photos supplémentaires', en:'Pack of 10 extra photos'}, price:300 },
      { id:'p15', label:{fr:'Pack 15 photos supplémentaires', en:'Pack of 15 extra photos'}, price:420 },
      { id:'p20', label:{fr:'Pack 20 photos supplémentaires', en:'Pack of 20 extra photos'}, price:520 },
    ]},
  { id:'drone', icon:'🚁', price:'À partir de 390€', comingSoon: true,
    name:{fr:'Prises de vue drone additionnelles', en:'Additional drone footage'},
    note:{fr:'Perspectives aériennes supplémentaires par pilote certifié A1/A3 & A2. Précisez le volume souhaité dans votre message.',
          en:'Additional aerial perspectives by A1/A3 & A2 certified pilot. Specify the volume needed in your message.'} },
  { id:'video', icon:'🎬', price:'À partir de 190€',
    name:{fr:'Film additionnel', en:'Additional film'},
    note:{fr:'Reel vertical 60s à partir de 190€ · Film court 60-90s à partir de 390€ · Film principal 2min à partir de 690€. Précisez le format souhaité.',
          en:'Vertical Reel 60s from €190 · Short film 60-90s from €390 · Main film 2min from €690. Specify the format needed.'} },
  { id:'social', icon:'📱', price:'190€',
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
  { id:'ess',  name:{fr:'Essentiel',  en:'Essentials'},
    badge: null,
    price: 550, priceUSD: 600,
    delay:{fr:'7 jours ouvrés', en:'7 working days'},
    items:{
      fr:['Photobooth IA installé et opérationnel','Jusqu\'à 4 heures de prestation','Impressions illimitées incluses','Galerie privée livrée sous 7 jours'],
      en:['IA photobooth set up and ready','Up to 4 hours service','Unlimited prints included','Private gallery delivered within 7 days'] }
  },
  { id:'sig',  name:{fr:'Signature',  en:'Signature'},
    badge:{fr:'Le plus choisi', en:'Most popular'},
    price: 1100, priceUSD: 1200,
    delay:{fr:'5 jours ouvrés', en:'5 working days'},
    items:{
      fr:['Photobooth IA installé et opérationnel','Jusqu\'à 6 heures de prestation','Style personnalisé (fond, habillage, palette)','Impressions illimitées incluses','Galerie privée livrée sous 5 jours'],
      en:['IA photobooth set up and ready','Up to 6 hours service','Custom style (backdrop, branding, palette)','Unlimited prints included','Private gallery delivered within 5 days'] }
  },
  { id:'surm', name:{fr:'Sur-mesure', en:'Bespoke'},
    badge:{fr:'Entièrement personnalisé', en:'Fully bespoke'},
    price: 1800, priceUSD: 2000,
    delay:{fr:'Sur accord', en:'On agreement'},
    items:{
      fr:['Devis personnalisé selon votre projet','Durée, style et options définis ensemble'],
      en:['Personalised quote based on your project','Duration, style and options defined together'] }
  }
];

const LUMEN_PROFILES = [
  { id:'mariage', name:{fr:'Mariage',                       en:'Wedding'},               icon:'couple',
    desc:{fr:'Vous préparez votre mariage et souhaitez offrir une expérience mémorable à vos invités. Lumen installe un photobooth IA élégant et discret, adapté à l\'ambiance de votre réception.',
          en:'You are planning your wedding and want to offer your guests a memorable experience. Lumen sets up an elegant, discreet IA photobooth suited to your reception atmosphere.'} },
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
  { id:'lumen-heure', icon:'⏱', price: 190,
    name:{fr:'Heure supplémentaire', en:'Additional hour'},
    note:{fr:'Prolongez votre prestation d\'une heure. Facturable par heure additionnelle.',
          en:'Extend your service by one hour. Billed per additional hour.'} },
  { id:'lumen-print', icon:'🖨', price: null,
    name:{fr:'Impressions illimitées', en:'Unlimited prints'},
    note:{fr:'Tirages photo illimités pendant toute la durée de la prestation. Inclus dans les formules Essentiel et Signature.',
          en:'Unlimited photo prints throughout the service. Included in the Essentials and Signature packages.'} }
];

const PROFILES = [
  { id:'agence',   name:{fr:'Agence / studio',          en:'Agency / studio'},         icon:'agency'  },
  { id:'promo',    name:{fr:'Propriétaire / promoteur',  en:'Owner / developer'},       icon:'promo'   },
  { id:'marque',   name:{fr:'Marque / label',            en:'Brand / label'},           icon:'marque'  },
  { id:'artisan',  name:{fr:'Artisan / créateur',        en:'Artisan / maker'},         icon:'artisan' },
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
  mode:       ['marque', 'agence', 'artisan', 'autre'],
  commercial: ['marque', 'agence', 'gastro', 'artisan', 'autre'],
  event:      ['event', 'agence', 'marque', 'autre']
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

const PF_CATS = [
  { id:'immobilier',  label:{fr:'Immobilier', en:'Real estate'} },
  { id:'archi',       label:{fr:'Architecture',en:'Architecture'} },
  { id:'artisan',     label:{fr:'Artisanat',   en:'Craftsmanship'} },
  { id:'photo-part',  label:{fr:'Séance photo',en:'Portrait'} },
  { id:'mode',        label:{fr:'Mode',        en:'Fashion'} },
  { id:'commercial',  label:{fr:'Commercial',  en:'Commercial'} },
  { id:'event',       label:{fr:'Événementiel',en:'Events'} },
  { id:'lumen',       label:{fr:'Lumen',       en:'Lumen'} }
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
const S = { cat:null, tier:null, prof:null, opts:[], comm:false, studio:false, photoPack:null, name:'', email:'', phone:'', project:'', delay:'' };


const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      if (e.target.classList.contains('ph')) setTimeout(() => e.target.classList.add('revealed'), 80);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
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

  if (viewKey === 'home' && IMG.homeVideo) {
    wrap.classList.add('is-dark');
    if (viewEl) viewEl.classList.remove('has-bg-video');
    wrap.style.display = '';
    let vw = videoWrapFor('home');
    if (!vw) {
      vw = document.createElement('div');
      vw.className = 'hero-video-wrap';
      vw.dataset.view = 'home';
      const vid = createBgVideo(IMG.homeVideo);
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
    }
    showOnlyVideoWrap(gvw);
    wrap.querySelectorAll('.hero-slide').forEach(s => s.remove());
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
function seoRouteFor(v){ return typeof SEO_ROUTES !== 'undefined' ? SEO_ROUTES.find(r => r.view === v) || null : null; }
function seoRouteForPath(path){
  if (typeof SEO_ROUTES === 'undefined') return null;
  const p = path.replace(/index\.html$/, '');
  return SEO_ROUTES.find(r => r.path === p) || null;
}
function setHeadAttr(sel, attr, val){ const el = document.querySelector(sel); if (el) el.setAttribute(attr, val); }
function applySeoMeta(v){
  const r = seoRouteFor(v);
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
  setHeadAttr('meta[name="robots"]', 'content', r.index ? 'index, follow' : 'noindex, nofollow');
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
  goView(r ? r.view : 'home', null, { fromPop: true });
});

function goView(v, subTab, opts){
  opts = opts || {};
  currentView = v;
  const route = seoRouteFor(v);
  if (route && !opts.fromPop && !opts.initial && location.pathname.replace(/index\.html$/, '') !== route.path) {
    history.pushState({ v }, '', route.path);
  }
  applySeoMeta(v);
  const run = () => {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === v));
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
    if (v === 'services') { renderServices(); setSvcTab('catalogue'); }
    if (v === 'drone') { renderDroneCats(); renderDroneProjects(activeDroneCat); }
    if (v === 'portfolio' && !pfLoaded) { renderPfTabs(); selectPfTab(PF_CATS[0].id); pfLoaded = true; }
    if (v === 'partners') {
      renderPartnersAccordion(); renderLogoCarousel();
      setPartnersTab(subTab === 'collab' || subTab === 'apply' ? subTab : 'program');
      const img = document.getElementById('img-partners-banner'); if (img && !img.src) img.src = IMG.partners;
      const imgCollab = document.getElementById('img-collab-side'); if (imgCollab && !imgCollab.src) imgCollab.src = IMG.collab;
    }
    if (v === 'legal') { renderFaqAccordion(); renderPrivacyAccordion(); setLegalTab('faq'); }
    if (v === 'about') { const ph = document.getElementById('img-about'); if (ph && IMG.aboutPhoto && !ph.getAttribute('src')) { ph.src = IMG.aboutPhoto; ph.hidden = false; } }
    /* Anime au scroll tous les éléments .rv de la vue active — cohérent
       sur l'ensemble du site, plus besoin de le câbler page par page.
       .reassure-section utilise un seuil de déclenchement plus tardif
       pour que l'animation soit visible plutôt que déjà terminée. */
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

function quizStep(n){
  currentStep = n;
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
  if (n === 5) updateQuizPayReassurance();
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
      ? '<strong>Côté règlement :</strong> votre abonnement est réglable chaque mois par carte bancaire ou prélèvement automatique, sans engagement de paiement anticipé.'
      : '<strong>On the payment side:</strong> your subscription is billed monthly by credit card or direct debit, with no upfront payment required.';
    return;
  }
  const res = computeTotal();
  const threeX = Math.round(res.amount / 3).toLocaleString('fr-FR');
  el.innerHTML = LANG === 'fr'
    ? `<strong>Côté règlement :</strong> soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, prélèvement automatique, ou acompte 30 % + solde. Sans aucun frais supplémentaire.`
    : `<strong>On the payment side:</strong> that's 3 × €${threeX} interest-free with Klarna — or credit card, direct debit, or a 30% deposit + balance. No extra fees.`;
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
function goToQuizCategory(catId){
  goView('quiz');
  S.cat = catId; S.tier = null; S.prof = null;
  const box = document.getElementById('profQBox');
  if (box) box.style.display = 'none';
  renderProfiles();
  quizStep(2);
}

/* Renvoie vers la page Services, filtrée sur la catégorie concernée —
   c'est le tableau de tarifs de ce domaine qui s'affiche directement. */
function goToServiceTable(catId){
  activeServiceFilter = catId;
  goView('services');
}

/* Carrousel des prestations — section "Le studio" (page Accueil).
   Une carte par catégorie du formulaire de devis (CATS), cliquable,
   renvoie directement à l'étape profil pour cette catégorie. */
function renderMissionServices(){
  const track = document.getElementById('missionServicesTrack');
  if (!track) return;
  /* Liste doublée : le carrousel boucle sans à-coup (voir msGo). */
  const cards = CATS.map(c => `
    <div class="mission-service-card" onclick="goToQuizCategory('${c.id}')">
      ${getIcon(c.icon)}
      <div class="mission-service-name">${t(c.name)}</div>
    </div>`).join('');
  track.innerHTML = cards + cards;
  msIndex = 0;
  msLayout(false);
}

/* Carrousel « Le studio » : défile seul, une prestation à la fois, avec
   deux flèches. Le cadre (viewport) est dimensionné pour ne contenir que
   des cartes entières — jamais de carte coupée sur les bords. */
let msIndex = 0, msPaused = false, msTimer = null, msBusy = false;
function msMaxWidth(){
  const box = document.getElementById('missionServices');
  const arrows = box ? [...box.querySelectorAll('.mission-arrow')].reduce((w, a) => w + a.offsetWidth + 10, 0) : 0;
  return box ? Math.max(0, box.clientWidth - arrows) : 0;
}
function msLayout(animate){
  const vp = document.getElementById('missionServicesViewport');
  const track = document.getElementById('missionServicesTrack');
  if (!vp || !track || !track.children.length) return;
  const cards = [...track.children];
  const n = cards.length / 2;
  const max = msMaxWidth();
  const start = cards[msIndex].offsetLeft;
  let end = start + cards[msIndex].offsetWidth;
  for (let k = 1; k < n; k++) {
    const c = cards[msIndex + k];
    if (!c || c.offsetLeft + c.offsetWidth - start > max) break;
    end = c.offsetLeft + c.offsetWidth;
  }
  const tr = animate ? '' : 'none';
  vp.style.transition = tr; track.style.transition = tr;
  vp.style.width = (end - start) + 'px';
  track.style.transform = 'translateX(' + (-start) + 'px)';
}
function msGo(dir){
  const track = document.getElementById('missionServicesTrack');
  if (!track || !track.children.length || msBusy) return;
  const n = track.children.length / 2;
  if (dir < 0 && msIndex === 0) { msIndex = n; msLayout(false); void track.offsetWidth; }
  msIndex += dir;
  msBusy = true;
  msLayout(true);
  setTimeout(() => {
    if (msIndex >= n) { msIndex -= n; msLayout(false); }
    msBusy = false;
  }, 650);
}
function initMissionServicesAutoplay(){
  const box = document.getElementById('missionServices');
  if (!box || box.dataset.autoplayInit) return;
  box.dataset.autoplayInit = '1';
  const pause = ms => { msPaused = true; clearTimeout(msTimer); if (ms) msTimer = setTimeout(() => { msPaused = false; }, ms); };
  document.getElementById('missionPrev').addEventListener('click', () => { msGo(-1); pause(6000); });
  document.getElementById('missionNext').addEventListener('click', () => { msGo(1); pause(6000); });
  setInterval(() => { if (!msPaused && document.getElementById('missionVideoWrap').classList.contains('active')) msGo(1); }, 3200);
  box.addEventListener('mouseenter', () => { msPaused = true; clearTimeout(msTimer); });
  box.addEventListener('mouseleave', () => { msPaused = false; });
  box.addEventListener('touchstart', () => pause(5000), { passive: true });
  window.addEventListener('resize', () => msLayout(false));
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
        <div class="cat-tag">${t(c.tag)}</div>
        <div class="cat-arrow"></div>
      </div>`;
    d.onclick = () => {
      S.cat = c.id; S.tier = null; S.prof = null;
      /* profNext removed — auto-advance */
      document.getElementById('profQBox').style.display = 'none';
      renderProfiles();
      quizStep(2);
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
    : (CAT_PROFILES[S.cat] ? PROFILES.filter(p => CAT_PROFILES[S.cat].includes(p.id)) : PROFILES);
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
      clearTimeout(_profAdvanceTimer);
      _profAdvanceTimer = setTimeout(() => goToTiers(), 2400);
    };
    el.appendChild(d);
  });
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

function renderTiers(){
  renderTiersBase();
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
      ? 'Lumen by Bunkaio — trois formules pour votre mariage, de l\'essentiel à l\'entièrement sur-mesure.'
      : 'Lumen by Bunkaio — three packages for your wedding, from essentials to fully bespoke.';
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
          <div class="tier-price">${priceStr}<small>HT</small></div>
        </div>
        ${chfLine}
        <div class="tier-pay-line">${payLine}</div>
        <div class="tier-detail">${t(lt.items).join(' · ')}</div>`;
      d.onclick = () => { S.tier = lt.id; renderRecap(); renderOptions(); quizStep(4); };
      el.appendChild(d);
    });
    return;
  }
  subEl.textContent = POLAS[S.cat]
    ? (LANG === 'fr'
        ? t(cat.name) + ' — un format Polas pour mannequins, ainsi que quatre formules, de la découverte à l\'expérience éditoriale complète.'
        : t(cat.name) + ' — a Polas format for models, plus four packages, from the starter offer to the complete editorial experience.')
    : (LANG === 'fr'
        ? t(cat.name) + ' — quatre formules, de la découverte à l\'expérience éditoriale complète.'
        : t(cat.name) + ' — four packages, from the starter offer to the complete editorial experience.');
  let slot = 0;
  if (POLAS[S.cat]) {
    const polas = POLAS[S.cat];
    const total = pp(polas.price + 60);
    const threeX = Math.round(total / 3).toLocaleString('fr-FR');
    const payLine = LANG === 'fr' ? `Soit 3 × ${threeX}€ sans frais` : `That's 3 × €${threeX} interest-free`;
    const badge = LANG === 'fr' ? 'Spécial mannequins' : 'For models';
    const studioNote = LANG === 'fr' ? 'Studio inclus (+60€)' : 'Studio included (+€60)';
    const d = document.createElement('div');
    d.className = 'tier-card stagger';
    d.style.animationDelay = (0.24 + slot++ * 0.1) + 's';
    d.innerHTML = `
      ${polas.promo ? `<div class="tier-promo">${t(polas.promo)}</div>` : ''}<div class="tier-badge">${badge}</div>
      <div class="tier-head">
        <div class="tier-name">${t(polas.name)}</div>
        <div class="tier-price">${total.toLocaleString('fr-FR')}€<small>HT</small></div>
      </div>
      <div class="tier-pay-line">${payLine}</div>
      <div class="tier-detail">${t(polas.items).join(' · ')} · ${studioNote}</div>`;
    d.onclick = () => { S.tier = 'polas'; renderRecap(); renderOptions(); quizStep(4); };
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
        <div class="tier-price">${pp(td.price).toLocaleString('fr-FR')}€<small>HT</small></div>
      </div>
      <div class="tier-pay-line">${payLine}</div>
      <div class="tier-detail">${t(td.items).join(' · ')}</div>`;
    d.onclick = () => { S.tier = tier.id; renderRecap(); renderOptions(); quizStep(4); };
    el.appendChild(d);
  });
  if (SUBS[S.cat]) {
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
        <div class="tier-price">${pp(sub.price).toLocaleString('fr-FR')}€<small>HT/${LANG === 'fr' ? 'mois' : 'mo'}</small></div>
      </div>
      <div class="tier-detail">${t(sub.items).join(' · ')}</div>
      <div class="sub-engagement">${engagement} · ${saving}</div>`;
    d.onclick = () => { S.tier = 'sub'; renderRecap(); renderOptions(); quizStep(4); };
    el.appendChild(d);
  }
}

function renderRecap(){
  renderRecapBase();
  const box = document.getElementById('recapBox');
  if (box) box.insertAdjacentHTML('beforeend', partnerQuizNotice());
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
      ? '💳 Réglable par carte bancaire ou prélèvement automatique, chaque mois.'
      : '💳 Payable by credit card or direct debit, every month.';
    box.innerHTML = `
      <div class="recap-label">${selLabel}</div>
      <div class="recap-title">
        <span>${t(sub.name)}</span>
        <span>${pp(sub.price).toLocaleString('fr-FR')}€ HT/${LANG === 'fr' ? 'mois' : 'mo'}</span>
      </div>
      <div class="recap-payment">${payLine}</div>
      <ul class="recap-items">
        ${t(sub.items).map(i => `<li>${i}</li>`).join('')}
      </ul>
      <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${engagement}</div>`;
    return;
  }
  if (S.tier === 'polas') {
    const polas = POLAS[S.cat];
    const total = pp(polas.price + 60);
    const threeX = Math.round(total / 3).toLocaleString('fr-FR');
    const payLine = LANG === 'fr'
      ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, prélèvement automatique, acompte 30 % + solde.`
      : `💳 That's 3 × €${threeX} interest-free with Klarna — or credit card, direct debit, 30% deposit + balance.`;
    const studioLabel = LANG === 'fr' ? 'Studio inclus (+60€)' : 'Studio included (+€60)';
    box.innerHTML = `
      <div class="recap-label">${selLabel}</div>
      <div class="recap-title">
        <span>${t(cat.name)} — ${t(polas.name)}</span>
        <span>${total.toLocaleString('fr-FR')}€ HT</span>
      </div>
      <div class="recap-payment">${payLine}</div>
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
          ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, prélèvement automatique, acompte 30 % + solde.`
          : `💳 That's 3 × €${threeX} interest-free with Klarna — or credit card, direct debit, 30% deposit + balance.`);
    box.innerHTML = `
      <div class="recap-label">${selLabel}</div>
      <div class="recap-title">
        <span>Lumen — ${t(lt.name)}</span>
        <span>${pricePrefix}${(isSurm ? lt.price : pp(lt.price)).toLocaleString('fr-FR')}€${chfLine} HT</span>
      </div>
      <div class="recap-payment">${payLine}</div>
      <ul class="recap-items">
        ${t(lt.items).map(i => `<li>${i}</li>`).join('')}
      </ul>
      <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${LANG === 'fr' ? 'Livraison' : 'Delivery'} : ${t(lt.delay)}</div>`;
    return;
  }
  const tier = TIERS.find(x => x.id === S.tier);
  const td = cat.tiers[S.tier];
  const delivLabel = LANG === 'fr' ? 'Livraison' : 'Delivery';
  const studioSupplement = (S.cat === 'photo-part' && S.studio) ? ' + 60€ studio' : '';
  const threeX = Math.round(pp(td.price) / 3).toLocaleString('fr-FR');
  const payLine = LANG === 'fr'
    ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna — ou carte bancaire, prélèvement automatique, acompte 30 % + solde.`
    : `💳 That's 3 × €${threeX} interest-free with Klarna — or credit card, direct debit, 30% deposit + balance.`;
  box.innerHTML = `
    <div class="recap-label">${selLabel}</div>
    <div class="recap-title">
      <span>${t(cat.name)} — ${t(tier.name)}</span>
      <span>${pp(td.price).toLocaleString('fr-FR')}€${studioSupplement} HT</span>
    </div>
    <div class="recap-payment">${payLine}</div>
    <ul class="recap-items">
      ${t(td.items).map(i => `<li>${i}</li>`).join('')}
    </ul>
    <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${delivLabel} : ${t(td.delay)}</div>`;
}

function commEligible(){
  if (S.cat === 'lumen') return false;
  if (S.cat === 'mode') return false;
  if (S.cat === 'photo-part') return false;
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

  if (S.tier === 'polas') {
    S.studio = true;
    label.style.display = 'none';
    const note = document.createElement('div');
    note.className = 'sub-options-note stagger';
    note.style.animationDelay = '0.4s';
    note.innerHTML = LANG === 'fr'
      ? '<strong>Bon à savoir :</strong> le format Polas est une expérience clé en main — studio inclus, sans option additionnelle.'
      : '<strong>Good to know:</strong> the Polas format is a turnkey experience — studio included, no additional options.';
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

  /* ─── Studio ou extérieur (photo-part seulement) ─── */
  if (S.cat === 'photo-part') {
    const studioDiv = document.createElement('div');
    studioDiv.className = 'stagger';
    studioDiv.style.cssText = 'animation-delay:0.38s; margin-bottom:28px';
    const studioLabel = LANG === 'fr'
      ? '<div class="opt-section-label" style="margin-top:0;margin-bottom:16px">Lieu de la séance</div>'
      : '<div class="opt-section-label" style="margin-top:0;margin-bottom:16px">Session location</div>';
    const extLabel = LANG === 'fr' ? 'Extérieur' : 'Outdoor';
    const stuLabel = LANG === 'fr' ? 'Studio (+60€ — utilisation du matériel studio)' : 'Studio (+€60 — studio equipment fee)';
    studioDiv.innerHTML = studioLabel + `
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <div class="photo-pack" id="loc-ext" data-loc="ext" onclick="selectLocation('ext')" style="flex:1;min-width:130px">
          <span>📍 ${extLabel}</span><span class="photo-pack-price">${LANG==='fr'?'Inclus':'Included'}</span>
        </div>
        <div class="photo-pack" id="loc-stu" data-loc="stu" onclick="selectLocation('stu')" style="flex:1;min-width:130px">
          <span>🎞 ${stuLabel}</span><span class="photo-pack-price">+60€</span>
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
  document.getElementById('qSubmit').disabled = !(S.name && S.email && S.email.includes('@') && S.project.length > 0 && S.delay);
}

function computeTotal(){
  if (S.tier === 'sub') return { amount: pp(SUBS[S.cat].price), surDevis: false };
  if (S.tier === 'polas') return { amount: pp(POLAS[S.cat].price + 60), surDevis: false };
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
  if (S.cat === 'photo-part' && S.studio) total += 60;
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
    targetAmount = res.amount;
    surDevis     = res.surDevis;
  }

  if (payEl) {
    if (isSub) {
      payEl.textContent = LANG === 'fr'
        ? '💳 Réglable chaque mois par carte bancaire ou prélèvement automatique.'
        : '💳 Billed monthly by credit card or direct debit.';
    } else if (S.cat === 'lumen' && S.tier === 'surm') {
      payEl.textContent = LANG === 'fr'
        ? '💳 Devis personnalisé — réponse sous 48h ouvrées. Paiement : acompte 30 % + solde à la livraison.'
        : '💳 Personalised quote — reply within 48 working hours. Payment: 30% deposit + balance on delivery.';
    } else {
      const threeX = Math.round(targetAmount / 3).toLocaleString('fr-FR');
      payEl.textContent = LANG === 'fr'
        ? `💳 Soit 3 × ${threeX}€ sans frais avec Klarna, ou par carte bancaire / prélèvement automatique.`
        : `💳 That's 3 × €${threeX} interest-free with Klarna, or by credit card / direct debit.`;
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
    amtEl.textContent = cur.toLocaleString('fr-FR') + '€ HT' + (isSub ? monthlyLabel : '');
    if (p < 1) frame = requestAnimationFrame(step);
    else amtEl.textContent = targetAmount.toLocaleString('fr-FR') + '€ HT' + (isSub ? monthlyLabel : '');
  }
  frame = requestAnimationFrame(step);

  /* Sur devis note */
  noteEl.style.display = surDevis ? 'block' : 'none';
  if (surDevis) {
    noteEl.textContent = LANG === 'fr'
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
    formuleLabel = 'ABONNEMENT — ' + sub.name.fr + ' (' + pp(sub.price) + '€ HT/mois, engagement 6 mois)';
    montantLabel = pp(sub.price) + '€ HT/mois';
    budgetMontantEur = pp(sub.price);
  } else if (S.tier === 'polas') {
    const polas = POLAS[S.cat];
    const res = computeTotal();
    formuleLabel = polas.name.fr + ' (' + res.amount + '€ HT, dont 60€ studio inclus)';
    montantLabel = res.amount + '€ HT';
    budgetMontantEur = res.amount;
  } else if (S.cat === 'lumen') {
    const lt = LUMEN_TIERS.find(x => x.id === S.tier);
    const res = computeTotal();
    const priceStr = lt.id === 'surm' ? 'à partir de 1800€ HT' : pp(lt.price) + '€ HT';
    formuleLabel = 'Lumen — ' + lt.name.fr + ' (' + priceStr + ')';
    montantLabel = lt.id === 'surm'
      ? 'Sur devis (à partir de 1800€ HT)'
      : res.amount + '€ HT' + (res.surDevis ? ' + options sur devis' : '');
    budgetMontantEur = lt.id === 'surm' ? lt.price : pp(lt.price);
  } else {
    const tier = TIERS.find(x => x.id === S.tier);
    const res = computeTotal();
    formuleLabel = tier.name.fr + ' (' + res.amount + '€ HT' + (S.studio?', dont 60€ studio':'') + ')';
    montantLabel = res.amount + '€ HT' + (res.surDevis ? ' + options sur devis' : '');
    budgetMontantEur = res.amount;
  }
  if (isPartnerUser() && !(S.cat === 'lumen' && S.tier === 'surm')) formuleLabel += ' — TARIF PARTENAIRE -' + PARTNER_DISCOUNT + '% (compte ' + USER.email + ')';
  const allOpts = S.cat === 'lumen'
    ? LUMEN_OPTIONS
    : [...OPTIONS, ...((SPECIAL_OPTIONS[S.cat+'_'+S.tier])||[])];
  const optNames = (S.tier !== 'sub' && S.opts.length)
    ? S.opts.map(id => { const o = allOpts.find(x => x.id === id); return o ? o.name.fr : id; }).filter(Boolean).join(' · ')
    : (S.tier === 'sub' ? '— (abonné : tarif partenaire -20% sur options)' : 'Aucune');
  const studioNote = (S.cat === 'photo-part') ? (S.studio ? 'Studio (+60€)' : 'Extérieur') : (S.tier === 'polas' ? 'Studio inclus (+60€)' : '');
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
    optionsChoisies: optNames,
    interetCommunication: S.comm
  });

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
      options_choisies: optNames,
      montant_total_estime: montantLabel,
      delai_souhaite: (DELAY_LABELS[S.delay] && DELAY_LABELS[S.delay].fr) || S.delay || 'Non renseigné',
      lieu_seance: studioNote || undefined,
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
    ? `<strong>À partir de ${monthly}€/mois avec Klarna</strong>, carte bancaire ou prélèvement automatique — ou en 2 fois, acompte 30 % puis solde. Sans aucun frais supplémentaire.`
    : `<strong>From €${monthly}/mo with Klarna</strong>, credit card or direct debit — or in 2 instalments, 30% deposit then balance. No extra fees.`;
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
        <span class="service-sub-label">${I18N[LANG]['svc-sub-label']}${SUBS[c.id].promo ? `<span class="service-tier-promo">${t(SUBS[c.id].promo)}</span>` : ''}</span>
        <span class="service-sub-price">${SUBS[c.id].price.toLocaleString('fr-FR')}€<small> HT/${LANG === 'fr' ? 'mois' : 'mo'}</small></span>
      </div>` : '';
    card.innerHTML = `
      <div class="service-head">
        <div class="service-icon">${getIcon(c.icon)}</div>
        <div class="service-name">${t(c.name)}</div>
      </div>
      <div class="service-tag">${t(c.tag)}</div>
      ${c.pitch ? `<p class="service-pitch">${t(c.pitch)}</p>` : ''}
      <div class="service-tiers">
        ${c.lumen
          ? LUMEN_TIERS.map(lt => `
              <div class="service-tier">
                <span class="service-tier-name">${t(lt.name)}${lt.promo ? `<span class="service-tier-promo">${t(lt.promo)}</span>` : ''}</span>
                <span class="service-tier-price">${lt.id === 'surm' ? (LANG === 'fr' ? 'Devis' : 'Quote') : lt.price.toLocaleString('fr-FR') + '€'}<small>${lt.id === 'surm' ? '' : ' HT'}</small></span>
              </div>`).join('')
          : TIERS.map(tier => `
              <div class="service-tier">
                <span class="service-tier-name">${t(tier.name)}${c.tiers[tier.id].promo ? `<span class="service-tier-promo">${t(c.tiers[tier.id].promo)}</span>` : ''}</span>
                <span class="service-tier-price">${c.tiers[tier.id].price.toLocaleString('fr-FR')}€<small>HT</small></span>
              </div>`).join('')}
      </div>
      ${subRow}
      <button class="service-cta">${I18N[LANG]['svc-cta']}</button>`;
    card.querySelector('.service-cta').onclick = () => {
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
    { title:'Your moodboard',              text:'In your client space, you share your vision — art direction, mood, inspirations — so we arrive on the day perfectly aligned with your project.', badge:'Optional' },
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
function probeImageExists(src){
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
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
      ph.innerHTML = `<img loading="lazy" src="${src}" alt="${LANG === 'fr' ? 'Photographie' : 'Photography'} ${catLabel} — Bunkaio ${i + 1}">`;
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
  const n = document.getElementById('ctName').value.trim();
  const em = document.getElementById('ctEmail').value.trim();
  const ph = document.getElementById('ctPhone').value.trim();
  const msg = document.getElementById('ctMsg').value.trim();
  const btn = document.querySelector('#ctForm .btn-solid');
  if (btn) btn.disabled = true;
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
function sendShare(e){
  e.preventDefault();
  const n = document.getElementById('shName').value.trim();
  const em = document.getElementById('shEmail').value.trim();
  const spe = document.getElementById('shSpecialty').value;
  const txt = document.getElementById('shText').value.trim();
  const btn = document.querySelector('#shareForm .btn-solid');
  if (btn) btn.disabled = true;
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
    fr:`Exemple : le Pack Signature « Commercial & produits » passe de ${eur(exPrice)} HT à ${eur(partnerPrice(exPrice))} HT, soit ${eur(exPrice - partnerPrice(exPrice))} économisés.`,
    en:`Example: the "Commercial & products" Signature package goes from ${eur(exPrice)} excl. VAT to ${eur(partnerPrice(exPrice))} excl. VAT — you save ${eur(exPrice - partnerPrice(exPrice))}.`}) : '';
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
      updateNavLogin();
      renderAccount();
      goView('account');
    })
    .catch(() => { if (btn) btn.disabled = false; err.style.display = 'block'; });
}

function doRegister(){
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
      action_requise: 'Créer ce compte depuis admin/comptes.html puis envoyer le code d\'accès par email'
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
function renderClientSpotlights(){
  const slots = document.querySelectorAll('.cs-slot');
  if (!slots.length) return;
  const open = !!USER;
  const cta = open ? t({fr:'Ouvrir mon espace', en:'Open my space'}) : t({fr:'Accéder à mon espace client', en:'Access my client area'});
  const check = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 12.5 10 17.5 19 7.5"/></svg>';
  const points = [
    t({fr:'<strong>Un moodboard par commande</strong> : direction artistique, ambiance, palette de couleurs, inspirations', en:'<strong>One moodboard per order</strong>: art direction, mood, colour palette, inspiration'}),
    t({fr:'<strong>Suivi de votre projet</strong>, du shooting à la livraison, étape par étape', en:'<strong>Track your project</strong> from shoot to delivery, step by step'}),
    t({fr:'<strong>Devis, factures, paiements et livrables</strong> accessibles à tout moment', en:'<strong>Quotes, invoices, payments and deliverables</strong> available at any time'}),
  ];
  const act = `<button type="button" class="cs-btn" onclick="${open ? "renderAccount();goView('account')" : "openLogin('client')"}">${cta}</button>`;
  slots.forEach(el => {
    const compact = el.dataset.variant === 'compact';
    const noVisual = compact || el.dataset.visual === 'off';
    el.innerHTML = `
      <section class="cs-spotlight ${compact ? 'cs-compact' : ''} ${noVisual && !compact ? 'cs-novisual' : ''} rv in">
        <div class="cs-main">
          <div class="cs-kicker">${t({fr:'Votre espace client', en:'Your client area'})}</div>
          <h3 class="cs-title">${t({fr:'Une commande, un moodboard personnalisé', en:'One order, one personalised moodboard'})}</h3>
          <p class="cs-lead">${t({fr:'Dès votre devis confirmé, retrouvez tout au même endroit — et créez pour chaque commande un moodboard sur mesure pour nous partager votre vision.', en:'Once your quote is confirmed, find everything in one place — and create a tailor-made moodboard for each order to share your vision with us.'})}</p>
          ${compact ? '' : `<ul class="cs-points">${points.map(x => `<li>${check}<span>${x}</span></li>`).join('')}</ul>`}
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
        </div>`}
      </section>`;
  });
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
   Studio Continu (voir SUBS plus haut) : seules les catégories
   immobilier/artisan/mode proposent l'option abonnement dans le
   questionnaire de devis. USER.abonnement (depuis la base de comptes)
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
    <p class="pt-foot-note">${t({fr:'Prix HT. Les options ajoutées à une prestation bénéficient également du tarif partenaire.', en:'Prices excl. VAT. Add-ons on any service also get the partner rate.'})}</p>`;
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
  if (lrBtn) lrBtn.href = USER.lightroomUrl || 'https://lightroom.adobe.com';
  renderAccInfoView();
  toggleAccInfoEdit(false);
  /* Un compte partenaire atterrit directement sur son onglet dédié —
     "Mes commandes" n'a pas vraiment de sens pour lui par défaut. */
  setAccountTab(USER.type === 'partner' ? 'partenariat' : 'orders');
}

/* ═══════════════ ESPACE CLIENT — MES INFORMATIONS ═══════════════ */
function renderAccInfoView(){
  if (!USER) return;
  const notSet = I18N[LANG]['acc-info-not-set'];
  document.getElementById('accInfoName').textContent = USER.nom || notSet;
  document.getElementById('accInfoEmail').textContent = USER.email || notSet;
  document.getElementById('accInfoPhone').textContent = USER.telephone || notSet;
  document.getElementById('accInfoAddress').textContent = USER.adresse || notSet;
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
    document.getElementById('accEditName').value = USER.nom || '';
    document.getElementById('accEditPhone').value = USER.telephone || '';
    document.getElementById('accEditAddress').value = USER.adresse || '';
  }
}

/* Écrit directement dans la base de comptes via /account-update (voir
   server/src/index.ts → handleAccountUpdate) : la mise à jour est
   immédiate et définitive, plus une simple demande par email. Le code
   d'accès (USER_CODE, en mémoire depuis la connexion) ré-authentifie
   l'appel — l'email de connexion n'est volontairement pas modifiable
   ici (c'est la clé d'identité du compte). */
function saveAccInfo(){
  const n  = document.getElementById('accEditName').value.trim();
  const ph = document.getElementById('accEditPhone').value.trim();
  const ad = document.getElementById('accEditAddress').value.trim();
  const err = document.getElementById('accInfoError');
  if (!n) { err.style.display = 'block'; return; }
  err.style.display = 'none';
  const btn = document.querySelector('#accInfoEdit .btn-solid');
  if (btn) btn.disabled = true;
  fetch(ACCOUNTS_API_BASE + '/account-update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: USER.type, email: USER.email, code: USER_CODE, nom: n, telephone: ph, adresse: ad })
  }).then(r => r.json()).then(data => {
    if (btn) btn.disabled = false;
    if (!data.ok || !data.account) {
      err.textContent = 'Erreur lors de l\'enregistrement. Écrivez à contact@bunkaio.com';
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

/* ═══════════════ PRESTATIONS — carrousel horizontal natif (Accueil) ═══════════════
   Section en flux normal de page (pas de calque position:fixed, pas de
   déclencheur multi-écrans piloté par IntersectionObserver sur un
   pourcentage de hauteur — l'ancienne mécanique, cassée sur iOS Safari
   par le bug 100vh de barre d'adresse dynamique, qui pouvait laisser le
   calque en permanence invisible). Une slide par catégorie (photo +
   texte dans le même bloc), le scroll horizontal (swipe tactile,
   glissement trackpad, molette convertie) est géré nativement par le
   navigateur via scroll-snap — le même mécanisme fiable que n'importe
   quel carrousel "stories" sur mobile. */
let _catShowcaseInit = false;
function initCatShowcase(){
  const root = document.getElementById('catShowcase');
  const track = document.getElementById('catShowcaseTrack');
  const dotsWrap = document.getElementById('catShowcaseDots');
  const arrowPrev = document.getElementById('catShowcaseArrowPrev');
  const arrowNext = document.getElementById('catShowcaseArrowNext');
  if (!root || !track || !dotsWrap || _catShowcaseInit) return;
  if (!CATS.length) return;
  _catShowcaseInit = true;

  track.innerHTML = CATS.map(cat => {
    const url = IMG.servicePhotos && IMG.servicePhotos[cat.id];
    return `
      <div class="cat-showcase-slide" data-cat="${cat.id}"${url ? ` style="background-image:url('${url}')"` : ''}>
        <div class="cat-showcase-overlay"></div>
        <div class="cat-showcase-content">
          <div class="cat-showcase-name">${t(cat.name)}</div>
          <div class="cat-showcase-tag">${t(cat.tag)}</div>
          <button class="hero-start" onclick="goToServiceTable('${cat.id}')"><span>${t({fr:'Découvrir cette prestation',en:'Discover this service'})}</span></button>
        </div>
      </div>`;
  }).join('');
  dotsWrap.innerHTML = CATS.map((cat, i) => `<div class="cat-showcase-dot${i === 0 ? ' active' : ''}" data-idx="${i}" onclick="_catShowcaseJump(${i})"></div>`).join('');

  const slides = Array.from(track.querySelectorAll('.cat-showcase-slide'));
  const dots = Array.from(dotsWrap.querySelectorAll('.cat-showcase-dot'));
  let currentIdx = 0;
  let hintShown = false;

  /* Estompe la flèche en bord de parcours (pas de "précédent" sur la
     première catégorie, pas de "suivant" sur la dernière). */
  const paintArrows = (idx) => {
    if (arrowPrev) arrowPrev.classList.toggle('is-disabled', idx <= 0);
    if (arrowNext) arrowNext.classList.toggle('is-disabled', idx >= slides.length - 1);
  };

  const setActive = (idx) => {
    currentIdx = idx;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    paintArrows(idx);
  };

  const goTo = (idx, behavior) => {
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    track.scrollTo({ left: idx * track.clientWidth, behavior: behavior || 'smooth' });
  };
  window._catShowcaseJump = (idx) => goTo(idx); /* points cliquables */
  window._catShowcaseNav = (delta) => goTo(currentIdx + delta); /* flèches gauche/droite */
  if (arrowPrev) arrowPrev.addEventListener('click', () => goTo(currentIdx - 1));
  if (arrowNext) arrowNext.addEventListener('click', () => goTo(currentIdx + 1));

  /* Détecte la slide effectivement centrée après un scroll horizontal
     natif (swipe, trackpad, molette convertie ci-dessous ou scrollTo
     programmatique) — un simple debounce sur l'évènement scroll du
     conteneur, sans dépendance à la hauteur du viewport de la page. */
  let scrollTimer = null;
  track.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      setActive(Math.max(0, Math.min(slides.length - 1, idx)));
    }, 80);
  }, { passive: true });

  /* Molette souris classique (pas de trackpad) : convertit un scroll
     vertical en défilement horizontal du carrousel, pratique tant qu'on
     n'est pas en bord de parcours — sinon on laisse la page défiler
     verticalement normalement. Le trackpad (swipe latéral natif,
     deltaX) n'a besoin d'aucune aide : le navigateur gère déjà le
     scroll horizontal nativement, tout comme le swipe tactile mobile. */
  root.addEventListener('wheel', (e) => {
    const adx = Math.abs(e.deltaX), ady = Math.abs(e.deltaY);
    if (adx > ady) return; /* déjà horizontal -> laisser faire nativement */
    const atStart = track.scrollLeft <= 4;
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    if ((e.deltaY > 0 && atEnd) || (e.deltaY < 0 && atStart)) return;
    e.preventDefault();
    track.scrollLeft += e.deltaY;
  }, { passive: false });

  /* Re-snap sur la slide courante après un redimensionnement (rotation
     d'écran, changement de fenêtre) : la position en pixels calculée
     pour l'ancienne largeur ne correspond plus. */
  window.addEventListener('resize', () => goTo(currentIdx, 'auto'));

  /* Révélation flou -> net de la 1ère catégorie + indice "ça glisse" sur
     les flèches, une seule fois, à la première arrivée réelle sur la
     section (pas au chargement de la page) — simple IntersectionObserver
     sur une section d'un seul écran de haut : aucun piège 100vh iOS ici,
     contrairement à un déclencheur de plusieurs écrans de haut. */
  paintArrows(0);
  const revealIO = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    slides[currentIdx].classList.add('is-active');
    if (!hintShown) {
      hintShown = true;
      setTimeout(() => {
        if (arrowPrev) arrowPrev.classList.add('teach');
        if (arrowNext) arrowNext.classList.add('teach');
      }, 500);
    }
    revealIO.disconnect();
  }, { threshold: 0.3 });
  revealIO.observe(root);
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
  const vid = createBgVideo(IMG.missionVideo);
  box.appendChild(vid);

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
          <div class="pp-example-prices"><span class="pt-price-old">${eur(exPrice)} ${t({fr:'HT', en:'excl. VAT'})}</span><strong>${eur(partnerPrice(exPrice))} ${t({fr:'HT', en:'excl. VAT'})}</strong><em>${t({fr:'vous économisez', en:'you save'})} ${eur(exPrice - partnerPrice(exPrice))}</em></div>
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
  if (trig && trig.getAttribute('aria-expanded') !== 'true') toggleAccordion(trig);
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

function toggleAccordion(btn){
  const body = btn.nextElementSibling;
  const open = body.classList.contains('open');
  /* Accordéon « exclusif » : ouvrir un item referme les autres, pour garder
     une page courte et dynamique. */
  const group = btn.closest('.accordion-item')?.parentElement;
  if (!open && group && group.dataset.exclusive) {
    group.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach(t => {
      t.setAttribute('aria-expanded', 'false');
      t.nextElementSibling.classList.remove('open');
    });
  }
  body.classList.toggle('open', !open);
  btn.setAttribute('aria-expanded', String(!open));
}

/* ═══════════════ FAQ & POLITIQUE DE CONFIDENTIALITÉ ═══════════════ */
function setLegalTab(tab){
  document.getElementById('legaltab-faq').classList.toggle('active', tab === 'faq');
  document.getElementById('legaltab-privacy').classList.toggle('active', tab === 'privacy');
  document.getElementById('lsec-faq').style.display = tab === 'faq' ? 'block' : 'none';
  document.getElementById('lsec-privacy').style.display = tab === 'privacy' ? 'block' : 'none';
}

function renderAccordionInto(elId, sections, opts){
  const el = document.getElementById(elId);
  if (!el) return;
  if (opts && opts.exclusive) el.dataset.exclusive = '1';
  el.innerHTML = sections.map((s, i) => `
    <div class="accordion-item">
      <button class="accordion-trigger" aria-expanded="${i === 0 ? 'true' : 'false'}" onclick="toggleAccordion(this)">
        <span>${s.title}</span>
        <span class="accordion-chevron"><svg viewBox="0 0 24 24" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></span>
      </button>
      <div class="accordion-body ${i === 0 ? 'open' : ''}">
        <div class="accordion-content" style="font-size:14px;line-height:1.9;color:#3a3544">${s.body}</div>
      </div>
    </div>`).join('');
}

function renderFaqAccordion(){
  const sections = LANG === 'fr' ? [
    { title:'Quelles prestations proposez-vous ?', body:`<p>Bunkaio est un photographe professionnel : nous produisons des images haut de gamme, en HD, pour <strong>portrait & lifestyle</strong>, <strong>mode, agences et mannequins</strong>, <strong>commercial & produits</strong>, <strong>événementiel</strong>, et <strong>Lumen</strong>, le photobooth IA pour mariages. Chaque univers a ses formules détaillées dans notre <strong>catalogue & prix</strong>.</p>` },
    { title:'Quelle est la qualité des images livrées ?', body:`<p>Des photos <strong>haute définition, retouchées</strong> avec soin, prêtes à être publiées ou imprimées. Elles sont livrées dans une <strong>galerie privée</strong> à télécharger depuis votre espace client, et vous disposez des droits d'utilisation commerciale.</p>` },
    { title:'Comment se déroule une prestation, de la demande à la livraison ?', body:`<p>Quatre étapes simples : <strong>devis</strong> personnalisé sous 48h, <strong>shooting</strong> à la date convenue, <strong>post-production</strong> (tri, retouche, montage), puis <strong>livraison</strong> de vos visuels via votre espace client. Le détail complet est dans l'onglet « Devis & déroulé » de la page Services.</p>` },
    { title:'Je ne suis pas à l\'aise devant l\'objectif, est-ce un problème ?', body:`<p>Pas du tout : c'est notre rôle de vous mettre en confiance. Nous vous guidons sur les poses et l'ambiance pour obtenir des photos qui vous ressemblent vraiment.</p>` },
    { title:'Quels sont les délais de livraison ?', body:`<p>Ils varient selon la formule choisie et sont indiqués sur chaque offre du catalogue. Ils démarrent à la date du shooting, hors demandes de retouches complémentaires.</p>` },
    { title:'Comment fonctionne le paiement ?', body:`<p>30 % à la commande (signature du devis), solde à la livraison. Paiement par carte bancaire, prélèvement automatique, ou en 3x sans frais avec Klarna.</p>` },
    { title:'Que se passe-t-il si j\'annule ma prestation ?', body:`<p>Votre date et votre créneau sont réservés dès la validation du devis et le versement de l'<strong>acompte de 30 %</strong>. Si vous annulez après cette validation, <strong>l'acompte reste acquis à Bunkaio et n'est pas remboursé</strong>. Pour toute difficulté, contactez-nous le plus tôt possible.</p>` },
    { title:'Puis-je utiliser les visuels pour un usage commercial ?', body:`<p>Oui. L'ensemble des droits d'utilisation des visuels livrés vous est cédé pour un usage commercial, sans limite de durée. Le détail des droits cédés est précisé dans l'onglet « Politique de confidentialité » ci-contre.</p>` },
    { title:'Comment accéder à mon espace client, et à quoi sert-il ?', body:`<p>Une fois votre devis confirmé, vous recevez par email votre <strong>code d'accès personnel</strong> : cliquez sur « Connexion » en haut du site. Vous restez connecté sur votre appareil jusqu'à votre déconnexion.</p><p>Vous y suivez l'avancement de votre projet, retrouvez vos <strong>commandes, devis, paiements et factures</strong>, téléchargez vos livrables, gérez vos abonnements et vos informations. Pas encore de code ? Demandez-le depuis la page de connexion : il vous est envoyé sous 24h.</p>` },
    { title:'Qu\'est-ce qu\'un moodboard, et est-il obligatoire ?', body:`<p>Non, il est facultatif mais très utile : un <strong>moodboard par commande</strong> pour nous partager votre vision — direction artistique, ambiance, palette de couleurs, inspirations (Pinterest, liens), et les prestataires impliqués. Vous le complétez depuis votre espace client et vous échangez avec l'équipe grâce aux commentaires.</p>` },
    { title:'Mes informations et mes images sont-elles en sécurité ?', body:`<p>Votre espace est protégé par votre email et un <strong>code d'accès personnel</strong>, conservé sous forme chiffrée. Vos données ne servent qu'à la réalisation de votre projet, et vos visuels vous sont livrés dans une galerie privée. Le détail est dans l'onglet « Politique de confidentialité ».</p>` },
    { title:'Où intervenez-vous ?', body:`<p>Nous intervenons en déplacement à <strong>Béziers, Montpellier et Toulouse</strong>, et plus largement en Occitanie. Pour un projet ailleurs, toute demande est étudiée avec des frais de déplacement calculés selon la distance.</p>` },
    { title:'Comment devenir partenaire, et que propose l\'espace partenaire ?', body:`<p>Candidatez depuis la page <strong>Partenariat et collaboration</strong> : réponse personnalisée sous 5 jours ouvrés. Une fois admis, votre espace partenaire vous donne <strong>-20 % permanent</strong> sur le catalogue, des promotions, des <strong>missions collaboratives rémunérées</strong> que vous acceptez ou déclinez en un clic, et l'accès au réseau de professionnels. Vous choisissez d'être référencé·e ou non dans l'annuaire.</p>` },
    { title:'Qu\'est-ce que Lumen by Bunkaio ?', body:`<p>Lumen est le photobooth IA de Bunkaio, conçu pour les mariages haut de gamme et les événements : il offre aux invités une expérience mémorable et aux mariés des souvenirs durables. Trois formules — Essentiel, Signature et Sur-mesure — selon la durée et la personnalisation souhaitées.</p>` },
  ] : [
    { title:'What services do you offer?', body:`<p>Bunkaio is a professional photographer: we produce premium, high-definition images for <strong>portrait & lifestyle</strong>, <strong>fashion, agencies and models</strong>, <strong>commercial & products</strong>, <strong>events</strong>, and <strong>Lumen</strong>, the IA photobooth for weddings. Each universe has its packages detailed in our <strong>catalogue & rates</strong>.</p>` },
    { title:'What is the quality of the delivered images?', body:`<p><strong>High-definition, carefully retouched</strong> photos, ready to publish or print. They are delivered in a <strong>private gallery</strong> you can download from your client area, with commercial usage rights.</p>` },
    { title:'How does a project run, from request to delivery?', body:`<p>Four simple steps: a personalised <strong>quote</strong> within 48h, the <strong>shoot</strong> on the agreed date, <strong>post-production</strong> (selection, retouching, editing), then <strong>delivery</strong> via your client area. Full details are under the "Quote & process" tab on the Services page.</p>` },
    { title:'I\'m not comfortable in front of the camera — is that a problem?', body:`<p>Not at all: it's our job to put you at ease. We guide you on poses and mood so the photos truly look like you.</p>` },
    { title:'What are the delivery times?', body:`<p>They depend on the package chosen and are shown on each catalogue offer. They start from the shoot date, excluding any additional retouching requests.</p>` },
    { title:'How does payment work?', body:`<p>30% upon booking (quote signature), balance on delivery. Pay by card, direct debit, or in 3 interest-free instalments with Klarna.</p>` },
    { title:'What happens if I cancel my booking?', body:`<p>Your date and time slot are reserved once the quote is accepted and the <strong>30% deposit</strong> is paid. If you cancel after that point, <strong>the deposit is retained by Bunkaio and is non-refundable</strong>. If you run into any difficulty, please contact us as early as possible.</p>` },
    { title:'Can I use the visuals for commercial purposes?', body:`<p>Yes. All usage rights to the delivered visuals are transferred to you for commercial use, with no time limit. Details are set out in the "Privacy policy" tab opposite.</p>` },
    { title:'How do I access my client area, and what is it for?', body:`<p>Once your quote is confirmed, you receive your <strong>personal access code</strong> by email: click "Sign in" at the top of the site. You stay signed in on your device until you sign out.</p><p>There you follow your project's progress, find your <strong>orders, quotes, payments and invoices</strong>, download your deliverables, and manage your subscriptions and details. No code yet? Request it from the sign-in page: it is sent within 24h.</p>` },
    { title:'What is a moodboard, and is it compulsory?', body:`<p>No, it is optional but very useful: <strong>one moodboard per order</strong> to share your vision — art direction, mood, colour palette, inspiration (Pinterest, links) and the providers involved. You complete it from your client area and chat with the team through comments.</p>` },
    { title:'Are my details and images safe?', body:`<p>Your space is protected by your email and a <strong>personal access code</strong>, stored in encrypted form. Your data is only used to carry out your project, and your visuals are delivered in a private gallery. Details are in the "Privacy policy" tab.</p>` },
    { title:'Where do you work?', body:`<p>We travel to <strong>Béziers, Montpellier and Toulouse</strong>, and more broadly across Occitanie. For a project elsewhere, every request is reviewed, with travel costs calculated based on distance.</p>` },
    { title:'How do I become a partner, and what does the partner area offer?', body:`<p>Apply from the <strong>Partnership & collaboration</strong> page: a personal reply within 5 working days. Once admitted, your partner area gives you a <strong>permanent 20% discount</strong> on the catalogue, promotions, <strong>paid collaborative missions</strong> you accept or decline in one click, and access to the professional network. You choose whether to be listed in the directory.</p>` },
    { title:'What is Lumen by Bunkaio?', body:`<p>Lumen is Bunkaio's IA photobooth, designed for luxury weddings and events: it gives guests a memorable experience and couples lasting memories. Three packages — Essentials, Signature and Bespoke — depending on duration and customisation.</p>` },
  ];
  renderAccordionInto('faqAccordion', sections, { exclusive: true });
}

function renderPrivacyAccordion(){
  const sections = LANG === 'fr' ? [
    { title:'Responsable du traitement des données', body:`<p>Ce site est édité par <strong>BUNKAIO</strong>, Entreprise Individuelle, SIRET 951 547 587 00034, France. Pour toute question relative à vos données personnelles, contactez-nous à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Données collectées et finalités', body:`<p>Nous collectons uniquement les données que vous nous transmettez volontairement : nom, email, téléphone et informations relatives à votre projet via le formulaire de contact, le questionnaire de devis ou votre espace client/partenaire.</p><p>Ces données sont utilisées exclusivement pour répondre à vos demandes, établir vos devis et gérer votre compte. Elles ne sont ni vendues, ni cédées, ni partagées avec des tiers à des fins commerciales.</p>` },
    { title:'Base légale et durée de conservation', body:`<p>Le traitement repose sur l'exécution de la relation commerciale ou précontractuelle (devis, prestation) et sur notre intérêt légitime à répondre à vos demandes.</p><p>Vos données sont conservées pendant la durée de la relation commerciale, puis archivées le temps imposé par nos obligations légales et comptables, avant suppression ou anonymisation.</p>` },
    { title:'Cookies et traceurs', body:`<p>Ce site n'utilise aucun cookie publicitaire ni traceur tiers, et ne dépose aucun cookie de suivi. Aucune donnée de navigation n'est collectée à des fins d'analyse ou de profilage.</p>` },
    { title:'Vos droits', body:`<p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité sur vos données.</p><p>Vous pouvez exercer ces droits à tout moment en écrivant à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>. Vous disposez également du droit d'introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>).</p>` },
    { title:'Hébergement et sécurité des données', body:`<p>Ce site est hébergé par GitHub, Inc. Les échanges sont sécurisés (HTTPS). Aucune base de données client n'est publiquement accessible : les informations transmises via nos formulaires sont traitées de façon confidentielle par BUNKAIO.</p>` },
    { title:'Politique d\'annulation et acompte', body:`<p>L'<strong>acompte de 30 %</strong> versé à la signature du devis réserve votre date et votre créneau. En cas d'<strong>annulation de votre part après la validation du devis</strong>, cet acompte reste acquis à BUNKAIO et n'est pas remboursé. Le solde n'est exigible qu'à la livraison des livrables.</p><p>Pour toute question, écrivez-nous à <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Droits d\'auteur et droits d\'utilisation des photos & vidéos', body:`<p>BUNKAIO conserve l'intégralité de ses droits d'auteur (droit moral) sur l'ensemble des photographies et vidéos qu'elle réalise, conformément au Code de la propriété intellectuelle.</p><p>Les <strong>droits d'exploitation</strong> (droits d'utilisation commerciale) des visuels livrés sont cédés au client pour une utilisation commerciale, sans limite de durée, dans les conditions précisées au devis signé.</p><p>BUNKAIO se réserve le droit d'utiliser les visuels produits dans le cadre de ses propres supports de communication, de son portfolio et de ses réseaux sociaux, sauf demande contraire et écrite du client. Toute réutilisation par un tiers autre que le client nécessite l'autorisation écrite préalable de BUNKAIO.</p>` },
    { title:'Mentions légales', body:`<p><strong>Éditeur du site :</strong> BUNKAIO, Entreprise Individuelle — SIRET 951 547 587 00034 — France. Contact : <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a> — 07 58 57 31 61.</p><p><strong>Hébergement :</strong> GitHub, Inc.</p><p><strong>Propriété intellectuelle :</strong> le contenu de ce site (textes, identité visuelle, code) est la propriété de BUNKAIO, sauf mention contraire, et ne peut être reproduit sans autorisation préalable.</p><p><strong>Droit applicable :</strong> le présent site est soumis au droit français ; tout litige relève de la compétence des tribunaux français.</p>` },
  ] : [
    { title:'Data controller', body:`<p>This site is published by <strong>BUNKAIO</strong>, a French sole proprietorship (Entreprise Individuelle), SIRET 951 547 587 00034, France. For any question regarding your personal data, contact us at <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Data collected and purposes', body:`<p>We only collect the data you voluntarily provide: name, email, phone number and project details, via the contact form, the quote questionnaire, or your client/partner area.</p><p>This data is used exclusively to respond to your enquiries, prepare your quotes and manage your account. It is never sold, transferred or shared with third parties for commercial purposes.</p>` },
    { title:'Legal basis and retention period', body:`<p>Processing is based on the performance of the (pre-)contractual relationship (quote, service) and on our legitimate interest in responding to your requests.</p><p>Your data is kept for the duration of the business relationship, then archived for the period required by our legal and accounting obligations, before deletion or anonymisation.</p>` },
    { title:'Cookies and trackers', body:`<p>This site uses no advertising cookies and no third-party trackers, and sets no tracking cookies. No browsing data is collected for analytics or profiling purposes.</p>` },
    { title:'Your rights', body:`<p>In accordance with the GDPR and French data protection law, you have the right to access, rectify, erase, restrict, object to, and port your data.</p><p>You may exercise these rights at any time by writing to <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>. You also have the right to lodge a complaint with the CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener">www.cnil.fr</a>).</p>` },
    { title:'Hosting and data security', body:`<p>This site is hosted by GitHub, Inc. All exchanges are secured (HTTPS). No client database is publicly accessible: information submitted via our forms is handled confidentially by BUNKAIO.</p>` },
    { title:'Cancellation policy and deposit', body:`<p>The <strong>30% deposit</strong> paid when the quote is signed reserves your date and time slot. If <strong>you cancel after the quote has been accepted</strong>, the deposit is retained by BUNKAIO and is non-refundable. The balance is only due on delivery of the deliverables.</p><p>For any question, write to us at <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a>.</p>` },
    { title:'Copyright and usage rights for photos & videos', body:`<p>BUNKAIO retains full authorship rights (moral rights) over all photographs and videos it produces, in accordance with French intellectual property law.</p><p>The <strong>exploitation rights</strong> (commercial usage rights) to the delivered visuals are transferred to the client for commercial use, with no time limit, under the terms set out in the signed quote.</p><p>BUNKAIO reserves the right to use the visuals it produces for its own communication materials, portfolio and social media, unless the client requests otherwise in writing. Any reuse by a third party other than the client requires BUNKAIO's prior written authorisation.</p>` },
    { title:'Legal notice', body:`<p><strong>Site publisher:</strong> BUNKAIO, sole proprietorship — SIRET 951 547 587 00034 — France. Contact: <a href="mailto:contact@bunkaio.com">contact@bunkaio.com</a> — +33 7 58 57 31 61.</p><p><strong>Hosting:</strong> GitHub, Inc.</p><p><strong>Intellectual property:</strong> the content of this site (text, visual identity, code) is the property of BUNKAIO, unless otherwise stated, and may not be reproduced without prior authorisation.</p><p><strong>Governing law:</strong> this site is governed by French law; any dispute falls under the jurisdiction of the French courts.</p>` },
  ];
  renderAccordionInto('privacyAccordion', sections);
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
    b.href = '/services/';
    b.textContent = t(c.name);
    b.onclick = (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return true;
      activeServiceFilter = c.id; goView('services'); return false;
    };
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
initCatShowcase();
renderLogoCarousel();
renderFooterServices();
/* Hero image home */

initHeroCarousel('home');
initHomeClaimVideo();
initTestiAutoplay();
updatePlaceholders();
updateLang();
applyImages();
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
  history.replaceState({ v }, '', location.pathname + location.hash);
  if (v === 'home') { applySeoMeta('home'); return; }
  goView(v === 'account' ? 'login' : v, null, { initial: true });
})();

restoreSession();
