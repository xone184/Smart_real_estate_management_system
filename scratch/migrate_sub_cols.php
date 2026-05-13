<?php
require_once __DIR__ . '/../api/config.php';
$db = getDB();
try {
    $db->exec("ALTER TABLE users ADD COLUMN sub_exp_notified_near TINYINT(1) DEFAULT 0");
    echo "Added sub_exp_notified_near\n";
} catch (Exception $e) { echo "Error or already exists: " . $e->getMessage() . "\n"; }

try {
    $db->exec("ALTER TABLE users ADD COLUMN sub_exp_notified_done TINYINT(1) DEFAULT 0");
    echo "Added sub_exp_notified_done\n";
} catch (Exception $e) { echo "Error or already exists: " . $e->getMessage() . "\n"; }
