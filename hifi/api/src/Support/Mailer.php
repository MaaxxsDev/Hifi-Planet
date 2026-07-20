<?php

namespace App\Support;

use App\Config\Database;
use PHPMailer\PHPMailer\PHPMailer;

/**
 * Buendelt alles rund um SMTP-Konfiguration und E-Mail-Vorlagen an einer Stelle,
 * damit ContactController (echter Versand) und MailSettingsController (Verbindungstest)
 * dieselbe PHPMailer-Aufbau- und Platzhalter-Logik nutzen statt sie zu duplizieren.
 */
class Mailer
{
    public const DEFAULT_CUSTOMER_SUBJECT = 'Deine Anfrage bei HifiPlanet ist eingegangen';

    public const DEFAULT_CUSTOMER_BODY = <<<'TXT'
Hallo {{name}},

vielen Dank fuer deine Anfrage bei HifiPlanet! Wir haben sie erhalten und melden uns so schnell wie moeglich bei dir.

Deine Angaben:
Marke: {{brand}}
Modell: {{model}}
Paket: {{package}}
Produkt: {{product}}

Nachricht:
{{message}}

Viele Gruesse
Dein HifiPlanet-Team
TXT;

    public const DEFAULT_OWNER_SUBJECT = 'Neue Kontaktanfrage von {{name}}';

    public const DEFAULT_OWNER_BODY = <<<'TXT'
Name: {{name}}
E-Mail: {{email}}
Telefon: {{phone}}
Fahrgestellnummer (FIN): {{vin}}

Marke: {{brand}}
Modell: {{model}}
Paket: {{package}}
Produkt: {{product}}

Gewuenschte Upgrades:
{{upgrades}}

Nachricht:
{{message}}
TXT;

    /**
     * Liest die SMTP-/Vorlagen-Einstellungen aus app_settings. Leere Felder fallen auf
     * die statische config.php zurueck (Zweck: Bestandsinstallationen, bei denen host/from_email
     * dort schon manuell eingetragen wurden, funktionieren weiter, bis im Admin-Panel gespeichert wird).
     */
    public static function resolveConfig(): array
    {
        $fallback = (require __DIR__ . '/../../config/config.php')['mail'];

        try {
            $stmt = Database::connection()->query(
                'SELECT mail_host, mail_port, mail_username, mail_password, mail_encryption,
                        mail_from_email, mail_from_name, mail_notify_email,
                        mail_customer_subject, mail_customer_body, mail_owner_subject, mail_owner_body
                 FROM app_settings WHERE id = 1'
            );
            $row = $stmt->fetch() ?: [];
        } catch (\Throwable $e) {
            $row = [];
        }

        $str = fn($value) => $value !== null && $value !== '' ? $value : null;

        return [
            'host' => $str($row['mail_host'] ?? null) ?? $fallback['host'],
            'port' => $str($row['mail_port'] ?? null) ?? $fallback['port'],
            'username' => $str($row['mail_username'] ?? null) ?? $fallback['username'],
            'password' => $str($row['mail_password'] ?? null) ?? $fallback['password'],
            'encryption' => $str($row['mail_encryption'] ?? null) ?? $fallback['encryption'],
            'from_email' => $str($row['mail_from_email'] ?? null) ?? $fallback['from_email'],
            'from_name' => $str($row['mail_from_name'] ?? null) ?? $fallback['from_name'],
            'notify_email' => $str($row['mail_notify_email'] ?? null) ?? $fallback['to_email'],
            'customer_subject' => $str($row['mail_customer_subject'] ?? null) ?? self::DEFAULT_CUSTOMER_SUBJECT,
            'customer_body' => $str($row['mail_customer_body'] ?? null) ?? self::DEFAULT_CUSTOMER_BODY,
            'owner_subject' => $str($row['mail_owner_subject'] ?? null) ?? self::DEFAULT_OWNER_SUBJECT,
            'owner_body' => $str($row['mail_owner_body'] ?? null) ?? self::DEFAULT_OWNER_BODY,
        ];
    }

    /**
     * Baut einen fertig konfigurierten, aber noch nicht abgeschickten PHPMailer aus den
     * uebergebenen SMTP-Feldern (host/port/username/password/encryption/from_email/from_name).
     */
    public static function build(array $config): PHPMailer
    {
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = $config['host'];
        $mail->Port = (int) $config['port'];
        $mail->SMTPAuth = true;
        $mail->Username = $config['username'];
        $mail->Password = $config['password'];
        $mail->SMTPSecure = ($config['encryption'] ?? '') !== 'none' ? $config['encryption'] : false;
        $mail->CharSet = 'UTF-8';
        $mail->setFrom($config['from_email'], $config['from_name'] ?: $config['from_email']);

        return $mail;
    }

    /**
     * Ersetzt {{platzhalter}} in einer Vorlage. Unbekannte Platzhalter bleiben unveraendert
     * stehen (auffaelliger als sie einfach zu leeren, falls sich im Text ein Tippfehler einschleicht).
     */
    public static function render(string $template, array $vars): string
    {
        $replacements = [];
        foreach ($vars as $key => $value) {
            $replacements['{{' . $key . '}}'] = $value ?? '-';
        }

        return strtr($template, $replacements);
    }
}
