<?php

namespace App\Controllers;

use App\Support\Http;
use App\Support\Permissions;

class PermissionCatalogController
{
    public static function index(): void
    {
        $catalog = [];
        foreach (Permissions::CATALOG as $key => $label) {
            $catalog[] = ['key' => $key, 'label' => $label];
        }
        Http::send($catalog);
    }
}
