-- Auswaehlbares Layout fuer die Paket-Kacheln (responsives Raster / horizontales
-- Scroll-Band aus schmalen Kacheln). Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS package_card_layout VARCHAR(20) NOT NULL DEFAULT 'strip';
