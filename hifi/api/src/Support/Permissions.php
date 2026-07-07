<?php

namespace App\Support;

class Permissions
{
    public const CATALOG = [
        'brands.manage' => 'Marken verwalten',
        'models.manage' => 'Modelle verwalten',
        'packages.manage' => 'Pakete, Produkte & Upgrades verwalten',
        'services.manage' => 'Leistungen verwalten',
        'content.manage' => 'Startseiten-Inhalte (z. B. FAQ) verwalten',
        'gallery.manage' => 'Bildergalerie verwalten',
        'contact.manage' => 'Kontaktanfragen ansehen & bearbeiten',
        'contact.delete' => 'Kontaktanfragen löschen',
        'users.manage' => 'Benutzer verwalten',
        'permission_groups.manage' => 'Berechtigungsgruppen verwalten',
        'settings.manage' => 'Systemeinstellungen (Export/Import/Zurücksetzen) verwalten',
        'maintenance.bypass' => 'Wartungsmodus umgehen (Inhalte trotzdem sehen)',
    ];

    public static function isValid(string $permission): bool
    {
        return isset(self::CATALOG[$permission]);
    }

    /** @return string[] */
    public static function sanitizeList(array $permissions): array
    {
        return array_values(array_intersect(array_unique($permissions), array_keys(self::CATALOG)));
    }
}
