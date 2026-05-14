<?php
// =============================================
// SmartRE - Contacts API
// POST /contacts.php - Gửi yêu cầu liên hệ
// GET  /contacts.php - (Admin) Liệt kê yêu cầu
// =============================================

require_once __DIR__ . '/../config.php';

$method = getMethod();

try {
    $db = getDB();

    // Auto-create contacts table if it doesn't exist
    $db->exec("CREATE TABLE IF NOT EXISTS `contacts` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `name` varchar(255) NOT NULL,
      `email` varchar(255) NOT NULL,
      `phone` varchar(50) DEFAULT NULL,
      `topic` varchar(255) DEFAULT NULL,
      `message` text NOT NULL,
      `status` enum('pending', 'read', 'replied') DEFAULT 'pending',
      `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    if ($method === 'POST') {
        $data = getRequestBody();
        
        $name    = trim($data['name'] ?? '');
        $email   = trim($data['email'] ?? '');
        $phone   = trim($data['phone'] ?? '');
        $topic   = trim($data['topic'] ?? '');
        $message = trim($data['message'] ?? '');

        if (!$name || !$email || !$message) {
            jsonResponse(400, ['error' => 'Vui lòng điền đầy đủ các thông tin bắt buộc (Họ tên, Email, Nội dung)']);
        }

        // Validate Email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            jsonResponse(400, ['error' => 'Định dạng Email không hợp lệ']);
        }

        // Validate Phone (optional)
        if ($phone !== '') {
            $phoneClean = str_replace(' ', '', $phone);
            if (!preg_match('/^(0|84)(3|5|7|8|9)([0-9]{8})$/', $phoneClean)) {
                jsonResponse(400, ['error' => 'Số điện thoại không hợp lệ']);
            }
        }

        if (mb_strlen($message) < 10) {
            jsonResponse(400, ['error' => 'Nội dung tin nhắn quá ngắn']);
        }

        // Lưu vào bảng contacts
        $stmt = $db->prepare("
            INSERT INTO contacts (name, email, phone, topic, message)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$name, $email, $phone, $topic, $message]);
        $contactId = $db->lastInsertId();

        // Thông báo cho tất cả Admin
        $adminStmt = $db->query("SELECT id FROM users WHERE role = 'admin'");
        $admins = $adminStmt->fetchAll(PDO::FETCH_COLUMN);

        foreach ($admins as $adminId) {
            $notifStmt = $db->prepare("
                INSERT INTO notifications (user_id, title, message, type, link)
                VALUES (?, ?, ?, ?, ?)
            ");
            $notifStmt->execute([
                $adminId,
                'Yêu cầu liên hệ mới',
                "Khách hàng $name ($email) vừa gửi một yêu cầu liên hệ mới.",
                'warning',
                'admin:contacts'
            ]);
        }

        jsonResponse(201, [
            'message' => 'Gửi yêu cầu liên hệ thành công',
            'id' => $contactId
        ]);

    } elseif ($method === 'GET') {
        $user = requireAuth();
        if ($user['role'] !== 'admin') {
            jsonResponse(403, ['error' => 'Chỉ Admin mới có quyền xem']);
        }

        $stmt = $db->query("SELECT * FROM contacts ORDER BY created_at DESC");
        $contacts = $stmt->fetchAll();
        
        foreach ($contacts as &$c) {
            $c['id'] = (int)$c['id'];
        }

        jsonResponse(200, $contacts);

    } elseif ($method === 'PUT') {
        $user = requireAuth();
        if ($user['role'] !== 'admin') {
            jsonResponse(403, ['error' => 'Chỉ Admin mới có quyền cập nhật']);
        }

        $id = (int)($_GET['id'] ?? 0);
        $data = getRequestBody();
        $status = $data['status'] ?? 'read';

        if (!$id) jsonResponse(400, ['error' => 'Thiếu ID']);

        $stmt = $db->prepare("UPDATE contacts SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);

        jsonResponse(200, ['message' => 'Cập nhật trạng thái thành công']);

    } else {
        jsonResponse(405, ['error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    jsonResponse(500, ['error' => 'Lỗi server: ' . $e->getMessage()]);
}
