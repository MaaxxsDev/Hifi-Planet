<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Config\Database;

if ($argc < 3) {
    fwrite(STDERR, "Verwendung: php create_admin.php <benutzername> <passwort>\n");
    exit(1);
}

[$script, $username, $password] = $argv;

if (strlen($password) < 8) {
    fwrite(STDERR, "Passwort muss mindestens 8 Zeichen lang sein.\n");
    exit(1);
}

$db = Database::connection();
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare(
    'INSERT INTO admin_users (username, password_hash, is_super_admin) VALUES (?, ?, 1)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), is_super_admin = 1'
);
$stmt->execute([$username, $hash]);

echo "Super-Admin '{$username}' angelegt/aktualisiert.\n";
