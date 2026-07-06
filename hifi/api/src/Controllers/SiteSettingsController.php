<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;

class SiteSettingsController
{
    // Greifen, solange in den Einstellungen noch nichts eingetragen wurde -
    // entsprechen dem, was bisher fest im Code stand.
    private const DEFAULTS = [
        'phone' => '09373 20 62 390',
        'whatsapp' => null,
        'contact_email' => 'info@hifi-planet-amorbach.de',
        'hero_image_path' => null,
    ];

    public static function show(): void
    {
        try {
            $stmt = Database::connection()->query(
                'SELECT phone, whatsapp, contact_email, hero_image_path FROM app_settings WHERE id = 1'
            );
            $row = $stmt->fetch();
        } catch (\Throwable $e) {
            $row = false;
        }

        $row = $row ?: [];
        $result = [];
        foreach (self::DEFAULTS as $key => $default) {
            $result[$key] = ($row[$key] ?? null) !== null && $row[$key] !== '' ? $row[$key] : $default;
        }

        Http::send($result);
    }

    public static function update(): void
    {
        $body = Http::jsonBody();
        $db = Database::connection();

        $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');
        $stmt = $db->prepare(
            'UPDATE app_settings SET phone = ?, whatsapp = ?, contact_email = ?, hero_image_path = ? WHERE id = 1'
        );
        $stmt->execute([
            trim($body['phone'] ?? '') ?: null,
            trim($body['whatsapp'] ?? '') ?: null,
            trim($body['contact_email'] ?? '') ?: null,
            trim($body['hero_image_path'] ?? '') ?: null,
        ]);

        self::show();
    }
}
