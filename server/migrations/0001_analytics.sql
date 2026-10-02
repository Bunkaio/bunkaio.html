-- Mesure d'audience BUNKAIO — anonyme, sans cookie, sans adresse IP stockée.
-- `vid` = empreinte (HMAC) qui change chaque jour : elle permet de compter les
-- visiteurs du jour sans pouvoir les suivre d'un jour à l'autre.
CREATE TABLE IF NOT EXISTS events (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  ts     INTEGER NOT NULL,
  day    TEXT    NOT NULL,
  name   TEXT    NOT NULL,
  path   TEXT    NOT NULL,
  prop   TEXT,
  ref    TEXT,
  device TEXT,
  lang   TEXT,
  vid    TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_day_name ON events (day, name);
