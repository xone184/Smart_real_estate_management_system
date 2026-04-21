<?php
// =============================================
// SmartRE - Saved Properties API
// GET    /saved_properties.php         - Lấy danh sách BĐS đã lưu của user
// POST   /saved_properties.php         - Lưu BĐS vào danh sách
// DELETE /saved_properties.php?id=X    - Xóa BĐS khỏi danh sách
// =============================================

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDB();

    // Kiểm tra đăng nhập
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Vui lòng đăng nhập'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $userId = $_SESSION['user_id'];

    if ($method === 'GET') {
        // Lấy danh sách BĐS đã lưu với đầy đủ thông tin
        $stmt = $pdo->prepare("
            SELECT p.*, u.display_name as owner_name, u.email as owner_email,
                   sp.created_at as saved_at
            FROM saved_properties sp
            JOIN properties p ON sp.property_id = p.id
            JOIN users u ON p.owner_id = u.id
            WHERE sp.user_id = ?
            ORDER BY sp.created_at DESC
        ");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $properties = array_map(function($row) {
            $row['images'] = json_decode($row['images'], true) ?? [];
            $row['tags'] = json_decode($row['tags'], true) ?? [];
            $row['location'] = ['lat' => (float)$row['location_lat'], 'lng' => (float)$row['location_lng']];
            $row['price'] = (float)$row['price'];
            $row['area'] = (float)$row['area'];
            $row['id'] = (int)$row['id'];
            $row['is_saved'] = true;
            return $row;
        }, $rows);

        echo json_encode($properties, JSON_UNESCAPED_UNICODE);

    } elseif ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $propertyId = (int)($data['property_id'] ?? 0);

        if (!$propertyId) {
            http_response_code(400);
            echo json_encode(['error' => 'property_id là bắt buộc'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Kiểm tra BĐS tồn tại
        $check = $pdo->prepare("SELECT id FROM properties WHERE id = ?");
        $check->execute([$propertyId]);
        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode(['error' => 'Không tìm thấy bất động sản'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Lưu (INSERT IGNORE để tránh duplicate)
        $stmt = $pdo->prepare("INSERT IGNORE INTO saved_properties (user_id, property_id) VALUES (?, ?)");
        $stmt->execute([$userId, $propertyId]);

        echo json_encode(['message' => 'Đã lưu bất động sản', 'saved' => true], JSON_UNESCAPED_UNICODE);

    } elseif ($method === 'DELETE') {
        $propertyId = (int)($_GET['property_id'] ?? 0);

        if (!$propertyId) {
            http_response_code(400);
            echo json_encode(['error' => 'property_id là bắt buộc'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?");
        $stmt->execute([$userId, $propertyId]);

        echo json_encode(['message' => 'Đã xóa khỏi danh sách yêu thích', 'saved' => false], JSON_UNESCAPED_UNICODE);

    } else {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Lỗi cơ sở dữ liệu: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
