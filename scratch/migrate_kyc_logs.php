<?php
require_once __DIR__ . '/../api/config.php';
$db = getDB();

try {
    $sql = "CREATE TABLE IF NOT EXISTS `kyc_logs` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `kyc_id` int(11) DEFAULT NULL,
        `user_id` int(11) NOT NULL,
        `admin_id` int(11) NOT NULL,
        `action` varchar(50) NOT NULL,
        `reason` text DEFAULT NULL,
        `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `user_id` (`user_id`),
        KEY `admin_id` (`admin_id`),
        CONSTRAINT `kyc_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
        CONSTRAINT `kyc_logs_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $db->exec($sql);
    echo "Created table kyc_logs successfully!\n";
} catch (Exception $e) {
    echo "Error creating table: " . $e->getMessage() . "\n";
}