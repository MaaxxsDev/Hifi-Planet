<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Support\Http;

class MaintenanceController
{
    /** Liest die Wartungsmodus-Flags, mit sicheren Defaults falls die Zeile/Tabelle noch fehlt. */
    public static function current(): array
    {
        try {
            $stmt = Database::connection()->query('SELECT * FROM app_settings WHERE id = 1');
            $row = $stmt->fetch();
        } catch (\Throwable $e) {
            $row = false;
        }

        if (!$row) {
            $row = [
                'maintenance_global' => 0, 'maintenance_global_message' => null,
                'maintenance_services' => 0, 'maintenance_services_message' => null,
                'maintenance_vehicles' => 0, 'maintenance_vehicles_message' => null,
            ];
        }

        return [
            'global' => ['enabled' => (bool) $row['maintenance_global'], 'message' => $row['maintenance_global_message']],
            'services' => ['enabled' => (bool) $row['maintenance_services'], 'message' => $row['maintenance_services_message']],
            'vehicles' => ['enabled' => (bool) $row['maintenance_vehicles'], 'message' => $row['maintenance_vehicles_message']],
        ];
    }

    public static function status(): void
    {
        Http::send(self::current());
    }

    public static function update(): void
    {
        $body = Http::jsonBody();
        $db = Database::connection();

        $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');
        $stmt = $db->prepare(
            'UPDATE app_settings SET
                maintenance_global = ?, maintenance_global_message = ?,
                maintenance_services = ?, maintenance_services_message = ?,
                maintenance_vehicles = ?, maintenance_vehicles_message = ?
             WHERE id = 1'
        );
        $stmt->execute([
            !empty($body['global']['enabled']) ? 1 : 0,
            $body['global']['message'] ?? null,
            !empty($body['services']['enabled']) ? 1 : 0,
            $body['services']['message'] ?? null,
            !empty($body['vehicles']['enabled']) ? 1 : 0,
            $body['vehicles']['message'] ?? null,
        ]);

        Http::send(self::current());
    }

    // Diese Endpunkte werden sowohl von der öffentlichen Seite als auch von den
    // jeweiligen Admin-Verwaltungsseiten genutzt. Wer die passende "verwalten"-
    // Permission hat, darf seine eigene Verwaltung also auch während der
    // Wartung weiter benutzen – die Bypass-Permission ist nur für die
    // "Vorschau der echten öffentlichen Seite trotz Wartung" gedacht.
    private const SCOPE_MANAGE_PERMISSIONS = [
        'vehicles' => ['brands.manage', 'models.manage', 'packages.manage'],
        'services' => ['services.manage'],
    ];

    /**
     * Blockiert eine öffentliche Route, wenn der globale oder der übergebene
     * spezifische Wartungsmodus aktiv ist – außer für Admins mit der Permission
     * "maintenance.bypass" oder mit der zum Bereich passenden "verwalten"-Permission.
     */
    public static function guardPublic(?string $scope = null): void
    {
        if (!empty($_SESSION['admin_id'])) {
            $adminId = (int) $_SESSION['admin_id'];
            if (AuthMiddleware::userHasPermission($adminId, 'maintenance.bypass')) {
                return;
            }
            foreach (($scope !== null ? self::SCOPE_MANAGE_PERMISSIONS[$scope] ?? [] : []) as $managePermission) {
                if (AuthMiddleware::userHasPermission($adminId, $managePermission)) {
                    return;
                }
            }
        }

        $status = self::current();
        $blocked = $status['global']['enabled'] || ($scope !== null && !empty($status[$scope]['enabled']));

        if ($blocked) {
            $message = $status['global']['enabled']
                ? ($status['global']['message'] ?: 'Diese Seite befindet sich aktuell im Wartungsmodus.')
                : ($status[$scope]['message'] ?? 'Dieser Bereich befindet sich aktuell im Wartungsmodus.');
            Http::error($message, 503);
        }
    }
}
