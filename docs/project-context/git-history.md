# État Git / GitHub (audit en lecture seule du 7 nov. 2026)

Méthode : première version par `git ls-remote` + clone public ; **vérifiée le 7 nov. 2026 avec l'API GitHub authentifiée** (`gh`, compte `Bunkaio`, droits ADMIN). Les chiffres ci-dessous sont ceux de l'API. **Aucune fusion, suppression ni réécriture.**

Vérification API du 7 nov. 2026 : 4 branches distantes, **1 seule PR (la #1), 1 seul ticket ouvert (cette PR)**, aucune autre PR (ouverte, fermée ou fusionnée), aucun tag, aucun ruleset, aucune protection de branche. GitHub Pages : source `main`, statut `built`.

## Branches
| Branche | Dernier commit | En avance sur `main` | En retard | Verdict |
|---|---|---|---|---|
| `main` (prod) | `5b14ffa` — 5 nov. 2026 20:50 UTC « Découvrir chaque prestation : bouton arrondi » | — | — | 744 commits (729 Claude, 15 Bunkaio) |
| `audit/prelaunch` | `e07be0b` — 5 nov. 20:23 « Audit : Formspree… vitesse mobile » | **0** | 7 | Entièrement contenue dans `main` (fusionnée). Supprimable sans perte, **sur accord d'Aya**. |
| `claude/coding-session-zq4ki8` (nom exact ; pas « zq4k18 ») | `a0c80b7` — 8 oct. 19:38 « Accueil, carrousel des prestations (mobile)… » | **0** | 379 | Ancienne branche de session Claude, entièrement contenue dans `main`. Supprimable sans perte, sur accord. |
| `claude/mise-en-valeur-a-propos` | `750e482` — 12 oct. 20:45 « À propos mis en valeur… » | **1** | 282 | Seul travail non intégré (PR #1). |

## Pull Request #1
- « À propos mis en valeur : lien dans le menu et mini bannière sur l'accueil », ouverte le 12 oct. 2026 par la session Claude, base `main`.
- Contenu : lien « À propos » encadré dans le menu (desktop + mobile) après Portfolio, état actif correct (aujourd'hui « À propos » allume « Contact »), mini-bannière sur l'accueil (photo d'Aya, 8+ ans, 200+ projets, ETPA BTS 2018, basée à Montpellier), clés `abb-*` FR/EN, menu hamburger sous 1260 px.
- État **confirmé par l'API (7 nov. 2026)** : **OPEN**, non brouillon, `mergeable = CONFLICTING`, `mergeStateStatus = DIRTY`, 74 fichiers (+1505 / −224), 1 commit (`750e482`), créée par `Bunkaio`, **0 commentaire, 0 revue, 0 vérification CI**, dernière mise à jour le 12 oct. 2026. Branche : 1 commit en avance, 282 en retard sur `main`.
- Simulation de fusion (`git merge-tree`, sans rien écrire) : **74 fichiers en conflit** (toutes les pages pré-rendues, `css/style.css`, `js/script.js`, `.min`, `tools/lastmod.json`).
- Aucun élément de la PR n'existe dans `main` (`nav-about`, `about-banner`, `abb-*` absents). La mini-bannière est partiellement remplacée par le bloc Aya replié de l'accueil (`#hmAccAya`, lien vers /a-propos/) ; le menu n'a toujours pas « À propos ».
- La PR date d'avant la refonte DA de novembre (menu numéroté 01–07, Inter Tight…) : son CSS ne correspond plus.
- **Recommandation** : ne pas fusionner. Si Aya le confirme, réimplémenter le besoin dans la DA actuelle sur une nouvelle branche (lien « À propos » dans le menu + état actif), puis fermer la PR #1 avec un commentaire. Risque de perte : aucun (le diff reste consultable dans la PR).

## Chronologie des commits de `main`
| Mois | Commits | Faits marquants |
|---|---|---|
| juin 2026 | 77 | 10 juin : upload du site (fichier unique) + CNAME ; 16 juin : « Création structure SITE » ; 17 juin : Worker Stripe ; 18 juin : Resend |
| juil. | 4 | navbar dépolie, R2 + admin média, 40 images placeholder |
| sept. | 76 | Lumen ; DA éditoriale ; suspension drone/immobilier ; Modèles & mannequins |
| oct. | 373 | espaces client/partenaire (KV), admin unifié, devis signés, droits à l'image, pages villes + /en/, constellation, cookies, liens courts, places partenaires |
| nov. (1–5) | 214 | réponses automatiques, base prospects, refonte DA Grids/Lookbook, agenda, médias illimités, audit sécurité |

Pas de tags, pas de releases, pas de workflow CI dans le dépôt ; GitHub Pages construit à chaque push sur `main`.

## Règles Git pour la suite
- Jamais de push direct sur `main` sans validation explicite d'Aya ; travailler sur une branche `claude/<sujet>` + PR.
- Avant toute PR : `git fetch` + rebase sur `main` (le site bouge vite) ; relancer `tools/build-routes.cjs` après rebase (les fichiers générés conflictuent sinon).
- Nettoyage des branches fusionnées (`audit/prelaunch`, `claude/coding-session-zq4ki8`) : proposé, en attente d'accord. Rien n'a été supprimé.
- Le `main` local d'un poste peut être très en retard (constaté le 7 nov. : 555 commits) : toujours `git fetch` puis `git merge --ff-only origin/main` avant de créer une branche.
