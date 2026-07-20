USE hifi_shop;

CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  maintenance_global TINYINT(1) NOT NULL DEFAULT 0,
  maintenance_global_message VARCHAR(500) NULL,
  maintenance_services TINYINT(1) NOT NULL DEFAULT 0,
  maintenance_services_message VARCHAR(500) NULL,
  maintenance_vehicles TINYINT(1) NOT NULL DEFAULT 0,
  maintenance_vehicles_message VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT IGNORE INTO app_settings (id) VALUES (1);
