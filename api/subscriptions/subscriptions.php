<?php
// =============================================
// SmartRE API - Subscriptions (Gói đăng ký dịch vụ)
// =============================================
require_once __DIR__ . '/../config.php';

$method = getMethod();
$id     = isset($_GET['id']) ? (int) $_GET['id'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null;

switch ($method) {
    case 'GET':
        if ($action === 'admin_list') {
            adminListSubscriptions();
        } else {
            mySubscriptions();
        }
        break;
    case 'POST':
        if ($action === 'admin_assign_plan') {
            adminAssignPlan();
        } else {
            createSubscription();
        }
        break;
    case 'PUT':
        if (!$id) jsonResponse(400, ['error' => 'ID là bắt buộc']);
        updateSubscriptionStatus($id);
        break;
    case 'DELETE':
        if (!$id) jsonResponse(400, ['error' => 'ID là bắt buộc']);
        cancelSubscription($id);
        break;
    default:
        jsonResponse(405, ['error' => 'Method not allowed']);
}

// ── Người dùng xem gói đăng ký của mình ─────────────────────────────────────
function mySubscriptions(): void {
    $user = requireAuth();
    $db   = getDB();

    $stmt = $db->prepare("
        SELECT s.*, u.display_name as user_name, u.email as user_email
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        WHERE s.user_id = ?
        ORDER BY s.created_at DESC
    ");
    $stmt->execute([$user['id']]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id']      = (int) $r['id'];
        $r['user_id'] = (int) $r['user_id'];
    }

    jsonResponse(200, $rows);
}

// ── Admin xem tất cả yêu cầu ─────────────────────────────────────────────────
function adminListSubscriptions(): void {
    requireAdmin();
    $db = getDB();

    $stmt = $db->prepare("
        SELECT s.*,
               u.display_name as user_name,
               u.email        as user_email,
               u.role         as user_role,
               u.photo_url    as user_photo
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        ORDER BY
            FIELD(s.status,'pending','active','rejected','cancelled'),
            s.created_at DESC
    ");
    $stmt->execute();
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id']      = (int) $r['id'];
        $r['user_id'] = (int) $r['user_id'];
    }

    jsonResponse(200, $rows);
}

// ── Tạo yêu cầu đăng ký gói mới ──────────────────────────────────────────────
function createSubscription(): void {
    $user = requireAuth();
    $data = getRequestBody();

    $plan_name      = $data['plan_name']      ?? '';
    $plan_label     = $data['plan_label']     ?? '';
    $price_vnd      = $data['price_vnd']      ?? 'Miễn phí';
    $payment_method = $data['payment_method'] ?? 'contact';
    $note           = $data['note']           ?? '';

    $allowed_plans = ['basic', 'professional', 'enterprise'];
    if (!in_array($plan_name, $allowed_plans)) {
        jsonResponse(400, ['error' => 'Gói dịch vụ không hợp lệ']);
    }

    // Gói Cơ bản miễn phí: kích hoạt ngay, không cần Admin duyệt
    $initial_status = ($plan_name === 'basic') ? 'active' : 'pending';

    $db = getDB();

    // Huỷ yêu cầu pending cũ (nếu có) của user này
    $db->prepare("
        UPDATE subscriptions SET status = 'cancelled'
        WHERE user_id = ? AND status = 'pending'
    ")->execute([$user['id']]);

    $stmt = $db->prepare("
        INSERT INTO subscriptions (user_id, plan_name, plan_label, price_vnd, payment_method, status, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        $plan_name,
        $plan_label,
        $price_vnd,
        $payment_method,
        $initial_status,
        $note,
    ]);

    $new_id = (int) $db->lastInsertId();

    // Nếu là gói basic, kích hoạt ngay
    if ($plan_name === 'basic') {
        activateUserPlan($db, $user['id'], $plan_name);
    }

    jsonResponse(201, [
        'message' => $plan_name === 'basic'
            ? 'Đăng ký gói Cơ bản thành công!'
            : 'Yêu cầu đăng ký đã được gửi, vui lòng chờ quản trị viên xét duyệt.',
        'id'      => $new_id,
        'status'  => $initial_status,
    ]);
}

// ── Admin duyệt / từ chối ─────────────────────────────────────────────────────
function updateSubscriptionStatus(int $id): void {
    $admin = requireAdmin();
    $data  = getRequestBody();

    $status = $data['status'] ?? '';
    $note   = $data['note']   ?? '';

    $allowed = ['active', 'rejected', 'cancelled'];
    if (!in_array($status, $allowed)) {
        jsonResponse(400, ['error' => 'Trạng thái không hợp lệ (active | rejected | cancelled)']);
    }

    $db = getDB();

    // Lấy thông tin subscription
    $stmt = $db->prepare("SELECT * FROM subscriptions WHERE id = ?");
    $stmt->execute([$id]);
    $sub = $stmt->fetch();

    if (!$sub) {
        jsonResponse(404, ['error' => 'Không tìm thấy yêu cầu đăng ký']);
    }

    // Cập nhật trạng thái subscription
    $db->prepare("
        UPDATE subscriptions
        SET status = ?, note = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW()
        WHERE id = ?
    ")->execute([$status, $note, $admin['id'], $id]);

    // Nếu Admin DUYỆT → cung cấp dịch vụ tương ứng
    if ($status === 'active') {
        activateUserPlan($db, (int) $sub['user_id'], $sub['plan_name']);
    }

    jsonResponse(200, ['message' => 'Cập nhật trạng thái thành công', 'status' => $status]);
}

// ── Admin trực tiếp gán gói cho người dùng ───────────────────────────────────
function adminAssignPlan(): void {
    requireAdmin();
    $data = getRequestBody();

    $user_id    = $data['user_id']    ?? null;
    $plan_name  = $data['plan_name']  ?? '';
    $plan_label = $data['plan_label'] ?? '';

    if (!$user_id) {
        jsonResponse(400, ['error' => 'User ID là bắt buộc']);
    }

    $allowed_plans = ['basic', 'professional', 'enterprise'];
    if (!in_array($plan_name, $allowed_plans)) {
        jsonResponse(400, ['error' => 'Gói dịch vụ không hợp lệ']);
    }

    $db = getDB();

    // Huỷ các yêu cầu pending cũ của user này
    $db->prepare("
        UPDATE subscriptions SET status = 'cancelled'
        WHERE user_id = ? AND status = 'pending'
    ")->execute([$user_id]);

    // Tạo một record subscription mới với trạng thái active
    $stmt = $db->prepare("
        INSERT INTO subscriptions (user_id, plan_name, plan_label, price_vnd, payment_method, status, note, approved_at)
        VALUES (?, ?, ?, ?, ?, 'active', ?, NOW())
    ");
    
    $price = 'Miễn phí';
    if ($plan_name === 'professional') $price = '499.000đ/tháng';
    if ($plan_name === 'enterprise')   $price = 'Liên hệ';

    $stmt->execute([
        $user_id,
        $plan_name,
        $plan_label ?: ucfirst($plan_name),
        $price,
        'direct_assignment',
        'Được gán trực tiếp bởi Quản trị viên'
    ]);

    // Kích hoạt gói cho user
    activateUserPlan($db, (int) $user_id, $plan_name);

    jsonResponse(200, ['message' => "Đã gán gói " . ($plan_label ?: $plan_name) . " thành công"]);
}

// ── User tự huỷ gói đang pending ─────────────────────────────────────────────
function cancelSubscription(int $id): void {
    $user = requireAuth();
    $db   = getDB();

    $stmt = $db->prepare("SELECT * FROM subscriptions WHERE id = ? AND user_id = ?");
    $stmt->execute([$id, $user['id']]);
    $sub = $stmt->fetch();

    if (!$sub) {
        jsonResponse(404, ['error' => 'Không tìm thấy yêu cầu đăng ký']);
    }
    if ($sub['status'] !== 'pending') {
        jsonResponse(400, ['error' => 'Chỉ huỷ được yêu cầu đang chờ duyệt']);
    }

    $db->prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?")->execute([$id]);

    jsonResponse(200, ['message' => 'Đã huỷ yêu cầu đăng ký']);
}

// ── Helper: Cung cấp dịch vụ cho user khi gói được duyệt ─────────────────────
function activateUserPlan(PDO $db, int $user_id, string $plan_name): void {
    // Tính ngày hết hạn: basic = vĩnh viễn, còn lại 30 ngày
    $expires = null;
    if ($plan_name !== 'basic') {
        $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
    }

    // Nâng cấp role:
    //   - professional → agent (toàn quyền đăng tin không giới hạn, KYC ưu tiên)
    //   - enterprise   → agent (quyền cao nhất trong hệ thống)
    //   - basic        → giữ nguyên role hiện tại (user)
    $new_role_sql = '';
    if ($plan_name === 'professional' || $plan_name === 'enterprise') {
        $new_role_sql = ", role = 'agent'";
    }

    $column_exists_stmt = $db->query("SHOW COLUMNS FROM users LIKE 'subscription_plan'");
    if ($column_exists_stmt->rowCount() === 0) {
        // Cột chưa có, thêm vào (fallback an toàn)
        $db->exec("ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'basic'");
        $db->exec("ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP NULL DEFAULT NULL");
    }

    $db->prepare("
        UPDATE users
        SET subscription_plan = ?,
            subscription_expires_at = ?
            {$new_role_sql}
        WHERE id = ?
    ")->execute([$plan_name, $expires, $user_id]);
}
