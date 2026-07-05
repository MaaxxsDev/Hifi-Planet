<?php

namespace App\Controllers;

use App\Support\Http;

class UploadController
{
    private const ALLOWED_MIME = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];
    private const MAX_BYTES = 5 * 1024 * 1024;

    public static function store(): void
    {
        if (empty($_FILES['file'])) {
            Http::error('Keine Datei übermittelt', 422);
        }

        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Http::error('Upload fehlgeschlagen', 422);
        }
        if ($file['size'] > self::MAX_BYTES) {
            Http::error('Datei zu groß (max. 5 MB)', 422);
        }

        $mime = mime_content_type($file['tmp_name']);
        if (!isset(self::ALLOWED_MIME[$mime])) {
            Http::error('Nur JPG, PNG oder WEBP erlaubt', 422);
        }

        $extension = self::ALLOWED_MIME[$mime];
        $filename = bin2hex(random_bytes(16)) . '.' . $extension;
        $destination = __DIR__ . '/../../uploads/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            Http::error('Datei konnte nicht gespeichert werden', 500);
        }

        $config = require __DIR__ . '/../../config/config.php';
        $prefix = rtrim($config['app']['base_path'], '/') . '/api/uploads/';

        Http::send(['path' => $prefix . $filename], 201);
    }
}
