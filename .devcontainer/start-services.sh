#!/bin/bash
# =============================================
# SmartRE - Start Services (chạy mỗi lần Codespace khởi động)
# =============================================

cd /workspaces/Smart_real_estate_management_system 2>/dev/null || \
  cd /workspaces/smart-real-estate-management-system 2>/dev/null || \
  cd "$(dirname "$(dirname "$0")")" || true

echo "🔄 Starting SmartRE services..."

# ── Load nvm / Node ────────────────────────────────────────────────────────
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
[ -s "/home/codespace/nvm/nvm.sh" ] && source "/home/codespace/nvm/nvm.sh"
export PATH="/home/codespace/nvm/current/bin:/usr/local/share/nvm/current/bin:$PATH"

# ── 1. Install pdo_mysql cho đúng PHP version đang dùng ───────────────────
echo "🔧 Ensuring pdo_mysql extension is available..."

# Lấy PHP binary đang được dùng
PHP_BIN=$(which php 2>/dev/null || echo "/usr/bin/php")
PHP_VER=$("$PHP_BIN" -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null || echo "")

if "$PHP_BIN" -m 2>/dev/null | grep -qi "pdo_mysql"; then
  echo "  ✅ pdo_mysql already loaded (PHP $PHP_VER)"
else
  echo "  ⚠️  pdo_mysql NOT found for PHP $PHP_VER — installing..."

  # Thử cài package theo version (php8.3-mysql, php8.2-mysql, v.v.)
  if [ -n "$PHP_VER" ]; then
    sudo apt-get install -y -qq "php${PHP_VER}-mysql" 2>/dev/null && \
      echo "  ✅ php${PHP_VER}-mysql installed" || true
  fi

  # Fallback: cài php-mysql generic
  sudo apt-get install -y -qq php-mysql 2>/dev/null && \
    echo "  ✅ php-mysql (generic) installed" || true

  # Tìm file .so của pdo_mysql trong hệ thống và enable thủ công nếu cần
  PDO_MYSQL_SO=$(find /usr/lib/php -name "pdo_mysql.so" 2>/dev/null | head -1)
  if [ -n "$PDO_MYSQL_SO" ]; then
    EXT_DIR=$("$PHP_BIN" -r "echo ini_get('extension_dir');" 2>/dev/null)
    PHP_CONF_DIR=$(php -r "echo PHP_CONFIG_FILE_SCAN_DIR;" 2>/dev/null || echo "")

    # Copy .so vào extension_dir nếu chưa có
    if [ -n "$EXT_DIR" ] && [ ! -f "$EXT_DIR/pdo_mysql.so" ]; then
      sudo cp "$PDO_MYSQL_SO" "$EXT_DIR/" 2>/dev/null && \
        echo "  ✅ Copied pdo_mysql.so to $EXT_DIR" || true
    fi

    # Tạo config file để load extension
    if [ -n "$PHP_CONF_DIR" ] && [ -d "$PHP_CONF_DIR" ]; then
      echo "extension=pdo_mysql.so" | sudo tee "$PHP_CONF_DIR/20-pdo_mysql.ini" > /dev/null && \
        echo "  ✅ Created pdo_mysql config in $PHP_CONF_DIR" || true
    fi
  fi

  # Kiểm tra lại
  if "$PHP_BIN" -m 2>/dev/null | grep -qi "pdo_mysql"; then
    echo "  ✅ pdo_mysql is now active"
  else
    echo "  ❌ pdo_mysql still not available — DB calls will fail"
    echo "     PDO drivers: $("$PHP_BIN" -r 'print_r(PDO::getAvailableDrivers());' 2>/dev/null)"
  fi
fi

# ── 2. Start MySQL ─────────────────────────────────────────────────────────
echo "🗄️  Starting MySQL..."
sudo service mysql start 2>/dev/null || true
sleep 2

# Fix socket permissions
sudo chmod 777 /var/run/mysqld 2>/dev/null || true
sudo chmod 777 /var/run/mysqld/mysqld.sock 2>/dev/null || true

# Wait for MySQL to be ready
MYSQL_READY=false
for i in {1..12}; do
  if sudo mysql -u root -e "SELECT 1" &>/dev/null 2>&1; then
    echo "  ✅ MySQL is ready"
    MYSQL_READY=true
    break
  fi
  echo "  Waiting for MySQL... ($i/12)"
  sleep 1
done

if [ "$MYSQL_READY" = true ]; then
  # Ensure database exists
  sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
  sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;" 2>/dev/null || true

  # Also allow 127.0.0.1 connections
  sudo mysql -u root -e "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY ''; GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;" 2>/dev/null || true

  TABLE_COUNT=$(mysql -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='smartre_db';" 2>/dev/null || echo "0")
  if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
    echo "  📦 Importing database schema..."
    mysql -u root smartre_db < database/smartre.sql 2>/dev/null && \
      echo "  ✅ Schema imported!" || echo "  ⚠️  Schema import had warnings"
  else
    echo "  ✅ Database OK ($TABLE_COUNT tables)"
  fi
else
  echo "  ❌ MySQL failed to start"
fi

# ── 3. Kill any old PHP server instance ────────────────────────────────────
pkill -f "php.*-S 0.0.0.0:8080" 2>/dev/null || true
sleep 1

# ── 4. Start PHP server ────────────────────────────────────────────────────
echo "🚀 Starting PHP server on :8080..."
WORK_DIR=$(pwd)
nohup "$PHP_BIN" -S 0.0.0.0:8080 -t "$WORK_DIR" > /tmp/php-server.log 2>&1 &
PHP_PID=$!
sleep 2

if kill -0 $PHP_PID 2>/dev/null; then
  echo "  ✅ PHP server running (PID $PHP_PID, binary: $PHP_BIN)"
else
  echo "  ❌ PHP server failed! Log:"
  tail -10 /tmp/php-server.log 2>/dev/null || true
fi

# ── 5. Ensure uploads folder permissions ──────────────────────────────────
mkdir -p uploads/properties uploads/users uploads/kyc
chmod -R 777 uploads/ 2>/dev/null || true

echo ""
echo "✅ Services ready! Run: npm run dev"
echo "   Debug: /smart-real-estate-management-system/api/debug.php"
echo ""
