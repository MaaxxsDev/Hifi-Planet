<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;

class ServiceController
{
    public static function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT id, icon_name, title, description, image_path, cta_label, cta_url, sort_order
             FROM services ORDER BY sort_order, title'
        );
        Http::send($stmt->fetchAll());
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        [$iconName, $title, $description] = self::validate($body);

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO services (icon_name, title, description, image_path, cta_label, cta_url, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $iconName,
            $title,
            $description,
            $body['image_path'] ?? null,
            $body['cta_label'] ?? null,
            $body['cta_url'] ?? null,
            (int) ($body['sort_order'] ?? 0),
        ]);

        Http::send(['id' => (int) $db->lastInsertId()], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        [$iconName, $title, $description] = self::validate($body);

        $stmt = Database::connection()->prepare(
            'UPDATE services SET icon_name = ?, title = ?, description = ?, image_path = ?, cta_label = ?, cta_url = ?, sort_order = ?
             WHERE id = ?'
        );
        $stmt->execute([
            $iconName,
            $title,
            $description,
            $body['image_path'] ?? null,
            $body['cta_label'] ?? null,
            $body['cta_url'] ?? null,
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM services WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    private static function validate(array $body): array
    {
        $iconName = trim($body['icon_name'] ?? '');
        $title = trim($body['title'] ?? '');
        $description = trim($body['description'] ?? '');

        if ($iconName === '' || $title === '' || $description === '') {
            Http::error('Icon, Name und Beschreibung sind erforderlich', 422);
        }

        return [$iconName, $title, $description];
    }
}
