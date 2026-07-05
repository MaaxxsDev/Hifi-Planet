USE hifi_shop;

CREATE TABLE IF NOT EXISTS services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  icon_name VARCHAR(100) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  image_path VARCHAR(255) NULL,
  cta_label VARCHAR(100) NULL,
  cta_url VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- icon_name nutzt lucide-react's kebab-case Namenskonvention (z.B. "shield-alert"),
-- damit sich die Icons per lucide-react/dynamic einzeln nachladen lassen statt die
-- komplette ~2000-Icon-Bibliothek in den Public-Bundle zu ziehen.
INSERT INTO services (icon_name, title, description, image_path, cta_label, cta_url, sort_order) VALUES
('car', 'Car-Hifi', 'Individuelle Sound-Umbauten vom dezenten Upgrade bis zum kompromisslosen High-End-System – konfigurierbar direkt auf unserer Seite.', '/hifi/api/uploads/seed-leistung-car-hifi.jpg', 'Fahrzeug konfigurieren', '/fahrzeuge', 0),
('caravan', 'Wohnmobil & Caravan', 'Sound- und Elektronik-Lösungen speziell für Reisemobile und Caravans – reversibel oder fest verbaut.', '/hifi/api/uploads/seed-leistung-wohnmobil.jpg', NULL, NULL, 1),
('car-front', 'Oldtimer', 'Zeitgemäßer Klang für Klassiker – wir modernisieren die Anlage, ohne den Charakter deines Oldtimers zu verlieren.', '/hifi/api/uploads/seed-leistung-oldtimer.jpg', NULL, NULL, 2),
('cog', 'CNC Zerspanen', 'Fräsen, Bohren, Schneiden und Schleifen auf einer Fläche von 1500 × 3000 mm – für Prototypen, Kleinserien und Großauflagen. Massivholz, Verbundwerkstoffe, Plattenmaterial und mehr.', '/hifi/api/uploads/seed-leistung-cnc-zerspanen.jpg', NULL, NULL, 3),
('zap', 'CNC Lasertechnik', 'Präzises Laserschneiden und -gravieren für Leder, Glas, Acryl, Holz, Karton und mehr – für Einzelstücke ebenso wie Serienfertigung.', '/hifi/api/uploads/seed-leistung-cnc-laser.jpg', NULL, NULL, 4),
('boxes', '3D-Druck', 'Über 20 Drucker (FDM & SLA) für individuelle Halterungen, Blenden und Kleinserien – Fertigung meist in 1–3 Tagen, auf Wunsch auch farbig.', '/hifi/api/uploads/seed-leistung-3d-druck.jpg', NULL, NULL, 5),
('shield-alert', 'Alarmanlagen', 'Zuverlässiger Diebstahlschutz für dein Fahrzeug, abgestimmt auf deine Ansprüche und dein Budget.', '/hifi/api/uploads/seed-leistung-alarmanlagen.jpg', NULL, NULL, 6),
('video', 'Dash Cams', 'Beweissichere Aufzeichnung fürs Auto – wir beraten dich zur passenden Kamera und übernehmen den unauffälligen Einbau.', '/hifi/api/uploads/seed-leistung-dashcam.jpg', NULL, NULL, 7);
