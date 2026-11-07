# Bugs connus, risques et points de contrôle

## Résultat du contrôle de reprise (7 nov. 2026, `main` = `5b14ffa`, en local, sans modification)
- `node --check` : OK sur `js/*.js`, `config/*.js`, `admin/*.js`.
- `tools/veille.cjs` (local) : **0 anomalie** — sitemap 66 pages, 132 pages FR+EN rendues sans erreur JS, prix $ en anglais OK, formules du devis OK.
- Test Playwright ciblé (accueil FR/EN, Services, Devis mobile, Portfolio, À propos mobile, Contact, Collaboration, Connexion, FAQ) : aucune erreur JS.
- Recherche de secrets (HEAD + historique) : aucune clé réelle trouvée (seulement des exemples `sk_live_...` / `whsec_...` dans `server/README.md`).
- Non testé : site en ligne (domaine non joignable depuis cet environnement), Worker déployé, vrai iPhone/Safari.

## Checklist historique (à vérifier après CHAQUE modification de `js/script.js`)
| Problème historique | État au 7 nov. | Contrôle |
|---|---|---|
| Virgule manquante dans `I18N` → crash total | OK | `node --check js/script.js` |
| Déclarations dupliquées (`renderCommBox`) | OK : 1 seule déclaration (l. ~8869). Doublons `size/loop/run` = fonctions imbriquées locales, normal | `grep -oE '^function [A-Za-z0-9_$]+' js/script.js \| sort \| uniq -d` |
| `const SUBS` / `const OPTIONS` disparus après reconstruction | OK (l. ~1399 / ~1475) | grep des constantes `CATS SUBS OPTIONS POLAS LUMEN_TIERS I18N` |
| Apostrophe non échappée (`l'établissement`) | OK | `node --check` |
| `initHeroCarousel` appelé mais non défini | OK (défini l. ~1987) | grep |
| Navigation mobile | Refaite (menu plein écran, bouton rond) | Playwright 390×844 + 320×568 |
| Traductions FR/EN | OK selon veille | `tools/veille.cjs` |
| Images | Gérées via R2 + repli ; « rien ne doit rester invisible » | veille + contrôle visuel |
| Remplacement complet d'`index.html` | **Interdit** : SPA pré-rendue + 70 pages générées | toujours des remplacements ciblés |

## Risques ouverts
1. **Témoignages d'exemple sur l'accueil** (8 cartes) : remis à la demande d'Aya en attendant de vrais avis. Le plan de lancement du 8 oct. les qualifiait de pratique commerciale trompeuse (Code de la consommation). Risque juridique et d'image → à remplacer par de vrais avis avant toute communication. **[Décision Aya]**
2. **Worker déployé vs code** : beaucoup de fonctions « nécessitent le redéploiement du Worker ». Si le Worker n'a pas été redéployé, une partie de l'admin/agenda/sécurité ne fonctionne pas comme documenté. L'admin affiche un bandeau si la version diffère. **[À VÉRIFIER]**
3. **PR #1 obsolète** : 74 fichiers en conflit avec `main`, construite sur l'ancienne DA. Ne pas fusionner (voir `git-history.md`).
4. **Bugs iPhone/Safari** signalés par Aya (page blanche en cliquant une formule, titres invisibles…) corrigés sans test WebKit. À confirmer sur un vrai iPhone.
5. **Drone** : page `/drone/` « 4K Drone » toujours dans le menu alors que l'option drone est « bientôt » → incohérence possible pour un client.
6. **Turnstile inactif** (clés absentes) : seul le champ piège + limite par IP protègent les formulaires. Ne jamais remplir une seule des deux clés.
7. **Pas d'en-têtes HTTP de sécurité** sur bunkaio.com (GitHub Pages) tant que le DNS n'est pas proxifié par Cloudflare (décision d'Aya).
8. **Images masquées** lisibles avec `?show=1` ; outils `wrangler 3` avec avis de sécurité (dev seulement).
9. **Agenda** : deux réservations à la même seconde peuvent passer (KV sans verrou).
10. **Juridique** : durées de conservation, signature simple, clause mineurs, transferts hors UE à faire valider par un juriste ; ne jamais affirmer une conformité à 100 %. RC Pro non souscrite en sept. 2026 [À VÉRIFIER].
11. **Taille des fichiers** : `js/script.js` ~904 Ko et `css/style.css` ~740 Ko avec empilement de surcharges « en fin de fichier » → risque de régressions CSS en cascade ; `CLAUDE.md` ~157 Ko (lourd à charger). Pas de refonte sans accord, mais à surveiller.
12. **Dates** : certaines entrées de `CLAUDE.md` sont datées du 6 nov. alors que le dernier commit est du 5 nov. (20:50 UTC) — décalage de fuseau/horloge de l'agent, sans conséquence.

## Règles anti-régression retenues dans `CLAUDE.md` (extraits)
Pas de défilement animé vers une cible dont la hauteur n'est pas stable · pas de `backdrop-filter` sur les panneaux du devis en tactile · tout nouveau rendu du calendrier passe par `h._opts` à jour · après toute règle claire `#view-account`, vérifier la version `.acc-is-partner` · ajouter tout service tiers à la CSP d'`index.html` · garder le mot « Polas » dans la ligne de prestation du devis · ne pas mettre une rangée de formules en `overflow: hidden` sans retour à la ligne.
