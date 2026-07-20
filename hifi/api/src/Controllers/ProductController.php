<?php

namespace App\Controllers;

use App\Config\Database;
use App\Services\Audio4CarsScraper;
use App\Support\Http;

class ProductController
{
    private static function scraper(): Audio4CarsScraper
    {
        $config = require __DIR__ . '/../../config/config.php';
        return new Audio4CarsScraper($config['scraper']['timeout'], $config['scraper']['user_agent']);
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        $packageId = (int) ($body['package_id'] ?? 0);
        $sourceUrl = trim($body['source_url'] ?? '');

        if ($packageId <= 0 || $sourceUrl === '') {
            Http::error('Paket und Produkt-URL erforderlich', 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO package_products (package_id, source_url, name_override, sort_order, scrape_status)
             VALUES (?, ?, ?, ?, "pending")'
        );
        $stmt->execute([
            $packageId,
            $sourceUrl,
            $body['name_override'] ?? null,
            (int) ($body['sort_order'] ?? 0),
        ]);
        $id = (int) $db->lastInsertId();

        self::applyScrape($id, $sourceUrl);
        self::returnProduct($id);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE package_products SET source_url = ?, name_override = ?, sort_order = ? WHERE id = ?'
        );
        $stmt->execute([
            trim($body['source_url'] ?? ''),
            $body['name_override'] ?? null,
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM package_products WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    public static function refreshPrice(array $params): void
    {
        $id = (int) $params['id'];

        $stmt = Database::connection()->prepare('SELECT source_url FROM package_products WHERE id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();

        if (!$product) {
            Http::error('Produkt nicht gefunden', 404);
        }

        self::applyScrape($id, $product['source_url']);
        self::returnProduct($id);
    }

    private static function applyScrape(int $id, string $sourceUrl): void
    {
        $result = self::scraper()->scrape($sourceUrl);
        $db = Database::connection();

        if ($result['ok']) {
            $stmt = $db->prepare(
                'UPDATE package_products
                 SET scraped_name = ?, scraped_price = ?, scraped_currency = ?, scraped_image_url = ?,
                     price_updated_at = NOW(), scrape_status = "ok", scrape_error = NULL
                 WHERE id = ?'
            );
            $stmt->execute([$result['name'], $result['price'], $result['currency'], $result['image'], $id]);
        } else {
            $stmt = $db->prepare(
                'UPDATE package_products SET scrape_status = "error", scrape_error = ? WHERE id = ?'
            );
            $stmt->execute([$result['error'], $id]);
        }
    }

    private static function returnProduct(int $id): void
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, package_id, source_url, name_override, scraped_name, scraped_price, scraped_currency,
                    scraped_image_url, price_updated_at, scrape_status, scrape_error, sort_order
             FROM package_products WHERE id = ?'
        );
        $stmt->execute([$id]);
        Http::send($stmt->fetch());
    }
}
