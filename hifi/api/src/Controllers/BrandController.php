<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Slug;

class BrandController
{
    public static function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT id, name, slug, sort_order FROM brands ORDER BY sort_order, name'
        );
        Http::send($stmt->fetchAll());
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        if ($name === '') {
            Http::error('Name erforderlich', 422);
        }

        $slug = Slug::make($name);
        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO brands (name, slug, sort_order) VALUES (?, ?, ?)'
        );
        $stmt->execute([$name, $slug, (int) ($body['sort_order'] ?? 0)]);

        Http::send(['id' => (int) $db->lastInsertId(), 'name' => $name, 'slug' => $slug], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        if ($name === '') {
            Http::error('Name erforderlich', 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'UPDATE brands SET name = ?, slug = ?, sort_order = ? WHERE id = ?'
        );
        $stmt->execute([
            $name,
            Slug::make($name),
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM brands WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    public static function modelsForBrand(array $params): void
    {
        $db = Database::connection();
        $brandStmt = $db->prepare('SELECT id, name, slug FROM brands WHERE slug = ?');
        $brandStmt->execute([$params['slug']]);
        $brand = $brandStmt->fetch();

        if (!$brand) {
            Http::error('Marke nicht gefunden', 404);
        }

        $stmt = $db->prepare(
            'SELECT id, name, slug, sort_order FROM car_models WHERE brand_id = ? ORDER BY sort_order, name'
        );
        $stmt->execute([$brand['id']]);

        Http::send(['brand' => $brand, 'models' => $stmt->fetchAll()]);
    }
}
