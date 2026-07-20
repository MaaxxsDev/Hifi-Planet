<?php

namespace App\Controllers;

use App\Config\Database;
use App\Services\GooglePlacesReviewsFetcher;
use App\Support\Http;

class GoogleReviewsController
{
    /** Admin: aktuelle Konfiguration + letzter Abruf-Stand (nie den API-Key selbst zurückgeben). */
    public static function show(): void
    {
        $row = self::settingsRow();

        Http::send([
            'place_id' => $row['google_place_id'] ?? null,
            'has_api_key' => ($row['google_places_api_key'] ?? '') !== '',
            'rating' => $row['google_rating'] !== null ? (float) $row['google_rating'] : null,
            'rating_count' => $row['google_rating_count'] !== null ? (int) $row['google_rating_count'] : null,
            'updated_at' => $row['google_reviews_updated_at'] ?? null,
            'error' => $row['google_reviews_error'] ?? null,
        ]);
    }

    /** Admin: Place-ID + (optional) API-Key speichern. Leeres Key-Feld = bestehenden Key behalten. */
    public static function update(): void
    {
        $body = Http::jsonBody();
        $placeId = trim($body['place_id'] ?? '');
        $apiKey = trim($body['api_key'] ?? '');

        $db = Database::connection();
        $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');

        if ($apiKey !== '') {
            $stmt = $db->prepare('UPDATE app_settings SET google_place_id = ?, google_places_api_key = ? WHERE id = 1');
            $stmt->execute([$placeId ?: null, $apiKey]);
        } else {
            $stmt = $db->prepare('UPDATE app_settings SET google_place_id = ? WHERE id = 1');
            $stmt->execute([$placeId ?: null]);
        }

        self::show();
    }

    /** Admin: Refresh sofort auslösen (nicht erst auf den naechtlichen Cron warten). */
    public static function refresh(): void
    {
        $row = self::settingsRow();
        $placeId = $row['google_place_id'] ?? '';
        $apiKey = $row['google_places_api_key'] ?? '';

        if ($placeId === '' || $apiKey === '') {
            Http::error('Bitte zuerst Place-ID und API-Key eintragen und speichern.', 422);
        }

        $result = (new GooglePlacesReviewsFetcher())->refreshAndStore(Database::connection(), $apiKey, $placeId);
        if (!$result['ok']) {
            Http::error($result['error'], 502);
        }

        self::show();
    }

    /** Öffentlich: was die Startseite anzeigt - ausschließlich der zuletzt erfolgreich gecachte Stand. */
    public static function publicReviews(): void
    {
        $row = self::settingsRow();
        $rating = $row['google_rating'] !== null ? (float) $row['google_rating'] : null;
        $ratingCount = $row['google_rating_count'] !== null ? (int) $row['google_rating_count'] : null;

        $reviews = [];
        if ($rating !== null) {
            $stmt = Database::connection()->query(
                'SELECT author_name, profile_photo_url, rating, review_text FROM google_reviews ORDER BY sort_order'
            );
            $reviews = $stmt->fetchAll();
        }

        Http::send(['rating' => $rating, 'rating_count' => $ratingCount, 'reviews' => $reviews]);
    }

    private static function settingsRow(): array
    {
        try {
            $stmt = Database::connection()->query(
                'SELECT google_place_id, google_places_api_key, google_rating, google_rating_count, google_reviews_updated_at, google_reviews_error FROM app_settings WHERE id = 1'
            );
            return $stmt->fetch() ?: [];
        } catch (\Throwable $e) {
            // Spalten fehlen noch (vor Schema-Migration).
            return [];
        }
    }
}
