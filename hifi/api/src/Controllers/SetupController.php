<?php

namespace App\Controllers;

use App\Support\Http;
use App\Support\Schema;
use PDO;

class SetupController
{
    // Öffentliche Endpunkte (es gibt ja noch keinen Admin) - daher prüft jede
    // schreibende Aktion zusätzlich selbst per requireUnlocked(), ob wirklich noch
    // kein Admin-Account existiert. Sobald einer existiert, sperrt sich der
    // komplette Assistent dauerhaft selbst, unabhängig vom Einmalpasswort.

    private static function configuredPassword(): ?string
    {
        $config = require __DIR__ . '/../../config/config.php';
        $pw = $config['setup_password'] ?? null;
        return ($pw !== null && $pw !== '') ? $pw : null;
    }

    private static function currentDbConfig(): array
    {
        $path = __DIR__ . '/../../config/db.php';
        return is_file($path)
            ? require $path
            : ['host' => '', 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'];
    }

    private static function tryConnect(?array $overrideConfig = null): ?PDO
    {
        $db = $overrideConfig ?? self::currentDbConfig();
        try {
            $dsn = "mysql:host={$db['host']};dbname={$db['name']};charset=" . ($db['charset'] ?? 'utf8mb4');
            return new PDO($dsn, $db['user'], $db['pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5,
            ]);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /** @return string[] */
    private static function existingTables(PDO $db): array
    {
        $stmt = $db->query('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE()');
        return $stmt->fetchAll(PDO::FETCH_COLUMN);
    }

    private static function schemaOk(PDO $db): bool
    {
        $existingTables = self::existingTables($db);
        foreach (array_keys(Schema::CREATE_STATEMENTS) as $table) {
            if (!in_array($table, $existingTables, true)) {
                return false;
            }
        }
        return true;
    }

    /** Ermittelt den Fortschritt, ohne dass irgendwo eine Exception nach außen dringt. */
    private static function buildStatus(): array
    {
        $db = self::tryConnect();
        $databaseOk = $db !== null;
        $schemaOk = $databaseOk && self::schemaOk($db);

        $adminOk = false;
        if ($schemaOk) {
            try {
                $adminOk = ((int) $db->query('SELECT COUNT(*) FROM admin_users')->fetchColumn()) > 0;
            } catch (\Throwable $e) {
                $adminOk = false;
            }
        }

        return [
            'needs_setup' => !$adminOk,
            'has_setup_password' => self::configuredPassword() !== null,
            'steps' => [
                'database' => ['ok' => $databaseOk],
                'schema' => ['ok' => $schemaOk],
                'admin' => ['ok' => $adminOk],
            ],
        ];
    }

    public static function status(): void
    {
        Http::send(self::buildStatus());
    }

    private static function requireUnlocked(): array
    {
        $status = self::buildStatus();
        if (!$status['needs_setup']) {
            Http::error('Die Ersteinrichtung ist bereits abgeschlossen.', 403);
        }
        return $status;
    }

    public static function verifyPassword(): void
    {
        self::requireUnlocked();

        $configured = self::configuredPassword();
        $body = Http::jsonBody();
        $given = (string) ($body['password'] ?? '');

        if ($configured === null || $given === '' || !hash_equals($configured, $given)) {
            Http::error('Einmalpasswort falsch oder nicht konfiguriert.', 401);
        }

        $_SESSION['setup_verified'] = true;
        Http::send(['ok' => true]);
    }

    private static function requireVerified(): void
    {
        self::requireUnlocked();
        if (empty($_SESSION['setup_verified'])) {
            Http::error('Bitte zuerst das Einmalpasswort bestätigen.', 401);
        }
    }

    public static function saveDatabase(): void
    {
        self::requireVerified();

        $body = Http::jsonBody();
        $host = trim($body['host'] ?? '');
        $name = trim($body['name'] ?? '');
        $user = trim($body['user'] ?? '');
        $pass = (string) ($body['password'] ?? '');
        $charset = trim($body['charset'] ?? '') ?: 'utf8mb4';

        if ($host === '' || $name === '' || $user === '') {
            Http::error('Host, Datenbankname und Benutzer sind erforderlich', 422);
        }

        $newConfig = ['host' => $host, 'name' => $name, 'user' => $user, 'pass' => $pass, 'charset' => $charset];

        if (self::tryConnect($newConfig) === null) {
            Http::error('Verbindung mit diesen Zugangsdaten fehlgeschlagen.', 422);
        }

        $php = "<?php\n\n// Wird über das Admin-Panel (Einstellungen -> Datenbank) verwaltet.\n"
            . "// Diese Datei wird bei Änderungen automatisch neu geschrieben.\n"
            . "return " . var_export($newConfig, true) . ";\n";

        if (@file_put_contents(__DIR__ . '/../../config/db.php', $php) === false) {
            Http::error('Verbindung erfolgreich getestet, aber die Konfigurationsdatei konnte nicht geschrieben werden.', 500);
        }

        Http::send(['ok' => true, 'status' => self::buildStatus()]);
    }

    public static function migrateSchema(): void
    {
        self::requireVerified();

        $db = self::tryConnect();
        if ($db === null) {
            Http::error('Datenbankverbindung nicht möglich.', 422);
        }

        $existingTables = self::existingTables($db);
        $actions = [];
        foreach (Schema::CREATE_STATEMENTS as $table => $createSql) {
            if (!in_array($table, $existingTables, true)) {
                try {
                    $db->exec($createSql);
                    $actions[] = "Tabelle `$table` angelegt";
                } catch (\Throwable $e) {
                    $actions[] = "FEHLER bei `$table`: " . $e->getMessage();
                }
            }
        }

        Http::send(['ok' => true, 'actions' => $actions, 'status' => self::buildStatus()]);
    }

    public static function createAdmin(): void
    {
        self::requireVerified();
        $status = self::buildStatus();

        if (!$status['steps']['schema']['ok']) {
            Http::error('Bitte zuerst die Datenbankstruktur einrichten.', 422);
        }
        if ($status['steps']['admin']['ok']) {
            Http::error('Es existiert bereits ein Admin-Account.', 403);
        }

        $body = Http::jsonBody();
        $username = trim($body['username'] ?? '');
        $password = (string) ($body['password'] ?? '');

        if ($username === '') {
            Http::error('Benutzername erforderlich', 422);
        }
        if (strlen($password) < 8) {
            Http::error('Das Passwort muss mindestens 8 Zeichen lang sein', 422);
        }

        $db = self::tryConnect();
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $db->prepare('INSERT INTO admin_users (username, password_hash, is_super_admin) VALUES (?, ?, 1)');
        $stmt->execute([$username, $hash]);

        unset($_SESSION['setup_verified']);

        Http::send(['ok' => true]);
    }
}
