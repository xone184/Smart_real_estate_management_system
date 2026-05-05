<?php
// =============================================
// SmartRE API - Properties CRUD
// =============================================
require_once __DIR__ . '/../config.php';

$method = getMethod();
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'market_stats') {
            getMarketStats();
        } elseif ($id) {
            getProperty($id);
        } else {
            getProperties();
        }
        break;
    case 'POST':
        createProperty();
        break;
    case 'PUT':
        if ($action === 'bulk_update_status') {
            bulkUpdatePropertyStatus();
        } else {
            if (!$id) jsonResponse(400, ['error' => 'ID là bắt buộc']);
            updateProperty($id);
        }
        break;
    case 'DELETE':
        if (!$id) jsonResponse(400, ['error' => 'ID là bắt buộc']);
        deleteProperty($id);
        break;
    default:
        jsonResponse(405, ['error' => 'Method not allowed']);
}

function ensureModerationColumns(PDO $db): void {
    static $checked = false;
    if ($checked) return;

    $exists = $db->query("SHOW COLUMNS FROM properties LIKE 'reject_reason'")->fetch();
    if (!$exists) {
        $db->exec("ALTER TABLE properties ADD COLUMN reject_reason TEXT NULL DEFAULT NULL");
    }

    $legalScanExists = $db->query("SHOW COLUMNS FROM properties LIKE 'legal_scan_url'")->fetch();
    if (!$legalScanExists) {
        $db->exec("ALTER TABLE properties ADD COLUMN legal_scan_url VARCHAR(500) DEFAULT ''");
    }

    $planningExists = $db->query("SHOW COLUMNS FROM properties LIKE 'planning_url'")->fetch();
    if (!$planningExists) {
        $db->exec("ALTER TABLE properties ADD COLUMN planning_url VARCHAR(500) DEFAULT ''");
    }

    $roomImagesExists = $db->query("SHOW COLUMNS FROM properties LIKE 'room_images'")->fetch();
    if (!$roomImagesExists) {
        $db->exec("ALTER TABLE properties ADD COLUMN room_images TEXT NULL DEFAULT NULL");
    }
    $checked = true;
}

function pushPropertyStatusNotification(PDO $db, int $propertyId, int $ownerId, string $status, ?string $rejectReason = null): void {
    $title = '';
    $message = '';
    $type = 'info';

    $stmt = $db->prepare("SELECT title FROM properties WHERE id = ?");
    $stmt->execute([$propertyId]);
    $propTitle = ($stmt->fetchColumn() ?: 'tin đăng') . '';

    if ($status === 'active') {
        $title = 'Tin đăng đã được duyệt';
        $message = "Tin đăng \"{$propTitle}\" của bạn đã được duyệt và hiển thị trên hệ thống.";
        $type = 'success';
    } elseif ($status === 'rejected') {
        $title = 'Tin đăng bị từ chối';
        $reasonText = trim((string) $rejectReason) !== '' ? " Lý do: {$rejectReason}" : '';
        $message = "Tin đăng \"{$propTitle}\" của bạn đã bị từ chối.{$reasonText}";
        $type = 'warning';
    } else {
        return;
    }

    $ins = $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)");
    $ins->execute([$ownerId, $title, $message, $type, "property:{$propertyId}"]);
}

function getProperties(): void {
    $db = getDB();
    ensureModerationColumns($db);

    $where = [];
    $params = [];

    // Filter by owner
    if (!empty($_GET['owner_id'])) {
        $where[] = "p.owner_id = ?";
        $params[] = (int) $_GET['owner_id'];
    }

    // Filter by status
    if (!empty($_GET['status'])) {
        $where[] = "p.status = ?";
        $params[] = $_GET['status'];
    }

    // Filter by type
    if (!empty($_GET['type'])) {
        $where[] = "p.type = ?";
        $params[] = $_GET['type'];
    }

    // Search by title or address
    if (!empty($_GET['search'])) {
        $where[] = "(p.title LIKE ? OR p.address LIKE ?)";
        $search = '%' . $_GET['search'] . '%';
        $params[] = $search;
        $params[] = $search;
    }

    // Filter by price
    if (!empty($_GET['price_min'])) {
        $where[] = "p.price >= ?";
        $params[] = (float) $_GET['price_min'];
    }
    if (!empty($_GET['price_max'])) {
        $where[] = "p.price <= ?";
        $params[] = (float) $_GET['price_max'];
    }

    // Filter by area
    if (!empty($_GET['area_min'])) {
        $where[] = "p.area >= ?";
        $params[] = (float) $_GET['area_min'];
    }
    if (!empty($_GET['area_max'])) {
        $where[] = "p.area <= ?";
        $params[] = (float) $_GET['area_max'];
    }

    // Filter by bedrooms
    if (!empty($_GET['bedrooms'])) {
        $where[] = "p.bedrooms >= ?";
        $params[] = (int) $_GET['bedrooms'];
    }

    // Filter by direction
    if (!empty($_GET['direction'])) {
        $where[] = "p.direction = ?";
        $params[] = $_GET['direction'];
    }

    // Filter by city (province/city in address)
    if (!empty($_GET['city'])) {
        $where[] = "p.address LIKE ?";
        $params[] = '%' . $_GET['city'] . '%';
    }

    // Filter by created_at date range
    if (!empty($_GET['created_from'])) {
        $where[] = "p.created_at >= ?";
        $params[] = $_GET['created_from'] . ' 00:00:00';
    }
    if (!empty($_GET['created_to'])) {
        $where[] = "p.created_at <= ?";
        $params[] = $_GET['created_to'] . ' 23:59:59';
    }

    $whereClause = count($where) > 0 ? 'WHERE ' . implode(' AND ', $where) : '';

    $sql = "SELECT p.*, u.display_name as owner_name, u.email as owner_email
            FROM properties p
            LEFT JOIN users u ON p.owner_id = u.id
            {$whereClause}
            ORDER BY p.created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $properties = $stmt->fetchAll();

    // Parse JSON fields
    foreach ($properties as &$prop) {
        $prop['images'] = json_decode($prop['images'], true) ?: [];
        $prop['room_images'] = json_decode($prop['room_images'] ?? '', true) ?: [];
        $prop['tags'] = json_decode($prop['tags'], true) ?: [];
        $prop['id'] = (int) $prop['id'];
        $prop['price'] = (float) $prop['price'];
        $prop['area'] = (float) $prop['area'];
        $prop['bedrooms'] = (int) $prop['bedrooms'];
        $prop['bathrooms'] = (int) $prop['bathrooms'];
        $prop['owner_id'] = (int) $prop['owner_id'];
        $prop['location'] = [
            'lat' => (float) $prop['location_lat'],
            'lng' => (float) $prop['location_lng'],
        ];
        unset($prop['location_lat'], $prop['location_lng']);
    }

    jsonResponse(200, $properties);
}

function getProperty(int $id): void {
    $db = getDB();
    ensureModerationColumns($db);
    $stmt = $db->prepare("SELECT p.*, u.display_name as owner_name, u.email as owner_email
                           FROM properties p
                           LEFT JOIN users u ON p.owner_id = u.id
                           WHERE p.id = ?");
    $stmt->execute([$id]);
    $prop = $stmt->fetch();

    if (!$prop) {
        jsonResponse(404, ['error' => 'Không tìm thấy bất động sản']);
    }

    // Parse JSON fields
    $prop['images'] = json_decode($prop['images'], true) ?: [];
    $prop['room_images'] = json_decode($prop['room_images'] ?? '', true) ?: [];
    $prop['tags'] = json_decode($prop['tags'], true) ?: [];
    $prop['id'] = (int) $prop['id'];
    $prop['price'] = (float) $prop['price'];
    $prop['area'] = (float) $prop['area'];
    $prop['bedrooms'] = (int) $prop['bedrooms'];
    $prop['bathrooms'] = (int) $prop['bathrooms'];
    $prop['owner_id'] = (int) $prop['owner_id'];
    $prop['location'] = [
        'lat' => (float) $prop['location_lat'],
        'lng' => (float) $prop['location_lng'],
    ];
    unset($prop['location_lat'], $prop['location_lng']);

    jsonResponse(200, $prop);
}

function createProperty(): void {
    $user = requireAuth();
    $data = getRequestBody();

    // Validation
    $required = ['title', 'type', 'price', 'area', 'address', 'legal'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            jsonResponse(400, ['error' => "Trường '{$field}' là bắt buộc"]);
        }
    }

    $images = json_encode($data['images'] ?? []);
    $tags = json_encode($data['tags'] ?? []);

    $db = getDB();
    ensureModerationColumns($db);
    $stmt = $db->prepare("INSERT INTO properties (
        title, description, type, price, area, bedrooms, bathrooms,
        direction, legal, address, location_lat, location_lng, images, room_images,
        video_url, tour_3d_url, legal_scan_url, planning_url, owner_id, status, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    $stmt->execute([
        $data['title'],
        $data['description'] ?? '',
        $data['type'],
        (float) $data['price'],
        (float) $data['area'],
        (int) ($data['bedrooms'] ?? 0),
        (int) ($data['bathrooms'] ?? 0),
        $data['direction'] ?? '',
        $data['legal'],
        $data['address'],
        (float) ($data['location_lat'] ?? 10.776),
        (float) ($data['location_lng'] ?? 106.701),
        $images,
        json_encode($data['room_images'] ?? []),
        $data['video_url'] ?? '',
        $data['tour_3d_url'] ?? '',
        $data['legal_scan_url'] ?? '',
        $data['planning_url'] ?? '',
        $user['id'],
        'pending',
        $tags,
    ]);

    $newId = (int) $db->lastInsertId();
    jsonResponse(201, ['message' => 'Đã tạo tin đăng thành công', 'id' => $newId]);
}

function updateProperty(int $id): void {
    $user = requireAuth();
    $data = getRequestBody();
    $db = getDB();
    ensureModerationColumns($db);

    // Check property exists and ownership
    $stmt = $db->prepare("SELECT owner_id, status, reject_reason FROM properties WHERE id = ?");
    $stmt->execute([$id]);
    $prop = $stmt->fetch();

    if (!$prop) {
        jsonResponse(404, ['error' => 'Không tìm thấy bất động sản']);
    }
    if ($prop['owner_id'] != $user['id'] && $user['role'] !== 'admin') {
        jsonResponse(403, ['error' => 'Bạn không có quyền chỉnh sửa']);
    }

    // Build dynamic update
    $allowed = ['title', 'description', 'type', 'price', 'area', 'bedrooms', 'bathrooms', 'direction', 'legal', 'address', 'status', 'video_url', 'tour_3d_url', 'legal_scan_url', 'planning_url', 'room_images'];
    $sets = [];
    $params = [];

    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $sets[] = "{$field} = ?";
            if ($field === 'room_images') {
                $params[] = is_string($data[$field]) ? $data[$field] : json_encode($data[$field]);
            } else {
                $params[] = $data[$field];
            }
        }
    }

    if (isset($data['images'])) {
        $sets[] = "images = ?";
        $params[] = json_encode($data['images']);
    }
    if (isset($data['tags'])) {
        $sets[] = "tags = ?";
        $params[] = json_encode($data['tags']);
    }

    // Admin moderation note for rejected listing
    if (array_key_exists('reject_reason', $data)) {
        $sets[] = "reject_reason = ?";
        $params[] = trim((string) $data['reject_reason']) !== '' ? trim((string) $data['reject_reason']) : null;
    } elseif (isset($data['status']) && $data['status'] === 'active') {
        // Clear reject reason after approval
        $sets[] = "reject_reason = NULL";
    }

    if (empty($sets)) {
        jsonResponse(400, ['error' => 'Không có dữ liệu cập nhật']);
    }

    $params[] = $id;
    $sql = "UPDATE properties SET " . implode(', ', $sets) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // Notify owner when admin moderates listing
    if ($user['role'] === 'admin' && isset($data['status']) && in_array($data['status'], ['active', 'rejected'], true)) {
        pushPropertyStatusNotification(
            $db,
            $id,
            (int) $prop['owner_id'],
            $data['status'],
            $data['reject_reason'] ?? null
        );
    }

    jsonResponse(200, ['message' => 'Cập nhật thành công']);
}

function bulkUpdatePropertyStatus(): void {
    $user = requireAdmin();
    $db = getDB();
    ensureModerationColumns($db);
    $data = getRequestBody();

    $ids = $data['ids'] ?? [];
    $status = $data['status'] ?? '';
    $rejectReason = trim((string) ($data['reject_reason'] ?? ''));

    if (!is_array($ids) || count($ids) === 0) {
        jsonResponse(400, ['error' => 'ids là bắt buộc']);
    }
    if (!in_array($status, ['pending', 'active', 'sold', 'rejected'], true)) {
        jsonResponse(400, ['error' => 'Trạng thái không hợp lệ']);
    }
    if ($status === 'rejected' && $rejectReason === '') {
        jsonResponse(400, ['error' => 'Vui lòng nhập lý do từ chối']);
    }

    $ids = array_values(array_unique(array_filter(array_map('intval', $ids), fn($x) => $x > 0)));
    if (count($ids) === 0) {
        jsonResponse(400, ['error' => 'ids không hợp lệ']);
    }

    $ph = implode(',', array_fill(0, count($ids), '?'));
    $sel = $db->prepare("SELECT id, owner_id FROM properties WHERE id IN ($ph)");
    $sel->execute($ids);
    $rows = $sel->fetchAll();
    if (count($rows) === 0) {
        jsonResponse(404, ['error' => 'Không tìm thấy tin đăng cần cập nhật']);
    }

    if ($status === 'rejected') {
        $upd = $db->prepare("UPDATE properties SET status = ?, reject_reason = ? WHERE id IN ($ph)");
        $upd->execute(array_merge([$status, $rejectReason], $ids));
    } elseif ($status === 'active') {
        $upd = $db->prepare("UPDATE properties SET status = ?, reject_reason = NULL WHERE id IN ($ph)");
        $upd->execute(array_merge([$status], $ids));
    } else {
        $upd = $db->prepare("UPDATE properties SET status = ? WHERE id IN ($ph)");
        $upd->execute(array_merge([$status], $ids));
    }

    if (in_array($status, ['active', 'rejected'], true)) {
        foreach ($rows as $r) {
            pushPropertyStatusNotification($db, (int)$r['id'], (int)$r['owner_id'], $status, $rejectReason ?: null);
        }
    }

    jsonResponse(200, ['message' => 'Cập nhật trạng thái hàng loạt thành công', 'updated' => count($rows)]);
}

function deleteProperty(int $id): void {
    $user = requireAuth();
    $db = getDB();

    $stmt = $db->prepare("SELECT owner_id FROM properties WHERE id = ?");
    $stmt->execute([$id]);
    $prop = $stmt->fetch();

    if (!$prop) {
        jsonResponse(404, ['error' => 'Không tìm thấy bất động sản']);
    }
    if ($prop['owner_id'] != $user['id'] && $user['role'] !== 'admin') {
        jsonResponse(403, ['error' => 'Bạn không có quyền xóa']);
    }

    $stmt = $db->prepare("DELETE FROM properties WHERE id = ?");
    $stmt->execute([$id]);

    jsonResponse(200, ['message' => 'Đã xóa thành công']);
}

function getMarketStats(): void {
    $db = getDB();

    // Tổng số BĐS
    $totalStmt = $db->query("SELECT COUNT(*) as total, SUM(status='active') as total_active FROM properties");
    $totals = $totalStmt->fetch();

    // Giá trung bình BĐS active
    $avgStmt = $db->query("SELECT AVG(price) as avg_price FROM properties WHERE status = 'active'");
    $avgPrice = (float) ($avgStmt->fetchColumn() ?? 0);

    // Phân loại theo type
    $typeStmt = $db->query("
        SELECT type, COUNT(*) as count, COALESCE(AVG(price), 0) as avg_price
        FROM properties
        WHERE status = 'active'
        GROUP BY type
        ORDER BY count DESC
    ");
    $byType = $typeStmt->fetchAll();
    foreach ($byType as &$t) {
        $t['count'] = (int) $t['count'];
        $t['avg_price'] = (float) $t['avg_price'];
    }

    // Số tin đăng theo tháng (12 tháng gần nhất)
    $monthStmt = $db->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
        FROM properties
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month
        ORDER BY month ASC
    ");
    $byMonth = $monthStmt->fetchAll();
    foreach ($byMonth as &$m) {
        $m['count'] = (int) $m['count'];
    }

    // Tổng users
    $userStmt = $db->query("SELECT COUNT(*) as total_users FROM users");
    $totalUsers = (int) $userStmt->fetchColumn();

    // Tổng reviews
    $reviewStmt = $db->query("SELECT COUNT(*) as total_reviews, COALESCE(AVG(rating),0) as avg_rating FROM reviews");
    $reviewStats = $reviewStmt->fetch();

    jsonResponse(200, [
        'total_properties' => (int) $totals['total'],
        'total_active' => (int) $totals['total_active'],
        'avg_price' => $avgPrice,
        'by_type' => $byType,
        'by_month' => $byMonth,
        'total_users' => $totalUsers,
        'total_reviews' => (int) $reviewStats['total_reviews'],
        'avg_rating' => (float) $reviewStats['avg_rating'],
    ]);
}
