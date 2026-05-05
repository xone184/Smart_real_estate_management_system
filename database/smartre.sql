-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 05, 2026 lúc 06:42 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `smartre_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `visit_date` date NOT NULL,
  `time_slot` varchar(50) NOT NULL,
  `message` text DEFAULT NULL,
  `status` enum('pending','confirmed','completed','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `appointments`
--

INSERT INTO `appointments` (`id`, `property_id`, `user_id`, `owner_id`, `visit_date`, `time_slot`, `message`, `status`, `created_at`) VALUES
(1, 6, 5, 1, '2026-04-15', '15:30', 'Tôi muốn tham quan căn hộ này', 'completed', '2026-04-14 10:22:27'),
(2, 6, 5, 1, '2026-04-15', '15:30', 'Tôi muốn tham quan căn hộ này', 'cancelled', '2026-04-14 10:22:39'),
(3, 6, 5, 1, '2026-04-15', '15:30', 'Tôi muốn tham quan căn hộ này', 'cancelled', '2026-04-14 10:22:40'),
(4, 6, 5, 1, '2026-04-15', '15:30', 'Tôi muốn tham quan căn hộ này', 'cancelled', '2026-04-14 10:22:40'),
(5, 6, 5, 1, '2026-04-15', '15:30', 'Tôi muốn tham quan căn hộ này', 'cancelled', '2026-04-14 10:22:41'),
(6, 5, 5, 3, '2026-04-15', '10:30', 'Tôi muốn tham quan căn hộ này', 'cancelled', '2026-04-14 10:27:39'),
(7, 3, 2, 1, '2026-04-16', '17:00', 'Tôi muốn tham quan căn hộ này', 'cancelled', '2026-04-15 03:16:08'),
(8, 9, 2, 3, '2026-04-22', '17:00', 'Tôi muốn tham quan căn hộ này', 'cancelled', '2026-04-21 08:05:00');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `conversations`
--

CREATE TABLE `conversations` (
  `id` int(11) NOT NULL,
  `user1_id` int(11) NOT NULL,
  `user2_id` int(11) NOT NULL,
  `last_message` text DEFAULT NULL,
  `last_message_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `conversations`
--

INSERT INTO `conversations` (`id`, `user1_id`, `user2_id`, `last_message`, `last_message_at`, `created_at`) VALUES
(1, 1, 2, 'hh', '2026-05-05 03:02:55', '2026-04-13 10:23:03'),
(2, 3, 5, 'dhsbsd', '2026-04-16 08:42:51', '2026-04-16 08:32:22');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `kyc_documents`
--

CREATE TABLE `kyc_documents` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `id_front_url` varchar(500) DEFAULT '',
  `id_back_url` varchar(500) DEFAULT '',
  `selfie_url` varchar(500) DEFAULT '',
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `notes` text DEFAULT '',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `kyc_documents`
--

INSERT INTO `kyc_documents` (`id`, `user_id`, `id_front_url`, `id_back_url`, `selfie_url`, `status`, `notes`, `submitted_at`, `reviewed_at`) VALUES
(1, 3, '/smart-real-estate-management-system/uploads/kyc/kyc_3_id_front_1776327712.jpg', '/smart-real-estate-management-system/uploads/kyc/kyc_3_id_back_1776327712.jpg', '/smart-real-estate-management-system/uploads/kyc/kyc_3_selfie_1776327712.jpg', 'pending', '', '2026-04-16 08:21:52', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `messages`
--

INSERT INTO `messages` (`id`, `conversation_id`, `sender_id`, `content`, `is_read`, `created_at`) VALUES
(1, 1, 1, 'Chào, nghe nói bạn cần tư vấn', 1, '2026-04-13 10:23:03'),
(2, 1, 2, 'Chàoooooo', 1, '2026-04-13 10:30:03'),
(3, 1, 1, 'Hellllo', 1, '2026-04-13 10:30:35'),
(4, 1, 2, 'Chào', 1, '2026-04-14 07:52:37'),
(5, 1, 2, 'A ơi saoo không duyệt cái kia của e', 1, '2026-04-15 09:56:06'),
(6, 1, 1, 'M làm như cục shit', 1, '2026-04-15 09:56:41'),
(7, 1, 2, 'Vãi cả đái', 1, '2026-04-15 09:56:58'),
(8, 2, 3, 'Chào bạn', 1, '2026-04-16 08:32:22'),
(9, 2, 3, 'Nghe nói bạn cần xem nhà', 1, '2026-04-16 08:32:36'),
(10, 2, 5, 'Đúng rồi', 1, '2026-04-16 08:42:06'),
(11, 2, 3, 'Sao bạn không nói sơm', 1, '2026-04-16 08:42:43'),
(12, 2, 3, 'mất công vãi', 1, '2026-04-16 08:42:48'),
(13, 2, 3, 'dhsbsd', 1, '2026-04-16 08:42:51'),
(14, 1, 1, 'hh', 1, '2026-05-05 03:02:55');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','success','warning','error') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `link` varchar(500) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `link`, `created_at`) VALUES
(1, 2, 'Chào mừng đến SmartRE!', 'Tài khoản của bạn đã được kích hoạt thành công. Hãy khám phá các tính năng.', 'success', 1, '', '2026-04-01 04:51:35'),
(2, 2, 'Tin đăng được duyệt', 'Tin đăng của bạn đã được duyệt và hiển thị trên hệ thống.', 'info', 1, '', '2026-04-01 04:51:35'),
(3, 2, 'Cập nhật thị trường', 'Giá BĐS Quận 2 tăng 5% trong tháng qua.', 'info', 1, '', '2026-04-01 04:51:35'),
(4, 3, 'Chào mừng đến SmartRE!', 'Tài khoản agent của bạn đã được kích hoạt. Bắt đầu đăng tin ngay!', 'success', 1, '', '2026-04-01 04:51:35'),
(5, 3, 'Yêu cầu tư vấn mới', 'Khách hàng mới quan tâm đến BĐS bạn đang quản lý.', 'warning', 1, '', '2026-04-01 04:51:35'),
(6, 3, 'Hồ sơ KYC đã được gửi', 'Chúng tôi đang xem xét hồ sơ xác minh danh tính của bạn. Kết quả sẽ có trong 5-10 phút.', 'info', 1, '', '2026-04-06 06:01:45'),
(7, 1, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Nhà ở Cổ Dương\" vào lúc 15:30 ngày 2026-04-15.', 'info', 1, '', '2026-04-14 10:22:27'),
(8, 1, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Nhà ở Cổ Dương\" vào lúc 15:30 ngày 2026-04-15.', 'info', 1, '', '2026-04-14 10:22:39'),
(9, 1, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Nhà ở Cổ Dương\" vào lúc 15:30 ngày 2026-04-15.', 'info', 1, '', '2026-04-14 10:22:40'),
(10, 1, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Nhà ở Cổ Dương\" vào lúc 15:30 ngày 2026-04-15.', 'info', 1, '', '2026-04-14 10:22:40'),
(11, 1, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Nhà ở Cổ Dương\" vào lúc 15:30 ngày 2026-04-15.', 'info', 1, '', '2026-04-14 10:22:41'),
(12, 3, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Nhà Đất Đông Anh\" vào lúc 10:30 ngày 2026-04-15.', 'info', 1, '', '2026-04-14 10:27:39'),
(13, 3, 'Tin đăng đã được duyệt', 'Tin đăng \"Căn hộ Vin Home OceanPark\" của bạn đã được duyệt và hiển thị trên hệ thống.', 'success', 1, 'property:7', '2026-04-15 03:12:17'),
(14, 1, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Đất nền dự án Long An - Sổ đỏ riêng\" vào lúc 17:00 ngày 2026-04-16.', 'info', 1, '', '2026-04-15 03:16:08'),
(15, 2, 'Tin đăng bị từ chối', 'Tin đăng \"Nhà ở Cổ Nhuế\" của bạn đã bị từ chối. Lý do: Tin đăng không đúng sự thật', 'warning', 1, 'property:8', '2026-04-15 10:03:30'),
(16, 5, 'Xin lỗi! Lịch hẹn đã quá hạn', 'Rất tiếc, lịch hẹn xem \"Nhà ở Cổ Dương\" vào 15:30 ngày 2026-04-15 chưa được xác nhận và đã quá hạn. Bạn có thể đặt lại lịch hẹn mới bất cứ lúc nào.', 'warning', 1, 'appointment_overdue:4', '2026-04-16 08:02:35'),
(17, 5, 'Xin lỗi! Lịch hẹn đã quá hạn', 'Rất tiếc, lịch hẹn xem \"Nhà ở Cổ Dương\" vào 15:30 ngày 2026-04-15 chưa được xác nhận và đã quá hạn. Bạn có thể đặt lại lịch hẹn mới bất cứ lúc nào.', 'warning', 1, 'appointment_overdue:5', '2026-04-16 08:02:35'),
(18, 5, 'Xin lỗi! Lịch hẹn đã quá hạn', 'Rất tiếc, lịch hẹn xem \"Nhà Đất Đông Anh\" vào 10:30 ngày 2026-04-15 chưa được xác nhận và đã quá hạn. Bạn có thể đặt lại lịch hẹn mới bất cứ lúc nào.', 'warning', 1, 'appointment_overdue:6', '2026-04-16 08:03:20'),
(19, 3, 'Hồ sơ KYC đã được gửi', 'Chúng tôi đang xem xét hồ sơ xác minh danh tính của bạn. Kết quả sẽ có trong 5-10 phút.', 'info', 1, '', '2026-04-16 08:21:52'),
(20, 3, 'Có người đặt lịch xem nhà', 'Một khách hàng vừa đặt lịch xem \"Căn hộ Vinhomes Smart City Tây Mỗ\" vào lúc 17:00 ngày 2026-04-22.', 'info', 1, '', '2026-04-21 08:05:00'),
(21, 2, 'Xin lỗi! Lịch hẹn đã quá hạn', 'Rất tiếc, lịch hẹn xem \"Căn hộ Vinhomes Smart City Tây Mỗ\" vào 17:00 ngày 2026-04-22 chưa được xác nhận và đã quá hạn. Bạn có thể đặt lại lịch hẹn mới bất cứ lúc nào.', 'warning', 1, 'appointment_overdue:8', '2026-05-05 02:40:59'),
(22, 3, 'Tin đăng đã được duyệt', 'Tin đăng \"Căn hộ Vinhomes Smart City Tây Mỗ\" của bạn đã được duyệt và hiển thị trên hệ thống.', 'success', 1, 'property:9', '2026-05-05 03:11:00'),
(23, 3, 'Tin đăng đã được duyệt', 'Tin đăng \"Căn hộ Vinhomes Smart City Tây Mỗ\" của bạn đã được duyệt và hiển thị trên hệ thống.', 'success', 1, 'property:9', '2026-05-05 03:11:01'),
(24, 3, 'Tin đăng đã được duyệt', 'Tin đăng \"Nhà riêng ngõ ô tô Trung Hòa - Nhân Chính\" của bạn đã được duyệt và hiển thị trên hệ thống.', 'success', 1, 'property:10', '2026-05-05 03:11:03');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `otp_codes`
--

CREATE TABLE `otp_codes` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(10) NOT NULL,
  `purpose` enum('register','reset_password') DEFAULT 'register',
  `verified` tinyint(1) DEFAULT 0,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `otp_codes`
--

INSERT INTO `otp_codes` (`id`, `email`, `otp_code`, `purpose`, `verified`, `expires_at`, `created_at`) VALUES
(1, 'newuser123@gmail.com', '367717', 'register', 0, '2026-04-14 10:26:30', '2026-04-14 08:16:30'),
(3, 'newuser456@gmail.com', '526211', 'register', 1, '2026-04-14 11:19:22', '2026-04-14 09:09:22'),
(4, 'test_otp@example.com', '343593', 'register', 0, '2026-04-14 11:22:16', '2026-04-14 09:12:16'),
(5, '22111061580@hunre.edu.vn', '600949', 'register', 1, '2026-04-14 11:47:45', '2026-04-14 09:37:45');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT '',
  `category` varchar(50) DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `description`, `category`, `created_at`) VALUES
(1, 'users.view', 'Xem danh sách người dùng', 'users', '2026-04-17 06:45:58'),
(2, 'users.create', 'Tạo người dùng mới', 'users', '2026-04-17 06:45:58'),
(3, 'users.edit', 'Chỉnh sửa người dùng', 'users', '2026-04-17 06:45:58'),
(4, 'users.delete', 'Xóa người dùng', 'users', '2026-04-17 06:45:58'),
(5, 'users.manage_permissions', 'Quản lý quyền người dùng', 'users', '2026-04-17 06:45:58'),
(6, 'properties.view', 'Xem danh sách bất động sản', 'properties', '2026-04-17 06:45:58'),
(7, 'properties.create', 'Tạo bất động sản', 'properties', '2026-04-17 06:45:58'),
(8, 'properties.edit', 'Chỉnh sửa bất động sản', 'properties', '2026-04-17 06:45:58'),
(9, 'properties.delete', 'Xóa bất động sản', 'properties', '2026-04-17 06:45:58'),
(10, 'properties.publish', 'Xuất bản bất động sản', 'properties', '2026-04-17 06:45:58'),
(11, 'properties.manage_sales', 'Quản lý chốt giá', 'properties', '2026-04-17 06:45:58'),
(12, 'kyc.view', 'Xem KYC', 'kyc', '2026-04-17 06:45:58'),
(13, 'kyc.approve', 'Duyệt KYC', 'kyc', '2026-04-17 06:45:58'),
(14, 'kyc.reject', 'Từ chối KYC', 'kyc', '2026-04-17 06:45:58'),
(15, 'reports.view', 'Xem báo cáo', 'reports', '2026-04-17 06:45:58'),
(16, 'reports.export', 'Xuất báo cáo', 'reports', '2026-04-17 06:45:58'),
(17, 'settings.view', 'Xem cài đặt hệ thống', 'settings', '2026-04-17 06:45:58'),
(18, 'settings.edit', 'Chỉnh sửa cài đặt hệ thống', 'settings', '2026-04-17 06:45:58'),
(19, 'analytics.view', 'Xem thống kê', 'analytics', '2026-04-17 06:45:58'),
(20, 'subscriptions.manage', 'Quản lý gói đăng ký', 'subscriptions', '2026-04-17 06:45:58');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `properties`
--

CREATE TABLE `properties` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('apartment','house','land','villa') NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `area` decimal(10,2) NOT NULL,
  `bedrooms` int(11) DEFAULT 0,
  `bathrooms` int(11) DEFAULT 0,
  `direction` varchar(50) DEFAULT '',
  `legal` enum('pink_book','red_book','contract','other') NOT NULL DEFAULT 'pink_book',
  `address` varchar(500) NOT NULL,
  `location_lat` decimal(10,6) DEFAULT 0.000000,
  `location_lng` decimal(10,6) DEFAULT 0.000000,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `video_url` varchar(500) DEFAULT '',
  `tour_3d_url` varchar(500) DEFAULT '',
  `owner_id` int(11) NOT NULL,
  `status` enum('pending','active','sold','rejected') DEFAULT 'pending',
  `ai_valuation` decimal(15,2) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `reject_reason` text DEFAULT NULL,
  `legal_scan_url` varchar(500) DEFAULT '',
  `planning_url` varchar(500) DEFAULT '',
  `room_images` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `properties`
--

INSERT INTO `properties` (`id`, `title`, `description`, `type`, `price`, `area`, `bedrooms`, `bathrooms`, `direction`, `legal`, `address`, `location_lat`, `location_lng`, `images`, `video_url`, `tour_3d_url`, `owner_id`, `status`, `ai_valuation`, `tags`, `created_at`, `updated_at`, `reject_reason`, `legal_scan_url`, `planning_url`, `room_images`) VALUES
(1, 'Căn hộ cao cấp Vinhomes Central Park', 'Căn hộ 2 phòng ngủ, view sông Sài Gòn cực đẹp, đầy đủ nội thất cao cấp.', 'apartment', 5200.00, 75.00, 2, 2, 'Đông Nam', 'pink_book', '208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM', 10.794000, 106.722000, '[\"https://picsum.photos/seed/apt1/800/600\", \"https://picsum.photos/seed/apt2/800/600\"]', '', '', 1, 'active', NULL, '[\"view_song\", \"full_noi_that\", \"vinhomes\"]', '2026-04-01 04:51:35', '2026-04-01 04:51:35', NULL, '', '', NULL),
(2, 'Nhà phố mặt tiền Quận 1 - Kinh doanh cực tốt', 'Nhà 1 trệt 3 lầu, vị trí đắc địa, đang cho thuê mặt bằng kinh doanh.', 'house', 45000.00, 120.00, 4, 4, 'Tây Bắc', 'pink_book', 'Lê Thánh Tôn, Quận 1, TP.HCM', 10.776000, 106.701000, '[\"https://picsum.photos/seed/house1/800/600\"]', '', '', 1, 'active', NULL, '[\"mat_tien\", \"kinh_doanh\", \"quan_1\"]', '2026-04-01 04:51:35', '2026-04-01 04:51:35', NULL, '', '', NULL),
(3, 'Đất nền dự án Long An - Sổ đỏ riêng', 'Lô đất vuông vức, hạ tầng hoàn thiện, pháp lý minh bạch.', 'land', 1800.00, 100.00, 0, 0, 'Nam', 'red_book', 'Bến Lức, Long An', 10.643000, 106.491000, '[\"https://picsum.photos/seed/land1/800/600\"]', '', '', 1, 'active', NULL, '[\"so_do_rieng\", \"dau_tu\", \"long_an\"]', '2026-04-01 04:51:35', '2026-04-01 04:51:35', NULL, '', '', NULL),
(4, 'Biệt thự sân vườn Thảo Điền - Đẳng cấp thượng lưu', 'Biệt thự đơn lập, hồ bơi riêng, sân vườn rộng rãi, an ninh 24/7.', 'villa', 120000.00, 500.00, 6, 7, 'Đông', 'pink_book', 'Thảo Điền, Quận 2, TP.HCM', 10.803000, 106.738000, '[\"https://picsum.photos/seed/villa1/800/600\"]', '', '', 1, 'active', NULL, '[\"biet_thu\", \"ho_boi\", \"thao_dien\"]', '2026-04-01 04:51:35', '2026-04-01 04:51:35', NULL, '', '', NULL),
(5, 'Nhà Đất Đông Anh', '### Nhà Đất Đông Anh - Cơ Hội Đầu Tư Vàng\nBạn đang tìm kiếm một cơ hội đầu tư bất động sản hấp dẫn tại Đông Anh? Chúng tôi tự hào giới thiệu đến bạn một mảnh đất tuyệt vời với diện tích 100m2, nằm tại vị trí đắc địa của quận Đông Anh, Hà Nội.\n\n#### Vị Trí Đắc Địa\n- Nằm ở khu vực phát triển nhanh chóng của Đông Anh, đảm bảo tiềm năng tăng trưởng giá trị bất động sản cao.\n- Gần các tuyến đường chính, thuận tiện di chuyển đến trung tâm Hà Nội và các khu vực lân cận.\n- Khu vực có mật độ dân cư ổn định, an ninh tốt, phù hợp cho cả mục đích sinh sống và đầu tư.\n\n#### Tiện Ích Hiện Đại\n- Gần các trường học từ tiểu học đến đại học, đảm bảo lợi ích cho gia đình có con nhỏ.\n- Khu vực có nhiều siêu thị, chợ, trung tâm thương mại, đáp ứng đầy đủ nhu cầu mua sắm hàng ngày.\n- Hệ thống bệnh viện, trung tâm y tế chất lượng cao, đảm bảo chăm sóc sức khỏe cho gia đình.\n- Cạnh các khu vui chơi, công viên, đáp ứng nhu cầu giải trí và thư giãn.\n\n#### Pháp Lý Minh Bạch\n- Sổ đỏ chính chủ, sẵn sàng chuyển nhượng.\n- Hồ sơ pháp lý đầy đủ, minh bạch, đảm bảo quá trình mua bán nhanh chóng và an toàn.\n- Hỗ trợ tư vấn và thực hiện các thủ tục pháp lý cần thiết.\n\n#### Thông Tin Chi Tiết\n- **Diện tích:** 100m2\n- **Giá:** 7111 triệu VNĐ\n- **Địa chỉ:** Đông Anh, Hà Nội\n\n#### Lời Khuyên Từ Chuyên Gia\nĐây là cơ hội vàng để sở hữu một mảnh đất tại vị trí phát triển mạnh mẽ của Đông Anh. Với tiềm năng tăng giá cao, đây sẽ là một khoản đầu tư thông minh cho tương lai. Hãy liên hệ với chúng tôi ngay hôm nay để được tư vấn và trải nghiệm dịch vụ chuyên nghiệp.\n\n### Liên Hệ\nĐể biết thêm thông tin chi tiết và sắp xếp xem nhà, xin vui lòng liên hệ:\n[Thông tin liên hệ của bạn]', 'land', 7111.00, 100.00, 4, 0, 'Nam', 'pink_book', 'Đông Anh', 10.776000, 106.701000, '[\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69cccf2e59a87.jpg\",\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69cccf2e59e68.jpg\"]', '', '', 3, 'active', NULL, '[\"land\",\"pink_book\"]', '2026-04-01 07:54:22', '2026-04-13 09:58:29', NULL, '', '', NULL),
(6, 'Nhà ở Cổ Dương', '### Nhà ở Cổ Dương - Cơ Hội Đầu Tư Vàng\n#### Vị Trí Đắc Địa - Tiện Ích Tận Hưởng\nNhà ở Cổ Dương là một cơ hội đầu tư bất động sản lý tưởng tại Số 01 Cổ Dương, Tân Thịnh, Hà Nội. Với vị trí đắc địa, lô đất này mang lại tầm nhìn tuyệt đẹp và không gian sống trong lành, đảm bảo cuộc sống chất lượng cao cho gia chủ.\n\n#### Thông Tin Chi Tiết\n- **Loại**: Đất (land)\n- **Diện tích**: 400m2\n- **Giá**: 7660 triệu VNĐ\n- **Địa chỉ**: Số 01 Cổ Dương, Tân Thịnh, Hà Nội\n\n#### Ưu Điểm Vượt Trội\n- **Vị Trí**: Strategically nằm tại khu vực phát triển sôi động của Hà Nội, gần các tuyến đường chính, thuận tiện di chuyển đến trung tâm thành phố và các khu vực lân cận.\n- **Tiện Ích**: Khu vực xung quanh có đầy đủ các tiện ích như trường học, bệnh viện, siêu thị, trung tâm thương mại, đảm bảo cuộc sống tiện nghi và đầy đủ cho gia chủ.\n- **Pháp Lý**: Sổ đỏ chính chủ, pháp lý rõ ràng, minh bạch, giúp việc mua bán và chuyển nhượng trở nên dễ dàng và an toàn.\n\n#### Cơ Hội Đầu Tư\nNhà ở Cổ Dương không chỉ là một nơi để sống, mà còn là một cơ hội đầu tư giá trị. Với vị trí đắc địa và tiềm năng phát triển cao, lô đất này hứa hẹn mang lại lợi nhuận hấp dẫn cho nhà đầu tư.\n\n#### Liên Hệ\nĐể biết thêm thông tin chi tiết và được tư vấn cụ thể, xin vui lòng liên hệ với chúng tôi. Đội ngũ chuyên gia môi giới bất động sản chuyên nghiệp của chúng tôi luôn sẵn sàng hỗ trợ và giúp bạn tìm kiếm cơ hội đầu tư phù hợp.\n\nHãy抓 lấy cơ hội này và xây dựng tương lai vững chắc với Nhà ở Cổ Dương!', 'land', 7660.00, 400.00, 4, 0, 'Đông Nam', 'red_book', 'Số 01 Cổ Dương, Tân Thịnh, Hà Nội', 10.776000, 106.701000, '[\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69ccd3ad08c51.jpg\",\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69ccd3ad0914e.jpg\"]', 'https://www.youtube.com/watch?v=Hqmbo0ROBQw&list=RDHqmbo0ROBQw&start_radio=1', '', 1, 'active', NULL, '[\"land\",\"red_book\"]', '2026-04-01 08:13:33', '2026-04-13 09:58:27', NULL, '', '', NULL),
(7, 'Căn hộ Vin Home OceanPark', '### Căn hộ Vin Home OceanPark - Không Gian Sống Tiện Nghi và Sang Trọng\n#### Vị Trí Đắc Địa\nCăn hộ Vin Home OceanPark tọa lạc tại Nhà 2 Khu CT3 Chung cư Ocean Park, Minh Khai, Hà Nội, là vị trí lý tưởng cho những ai mong muốn một không gian sống tiện nghi, hiện đại và gần gũi với thiên nhiên. Với vị trí đắc địa, căn hộ này không chỉ mang lại cho bạn một cuộc sống thoải mái mà còn là một khoản đầu tư thông minh và an toàn.\n\n#### Tiện Ích Đầy Đủ\nCăn hộ Vin Home OceanPark được thiết kế với diện tích lên đến 288.903m2, đảm bảo không gian sống rộng rãi và thoải mái cho gia đình bạn. Mỗi căn hộ đều được trang bị đầy đủ tiện nghi hiện đại, từ hệ thống điều hòa nhiệt độ, thiết bị nhà bếp cao cấp, đến hệ thống an ninh đa lớp, đảm bảo sự an toàn và riêng tư tuyệt đối.\n\nNgoài ra, khu chung cư Ocean Park còn cung cấp nhiều tiện ích hấp dẫn như:\n- Hồ bơi ngoài trời và trong nhà\n- Phòng tập thể dục và yoga\n- Khu vui chơi trẻ em\n- Nhà hàng và quán bar\n- Hệ thống siêu thị và cửa hàng tiện lợi\n- Công viên cây xanh rộng lớn\n\n#### Pháp Lý Minh Bạch\nCăn hộ Vin Home OceanPark có pháp lý rõ ràng, minh bạch, đảm bảo quyền sở hữu và đầu tư an toàn cho bạn. Với giấy chứng nhận quyền sở hữu nhà ở và quyền sử dụng đất, bạn có thể yên tâm khi sở hữu căn hộ này.\n\n#### Giá Cả Hợp Lý\nVới giá chỉ 12.338 triệu VNĐ, căn hộ Vin Home OceanPark là một lựa chọn thông minh và tiết kiệm cho những ai đang tìm kiếm một không gian sống lý tưởng tại Hà Nội. Đây là cơ hội vàng để bạn sở hữu một căn hộ cao cấp với giá cả phải chăng.\n\n#### Kết Luận\nCăn hộ Vin Home OceanPark là một lựa chọn tuyệt vời cho những ai đang tìm kiếm một không gian sống tiện nghi, sang trọng và an toàn tại Hà Nội. Với vị trí đắc địa, tiện ích đầy đủ, pháp lý minh bạch và giá cả hợp lý, căn hộ này chắc chắn sẽ đáp ứng mọi nhu cầu và mong muốn của bạn. Hãy liên hệ với chúng tôi ngay hôm nay để được tư vấn và sở hữu căn hộ mơ ước của bạn!', 'apartment', 12338.00, 288903.00, 3, 0, '', 'pink_book', 'Nhà 2 Khu CT3 Chung cư Ocean Park, Minh Khai, Hà Nội', 10.776000, 106.701000, '[\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69defff9b8c5a.jpg\",\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69defff9b91af.jpg\",\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69defff9b9423.jpg\"]', 'https://www.youtube.com/watch?v=AhokN5S8VNc&t=74s', '', 3, 'active', NULL, '[\"apartment\",\"pink_book\"]', '2026-04-15 03:03:22', '2026-04-15 03:12:17', NULL, '', '', NULL),
(8, 'Nhà ở Cổ Nhuế', '### Nhà ở Cổ Nhuế - Cơ Hội Đầu Tư Vàng\n#### Vị Trí Đắc Địa\nNhà ở Cổ Nhuế là một cơ hội đầu tư tuyệt vời cho những ai đang tìm kiếm một không gian sống lý tưởng tại trung tâm Hà Nội. Với vị trí tại Cổ Nhuế, bạn sẽ dễ dàng tiếp cận các tiện ích và dịch vụ thiết yếu như trường học, bệnh viện, siêu thị, và các khu vực giải trí.\n\n#### Tiện Ích Đầy Đủ\n- **Diện tích**: 45m2, phù hợp cho các gia đình nhỏ hoặc cá nhân muốn sở hữu một không gian sống riêng tư.\n- **Giá**: 34.000 triệu VNĐ, một mức giá cạnh tranh cho một bất động sản tại vị trí đắc địa như Cổ Nhuế.\n- **Pháp lý**: Sổ đỏ rõ ràng, đảm bảo quyền sở hữu và chuyển nhượng an toàn.\n- **Tiện ích xung quanh**: Khu vực có đầy đủ các tiện ích như trường học, chợ, siêu thị, quán ăn, và các dịch vụ giải trí.\n\n#### Ưu Điểm Nổi Bật\n- **Vị trí trung tâm**: Dễ dàng di chuyển đến các khu vực khác của Hà Nội.\n- **Môi trường sống**: Khu vực dân cư an ninh, thân thiện, thích hợp cho việc sinh sống và phát triển.\n- **Tiềm năng tăng giá**: Với vị trí đắc địa, bất động sản này có tiềm năng tăng giá cao trong tương lai.\n\n#### Thông Tin Liên Hệ\nNếu bạn quan tâm đến cơ hội sở hữu nhà ở Cổ Nhuế, hãy liên hệ với chúng tôi để được tư vấn chi tiết và hỗ trợ trong quá trình mua bán. Chúng tôi luôn sẵn sàng giúp bạn tìm kiếm và sở hữu không gian sống mơ ước của mình.\n\nĐịa chỉ: Cổ Nhuế, Hà Nội  \nGiá: 34.000 triệu VNĐ  \nDiện tích: 45m2  \nLoại: Nhà ở  \nHãy liên hệ ngay với chúng tôi để không bỏ lỡ cơ hội này!', 'house', 34000.00, 45.00, 5, 0, 'Tây Nam', 'red_book', 'Cổ Nhuế, Hà Nội', 10.776000, 106.701000, '[\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69df6241488bd.jpg\",\"\\/smart-real-estate-management-system\\/uploads\\/properties\\/img_69df624148dc8.jpg\"]', 'https://www.youtube.com/watch?v=qVqRr0pxxWM&pp=ygULbmjDoCDEkeG6pXQ%3D', '', 2, 'rejected', NULL, '[\"house\",\"red_book\"]', '2026-04-15 10:02:41', '2026-04-15 10:03:30', 'Tin đăng không đúng sự thật', '', '', NULL),
(9, 'Căn hộ Vinhomes Smart City Tây Mỗ', 'Căn hộ 3 phòng ngủ view hồ đẹp, nội thất cao cấp, tiện ích đẳng cấp 5 sao. Gần trường học quốc tế, bệnh viện.', 'apartment', 4500.00, 85.00, 3, 2, 'Đông Nam', 'pink_book', 'Tây Mỗ, Nam Từ Liêm, Hà Nội', 21.013000, 105.742000, '[\"https://picsum.photos/seed/hn_apt1/800/600\",\"https://picsum.photos/seed/hn_apt2/800/600\"]', '', '', 3, 'active', 4480.00, '[\"vinhomes\",\"tay_mo\",\"view_ho\",\"noi_that_cao_cap\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(10, 'Nhà riêng ngõ ô tô Trung Hòa - Nhân Chính', 'Nhà 4 tầng xây mới 2023, ngõ thông ô tô đỗ cửa, cách phố Trung Hòa 50m. Hướng Nam đón gió thoáng mát.', 'house', 8900.00, 52.00, 4, 4, 'Nam', 'pink_book', '28 Ngõ 16 Trung Hòa, Cầu Giấy, Hà Nội', 21.014000, 105.795000, '[\"https://picsum.photos/seed/hn_house1/800/600\",\"https://picsum.photos/seed/hn_house2/800/600\"]', '', '', 3, 'active', 8750.00, '[\"o_to_cua\",\"xay_moi\",\"cau_giay\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(11, 'Đất nền biệt thự Ecopark Văn Giang', 'Lô góc 2 mặt tiền, vị trí đẹp nhất phân khu Aqua Bay. Diện tích 200m², sổ đỏ lâu dài.', 'land', 15000.00, 200.00, 0, 0, 'Bắc', 'red_book', 'Ecopark, Văn Giang, Hưng Yên', 20.951000, 105.923000, '[\"https://picsum.photos/seed/hn_land1/800/600\"]', '', '', 1, 'active', 14800.00, '[\"lo_goc\",\"ecopark\",\"van_giang\",\"so_do\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(12, 'Biệt thự song lập Gamuda Gardens', 'Biệt thự song lập 3 tầng, 250m², hồ bơi riêng, sân vườn thiết kế theo phong cách nhiệt đới. An ninh 24/7.', 'villa', 28000.00, 250.00, 5, 5, 'Tây Nam', 'pink_book', 'Gamuda Gardens, Hoàng Mai, Hà Nội', 20.972000, 105.842000, '[\"https://picsum.photos/seed/hn_villa1/800/600\",\"https://picsum.photos/seed/hn_villa2/800/600\"]', '', '', 1, 'active', 27500.00, '[\"song_lap\",\"gamuda\",\"ho_boi\",\"hoang_mai\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(13, 'Chung cư The Zei Mỹ Đình - 2PN full nội thất', 'Căn hộ 2 phòng ngủ 68m², ban công thoáng, ban giao full nội thất thương hiệu Châu Âu. Gần Keangnam, Big C.', 'apartment', 4100.00, 68.00, 2, 2, 'Bắc', 'pink_book', '8 Lê Đức Thọ, Mỹ Đình, Nam Từ Liêm, Hà Nội', 21.027000, 105.775000, '[\"https://picsum.photos/seed/zei1/800/600\",\"https://picsum.photos/seed/zei2/800/600\"]', '', '', 3, 'active', 4050.00, '[\"the_zei\",\"my_dinh\",\"full_noi_that\",\"2pn\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(14, 'Shophouse mặt phố Kim Mã', 'Shophouse 5 tầng mặt phố Kim Mã, lô góc 2 mặt tiền, thích hợp văn phòng – kinh doanh – cho thuê.', 'house', 52000.00, 95.00, 0, 0, 'Đông', 'pink_book', '127 Kim Mã, Ba Đình, Hà Nội', 21.033000, 105.826000, '[\"https://picsum.photos/seed/kimma1/800/600\"]', '', '', 3, 'active', 51000.00, '[\"shophouse\",\"kim_ma\",\"mat_pho\",\"ba_dinh\",\"kinh_doanh\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(15, 'Penthouse The Marq Quận 1 - 360° Panorama', 'Penthouse tầng 38, 320m², 4 phòng ngủ, view 360° toàn cảnh TP.HCM. Thiết kế bởi kiến trúc sư Singapore.', 'apartment', 85000.00, 320.00, 4, 5, 'Đông Nam', 'pink_book', '11D Hồng Hà, Phường 2, Tân Bình, TP.HCM', 10.813000, 106.686000, '[\"https://picsum.photos/seed/penthouse1/800/600\",\"https://picsum.photos/seed/penthouse2/800/600\"]', '', '', 1, 'active', 83000.00, '[\"penthouse\",\"view_toan_canh\",\"the_marq\",\"hang_s\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(16, 'Căn hộ Masteri Thảo Điền 1PN Studio', 'Studio 45m² thiết kế thông minh, view sông Sài Gòn, full nội thất cao cấp, thích hợp đầu tư cho thuê.', 'apartment', 3200.00, 45.00, 1, 1, 'Tây', 'pink_book', 'Masteri Thảo Điền, Quận 2, TP.HCM', 10.807000, 106.741000, '[\"https://picsum.photos/seed/masteri1/800/600\",\"https://picsum.photos/seed/masteri2/800/600\"]', '', '', 3, 'active', 3150.00, '[\"masteri\",\"studio\",\"view_song\",\"thao_dien\",\"dau_tu\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(17, 'Nhà phố liền kề Akari City Bình Tân', 'Nhà phố liền kề 1 trệt 3 lầu, DT 5x17m, sân vườn trước sau, mặt tiền đường 30m trong khu compound an ninh.', 'house', 12500.00, 85.00, 4, 3, 'Tây Nam', 'pink_book', 'Akari City, Bình Tân, TP.HCM', 10.741000, 106.613000, '[\"https://picsum.photos/seed/akari1/800/600\",\"https://picsum.photos/seed/akari2/800/600\"]', '', '', 3, 'active', 12200.00, '[\"akari\",\"lien_ke\",\"binh_tan\",\"san_vuon\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(18, 'Đất nền mặt tiền Quốc lộ 50 - Long An', 'Đất mặt tiền 25m, DT 500m², phù hợp làm kho bãi, xưởng nhỏ hoặc nhà hàng. Đường 6 làn xe.', 'land', 6800.00, 500.00, 0, 0, 'Tây', 'red_book', 'Quốc lộ 50, Bình Chánh, TP.HCM', 10.676000, 106.583000, '[\"https://picsum.photos/seed/ql50_1/800/600\"]', '', '', 1, 'active', 6700.00, '[\"mat_tien_ql\",\"kho_bai\",\"binh_chanh\",\"dau_tu\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(19, 'Biệt thự compound Saigon Mystery Villas', 'Biệt thự đơn lập 400m², hồ bơi infinity, gym riêng, sân tennis. Phong cách Địa Trung Hải sang trọng.', 'villa', 95000.00, 400.00, 6, 6, 'Đông', 'pink_book', 'Thảo Điền, TP. Thủ Đức, TP.HCM', 10.812000, 106.745000, '[\"https://picsum.photos/seed/mystery1/800/600\",\"https://picsum.photos/seed/mystery2/800/600\"]', '', '', 1, 'active', 94000.00, '[\"mystery_villas\",\"ho_boi_infinity\",\"dia_trung_hai\",\"thu_duc\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(20, 'Căn hộ Sunrise City View Quận 7', 'Căn hộ 2PN 80m², tầng 20, view Phú Mỹ Hưng, nội thất đầy đủ. Cộng đồng cư dân văn minh.', 'apartment', 6300.00, 80.00, 2, 2, 'Nam', 'pink_book', 'Sunrise City View, Quận 7, TP.HCM', 10.728000, 106.713000, '[\"https://picsum.photos/seed/sunrise1/800/600\",\"https://picsum.photos/seed/sunrise2/800/600\"]', '', '', 3, 'active', 6200.00, '[\"sunrise\",\"view_phu_my_hung\",\"quan_7\",\"2pn\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(21, 'Căn hộ biển Mỹ Khê - Soleil Đà Nẵng', 'Căn hộ 2PN mặt biển Mỹ Khê, tầng 15, view biển trực tiếp, đủ nội thất 5 sao, cam kết lợi nhuận 10%/năm.', 'apartment', 5800.00, 72.00, 2, 2, 'Đông', 'pink_book', 'Mỹ Khê, Sơn Trà, Đà Nẵng', 16.065000, 108.245000, '[\"https://picsum.photos/seed/dn_beach1/800/600\",\"https://picsum.photos/seed/dn_beach2/800/600\"]', '', '', 3, 'active', 5700.00, '[\"mat_bien\",\"my_khe\",\"cam_ket_loi_nhuan\",\"da_nang\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(22, 'Nhà phố 3 tầng đường Nguyễn Văn Linh Đà Nẵng', 'Nhà 3 tầng xây mới, mặt tiền 6m, hướng Đông, khu dân cư an ninh Ngũ Hành Sơn.', 'house', 7500.00, 110.00, 5, 4, 'Đông', 'pink_book', '56 Nguyễn Văn Linh, Ngũ Hành Sơn, Đà Nẵng', 16.022000, 108.239000, '[\"https://picsum.photos/seed/dn_house1/800/600\"]', '', '', 3, 'active', 7400.00, '[\"mat_tien\",\"ngu_hanh_son\",\"da_nang\",\"xay_moi\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(23, 'Đất nền Nam Hoa - Ngũ Hành Sơn', 'Lô 100m² đất ở đô thị, hướng Tây, gần biển Mỹ Khê 500m, sổ đỏ chính chủ, không quy hoạch.', 'land', 4200.00, 100.00, 0, 0, 'Tây', 'red_book', 'Nam Hoa, Ngũ Hành Sơn, Đà Nẵng', 16.031000, 108.237000, '[\"https://picsum.photos/seed/dn_land1/800/600\"]', '', '', 1, 'active', 4100.00, '[\"gan_bien\",\"so_do\",\"ngu_hanh_son\",\"da_nang\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(24, 'Biệt thự nghỉ dưỡng InterContinental Sun Peninsula', 'Biệt thự 5* view biển Bán đảo Sơn Trà, thiết kế bởi Bill Bensley, cam kết thuê lại 65% doanh thu.', 'villa', 68000.00, 350.00, 5, 5, 'Đông', 'pink_book', 'Bán đảo Sơn Trà, Đà Nẵng', 16.103000, 108.286000, '[\"https://picsum.photos/seed/dn_villa1/800/600\",\"https://picsum.photos/seed/dn_villa2/800/600\"]', '', '', 1, 'active', 67000.00, '[\"5_sao\",\"son_tra\",\"view_bien\",\"cam_ket_thue_lai\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(25, 'Căn hộ Goldengate Nha Trang - Rooftop Pool', 'Căn hộ 2PN 65m², bể bơi vô cực tầng thượng, view vịnh Nha Trang thơ mộng. Cho thuê ngắn hạn tốt.', 'apartment', 3500.00, 65.00, 2, 2, 'Đông', 'pink_book', 'Trần Phú, Nha Trang, Khánh Hòa', 12.239000, 109.194000, '[\"https://picsum.photos/seed/nt_apt1/800/600\",\"https://picsum.photos/seed/nt_apt2/800/600\"]', '', '', 3, 'active', 3400.00, '[\"rooftop_pool\",\"vinh_nha_trang\",\"cho_thue_ngan_han\",\"khanh_hoa\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(26, 'Đất biệt thự Vinpearl Golf Land Nha Trang', 'Lô giới hạn trong khu Vinpearl Golf Land, 250m², view sân golf và biển, tiềm năng đầu tư cao.', 'land', 12000.00, 250.00, 0, 0, 'Nam', 'pink_book', 'Phước Đồng, Nha Trang, Khánh Hòa', 12.196000, 109.152000, '[\"https://picsum.photos/seed/nt_land1/800/600\"]', '', '', 1, 'active', 11800.00, '[\"vinpearl\",\"san_golf\",\"view_bien\",\"nha_trang\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(27, 'Villa biển Phú Quốc - Premier Village', 'Villa 3PN 300m² mặt biển Bãi Kem, hồ bơi vô cực trực tiếp ra biển, pháp lý 50 năm gia hạn.', 'villa', 55000.00, 300.00, 3, 4, 'Đông', 'pink_book', 'Bãi Kem, An Thới, Phú Quốc, Kiên Giang', 10.084000, 104.008000, '[\"https://picsum.photos/seed/pq_villa1/800/600\",\"https://picsum.photos/seed/pq_villa2/800/600\"]', '', '', 1, 'active', 54000.00, '[\"mat_bien\",\"bai_kem\",\"ho_boi\",\"phu_quoc\",\"premier_village\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(28, 'Shophouse Phú Quốc United Center', 'Shophouse 2 tầng 120m², mặt tiền đường nội khu lớn, kinh doanh sầm uất, cam kết lợi nhuận 8%/năm.', 'house', 18000.00, 120.00, 0, 0, 'Tây', 'pink_book', 'Phú Quốc United Center, Kiên Giang', 10.201000, 103.973000, '[\"https://picsum.photos/seed/pq_shop1/800/600\"]', '', '', 3, 'active', 17800.00, '[\"shophouse\",\"phu_quoc_united\",\"kinh_doanh\",\"cam_ket_loi_nhuan\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(29, 'Nhà phố cổ Hội An - Kinh doanh homestay', 'Nhà 2 tầng 180m² kiến trúc cổ Hội An, 6 phòng suite đang cho thuê homestay 90% công suất.', 'house', 22000.00, 180.00, 6, 6, 'Nam', 'pink_book', 'Phường Minh An, Hội An, Quảng Nam', 15.877000, 108.327000, '[\"https://picsum.photos/seed/hoian1/800/600\",\"https://picsum.photos/seed/hoian2/800/600\"]', '', '', 3, 'active', 21500.00, '[\"nha_co\",\"hoi_an\",\"homestay\",\"kinh_doanh\",\"90_cong_suat\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(30, 'Đất nền Điện Bàn - Gần Hội An 2km', 'Đất thổ cư 150m², mặt tiền 8m, cách phố cổ Hội An 2km, hạ tầng điện nước hoàn chỉnh.', 'land', 2800.00, 150.00, 0, 0, 'Tây Nam', 'red_book', 'Điện Bàn, Quảng Nam', 15.880000, 108.294000, '[\"https://picsum.photos/seed/hoian_land1/800/600\"]', '', '', 3, 'active', 2750.00, '[\"gan_hoi_an\",\"dien_ban\",\"tho_cu\",\"mat_tien_8m\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(31, 'Căn hộ Saigon Central Cần Thơ - View Sông Hậu', 'Căn hộ 2PN 75m² view sông Hậu, tầng 18, nội thất cơ bản, pháp lý sổ hồng riêng.', 'apartment', 2800.00, 75.00, 2, 2, 'Tây', 'pink_book', 'Ninh Kiều, Cần Thơ', 10.036000, 105.788000, '[\"https://picsum.photos/seed/cantho1/800/600\",\"https://picsum.photos/seed/cantho2/800/600\"]', '', '', 3, 'active', 2750.00, '[\"view_song_hau\",\"ninh_kieu\",\"can_tho\",\"so_hong\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(32, 'Biệt thự vườn miền Tây Cần Thơ', 'Biệt thự 4 tầng 600m² sân vườn, vườn cây ăn trái, ao cá, nhà hàng ẩm thực miền Tây đang hoạt động.', 'villa', 18500.00, 600.00, 8, 6, 'Nam', 'pink_book', 'Cái Răng, Cần Thơ', 10.002000, 105.789000, '[\"https://picsum.photos/seed/cantho_villa1/800/600\",\"https://picsum.photos/seed/cantho_villa2/800/600\"]', '', '', 1, 'active', 18000.00, '[\"vuon_mien_tay\",\"nha_hang\",\"ao_ca\",\"cai_rang\",\"can_tho\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(33, 'Căn hộ Bcons Miền Đông Bình Dương', 'Căn hộ 1PN 55m² thích hợp đầu tư cho thuê công nhân - chuyên gia KCN VSIP 2. Lợi nhuận 7-8%/năm.', 'apartment', 1350.00, 55.00, 1, 1, 'Bắc', 'pink_book', 'Dĩ An, Bình Dương', 10.894000, 106.771000, '[\"https://picsum.photos/seed/bd_apt1/800/600\"]', '', '', 3, 'active', 1320.00, '[\"bcons\",\"di_an\",\"binh_duong\",\"kcn_vsip\",\"dau_tu_cho_thue\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(34, 'Đất KCN Long Thành - Đồng Nai (1000m²)', 'Đất công nghiệp 1000m², gần KCN Long Thành – Nhơn Trạch, tiếp giáp đường ĐT769, sổ đỏ.', 'land', 5500.00, 1000.00, 0, 0, 'Đông', 'red_book', 'Long Thành, Đồng Nai', 10.826000, 107.012000, '[\"https://picsum.photos/seed/dn_land2/800/600\"]', '', '', 1, 'active', 5400.00, '[\"dat_cong_nghiep\",\"kcn_long_thanh\",\"dong_nai\",\"so_do\",\"1000m2\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(35, 'Condotel Wyndham Sky Lake Vân Đồn', 'Condotel tầng 25 view Vịnh Hạ Long, 50m², hoàn thiện nội thất 5*, cam kết thuê 8%/năm 10 năm.', 'apartment', 2200.00, 50.00, 1, 1, 'Đông', 'pink_book', 'Vân Đồn, Quảng Ninh', 21.013000, 107.469000, '[\"https://picsum.photos/seed/vd_condo1/800/600\",\"https://picsum.photos/seed/vd_condo2/800/600\"]', '', '', 3, 'active', 2150.00, '[\"condotel\",\"wyndham\",\"vinh_ha_long\",\"cam_ket_thue_lai\",\"5_sao\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL),
(36, 'Đất nền nghỉ dưỡng Cô Tô - Quảng Ninh', 'Đất 300m² ven biển đảo Cô Tô, phong trào du lịch nở rộ, tiềm năng phát triển resort mini.', 'land', 3800.00, 300.00, 0, 0, 'Đông', 'other', 'Cô Tô, Quảng Ninh', 20.992000, 107.773000, '[\"https://picsum.photos/seed/coto1/800/600\"]', '', '', 1, 'active', 3700.00, '[\"co_to\",\"bien_dao\",\"resort_mini\",\"quang_ninh\",\"tiem_nang\"]', '2026-04-21 07:31:57', '2026-04-21 07:31:57', NULL, '', '', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `user_name` varchar(100) DEFAULT '',
  `user_avatar` varchar(500) DEFAULT '',
  `rating` tinyint(4) NOT NULL,
  `comment` text NOT NULL,
  `likes` int(11) DEFAULT 0,
  `verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `reviews`
--

INSERT INTO `reviews` (`id`, `property_id`, `user_id`, `user_name`, `user_avatar`, `rating`, `comment`, `likes`, `verified`, `created_at`) VALUES
(1, 1, 2, 'Nguyễn Văn Demo', '', 5, 'Vị trí tuyệt vời, thủ tục nhanh gọn. Rất hài lòng!', 5, 1, '2026-04-01 04:51:35'),
(2, 1, 3, 'Trần Thị Agent', '', 4, 'Giá hơi cao nhưng chất lượng xây dựng rất tốt.', 2, 1, '2026-04-01 04:51:35'),
(3, 2, 2, 'Nguyễn Văn Demo', '', 5, 'Vị trí đắc địa, kinh doanh rất thuận lợi!', 8, 1, '2026-04-01 04:51:35'),
(4, 3, 3, 'Trần Thị Agent', '', 4, 'Pháp lý rõ ràng, hạ tầng đang phát triển tốt.', 3, 1, '2026-04-01 04:51:35'),
(5, 4, 2, 'Nguyễn Văn Demo', '', 5, 'Biệt thự siêu đẹp, an ninh tuyệt đối!', 10, 1, '2026-04-01 04:51:35'),
(6, 9, 3, 'Trần Thị Agent', '', 3, 'Vị trí ổn nhưng hạ tầng xung quanh cần thêm thời gian phát triển.', 8, 1, '2026-04-21 07:31:57'),
(7, 10, 2, 'Nguyễn Văn Demo', '', 5, 'Rất đáng mua, vị trí tiện lợi, giá hợp lý!', 15, 1, '2026-04-21 07:31:57'),
(8, 11, 3, 'Trần Thị Agent', '', 5, 'Nội thất cao cấp, dịch vụ chuyên nghiệp, tôi rất hài lòng.', 14, 1, '2026-04-21 07:31:57'),
(9, 12, 2, 'Nguyễn Văn Demo', '', 4, 'Tiện ích xung quanh đầy đủ, giá tốt trong tầm giá này.', 15, 1, '2026-04-21 07:31:57'),
(10, 13, 3, 'Trần Thị Agent', '', 4, 'Pháp lý rõ ràng, đội ngũ tư vấn nhiệt tình.', 10, 1, '2026-04-21 07:31:57'),
(11, 14, 2, 'Nguyễn Văn Demo', '', 3, 'Vị trí ổn nhưng hạ tầng xung quanh cần thêm thời gian phát triển.', 10, 1, '2026-04-21 07:31:57'),
(12, 15, 3, 'Trần Thị Agent', '', 5, 'Rất đáng mua, vị trí tiện lợi, giá hợp lý!', 9, 1, '2026-04-21 07:31:57'),
(13, 16, 2, 'Nguyễn Văn Demo', '', 5, 'Nội thất cao cấp, dịch vụ chuyên nghiệp, tôi rất hài lòng.', 2, 1, '2026-04-21 07:31:57'),
(14, 17, 3, 'Trần Thị Agent', '', 4, 'Tiện ích xung quanh đầy đủ, giá tốt trong tầm giá này.', 12, 1, '2026-04-21 07:31:57'),
(15, 18, 2, 'Nguyễn Văn Demo', '', 4, 'Pháp lý rõ ràng, đội ngũ tư vấn nhiệt tình.', 4, 1, '2026-04-21 07:31:57'),
(16, 19, 3, 'Trần Thị Agent', '', 3, 'Vị trí ổn nhưng hạ tầng xung quanh cần thêm thời gian phát triển.', 11, 1, '2026-04-21 07:31:57'),
(17, 20, 2, 'Nguyễn Văn Demo', '', 5, 'Rất đáng mua, vị trí tiện lợi, giá hợp lý!', 14, 1, '2026-04-21 07:31:57'),
(18, 21, 3, 'Trần Thị Agent', '', 5, 'Nội thất cao cấp, dịch vụ chuyên nghiệp, tôi rất hài lòng.', 3, 1, '2026-04-21 07:31:57'),
(19, 22, 2, 'Nguyễn Văn Demo', '', 4, 'Tiện ích xung quanh đầy đủ, giá tốt trong tầm giá này.', 3, 1, '2026-04-21 07:31:57'),
(20, 23, 3, 'Trần Thị Agent', '', 4, 'Pháp lý rõ ràng, đội ngũ tư vấn nhiệt tình.', 9, 1, '2026-04-21 07:31:57'),
(21, 24, 2, 'Nguyễn Văn Demo', '', 3, 'Vị trí ổn nhưng hạ tầng xung quanh cần thêm thời gian phát triển.', 6, 1, '2026-04-21 07:31:57'),
(22, 25, 3, 'Trần Thị Agent', '', 5, 'Rất đáng mua, vị trí tiện lợi, giá hợp lý!', 2, 1, '2026-04-21 07:31:57'),
(23, 26, 2, 'Nguyễn Văn Demo', '', 5, 'Nội thất cao cấp, dịch vụ chuyên nghiệp, tôi rất hài lòng.', 15, 1, '2026-04-21 07:31:57'),
(24, 27, 3, 'Trần Thị Agent', '', 4, 'Tiện ích xung quanh đầy đủ, giá tốt trong tầm giá này.', 14, 1, '2026-04-21 07:31:57'),
(25, 28, 2, 'Nguyễn Văn Demo', '', 4, 'Pháp lý rõ ràng, đội ngũ tư vấn nhiệt tình.', 11, 1, '2026-04-21 07:31:57'),
(26, 29, 3, 'Trần Thị Agent', '', 3, 'Vị trí ổn nhưng hạ tầng xung quanh cần thêm thời gian phát triển.', 8, 1, '2026-04-21 07:31:57'),
(27, 30, 2, 'Nguyễn Văn Demo', '', 5, 'Rất đáng mua, vị trí tiện lợi, giá hợp lý!', 11, 1, '2026-04-21 07:31:57'),
(28, 31, 3, 'Trần Thị Agent', '', 5, 'Nội thất cao cấp, dịch vụ chuyên nghiệp, tôi rất hài lòng.', 5, 1, '2026-04-21 07:31:57'),
(29, 32, 2, 'Nguyễn Văn Demo', '', 4, 'Tiện ích xung quanh đầy đủ, giá tốt trong tầm giá này.', 5, 1, '2026-04-21 07:31:57'),
(30, 33, 3, 'Trần Thị Agent', '', 4, 'Pháp lý rõ ràng, đội ngũ tư vấn nhiệt tình.', 5, 1, '2026-04-21 07:31:57'),
(31, 34, 2, 'Nguyễn Văn Demo', '', 3, 'Vị trí ổn nhưng hạ tầng xung quanh cần thêm thời gian phát triển.', 6, 1, '2026-04-21 07:31:57'),
(32, 35, 3, 'Trần Thị Agent', '', 5, 'Rất đáng mua, vị trí tiện lợi, giá hợp lý!', 7, 1, '2026-04-21 07:31:57'),
(33, 36, 2, 'Nguyễn Văn Demo', '', 5, 'Nội thất cao cấp, dịch vụ chuyên nghiệp, tôi rất hài lòng.', 1, 1, '2026-04-21 07:31:57');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `saved_properties`
--

CREATE TABLE `saved_properties` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `plan_name` enum('basic','professional','enterprise') NOT NULL DEFAULT 'basic',
  `plan_label` varchar(100) NOT NULL DEFAULT '',
  `price_vnd` varchar(50) NOT NULL DEFAULT 'Mien phi',
  `payment_method` enum('qr_transfer','credit_card','contact') DEFAULT 'contact',
  `status` enum('pending','active','rejected','cancelled') DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `user_id`, `plan_name`, `plan_label`, `price_vnd`, `payment_method`, `status`, `note`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 2, 'enterprise', 'Doanh nghiệp', 'Liên hệ', 'contact', 'rejected', 'Loại thiết lập chưa được doanh nghiệp chấp nhận', 1, '2026-04-17 06:51:07', '2026-04-13 09:58:00', '2026-04-17 06:51:07'),
(2, 5, 'professional', 'Chuyên nghiệp', '499.000đ', 'qr_transfer', 'rejected', 'Chưa thấy xác nhận chuyển khoản thành công', 1, '2026-04-16 08:50:38', '2026-04-16 08:49:37', '2026-04-16 08:50:38'),
(3, 3, 'professional', 'Chuyên nghiệp', '499.000đ/tháng', '', 'active', 'Được gán trực tiếp bởi Quản trị viên', NULL, '2026-05-05 03:35:01', '2026-05-05 03:35:01', '2026-05-05 03:35:01');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `display_name` varchar(100) DEFAULT '',
  `photo_url` varchar(500) DEFAULT '',
  `role` enum('admin','user','agent') DEFAULT 'user',
  `kyc_verified` tinyint(1) DEFAULT 0,
  `permissions_updated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `subscription_plan` enum('basic','professional','enterprise') DEFAULT 'basic',
  `subscription_expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `display_name`, `photo_url`, `role`, `kyc_verified`, `permissions_updated_at`, `created_at`, `subscription_plan`, `subscription_expires_at`) VALUES
(1, 'admin@smartre.vn', '$2y$10$zpdThPULF/7Y7.Dv0f2k.OtUbhLUiuOk09wlQcHT/ZILW8df9v.FK', 'Quản trị viên', '', 'admin', 1, NULL, '2026-04-01 04:51:34', 'basic', NULL),
(2, 'user@smartre.vn', '$2y$10$7y21Y08nsOR9ukFleFdYVuTUc3iq2o8.yg9yMMh1f8N2jzT5iykEa', 'Phạm Văn Đức', '/smart-real-estate-management-system/uploads/users/img_69cf21e695ad2.jpg', 'user', 0, NULL, '2026-04-01 04:51:35', 'basic', NULL),
(3, 'agent@smartre.vn', '$2y$10$XQ6uHK7h20pAV9MIL2m29uENluBiDcxHblboBpjQYdzDj5Wo7UB4y', 'Trần Đức Anh', '/smart-real-estate-management-system/uploads/users/img_69d34c8cbc4ef.jpg', 'agent', 1, NULL, '2026-04-01 04:51:35', 'professional', '2026-06-03 22:35:01'),
(4, 'newuser456@gmail.com', '$2y$10$t43oIup0dlRpBFTc99F2leNYVeVUq7WFXkSAeEtP8KAXq2WzIZPLK', 'Người dùng', '', 'user', 0, NULL, '2026-04-14 09:10:13', 'basic', NULL),
(5, '22111061580@hunre.edu.vn', '$2y$10$LTzvd1d0hMP5pP7ZeSHAx.YpSV4TCl/bR8TSgosH6cfXMxKrjIbtC', 'Thọ', '/smart-real-estate-management-system/uploads/users/img_69e0a281ed015.jpg', 'user', 0, NULL, '2026-04-14 09:38:08', 'basic', NULL);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted_by` int(11) DEFAULT NULL,
  `granted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Chỉ mục cho bảng `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conv` (`user1_id`,`user2_id`),
  ADD KEY `user2_id` (`user2_id`);

--
-- Chỉ mục cho bảng `kyc_documents`
--
ALTER TABLE `kyc_documents`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `conversation_id` (`conversation_id`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `otp_codes`
--
ALTER TABLE `otp_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_email_purpose` (`email`,`purpose`);

--
-- Chỉ mục cho bảng `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_category` (`category`);

--
-- Chỉ mục cho bảng `properties`
--
ALTER TABLE `properties`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner_id` (`owner_id`);

--
-- Chỉ mục cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `property_id` (`property_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `saved_properties`
--
ALTER TABLE `saved_properties`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_save` (`user_id`,`property_id`),
  ADD KEY `property_id` (`property_id`);

--
-- Chỉ mục cho bảng `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Chỉ mục cho bảng `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_permission` (`user_id`,`permission_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_permission` (`permission_id`),
  ADD KEY `idx_granted_by` (`granted_by`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT cho bảng `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `kyc_documents`
--
ALTER TABLE `kyc_documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT cho bảng `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT cho bảng `otp_codes`
--
ALTER TABLE `otp_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT cho bảng `properties`
--
ALTER TABLE `properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT cho bảng `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT cho bảng `saved_properties`
--
ALTER TABLE `saved_properties`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT cho bảng `subscriptions`
--
ALTER TABLE `subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT cho bảng `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT cho bảng `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `kyc_documents`
--
ALTER TABLE `kyc_documents`
  ADD CONSTRAINT `kyc_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `properties`
--
ALTER TABLE `properties`
  ADD CONSTRAINT `properties_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `saved_properties`
--
ALTER TABLE `saved_properties`
  ADD CONSTRAINT `saved_properties_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_properties_ibfk_2` FOREIGN KEY (`property_id`) REFERENCES `properties` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_permissions_ibfk_3` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
