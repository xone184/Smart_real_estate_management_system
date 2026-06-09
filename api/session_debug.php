<?php
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'session_id' => session_id(),
    'session_status' => session_status(),
    'SESSION' => $_SESSION ?? [],
    'COOKIE' => $_COOKIE ?? [],
    'HEADERS' => function_exists('getallheaders') ? getallheaders() : [],
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);