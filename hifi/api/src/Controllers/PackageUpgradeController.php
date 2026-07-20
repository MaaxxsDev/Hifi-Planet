<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;

class PackageUpgradeController
{
    public static function index(array $params): void
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, package_id, name, description, price, sort_order
             FROM package_upgrades WHERE package_id = ? ORDER BY sort_order, id'
        );
        $stmt->execute([(int) $params['id']]);
        Http::send($stmt->fetchAll());
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        $packageId = (int) ($body['package_id'] ?? 0);
        $name = trim($body['name'] ?? '');
        $price = (float) ($body['price'] ?? 0);

        if ($packageId <= 0 || $name === '') {
            Http::error('Paket und Name erforderlich', 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO package_upgrades (package_id, name, description, price, sort_order) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $packageId,
            $name,
            $body['description'] ?? null,
            $price,
            (int) ($body['sort_order'] ?? 0),
        ]);

        Http::send(['id' => (int) $db->lastInsertId()], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');

        if ($name === '') {
            Http::error('Name erforderlich', 422);
        }

        $stmt = Database::connection()->prepare(
            'UPDATE package_upgrades SET name = ?, description = ?, price = ?, sort_order = ? WHERE id = ?'
        );
        $stmt->execute([
            $name,
            $body['description'] ?? null,
            (float) ($body['price'] ?? 0),
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM package_upgrades WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }
}
