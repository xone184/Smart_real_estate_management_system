<?php
require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Requires authentication
if (!isset($_SESSION['user_id'])) {
    jsonResponse(401, ['error' => 'Vui lòng đăng nhập']);
}

$user_id = $_SESSION['user_id'];
$user_role = $_SESSION['role'] ?? 'user';

switch ($method) {
    case 'GET':
        getAppointments($user_id, $user_role);
        break;
    case 'POST':
        createAppointment($user_id);
        break;
    case 'PUT':
    case 'PATCH':
        if ($action === 'bulk_update') {
            bulkUpdateAppointmentStatus($user_id, $user_role);
        } else {
            updateAppointmentStatus($user_id, $user_role);
        }
        break;
    default:
        jsonResponse(405, ['error' => 'Method not allowed']);
}

function parseTimeSlotStart(string $time_slot): string {
    // Expect formats like "09:00 - 10:00" or "09:00-10:00"
    $parts = preg_split('/\s*-\s*/', trim($time_slot));
    $start = trim($parts[0] ?? '');
    if ($start === '') return '00:00';
    // Normalize to HH:MM
    if (preg_match('/^\d{1,2}:\d{2}$/', $start)) return $start;
    return '00:00';
}

function isOverdue(array $apt): bool {
    if (($apt['status'] ?? '') !== 'pending') return false;
    $visit_date = $apt['visit_date'] ?? '';
    $time_slot = $apt['time_slot'] ?? '';
    if (!$visit_date || !$time_slot) return false;

    $start = parseTimeSlotStart($time_slot);
    $dt = DateTime::createFromFormat('Y-m-d H:i', "{$visit_date} {$start}");
    if (!$dt) return false;

    $now = new DateTime('now');
    // Grace: 15 minutes after start time
    $dt->modify('+15 minutes');
    return $now > $dt;
}

function ensureApologyNotification(PDO $db, array $apt): void {
    // Only for overdue pending appointments
    if (!isOverdue($apt)) return;

    $aptId = (int)($apt['id'] ?? 0);
    $visitorId = (int)($apt['user_id'] ?? 0);
    if ($aptId <= 0 || $visitorId <= 0) return;

    $link = "appointment_overdue:{$aptId}";
    $check = $db->prepare("SELECT id FROM notifications WHERE user_id = ? AND link = ? LIMIT 1");
    $check->execute([$visitorId, $link]);
    if ($check->fetch()) return; // already notified

    $title = "Xin lỗi! Lịch hẹn đã quá hạn";
    $propertyTitle = $apt['property_title'] ?? 'bất động sản';
    $visitDate = $apt['visit_date'] ?? '';
    $timeSlot = $apt['time_slot'] ?? '';
    $message = "Rất tiếc, lịch hẹn xem \"{$propertyTitle}\" vào {$timeSlot} ngày {$visitDate} chưa được xác nhận và đã quá hạn. "
             . "Bạn có thể đặt lại lịch hẹn mới bất cứ lúc nào.";

    $ins = $db->prepare("INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'warning', ?)");
    $ins->execute([$visitorId, $title, $message, $link]);
}

function getAppointments(int $user_id, string $user_role): void {
    $db = getDB();
    
    // Nếu là admin thì thấy hết, nếu ko tự thấy của mình (dù là user đi đặt hay owner được đặt)
    if ($user_role === 'admin') {
        $stmt = $db->prepare("
            SELECT a.*, p.title as property_title, u.display_name as visitor_name, o.display_name as owner_name 
            FROM appointments a
            JOIN properties p ON a.property_id = p.id
            JOIN users u ON a.user_id = u.id
            JOIN users o ON a.owner_id = o.id
            ORDER BY a.visit_date DESC
        ");
        $stmt->execute();
    } else {
        $stmt = $db->prepare("
            SELECT a.*, p.title as property_title, u.display_name as visitor_name, o.display_name as owner_name 
            FROM appointments a
            JOIN properties p ON a.property_id = p.id
            JOIN users u ON a.user_id = u.id
            JOIN users o ON a.owner_id = o.id
            WHERE a.user_id = ? OR a.owner_id = ?
            ORDER BY a.visit_date DESC
        ");
        $stmt->execute([$user_id, $user_id]);
    }
    
    $result = $stmt->fetchAll();

    // Add derived status & auto-apology notifications (idempotent by link)
    foreach ($result as &$apt) {
        $apt['id'] = (int)($apt['id'] ?? 0);
        $apt['property_id'] = (int)($apt['property_id'] ?? 0);
        $apt['user_id'] = (int)($apt['user_id'] ?? 0);
        $apt['owner_id'] = (int)($apt['owner_id'] ?? 0);
        $apt['is_overdue'] = isOverdue($apt);
        if ($apt['is_overdue']) {
            ensureApologyNotification($db, $apt);
        }
    }
    jsonResponse(200, $result);
}

function createAppointment(int $user_id): void {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $property_id = $data['property_id'] ?? 0;
    $visit_date = $data['visit_date'] ?? '';
    $time_slot = $data['time_slot'] ?? '';
    $message = $data['message'] ?? '';

    if (!$property_id || !$visit_date || !$time_slot) {
        jsonResponse(400, ['error' => 'Vui lòng điền đầy đủ ngày giờ và chọn BĐS']);
    }

    $db = getDB();

    // Check if property exists and get owner_id
    $propStmt = $db->prepare("SELECT owner_id, title FROM properties WHERE id = ?");
    $propStmt->execute([$property_id]);
    $prop = $propStmt->fetch();

    if (!$prop) {
        jsonResponse(404, ['error' => 'Không tìm thấy BĐS']);
    }

    $owner_id = $prop['owner_id'];

    // Don't allow booking own property
    if ($owner_id === $user_id) {
        jsonResponse(400, ['error' => 'Bạn không thể đặt lịch xem chính BĐS của mình']);
    }

    $stmt = $db->prepare("INSERT INTO appointments (property_id, user_id, owner_id, visit_date, time_slot, message) VALUES (?, ?, ?, ?, ?, ?)");
    
    try {
        $stmt->execute([$property_id, $user_id, $owner_id, $visit_date, $time_slot, $message]);
        
        // Tạo notification cho owner
        $notiStmt = $db->prepare("INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')");
        $notiStmt->execute([
            $owner_id, 
            'Có người đặt lịch xem nhà', 
            "Một khách hàng vừa đặt lịch xem \"{$prop['title']}\" vào lúc $time_slot ngày $visit_date."
        ]);

        jsonResponse(201, ['message' => 'Đặt lịch xem nhà thành công', 'id' => $db->lastInsertId()]);
    } catch (PDOException $e) {
        jsonResponse(500, ['error' => 'Lỗi hệ thống khi lưu lịch hẹn']);
    }
}

function updateAppointmentStatus(int $user_id, string $user_role): void {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = intval($_GET['id'] ?? 0);
    $status = $data['status'] ?? ''; // 'pending', 'confirmed', 'cancelled', 'completed'
    
    if (!$id || !in_array($status, ['pending', 'confirmed', 'cancelled', 'completed'])) {
        jsonResponse(400, ['error' => 'Dữ liệu không hợp lệ']);
    }

    $db = getDB();
    
    // Check ownership
    $stmt = $db->prepare("SELECT user_id, owner_id FROM appointments WHERE id = ?");
    $stmt->execute([$id]);
    $apt = $stmt->fetch();

    if (!$apt) {
        jsonResponse(404, ['error' => 'Không tìm thấy lịch hẹn']);
    }

    // Ai có quyền đổi status?
    // Owner có quyền xác nhận (confirmed), báo hoàn thành (completed) hoặc huỷ (cancelled)
    // Người đặt (user_id) có quyền huỷ (cancelled)
    // Admin có mọi quyền
    $canEdit = ($user_role === 'admin') || 
               ($apt['owner_id'] === $user_id) || 
               ($apt['user_id'] === $user_id && $status === 'cancelled');

    if (!$canEdit) {
        jsonResponse(403, ['error' => 'Không có quyền thay đổi trạng thái']);
    }

    $updateStmt = $db->prepare("UPDATE appointments SET status = ? WHERE id = ?");
    $updateStmt->execute([$status, $id]);
    
    jsonResponse(200, ['message' => 'Cập nhật trạng thái thành công']);
}

function bulkUpdateAppointmentStatus(int $user_id, string $user_role): void {
    $data = json_decode(file_get_contents("php://input"), true);
    $ids = $data['ids'] ?? [];
    $status = $data['status'] ?? '';

    if (!is_array($ids) || count($ids) === 0) {
        jsonResponse(400, ['error' => 'ids là bắt buộc']);
    }
    if (!in_array($status, ['pending', 'confirmed', 'cancelled', 'completed'], true)) {
        jsonResponse(400, ['error' => 'Trạng thái không hợp lệ']);
    }

    $ids = array_values(array_unique(array_map('intval', $ids)));
    $ids = array_filter($ids, fn($x) => $x > 0);
    if (count($ids) === 0) {
        jsonResponse(400, ['error' => 'ids không hợp lệ']);
    }

    $db = getDB();

    // Admin can update any. Otherwise only owner can bulk-confirm/cancel/complete their own appointments.
    if ($user_role !== 'admin') {
        // Only allow owner to bulk confirm/cancel/complete; disallow setting to pending in bulk for safety
        if ($status === 'pending') {
            jsonResponse(403, ['error' => 'Không cho phép chuyển về pending hàng loạt']);
        }
    }

    // Fetch allowed ids
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    if ($user_role === 'admin') {
        $sel = $db->prepare("SELECT id, user_id, owner_id, status, visit_date, time_slot FROM appointments WHERE id IN ($placeholders)");
        $sel->execute($ids);
    } else {
        $params = array_merge([$user_id], $ids);
        $sel = $db->prepare("SELECT id, user_id, owner_id, status, visit_date, time_slot FROM appointments WHERE owner_id = ? AND id IN ($placeholders)");
        $sel->execute($params);
    }
    $rows = $sel->fetchAll();
    if (count($rows) === 0) {
        jsonResponse(403, ['error' => 'Không có lịch hẹn hợp lệ để cập nhật']);
    }

    $allowedIds = array_map(fn($r) => (int)$r['id'], $rows);
    $ph2 = implode(',', array_fill(0, count($allowedIds), '?'));
    $upd = $db->prepare("UPDATE appointments SET status = ? WHERE id IN ($ph2)");
    $upd->execute(array_merge([$status], $allowedIds));

    jsonResponse(200, [
        'message' => 'Cập nhật hàng loạt thành công',
        'updated' => count($allowedIds),
        'ids' => $allowedIds,
    ]);
}
