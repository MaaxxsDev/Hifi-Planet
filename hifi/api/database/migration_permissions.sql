USE hifi_shop;

ALTER TABLE admin_users
  ADD COLUMN is_super_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash;

-- Bestehende Admin-Konten bleiben uneingeschränkt (Super-Admin), damit niemand ausgesperrt wird.
UPDATE admin_users SET is_super_admin = 1;

CREATE TABLE IF NOT EXISTS permission_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permission_group_permissions (
  permission_group_id INT NOT NULL,
  permission VARCHAR(64) NOT NULL,
  PRIMARY KEY (permission_group_id, permission),
  CONSTRAINT fk_pgp_group FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_user_permissions (
  admin_user_id INT NOT NULL,
  permission VARCHAR(64) NOT NULL,
  PRIMARY KEY (admin_user_id, permission),
  CONSTRAINT fk_aup_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admin_user_groups (
  admin_user_id INT NOT NULL,
  permission_group_id INT NOT NULL,
  PRIMARY KEY (admin_user_id, permission_group_id),
  CONSTRAINT fk_aug_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_aug_group FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE
) ENGINE=InnoDB;
