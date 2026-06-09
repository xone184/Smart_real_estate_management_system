<?php
// api/ai/osint.php
require_once __DIR__ . '/../config.php';

// Chỉ cho phép admin và agent
$user = requireAuth();
if ($user['role'] !== 'admin' && $user['role'] !== 'agent') {
    jsonResponse(403, ['error' => 'Access denied. Only agents and admins can use this feature.']);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $data = getRequestBody();
    $query = isset($data['query']) ? trim($data['query']) : '';
    
    if (!$query) {
        jsonResponse(400, ['error' => 'Query is required']);
    }
    
    $url = 'http://127.0.0.1:8000/api/ai/osint_search';
    $payload = json_encode(['query' => $query]);
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // AI có thể phản hồi chậm
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($result) {
        $json = json_decode($result, true);
        if ($json) {
            jsonResponse(200, $json);
        }
    }
    
    jsonResponse(500, ['error' => 'Failed to reach AI service. Please make sure the Python AI service is running.']);
} else {
    jsonResponse(405, ['error' => 'Method Not Allowed']);
}
