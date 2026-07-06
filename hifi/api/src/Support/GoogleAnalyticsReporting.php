<?php

namespace App\Support;

/**
 * Serverseitige Anbindung an die Google Analytics Data API (GA4), damit sich Kennzahlen
 * im eigenen Admin-Dashboard anzeigen lassen - wie z.B. MonsterInsights das fuer WordPress
 * macht. Authentifizierung per Service-Account (JWT-Bearer-Flow), bewusst ohne die grosse
 * offizielle Google-API-PHP-Client-Bibliothek: nur ein signiertes JWT + zwei HTTP-Aufrufe,
 * das reicht fuer diesen einen Report-Endpunkt komplett aus.
 */
class GoogleAnalyticsReporting
{
    private const TOKEN_URI = 'https://oauth2.googleapis.com/token';
    private const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
    private const API_BASE = 'https://analyticsdata.googleapis.com/v1beta';

    public static function credentialsPath(): string
    {
        return __DIR__ . '/../../config/ga-service-account.json';
    }

    public static function hasCredentials(): bool
    {
        return is_file(self::credentialsPath());
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function credentials(): array
    {
        $raw = file_get_contents(self::credentialsPath());
        $data = json_decode((string) $raw, true);
        if (!is_array($data) || empty($data['client_email']) || empty($data['private_key'])) {
            throw new \RuntimeException('Service-Account-JSON ist unvollständig oder ungültig.');
        }
        return $data;
    }

    /**
     * Server-zu-Server-Authentifizierung per JWT-Bearer-Flow - kein Nutzer-Login/Consent-Screen
     * noetig, siehe https://developers.google.com/identity/protocols/oauth2/service-account.
     */
    private static function fetchAccessToken(array $credentials): string
    {
        $now = time();
        $header = self::base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $claims = self::base64UrlEncode(json_encode([
            'iss' => $credentials['client_email'],
            'scope' => self::SCOPE,
            'aud' => self::TOKEN_URI,
            'iat' => $now,
            'exp' => $now + 3600,
        ]));

        $signatureInput = $header . '.' . $claims;
        $privateKey = openssl_pkey_get_private($credentials['private_key']);
        if ($privateKey === false) {
            throw new \RuntimeException('Privater Schlüssel im Service-Account-JSON ist ungültig.');
        }
        openssl_sign($signatureInput, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $jwt = $signatureInput . '.' . self::base64UrlEncode($signature);

        $response = self::post(self::TOKEN_URI, http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]), ['Content-Type: application/x-www-form-urlencoded']);

        if (empty($response['access_token'])) {
            throw new \RuntimeException('Google-Token-Anfrage fehlgeschlagen: ' . ($response['error_description'] ?? $response['error'] ?? 'unbekannter Fehler'));
        }

        return $response['access_token'];
    }

    private static function post(string $url, string $body, array $headers): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => 15,
        ]);
        $raw = curl_exec($ch);
        if ($raw === false) {
            $error = curl_error($ch);
            curl_close($ch);
            throw new \RuntimeException('Verbindung zu Google fehlgeschlagen: ' . $error);
        }
        curl_close($ch);

        $data = json_decode((string) $raw, true);
        return is_array($data) ? $data : [];
    }

    private static function runReport(string $propertyId, string $token, array $body): array
    {
        $response = self::post(
            self::API_BASE . '/properties/' . $propertyId . ':runReport',
            json_encode($body),
            ['Authorization: Bearer ' . $token, 'Content-Type: application/json']
        );

        if (isset($response['error'])) {
            throw new \RuntimeException('Google Analytics Data API: ' . ($response['error']['message'] ?? 'unbekannter Fehler'));
        }

        return $response;
    }

    /**
     * Kennzahlen (Nutzer/Sitzungen/Seitenaufrufe je Tag) sowie die meistbesuchten Seiten
     * der letzten $days Tage - genau das, was das Dashboard-Widget anzeigt.
     */
    public static function fetchDashboardReport(string $propertyId, int $days = 7): array
    {
        $credentials = self::credentials();
        $token = self::fetchAccessToken($credentials);

        $daily = self::runReport($propertyId, $token, [
            'dateRanges' => [['startDate' => $days . 'daysAgo', 'endDate' => 'today']],
            'dimensions' => [['name' => 'date']],
            'metrics' => [['name' => 'activeUsers'], ['name' => 'sessions'], ['name' => 'screenPageViews']],
            'orderBys' => [['dimension' => ['dimensionName' => 'date']]],
        ]);

        $topPages = self::runReport($propertyId, $token, [
            'dateRanges' => [['startDate' => $days . 'daysAgo', 'endDate' => 'today']],
            'dimensions' => [['name' => 'pagePath']],
            'metrics' => [['name' => 'screenPageViews']],
            'orderBys' => [['metric' => ['metricName' => 'screenPageViews'], 'desc' => true]],
            'limit' => 5,
        ]);

        $dailyRows = array_map(fn($row) => [
            'date' => $row['dimensionValues'][0]['value'],
            'users' => (int) $row['metricValues'][0]['value'],
            'sessions' => (int) $row['metricValues'][1]['value'],
            'pageviews' => (int) $row['metricValues'][2]['value'],
        ], $daily['rows'] ?? []);

        $topPageRows = array_map(fn($row) => [
            'path' => $row['dimensionValues'][0]['value'],
            'pageviews' => (int) $row['metricValues'][0]['value'],
        ], $topPages['rows'] ?? []);

        return [
            'daily' => $dailyRows,
            'top_pages' => $topPageRows,
            'totals' => [
                'users' => array_sum(array_column($dailyRows, 'users')),
                'sessions' => array_sum(array_column($dailyRows, 'sessions')),
                'pageviews' => array_sum(array_column($dailyRows, 'pageviews')),
            ],
        ];
    }
}
