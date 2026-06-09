<?php
require_once __DIR__ . '/api/config.php';

$db = getDB();
$sql = file_get_contents(__DIR__ . '/database/migration_analytics.sql');

try {
    $db->exec($sql);
    echo "Migration successful.\n";
} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
