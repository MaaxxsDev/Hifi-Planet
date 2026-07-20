<?php

namespace App\Support;

/** RFC 4648 Base32 – wird für TOTP-Secrets im Google-Authenticator-Format gebraucht. */
class Base32
{
    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function encode(string $binary): string
    {
        if ($binary === '') {
            return '';
        }

        $bits = '';
        foreach (str_split($binary) as $char) {
            $bits .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }

        $output = '';
        foreach (str_split($bits, 5) as $chunk) {
            $chunk = str_pad($chunk, 5, '0', STR_PAD_RIGHT);
            $output .= self::ALPHABET[bindec($chunk)];
        }

        return $output;
    }

    public static function decode(string $base32): string
    {
        $base32 = strtoupper(preg_replace('/[^A-Z2-7]/i', '', $base32));

        $bits = '';
        foreach (str_split($base32) as $char) {
            $pos = strpos(self::ALPHABET, $char);
            if ($pos === false) {
                continue;
            }
            $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $binary = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) < 8) {
                break;
            }
            $binary .= chr(bindec($byte));
        }

        return $binary;
    }
}
