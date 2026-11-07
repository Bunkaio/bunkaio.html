# Méthode de travail, tests et déploiement

## Principes (brief de reprise, nov. 2026)
1. Priorité aux actions utiles au développement et au chiffre d'affaires.
2. Pas de refonte inutile, pas de suppression de fonctionnalité sans raison documentée, pas de reconstruction complète quand une modification ciblée suffit.
3. Modifications non demandées seulement avec justification ; plan + risques expliqués brièvement avant une intervention importante.
4. Tests systématiques : desktop, mobile, version anglaise, liens, formulaires, interactions.
5. Documenter chaque changement (commit clair + `CLAUDE.md` si règle durable + ce dossier si décision).
6. Aya veut un associé technique : initiative, réponses en français, peu de détails sur le secondaire.

## Cycle d'une modification
1. `git fetch origin && git checkout -b claude/<sujet> origin/main`
2. Lire la section concernée de `CLAUDE.md` et le code (le code fait foi).
3. Modification **ciblée** (Edit, ou script Python avec `assert s.count(ancien)==1` avant remplacement) — jamais de réécriture complète d'`index.html`, `js/script.js` ou `css/style.css`.
4. Contrôles :
   - `node --check js/script.js` (et fichiers touchés) ;
   - checklist de `known-issues.md` (constantes présentes, pas de doublon de fonction) ;
   - `cd server && npm install` (une fois), puis `NODE_PATH=$(npm root -g) node tools/build-routes.cjs` ;
   - `NODE_PATH=$(npm root -g) node tools/veille.cjs` (doit finir `failed: 0`) ;
   - captures Playwright : 1440×900, 1280×800, 390×844, 320×568, + `/en/…` ; zéro `pageerror` ;
   - si `server/src` change : `cd server && npx tsc --noEmit`, puis rebuild (empreinte `WORKER_VERSION`).
5. Commit en français (une modification = un commit lisible), push de la branche, PR vers `main` avec avant/après + captures.
6. Fusion **par Aya** (ou par Claude seulement sur son accord explicite). GitHub Pages déploie en ~1 min ; vérifier le site en ligne (`tools/veille.cjs --live` si le domaine est joignable).
7. Si le Worker a changé : **Aya** (ou une session autorisée) lance `cd server && npm install && npx wrangler deploy` ; l'admin doit ne plus afficher « Le serveur n'est pas à jour ».

Historique : jusqu'en sept. 2026, Aya copiait le fichier produit par Claude et le poussait avec **GitHub Desktop** (pull obligatoire avant push). Depuis oct. 2026, les sessions Claude Code poussent directement (branches + `main`). À clarifier avec Aya : qui fusionne désormais.

## Sécurité
- Jamais de clé, mot de passe, jeton, donnée client ou adresse personnelle dans le dépôt (public) ni dans ces documents. Secrets = `wrangler secret put`.
- Ne pas toucher `server/wrangler.toml`, `config/consent.js`, la CSP, les secrets ou le DNS sans demande explicite.
- Lien d'avis Google : identique dans `config/media.js` et `server/wrangler.toml`.

## Routine historique « Veille BUNKAIO » (analyse, NON réactivée)
- Créée le 8 oct. 2026 sur l'ancien compte (Claude Code, routine `trig_015s8Z78g2bjDKEFvbiKjY2Z`), cron `CRON_TZ=Europe/Paris 47 9,21 * * *` (9 h 47 et 21 h 47). **Désactivée** (`enabled: false`) depuis le 8 oct. 19:38 UTC ; aucune exécution enregistrée. Elle n'existe pas sur le nouveau compte (vérifié : aucune tâche planifiée).
- Instructions : mettre à jour la branche depuis `origin/main` ; lancer `tools/veille.cjs --live`, `npx tsc --noEmit` dans `server`, vérifier le dernier déploiement GitHub Pages (outils GitHub MCP), relancer `build-routes` si besoin ; **en cas d'anomalie : corriger, retester, commit et `git push origin HEAD:main`** ; écrire un rapport dans `ops/veille.json` (≤ 30, un par jour) et le pousser sur `main` ; n'écrire à Aya que si une action de sa part est nécessaire.
- Permissions implicites : écriture sur le dépôt et **push direct sur `main` sans revue** (production immédiate via GitHub Pages).
- Risques : correction automatique non relue mise en production ; boucle de commits (2 rapports/jour = bruit dans l'historique) ; conflits avec les sessions de développement ; dépendance au réseau (site en ligne, MCP GitHub).
- Seul rapport produit : `ops/veille.json` du 8 oct. 2026 (statut `corrige`, action : redéployer le Worker).
- Un autre déclenchement ponctuel (`trig_01UyeNx57qA1w6FQLc5g78dQ`, 3 nov.) était une simple reprise après limite d'usage.
- Doublon côté serveur : le Worker a sa propre veille (`server/src/watch.ts`, cron 7 h 30 / 19 h 30 UTC, historique KV, rubrique admin « Veille du site »), indépendante de Claude.
- **Recommandation si on la recrée** : mode « rapport seulement » (lecture + `tools/veille.cjs`), corrections proposées sur une branche + PR, jamais de push sur `main`, rapport hebdomadaire plutôt que 2×/jour ; création seulement après accord écrit d'Aya.

## Autres automatismes existants (côté Worker, actifs si déployé)
Relances de devis J+2 / J+7, relance unique d'acompte, purge de la corbeille (30 j), agenda (expiration des options 48 h), veille du Worker, réponses automatiques aux demandes de devis.
