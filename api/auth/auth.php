<?php
// =============================================
// SmartRE API - Authentication
// =============================================
require_once __DIR__ . '/../config.php';

$action = $_GET['action'] ?? '';
$method = getMethod();

switch ($action) {
    case 'register':
        if ($method !== 'POST') jsonResponse(405, ['error' => 'Method not allowed']);
        handleRegister();
        break;
    case 'login':
        if ($method !== 'POST') jsonResponse(405, ['error' => 'Method not allowed']);
        handleLogin();
        break;
    case 'logout':
        if ($method !== 'POST') jsonResponse(405, ['error' => 'Method not allowed']);
        handleLogout();
        break;
    case 'me':
        if ($method !== 'GET') jsonResponse(405, ['error' => 'Method not allowed']);
        handleMe();
        break;
    default:
        jsonResponse(400, ['error' => 'Action không hợp lệ. Sử dụng: register, login, logout, me']);
}

function handleRegister(): void {
    $data = getRequestBody();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $displayName = trim($data['display_name'] ?? '');
    $roleInput = trim($data['role'] ?? '');
    $role = ($roleInput === 'agent') ? 'agent' : 'user';

    // Validation
    if (empty($email) || empty($password)) {
        jsonResponse(400, ['error' => 'Email và mật khẩu là bắt buộc']);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(400, ['error' => 'Email không hợp lệ']);
    }
    if (strlen($password) < 6) {
        jsonResponse(400, ['error' => 'Mật khẩu phải có ít nhất 6 ký tự']);
    }

    $db = getDB();

    // Check if email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(409, ['error' => 'Email đã được đăng ký']);
    }

    // Create user
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users (email, password, display_name, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$email, $hashedPassword, $displayName ?: 'Người dùng', $role]);

    $userId = (int) $db->lastInsertId();

    // Auto login after register
    $_SESSION['user_id'] = $userId;

    // Return user data
    $stmt = $db->prepare("SELECT id, email, display_name, photo_url, role, kyc_verified, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    jsonResponse(201, ['message' => 'Đăng ký thành công', 'user' => $user]);
}

function handleLogin(): void {
    $data = getRequestBody();
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(400, ['error' => 'Email và mật khẩu là bắt buộc']);
    }

    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(401, ['error' => 'Email hoặc mật khẩu không chính xác']);
    }

    // Set session
    $_SESSION['user_id'] = $user['id'];

    // Return user data (without password)
    unset($user['password']);
    jsonResponse(200, ['message' => 'Đăng nhập thành công', 'user' => $user]);
}

function handleLogout(): void {
    session_destroy();
    jsonResponse(200, ['message' => 'Đã đăng xuất']);
}

function handleMe(): void {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(200, ['user' => null]);
    }
    jsonResponse(200, ['user' => $user]);
}
