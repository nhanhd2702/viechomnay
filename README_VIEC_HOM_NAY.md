# ☀️ Việc Hôm Nay (VHN) — Quản Lý Công Việc Hằng Ngày Đơn Giản & Hiệu Quả

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)
[![Platform: Web | Windows | Store](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20Store-10B981.svg)]()
[![Locale: vi--VN](https://img.shields.io/badge/Language-Ti%E1%BA%BFng%20Vi%E1%BB%87t%20(vi--VN)-blue.svg)]()

> **Việc Hôm Nay** là ứng dụng quản lý công việc và thời gian cá nhân hằng ngày được tối ưu riêng cho người đi làm và dân văn phòng Việt Nam. Ứng dụng hoạt động theo triết lý **Local-first (Dữ liệu thuộc về bạn)**, không cần tạo tài khoản, không quảng cáo, mở lên là dùng ngay.

---

## 🎯 Điểm Khác Biệt & Cải Tiến So Với Bản Gốc (Super Productivity)

Ứng dụng được tái cấu trúc chuyên sâu (Deep Fork) từ mã nguồn mở Super Productivity v19.1.0 với các điểm nâng cấp vượt trội:

| Tính năng | Bản gốc Super Productivity | Việc Hôm Nay (VHN) |
|---|---|---|
| **Ngôn ngữ & Múi giờ** | Tiếng Anh mặc định, cấu hình phức tạp | **100% Tiếng Việt**, chuẩn múi giờ `Asia/Ho_Chi_Minh`, Thứ Hai đầu tuần |
| **Màu sắc & Nhận diện** | Xanh tím truyền thống | **Xanh Ngọc Lục Bảo (Emerald `#10B981`)** tươi mới, logo mặt trời hoàn thành việc |
| **Thanh điều hướng** | Quá nhiều mục gây rối mắt (Donate, Plugins, Issue...) | **7 mục cố định tinh giản**: Hôm nay, Kanban, Lịch tuần, Thói quen, Báo cáo, Dự án, Cài đặt |
| **Kanban Board** | Mặc định là ma trận Eisenhower 2x2 | **Bảng Kanban 3 cột trực quan**: Cần làm ➔ Đang làm ➔ Xong |
| **Khởi đầu ngày mới** | Không có luồng chào sáng tập trung | **Modal Chào Sáng (Morning Ritual)**: Nhập việc nhanh nhiều dòng, tự động gắn thẻ Hôm nay |
| **Kết thúc ngày** | Nhiều bảng đánh giá và counter phức tạp | **Đóng ngày 1-chạm**: Động viên ngẫu nhiên, nút dời toàn bộ việc tồn sang ngày mai |
| **Thống kê & Báo cáo** | Chỉ xem biểu đồ giờ cơ bản | **Bản đồ Heatmap 365 ô SVG** + Thẻ chỉ số Streak + **Xuất Excel (.xlsx)** |
| **Dung lượng & Tài nguyên**| Ôm đồm Jira, GitLab, Redmine, Nextcloud... | **Đã gỡ bỏ sạch sẽ các module thừa**, chạy cực nhẹ và mượt mà |

---

## 🚀 Hướng Dẫn Cài Đặt Nhanh Bằng 1-Click Script

### Yêu cầu hệ thống
* Hệ điều hành: Windows 10/11 (hoặc macOS / Linux)
* Đã cài đặt [Node.js](https://nodejs.org/) (phiên bản khuyến nghị: **v20** hoặc **v22**)

### Cách chạy:
1. Nhấp đúp chuột vào file **`setup.bat`** (hoặc mở PowerShell gõ `.\setup.ps1`).
2. Script sẽ tự động kiểm tra Node.js và cài đặt các thư viện phụ thuộc (`node_modules`) nếu chưa có.
3. Menu tương tác hiển thị cho phép bạn chọn ngay:
   * **[1]** Khởi chạy **Web App** (mở trình duyệt tại `http://localhost:4200`)
   * **[2]** Khởi chạy **Desktop App** (Electron Windows)
   * **[3]** Đóng gói bộ cài đặt Windows (**`.exe` Installer** trong `.tmp/app-builds`)
   * **[4]** Đóng gói **Web Production (PWA)**

---

## 🛠️ Các Lệnh Thao Tác Thủ Công (Terminal)

Nếu bạn muốn chạy qua dòng lệnh PowerShell / Terminal:

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy Web App phát triển
npm run serve
# Trình duyệt sẽ mở tại http://localhost:4200

# 3. Chạy Desktop Electron
npm run start

# 4. Đóng gói bộ cài đặt Windows (.exe NSIS)
npm run dist:win
# File cài đặt .exe sẽ xuất hiện tại thư mục .tmp/app-builds/

# 5. Đóng gói Web Production
npm run buildFrontend:prodWeb
# File xuất tại .tmp/angular-dist/browser/
```

---

## 📦 Kiến Trúc & Công Nghệ

```
super-productivity/
├── electron/                         # Tiến trình Desktop Electron Main Process
├── src/
│   ├── app/
│   │   ├── core/                     # Theme ngọc lục bảo, Locale vi-VN, SQLite/IndexedDB
│   │   ├── core-ui/
│   │   │   └── magic-side-nav/       # Sidebar 7 mục cố định
│   │   ├── pages/
│   │   │   └── daily-summary/        # Đóng ngày 1-chạm & dời task tồn sang mai
│   │   └── features/
│   │       ├── boards/               # Kanban board 3 cột mặc định
│   │       ├── pomodoro/             # Đồng hồ đếm Pomodoro
│   │       ├── focus-mode/           # Chế độ làm việc tập trung sâu
│   │       ├── habits/               # Theo dõi thói quen hằng ngày
│   │       ├── vhn-morning-ritual/   # [MỚI] Chào sáng & lên kế hoạch nhanh
│   │       └── vhn-year-review/      # [MỚI] Heatmap 365 ô SVG & Xuất Excel
│   └── assets/
│       ├── i18n/vi.json              # Bản dịch tiếng Việt chuẩn hóa
│       └── icons/vhn.svg             # Logo biểu tượng Việc Hôm Nay
├── setup.bat                         # Script 1-click launcher Windows
└── setup.ps1                         # Script 1-click launcher PowerShell
```

* **Frontend:** Angular 21 (Standalone Components, Signals, RxJS)
* **Giao diện:** Angular Material & CDK Drag-and-drop
* **Quản lý trạng thái:** NgRx Store & Entity
* **Desktop Runtime:** Electron 43
* **Xuất dữ liệu:** `exceljs` (Lazy-loaded theo nhu cầu)

---

## 🗺️ Lộ Trình Triển Khai (Release Roadmap)

- [x] **Giai đoạn 1: Web App & Docker** (Đã hoàn thành)
  - Hoàn thiện rebrand, bản địa hóa tiếng Việt, bổ sung module Chào Sáng & Báo Cáo Năm.
- [ ] **Giai đoạn 2: Windows Desktop Installer**
  - Đóng gói file `.exe` (NSIS) và Portable cho người dùng tải trực tiếp cài đặt trên máy tính.
- [ ] **Giai đoạn 3: Phát hành Microsoft Store & Mobile**
  - Đăng ký tài khoản Microsoft Partner Center, đóng gói định dạng MSIX/AppX đưa lên Windows Store.
  - Tích hợp Capacitor đưa lên Google Play Store và Apple App Store.

---

## 📄 Bản Quyền & Giấy Phép (License & Attribution)

Dự án phát triển dựa trên mã nguồn mở [Super Productivity](https://github.com/super-productivity/super-productivity) của tác giả **Johannes Millan**, phát hành theo giấy phép **MIT License**.

Mọi bản quyền gốc của tác giả được bảo lưu và công nhận nguyên vẹn theo giấy phép MIT. Xem chi tiết tại tệp [LICENSE](./LICENSE).
