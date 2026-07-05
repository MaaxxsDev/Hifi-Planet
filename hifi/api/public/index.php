<?php

require __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AdminUserController;
use App\Controllers\AuthController;
use App\Controllers\BrandController;
use App\Controllers\ContactController;
use App\Controllers\DatabaseConfigController;
use App\Controllers\MaintenanceController;
use App\Controllers\ModelController;
use App\Controllers\PackageController;
use App\Controllers\PackageUpgradeController;
use App\Controllers\PermissionCatalogController;
use App\Controllers\PermissionGroupController;
use App\Controllers\ProductController;
use App\Controllers\SchemaController;
use App\Controllers\ServiceController;
use App\Controllers\SettingsController;
use App\Controllers\SetupController;
use App\Controllers\TwoFactorController;
use App\Controllers\UploadController;
use App\Middleware\AuthMiddleware;
use App\Router;
use App\Support\Http;

$config = require __DIR__ . '/../config/config.php';

// Erlaubt lokale Vite-Dev-Server-Ports, Cookies inklusive (nur relevant während der Entwicklung).
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^http://localhost:\d+$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

session_name($config['app']['session_name']);
session_set_cookie_params([
    'path' => $config['app']['base_path'] . '/',
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

$router = new Router();

// Nur eingeloggt sein muss man hierfür.
$admin = fn(callable $handler) => function (array $params = []) use ($handler) {
    AuthMiddleware::requireAdmin();
    $handler($params);
};
// Braucht zusätzlich eine bestimmte Permission (direkt oder über eine Berechtigungsgruppe).
$perm = fn(string $permission, callable $handler) => function (array $params = []) use ($handler, $permission) {
    AuthMiddleware::requirePermission($permission);
    $handler($params);
};
// Reicht, wenn irgendeine der genannten Permissions vorhanden ist.
$anyPerm = fn(array $permissions, callable $handler) => function (array $params = []) use ($handler, $permissions) {
    AuthMiddleware::requireAnyPermission($permissions);
    $handler($params);
};
// Blockiert öffentliche Besucher (nicht eingeloggte Admins), wenn der globale oder
// der übergebene Wartungsmodus aktiv ist.
$maint = fn(?string $scope, callable $handler) => function (array $params = []) use ($handler, $scope) {
    MaintenanceController::guardPublic($scope);
    $handler($params);
};

$router->post('/auth/login', fn($p) => AuthController::login());
$router->post('/auth/verify-2fa', fn($p) => AuthController::verifyTwoFactor());
$router->post('/auth/logout', fn($p) => AuthController::logout());
$router->get('/auth/me', fn($p) => AuthController::me());
$router->post('/auth/change-password', $admin(fn($p) => AuthController::changePassword()));

$router->get('/auth/2fa/setup', $admin(fn($p) => TwoFactorController::setup()));
$router->post('/auth/2fa/enable', $admin(fn($p) => TwoFactorController::enable()));
$router->post('/auth/2fa/disable', $admin(fn($p) => TwoFactorController::disable()));
$router->post('/auth/2fa/recovery-codes', $admin(fn($p) => TwoFactorController::regenerateRecoveryCodes()));

$router->get('/permissions/catalog', $admin(fn($p) => PermissionCatalogController::index()));

$router->get('/brands', $maint('vehicles', fn($p) => BrandController::index()));
$router->post('/brands', $perm('brands.manage', fn($p) => BrandController::store()));
$router->put('/brands/{id}', $perm('brands.manage', fn($p) => BrandController::update($p)));
$router->delete('/brands/{id}', $perm('brands.manage', fn($p) => BrandController::destroy($p)));
$router->get('/brands/{slug}/models', $maint('vehicles', fn($p) => BrandController::modelsForBrand($p)));

// Wird auch von der Pakete-Verwaltung für die Marke/Modell-Filter & -Auswahl benötigt.
$router->get('/models', $anyPerm(['models.manage', 'packages.manage'], fn($p) => ModelController::index()));
$router->post('/models', $perm('models.manage', fn($p) => ModelController::store()));
$router->put('/models/{id}', $perm('models.manage', fn($p) => ModelController::update($p)));
$router->delete('/models/{id}', $perm('models.manage', fn($p) => ModelController::destroy($p)));
$router->get('/models/{brand_slug}/{model_slug}/packages', $maint('vehicles', fn($p) => ModelController::packagesForModel($p)));

$router->get('/packages', $perm('packages.manage', fn($p) => PackageController::index()));
$router->post('/packages', $perm('packages.manage', fn($p) => PackageController::store()));
$router->put('/packages/{id}', $perm('packages.manage', fn($p) => PackageController::update($p)));
$router->delete('/packages/{id}', $perm('packages.manage', fn($p) => PackageController::destroy($p)));
$router->get('/packages/{id}/products', $perm('packages.manage', fn($p) => PackageController::products($p)));

$router->get('/packages/{id}/upgrades', $maint('vehicles', fn($p) => PackageUpgradeController::index($p)));
$router->post('/package-upgrades', $perm('packages.manage', fn($p) => PackageUpgradeController::store()));
$router->put('/package-upgrades/{id}', $perm('packages.manage', fn($p) => PackageUpgradeController::update($p)));
$router->delete('/package-upgrades/{id}', $perm('packages.manage', fn($p) => PackageUpgradeController::destroy($p)));

$router->post('/products', $perm('packages.manage', fn($p) => ProductController::store()));
$router->put('/products/{id}', $perm('packages.manage', fn($p) => ProductController::update($p)));
$router->delete('/products/{id}', $perm('packages.manage', fn($p) => ProductController::destroy($p)));
$router->post('/products/{id}/refresh-price', $perm('packages.manage', fn($p) => ProductController::refreshPrice($p)));

$router->post('/contact', $maint(null, fn($p) => ContactController::store()));
$router->get('/contact', $perm('contact.manage', fn($p) => ContactController::index()));
$router->patch('/contact/{id}', $perm('contact.manage', fn($p) => ContactController::updateStatus($p)));
$router->delete('/contact/{id}', $perm('contact.delete', fn($p) => ContactController::destroy($p)));

$router->post('/uploads', $anyPerm(['brands.manage', 'models.manage', 'services.manage'], fn($p) => UploadController::store()));

$router->get('/services', $maint('services', fn($p) => ServiceController::index()));
$router->post('/services', $perm('services.manage', fn($p) => ServiceController::store()));
$router->put('/services/{id}', $perm('services.manage', fn($p) => ServiceController::update($p)));
$router->delete('/services/{id}', $perm('services.manage', fn($p) => ServiceController::destroy($p)));

$router->get('/admin-users', $perm('users.manage', fn($p) => AdminUserController::index()));
$router->post('/admin-users', $perm('users.manage', fn($p) => AdminUserController::store()));
$router->put('/admin-users/{id}', $perm('users.manage', fn($p) => AdminUserController::update($p)));
$router->delete('/admin-users/{id}', $perm('users.manage', fn($p) => AdminUserController::destroy($p)));

$router->get('/permission-groups', $anyPerm(['users.manage', 'permission_groups.manage'], fn($p) => PermissionGroupController::index()));
$router->post('/permission-groups', $perm('permission_groups.manage', fn($p) => PermissionGroupController::store()));
$router->put('/permission-groups/{id}', $perm('permission_groups.manage', fn($p) => PermissionGroupController::update($p)));
$router->delete('/permission-groups/{id}', $perm('permission_groups.manage', fn($p) => PermissionGroupController::destroy($p)));

$router->get('/settings/export', $perm('settings.manage', fn($p) => SettingsController::exportData()));
$router->post('/settings/import', $perm('settings.manage', fn($p) => SettingsController::importData()));
$router->post('/settings/reset-services', $perm('settings.manage', fn($p) => SettingsController::resetServicesToDefaults()));
$router->post('/settings/reset-catalog', $perm('settings.manage', fn($p) => SettingsController::resetCatalog()));
$router->post('/settings/reset-all', $perm('settings.manage', fn($p) => SettingsController::resetAll()));

$router->get('/settings/schema-check', $perm('settings.manage', fn($p) => SchemaController::check()));
$router->post('/settings/schema-migrate', $perm('settings.manage', fn($p) => SchemaController::migrate()));

$router->get('/settings/database', $perm('settings.manage', fn($p) => DatabaseConfigController::show()));
$router->post('/settings/database', $perm('settings.manage', fn($p) => DatabaseConfigController::update()));

$router->get('/maintenance', fn($p) => MaintenanceController::status());
$router->post('/maintenance', $perm('settings.manage', fn($p) => MaintenanceController::update()));

// Ersteinrichtungs-Assistent (/setup) - bewusst ohne Login, da es ja noch keinen
// Admin gibt. Jeder schreibende Endpunkt prüft selbst, ob wirklich noch kein
// Admin-Account existiert (siehe SetupController::requireUnlocked).
$router->get('/setup/status', fn($p) => SetupController::status());
$router->post('/setup/verify-password', fn($p) => SetupController::verifyPassword());
$router->post('/setup/database', fn($p) => SetupController::saveDatabase());
$router->post('/setup/migrate', fn($p) => SetupController::migrateSchema());
$router->post('/setup/admin', fn($p) => SetupController::createAdmin());

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$apiBase = $config['app']['base_path'] . '/api';
$route = '/' . ltrim(substr($path, strlen($apiBase)), '/');

header('Content-Type: application/json; charset=utf-8');

try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], rtrim($route, '/') ?: '/');
} catch (\Throwable $e) {
    Http::error('Serverfehler: ' . $e->getMessage(), 500);
}
