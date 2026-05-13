<?php
// =============================================
// Expiration Checker for Subscriptions
// =============================================

function checkSubscriptionExpirations(PDO $db): void {
    // 1. Gần hết hạn (trước 3 ngày)
    $stmtNear = $db->prepare("
        SELECT id, display_name, subscription_plan, subscription_expires_at 
        FROM users 
        WHERE subscription_plan != 'basic' 
          AND subscription_expires_at <= DATE_ADD(NOW(), INTERVAL 3 DAY)
          AND subscription_expires_at > NOW()
          AND sub_exp_notified_near = 0
    ");
    $stmtNear->execute();
    $nearUsers = $stmtNear->fetchAll();

    foreach ($nearUsers as $u) {
        $plan_label = ($u['subscription_plan'] === 'professional') ? 'Chuyên nghiệp' : 'Doanh nghiệp';
        $exp_date = date('d/m/Y', strtotime($u['subscription_expires_at']));
        
        $msg = "Gói dịch vụ \"{$plan_label}\" của bạn sẽ hết hạn vào ngày {$exp_date}. Vui lòng gia hạn để tiếp tục sử dụng các tính năng ưu việt.";
        
        $stmtNoti = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, 'Gói dịch vụ sắp hết hạn', ?, 'warning', 'profile:subscription')
        ");
        $stmtNoti->execute([$u['id'], $msg]);

        $db->prepare("UPDATE users SET sub_exp_notified_near = 1 WHERE id = ?")->execute([$u['id']]);
    }

    // 2. Đã hết hạn
    $stmtExpired = $db->prepare("
        SELECT id, display_name, subscription_plan, subscription_expires_at 
        FROM users 
        WHERE subscription_plan != 'basic' 
          AND subscription_expires_at <= NOW()
          AND sub_exp_notified_done = 0
    ");
    $stmtExpired->execute();
    $expiredUsers = $stmtExpired->fetchAll();

    foreach ($expiredUsers as $u) {
        $plan_label = ($u['subscription_plan'] === 'professional') ? 'Chuyên nghiệp' : 'Doanh nghiệp';
        
        $msg = "Gói dịch vụ \"{$plan_label}\" của bạn đã hết hạn. Tài khoản đã được chuyển về gói Cơ bản.";
        
        $stmtNoti = $db->prepare("
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, 'Gói dịch vụ đã hết hạn', ?, 'error', 'profile:subscription')
        ");
        $stmtNoti->execute([$u['id'], $msg]);

        // Downgrade user
        $db->prepare("
            UPDATE users 
            SET subscription_plan = 'basic', 
                subscription_expires_at = NULL,
                role = 'user',
                sub_exp_notified_near = 0,
                sub_exp_notified_done = 0
            WHERE id = ?
        ")->execute([$u['id']]);
        
        // Cập nhật trạng thái các record subscription cũ thành cancelled/expired nếu cần
        // (Tùy chọn: có thể đánh dấu trong bảng subscriptions là đã hết hạn)
    }
}
