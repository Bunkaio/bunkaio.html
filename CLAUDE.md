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
- Pas de fausse preuve sociale ni de service inventé. Les collections du portfolio sont des collaborations, pas des clients.
- Lien d'avis Google unique : `config/media.js` (`GOOGLE_REVIEW_URL`) et `server/wrangler.toml` doivent rester identiques.
- Ne pas lancer `pkill -f "http.server"` depuis le shell de l'agent.

## Grille tarifaire (source : `CATS`, `LUMEN_TIERS`, `SUBS`, `POLAS` dans `js/script.js`)
- Particuliers 250 / 420 / 650 / 1 090 · Book grossesse 450 · Corporate 250 / 450 / 690 / 1 090.
- Mode 490 / 990 / 1 690 / 2 490 · Polas 100 · Studio Continu 790 €/mois (6 mois).
- Commercial 390 / 750 / 1 390 / 2 390 · Événementiel 420 / 750 / 1 290 / 2 190.
- Lumen (bientôt disponible, 2027) : Découverte 590, Signature 1 190, Premium sur mesure.
- Déplacement : offert ≤ 30 km de Montpellier ou Béziers, Toulouse et agglomération 50 €, ailleurs 0,60 €/km aller-retour au-delà de 30 km.
- Programme partenaires : −20 % permanent (décision de la propriétaire).

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
