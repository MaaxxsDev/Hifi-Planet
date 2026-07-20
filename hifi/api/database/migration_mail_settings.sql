-- SMTP-Einstellungen und E-Mail-Vorlagen (Kundenbestaetigung + Shop-Benachrichtigung)
-- admin-konfigurierbar machen. Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS mail_host VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS mail_port INT NULL,
  ADD COLUMN IF NOT EXISTS mail_username VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS mail_password VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS mail_encryption VARCHAR(10) NOT NULL DEFAULT 'tls',
  ADD COLUMN IF NOT EXISTS mail_from_email VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS mail_from_name VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS mail_notify_email VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS mail_customer_subject VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS mail_customer_body TEXT NULL,
  ADD COLUMN IF NOT EXISTS mail_owner_subject VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS mail_owner_body TEXT NULL;
