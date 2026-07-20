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
        'ga_measurement_id' => null,
        'package_card_theme' => 'graphite',
        'package_card_layout' => 'strip',
    ];

    public static function show(): void
    {
        try {
            $stmt = Database::connection()->query(
                'SELECT phone, whatsapp, contact_email, hero_image_path, ga_measurement_id, package_card_theme, package_card_layout FROM app_settings WHERE id = 1'
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

    private const PACKAGE_CARD_THEMES = ['graphite', 'deep-blue', 'warm-bronze'];
    private const PACKAGE_CARD_LAYOUTS = ['grid', 'strip', 'coverflow'];

    public static function update(): void
    {
        $body = Http::jsonBody();
        $db = Database::connection();

        $packageCardTheme = trim($body['package_card_theme'] ?? '') ?: 'graphite';
        if (!in_array($packageCardTheme, self::PACKAGE_CARD_THEMES, true)) {
            $packageCardTheme = 'graphite';
        }

        $packageCardLayout = trim($body['package_card_layout'] ?? '') ?: 'strip';
        if (!in_array($packageCardLayout, self::PACKAGE_CARD_LAYOUTS, true)) {
            $packageCardLayout = 'strip';
        }

        $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');
        $stmt = $db->prepare(
            'UPDATE app_settings SET phone = ?, whatsapp = ?, contact_email = ?, hero_image_path = ?, ga_measurement_id = ?, package_card_theme = ?, package_card_layout = ? WHERE id = 1'
        );
        $stmt->execute([
            trim($body['phone'] ?? '') ?: null,
            trim($body['whatsapp'] ?? '') ?: null,
            trim($body['contact_email'] ?? '') ?: null,
            trim($body['hero_image_path'] ?? '') ?: null,
            trim($body['ga_measurement_id'] ?? '') ?: null,
            $packageCardTheme,
            $packageCardLayout,
        ]);

        self::show();
    }
}
