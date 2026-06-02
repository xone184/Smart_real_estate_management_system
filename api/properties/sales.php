<?php
/**
 * =============================================
 * Property Sales Management API
 * Xử lý chốt giá, xác nhận mua bất động sản
 * URL: /api/properties/sales.php
 * =============================================
 */

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$db = getDB();

try {
    // =============================================
    // 1. CREATE SALE PROPOSAL - Tạo đề nghị chốt giá
    // =============================================
    if ($method === 'POST' && $action === 'propose') {
        $data = getRequestBody();
        
        // Validate
        if (empty($data['property_id']) || empty($data['buyer_id']) || empty($data['agreed_price'])) {
            throw new Exception('Thiếu thông tin bắt buộc: property_id, buyer_id, agreed_price');
        }

        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Get property
        $stmt = $db->prepare("SELECT * FROM properties WHERE id = ?");
        $stmt->execute([$data['property_id']]);
        $property = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$property) {
            throw new Exception('Không tìm thấy bất động sản', 404);
        }

        // Check if user is owner or agent
        $isOwner = $property['owner_id'] === $authUser['id'];
        $isAdmin = $authUser['role'] === 'admin';
        $isAgent = $authUser['role'] === 'agent';
        
        if (!$isOwner && !$isAdmin && !$isAgent) {
            throw new Exception('Bạn không có quyền thực hiện hành động này', 403);
        }

        // Create transaction
        $stmt = $db->prepare("INSERT INTO transactions (property_id, seller_id, buyer_id, agreed_price, notes) 
                           VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $data['property_id'],
            $property['owner_id'],
            $data['buyer_id'],
            $data['agreed_price'],
            $data['notes'] ?? ''
        ]);

        $transactionId = $db->lastInsertId();

        // Get buyer info
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$data['buyer_id']]);
        $buyer = $stmt->fetch(PDO::FETCH_ASSOC);

        // Send notification to seller/owner
        sendNotification(
            $property['owner_id'],
            'Có đề nghị chốt giá mới',
            'Bất động sản "' . $property['title'] . '" có đề nghị chốt giá ' . number_format($data['agreed_price']) . ' VNĐ từ ' . $buyer['display_name'],
            'warning',
            'property_sale_proposed',
            $data['property_id']
        );

        // Send notification to admin
        $stmt = $db->prepare("SELECT id FROM users WHERE role = 'admin'");
        $stmt->execute();
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($admins as $admin) {
            sendNotification(
                $admin['id'],
                'Đề nghị chốt giá bất động sản mới',
                'Bất động sản "' . $property['title'] . '" - Chốt giá: ' . number_format($data['agreed_price']) . ' VNĐ',
                'info',
                'property_sale_proposed',
                $data['property_id']
            );
        }

        jsonResponse(201, ['status' => 'success', 'message' => 'Tạo đề nghị chốt giá thành công', 'transaction_id' => $transactionId]);
    }

    // =============================================
    // 2. CONFIRM SALE - Xác nhận chốt giá thành công
    // =============================================
    elseif ($method === 'POST' && $action === 'confirm') {
        $data = getRequestBody();
        
        if (empty($data['transaction_id'])) {
            throw new Exception('Thiếu transaction_id');
        }

        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        // Get transaction
        $stmt = $db->prepare("SELECT * FROM transactions WHERE id = ?");
        $stmt->execute([$data['transaction_id']]);
        $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$transaction) {
            throw new Exception('Không tìm thấy giao dịch', 404);
        }

        // Get property
        $stmt = $db->prepare("SELECT * FROM properties WHERE id = ?");
        $stmt->execute([$transaction['property_id']]);
        $property = $stmt->fetch(PDO::FETCH_ASSOC);

        // Check permission (seller, buyer, admin, agent)
        $isSeller = $authUser['id'] === $transaction['seller_id'];
        $isBuyer = $authUser['id'] === $transaction['buyer_id'];
        $isAdmin = $authUser['role'] === 'admin';
        $isAgent = $authUser['role'] === 'agent';

        if (!($isSeller || $isBuyer || $isAdmin || $isAgent)) {
            throw new Exception('Bạn không có quyền xác nhận giao dịch này', 403);
        }

        // Update transaction status
        $stmt = $db->prepare("UPDATE transactions SET status = 'agreed', agreed_at = NOW() WHERE id = ?");
        $stmt->execute([$data['transaction_id']]);

        // Update property status to 'sold'
        $stmt = $db->prepare("UPDATE properties 
                           SET status = 'sold', 
                               sold_to_user_id = ?, 
                               sold_price = ?, 
                               sold_date = NOW(),
                               sale_notes = ?
                           WHERE id = ?");
        $stmt->execute([
            $transaction['buyer_id'],
            $transaction['agreed_price'],
            $data['notes'] ?? '',
            $transaction['property_id']
        ]);

        // Get buyer info
        $stmt = $db->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$transaction['buyer_id']]);
        $buyer = $stmt->fetch(PDO::FETCH_ASSOC);

        // =============================================
        // Send Notifications
        // =============================================

        // 1. Notify seller
        sendNotification(
            $transaction['seller_id'],
            '🎉 Bất động sản đã bán thành công',
            'Bất động sản "' . $property['title'] . '" đã bán với giá ' . number_format($transaction['agreed_price']) . ' VNĐ',
            'success',
            'property_sold_seller',
            $transaction['property_id']
        );

        // 2. Notify buyer
        sendNotification(
            $transaction['buyer_id'],
            '✅ Đã mua bất động sản thành công',
            'Bạn đã mua thành công bất động sản "' . $property['title'] . '" với giá ' . number_format($transaction['agreed_price']) . ' VNĐ',
            'success',
            'property_sold_buyer',
            $transaction['property_id']
        );

        // 3. Notify admin
        $stmt = $db->prepare("SELECT id FROM users WHERE role = 'admin'");
        $stmt->execute();
        $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($admins as $admin) {
            sendNotification(
                $admin['id'],
                '📊 Bất động sản đã bán',
                $property['title'] . ' - Bán bởi: ' . $property['owner_id'] . ' - Mua bởi: ' . $buyer['display_name'] . ' - Giá: ' . number_format($transaction['agreed_price']) . ' VNĐ',
                'success',
                'property_sold_admin',
                $transaction['property_id']
            );
        }

        jsonResponse(200, [
            'status' => 'success', 
            'message' => 'Xác nhận chốt giá thành công',
            'transaction_id' => $data['transaction_id']
        ]);
    }

    // =============================================
    // 3. GET SALE HISTORY - Lấy lịch sử chốt giá
    // =============================================
    elseif ($method === 'GET' && $action === 'history') {
        $authUser = getAuthUser();
        if (!$authUser) {
            throw new Exception('Chưa đăng nhập', 401);
        }

        $propertyId = $_GET['property_id'] ?? null;
        $userId = $_GET['user_id'] ?? null;

        $query = "SELECT t.*, 
                         p.title as property_title, 
                         u1.display_name as seller_name,
                         u2.display_name as buyer_name
                  FROM transactions t
                  LEFT JOIN properties p ON t.property_id = p.id
                  LEFT JOIN users u1 ON t.seller_id = u1.id
                  LEFT JOIN users u2 ON t.buyer_id = u2.id
                  WHERE 1=1";
        
        $params = [];
        
        if ($propertyId) {
            $query .= " AND t.property_id = ?";
            $params[] = $propertyId;
        }
        
        if ($userId) {
            $query .= " AND (t.seller_id = ? OR t.buyer_id = ?)";
            $params[] = $userId;
            $params[] = $userId;
        }

        $query .= " ORDER BY t.created_at DESC LIMIT 50";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        jsonResponse(200, ['status' => 'success', 'data' => $history]);
    }

    // =============================================
    // 4. GET SALE INFO - Lấy thông tin chốt giá của bất động sản
    // =============================================
    elseif ($method === 'GET' && $action === 'info') {
        $propertyId = $_GET['property_id'] ?? null;
        
        if (!$propertyId) {
            throw new Exception('Thiếu property_id');
        }

        $stmt = $db->prepare("SELECT id, status, sold_to_user_id, sold_price, sold_date, sale_notes 
                           FROM properties WHERE id = ?");
        $stmt->execute([$propertyId]);
        $property = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$property) {
            throw new Exception('Không tìm thấy bất động sản', 404);
        }

        jsonResponse(200, ['status' => 'success', 'data' => $property]);
    }

    else {
        throw new Exception('Action không hợp lệ: ' . $action, 400);
    }

} catch (Exception $e) {
    jsonResponse($e->getCode() ?: 500, ['status' => 'error', 'message' => $e->getMessage()]);
}
?>
