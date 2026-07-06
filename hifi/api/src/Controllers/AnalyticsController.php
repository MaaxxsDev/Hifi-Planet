<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\GoogleAnalyticsReporting;
use App\Support\Http;

class AnalyticsController
{
    public static function show(): void
    {
        $propertyId = null;
        try {
            $stmt = Database::connection()->query('SELECT ga_property_id FROM app_settings WHERE id = 1');
            $row = $stmt->fetch();
            $propertyId = ($row['ga_property_id'] ?? '') !== '' ? $row['ga_property_id'] : null;
        } catch (\Throwable $e) {
            // Spalte fehlt noch (vor Schema-Migration) - Default (null) bleibt bestehen.
        }

        Http::send([
            'ga_property_id' => $propertyId,
            'has_credentials' => GoogleAnalyticsReporting::hasCredentials(),
        ]);
    }

    public static function update(): void
    {
        $body = Http::jsonBody();
        $propertyId = trim($body['ga_property_id'] ?? '');
        $serviceAccountJson = trim($body['service_account_json'] ?? '');

        if ($serviceAccountJson !== '') {
            $decoded = json_decode($serviceAccountJson, true);
            if (!is_array($decoded) || empty($decoded['client_email']) || empty($decoded['private_key'])) {
                Http::error('Das eingefügte JSON sieht nicht wie ein gültiger Google-Service-Account-Schlüssel aus (client_email/private_key fehlen).', 422);
            }
            if (@file_put_contents(GoogleAnalyticsReporting::credentialsPath(), $serviceAccountJson) === false) {
                Http::error('Service-Account-JSON konnte nicht gespeichert werden (Dateirechte prüfen).', 500);
            }
        }

        $db = Database::connection();
        $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');
        $stmt = $db->prepare('UPDATE app_settings SET ga_property_id = ? WHERE id = 1');
        $stmt->execute([$propertyId ?: null]);

        self::show();
    }

    public static function report(): void
    {
        $propertyId = null;
        try {
            $stmt = Database::connection()->query('SELECT ga_property_id FROM app_settings WHERE id = 1');
            $row = $stmt->fetch();
            $propertyId = ($row['ga_property_id'] ?? '') !== '' ? $row['ga_property_id'] : null;
        } catch (\Throwable $e) {
            // Spalte fehlt noch (vor Schema-Migration).
        }

        if (!$propertyId || !GoogleAnalyticsReporting::hasCredentials()) {
            Http::send(['configured' => false]);
        }

        try {
            $report = GoogleAnalyticsReporting::fetchDashboardReport($propertyId);
        } catch (\Throwable $e) {
            Http::error($e->getMessage(), 502);
        }

        Http::send(['configured' => true] + $report);
    }
}
