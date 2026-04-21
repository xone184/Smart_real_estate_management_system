<?php
// =============================================
// SmartRE - DEV ONLY: Xem OTP code trong DB
// URL: http://localhost/smart-real-estate-management-system/api/dev_otp.php?email=you@example.com
// XÓA FILE NÀY TRÊN PRODUCTION!
// =============================================

// Chỉ chạy trên localhost
$serverName = $_SERVER['SERVER_NAME'] ?? 'localhost';
if (!in_array($serverName, ['localhost', '127.0.0.1', '::1'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Dev endpoint only available on localhost']);
    exit();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Credentials: true');

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'smartre_db');

try {
    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    $email = $_GET['email'] ?? '';

    if (!empty($email)) {
        // Get OTP for specific email
        $stmt = $pdo->prepare("
            SELECT email, otp_code, purpose, verified, expires_at, created_at,
                   CASE WHEN expires_at > NOW() THEN 'valid' ELSE 'expired' END AS status
            FROM otp_codes
            WHERE email = ?
            ORDER BY created_at DESC
            LIMIT 1
        ");
        $stmt->execute([$email]);
        $record = $stmt->fetch();

        if ($record) {
            echo json_encode([
                'success' => true,
                'otp' => $record,
                'note' => 'DEV ONLY - Xóa file này trên production!'
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        } else {
            echo json_encode([
                'success' => false,
                'message' => "Không tìm thấy OTP cho email: $email"
            ], JSON_UNESCAPED_UNICODE);
        }
    } else {
        // List all recent OTPs
        $stmt = $pdo->query("
            SELECT email, otp_code, purpose, verified, expires_at, created_at,
                   CASE WHEN expires_at > NOW() THEN 'valid' ELSE 'expired' END AS status
            FROM otp_codes
            ORDER BY created_at DESC
            LIMIT 20
        ");
        $records = $stmt->fetchAll();

        echo json_encode([
            'success' => true,
            'total' => count($records),
            'otps' => $records,
            'note' => 'DEV ONLY - Xóa file này trên production!',
            'usage' => 'Thêm ?email=user@example.com để lọc theo email'
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
