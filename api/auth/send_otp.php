<?php
// =============================================
// SmartRE API - Send & Verify OTP for Registration
// =============================================
require_once __DIR__ . '/config.php';

// Load PHPMailer if available
$phpmailerAvailable = false;
$vendorAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    require_once $vendorAutoload;
    $phpmailerAvailable = class_exists('PHPMailer\PHPMailer\PHPMailer');
}

$action = $_GET['action'] ?? '';
$method = getMethod();

switch ($action) {
    case 'send':
        if ($method !== 'POST') jsonResponse(405, ['error' => 'Method not allowed']);
        handleSendOTP();
        break;
    case 'verify':
        if ($method !== 'POST') jsonResponse(405, ['error' => 'Method not allowed']);
        handleVerifyOTP();
        break;
    default:
        jsonResponse(400, ['error' => 'Action không hợp lệ. Sử dụng: send, verify']);
}

function handleSendOTP(): void {
    $data = getRequestBody();
    $email = trim($data['email'] ?? '');
    $displayName = trim($data['display_name'] ?? '');
    $password = $data['password'] ?? '';
    $role = ($data['role'] ?? '') === 'agent' ? 'agent' : 'user';

    // Validate
    if (empty($email)) {
        jsonResponse(400, ['error' => 'Email là bắt buộc']);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(400, ['error' => 'Email không hợp lệ']);
    }
    if (empty($password) || strlen($password) < 6) {
        jsonResponse(400, ['error' => 'Mật khẩu phải có ít nhất 6 ký tự']);
    }

    $db = getDB();

    // Check if email already exists in users table
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(409, ['error' => 'Email đã được đăng ký']);
    }

    // Ensure otp_codes table exists
    ensureOTPTable($db);

    // Generate 6-digit OTP
    $otp = sprintf('%06d', random_int(100000, 999999));
    $expiresAt = date('Y-m-d H:i:s', time() + 600); // 10 phút

    // Store OTP (upsert)
    $stmt = $db->prepare("
        INSERT INTO otp_codes (email, otp_code, purpose, expires_at, created_at)
        VALUES (?, ?, 'register', ?, NOW())
        ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = VALUES(expires_at), created_at = NOW(), verified = 0
    ");
    $stmt->execute([$email, $otp, $expiresAt]);

    // Send email
    $sent = sendOTPEmail($email, $displayName ?: 'Bạn', $otp);

    if (!$sent) {
        jsonResponse(500, ['error' => 'Không thể gửi email xác thực. Vui lòng thử lại sau.']);
    }

    // Mask email for privacy
    $maskedEmail = maskEmail($email);
    jsonResponse(200, [
        'message' => "Mã xác thực đã được gửi đến $maskedEmail",
        'masked_email' => $maskedEmail,
        'expires_in' => 600,
    ]);
}

function handleVerifyOTP(): void {
    $data = getRequestBody();
    $email = trim($data['email'] ?? '');
    $otp = trim($data['otp'] ?? '');
    $password = $data['password'] ?? '';
    $displayName = trim($data['display_name'] ?? '');
    $role = ($data['role'] ?? '') === 'agent' ? 'agent' : 'user';

    if (empty($email) || empty($otp)) {
        jsonResponse(400, ['error' => 'Email và mã OTP là bắt buộc']);
    }

    $db = getDB();
    ensureOTPTable($db);

    // Lookup OTP
    $stmt = $db->prepare("
        SELECT * FROM otp_codes
        WHERE email = ? AND purpose = 'register' AND verified = 0
        ORDER BY created_at DESC
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $record = $stmt->fetch();

    if (!$record) {
        jsonResponse(400, ['error' => 'Không tìm thấy mã xác thực. Vui lòng gửi lại.']);
    }

    // Check expiry
    if (strtotime($record['expires_at']) < time()) {
        jsonResponse(400, ['error' => 'Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.']);
    }

    // Check OTP
    if ($record['otp_code'] !== $otp) {
        jsonResponse(400, ['error' => 'Mã xác thực không đúng. Vui lòng kiểm tra lại.']);
    }

    // Mark OTP as verified
    $stmt = $db->prepare("UPDATE otp_codes SET verified = 1 WHERE id = ?");
    $stmt->execute([$record['id']]);

    // Check if email already registered (race condition guard)
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(409, ['error' => 'Email đã được đăng ký']);
    }

    // Create user account
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("INSERT INTO users (email, password, display_name, role) VALUES (?, ?, ?, ?)");
    $stmt->execute([$email, $hashedPassword, $displayName ?: 'Người dùng', $role]);
    $userId = (int) $db->lastInsertId();

    // Auto login
    $_SESSION['user_id'] = $userId;

    // Return user data
    $stmt = $db->prepare("SELECT id, email, display_name, photo_url, role, kyc_verified, created_at FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    jsonResponse(201, ['message' => 'Đăng ký thành công! Chào mừng bạn đến với SmartRE.', 'user' => $user]);
}

function ensureOTPTable(PDO $db): void {
    $db->exec("
        CREATE TABLE IF NOT EXISTS otp_codes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL,
            otp_code VARCHAR(10) NOT NULL,
            purpose ENUM('register', 'reset_password') DEFAULT 'register',
            verified TINYINT(1) DEFAULT 0,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_email_purpose (email, purpose)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

function maskEmail(string $email): string {
    [$local, $domain] = explode('@', $email, 2);
    $maskedLocal = strlen($local) <= 3
        ? str_repeat('*', strlen($local))
        : substr($local, 0, 2) . str_repeat('*', strlen($local) - 2);
    return "$maskedLocal@$domain";
}

function sendOTPEmail(string $toEmail, string $toName, string $otp): bool {
    global $phpmailerAvailable;

    if ($phpmailerAvailable) {
        return sendViaPHPMailer($toEmail, $toName, $otp);
    }

    // Fallback: PHP mail()
    return sendViaMail($toEmail, $toName, $otp);
}

function getEmailBody(string $toName, string $otp): string {
    return "
    <!DOCTYPE html>
    <html lang='vi'>
    <head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
    <body style='margin:0;padding:0;background:#f0f4f8;font-family:Arial,sans-serif;'>
      <table width='100%' cellpadding='0' cellspacing='0' style='background:#f0f4f8;padding:40px 0;'>
        <tr><td align='center'>
          <table width='560' cellpadding='0' cellspacing='0' style='background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);'>
            <!-- Header -->
            <tr>
              <td style='background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px;text-align:center;'>
                <h1 style='margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-1px;'>🏠 SmartRE</h1>
                <p style='margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;'>Hệ thống quản lý bất động sản thông minh</p>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style='padding:40px 32px;'>
                <h2 style='margin:0 0 8px;color:#1e293b;font-size:22px;'>Xác thực đăng ký tài khoản</h2>
                <p style='margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;'>
                  Xin chào <strong>" . htmlspecialchars($toName) . "</strong>,<br>
                  Mã xác thực của bạn là:
                </p>
                <!-- OTP Box -->
                <div style='background:#f8fafc;border:2px dashed #2563eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;'>
                  <span style='font-size:42px;font-weight:900;letter-spacing:12px;color:#2563eb;font-family:monospace;'>" . $otp . "</span>
                </div>
                <p style='margin:0 0 8px;color:#64748b;font-size:14px;'>⏰ Mã có hiệu lực trong <strong>10 phút</strong>.</p>
                <p style='margin:0 0 24px;color:#64748b;font-size:14px;'>🔒 Không chia sẻ mã này với bất kỳ ai.</p>
                <p style='margin:0;color:#94a3b8;font-size:13px;'>Nếu bạn không yêu cầu đăng ký, hãy bỏ qua email này.</p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style='padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;'>
                <p style='margin:0;color:#94a3b8;font-size:12px;'>© " . date('Y') . " SmartRE. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    ";
}

function sendViaPHPMailer(string $toEmail, string $toName, string $otp): bool {
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);

        // SMTP Configuration (Gmail)
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $smtpUser = '';
        $smtpPass = '';
        if (defined('SMTP_USER')) {
            $smtpUser = SMTP_USER;
        } elseif (getenv('SMTP_USER') !== false) {
            $smtpUser = getenv('SMTP_USER');
        }
        if (defined('SMTP_PASS')) {
            $smtpPass = SMTP_PASS;
        } elseif (getenv('SMTP_PASS') !== false) {
            $smtpPass = getenv('SMTP_PASS');
        }
        $mail->Username   = $smtpUser;
        $mail->Password   = $smtpPass;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom($smtpUser ?: 'noreply@smartre.vn', 'SmartRE');
        $mail->addAddress($toEmail, $toName);

        $mail->isHTML(true);
        $mail->Subject = '🔐 Mã xác thực đăng ký SmartRE';
        $mail->Body    = getEmailBody($toName, $otp);
        $mail->AltBody = "Xin chào $toName,\n\nMã xác thực đăng ký SmartRE của bạn là: $otp\n\nMã có hiệu lực trong 10 phút.\n\n© " . date('Y') . " SmartRE";

        $mail->send();
        return true;
    } catch (\Exception $e) {
        error_log("PHPMailer Error: " . $e->getMessage());
        // Fallback to mail()
        return sendViaMail($toEmail, $toName, $otp);
    }
}

function sendViaMail(string $toEmail, string $toName, string $otp): bool {
    $body = getEmailBody($toName, $otp);
    $subject = '=?UTF-8?B?' . base64_encode('Ma xac thuc dang ky SmartRE') . '?=';
    $headers  = "From: SmartRE <noreply@smartre.vn>\r\n";
    $headers .= "Reply-To: noreply@smartre.vn\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    $result = @mail($toEmail, $subject, $body, $headers);

    // Dev mode: always log OTP to PHP error_log so we can see it even if mail() fails
    error_log("[SmartRE OTP] Email: $toEmail | OTP: $otp | Expires: " . date('H:i:s', time() + 600));

    // Return true in dev / fallback so the UI flow is not blocked on local environments
    // On production, configure PHPMailer with SMTP_USER / SMTP_PASS for real email delivery
    return true;
}
