# SmartRE — Hệ thống Quản lý Bất động sản Thông minh

Nền tảng quản lý BĐS tích hợp AI, xây dựng bằng **React + TypeScript** (frontend) và **PHP + MySQL** (backend), chạy trên môi trường **XAMPP**.

---

## 🗂️ Cấu trúc dự án

```
smart-real-estate-management-system/
├── api/                        # Backend PHP REST API
│   ├── config.php              # Cấu hình DB, CORS, helper functions
│   ├── health.php              # Health check endpoint
│   ├── auth/                   # Đăng nhập, đăng ký, OTP
│   ├── properties/             # CRUD bất động sản, đánh giá, lưu BĐS
│   ├── users/                  # Quản lý người dùng, KYC
│   ├── messages/               # Hệ thống nhắn tin nội bộ
│   ├── notifications/          # Thông báo real-time
│   ├── appointments/           # Đặt lịch xem nhà
│   ├── subscriptions/          # Gói đăng ký dịch vụ
│   ├── reports/                # Xuất báo cáo CSV
│   ├── news/                   # Tin tức BĐS (RSS)
│   ├── upload/                 # Upload ảnh/file
│   ├── uploads/                # Thư mục lưu file upload
│   └── tools/                  # Scripts tiện ích
│       ├── init_db.php         # Khởi tạo / reset database
│       ├── seed.php            # Dữ liệu mẫu cơ bản
│       └── seed_more_properties.php  # Thêm nhiều BĐS mẫu
│
├── src/                        # Frontend React + TypeScript
│   ├── App.tsx                 # Root component, routing
│   ├── types.ts                # TypeScript types
│   ├── services/
│   │   └── api.ts              # Toàn bộ API calls
│   └── components/
│       ├── shared/             # Navbar, AIChatbot, KYC, UI primitives
│       ├── property/           # PropertyCard, Detail, Search, Stepper...
│       ├── dashboards/         # Admin, Agent, User, Market dashboards
│       └── pages/              # Messenger, Pricing, About, Contact, Search
│
├── database/
│   └── smartre.sql             # Schema SQL backup
│
├── uploads/                    # Upload từ frontend (nếu có)
├── dist/                       # Build output (tự động sinh, không commit)
├── index.html                  # Entry point Vite
├── vite.config.ts              # Vite config
├── tsconfig.json               # TypeScript config
├── package.json                # Node dependencies
├── composer.json               # PHP dependencies (vlucas/phpdotenv)
├── .env                        # Biến môi trường (không commit)
├── .env.example                # Template env (commit)
├── .htaccess                   # Apache rewrite rules
└── QUICK_START.md              # File này
```

---

## ⚡ Cài đặt nhanh (XAMPP)

### Yêu cầu
- XAMPP (PHP 8.1+, MySQL 8.0+, Apache)
- Node.js 18+
- Composer

### 1. Chuẩn bị môi trường

```bash
# Sao chép file .env
cp .env.example .env
# Chỉnh sửa .env theo cấu hình XAMPP của bạn
```

Nội dung `.env` cần điều chỉnh:
```env
DB_HOST=localhost
DB_USER=root
DB_PASS=           # Mật khẩu MySQL, thường trống trong XAMPP
DB_NAME=smartre_db
APP_URL=http://localhost/smart-real-estate-management-system
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. Cài đặt PHP dependencies

```bash
composer install
```

### 3. Khởi tạo database

Truy cập trình duyệt:
```
http://localhost/smart-real-estate-management-system/api/tools/init_db.php
```

### 4. Seed dữ liệu mẫu

```
http://localhost/smart-real-estate-management-system/api/tools/seed.php
http://localhost/smart-real-estate-management-system/api/tools/seed_more_properties.php
```

### 5. Cài đặt & chạy frontend

```bash
npm install
npm run dev
```

Frontend chạy tại: **http://localhost:3000**

---

## 🔑 Tài khoản demo

| Role | Email | Mật khẩu |
|---|---|---|
| Admin | admin@smartre.vn | admin123 |
| Người dùng | user@smartre.vn | user123 |
| Môi giới | agent@smartre.vn | agent123 |

---

## 🛠️ Scripts hữu ích

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Chạy dev server (Vite HMR) |
| `npm run build` | Build production ra `dist/` |
| `npm run preview` | Preview bản build |
| `composer install` | Cài PHP dependencies |

---

## 🌐 API Endpoints chính

| Endpoint | Chức năng |
|---|---|
| `POST /api/auth/auth.php?action=login` | Đăng nhập |
| `GET /api/properties/properties.php` | Danh sách BĐS |
| `GET /api/properties/properties.php?id=1` | Chi tiết BĐS |
| `GET /api/messages/messages.php?action=conversations` | Tin nhắn |
| `GET /api/notifications/notifications.php` | Thông báo |
| `GET /api/health.php` | Kiểm tra kết nối |

---

## ⚙️ Biến môi trường

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `DB_HOST` | MySQL host | ✅ |
| `DB_USER` | MySQL username | ✅ |
| `DB_PASS` | MySQL password | ✅ |
| `DB_NAME` | Tên database | ✅ |
| `APP_URL` | URL ứng dụng | ✅ |
| `CORS_ORIGINS` | Domains được phép CORS | ✅ |
| `SMTP_HOST` | SMTP server (gửi email OTP) | ⚠️ |
| `SMTP_USER` | Email gửi | ⚠️ |
| `SMTP_PASS` | Mật khẩu email (App Password) | ⚠️ |
| `GROQ_API_KEY` | API key Groq AI | ⚠️ |

---

## 🔒 Bảo mật

- [ ] Đổi mật khẩu database mặc định
- [ ] Cấu hình `CORS_ORIGINS` đúng domain
- [ ] Thiết lập SMTP credentials
- [ ] Đặt `APP_ENV=production` khi deploy
- [ ] Không commit file `.env` vào git
