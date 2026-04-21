<?php
// =============================================
// SmartRE API - Admin Reports (CSV/JSON export)
// =============================================
require_once __DIR__ . '/../config.php';

if (getMethod() !== 'GET') {
    jsonResponse(405, ['error' => 'Method not allowed']);
}

requireAdmin();

$entity = $_GET['entity'] ?? 'properties'; // properties | users | subscriptions
$format = strtolower($_GET['format'] ?? 'csv'); // csv | json

$from   = trim($_GET['from'] ?? '');   // YYYY-MM-DD
$to     = trim($_GET['to'] ?? '');     // YYYY-MM-DD
$status = trim($_GET['status'] ?? '');
$type   = trim($_GET['type'] ?? '');
$search = trim($_GET['search'] ?? '');

if (!in_array($entity, ['properties', 'users', 'subscriptions'], true)) {
    jsonResponse(400, ['error' => 'entity không hợp lệ']);
}
if (!in_array($format, ['csv', 'json'], true)) {
    jsonResponse(400, ['error' => 'format không hợp lệ (csv|json)']);
}

$db = getDB();

// ---- helpers ----
function toDateTimeStart(string $d): ?string {
    if ($d === '') return null;
    return $d . ' 00:00:00';
}
function toDateTimeEnd(string $d): ?string {
    if ($d === '') return null;
    return $d . ' 23:59:59';
}

// ---- build query per entity ----
$rows = [];
$filename = "report_{$entity}_" . date('Ymd_His') . ".csv";

if ($entity === 'properties') {
    $where = [];
    $params = [];

    if ($from !== '') {
        $where[] = "p.created_at >= ?";
        $params[] = toDateTimeStart($from);
    }
    if ($to !== '') {
        $where[] = "p.created_at <= ?";
        $params[] = toDateTimeEnd($to);
    }
    if ($status !== '') {
        $where[] = "p.status = ?";
        $params[] = $status;
    }
    if ($type !== '') {
        $where[] = "p.type = ?";
        $params[] = $type;
    }
    if ($search !== '') {
        $where[] = "(p.title LIKE ? OR p.address LIKE ? OR u.email LIKE ? OR u.display_name LIKE ?)";
        $s = '%' . $search . '%';
        $params[] = $s; $params[] = $s; $params[] = $s; $params[] = $s;
    }

    $whereClause = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
    $stmt = $db->prepare("
        SELECT
            p.id,
            p.title,
            p.type,
            p.price,
            p.area,
            p.bedrooms,
            p.bathrooms,
            p.legal,
            p.address,
            p.status,
            u.id as owner_id,
            u.display_name as owner_name,
            u.email as owner_email,
            p.created_at
        FROM properties p
        LEFT JOIN users u ON u.id = p.owner_id
        {$whereClause}
        ORDER BY p.created_at DESC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
} elseif ($entity === 'users') {
    $where = [];
    $params = [];

    if ($from !== '') {
        $where[] = "created_at >= ?";
        $params[] = toDateTimeStart($from);
    }
    if ($to !== '') {
        $where[] = "created_at <= ?";
        $params[] = toDateTimeEnd($to);
    }
    if ($status !== '') {
        // Here: status is interpreted as role for users export (admin|agent|user)
        $where[] = "role = ?";
        $params[] = $status;
    }
    if ($search !== '') {
        $where[] = "(email LIKE ? OR display_name LIKE ?)";
        $s = '%' . $search . '%';
        $params[] = $s; $params[] = $s;
    }

    $whereClause = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
    $stmt = $db->prepare("
        SELECT id, email, display_name, role, kyc_verified, created_at
        FROM users
        {$whereClause}
        ORDER BY created_at DESC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
} else { // subscriptions
    $where = [];
    $params = [];

    if ($from !== '') {
        $where[] = "s.created_at >= ?";
        $params[] = toDateTimeStart($from);
    }
    if ($to !== '') {
        $where[] = "s.created_at <= ?";
        $params[] = toDateTimeEnd($to);
    }
    if ($status !== '') {
        $where[] = "s.status = ?";
        $params[] = $status;
    }
    if ($type !== '') {
        // Here: type is interpreted as plan_name for subscriptions export
        $where[] = "s.plan_name = ?";
        $params[] = $type;
    }
    if ($search !== '') {
        $where[] = "(u.email LIKE ? OR u.display_name LIKE ? OR s.plan_label LIKE ?)";
        $s = '%' . $search . '%';
        $params[] = $s; $params[] = $s; $params[] = $s;
    }

    $whereClause = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
    $stmt = $db->prepare("
        SELECT
            s.id,
            s.user_id,
            u.display_name as user_name,
            u.email as user_email,
            s.plan_name,
            s.plan_label,
            s.price_vnd,
            s.payment_method,
            s.status,
            s.note,
            s.approved_by,
            s.approved_at,
            s.created_at,
            s.updated_at
        FROM subscriptions s
        JOIN users u ON u.id = s.user_id
        {$whereClause}
        ORDER BY s.created_at DESC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
}

if ($format === 'json') {
    jsonResponse(200, [
        'entity' => $entity,
        'count' => count($rows),
        'rows' => $rows,
    ]);
}

// ---- CSV output ----
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Pragma: no-cache');
header('Expires: 0');

$out = fopen('php://output', 'w');

// UTF-8 BOM for Excel
fwrite($out, "\xEF\xBB\xBF");

if (count($rows) === 0) {
    fputcsv($out, ['No data']);
    fclose($out);
    exit();
}

// Header row using keys of first row
$headers = array_keys($rows[0]);
fputcsv($out, $headers);

foreach ($rows as $r) {
    // Ensure scalar values for CSV
    $line = [];
    foreach ($headers as $h) {
        $v = $r[$h] ?? '';
        if (is_bool($v)) $v = $v ? '1' : '0';
        if (is_null($v)) $v = '';
        if (is_array($v) || is_object($v)) $v = json_encode($v, JSON_UNESCAPED_UNICODE);
        $line[] = $v;
    }
    fputcsv($out, $line);
}

fclose($out);
exit();

