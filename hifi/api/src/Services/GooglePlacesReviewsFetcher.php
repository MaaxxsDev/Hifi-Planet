<?php

namespace App\Services;

use PDO;

/**
 * Holt Gesamtbewertung + die (von Google gewaehlten, max. 5) neuesten Rezensionen
 * eines Google-Business-Eintrags ueber die Places API (New) und cached sie in der
 * eigenen Datenbank (Tabelle google_reviews + app_settings.google_rating*). Die
 * oeffentliche Seite liest ausschliesslich aus diesem Cache - nie live von Google,
 * damit kein Seitenaufruf ein API-Kontingent verbraucht (siehe refresh_google_reviews.php
 * fuer den geplanten, taeglichen Refresh).
 */
class GooglePlacesReviewsFetcher
{
    private const ENDPOINT = 'https://places.googleapis.com/v1/places/';
    private const FIELD_MASK = 'displayName,rating,userRatingCount,reviews';

    private int $timeout;

    public function __construct(int $timeout = 12)
    {
        $this->timeout = $timeout;
    }

    /**
     * Reiner API-Aufruf ohne Datenbankzugriff - eigenstaendig testbar.
     * @return array{ok: bool, rating?: float, rating_count?: int, reviews?: array, error?: string}
     */
    public function fetch(string $apiKey, string $placeId): array
    {
        $ch = curl_init(self::ENDPOINT . rawurlencode($placeId));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => [
                'X-Goog-Api-Key: ' . $apiKey,
                'X-Goog-FieldMask: ' . self::FIELD_MASK,
                'Accept-Language: de',
            ],
        ]);
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($body === false || $curlError !== '') {
            return ['ok' => false, 'error' => 'Verbindung zu Google fehlgeschlagen: ' . $curlError];
        }

        $json = json_decode($body, true);

        if ($status !== 200) {
            $message = is_array($json) ? ($json['error']['message'] ?? null) : null;
            return ['ok' => false, 'error' => "Google-Antwort HTTP $status" . ($message ? ": $message" : '')];
        }

        if (!is_array($json)) {
            return ['ok' => false, 'error' => 'Ungültige Antwort von Google (kein JSON)'];
        }

        $reviews = [];
        foreach ((array) ($json['reviews'] ?? []) as $review) {
            $reviews[] = [
                'google_review_id' => is_string($review['name'] ?? null) ? $review['name'] : null,
                'author_name' => (string) ($review['authorAttribution']['displayName'] ?? 'Google-Nutzer'),
                'profile_photo_url' => $review['authorAttribution']['photoUri'] ?? null,
                'rating' => (int) ($review['rating'] ?? 5),
                'review_text' => $review['text']['text'] ?? ($review['originalText']['text'] ?? null),
                'relative_time_description' => $review['relativePublishTimeDescription'] ?? null,
                'review_time' => isset($review['publishTime']) ? strtotime((string) $review['publishTime']) ?: null : null,
            ];
        }

        return [
            'ok' => true,
            'rating' => isset($json['rating']) ? (float) $json['rating'] : null,
            'rating_count' => isset($json['userRatingCount']) ? (int) $json['userRatingCount'] : null,
            'reviews' => $reviews,
        ];
    }

    /**
     * Ruft fetch() auf und schreibt das Ergebnis in die Datenbank. Bei einem Fehler
     * bleiben zuvor erfolgreich geladene Rezensionen unangetastet (die Seite zeigt
     * dann weiter den letzten guten Stand) - nur die Fehlermeldung wird vermerkt,
     * damit sie im Admin-Bereich sichtbar ist.
     * @return array{ok: bool, error?: string, rating?: float, rating_count?: int, reviews_count?: int}
     */
    public function refreshAndStore(PDO $db, string $apiKey, string $placeId): array
    {
        if ($apiKey === '' || $placeId === '') {
            $error = 'Kein API-Key oder keine Place-ID hinterlegt';
            $this->recordError($db, $error);
            return ['ok' => false, 'error' => $error];
        }

        $result = $this->fetch($apiKey, $placeId);
        if (!$result['ok']) {
            $this->recordError($db, $result['error']);
            return $result;
        }

        $db->beginTransaction();
        try {
            $db->exec('DELETE FROM google_reviews');
            $stmt = $db->prepare(
                'INSERT INTO google_reviews
                    (google_review_id, author_name, profile_photo_url, rating, review_text, relative_time_description, review_time, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            foreach ($result['reviews'] as $i => $review) {
                $stmt->execute([
                    $review['google_review_id'],
                    $review['author_name'],
                    $review['profile_photo_url'],
                    $review['rating'],
                    $review['review_text'],
                    $review['relative_time_description'],
                    $review['review_time'],
                    $i,
                ]);
            }

            $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');
            $update = $db->prepare(
                'UPDATE app_settings
                 SET google_rating = ?, google_rating_count = ?, google_reviews_updated_at = NOW(), google_reviews_error = NULL
                 WHERE id = 1'
            );
            $update->execute([$result['rating'], $result['rating_count']]);

            $db->commit();
        } catch (\Throwable $e) {
            $db->rollBack();
            $error = 'Speichern fehlgeschlagen: ' . $e->getMessage();
            $this->recordError($db, $error);
            return ['ok' => false, 'error' => $error];
        }

        return [
            'ok' => true,
            'rating' => $result['rating'],
            'rating_count' => $result['rating_count'],
            'reviews_count' => count($result['reviews']),
        ];
    }

    private function recordError(PDO $db, string $error): void
    {
        $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');
        $stmt = $db->prepare('UPDATE app_settings SET google_reviews_error = ? WHERE id = 1');
        $stmt->execute([$error]);
    }
}
