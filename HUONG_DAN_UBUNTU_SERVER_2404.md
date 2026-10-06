# 📖 HƯỚNG DẪN CÀI ĐẶT & TRIỂN KHAI VIỆC HÔM NAY TRÊN UBUNTU SERVER 24.04 LTS

Tài liệu này hướng dẫn bạn từng bước đưa ứng dụng **Việc Hôm Nay (Web App / PWA)** lên máy chủ ảo (VPS/Cloud Server) chạy hệ điều hành **Ubuntu Server 24.04 LTS** (hoặc 22.04 LTS).

---

## 📋 Mục Lục

1. [Yêu cầu hệ thống VPS](#1-yêu-cầu-hệ-thống-vps)
2. [Cách 1: Cài đặt tự động 1 lệnh bằng Script (Khuyên dùng)](#2-cách-1-cài-đặt-tự-động-1-lệnh-bằng-script-khuyên-dùng)
3. [Cách 2: Triển khai bằng Docker & Docker Compose](#3-cách-2-triển-khai-bằng-docker--docker-compose)
4. [Cấu hình Tên miền riêng & SSL HTTPS miễn phí](#4-cấu-hình-tên-miền-riêng--ssl-https-miễn-phí)
5. [Cập nhật phiên bản mới (1 Lệnh)](#5-cập-nhật-phiên-bản-mới-1-lệnh)
6. [Các lệnh quản trị thường dùng](#6-các-lệnh-quản-trị-thường-dùng)
7. [Xử lý lỗi thường gặp (Troubleshooting)](#7-xử-lý-lỗi-thường-gặp-troubleshooting)

---

## 1. Yêu Cầu Hệ Thống VPS

* **Hệ điều hành**: Ubuntu Server 24.04 LTS (Noble Numbat) hoặc 22.04 LTS.
* **CPU**: Tối thiểu 1 vCPU (khuyến nghị 2 vCPU).
* **RAM**: 
  * Tối thiểu: **1 GB RAM** *(Script cài đặt đã tích hợp sẵn cơ chế tự động tạo **2GB Swapfile** để tránh lỗi tràn bộ nhớ khi build Angular)*.
  * Khuyến nghị: **2 GB RAM** trở lên.
* **Dung lượng ổ cứng (Disk)**: Tối thiểu 10 GB SSD trống.
* **Quyền truy cập**: Quyền `root` hoặc tài khoản có quyền `sudo`.

---

## 2. Cách 1: Cài Đặt Tự Động 1 Lệnh Bằng Script (Khuyên Dùng)

Phương pháp này sẽ cài đặt trực tiếp **Nginx**, **Node.js 22 LTS**, build ứng dụng và cấu hình Nginx tối ưu cho PWA (tự động bật Gzip, cache ảnh/CSS/JS, chống lỗi 404 khi F5).

### Bước 2.1: Kết nối vào VPS qua SSH
Mở Terminal / PowerShell trên máy tính của bạn và gõ:
```bash
ssh root@<IP_MÁY_CHỦ_CỦA_BẠN>
```
*(Thay `<IP_MÁY_CHỦ_CỦA_BẠN>` bằng địa chỉ IP VPS của bạn).*

### Bước 2.2: Chạy lệnh cài đặt 1 dòng
Dán lệnh sau vào terminal VPS và nhấn **Enter**:

```bash
curl -fsSL https://raw.githubusercontent.com/nhanhd2702/viechomnay/main/install-ubuntu-server.sh | sudo bash
```

> **Hoặc nếu bạn đã clone mã nguồn về máy chủ:**
> ```bash
> cd viechomnay
> chmod +x install-ubuntu-server.sh
> sudo ./install-ubuntu-server.sh
> ```

### Quá trình script tự động thực hiện:
1. 🔍 **Kiểm tra RAM**: Tự động kích hoạt 2GB Swap nếu RAM < 3.5GB để bảo vệ VPS.
2. 📦 **Cài đặt môi trường**: Cập nhật hệ thống, cài đặt Git, Nginx, Node.js 22 LTS từ NodeSource.
3. ⚙️ **Biên dịch mã nguồn**: Chạy `npm install` và `npm run buildFrontend:prodWeb`.
4. 🚀 **Triển khai Nginx**: Sao chép web vào `/var/www/viechomnay/html`, cấu hình Gzip, Header bảo mật, SPA Fallback Routing.
5. 🛡️ **Tường lửa UFW**: Mở các cổng 22 (SSH), 80 (HTTP), 443 (HTTPS).
6. 🔄 **Tạo lệnh update**: Tạo sẵn lệnh `sudo update-viechomnay` trong `/usr/local/bin/`.

Sau khi hoàn tất, màn hình sẽ thông báo:
```
=====================================================================
        🎉 CHÚC MỪNG! CÀI ĐẶT VIỆC HÔM NAY THÀNH CÔNG! 🎉             
=====================================================================
🌐 Truy cập ngay trên trình duyệt:
   👉 http://<IP_MÁY_CHỦ_CỦA_BẠN>
```

---

## 3. Cách 2: Triển Khai Bằng Docker & Docker Compose

Nếu bạn thích quản lý ứng dụng qua Docker container:

### Bước 3.1: Cài đặt Docker trên Ubuntu 24.04 (nếu chưa có)
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
```

### Bước 3.2: Tải mã nguồn và khởi chạy container
```bash
git clone https://github.com/nhanhd2702/viechomnay.git
cd viechomnay

# Chạy bằng docker compose ngầm (background)
sudo docker compose -f docker-compose.web.yml up -d --build
```

Web app sẽ tự động chạy tại cổng **80** của VPS.

---

## 4. Cấu Hình Tên Miền Riêng & SSL HTTPS Miễn Phí

Để truy cập web qua tên miền riêng (ví dụ: `viechomnay.vn` hoặc `app.yourdomain.com`) và có ổ khóa xanh HTTPS bảo mật:

### Bước 4.1: Trỏ DNS tên miền về IP máy chủ
Vào trang quản lý tên miền của bạn (Cloudflare, Tenten, PA Việt Nam, v.v.), tạo 2 bản ghi **A**:
* **Host / Tên**: `@` (hoặc `app`) ➔ **Giá trị**: `<IP_VPS>`
* **Host / Tên**: `www` ➔ **Giá trị**: `<IP_VPS>`

### Bước 4.2: Cập nhật cấu hình Nginx
Mở file cấu hình Nginx trên VPS:
```bash
sudo nano /etc/nginx/sites-available/viechomnay
```
Tìm dòng `server_name _;` và sửa thành tên miền của bạn:
```nginx
server_name yourdomain.com www.yourdomain.com;
```
Lưu lại: Nhấn `Ctrl + O` ➔ `Enter`, sau đó `Ctrl + X` để thoát.

Kiểm tra và nạp lại cấu hình Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 4.3: Kích hoạt chứng chỉ SSL miễn phí Let's Encrypt (Certbot)
Chạy lệnh Certbot:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
* Nhập Email của bạn khi được hỏi để nhận thông báo gia hạn.
* Đồng ý điều khoản (`Y`).
* Chọn cấu hình chuyển hướng tự động HTTP sang HTTPS (`Redirect`).

Certbot sẽ tự động cấu hình HTTPS và tự động gia hạn chứng chỉ vĩnh viễn mỗi 90 ngày.

---

## 5. Cập Nhật Phiên Bản Mới (1 Lệnh)

Bất cứ khi nào bạn cập nhật code trên GitHub hoặc có bản phát hành mới, chỉ cần chạy đúng 1 lệnh trên terminal VPS:

```bash
sudo update-viechomnay
```
Lệnh này sẽ tự động:
1. Kéo code mới nhất từ nhánh `main` trên GitHub.
2. Cài đặt các thư viện mới (nếu có).
3. Biên dịch lại bản Web Production.
4. Triển khai vào `/var/www/viechomnay/html` và nạp lại Nginx chỉ trong khoảng 30 - 60 giây.

---

## 6. Các Lệnh Quản Trị Thường Dùng

| Mục đích | Lệnh thực hiện |
|---|---|
| **Kiểm tra trạng thái Nginx** | `sudo systemctl status nginx` |
| **Khởi động lại Nginx** | `sudo systemctl restart nginx` |
| **Xem log truy cập (Access Log)** | `sudo tail -f /var/log/nginx/access.log` |
| **Xem log lỗi (Error Log)** | `sudo tail -f /var/log/nginx/error.log` |
| **Kiểm tra dung lượng ổ đĩa** | `df -h` |
| **Kiểm tra mức sử dụng RAM & Swap**| `free -h` |
| **Thư mục chứa mã nguồn Web** | `/var/www/viechomnay/html` |
| **File cấu hình Nginx** | `/etc/nginx/sites-available/viechomnay` |

---

## 7. Xử Lý Lỗi Thường Gặp (Troubleshooting)

### ❓ 1. Đã cài xong nhưng gõ IP trên trình duyệt không tải được trang
* **Nguyên nhân**: Cổng 80/443 chưa được mở tại tường lửa của nhà cung cấp Cloud (Security Group / Firewall).
* **Khắc phục**:
  - Nếu bạn dùng **AWS EC2 / Lightsail, Google Cloud, Oracle Cloud, Azure, Vietnix**: Hãy vào trang quản trị của nhà cung cấp ➔ Tìm mục **Security Groups / Firewall Rules** ➔ Thêm luật mở cổng:
    - **HTTP**: Cổng `80` (Source: `0.0.0.0/0`)
    - **HTTPS**: Cổng `443` (Source: `0.0.0.0/0`)

### ❓ 2. Nhấn F5 (Reload) tại các trang `/kanban`, `/year-review` bị lỗi 404
* **Nguyên nhân**: Nginx chưa chuyển tiếp các tuyến đường SPA về `index.html`.
* **Khắc phục**: Mở `/etc/nginx/sites-available/viechomnay`, đảm bảo có khối lệnh sau trong `server { ... }`:
  ```nginx
  location / {
      try_files $uri $uri/ /index.html;
  }
  ```
  Sau đó chạy `sudo nginx -t && sudo systemctl reload nginx`.

### ❓ 3. Quá trình build bị treo hoặc báo lỗi `JavaScript heap out of memory`
* **Nguyên nhân**: VPS có ít RAM (1GB) và chưa có bộ nhớ ảo Swap.
* **Khắc phục**: Tạo thêm Swap 2GB bằng lệnh:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```
  Sau đó chạy lại script cài đặt: `sudo ./install-ubuntu-server.sh`.

---

**Chúc bạn triển khai Việc Hôm Nay thành công trên VPS Ubuntu Server 24.04! 🚀**
