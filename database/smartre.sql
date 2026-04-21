-- =============================================
-- SmartRE Database Schema
-- MySQL / phpMyAdmin (XAMPP)
-- =============================================

CREATE DATABASE IF NOT EXISTS smartre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartre_db;

-- =============================================
-- Users Table
-- =============================================
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) DEFAULT '',
    photo_url VARCHAR(500) DEFAULT '',
    role ENUM('admin', 'user', 'agent') DEFAULT 'user',
    kyc_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Properties Table
-- =============================================
CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    type ENUM('apartment', 'house', 'land', 'villa') NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    bedrooms INT DEFAULT 0,
    bathrooms INT DEFAULT 0,
    direction VARCHAR(50) DEFAULT '',
    legal ENUM('pink_book', 'red_book', 'contract', 'other') NOT NULL DEFAULT 'pink_book',
    address VARCHAR(500) NOT NULL,
    location_lat DECIMAL(10,6) DEFAULT 0,
    location_lng DECIMAL(10,6) DEFAULT 0,
    images JSON,
    video_url VARCHAR(500) DEFAULT '',
    tour_3d_url VARCHAR(500) DEFAULT '',
    owner_id INT NOT NULL,
    status ENUM('pending', 'active', 'sold', 'rejected') DEFAULT 'pending',
    ai_valuation DECIMAL(15,2) DEFAULT NULL,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Reviews Table
-- =============================================
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    user_id INT NOT NULL,
    user_name VARCHAR(100) DEFAULT '',
    user_avatar VARCHAR(500) DEFAULT '',
    rating TINYINT NOT NULL,
    comment TEXT NOT NULL,
    likes INT DEFAULT 0,
    verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Seed Data
-- =============================================

-- Admin user (password: admin123)
INSERT INTO users (email, password, display_name, photo_url, role, kyc_verified) VALUES
('admin@smartre.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Quản trị viên', '', 'admin', 1);

-- Demo user (password: user123)
INSERT INTO users (email, password, display_name, photo_url, role, kyc_verified) VALUES
('user@smartre.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Nguyễn Văn Demo', '', 'user', 0);

-- Agent user (password: agent123)
INSERT INTO users (email, password, display_name, photo_url, role, kyc_verified) VALUES
('agent@smartre.vn', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Trần Thị Agent', '', 'agent', 1);

-- Sample properties
INSERT INTO properties (title, description, type, price, area, bedrooms, bathrooms, direction, legal, address, location_lat, location_lng, images, owner_id, status, tags) VALUES
(
    'Căn hộ cao cấp Vinhomes Central Park',
    'Căn hộ 2 phòng ngủ, view sông Sài Gòn cực đẹp, đầy đủ nội thất cao cấp.',
    'apartment', 5200, 75, 2, 2, 'Đông Nam', 'pink_book',
    '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM',
    10.794000, 106.722000,
    '["https://picsum.photos/seed/apt1/800/600", "https://picsum.photos/seed/apt2/800/600"]',
    1, 'active',
    '["view_song", "full_noi_that", "vinhomes"]'
),
(
    'Nhà phố mặt tiền Quận 1 - Kinh doanh cực tốt',
    'Nhà 1 trệt 3 lầu, vị trí đắc địa, đang cho thuê mặt bằng kinh doanh.',
    'house', 45000, 120, 4, 4, 'Tây Bắc', 'pink_book',
    'Lê Thánh Tôn, Quận 1, TP.HCM',
    10.776000, 106.701000,
    '["https://picsum.photos/seed/house1/800/600"]',
    1, 'active',
    '["mat_tien", "kinh_doanh", "quan_1"]'
),
(
    'Đất nền dự án Long An - Sổ đỏ riêng',
    'Lô đất vuông vức, hạ tầng hoàn thiện, pháp lý minh bạch.',
    'land', 1800, 100, 0, 0, 'Nam', 'red_book',
    'Bến Lức, Long An',
    10.643000, 106.491000,
    '["https://picsum.photos/seed/land1/800/600"]',
    1, 'active',
    '["so_do_rieng", "dau_tu", "long_an"]'
),
(
    'Biệt thự sân vườn Thảo Điền - Đẳng cấp thượng lưu',
    'Biệt thự đơn lập, hồ bơi riêng, sân vườn rộng rãi, an ninh 24/7.',
    'villa', 120000, 500, 6, 7, 'Đông', 'pink_book',
    'Thảo Điền, Quận 2, TP.HCM',
    10.803000, 106.738000,
    '["https://picsum.photos/seed/villa1/800/600"]',
    1, 'active',
    '["biet_thu", "ho_boi", "thao_dien"]'
);

-- Sample reviews
INSERT INTO reviews (property_id, user_id, user_name, user_avatar, rating, comment, likes, verified) VALUES
(1, 2, 'Nguyễn Văn Demo', '', 5, 'Vị trí tuyệt vời, thủ tục nhanh gọn. Rất hài lòng!', 5, 1),
(1, 3, 'Trần Thị Agent', '', 4, 'Giá hơi cao nhưng chất lượng xây dựng rất tốt.', 2, 1),
(2, 2, 'Nguyễn Văn Demo', '', 5, 'Vị trí đắc địa, kinh doanh rất thuận lợi!', 8, 1),
(3, 3, 'Trần Thị Agent', '', 4, 'Pháp lý rõ ràng, hạ tầng đang phát triển tốt.', 3, 1),
(4, 2, 'Nguyễn Văn Demo', '', 5, 'Biệt thự siêu đẹp, an ninh tuyệt đối!', 10, 1);

-- =============================================
-- Subscriptions Table (Gói đăng ký dịch vụ)
-- =============================================
DROP TABLE IF EXISTS subscriptions;
CREATE TABLE subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_name ENUM('basic', 'professional', 'enterprise') NOT NULL DEFAULT 'basic',
    plan_label VARCHAR(100) NOT NULL DEFAULT '',
    price_vnd VARCHAR(50) NOT NULL DEFAULT 'Miễn phí',
    payment_method ENUM('qr_transfer', 'credit_card', 'contact') DEFAULT 'contact',
    status ENUM('pending', 'active', 'rejected', 'cancelled') DEFAULT 'pending',
    note TEXT DEFAULT '',
    approved_by INT DEFAULT NULL,
    approved_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add subscription plan column to users for quick access
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan ENUM('basic', 'professional', 'enterprise') DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP NULL DEFAULT NULL;
