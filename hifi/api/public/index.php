<?php

// Fängt versehentliche Ausgaben vor den header()-Aufrufen ab (z.B. PHP-
// Warnungen/Notices oder ein BOM in einer Datei) - ohne das würde eine solche
// Ausgabe den Content-Type-Header verhindern ("headers already sent"), das
// Frontend bekäme dann keine gültige JSON-Antwort mehr, sondern still null.
ob_start();

require __DIR__ . '/../vendor/autoload.php';

use App\Controllers\AdminUserController;
use App\Controllers\AnalyticsController;
use App\Controllers\AuthController;
use App\Controllers\BrandController;
use App\Controllers\ContactController;
use App\Controllers\DatabaseConfigController;
use App\Controllers\FaqController;
use App\Controllers\GalleryBrandController;
use App\Controllers\GalleryPhotoController;
use App\Controllers\GalleryProjectController;
use App\Controllers\GoogleReviewsController;
use App\Controllers\MailSettingsController;
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
use App\Controllers\SiteSettingsController;
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
    'path' => rtrim($config['app']['base_path'], '/') . '/',
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
$router->post('/models/{id}/copy-packages', $perm('packages.manage', fn($p) => PackageController::copyFromModel($p)));

$router->get('/packages/{id}/upgrades', $maint('vehicles', fn($p) => PackageUpgradeController::index($p)));
$router->post('/package-upgrades', $perm('packages.manage', fn($p) => PackageUpgradeController::store()));
$router->put('/package-upgrades/{id}', $perm('packages.manage', fn($p) => PackageUpgradeController::update($p)));
$router->delete('/package-upgrades/{id}', $perm('packages.manage', fn($p) => PackageUpgradeController::destroy($p)));

$router->post('/products', $perm('packages.manage', fn($p) => ProductController::store()));
$router->put('/products/{id}', $perm('packages.manage', fn($p) => ProductController::update($p)));
$router->delete('/products/{id}', $perm('packages.manage', fn($p) => ProductController::destroy($p)));
$router->post('/products/{id}/refresh-price', $perm('packages.manage', fn($p) => ProductController::refreshPrice($p)));

$router->get('/gallery-brands', fn($p) => GalleryBrandController::index());
$router->post('/gallery-brands', $perm('gallery.manage', fn($p) => GalleryBrandController::store()));
$router->put('/gallery-brands/{id}', $perm('gallery.manage', fn($p) => GalleryBrandController::update($p)));
$router->delete('/gallery-brands/{id}', $perm('gallery.manage', fn($p) => GalleryBrandController::destroy($p)));
$router->get('/gallery-brands/{slug}/projects', fn($p) => GalleryBrandController::projectsForBrand($p));

$router->get('/gallery-projects', $perm('gallery.manage', fn($p) => GalleryProjectController::index()));
$router->post('/gallery-projects', $perm('gallery.manage', fn($p) => GalleryProjectController::store()));
$router->put('/gallery-projects/{id}', $perm('gallery.manage', fn($p) => GalleryProjectController::update($p)));
$router->delete('/gallery-projects/{id}', $perm('gallery.manage', fn($p) => GalleryProjectController::destroy($p)));
$router->get('/gallery-projects/{id}/photos', $perm('gallery.manage', fn($p) => GalleryProjectController::photosAdmin($p)));
$router->get('/gallery-brands/{brand_slug}/{project_slug}/photos', fn($p) => GalleryProjectController::photosForProject($p));

$router->post('/gallery-photos', $perm('gallery.manage', fn($p) => GalleryPhotoController::store()));
$router->put('/gallery-photos/{id}', $perm('gallery.manage', fn($p) => GalleryPhotoController::update($p)));
$router->delete('/gallery-photos/{id}', $perm('gallery.manage', fn($p) => GalleryPhotoController::destroy($p)));

$router->post('/contact', $maint(null, fn($p) => ContactController::store()));
$router->get('/contact', $perm('contact.manage', fn($p) => ContactController::index()));
$router->patch('/contact/{id}', $perm('contact.manage', fn($p) => ContactController::updateStatus($p)));
$router->delete('/contact/{id}', $perm('contact.delete', fn($p) => ContactController::destroy($p)));

$router->post('/uploads', $anyPerm(['brands.manage', 'models.manage', 'services.manage', 'settings.manage', 'gallery.manage'], fn($p) => UploadController::store()));

$router->get('/services', $maint('services', fn($p) => ServiceController::index()));
$router->post('/services', $perm('services.manage', fn($p) => ServiceController::store()));
$router->put('/services/{id}', $perm('services.manage', fn($p) => ServiceController::update($p)));
$router->delete('/services/{id}', $perm('services.manage', fn($p) => ServiceController::destroy($p)));

$router->get('/faqs', fn($p) => FaqController::index());
$router->post('/faqs', $perm('content.manage', fn($p) => FaqController::store()));
$router->put('/faqs/{id}', $perm('content.manage', fn($p) => FaqController::update($p)));
$router->delete('/faqs/{id}', $perm('content.manage', fn($p) => FaqController::destroy($p)));

// Nur der zuletzt gecachte Stand - kein Live-Aufruf bei Google pro Seitenbesuch
// (Aktualisierung laeuft ausschliesslich ueber refresh_google_reviews.php).
$router->get('/google-reviews', fn($p) => GoogleReviewsController::publicReviews());

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
$router->post('/settings/reset-faqs', $perm('settings.manage', fn($p) => SettingsController::resetFaqsToDefaults()));
$router->post('/settings/reset-gallery', $perm('settings.manage', fn($p) => SettingsController::resetGalleryToDefaults()));
$router->post('/settings/reset-catalog', $perm('settings.manage', fn($p) => SettingsController::resetCatalog()));
$router->post('/settings/reset-all', $perm('settings.manage', fn($p) => SettingsController::resetAll()));

$router->get('/settings/schema-check', $perm('settings.manage', fn($p) => SchemaController::check()));
$router->post('/settings/schema-migrate', $perm('settings.manage', fn($p) => SchemaController::migrate()));

$router->get('/settings/database', $perm('settings.manage', fn($p) => DatabaseConfigController::show()));
$router->post('/settings/database', $perm('settings.manage', fn($p) => DatabaseConfigController::update()));

$router->get('/settings/mail', $perm('settings.manage', fn($p) => MailSettingsController::show()));
$router->post('/settings/mail', $perm('settings.manage', fn($p) => MailSettingsController::update()));
$router->post('/settings/mail/test', $perm('settings.manage', fn($p) => MailSettingsController::test()));

$router->get('/settings/analytics', $perm('settings.manage', fn($p) => AnalyticsController::show()));
$router->post('/settings/analytics', $perm('settings.manage', fn($p) => AnalyticsController::update()));

$router->get('/settings/google-reviews', $perm('settings.manage', fn($p) => GoogleReviewsController::show()));
$router->post('/settings/google-reviews', $perm('settings.manage', fn($p) => GoogleReviewsController::update()));
$router->post('/settings/google-reviews/refresh', $perm('settings.manage', fn($p) => GoogleReviewsController::refresh()));
$router->get('/analytics/report', $admin(fn($p) => AnalyticsController::report()));

$router->get('/maintenance', fn($p) => MaintenanceController::status());
$router->post('/maintenance', $perm('settings.manage', fn($p) => MaintenanceController::update()));

$router->get('/site-settings', fn($p) => SiteSettingsController::show());
$router->post('/site-settings', $perm('settings.manage', fn($p) => SiteSettingsController::update()));

// Ersteinrichtungs-Assistent (/setup) - bewusst ohne Login, da es ja noch keinen
// Admin gibt. Jeder schreibende Endpunkt prüft selbst, ob wirklich noch kein
// Admin-Account existiert (siehe SetupController::requireUnlocked).
$router->get('/setup/status', fn($p) => SetupController::status());
$router->post('/setup/verify-password', fn($p) => SetupController::verifyPassword());
$router->post('/setup/database', fn($p) => SetupController::saveDatabase());
$router->post('/setup/migrate', fn($p) => SetupController::migrateSchema());
$router->post('/setup/admin', fn($p) => SetupController::createAdmin());

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$apiBase = rtrim($config['app']['base_path'], '/') . '/api';
$route = '/' . ltrim(substr($path, strlen($apiBase)), '/');

// Alles, was bis hierhin versehentlich ausgegeben wurde, verwerfen - danach
// kann der Content-Type-Header noch garantiert gesetzt werden.
ob_clean();
header('Content-Type: application/json; charset=utf-8');

try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], rtrim($route, '/') ?: '/');
} catch (\Throwable $e) {
    Http::error('Serverfehler: ' . $e->getMessage(), 500);
}
