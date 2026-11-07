# Décisions validées (chronologie)

Seules les décisions **actées par Aya** ou visibles dans le code de `main` figurent ici. Les propositions jamais adoptées sont listées à la fin. Les décisions fines (UI, libellés) sont dans `CLAUDE.md`.

## Juin 2026 — création
- 10 juin : domaine bunkaio.com expiré récupéré en le **renouvelant chez Hostinger** (un domaine expiré ne se transfère pas) ; Zoho Mail Lite pour contact@bunkaio.com ; hébergement GitHub Pages ; site = vitrine + **questionnaire de devis interactif** qui mène au portfolio de la catégorie.
- 10–16 juin : 3 puis 4 niveaux de formule (Découverte ajoutée), abonnements mensuels moins chers que la Signature, profils de client avec silhouettes, Formspree (« DEMANDE DE DEVIS CLIENT »), réponse sous 48 h + filtre ligne éditoriale, logo B ⊹ + « studio », FR/EN, rubriques Services, Contact, Partenaires, Connexion ; particuliers : Seul/Couple/Groupe, studio +60 €, Découverte 280 €, mise en beauté réservée à l'Éditorial ; calculateur « ESTIMATION DE VOTRE DEVIS » ; question « communication » renvoyant vers Agency Nascimento (marques, habitat/immobilier).
- 17 juin : capture des leads du devis dans **Stripe via un Worker Cloudflare** ; 18 juin : emails via **Resend**.

## Juil.–sept. 2026
- 20 juil. : médias dans **R2** + `admin/media.html`.
- 3 sept. : univers **Lumen by Bunkaio** (photobooth IA mariages) ajouté.
- 25 sept. : DA éditoriale ; **suppression cuisine/piscine**, recentrage portrait ; **suspension drone et catalogue immobilier/archi/artisan** (archivés, réactivables).

## Octobre 2026
- 1er oct. : `comptes.json` abandonné → comptes sécurisés dans KV ; espaces client/partenaire réels ; candidature partenaire ; Collaboration.
- 2 oct. : tableau de bord admin unifié (CRM, factures, séances, mailing) ; projet Claude migré vers Claude Code (canal « BUNKAIO »).
- **8 oct. : stratégie unique** — cibles entrepreneurs/indépendants (Lancement 320 €) + marques ; le reste reste en vente sans communication ; la stratégie ne modifie pas le catalogue. Architecture de marque « studio de photographie pour professionnels, entrepreneurs et mannequins ». Grille réalignée sur le marché local. Plan « Lancement BUNKAIO / Plan de lancement V5 », « Actions BUNKAIO », « Mes chiffres BUNKAIO » (artefacts). Routine « Veille BUNKAIO » créée (puis désactivée le jour même).
- 12 oct. : **ne jamais écrire Béziers** ; Toulouse sans forfait ; studio jamais inclus (+60 €). Demande « À propos mis en valeur » → PR #1 (non fusionnée).
- 13 oct. : Cloudflare Workers Paid ; Scalapay ajouté ; « Basé en Occitanie ».
- 14 oct. : plus aucune promotion ciblée ; places partenaires 5 par univers (25) ; ton « je » / impersonnel (Aya travaille seule).

## Novembre 2026
- **2 nov. : exception validée à « pas de redesign »** — DA « grille » (Grids d'Obys), Portfolio d'abord puis page par page ; on garde la constellation ⊹ et le violet. Slogan raccourci. Hot Dog Street et Restaurant Trophies retirés du défilé ; 8 témoignages d'exemple remis à la demande d'Aya (elle les remplacera).
- 4–6 nov. : DA étendue à tout le site (Inter Tight, Lookbook, photos plein écran) ; accueil réordonné ; agenda des disponibilités 2026–2027 (sans Google/iCloud) ; Corporate Découverte = 6 photos ; Polas 90 € et carte en une fois ; second Instagram @studiobunkaio ; médias sans limite + compression auto (remplace la règle « ne pas toucher IMAGE_SPECS/toWebP », `maxSide` inchangé) ; accordéons repliés par défaut ; plus de flèches dans les CTA ; anti-robot + CSP ; audit pré-lancement fusionné dans `main` ; slogan « Des photos d'exception pour des ambitions singulières. »

## Propositions NON adoptées / abandonnées [HISTORIQUE]
- Transfert du domaine vers OVH ; offre email Hostinger.
- Offre « 5 photos retouchées offertes » et « offre fondatrice » avec bonus → remplacées par « aucune remise, valeur perçue seulement ».
- Abonnements immobilier / cuisines / artisan ; catégories cuisine & piscine.
- Portraits corporate en entreprise comme axe principal (refusé par Aya le 20 sept., puis la stratégie du 8 oct. a retenu les entrepreneurs) ; séries « IA assumée ».
- Prix Lumen publiés ; page de formules Lumen ; article « photobooth de mariage » (masqué).
- Synchronisation Google/iCloud de l'agenda (abandonnée le 5 nov.).
- Lancement ciblant particuliers + Book grossesse + Lumen (plan V3) → remplacé par la stratégie du 8 oct.
- Logo SVG animé (juin) → image du logo.
