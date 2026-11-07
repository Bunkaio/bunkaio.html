# Identité visuelle et règles graphiques

État au 6 nov. 2026. Détails et noms de classes : `CLAUDE.md` (blocs « DA globale », « Pages éditoriales GX / PX », « Lookbook × BUNKAIO »).

## Historique de la DA
1. **Juin 2026** : « style suisse », blanc ultra-contrasté, puis fond dégradé blanc → violet pastel, animations « luxe ». Police des titres reprise dans la navbar. [HISTORIQUE]
2. **25 sept. 2026** : « DA éditoriale », retour au violet. [HISTORIQUE]
3. **Oct. 2026** : la **constellation ⊹** devient la signature de BUNKAIO (décision d'Aya) ; fonds constellation animés. [CONFIRMÉ, toujours en place]
4. **2 nov. 2026** : seule exception validée à la règle « pas de redesign » → restructuration « grille » inspirée de *Grids* (Obys) + *Almira Kho* + *Lookbook* / *Almada*, page par page après validation. Étendue depuis à tout le site. [CONFIRMÉ]

## Règles actuelles [CONFIRMÉ]
- **Police** : Inter Tight (variable, hébergée dans `fonts/`, OFL) sur tout le site et l'admin. DM Sans reste dans les emails et PDF du Worker.
- **Couleurs principales** (fréquence dans `style.css`) :
  - encre `#0a0a0c` (`--black`), blanc `#ffffff`
  - violet de la charte `#6e5aa8` (prix), violet profond `#3f2f7a` / `#4b3d7a`, violet pâle `#d6c9f7`, lavande `#f1ecfa` (`--violet`), `#e6def5` (`--violet-deep`)
  - rose poudré `#e8c6c4` (accents, CTA « Construire mon projet » en verre rose)
  - papier `#ecebe8` (vues éditoriales), `#f4f3f1` (Lookbook)
  - champagne `#dfcfa6` / ivoire `#f3eee2` (espace partenaire sombre)
- **Signature** : constellation ⊹ (accueil : croix des 5 publics, « L'exigence BUNKAIO » ; glyphe animé après les titres ; fonds `CstField`). À conserver partout.
- **Mise en page** : grille 12 colonnes (4 sur mobile), filets noirs, barres de 10 px, titres en capitales serrées précédés de « Chapitre 0x, », photos plein écran à petit texte, photos noir et blanc → couleur au survol.
- **Boutons** : CTA « Construire mon projet » = pilule rose dépolie, texte noir, **sans flèche** ; autres boutons carrés noir/rose ; texte centré. Plus aucune flèche « → » dans les libellés.
- **Cartes** : encadrement fin (encre 14–18 %), pas de bordure noire.
- **Texte** : justifié dans `main` (sauf listes, petits textes, CTA) ; mots-clés surlignés au marqueur rose (`BK_KEYS`) seulement dans les textes éditoriaux.
- **Accordéons** : repliés par défaut partout (sauf ancre / redirection ciblée et articles sur ordinateur).
- **Animations** : apparitions au défilement avec filet de sécurité 1,2 s ; rien d'invisible par défaut ; tout est neutralisé si `prefers-reduced-motion` ; animations décoratives allégées sur écrans tactiles.
- **Ton rédactionnel** : Aya travaille seule → éviter « nous/notre » ; forme impersonnelle, « BUNKAIO », « Aya » ou « je ».

## Interdits [CONFIRMÉ]
- Pas de redesign non demandé ; pas de promotion de lancement, pas de prix barré, pas de remise, pas de « low-cost ».
- Pas de fausse preuve sociale, pas de service inventé, pas de série ni client inventé dans le Portfolio.
- Ne jamais écrire « Béziers » sur le site (sauf la ligne déplacement autorisée, cf. `business-rules.md`).
- Pas de `clip-path` sur un élément observé par IntersectionObserver ; pas d'état initial invisible dépendant d'une animation (bug Safari).
- Ne pas réutiliser le préfixe CSS `bkc-` (agenda/consentement) ; vérifier les collisions de classes.
- Ne pas modifier les dimensions maximales par emplacement (`maxSide` d'`IMAGE_SPECS`) ni les images de partage 1200×630.
