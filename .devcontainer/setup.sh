#!/bin/bash
set -e

echo "============================================="
echo "  SmartRE - GitHub Codespaces Setup"
echo "============================================="

cd /var/www/html/smart-real-estate-management-system

# ── 1. Install PHP dependencies ─────────────────────────────
echo "📦 Installing PHP dependencies (Composer)..."
composer install --no-interaction --prefer-dist 2>/dev/null || echo "⚠️  Composer install skipped (no lock file or error)"

# ── 2. Install Node dependencies ─────────────────────────────
echo "📦 Installing Node.js dependencies..."
npm install

# ── 3. Create .env if missing ────────────────────────────────
if [ ! -f .env ]; then
  echo "📝 Creating .env from Codespaces environment..."
  cat > .env << 'ENVEOF'
# Auto-generated for GitHub Codespaces
NODE_ENV=development
APP_URL=http://localhost:8080
APP_ENV=development
DEBUG=true

# Database (matches docker-compose.yml)
DB_HOST=db
DB_PORT=3306
DB_USER=root
DB_PASS=smartre_root
DB_NAME=smartre_db

# CORS - Codespaces domains are auto-added by config.php
CORS_ORIGINS=http://localhost:3000,http://localhost:8080

# Gemini API Key (set your own)
GEMINI_API_KEY=

# SMTP (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM_NAME=Smart Real Estate
ENVEOF
  echo "✅ .env created"
fi

# ── 4. Import database ──────────────────────────────────────
echo "🗄️  Importing database schema + seed data..."
# Wait for MariaDB to be fully ready
for i in {1..30}; do
  if mysql -h db -u root -psmarte_root -e "SELECT 1" &>/dev/null 2>&1; then
    break
  fi
  # Try without typo
  if mysql -h db -u root -psmartne_root -e "SELECT 1" &>/dev/null 2>&1; then
    break
  fi
  sleep 1
done

# Use PHP to import since mysql client might not be installed
php -r "
  try {
    \$pdo = new PDO('mysql:host=db;charset=utf8mb4', 'root', 'smartre_root');
    \$pdo->exec('CREATE DATABASE IF NOT EXISTS smartre_db');
    \$pdo->exec('USE smartre_db');
    
    // Check if tables already exist
    \$tables = \$pdo->query(\"SHOW TABLES\")->fetchAll();
    if (count(\$tables) > 0) {
      echo \"Database already has tables, skipping import.\n\";
      exit(0);
    }
    
    \$sql = file_get_contents('/var/www/html/smart-real-estate-management-system/database/smartre.sql');
    \$pdo->exec(\$sql);
    echo \"Database imported successfully!\n\";
  } catch (Exception \$e) {
    echo \"DB import error: \" . \$e->getMessage() . \"\n\";
  }
"

# ── 5. Set upload directory permissions ──────────────────────
echo "📂 Setting upload directory permissions..."
mkdir -p uploads/properties uploads/users uploads/kyc
chmod -R 777 uploads/

# ── 6. Restart Apache to pick up new config ──────────────────
echo "🔄 Restarting Apache..."
service apache2 restart 2>/dev/null || true

echo ""
echo "============================================="
echo "  ✅ Setup Complete!"
echo "============================================="
echo ""
echo "  🌐 Frontend (Vite):  Run 'npm run dev' → port 3000"
echo "  🔌 Backend (PHP):    http://localhost:8080"
echo "  🗄️  Database:        db:3306 (root / smartre_root)"
echo ""
echo "  📌 Demo accounts:"
echo "     Admin:  admin@smartre.vn / 123456"
echo "     User:   user@smartre.vn  / 123456"
echo "     Agent:  agent@smartre.vn / 123456"
echo ""
