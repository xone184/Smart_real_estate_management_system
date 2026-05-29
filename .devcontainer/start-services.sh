#!/bin/bash
# =============================================
# SmartRE - Start Services (runs on every Codespace start)
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

# ── 1. Start MySQL ─────────────────────────────────────────────────────────
echo "🗄️  Starting MySQL..."
sudo service mysql start 2>/dev/null || true
sleep 2

# Fix socket permissions
sudo chmod 777 /var/run/mysqld 2>/dev/null || true
sudo chmod 777 /var/run/mysqld/mysqld.sock 2>/dev/null || true

# Wait for MySQL to be ready
for i in {1..10}; do
  if sudo mysql -u root -e "SELECT 1" &>/dev/null 2>&1; then
    echo "  ✅ MySQL is ready"
    break
  fi
  echo "  Waiting for MySQL... ($i/10)"
  sleep 1
done

# Ensure database exists and has tables
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true
sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;" 2>/dev/null || true

TABLE_COUNT=$(mysql -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='smartre_db';" 2>/dev/null || echo "0")
if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
  echo "  📦 Importing database schema..."
  mysql -u root smartre_db < database/smartre.sql 2>/dev/null && echo "  ✅ Schema imported!" || echo "  ⚠️  Schema import had warnings"
else
  echo "  ✅ Database OK ($TABLE_COUNT tables)"
fi

# ── 2. Kill any old PHP server instance ────────────────────────────────────
pkill -f "php -S 0.0.0.0:8080" 2>/dev/null || true
sleep 1

# ── 3. Start PHP server ────────────────────────────────────────────────────
echo "🚀 Starting PHP server on :8080..."
PHP_BIN=$(which php 2>/dev/null || echo "/usr/bin/php")
WORK_DIR=$(pwd)
nohup "$PHP_BIN" -S 0.0.0.0:8080 -t "$WORK_DIR" > /tmp/php-server.log 2>&1 &
PHP_PID=$!
sleep 2

if kill -0 $PHP_PID 2>/dev/null; then
  echo "  ✅ PHP server running (PID $PHP_PID)"
else
  echo "  ❌ PHP server failed! Last log:"
  tail -5 /tmp/php-server.log 2>/dev/null || true
fi

# ── 4. Ensure uploads folder permissions ──────────────────────────────────
mkdir -p uploads/properties uploads/users uploads/kyc
chmod -R 777 uploads/ 2>/dev/null || true

echo ""
echo "✅ Services ready!"
echo "   Run: npm run dev"
echo ""
