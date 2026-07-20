<?php

namespace App\Support;

/**
 * Soll-Zustand der Datenbankstruktur für den aktuellen Code-Stand. Wird genutzt,
 * um zu prüfen, ob eine (z. B. ältere) Live-Datenbank noch Tabellen oder Spalten
 * vermissen lässt, und um diese bei Bedarf additiv nachzurüsten (nichts wird
 * gelöscht oder verändert, was schon da ist).
 */
class Schema
{
    // Reihenfolge ist wichtig wegen Foreign-Key-Abhängigkeiten (erst referenzierte Tabellen).
    public const CREATE_STATEMENTS = [
        'admin_users' => "CREATE TABLE admin_users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(64) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_super_admin TINYINT(1) NOT NULL DEFAULT 0,
            two_factor_secret VARCHAR(64) NULL,
            two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
            two_factor_recovery_codes TEXT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB",

        'app_settings' => "CREATE TABLE app_settings (
            id INT PRIMARY KEY DEFAULT 1,
            maintenance_global TINYINT(1) NOT NULL DEFAULT 0,
            maintenance_global_message VARCHAR(500) NULL,
            maintenance_services TINYINT(1) NOT NULL DEFAULT 0,
            maintenance_services_message VARCHAR(500) NULL,
            maintenance_vehicles TINYINT(1) NOT NULL DEFAULT 0,
            maintenance_vehicles_message VARCHAR(500) NULL,
            phone VARCHAR(50) NULL,
            whatsapp VARCHAR(50) NULL,
            contact_email VARCHAR(150) NULL,
            hero_image_path VARCHAR(255) NULL,
            ga_measurement_id VARCHAR(20) NULL,
            ga_property_id VARCHAR(30) NULL,
            google_place_id VARCHAR(255) NULL,
            google_places_api_key VARCHAR(255) NULL,
            google_rating DECIMAL(2,1) NULL,
            google_rating_count INT NULL,
            google_reviews_updated_at DATETIME NULL,
            google_reviews_error VARCHAR(500) NULL,
            package_card_theme VARCHAR(30) NOT NULL DEFAULT 'graphite',
            package_card_layout VARCHAR(20) NOT NULL DEFAULT 'strip',
            mail_host VARCHAR(255) NULL,
            mail_port INT NULL,
            mail_username VARCHAR(255) NULL,
            mail_password VARCHAR(255) NULL,
            mail_encryption VARCHAR(10) NOT NULL DEFAULT 'tls',
            mail_from_email VARCHAR(150) NULL,
            mail_from_name VARCHAR(150) NULL,
            mail_notify_email VARCHAR(150) NULL,
            mail_customer_subject VARCHAR(255) NULL,
            mail_customer_body TEXT NULL,
            mail_owner_subject VARCHAR(255) NULL,
            mail_owner_body TEXT NULL,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB",

        'services' => "CREATE TABLE services (
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
        ) ENGINE=InnoDB",

        'permission_groups' => "CREATE TABLE permission_groups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description VARCHAR(255) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB",

        'permission_group_permissions' => "CREATE TABLE permission_group_permissions (
            permission_group_id INT NOT NULL,
            permission VARCHAR(64) NOT NULL,
            PRIMARY KEY (permission_group_id, permission),
            CONSTRAINT fk_pgp_group FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'admin_user_permissions' => "CREATE TABLE admin_user_permissions (
            admin_user_id INT NOT NULL,
            permission VARCHAR(64) NOT NULL,
            PRIMARY KEY (admin_user_id, permission),
            CONSTRAINT fk_aup_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'admin_user_groups' => "CREATE TABLE admin_user_groups (
            admin_user_id INT NOT NULL,
            permission_group_id INT NOT NULL,
            PRIMARY KEY (admin_user_id, permission_group_id),
            CONSTRAINT fk_aug_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
            CONSTRAINT fk_aug_group FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'brands' => "CREATE TABLE brands (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(120) NOT NULL UNIQUE,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB",

        'car_models' => "CREATE TABLE car_models (
            id INT AUTO_INCREMENT PRIMARY KEY,
            brand_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(150) NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_brand_slug (brand_id, slug),
            CONSTRAINT fk_car_models_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'gallery_brands' => "CREATE TABLE gallery_brands (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(120) NOT NULL UNIQUE,
            cover_image_path VARCHAR(255) NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB",

        'gallery_projects' => "CREATE TABLE gallery_projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            gallery_brand_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(150) NOT NULL,
            cover_image_path VARCHAR(255) NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_gallery_brand_slug (gallery_brand_id, slug),
            CONSTRAINT fk_gallery_projects_brand FOREIGN KEY (gallery_brand_id) REFERENCES gallery_brands(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'gallery_photos' => "CREATE TABLE gallery_photos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            gallery_project_id INT NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            caption VARCHAR(255) NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_gallery_photos_project FOREIGN KEY (gallery_project_id) REFERENCES gallery_projects(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'packages' => "CREATE TABLE packages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            car_model_id INT NOT NULL,
            name VARCHAR(150) NOT NULL,
            slug VARCHAR(170) NOT NULL,
            description TEXT NULL,
            markup_type ENUM('none','fixed','percent') NOT NULL DEFAULT 'none',
            markup_value DECIMAL(10,2) NOT NULL DEFAULT 0,
            icon_name VARCHAR(100) NULL,
            tagline VARCHAR(150) NULL,
            price_text VARCHAR(100) NULL,
            is_featured TINYINT(1) NOT NULL DEFAULT 0,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_model_slug (car_model_id, slug),
            CONSTRAINT fk_packages_model FOREIGN KEY (car_model_id) REFERENCES car_models(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'package_upgrades' => "CREATE TABLE package_upgrades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            package_id INT NOT NULL,
            name VARCHAR(150) NOT NULL,
            description VARCHAR(255) NULL,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_upgrades_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        'package_products' => "CREATE TABLE package_products (
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
        ) ENGINE=InnoDB",

        'faqs' => "CREATE TABLE faqs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            question_de TEXT NOT NULL,
            answer_de TEXT NOT NULL,
            question_en TEXT NOT NULL,
            answer_en TEXT NOT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB",

        'contact_requests' => "CREATE TABLE contact_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            email VARCHAR(150) NOT NULL,
            phone VARCHAR(50) NULL,
            vin VARCHAR(50) NULL,
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
        ) ENGINE=InnoDB",

        // Reiner Cache der letzten Google-Places-Abfrage (siehe GooglePlacesReviewsFetcher) -
        // wird bei jedem erfolgreichen Refresh komplett neu befuellt (DELETE + INSERT),
        // keine eigenen Fremdschluessel-Bezuege von aussen.
        'google_reviews' => "CREATE TABLE google_reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            google_review_id VARCHAR(255) NULL,
            author_name VARCHAR(150) NOT NULL,
            profile_photo_url VARCHAR(500) NULL,
            rating TINYINT NOT NULL,
            review_text TEXT NULL,
            relative_time_description VARCHAR(100) NULL,
            review_time INT NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB",
    ];

    // Erwartete Spalten je Tabelle (ohne Primary Key / Unique / Foreign-Key-Klauseln –
    // die werden nur bei der Tabellen-Neuanlage berücksichtigt, nicht beim Nachrüsten
    // einzelner Spalten). Reihenfolge = Definitionsreihenfolge, "id" wird beim
    // Spalten-Nachrüsten übersprungen (Primary Key kann nicht nachträglich per
    // ADD COLUMN ergänzt werden, ist aber immer vorhanden, wenn die Tabelle existiert).
    public const COLUMNS = [
        'admin_users' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'username' => 'VARCHAR(64) NOT NULL',
            'password_hash' => 'VARCHAR(255) NOT NULL',
            'is_super_admin' => 'TINYINT(1) NOT NULL DEFAULT 0',
            'two_factor_secret' => 'VARCHAR(64) NULL',
            'two_factor_enabled' => 'TINYINT(1) NOT NULL DEFAULT 0',
            'two_factor_recovery_codes' => 'TEXT NULL',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
        ],
        'app_settings' => [
            'id' => 'INT PRIMARY KEY DEFAULT 1',
            'maintenance_global' => 'TINYINT(1) NOT NULL DEFAULT 0',
            'maintenance_global_message' => 'VARCHAR(500) NULL',
            'maintenance_services' => 'TINYINT(1) NOT NULL DEFAULT 0',
            'maintenance_services_message' => 'VARCHAR(500) NULL',
            'maintenance_vehicles' => 'TINYINT(1) NOT NULL DEFAULT 0',
            'maintenance_vehicles_message' => 'VARCHAR(500) NULL',
            'phone' => 'VARCHAR(50) NULL',
            'whatsapp' => 'VARCHAR(50) NULL',
            'contact_email' => 'VARCHAR(150) NULL',
            'hero_image_path' => 'VARCHAR(255) NULL',
            'ga_measurement_id' => 'VARCHAR(20) NULL',
            'ga_property_id' => 'VARCHAR(30) NULL',
            'google_place_id' => 'VARCHAR(255) NULL',
            'google_places_api_key' => 'VARCHAR(255) NULL',
            'google_rating' => 'DECIMAL(2,1) NULL',
            'google_rating_count' => 'INT NULL',
            'google_reviews_updated_at' => 'DATETIME NULL',
            'google_reviews_error' => 'VARCHAR(500) NULL',
            'package_card_theme' => "VARCHAR(30) NOT NULL DEFAULT 'graphite'",
            'package_card_layout' => "VARCHAR(20) NOT NULL DEFAULT 'strip'",
            'mail_host' => 'VARCHAR(255) NULL',
            'mail_port' => 'INT NULL',
            'mail_username' => 'VARCHAR(255) NULL',
            'mail_password' => 'VARCHAR(255) NULL',
            'mail_encryption' => "VARCHAR(10) NOT NULL DEFAULT 'tls'",
            'mail_from_email' => 'VARCHAR(150) NULL',
            'mail_from_name' => 'VARCHAR(150) NULL',
            'mail_notify_email' => 'VARCHAR(150) NULL',
            'mail_customer_subject' => 'VARCHAR(255) NULL',
            'mail_customer_body' => 'TEXT NULL',
            'mail_owner_subject' => 'VARCHAR(255) NULL',
            'mail_owner_body' => 'TEXT NULL',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'services' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'icon_name' => 'VARCHAR(100) NOT NULL',
            'title' => 'VARCHAR(150) NOT NULL',
            'description' => 'TEXT NOT NULL',
            'image_path' => 'VARCHAR(255) NULL',
            'cta_label' => 'VARCHAR(100) NULL',
            'cta_url' => 'VARCHAR(255) NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'permission_groups' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'name' => 'VARCHAR(100) NOT NULL',
            'description' => 'VARCHAR(255) NULL',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'permission_group_permissions' => [
            'permission_group_id' => 'INT NOT NULL',
            'permission' => 'VARCHAR(64) NOT NULL',
        ],
        'admin_user_permissions' => [
            'admin_user_id' => 'INT NOT NULL',
            'permission' => 'VARCHAR(64) NOT NULL',
        ],
        'admin_user_groups' => [
            'admin_user_id' => 'INT NOT NULL',
            'permission_group_id' => 'INT NOT NULL',
        ],
        'brands' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'name' => 'VARCHAR(100) NOT NULL',
            'slug' => 'VARCHAR(120) NOT NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'car_models' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'brand_id' => 'INT NOT NULL',
            'name' => 'VARCHAR(100) NOT NULL',
            'slug' => 'VARCHAR(150) NOT NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'gallery_brands' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'name' => 'VARCHAR(100) NOT NULL',
            'slug' => 'VARCHAR(120) NOT NULL',
            'cover_image_path' => 'VARCHAR(255) NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'gallery_projects' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'gallery_brand_id' => 'INT NOT NULL',
            'name' => 'VARCHAR(100) NOT NULL',
            'slug' => 'VARCHAR(150) NOT NULL',
            'cover_image_path' => 'VARCHAR(255) NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'gallery_photos' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'gallery_project_id' => 'INT NOT NULL',
            'image_path' => 'VARCHAR(255) NOT NULL',
            'caption' => 'VARCHAR(255) NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'packages' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'car_model_id' => 'INT NOT NULL',
            'name' => 'VARCHAR(150) NOT NULL',
            'slug' => 'VARCHAR(170) NOT NULL',
            'description' => 'TEXT NULL',
            'markup_type' => "ENUM('none','fixed','percent') NOT NULL DEFAULT 'none'",
            'markup_value' => 'DECIMAL(10,2) NOT NULL DEFAULT 0',
            'icon_name' => 'VARCHAR(100) NULL',
            'tagline' => 'VARCHAR(150) NULL',
            'price_text' => 'VARCHAR(100) NULL',
            'is_featured' => 'TINYINT(1) NOT NULL DEFAULT 0',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'package_upgrades' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'package_id' => 'INT NOT NULL',
            'name' => 'VARCHAR(150) NOT NULL',
            'description' => 'VARCHAR(255) NULL',
            'price' => 'DECIMAL(10,2) NOT NULL DEFAULT 0',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'package_products' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'package_id' => 'INT NOT NULL',
            'source_url' => 'VARCHAR(500) NOT NULL',
            'name_override' => 'VARCHAR(255) NULL',
            'scraped_name' => 'VARCHAR(255) NULL',
            'scraped_price' => 'DECIMAL(10,2) NULL',
            'scraped_currency' => "VARCHAR(8) NOT NULL DEFAULT 'EUR'",
            'scraped_image_url' => 'VARCHAR(500) NULL',
            'price_updated_at' => 'DATETIME NULL',
            'scrape_status' => "ENUM('pending','ok','error') NOT NULL DEFAULT 'pending'",
            'scrape_error' => 'VARCHAR(255) NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'faqs' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'question_de' => 'TEXT NOT NULL',
            'answer_de' => 'TEXT NOT NULL',
            'question_en' => 'TEXT NOT NULL',
            'answer_en' => 'TEXT NOT NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
            'updated_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'contact_requests' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'name' => 'VARCHAR(150) NOT NULL',
            'email' => 'VARCHAR(150) NOT NULL',
            'phone' => 'VARCHAR(50) NULL',
            'vin' => 'VARCHAR(50) NULL',
            'message' => 'TEXT NULL',
            'brand_name' => 'VARCHAR(100) NULL',
            'model_name' => 'VARCHAR(100) NULL',
            'package_name' => 'VARCHAR(150) NULL',
            'product_name' => 'VARCHAR(255) NULL',
            'package_id' => 'INT NULL',
            'package_product_id' => 'INT NULL',
            'selected_upgrades' => 'TEXT NULL',
            'status' => "ENUM('new','in_progress','done') NOT NULL DEFAULT 'new'",
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
        ],
        'google_reviews' => [
            'id' => 'INT AUTO_INCREMENT PRIMARY KEY',
            'google_review_id' => 'VARCHAR(255) NULL',
            'author_name' => 'VARCHAR(150) NOT NULL',
            'profile_photo_url' => 'VARCHAR(500) NULL',
            'rating' => 'TINYINT NOT NULL',
            'review_text' => 'TEXT NULL',
            'relative_time_description' => 'VARCHAR(100) NULL',
            'review_time' => 'INT NULL',
            'sort_order' => 'INT NOT NULL DEFAULT 0',
            'created_at' => 'DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
        ],
    ];
}
