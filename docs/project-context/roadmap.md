# Prochaines étapes et priorités (proposées le 7 nov. 2026, à valider par Aya)

## P0 — Débloquer l'environnement (sans toucher au site)
1. **Relier GitHub au nouveau compte Claude** (connecteur GitHub) pour pouvoir créer des branches/PR depuis les sessions. Sans cela : lecture seule.
2. Fusionner sur `main` la branche `docs/project-context` (ce dossier + en-tête de `CLAUDE.md`) — seule modification proposée à ce stade.
3. Vérifier dans l'admin que le **Worker déployé est à jour** (bandeau « Le serveur n'est pas à jour »). Sinon : `cd server && npm install && npx wrangler deploy`.
4. Statuer sur la **PR #1** (recommandé : fermer, et réimplémenter « À propos » dans le menu dans la DA actuelle).

## P1 — Chiffre d'affaires
5. **Arbitrer le positionnement** : le brief de reprise cite immobilier de prestige, architecture/design, drone ; le site (décision du 8 oct.) cible entrepreneurs + marques et a archivé immobilier/archi/drone. Options : (a) garder la stratégie du 8 oct. ; (b) réactiver Immobilier / Architecture (données prêtes dans `CATS_ARCHIVE_SUSPENDED`) ; (c) réactiver le drone si la certification « survol zones » est obtenue.
6. Remplacer les **8 témoignages d'exemple** par de vrais avis (Google) — prérequis avant toute campagne.
7. Tester un **devis réel de bout en bout** en mode test Stripe (devis → signature → acompte → espace client) ; désactiver SEPA et ajouter `charge.dispute.created` dans Stripe (à faire côté Aya depuis oct.).
8. **Search Console** : renvoyer le sitemap, demander l'indexation des pages villes, `/en/`, `/photographe-france/` ; fiche **Google Business** (zones Montpellier + Toulouse).
9. Remplir le Portfolio réel (séries/clients réels uniquement) via l'admin média.

## P2 — Qualité et sécurité
10. Tester sur un **vrai iPhone** les parcours signalés (formule → devis, agenda → devis, titres du devis).
11. « À propos » dans le menu (cf. 4) ; cohérence de la page **4K Drone** avec l'offre drone « bientôt ».
12. Turnstile : activer seulement avec les deux clés ensemble (décision Aya).
13. En-têtes de sécurité : proxy Cloudflare devant bunkaio.com (changement DNS, décision Aya).
14. Validation juridique des clauses (droit à l'image, conservation) ; RC Pro.

## P3 — Maintenabilité (sans refonte)
15. Découper `CLAUDE.md` (157 Ko) : garder les règles + une table des matières, déplacer l'historique détaillé dans `docs/project-context/changelog-ui.md` — seulement avec accord.
16. Recréer éventuellement une veille **en lecture seule** (voir `workflows.md`).

## Ouvert / en attente côté Aya (archives)
- Configuration Zoho Mail : DNS confirmé (« tout a été configuré avec Zoho », 10 juin 2026) [CONFIRMÉ en juin].
- Formation drone CPF (survol zones) ; projet Lumen / déménagement Mulhouse ; stratégie Instagram (vlog/backstage) ; lien avec Agency Nascimento — états actuels [À VÉRIFIER].
