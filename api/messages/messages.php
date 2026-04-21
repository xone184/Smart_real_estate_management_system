<?php
// =============================================
// SmartRE API - Messages & Conversations (Chat)
// =============================================
require_once __DIR__ . '/../config.php';

$method = getMethod();
$action = $_GET['action'] ?? '';
$conv_id = isset($_GET['conversation_id']) ? (int)$_GET['conversation_id'] : null;

switch ($method) {
    case 'GET':
        $user = requireAuth();
        if ($action === 'contacts')         getContacts($user);
        elseif ($action === 'conversations') getConversations($user);
        elseif ($action === 'unread_count') getUnreadCount($user);
        elseif ($conv_id)                   getMessages($user, $conv_id);
        else jsonResponse(400, ['error' => 'Thiếu tham số']);
        break;
    case 'POST':
        $user = requireAuth();
        sendMessage($user);
        break;
    default:
        jsonResponse(405, ['error' => 'Method not allowed']);
}

// ── Danh sách liên hệ hợp lệ ─────────────────────────────────────────────────
function getContacts(array $user): void {
    $db = getDB();
    $uid = (int)$user['id'];
    $role = $user['role'];

    if ($role === 'admin') {
        // Admin thấy tất cả user & agent
        $stmt = $db->prepare("
            SELECT id, display_name, photo_url, role, email
            FROM users
            WHERE id != ?
            ORDER BY role DESC, display_name ASC
        ");
        $stmt->execute([$uid]);
    } else {
        // Luôn thêm admin
        // Cộng thêm agents/users có appointment chung
        $stmt = $db->prepare("
            SELECT DISTINCT u.id, u.display_name, u.photo_url, u.role, u.email
            FROM users u
            WHERE u.role = 'admin'
            UNION
            SELECT DISTINCT u.id, u.display_name, u.photo_url, u.role, u.email
            FROM users u
            JOIN appointments a ON (
                (a.user_id = ? AND a.owner_id = u.id)
                OR
                (a.owner_id = ? AND a.user_id = u.id)
            )
            WHERE u.id != ?
            ORDER BY role DESC, display_name ASC
        ");
        $stmt->execute([$uid, $uid, $uid]);
    }

    $contacts = $stmt->fetchAll();
    foreach ($contacts as &$c) {
        $c['id'] = (int)$c['id'];
    }
    jsonResponse(200, $contacts);
}

// ── Danh sách hội thoại của user ─────────────────────────────────────────────
function getConversations(array $user): void {
    $db = getDB();
    $uid = (int)$user['id'];

    $stmt = $db->prepare("
        SELECT
            c.id,
            c.last_message,
            c.last_message_at,
            -- partner info
            CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END AS partner_id,
            u.display_name AS partner_name,
            u.photo_url    AS partner_photo,
            u.role         AS partner_role,
            -- unread count for current user
            (SELECT COUNT(*) FROM messages m
             WHERE m.conversation_id = c.id
               AND m.sender_id != ?
               AND m.is_read = 0) AS unread_count
        FROM conversations c
        JOIN users u ON u.id = (CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END)
        WHERE c.user1_id = ? OR c.user2_id = ?
        ORDER BY c.last_message_at DESC
    ");
    $stmt->execute([$uid, $uid, $uid, $uid, $uid]);

    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['id']          = (int)$r['id'];
        $r['partner_id']  = (int)$r['partner_id'];
        $r['unread_count'] = (int)$r['unread_count'];
    }

    jsonResponse(200, $rows);
}

// ── Lấy tin nhắn trong 1 hội thoại ──────────────────────────────────────────
function getMessages(array $user, int $conv_id): void {
    $db  = getDB();
    $uid = (int)$user['id'];

    // Kiểm tra user có trong conversation không
    $check = $db->prepare("SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)");
    $check->execute([$conv_id, $uid, $uid]);
    if (!$check->fetch()) {
        jsonResponse(403, ['error' => 'Không có quyền truy cập']);
    }

    // Đánh dấu đã đọc tất cả tin của phía kia
    $db->prepare("UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ? AND is_read = 0")
       ->execute([$conv_id, $uid]);

    // Lấy tin nhắn (tối đa 100 tin gần nhất)
    $stmt = $db->prepare("
        SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at,
               u.display_name AS sender_name, u.photo_url AS sender_photo
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
        LIMIT 100
    ");
    $stmt->execute([$conv_id]);

    $msgs = $stmt->fetchAll();
    foreach ($msgs as &$m) {
        $m['id']        = (int)$m['id'];
        $m['sender_id'] = (int)$m['sender_id'];
        $m['is_read']   = (bool)$m['is_read'];
    }

    jsonResponse(200, $msgs);
}

// ── Gửi tin nhắn ─────────────────────────────────────────────────────────────
function sendMessage(array $user): void {
    $db   = getDB();
    $uid  = (int)$user['id'];
    $data = getRequestBody();

    $receiver_id = (int)($data['receiver_id'] ?? 0);
    $content     = trim($data['content'] ?? '');

    if (!$receiver_id || $content === '') {
        jsonResponse(400, ['error' => 'Thiếu receiver_id hoặc nội dung']);
    }
    if ($receiver_id === $uid) {
        jsonResponse(400, ['error' => 'Không thể nhắn tin cho chính mình']);
    }

    // Tìm hoặc tạo conversation
    $conv = findOrCreateConversation($db, $uid, $receiver_id);
    $conv_id = (int)$conv['id'];

    // Insert message
    $db->prepare("INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)")
       ->execute([$conv_id, $uid, $content]);

    $msg_id = (int)$db->lastInsertId();

    // Cập nhật last_message của conversation
    $db->prepare("UPDATE conversations SET last_message = ?, last_message_at = NOW() WHERE id = ?")
       ->execute([mb_substr($content, 0, 255), $conv_id]);

    jsonResponse(201, [
        'message'         => 'Gửi tin nhắn thành công',
        'message_id'      => $msg_id,
        'conversation_id' => $conv_id,
    ]);
}

// ── Số tin chưa đọc ──────────────────────────────────────────────────────────
function getUnreadCount(array $user): void {
    $db  = getDB();
    $uid = (int)$user['id'];

    $stmt = $db->prepare("
        SELECT COUNT(*) AS unread
        FROM messages m
        JOIN conversations c ON c.id = m.conversation_id
        WHERE (c.user1_id = ? OR c.user2_id = ?)
          AND m.sender_id != ?
          AND m.is_read = 0
    ");
    $stmt->execute([$uid, $uid, $uid]);
    $row = $stmt->fetch();

    jsonResponse(200, ['unread_count' => (int)$row['unread']]);
}

// ── Helper: tìm hoặc tạo conversation ────────────────────────────────────────
function findOrCreateConversation(PDO $db, int $uid, int $other_id): array {
    $u1 = min($uid, $other_id);
    $u2 = max($uid, $other_id);

    $stmt = $db->prepare("SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?");
    $stmt->execute([$u1, $u2]);
    $conv = $stmt->fetch();

    if ($conv) return $conv;

    $db->prepare("INSERT INTO conversations (user1_id, user2_id, last_message_at) VALUES (?, ?, NOW())")
       ->execute([$u1, $u2]);

    return ['id' => $db->lastInsertId()];
}
