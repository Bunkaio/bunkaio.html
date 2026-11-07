# Architecture technique réelle (état de `main` au 5 nov. 2026, commit `5b14ffa`)

⚠️ Le site **n'est plus un fichier `index.html` unique** (c'était vrai en juin 2026). Depuis juin–oct. 2026 il est devenu une SPA multi-pages pré-rendue + un backend Cloudflare. Toute consigne du type « remplacer index.html » est obsolète et dangereuse.

## Hébergement et domaine [CONFIRMÉ]
- Dépôt public `Bunkaio/bunkaio.html`, branche de production `main`, **GitHub Pages** (déploiement « pages-build-deployment » à chaque push sur `main`, pas de workflow dans `.github/`).
- Domaine `bunkaio.com` (fichier `CNAME`), DNS chez **Hostinger** (A/ALIAS + CNAME `www` → `bunkaio.github.io`, HTTPS forcé).
- Messagerie : **Zoho Mail Lite** pour contact@bunkaio.com ; la boîte de réception de l'admin relève aussi les emails via Resend (« Email Routing », copie Zoho jamais touchée).
- Pas de proxy Cloudflare devant bunkaio.com (DNS gris) → aucun en-tête HTTP de sécurité réglable ; CSP posée en `<meta>`.

## Front (statique) [CONFIRMÉ]
| Élément | Rôle |
|---|---|
| `index.html` (~157 Ko) | Coquille de la SPA : menu, toutes les vues `#view-*`, pré-rendu, JSON-LD, CSP `<meta>` |
| `js/script.js` (~904 Ko, ~11 000 lignes) → `js/script.min.js` | Toute la logique : `I18N.fr/en`, `t({fr,en})`, `goView()`, devis, données tarifaires (`CATS`, `SUBS`, `POLAS`, `OPTIONS`, `SPECIAL_OPTIONS`, `LUMEN_TIERS`, `TRAVEL_*`, `STUDIO_FEE`), espaces client/partenaire, agenda… |
| `js/devis-model.js`, `js/analytics.js`, `js/consent.js` | Modèle de devis, mesure maison sans cookie, consentement |
| `css/style.css` (~740 Ko) → `css/style.min.css` | Styles ; nombreux blocs de surcharge « en fin de fichier » (DA Grids / Lookbook / GX / PX) |
| `config/media.js` | **Configuration centralisée des images** (`IMG`, commentaires ①②③…, `PF_SERIES`, `GOOGLE_REVIEW_URL`) — à préserver |
| `config/routes.js` | Routes SEO FR + `/en/…` (vues : home, services, service ×6, city ×3, discover, about, quiz, portfolio, contact, partners, legal ×5, share, avail, drone, login, account, advice, article) |
| `config/articles.js`, `articles.en.js` | Articles « Conseils » (10 actifs) |
| `config/entity.json`, `analytics.js`, `consent.js` | Données structurées, mesure, déclaration des services de consentement |
| Dossiers `services/`, `en/`, `a-propos/`, `devis/`… | Pages **générées** (pré-rendu) — ne pas éditer à la main |
| `fonts/` | Inter Tight (OFL), police du site depuis nov. 2026 |
| `images/`, `videos/` | Médias du dépôt (logos, repli) ; les photos gérées par l'admin sont dans R2 |

Arrière-plans : historiquement variables CSS sur `html::before` (compatibilité multi-appareils) — toujours présent (`css/style.css` l. ~436) mais largement surchargé par les fonds « papier » et constellation des vues GX/PX.

## Build [CONFIRMÉ]
`NODE_PATH=<node_modules globaux> node tools/build-routes.cjs` — à relancer après toute modification de `js/`, `css/`, `config/` ou `index.html` : pré-rend FR + EN, sitemap, hreflang, images de partage 1200×630, minification (esbuild depuis `server/node_modules` → faire `cd server && npm install` d'abord), versions `?v=` des fichiers, empreinte `server/src/version.ts`. Les fichiers générés font partie du commit.

## Backend : Worker Cloudflare `server/` [CONFIRMÉ]
- URL : `bunkaio-quiz-stripe.bunkaio.workers.dev` ; plan Workers Paid (5 $/mois) depuis le 13 oct. 2026.
- `server/src/*.ts` (29 modules) : comptes (KV `ACCOUNTS_KV`, remplace l'ancien `comptes.json` supprimé le 1er oct. 2026), devis et signature (`quotes.ts`, `pdf.ts`), Stripe (leads, factures acompte/solde, Klarna/Scalapay), Resend (emails), boîte de réception, mailing, réponses automatiques, agenda (`availability.ts`), partenaires (places), séries Portfolio, médias R2 (+ masquage), liens courts `/go/`, campagne, D1 (audience/analytics), veille (`watch.ts`, cron 7h30/19h30), sécurité (`formGuard`, Turnstile prêt mais inactif, en-têtes).
- Déploiement **manuel** : `cd server && npm install && npx wrangler deploy` ; contrôle : `npx tsc --noEmit`. L'admin affiche « Le serveur n'est pas à jour » si `WORKER_VERSION` diffère.
- Secrets (jamais dans le dépôt) : clés Stripe, Resend, `ADMIN_TOKEN`, adresse légale, `TURNSTILE_SECRET`… via `wrangler secret put`. `server/.dev.vars` est ignoré par git.
- ⚠️ De nombreuses évolutions de `CLAUDE.md` portent « Nécessite le redéploiement du Worker » : l'état réellement déployé est **[À VÉRIFIER]**.

## Admin [CONFIRMÉ]
- `admin/index.html` (~373 Ko) : base de contacts/CRM, devis, factures, séances, agenda, mailing, boîte mail, campagne & ads, réponses aux devis, droits à l'image, veille.
- `admin/media.html` + `media-editor.js` (éditeur visuel) + `media-video.js` (ffmpeg.wasm) : gestion des images/vidéos (R2), `IMAGE_SPECS` / `toWebP`.

## Formulaires [CONFIRMÉ]
- **Formspree** toujours utilisé (`FORMSPREE_URL` dans `js/script.js`) pour contact / collaboration / candidature, en complément du Worker (`/ack`, `/quiz-lead`) ; champ piège anti-robot ; limite d'envois par IP côté Worker.

## Outils
- `tools/veille.cjs` : contrôle complet (sitemap, 66 pages × FR/EN, prix $ en anglais, formules du devis) ; `--live` contrôle aussi le site en ligne.
- `ops/veille.json` : rapports de la routine de veille (1 seul rapport, 8 oct. 2026).
- Node 22 + Playwright requis ; Python utilisé historiquement pour les remplacements ciblés.
