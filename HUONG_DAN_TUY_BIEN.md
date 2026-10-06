# 🛠️ HƯỚNG DẪN TÙY BIẾN MÃ NGUỒN SUPER PRODUCTIVITY

Thư mục mã nguồn: `D:\01_Working\Projects\super-productivity`

---

## 1. 🚀 Khởi Chạy Môi Trường Phát Triển (Hot-Reload)

Mỗi khi bạn sửa code, giao diện sẽ tự động cập nhật ngay lập tức:

### Cách 1: Chạy trên trình duyệt Web (Khuyên dùng khi sửa code giao diện)
Mở PowerShell tại thư mục này và chạy:
```powershell
npm run serve
```
Sau đó mở trình duyệt truy cập: **`http://localhost:4200`**

### Cách 2: Chạy bản Electron Desktop Dev
```powershell
npm start
```

---

## 2. 📁 Bản Đồ Thư Mục Để Bạn Tùy Biến (Custom Code)

Mọi tính năng của app được tổ chức rất rõ ràng trong `src/app/features/`:

| Tính năng muốn sửa | Đường dẫn tệp tin | Ghi chú |
| :--- | :--- | :--- |
| **Hỏi kế hoạch đầu ngày (Daily Planning)** | `src/app/features/planner/` | Tùy biến popup hỏi *"Hôm nay bạn làm gì?"*, thêm gợi ý task, đổi giao diện nhập liệu. |
| **Bảng kéo thả Kanban (Boards)** | `src/app/features/boards/` | Chỉnh sửa cột Kanban, cách hiển thị thẻ task, kéo thả giữa các trạng thái. |
| **Tổng kết cuối ngày (Finish Day)** | `src/app/features/before-finish-day/`<br>`src/app/features/finish-day-before-close/` | Tùy biến màn hình đóng ngày, bảng tổng kết việc xong và dời việc sang hôm sau. |
| **Báo cáo thống kê năm (Worklog)** | `src/app/features/worklog/` | Tùy biến các biểu đồ năng suất, bộ lọc theo Năm/Tháng/Tuần. |
| **Đổi ngôn ngữ / Câu chữ tiếng Việt** | `src/assets/i18n/vi.json` | Toàn bộ từ ngữ hiển thị trong app. Bạn có thể sửa câu chữ theo đúng phong cách của bạn. |
| **Đổi màu sắc, giao diện, theme** | `src/styles/themes.scss`<br>`src/styles/components/` | Tùy biến bảng màu, font chữ, Dark mode, Light mode. |

---

## 3. 📦 Đóng Gói Thành Bộ Cài Windows (.exe) Sau Khi Tùy Biến

Sau khi bạn đã sửa đổi code theo ý muốn và muốn build thành file cài đặt độc lập:
```powershell
npm run dist:win
```
File cài đặt sẽ được tạo ra tại thư mục: `.tmp/app-builds/`
