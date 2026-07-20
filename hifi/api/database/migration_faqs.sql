-- FAQ-Verwaltung ins Admin-Panel verschieben (zweisprachig DE/EN). Additiv, nichts wird geloescht.
-- Hinweis: Auf der Live-Seite reicht stattdessen ein Klick auf "Datenbankstruktur aktualisieren"
-- unter Admin-Panel -> Einstellungen -> Datenbank.

CREATE TABLE IF NOT EXISTS faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_de TEXT NOT NULL,
  answer_de TEXT NOT NULL,
  question_en TEXT NOT NULL,
  answer_en TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;
