#!/bin/bash
set -e

echo "============================================="
echo "  SmartRE - GitHub Codespaces Setup"
echo "============================================="

# ── 1. Install PHP dependencies ─────────────────────────────
echo "📦 Installing PHP dependencies (Composer)..."
cd /workspaces/Smart_real_estate_management_system
composer install --no-interaction --prefer-dist 2>/dev/null || echo "⚠️  Composer install had warnings"

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

# ── 4. Setup Apache ─────────────────────────────────────────
echo "🔧 Configuring Apache..."
# Create symlink so Apache serves the project at the right path
sudo mkdir -p /var/www/html/smart-real-estate-management-system
sudo rm -rf /var/www/html/smart-real-estate-management-system
sudo ln -sf /workspaces/Smart_real_estate_management_system /var/www/html/smart-real-estate-management-system

# Enable Apache rewrite module
sudo a2enmod rewrite 2>/dev/null || true

# Configure Apache to allow .htaccess
sudo tee /etc/apache2/conf-available/override.conf > /dev/null << 'APACHECONF'
<Directory /var/www/html>
    AllowOverride All
    Require all granted
</Directory>
APACHECONF
sudo a2enconf override 2>/dev/null || true

# Change Apache port to 8080
sudo sed -i 's/Listen 80/Listen 8080/' /etc/apache2/ports.conf 2>/dev/null || true
sudo sed -i 's/:80/:8080/' /etc/apache2/sites-enabled/000-default.conf 2>/dev/null || true

# Restart Apache
sudo service apache2 restart 2>/dev/null || true

# ── 5. Import database ──────────────────────────────────────
echo "🗄️  Setting up database..."

# Wait for MySQL to be ready
for i in {1..30}; do
  if mysql -u root -e "SELECT 1" &>/dev/null; then
    break
  fi
  echo "  Waiting for MySQL... ($i/30)"
  sleep 2
done

mysql -u root -e "CREATE DATABASE IF NOT EXISTS smartre_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

# Check if tables exist
TABLE_COUNT=$(mysql -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='smartre_db';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" = "0" ] || [ -z "$TABLE_COUNT" ]; then
  echo "  Importing smartre.sql..."
  mysql -u root smartre_db < database/smartre.sql 2>/dev/null && echo "  ✅ Database imported!" || echo "  ⚠️  DB import had warnings"
else
  echo "  Database already has $TABLE_COUNT tables, skipping import."
fi

# ── 6. Set permissions ───────────────────────────────────────
echo "📂 Setting upload directory permissions..."
mkdir -p uploads/properties uploads/users uploads/kyc
chmod -R 777 uploads/

echo ""
echo "============================================="
echo "  ✅ Setup Complete!"
echo "============================================="
echo ""
echo "  🌐 Frontend:  Run 'npm run dev' → port 3000"
echo "  🔌 Backend:   Apache on port 8080"
echo ""
echo "  📌 Demo accounts:"
echo "     Admin:  admin@smartre.vn / 123456"
echo "     User:   user@smartre.vn  / 123456"
echo "     Agent:  agent@smartre.vn / 123456"
echo ""
