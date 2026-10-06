# Việc Hôm Nay — Thiết kế (Design Spec)

- **Ngày:** 2026-10-05
- **Nhánh:** `viec-hom-nay` (fork từ Super Productivity v19.1.0, commit `6101e68`)
- **Hướng:** B — Fork sâu (viết lại giao diện/luồng, giữ nguyên tầng dữ liệu)

---

## 1. Mục tiêu & người dùng

**Người dùng:** Dân văn phòng Việt Nam muốn quản lý công việc hằng ngày đơn giản.

**Luồng cốt lõi:**
Mở app → app hỏi "Hôm nay bạn cần làm gì?" → nhập task → Kanban → tick / kéo thả → Đóng ngày → Báo cáo tuần/tháng/năm.

**Tiêu chí thành công:**
1. Người dùng mới lên kế hoạch ngày đầu tiên trong < 1 phút, không cần đọc hướng dẫn.
2. Toàn bộ giao diện tiếng Việt mặc định, không còn tên/logo "Super Productivity" ở bất kỳ màn hình, cửa sổ, tray, installer nào.
3. Sau 1 năm sử dụng, trang "Báo cáo năm" hiển thị heatmap 365 ngày, tỉ lệ hoàn thành, top dự án và xuất được file `.xlsx`.
4. Có bộ cài Windows (NSIS) và gói MSIX hợp lệ để nộp Microsoft Store.

**Ngoài phạm vi (giai đoạn này):** iOS/macOS build, server đồng bộ riêng, tính năng làm việc nhóm, AI.

---

## 2. Nguyên tắc kiến trúc

1. **Không sửa tầng dữ liệu:** NgRx store/reducers của task, project, tag; model `Task`; persistence; `packages/sync-core`; `packages/shared-schema`. Dữ liệu phải giữ tương thích với Super Productivity v19.1.0 (để import/export qua lại được).
2. **Xoá hẳn** module không dùng (không chỉ ẩn) để giảm kích thước và bề mặt bảo trì. Khi xoá, phải gỡ sạch import, route, action, i18n key, test liên quan; `ng build` và `test` phải xanh sau mỗi bước xoá.
3. **Module mới** đặt trong `src/app/features/vhn-*` (tiền tố `vhn` = Việc Hôm Nay) để dễ nhận diện code riêng.
4. Giữ `LICENSE` (MIT) gốc và thêm dòng "Việc Hôm Nay is based on Super Productivity by Johannes Millan" ở trang Giới thiệu và README.

---

## 3. Thương hiệu (Rebranding)

| Hạng mục | Giá trị mới |
|---|---|
| Tên hiển thị | **Việc Hôm Nay** |
| `productName` (electron-builder) | `Viec Hom Nay` (ASCII cho tên file installer), cửa sổ/tray hiển thị "Việc Hôm Nay" |
| `appId` | `vn.viechomnay.app` |
| `package.json` `name` | `viec-hom-nay` |
| Ngôn ngữ mặc định | `vi` |
| Ngày đầu tuần | Thứ Hai (`firstDayOfWeek: 1`) |
| Locale ngày giờ | `vi-VN` (`dd/MM/yyyy`, 24h) |
| Màu thương hiệu | Primary: xanh lá ngọc `#10B981` (emerald-500); accent: cam `#F59E0B`. Áp dụng qua palette primary + token `--brand` trong `src/styles/_css-variables.scss` |
| Icon | Bộ icon mới (checkbox + mặt trời mọc), sinh ra cho: `build/icon.png`, `build/icons/*`, `build/appx/*`, `src/assets/icons/*`, favicon, Android `mipmap-*` |

**Phải thay ở:** `electron-builder.yaml`, `build/electron-builder.*.yaml`, `package.json`, `src/index.html` (title, meta), `src/manifest.json`, `electron/` (tên tray, tiêu đề cửa sổ, menu), `capacitor.config.ts`, `android/app` (appId, tên app), i18n (`vi.json`, `en.json`: mọi chuỗi chứa "Super Productivity"), trang About/Giới thiệu.

**Kiểm tra:** `grep -ri "super productivity\|superProductivity\|super-productivity"` trong `src/`, `electron/`, `build/`, `android/` chỉ còn lại trong `LICENSE`, dòng ghi công, và tên package nội bộ `@super-productivity/plugin-api` nếu không thể gỡ.

---

## 4. Cắt gọn tính năng

### Giữ lại
- Task, Subtask, Project, Tag, Nhắc việc (reminder), Việc lặp lại (task-repeat-cfg)
- Boards (Kanban), Planner (lịch tuần), Schedule
- Daily summary (Đóng ngày), Worklog / History / Metrics
- **Habits, Focus mode, Pomodoro** (theo yêu cầu)
- Calendar provider (iCal/ICS) — dùng để hiện lịch Outlook/Google trong Planner
- Sync: Local file, Dropbox, OneDrive, WebDAV
- Time tracking (Pomodoro/Worklog phụ thuộc)

### Xoá bỏ
| Module | Đường dẫn |
|---|---|
| Issue providers: Jira, GitLab, OpenProject, Redmine, Nextcloud Deck, CalDAV, Plainspace | `src/app/features/issue/providers/{jira,gitlab,open-project,redmine,nextcloud-deck,caldav,plainspace}` + `src/app/features/plainspace` |
| Issue panel (chỉ phục vụ các provider trên) | `src/app/features/issue-panel` — giữ phần tối thiểu cần cho Calendar provider nếu có phụ thuộc |
| Plugin system | `src/app/plugins`, `packages/plugin-api`, `packages/vite-plugin` (nếu chỉ phục vụ plugin) |
| Donate, Please-rate | `src/app/pages/donate-page`, `src/app/features/dialog-please-rate`, cờ `isDonatePageEnabled` |
| SuperSync | Provider `super-sync` trong cấu hình sync UI, `packages/super-sync-server` |
| Take-a-break, Idle tracking | `src/app/features/take-a-break`, `src/app/features/idle`, `electron` idle handler |
| Shepherd tour gốc | `src/app/features/shepherd` (thay bằng onboarding mới ở mục 5.4) |

> Lưu ý: thứ tự xoá từ lá đến gốc. Nếu một module "xoá" có phụ thuộc không gỡ được an toàn, ghi lại trong plan và giữ ở trạng thái ẩn thay vì xoá.

---

## 5. Trải nghiệm mới

### 5.1 Sidebar (sửa `src/app/core-ui/magic-side-nav/`)
Thứ tự cố định:
1. ☀️ **Hôm nay** (Today tag)
2. 📋 **Kanban** (`/boards`)
3. 📅 **Lịch tuần** (`/planner`)
4. 🔁 **Thói quen** (`/habits`)
5. 📊 **Báo cáo** (`/year-review` — trang mới, có tab Tuần/Tháng/Năm)
6. 📁 **Dự án** (cây project; ẩn cây Tag mặc định)
7. ⚙️ **Cài đặt**

Bỏ khỏi sidebar: Inbox riêng (gộp vào Hôm nay qua dự án mặc định), Schedule (vẫn truy cập qua Lịch tuần), Search (giữ phím tắt Ctrl+K).

### 5.2 Chào buổi sáng — `features/vhn-morning-ritual` (mới)
- **Kích hoạt:** lần đầu app được mở/focus trong một ngày lịch mới (so sánh `lastRitualDay` lưu trong `localStorage` với ngày hiện tại theo giờ máy). Có thể tắt trong Cài đặt.
- **Nội dung dialog:**
  - Lời chào theo giờ ("Chào buổi sáng!" / "Chào buổi chiều!").
  - Mục "Việc còn dang dở hôm qua": danh sách task chưa xong có `dueDay` < hôm nay hoặc thuộc Today hôm trước, mặc định được tick → mang sang hôm nay.
  - Ô nhập nhiều dòng: "Hôm nay bạn cần làm gì?" — mỗi dòng một task, hỗ trợ short-syntax có sẵn (`#tag`, `+30m`, `!` ưu tiên).
  - Nút **"Bắt đầu ngày làm việc"**: tạo task qua `TaskService.add` với `dueDay = today`, rồi điều hướng tới Kanban.
- Không thay đổi model; chỉ dùng action có sẵn.

### 5.3 Kanban mặc định (sửa `features/boards`)
- Board mặc định "Hôm nay" gồm 3 cột: **Cần làm** / **Đang làm** / **Xong**, lọc theo task có `dueDay = today`.
- "Đang làm" dựa trên tag hệ thống `IN_PROGRESS` (tạo bằng cơ chế tag có sẵn nếu chưa tồn tại), "Xong" = `isDone`.
- Kéo sang "Xong" ⇒ đánh dấu hoàn thành; kéo ngược ⇒ bỏ hoàn thành.

### 5.4 Onboarding (thay Shepherd)
3 bước nhẹ khi mở lần đầu tiên: (1) chọn chủ đề sáng/tối, (2) chọn đồng bộ (bỏ qua được), (3) mở ngay Chào buổi sáng.

### 5.5 Đóng ngày 1 chạm (sửa `pages/daily-summary`)
- Nút "Đóng ngày" trên header (giữ cờ `isFinishDayEnabled`).
- Màn hình rút gọn: số việc xong / tổng, thời gian đã theo dõi, 1 câu động viên ngẫu nhiên (danh sách tiếng Việt), confetti giữ nguyên.
- Nút chính **"Dời việc chưa xong sang mai & đóng ngày"**: đặt `dueDay = ngày mai` cho task chưa xong của hôm nay, archive task đã xong (luồng archive có sẵn).
- Ẩn evaluation-sheet và simple-counter khỏi màn hình mặc định (vẫn có trong Cài đặt nâng cao).

### 5.6 Báo cáo — `features/vhn-year-review` (mới, route `/year-review`)
- Nguồn dữ liệu: task hiện tại + archive (qua `TaskArchiveService` / `WorklogService`), chỉ đọc.
- **Tab Năm:** chọn năm; heatmap 53×7 (số task hoàn thành theo `doneOn`), KPI: tổng hoàn thành, số ngày hoạt động, chuỗi ngày dài nhất, tổng thời gian theo dõi; bảng top 5 dự án; biểu đồ cột theo tháng.
- **Tab Tháng / Tuần:** cùng KPI, phạm vi tương ứng.
- **Xuất Excel:** nút "Xuất .xlsx" — sheet "Tổng quan" + sheet "Chi tiết task" (ngày xong, tiêu đề, dự án, tag, thời gian). Dùng thư viện `exceljs` (thêm dependency), **import động (lazy)** chỉ khi bấm nút xuất để không làm nặng bundle khởi động.
- Heatmap là component SVG tự viết (không thêm thư viện chart).

---

## 6. Xử lý lỗi
- Morning ritual: nếu tạo task lỗi → snack báo lỗi, dialog không đóng, dữ liệu đã nhập giữ nguyên.
- Year review: không có dữ liệu → empty state "Chưa có dữ liệu cho năm này".
- Xuất Excel lỗi (quyền ghi file) → snack báo lỗi kèm gợi ý.
- Không thay đổi xử lý lỗi của tầng dữ liệu/sync.

## 7. Kiểm thử
- Unit test (Jasmine/Karma có sẵn): logic chọn ngày kích hoạt morning ritual; tạo task từ nhiều dòng; tính KPI/heatmap year-review (gồm ranh giới năm, múi giờ `Asia/Ho_Chi_Minh`); dời task sang mai.
- Sau mỗi bước xoá module: `npm run lint:ts`, `ng build`, `npm run test:fast` đều phải xanh.
- E2E Playwright smoke: mở app → morning ritual → nhập 3 task → Kanban kéo 1 task sang Xong → Đóng ngày → Báo cáo hiển thị 1 task hoàn thành.
- Kiểm tra rebrand bằng grep (mục 3).

## 8. Đóng gói & phát hành — thứ tự: Web app → Cài trên Windows → Store

### Mốc 1 — Web app (phát triển & dùng thử hằng ngày)
- Toàn bộ giai đoạn 1–5 (mục 9) được phát triển và nghiệm thu trên **web app**: `npm run serve` → `http://localhost:4200`.
- Bản web build production: `npm run buildFrontend:prodWeb` (PWA, cài được từ Chrome/Edge "Install app"), chạy bằng `Dockerfile` + `nginx/` có sẵn trong repo (`docker compose up`), cổng mặc định `8080`.
- Dữ liệu web lưu trong IndexedDB của trình duyệt; sync Dropbox/OneDrive/WebDAV dùng được trên web.
- **Điều kiện qua mốc:** E2E smoke (mục 7) xanh trên web build production.

### Mốc 2 — Cài trên Windows (Electron, dùng nội bộ)
- `npm run dist:win` → bộ cài NSIS `Viec-Hom-Nay-Setup-x64.exe` + bản portable, không ký số (Windows SmartScreen sẽ cảnh báo — chấp nhận ở mốc này).
- Kiểm tra trên Windows thật: cài/gỡ, shortcut Desktop/Start Menu, tray, thông báo nhắc việc, tự khởi động cùng Windows (tuỳ chọn), dữ liệu tồn tại sau khi khởi động lại.
- Tắt auto-update trỏ về GitHub của Super Productivity (`publish` trong `package.json`).
- **Điều kiện qua mốc:** dùng thực tế ≥ 1 tuần không lỗi chặn.

### Mốc 3 — Microsoft Store
- Tạo tài khoản Microsoft Partner Center, đăng ký tên "Việc Hôm Nay", lấy Publisher ID.
- Build MSIX qua `build/electron-builder.appx.yaml` với identity mới; chuẩn bị ảnh chụp màn hình, mô tả tiếng Việt, chính sách quyền riêng tư (local-first, không thu thập dữ liệu).
- Android (Google Play) và iOS để sau mốc 3, ngoài phạm vi spec này.

## 9. Giai đoạn thực hiện
1. **Rebrand** (mục 3) — kiểm tra trên web.
2. **Cắt gọn** (mục 4) — từng module một, build xanh sau mỗi module.
3. **Sidebar + Kanban mặc định + Đóng ngày** (5.1, 5.3, 5.5).
4. **Chào buổi sáng + Onboarding** (5.2, 5.4).
5. **Báo cáo** (5.6).
6. **Mốc 1 — Web app production** (Docker + PWA).
7. **Mốc 2 — Bộ cài Windows** (NSIS/portable).
8. **Mốc 3 — Microsoft Store** (MSIX).
