#!/usr/bin/env bash
# ==============================================================================
# ☀️ VIỆC HÔM NAY - SCRIPT CHẠY DOCKER VỚI TÊN MIỀN & SSL TỰ ĐỘNG
# ==============================================================================
# Hỗ trợ: Ubuntu 24.04 LTS / Ubuntu 22.04 LTS / Debian
# Mặc định tên miền: viechomnay.systems.vn
# ==============================================================================

set -e

DOMAIN="${1:-viechomnay.systems.vn}"

# Màu sắc console
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[LỖI] Vui lòng chạy script với quyền root: sudo bash $0${NC}"
  exit 1
fi

clear
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo -e "${GREEN}${BOLD}      ☀️  TRIỂN KHAI VIỆC HÔM NAY QUA DOCKER (AUTO SSL HTTPS)        ${NC}"
echo -e "${CYAN}   Tên miền cấu hình: ${BOLD}${DOMAIN}${NC}"
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo ""

# 1. Kiểm tra và cài đặt Docker + Docker Compose nếu chưa có
echo -e "${CYAN}[1/5] Kiểm tra Docker Engine và Docker Compose...${NC}"
if ! command -v docker >/dev/null 2>&1; then
  echo -e "${YELLOW}Chưa có Docker. Đang cài đặt Docker cho Ubuntu 24.04...${NC}"
  apt-get update -y
  apt-get install -y docker.io docker-compose-v2
  systemctl enable --now docker
  echo -e "${GREEN}[✓] Cài đặt Docker thành công!${NC}"
else
  echo -e "${GREEN}[✓] Docker đã sẵn sàng ($(docker -v))${NC}"
fi

# 2. Xử lý xung đột cổng 80 & 443 nếu có Nginx/Apache đang chạy trên host
echo -e "${CYAN}[2/5] Kiểm tra cổng 80 và 443 trên hệ thống...${NC}"
if systemctl is-active --quiet nginx 2>/dev/null; then
  echo -e "${YELLOW}Phát hiện Nginx trên host đang chạy. Đang tạm dừng để nhường cổng cho Docker Caddy...${NC}"
  systemctl stop nginx
  systemctl disable nginx
fi

if systemctl is-active --quiet apache2 2>/dev/null; then
  echo -e "${YELLOW}Phát hiện Apache trên host đang chạy. Đang tạm dừng...${NC}"
  systemctl stop apache2
  systemctl disable apache2
fi

# 3. Cập nhật tên miền vào file Caddyfile
echo -e "${CYAN}[3/5] Cập nhật cấu hình tên miền vào Caddyfile...${NC}"
cat <<EOF > Caddyfile
# ==============================================================================
# Cấu hình Caddy Reverse Proxy & Tự Động Cấp Chứng Chỉ SSL (HTTPS)
# ==============================================================================

${DOMAIN} {
    # Chuyển tiếp request sang container Việc Hôm Nay Web App
    reverse_proxy viechomnay-web:80

    # Header bảo mật tối ưu
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Bật nén Gzip / Zstandard
    encode zstd gzip
}
EOF
echo -e "${GREEN}[✓] Đã gán tên miền ${DOMAIN} vào Caddyfile!${NC}"

# 4. Mở tường lửa
echo -e "${CYAN}[4/5] Cấu hình mở cổng tường lửa UFW (80, 443)...${NC}"
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp >/dev/null 2>&1 || true
  ufw allow 443/tcp >/dev/null 2>&1 || true
  ufw allow 22/tcp >/dev/null 2>&1 || true
  ufw --force enable >/dev/null 2>&1 || true
fi

# 5. Build và khởi chạy Docker Compose
echo -e "${CYAN}[5/5] Đang build và khởi chạy container (docker compose up -d)...${NC}"
echo -e "${YELLOW}Quá trình build Angular PWA và Nginx Alpine có thể mất 1 - 2 phút...${NC}"

docker compose -f docker-compose.prod.yml down --remove-orphans >/dev/null 2>&1 || true
docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo -e "${GREEN}${BOLD}        🎉 TRIỂN KHAI DOCKER THÀNH CÔNG CHO ${DOMAIN}! 🎉         ${NC}"
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
echo ""
echo -e "🌐 ${BOLD}Truy cập ngay trên trình duyệt:${NC}"
echo -e "   👉 ${CYAN}https://${DOMAIN}${NC}"
echo ""
echo -e "⚠️  ${YELLOW}${BOLD}LƯU Ý QUAN TRỌNG VỀ TÊN MIỀN & CHỨNG CHỈ SSL:${NC}"
echo -e "   1. Bạn phải trỏ bản ghi ${BOLD}A${NC} của tên miền ${BOLD}${DOMAIN}${NC} về địa chỉ IP của VPS này."
echo -e "   2. Caddy sẽ ${BOLD}tự động xin cấp SSL Let's Encrypt ngay trong lần truy cập đầu tiên${NC}."
echo -e "   3. Chứng chỉ SSL sẽ được tự động gia hạn vĩnh viễn, không cần can thiệp thủ công."
echo ""
echo -e "📌 ${BOLD}Các lệnh quản lý Docker:${NC}"
echo -e "   • Xem trạng thái container : ${YELLOW}sudo docker compose -f docker-compose.prod.yml ps${NC}"
echo -e "   • Xem log cấp chứng chỉ SSL : ${YELLOW}sudo docker logs -f viechomnay-ssl-proxy${NC}"
echo -e "   • Xem log Web App          : ${YELLOW}sudo docker logs -f viechomnay-web${NC}"
echo -e "   • Khởi động lại            : ${YELLOW}sudo docker compose -f docker-compose.prod.yml restart${NC}"
echo -e "   • Tạm dừng                 : ${YELLOW}sudo docker compose -f docker-compose.prod.yml down${NC}"
echo ""
echo -e "${GREEN}${BOLD}=====================================================================${NC}"
