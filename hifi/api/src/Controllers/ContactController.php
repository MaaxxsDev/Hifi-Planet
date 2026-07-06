<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use PHPMailer\PHPMailer\PHPMailer;

class ContactController
{
    public static function store(): void
    {
        $body = Http::jsonBody();
        $name = trim($body['name'] ?? '');
        $email = trim($body['email'] ?? '');

        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Http::error('Name und gültige E-Mail-Adresse erforderlich', 422);
        }

        $db = Database::connection();
        $packageId = !empty($body['package_id']) ? (int) $body['package_id'] : null;
        $selectedUpgrades = self::resolveUpgrades($db, $packageId, $body['upgrade_ids'] ?? []);

        $stmt = $db->prepare(
            'INSERT INTO contact_requests
                (name, email, phone, vin, message, brand_name, model_name, package_name, product_name, package_id, package_product_id, selected_upgrades)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $name,
            $email,
            $body['phone'] ?? null,
            $body['vin'] ?? null,
            $body['message'] ?? null,
            $body['brand_name'] ?? null,
            $body['model_name'] ?? null,
            $body['package_name'] ?? null,
            $body['product_name'] ?? null,
            $packageId,
            !empty($body['package_product_id']) ? (int) $body['package_product_id'] : null,
            $selectedUpgrades ? json_encode($selectedUpgrades) : null,
        ]);

        $id = (int) $db->lastInsertId();
        self::sendNotificationMail($body, $name, $email, $selectedUpgrades);

        Http::send(['ok' => true, 'id' => $id], 201);
    }

    /**
     * Liest die vom Kunden ausgewählten Upgrades serverseitig aus der DB (statt dem Client zu
     * vertrauen), damit Name/Preis in der Anfrage nicht manipuliert werden können.
     */
    private static function resolveUpgrades(\PDO $db, ?int $packageId, mixed $upgradeIds): array
    {
        if (!$packageId || !is_array($upgradeIds) || count($upgradeIds) === 0) {
            return [];
        }

        $ids = array_values(array_unique(array_map('intval', $upgradeIds)));
        $placeholders = implode(',', array_fill(0, count($ids), '?'));

        $stmt = $db->prepare(
            "SELECT id, name, price FROM package_upgrades WHERE package_id = ? AND id IN ($placeholders)"
        );
        $stmt->execute([$packageId, ...$ids]);

        return $stmt->fetchAll();
    }

    public static function index(): void
    {
        $stmt = Database::connection()->query(
            'SELECT id, name, email, phone, vin, message, brand_name, model_name, package_name, product_name,
                    selected_upgrades, status, created_at
             FROM contact_requests ORDER BY created_at DESC'
        );
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['selected_upgrades'] = $row['selected_upgrades'] ? json_decode($row['selected_upgrades'], true) : [];
        }
        unset($row);
        Http::send($rows);
    }

    public static function updateStatus(array $params): void
    {
        $body = Http::jsonBody();
        $status = $body['status'] ?? '';

        if (!in_array($status, ['new', 'in_progress', 'done'], true)) {
            Http::error('Ungültiger Status', 422);
        }

        $stmt = Database::connection()->prepare('UPDATE contact_requests SET status = ? WHERE id = ?');
        $stmt->execute([$status, (int) $params['id']]);
        Http::send(['ok' => true]);
    }

    public static function destroy(array $params): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM contact_requests WHERE id = ?');
        $stmt->execute([(int) $params['id']]);
        Http::send(['ok' => true]);
    }

    private static function sendNotificationMail(array $body, string $name, string $email, array $selectedUpgrades = []): void
    {
        $config = require __DIR__ . '/../../config/config.php';
        $mailConfig = $config['mail'];

        if (empty($mailConfig['host'])) {
            return;
        }

        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $mailConfig['host'];
            $mail->Port = $mailConfig['port'];
            $mail->SMTPAuth = true;
            $mail->Username = $mailConfig['username'];
            $mail->Password = $mailConfig['password'];
            $mail->SMTPSecure = $mailConfig['encryption'];
            $mail->CharSet = 'UTF-8';

            $mail->setFrom($mailConfig['from_email'], $mailConfig['from_name']);
            $mail->addAddress($mailConfig['to_email']);
            $mail->addReplyTo($email, $name);

            $context = trim(sprintf(
                "Marke: %s\nModell: %s\nPaket: %s\nProdukt: %s",
                $body['brand_name'] ?? '-',
                $body['model_name'] ?? '-',
                $body['package_name'] ?? '-',
                $body['product_name'] ?? '-'
            ));

            $upgradesText = '-';
            if ($selectedUpgrades) {
                $upgradesText = implode("\n", array_map(
                    fn($u) => sprintf('- %s (%.2f €)', $u['name'], $u['price']),
                    $selectedUpgrades
                ));
            }

            $mail->Subject = 'Neue Kontaktanfrage von ' . $name;
            $mail->Body = "Name: {$name}\nE-Mail: {$email}\nTelefon: " . ($body['phone'] ?? '-')
                . "\nFahrgestellnummer (FIN): " . ($body['vin'] ?? '-') . "\n\n"
                . $context . "\n\nGewünschte Upgrades:\n" . $upgradesText . "\n\nNachricht:\n" . ($body['message'] ?? '-');

            $mail->send();
        } catch (\Throwable $e) {
            // Mailversand ist best effort – die Anfrage ist bereits in der DB gespeichert.
        }
    }
}
