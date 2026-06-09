<?php
require_once __DIR__ . '/api/config.php';

$db = getDB();
$sql = "ALTER TABLE `users` MODIFY COLUMN `source` VARCHAR(50) DEFAULT 'system';
INSERT INTO `users` (`email`, `password`, `display_name`, `role`, `kyc_verified`, `source`) 
VALUES 
('reddit_user1@mock.com', 'mock', 'Reddit User 1', 'user', 0, 'reddit'),
('gnews_user1@mock.com', 'mock', 'Google News User 1', 'user', 0, 'google_news')
ON DUPLICATE KEY UPDATE `source` = VALUES(`source`);

INSERT INTO `user_activities` (`user_id`, `activity_type`, `target_id`, `duration_seconds`, `metadata`)
SELECT id, 'view_news', 'vnn_mock2', 150, '{\"keywords\":[\"đầu tư bất động sản\", \"reddit\"]}'
FROM `users` WHERE `source` = 'reddit' LIMIT 1;
";

try {
    $db->exec($sql);
    echo "Update successful.\n";
} catch (PDOException $e) {
    echo "Update failed: " . $e->getMessage() . "\n";
}
