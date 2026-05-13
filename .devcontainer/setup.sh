#!/bin/bash
set -e

echo "============================================="
echo "  SmartRE - GitHub Codespaces Setup"
echo "============================================="

cd /workspaces/Smart_real_estate_management_system

# ── 1. Install PHP dependencies ─────────────────────────────
echo "📦 Installing PHP dependencies..."
composer install --no-interaction --prefer-dist 2>/dev/null || echo "⚠️  Composer install skipped"

# ── 2. Install Node dependencies ─────────────────────────────
echo "📦 Installing Node.js dependencies..."
npm install

# ── 3. Create .env ───────────────────────────────────────────
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
  echo "✅ .env created"
fi

# ── 4. Setup MySQL ──────────────────────────────────────────
echo "🗄️  Setting up MySQL..."

# Start MySQL if not running
sudo service mysql start 2>/dev/null || sudo mysqld_safe --skip-grant-tables &
sleep 3

# Wait for MySQL
for i in {1..20}; do
  if mysql -u root -e "SELECT 1" &>/dev/null 2>&1; then
    echo "  MySQL is ready!"
    break
  fi
  echo "  Waiting for MySQL... ($i/20)"
  sleep 2
done

# Create database and import
mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || true

TABLE_COUNT=$(mysql -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='smartre_db';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
  echo "  Importing database..."
  mysql -u root smartre_db < database/smartre.sql 2>/dev/null && echo "  ✅ Database imported!" || echo "  ⚠️  Import had warnings"
else
  echo "  Database already has $TABLE_COUNT tables, skipping."
fi

# ── 5. Set permissions ───────────────────────────────────────
mkdir -p uploads/properties uploads/users uploads/kyc
chmod -R 777 uploads/

# ── 6. Start PHP built-in server in background ───────────────
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
