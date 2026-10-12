# BUNKAIO — mémoire de travail (technique, sans donnée privée)

Le code est la source de vérité. Ce fichier ne sert qu'à reprendre vite.

## Stack
- Site statique (GitHub Pages) : SPA en JavaScript sans framework, `js/script.js` (source) → `js/script.min.js` (généré). Traductions `I18N.fr/en`, helper `t({fr,en})`.
- Config : `config/routes.js` (SEO), `config/articles(.en).js`, `config/media.js`, `config/entity.json`, `config/analytics.js`.
- Pages statiques, sitemap, images de partage 1200×630 et versions de fichiers : `NODE_PATH=/opt/node22/lib/node_modules node tools/build-routes.cjs` (à relancer après toute modification de `js/`, `css/`, `config/` ou `index.html`).
- Backend : Worker Cloudflare `server/src/*.ts` (Stripe leads et factures, Resend, KV `ACCOUNTS_KV`, D1 audience, R2 médias). Déploiement : `cd server && npm install && npx wrangler deploy`. Vérification : `npx tsc --noEmit`.
- Admin : `admin/index.html` (contacts, devis, factures, séances, boîte mail) et `admin/media.html` (images). Espace client : vues `login` et `account` dans `js/script.js`.

## Règles à respecter
- Ne pas modifier les dimensions d'export : `IMAGE_SPECS` et `toWebP` dans `admin/media.html`, images de partage 1200×630.
- Aucune adresse personnelle, clé ou donnée client dans le dépôt (l'adresse légale est un secret du Worker).
- Pas de redesign. Pas de promotion de lancement, pas de prix barré. Prix nets (franchise de TVA).
- Pas de fausse preuve sociale ni de service inventé. Les 10 marques réelles (Musardise Bijoux… Studio Doutor) défilent sur la page Collaboration : ne pas écrire « collaboration » (lu comme non rémunéré, décision de la propriétaire). Accueil : les 8 témoignages d'exemple sont remis à la demande de la propriétaire, qui les remplacera à la main ; la propriétaire gère elle-même ce contenu : ne pas y ajouter de mention ni changer le titre.
- Lien d'avis Google unique : `config/media.js` (`GOOGLE_REVIEW_URL`) et `server/wrangler.toml` doivent rester identiques.
- Ne jamais écrire la ville de Béziers sur le site (décision de la propriétaire, 12 oct. 2026) ; l'article « lieux de séance » a pour adresse `/conseils/lieux-seance-photo-montpellier-toulouse/` (l'ancienne redirige).
- Ne pas lancer `pkill -f "http.server"` depuis le shell de l'agent.

## Grille tarifaire (source : `CATS`, `LUMEN_TIERS`, `SUBS`, `POLAS` dans `js/script.js`)
- Particuliers 250 / 420 / 650 / 1 090 · Book grossesse 450 · Corporate & Personal Branding 250 / 320 (Lancement) / 450 / 690 / 1 090.
- Mode 490 / 990 / 1 690 / 2 490 · Polas 160 (studio inclus) · Studio Continu 790 €/mois (6 mois).
- Commercial 390 / 750 / 1 390 / 2 390 · Événementiel 420 / 750 / 1 290 / 2 190.
- Lumen : prototype, aucun prix publié, pas de page de formules ; tout lien Lumen mène à /contact/#lumen (message pré-rempli). Modèle de devis et emplacements média inactifs.
- Déplacement : offert ≤ 30 km autour de Montpellier, de Toulouse et « dans l'ouest de l'Hérault » (décision du 12 oct. 2026 : Toulouse n'a plus de forfait ; la ville de Béziers n'est écrite que dans la ligne « Basé à Montpellier — mobile sur toute la France sur devis et gratuitement sur Béziers, Montpellier et Toulouse », à la demande de la propriétaire ; le calcul garde 3 pôles, voir `TRAVEL_POLES`), ailleurs 0,60 €/km aller-retour au-delà de 30 km, plafonné à 350 € (forfait longue distance, `TRAVEL_CAP`, atteint vers 320 km : Paris, Lille…) ; le calculateur estime toute ville (distance routière ≈ vol d'oiseau × 1,25 depuis le pôle le plus proche, arrondi à 5 €), la ville non reconnue seule renvoie au devis.
- Programme partenaires : −20 % permanent (décision de la propriétaire).

- Studio (décision du 12 oct. 2026) : jamais inclus, option à 60 € (`STUDIO_FEE`, `studioApplies`) sur particuliers, Book grossesse, corporate/Lancement, mode et commercial ; exception Polas : 160 €, studio inclus ; pas de sélecteur pour l'événementiel ni l'abonnement.

## Stratégie (décision de la propriétaire, 8 oct. 2026) : une seule
- Cibles : **entrepreneurs et indépendants** (porte d'entrée : formule Lancement 320 €, puis Signature, Premium, Éditorial) et **marques** (Mode, Commercial et produits). Plan de référence : artefact « Plan de lancement V5 » (même adresse que l'ancien V3) ; suivi : « Actions BUNKAIO » ; calculs : « Mes chiffres BUNKAIO ».
- Hors stratégie (aucune communication, aucune publicité) mais en vente sur le site sans modification : particuliers, Book grossesse, événementiel, portraits d'équipe, Lumen (prototype), Polas et Studio Continu.
- La stratégie ne touche pas au catalogue : ne pas retirer ni modifier de prestation pour la suivre.

## Architecture de marque (décision de la propriétaire, 8 oct. 2026)
- BUNKAIO = « studio de photographie pour professionnels, entrepreneurs et mannequins » ; crée des images premium pour les personnes, les marques et les entreprises. Slogan : « BUNKAIO accompagne les personnes qui entreprennent dans la construction de leur image professionnelle. »
- Orientation par marché sur /decouvrir-chaque-prestation/ (entrepreneurs, marques, entreprises & événements, particuliers) ; la stratégie ne vise que les deux premiers.
- Formule Lancement 320 € = palier `lanc` de la gamme `corporate` (pas une nouvelle gamme) ; `catTiers(c)` n'affiche que les paliers définis par la gamme. Landing : /services/personal-branding-entrepreneurs/ (route `service` / `branding`, `renderBrandingPage`). Mobilité (shooting in situ) = argument central ; déplacements selon `TRAVEL_TXT`, jamais « toujours offerts ». Pas de remise, pas de « low-cost ».
- Accueil : la liste animée sous « Studio mobile de photographie » : PARTICULIERS • PROFESSIONNELS • ENTREPRISES • MODÈLES/MANNEQUINS • ÉVÉNEMENTIEL PUBLIC/PRIVÉ (chaque public mène à sa page) ; cycle de 5 mots visés par un collimateur (CSS `hkFx`), texte blanc sur voile sombre doux (plus de lueur violette). Le descripteur SEO (entity.json, pied de page) reste « professionnels, entrepreneurs et mannequins ».
- Admin média : bannières propres facultatives `hero/advice-1.webp` (Conseils + articles), `hero/about-1.webp`, `hero/legal-1.webp` (`IMG.heroOwn`, repli sur l'ancienne photo si absentes).
- Admin média : photo de formule `formulas/corporate-lanc.webp`, fond `discover/branding.webp` (repli : photos corporate), photos in situ `branding/in-situ-1..3.webp` (affichées seulement si présentes, `IMG.brandingInSitu`).
- Tracking : `data-track="lancement"` sur les CTA (événement `cta_click`), `form_start` (nécessite le redéploiement du Worker), `quiz_submit` suffixé « · Lancement ». Plan marketing de référence : artefact « Plan de lancement V5 ».

## Cookies et consentement (oct. 2026)
- Aucun cookie, aucun traceur tiers aujourd'hui : mesure maison sans cookie (`js/analytics.js`, Worker `/collect`, 400 jours), stockage local nécessaire (session client), `bunkaio_notrack` (opposition) ; la source utm (`campaignTag()`) reste en mémoire de la page, rien n'est stocké sur l'appareil ; `bunkaio_consent` (choix, 6 mois, seulement si un choix est validé).
- `config/consent.js` (CONSENT_CONFIG) + `js/consent.js` (BKConsent) : tant qu'aucun service n'est déclaré, pas de bandeau ; le lien « Gérer mes cookies » (pied de page) ouvre le centre de préférences. Déclarer GA4 / Google Ads / Meta Pixel (ou `vendors`) fait apparaître le bandeau (3 boutons identiques) ; les scripts ne se chargent qu'après accord de leur catégorie ; Google Consent Mode v2 (4 signaux « denied » par défaut) ; retrait = cookies effacés + rechargement.
- Confirmé par la propriétaire (oct. 2026) : aucun autre compte ou service que ceux du code (GitHub Pages, Cloudflare, Stripe/Klarna, Resend) ; pas de SMS pour l'instant ; ni Web Analytics ni Zaraz Cloudflare. Si cela change : mettre à jour la politique de confidentialité et la politique des cookies.
- Page `/politique-cookies/` (onglet de la vue `legal`, `renderCookiesAccordion`) : liste générée depuis `BKConsent.vendors()`. À tenir à jour avec la politique de confidentialité si un service est ajouté (destinataires, transferts).

## Positionnement
Premium accessible : direction artistique, accompagnement, interlocuteur unique, espace client (moodboard, suivi, devis, factures, séance, galerie privée), 8+ ans d'expérience, 200+ projets, délais annoncés, droits clairs. CTA : « Construire mon projet », « Demander un devis », « Recevoir une proposition », « Parler de mon événement ».

## Veille et prix en dollars
- Veille automatique : `server/src/watch.ts` (cron `30 7,19 * * *`, 12 h), historique KV `watch:run:*` (30 j), admin rubrique « Veille du site » (`/admin/watch`, `/admin/watch/run`). Rapport quotidien de maintenance : `ops/veille.json` (liste `reports`, plus récent en premier ; statut `ok`, `corrige` ou `action`), affiché dans la même rubrique.
- Contrôle local complet : `NODE_PATH=/opt/node22/lib/node_modules node tools/veille.cjs --live` (toutes les pages FR/EN, prix en dollars, formules du devis). Routine Claude « Veille BUNKAIO » toutes les 12 h : contrôle, correction, mise à jour de `ops/veille.json`.
- Version anglaise : `initUsdPrices()` ajoute « ≈ $ » après chaque prix en euros (taux `EUR_USD_RATE` dans `js/script.js`). Ne pas réécrire de prix en dollars à la main.

## Tests
Banc local Miniflare avec faux Stripe/Resend et Playwright (scripts hors dépôt). Un test de régression doit couvrir : parcours devis, formulaires en échec, espace client, admin, crawl de toutes les pages.

## À faire côté propriétaire
Redéployer le Worker, tester un devis réel en mode test Stripe, désactiver SEPA et ajouter l'événement `charge.dispute.created` dans Stripe, Search Console, fiche Google Business.

## Droit à l'image, consentement et preuve (oct. 2026, clauses DI-1.1)
- À l'envoi, l'admin fige un paquet de clauses (`BunkaioDevis.legalPack`, version `LEGAL_VERSION`) stocké dans KV `quotelegal:<id>` et inclus dans l'empreinte du devis : un devis signé ne se recompose jamais depuis le texte actuel. Toute évolution des clauses = nouvelle version (DI-1.1…), jamais de modification d'une version envoyée. Devis sans `q.legal` : ancien comportement (case portfolio).
- Signature (`/signature/`) : 4 choix Oui/Non non pré-cochés (site, réseaux, supports, publicité numérique), personnes photographiées, mineurs ; bouton « Signer et accepter le devis ». Preuve : identité, email, date/heure, version, choix, IP, navigateur, empreintes ; journal append-only `consentlog:<id>` ; PDF figé `quotepdf:<id>` (pdf-lib, généré une fois, joint à l'email).
- Autres personnes : `/autorisation/` (lien individuel ou commun, représentant légal pour les mineurs) ; retrait : `/retrait-autorisation/` (demande publique, validée dans l'admin → statuts accepté / refusé / partiel / retrait demandé / retiré). Pages en noindex + robots Disallow.
- Conservation : preuve 5 ans après la fin de la relation, factures 10 ans. Vue publique du devis sans IP/UA/personnes.
- À faire valider par un juriste/DPO : durée 5 ans, base légale (consentement + intérêt légitime pour la preuve), valeur de la signature simple, clause mineurs, transferts hors UE, mentions de la politique de confidentialité. Ne jamais affirmer une conformité à 100 %.
- Test local : `wrangler dev --local` (variables ADMIN_TOKEN, RESEND_API_KEY…) + script de scénarios (hors dépôt).
- Admin : rubrique « Droits à l'image » (registre par devis signé, filtres de statut, retraits à traiter sous 30 jours, personnes/mineurs à relancer, export CSV du registre) ; alertes du tableau de bord ; veille sur /autorisation/, /retrait-autorisation/ et /signature/. FAQ : onglet « Droits à l'image » (`renderImageAccordion`, route `/droits-a-l-image/`) à tenir aligné avec les clauses.
- Admin > Devis : bouton « Créer un devis de test » (action `create-test`, `q.test`) : devis fictif envoyé à l'adresse choisie, numéro TEST-xxxx hors séquence, aucune facture Stripe, exclu des indicateurs/alertes/relances, supprimable à tout moment.
- Espace client/partenaire : onglet « Mes devis » (`renderAccDevis`, `USER.devis` fourni par le Worker `accountQuotes` à la connexion et à la mise à jour) : devis à signer, devis signés + PDF, autorisations d'image par usage, lien commun des autres personnes, lien vers /retrait-autorisation/ prérempli. Onglet masqué s'il n'y a aucun devis ; devis de test inclus, repérés TEST.
- Signature en ligne : zone intégrée au cadre « Le client » du devis (mention « Bon pour accord » à saisir, nom, signature manuscrite au doigt/souris) ; PNG stocké dans KV `quotesigimg:<id>`, intégré au PDF signé ; exigée par le Worker pour les devis avec clauses d'image.
- Espace client/partenaire : onglet « Mes séances » (`renderAccSeances`, `USER.seance` : date, heure, durée, lieu, prestation, à prévoir, accès, livraison ; saisie dans l'admin, fiche client → Séance ; toujours visible, message d'attente + bouton « Réserver ma séance » sans date ou si annulée ; agenda .ics). L'onglet « Mes devis » est toujours visible (message d'attente si vide). Le client doit avoir validé « Mes informations » pour ouvrir les autres onglets (garde existante).
- Traçabilité Stripe : les factures d'acompte/solde portent « Devis n° X » (description, champ du PDF) et les métadonnées `devis_numero`, `devis_id`, `devis_empreinte_sha256`, `devis_signe_le`, `devis_clauses` ; le devis garde `depositInvoice` / `balanceInvoice` (admin : carte « Facturation Stripe »). Les devis de test ne créent jamais de facture. Ce ne sont pas des objets « Quotes » Stripe.
- Admin « Campagne & Ads » : liens suivis UTM (source/support/campagne/contenu), trafic par campagne (mesure maison, colonne `utm` des événements — migration `server/migrations/0002_campaign.sql` à appliquer une fois sur D1 ; sans elle les événements restent enregistrés sans campagne), leads/devis/CA par campagne (tag `lead.campagne` du CRM), publications Instagram et dépenses pub saisies à la main (KV `campaign:data`, routes `/admin/ads-report` et `/admin/ads-data`), accès directs (Google Ads, Planificateur de mots clés, Meta Business Suite, Search Console, Google Business). Pas d'API Google Ads ni Instagram (développeur token / validation Meta requis). Le tag campagne reste en mémoire de la page côté visiteur (`_campaignMem`) et est joint aux événements anonymes.
- Étapes du parcours (server/src/admin.ts `computeStage`) : devis signé sans facture d'acompte = « Acompte à créer » (`acompte_creer`), « Acompte envoyé » seulement si la facture existe, abonnement signé = « Abonnement » ; les devis de test n'influencent jamais l'étape. Relance automatique unique de la facture d'acompte (`retrySignedQuoteDeposits`, aux passages planifiés).
- Zoom désactivé sur tout le site (demande de la propriétaire) : viewport `user-scalable=no`, `touch-action: pan-x pan-y`, `preventZoom()` en tête de js/script.js (pincement, Ctrl/Cmd + molette, Ctrl + + − 0). Le zoom du menu du navigateur reste possible.

## Pages locales et URL anglaises (oct. 2026)
- Pages villes : `/photographe-montpellier/` et `/photographe-toulouse/` (vue `city`, `renderCityPage`, données `CITY_PAGES` dans `js/script.js` ; prix tirés de `CATS`, déplacement de `TRAVEL_TXT`, aucune référence client ni avis ; pas de Béziers). Liens dans le pied de page et entre les deux villes. Une ville de plus = une entrée dans `CITY_PAGES` + une route `view:'city'` dans `config/routes.js`.
- Anglais : chaque route indexable a une adresse `/en/…` (`pathEn`, calculée dans `config/routes.js`, explicite pour les villes). La langue vient de l'adresse (`LANG` au chargement) ; le bouton FR/EN change aussi l'adresse (`toggleLang`, `routePath`) ; `localizeLinks` réécrit les liens internes. Pages non indexables : pas de version /en/.
- `tools/build-routes.cjs` : `collect('fr'|'en')` pré-rend les deux langues, `VARIANTS` génère les pages FR + EN avec canonical propre, hreflang (fr / en / x-default), `og:locale`, JSON-LD `inLanguage`, images de partage `images/og/en-*.jpg`, sitemap avec `xhtml:link`. Titres d'articles normalisés « … | BUNKAIO » dans `routes.js`.
- À faire côté propriétaire : renvoyer le sitemap dans Search Console, demander l'indexation des 2 pages villes et de `/en/`, fiche Google Business (zone de service Montpellier + Toulouse).
