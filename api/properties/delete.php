<?php
/**
 * =============================================
 * Property Deletion & Management API
 * Xóa bất động sản đã bán, quản lý tin đăng
 * URL: /api/properties/delete.php
 * =============================================
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db = getDB();

try {
    // =============================================
    // 1. DELETE SOLD PROPERTY - Xóa bất động sản đã bán
    // =============================================
    if ($method === 'DELETE' && $action === 'sold') {
        $data = getRequestBody();
        
        if (empty($data['property_id'])) {
            throw new Exception('Thiếu property_id');
        }

        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Get property info
        $stmt = $db->prepare("SELECT * FROM properties WHERE id = ?");
        $stmt->execute([$data['property_id']]);
        $property = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$property) {
            throw new Exception('Không tìm thấy bất động sản', 404);
        }

        // Check permission:
        // - Owner (người đăng tin)
        // - Admin
        // - Agent (if they manage this property)
        $isOwner = $property['owner_id'] === $authUser['id'];
        $isAdmin = $authUser['role'] === 'admin';
        $isAgent = $authUser['role'] === 'agent';

        if (!($isOwner || $isAdmin || $isAgent)) {
            throw new Exception('Bạn không có quyền xóa bất động sản này', 403);
        }

        // Verify that property is sold
        if ($property['status'] !== 'sold') {
            throw new Exception('Chỉ có thể xóa bất động sản đã bán. Trạng thái hiện tại: ' . $property['status'], 400);
        }

        // =============================================
        // Log deletion
        // =============================================
        $stmt = $db->prepare("INSERT INTO property_deletion_logs 
                           (property_id, property_title, owner_id, deleted_by, reason, notes) 
                           VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $property['id'],
            $property['title'],
            $property['owner_id'],
            $authUser['id'],
            'sold',
            $data['notes'] ?? ''
        ]);

        // =============================================
        // Delete property
        // =============================================
        $stmt = $db->prepare("DELETE FROM properties WHERE id = ?");
        $stmt->execute([$property['id']]);

        // =============================================
        // Send notifications
        // =============================================

        // Notify owner
        sendNotification(
            $property['owner_id'],
            '🗑️ Tin đăng đã xóa',
            'Bất động sản "' . $property['title'] . '" đã bán và được xóa khỏi hệ thống',
            'info',
            'property_deleted',
            $property['id']
        );

        // Notify admin
        $stmt = $db->prepare("SELECT id FROM users WHERE role = 'admin'");
        $stmt->execute();
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($admins as $admin) {
            sendNotification(
                $admin['id'],
                'Tin đăng đã xóa - ' . $property['title'],
                'Xóa bởi: ' . $authUser['display_name'] . ' - Lý do: Đã bán',
                'info',
                'property_deleted_admin',
                $property['id']
            );
        }

        jsonResponse(200, [
            'status' => 'success',
            'message' => 'Xóa bất động sản thành công',
            'property_id' => $property['id']
        ]);
    }

    // =============================================
    // 2. DELETE UNSOLD PROPERTY - Xóa bất động sản chưa bán
    // =============================================
    elseif ($method === 'DELETE' && $action === 'unsold') {
        $data = getRequestBody();
        
        if (empty($data['property_id'])) {
            throw new Exception('Thiếu property_id');
        }

        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Get property info
        $stmt = $db->prepare("SELECT * FROM properties WHERE id = ?");
        $stmt->execute([$data['property_id']]);
        $property = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$property) {
            throw new Exception('Không tìm thấy bất động sản', 404);
        }

        // Check permission: Only owner, admin, or agent
        $isOwner = $property['owner_id'] === $authUser['id'];
        $isAdmin = $authUser['role'] === 'admin';
        $isAgent = $authUser['role'] === 'agent';

        if (!($isOwner || $isAdmin || $isAgent)) {
            throw new Exception('Bạn không có quyền xóa bất động sản này', 403);
        }

        // Can delete if: pending, active, or rejected
        $allowedStatuses = ['pending', 'active', 'rejected'];
        if (!in_array($property['status'], $allowedStatuses)) {
            throw new Exception('Không thể xóa bất động sản có trạng thái: ' . $property['status'], 400);
        }

        // Log deletion
        $stmt = $db->prepare("INSERT INTO property_deletion_logs 
                           (property_id, property_title, owner_id, deleted_by, reason, notes) 
                           VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $property['id'],
            $property['title'],
            $property['owner_id'],
            $authUser['id'],
            'manual_deletion',
            $data['notes'] ?? ''
        ]);

        // Delete property
        $stmt = $db->prepare("DELETE FROM properties WHERE id = ?");
        $stmt->execute([$property['id']]);

        // Notify owner
        sendNotification(
            $property['owner_id'],
            '🗑️ Tin đăng đã xóa',
            'Bất động sản "' . $property['title'] . '" đã bị xóa',
            'info',
            'property_deleted',
            $property['id']
        );

        jsonResponse(200, [
            'status' => 'success',
            'message' => 'Xóa bất động sản thành công'
        ]);
    }

    // =============================================
    // 3. GET DELETION LOGS - Lấy lịch sử xóa
    // =============================================
    elseif ($method === 'GET' && $action === 'logs') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Admin only
        if ($authUser['role'] !== 'admin') {
            throw new Exception('Chỉ admin mới có quyền xem lịch sử xóa', 403);
        }

        $limit = $_GET['limit'] ?? 50;
        $offset = $_GET['offset'] ?? 0;

        $stmt = $db->prepare("SELECT 
                            dl.*,
                            u1.display_name as owner_name,
                            u2.display_name as deleted_by_name
                         FROM property_deletion_logs dl
                         LEFT JOIN users u1 ON dl.owner_id = u1.id
                         LEFT JOIN users u2 ON dl.deleted_by = u2.id
                         ORDER BY dl.deleted_at DESC
                         LIMIT ? OFFSET ?");
        $stmt->execute([$limit, $offset]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get total count
        $stmt = $db->prepare("SELECT COUNT(*) as total FROM property_deletion_logs");
        $stmt->execute();
        $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        jsonResponse(200, [
            'status' => 'success',
            'data' => $logs,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset
            ]
        ]);
    }

    // =============================================
    // 4. RESTORE PROPERTY - Khôi phục bất động sản đã xóa
    // =============================================
    elseif ($method === 'POST' && $action === 'restore') {
        $data = getRequestBody();
        
        if (empty($data['property_id'])) {
            throw new Exception('Thiếu property_id');
        }

        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Admin only
        if ($authUser['role'] !== 'admin') {
            throw new Exception('Chỉ admin mới có quyền khôi phục bất động sản', 403);
        }

        // Check if deletion log exists
        $stmt = $db->prepare("SELECT * FROM property_deletion_logs WHERE property_id = ?");
        $stmt->execute([$data['property_id']]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$log) {
            throw new Exception('Không tìm thấy lịch sử xóa cho bất động sản này', 404);
        }

        // Note: Cannot restore deleted properties because data is already removed
        // This is for record keeping only
        throw new Exception('Không thể khôi phục bất động sản đã xóa vì dữ liệu không còn. Bạn có thể liên hệ admin để được hỗ trợ thêm.', 400);
    }

    else {
        throw new Exception('Action không hợp lệ: ' . $action, 400);
    }

} catch (Exception $e) {
    jsonResponse($e->getCode() ?: 500, ['status' => 'error', 'message' => $e->getMessage()]);
}
?>
