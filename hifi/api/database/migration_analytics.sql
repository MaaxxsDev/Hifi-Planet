-- Google Analytics Measurement ID admin-konfigurierbar machen. Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS ga_measurement_id VARCHAR(20) NULL;
