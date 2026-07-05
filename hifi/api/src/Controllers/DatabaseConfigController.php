<?php

namespace App\Controllers;

use App\Support\Http;
use PDO;
use PDOException;

class DatabaseConfigController
{
    private static function configPath(): string
    {
        return __DIR__ . '/../../config/db.php';
    }

    private static function currentConfig(): array
    {
        return require self::configPath();
    }

    public static function show(): void
    {
        $config = self::currentConfig();
        unset($config['pass']);
        Http::send(['config' => $config, 'has_password' => (self::currentConfig()['pass'] ?? '') !== '']);
    }

    public static function update(): void
    {
        $body = Http::jsonBody();
        $current = self::currentConfig();

        $host = trim($body['host'] ?? '');
        $name = trim($body['name'] ?? '');
        $user = trim($body['user'] ?? '');
        $charset = trim($body['charset'] ?? '') ?: 'utf8mb4';
        // Leeres Passwort im Formular = aktuelles Passwort beibehalten.
        $pass = ($body['password'] ?? '') !== '' ? $body['password'] : $current['pass'];

        if ($host === '' || $name === '' || $user === '') {
            Http::error('Host, Datenbankname und Benutzer sind erforderlich', 422);
        }

        $newConfig = ['host' => $host, 'name' => $name, 'user' => $user, 'pass' => $pass, 'charset' => $charset];

        // Erst mit den NEUEN Zugangsdaten testen, bevor irgendetwas gespeichert wird –
        // damit man sich nicht versehentlich aussperrt.
        try {
            $dsn = "mysql:host={$host};dbname={$name};charset={$charset}";
            new PDO($dsn, $user, $pass, [PDO::ATTR_TIMEOUT => 5]);
        } catch (PDOException $e) {
            Http::error('Verbindung mit diesen Zugangsdaten fehlgeschlagen: ' . $e->getMessage(), 422);
        }

        $php = "<?php\n\n// Wird über das Admin-Panel (Einstellungen -> Datenbank) verwaltet.\n"
            . "// Diese Datei wird bei Änderungen automatisch neu geschrieben.\n"
            . "return " . var_export($newConfig, true) . ";\n";

        if (@file_put_contents(self::configPath(), $php) === false) {
            Http::error('Verbindung erfolgreich getestet, aber die Konfigurationsdatei konnte nicht geschrieben werden (Dateirechte prüfen).', 500);
        }

        Http::send(['ok' => true]);
    }
}
