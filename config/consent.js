/* ═══════════════════════════════════════════════════════════════════════
   CONSENTEMENT AUX COOKIES ET TRACEURS — config/consent.js
   Lu par js/consent.js. État actuel : AUCUN traceur soumis à consentement
   (la mesure d'audience maison est anonyme, sans cookie, voir
   config/analytics.js). Tant que ce fichier ne déclare aucun service, le
   bandeau ne s'affiche pas ; le lien « Gérer mes cookies » du pied de page
   ouvre le centre de préférences, et la politique des cookies reste exacte.

   POUR AJOUTER UN SERVICE (le bandeau apparaît alors automatiquement, et le
   service n'est chargé qu'APRÈS accord de sa catégorie) :
     - Google Analytics 4 : google.ga4  = 'G-XXXXXXXXXX'
     - Google Ads         : google.ads  = 'AW-XXXXXXXXX'
       (+ google.adsLabel = 'AbC-D_efG-h' pour l'événement de conversion)
     - Meta Pixel         : meta.pixel  = '123456789012345'
     - autre service      : une entrée dans `vendors` (voir exemple ci-dessous)
   Pensez ensuite à relancer :
     NODE_PATH=/opt/node22/lib/node_modules node tools/build-routes.cjs
   et à mettre à jour la politique de confidentialité (destinataires, transferts).
   Google Consent Mode v2 est géré automatiquement : valeurs « refusé » par
   défaut, puis mise à jour après le choix. Les scripts Google ne sont PAS
   chargés avant accord (mode « basique »).
   ═══════════════════════════════════════════════════════════════════════ */
const CONSENT_CONFIG = {
  version: 1,        // à incrémenter si la liste des services change : le choix est alors redemandé
  ttlDays: 180,      // durée de validité du choix (6 mois), puis le bandeau revient
  google: { ga4: '', ads: '', adsLabel: '' },
  meta: { pixel: '' },
  /* Exemple d'un service tiers :
     { id: 'exemple', category: 'external',            // 'analytics' | 'marketing' | 'external'
       name: 'Nom du service', provider: 'Société, pays', purpose: 'Finalité', duration: 'Durée des cookies',
       cookies: ['^_exemple'],                          // motifs de cookies à effacer au retrait du consentement
       src: 'https://…/script.js' }                     // chargé seulement après accord
  */
  vendors: [],
};
