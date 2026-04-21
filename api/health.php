<?php
// Health check endpoint - returns status of application and database

header('Content-Type: application/json; charset=utf-8');

$health = [
    'status' => 'unknown',
    'timestamp' => date('Y-m-d H:i:s'),
    'app' => [
        'environment' => getenv('APP_ENV') ?: 'unknown',
        'version' => '1.0.0'
    ],
    'database' => [
        'status' => 'disconnected'
    ]
];

try {
    require_once __DIR__ . '/../vendor/autoload.php';
    
    // Check database connection
    $dsn = "mysql:host=" . (getenv('DB_HOST') ?: 'localhost') . ";dbname=" . (getenv('DB_NAME') ?: 'smartre_db');
    $pdo = new PDO(
        $dsn,
        getenv('DB_USER') ?: 'root',
        getenv('DB_PASS') ?: '',
        [
            PDO::ATTR_TIMEOUT => 5,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );
    
    $result = $pdo->query('SELECT 1');
    if ($result) {
        $health['database']['status'] = 'connected';
        $health['status'] = 'healthy';
        http_response_code(200);
    }
} catch (Exception $e) {
    $health['database']['error'] = $e->getMessage();
    $health['status'] = 'unhealthy';
    http_response_code(503);
}

echo json_encode($health, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
