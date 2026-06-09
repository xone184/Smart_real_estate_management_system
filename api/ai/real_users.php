<?php
// api/ai/real_users.php
require_once __DIR__ . '/../config.php';

$user = requireAuth();
if ($user['role'] !== 'admin' && $user['role'] !== 'agent') {
    jsonResponse(403, ['error' => 'Access denied. Only agents and admins can use this feature.']);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    
    $url = "http://127.0.0.1:8000/api/ai/real_osint_users?page={$page}&limit={$limit}";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($result) {
        $json = json_decode($result, true);
        if ($json) {
            jsonResponse(200, $json);
        }
    }
    
    jsonResponse(500, ['error' => 'Failed to reach AI service.']);
} 
elseif ($method === 'POST') {
    // Kích hoạt cào thêm dữ liệu
    $url = "http://127.0.0.1:8000/api/ai/scrape_real_users";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Searching can take a while
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($result) {
        $json = json_decode($result, true);
        if ($json) {
            jsonResponse(200, $json);
        }
    }
    
    jsonResponse(500, ['error' => 'Failed to reach AI service for scraping.']);
} 
elseif ($method === 'DELETE') {
    // Xóa nhiều người dùng OSINT
    $data = getRequestBody();
    $ids = isset($data['ids']) ? $data['ids'] : [];
    
    if (empty($ids)) {
        jsonResponse(400, ['error' => 'Vui lòng cung cấp danh sách ID cần xóa.']);
    }
    
    $url = "http://127.0.0.1:8000/api/ai/real_osint_users";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "DELETE");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['ids' => $ids]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($result) {
        $json = json_decode($result, true);
        if ($json) {
            jsonResponse(200, $json);
        }
    }
    
    jsonResponse(500, ['error' => 'Failed to reach AI service for deleting.']);
}
else {
    jsonResponse(405, ['error' => 'Method Not Allowed']);
}
