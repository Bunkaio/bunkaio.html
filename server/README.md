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

Ce même email annonce une **réduction de 15 %** sur sa prochaine
prestation, qui n'est accordée qu'au clic sur le lien d'avis (pas dès
l'envoi de l'email). Concrètement, le lien dans l'email ne pointe pas
directement vers Google : il pointe vers une **passerelle** exposée par
le Worker (`/avis?c=<id_client>`), qui enregistre le clic sur la fiche
Customer Stripe concernée (metadata `avis_clique`), crée à cet instant
un coupon Stripe à usage unique et l'attache au Customer, puis redirige
immédiatement vers la vraie page d'avis Google. Stripe applique ensuite
ce coupon **automatiquement** à la prochaine facture du client (acompte
ou solde), sans aucune action de ta part lors de la création de cette
facture depuis `admin/index.html`, puis le retire après cette unique
utilisation. Le coupon expire après un an s'il n'est pas utilisé. La
redirection vers Google a toujours lieu même si l'enregistrement échoue
côté Stripe — le client n'est jamais bloqué.

Limite honnête à garder en tête : un clic prouve seulement que le client
a ouvert la page d'avis Google, pas qu'il a réellement validé son avis —
Google ne fournit aucun moyen de vérifier qu'un avis précis a été posté
suite à un clic. C'est la meilleure approximation possible avec les
outils disponibles sans mettre en place une intégration beaucoup plus
lourde (API Google Business Profile, avec son propre compte Google Cloud
et une autorisation manuelle de ta part).

Cette même passerelle (`/avis`, sans le paramètre `c`) fonctionne aussi
comme lien générique vers la page d'avis Google — utilisable par exemple
dans un QR code imprimé (carte de remerciement, flyer). Dans ce cas, le
client n'étant pas identifié, aucune réduction personnalisée n'est
accordée : c'est une simple redirection.

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

## Septième brique : score de leads et page admin dédiée

Chaque soumission du quiz reçoit désormais automatiquement un **score de 0 à
100** calculé à partir des réponses, pour repérer en un coup d'œil les
prospects les plus prometteurs sans avoir à ouvrir chaque fiche Stripe :

| Critère | Points |
|---|---|
| Budget estimé (déplacement inclus) : dès 400 € / dès 650 € / dès 1 000 € | +15 / +25 / +35 |
| Corporate, commercial, événementiel, Lumen | +15 |
| Mode, agence et mannequins | +10 |
| Délai souhaité urgent / « dans le mois » | +20 / +10 |
| Intérêt pour la communication récurrente | +10 |
| Option drone choisie | +10 |
| Téléphone renseigné | +5 |
| Projet décrit en détail (80 caractères ou plus) | +5 |

Les paliers de budget suivent la grille tarifaire (Signature particuliers 420 €, Premium 650 €, formules haut de gamme et événementiel à partir de 1 000 €) : ils se règlent dans `BUDGET_PALIERS_EUR`, `server/src/stripe.ts`.

Le score est ensuite classé en trois niveaux : **chaud** (≥ 70), **tiède**
(40-69), **froid** (< 40). Ces deux informations (`lead_score`,
`lead_temperature`) sont stockées dans les metadata du Customer Stripe, comme
toutes les autres données du quiz — aucun nouvel outil n'est nécessaire.

Une nouvelle route protégée par `ADMIN_TOKEN`, `GET /leads`, renvoie la liste
de tous les leads triés du plus chaud au plus froid. Elle alimente une
nouvelle page le tableau de bord (`admin/`) (même fonctionnement que `admin/index.html` :
token mémorisé dans le navigateur), qui affiche un tableau avec le nom/email,
le score et sa température, la catégorie, le montant estimé et la date de
soumission.

## Huitième brique : espace client sécurisé (comptes en base, plus en fichier public)

L'espace client/partenaire du site (connexion, commandes, paiements,
factures, informations, abonnements) lisait jusqu'ici un fichier
`comptes.json` à la racine du dépôt — or le dépôt GitHub du site est
**public**, donc ce fichier était servi sans aucune authentification à
quiconque sur `bunkaio.com/comptes.json` (noms, emails, téléphones,
montants, lien Lightroom personnel de chaque client inclus).

Cette brique remplace entièrement ce mécanisme par une vraie base de
comptes côté serveur ([Cloudflare KV](https://developers.cloudflare.com/kv/)),
jamais exposée directement : le site ne peut plus qu'appeler des routes
du Worker, qui vérifient l'identité avant de renvoyer quoi que ce soit.
Le code d'accès n'est jamais stocké en clair, seulement son empreinte
SHA-256 (voir `hashCode()` dans `src/accounts.ts`).

### 1. Créer le namespace KV (une seule fois)

```bash
npx wrangler kv namespace create ACCOUNTS_KV
```

Wrangler affiche un bloc contenant un `id`. Colle cet id dans
`wrangler.toml`, à la place de `REMPLACER_PAR_L_ID_DU_NAMESPACE` :

```toml
[[kv_namespaces]]
binding = "ACCOUNTS_KV"
id = "colle-l-id-ici"
```

### 2. Redéployer

```bash
npm run deploy
```

Les nouvelles routes sont alors actives :

- `POST /auth-login` — connexion (appelée par `doLogin()` dans `js/script.js`). Payload `{ type, email, code }`, renvoie le compte (sans le code) si les identifiants correspondent.
- `POST /account-update` — le client met à jour lui-même son nom/téléphone/adresse (ré-authentifie avec son code à chaque appel). Appelée par `saveAccInfo()`.
- `GET /accounts` (protégée par `ADMIN_TOKEN`) — liste tous les comptes (résumé). Avec `?type=client&email=...`, renvoie un compte en détail.
- `POST /accounts` (protégée par `ADMIN_TOKEN`) — crée ou met à jour un compte (profil, commandes, paiements, factures, abonnement). `code` est optionnel à la mise à jour (laisse le code d'accès actuel inchangé s'il est omis) et obligatoire à la création.

### 3. Gérer les comptes clients

Une nouvelle page le tableau de bord (`admin/`) (même token admin que les autres
pages `admin/`) permet de créer et modifier les comptes directement,
sans toucher au code ni à GitHub — c'est elle qui remplace l'édition
manuelle de `comptes.json`.

### 4. Migrer le compte de démonstration

`comptes.json` est supprimé du dépôt (il n'est plus lu nulle part). Pour
recréer le compte de démonstration (`demo@bunkaio.com` / `BKO-DEMO`) dans
la nouvelle base, le plus simple est d'utiliser le tableau de bord (`admin/`) une
fois déployé — ou directement en ligne de commande :

```bash
curl -X POST "https://bunkaio-quiz-stripe.<ton-sous-domaine>.workers.dev/accounts" \
  -H "Authorization: Bearer <ton ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "client",
    "email": "demo@bunkaio.com",
    "code": "BKO-DEMO",
    "nom": "Maison Lumière",
    "telephone": "06 12 34 56 78",
    "adresse": "12 rue des Ateliers, 75011 Paris",
    "etapeActuelle": 3,
    "lightroomUrl": "https://lightroom.adobe.com/shares/EXEMPLE-A-REMPLACER",
    "commandes": [
      { "date": "12/09/2026", "prestation": "Formule Signature — Shooting produit", "montant": "2 400 €", "statut": "En production" }
    ],
    "paiements": [
      { "date": "12/09/2026", "reference": "ACPT-2026-0142", "methode": "Carte bancaire", "montant": "720 €", "statut": "Payé", "factureUrl": "https://invoice.stripe.com/i/EXEMPLE" }
    ],
    "factures": [
      { "numero": "FAC-2026-0142-A", "date": "12/09/2026", "montant": "720 €", "statut": "Payée", "url": "https://invoice.stripe.com/i/EXEMPLE" }
    ]
  }'
```

### Limite honnête à garder en tête

Il n'y a pas de session persistée (pas de cookie, pas de JWT) : le front
garde le code d'accès en mémoire le temps de l'onglet ouvert, pour
pouvoir ré-authentifier `/account-update`, mais ne le stocke nulle part
(ni `localStorage`, ni cookie) — le client doit se reconnecter à chaque
visite, exactement comme avant. C'est une amélioration de sécurité
majeure par rapport au fichier public (la base entière n'est plus
exposée, un compte isolé n'est renvoyé qu'après vérification), mais pas
encore un système de session complet — raisonnable pour un espace de
suivi de commande, à revoir si l'espace client gagne des fonctionnalités
plus sensibles.

### Neuvième brique : Mes moodboards

Le client crée et modifie lui-même ses moodboards (un par shooting) depuis
l'espace client, via `/account-update` — le champ `moodboards` fonctionne
comme `nom`/`telephone`/`adresse` : fourni, il remplace la liste existante en
entier (le front garde l'état courant et renvoie tout le tableau à chaque
sauvegarde, y compris pour ajouter un simple commentaire). Rien de nouveau à
déployer côté Cloudflare (pas de nouveau namespace ni de nouvelle route) : un
simple `npm run deploy` suffit après avoir récupéré le code à jour.

Pour répondre à un moodboard en tant que Bunkaio (ajouter un commentaire côté
équipe, changer son statut en "Validé"...), c'est le tableau de bord (admin/) → champ
"Moodboards (JSON)" : charge le compte, édite le tableau à la main (ajoute un
objet `{"auteur":"bunkaio","texte":"...","date":"..."}` dans `commentaires`),
réenregistre. Pas d'interface dédiée pour l'instant côté admin — à construire
si ce fil d'échange devient un usage quotidien.

Deux modules optionnels s'ajoutent selon le type de projet choisi par le
client (champ `typeProjet`, 'particulier' ou 'marque') :
- `produits` — pour une marque, la collection/les produits à mettre en
  avant (vêtements, cosmétiques…).
- `collaborateurs` — les prestataires externes impliqués (styliste,
  traiteur, lieu…), chacun tagué avec un `domaine` qui reprend
  volontairement les mêmes identifiants que `CATS` dans js/script.js
  (les domaines du questionnaire de devis) plutôt qu'une liste propre au
  moodboard — une seule taxonomie à tenir à jour sur tout le site.

### Dixième brique : Mon partenariat (comptes Partenaire)

Même principe que les autres onglets : un champ `partenariat` sur le compte
(`{secteur, statut, dateAdhesion, articleUrl}`), visible uniquement côté
front quand `type` du compte vaut `'partner'` — l'onglet "Mon partenariat"
est masqué pour les comptes client. `secteur` reprend les identifiants du
formulaire de candidature (architecture, amenagement, artisanat, marques,
evenementiel). Les 4 avantages du programme et la mention des places
disponibles ne sont pas stockés par compte : ce sont des textes statiques
partagés avec la page Partenaires → Programme (mêmes clés I18N), pour ne
jamais les désynchroniser. Pas de nouveau déploiement Cloudflare requis,
un `npm run deploy` après `git pull` suffit.

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

## Réception automatique des modifications clients

Quand un client ou un partenaire enregistre quelque chose dans son espace
(moodboard, coordonnées, réponse à une collaboration, profil partenaire),
`/account-update` :

1. ajoute une entrée horodatée au **journal** du compte (`journal`, 200 entrées max, visible uniquement dans l'admin) ;
2. met la modification en file (`notif:<type>:<email>` dans `ACCOUNTS_KV`).

Le cron `*/5 * * * *` envoie **un seul email récapitulatif par compte** à
`ADMIN_NOTIFICATION_EMAIL` dès que le client n'a plus rien enregistré depuis
3 minutes (regroupement). Un moodboard encore en « Brouillon » est journalisé
mais ne déclenche pas d'email. En cas d'échec Resend, l'envoi est retenté au
passage suivant (7 jours max).

Dans le tableau de bord (`admin/`), le sélecteur de compte trie par activité récente,
affiche « ● » pour les comptes modifiés depuis votre dernière consultation et
la fiche montre le journal complet. Après modification du `wrangler.toml`
(nouveau cron), il faut redéployer : `npm run deploy`.
