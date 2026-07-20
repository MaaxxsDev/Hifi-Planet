-- Auswaehlbares Farbschema fuer die Paket-Kacheln (Graphite Green / Deep Blue / Warm
-- Bronze). Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS package_card_theme VARCHAR(30) NOT NULL DEFAULT 'graphite';
