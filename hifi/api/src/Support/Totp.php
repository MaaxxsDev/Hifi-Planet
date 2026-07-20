<?php

namespace App\Support;

/** TOTP nach RFC 6238 (HMAC-SHA1, 6 Stellen, 30s-Schritt) – kompatibel mit Google Authenticator. */
class Totp
{
    private const PERIOD = 30;
    private const DIGITS = 6;

    public static function generateSecret(): string
    {
        return Base32::encode(random_bytes(20));
    }

    public static function provisioningUri(string $secret, string $accountLabel, string $issuer = 'HifiPlanet'): string
    {
        $label = rawurlencode($issuer . ':' . $accountLabel);
        return sprintf(
            'otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=%d&period=%d',
            $label,
            $secret,
            rawurlencode($issuer),
            self::DIGITS,
            self::PERIOD
        );
    }

    public static function currentCode(string $secretBase32, ?int $timestamp = null): string
    {
        $timestamp ??= time();
        $counter = intdiv($timestamp, self::PERIOD);
        return self::codeForCounter($secretBase32, $counter);
    }

    public static function verifyCode(string $secretBase32, string $code, int $window = 1): bool
    {
        $code = preg_replace('/\s+/', '', $code);
        if ($code === '' || $secretBase32 === '') {
            return false;
        }

        $counter = intdiv(time(), self::PERIOD);
        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals(self::codeForCounter($secretBase32, $counter + $i), $code)) {
                return true;
            }
        }

        return false;
    }

    private static function codeForCounter(string $secretBase32, int $counter): string
    {
        $secretRaw = Base32::decode($secretBase32);
        $binaryCounter = pack('N*', 0, $counter);
        $hash = hash_hmac('sha1', $binaryCounter, $secretRaw, true);

        $offset = ord(substr($hash, -1)) & 0x0F;
        $truncated = ((ord($hash[$offset]) & 0x7F) << 24)
            | ((ord($hash[$offset + 1]) & 0xFF) << 16)
            | ((ord($hash[$offset + 2]) & 0xFF) << 8)
            | (ord($hash[$offset + 3]) & 0xFF);

        $code = $truncated % (10 ** self::DIGITS);
        return str_pad((string) $code, self::DIGITS, '0', STR_PAD_LEFT);
    }
}
