<?php
// =============================================
// SmartRE API - Users Management
// =============================================
require_once __DIR__ . '/../config.php';

$method = getMethod();
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

switch ($method) {
    case 'GET':
        if ($id) {
            getUser($id);
        } else {
            getUsers();
        }
        break;
    case 'PUT':
        if (!$id) jsonResponse(400, ['error' => 'ID là bắt buộc']);
        updateUser($id);
        break;
    default:
        jsonResponse(405, ['error' => 'Method not allowed']);
}

function getUsers(): void {
    $user = requireAuth();

    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, display_name, photo_url, role, kyc_verified, created_at FROM users ORDER BY created_at DESC");
    $stmt->execute();
    $users = $stmt->fetchAll();

    foreach ($users as &$u) {
        $u['id'] = (int) $u['id'];
        $u['kyc_verified'] = (bool) $u['kyc_verified'];
    }

    jsonResponse(200, $users);
}

function getUser(int $id): void {
    $db = getDB();
    $stmt = $db->prepare("SELECT id, email, display_name, photo_url, role, kyc_verified, created_at FROM users WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(404, ['error' => 'Không tìm thấy người dùng']);
    }

    $user['id'] = (int) $user['id'];
    $user['kyc_verified'] = (bool) $user['kyc_verified'];

    jsonResponse(200, $user);
}

function updateUser(int $id): void {
    $currentUser = requireAuth();

    // Only self or admin can update
    if ($currentUser['id'] != $id && $currentUser['role'] !== 'admin') {
        jsonResponse(403, ['error' => 'Bạn không có quyền chỉnh sửa']);
    }

    $data = getRequestBody();
    $db = getDB();

    $allowed = ['display_name', 'photo_url', 'kyc_verified'];
    // Only admin can change role
    if ($currentUser['role'] === 'admin') {
        $allowed[] = 'role';
    }

    $sets = [];
    $params = [];

    foreach ($allowed as $field) {
        if (isset($data[$field])) {
            $sets[] = "{$field} = ?";
            $params[] = $data[$field];
        }
    }

    // Password change
    if (!empty($data['password'])) {
        $sets[] = "password = ?";
        $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    if (empty($sets)) {
        jsonResponse(400, ['error' => 'Không có dữ liệu cập nhật']);
    }

    $params[] = $id;
    $sql = "UPDATE users SET " . implode(', ', $sets) . " WHERE id = ?";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    jsonResponse(200, ['message' => 'Cập nhật thành công']);
}
