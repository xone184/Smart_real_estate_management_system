<?php
// =============================================
// SmartRE - Database Initialization
// Run this to create database, tables, and seed data
// URL: http://localhost/smart-real-estate-management-system/api/init_db.php
// =============================================

header('Content-Type: application/json; charset=utf-8');

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'smartre_db');

try {
    // Connect without database first
    $pdo = new PDO("mysql:host=" . DB_HOST . ";charset=utf8mb4", DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");

    // Drop tables if exist (order matters for foreign keys)
    $pdo->exec("DROP TABLE IF EXISTS kyc_documents");
    $pdo->exec("DROP TABLE IF EXISTS saved_properties");
    $pdo->exec("DROP TABLE IF EXISTS notifications");
    $pdo->exec("DROP TABLE IF EXISTS reviews");
    $pdo->exec("DROP TABLE IF EXISTS properties");
    $pdo->exec("DROP TABLE IF EXISTS users");

    // Create users table
    $pdo->exec("CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) DEFAULT '',
        photo_url VARCHAR(500) DEFAULT '',
        role ENUM('admin', 'user', 'agent') DEFAULT 'user',
        kyc_verified TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Create properties table
    $pdo->exec("CREATE TABLE properties (
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
        legal_scan_url VARCHAR(500) DEFAULT '',
        planning_url VARCHAR(500) DEFAULT '',
        owner_id INT NOT NULL,
        status ENUM('pending', 'active', 'sold', 'rejected') DEFAULT 'pending',
        ai_valuation DECIMAL(15,2) DEFAULT NULL,
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Create reviews table
    $pdo->exec("CREATE TABLE reviews (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Create saved_properties table
    $pdo->exec("CREATE TABLE saved_properties (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        property_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_save (user_id, property_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Create notifications table
    $pdo->exec("CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        link VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Create kyc_documents table
    $pdo->exec("CREATE TABLE kyc_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        id_front_url VARCHAR(500) DEFAULT '',
        id_back_url VARCHAR(500) DEFAULT '',
        selfie_url VARCHAR(500) DEFAULT '',
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        notes TEXT DEFAULT '',
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Create appointments table
    $pdo->exec("CREATE TABLE appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        property_id INT NOT NULL,
        user_id INT NOT NULL,
        owner_id INT NOT NULL,
        visit_date DATE NOT NULL,
        time_slot VARCHAR(50) NOT NULL,
        message TEXT DEFAULT '',
        status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Seed users with proper bcrypt hashes
    $stmt = $pdo->prepare("INSERT INTO users (email, password, display_name, photo_url, role, kyc_verified) VALUES (?, ?, ?, '', ?, ?)");
    $stmt->execute(['admin@smartre.vn', password_hash('admin123', PASSWORD_DEFAULT), 'Quản trị viên', 'admin', 1]);
    $stmt->execute(['user@smartre.vn', password_hash('user123', PASSWORD_DEFAULT), 'Nguyễn Văn Demo', 'user', 0]);
    $stmt->execute(['agent@smartre.vn', password_hash('agent123', PASSWORD_DEFAULT), 'Trần Thị Agent', 'agent', 1]);

    // Seed properties
    $propStmt = $pdo->prepare("INSERT INTO properties (title, description, type, price, area, bedrooms, bathrooms, direction, legal, address, location_lat, location_lng, images, owner_id, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'active', ?)");

    $propStmt->execute([
        'Căn hộ cao cấp Vinhomes Central Park',
        'Căn hộ 2 phòng ngủ, view sông Sài Gòn cực đẹp, đầy đủ nội thất cao cấp.',
        'apartment', 5200, 75, 2, 2, 'Đông Nam', 'pink_book',
        '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM', 10.794, 106.722,
        '["https://picsum.photos/seed/apt1/800/600", "https://picsum.photos/seed/apt2/800/600"]',
        '["view_song", "full_noi_that", "vinhomes"]'
    ]);

    $propStmt->execute([
        'Nhà phố mặt tiền Quận 1 - Kinh doanh cực tốt',
        'Nhà 1 trệt 3 lầu, vị trí đắc địa, đang cho thuê mặt bằng kinh doanh.',
        'house', 45000, 120, 4, 4, 'Tây Bắc', 'pink_book',
        'Lê Thánh Tôn, Quận 1, TP.HCM', 10.776, 106.701,
        '["https://picsum.photos/seed/house1/800/600"]',
        '["mat_tien", "kinh_doanh", "quan_1"]'
    ]);

    $propStmt->execute([
        'Đất nền dự án Long An - Sổ đỏ riêng',
        'Lô đất vuông vức, hạ tầng hoàn thiện, pháp lý minh bạch.',
        'land', 1800, 100, 0, 0, 'Nam', 'red_book',
        'Bến Lức, Long An', 10.643, 106.491,
        '["https://picsum.photos/seed/land1/800/600"]',
        '["so_do_rieng", "dau_tu", "long_an"]'
    ]);

    $propStmt->execute([
        'Biệt thự sân vườn Thảo Điền - Đẳng cấp thượng lưu',
        'Biệt thự đơn lập, hồ bơi riêng, sân vườn rộng rãi, an ninh 24/7.',
        'villa', 120000, 500, 6, 7, 'Đông', 'pink_book',
        'Thảo Điền, Quận 2, TP.HCM', 10.803, 106.738,
        '["https://picsum.photos/seed/villa1/800/600"]',
        '["biet_thu", "ho_boi", "thao_dien"]'
    ]);

    // Seed reviews
    $reviewStmt = $pdo->prepare("INSERT INTO reviews (property_id, user_id, user_name, rating, comment, likes, verified) VALUES (?, ?, ?, ?, ?, ?, 1)");
    $reviewStmt->execute([1, 2, 'Nguyễn Văn Demo', 5, 'Vị trí tuyệt vời, thủ tục nhanh gọn. Rất hài lòng!', 5]);
    $reviewStmt->execute([1, 3, 'Trần Thị Agent', 4, 'Giá hơi cao nhưng chất lượng xây dựng rất tốt.', 2]);
    $reviewStmt->execute([2, 2, 'Nguyễn Văn Demo', 5, 'Vị trí đắc địa, kinh doanh rất thuận lợi!', 8]);
    $reviewStmt->execute([3, 3, 'Trần Thị Agent', 4, 'Pháp lý rõ ràng, hạ tầng đang phát triển tốt.', 3]);
    $reviewStmt->execute([4, 2, 'Nguyễn Văn Demo', 5, 'Biệt thự siêu đẹp, an ninh tuyệt đối!', 10]);

    // Seed saved_properties (demo)
    $savedStmt = $pdo->prepare("INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?)");
    $savedStmt->execute([2, 1]);
    $savedStmt->execute([2, 4]);
    $savedStmt->execute([3, 2]);

    // Seed notifications
    $notiStmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, ?)");
    $notiStmt->execute([2, 'Chào mừng đến SmartRE!', 'Tài khoản của bạn đã được kích hoạt thành công. Hãy khám phá các tính năng.', 'success', 0]);
    $notiStmt->execute([2, 'Tin đăng được duyệt', 'Tin đăng của bạn đã được duyệt và hiển thị trên hệ thống.', 'info', 1]);
    $notiStmt->execute([2, 'Cập nhật thị trường', 'Giá BĐS Quận 2 tăng 5% trong tháng qua.', 'info', 0]);
    $notiStmt->execute([3, 'Chào mừng đến SmartRE!', 'Tài khoản agent của bạn đã được kích hoạt. Bắt đầu đăng tin ngay!', 'success', 0]);
    $notiStmt->execute([3, 'Yêu cầu tư vấn mới', 'Khách hàng mới quan tâm đến BĐS bạn đang quản lý.', 'warning', 0]);

    // Seed appointments
    $aptStmt = $pdo->prepare("INSERT INTO appointments (property_id, user_id, owner_id, visit_date, time_slot, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $aptStmt->execute([1, 2, 1, date('Y-m-d', strtotime('+2 days')), '09:00 - 10:00', 'Tôi muốn xem căn góc tầng cao', 'confirmed']);
    $aptStmt->execute([2, 3, 1, date('Y-m-d', strtotime('+3 days')), '14:00 - 15:00', 'Tư vấn giúp tôi về pháp lý bđs này', 'pending']);

    echo json_encode([
        'success' => true,
        'message' => 'Database đã được khởi tạo thành công!',
        'data' => [
            'database' => DB_NAME,
            'tables' => ['users', 'properties', 'reviews', 'saved_properties', 'notifications', 'kyc_documents', 'appointments'],
            'users' => 3,
            'properties' => 4,
            'reviews' => 5,
            'saved' => 3,
            'notifications' => 5,
            'appointments' => 2,
            'accounts' => [
                ['email' => 'admin@smartre.vn', 'password' => 'admin123', 'role' => 'admin'],
                ['email' => 'user@smartre.vn', 'password' => 'user123', 'role' => 'user'],
                ['email' => 'agent@smartre.vn', 'password' => 'agent123', 'role' => 'agent'],
            ]
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
