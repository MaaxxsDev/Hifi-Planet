<?php

namespace App\Middleware;

use App\Config\Database;
use App\Support\Http;

class AuthMiddleware
{
    public static function requireAdmin(): int
    {
        if (empty($_SESSION['admin_id'])) {
            Http::error('Nicht angemeldet', 401);
        }
        return (int) $_SESSION['admin_id'];
    }

    public static function requirePermission(string $permission): int
    {
        $userId = self::requireAdmin();
        if (!self::userHasPermission($userId, $permission)) {
            Http::error('Keine Berechtigung für diese Aktion', 403);
        }
        return $userId;
    }

    /** @param string[] $permissions */
    public static function requireAnyPermission(array $permissions): int
    {
        $userId = self::requireAdmin();
        foreach ($permissions as $permission) {
            if (self::userHasPermission($userId, $permission)) {
                return $userId;
            }
        }
        Http::error('Keine Berechtigung für diese Aktion', 403);
    }

    public static function isSuperAdmin(int $userId): bool
    {
        $stmt = Database::connection()->prepare('SELECT is_super_admin FROM admin_users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        return (bool) ($user['is_super_admin'] ?? false);
    }

    public static function userHasPermission(int $userId, string $permission): bool
    {
        if (self::isSuperAdmin($userId)) {
            return true;
        }

        $db = Database::connection();

        $stmt = $db->prepare('SELECT 1 FROM admin_user_permissions WHERE admin_user_id = ? AND permission = ?');
        $stmt->execute([$userId, $permission]);
        if ($stmt->fetch()) {
            return true;
        }

        $stmt = $db->prepare(
            'SELECT 1 FROM admin_user_groups aug
             JOIN permission_group_permissions pgp ON pgp.permission_group_id = aug.permission_group_id
             WHERE aug.admin_user_id = ? AND pgp.permission = ?'
        );
        $stmt->execute([$userId, $permission]);
        return (bool) $stmt->fetch();
    }

    /** @return string[] */
    public static function effectivePermissions(int $userId): array
    {
        if (self::isSuperAdmin($userId)) {
            return array_keys(\App\Support\Permissions::CATALOG);
        }

        $db = Database::connection();

        $direct = $db->prepare('SELECT permission FROM admin_user_permissions WHERE admin_user_id = ?');
        $direct->execute([$userId]);

        $fromGroups = $db->prepare(
            'SELECT DISTINCT pgp.permission FROM admin_user_groups aug
             JOIN permission_group_permissions pgp ON pgp.permission_group_id = aug.permission_group_id
             WHERE aug.admin_user_id = ?'
        );
        $fromGroups->execute([$userId]);

        $perms = array_unique(array_merge(
            $direct->fetchAll(\PDO::FETCH_COLUMN),
            $fromGroups->fetchAll(\PDO::FETCH_COLUMN)
        ));

        return array_values($perms);
    }
}
