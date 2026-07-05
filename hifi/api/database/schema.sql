CREATE DATABASE IF NOT EXISTS hifi_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hifi_shop;

CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_super_admin TINYINT(1) NOT NULL DEFAULT 0,
  two_factor_secret VARCHAR(64) NULL,
  two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
  two_factor_recovery_codes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE app_settings (
  id INT PRIMARY KEY DEFAULT 1,
  maintenance_global TINYINT(1) NOT NULL DEFAULT 0,
  maintenance_global_message VARCHAR(500) NULL,
  maintenance_services TINYINT(1) NOT NULL DEFAULT 0,
  maintenance_services_message VARCHAR(500) NULL,
  maintenance_vehicles TINYINT(1) NOT NULL DEFAULT 0,
  maintenance_vehicles_message VARCHAR(500) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE services (
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

CREATE TABLE permission_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permission_group_permissions (
  permission_group_id INT NOT NULL,
  permission VARCHAR(64) NOT NULL,
  PRIMARY KEY (permission_group_id, permission),
  CONSTRAINT fk_pgp_group FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE admin_user_permissions (
  admin_user_id INT NOT NULL,
  permission VARCHAR(64) NOT NULL,
  PRIMARY KEY (admin_user_id, permission),
  CONSTRAINT fk_aup_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE admin_user_groups (
  admin_user_id INT NOT NULL,
  permission_group_id INT NOT NULL,
  PRIMARY KEY (admin_user_id, permission_group_id),
  CONSTRAINT fk_aug_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aug_group FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE car_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_brand_slug (brand_id, slug),
  CONSTRAINT fk_car_models_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  car_model_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(170) NOT NULL,
  description TEXT NULL,
  markup_type ENUM('none','fixed','percent') NOT NULL DEFAULT 'none',
  markup_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_model_slug (car_model_id, slug),
  CONSTRAINT fk_packages_model FOREIGN KEY (car_model_id) REFERENCES car_models(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE package_upgrades (
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

CREATE TABLE package_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  package_id INT NOT NULL,
  source_url VARCHAR(500) NOT NULL,
  name_override VARCHAR(255) NULL,
  scraped_name VARCHAR(255) NULL,
  scraped_price DECIMAL(10,2) NULL,
  scraped_currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
  scraped_image_url VARCHAR(500) NULL,
  price_updated_at DATETIME NULL,
  scrape_status ENUM('pending','ok','error') NOT NULL DEFAULT 'pending',
  scrape_error VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE contact_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NULL,
  message TEXT NULL,
  brand_name VARCHAR(100) NULL,
  model_name VARCHAR(100) NULL,
  package_name VARCHAR(150) NULL,
  product_name VARCHAR(255) NULL,
  package_id INT NULL,
  package_product_id INT NULL,
  selected_upgrades TEXT NULL,
  status ENUM('new','in_progress','done') NOT NULL DEFAULT 'new',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_contact_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL,
  CONSTRAINT fk_contact_product FOREIGN KEY (package_product_id) REFERENCES package_products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO app_settings (id) VALUES (1);
