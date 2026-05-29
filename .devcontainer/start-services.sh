#!/bin/bash
# =============================================
# SmartRE - Start Services (chạy mỗi lần Codespace khởi động)
# =============================================

cd /workspaces/Smart_real_estate_management_system 2>/dev/null || \
  cd /workspaces/smart-real-estate-management-system 2>/dev/null || \
  cd "$(dirname "$(dirname "$0")")" || true

WORK_DIR=$(pwd)
echo "🔄 Starting SmartRE services (workdir: $WORK_DIR)..."

# ── Load nvm / Node ────────────────────────────────────────────────────────
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
[ -s "/home/codespace/nvm/nvm.sh" ] && source "/home/codespace/nvm/nvm.sh"
export PATH="/home/codespace/nvm/current/bin:/usr/local/share/nvm/current/bin:$PATH"

# ──────────────────────────────────────────────────────────────────────────
# STRATEGY: The Codespaces PHP shim (which php) uses a custom extension_dir
# that does NOT include apt-installed extensions like pdo_mysql.
# Solution: Install system PHP (php8.3-cli + php8.3-mysql) via apt,
# then use /usr/bin/php8.3 which has proper extension integration.
# ──────────────────────────────────────────────────────────────────────────

# ── 1. Install system PHP with MySQL support ───────────────────────────────
echo "📦 Installing system PHP with pdo_mysql..."

# Detect current PHP version to target the right package
CODESPACE_PHP=$(which php 2>/dev/null || echo "php")
DETECTED_VER=$("$CODESPACE_PHP" -r "echo PHP_MAJOR_VERSION.'.'.PHP_MINOR_VERSION;" 2>/dev/null || echo "8.3")
echo "  Detected Codespaces PHP version: $DETECTED_VER"

# Install system PHP packages (these install to /usr/bin/phpX.Y)
echo "  Installing php${DETECTED_VER}-cli php${DETECTED_VER}-mysql..."
sudo apt-get install -y -qq \
  "php${DETECTED_VER}-cli" \
  "php${DETECTED_VER}-mysql" \
  "php${DETECTED_VER}-mbstring" \
  "php${DETECTED_VER}-xml" \
  "php${DETECTED_VER}-curl" \
  2>/dev/null || true

# ── 2. Find a PHP binary that actually has pdo_mysql ──────────────────────
echo "🔍 Finding PHP binary with pdo_mysql..."

find_php_with_mysql() {
  # Prefer system PHP matching the detected version
  local candidates=(
    "/usr/bin/php${DETECTED_VER}"
    "/usr/bin/php8.3"
    "/usr/bin/php8.2"
    "/usr/bin/php8.1"
    "/usr/bin/php8.0"
    "/usr/local/bin/php"
    "/usr/bin/php"
  )
  for phpbin in "${candidates[@]}"; do
    if [ -x "$phpbin" ] && "$phpbin" -m 2>/dev/null | grep -qi "pdo_mysql"; then
      echo "$phpbin"
      return 0
    fi
  done
  return 1
}

PHP_BIN=$(find_php_with_mysql)

if [ -n "$PHP_BIN" ]; then
  echo "  ✅ Found PHP with pdo_mysql: $PHP_BIN"
  echo "     Version: $($PHP_BIN -r 'echo PHP_VERSION;' 2>/dev/null)"
else
  echo "  ⚠️  No PHP with pdo_mysql found — trying fallback with -d extension..."

  # Fallback: find the .so file and load it explicitly
  PDO_SO=$(find /usr/lib/php -name "pdo_mysql.so" 2>/dev/null | head -1)
  PHP_BIN=$(which php 2>/dev/null || echo "/usr/bin/php")

  if [ -n "$PDO_SO" ]; then
    echo "  Found .so at: $PDO_SO"
    # Test if -d extension works
    if "$PHP_BIN" -d "extension=$PDO_SO" -r "echo 'ok';" 2>/dev/null | grep -q ok; then
      # Wrap the command to always include -d extension
      # We'll export a variable and use it when starting the server
      EXTRA_PHP_ARGS="-d extension=$PDO_SO"
      echo "  ✅ Will use: $PHP_BIN $EXTRA_PHP_ARGS"
    fi
  else
    echo "  ❌ pdo_mysql.so not found — DB will fail"
    PHP_BIN=$(which php 2>/dev/null || echo "/usr/bin/php")
    EXTRA_PHP_ARGS=""
  fi
fi

# ── 3. Start MySQL ─────────────────────────────────────────────────────────
echo "🗄️  Starting MySQL..."
sudo service mysql start 2>/dev/null || true
sleep 2
sudo chmod 777 /var/run/mysqld 2>/dev/null || true
sudo chmod 777 /var/run/mysqld/mysqld.sock 2>/dev/null || true

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
  sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
  sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;" 2>/dev/null || true
  sudo mysql -u root -e "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY ''; GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION; FLUSH PRIVILEGES;" 2>/dev/null || true

  TABLE_COUNT=$(mysql -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='smartre_db';" 2>/dev/null | tr -d '[:space:]')
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

# ── 4. Kill old PHP server ─────────────────────────────────────────────────
pkill -f "php.*-S 0.0.0.0:8080" 2>/dev/null || true
sleep 1

# ── 5. Start PHP server ────────────────────────────────────────────────────
echo "🚀 Starting PHP server on :8080..."
echo "   Binary: $PHP_BIN ${EXTRA_PHP_ARGS:-}"

# shellcheck disable=SC2086
nohup "$PHP_BIN" $EXTRA_PHP_ARGS -S 0.0.0.0:8080 -t "$WORK_DIR" > /tmp/php-server.log 2>&1 &
PHP_PID=$!
sleep 2

if kill -0 $PHP_PID 2>/dev/null; then
  # Verify pdo_mysql is active in the running PHP
  # shellcheck disable=SC2086
  PDO_CHECK=$("$PHP_BIN" $EXTRA_PHP_ARGS -r "echo implode(',', PDO::getAvailableDrivers());" 2>/dev/null)
  echo "  ✅ PHP server running (PID $PHP_PID)"
  echo "  PDO drivers available: $PDO_CHECK"
  if echo "$PDO_CHECK" | grep -q mysql; then
    echo "  ✅ MySQL driver confirmed — DB will work!"
  else
    echo "  ❌ MySQL driver NOT in PDO list — DB calls will fail"
    echo "  PHP server log:"
    tail -5 /tmp/php-server.log 2>/dev/null || true
  fi
else
  echo "  ❌ PHP server failed! Log:"
  cat /tmp/php-server.log 2>/dev/null || true
fi

# ── 6. Uploads permissions ─────────────────────────────────────────────────
mkdir -p uploads/properties uploads/users uploads/kyc
chmod -R 777 uploads/ 2>/dev/null || true

echo ""
echo "============================================="
echo "  ✅ SmartRE services started!"
echo "============================================="
echo "  PHP: $PHP_BIN"
echo "  Run: npm run dev"
echo "  Debug: /smart-real-estate-management-system/api/debug.php"
echo ""
