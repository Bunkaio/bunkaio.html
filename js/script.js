/* ═══════════════ FORMSPREE → contact@bunkaio.com ═══════════════ */
const FORMSPREE_URL = 'https://formspree.io/f/mnjybndv';

/* IMG et DRONE_MEDIA sont définis dans config/media.js — chargé avant ce fichier */

/* ═══════════════ LANGUE ═══════════════ */
let LANG = 'fr';

const I18N = {
  fr: {
    'estimate':'Devis','services':'Services','portfolio':'Portfolio','drone':'4K Drone','contact':'Contact','partners':'Partenaires',
    'hero-kicker':'Photographie · vidéo · drone','hero-word1':'Estimez','hero-word2':'votre','hero-word3':'projet','start':'Estimer mon projet',
    'step-cat':'01 — Catégorie','q-cat':'Quel est votre domaine\u00a0?','q-cat-sub':'Sélectionnez l\'univers de votre projet.',
    'step-prof':'02 — Profil','q-prof':'Quel profil êtes-vous\u00a0?','q-prof-sub':'Identifiez-vous pour que nous comprenions précisément votre besoin.',
    'step-tier':'03 — Prestation','q-tier':'Quel niveau de prestation\u00a0?',
    'step-recap':'04 — Votre prestation','q-recap':'Ce qui est inclus','q-recap-sub':'Le détail de votre prestation, et les options pour aller plus loin.',
    'options':'Options supplémentaires',
    'step-coords':'05 — Coordonnées','q-coords':'Vos coordonnées','q-coords-sub':'Nous étudions chaque demande personnellement. Réponse assurée sous 48h.',
    'name-label':'Nom / Société *','email-label':'Email *','phone-label':'Téléphone','phone-label-opt':'Téléphone — optionnel','project-label':'Votre projet *','message-label':'Message *',
    'back':'← Retour','continue':'Continuer','submit':'Confirmez ma demande de devis',
    'success-label':'Demande reçue','success-title':'Votre demande a bien été envoyée',
    'success-text1':'Merci pour votre confiance. Votre demande de devis est entre nos mains : elle sera étudiée et vous recevrez une réponse sous <strong>48 heures</strong>.',
    'success-text2':'Chaque demande est évaluée individuellement et n\'est acceptée que si elle correspond à la <strong>ligne éditoriale de BUNKAIO</strong>. Nous travaillons uniquement avec des projets qui résonnent avec notre univers — c\'est ce qui garantit la qualité de chaque collaboration.',
    'home-btn':'Retour à l\'accueil','see-portfolio':'Voir tout le portfolio',
    'services-title':'Services','services-sub':'L\'ensemble de nos prestations et leurs tarifs, par univers. Chaque formule est pensée pour révéler ce qui rend votre projet unique.',
    'svc-all':'Tous','svc-cta':'Estimer ce projet →','svc-sub-label':'Abonnement mensuel',
    'drone-title':'4K Drone & vidéo',
    'drone-intro':'Derrière chaque image aérienne, il y a une formation, des certifications et un matériel choisi avec exigence. Voici ce qui garantit la qualité — et la légalité — de chacune de nos productions.',
    'cred-label':'Formation, certifications & matériel',
    'cred1-title':'BTS Photographie — ETPA','cred1-text':'Formation supérieure en photographie à l\'ETPA, école de référence. Maîtrise complète de la lumière, de la composition et de la postproduction.',
    'cred2-title':'6 ans d\'expérience terrain','cred2-text':'Six années de photographie de terrain, au contact direct des sujets et des contraintes réelles : lumière changeante, délais, exigence du résultat. Une expérience affinée reportage après reportage.',
    'cred3-title':'Pilote drone certifié A1/A3 & A2','cred3-text':'Certifications européennes catégorie ouverte (A1/A3 et A2) délivrées par la DGAC. Vols déclarés, assurés et conformes à la réglementation en vigueur.',
    'cred4-title':'Un matériel professionnel','cred4-text':'Drone DJI Mavic 3 Pro — capteur 4/3 Hasselblad, vidéo 4K HDR. Boîtier hybride Sony Alpha 7 III et optiques G Master pour la photo et la vidéo au sol.',
    'gear-label':'Équipement','gear-cert':'Certifié A1/A3 · A2',
    'drone-explore':'Explorez nos productions',
    'portfolio-title':'Portfolio','portfolio-sub':'Une sélection de projets réalisés par le studio, classés par univers.',
    'contact-title':'Contact','contact-sub':'Une question, un projet, une collaboration\u00a0? Écrivez-nous — nous répondons sous 24h.',
    'company-label':'Entreprise','follow-label':'Suivez-nous','contact-btn':'Nous contacter',
    'ct-success-title':'Message envoyé','ct-success-text':'Merci pour votre message. Nous reviendrons vers vous sous 24 heures.',
    'partners-title':'Programme Partenaires Fondateurs',
    'p-why':'Pourquoi Bunkaio existe',
    'p-why-1':'Nous vivons dans un monde où les contenus se multiplient, mais où les histoires se raréfient. Chaque jour, des milliers d\'images sont publiées puis oubliées.',
    'p-why-2':'Pourtant, derrière chaque lieu, chaque objet et chaque réalisation se cache une histoire qui mérite d\'être racontée.',
    'p-why-3':'Chez Bunkaio, nous croyons que la valeur d\'un projet ne réside pas uniquement dans son résultat final, mais également dans la vision, les défis et le savoir-faire qui ont permis son existence.',
    'p-mission':'Nous ne documentons pas des projets. Nous révélons ce qui les rend uniques.',
    'p-who':'Qui peut devenir Partenaire Fondateur\u00a0?',
    'p-who-text':'Le programme Partenaires Fondateurs est réservé aux entreprises et professionnels dont les réalisations, les valeurs et l\'exigence correspondent à l\'univers Bunkaio. Nous recherchons notamment\u00a0:',
    'p-list-1':'Architecture & habitat — architectes, architectes d\'intérieur, constructeurs, maîtres d\'œuvre, promoteurs premium',
    'p-list-2':'Aménagement & design — cuisinistes, agenceurs, menuisiers, designers, paysagistes',
    'p-list-3':'Artisanat d\'exception — artisans d\'art, ébénistes, marbriers, ferronniers, créateurs spécialisés',
    'p-list-4':'Marques & lifestyle — marques premium, créateurs, entreprises valorisant le savoir-faire et la qualité',
    'p-list-5':'Événementiel & lieux — domaines, hôtels, lieux de réception, concepts événementiels sélectionnés',
    'p-who-note':'Le programme n\'est pas ouvert à tous. Chaque candidature est étudiée individuellement afin de préserver la cohérence éditoriale de Bunkaio.',
    'p-benefits':'Les avantages du programme',
    'p-b1-title':'Une mise en lumière éditoriale.','p-b1-text':'Votre activité n\'est pas présentée comme une simple prestation : elle est racontée à travers une histoire, selon la méthode éditoriale Bunkaio — la Découverte, la Vision, le Défi, le Savoir-Faire, Mon Regard, la Révélation.',
    'p-b2-title':'Une visibilité renforcée.','p-b2-text':'Présence privilégiée sur le site Bunkaio, les réseaux sociaux et les futurs supports éditoriaux de la marque.',
    'p-b3-title':'Une relation privilégiée.','p-b3-text':'Accès prioritaire aux disponibilités, offres préférentielles de lancement et collaboration sur le long terme.',
    'p-b4-title':'Une appartenance à un écosystème.','p-b4-text':'Rejoindre Bunkaio, c\'est intégrer un cercle de professionnels partageant l\'exigence, le goût du détail et l\'amour du travail bien fait.',
    'p-places':'Les places disponibles',
    'p-places-text':'Afin de préserver la qualité des collaborations, le nombre de partenaires fondateurs est volontairement limité\u00a0: 10 places par univers (architecture, architecture d\'intérieur, cuisinistes, artisans d\'art, piscinistes, marques sélectionnées), soit un maximum de <strong>60 partenaires fondateurs</strong> sur l\'ensemble du territoire.',
    'p-places-note':'Une fois ce quota atteint, les nouvelles candidatures seront placées sur liste d\'attente.',
    'p-process':'Le processus de sélection',
    'p-step1':'<strong>Étape 1 — Présentation du projet.</strong> Le candidat complète le questionnaire Bunkaio et présente son activité, ses réalisations, ses objectifs et son univers.',
    'p-step2':'<strong>Étape 2 — Étude de la candidature.</strong> Chaque projet est analysé selon la qualité des réalisations, la cohérence avec l\'univers Bunkaio, le potentiel éditorial et les valeurs de l\'entreprise.',
    'p-step3':'<strong>Étape 3 — Réponse.</strong> Projet sélectionné, projet compatible (collaboration ponctuelle) ou projet réorienté vers une autre solution, notamment via Agency Nascimento.',
    'p-step4':'<strong>Étape 4 — Lancement.</strong> Onboarding personnalisé, feuille de route éditoriale et accompagnement adapté à votre activité.',
    'p-cta-title':'Rejoindre Bunkaio',
    'p-cta-text':'Bunkaio n\'a pas vocation à travailler avec tout le monde. Nous recherchons des projets qui ont quelque chose à raconter. Si vous pensez que votre histoire mérite d\'être racontée, nous serons heureux de la découvrir.',
    'p-cta-btn':'Candidater',
    'footer-claim':'Nous révélons ce qui rend vos projets uniques.',
    'access-client':'Accès client','access-partner':'Accès partenaire','nav-connect':'Connexion',
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
    'acc-orders':'Mes commandes','acc-payments':'Mes paiements','acc-portfolio':'Mon portfolio',
    'th-date':'Date','th-service':'Prestation','th-amount':'Montant','th-status':'Statut','th-ref':'Référence','th-method':'Méthode',
    'empty-orders':'Aucune commande pour le moment. Vos prestations apparaîtront ici dès leur validation.',
    'empty-payments':'Aucun paiement enregistré pour le moment.',
    'lr-title':'Votre portfolio sur Adobe Lightroom',
    'lr-text':'Vos livrables sont hébergés sur Adobe Lightroom. Connectez-vous avec les identifiants qui vous ont été transmis pour consulter et télécharger vos images.',
    'lr-btn':'Accéder à Lightroom',
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
    'footer-claim2':'Photographie · vidéo · drone',
    'stab-catalogue':'Catalogue & prix','stab-devis':'Devis & déroulé',
    'p-trust':'Ils nous ont fait confiance',
    'process-payment-info':'<strong>Modalités de paiement :</strong> 30 % à la commande à la signature du devis, solde à la livraison des livrables.',
    'process-delay-info':'Les délais indiqués sur chaque formule démarrent à la date du shooting.',
    'process-rights-info':'L\'ensemble des droits d\'utilisation des visuels livrés vous sont cédés pour une utilisation commerciale sans limite de durée.',
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
    'estimate':'Quote','services':'Services','portfolio':'Portfolio','drone':'4K Drone','contact':'Contact','partners':'Partners',
    'hero-kicker':'Photography · video · drone','hero-word1':'Estimate','hero-word2':'your','hero-word3':'project','start':'Estimate My Project',
    'step-cat':'01 — Category','q-cat':'What is your field\u00a0?','q-cat-sub':'Select the universe your project belongs to.',
    'step-prof':'02 — Profile','q-prof':'Which profile are you\u00a0?','q-prof-sub':'Tell us who you are so we can understand exactly what you need.',
    'step-tier':'03 — Service level','q-tier':'Which level of service\u00a0?',
    'step-recap':'04 — Your package','q-recap':'What\'s included','q-recap-sub':'The full details of your package, plus options to take it further.',
    'options':'Additional options',
    'step-coords':'05 — Your details','q-coords':'Your details','q-coords-sub':'Every request is reviewed personally. We reply within 48 hours.',
    'name-label':'Name / Company *','email-label':'Email *','phone-label':'Phone','phone-label-opt':'Phone — optional','project-label':'Your project *','message-label':'Message *',
    'back':'← Back','continue':'Continue','submit':'Confirm my quote request',
    'success-label':'Request received','success-title':'Your request has been sent',
    'success-text1':'Thank you for your trust. Your quote request is in our hands: it will be carefully reviewed and you will receive a reply within <strong>48 hours</strong>.',
    'success-text2':'Every request is assessed individually and is only accepted if it aligns with <strong>BUNKAIO\'s editorial line</strong>. We work exclusively with projects that resonate with our universe — this is what guarantees the quality of every collaboration.',
    'home-btn':'Back to home','see-portfolio':'View the full portfolio',
    'services-title':'Services','services-sub':'All of our services and rates, organised by universe. Each package is designed to reveal what makes your project unique.',
    'svc-all':'All','svc-cta':'Get a quote for this →','svc-sub-label':'Monthly plan',
    'drone-title':'4K Drone & video',
    'drone-intro':'Behind every aerial image lies proper training, official certifications and carefully chosen equipment. Here is what guarantees the quality — and the legality — of every one of our productions.',
    'cred-label':'Training, certifications & equipment',
    'cred1-title':'Advanced Diploma in Photography — ETPA','cred1-text':'Higher education in photography at ETPA, one of France\'s leading photography schools. Full command of light, composition and post-production.',
    'cred2-title':'6 years of field experience','cred2-text':'Six years of photography in the field, working directly with subjects and real-world constraints: changing light, tight schedules, demanding results. An expertise sharpened with every assignment.',
    'cred3-title':'Certified drone pilot — A1/A3 & A2','cred3-text':'European open-category certifications (A1/A3 and A2) issued by the French civil aviation authority (DGAC). Every flight is declared, insured and fully compliant with current regulations.',
    'cred4-title':'Professional-grade equipment','cred4-text':'DJI Mavic 3 Pro drone — 4/3 Hasselblad sensor, 4K HDR video. Sony Alpha 7 III mirrorless body and G Master lenses for ground photography and video.',
    'gear-label':'Equipment','gear-cert':'Certified A1/A3 · A2',
    'drone-explore':'Explore our work',
    'portfolio-title':'Portfolio','portfolio-sub':'A selection of projects produced by the studio, organised by universe.',
    'contact-title':'Contact','contact-sub':'A question, a project, a collaboration\u00a0? Write to us — we reply within 24 hours.',
    'company-label':'Company','follow-label':'Follow us','contact-btn':'Get in touch',
    'ct-success-title':'Message sent','ct-success-text':'Thank you for your message. We will get back to you within 24 hours.',
    'partners-title':'Founding Partners Programme',
    'p-why':'Why Bunkaio exists',
    'p-why-1':'We live in a world where content keeps multiplying, yet stories are becoming rare. Every day, thousands of images are published and then forgotten.',
    'p-why-2':'And yet, behind every place, every object and every achievement lies a story that deserves to be told.',
    'p-why-3':'At Bunkaio, we believe the value of a project lies not only in its final result, but also in the vision, the challenges and the craftsmanship that brought it to life.',
    'p-mission':'We don\'t document projects. We reveal what makes them unique.',
    'p-who':'Who can become a Founding Partner\u00a0?',
    'p-who-text':'The Founding Partners programme is reserved for companies and professionals whose work, values and standards align with the Bunkaio universe. We are particularly looking for\u00a0:',
    'p-list-1':'Architecture & living — architects, interior architects, builders, project managers, premium developers',
    'p-list-2':'Fittings & design — kitchen specialists, fitters, joiners, designers, landscape architects',
    'p-list-3':'Exceptional craftsmanship — master artisans, cabinetmakers, marble workers, ironworkers, specialised makers',
    'p-list-4':'Brands & lifestyle — premium brands, creators, companies that champion craftsmanship and quality',
    'p-list-5':'Events & venues — estates, hotels, reception venues, selected event concepts',
    'p-who-note':'The programme is not open to everyone. Every application is reviewed individually in order to preserve Bunkaio\'s editorial coherence.',
    'p-benefits':'Programme benefits',
    'p-b1-title':'An editorial spotlight.','p-b1-text':'Your work is not presented as a mere service: it is told as a story, following the Bunkaio editorial method — Discovery, Vision, Challenge, Craftsmanship, My Perspective, Revelation.',
    'p-b2-title':'Enhanced visibility.','p-b2-text':'A privileged presence on the Bunkaio website, our social channels and the brand\'s future editorial publications.',
    'p-b3-title':'A privileged relationship.','p-b3-text':'Priority access to our schedule, preferential launch rates and a long-term working relationship.',
    'p-b4-title':'Belonging to an ecosystem.','p-b4-text':'Joining Bunkaio means entering a circle of professionals who share the same high standards, eye for detail and love of work well done.',
    'p-places':'Available places',
    'p-places-text':'To preserve the quality of every collaboration, the number of founding partners is deliberately limited\u00a0: 10 places per universe (architecture, interior architecture, kitchen specialists, master artisans, pool builders, selected brands), for a maximum of <strong>60 founding partners</strong> nationwide.',
    'p-places-note':'Once this quota is reached, new applications will be placed on a waiting list.',
    'p-process':'The selection process',
    'p-step1':'<strong>Step 1 — Presenting your project.</strong> The candidate completes the Bunkaio questionnaire and presents their activity, their work, their goals and their universe.',
    'p-step2':'<strong>Step 2 — Application review.</strong> Each project is assessed on the quality of its work, its fit with the Bunkaio universe, its editorial potential and the company\'s values.',
    'p-step3':'<strong>Step 3 — Response.</strong> Project selected, project compatible (one-off collaboration), or project redirected towards another solution, notably through Agency Nascimento.',
    'p-step4':'<strong>Step 4 — Launch.</strong> Personalised onboarding, an editorial roadmap and support tailored to your business.',
    'p-cta-title':'Join Bunkaio',
    'p-cta-text':'Bunkaio was never meant to work with everyone. We look for projects that have something to say. If you believe your story deserves to be told, we would be delighted to discover it.',
    'p-cta-btn':'Apply',
    'footer-claim':'We reveal what makes your projects unique.',
    'access-client':'Client area','access-partner':'Partner area','nav-connect':'Sign in',
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
    'acc-orders':'My orders','acc-payments':'My payments','acc-portfolio':'My portfolio',
    'th-date':'Date','th-service':'Service','th-amount':'Amount','th-status':'Status','th-ref':'Reference','th-method':'Method',
    'empty-orders':'No orders yet. Your services will appear here as soon as they are confirmed.',
    'empty-payments':'No payments recorded yet.',
    'lr-title':'Your portfolio on Adobe Lightroom',
    'lr-text':'Your deliverables are hosted on Adobe Lightroom. Sign in with the credentials provided to you to view and download your images.',
    'lr-btn':'Go to Lightroom',
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
    'footer-claim2':'Photography · video · drone',
    'stab-catalogue':'Catalogue & rates','stab-devis':'Quote & process',
    'p-trust':'They trusted us',
    'process-payment-info':'<strong>Payment terms:</strong> 30% deposit upon signing the quote, balance due on delivery of your deliverables.',
    'process-delay-info':'The delivery timelines indicated on each package begin on the day of the shoot.',
    'process-rights-info':'Full commercial usage rights for all delivered visuals are granted to you with no time limit.',
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
  document.getElementById('langBtn').textContent = LANG === 'fr' ? 'EN' : 'FR';
  updatePlaceholders();
  refreshDynamic();
}

function toggleLang(){
  LANG = LANG === 'fr' ? 'en' : 'fr';
  updateLang();
}

function refreshDynamic(){
  renderCats();
  renderFooterServices();
  if (S.cat && document.getElementById('qs-2').classList.contains('active')) renderProfiles();
  if (S.cat && document.getElementById('qs-3').classList.contains('active')) renderTiers();
  if (S.cat && S.tier && document.getElementById('qs-4').classList.contains('active')) { renderRecap(); renderOptions(); }
  if (S.cat && document.getElementById('qs-6').classList.contains('active')) renderQuizPortfolio();
  if (document.getElementById('view-services').classList.contains('active')) { renderServices(); if (activeSvcTab === 'devis') renderProcessSteps(); }
  if (document.getElementById('view-drone').classList.contains('active')) { renderDroneCats(); renderDroneProjects(activeDroneCat); }
  if (document.getElementById('view-partners').classList.contains('active')) renderPartnersAccordion();
  if (document.getElementById('view-login').classList.contains('active')) setLoginType(loginType);
  if (USER && document.getElementById('view-account').classList.contains('active')) renderAccount();
}

/* ═══════════════ DONNÉES ═══════════════ */
const CATS = [
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
  { id:'cuisine',
    name:{fr:'Cuisines haut de gamme', en:'High-end kitchens'},
    tag:{fr:'Cuisinistes · showrooms', en:'Kitchen makers · showrooms'},
    icon:'gastro',
    tiers:{
      deco:{ price:390, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['8 photos HD retouchées','Une réalisation ou un espace showroom','Galerie privée de téléchargement'],
        en:['8 retouched HD photos','One project or one showroom space','Private download gallery'] } },
      sig:{ price:790, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['20 photos HD retouchées','Mise en valeur des matériaux et finitions','Galerie privée de téléchargement'],
        en:['20 retouched HD photos','Showcasing materials and finishes','Private download gallery'] } },
      prem:{ price:1290, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['30 photos HD retouchées','1 film principal (60 secondes)','1 Reel vertical pour les réseaux','Galerie privée de téléchargement'],
        en:['30 retouched HD photos','1 main film (60 seconds)','1 vertical Reel for social media','Private download gallery'] } },
      edit:{ price:1990, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['35 photos HD retouchées','1 film principal (90 secondes)','2 Reels verticaux','Storytelling de la réalisation','Publication sur les supports Bunkaio'],
        en:['35 retouched HD photos','1 main film (90 seconds)','2 vertical Reels','Project storytelling','Featured on Bunkaio channels'] } }
    }},
  { id:'piscine',
    name:{fr:'Piscines & extérieurs', en:'Pools & outdoor spaces'},
    tag:{fr:'Piscinistes · paysagistes', en:'Pool builders · landscapers'},
    icon:'paysage',
    tiers:{
      deco:{ price:390, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['8 photos HD retouchées','Une réalisation au meilleur moment de la journée','Galerie privée de téléchargement'],
        en:['8 retouched HD photos','One project at the best moment of the day','Private download gallery'] } },
      sig:{ price:790, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['20 photos HD retouchées','Travail de la lumière naturelle et des reflets','Galerie privée de téléchargement'],
        en:['20 retouched HD photos','Natural light and reflections carefully crafted','Private download gallery'] } },
      prem:{ price:1290, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['30 photos HD retouchées','8 photos aériennes par drone certifié','1 film principal (60 secondes)','1 Reel vertical'],
        en:['30 retouched HD photos','8 aerial photos by certified drone','1 main film (60 seconds)','1 vertical Reel'] } },
      edit:{ price:1990, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['35 photos HD retouchées','10 photos aériennes par drone certifié','1 film principal (90 secondes)','2 Reels verticaux','Storytelling de la réalisation','Publication sur les supports Bunkaio'],
        en:['35 retouched HD photos','10 aerial photos by certified drone','1 main film (90 seconds)','2 vertical Reels','Project storytelling','Featured on Bunkaio channels'] } }
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
  { id:'photo-part',
    name:{fr:'Séance photo — particuliers', en:'Portrait & lifestyle — individuals'},
    tag:{fr:'Extérieur · studio · solo · couple · groupe', en:'Outdoor · studio · solo · couple · group'},
    icon:'autre',
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
    name:{fr:'Mode & créateurs', en:'Fashion & brands'},
    tag:{fr:'Marques · agences · e-commerce · lookbook', en:'Brands · agencies · e-commerce · lookbook'},
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
  { id:'event',
    name:{fr:'Événementiel', en:'Events'},
    tag:{fr:'Domaines · entreprises · réceptions', en:'Estates · corporate · receptions'},
    icon:'event',
    tiers:{
      deco:{ price:390, delay:{fr:'3 jours ouvrés',en:'3 working days'}, items:{
        fr:['30 photos HD retouchées','Couverture de 2 heures — les moments essentiels','Galerie privée de téléchargement'],
        en:['30 retouched HD photos','2-hour coverage — the essential moments','Private download gallery'] } },
      sig:{ price:690, delay:{fr:'5 jours ouvrés',en:'5 working days'}, items:{
        fr:['60 photos HD retouchées','Couverture jusqu\'à 4 heures — moments clés et ambiance','Galerie privée de téléchargement'],
        en:['60 retouched HD photos','Up to 4-hour coverage — key moments and atmosphere','Private download gallery'] } },
      prem:{ price:1190, delay:{fr:'7 jours ouvrés',en:'7 working days'}, items:{
        fr:['120 photos HD retouchées','Couverture complète de l\'événement','1 teaser vidéo (30 secondes)','Galerie privée de téléchargement'],
        en:['120 retouched HD photos','Full event coverage','1 video teaser (30 seconds)','Private download gallery'] } },
      edit:{ price:1990, delay:{fr:'10 jours ouvrés',en:'10 working days'}, items:{
        fr:['120 photos HD retouchées','1 aftermovie (2 minutes)','2 Reels verticaux','Mise en lumière éditoriale de l\'événement','Publication sur les supports Bunkaio'],
        en:['120 retouched HD photos','1 aftermovie (2 minutes)','2 vertical Reels','Editorial spotlight on the event','Featured on Bunkaio channels'] } }
    }}
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
  cuisine: {
    price: 490,
    name:{fr:'Studio Continu — Cuisines', en:'Studio Continu — Kitchens'},
    items:{
      fr:['1 réalisation documentée par mois (jusqu\'à 20 photos HD)','1 Reel vertical + Stories prêts à publier','Cohérence visuelle mensuelle pour vos réseaux et showroom','Options supplémentaires au tarif partenaire (-20%)'],
      en:['1 project documented per month (up to 20 HD photos)','1 vertical Reel + Stories ready to publish','Monthly visual consistency for social and showroom','All add-ons at partner rate (-20%)'] }
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
  { id:'drone', icon:'🚁', price:'À partir de 390€',
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

const TIERS = [
  { id:'deco', name:{fr:'Découverte', en:'Starter'},         badge:{fr:'Pour découvrir',     en:'To get started'} },
  { id:'sig',  name:{fr:'Signature',  en:'Signature'},        badge:null },
  { id:'prem', name:{fr:'Premium',    en:'Premium'},           badge:{fr:'Le plus choisi',     en:'Most popular'} },
  { id:'edit', name:{fr:'Éditorial Bunkaio', en:'Bunkaio editorial'}, badge:{fr:'Expérience complète', en:'The complete experience'} }
];

const PF_CATS = [
  { id:'immobilier',  label:{fr:'Immobilier', en:'Real estate'} },
  { id:'archi',       label:{fr:'Architecture',en:'Architecture'} },
  { id:'cuisine',     label:{fr:'Cuisines',    en:'Kitchens'} },
  { id:'piscine',     label:{fr:'Piscines',    en:'Pools'} },
  { id:'artisan',     label:{fr:'Artisanat',   en:'Craftsmanship'} },
  { id:'photo-part',  label:{fr:'Séance photo',en:'Portrait'} },
  { id:'mode',        label:{fr:'Mode',        en:'Fashion'} },
  { id:'event',       label:{fr:'Événementiel',en:'Events'} }
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
const S = { cat:null, tier:null, prof:null, opts:[], comm:false, studio:false, photoPack:null, name:'', email:'', phone:'', project:'' };


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

/* ═══════════════ I18N ═══════════════ */





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
}

function goView(v){
  const veil = document.getElementById('veil');
  veil.classList.remove('sweep');
  void veil.offsetWidth;
  veil.classList.add('sweep');
  setTimeout(() => {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + v).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === v));
    window.scrollTo({ top:0, behavior:'instant' });
    if (v !== 'quiz') setProgress(0);
    setPageBg(v);
    initHeroCarousel(v);
    if (v === 'services') { renderServices(); setSvcTab('catalogue'); }
    if (v === 'drone') { renderDroneCats(); renderDroneProjects(activeDroneCat); document.querySelectorAll('#view-drone .rv').forEach(observe); }
    if (v === 'portfolio' && !pfLoaded) { renderPfTabs(); selectPfTab(PF_CATS[0].id); pfLoaded = true; }
    if (v === 'partners') { renderPartnersAccordion(); renderLogoCarousel(); document.querySelectorAll('#view-partners .rv').forEach(observe); const img = document.getElementById('img-partners-banner'); if (img && !img.src) img.src = IMG.partners; }
  }, 420);
}

/* ═══════════════ QUIZ ═══════════════ */
let currentStep = 1;
function setProgress(p){ document.getElementById('progressFill').style.width = p + '%'; }

function quizStep(n){
  currentStep = n;
  document.querySelectorAll('.qstep').forEach(s => s.classList.remove('active'));
  document.getElementById('qs-' + n).classList.add('active');
  setProgress(n / 6 * 100);
  window.scrollTo({ top:0, behavior:'smooth' });
}

function goToTiers(){
  renderTiers();
  quizStep(3);
}

function goToCoords(){
  quizStep(5);
  checkQuizForm();
}

function renderCats(){
  const el = document.getElementById('catList');
  el.innerHTML = '';
  CATS.forEach((c, i) => {
    const d = document.createElement('div');
    d.className = 'cat-item stagger';
    d.style.animationDelay = (0.28 + i * 0.07) + 's';
    d.innerHTML = `
      <div class="cat-left">
        <div class="cat-ic">${getIcon(c.icon)}</div>
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
}

function renderProfiles(){
  const el = document.getElementById('profGrid');
  el.innerHTML = '';
  const profiles = S.cat === 'photo-part' ? PHOTO_PART_PROFILES : PROFILES;
  profiles.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'prof-card stagger' + (S.prof === p.id ? ' selected' : '');
    d.style.animationDelay = (0.26 + i * 0.06) + 's';
    d.innerHTML = `
      <div class="prof-icon">${getIcon(p.icon)}</div>
      <div class="prof-name">${t(p.name)}</div>`;
    d.onclick = () => {
      document.querySelectorAll('.prof-card').forEach(x => x.classList.remove('selected'));
      d.classList.add('selected');
      S.prof = p.id;
      const box = document.getElementById('profQBox');
      box.style.display = 'block';
      if (S.cat === 'photo-part') {
        const pp = PHOTO_PART_PROFILES.find(x => x.id === p.id);
        box.innerHTML = pp ? pp.desc[LANG] : '';
      } else {
        box.innerHTML = PROFILE_DESCRIPTIONS[p.id] ? PROFILE_DESCRIPTIONS[p.id][LANG] : '';
      }
      setTimeout(() => goToTiers(), 820);
    };
    el.appendChild(d);
  });
  if (S.prof) {
    const box = document.getElementById('profQBox');
    box.style.display = 'block';
    if (S.cat === 'photo-part') {
      const pp = PHOTO_PART_PROFILES.find(x => x.id === S.prof);
      box.innerHTML = pp ? pp.desc[LANG] : '';
    } else {
      box.innerHTML = PROFILE_DESCRIPTIONS[S.prof] ? PROFILE_DESCRIPTIONS[S.prof][LANG] : '';
    }
  }
}

function getIcon(type){
  const stroke = 'fill="none" stroke="#0a0a0c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  const icons = {
    agency:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><rect x="10" y="16" width="36" height="30" rx="2"/><line x1="10" y1="26" x2="46" y2="26"/><line x1="22" y1="26" x2="22" y2="46"/><line x1="34" y1="26" x2="34" y2="46"/><line x1="16" y1="10" x2="16" y2="16"/><line x1="40" y1="10" x2="40" y2="16"/></svg>`,
    promo:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M12 26 L28 12 L44 26"/><path d="M16 24 L16 44 L40 44 L40 24"/><rect x="24" y="32" width="8" height="12"/></svg>`,
    marque:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M18 14 L38 14 L42 22 L28 46 L14 22 Z"/><line x1="14" y1="22" x2="42" y2="22"/><line x1="22" y1="14" x2="28" y2="46"/><line x1="34" y1="14" x2="28" y2="46"/></svg>`,
    artisan: `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M20 12 L36 12 L36 22 Q36 28 28 28 Q20 28 20 22 Z"/><line x1="28" y1="28" x2="28" y2="38"/><path d="M22 44 L34 44"/><line x1="28" y1="38" x2="28" y2="44"/></svg>`,
    gastro:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M14 30 Q14 18 28 18 Q42 18 42 30 Z"/><line x1="10" y1="34" x2="46" y2="34"/><line x1="28" y1="12" x2="28" y2="18"/></svg>`,
    paysage: `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="40" cy="16" r="5"/><path d="M8 42 L20 28 L30 38 L38 30 L48 42"/><line x1="8" y1="46" x2="48" y2="46"/></svg>`,
    event:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><path d="M28 10 L32 22 L44 22 L34 30 L38 42 L28 34 L18 42 L22 30 L12 22 L24 22 Z"/></svg>`,
    autre:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="28" cy="28" r="16"/><path d="M24 24 Q24 20 28 20 Q32 20 32 24 Q32 27 28 28 L28 32"/><circle cx="28" cy="38" r="0.5"/></svg>`,
    person:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="28" cy="20" r="9"/><path d="M12 46 Q12 32 28 32 Q44 32 44 46"/></svg>`,
    couple:  `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="20" cy="20" r="8"/><path d="M8 46 Q8 33 20 33 Q26 33 30 37"/><circle cx="36" cy="20" r="8"/><path d="M48 46 Q48 33 36 33 Q30 33 26 37"/></svg>`,
    group:   `<svg width="52" height="52" viewBox="0 0 56 56" ${stroke}><circle cx="14" cy="22" r="7"/><path d="M4 45 Q4 34 14 34 Q18 34 21 36"/><circle cx="28" cy="18" r="9"/><path d="M14 45 Q14 32 28 32 Q42 32 42 45"/><circle cx="42" cy="22" r="7"/><path d="M52 45 Q52 34 42 34 Q38 34 35 36"/></svg>`
  };
  return icons[type] || icons.autre;
}

function renderTiers(){
  const cat = CATS.find(c => c.id === S.cat);
  if (!cat) return;
  const subEl = document.getElementById('tierSub');
  subEl.textContent = LANG === 'fr'
    ? t(cat.name) + ' — quatre formules, de la découverte à l\'expérience éditoriale complète.'
    : t(cat.name) + ' — four packages, from the starter offer to the complete editorial experience.';
  const el = document.getElementById('tierList');
  el.innerHTML = '';
  TIERS.forEach((tier, i) => {
    const td = cat.tiers[tier.id];
    const d = document.createElement('div');
    d.className = 'tier-card stagger';
    d.style.animationDelay = (0.24 + i * 0.1) + 's';
    d.innerHTML = `
      ${tier.badge ? `<div class="tier-badge">${t(tier.badge)}</div>` : ''}
      <div class="tier-head">
        <div class="tier-name">${t(tier.name)}</div>
        <div class="tier-price">${td.price.toLocaleString('fr-FR')}€<small>HT</small></div>
      </div>
      <div class="tier-detail">${t(td.items).join(' · ')}</div>`;
    d.onclick = () => { S.tier = tier.id; renderRecap(); renderOptions(); quizStep(4); };
    el.appendChild(d);
  });
  if (SUBS[S.cat]) {
    const sub = SUBS[S.cat];
    const d = document.createElement('div');
    d.className = 'tier-card sub-card stagger';
    d.style.animationDelay = (0.24 + TIERS.length * 0.1) + 's';
    const badge = LANG === 'fr' ? 'Abonnement mensuel' : 'Monthly plan';
    const engagement = LANG === 'fr' ? 'Engagement minimum : 6 mois' : 'Minimum commitment: 6 months';
    const saving = LANG === 'fr' ? 'Bien plus avantageux qu\'un achat ponctuel' : 'Far better value than individual bookings';
    d.innerHTML = `
      <div class="tier-badge">${badge}</div>
      <div class="tier-head">
        <div class="tier-name">${t(sub.name)}</div>
        <div class="tier-price">${sub.price.toLocaleString('fr-FR')}€<small>HT/${LANG === 'fr' ? 'mois' : 'mo'}</small></div>
      </div>
      <div class="tier-detail">${t(sub.items).join(' · ')}</div>
      <div class="sub-engagement">${engagement} · ${saving}</div>`;
    d.onclick = () => { S.tier = 'sub'; renderRecap(); renderOptions(); quizStep(4); };
    el.appendChild(d);
  }
}

function renderRecap(){
  const cat = CATS.find(c => c.id === S.cat);
  const selLabel = LANG === 'fr' ? 'Votre sélection' : 'Your selection';
  const box = document.getElementById('recapBox');
  if (S.tier === 'sub') {
    const sub = SUBS[S.cat];
    const engagement = LANG === 'fr'
      ? 'Engagement minimum : 6 mois · Reconduction mensuelle ensuite'
      : 'Minimum commitment: 6 months · Monthly renewal afterwards';
    box.innerHTML = `
      <div class="recap-label">${selLabel}</div>
      <div class="recap-title">
        <span>${t(sub.name)}</span>
        <span>${sub.price.toLocaleString('fr-FR')}€ HT/${LANG === 'fr' ? 'mois' : 'mo'}</span>
      </div>
      <ul class="recap-items">
        ${t(sub.items).map(i => `<li>${i}</li>`).join('')}
      </ul>
      <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${engagement}</div>`;
    return;
  }
  const tier = TIERS.find(x => x.id === S.tier);
  const td = cat.tiers[S.tier];
  const delivLabel = LANG === 'fr' ? 'Livraison' : 'Delivery';
  const studioSupplement = (S.cat === 'photo-part' && S.studio) ? ' + 60€ studio' : '';
  box.innerHTML = `
    <div class="recap-label">${selLabel}</div>
    <div class="recap-title">
      <span>${t(cat.name)} — ${t(tier.name)}</span>
      <span>${td.price.toLocaleString('fr-FR')}€${studioSupplement} HT</span>
    </div>
    <ul class="recap-items">
      ${t(td.items).map(i => `<li>${i}</li>`).join('')}
    </ul>
    <div style="margin-top: 18px; font-size: 12px; color: var(--grey); line-height: 1.6;">${delivLabel} : ${t(td.delay)}</div>`;
}

function commEligible(){
  if (S.cat === 'mode') return false;
  if (S.cat === 'photo-part') return false;
  return ['immobilier','archi','cuisine','piscine','event'].includes(S.cat) || S.prof === 'marque';
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

  label.style.display = 'block';

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
                <span class="photo-pack-price">${typeof pk.price==='number' ? '+'+pk.price+'€' : (LANG==='fr'?'Sur devis':'On request')}</span>
              </div>`).join('')}
          </div>
        </div>`;
    } else {
      const priceDisplay = typeof o.price === 'number' ? '+' + o.price + '€' : (o.price === '+20%' ? o.price : (LANG==='fr'?'Sur devis':'On request'));
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
  document.getElementById('qSubmit').disabled = !(S.name && S.email && S.email.includes('@') && S.project.length > 0);
}

function computeTotal(){
  if (S.tier === 'sub') return { amount: SUBS[S.cat].price, surDevis: false };
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
  return { amount: total, surDevis: hasSurDevis };
}


function animatePriceCalc(){
  const box   = document.getElementById('priceCalcBox');
  const amtEl = document.getElementById('priceCalcAmt');
  const noteEl= document.getElementById('priceCalcNote');
  if (!box || !amtEl) return;
  box.style.display = 'block';

  let targetAmount, isSub = false, surDevis = false, monthlyLabel = '';
  if (S.tier === 'sub') {
    targetAmount = SUBS[S.cat] ? SUBS[S.cat].price : 0;
    isSub = true;
    monthlyLabel = LANG === 'fr' ? '/mois' : '/mo';
  } else {
    const res = computeTotal();
    targetAmount = res.amount;
    surDevis     = res.surDevis;
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
  g.innerHTML = '';
  for (let i = 0; i < 6; i++){
    const ph = document.createElement('div');
    ph.className = 'ph rv';
    ph.innerHTML = `<img loading="lazy" src="https://picsum.photos/seed/${S.cat}-${i}/800/600" alt="${t(cat.name)} ${i+1}">`;
    g.appendChild(ph);
    observe(ph);
  }
  document.querySelectorAll('#qs-6 .rv:not(.ph)').forEach(el => { el.classList.remove('in'); observe(el); });
}

function submitQuiz(e){
  e.preventDefault();
  S.phone   = document.getElementById('qPhone').value.trim();
  S.project = document.getElementById('qProject').value.trim();
  const cat  = CATS.find(c => c.id === S.cat);
  const prof = S.cat === 'photo-part'
    ? (PHOTO_PART_PROFILES.find(p => p.id === S.prof) || { name:{fr:S.prof,en:S.prof} })
    : (PROFILES.find(p => p.id === S.prof) || { name:{fr:S.prof,en:S.prof} });
  let formuleLabel, montantLabel;
  if (S.tier === 'sub') {
    const sub = SUBS[S.cat];
    formuleLabel = 'ABONNEMENT — ' + sub.name.fr + ' (' + sub.price + '€ HT/mois, engagement 6 mois)';
    montantLabel = sub.price + '€ HT/mois';
  } else {
    const tier = TIERS.find(x => x.id === S.tier);
    const res = computeTotal();
    formuleLabel = tier.name.fr + ' (' + cat.tiers[S.tier].price + (S.studio?' +60€ studio':'') + '€ HT)';
    montantLabel = res.amount + '€ HT' + (res.surDevis ? ' + options sur devis' : '');
  }
  const allOpts = [...OPTIONS, ...((SPECIAL_OPTIONS[S.cat+'_'+S.tier])||[])];
  const optNames = (S.tier !== 'sub' && S.opts.length)
    ? S.opts.map(id => { const o = allOpts.find(x => x.id === id); return o ? o.name.fr : id; }).filter(Boolean).join(' · ')
    : (S.tier === 'sub' ? '— (abonné : tarif partenaire -20% sur options)' : 'Aucune');
  const studioNote = (S.cat === 'photo-part') ? (S.studio ? 'Studio (+60€)' : 'Extérieur') : '';
  document.getElementById('successName').textContent = S.name;
  document.getElementById('commRedirect').style.display = S.comm ? 'block' : 'none';
  document.getElementById('qSubmit').disabled = true;
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
      lieu_seance: studioNote || undefined,
      description_projet: S.project,
      interet_communication: S.comm ? 'OUI — potentiellement intéressé' : 'Non'
    })
  }).then(() => { renderQuizPortfolio(); quizStep(6); }).catch(() => { renderQuizPortfolio(); quizStep(6); });
}

/* ═══════════════ SERVICES ═══════════════ */
let activeServiceFilter = null;
let activeSvcTab = 'catalogue';

function setSvcTab(tab){
  activeSvcTab = tab;
  document.getElementById('stab-catalogue').classList.toggle('active', tab === 'catalogue');
  document.getElementById('stab-devis').classList.toggle('active', tab === 'devis');
  document.getElementById('ssec-catalogue').style.display = tab === 'catalogue' ? 'block' : 'none';
  document.getElementById('ssec-devis').style.display = tab === 'devis' ? 'block' : 'none';
  if (tab === 'devis') renderProcessSteps();
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
  list.forEach(c => {
    const card = document.createElement('div');
    card.className = 'service-card rv';
    const subRow = SUBS[c.id] ? `
      <div class="service-sub-row">
        <span class="service-sub-label">${I18N[LANG]['svc-sub-label']}</span>
        <span class="service-sub-price">${SUBS[c.id].price.toLocaleString('fr-FR')}€<small> HT/${LANG === 'fr' ? 'mois' : 'mo'}</small></span>
      </div>` : '';
    card.innerHTML = `
      <div class="service-head">
        <div class="service-icon">${getIcon(c.icon)}</div>
        <div class="service-name">${t(c.name)}</div>
      </div>
      <div class="service-tag">${t(c.tag)}</div>
      <div class="service-tiers">
        ${TIERS.map(tier => `
          <div class="service-tier">
            <span class="service-tier-name">${t(tier.name)}</span>
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
    { num:'01', icon:'◎', title:'Estimation en ligne',   text:'Complétez notre questionnaire en quelques minutes. Un récapitulatif détaillé est généré automatiquement.', tag:'Immédiat' },
    { num:'02', icon:'↓', title:'Réponse sous 48h',      text:'Nous étudions votre demande et vous revenons avec une confirmation, un devis ajusté et les premières disponibilités.', tag:'Sous 48h' },
    { num:'03', icon:'▪', title:'Signature du devis',    text:'Devis clair, sans surprise. Signature en ligne. Un acompte de 30% valide la commande et bloque votre créneau.', tag:'Acompte 30%' },
    { num:'04', icon:'⊞', title:'Planification',         text:'Nous convenons ensemble de la date, du lieu et du brief visuel. Vous recevez une feuille de route complète.', tag:'Brief inclus' },
    { num:'05', icon:'⊹', title:'Production',            text:'Reportage photo, vidéo, vol drone — tout est pris en charge. Lumière, cadre, soin du détail.', tag:'Jour J' },
    { num:'06', icon:'✓', title:'Livraison',             text:'Vos visuels retouchés livrés dans les délais convenus via galerie privée sécurisée.', tag:'Galerie privée' },
    { num:'07', icon:'—', title:'Solde & droits',        text:'Le solde (70%) est réglé à réception. Les droits d\'utilisation commerciale vous sont cédés sans limite de durée.', tag:'Solde 70%' },
  ],
  en:[
    { num:'01', icon:'◎', title:'Online estimate',   text:'Complete our questionnaire in a few minutes. A detailed summary is generated automatically.', tag:'Instant' },
    { num:'02', icon:'↓', title:'Reply within 48h',  text:'We review your request and come back to you with a confirmation, an adjusted quote and our first available dates.', tag:'Within 48h' },
    { num:'03', icon:'▪', title:'Quote signature',   text:'A clear quote, no surprises. Sign online. A 30% deposit confirms your order and locks in your time slot.', tag:'30% deposit' },
    { num:'04', icon:'⊞', title:'Planning',          text:'We agree on the date, location and visual brief. You receive a complete run-of-show to prepare.', tag:'Brief included' },
    { num:'05', icon:'⊹', title:'Production',        text:'Photography, video, drone — everything handled. Light, framing and every detail.', tag:'Shoot day' },
    { num:'06', icon:'✓', title:'Delivery',          text:'Your retouched visuals delivered within the agreed timeframe via a secure private gallery.', tag:'Private gallery' },
    { num:'07', icon:'—', title:'Balance & rights',  text:'The balance (70%) is due on receipt. Commercial usage rights are granted with no time limit.', tag:'70% balance' },
  ]
};

function renderProcessSteps(){
  const el = document.getElementById('processSteps');
  if (!el) return;
  const steps = PROCESS_STEPS[LANG];
  el.innerHTML = steps.map(s => `
    <div class="process-step rv">
      <div class="ps-num">${s.num}</div>
      <div>
        <div class="ps-icon">${s.icon}</div>
        <div class="ps-title">${s.title}</div>
        <div class="ps-text">${s.text}</div>
        <span class="ps-tag">${s.tag}</span>
      </div>
    </div>`).join('');
  el.querySelectorAll('.rv').forEach(observe);
  const img = document.getElementById('img-devis-side');
  if (img && !img.src) img.src = IMG.devis;
}

/* ═══════════════ 4K DRONE ═══════════════ */
let activeDroneCat = DRONE_CATS[0].id;

function renderDroneCats(){
  const el = document.getElementById('droneCats');
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
  const cat = DRONE_CATS.find(c => c.id === catId);
  const el = document.getElementById('droneProjects');
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
  grid.innerHTML = '';
  for (let i = 0; i < 40; i++){
    const ph = document.createElement('div');
    ph.className = 'ph rv';
    ph.innerHTML = `<img loading="lazy" src="https://picsum.photos/seed/${id}-${i}/700/900" alt="Projet ${i+1}">`;
    grid.appendChild(ph);
    observe(ph);
  }
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

/* ═══════════════ ESPACE CLIENT / PARTENAIRE ═══════════════ */
const ACCOUNTS_URL = 'comptes.json';
let loginType = 'client';
let USER = null;

function openLogin(type){
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
  fetch(ACCOUNTS_URL + '?v=' + Date.now())
    .then(r => r.json())
    .then(data => {
      const acc = (data.comptes || []).find(a =>
        a.type === loginType &&
        (a.email || '').toLowerCase() === email &&
        (a.code || '').toUpperCase() === code
      );
      if (!acc) { err.style.display = 'block'; return; }
      USER = acc;
      renderAccount();
      goView('account');
    })
    .catch(() => { err.style.display = 'block'; });
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
      action_requise: 'Créer entrée dans comptes.json sur GitHub puis envoyer code accès par email'
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
  document.getElementById('logEmail').value = '';
  document.getElementById('logCode').value = '';
  goView('home');
}

function setAccountTab(tab){
  ['orders','payments','portfolio'].forEach(x => {
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

function renderAccount(){
  if (!USER) return;
  document.getElementById('accBadge').textContent =
    I18N[LANG][USER.type === 'client' ? 'acc-client-badge' : 'acc-partner-badge'];
  document.getElementById('accName').textContent = USER.nom || USER.email;
  const ob = document.getElementById('ordersBody');
  const orders = USER.commandes || [];
  ob.innerHTML = orders.length
    ? orders.map(o => `<tr><td>${o.date||'—'}</td><td>${o.prestation||'—'}</td><td>${o.montant||'—'}</td><td><span class="status-pill ${statusClass(o.statut)}">${o.statut||'—'}</span></td></tr>`).join('')
    : `<tr><td colspan="4"><div class="empty-note">${I18N[LANG]['empty-orders']}</div></td></tr>`;
  const pb = document.getElementById('paymentsBody');
  const payments = USER.paiements || [];
  pb.innerHTML = payments.length
    ? payments.map(p => `<tr><td>${p.date||'—'}</td><td>${p.reference||'—'}</td><td>${p.methode||'—'}</td><td>${p.montant||'—'}</td><td><span class="status-pill ${statusClass(p.statut)}">${p.statut||'—'}</span></td></tr>`).join('')
    : `<tr><td colspan="5"><div class="empty-note">${I18N[LANG]['empty-payments']}</div></td></tr>`;
  setAccountTab('orders');
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

/* ═══════════════ ACCORDÉON PARTENAIRES ═══════════════ */
function renderPartnersAccordion(){
  const el = document.getElementById('partnersAccordion');
  if (!el) return;
  const sections = LANG === 'fr' ? [
    { title:'Pourquoi Bunkaio existe', body:`<p>Nous vivons dans un monde où les contenus se multiplient, mais où les histoires se raréfient. Derrière chaque lieu, chaque objet et chaque réalisation se cache une histoire qui mérite d'être racontée.</p><p><strong>Nous ne documentons pas des projets. Nous révélons ce qui les rend uniques.</strong></p>` },
    { title:'Qui peut devenir Partenaire Fondateur ?', body:`<p>Le programme est réservé aux entreprises et professionnels dont les réalisations correspondent à l'univers Bunkaio.</p><ul class="ft-list" style="margin-top:18px"><li style="margin-bottom:12px">⊹ Architecture & habitat</li><li style="margin-bottom:12px">⊹ Aménagement & design</li><li style="margin-bottom:12px">⊹ Artisanat d'exception</li><li style="margin-bottom:12px">⊹ Marques & lifestyle</li><li>⊹ Événementiel & lieux</li></ul>` },
    { title:'Les avantages du programme', body:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><div class="cred-card"><div class="cred-num">01</div><div class="cred-title">Mise en lumière éditoriale</div><div class="cred-text">Votre activité racontée selon la méthode Bunkaio — Découverte, Vision, Défi, Savoir-Faire, Mon Regard, Révélation.</div></div><div class="cred-card"><div class="cred-num">02</div><div class="cred-title">Visibilité renforcée</div><div class="cred-text">Présence sur le site, les réseaux et les futurs supports éditoriaux de la marque.</div></div><div class="cred-card"><div class="cred-num">03</div><div class="cred-title">Relation privilégiée</div><div class="cred-text">Accès prioritaire aux disponibilités et offres préférentielles.</div></div><div class="cred-card"><div class="cred-num">04</div><div class="cred-title">Un écosystème</div><div class="cred-text">Un cercle de professionnels partageant l'exigence et l'amour du travail bien fait.</div></div></div>` },
    { title:'Les places disponibles', body:`<p>10 places par univers, soit un maximum de <strong>60 partenaires fondateurs</strong>. Une fois ce quota atteint, les nouvelles candidatures seront placées sur liste d'attente.</p>` },
    { title:'Le processus de sélection', body:`<div class="process-steps" style="margin-top:0"><div class="process-step"><div class="ps-num">01</div><div><div class="ps-title">Présentation</div><div class="ps-text">Compléter le questionnaire Bunkaio — activité, réalisations, objectifs.</div></div></div><div class="process-step"><div class="ps-num">02</div><div><div class="ps-title">Étude</div><div class="ps-text">Analyse selon la qualité des réalisations et la cohérence éditoriale.</div></div></div><div class="process-step"><div class="ps-num">03</div><div><div class="ps-title">Réponse</div><div class="ps-text">Sélectionné, compatible (ponctuel) ou réorienté selon les besoins.</div></div></div><div class="process-step" style="border-bottom:none"><div class="ps-num">04</div><div><div class="ps-title">Lancement</div><div class="ps-text">Onboarding personnalisé et feuille de route éditoriale.</div></div></div></div>` }
  ] : [
    { title:'Why Bunkaio exists', body:`<p>We live in a world where content keeps multiplying, yet stories are becoming rare. Behind every place, every object and every achievement lies a story that deserves to be told.</p><p><strong>We don't document projects. We reveal what makes them unique.</strong></p>` },
    { title:'Who can become a Founding Partner?', body:`<p>The programme is reserved for companies and professionals whose work aligns with the Bunkaio universe.</p><ul class="ft-list" style="margin-top:18px"><li style="margin-bottom:12px">⊹ Architecture & living</li><li style="margin-bottom:12px">⊹ Fittings & design</li><li style="margin-bottom:12px">⊹ Exceptional craftsmanship</li><li style="margin-bottom:12px">⊹ Brands & lifestyle</li><li>⊹ Events & venues</li></ul>` },
    { title:'Programme benefits', body:`<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px"><div class="cred-card"><div class="cred-num">01</div><div class="cred-title">An editorial spotlight</div><div class="cred-text">Your work told as a story — Discovery, Vision, Challenge, Craftsmanship, My Perspective, Revelation.</div></div><div class="cred-card"><div class="cred-num">02</div><div class="cred-title">Enhanced visibility</div><div class="cred-text">Privileged presence on the Bunkaio website, social channels and future publications.</div></div><div class="cred-card"><div class="cred-num">03</div><div class="cred-title">A privileged relationship</div><div class="cred-text">Priority scheduling and preferential rates.</div></div><div class="cred-card"><div class="cred-num">04</div><div class="cred-title">An ecosystem</div><div class="cred-text">A circle of professionals sharing the same high standards and love of work well done.</div></div></div>` },
    { title:'Available places', body:`<p>10 places per universe, for a maximum of <strong>60 founding partners</strong>. Once this quota is reached, new applications will be placed on a waiting list.</p>` },
    { title:'The selection process', body:`<div class="process-steps" style="margin-top:0"><div class="process-step"><div class="ps-num">01</div><div><div class="ps-title">Presentation</div><div class="ps-text">Complete the Bunkaio questionnaire — your activity, work, goals.</div></div></div><div class="process-step"><div class="ps-num">02</div><div><div class="ps-title">Review</div><div class="ps-text">Assessment based on quality of work and editorial fit.</div></div></div><div class="process-step"><div class="ps-num">03</div><div><div class="ps-title">Response</div><div class="ps-text">Selected, compatible (one-off), or redirected according to your needs.</div></div></div><div class="process-step" style="border-bottom:none"><div class="ps-num">04</div><div><div class="ps-title">Launch</div><div class="ps-text">Personalised onboarding and editorial roadmap.</div></div></div></div>` }
  ];
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

function toggleAccordion(btn){
  const body = btn.nextElementSibling;
  const open = body.classList.contains('open');
  body.classList.toggle('open', !open);
  btn.setAttribute('aria-expanded', String(!open));
}

/* ═══════════════ LOGO CAROUSEL ═══════════════ */
const PARTNER_LOGOS = [
  'Atelier Blanc','Studio Forma','Maison Cuvée','Architecture M','Créations P. Sellier',
  'Résidences Prestige','Domain Vallier','Artisans du Sud','Label Matière','Event & Sens',
  'Construire Sud','Espace Cuisine','Piscines Azur','Bloom Paysage','Marque Céleste'
];

function renderLogoCarousel(){
  const el = document.getElementById('logoTrack');
  if (!el) return;
  const make = () => PARTNER_LOGOS.map(n => `<div class="logo-pill">${n}</div>`).join('');
  el.innerHTML = make() + make();
}

/* ═══════════════ MARQUEE ═══════════════ */
function renderMarquee(){
  const track = document.getElementById('marqueeTrack');
  if (!track) return;
  const make = () => IMG.marquee.map(src =>
    `<div class="marquee-item"><img loading="lazy" src="${src}" alt="Bunkaio"></div>`
  ).join('');
  track.innerHTML = make() + make();
}

/* ═══════════════ FOOTER SERVICES ═══════════════ */
function renderFooterServices(){
  const el = document.getElementById('ftServices');
  if (!el) return;
  el.innerHTML = '';
  CATS.forEach(c => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.textContent = t(c.name);
    b.onclick = () => { activeServiceFilter = c.id; goView('services'); };
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
renderMarquee();
renderLogoCarousel();
renderFooterServices();
/* Hero image home */

initHeroCarousel('home');
updatePlaceholders();
updateLang();
applyImages();
document.querySelectorAll('.ph').forEach(observe);
