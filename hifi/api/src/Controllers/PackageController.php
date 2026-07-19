<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Slug;

class PackageController
{
    private static function normalizeMarkup(array $body): array
    {
        $type = $body['markup_type'] ?? 'none';
        if (!in_array($type, ['none', 'fixed', 'percent'], true)) {
            $type = 'none';
        }
        $value = $type === 'none' ? 0 : (float) ($body['markup_value'] ?? 0);

        return [$type, $value];
    }

    public static function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT p.id, p.name, p.slug, p.description, p.markup_type, p.markup_value, p.icon_name, p.tagline,
                    p.price_text, p.is_featured, p.sort_order, p.car_model_id, m.name AS model_name, b.name AS brand_name
             FROM packages p
             JOIN car_models m ON m.id = p.car_model_id
             JOIN brands b ON b.id = m.brand_id
             ORDER BY b.name, m.name, p.sort_order, p.name'
        );
        $packages = $stmt->fetchAll();
        foreach ($packages as &$package) {
            $package['is_featured'] = (bool) $package['is_featured'];
        }
        unset($package);
        Http::send($packages);
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        $modelId = (int) ($body['car_model_id'] ?? 0);

        if ($name === '' || $modelId <= 0) {
            Http::error('Name und Modell erforderlich', 422);
        }

        [$markupType, $markupValue] = self::normalizeMarkup($body);

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO packages (car_model_id, name, slug, description, markup_type, markup_value, icon_name, tagline, price_text, is_featured, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $modelId,
            $name,
            Slug::make($name),
            $body['description'] ?? null,
            $markupType,
            $markupValue,
            trim($body['icon_name'] ?? '') ?: null,
            trim($body['tagline'] ?? '') ?: null,
            trim($body['price_text'] ?? '') ?: null,
            !empty($body['is_featured']) ? 1 : 0,
            (int) ($body['sort_order'] ?? 0),
        ]);

        Http::send(['id' => (int) $db->lastInsertId()], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        $modelId = (int) ($body['car_model_id'] ?? 0);

        if ($name === '' || $modelId <= 0) {
            Http::error('Name und Modell erforderlich', 422);
        }

        [$markupType, $markupValue] = self::normalizeMarkup($body);

        $stmt = Database::connection()->prepare(
            'UPDATE packages SET car_model_id = ?, name = ?, slug = ?, description = ?, markup_type = ?, markup_value = ?, icon_name = ?, tagline = ?, price_text = ?, is_featured = ?, sort_order = ? WHERE id = ?'
        );
        $stmt->execute([
            $modelId,
            $name,
            Slug::make($name),
            $body['description'] ?? null,
            $markupType,
            $markupValue,
            trim($body['icon_name'] ?? '') ?: null,
            trim($body['tagline'] ?? '') ?: null,
            trim($body['price_text'] ?? '') ?: null,
            !empty($body['is_featured']) ? 1 : 0,
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    /**
     * Kopiert alle Pakete eines Quellmodells (inkl. der verknuepften
     * package_products-Zeilen samt gecachter Scrape-Daten - KEIN Re-Scraping)
     * auf das Zielmodell. Paketstufen, deren Slug im Ziel schon existiert,
     * werden uebersprungen (abgesichert durch UNIQUE uniq_model_slug).
     * package_upgrades werden bewusst nicht mitkopiert.
     */
    public static function copyFromModel(array $params): void
    {
        $targetId = (int) $params['id'];
        $body = Http::jsonBody();
        $sourceId = (int) ($body['source_model_id'] ?? 0);

        if ($targetId <= 0 || $sourceId <= 0) {
            Http::error('Quell- und Zielmodell erforderlich', 422);
        }
        if ($sourceId === $targetId) {
            Http::error('Quell- und Zielmodell müssen unterschiedlich sein', 422);
        }

        $db = Database::connection();

        $stmt = $db->prepare('SELECT id FROM car_models WHERE id IN (?, ?)');
        $stmt->execute([$sourceId, $targetId]);
        if (count($stmt->fetchAll()) !== 2) {
            Http::error('Modell nicht gefunden', 404);
        }

        $stmt = $db->prepare('SELECT slug FROM packages WHERE car_model_id = ?');
        $stmt->execute([$targetId]);
        $existingSlugs = array_column($stmt->fetchAll(), 'slug');

        $stmt = $db->prepare('SELECT * FROM packages WHERE car_model_id = ? ORDER BY sort_order, name');
        $stmt->execute([$sourceId]);
        $sourcePackages = $stmt->fetchAll();

        $copied = [];
        $skipped = [];

        $db->beginTransaction();
        try {
            $insertPackage = $db->prepare(
                'INSERT INTO packages (car_model_id, name, slug, description, markup_type, markup_value, icon_name, tagline, price_text, is_featured, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $copyProducts = $db->prepare(
                'INSERT INTO package_products (package_id, source_url, name_override, scraped_name, scraped_price, scraped_currency,
                                               scraped_image_url, price_updated_at, scrape_status, scrape_error, sort_order)
                 SELECT ?, source_url, name_override, scraped_name, scraped_price, scraped_currency,
                        scraped_image_url, price_updated_at, scrape_status, scrape_error, sort_order
                 FROM package_products WHERE package_id = ?'
            );

            foreach ($sourcePackages as $pkg) {
                if (in_array($pkg['slug'], $existingSlugs, true)) {
                    $skipped[] = $pkg['name'];
                    continue;
                }
                $insertPackage->execute([
                    $targetId,
                    $pkg['name'],
                    $pkg['slug'],
                    $pkg['description'],
                    $pkg['markup_type'],
                    $pkg['markup_value'],
                    $pkg['icon_name'],
                    $pkg['tagline'],
                    $pkg['price_text'],
                    (int) $pkg['is_featured'],
                    (int) $pkg['sort_order'],
                ]);
                $newId = (int) $db->lastInsertId();
                $copyProducts->execute([$newId, $pkg['id']]);
                $copied[] = ['name' => $pkg['name'], 'products' => $copyProducts->rowCount()];
            }

            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        Http::send(['copied' => $copied, 'skipped' => $skipped]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM packages WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    public static function products(array $params): void
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, package_id, source_url, name_override, scraped_name, scraped_price, scraped_currency,
                    scraped_image_url, price_updated_at, scrape_status, scrape_error, sort_order
             FROM package_products WHERE package_id = ? ORDER BY sort_order, id'
        );
        $stmt->execute([(int) $params['id']]);
        Http::send($stmt->fetchAll());
    }
}
