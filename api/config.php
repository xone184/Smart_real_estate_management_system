<?php
// =============================================
// SmartRE API - Config & Database Connection
// =============================================

// Load environment variables
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
    $envPath = __DIR__ . '/..';
    if (file_exists($envPath . '/.env')) {
        $dotenv = Dotenv\Dotenv::createImmutable($envPath);
        $dotenv->load();
    }
} else {
    // Fallback if composer dependencies not installed
    // Still work without .env file using getenv() defaults
}

// ============= CORS Configuration =============
// Get allowed origins from environment variable
$allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
];

// Add production/custom origins from environment if set
if ($corsOrigins = getenv('CORS_ORIGINS')) {
    $customOrigins = array_map('trim', explode(',', $corsOrigins));
    $allowedOrigins = array_merge($allowedOrigins, $customOrigins);
}

// Handle CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Session configuration
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// ============= Database Configuration =============
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: 3306);
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_NAME', getenv('DB_NAME') ?: 'smartre_db');

// ============= SMTP Configuration =============
// Email service configuration for PHPMailer
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.gmail.com');
define('SMTP_PORT', getenv('SMTP_PORT') ?: 587);
define('SMTP_USER', getenv('SMTP_USER') ?: 'your_email@gmail.com');
define('SMTP_PASS', getenv('SMTP_PASS') ?: '');
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME') ?: 'Smart Real Estate');

// ============= Application Configuration =============
define('APP_URL', getenv('APP_URL') ?: 'http://localhost:8080');
define('APP_ENV', getenv('APP_ENV') ?: 'development');
define('APP_DEBUG', getenv('DEBUG') === 'true' ? true : false);

function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            jsonResponse(500, ['error' => 'Lỗi kết nối database: ' . $e->getMessage()]);
        }
    }
    return $pdo;
}

// Helper: JSON response
function jsonResponse(int $code, $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Helper: Get authenticated user from session
function getAuthUser(): ?array {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, display_name, photo_url, role, kyc_verified, created_at FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch() ?: null;
}

// Helper: Require authentication
function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(401, ['error' => 'Vui lòng đăng nhập']);
    }
    return $user;
}

// Helper: Require admin role
function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        jsonResponse(403, ['error' => 'Bạn không có quyền truy cập']);
    }
    return $user;
}

// Helper: Get JSON body from request
function getRequestBody(): array {
    $body = file_get_contents('php://input');
    $data = json_decode($body, true);
    return $data ?: [];
}

// Helper: Get request method
function getMethod(): string {
    return $_SERVER['REQUEST_METHOD'];
}
