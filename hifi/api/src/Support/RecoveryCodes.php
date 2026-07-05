<?php

namespace App\Support;

class RecoveryCodes
{
    private const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne O/0/I/1 (Verwechslungsgefahr)

    /** @return string[] Klartext-Codes – werden nur einmal angezeigt. */
    public static function generate(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = self::randomCode() . '-' . self::randomCode();
        }
        return $codes;
    }

    private static function randomCode(): string
    {
        $out = '';
        for ($i = 0; $i < 5; $i++) {
            $out .= self::CHARS[random_int(0, strlen(self::CHARS) - 1)];
        }
        return $out;
    }

    /** @param string[] $plainCodes @return string[] Passwort-Hashes zur Speicherung. */
    public static function hashAll(array $plainCodes): array
    {
        return array_map(fn($c) => password_hash($c, PASSWORD_DEFAULT), $plainCodes);
    }

    /**
     * Prüft $code gegen die gespeicherten Hashes. Bei Treffer wird der Code verbraucht
     * (Single-Use) und die reduzierte Hash-Liste zurückgegeben, sonst null.
     *
     * @param string[] $hashes
     * @return string[]|null
     */
    public static function consume(array $hashes, string $code): ?array
    {
        $code = trim($code);
        foreach ($hashes as $i => $hash) {
            if (password_verify($code, $hash)) {
                unset($hashes[$i]);
                return array_values($hashes);
            }
        }
        return null;
    }
}
