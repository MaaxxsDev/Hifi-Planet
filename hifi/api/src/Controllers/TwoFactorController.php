<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Support\Http;
use App\Support\RecoveryCodes;
use App\Support\Totp;

class TwoFactorController
{
    public static function setup(): void
    {
        AuthMiddleware::requireAdmin();
        $username = $_SESSION['admin_username'];

        $secret = Totp::generateSecret();
        $_SESSION['pending_2fa_secret'] = $secret;

        Http::send([
            'secret' => $secret,
            'otpauth_url' => Totp::provisioningUri($secret, $username),
        ]);
    }

    public static function enable(): void
    {
        $userId = AuthMiddleware::requireAdmin();
        $body = Http::jsonBody();
        $code = trim($body['code'] ?? '');

        if (empty($_SESSION['pending_2fa_secret'])) {
            Http::error('Bitte zuerst die 2FA-Einrichtung starten', 400);
        }
        $secret = $_SESSION['pending_2fa_secret'];

        if (!Totp::verifyCode($secret, $code)) {
            Http::error('Code ungültig. Bitte erneut versuchen.', 422);
        }

        $recoveryCodes = RecoveryCodes::generate();
        $hashes = RecoveryCodes::hashAll($recoveryCodes);

        $stmt = Database::connection()->prepare(
            'UPDATE admin_users SET two_factor_secret = ?, two_factor_enabled = 1, two_factor_recovery_codes = ? WHERE id = ?'
        );
        $stmt->execute([$secret, json_encode($hashes), $userId]);

        unset($_SESSION['pending_2fa_secret']);

        Http::send(['ok' => true, 'recovery_codes' => $recoveryCodes]);
    }

    public static function disable(): void
    {
        $userId = AuthMiddleware::requireAdmin();
        $body = Http::jsonBody();
        $password = (string) ($body['password'] ?? '');

        $stmt = Database::connection()->prepare('SELECT password_hash FROM admin_users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Http::error('Passwort falsch', 401);
        }

        $update = Database::connection()->prepare(
            'UPDATE admin_users SET two_factor_secret = NULL, two_factor_enabled = 0, two_factor_recovery_codes = NULL WHERE id = ?'
        );
        $update->execute([$userId]);

        Http::send(['ok' => true]);
    }

    public static function regenerateRecoveryCodes(): void
    {
        $userId = AuthMiddleware::requireAdmin();
        $body = Http::jsonBody();
        $password = (string) ($body['password'] ?? '');

        $stmt = Database::connection()->prepare(
            'SELECT password_hash, two_factor_enabled FROM admin_users WHERE id = ?'
        );
        $stmt->execute([$userId]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Http::error('Passwort falsch', 401);
        }
        if (!$user['two_factor_enabled']) {
            Http::error('2FA ist nicht aktiv', 400);
        }

        $recoveryCodes = RecoveryCodes::generate();
        $hashes = RecoveryCodes::hashAll($recoveryCodes);

        $update = Database::connection()->prepare('UPDATE admin_users SET two_factor_recovery_codes = ? WHERE id = ?');
        $update->execute([json_encode($hashes), $userId]);

        Http::send(['ok' => true, 'recovery_codes' => $recoveryCodes]);
    }
}
