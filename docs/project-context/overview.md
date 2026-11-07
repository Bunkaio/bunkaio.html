# BUNKAIO — présentation générale

> Dossier `docs/project-context/` créé le 7 nov. 2026 lors de la migration vers le nouveau compte Claude.
> Légende utilisée dans tous ces fichiers : **[CONFIRMÉ]** = vérifié dans le code de `main` ou décision écrite dans `CLAUDE.md` ;
> **[HISTORIQUE]** = vrai à une époque (archives), plus forcément aujourd'hui ; **[À VÉRIFIER]** = à confirmer avec Aya.
> Source de vérité technique : le code de `main`, puis `CLAUDE.md` (racine), puis ce dossier.

## L'entreprise
- BUNKAIO : studio de photographie (photo, vidéo, drone en attente) fondé par **Aya Nascimento**, photographe diplômée d'un BTS Photographie (ETPA, 2018). [CONFIRMÉ]
- Statut : auto-entrepreneur / entrepreneur individuel, APE 7420Z, franchise en base de TVA → **prix nets, sans TVA**. [CONFIRMÉ]
- Basé en Occitanie (pôles Montpellier, Toulouse, ouest de l'Hérault), mobile dans toute la France sur devis. [CONFIRMÉ]
- Certifications drone DGAC A1/A3 et A2 ; formation « survol zones » via CPF en cours (juin 2026). [HISTORIQUE — état actuel À VÉRIFIER]
- Équipement déclaré sur le site : Sony α7 III. [HISTORIQUE]
- Contacts publics : contact@bunkaio.com · Instagram @bunkaio (principal) et @studiobunkaio (compte studio, ajouté 6 nov. 2026) · bunkaio.com. [CONFIRMÉ]

## Positionnement
- Brief de reprise (nov. 2026) : studio premium, clientèle haut de gamme en France — immobilier de prestige, architecture & design d'intérieur, mode & lifestyle, commerce & entreprises, événementiel professionnel.
- **Ce que le site dit réellement aujourd'hui** [CONFIRMÉ] : « studio de photographie pour professionnels, entrepreneurs et mannequins » ; slogan « Des photos d'exception pour des ambitions singulières. » ; positionnement « premium accessible ».
- Stratégie décidée le 8 oct. 2026 [CONFIRMÉ] : cibles prioritaires = **entrepreneurs & indépendants** (porte d'entrée : formule Lancement 320 €) et **marques** (Mode, Commercial/produits). Particuliers, Book grossesse, événementiel, Lumen, Polas, Studio Continu restent en vente sans communication.
- Immobilier, architecture et artisanat d'art sont **archivés dans le code** (`CATS_ARCHIVE_SUSPENDED`, depuis le 25 sept. 2026) ; le drone est **« bientôt »** (`comingSoon`). ⚠️ Écart avec le brief de reprise → arbitrage nécessaire (voir `roadmap.md`).

## Agency Nascimento
- Structure partenaire (sœur d'Aya : data, web, SEO, SEA, Ads, réseaux), www.agencynascimento.com. Entités juridiques et facturation séparées. [CONFIRMÉ par le brief]
- Dans le site : Agency Nascimento est toujours citée et liée (8 occurrences dans `js/script.js`, 3 dans `index.html`), présentée comme partenaire de BUNKAIO pour la communication (origine : étape « communication » du devis, juin 2026). [CONFIRMÉ]

## Sous-marque Lumen
- « Lumen, by Bunkaio » : photobooth IA pour mariages haut de gamme (concept de sept. 2026, projet de déménagement à Mulhouse évoqué). Sur le site : **prototype**, aucun prix publié, liens vers `/contact/#lumen`. [CONFIRMÉ]

## Objectifs
1. Générer des demandes de devis et des réservations (priorité au chiffre d'affaires).
2. Garder un site premium, stable, bilingue, sans régression.
3. Lancement commercial : plan « Lancement BUNKAIO / Plan de lancement V5 » (artefact du 8 oct. 2026, lancement proposé au 22 oct. 2026). Avancement réel [À VÉRIFIER].

## Façon de travailler avec Aya
Associé technique plutôt qu'assistant : initiative, priorité au revenu, peu d'explications sur le secondaire, réponses en français, pas de refonte non demandée, tests systématiques. Voir `workflows.md`.
