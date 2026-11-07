# Prestations, tarifs et règles commerciales

**Source de vérité : `js/script.js`** (`CATS`, `SUBS`, `POLAS`, `SPECIALS`/Book grossesse, `OPTIONS`, `SPECIAL_OPTIONS`, `LUMEN_TIERS`, `TRAVEL_*`, `STUDIO_FEE`, `PARTNER_DISCOUNT`). Relu le 7 nov. 2026 sur `main` (`5b14ffa`). Toute modification de prix doit être faite dans ces constantes ; les textes, la FAQ, les pages pré-rendues et les prix en dollars en découlent (relancer `build-routes`). Prix **nets** (franchise de TVA), en euros.

## Grille actuelle [CONFIRMÉ]
| Gamme (id) | Découverte | Lancement | Signature | Premium | Éditorial |
|---|---|---|---|---|---|
| Séance photo particuliers (`photo-part`) | 250 € · 1 h · 8 photos | — | 420 € · 2 h · 15 photos | 650 € · 4 h · 25 photos | 1 090 € · journée · 30 photos + film 30 s |
| Corporate & Personal Branding (`corporate`) | 250 € · 1 h · **6** photos | **320 €** · 1 h 30 · 12 photos | 450 € · 2 h · 15 photos | 690 € · 4 h · 25 photos | 1 090 € · journée · 30 photos + film + post-prod premium |
| Mode, agence et mannequins (`mode`) | 490 € · 8 photos | — | 990 € · 20 photos + 1 Reel | 1 690 € · 30 photos + film + 2 Reels | 2 490 € · 35 photos + film 2 min + 3 Reels |
| Commercial & produits (`commercial`) | 390 € · ≤5 produits · 10 photos | — | 750 € · ≤12 produits · 20 photos | 1 390 € · ≤25 produits · 35 photos + Reel | 2 390 € · 50 photos + film 90 s + 2 Reels |
| Événementiel (`event`) | 420 € · 2 h · 20 photos | — | 750 € · 4 h · 40 photos | 1 290 € · complet · 80 photos + teaser | 2 190 € · 100 photos + aftermovie + 2 Reels |
| Lumen — photobooth IA (`lumen`) | prototype, **aucun prix publié** ; liens → `/contact/#lumen` | | | | |

Formules spéciales :
- **Book grossesse** 450 € (1 h 30, 10 photos, studio en option).
- **Polas** (mode) **90 €** — studio inclus, 20 min, 6 photos brutes, HD sous 24 h ; **carte bancaire en une fois uniquement** (pas de Klarna/Scalapay). (Avant le 6 nov. 2026 : 160 €.)
- **Studio Continu** (abonnement mode/mannequins) **790 €/mois**, engagement 6 mois — **seul abonnement actif**.

Options (`OPTIONS`) : photos additionnelles 40 € l'unité, pack 10 = 340 €, 15 = 470 €, 20 = 600 € · film additionnel dès 250 € (Reel 60 s) / 490 € (60–90 s) / 790 € (2 min) · pack réseaux renforcé 240 € · livraison express 72 h +20 % · drone dès 390 € (**bientôt**, non vendable) · mise en beauté sur devis (Éditorial particuliers).

## Règles [CONFIRMÉ]
- **Studio** : jamais inclus ; option +60 € (`STUDIO_FEE`) sur particuliers, Book grossesse, corporate/Lancement, mode, commercial ; pas pour l'événementiel ni l'abonnement ; Polas = studio inclus.
- **Déplacement** : offert ≤ 30 km autour de 3 pôles (Montpellier, Toulouse, ouest de l'Hérault) ; au-delà 0,60 €/km aller-retour, plafonné à 350 € (`TRAVEL_CAP`, ~320 km : Paris, Lille…) ; distance ≈ vol d'oiseau × 1,25, arrondi à 5 €. Les textes publics ne détaillent plus rayon / €/km / plafond (6 nov.) : « le devis en ligne calcule automatiquement ».
- **Béziers** : ne jamais l'écrire, sauf la ligne « Basé en Occitanie — mobile sur toute la France sur devis, et gratuitement (jusqu'à 30 km) sur Béziers, Montpellier et Toulouse ».
- **Paiement** : acompte 30 % à la signature, solde 70 % ; carte = en une fois ; 3 fois sans frais uniquement via Klarna ou Scalapay, toujours « sous réserve d'éligibilité » ; jamais pour Polas.
- **Partenaires** : tarif partenaire permanent −20 % (`PARTNER_DISCOUNT`) ; 5 places par univers × 5 univers = 25 ; aucune autre promotion (retirée le 14 oct. 2026).
- **Interdits** : remises, prix barrés, promotions de lancement, « low-cost », « déplacements toujours offerts ».
- Délais de livraison : 3 à 10 jours ouvrés selon formule (affichés par formule).
- Succès du devis : réponse sous 48 h ; la demande est étudiée au regard de la ligne éditoriale de BUNKAIO (règle de juin 2026, toujours présente dans le code).

## Tarifs historiques — NE PAS réutiliser sans validation [HISTORIQUE]
- Juin 2026 : Découverte particuliers 280 € ; photos additionnelles 40–50 € / 350 / 525 / 700 € ; abonnements immobilier 650 €, cuisines 550 €, artisan 420 €, mode 850 € (« sous la Signature ») ; supplément studio 60 € seulement en Découverte.
- Sept. 2026 (Lumen) : Essentiel 550 € / 630 CHF, puis 8 oct. 290 / 490 / 790 / dès 1 190 € → retirés (prototype).
- Gammes archivées (`CATS_ARCHIVE_SUSPENDED`) : Immobilier prestige 390 / 790 / 1 190 / 1 890 € ; Architecture & design 490 / 990 / 1 590 / 2 390 € ; Artisanat d'art 290 / 690 / 1 090 / 1 690 €. Réactivables en décommentant, **sur décision d'Aya**.
- Catalogue PDF de juin 2026 (4 niches, tarifs « marché français ») : non présent dans les archives exportées [NON RÉCUPÉRABLE].

## Mentions commerciales
- Raison : entrepreneur individuel Aya Nascimento, franchise en base de TVA ; SIRET et adresse légale gérés hors dépôt (secret du Worker).
- RC Pro : aucune déclarée en sept. 2026 [À VÉRIFIER — risque].
