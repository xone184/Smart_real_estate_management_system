<?php
/**
 * =============================================
 * User Permissions Management API
 * URL: /api/users/permissions.php
 * =============================================
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db = getDB();

try {
    // =============================================
    // 1. GET PERMISSIONS - Lấy danh sách permissions
    // =============================================
    if ($method === 'GET' && $action === 'list') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Optional: filter by category
        $category = $_GET['category'] ?? null;

        $query = "SELECT id, name, description, category, created_at FROM permissions WHERE 1=1";
        $params = [];

        if ($category) {
            $query .= " AND category = ?";
            $params[] = $category;
        }

        $query .= " ORDER BY category, name";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(200, ['status' => 'success', 'data' => $permissions]);
    }

    // =============================================
    // 2. GET USER PERMISSIONS - Lấy quyền của 1 user
    // =============================================
    else if ($method === 'GET' && $action === 'user') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            throw new Exception('Thiếu user_id', 400);
        }

        // Check if user can view this user's permissions
        if ($authUser['id'] != $userId && $authUser['role'] !== 'admin') {
            throw new Exception('Không có quyền xem', 403);
        }

        $stmt = $db->prepare("
            SELECT 
                p.id,
                p.name,
                p.description,
                p.category,
                up.granted_at,
                u.display_name as granted_by_name
            FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            LEFT JOIN users u ON up.granted_by = u.id
            WHERE up.user_id = ?
            ORDER BY p.category, p.name
        ");
        $stmt->execute([$userId]);
        $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(200, ['status' => 'success', 'data' => $permissions]);
    }

    // =============================================
    // 3. GRANT PERMISSION - Thêm quyền cho user
    // =============================================
    else if ($method === 'POST' && $action === 'grant') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Only admin can grant permissions
        if ($authUser['role'] !== 'admin') {
            throw new Exception('Chỉ admin có quyền cấp quyền', 403);
        }

        $data = getRequestBody();
        if (empty($data['user_id']) || empty($data['permission_id'])) {
            throw new Exception('Thiếu user_id hoặc permission_id', 400);
        }

        // Check if user exists
        $stmt = $db->prepare("SELECT id FROM users WHERE id = ?");
        $stmt->execute([$data['user_id']]);
        if (!$stmt->fetch()) {
            throw new Exception('Người dùng không tồn tại', 404);
        }

        // Check if permission exists
        $stmt = $db->prepare("SELECT id FROM permissions WHERE id = ?");
        $stmt->execute([$data['permission_id']]);
        if (!$stmt->fetch()) {
            throw new Exception('Quyền không tồn tại', 404);
        }

        // Grant permission (ignore if already exists - UNIQUE constraint)
        try {
            $stmt = $db->prepare("
                INSERT INTO user_permissions (user_id, permission_id, granted_by)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([
                $data['user_id'],
                $data['permission_id'],
                $authUser['id']
            ]);

            // Update permissions_updated_at
            $stmt = $db->prepare("UPDATE users SET permissions_updated_at = NOW() WHERE id = ?");
            $stmt->execute([$data['user_id']]);

            jsonResponse(200, [
                'status' => 'success',
                'message' => 'Cấp quyền thành công'
            ]);
        } catch (PDOException $e) {
            if (strpos($e->getMessage(), 'Duplicate') !== false) {
                throw new Exception('Người dùng đã có quyền này rồi', 409);
            }
            throw $e;
        }
    }

    // =============================================
    // 4. REVOKE PERMISSION - Hủy quyền
    // =============================================
    else if ($method === 'DELETE' && $action === 'revoke') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Only admin can revoke permissions
        if ($authUser['role'] !== 'admin') {
            throw new Exception('Chỉ admin có quyền hủy quyền', 403);
        }

        $data = getRequestBody();
        if (empty($data['user_id']) || empty($data['permission_id'])) {
            throw new Exception('Thiếu user_id hoặc permission_id', 400);
        }

        $stmt = $db->prepare("
            DELETE FROM user_permissions
            WHERE user_id = ? AND permission_id = ?
        ");
        $stmt->execute([
            $data['user_id'],
            $data['permission_id']
        ]);

        // Update permissions_updated_at
        $stmt = $db->prepare("UPDATE users SET permissions_updated_at = NOW() WHERE id = ?");
        $stmt->execute([$data['user_id']]);

        jsonResponse(200, [
            'status' => 'success',
            'message' => 'Hủy quyền thành công'
        ]);
    }

    // =============================================
    // 5. BULK ASSIGN - Gán nhiều quyền cùng lúc
    // =============================================
    else if ($method === 'POST' && $action === 'bulk') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        if ($authUser['role'] !== 'admin') {
            throw new Exception('Chỉ admin có quyền', 403);
        }

        $data = getRequestBody();
        if (empty($data['user_id']) || empty($data['permission_ids']) || !is_array($data['permission_ids'])) {
            throw new Exception('Thiếu user_id hoặc permission_ids (array)', 400);
        }

        $userId = $data['user_id'];
        $permissionIds = $data['permission_ids'];

        // Delete all existing permissions for this user
        $stmt = $db->prepare("DELETE FROM user_permissions WHERE user_id = ?");
        $stmt->execute([$userId]);

        // Insert new permissions
        $stmt = $db->prepare("
            INSERT INTO user_permissions (user_id, permission_id, granted_by)
            VALUES (?, ?, ?)
        ");

        foreach ($permissionIds as $permId) {
            $stmt->execute([$userId, $permId, $authUser['id']]);
        }

        // Update permissions_updated_at
        $stmt = $db->prepare("UPDATE users SET permissions_updated_at = NOW() WHERE id = ?");
        $stmt->execute([$userId]);

        jsonResponse(200, [
            'status' => 'success',
            'message' => 'Cấp quyền thành công cho ' . count($permissionIds) . ' quyền'
        ]);
    }

    // =============================================
    // 6. GET PERMISSION CATEGORIES - Lấy danh mục
    // =============================================
    else if ($method === 'GET' && $action === 'categories') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        $stmt = $db->query("SELECT DISTINCT category FROM permissions ORDER BY category");
        $categories = $stmt->fetchAll(PDO::FETCH_COLUMN);

        jsonResponse(200, ['status' => 'success', 'data' => $categories]);
    }

    // =============================================
    // 7. CHECK PERMISSION - Kiểm tra user có quyền không
    // =============================================
    else if ($method === 'GET' && $action === 'check') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        $userId = $_GET['user_id'] ?? $authUser['id'];
        $permissionName = $_GET['permission'] ?? null;

        if (!$permissionName) {
            throw new Exception('Thiếu permission name', 400);
        }

        // Check if user is admin (admin có tất cả quyền)
        $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            throw new Exception('Người dùng không tồn tại', 404);
        }

        if ($user['role'] === 'admin') {
            jsonResponse(200, ['status' => 'success', 'has_permission' => true]);
            return;
        }

        // Check if user has this permission
        $stmt = $db->prepare("
            SELECT up.id FROM user_permissions up
            JOIN permissions p ON up.permission_id = p.id
            WHERE up.user_id = ? AND p.name = ?
        ");
        $stmt->execute([$userId, $permissionName]);
        $hasPermission = $stmt->fetch() !== false;

        jsonResponse(200, [
            'status' => 'success',
            'has_permission' => $hasPermission
        ]);
    }

    else {
        throw new Exception('Action không hợp lệ: ' . $action, 400);
    }

} catch (Exception $e) {
    http_response_code($e->getCode() ?: 500);
    jsonResponse(200, ['status' => 'error', 'message' => $e->getMessage()]);
}
?>
