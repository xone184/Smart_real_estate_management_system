<?php
require_once __DIR__ . '/../config.php';

$user = requireAdmin();
$method = getMethod();

if ($method !== 'GET') {
    jsonResponse(405, ['error' => 'Method not allowed']);
}

try {
    $db = getDB();
    
    // Get aggregated analytics for users
    $sql = "
    SELECT 
        u.id, 
        u.email, 
        u.display_name, 
        u.source,
        u.created_at,
        (SELECT COUNT(*) FROM user_activities ua WHERE ua.user_id = u.id AND ua.activity_type IN ('view_news', 'view_property', 'search')) as recent_visits,
        (SELECT COUNT(*) FROM user_activities ua WHERE ua.user_id = u.id AND ua.activity_type = 'like_news') as news_likes,
        ui.top_keywords as interest_trends
    FROM users u
    LEFT JOIN user_interests ui ON u.id = ui.user_id
    ORDER BY u.created_at DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    $systemUsers = [];
    $externalUsers = [];
    
    foreach ($users as &$u) {
        $u['id'] = (int) $u['id'];
        $u['recent_visits'] = (int) $u['recent_visits'];
        $u['news_likes'] = (int) $u['news_likes'];
        $u['interest_trends'] = $u['interest_trends'] ? json_decode($u['interest_trends'], true) : [];
        
        if ($u['source'] === 'system' || empty($u['source'])) {
            $systemUsers[] = $u;
        } else {
            $externalUsers[] = $u;
        }
    }
    
    jsonResponse(200, [
        'status' => 'success',
        'data' => [
            'system' => $systemUsers,
            'external' => $externalUsers
        ]
    ]);
    
} catch (Exception $e) {
    jsonResponse(500, ['error' => 'Failed to fetch user analytics: ' . $e->getMessage()]);
}
