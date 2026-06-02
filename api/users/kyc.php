<?php
// =============================================
// SmartRE - KYC Verification API
// GET    /kyc.php                      - Lấy trạng thái KYC của user
// POST   /kyc.php                      - Upload ảnh & submit hồ sơ KYC
// PUT    /kyc.php?action=approve&id=X  - Admin duyệt KYC
// PUT    /kyc.php?action=reject&id=X   - Admin từ chối KYC
// =============================================

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';

// Thư mục lưu ảnh KYC
$uploadDir = __DIR__ . '/../../uploads/kyc/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

try {
    $pdo = getDB();

    if (!isset($_SESSION['user_id'])) {
        jsonResponse(401, ['error' => 'Vui lòng đăng nhập']);
    }
    $userId = $_SESSION['user_id'];

    if ($method === 'GET') {
        // Lấy thông tin user hiện tại
        $currentUser = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $currentUser->execute([$userId]);
        $currentRole = $currentUser->fetchColumn();

        $action = $_GET['action'] ?? '';

        // API lấy logs KYC (dùng cho cả admin xem hoặc user xem logs của chính mình)
        if ($action === 'logs') {
            $targetUserId = (int)($_GET['user_id'] ?? $userId);
            if ($userId !== $targetUserId && $currentRole !== 'admin') {
                jsonResponse(403, ['error' => 'Không có quyền truy cập']);
            }
            $stmt = $pdo->prepare("
                SELECT kl.*, u.display_name as admin_name 
                FROM kyc_logs kl
                LEFT JOIN users u ON kl.admin_id = u.id
                WHERE kl.user_id = ?
                ORDER BY kl.created_at DESC
            ");
            $stmt->execute([$targetUserId]);
            jsonResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
        }

        // API lấy danh sách cho admin
        if (isset($_GET['admin_list']) && $_GET['admin_list'] == 1) {
            if ($currentRole !== 'admin') {
                jsonResponse(403, ['error' => 'Không có quyền truy cập']);
            }
            $stmt = $pdo->query("
                SELECT k.*, u.display_name, u.email
                FROM kyc_documents k
                JOIN users u ON k.user_id = u.id
                ORDER BY k.submitted_at DESC
            ");
            $docs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            jsonResponse(200, $docs);
        }

        // Mặc định: Kiểm tra trạng thái KYC của user hiện tại
        $stmt = $pdo->prepare("
            SELECT k.*, u.kyc_verified 
            FROM users u
            LEFT JOIN kyc_documents k ON k.user_id = u.id
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        jsonResponse(200, [
            'kyc_verified' => (bool)($row['kyc_verified'] ?? false),
            'document' => ($row && isset($row['id'])) ? [
                'id' => $row['id'],
                'user_id' => $row['user_id'],
                'id_front_url' => $row['id_front_url'],
                'id_back_url' => $row['id_back_url'],
                'selfie_url' => $row['selfie_url'],
                'status' => $row['status'],
                'submitted_at' => $row['submitted_at'],
                'reviewed_at' => $row['reviewed_at'],
                'notes' => $row['notes'],
            ] : null
        ]);

    } elseif ($method === 'POST') {
        // Upload ảnh KYC (multipart/form-data)
        $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        $urls = [];

        $uploadFields = ['id_front', 'id_back', 'selfie'];
        foreach ($uploadFields as $field) {
            if (isset($_FILES[$field]) && $_FILES[$field]['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES[$field];
                if (!in_array($file['type'], $allowedTypes)) {
                    jsonResponse(400, ['error' => 'Chỉ chấp nhận file ảnh JPG, PNG, WEBP']);
                }
                if ($file['size'] > 5 * 1024 * 1024) {
                    jsonResponse(400, ['error' => 'File ảnh không được vượt quá 5MB']);
                }
                $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
                $filename = "kyc_{$userId}_{$field}_" . time() . ".{$ext}";
                $destPath = $uploadDir . $filename;
                move_uploaded_file($file['tmp_name'], $destPath);
                $urls[$field] = '/smart-real-estate-management-system/uploads/kyc/' . $filename;
            }
        }

        if (empty($urls)) {
            jsonResponse(400, ['error' => 'Không nhận được file ảnh nào. Vui lòng tải lại ảnh.']);
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

        jsonResponse(200, ['message' => 'Hồ sơ KYC đã được gửi thành công', 'status' => 'pending']);

    } elseif ($method === 'PUT') {
        // Admin approve/reject KYC
        $currentUser = $pdo->prepare("SELECT role FROM users WHERE id = ?");
        $currentUser->execute([$userId]);
        $currentRole = $currentUser->fetchColumn();

        if ($currentRole !== 'admin') {
            jsonResponse(403, ['error' => 'Không có quyền truy cập']);
        }

        $action = $_GET['action'] ?? '';
        $targetUserId = (int)($_GET['user_id'] ?? 0);

        if (!$targetUserId) {
            jsonResponse(400, ['error' => 'Thiếu user_id']);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $notes = $data['notes'] ?? '';

        // Lấy kyc_id từ bảng kyc_documents
        $getKyc = $pdo->prepare("SELECT id FROM kyc_documents WHERE user_id = ?");
        $getKyc->execute([$targetUserId]);
        $kycId = $getKyc->fetchColumn();

        if ($action === 'approve') {
            $pdo->prepare("UPDATE kyc_documents SET status = 'approved', notes = ?, reviewed_at = NOW() WHERE user_id = ?")->execute([$notes ?: 'Đã duyệt KYC', $targetUserId]);
            $pdo->prepare("UPDATE users SET kyc_verified = 1 WHERE id = ?")->execute([$targetUserId]);
            
            // Lưu log KYC
            $pdo->prepare("INSERT INTO kyc_logs (kyc_id, user_id, admin_id, action, reason) VALUES (?, ?, ?, 'approve', ?)")
                ->execute([$kycId ?: null, $targetUserId, $userId, $notes ?: 'Đã duyệt KYC']);
            
            $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'KYC được xác nhận', 'Danh tính của bạn đã được xác minh thành công!', 'success')")->execute([$targetUserId]);
            jsonResponse(200, ['message' => 'Đã duyệt KYC']);

        } elseif ($action === 'reject') {
            if (empty($notes)) {
                jsonResponse(400, ['error' => 'Vui lòng cung cấp lý do từ chối']);
            }
            $pdo->prepare("UPDATE kyc_documents SET status = 'rejected', notes = ?, reviewed_at = NOW() WHERE user_id = ?")->execute([$notes, $targetUserId]);
            $pdo->prepare("UPDATE users SET kyc_verified = 0 WHERE id = ?")->execute([$targetUserId]);
            
            // Lưu log KYC lý do từ chối
            $pdo->prepare("INSERT INTO kyc_logs (kyc_id, user_id, admin_id, action, reason) VALUES (?, ?, ?, 'reject', ?)")
                ->execute([$kycId ?: null, $targetUserId, $userId, $notes]);

            $pdo->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'KYC chưa được xác nhận', ?, 'warning')")->execute([$targetUserId, 'Hồ sơ KYC của bạn cần được bổ sung thêm thông tin. Lý do: ' . $notes]);
            jsonResponse(200, ['message' => 'Đã từ chối KYC']);
        } else {
            jsonResponse(400, ['error' => 'Action không hợp lệ']);
        }

    } else {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

} catch (PDOException $e) {
    jsonResponse(500, ['error' => 'Lỗi cơ sở dữ liệu: ' . $e->getMessage()]);
}