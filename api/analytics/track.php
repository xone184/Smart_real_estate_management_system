<?php
require_once __DIR__ . '/../config.php';

$method = getMethod();
if ($method === 'OPTIONS') {
    jsonResponse(200, ['status' => 'ok']);
}

if ($method !== 'POST') {
    jsonResponse(405, ['error' => 'Method not allowed']);
}

$user = getAuthUser();
$userId = $user ? $user['id'] : null;

$data = getRequestBody();
if (empty($data['activity_type'])) {
    jsonResponse(400, ['error' => 'Missing activity_type']);
}

$activityType = $data['activity_type'];
$targetId = $data['target_id'] ?? null;
$durationSeconds = $data['duration_seconds'] ?? 0;
$metadata = isset($data['metadata']) ? json_encode($data['metadata'], JSON_UNESCAPED_UNICODE) : null;
$sessionId = $data['session_id'] ?? session_id();

try {
    $db = getDB();
    $stmt = $db->prepare("INSERT INTO user_activities (user_id, session_id, activity_type, target_id, duration_seconds, metadata) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$userId, $sessionId, $activityType, $targetId, $durationSeconds, $metadata]);
    
    jsonResponse(200, ['status' => 'success', 'message' => 'Activity logged']);
} catch (Exception $e) {
    jsonResponse(500, ['error' => 'Failed to log activity: ' . $e->getMessage()]);
}
