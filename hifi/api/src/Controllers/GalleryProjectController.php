<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Slug;

class GalleryProjectController
{
    public static function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT p.id, p.name, p.slug, p.cover_image_path, p.sort_order, p.gallery_brand_id,
                    b.name AS brand_name, b.slug AS brand_slug
             FROM gallery_projects p JOIN gallery_brands b ON b.id = p.gallery_brand_id
             ORDER BY b.name, p.sort_order, p.name'
        );
        Http::send($stmt->fetchAll());
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        $brandId = (int) ($body['gallery_brand_id'] ?? 0);

        if ($name === '' || $brandId <= 0) {
            Http::error('Name und Marke erforderlich', 422);
        }

        $db = Database::connection();
        $stmt = $db->prepare(
            'INSERT INTO gallery_projects (gallery_brand_id, name, slug, cover_image_path, sort_order) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $brandId,
            $name,
            Slug::make($name),
            trim($body['cover_image_path'] ?? '') ?: null,
            (int) ($body['sort_order'] ?? 0),
        ]);

        Http::send(['id' => (int) $db->lastInsertId()], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        $brandId = (int) ($body['gallery_brand_id'] ?? 0);

        if ($name === '' || $brandId <= 0) {
            Http::error('Name und Marke erforderlich', 422);
        }

        $stmt = Database::connection()->prepare(
            'UPDATE gallery_projects SET gallery_brand_id = ?, name = ?, slug = ?, cover_image_path = ?, sort_order = ? WHERE id = ?'
        );
        $stmt->execute([
            $brandId,
            $name,
            Slug::make($name),
            trim($body['cover_image_path'] ?? '') ?: null,
            (int) ($body['sort_order'] ?? 0),
            $id,
        ]);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM gallery_projects WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    /** Fotos eines Projekts für die Admin-Verwaltungsseite (per numerischer Projekt-ID). */
    public static function photosAdmin(array $params): void
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, gallery_project_id, image_path, caption, sort_order FROM gallery_photos WHERE gallery_project_id = ? ORDER BY sort_order, id'
        );
        $stmt->execute([(int) $params['id']]);
        Http::send($stmt->fetchAll());
    }

    /** Öffentliche Ansicht: Projekt + Fotos per Marke-Slug + Projekt-Slug. */
    public static function photosForProject(array $params): void
    {
        $db = Database::connection();
        $projectStmt = $db->prepare(
            'SELECT p.id, p.name, p.slug, b.name AS brand_name, b.slug AS brand_slug
             FROM gallery_projects p JOIN gallery_brands b ON b.id = p.gallery_brand_id
             WHERE p.slug = ? AND b.slug = ?'
        );
        $projectStmt->execute([$params['project_slug'], $params['brand_slug']]);
        $project = $projectStmt->fetch();

        if (!$project) {
            Http::error('Projekt nicht gefunden', 404);
        }

        $photoStmt = $db->prepare(
            'SELECT id, image_path, caption, sort_order FROM gallery_photos WHERE gallery_project_id = ? ORDER BY sort_order, id'
        );
        $photoStmt->execute([$project['id']]);

        Http::send(['project' => $project, 'photos' => $photoStmt->fetchAll()]);
    }
}
