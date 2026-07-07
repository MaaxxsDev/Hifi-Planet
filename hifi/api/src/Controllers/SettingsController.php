<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use PDO;

class SettingsController
{
    // Nur diese Spalten pro Tabelle werden exportiert/importiert – schützt vor
    // manipulierten Spaltennamen in Import-Dateien und erlaubt trotzdem, dass
    // Exporte aus älteren/neueren Versionen (mit weniger/mehr Spalten) importiert
    // werden können (fehlende Spalten bekommen einfach ihren DB-Standardwert).
    private const TABLE_COLUMNS = [
        'brands' => ['id', 'name', 'slug', 'sort_order', 'created_at', 'updated_at'],
        'car_models' => ['id', 'brand_id', 'name', 'slug', 'sort_order', 'created_at', 'updated_at'],
        'packages' => ['id', 'car_model_id', 'name', 'slug', 'description', 'markup_type', 'markup_value', 'sort_order', 'created_at', 'updated_at'],
        'package_products' => ['id', 'package_id', 'source_url', 'name_override', 'scraped_name', 'scraped_price', 'scraped_currency', 'scraped_image_url', 'price_updated_at', 'scrape_status', 'scrape_error', 'sort_order', 'created_at', 'updated_at'],
        'package_upgrades' => ['id', 'package_id', 'name', 'description', 'price', 'sort_order', 'created_at', 'updated_at'],
        'services' => ['id', 'icon_name', 'title', 'description', 'image_path', 'cta_label', 'cta_url', 'sort_order', 'created_at', 'updated_at'],
        'faqs' => ['id', 'question_de', 'answer_de', 'question_en', 'answer_en', 'sort_order', 'created_at', 'updated_at'],
        'gallery_brands' => ['id', 'name', 'slug', 'cover_image_path', 'sort_order', 'created_at', 'updated_at'],
        'gallery_projects' => ['id', 'gallery_brand_id', 'name', 'slug', 'cover_image_path', 'sort_order', 'created_at', 'updated_at'],
        'gallery_photos' => ['id', 'gallery_project_id', 'image_path', 'caption', 'sort_order', 'created_at', 'updated_at'],
    ];

    // Kein const, da abhängig von der Umgebung (base_path unterscheidet sich
    // zwischen lokalem /hifi und der Root-Domain auf IONOS).
    private static function uploadsUrlPrefix(): string
    {
        $config = require __DIR__ . '/../../config/config.php';
        return rtrim($config['app']['base_path'], '/') . '/api/uploads/';
    }

    public static function exportData(): void
    {
        $db = Database::connection();
        $data = [];
        foreach (array_keys(self::TABLE_COLUMNS) as $table) {
            $data[$table] = $db->query("SELECT * FROM `$table`")->fetchAll();
        }

        $images = [];
        $imageColumns = [
            'services' => 'image_path',
            'gallery_brands' => 'cover_image_path',
            'gallery_projects' => 'cover_image_path',
            'gallery_photos' => 'image_path',
        ];
        foreach ($imageColumns as $table => $column) {
            foreach ($data[$table] as $row) {
                self::collectImage($row[$column] ?? null, $images);
            }
        }

        $payload = [
            'app' => 'hifiplanet',
            'export_version' => 1,
            'exported_at' => date('c'),
            'data' => $data,
            'images' => $images,
        ];

        $filename = 'hifiplanet-export-' . date('Y-m-d_His') . '.json';
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function importData(): void
    {
        if (!empty($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $raw = file_get_contents($_FILES['file']['tmp_name']);
        } else {
            $raw = file_get_contents('php://input');
        }

        $payload = json_decode((string) $raw, true);
        if (!is_array($payload) || !isset($payload['data']) || !is_array($payload['data'])) {
            Http::error('Ungültige oder beschädigte Import-Datei', 422);
        }

        $data = $payload['data'];
        $images = is_array($payload['images'] ?? null) ? $payload['images'] : [];

        $db = Database::connection();
        $counts = [];

        try {
            $db->beginTransaction();
            $db->exec('SET FOREIGN_KEY_CHECKS=0');

            foreach (self::TABLE_COLUMNS as $table => $allowedColumns) {
                $rows = is_array($data[$table] ?? null) ? $data[$table] : [];
                $db->exec("DELETE FROM `$table`");
                $counts[$table] = self::insertRows($db, $table, $allowedColumns, $rows);
            }

            self::restoreImages($images);

            $db->exec('SET FOREIGN_KEY_CHECKS=1');
            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            $db->exec('SET FOREIGN_KEY_CHECKS=1');
            Http::error('Import fehlgeschlagen, es wurde nichts verändert: ' . $e->getMessage(), 500);
        }

        Http::send(['ok' => true, 'counts' => $counts, 'images_restored' => count($images)]);
    }

    public static function resetServicesToDefaults(): void
    {
        $db = Database::connection();
        $defaults = self::defaultServices();

        $db->exec('DELETE FROM services');
        $stmt = $db->prepare(
            'INSERT INTO services (icon_name, title, description, image_path, cta_label, cta_url, sort_order) VALUES (?,?,?,?,?,?,?)'
        );
        foreach ($defaults as $row) {
            $stmt->execute($row);
        }

        Http::send(['ok' => true, 'count' => count($defaults)]);
    }

    public static function resetFaqsToDefaults(): void
    {
        $db = Database::connection();
        $defaults = self::defaultFaqs();

        $db->exec('DELETE FROM faqs');
        $stmt = $db->prepare(
            'INSERT INTO faqs (question_de, answer_de, question_en, answer_en, sort_order) VALUES (?,?,?,?,?)'
        );
        foreach ($defaults as $row) {
            $stmt->execute($row);
        }

        Http::send(['ok' => true, 'count' => count($defaults)]);
    }

    /** Löscht Marken (Foreign-Key-Kaskade räumt Modelle, Pakete, Produkte & Upgrades automatisch mit auf). */
    public static function resetCatalog(): void
    {
        $db = Database::connection();
        $brandCount = (int) $db->query('SELECT COUNT(*) FROM brands')->fetchColumn();
        $db->exec('DELETE FROM brands');
        Http::send(['ok' => true, 'brands_removed' => $brandCount]);
    }

    public static function resetAll(): void
    {
        $db = Database::connection();
        $brandCount = (int) $db->query('SELECT COUNT(*) FROM brands')->fetchColumn();
        $db->exec('DELETE FROM brands');

        $defaults = self::defaultServices();
        $db->exec('DELETE FROM services');
        $stmt = $db->prepare(
            'INSERT INTO services (icon_name, title, description, image_path, cta_label, cta_url, sort_order) VALUES (?,?,?,?,?,?,?)'
        );
        foreach ($defaults as $row) {
            $stmt->execute($row);
        }

        $faqDefaults = self::defaultFaqs();
        $db->exec('DELETE FROM faqs');
        $faqStmt = $db->prepare(
            'INSERT INTO faqs (question_de, answer_de, question_en, answer_en, sort_order) VALUES (?,?,?,?,?)'
        );
        foreach ($faqDefaults as $row) {
            $faqStmt->execute($row);
        }

        Http::send(['ok' => true, 'brands_removed' => $brandCount, 'services_reset' => count($defaults), 'faqs_reset' => count($faqDefaults)]);
    }

    /** @param string[] $allowedColumns @param array<int,array<string,mixed>> $rows */
    private static function insertRows(PDO $db, string $table, array $allowedColumns, array $rows): int
    {
        if (!$rows) {
            return 0;
        }

        $columns = array_values(array_intersect(array_keys($rows[0]), $allowedColumns));
        if (!$columns) {
            return 0;
        }

        $columnList = '`' . implode('`,`', $columns) . '`';
        $placeholders = '(' . implode(',', array_fill(0, count($columns), '?')) . ')';
        $stmt = $db->prepare("INSERT INTO `$table` ($columnList) VALUES $placeholders");

        foreach ($rows as $row) {
            $values = array_map(fn($col) => $row[$col] ?? null, $columns);
            $stmt->execute($values);
        }

        return count($rows);
    }

    private static function collectImage(?string $path, array &$images): void
    {
        if (!$path || isset($images[$path]) || !str_starts_with($path, self::uploadsUrlPrefix())) {
            return;
        }
        $filename = basename($path);
        $fullPath = __DIR__ . '/../../uploads/' . $filename;
        if (is_file($fullPath)) {
            $images[$path] = base64_encode((string) file_get_contents($fullPath));
        }
    }

    /** @param array<string,string> $images */
    private static function restoreImages(array $images): void
    {
        $uploadsDir = __DIR__ . '/../../uploads';
        foreach ($images as $path => $base64) {
            $filename = basename((string) $path);
            if ($filename === '' || str_contains($filename, '..')) {
                continue;
            }
            file_put_contents($uploadsDir . '/' . $filename, base64_decode((string) $base64));
        }
    }

    private static function defaultServices(): array
    {
        return [
            ['car', 'Car-Hifi', 'Individuelle Sound-Umbauten vom dezenten Upgrade bis zum kompromisslosen High-End-System – konfigurierbar direkt auf unserer Seite.', self::uploadsUrlPrefix() . 'seed-leistung-car-hifi.jpg', 'Fahrzeug konfigurieren', '/fahrzeuge', 0],
            ['caravan', 'Wohnmobil & Caravan', 'Sound- und Elektronik-Lösungen speziell für Reisemobile und Caravans – reversibel oder fest verbaut.', self::uploadsUrlPrefix() . 'seed-leistung-wohnmobil.jpg', null, null, 1],
            ['car-front', 'Oldtimer', 'Zeitgemäßer Klang für Klassiker – wir modernisieren die Anlage, ohne den Charakter deines Oldtimers zu verlieren.', self::uploadsUrlPrefix() . 'seed-leistung-oldtimer.jpg', null, null, 2],
            ['cog', 'CNC Zerspanen', 'Fräsen, Bohren, Schneiden und Schleifen auf einer Fläche von 1500 × 3000 mm – für Prototypen, Kleinserien und Großauflagen. Massivholz, Verbundwerkstoffe, Plattenmaterial und mehr.', self::uploadsUrlPrefix() . 'seed-leistung-cnc-zerspanen.jpg', null, null, 3],
            ['zap', 'CNC Lasertechnik', 'Präzises Laserschneiden und -gravieren für Leder, Glas, Acryl, Holz, Karton und mehr – für Einzelstücke ebenso wie Serienfertigung.', self::uploadsUrlPrefix() . 'seed-leistung-cnc-laser.jpg', null, null, 4],
            ['boxes', '3D-Druck', 'Über 20 Drucker (FDM & SLA) für individuelle Halterungen, Blenden und Kleinserien – Fertigung meist in 1–3 Tagen, auf Wunsch auch farbig.', self::uploadsUrlPrefix() . 'seed-leistung-3d-druck.jpg', null, null, 5],
            ['shield-alert', 'Alarmanlagen', 'Zuverlässiger Diebstahlschutz für dein Fahrzeug, abgestimmt auf deine Ansprüche und dein Budget.', self::uploadsUrlPrefix() . 'seed-leistung-alarmanlagen.jpg', null, null, 6],
            ['video', 'Dash Cams', 'Beweissichere Aufzeichnung fürs Auto – wir beraten dich zur passenden Kamera und übernehmen den unauffälligen Einbau.', self::uploadsUrlPrefix() . 'seed-leistung-dashcam.jpg', null, null, 7],
        ];
    }

    private static function defaultFaqs(): array
    {
        return [
            [
                'Was kostet eine Beratung?',
                'Beratung und Preisanfrage sind für dich komplett kostenlos und unverbindlich.',
                'How much does a consultation cost?',
                'A consultation and price estimate are completely free and non-binding.',
                0,
            ],
            [
                'Muss ich mein Fahrzeug vorbeibringen?',
                'Für eine erste Einschätzung reicht oft deine Anfrage über die Website. Für den Einbau selbst vereinbaren wir gemeinsam einen Termin bei uns in Amorbach.',
                'Do I need to bring my vehicle in?',
                "For an initial assessment, your inquiry through the website is often enough. For the installation itself, we'll schedule an appointment together at our workshop in Amorbach.",
                1,
            ],
            [
                'Wie lange dauert ein Umbau?',
                'Das hängt vom Umfang ab – von einem einfachen Lautsprecher-Tausch in wenigen Stunden bis zum aufwendigen Komplettumbau über mehrere Tage.',
                'How long does an installation take?',
                'It depends on the scope – from a simple speaker swap in a few hours to an elaborate full installation over several days.',
                2,
            ],
            [
                'Bietet ihr auch Lösungen für Leasingfahrzeuge?',
                'Ja, auf Wunsch bauen wir reversibel um, sodass dein Fahrzeug bei Rückgabe wieder in den Originalzustand versetzt werden kann.',
                'Do you offer solutions for leased vehicles?',
                'Yes, on request we install everything reversibly, so your vehicle can be returned to its original condition when handed back.',
                3,
            ],
            [
                'Arbeitet ihr nur mit bestimmten Marken?',
                'Nein, wir sind herstellerunabhängig und wählen die Komponenten, die am besten zu deinem Anspruch und Budget passen.',
                'Do you only work with certain brands?',
                "No, we're brand-independent and choose the components that best fit your needs and budget.",
                4,
            ],
            [
                'Was ist, wenn mein Fahrzeug nicht gelistet ist?',
                'Kein Problem – schreib uns einfach über das Kontaktformular, wir finden für jedes Fahrzeug eine passende Lösung.',
                "What if my vehicle isn't listed?",
                "No problem – just message us through the contact form, we'll find a suitable solution for any vehicle.",
                5,
            ],
        ];
    }
}
