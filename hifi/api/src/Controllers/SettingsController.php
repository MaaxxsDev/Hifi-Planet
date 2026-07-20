<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Slug;
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
        'packages' => ['id', 'car_model_id', 'name', 'slug', 'description', 'markup_type', 'markup_value', 'icon_name', 'tagline', 'price_text', 'is_featured', 'sort_order', 'created_at', 'updated_at'],
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

    /** Wandelt eine php.ini-Groessenangabe ("200M", "1G", "512K") in Bytes um. */
    private static function iniBytes(string $value): int
    {
        $value = trim($value);
        if ($value === '') {
            return 0;
        }
        $num = (float) $value;
        return match (strtolower(substr($value, -1))) {
            'g' => (int) ($num * 1024 * 1024 * 1024),
            'm' => (int) ($num * 1024 * 1024),
            'k' => (int) ($num * 1024),
            default => (int) $value,
        };
    }

    public static function importData(): void
    {
        if (!empty($_FILES['file'])) {
            $uploadError = $_FILES['file']['error'];
            if ($uploadError === UPLOAD_ERR_INI_SIZE || $uploadError === UPLOAD_ERR_FORM_SIZE) {
                Http::error(
                    'Die Datei überschreitet das Upload-Limit dieses Servers (aktuell ' . ini_get('upload_max_filesize') .
                    '). Bitte den Hosting-Anbieter um ein höheres PHP-Upload-Limit bitten.',
                    422
                );
            }
            if ($uploadError !== UPLOAD_ERR_OK) {
                Http::error('Datei-Upload fehlgeschlagen (Fehlercode ' . $uploadError . ').', 422);
            }
            $raw = file_get_contents($_FILES['file']['tmp_name']);
        } else {
            // Ein Upload, der post_max_size ueberschreitet, wird von PHP nicht in $_FILES
            // aufgenommen - der rohe Body ist ueber php://input aber trotzdem da (nur eben
            // noch als unverarbeitetes Multipart-Gemisch, kein gueltiges JSON). Deshalb direkt
            // Content-Length gegen das konfigurierte Limit pruefen, statt block auf einen
            // (nicht garantiert leeren) Body zu vertrauen - sonst landet eine zu grosse, aber
            // eigentlich intakte Export-Datei im irrefuehrenden generischen "ungueltige Datei"-Fehler.
            $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
            $maxPost = self::iniBytes((string) ini_get('post_max_size'));
            if ($maxPost > 0 && $contentLength > $maxPost) {
                Http::error(
                    'Die Datei überschreitet das Größen-Limit dieses Servers (aktuell ' . ini_get('post_max_size') .
                    '). Bitte den Hosting-Anbieter um ein höheres PHP-Upload-Limit (post_max_size) bitten.',
                    422
                );
            }
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

    /** Löscht Galerie-Marken (Foreign-Key-Kaskade räumt Projekte & Fotos automatisch mit auf). */
    public static function resetGalleryToDefaults(): void
    {
        $db = Database::connection();
        $db->exec('DELETE FROM gallery_brands');
        $photoCount = self::seedGalleryDefaults($db);

        Http::send(['ok' => true, 'photos' => $photoCount]);
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

        $db->exec('DELETE FROM gallery_brands');
        $galleryPhotoCount = self::seedGalleryDefaults($db);

        Http::send([
            'ok' => true,
            'brands_removed' => $brandCount,
            'services_reset' => count($defaults),
            'faqs_reset' => count($faqDefaults),
            'gallery_photos_reset' => $galleryPhotoCount,
        ]);
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

    /** Legt Galerie-Marken/-Projekte/-Fotos aus {@see defaultGalleryData()} neu an (Tabellen müssen leer sein). Gibt die Foto-Anzahl zurück. */
    private static function seedGalleryDefaults(PDO $db): int
    {
        $photoCount = 0;
        $brandStmt = $db->prepare('INSERT INTO gallery_brands (name, slug, cover_image_path, sort_order) VALUES (?,?,?,?)');
        $projectStmt = $db->prepare('INSERT INTO gallery_projects (gallery_brand_id, name, slug, cover_image_path, sort_order) VALUES (?,?,?,?,?)');
        $photoStmt = $db->prepare('INSERT INTO gallery_photos (gallery_project_id, image_path, sort_order) VALUES (?,?,?)');
        $updateBrandCoverStmt = $db->prepare('UPDATE gallery_brands SET cover_image_path = ? WHERE id = ?');

        $brandIndex = 0;
        foreach (self::defaultGalleryData() as $brand) {
            $brandIndex++;
            $brandStmt->execute([$brand['name'], Slug::make($brand['name']), null, $brandIndex]);
            $brandId = (int) $db->lastInsertId();
            $brandCover = null;

            $projectIndex = 0;
            foreach ($brand['projects'] as $project) {
                $projectIndex++;
                $photoUrls = array_map(fn($filename) => self::uploadsUrlPrefix() . $filename, $project['photos']);
                $projectCover = $photoUrls[0] ?? null;
                $brandCover ??= $projectCover;

                $projectStmt->execute([$brandId, $project['name'], Slug::make($project['name']), $projectCover, $projectIndex]);
                $projectId = (int) $db->lastInsertId();

                $photoIndex = 0;
                foreach ($photoUrls as $url) {
                    $photoIndex++;
                    $photoStmt->execute([$projectId, $url, $photoIndex]);
                    $photoCount++;
                }
            }

            if ($brandCover !== null) {
                $updateBrandCoverStmt->execute([$brandCover, $brandId]);
            }
        }

        return $photoCount;
    }

    /** Bildergalerie der alten hifi-planet.de-Seite (WordPress), einmalig übernommen. */
    private static function defaultGalleryData(): array
    {
        return [
            [
                'name' => 'Audi', 'projects' => [
                    ['name' => 'Audi TT', 'photos' => ['seed-galerie-audi-audi-tt-1.jpg', 'seed-galerie-audi-audi-tt-2.jpg', 'seed-galerie-audi-audi-tt-3.jpg', 'seed-galerie-audi-audi-tt-4.jpg', 'seed-galerie-audi-audi-tt-5.jpg', 'seed-galerie-audi-audi-tt-6.jpg', 'seed-galerie-audi-audi-tt-7.jpg', 'seed-galerie-audi-audi-tt-8.jpg', 'seed-galerie-audi-audi-tt-9.jpg']],
                    ['name' => 'Audi RS Q3', 'photos' => ['seed-galerie-audi-audio-rs-q3-1.jpg', 'seed-galerie-audi-audio-rs-q3-2.jpg', 'seed-galerie-audi-audio-rs-q3-3.jpg', 'seed-galerie-audi-audio-rs-q3-4.jpg', 'seed-galerie-audi-audio-rs-q3-5.jpg', 'seed-galerie-audi-audio-rs-q3-6.jpg', 'seed-galerie-audi-audio-rs-q3-7.jpg', 'seed-galerie-audi-audio-rs-q3-8.jpg', 'seed-galerie-audi-audio-rs-q3-9.jpg', 'seed-galerie-audi-audio-rs-q3-10.jpg']],
                ],
            ],
            [
                'name' => 'BMW', 'projects' => [
                    ['name' => 'F10 Touring', 'photos' => ['seed-galerie-bmw-f10-touring-1.jpg', 'seed-galerie-bmw-f10-touring-2.jpg', 'seed-galerie-bmw-f10-touring-3.jpg', 'seed-galerie-bmw-f10-touring-4.jpg', 'seed-galerie-bmw-f10-touring-5.jpg', 'seed-galerie-bmw-f10-touring-6.jpg', 'seed-galerie-bmw-f10-touring-7.jpg', 'seed-galerie-bmw-f10-touring-8.jpg']],
                    ['name' => 'Mini Cooper RS', 'photos' => ['seed-galerie-bmw-mini-cooper-rs-1.jpg', 'seed-galerie-bmw-mini-cooper-rs-2.jpg', 'seed-galerie-bmw-mini-cooper-rs-3.jpg']],
                ],
            ],
            [
                'name' => 'Elektro-Autos', 'projects' => [
                    ['name' => 'Hyundai Ioniq 5', 'photos' => ['seed-galerie-elektro-autos-hyundai-ioniq-5-1.jpg', 'seed-galerie-elektro-autos-hyundai-ioniq-5-2.jpg', 'seed-galerie-elektro-autos-hyundai-ioniq-5-3.jpg', 'seed-galerie-elektro-autos-hyundai-ioniq-5-4.jpg', 'seed-galerie-elektro-autos-hyundai-ioniq-5-5.jpg', 'seed-galerie-elektro-autos-hyundai-ioniq-5-6.jpg', 'seed-galerie-elektro-autos-hyundai-ioniq-5-7.jpg']],
                    ['name' => 'Tesla Model Y', 'photos' => ['seed-galerie-elektro-autos-tesla-model-y-1.jpg', 'seed-galerie-elektro-autos-tesla-model-y-2.jpg', 'seed-galerie-elektro-autos-tesla-model-y-3.jpg', 'seed-galerie-elektro-autos-tesla-model-y-4.jpg', 'seed-galerie-elektro-autos-tesla-model-y-5.jpg', 'seed-galerie-elektro-autos-tesla-model-y-6.jpg']],
                ],
            ],
            [
                'name' => 'Fiat / Ford', 'projects' => [
                    ['name' => 'Fiesta MK7', 'photos' => ['seed-galerie-fiat-ford-fiesta-mk7-1.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-2.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-3.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-4.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-5.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-6.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-7.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-8.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-9.jpg', 'seed-galerie-fiat-ford-fiesta-mk7-10.jpg']],
                    ['name' => 'Mustang VI', 'photos' => ['seed-galerie-fiat-ford-mustang-vi-1.jpg', 'seed-galerie-fiat-ford-mustang-vi-2.jpg', 'seed-galerie-fiat-ford-mustang-vi-3.jpg', 'seed-galerie-fiat-ford-mustang-vi-4.jpg', 'seed-galerie-fiat-ford-mustang-vi-5.jpg', 'seed-galerie-fiat-ford-mustang-vi-6.jpg', 'seed-galerie-fiat-ford-mustang-vi-7.jpg']],
                    ['name' => 'Mustang V', 'photos' => ['seed-galerie-fiat-ford-mustang-1.jpg', 'seed-galerie-fiat-ford-mustang-2.jpg', 'seed-galerie-fiat-ford-mustang-3.jpg', 'seed-galerie-fiat-ford-mustang-4.jpg', 'seed-galerie-fiat-ford-mustang-5.jpg', 'seed-galerie-fiat-ford-mustang-6.jpg']],
                ],
            ],
            [
                'name' => 'Hyundai', 'projects' => [
                    ['name' => 'i30', 'photos' => ['seed-galerie-hyundai-i30-1.jpg', 'seed-galerie-hyundai-i30-2.jpg', 'seed-galerie-hyundai-i30-3.jpg', 'seed-galerie-hyundai-i30-4.jpg', 'seed-galerie-hyundai-i30-5.jpg']],
                ],
            ],
            [
                'name' => 'Mercedes-Benz', 'projects' => [
                    ['name' => 'GLS', 'photos' => ['seed-galerie-mercedes-benz-gls-1.jpg', 'seed-galerie-mercedes-benz-gls-2.jpg', 'seed-galerie-mercedes-benz-gls-3.jpg', 'seed-galerie-mercedes-benz-gls-4.jpg', 'seed-galerie-mercedes-benz-gls-5.jpg']],
                    ['name' => 'SLK R 170', 'photos' => ['seed-galerie-mercedes-benz-slk-r-170-1.jpg', 'seed-galerie-mercedes-benz-slk-r-170-2.jpg', 'seed-galerie-mercedes-benz-slk-r-170-3.jpg', 'seed-galerie-mercedes-benz-slk-r-170-4.jpg', 'seed-galerie-mercedes-benz-slk-r-170-5.jpg', 'seed-galerie-mercedes-benz-slk-r-170-6.jpg', 'seed-galerie-mercedes-benz-slk-r-170-7.jpg', 'seed-galerie-mercedes-benz-slk-r-170-8.jpg']],
                    ['name' => 'Vito', 'photos' => ['seed-galerie-mercedes-benz-vito-1.jpg', 'seed-galerie-mercedes-benz-vito-2.jpg', 'seed-galerie-mercedes-benz-vito-3.jpg', 'seed-galerie-mercedes-benz-vito-4.jpg', 'seed-galerie-mercedes-benz-vito-5.jpg', 'seed-galerie-mercedes-benz-vito-6.jpg', 'seed-galerie-mercedes-benz-vito-7.jpg', 'seed-galerie-mercedes-benz-vito-8.jpg']],
                ],
            ],
            [
                'name' => 'Opel', 'projects' => [
                    ['name' => 'Astra J', 'photos' => ['seed-galerie-opel-astra-j-1.jpg', 'seed-galerie-opel-astra-j-2.jpg', 'seed-galerie-opel-astra-j-3.jpg', 'seed-galerie-opel-astra-j-4.jpg', 'seed-galerie-opel-astra-j-5.jpg', 'seed-galerie-opel-astra-j-6.jpg']],
                    ['name' => 'Meriva A', 'photos' => ['seed-galerie-opel-meriva-a-1.jpg', 'seed-galerie-opel-meriva-a-2.jpg', 'seed-galerie-opel-meriva-a-3.jpg', 'seed-galerie-opel-meriva-a-4.jpg', 'seed-galerie-opel-meriva-a-5.jpg', 'seed-galerie-opel-meriva-a-6.jpg', 'seed-galerie-opel-meriva-a-7.jpg', 'seed-galerie-opel-meriva-a-8.jpg', 'seed-galerie-opel-meriva-a-9.jpg']],
                    ['name' => 'Insignia A', 'photos' => ['seed-galerie-opel-opel-insignia-a-1.jpg', 'seed-galerie-opel-opel-insignia-a-2.jpg', 'seed-galerie-opel-opel-insignia-a-3.jpg', 'seed-galerie-opel-opel-insignia-a-4.jpg', 'seed-galerie-opel-opel-insignia-a-5.jpg', 'seed-galerie-opel-opel-insignia-a-6.jpg', 'seed-galerie-opel-opel-insignia-a-7.jpg']],
                ],
            ],
            [
                'name' => 'Peugeot', 'projects' => [
                    ['name' => '208 HDI', 'photos' => ['seed-galerie-peugeot-208-hdi-1.jpg', 'seed-galerie-peugeot-208-hdi-2.jpg', 'seed-galerie-peugeot-208-hdi-3.jpg', 'seed-galerie-peugeot-208-hdi-4.jpg', 'seed-galerie-peugeot-208-hdi-5.jpg', 'seed-galerie-peugeot-208-hdi-6.jpg', 'seed-galerie-peugeot-208-hdi-7.jpg', 'seed-galerie-peugeot-208-hdi-8.jpg', 'seed-galerie-peugeot-208-hdi-9.jpg', 'seed-galerie-peugeot-208-hdi-10.jpg', 'seed-galerie-peugeot-208-hdi-11.jpg', 'seed-galerie-peugeot-208-hdi-12.jpg']],
                ],
            ],
            [
                'name' => 'Seat / Skoda', 'projects' => [
                    ['name' => 'Alhambra', 'photos' => ['seed-galerie-seat-skoda-alhambra-1.jpg', 'seed-galerie-seat-skoda-alhambra-2.jpg', 'seed-galerie-seat-skoda-alhambra-3.jpg', 'seed-galerie-seat-skoda-alhambra-4.jpg', 'seed-galerie-seat-skoda-alhambra-5.jpg', 'seed-galerie-seat-skoda-alhambra-6.jpg', 'seed-galerie-seat-skoda-alhambra-7.jpg', 'seed-galerie-seat-skoda-alhambra-8.jpg']],
                    ['name' => 'Octavia', 'photos' => ['seed-galerie-seat-skoda-octavia-1.jpg', 'seed-galerie-seat-skoda-octavia-2.jpg', 'seed-galerie-seat-skoda-octavia-3.jpg', 'seed-galerie-seat-skoda-octavia-4.jpg', 'seed-galerie-seat-skoda-octavia-5.jpg', 'seed-galerie-seat-skoda-octavia-6.jpg']],
                ],
            ],
            [
                'name' => 'Smart', 'projects' => [
                    ['name' => 'Fortwo 453', 'photos' => ['seed-galerie-smart-for-two-453-1.jpg', 'seed-galerie-smart-for-two-453-2.jpg', 'seed-galerie-smart-for-two-453-3.jpg', 'seed-galerie-smart-for-two-453-4.jpg', 'seed-galerie-smart-for-two-453-5.jpg', 'seed-galerie-smart-for-two-453-6.jpg', 'seed-galerie-smart-for-two-453-7.jpg', 'seed-galerie-smart-for-two-453-8.jpg']],
                ],
            ],
            [
                'name' => 'Suzuki', 'projects' => [
                    ['name' => 'Swift', 'photos' => ['seed-galerie-suzuki-swift-1.jpg', 'seed-galerie-suzuki-swift-2.jpg', 'seed-galerie-suzuki-swift-3.jpg', 'seed-galerie-suzuki-swift-4.jpg', 'seed-galerie-suzuki-swift-5.jpg']],
                ],
            ],
            [
                'name' => 'Toyota', 'projects' => [
                    ['name' => 'Corolla', 'photos' => ['seed-galerie-toyota-crolla-1.jpg', 'seed-galerie-toyota-crolla-2.jpg', 'seed-galerie-toyota-crolla-3.jpg', 'seed-galerie-toyota-crolla-4.jpg', 'seed-galerie-toyota-crolla-5.jpg', 'seed-galerie-toyota-crolla-6.jpg']],
                ],
            ],
            [
                'name' => 'Volkswagen', 'projects' => [
                    ['name' => 'Golf 1 Cabrio', 'photos' => ['seed-galerie-volkswagen-golf-1-cabrio-1.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-2.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-3.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-4.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-5.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-6.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-7.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-8.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-9.jpg', 'seed-galerie-volkswagen-golf-1-cabrio-10.jpg']],
                    ['name' => 'Golf 4', 'photos' => ['seed-galerie-volkswagen-golf-4-1.jpg', 'seed-galerie-volkswagen-golf-4-2.jpg', 'seed-galerie-volkswagen-golf-4-3.jpg', 'seed-galerie-volkswagen-golf-4-4.jpg', 'seed-galerie-volkswagen-golf-4-5.jpg', 'seed-galerie-volkswagen-golf-4-6.jpg']],
                    ['name' => 'Golf 6', 'photos' => ['seed-galerie-volkswagen-golf-6-1.jpg', 'seed-galerie-volkswagen-golf-6-2.jpg', 'seed-galerie-volkswagen-golf-6-3.jpg', 'seed-galerie-volkswagen-golf-6-4.jpg', 'seed-galerie-volkswagen-golf-6-5.jpg', 'seed-galerie-volkswagen-golf-6-6.jpg', 'seed-galerie-volkswagen-golf-6-7.jpg', 'seed-galerie-volkswagen-golf-6-8.jpg', 'seed-galerie-volkswagen-golf-6-9.jpg', 'seed-galerie-volkswagen-golf-6-10.jpg', 'seed-galerie-volkswagen-golf-6-11.jpg', 'seed-galerie-volkswagen-golf-6-12.jpg']],
                    ['name' => 'T5 Multivan', 'photos' => ['seed-galerie-volkswagen-t5-multivan-1.jpg', 'seed-galerie-volkswagen-t5-multivan-2.jpg', 'seed-galerie-volkswagen-t5-multivan-3.jpg', 'seed-galerie-volkswagen-t5-multivan-4.jpg', 'seed-galerie-volkswagen-t5-multivan-5.jpg', 'seed-galerie-volkswagen-t5-multivan-6.jpg', 'seed-galerie-volkswagen-t5-multivan-7.jpg', 'seed-galerie-volkswagen-t5-multivan-8.jpg']],
                    ['name' => 'VW Crafter', 'photos' => ['seed-galerie-volkswagen-vw-crafter-1.jpg', 'seed-galerie-volkswagen-vw-crafter-2.jpg', 'seed-galerie-volkswagen-vw-crafter-3.jpg']],
                    ['name' => 'VW T6.1', 'photos' => ['seed-galerie-volkswagen-vw-t6-1-1.jpg', 'seed-galerie-volkswagen-vw-t6-1-2.jpg', 'seed-galerie-volkswagen-vw-t6-1-3.jpg', 'seed-galerie-volkswagen-vw-t6-1-4.jpg']],
                    ['name' => 'VW T6', 'photos' => ['seed-galerie-volkswagen-vw-t6-1.jpg', 'seed-galerie-volkswagen-vw-t6-2.jpg', 'seed-galerie-volkswagen-vw-t6-3.jpg', 'seed-galerie-volkswagen-vw-t6-4.jpg', 'seed-galerie-volkswagen-vw-t6-5.jpg']],
                ],
            ],
        ];
    }
}
