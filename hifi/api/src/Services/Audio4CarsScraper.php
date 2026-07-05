<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;

class Audio4CarsScraper
{
    private int $timeout;
    private string $userAgent;

    public function __construct(int $timeout = 12, string $userAgent = 'Mozilla/5.0')
    {
        $this->timeout = $timeout;
        $this->userAgent = $userAgent;
    }

    /**
     * @return array{ok: bool, name?: string, price?: float, currency?: string, image?: ?string, error?: string}
     */
    public function scrape(string $url): array
    {
        if (!preg_match('#^https://www\.audio4cars\.de/#', $url)) {
            return ['ok' => false, 'error' => 'URL muss auf www.audio4cars.de zeigen'];
        }

        $html = $this->fetch($url);
        if ($html === null) {
            return ['ok' => false, 'error' => 'Seite konnte nicht geladen werden'];
        }

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML($html);
        libxml_clear_errors();
        $xpath = new DOMXPath($dom);

        $title = $this->firstText($xpath, "//h1[contains(@class,'product_title')]");
        if ($title === null) {
            $title = $this->firstText($xpath, '//meta[@property="og:title"]/@content');
        }

        $priceText = $this->firstText(
            $xpath,
            "(//p[contains(@class,'price')]//ins//span[contains(@class,'woocommerce-Price-amount')]//bdi)[1]"
        );
        if ($priceText === null) {
            $priceText = $this->firstText(
                $xpath,
                "(//p[contains(@class,'price')]//span[contains(@class,'woocommerce-Price-amount')]//bdi)[1]"
            );
        }

        if ($title === null || $priceText === null) {
            return ['ok' => false, 'error' => 'Preis/Titel konnten nicht gefunden werden (Seitenstruktur geändert?)'];
        }

        $price = $this->parseGermanPrice($priceText);
        if ($price === null) {
            return ['ok' => false, 'error' => 'Preis konnte nicht geparst werden: ' . $priceText];
        }

        $image = $this->firstText($xpath, '//meta[@property="og:image"]/@content');

        return [
            'ok' => true,
            'name' => trim($title),
            'price' => $price,
            'currency' => 'EUR',
            'image' => $image,
        ];
    }

    private function fetch(string $url): ?string
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_USERAGENT => $this->userAgent,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($body === false || $error !== '' || $status >= 400) {
            return null;
        }

        return $body;
    }

    private function firstText(DOMXPath $xpath, string $query): ?string
    {
        $nodes = $xpath->query($query);
        if ($nodes === false || $nodes->length === 0) {
            return null;
        }
        return trim($nodes->item(0)->textContent);
    }

    private function parseGermanPrice(string $text): ?float
    {
        $clean = preg_replace('/[^0-9,.]/', '', $text);
        $clean = str_replace('.', '', $clean);
        $clean = str_replace(',', '.', $clean);

        return is_numeric($clean) ? (float) $clean : null;
    }
}
