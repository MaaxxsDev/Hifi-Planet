<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Support\Http;
use App\Support\Permissions;

class AdminUserController
{
    public static function index(): void
    {
        $db = Database::connection();
        $users = $db->query(
            'SELECT id, username, is_super_admin, created_at FROM admin_users ORDER BY username'
        )->fetchAll();

        $permStmt = $db->prepare('SELECT permission FROM admin_user_permissions WHERE admin_user_id = ?');
        $groupStmt = $db->prepare(
            'SELECT pg.id, pg.name FROM admin_user_groups aug
             JOIN permission_groups pg ON pg.id = aug.permission_group_id
             WHERE aug.admin_user_id = ?'
        );

        foreach ($users as &$user) {
            $user['is_super_admin'] = (bool) $user['is_super_admin'];
            $permStmt->execute([$user['id']]);
            $user['permissions'] = $permStmt->fetchAll(\PDO::FETCH_COLUMN);
            $groupStmt->execute([$user['id']]);
            $user['groups'] = $groupStmt->fetchAll();
        }
        unset($user);

        Http::send($users);
    }

    public static function store(): void
    {
        $actorId = AuthMiddleware::requireAdmin();
        $body = Http::jsonBody();
        $username = trim($body['username'] ?? '');
        $password = (string) ($body['password'] ?? '');

        if ($username === '' || strlen($password) < 8) {
            Http::error('Benutzername erforderlich, Passwort mindestens 8 Zeichen', 422);
        }

        $wantsSuperAdmin = !empty($body['is_super_admin']);
        if ($wantsSuperAdmin && !AuthMiddleware::isSuperAdmin($actorId)) {
            Http::error('Nur Super-Admins dürfen Super-Admin-Rechte vergeben', 403);
        }

        $db = Database::connection();
        $exists = $db->prepare('SELECT 1 FROM admin_users WHERE username = ?');
        $exists->execute([$username]);
        if ($exists->fetch()) {
            Http::error('Benutzername bereits vergeben', 422);
        }

        $stmt = $db->prepare(
            'INSERT INTO admin_users (username, password_hash, is_super_admin) VALUES (?, ?, ?)'
        );
        $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $wantsSuperAdmin ? 1 : 0]);
        $id = (int) $db->lastInsertId();

        self::saveAssignments($db, $id, $body);

        Http::send(['id' => $id], 201);
    }

    public static function update(array $params): void
    {
        $actorId = AuthMiddleware::requireAdmin();
        $id = (int) $params['id'];
        $body = Http::jsonBody();
        $username = trim($body['username'] ?? '');

        if ($username === '') {
            Http::error('Benutzername erforderlich', 422);
        }

        $db = Database::connection();
        $exists = $db->prepare('SELECT 1 FROM admin_users WHERE username = ? AND id != ?');
        $exists->execute([$username, $id]);
        if ($exists->fetch()) {
            Http::error('Benutzername bereits vergeben', 422);
        }

        $wantsSuperAdmin = !empty($body['is_super_admin']);
        $actorIsSuperAdmin = AuthMiddleware::isSuperAdmin($actorId);
        if ($wantsSuperAdmin !== AuthMiddleware::isSuperAdmin($id) && !$actorIsSuperAdmin) {
            Http::error('Nur Super-Admins dürfen Super-Admin-Rechte ändern', 403);
        }

        if (!$wantsSuperAdmin && AuthMiddleware::isSuperAdmin($id)) {
            self::guardLastSuperAdmin($db, $id, 'Der letzte Super-Admin kann nicht degradiert werden');
        }

        $password = (string) ($body['password'] ?? '');
        if ($password !== '') {
            if (strlen($password) < 8) {
                Http::error('Passwort muss mindestens 8 Zeichen lang sein', 422);
            }
            $stmt = $db->prepare(
                'UPDATE admin_users SET username = ?, password_hash = ?, is_super_admin = ? WHERE id = ?'
            );
            $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT), $wantsSuperAdmin ? 1 : 0, $id]);
        } else {
            $stmt = $db->prepare('UPDATE admin_users SET username = ?, is_super_admin = ? WHERE id = ?');
            $stmt->execute([$username, $wantsSuperAdmin ? 1 : 0, $id]);
        }

        self::saveAssignments($db, $id, $body);

        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $actorId = AuthMiddleware::requireAdmin();
        $id = (int) $params['id'];

        if ($id === $actorId) {
            Http::error('Du kannst dein eigenes Konto nicht löschen', 422);
        }

        $db = Database::connection();
        if (AuthMiddleware::isSuperAdmin($id)) {
            self::guardLastSuperAdmin($db, $id, 'Der letzte Super-Admin kann nicht gelöscht werden');
        }

        $stmt = $db->prepare('DELETE FROM admin_users WHERE id = ?');
        $stmt->execute([$id]);
        Http::send(['ok' => true]);
    }

    private static function guardLastSuperAdmin(\PDO $db, int $excludingId, string $message): void
    {
        $stmt = $db->prepare('SELECT COUNT(*) FROM admin_users WHERE is_super_admin = 1 AND id != ?');
        $stmt->execute([$excludingId]);
        if ((int) $stmt->fetchColumn() === 0) {
            Http::error($message, 422);
        }
    }

    private static function saveAssignments(\PDO $db, int $userId, array $body): void
    {
        if (array_key_exists('permissions', $body)) {
            $permissions = Permissions::sanitizeList($body['permissions'] ?? []);
            $db->prepare('DELETE FROM admin_user_permissions WHERE admin_user_id = ?')->execute([$userId]);
            if ($permissions) {
                $stmt = $db->prepare('INSERT INTO admin_user_permissions (admin_user_id, permission) VALUES (?, ?)');
                foreach ($permissions as $permission) {
                    $stmt->execute([$userId, $permission]);
                }
            }
        }

        if (array_key_exists('group_ids', $body)) {
            $groupIds = array_values(array_unique(array_map('intval', $body['group_ids'] ?? [])));
            $db->prepare('DELETE FROM admin_user_groups WHERE admin_user_id = ?')->execute([$userId]);
            if ($groupIds) {
                $stmt = $db->prepare('INSERT INTO admin_user_groups (admin_user_id, permission_group_id) VALUES (?, ?)');
                foreach ($groupIds as $groupId) {
                    $stmt->execute([$userId, $groupId]);
                }
            }
        }
    }
}
