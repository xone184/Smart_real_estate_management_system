#!/bin/bash
set -e

echo "============================================="
echo "  SmartRE - GitHub Codespaces Setup"
echo "============================================="

cd /workspaces/Smart_real_estate_management_system

# ── 0. Fix broken Yarn APT repo (causes apt-get update to fail) ──────────
echo "🔧 Fixing broken Yarn repository..."
sudo rm -f /etc/apt/sources.list.d/yarn.list
sudo rm -f /etc/apt/sources.list.d/yarn.list.save
echo "  ✅ Yarn repo removed"

# ── 1. Install MySQL (not included in universal image) ────────────────────
echo "🗄️  Installing MySQL..."
sudo apt-get update -qq
sudo apt-get install -y -qq mysql-server 2>/dev/null || echo "⚠️  MySQL install skipped"

# ── 2. Install PHP dependencies (composer) ────────────────────────────────
echo "📦 Installing PHP dependencies..."
# PHP is already available in the universal image at /home/codespace/.php/current/bin
which php && echo "  PHP: $(php -v | head -1)" || echo "  ⚠️  PHP not found"
composer install --no-interaction --prefer-dist 2>/dev/null || echo "  ⚠️  Composer install skipped"

# ── 3. Install Node.js dependencies ───────────────────────────────────────
echo "📦 Installing Node.js dependencies..."
# Node.js is already in the universal image via nvm
which node && echo "  Node: $(node -v) | npm: $(npm -v)" || echo "  ⚠️  Node not found"
npm install

# ── 4. Create .env ────────────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "📝 Creating .env..."
  cat > .env << 'ENVEOF'
NODE_ENV=development
APP_URL=http://localhost:8080
APP_ENV=development
DEBUG=true
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=smartre_db
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
GEMINI_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=Smart Real Estate
ENVEOF
  echo "  ✅ .env created"
fi

# ── 5. Setup MySQL ─────────────────────────────────────────────────────────
echo "🗄️  Setting up MySQL..."

# Start MySQL
sudo service mysql start 2>/dev/null || true
sleep 3

# Wait for MySQL to be ready
for i in {1..15}; do
  if sudo mysql -u root -e "SELECT 1" &>/dev/null 2>&1; then
    echo "  ✅ MySQL is ready!"
    break
  fi
  echo "  Waiting for MySQL... ($i/15)"
  sleep 2
done

# Create database
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

# Allow root login without password (for development)
sudo mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;" 2>/dev/null || true

# Import schema if empty
TABLE_COUNT=$(mysql -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='smartre_db';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
  echo "  Importing database schema..."
  mysql -u root smartre_db < database/smartre.sql 2>/dev/null && echo "  ✅ Database imported!" || echo "  ⚠️  Import had warnings"
else
  echo "  Database already has $TABLE_COUNT tables, skipping."
fi

# ── 6. Set permissions ────────────────────────────────────────────────────
mkdir -p uploads/properties uploads/users uploads/kyc
chmod -R 777 uploads/

# ── 7. Start PHP server in background ─────────────────────────────────────
echo "🚀 Starting PHP server on port 8080..."
nohup php -S 0.0.0.0:8080 -t /workspaces/Smart_real_estate_management_system > /tmp/php-server.log 2>&1 &
echo "  PHP server PID: $!"

echo ""
echo "============================================="
echo "  ✅ Setup Complete!"
echo "============================================="
echo ""
echo "  🌐 Frontend:  Run 'npm run dev'"
echo "  🔌 PHP API:   Running on port 8080"
echo ""
echo "  📌 Demo accounts:"
echo "     Admin:  admin@smartre.vn / 123456"
echo "     User:   user@smartre.vn  / 123456"
echo "     Agent:  agent@smartre.vn / 123456"
echo ""
