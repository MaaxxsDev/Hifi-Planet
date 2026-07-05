<?php

return [
    // Ausgelagert, damit das Admin-Panel (Einstellungen -> Datenbank) diese Datei
    // gezielt neu schreiben kann, ohne den Rest dieser Konfiguration anzufassen.
    'db' => require __DIR__ . '/db.php',
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
        // Muss zum Vite "base" passen und wird für Session-Cookie-Pfad genutzt.
        'base_path' => '/hifi',
        'session_name' => 'hifi_admin_session',
        // Öffentliche Domain der Seite (für sitemap.xml, robots.txt, Canonical-URLs). Ohne abschließenden Slash.
        'site_url' => 'https://hifi-planet.de',
    ],
    'scraper' => [
        'timeout' => 12,
        'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    ],
];
