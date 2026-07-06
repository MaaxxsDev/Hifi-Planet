-- Kontaktdaten (Telefon/WhatsApp/E-Mail) und Startseiten-Hero-Bild admin-konfigurierbar machen,
-- sowie ein Fahrgestellnummer/FIN-Feld fuer Kontaktanfragen. Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS hero_image_path VARCHAR(255) NULL;

ALTER TABLE contact_requests
  ADD COLUMN IF NOT EXISTS vin VARCHAR(50) NULL AFTER phone;
