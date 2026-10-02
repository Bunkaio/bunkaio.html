/* ═══════════════════════════════════════════════════════════
   MESURE D'AUDIENCE — config/analytics.js
   Anonyme, sans cookie, hébergée sur le Worker BUNKAIO (route /collect).
   - hosts : la mesure n'est active que sur ces domaines (pas en local).
   - matomoUrl / matomoSiteId : à renseigner SI vous ouvrez un jour une
     instance Matomo (ex. Matomo Cloud) ; les mêmes événements lui seront
     alors envoyés en plus (sans cookie).
   ═══════════════════════════════════════════════════════════ */
const ANALYTICS_CONFIG = {
  endpoint: 'https://bunkaio-quiz-stripe.bunkaio.workers.dev/collect',
  hosts: ['bunkaio.com', 'www.bunkaio.com'],
  matomoUrl: '',      // ex. 'https://bunkaio.matomo.cloud'
  matomoSiteId: '',   // ex. '1'
};
