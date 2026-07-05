<?php

return [
    // Ausgelagert, damit das Admin-Panel (Einstellungen -> Datenbank) diese Datei
    // gezielt neu schreiben kann, ohne den Rest dieser Konfiguration anzufassen.
    // Existiert db.php noch nicht (frischer Server vor der Ersteinrichtung), wird
    // hier bewusst NICHT fatal abgebrochen, damit /setup überhaupt erreichbar ist.
    'db' => is_file(__DIR__ . '/db.php')
        ? require __DIR__ . '/db.php'
        : ['host' => '', 'name' => '', 'user' => '', 'pass' => '', 'charset' => 'utf8mb4'],
    // Einmalpasswort für den Ersteinrichtungs-Assistenten unter /setup (siehe setup.php.example).
    // Liegt in einer eigenen, nicht versionierten Datei, genau wie db.php.
    'setup_password' => is_file(__DIR__ . '/setup.php') ? require __DIR__ . '/setup.php' : null,
    'mail' => [
        // Vom Betreiber auszufüllen (z.B. eigenes Postfach oder Transactional-Mail-Anbieter).
        // Solange 'host' leer ist, wird der Mailversand übersprungen (Anfrage wird trotzdem in der DB gespeichert).
        'host' => '',
        'port' => 587,
        'username' => '',
        'password' => '',
        'encryption' => 'tls', // 'tls' oder 'ssl'
        'from_email' => 'kontakt@example.com',
        'from_name' => 'HifiPlanet',
        'to_email' => 'kontakt@example.com',
    ],
    'app' => [
        // Muss zum Vite "base" passen und wird für Session-Cookie-Pfad und Upload-URLs
        // genutzt. Lokal (XAMPP) ist das /hifi, im IONOS-Deploy-Now-Build wird beim
        // Bauen eine base_path.php mit '/' geschrieben (siehe .github Workflow).
        'base_path' => is_file(__DIR__ . '/base_path.php') ? require __DIR__ . '/base_path.php' : '/hifi',
        'session_name' => 'hifi_admin_session',
        // Öffentliche Domain der Seite (für sitemap.xml, robots.txt, Canonical-URLs). Ohne abschließenden Slash.
        'site_url' => 'https://hifi-planet.de',
    ],
    'scraper' => [
        'timeout' => 12,
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    ],
];
