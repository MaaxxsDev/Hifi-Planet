-- Design-Felder pro Paket (Icon, Slogan, "Empfohlen"-Hervorhebung) fuer die
-- Pakete-Karten auf der Modell-Seite. Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS icon_name VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS tagline VARCHAR(150) NULL,
  ADD COLUMN IF NOT EXISTS is_featured TINYINT(1) NOT NULL DEFAULT 0;
