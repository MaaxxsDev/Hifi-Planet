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
                    p.is_featured, p.sort_order, p.car_model_id, m.name AS model_name, b.name AS brand_name
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
            'INSERT INTO packages (car_model_id, name, slug, description, markup_type, markup_value, icon_name, tagline, is_featured, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
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
            'UPDATE packages SET car_model_id = ?, name = ?, slug = ?, description = ?, markup_type = ?, markup_value = ?, icon_name = ?, tagline = ?, is_featured = ?, sort_order = ? WHERE id = ?'
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
            !empty($body['is_featured']) ? 1 : 0,
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
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
