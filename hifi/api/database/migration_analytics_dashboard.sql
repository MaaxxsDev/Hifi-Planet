-- GA4-Property-ID admin-konfigurierbar machen, fuer die Dashboard-Kennzahlen-Anbindung
-- ueber die Google Analytics Data API. Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS ga_property_id VARCHAR(30) NULL;
