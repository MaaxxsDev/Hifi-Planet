<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;

class GalleryPhotoController
{
    public static function store(): void
    {
        $body = Http::jsonBody();
        $projectId = (int) ($body['gallery_project_id'] ?? 0);
        $imagePath = trim($body['image_path'] ?? '');

        if ($projectId <= 0 || $imagePath === '') {
            Http::error('Projekt und Bild erforderlich', 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO gallery_photos (gallery_project_id, image_path, caption, sort_order) VALUES (?, ?, ?, ?)'
        );
        $stmt->execute([
            $projectId,
            $imagePath,
            trim($body['caption'] ?? '') ?: null,
            (int) ($body['sort_order'] ?? 0),
        ]);

        Http::send(['id' => (int) $db->lastInsertId()], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();

        $stmt = Database::connection()->prepare(
            'UPDATE gallery_photos SET caption = ?, sort_order = ? WHERE id = ?'
        );
        $stmt->execute([
            trim($body['caption'] ?? '') ?: null,
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM gallery_photos WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }
}
