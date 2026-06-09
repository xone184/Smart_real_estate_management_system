-- Migration script for User Analytics and AI Recommendations

-- 1. Modify users table to add source
ALTER TABLE `users` 
ADD COLUMN IF NOT EXISTS `source` enum('system', 'facebook', 'tiktok', 'google') DEFAULT 'system';

-- 2. Create user_activities table
CREATE TABLE IF NOT EXISTS `user_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `session_id` varchar(255) DEFAULT NULL,
  `activity_type` enum('view_news', 'view_property', 'search', 'click_news', 'like_news') NOT NULL,
  `target_id` varchar(100) DEFAULT NULL COMMENT 'ID of news or property',
  `duration_seconds` int(11) DEFAULT 0,
  `metadata` text DEFAULT NULL COMMENT 'JSON string for keywords, query, etc.',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id_idx` (`user_id`),
  KEY `activity_type_idx` (`activity_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create user_interests table (AI trends)
CREATE TABLE IF NOT EXISTS `user_interests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `top_keywords` text DEFAULT NULL COMMENT 'JSON array of top keywords',
  `recommended_categories` text DEFAULT NULL COMMENT 'JSON array',
  `last_analyzed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id_unique` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Mock Data cho "Bên ngoài (Thu thập)"
-- Thêm một vài user giả lập từ Facebook/TikTok
INSERT INTO `users` (`email`, `password`, `display_name`, `role`, `kyc_verified`, `source`) 
VALUES 
('fb_user1@mock.com', 'mock', 'FB User 1', 'user', 0, 'facebook'),
('tiktok_user1@mock.com', 'mock', 'TikTok User 1', 'user', 0, 'tiktok'),
('fb_user2@mock.com', 'mock', 'FB User 2', 'user', 0, 'facebook')
ON DUPLICATE KEY UPDATE `source` = VALUES(`source`);

-- Lấy IDs của các user vừa thêm (giả định 101, 102, 103 nếu auto_inc)
-- Thêm dữ liệu giả cho activities của họ
INSERT INTO `user_activities` (`user_id`, `activity_type`, `target_id`, `duration_seconds`, `metadata`)
SELECT id, 'view_news', 'vnn_mock1', 120, '{"keywords":["bất động sản", "đầu tư", "lãi suất"]}'
FROM `users` WHERE `source` = 'facebook' LIMIT 1;

INSERT INTO `user_activities` (`user_id`, `activity_type`, `target_id`, `duration_seconds`, `metadata`)
SELECT id, 'search', null, 0, '{"query":"chung cư giá rẻ hà nội", "keywords":["chung cư", "hà nội"]}'
FROM `users` WHERE `source` = 'tiktok' LIMIT 1;

INSERT INTO `user_interests` (`user_id`, `top_keywords`, `recommended_categories`)
SELECT id, '["đất nền", "bất động sản vùng ven"]', '["news", "land"]'
FROM `users` WHERE `source` = 'facebook' LIMIT 1;
