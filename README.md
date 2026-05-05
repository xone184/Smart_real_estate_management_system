# 🏠 SmartRE — Hệ thống Quản lý Bất động sản Thông minh

[![Phiên bản](https://img.shields.io/badge/phi%C3%AAn%20b%E1%BA%A3n-2.0.0-blue.svg)](https://github.com/your-repo)
[![React](https://img.shields.io/badge/frontend-React%2018-61dafb.svg)](https://reactjs.org/)
[![PHP](https://img.shields.io/badge/backend-PHP%208.1-777bb4.svg)](https://www.php.net/)
[![Giấy phép](https://img.shields.io/badge/gi%E1%BA%A5y%20ph%C3%A9p-MIT-green.svg)](LICENSE)

**SmartRE** là một nền tảng bất động sản hiện đại, tích hợp AI, được thiết kế để cách mạng hóa cách quản lý, tìm kiếm và trình diễn bất động sản. Với mục tiêu mang lại trải nghiệm người dùng (UX) cao cấp và thẩm mỹ hiện đại, SmartRE kết hợp sức mạnh của **React + TypeScript** với hệ thống **PHP REST API** mạnh mẽ để tạo ra một hệ sinh thái bất động sản liền mạch.

---

## ✨ Điểm nổi bật chính

### 🤖 Trí tuệ Nhân tạo AI
- **Trợ lý Chatbot AI**: Tư vấn bất động sản và hỗ trợ điều hướng trang web theo thời gian thực sử dụng các mô hình LLM tiên tiến (Gemini/Groq).
- **Tự động hóa Nội dung**: AI tự động viết mô tả phòng và lời giới thiệu chuyên nghiệp dựa trên dữ liệu hình ảnh và thông tin đầu vào.
- **Xác thực Thông minh**: Kiểm tra tọa độ, giá cả và tính pháp lý của tin đăng ngay lập tức.

### 🖼️ Trình diễn Bất động sản Cao cấp
- **Guided Tour (Tham quan ảo)**: Trải nghiệm hình ảnh chất lượng cao từng phòng với mô tả tự động bằng AI tại các điểm dừng chân.
- **Đăng tin Đa bước (Stepper)**: Giao diện đăng tin hiện đại, mượt mà với hệ thống kiểm soát dữ liệu nghiêm ngặt.
- **Phân tích Thị trường**: Tích hợp biểu đồ và trực quan hóa dữ liệu bằng **Recharts** để theo dõi xu hướng giá cả.

### 👤 Hệ sinh thái Người dùng Nâng cao
- **Bảng điều khiển (Dashboard) Đa năng**: Giao diện chuyên biệt cho **Admin**, **Môi giới** và **Người dùng**.
- **Quản lý Lịch hẹn Thông minh**: Đặt lịch xem nhà với kiểm tra tính khả dụng thực tế và quản lý phân trang hiệu quả (2 bản ghi/trang).
- **Xác thực KYC**: Hệ thống xác minh danh tính tích hợp giúp tăng độ tin cậy trong giao dịch.
- **Nhắn tin Nội bộ**: Trao đổi trực tiếp giữa khách hàng và môi giới.

---

## 🛠️ Công nghệ Sử dụng

### Frontend
- **Cốt lõi**: React 18 (Vite), TypeScript
- **Styling**: Vanilla CSS (Thiết kế Hiện đại), Tailwind (Tiện ích), Lucide Icons
- **Hiệu ứng**: Motion (Animation mượt mà)
- **Trực quan dữ liệu**: Recharts, D3.js
- **Dịch vụ**: Gemini AI API, Groq Cloud API

### Backend
- **Máy chủ**: PHP 8.1+ (Kiến trúc RESTful API)
- **Cơ sở dữ liệu**: MySQL 8.0+
- **Môi trường**: XAMPP / Apache
- **Quản lý phụ thuộc**: Composer, vlucas/phpdotenv

---

## 🚀 Cài đặt & Thiết lập

### 📋 Yêu cầu hệ thống
- **XAMPP** (hoặc môi trường LAMP/WAMP tương đương)
- **Node.js 18+**
- **Composer**

### 1. Cấu hình Môi trường
Sao chép file cấu hình và chuẩn bị các biến môi trường:
```bash
cp .env.example .env
```
Cập nhật `.env` với thông tin cơ sở dữ liệu và API key của bạn:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=smartre_db
APP_URL=http://localhost/smart-real-estate-management-system
GEMINI_API_KEY=key_cua_ban_tai_day
```

### 2. Khởi tạo Backend
Cài đặt các thư viện PHP và thiết lập cơ sở dữ liệu:
```bash
composer install
```
Sau đó, chạy các script khởi tạo thông qua trình duyệt:
- `http://localhost/.../api/tools/init_db.php` (Thiết lập DB)
- `http://localhost/.../api/tools/seed.php` (Dữ liệu mẫu)

### 3. Khởi chạy Frontend
Cài đặt các gói Node và chạy server phát triển:
```bash
npm install
npm run dev
```
Truy cập ứng dụng tại: **http://localhost:3000**

---

## 🔑 Tài khoản Demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| **Quản trị viên** | `admin@smartre.vn` | `admin123` |
| **Môi giới (Pro)** | `agent@smartre.vn` | `agent123` |
| **Người dùng** | `user@smartre.vn` | `user123` |

---

## 📂 Cấu trúc Thư mục

```text
smart-real-estate-management-system/
├── api/                   # PHP REST API (Controllers, Routes, Config)
├── src/                   # React Components, Hooks, Services
│   ├── components/        # UI, Dashboards, Property components
│   ├── services/          # API services & tích hợp AI
│   └── types/             # TypeScript interfaces
├── database/              # Schema SQL & File backup
└── uploads/               # Lưu trữ tệp tin người dùng tải lên
```

---

## 🛡️ Bảo mật & Tối ưu hóa
- **Chính sách CORS**: Kiểm soát truy cập nghiêm ngặt qua `config.php`.
- **JWT/OTP**: Xác thực và bảo mật danh tính người dùng.
- **Phản hồi Thời gian thực**: Hệ thống validate chặn lỗi ngay tại frontend để đảm bảo chất lượng dữ liệu.

---

## 📄 Giấy phép
Dự án này được cấp phép theo Giấy phép MIT - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---
*Được phát triển với ❤️ bởi Đội ngũ SmartRE.*
