# docs/project-context — index

Mémoire persistante du projet BUNKAIO, créée lors de la migration vers le nouveau compte Claude (7 nov. 2026). Toute nouvelle session doit lire `CLAUDE.md` (racine) puis ce dossier.

| Fichier | Contenu |
|---|---|
| `overview.md` | Entreprise, positionnement, objectifs, Agency Nascimento, Lumen |
| `architecture.md` | Architecture technique réelle (front, build, Worker, admin) |
| `features.md` | Fonctionnalités historiques → état actuel, manques |
| `design-system.md` | DA, typographie, couleurs, règles graphiques, interdits |
| `business-rules.md` | Grille tarifaire confirmée, règles commerciales, tarifs historiques |
| `decisions.md` | Décisions validées (chronologie) + propositions non adoptées |
| `known-issues.md` | Résultats du contrôle de reprise, checklist anti-régression, risques |
| `git-history.md` | Branches, PR #1, chronologie des commits |
| `workflows.md` | Méthode, tests, déploiement, routine de veille historique |
| `roadmap.md` | Priorités proposées |

## Sources analysées (archives de l'ancien compte, exportées le 7 nov. 2026)
- `memories` : mémoire de projet « BUNKAIO » (rédigée vers le 11 sept. 2026, partiellement obsolète : fichier unique, `comptes.json`, abonnements multiples).
- `projects` : projets « BUNKAIO » et « AGENCY NASCIMENTO » (vides, sans documents).
- `conversations` : 32 conversations ; liées à BUNKAIO : « WORKFLOW BUNKAIO » (10 juin), « SITE + AUTOMATISATION BUNKAIO » (10–17 juin, 183 messages), photobooth (25 août, 3 sept.), relance de BUNKAIO (20 sept.), campagne (8 oct.), structure éditoriale (3 nov.). Les autres conversations sont personnelles et n'ont pas été reprises.
- `claude_code_cloud` : canal « BUNKAIO », session « À propos » (12 oct., PR #1), routine de veille, captures `apercus/a-propos/` (fichiers non inclus dans l'export).
- `frames` : 15 artefacts (Lancement BUNKAIO / plan V5, Campagne de lancement, Actions BUNKAIO, Mes chiffres BUNKAIO, Modèle de devis, Parcours client mailing, Plan Instagram, Prospection mode, Nouveau feed, maquettes Constellation / Portfolio immersif / Article immersif / proposition éditoriale Lookbook…).
- Dépôt GitHub public `Bunkaio/bunkaio.html` (clone en lecture seule) — **source principale**.

## Non récupérable / absent des archives
- Les sessions Claude Code d'oct.–nov. 2026 qui ont produit ~600 commits (seule la session « À propos » est dans l'export) : leur contenu est reconstitué via les messages de commit et `CLAUDE.md`.
- Catalogue PDF et business plan PDF de juin 2026, manifeste, grille tarifaire d'origine (pièces jointes non exportées).
- Captures d'écran et images envoyées dans les conversations ; captures `apercus/a-propos/*.png`.
- Statistiques réelles (Stripe, Search Console, Instagram) et état du Worker déployé.
