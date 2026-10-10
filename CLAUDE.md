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
- Ne pas lancer `pkill -f "http.server"` depuis le shell de l'agent.

## Grille tarifaire (source : `CATS`, `LUMEN_TIERS`, `SUBS`, `POLAS` dans `js/script.js`)
- Particuliers 250 / 420 / 650 / 1 090 · Book grossesse 450 · Corporate & Personal Branding 250 / 320 (Lancement) / 450 / 690 / 1 090.
- Mode 490 / 990 / 1 690 / 2 490 · Polas 100 · Studio Continu 790 €/mois (6 mois).
- Commercial 390 / 750 / 1 390 / 2 390 · Événementiel 420 / 750 / 1 290 / 2 190.
- Lumen : prototype, aucun prix publié, pas de page de formules ; tout lien Lumen mène à /contact/#lumen (message pré-rempli). Modèle de devis et emplacements média inactifs.
- Déplacement : offert ≤ 30 km de Montpellier ou Béziers, Toulouse et agglomération 50 €, ailleurs 0,60 €/km aller-retour au-delà de 30 km.
- Programme partenaires : −20 % permanent (décision de la propriétaire).

## Stratégie (décision de la propriétaire, 8 oct. 2026) : une seule
- Cibles : **entrepreneurs et indépendants** (porte d'entrée : formule Lancement 320 €, puis Signature, Premium, Éditorial) et **marques** (Mode, Commercial et produits). Plan de référence : artefact « Plan de lancement V5 » (même adresse que l'ancien V3) ; suivi : « Actions BUNKAIO » ; calculs : « Mes chiffres BUNKAIO ».
- Hors stratégie (aucune communication, aucune publicité) mais en vente sur le site sans modification : particuliers, Book grossesse, événementiel, portraits d'équipe, Lumen (prototype), Polas et Studio Continu.
- La stratégie ne touche pas au catalogue : ne pas retirer ni modifier de prestation pour la suivre.

## Architecture de marque (décision de la propriétaire, 8 oct. 2026)
- BUNKAIO = « studio de photographie pour professionnels, entrepreneurs et mannequins » ; crée des images premium pour les personnes, les marques et les entreprises. Slogan : « BUNKAIO accompagne les personnes qui entreprennent dans la construction de leur image professionnelle. »
- Orientation par marché sur /decouvrir-chaque-prestation/ (entrepreneurs, marques, entreprises & événements, particuliers) ; la stratégie ne vise que les deux premiers.
- Formule Lancement 320 € = palier `lanc` de la gamme `corporate` (pas une nouvelle gamme) ; `catTiers(c)` n'affiche que les paliers définis par la gamme. Landing : /services/personal-branding-entrepreneurs/ (route `service` / `branding`, `renderBrandingPage`). Mobilité (shooting in situ) = argument central ; déplacements selon `TRAVEL_TXT`, jamais « toujours offerts ». Pas de remise, pas de « low-cost ».
- Accueil : la phrase animée sous « Studio de photographie » énumère les publics (particuliers, professionnels, entreprises, modèles/mannequins, événementiel) ; cycle de 5 mots visés par un collimateur (CSS `hkFx`). Le descripteur SEO (entity.json, pied de page) reste « professionnels, entrepreneurs et mannequins ».
- Admin média : bannières propres facultatives `hero/advice-1.webp` (Conseils + articles), `hero/about-1.webp`, `hero/legal-1.webp` (`IMG.heroOwn`, repli sur l'ancienne photo si absentes).
- Admin média : photo de formule `formulas/corporate-lanc.webp`, fond `discover/branding.webp` (repli : photos corporate), photos in situ `branding/in-situ-1..3.webp` (affichées seulement si présentes, `IMG.brandingInSitu`).
- Tracking : `data-track="lancement"` sur les CTA (événement `cta_click`), `form_start` (nécessite le redéploiement du Worker), `quiz_submit` suffixé « · Lancement ». Plan marketing de référence : artefact « Plan de lancement V5 ».

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
