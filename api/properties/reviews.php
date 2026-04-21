<?php
// =============================================
// SmartRE API - Reviews
// =============================================
require_once __DIR__ . '/../config.php';

$method = getMethod();

switch ($method) {
    case 'GET':
        getReviews();
        break;
    case 'POST':
        createReview();
        break;
    case 'DELETE':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : null;
        if (!$id) jsonResponse(400, ['error' => 'ID là bắt buộc']);
        deleteReview($id);
        break;
    default:
        jsonResponse(405, ['error' => 'Method not allowed']);
}

function getReviews(): void {
    $propertyId = isset($_GET['property_id']) ? (int) $_GET['property_id'] : null;

    if (!$propertyId) {
        jsonResponse(400, ['error' => 'property_id là bắt buộc']);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT r.*, u.display_name, u.photo_url
                          FROM reviews r
                          LEFT JOIN users u ON r.user_id = u.id
                          WHERE r.property_id = ?
                          ORDER BY r.created_at DESC");
    $stmt->execute([$propertyId]);
    $reviews = $stmt->fetchAll();

    // Cast types
    foreach ($reviews as &$review) {
        $review['id'] = (int) $review['id'];
        $review['property_id'] = (int) $review['property_id'];
        $review['user_id'] = (int) $review['user_id'];
        $review['rating'] = (int) $review['rating'];
        $review['likes'] = (int) $review['likes'];
        $review['verified'] = (bool) $review['verified'];
        // Use display_name from join if user_name is empty
        if (empty($review['user_name'])) {
            $review['user_name'] = $review['display_name'] ?? 'Người dùng';
        }
        if (empty($review['user_avatar'])) {
            $review['user_avatar'] = $review['photo_url'] ?? '';
        }
        unset($review['display_name'], $review['photo_url']);
    }

    jsonResponse(200, $reviews);
}

function createReview(): void {
    $user = requireAuth();
    $data = getRequestBody();

    $propertyId = (int) ($data['property_id'] ?? 0);
    $rating = (int) ($data['rating'] ?? 0);
    $comment = trim($data['comment'] ?? '');

    // Validation
    if (!$propertyId) {
        jsonResponse(400, ['error' => 'property_id là bắt buộc']);
    }
    if ($rating < 1 || $rating > 5) {
        jsonResponse(400, ['error' => 'Rating phải từ 1 đến 5']);
    }
    if (strlen($comment) < 5) {
        jsonResponse(400, ['error' => 'Bình luận phải có ít nhất 5 ký tự']);
    }

    // Check property exists
    $db = getDB();
    $stmt = $db->prepare("SELECT id FROM properties WHERE id = ?");
    $stmt->execute([$propertyId]);
    if (!$stmt->fetch()) {
        jsonResponse(404, ['error' => 'Không tìm thấy bất động sản']);
    }

    $stmt = $db->prepare("INSERT INTO reviews (property_id, user_id, user_name, user_avatar, rating, comment, likes, verified)
                          VALUES (?, ?, ?, ?, ?, ?, 0, 1)");
    $stmt->execute([
        $propertyId,
        $user['id'],
        $user['display_name'],
        $user['photo_url'] ?? '',
        $rating,
        $comment,
    ]);

    $newId = (int) $db->lastInsertId();
    jsonResponse(201, ['message' => 'Đã gửi đánh giá thành công', 'id' => $newId]);
}

function deleteReview(int $id): void {
    $user = requireAuth();
    $db = getDB();

    $stmt = $db->prepare("SELECT user_id FROM reviews WHERE id = ?");
    $stmt->execute([$id]);
    $review = $stmt->fetch();

    if (!$review) {
        jsonResponse(404, ['error' => 'Không tìm thấy đánh giá']);
    }
    if ($review['user_id'] != $user['id'] && $user['role'] !== 'admin') {
        jsonResponse(403, ['error' => 'Bạn không có quyền xóa']);
    }

    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(200, ['message' => 'Đã xóa đánh giá']);
}
