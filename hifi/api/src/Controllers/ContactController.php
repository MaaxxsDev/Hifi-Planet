<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Mailer;

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
        $vars = self::templateVars($body, $name, $email, $selectedUpgrades);
        self::sendOwnerNotification($vars);
        self::sendCustomerConfirmation($vars, $email);

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

    /**
     * Baut die Platzhalter-Werte fuer beide Vorlagen (Kundenbestaetigung + Shop-Benachrichtigung)
     * einmal zentral, statt sie in jeder Mail-Methode einzeln zusammenzusetzen.
     */
    private static function templateVars(array $body, string $name, string $email, array $selectedUpgrades): array
    {
        $upgradesText = '-';
        if ($selectedUpgrades) {
            $upgradesText = implode("\n", array_map(
                fn($u) => sprintf('- %s (%.2f €)', $u['name'], $u['price']),
                $selectedUpgrades
            ));
        }

        return [
            'name' => $name,
            'email' => $email,
            'phone' => $body['phone'] ?? null,
            'vin' => $body['vin'] ?? null,
            'message' => $body['message'] ?? null,
            'brand' => $body['brand_name'] ?? null,
            'model' => $body['model_name'] ?? null,
            'package' => $body['package_name'] ?? null,
            'product' => $body['product_name'] ?? null,
            'upgrades' => $upgradesText,
        ];
    }

    private static function sendOwnerNotification(array $vars): void
    {
        $config = Mailer::resolveConfig();
        if (empty($config['host']) || empty($config['notify_email'])) {
            return;
        }

        try {
            $mail = Mailer::build($config);
            $mail->addAddress($config['notify_email']);
            $mail->addReplyTo($vars['email'], $vars['name']);
            $mail->Subject = Mailer::render($config['owner_subject'], $vars);
            $mail->Body = Mailer::render($config['owner_body'], $vars);
            $mail->send();
        } catch (\Throwable $e) {
            // Mailversand ist best effort – die Anfrage ist bereits in der DB gespeichert.
        }
    }

    private static function sendCustomerConfirmation(array $vars, string $email): void
    {
        $config = Mailer::resolveConfig();
        if (empty($config['host'])) {
            return;
        }

        try {
            $mail = Mailer::build($config);
            $mail->addAddress($email, $vars['name']);
            $mail->Subject = Mailer::render($config['customer_subject'], $vars);
            $mail->Body = Mailer::render($config['customer_body'], $vars);
            $mail->send();
        } catch (\Throwable $e) {
            // Mailversand ist best effort – die Anfrage ist bereits in der DB gespeichert.
        }
    }
}
