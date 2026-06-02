<?php
require_once __DIR__ . '/../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(405, ['error' => 'Method not allowed']);
}

if (!isset($_SESSION['user_id'])) {
    jsonResponse(401, ['error' => 'Vui lòng đăng nhập']);
}

// Check which folder to upload (e.g. properties, users)
$type = $_POST['type'] ?? 'properties';

$uploadDir = __DIR__ . "/../../uploads/{$type}/";

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Xử lý upload multi files (mảng 'images[]' hoặc single file 'file')
$uploadedFiles = [];
$urls = [];

// Base URL for the frontend to access these images
// Phải tuỳ biến theo domain thật, hoặc relative.
$baseUrl = '/smart-real-estate-management-system/uploads/' . $type . '/';

if (isset($_FILES['images'])) {
    $files = $_FILES['images'];
    $count = count($files['name']);
    
    for ($i = 0; $i < $count; $i++) {
        if ($files['error'][$i] === UPLOAD_ERR_OK) {
            $tmpName = $files['tmp_name'][$i];
            $fileName = basename($files['name'][$i]);
            // Generate unique name
            $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            
            if (in_array($ext, $allowed)) {
                $uniqueName = uniqid('img_') . '.' . $ext;
                $targetFile = $uploadDir . $uniqueName;
                
                if (move_uploaded_file($tmpName, $targetFile)) {
                    $urls[] = $baseUrl . $uniqueName;
                }
            }
        }
    }
} elseif (isset($_FILES['file'])) {
    // Single file upload fallback
    $file = $_FILES['file'];
    if ($file['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (in_array($ext, $allowed)) {
             $uniqueName = uniqid('img_') . '.' . $ext;
             $targetFile = $uploadDir . $uniqueName;
             if (move_uploaded_file($file['tmp_name'], $targetFile)) {
                 $urls[] = $baseUrl . $uniqueName;
             }
        }
    }
} else {
    jsonResponse(400, ['error' => 'No files provided']);
}

if (count($urls) > 0) {
    jsonResponse(200, ['urls' => $urls, 'message' => 'Upload thành công']);
} else {
    jsonResponse(400, ['error' => 'Tất cả file đều bị lỗi hoặc không đúng định dạng ảnh']);
}
