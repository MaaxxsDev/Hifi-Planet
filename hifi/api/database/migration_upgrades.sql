USE hifi_shop;

ALTER TABLE packages
  ADD COLUMN markup_type ENUM('none','fixed','percent') NOT NULL DEFAULT 'none' AFTER description,
  ADD COLUMN markup_value DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER markup_type;

CREATE TABLE IF NOT EXISTS package_upgrades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  package_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255) NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_upgrades_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE contact_requests
  ADD COLUMN selected_upgrades TEXT NULL AFTER package_product_id;
