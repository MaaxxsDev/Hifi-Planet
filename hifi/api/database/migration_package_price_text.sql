-- Optionaler Freitext, der auf der Paket-Kachel den Preis ersetzt (z. B. "Coming soon").
-- Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS price_text VARCHAR(100) NULL;
