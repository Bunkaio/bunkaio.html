# bunkaio-quiz-stripe — Worker de capture de leads

Cloudflare Worker TypeScript indépendant qui reçoit les soumissions du quiz
Bunkaio et crée/met à jour le Customer Stripe correspondant (déduplication
par email, metadata `source=quiz_bunkaio`, type de projet, formule,
budget, délai souhaité…).

Ce Worker est **totalement indépendant du site statique** (hébergé sur
GitHub Pages). Aucune migration DNS, aucun changement de nameservers sur
`bunkaio.com` n'est nécessaire : le Worker est déployé sur l'URL gratuite
`*.workers.dev` fournie par Cloudflare.

## Pré-requis

- Un compte Cloudflare (gratuit) — pas besoin d'y rattacher le domaine `bunkaio.com`.
- Une clé secrète Stripe (`sk_live_...` ou `sk_test_...` pour les tests), récupérable dans le Dashboard Stripe → Développeurs → Clés API.
- Node.js installé en local.

## Installation

```bash
cd server
npm install
```

## Connexion à Cloudflare

```bash
npx wrangler login
```

Une fenêtre de navigateur s'ouvre pour autoriser Wrangler — aucune
configuration DNS n'est demandée à cette étape.

## Configuration du secret Stripe

La clé secrète n'est **jamais** stockée dans le repo. Elle est injectée
directement dans l'environnement du Worker :

```bash
npx wrangler secret put STRIPE_SECRET_KEY
# coller la clé sk_live_... ou sk_test_... quand demandé, puis Entrée
```

## Vérification des types

```bash
npm run typecheck
```

## Déploiement

```bash
npm run deploy
```

Wrangler affiche en sortie l'URL publique du Worker, de la forme :

```
https://bunkaio-quiz-stripe.<ton-sous-domaine>.workers.dev
```

Cette URL est stable d'un déploiement à l'autre (tant que `name` dans
`wrangler.toml` ne change pas).

## Dernière étape : brancher le front

Ouvre `js/script.js` à la racine du repo et remplace la valeur de
`QUIZ_LEAD_WORKER_URL` par l'URL ci-dessus, suffixée de `/quiz-lead` :

```js
const QUIZ_LEAD_WORKER_URL = 'https://bunkaio-quiz-stripe.<ton-sous-domaine>.workers.dev/quiz-lead';
```

Aucune autre modification n'est nécessaire — le quiz appelle déjà ce
endpoint en arrière-plan à la soumission (voir `submitQuiz()` /
`sendQuizLeadToStripe()` dans `js/script.js`).

## Tester en local avant de déployer

```bash
npm run dev
```

Wrangler démarre le Worker sur `http://localhost:8787`. Pour tester
depuis le site servi en local (ex. `http://127.0.0.1:5500`), ajoute
temporairement cette origine à `ALLOWED_ORIGINS` dans `wrangler.toml`.

## Deuxième route : facture d'acompte automatique (`/create-deposit-invoice`)

En plus de `/quiz-lead`, le Worker expose une route protégée qui crée et
envoie automatiquement par email une facture Stripe d'acompte (30 % du
montant total) pour un client déjà existant dans Stripe (créé via le
quiz). Elle est appelée depuis la mini page `admin/index.html`, publiée
sur le site comme une page normale (ex. `https://bunkaio.com/admin/`).

Cette route est protégée par un jeton secret distinct de la clé Stripe —
à inventer toi-même (une suite de caractères longue et aléatoire, pas un
mot de passe habituel) :

```bash
npx wrangler secret put ADMIN_TOKEN
# choisis et colle une valeur longue (ex. générée sur https://1password.com/password-generator/)
```

Redéploie ensuite pour que la nouvelle route soit active :

```bash
npm run deploy
```

Sur la page `admin/index.html`, le champ "Token admin" attend exactement
cette même valeur. Elle est mémorisée dans le navigateur après la
première saisie.

## Voir les logs en production

```bash
npm run tail
```

Affiche en temps réel les `console.log` / `console.error` du Worker
(soumissions reçues, erreurs Stripe, payloads rejetés par la validation).

## Évolutions prévues

Ce Worker est conçu comme le point d'entrée unique de la logique
commerciale serveur de Bunkaio. Les prochaines étapes (devis automatique,
facturation, réservation en ligne, automatisations marketing) peuvent être
ajoutées comme nouvelles routes dans `src/index.ts`, en réutilisant
`createStripeClient()` et le Customer déjà résolu par email dans
`stripe.ts`.
