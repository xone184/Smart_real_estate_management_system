<?php
// =============================================
// SmartRE - KYC Verification API
// GET    /kyc.php                      - Lấy trạng thái KYC của user
// POST   /kyc.php                      - Upload ảnh & submit hồ sơ KYC
// PUT    /kyc.php?action=approve&id=X  - Admin duyệt KYC
// PUT    /kyc.php?action=reject&id=X   - Admin từ chối KYC
// =============================================

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// Thư mục lưu ảnh KYC
$uploadDir = __DIR__ . '/../uploads/kyc/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

try {
    $pdo = getDB();

    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Vui lòng đăng nhập'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $userId = $_SESSION['user_id'];

    if ($method === 'GET') {
        // Kiểm tra trạng thái KYC của user
        $stmt = $pdo->prepare("
            SELECT k.*, u.kyc_verified 
            FROM users u
            LEFT JOIN kyc_documents k ON k.user_id = u.id
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'kyc_verified' => (bool)($row['kyc_verified'] ?? false),
            'document' => $row ? [
                'id' => $row['id'],
                'status' => $row['status'],
                'submitted_at' => $row['submitted_at'],
                'reviewed_at' => $row['reviewed_at'],
                'notes' => $row['notes'],
            ] : null
        ], JSON_UNESCAPED_UNICODE);

    } elseif ($method === 'POST') {
        // Upload ảnh KYC (multipart/form-data)
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        $urls = [];

        $uploadFields = ['id_front', 'id_back', 'selfie'];
        foreach ($uploadFields as $field) {
            if (isset($_FILES[$field]) && $_FILES[$field]['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES[$field];
                if (!in_array($file['type'], $allowedTypes)) {
                    http_response_code(400);
                    echo json_encode(['error' => 'Chỉ chấp nhận file ảnh JPG, PNG, WEBP'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                if ($file['size'] > 5 * 1024 * 1024) {
                    http_response_code(400);
                    echo json_encode(['error' => 'File ảnh không được vượt quá 5MB'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = "kyc_{$userId}_{$field}_" . time() . ".{$ext}";
                $destPath = $uploadDir . $filename;
                move_uploaded_file($file['tmp_name'], $destPath);
                $urls[$field] = '/smart-real-estate-management-system/uploads/kyc/' . $filename;
            }
        }

        // Upsert kyc_documents
        $existCheck = $pdo->prepare("SELECT id FROM kyc_documents WHERE user_id = ?");
        $existCheck->execute([$userId]);
        $exists = $existCheck->fetch();

        if ($exists) {
            $stmt = $pdo->prepare("
                UPDATE kyc_documents 
                SET id_front_url = ?, id_back_url = ?, selfie_url = ?, status = 'pending', submitted_at = NOW()
                WHERE user_id = ?
            ");
            $stmt->execute([
                $urls['id_front'] ?? '',
                $urls['id_back'] ?? '',
                $urls['selfie'] ?? '',
                $userId
            ]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO kyc_documents (user_id, id_front_url, id_back_url, selfie_url, status)
                VALUES (?, ?, ?, ?, 'pending')
            ");
            $stmt->execute([
                $userId,
                $urls['id_front'] ?? '',
                $urls['id_back'] ?? '',
                $urls['selfie'] ?? ''
            ]);
        }

        // Tạo notification cho user
        $notiStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')");
        $notiStmt->execute([$userId, 'Hồ sơ KYC đã được gửi', 'Chúng tôi đang xem xét hồ sơ xác minh danh tính của bạn. Kết quả sẽ có trong 5-10 phút.']);

        echo json_encode(['message' => 'Hồ sơ KYC đã được gửi thành công', 'status' => 'pending'], JSON_UNESCAPED_UNICODE);

    } elseif ($method === 'PUT') {
        // Admin approve/reject KYC
        $currentUser = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $currentUser->execute([$userId]);
        $currentRole = $currentUser->fetchColumn();

        if ($currentRole !== 'admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Không có quyền truy cập'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $action = $_GET['action'] ?? '';
        $targetUserId = (int)($_GET['user_id'] ?? 0);

        if (!$targetUserId) {
            http_response_code(400);
            echo json_encode(['error' => 'Thiếu user_id'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $notes = $data['notes'] ?? '';

        if ($action === 'approve') {
            $pdo->prepare("UPDATE kyc_documents SET status = 'approved', reviewed_at = NOW() WHERE user_id = ?")->execute([$targetUserId]);
            $pdo->prepare("UPDATE users SET kyc_verified = 1 WHERE id = ?")->execute([$targetUserId]);
            $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'KYC được xác nhận', 'Danh tính của bạn đã được xác minh thành công!', 'success')")->execute([$targetUserId]);
            echo json_encode(['message' => 'Đã duyệt KYC'], JSON_UNESCAPED_UNICODE);

        } elseif ($action === 'reject') {
            $pdo->prepare("UPDATE kyc_documents SET status = 'rejected', notes = ?, reviewed_at = NOW() WHERE user_id = ?")->execute([$notes, $targetUserId]);
            $pdo->prepare("UPDATE users SET kyc_verified = 0 WHERE id = ?")->execute([$targetUserId]);
            $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'KYC chưa được xác nhận', ?, 'warning')")->execute([$targetUserId, 'Hồ sơ KYC của bạn cần được bổ sung thêm thông tin. Lý do: ' . $notes]);
            echo json_encode(['message' => 'Đã từ chối KYC'], JSON_UNESCAPED_UNICODE);
        }

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi cơ sở dữ liệu: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
