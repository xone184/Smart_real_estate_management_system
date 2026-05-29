<?php
/**
 * SmartRE Debug Endpoint
 * Truy cập: /smart-real-estate-management-system/api/debug.php
 * Dùng để kiểm tra trạng thái server trong Codespaces
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$info = [
    'status'      => 'ok',
    'timestamp'   => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'document_root'   => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'unknown',
];

// Check vendor/autoload.php
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
$info['composer_autoload'] = file_exists($autoloadPath) ? 'found' : 'MISSING';

// Check .env
$envPath = __DIR__ . '/../.env';
$info['env_file'] = file_exists($envPath) ? 'found' : 'MISSING';

// Check database connection
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbName = getenv('DB_NAME') ?: 'smartre_db';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';

$info['db_config'] = [
    'host' => $dbHost,
    'name' => $dbName,
    'user' => $dbUser,
];

try {
    $pdo = new PDO(
        "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_TIMEOUT => 3, PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    // Check tables
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $info['db_status']  = 'connected';
    $info['db_tables']  = $tables;
    $info['db_table_count'] = count($tables);

    // Check users table
    if (in_array('users', $tables)) {
        $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        $info['user_count'] = (int)$userCount;
    }
} catch (PDOException $e) {
    $info['db_status'] = 'ERROR: ' . $e->getMessage();
}

// Check PDO drivers available
$info['pdo_drivers'] = PDO::getAvailableDrivers();

// Check extensions
$info['extensions'] = [
    'pdo'       => extension_loaded('pdo'),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'json'      => extension_loaded('json'),
    'mbstring'  => extension_loaded('mbstring'),
    'openssl'   => extension_loaded('openssl'),
];

// Check uploads directory
$uploadsPath = __DIR__ . '/../uploads';
$info['uploads_dir'] = [
    'exists'   => is_dir($uploadsPath),
    'writable' => is_writable($uploadsPath),
];

// Environment
$info['env_vars'] = [
    'DB_HOST'    => getenv('DB_HOST') ?: '(not set, using default)',
    'DB_NAME'    => getenv('DB_NAME') ?: '(not set, using default)',
    'APP_ENV'    => getenv('APP_ENV') ?: '(not set)',
    'CODESPACES' => getenv('CODESPACES') ?: '(not set)',
];

echo json_encode($info, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
