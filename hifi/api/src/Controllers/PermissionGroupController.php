<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Permissions;

class PermissionGroupController
{
    public static function index(): void
    {
        $db = Database::connection();
        $groups = $db->query('SELECT id, name, description FROM permission_groups ORDER BY name')->fetchAll();

        $permStmt = $db->prepare('SELECT permission FROM permission_group_permissions WHERE permission_group_id = ?');
        foreach ($groups as &$group) {
            $permStmt->execute([$group['id']]);
            $group['permissions'] = $permStmt->fetchAll(\PDO::FETCH_COLUMN);
        }
        unset($group);

        Http::send($groups);
    }

    public static function store(): void
    {
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        if ($name === '') {
            Http::error('Name erforderlich', 422);
        }
        $permissions = Permissions::sanitizeList($body['permissions'] ?? []);

        $db = Database::connection();
        $stmt = $db->prepare('INSERT INTO permission_groups (name, description) VALUES (?, ?)');
        $stmt->execute([$name, $body['description'] ?? null]);
        $id = (int) $db->lastInsertId();

        self::savePermissions($db, $id, $permissions);

        Http::send(['id' => $id], 201);
    }

    public static function update(array $params): void
    {
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        if ($name === '') {
            Http::error('Name erforderlich', 422);
        }
        $permissions = Permissions::sanitizeList($body['permissions'] ?? []);

        $db = Database::connection();
        $stmt = $db->prepare('UPDATE permission_groups SET name = ?, description = ? WHERE id = ?');
        $stmt->execute([$name, $body['description'] ?? null, $id]);

        self::savePermissions($db, $id, $permissions);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM permission_groups WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    /** @param string[] $permissions */
    private static function savePermissions(\PDO $db, int $groupId, array $permissions): void
    {
        $db->prepare('DELETE FROM permission_group_permissions WHERE permission_group_id = ?')->execute([$groupId]);

        if (!$permissions) {
            return;
        }

        $stmt = $db->prepare('INSERT INTO permission_group_permissions (permission_group_id, permission) VALUES (?, ?)');
        foreach ($permissions as $permission) {
            $stmt->execute([$groupId, $permission]);
        }
    }
}
