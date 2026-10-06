#!/usr/bin/env bash
# ==============================================================================
# ☀️ VIỆC HÔM NAY - SCRIPT CÀI ĐẶT WEBAPP TỰ ĐỘNG TRÊN UBUNTU SERVER 24.04 LTS
# ==============================================================================
# Hỗ trợ: Ubuntu Server 24.04 LTS (Noble Numbat) / Ubuntu 22.04 LTS
# Chức năng:
#   1. Kiểm tra RAM & tự động tạo Swap (tránh lỗi OOM khi build Angular)
#   2. Cài đặt Node.js 22 LTS, Nginx, Git, UFW, Certbot
#   3. Tải/build mã nguồn Việc Hôm Nay (PWA Web)
#   4. Cấu hình Nginx tối ưu SPA/PWA (Gzip, Cache, Security Headers, SPA Routing)
#   5. Mở tường lửa UFW (80, 443, 22)
#   6. Hỗ trợ kích hoạt SSL miễn phí Let's Encrypt (Certbot)
#   7. Tạo lệnh cập nhật 1-chạm: `update-viechomnay`
# ==============================================================================

set -e

# Màu sắc hiển thị
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log_info() { echo -e "${CYAN}[THÔNG TIN]${NC} $1"; }
log_success() { echo -e "${GREEN}[THÀNH CÔNG]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[CẢNH BÁO]${NC} $1"; }
log_error() { echo -e "${RED}[LỖI]${NC} $1"; }

# Kiểm tra quyền root
if [ "$EUID" -ne 0 ]; then
  log_error "Vui lòng chạy script này với quyền root: sudo bash $0"
  exit 1
fi

clear
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo -e "${GREEN}${BOLD}        ☀️  CÀI ĐẶT VIỆC HÔM NAY WEBAPP - UBUNTU SERVER 24.04         ${NC}"
echo -e "${CYAN}      Ứng dụng quản lý công việc cá nhân tối ưu cho người Việt      ${NC}"
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo ""

# Thư mục triển khai
APP_NAME="viechomnay"
SOURCE_DIR="/opt/viechomnay-source"
WEB_ROOT="/var/www/viechomnay/html"
GIT_REPO="https://github.com/nhanhd2702/viechomnay.git"
GIT_BRANCH="main"

# ==============================================================================
# BƯỚC 1: KIỂM TRA RAM VÀ TỰ ĐỘNG THIẾT LẬP SWAP FILE
# ==============================================================================
log_info "Bước 1/6: Kiểm tra tài nguyên RAM và bộ nhớ ảo (Swap)..."

TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_RAM_MB=$((TOTAL_RAM_KB / 1024))
CURRENT_SWAP_KB=$(grep SwapTotal /proc/meminfo | awk '{print $2}')
CURRENT_SWAP_MB=$((CURRENT_SWAP_KB / 1024))

log_info "RAM vật lý: ${TOTAL_RAM_MB}MB | Swap hiện tại: ${CURRENT_SWAP_MB}MB"

# Nếu RAM < 3500MB và Swap < 1500MB thì tự tạo 2GB Swap để build Angular an toàn
if [ "$TOTAL_RAM_MB" -lt 3500 ] && [ "$CURRENT_SWAP_MB" -lt 1500 ]; then
  log_warn "VPS có RAM dưới 3.5GB. Đang tự động tạo 2GB Swapfile để tránh tràn RAM khi biên dịch..."
  if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=progress
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
      echo '/swapfile none swap sw 0 0' >> /etc/fstab
    fi
    log_success "Đã kích hoạt 2GB Swapfile thành công!"
  else
    swapon /swapfile 2>/dev/null || true
  fi
else
  log_success "Tài nguyên RAM đủ đáp ứng quá trình biên dịch."
fi

# ==============================================================================
# BƯỚC 2: CẬP NHẬT HỆ ĐIỀU HÀNH & CÀI ĐẶT CÁC GÓI CẦN THIẾT
# ==============================================================================
log_info "Bước 2/6: Cập nhật hệ thống và cài đặt phụ thuộc (Nginx, Git, Curl, UFW)..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl git ufw nginx certbot python3-certbot-nginx build-essential ca-certificates gnupg

# Cài đặt Node.js 22 LTS chính thức từ NodeSource
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  log_info "Đang cài đặt Node.js 22 LTS từ kho chính thức NodeSource..."
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
  apt-get update -y
  apt-get install -y nodejs
fi

NODE_VER=$(node -v)
NPM_VER=$(npm -v)
log_success "Node.js: ${NODE_VER} | npm: ${NPM_VER}"

# ==============================================================================
# BƯỚC 3: TẢI HOẶC CẬP NHẬT MÃ NGUỒN VIỆC HÔM NAY
# ==============================================================================
log_info "Bước 3/6: Chuẩn bị mã nguồn Việc Hôm Nay..."

# Nếu script đang được chạy bên trong thư mục repo Việc Hôm Nay đã có sẵn
CURRENT_DIR="$(pwd)"
if [ -f "$CURRENT_DIR/package.json" ] && grep -q "viec-hom-nay" "$CURRENT_DIR/package.json" 2>/dev/null; then
  log_info "Đang sử dụng thư mục hiện tại: $CURRENT_DIR"
  SOURCE_DIR="$CURRENT_DIR"
else
  if [ -d "$SOURCE_DIR/.git" ]; then
    log_info "Cập nhật mã nguồn mới nhất từ GitHub..."
    cd "$SOURCE_DIR"
    git checkout $GIT_BRANCH
    git pull origin $GIT_BRANCH
  else
    log_info "Đang clone mã nguồn từ $GIT_REPO..."
    rm -rf "$SOURCE_DIR"
    git clone -b $GIT_BRANCH "$GIT_REPO" "$SOURCE_DIR"
  fi
  cd "$SOURCE_DIR"
fi

# ==============================================================================
# BƯỚC 4: BIÊN DỊCH BẢN WEB PRODUCTION (PWA)
# ==============================================================================
log_info "Bước 4/6: Cài đặt thư viện npm và biên dịch bản Web..."
cd "$SOURCE_DIR"

# Tăng giới hạn bộ nhớ cho Node.js khi build
export NODE_OPTIONS="--max-old-space-size=2048"

log_info "Đang chạy npm install (quá trình này mất khoảng 1-2 phút)..."
npm install --legacy-peer-deps

log_info "Đang biên dịch bản Web (npm run buildFrontend:prodWeb)..."
npm run buildFrontend:prodWeb

if [ ! -d "$SOURCE_DIR/dist/browser" ]; then
  log_error "Không tìm thấy thư mục dist/browser sau khi build. Vui lòng kiểm tra log lỗi!"
  exit 1
fi

# Copy file tĩnh vào thư mục web root của Nginx
log_info "Đang triển khai file tĩnh sang $WEB_ROOT..."
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r "$SOURCE_DIR/dist/browser/"* "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"
log_success "Đã sao chép toàn bộ Web App sang $WEB_ROOT!"

# ==============================================================================
# BƯỚC 5: CẤU HÌNH NGINX & TƯỜNG LỬA UFW
# ==============================================================================
log_info "Bước 5/6: Cấu hình Nginx tối ưu cho SPA / PWA..."

NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"

cat <<'EOF' > "$NGINX_CONF"
server {
    listen 80 default_server;
    listen [::]:80 default_server;

    # Thay đổi server_name thành tên miền của bạn nếu có (VD: viechomnay.vn)
    server_name _;

    root /var/www/viechomnay/html;
    index index.html;

    # Tối ưu nén Gzip cho các file web
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/x-javascript
        application/xml
        image/svg+xml;

    # Header bảo mật cơ bản
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cấu hình cache cho assets tĩnh có mã hash (1 năm)
    location ~* \.(?:css|js|woff2|woff|ttf|svg|png|jpg|jpeg|gif|ico|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Không cache file index.html và service worker để luôn nhận bản cập nhật mới
    location ~* (index\.html|ngsw\.json|ngsw-worker\.js|manifest\.json)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
    }

    # SPA Routing: Chuyển hướng mọi request không khớp file thực tế về index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Chặn truy cập file ẩn (.git, .env...)
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Kích hoạt cấu hình Nginx
ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$APP_NAME"
# Tắt site default nếu còn tồn tại
rm -f /etc/nginx/sites-enabled/default

# Kiểm tra cú pháp Nginx
nginx -t
systemctl restart nginx
systemctl enable nginx
log_success "Nginx đã được cấu hình và khởi động lại thành công!"

# Cấu hình tường lửa UFW
log_info "Kiểm tra và mở các cổng tường lửa (22 SSH, 80 HTTP, 443 HTTPS)..."
ufw allow OpenSSH >/dev/null 2>&1 || ufw allow 22/tcp >/dev/null 2>&1
ufw allow 'Nginx Full' >/dev/null 2>&1 || { ufw allow 80/tcp; ufw allow 443/tcp; }
ufw --force enable >/dev/null 2>&1 || true
log_success "Tường lửa UFW đã được cấu hình mở cổng 80 & 443!"

# ==============================================================================
# BƯỚC 6: TẠO SCRIPT CẬP NHẬT 1-CHẠM (UPDATE SCRIPT)
# ==============================================================================
log_info "Bước 6/6: Tạo tiện ích cập nhật tự động '/usr/local/bin/update-viechomnay'..."

cat <<EOF > /usr/local/bin/update-viechomnay
#!/usr/bin/env bash
set -e
echo "🔄 Đang kiểm tra và cập nhật Việc Hôm Nay từ GitHub..."
cd "$SOURCE_DIR"
git pull origin $GIT_BRANCH
export NODE_OPTIONS="--max-old-space-size=2048"
npm install --legacy-peer-deps
npm run buildFrontend:prodWeb
rm -rf "$WEB_ROOT"/*
cp -r "$SOURCE_DIR/dist/browser/"* "$WEB_ROOT/"
chown -R www-data:www-data "$WEB_ROOT"
systemctl reload nginx
echo "✅ Việc Hôm Nay đã được cập nhật lên phiên bản mới nhất!"
EOF

chmod +x /usr/local/bin/update-viechomnay
log_success "Đã tạo lệnh 'update-viechomnay' thành công!"

# ==============================================================================
# LẤY ĐỊA CHỈ IP MÁY CHỦ VÀ HOÀN TẤT
# ==============================================================================
SERVER_IP=$(curl -s https://ifconfig.me || curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo -e "${GREEN}${BOLD}        🎉 CHÚC MỪNG! CÀI ĐẶT VIỆC HÔM NAY THÀNH CÔNG! 🎉             ${NC}"
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo ""
echo -e "🌐 ${BOLD}Truy cập ngay trên trình duyệt:${NC}"
echo -e "   👉 ${CYAN}http://${SERVER_IP}${NC}"
echo ""
echo -e "📌 ${BOLD}Các lệnh quản trị nhanh:${NC}"
echo -e "   • Cập nhật bản mới nhất từ GitHub : ${YELLOW}sudo update-viechomnay${NC}"
echo -e "   • Kiểm tra trạng thái Nginx        : ${YELLOW}sudo systemctl status nginx${NC}"
echo -e "   • Khởi động lại Nginx              : ${YELLOW}sudo systemctl restart nginx${NC}"
echo -e "   • Thư mục mã nguồn web             : ${CYAN}${WEB_ROOT}${NC}"
echo ""
echo -e "🔒 ${BOLD}Để cấu hình Tên miền riêng & SSL HTTPS miễn phí:${NC}"
echo -e "   1. Trỏ bản ghi A của domain về IP: ${BOLD}${SERVER_IP}${NC}"
echo -e "   2. Sửa dòng server_name trong: ${YELLOW}/etc/nginx/sites-available/viechomnay${NC}"
echo -e "   3. Chạy lệnh cấp chứng chỉ tự động:"
echo -e "      ${GREEN}sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com${NC}"
echo ""
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
