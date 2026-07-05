<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Support\Http;
use App\Support\RecoveryCodes;
use App\Support\Totp;

class AuthController
{
    public static function login(): void
    {
        $body = Http::jsonBody();
        $username = trim($body['username'] ?? '');
        $password = (string) ($body['password'] ?? '');

        if ($username === '' || $password === '') {
            Http::error('Benutzername und Passwort erforderlich', 422);
        }

        $stmt = Database::connection()->prepare(
            'SELECT id, username, password_hash, two_factor_enabled FROM admin_users WHERE username = ?'
        );
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Http::error('Benutzername oder Passwort falsch', 401);
        }

        if ((bool) $user['two_factor_enabled']) {
            session_regenerate_id(true);
            $_SESSION['pending_2fa_user_id'] = (int) $user['id'];
            unset($_SESSION['admin_id'], $_SESSION['admin_username']);
            Http::send(['requires_2fa' => true]);
            return;
        }

        self::completeLogin((int) $user['id'], $user['username']);
    }

    public static function verifyTwoFactor(): void
    {
        if (empty($_SESSION['pending_2fa_user_id'])) {
            Http::error('Keine ausstehende Anmeldung. Bitte erneut einloggen.', 400);
        }
        $userId = (int) $_SESSION['pending_2fa_user_id'];
        $body = Http::jsonBody();
        $code = trim($body['code'] ?? '');

        if ($code === '') {
            Http::error('Code erforderlich', 422);
        }

        $stmt = Database::connection()->prepare(
            'SELECT username, two_factor_secret, two_factor_recovery_codes FROM admin_users WHERE id = ?'
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user) {
            Http::error('Benutzer nicht gefunden', 404);
        }

        $valid = Totp::verifyCode($user['two_factor_secret'] ?? '', $code);

        if (!$valid) {
            $hashes = $user['two_factor_recovery_codes'] ? json_decode($user['two_factor_recovery_codes'], true) : [];
            $remaining = RecoveryCodes::consume($hashes, $code);
            if ($remaining !== null) {
                $valid = true;
                $update = Database::connection()->prepare(
                    'UPDATE admin_users SET two_factor_recovery_codes = ? WHERE id = ?'
                );
                $update->execute([json_encode($remaining), $userId]);
            }
        }

        if (!$valid) {
            Http::error('Code ungültig oder abgelaufen', 401);
        }

        self::completeLogin($userId, $user['username']);
    }

    public static function changePassword(): void
    {
        $userId = AuthMiddleware::requireAdmin();
        $body = Http::jsonBody();
        $currentPassword = (string) ($body['current_password'] ?? '');
        $newPassword = (string) ($body['new_password'] ?? '');
        $newPasswordConfirmation = (string) ($body['new_password_confirmation'] ?? '');
        $twoFactorCode = trim((string) ($body['two_factor_code'] ?? ''));

        if ($currentPassword === '' || $newPassword === '' || $newPasswordConfirmation === '') {
            Http::error('Bitte alle Felder ausfüllen', 422);
        }
        if (strlen($newPassword) < 8) {
            Http::error('Das neue Passwort muss mindestens 8 Zeichen lang sein', 422);
        }
        if ($newPassword !== $newPasswordConfirmation) {
            Http::error('Die neuen Passwörter stimmen nicht überein', 422);
        }

        $stmt = Database::connection()->prepare(
            'SELECT password_hash, two_factor_enabled, two_factor_secret, two_factor_recovery_codes FROM admin_users WHERE id = ?'
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
            Http::error('Aktuelles Passwort ist falsch', 401);
        }

        if ((bool) $user['two_factor_enabled']) {
            if ($twoFactorCode === '') {
                Http::error('Bitte deinen 2FA-Code eingeben', 422);
            }

            $valid = Totp::verifyCode($user['two_factor_secret'] ?? '', $twoFactorCode);

            if (!$valid) {
                $hashes = $user['two_factor_recovery_codes'] ? json_decode($user['two_factor_recovery_codes'], true) : [];
                $remaining = RecoveryCodes::consume($hashes, $twoFactorCode);
                if ($remaining !== null) {
                    $valid = true;
                    $update = Database::connection()->prepare(
                        'UPDATE admin_users SET two_factor_recovery_codes = ? WHERE id = ?'
                    );
                    $update->execute([json_encode($remaining), $userId]);
                }
            }

            if (!$valid) {
                Http::error('2FA-Code ungültig oder abgelaufen', 401);
            }
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $update = Database::connection()->prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?');
        $update->execute([$newHash, $userId]);

        Http::send(['ok' => true]);
    }

    public static function logout(): void
    {
        $_SESSION = [];
        session_destroy();
        Http::send(['ok' => true]);
    }

    public static function me(): void
    {
        if (empty($_SESSION['admin_id'])) {
            Http::error('Nicht angemeldet', 401);
        }
        Http::send(self::userPayload((int) $_SESSION['admin_id'], $_SESSION['admin_username']));
    }

    private static function completeLogin(int $id, string $username): void
    {
        session_regenerate_id(true);
        $_SESSION['admin_id'] = $id;
        $_SESSION['admin_username'] = $username;
        unset($_SESSION['pending_2fa_user_id']);

        Http::send(self::userPayload($id, $username));
    }

    private static function userPayload(int $id, string $username): array
    {
        $stmt = Database::connection()->prepare('SELECT two_factor_enabled FROM admin_users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();

        return [
            'id' => $id,
            'username' => $username,
            'is_super_admin' => AuthMiddleware::isSuperAdmin($id),
            'two_factor_enabled' => (bool) ($row['two_factor_enabled'] ?? false),
            'permissions' => AuthMiddleware::effectivePermissions($id),
        ];
    }
}
