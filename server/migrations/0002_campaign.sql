-- Suivi des campagnes : paramètres UTM du lien d'arrivée (source/support/campagne/contenu), joints aux événements
-- de la même visite. Anonyme : aucune donnée personnelle, aucun cookie. À appliquer une fois :
--   cd server && npx wrangler d1 execute bunkaio-analytics --remote --file=migrations/0002_campaign.sql
ALTER TABLE events ADD COLUMN utm TEXT;
CREATE INDEX IF NOT EXISTS idx_events_utm ON events (utm);
