<?php
try {
    $pdo = new PDO('mysql:host=localhost;dbname=smartre_db;charset=utf8mb4', 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Drop and recreate subscriptions table
    $pdo->exec("DROP TABLE IF EXISTS subscriptions");
    $pdo->exec("
        CREATE TABLE subscriptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            plan_name ENUM('basic', 'professional', 'enterprise') NOT NULL DEFAULT 'basic',
            plan_label VARCHAR(100) NOT NULL DEFAULT '',
            price_vnd VARCHAR(50) NOT NULL DEFAULT 'Mien phi',
            payment_method ENUM('qr_transfer', 'credit_card', 'contact') DEFAULT 'contact',
            status ENUM('pending', 'active', 'rejected', 'cancelled') DEFAULT 'pending',
            note TEXT,
            approved_by INT DEFAULT NULL,
            approved_at TIMESTAMP NULL DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    echo "subscriptions table OK\n";

    // Add columns to users table (ignore if exists)
    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN subscription_plan ENUM('basic','professional','enterprise') DEFAULT 'basic'");
        echo "Added subscription_plan column\n";
    } catch (Exception $e) {
        echo "subscription_plan already exists\n";
    }

    try {
        $pdo->exec("ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP NULL DEFAULT NULL");
        echo "Added subscription_expires_at column\n";
    } catch (Exception $e) {
        echo "subscription_expires_at already exists\n";
    }

    echo "All done!\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
