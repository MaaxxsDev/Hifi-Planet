<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Slug;

class ModelController
{
    public static function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT m.id, m.name, m.slug, m.sort_order, m.brand_id, b.name AS brand_name, b.slug AS brand_slug
             FROM car_models m JOIN brands b ON b.id = m.brand_id
             ORDER BY b.name, m.sort_order, m.name'
        );
        Http::send($stmt->fetchAll());
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        $brandId = (int) ($body['brand_id'] ?? 0);

        if ($name === '' || $brandId <= 0) {
            Http::error('Name und Marke erforderlich', 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO car_models (brand_id, name, slug, sort_order) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $brandId,
            $name,
            Slug::make($name),
            (int) ($body['sort_order'] ?? 0),
        ]);

        Http::send(['id' => (int) $db->lastInsertId()], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        $brandId = (int) ($body['brand_id'] ?? 0);

        if ($name === '' || $brandId <= 0) {
            Http::error('Name und Marke erforderlich', 422);
        }

        $stmt = Database::connection()->prepare(
            'UPDATE car_models SET brand_id = ?, name = ?, slug = ?, sort_order = ? WHERE id = ?'
        );
        $stmt->execute([
            $brandId,
            $name,
            Slug::make($name),
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM car_models WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    public static function packagesForModel(array $params): void
    {
        $db = Database::connection();
        $modelStmt = $db->prepare(
            'SELECT m.id, m.name, m.slug, b.name AS brand_name, b.slug AS brand_slug
             FROM car_models m JOIN brands b ON b.id = m.brand_id
             WHERE m.slug = ? AND b.slug = ?'
        );
        $modelStmt->execute([$params['model_slug'], $params['brand_slug']]);
        $model = $modelStmt->fetch();

        if (!$model) {
            Http::error('Modell nicht gefunden', 404);
        }

        $pkgStmt = $db->prepare(
            'SELECT id, name, slug, description, markup_type, markup_value, icon_name, tagline, price_text, is_featured, sort_order
             FROM packages WHERE car_model_id = ? ORDER BY sort_order, name'
        );
        $pkgStmt->execute([$model['id']]);
        $packages = $pkgStmt->fetchAll();

        if ($packages) {
            $productStmt = $db->prepare(
                'SELECT id, package_id, name_override, scraped_name, scraped_image_url, scrape_status, sort_order
                 FROM package_products WHERE package_id = ? ORDER BY sort_order, id'
            );

            foreach ($packages as &$package) {
                $productStmt->execute([$package['id']]);
                $products = $productStmt->fetchAll();

                // Preise werden serverseitig aufsummiert und mit dem Aufschlag verrechnet,
                // aber nie pro Bauteil an den Client zurückgegeben – der Kunde sieht nur den Gesamtpreis.
                $subtotalStmt = $db->prepare(
                    'SELECT COALESCE(SUM(scraped_price), 0) AS subtotal FROM package_products WHERE package_id = ?'
                );
                $subtotalStmt->execute([$package['id']]);
                $subtotal = (float) $subtotalStmt->fetch()['subtotal'];

                if ($package['markup_type'] === 'fixed') {
                    $total = $subtotal + (float) $package['markup_value'];
                } elseif ($package['markup_type'] === 'percent') {
                    $total = $subtotal * (1 + (float) $package['markup_value'] / 100);
                } else {
                    $total = $subtotal;
                }

                unset($package['markup_type'], $package['markup_value']);
                $package['products'] = $products;
                $package['total_price'] = round($total, 2);
                $package['is_featured'] = (bool) $package['is_featured'];
            }
            unset($package);
        }

        Http::send(['model' => $model, 'packages' => $packages]);
    }
}
