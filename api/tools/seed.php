<?php
// =============================================
// SmartRE API - Seed Data
// =============================================
require_once __DIR__ . '/../config.php';

if (getMethod() !== 'POST') {
    jsonResponse(405, ['error' => 'Method not allowed']);
}

$user = requireAuth();

$db = getDB();

try {
    // Check if data already exists
    $stmt = $db->query("SELECT COUNT(*) as cnt FROM properties");
    $count = $stmt->fetch()['cnt'];

    if ($count > 0) {
        jsonResponse(200, ['message' => 'Dữ liệu mẫu đã tồn tại', 'count' => (int) $count]);
    }

    // Insert sample properties
    $properties = [
        [
            'Căn hộ cao cấp Vinhomes Central Park',
            'Căn hộ 2 phòng ngủ, view sông Sài Gòn cực đẹp, đầy đủ nội thất cao cấp.',
            'apartment', 5200, 75, 2, 2, 'Đông Nam', 'pink_book',
            '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
            10.794, 106.722,
            '["https://picsum.photos/seed/apt1/800/600", "https://picsum.photos/seed/apt2/800/600"]',
            '["view_song", "full_noi_that", "vinhomes"]'
        ],
        [
            'Nhà phố mặt tiền Quận 1 - Kinh doanh cực tốt',
            'Nhà 1 trệt 3 lầu, vị trí đắc địa, đang cho thuê mặt bằng kinh doanh.',
            'house', 45000, 120, 4, 4, 'Tây Bắc', 'pink_book',
            'Lê Thánh Tôn, Quận 1, TP.HCM',
            10.776, 106.701,
            '["https://picsum.photos/seed/house1/800/600"]',
            '["mat_tien", "kinh_doanh", "quan_1"]'
        ],
        [
            'Đất nền dự án Long An - Sổ đỏ riêng',
            'Lô đất vuông vức, hạ tầng hoàn thiện, pháp lý minh bạch.',
            'land', 1800, 100, 0, 0, 'Nam', 'red_book',
            'Bến Lức, Long An',
            10.643, 106.491,
            '["https://picsum.photos/seed/land1/800/600"]',
            '["so_do_rieng", "dau_tu", "long_an"]'
        ],
        [
            'Biệt thự sân vườn Thảo Điền - Đẳng cấp thượng lưu',
            'Biệt thự đơn lập, hồ bơi riêng, sân vườn rộng rãi, an ninh 24/7.',
            'villa', 120000, 500, 6, 7, 'Đông', 'pink_book',
            'Thảo Điền, Quận 2, TP.HCM',
            10.803, 106.738,
            '["https://picsum.photos/seed/villa1/800/600"]',
            '["biet_thu", "ho_boi", "thao_dien"]'
        ],
    ];

    $stmt = $db->prepare("INSERT INTO properties (title, description, type, price, area, bedrooms, bathrooms, direction, legal, address, location_lat, location_lng, images, tags, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");

    foreach ($properties as $prop) {
        $params = $prop;
        $params[] = $user['id']; // owner_id
        $stmt->execute($params);
    }

    // Insert sample reviews
    $reviewStmt = $db->prepare("INSERT INTO reviews (property_id, user_id, user_name, rating, comment, likes, verified) VALUES (?, ?, ?, ?, ?, ?, 1)");

    // Get property IDs
    $propIds = $db->query("SELECT id FROM properties ORDER BY id ASC")->fetchAll(PDO::FETCH_COLUMN);

    if (count($propIds) >= 4) {
        $reviewStmt->execute([$propIds[0], $user['id'], $user['display_name'], 5, 'Vị trí tuyệt vời, thủ tục nhanh gọn. Rất hài lòng!', 5]);
        $reviewStmt->execute([$propIds[0], $user['id'], $user['display_name'], 4, 'Giá hơi cao nhưng chất lượng xây dựng rất tốt.', 2]);
        $reviewStmt->execute([$propIds[1], $user['id'], $user['display_name'], 5, 'Vị trí đắc địa, kinh doanh rất thuận lợi!', 8]);
        $reviewStmt->execute([$propIds[2], $user['id'], $user['display_name'], 4, 'Pháp lý rõ ràng, hạ tầng đang phát triển tốt.', 3]);
        $reviewStmt->execute([$propIds[3], $user['id'], $user['display_name'], 5, 'Biệt thự siêu đẹp, an ninh tuyệt đối!', 10]);
    }

    jsonResponse(201, ['message' => 'Đã tạo dữ liệu mẫu thành công', 'properties' => count($properties)]);
} catch (Exception $e) {
    jsonResponse(500, ['error' => 'Lỗi khi tạo dữ liệu: ' . $e->getMessage()]);
}
