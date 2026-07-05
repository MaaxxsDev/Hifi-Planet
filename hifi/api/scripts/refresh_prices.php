<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Services\Audio4CarsScraper;

$config = require __DIR__ . '/../config/config.php';
$scraper = new Audio4CarsScraper($config['scraper']['timeout'], $config['scraper']['user_agent']);

$db = Database::connection();
$products = $db->query('SELECT id, source_url FROM package_products')->fetchAll();

$ok = 0;
$failed = 0;

foreach ($products as $product) {
    $result = $scraper->scrape($product['source_url']);

    if ($result['ok']) {
        $stmt = $db->prepare(
            'UPDATE package_products
             SET scraped_name = ?, scraped_price = ?, scraped_currency = ?, scraped_image_url = ?,
                 price_updated_at = NOW(), scrape_status = "ok", scrape_error = NULL
             WHERE id = ?'
        );
        $stmt->execute([$result['name'], $result['price'], $result['currency'], $result['image'], $product['id']]);
        $ok++;
    } else {
        $stmt = $db->prepare('UPDATE package_products SET scrape_status = "error", scrape_error = ? WHERE id = ?');
        $stmt->execute([$result['error'], $product['id']]);
        $failed++;
    }
}

echo "Preis-Refresh abgeschlossen: {$ok} OK, {$failed} Fehler (von " . count($products) . " Produkten).\n";
