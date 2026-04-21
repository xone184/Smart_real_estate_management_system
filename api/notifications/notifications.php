<?php
// =============================================
// SmartRE - Notifications API
// GET  /notifications.php              - Lấy thông báo của user
// PUT  /notifications.php?id=X         - Đánh dấu đã đọc
// PUT  /notifications.php?action=read_all - Đánh dấu tất cả đã đọc
// =============================================

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Vui lòng đăng nhập'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $userId = $_SESSION['user_id'];
    $db = getDB();

    if ($method === 'GET') {
        $stmt = $db->prepare("
            SELECT * FROM notifications 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 50
        ");
        $stmt->execute([$userId]);
        $notifications = $stmt->fetchAll();

        // Unread count
        $countStmt = $db->prepare("SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0");
        $countStmt->execute([$userId]);
        $unreadCount = (int)$countStmt->fetchColumn();

        foreach ($notifications as &$n) {
            $n['id'] = (int)$n['id'];
            $n['is_read'] = (bool)$n['is_read'];
        }

        echo json_encode([
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ], JSON_UNESCAPED_UNICODE);

    } elseif ($method === 'PUT') {
        $action = $_GET['action'] ?? '';
        $id = (int)($_GET['id'] ?? 0);

        if ($action === 'read_all') {
            $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?");
            $stmt->execute([$userId]);
            echo json_encode(['message' => 'Đã đánh dấu tất cả là đã đọc'], JSON_UNESCAPED_UNICODE);
        } elseif ($id) {
            $stmt = $db->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $userId]);
            echo json_encode(['message' => 'Đã đánh dấu là đã đọc'], JSON_UNESCAPED_UNICODE);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Thiếu tham số'], JSON_UNESCAPED_UNICODE);
        }

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi cơ sở dữ liệu: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
