<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

$config = require __DIR__ . '/../config/config.php';
$siteUrl = rtrim($config['app']['site_url'], '/');

$db = Database::connection();
$models = $db->query(
    'SELECT b.slug AS brand_slug, m.slug AS model_slug, m.updated_at
     FROM car_models m JOIN brands b ON b.id = m.brand_id'
)->fetchAll();
$brands = $db->query('SELECT slug, updated_at FROM brands')->fetchAll();

$urls = [
    ['loc' => '/', 'priority' => '1.0'],
    ['loc' => '/fahrzeuge', 'priority' => '0.9'],
    ['loc' => '/kontakt', 'priority' => '0.5'],
];

foreach ($brands as $brand) {
    $urls[] = ['loc' => "/fahrzeuge/{$brand['slug']}", 'priority' => '0.8', 'lastmod' => $brand['updated_at']];
}
foreach ($models as $model) {
    $urls[] = [
        'loc' => "/fahrzeuge/{$model['brand_slug']}/{$model['model_slug']}",
        'priority' => '0.7',
        'lastmod' => $model['updated_at'],
    ];
}

header('Content-Type: application/xml; charset=utf-8');
echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $url) {
    echo "  <url>\n";
    echo '    <loc>' . htmlspecialchars($siteUrl . $url['loc']) . "</loc>\n";
    if (!empty($url['lastmod'])) {
        echo '    <lastmod>' . date('Y-m-d', strtotime($url['lastmod'])) . "</lastmod>\n";
    }
    echo '    <priority>' . $url['priority'] . "</priority>\n";
    echo "  </url>\n";
}
echo '</urlset>';
