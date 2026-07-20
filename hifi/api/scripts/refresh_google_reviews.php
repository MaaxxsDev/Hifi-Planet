<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;
use App\Services\GooglePlacesReviewsFetcher;

$db = Database::connection();
$row = $db->query(
    'SELECT google_place_id, google_places_api_key FROM app_settings WHERE id = 1'
)->fetch();

$placeId = $row['google_place_id'] ?? '';
$apiKey = $row['google_places_api_key'] ?? '';

if ($placeId === '' || $apiKey === '') {
    echo "Google-Rezensionen-Refresh übersprungen: Place-ID oder API-Key ist im Admin-Bereich noch nicht hinterlegt.\n";
    exit(0);
}

$result = (new GooglePlacesReviewsFetcher())->refreshAndStore($db, $apiKey, $placeId);

if ($result['ok']) {
    echo "Google-Rezensionen-Refresh erfolgreich: Bewertung {$result['rating']} ({$result['rating_count']} Bewertungen gesamt), {$result['reviews_count']} Rezensionen gespeichert.\n";
} else {
    echo "Google-Rezensionen-Refresh fehlgeschlagen: {$result['error']}\n";
}
