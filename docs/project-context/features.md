# Fonctionnalités

Détail fin de chaque comportement : `CLAUDE.md` (racine). Ici : la carte d'ensemble, comparée aux fonctionnalités historiques.

## Fonctionnalités historiques → état actuel
| Historique (juin 2026) | État dans `main` | Statut |
|---|---|---|
| Questionnaire de devis en 5 étapes | Vue `quiz` `/devis/` : écran de choix « J'estime mon projet » / « Je vérifie les disponibilités », puis 5 étapes (domaine, profil, formule, votre prestation + date/agenda, coordonnées), créneau pré-réservé 48 h | [CONFIRMÉ] évolué |
| 8 catégories de services (`CATS`) | **6 gammes actives** : photo-part (particuliers), corporate (Corporate & Personal Branding), mode, commercial, event, lumen (prototype). Immobilier, archi, artisanat → `CATS_ARCHIVE_SUSPENDED`. Drone → « bientôt » | [CONFIRMÉ] réduit volontairement |
| Calculateur de prix animé | Encadré « Estimation de votre devis » en fin de parcours ; options « sur devis » signalées ; prix $ en anglais (`initUsdPrices`) | [CONFIRMÉ] |
| Formules Découverte / Signature / Premium / Éditorial | Toujours, + palier **Lancement** (corporate), Book grossesse, Polas, Studio Continu | [CONFIRMÉ] |
| Photo, vidéo, drone | Photo + vidéo (dans les formules hautes) ; drone suspendu (page `/drone/` « 4K Drone » toujours en ligne, option drone `comingSoon`) | ⚠️ voir roadmap |
| Options supplémentaires | `OPTIONS` : photos additionnelles, film, pack réseaux, express 72 h ; drone (bientôt) ; mise en beauté (Éditorial particuliers) | [CONFIRMÉ] |
| Abonnements mensuels (immobilier, cuisines, artisan, mode) | **Un seul** : Studio Continu (mode/mannequins) 790 €/mois, 6 mois | [CONFIRMÉ] réduit |
| Portfolio par catégorie | Portfolio éditorial « Grids/Lookbook » : univers + séries (gérées dans l'admin, Worker `series.ts`), visionneuse, plein écran mobile, photos illimitées via R2 | [CONFIRMÉ] |
| Navigation responsive | Menu éditorial numéroté, menu mobile plein écran, bouton Retour global | [CONFIRMÉ] |
| FR/EN | Toutes les routes indexables ont `/en/…` ; bouton FR/EN ; `I18N.fr/en` | [CONFIRMÉ] |
| Espace client | Vue `account` : moodboards, suivi, devis à signer, factures, séances, galerie, langue | [CONFIRMÉ] |
| Espace partenaire | Même vue, thème sombre/champagne : tarif −20 %, partenariat, réseau (en cours) | [CONFIRMÉ] |
| Connexion via `comptes.json` | Supprimé le 1er oct. 2026 → comptes dans KV, codes d'accès 6 caractères, plafonds d'échecs | [CONFIRMÉ] remplacé |
| Formspree | Toujours actif + Worker | [CONFIRMÉ] |
| Page À propos | `/a-propos/` vue GX (portrait, chiffres, spécialités en accordéons). **Pas dans le menu principal** ; accessible par le bloc Aya de l'accueil, onglet de Contact et pied de page | ⚠️ voir PR #1 |
| Partenaires | Page Collaboration (`/collaboration/`) : collaboration ponctuelle vs Programme Partenaires Fondateurs (5 places × 5 univers) | [CONFIRMÉ] |
| Configuration centralisée des images | `config/media.js` (`IMG`) + admin média (R2) + éditeur visuel | [CONFIRMÉ] |
| Carrousel héros par page | `initHeroCarousel` défini (l. ~1987) ; bannières `hero/<page>-1.webp` | [CONFIRMÉ] |

## Fonctionnalités ajoutées depuis (juil.–nov. 2026)
- Backend Stripe : leads, factures d'acompte (30 %) / solde (70 %), Klarna / Scalapay « sous réserve d'éligibilité » (pas pour Polas).
- Devis signés en ligne (`/signature/`) avec clauses de droit à l'image versionnées, PDF figé, preuve ; `/autorisation/`, `/retrait-autorisation/`.
- Agenda public 2026–2027 (`/disponibilites/`), automatique (options 48 h, confirmation à la signature/acompte).
- Admin complet (CRM, mailing, réponses automatiques, relances J+2/J+7, campagne & ads, liens courts + QR, veille).
- Pages SEO : 6 pages prestation, 3 pages villes (Montpellier, Toulouse, France), 10 articles Conseils, FAQ / CGV / confidentialité / cookies / droits à l'image.
- Mesure d'audience maison sans cookie ; bandeau de consentement prêt (n'apparaît que si un service tiers est déclaré).
- Refonte DA nov. 2026 (validée par Aya le 2 nov.) : Grids d'Obys × Almira Kho × Lookbook, Inter Tight, papier, constellation ⊹.

## Manquant / incomplet
- « À propos » dans le menu + mini-bannière accueil : demandé le 12 oct., PR #1 jamais fusionnée (voir `git-history.md`).
- Turnstile : code prêt, clés absentes (inactif).
- Annuaire du réseau partenaire : « en cours de réalisation ».
- Lumen : prototype sans prix.
- Vrais avis clients : les 8 témoignages d'accueil sont des **exemples** (voir `known-issues.md`).
- Tests sur vrai iPhone/Safari : jamais faits (plusieurs bugs iOS corrigés « à l'aveugle »).
