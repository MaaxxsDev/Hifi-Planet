<?php

namespace App\Controllers;

use App\Config\Database;
use App\Support\Http;
use App\Support\Mailer;

class MailSettingsController
{
    // Greifen, solange in den Einstellungen noch nichts eingetragen wurde. Nur die Vorlagen
    // haben sinnvolle Default-Texte - die SMTP-Zugangsdaten starten bewusst leer.
    private const DEFAULTS = [
        'mail_host' => '',
        'mail_port' => 587,
        'mail_username' => '',
        'mail_encryption' => 'tls',
        'mail_from_email' => '',
        'mail_from_name' => 'HifiPlanet',
        'mail_notify_email' => '',
        'mail_customer_subject' => Mailer::DEFAULT_CUSTOMER_SUBJECT,
        'mail_customer_body' => Mailer::DEFAULT_CUSTOMER_BODY,
        'mail_owner_subject' => Mailer::DEFAULT_OWNER_SUBJECT,
        'mail_owner_body' => Mailer::DEFAULT_OWNER_BODY,
    ];

    private static function currentRow(): array
    {
        try {
            $stmt = Database::connection()->query(
                'SELECT mail_host, mail_port, mail_username, mail_password, mail_encryption,
                        mail_from_email, mail_from_name, mail_notify_email,
                        mail_customer_subject, mail_customer_body, mail_owner_subject, mail_owner_body
                 FROM app_settings WHERE id = 1'
            );
            return $stmt->fetch() ?: [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    public static function show(): void
    {
        $row = self::currentRow();

        $result = [];
        foreach (self::DEFAULTS as $key => $default) {
            $result[$key] = ($row[$key] ?? null) !== null && $row[$key] !== '' ? $row[$key] : $default;
        }
        unset($result['mail_password']);

        Http::send(array_merge($result, [
            'has_password' => !empty($row['mail_password']),
        ]));
    }

    public static function update(): void
    {
        $body = Http::jsonBody();
        $db = Database::connection();
        $current = self::currentRow();

        // Leeres Passwort im Formular = aktuelles Passwort beibehalten (wird beim Laden nie
        // im Klartext an den Browser geschickt, siehe show()).
        $password = ($body['mail_password'] ?? '') !== '' ? $body['mail_password'] : ($current['mail_password'] ?? null);

        $db->exec('INSERT IGNORE INTO app_settings (id) VALUES (1)');
        $stmt = $db->prepare(
            'UPDATE app_settings SET
                mail_host = ?, mail_port = ?, mail_username = ?, mail_password = ?, mail_encryption = ?,
                mail_from_email = ?, mail_from_name = ?, mail_notify_email = ?,
                mail_customer_subject = ?, mail_customer_body = ?, mail_owner_subject = ?, mail_owner_body = ?
             WHERE id = 1'
        );
        $stmt->execute([
            trim($body['mail_host'] ?? '') ?: null,
            !empty($body['mail_port']) ? (int) $body['mail_port'] : null,
            trim($body['mail_username'] ?? '') ?: null,
            $password ?: null,
            trim($body['mail_encryption'] ?? '') ?: 'tls',
            trim($body['mail_from_email'] ?? '') ?: null,
            trim($body['mail_from_name'] ?? '') ?: null,
            trim($body['mail_notify_email'] ?? '') ?: null,
            trim($body['mail_customer_subject'] ?? '') ?: null,
            $body['mail_customer_body'] ?? null,
            trim($body['mail_owner_subject'] ?? '') ?: null,
            $body['mail_owner_body'] ?? null,
        ]);

        self::show();
    }

    /**
     * Schickt eine echte Testmail mit den (moeglicherweise noch ungespeicherten) Formularwerten,
     * damit der Admin sich nicht erst durchklicken muss, um zu sehen, ob die SMTP-Daten stimmen.
     */
    public static function test(): void
    {
        $body = Http::jsonBody();
        $current = self::currentRow();

        $host = trim($body['mail_host'] ?? '');
        $fromEmail = trim($body['mail_from_email'] ?? '');
        $target = trim($body['mail_notify_email'] ?? '') ?: $fromEmail;
        $password = ($body['mail_password'] ?? '') !== '' ? $body['mail_password'] : ($current['mail_password'] ?? '');

        if ($host === '' || $fromEmail === '') {
            Http::error('Server und Absender-E-Mail werden fuer den Test benoetigt', 422);
        }
        if (!filter_var($target, FILTER_VALIDATE_EMAIL)) {
            Http::error('Empfaenger-E-Mail (Benachrichtigungs- oder Absenderadresse) ist ungueltig', 422);
        }

        try {
            $mail = Mailer::build([
                'host' => $host,
                'port' => $body['mail_port'] ?? 587,
                'username' => trim($body['mail_username'] ?? ''),
                'password' => $password,
                'encryption' => trim($body['mail_encryption'] ?? '') ?: 'tls',
                'from_email' => $fromEmail,
                'from_name' => trim($body['mail_from_name'] ?? '') ?: 'HifiPlanet',
            ]);
            $mail->addAddress($target);
            $mail->Subject = 'Testmail von HifiPlanet';
            $mail->Body = "Diese Testmail bestaetigt, dass deine SMTP-Einstellungen funktionieren.";
            $mail->send();
        } catch (\Throwable $e) {
            Http::error('Test fehlgeschlagen: ' . $e->getMessage(), 422);
        }

        Http::send(['ok' => true, 'sent_to' => $target]);
    }
}
