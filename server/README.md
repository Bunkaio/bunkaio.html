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

## Troisième brique : envoi d'emails (Resend)

Le compte Stripe de Bunkaio bloque actuellement l'envoi natif de factures
par email (`stripe.invoices.sendInvoice` renvoie l'erreur *"This invoice
cannot be sent right now"*, une restriction propre au compte, indépendante
du code). Pour contourner ça sans dépendre de Stripe ni du support, le
Worker génère la facture via l'API Stripe (ce qui fonctionne très bien et
donne un lien de paiement hébergé) puis **envoie lui-même l'email** au
client, avec un design aux couleurs de Bunkaio (logo, palette, police),
via [Resend](https://resend.com) — un service d'emails transactionnels
simple, avec une offre gratuite large (3 000 emails/mois).

Ce même mécanisme envoie aussi automatiquement un email de confirmation
au prospect dès qu'il soumet le quiz (`/quiz-lead`).

### Configuration de Resend

1. Crée un compte gratuit sur [resend.com](https://resend.com).
2. Dans le Dashboard Resend, va dans **Domains** → **Add Domain** et entre
   `bunkaio.com`.
3. Resend affiche 2-3 enregistrements DNS (TXT/MX/CNAME) à ajouter chez
   l'hébergeur de ton nom de domaine (là où `bunkaio.com` a été acheté —
   pas forcément Cloudflare). **Ce n'est pas un changement de
   nameservers** : ce sont juste des lignes ajoutées à la configuration
   DNS existante, le site GitHub Pages continue de fonctionner normalement
   pendant et après cette étape.
4. Une fois les enregistrements ajoutés, clique sur **Verify** dans
   Resend (la propagation DNS peut prendre de quelques minutes à
   quelques heures).
5. Dans Resend, va dans **API Keys** → **Create API Key**, copie la clé
   générée (commence par `re_...`).
6. Injecte-la dans le Worker :

```bash
npx wrangler secret put RESEND_API_KEY
# colle la clé re_... quand demandé, puis Entrée
```

7. Vérifie que `EMAIL_FROM` dans `wrangler.toml` utilise bien une adresse
   du domaine que tu viens de vérifier (par défaut `factures@bunkaio.com`
   — n'importe quelle adresse `@bunkaio.com` fonctionne, pas besoin
   qu'elle existe vraiment comme boîte mail).
8. Redéploie :

```bash
npm run deploy
```

Tant que le domaine n'est pas vérifié dans Resend, l'envoi de facture
continue de fonctionner côté Stripe (la facture est créée normalement),
mais l'email échoue : la page admin affiche alors le lien de paiement à
transmettre toi-même au client, en attendant que la vérification Resend
soit terminée.

## Quatrième brique : confirmation automatique de paiement (webhook Stripe)

Jusqu'ici, rien ne se passait automatiquement quand un client payait
réellement une facture d'acompte ou de solde — il fallait aller vérifier
soi-même dans le Dashboard Stripe. Le Worker expose maintenant une route
`/stripe-webhook` que Stripe appelle dès qu'une facture est payée. Elle
déclenche automatiquement :

- un email de confirmation/remerciement au client ;
- une notification interne (par email, à `ADMIN_NOTIFICATION_EMAIL`) pour
  ne plus avoir à surveiller Stripe manuellement.

Seules les factures créées par `/create-deposit-invoice` et
`/create-balance-invoice` déclenchent ces emails (reconnues via leur
metadata Stripe) — une facture payée créée manuellement ailleurs dans
Stripe est ignorée silencieusement.

### Configuration du webhook

1. Dans le [Dashboard Stripe](https://dashboard.stripe.com/webhooks) → **Développeurs** → **Webhooks** → **Add an endpoint**.
2. URL de l'endpoint :
   ```
   https://bunkaio-quiz-stripe.<ton-sous-domaine>.workers.dev/stripe-webhook
   ```
3. Dans **Select events to listen to**, sélectionne uniquement **`invoice.paid`**.
4. Une fois l'endpoint créé, Stripe affiche une **Signing secret** (commence par `whsec_...`) — copie-la.
5. Injecte-la dans le Worker :

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
# colle la valeur whsec_... quand demandé, puis Entrée
```

6. Vérifie que `ADMIN_NOTIFICATION_EMAIL` dans `wrangler.toml` correspond
   bien à l'adresse où tu veux recevoir les notifications de paiement
   (par défaut `contact@bunkaio.com`).
7. Redéploie :

```bash
npm run deploy
```

Pour tester, paye une facture de test générée depuis `admin/index.html`
(en mode test Stripe), puis vérifie dans `npm run tail` que la ligne
`[stripe-webhook] facture payée` apparaît, et que les deux emails sont
bien reçus.

Ce même webhook met aussi à jour automatiquement les **metadata du
Customer Stripe** (`acompte_paye`, `solde_paye`, dates, montants) — visible
directement sur la fiche client dans Stripe, sans ouvrir chaque facture.

## Cinquième brique : demande d'avis automatique après le solde payé

Dès que la facture de **solde** (70 %) est payée — donc le projet
entièrement réglé — le webhook envoie automatiquement un second email au
client lui demandant un avis Google.

**Avant de redéployer**, remplace la valeur de `GOOGLE_REVIEW_URL` dans
`wrangler.toml` par ton vrai lien d'avis Google (Google Maps → ta fiche
d'établissement → **Demander des avis** → copier le lien). Tant que cette
valeur reste à `https://g.page/r/REMPLACE-MOI/review`, l'email partira
quand même mais avec un lien invalide.

## Sixième brique : relance automatique des factures impayées

Une tâche planifiée (cron Cloudflare) tourne chaque jour à 8h UTC et
recherche les factures d'acompte/solde dont l'échéance (7 jours après
création) est dépassée et qui n'ont pas encore été relancées. Pour
chacune, elle envoie un email de rappel au client avec le lien de paiement,
puis marque la facture (metadata `relance_envoyee`) pour ne jamais relancer
deux fois la même facture.

Aucune configuration supplémentaire n'est nécessaire : le déclencheur est
déjà défini dans `wrangler.toml` (`[triggers] crons = ["0 8 * * *"]`) et
s'active automatiquement après un `npm run deploy`.

Pour tester manuellement sans attendre le lendemain :

```bash
curl "http://localhost:8787/__scheduled" 
```

(endpoint spécial disponible uniquement quand le Worker tourne en local via `npm run dev`).

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
