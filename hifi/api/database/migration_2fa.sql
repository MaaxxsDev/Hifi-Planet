USE hifi_shop;

ALTER TABLE admin_users
  ADD COLUMN two_factor_secret VARCHAR(64) NULL AFTER is_super_admin,
  ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER two_factor_secret,
  ADD COLUMN two_factor_recovery_codes TEXT NULL AFTER two_factor_enabled;
