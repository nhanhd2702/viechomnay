# Việc Hôm Nay — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork Super Productivity v19.1.0 thành sản phẩm "Việc Hôm Nay" — ứng dụng quản lý việc hằng ngày bằng tiếng Việt cho dân văn phòng, phát hành trên Web → Windows → Microsoft Store.

**Architecture:** Hướng B (fork sâu) — chỉ sửa tầng giao diện và luồng UX, **không động tầng dữ liệu** (NgRx store/reducers, model `Task`, persistence, `packages/sync-core`). Module mới đặt trong `src/app/features/vhn-*`. Mỗi Task xoá/sửa phải để `ng build` và `npm run test:fast` xanh trước khi commit.

**Tech Stack:** Angular 21, NgRx 21, Angular Material, Electron 43, SCSS (CSS custom properties), Karma/Jasmine, Playwright (E2E), `exceljs` (lazy import), Docker/nginx (web production).

**Spec:** `docs/superpowers/specs/2026-10-05-viec-hom-nay-design.md`

## Global Constraints

- Nhánh: `viec-hom-nay` (đã tạo từ commit `6101e68`).
- `appId` = `vn.viechomnay.app` — **không đổi sau khi nộp Store**.
- Tên hiển thị = `Việc Hôm Nay` (có dấu). `productName` trong electron-builder = `Viec Hom Nay` (ASCII, cho tên file).
- Màu brand primary = `#10B981` (emerald-500), accent = `#F59E0B`.
- Ngôn ngữ mặc định: `vi`; locale ngày giờ: `vi-VN`; firstDayOfWeek: `1` (Thứ Hai).
- Giữ `LICENSE` (MIT) gốc; thêm dòng attribution ở README và trang Giới thiệu.
- Sau mỗi Task: `npx ng build --configuration=productionWeb 2>&1 | tail -5` phải in `✔ Building...` và kết thúc không lỗi. `npm run test:fast` phải xanh (nếu có test mới).
- Module mới dùng tiền tố `vhn-` (tên thư mục, selector, class prefix).
- Không sửa bất kỳ file trong `src/app/root-store/`, `packages/sync-core/`, `packages/shared-schema/`.
- Chuỗi UI tiếng Việt đặt trong `src/assets/i18n/vi.json` theo cấu trúc phân cấp hiện tại (`VHN.*` cho key mới).
- commit message dùng Conventional Commits (`feat:`, `refactor:`, `chore:`, `fix:`), thêm `--no-verify` để bỏ qua hook lint khi commit tài liệu/config.

## Review Focus

1. **`lastRitualDay` reset khi máy đổi múi giờ / đồng hồ hệ thống bị lùi:** service phải so sánh bằng chuỗi ngày `YYYY-MM-DD` theo `Intl` với timezone `Asia/Ho_Chi_Minh`, không dùng timestamp thuần.
2. **Heatmap ranh giới năm:** năm nhuận (366 ngày) và tuần không đầy ở đầu/cuối năm phải render đúng 53 cột.
3. **`BroadcastChannel('superProductivityTab')`** trong `startup.service.ts` dùng tên kênh cũ — sau rebrand nếu cả hai bản (gốc + VHN) mở cùng lúc sẽ xung đột tab; phải đổi tên kênh.
4. **Dời task sang mai khi người dùng đóng ngày lúc sau nửa đêm (00:00–04:00):** "ngày mai" phải tính theo ngày lịch thực tế, không phải `Date.now() + 86400000`.
5. **Xuất Excel với > 1000 task:** `exceljs` import động lần đầu có thể mất 2–3 giây; cần spinner/loading state trước khi resolve promise.

---

## Task 1: Rebrand — config & metadata

**Files:**
- Modify: `package.json` (name, version)
- Modify: `electron-builder.yaml` (appId, productName, artifactName, linux executableName/scheme/WMClass, appx block)
- Modify: `capacitor.config.ts` (appId, appName)
- Modify: `src/index.html` (title, BroadcastChannel name comment)
- Modify: `src/manifest.json` (name, short_name)
- Modify: `electron/main-window.ts` (title)
- Modify: `electron/start-app.ts` (APP_DISPLAY_NAME, LINUX_DESKTOP_NAME)
- Modify: `electron/menu.ts` (label, about label, hide label)
- Modify: `electron/indicator.ts` (fallback title string)
- Modify: `electron/protocol-handler.ts` (PROTOCOL_NAME → `viechomnay`)
- Modify: `electron/various-shared.ts` (comment chuỗi protocol)
- Modify: `src/app/core/startup/startup.service.ts` (BroadcastChannel name, error message)
- Modify: `android/app/src/main/res/values/strings.xml` (app_name, webview messages)
- Modify: `src/assets/i18n/vi.json` (tất cả chuỗi chứa "Super Productivity" → "Việc Hôm Nay"; URL → placeholder hoặc comment)
- Modify: `src/assets/i18n/en.json` (tương tự)
- Modify: `src/app/core/update-check/update-check.service.ts` (tắt auto-update GitHub: set `GITHUB_RELEASES_URL` → `null` và bỏ qua logic update trong môi trường VHN)
- Modify: `src/app/core/share/share-formatter.ts` (DEFAULT_BASE_URL, tiêu đề chia sẻ, hashtag)
- Modify: `src/app/features/config/default-global-config.const.ts` (syncFolderPath `'viec-hom-nay'`, tắt SuperSync URL, `lng: 'vi'`, `firstDayOfWeek: 1`, `dateTimeLocale: 'vi'`)
- Modify: `src/app/core-ui/magic-side-nav/magic-nav-config.service.ts` (3 URL GitHub → URL của dự án hoặc `null`)
- Modify: `src/app/pages/config-page/config-page.component.html` (tên, link privacy, link github)
- Modify: `electron/task-widget/task-widget.html` (title)
- Create: `README.vhn.md` (attribution dòng MIT)

**Interfaces:**
- Produces: `PROTOCOL_NAME = 'viechomnay'` (Task 2 sẽ phụ thuộc nếu cần)

- [ ] **Step 1: Đổi `package.json`**

```jsonc
// package.json — chỉ sửa 2 trường này, giữ nguyên phần còn lại:
"name": "viec-hom-nay",
"version": "1.0.0",
```

Chạy: `node -e "const p=require('./package.json');console.log(p.name,p.version)"` → in `viec-hom-nay 1.0.0`.

- [ ] **Step 2: Đổi `electron-builder.yaml` — phần đầu và artifact**

Mở `electron-builder.yaml`, sửa:
```yaml
appId: vn.viechomnay.app
productName: Viec Hom Nay
artifactName: Viec-Hom-Nay-${arch}.${ext}
```
Dòng `executableName`: `viechomnay`
Dòng `StartupWMClass`: `viechomnay`
Dòng scheme `x-scheme-handler/viechomnay` (xoá dòng `superproductivity`)
Khối `appx`:
```yaml
appx:
  applicationId: ViecHomNay
  displayName: Việc Hôm Nay
  identityName: <để trống, điền sau khi có Partner Center>
  executableName: viechomnay
```
Dòng `appId: com.super-productivity.app` (Linux/Snap) → `vn.viechomnay.app`

- [ ] **Step 3: Đổi `capacitor.config.ts`**

```typescript
const config: CapacitorConfig = {
  appId: 'vn.viechomnay.app',
  appName: 'Việc Hôm Nay',
  // ... giữ nguyên webDir và server
};
```

- [ ] **Step 4: Đổi `src/index.html`**

Dòng `<title>`: `<title>Việc Hôm Nay</title>`
Dòng `'Super Productivity requires a newer browser version...'` → `'Việc Hôm Nay cần trình duyệt mới hơn để chạy.'`
Dòng `'Two step super productivity'` → `'Việc Hôm Nay'`

- [ ] **Step 5: Đổi `src/manifest.json`**

```json
{
  "name": "Việc Hôm Nay",
  "short_name": "Việc HN",
  ...
}
```

- [ ] **Step 6: Đổi Electron display strings**

`electron/main-window.ts` dòng 238: `title: IS_DEV ? 'Việc Hôm Nay D' : 'Việc Hôm Nay'`
`electron/main-window.ts` dòng 395: `mainWin.setTitle('Việc Hôm Nay D')`
`electron/start-app.ts` dòng 37: `const APP_DISPLAY_NAME = 'Việc Hôm Nay'`
`electron/start-app.ts` dòng 44: `const LINUX_DESKTOP_NAME = 'viechomnay.desktop'`
`electron/menu.ts` dòng 17: `label: 'Việc Hôm Nay'`
dòng 19: `{ role: 'about', label: 'Giới thiệu Việc Hôm Nay' }`
dòng 21: `{ role: 'hide', label: 'Ẩn Việc Hôm Nay' }`
`electron/indicator.ts` dòng 530 comment: `// "Việc Hôm Nay"`
`electron/task-widget/task-widget.html` `<title>Việc Hôm Nay Task Widget</title>`

- [ ] **Step 7: Đổi protocol handler**

`electron/protocol-handler.ts` dòng 8: `export const PROTOCOL_NAME = 'viechomnay';`
(Tất cả chuỗi `superproductivity://` trong file này → `viechomnay://`)

- [ ] **Step 8: Fix BroadcastChannel & update-check**

`src/app/core/startup/startup.service.ts` dòng 311:
```typescript
const channel = new BroadcastChannel('viecHomNayTab');
```
Dòng 360: `'Việc Hôm Nay đang chạy ở tab khác. Vui lòng đóng tab này.'`

`src/app/core/update-check/update-check.service.ts`:
Thêm constant đầu file:
```typescript
const VHN_DISABLE_UPSTREAM_UPDATE_CHECK = true;
```
Trong method `checkForUpdate()` (hoặc tương đương), bao toàn bộ logic bằng:
```typescript
if (VHN_DISABLE_UPSTREAM_UPDATE_CHECK) return;
```

- [ ] **Step 9: Đổi default config localization & sync paths**

`src/app/features/config/default-global-config.const.ts`:
```typescript
localization: {
  lng: 'vi' as LanguageCode,
  dateTimeLocale: 'vi' as DateTimeLocale,
  firstDayOfWeek: 1,
},
```
Tất cả `syncFolderPath: 'super-productivity'` → `'viec-hom-nay'`
Dòng SuperSync URL (`sync.super-productivity.com`) → xoá hoặc để `''` (Task 5 sẽ ẩn UI SuperSync)

- [ ] **Step 10: Đổi chuỗi i18n vi.json**

Dùng editor/script tìm-thay trong `src/assets/i18n/vi.json`:
- `"Super Productivity"` → `"Việc Hôm Nay"` (các chuỗi UI hiển thị cho user)
- URL `super-productivity.com/privacy` → `#` (chưa có trang privacy riêng)
- URL `github.com/super-productivity/super-productivity/discussions` → `#`
- Giữ nguyên các key có URL là comment kỹ thuật bên trong HTML (HELP field của Jira/GitLab/OpenProject — sẽ bị xoá ở Task 3)
- Tương tự cho `en.json`

Sau khi xong:
```
grep -i "super productivity" src/assets/i18n/vi.json | wc -l
```
Kết quả phải là 0.

- [ ] **Step 11: Đổi share-formatter và magic-side-nav links**

`src/app/core/share/share-formatter.ts`:
```typescript
const DEFAULT_BASE_URL = 'https://viechomnay.vn'; // placeholder
const DEFAULT_SHARE_MSG = 'Hãy thử Việc Hôm Nay - ứng dụng quản lý công việc hằng ngày cho dân văn phòng Việt Nam!';
const DEFAULT_TITLE = 'Việc Hôm Nay';
// Xoá dòng hashtag #SuperProductivity
```

`src/app/core-ui/magic-side-nav/magic-nav-config.service.ts` 3 href GitHub → `'https://viechomnay.vn'` (placeholder).

`src/app/pages/config-page/config-page.component.html`:
- Tên app → `Việc Hôm Nay`
- Href releases → `#`
- Href privacy → `https://viechomnay.vn/privacy` (placeholder)
- Href discussions → `#`

- [ ] **Step 12: Đổi Android strings**

`android/app/src/main/res/values/strings.xml`:
```xml
<string name="app_name">Việc Hôm Nay</string>
<string name="webview_init_failure_message">Việc Hôm Nay không thể khởi động Android System WebView.</string>
```
(Các chuỗi còn lại không cần thiết phải dịch ở giai đoạn này.)

- [ ] **Step 13: Tạo README attribution**

```bash
cat >> README.vhn.md << 'EOF'
# Việc Hôm Nay

Ứng dụng quản lý công việc hằng ngày cho dân văn phòng Việt Nam.

---

**Based on [Super Productivity](https://github.com/super-productivity/super-productivity)
by Johannes Millan, licensed under MIT.**
See `LICENSE` for the full license text.
EOF
```

- [ ] **Step 14: Build kiểm tra**

```powershell
npx ng build --configuration=productionWeb 2>&1 | Select-String "error|warning|✔ Building" | Select -Last 10
```
Phải thấy `✔ Building...` và không có `error TS`.

- [ ] **Step 15: Grep kiểm tra rebrand**

```powershell
Get-ChildItem src,electron,android -Recurse -File -Include *.ts,*.html,*.json,*.yaml,*.xml -Exclude *.spec.ts |
  Select-String -Pattern "Super Productivity|superProductivity" |
  Where-Object { $_.Path -notmatch 'i18n\\(?!vi|en)' -and $_.Path -notmatch 'LICENSE' } |
  Select-Object Path,LineNumber,Line
```
Kết quả phải trống hoặc chỉ còn comment kỹ thuật (không phải chuỗi UI hiển thị).

- [ ] **Step 16: Commit**

```bash
git add -A
git commit -m "chore: rebrand to Viec Hom Nay (appId, display names, default locale vi)" --no-verify
```

---

## Task 2: Màu brand & logo placeholder

**Files:**
- Modify: `src/styles/_css-variables.scss` (token `--brand` primitive)
- Modify: `src/app/features/work-context/work-context.const.ts` (`DEFAULT_TAG_COLOR`, `DEFAULT_TODAY_TAG_COLOR`, `DEFAULT_PROJECT_COLOR`)
- Modify: `src/app/core/theme/global-theme.service.ts` (thay file SVG `sp` → `vhn`)
- Create: `src/assets/icons/vhn.svg` (logo tạm — checkbox + mặt trời, SVG đơn giản)
- Create: `build/icon.png` placeholder (512×512 PNG màu brand, chạy script có sẵn sau)

**Interfaces:**
- Consumes: không có dependency từ Task 1 ngoài các constant đã đổi tên.
- Produces: CSS token `--brand: #10B981` dùng trong toàn app.

- [ ] **Step 1: Đổi màu CSS token**

Mở `src/styles/_css-variables.scss`, tìm dòng khai báo `--brand` trong `body` (light) và `body.isDarkTheme` (dark):
```scss
body {
  // ...
  --brand: #10B981;       // emerald-500 — thay cho var(--palette-primary-600)
}
body.isDarkTheme {
  // ...
  --brand: #34D399;       // emerald-400 (sáng hơn cho dark mode)
}
```

- [ ] **Step 2: Đổi màu default context**

`src/app/features/work-context/work-context.const.ts`:
```typescript
export const DEFAULT_PROJECT_COLOR = '#10B981';   // emerald
export const DEFAULT_TAG_COLOR = '#F59E0B';        // amber accent
export const DEFAULT_TODAY_TAG_COLOR = '#10B981';  // brand primary
```

- [ ] **Step 3: Tạo logo SVG tạm**

Tạo file `src/assets/icons/vhn.svg`:
```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <!-- Mặt trời -->
  <circle cx="24" cy="16" r="8" fill="#10B981"/>
  <!-- Checkbox -->
  <rect x="10" y="28" width="28" height="14" rx="3" fill="#10B981" opacity="0.9"/>
  <polyline points="15,35 21,41 33,29" stroke="white" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>
```

- [ ] **Step 4: Đăng ký logo trong GlobalThemeService**

`src/app/core/theme/global-theme.service.ts` — tìm dòng:
```typescript
['sp', 'assets/icons/sp.svg'],
```
Thay bằng:
```typescript
['vhn', 'assets/icons/vhn.svg'],
```
Tìm tất cả tham chiếu đến icon key `'sp'` trong cùng file và thay thành `'vhn'`.

- [ ] **Step 5: Build kiểm tra**

```powershell
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS|✔ Building" | Select -Last 5
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: brand colors #10B981 + placeholder VHN logo SVG"
```

---

## Task 3: Xoá issue providers (Jira, GitLab, OpenProject, Redmine, Nextcloud, Caldav, Plainspace)

> **Nguyên tắc xoá:** xoá từng provider một, build xanh, rồi mới xoá tiếp. Nếu provider có phụ thuộc chặt không gỡ được, comment-out và đánh dấu `// VHN-REMOVE`.

**Files:**
- Delete: `src/app/features/issue/providers/jira/` (toàn thư mục)
- Delete: `src/app/features/issue/providers/gitlab/`
- Delete: `src/app/features/issue/providers/open-project/`
- Delete: `src/app/features/issue/providers/redmine/`
- Delete: `src/app/features/issue/providers/nextcloud-deck/`
- Delete: `src/app/features/issue/providers/caldav/`
- Delete: `src/app/features/issue/providers/plainspace/`
- Delete: `src/app/features/plainspace/` (feature riêng)
- Modify: `src/app/features/issue/issue.const.ts` (xoá enum values của các provider trên)
- Modify: `src/app/features/issue/issue-provider.service.ts` (gỡ import + registration)
- Modify: tất cả file có `import` từ các thư mục vừa xoá (tìm bằng build error sau mỗi bước xoá)
- Delete: `src/app/features/dialog-please-rate/`
- Delete: `src/app/pages/donate-page/`
- Modify: routing (gỡ route `/donate`)

**Interfaces:**
- Consumes: không
- Produces: không — đây là pure deletion

- [ ] **Step 1: Xoá Jira**

```powershell
Remove-Item -Recurse -Force src\app\features\issue\providers\jira
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS" | Select -First 20
```
Sửa từng lỗi import xuất hiện (xoá dòng import và tham chiếu tương ứng). Lặp đến khi build xanh.

- [ ] **Step 2: Xoá GitLab**

```powershell
Remove-Item -Recurse -Force src\app\features\issue\providers\gitlab
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS" | Select -First 20
```
Sửa lỗi, build xanh.

- [ ] **Step 3: Xoá OpenProject**

```powershell
Remove-Item -Recurse -Force src\app\features\issue\providers\open-project
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS" | Select -First 20
```

- [ ] **Step 4: Xoá Redmine, Nextcloud, Caldav, Plainspace**

```powershell
Remove-Item -Recurse -Force `
  src\app\features\issue\providers\redmine, `
  src\app\features\issue\providers\nextcloud-deck, `
  src\app\features\issue\providers\caldav, `
  src\app\features\issue\providers\plainspace, `
  src\app\features\plainspace
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS" | Select -First 30
```
Sửa lỗi, build xanh.

- [ ] **Step 5: Xoá Donate + Please-rate**

```powershell
Remove-Item -Recurse -Force src\app\pages\donate-page
Remove-Item -Recurse -Force src\app\features\dialog-please-rate
```
Gỡ route `/donate` trong app.routes.ts. Gỡ import `isDonatePageEnabled` trong sidebar (magic-nav-config.service.ts). Build xanh.

- [ ] **Step 6: Xoá Plugin system**

```powershell
Remove-Item -Recurse -Force src\app\plugins
```
Gỡ tất cả import của `plugins` (tìm bằng build error). Build xanh.

- [ ] **Step 7: Xoá SuperSync khỏi sync UI**

Trong `src/app/features/config/` và các file sync provider UI, tìm và xoá các references đến `SuperSync` (chỉ xoá UI/config, không động tới `packages/sync-core`). Build xanh.

- [ ] **Step 8: Xoá Take-a-break và Idle**

```powershell
Remove-Item -Recurse -Force src\app\features\take-a-break
Remove-Item -Recurse -Force src\app\features\idle
```
Gỡ import trong `app.component.ts` và effects. Trong electron, comment-out IdleTimeHandler và xoá import. Build xanh.

- [ ] **Step 9: Final build + test**

```powershell
npx ng build --configuration=productionWeb 2>&1 | Select-String "error|✔ Building" | Select -Last 5
npm run test:fast 2>&1 | Select-String "FAILED|SUCCESS" | Select -Last 3
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "refactor: remove unused issue providers, plugins, donate, take-a-break, idle"
```

---

## Task 4: Sidebar — 7 mục cố định

**Files:**
- Modify: `src/app/core-ui/magic-side-nav/magic-nav-config.service.ts`
- Modify: `src/app/core-ui/magic-side-nav/magic-side-nav.component.html`
- Modify: `src/assets/i18n/vi.json` (thêm key `VHN.NAV.*`)

**Interfaces:**
- Consumes: routes `/boards`, `/planner`, `/habits`, `/year-review` (Task 7 tạo route này)
- Produces: sidebar cố định 7 mục

- [ ] **Step 1: Viết test cho cấu trúc nav items**

File test mới: `src/app/core-ui/magic-side-nav/magic-nav-config.service.vhn.spec.ts`
```typescript
import { TestBed } from '@angular/core/testing';
import { MagicNavConfigService } from './magic-nav-config.service';

describe('VHN Nav Config', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [/* minimal deps */] }));

  it('should expose exactly 7 top-level nav items', () => {
    const svc = TestBed.inject(MagicNavConfigService);
    // getStaticNavItems() là method sẽ được thêm ở Step 2
    const items = svc.getStaticNavItems();
    expect(items.length).toBe(7);
  });

  it('should have Hôm nay as first item with route /tag/TODAY/tasks', () => {
    const svc = TestBed.inject(MagicNavConfigService);
    expect(svc.getStaticNavItems()[0].route).toContain('TODAY');
  });
});
```

Chạy: `npx ng test --include=**/magic-nav-config.service.vhn.spec.ts --watch=false`
Kết quả: FAILED (method chưa tồn tại).

- [ ] **Step 2: Thêm `getStaticNavItems()` vào service**

Trong `magic-nav-config.service.ts`, thêm method:
```typescript
getStaticNavItems(): NavItem[] {
  return [
    { label: 'VHN.NAV.TODAY', icon: 'wb_sunny', route: `/tag/${TODAY_TAG.id}/tasks` },
    { label: 'VHN.NAV.BOARDS', icon: 'view_kanban', route: '/boards' },
    { label: 'VHN.NAV.PLANNER', icon: 'calendar_month', route: '/planner' },
    { label: 'VHN.NAV.HABITS', icon: 'loop', route: '/habits' },
    { label: 'VHN.NAV.YEAR_REVIEW', icon: 'bar_chart', route: '/year-review' },
    { label: 'VHN.NAV.PROJECTS', icon: 'folder', isProjectTree: true },
    { label: 'VHN.NAV.SETTINGS', icon: 'settings', route: '/config' },
  ];
}
```
(Dùng đúng type `NavItem` hoặc interface tương đương hiện có trong file — kiểm tra interface hiện tại trước khi viết.)

- [ ] **Step 3: Thêm i18n keys**

`src/assets/i18n/vi.json` — thêm vào cuối object `VHN` (tạo nếu chưa có):
```json
"VHN": {
  "NAV": {
    "TODAY": "Hôm nay",
    "BOARDS": "Kanban",
    "PLANNER": "Lịch tuần",
    "HABITS": "Thói quen",
    "YEAR_REVIEW": "Báo cáo",
    "PROJECTS": "Dự án",
    "SETTINGS": "Cài đặt"
  }
}
```

- [ ] **Step 4: Cập nhật template sidebar**

`magic-side-nav.component.html` — thay phần render nav items thành loop qua `getStaticNavItems()`, ẩn các link cũ (Donate, rate, plugin, community). Giữ nguyên phần cây project/tag tree bên dưới (isProjectTree).

- [ ] **Step 5: Chạy test + build**

```powershell
npx ng test --include=**/magic-nav-config.service.vhn.spec.ts --watch=false 2>&1 | Select-String "FAILED|PASSED|SUCCESS"
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS|✔ Building" | Select -Last 5
```
Cả hai xanh.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(sidebar): 7-item fixed nav for VHN (Today/Kanban/Planner/Habits/Report/Projects/Settings)"
```

---

## Task 5: Kanban mặc định — Board "Hôm nay" 3 cột

**Files:**
- Modify: `src/app/features/boards/boards.component.ts` (seed default board nếu chưa tồn tại)
- Create: `src/app/features/boards/vhn-default-board.const.ts`
- Modify: `src/assets/i18n/vi.json` (key `VHN.BOARDS.*`)

**Interfaces:**
- Consumes: `BoardCfg`, `DEFAULT_BOARD_CFG` từ `boards.model.ts`; `TODAY_TAG.id`; tag hệ thống `IN_PROGRESS` (sẽ tạo ở Step 1)
- Produces: hằng số `VHN_DEFAULT_BOARD_CFG: BoardCfg`

- [ ] **Step 1: Viết test cho VHN_DEFAULT_BOARD_CFG**

File: `src/app/features/boards/vhn-default-board.spec.ts`
```typescript
import { VHN_DEFAULT_BOARD_CFG } from './vhn-default-board.const';

describe('VHN_DEFAULT_BOARD_CFG', () => {
  it('should have exactly 3 columns', () => {
    expect(VHN_DEFAULT_BOARD_CFG.cols.length).toBe(3);
  });

  it('columns should be: Cần làm, Đang làm, Xong', () => {
    const titles = VHN_DEFAULT_BOARD_CFG.cols.map((c: any) => c.title);
    expect(titles).toEqual(['Cần làm', 'Đang làm', 'Xong']);
  });

  it('Xong column should filter by isDone=true', () => {
    const xongCol = VHN_DEFAULT_BOARD_CFG.cols[2];
    expect((xongCol as any).filter?.isDone).toBeTrue();
  });
});
```
Chạy: kết quả FAILED.

- [ ] **Step 2: Tạo `vhn-default-board.const.ts`**

```typescript
import { BoardCfg } from './boards.model';
import { TODAY_TAG } from '../tag/tag.const';

export const VHN_IN_PROGRESS_TAG_ID = 'VHN_IN_PROGRESS';

export const VHN_DEFAULT_BOARD_CFG: BoardCfg = {
  id: 'VHN_TODAY_BOARD',
  title: 'Hôm nay',
  cols: [
    {
      id: 'col-todo',
      title: 'Cần làm',
      filter: { tagId: TODAY_TAG.id, isDone: false, excludeTagIds: [VHN_IN_PROGRESS_TAG_ID] },
    },
    {
      id: 'col-doing',
      title: 'Đang làm',
      filter: { tagId: VHN_IN_PROGRESS_TAG_ID, isDone: false },
    },
    {
      id: 'col-done',
      title: 'Xong',
      filter: { tagId: TODAY_TAG.id, isDone: true },
    },
  ],
};
```
(Điều chỉnh shape của `filter` cho đúng với interface `BoardColFilter` trong `boards.model.ts` — xem file trước khi viết.)

- [ ] **Step 3: Seed board khi chưa tồn tại**

`src/app/features/boards/boards.component.ts`:
```typescript
// Trong ngOnInit():
this._store.select(selectAllBoardCfgs).pipe(take(1)).subscribe(boards => {
  if (boards.length === 0) {
    this._store.dispatch(BoardsActions.addBoard({ boardCfg: VHN_DEFAULT_BOARD_CFG }));
  }
});
```
(Dùng đúng action name từ `boards.actions.ts`.)

- [ ] **Step 4: Chạy test + build**

```powershell
npx ng test --include=**/vhn-default-board.spec.ts --watch=false 2>&1 | Select-String "FAILED|PASSED|SUCCESS"
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS|✔ Building" | Select -Last 5
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(boards): seed VHN default Today board with 3 columns (Cần làm/Đang làm/Xong)"
```

---

## Task 6: Đóng ngày rút gọn

**Files:**
- Modify: `src/app/pages/daily-summary/daily-summary.component.ts`
- Modify: `src/app/pages/daily-summary/daily-summary.component.html`
- Create: `src/app/pages/daily-summary/vhn-motivational-messages.const.ts`
- Modify: `src/assets/i18n/vi.json` (key `VHN.DAILY_SUMMARY.*`)

**Interfaces:**
- Consumes: `TaskService`, `WorklogService`, `ConfettiService` (đã có); selector `selectAllTasksForToday` (verify tên trong store)
- Produces: method `deferUnfinishedToTomorrow(): void` trên component

- [ ] **Step 1: Viết test cho `deferUnfinishedToTomorrow`**

File: `src/app/pages/daily-summary/daily-summary.vhn.spec.ts`
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DailySummaryComponent } from './daily-summary.component';
import { provideMockStore } from '@ngrx/store/testing';

describe('DailySummaryComponent VHN', () => {
  let fixture: ComponentFixture<DailySummaryComponent>;
  let component: DailySummaryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DailySummaryComponent],
      providers: [provideMockStore({})],
    }).compileComponents();
    fixture = TestBed.createComponent(DailySummaryComponent);
    component = fixture.componentInstance;
  });

  it('should have deferUnfinishedToTomorrow method', () => {
    expect(typeof component.deferUnfinishedToTomorrow).toBe('function');
  });

  it('tomorrow date should be next calendar day using Asia/Ho_Chi_Minh timezone', () => {
    // Gọi method private helper getTomorrowStr()
    const result = (component as any).getTomorrowStr();
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    // result phải là tomorrow (ngày lịch tiếp theo theo TZ Việt Nam)
    expect(result).toBe(tomorrow);
    expect(result).not.toBe(today);
  });
});
```
Chạy: FAILED.

- [ ] **Step 2: Tạo danh sách câu động viên**

File: `src/app/pages/daily-summary/vhn-motivational-messages.const.ts`
```typescript
export const VHN_MOTIVATIONAL_MESSAGES: string[] = [
  'Tuyệt vời! Bạn đã hoàn thành một ngày làm việc hiệu quả! 🎉',
  'Mỗi nhiệm vụ hoàn thành là một bước tiến. Chúc mừng! 💪',
  'Ngày hôm nay đã được ghi lại. Ngày mai hứa hẹn còn tốt hơn! ☀️',
  'Bạn đã làm được! Nghỉ ngơi xứng đáng nhé. 🌙',
  'Một ngày nữa hoàn thành. Tiến độ đáng tự hào! 📈',
  'Công việc hôm nay: đã xong! Bạn thật xuất sắc. ⭐',
  'Từng bước nhỏ tạo nên thành công lớn. Cảm ơn vì hôm nay! 🚀',
];

export function getRandomMotivationalMessage(): string {
  return VHN_MOTIVATIONAL_MESSAGES[
    Math.floor(Math.random() * VHN_MOTIVATIONAL_MESSAGES.length)
  ];
}
```

- [ ] **Step 3: Thêm method vào component**

`daily-summary.component.ts` — thêm:
```typescript
private getTomorrowStr(): string {
  const now = new Date();
  // Tính ngày mai theo TZ Việt Nam
  const todayVN = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  const todayDate = new Date(todayVN);
  todayDate.setDate(todayDate.getDate() + 1);
  return todayDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

deferUnfinishedToTomorrow(): void {
  const tomorrow = this.getTomorrowStr();
  // selectAllUnfinishedTasksForToday — điều chỉnh tên selector cho đúng:
  this._store.select(selectTasksByTag(TODAY_TAG.id)).pipe(take(1)).subscribe(tasks => {
    tasks
      .filter(t => !t.isDone)
      .forEach(t => this._taskService.updateEverywhere(t.id, { dueDay: tomorrow }));
  });
  this._confettiService.showConfetti();
}
```

- [ ] **Step 4: Rút gọn template**

`daily-summary.component.html` — giữ lại:
- Số việc xong / tổng việc (đã có)
- Tổng thời gian theo dõi (đã có)
- Câu động viên ngẫu nhiên: `{{ motivationalMessage }}` (set trong `ngOnInit`)
- Nút **"Dời việc chưa xong sang mai & đóng ngày"** gọi `deferUnfinishedToTomorrow()` rồi navigate về Today
- Confetti (đã có)

Comment-out (không xoá) `<evaluation-sheet>` và `<simple-counter>` với `<!-- VHN: hidden, restore via advanced settings -->`.

- [ ] **Step 5: Chạy test + build**

```powershell
npx ng test --include=**/daily-summary.vhn.spec.ts --watch=false 2>&1 | Select-String "FAILED|PASSED|SUCCESS"
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS|✔ Building" | Select -Last 5
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(daily-summary): VHN simplified finish-day with defer-to-tomorrow + motivational message"
```

---

## Task 7: Morning Ritual — `features/vhn-morning-ritual`

**Files:**
- Create: `src/app/features/vhn-morning-ritual/` (toàn bộ thư mục)
  - `vhn-morning-ritual.component.ts`
  - `vhn-morning-ritual.component.html`
  - `vhn-morning-ritual.component.scss`
  - `vhn-morning-ritual.service.ts`
- Modify: `src/app/app.component.ts` (khởi tạo service, hiện dialog)
- Modify: `src/app/app.component.html` (thêm `<vhn-morning-ritual>`)
- Modify: `src/assets/i18n/vi.json` (key `VHN.MORNING_RITUAL.*`)

**Interfaces:**
- Consumes: `TaskService.add(title, additionalFields)` — xác nhận signature; `TODAY_TAG.id`; `MatDialog` hoặc render inline
- Produces: `VhnMorningRitualService.shouldShowToday(): boolean`; `VhnMorningRitualService.markShownToday(): void`

- [ ] **Step 1: Viết test cho service**

File: `src/app/features/vhn-morning-ritual/vhn-morning-ritual.service.spec.ts`
```typescript
import { VhnMorningRitualService } from './vhn-morning-ritual.service';

describe('VhnMorningRitualService', () => {
  let service: VhnMorningRitualService;

  beforeEach(() => {
    localStorage.clear();
    service = new VhnMorningRitualService();
  });

  it('shouldShowToday returns true when never shown', () => {
    expect(service.shouldShowToday()).toBeTrue();
  });

  it('shouldShowToday returns false after markShownToday called', () => {
    service.markShownToday();
    expect(service.shouldShowToday()).toBeFalse();
  });

  it('shouldShowToday returns true on a new calendar day (Asia/Ho_Chi_Minh)', () => {
    // Giả lập lastRitualDay là hôm qua
    const yesterday = new Date(Date.now() - 86400000)
      .toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    localStorage.setItem('vhn_lastRitualDay', yesterday);
    expect(service.shouldShowToday()).toBeTrue();
  });

  it('shouldShowToday returns false if stored day equals today VN', () => {
    const todayVN = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
    localStorage.setItem('vhn_lastRitualDay', todayVN);
    expect(service.shouldShowToday()).toBeFalse();
  });
});
```
Chạy: FAILED.

- [ ] **Step 2: Implement `VhnMorningRitualService`**

`src/app/features/vhn-morning-ritual/vhn-morning-ritual.service.ts`:
```typescript
import { Injectable } from '@angular/core';

const LS_KEY = 'vhn_lastRitualDay';

@Injectable({ providedIn: 'root' })
export class VhnMorningRitualService {
  private _getTodayVN(): string {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
  }

  shouldShowToday(): boolean {
    const last = localStorage.getItem(LS_KEY);
    return last !== this._getTodayVN();
  }

  markShownToday(): void {
    localStorage.setItem(LS_KEY, this._getTodayVN());
  }
}
```

- [ ] **Step 3: Chạy test service**

```powershell
npx ng test --include=**/vhn-morning-ritual.service.spec.ts --watch=false 2>&1 | Select-String "FAILED|PASSED|SUCCESS"
```
Phải PASSED.

- [ ] **Step 4: Viết test cho việc parse multi-line input**

File: `src/app/features/vhn-morning-ritual/vhn-morning-ritual.component.spec.ts`
```typescript
import { parseTaskLines } from './vhn-morning-ritual.component';

describe('parseTaskLines', () => {
  it('splits by newline and trims', () => {
    expect(parseTaskLines('A\nB\n  C  \n')).toEqual(['A', 'B', 'C']);
  });

  it('ignores empty lines', () => {
    expect(parseTaskLines('A\n\n\nB')).toEqual(['A', 'B']);
  });

  it('returns empty array for blank input', () => {
    expect(parseTaskLines('   \n  \n')).toEqual([]);
  });
});
```
Chạy: FAILED.

- [ ] **Step 5: Implement component**

`vhn-morning-ritual.component.ts`:
```typescript
import { Component, inject, signal } from '@angular/core';
import { TaskService } from '../tasks/task.service';
import { TODAY_TAG } from '../tag/tag.const';
import { VhnMorningRitualService } from './vhn-morning-ritual.service';
import { Router } from '@angular/router';

export function parseTaskLines(input: string): string[] {
  return input.split('\n').map(l => l.trim()).filter(l => l.length > 0);
}

@Component({
  selector: 'vhn-morning-ritual',
  standalone: true,
  templateUrl: './vhn-morning-ritual.component.html',
  styleUrls: ['./vhn-morning-ritual.component.scss'],
  imports: [/* FormsModule, MatButtonModule, MatInputModule, TranslateModule */],
})
export class VhnMorningRitualComponent {
  private _taskService = inject(TaskService);
  private _ritualService = inject(VhnMorningRitualService);
  private _router = inject(Router);

  isVisible = signal(this._ritualService.shouldShowToday());
  taskInput = signal('');
  greeting = this._getGreeting();

  private _getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng! ☀️';
    if (hour < 18) return 'Chào buổi chiều! 🌤️';
    return 'Chào buổi tối! 🌙';
  }

  startDay(): void {
    const lines = parseTaskLines(this.taskInput());
    if (lines.length === 0) {
      this._ritualService.markShownToday();
      this.isVisible.set(false);
      return;
    }
    try {
      lines.forEach(title => {
        this._taskService.add(title, false, {
          tagIds: [TODAY_TAG.id],
          // dueDay: today — thêm nếu TaskService.add hỗ trợ additionalFields
        });
      });
      this._ritualService.markShownToday();
      this.isVisible.set(false);
      this._router.navigate(['/boards']);
    } catch (e) {
      // Lỗi tạo task — không đóng dialog, hiện snackbar
      console.error('VHN: failed to create tasks', e);
    }
  }

  skip(): void {
    this._ritualService.markShownToday();
    this.isVisible.set(false);
  }
}
```
(Kiểm tra signature `TaskService.add()` trong `task.service.ts` trước khi viết — điều chỉnh params cho đúng.)

- [ ] **Step 6: Template + SCSS**

`vhn-morning-ritual.component.html`:
```html
@if (isVisible()) {
  <div class="vhn-ritual-backdrop">
    <div class="vhn-ritual-card">
      <h2>{{ greeting }}</h2>
      <p>Hôm nay bạn cần làm gì?</p>
      <textarea
        [(ngModel)]="taskInput"
        placeholder="Nhập mỗi việc một dòng&#10;Hỗ trợ: #tag, +30m, ! (ưu tiên cao)"
        rows="6"
        autofocus
      ></textarea>
      <div class="vhn-ritual-actions">
        <button mat-stroked-button (click)="skip()">Bỏ qua</button>
        <button mat-raised-button color="primary" (click)="startDay()">
          Bắt đầu ngày làm việc ▶
        </button>
      </div>
    </div>
  </div>
}
```

`vhn-morning-ritual.component.scss`:
```scss
.vhn-ritual-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
}
.vhn-ritual-card {
  background: var(--card-bg);
  border-radius: 16px; padding: 32px; width: 480px; max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  h2 { margin: 0 0 8px; color: var(--brand); font-size: 1.6rem; }
  p { color: var(--text-color); margin: 0 0 16px; }
  textarea { width: 100%; box-sizing: border-box; resize: vertical;
    border: 1px solid var(--brand); border-radius: 8px; padding: 12px;
    font-size: 1rem; background: var(--bg); color: var(--text-color); }
}
.vhn-ritual-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
```

- [ ] **Step 7: Đăng ký component vào app.component**

`src/app/app.component.html` — thêm trước `</div>` cuối cùng:
```html
<vhn-morning-ritual />
```
`app.component.ts` — thêm `VhnMorningRitualComponent` vào `imports` array.

- [ ] **Step 8: Chạy test + build**

```powershell
npx ng test --include=**/vhn-morning-ritual* --watch=false 2>&1 | Select-String "FAILED|PASSED|SUCCESS"
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS|✔ Building" | Select -Last 5
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(vhn-morning-ritual): daily startup dialog with multi-task input and auto-tag Today"
```

---

## Task 8: Báo cáo năm — `features/vhn-year-review`

**Files:**
- Create: `src/app/features/vhn-year-review/` (toàn thư mục)
  - `vhn-year-review.component.ts`
  - `vhn-year-review.component.html`
  - `vhn-year-review.component.scss`
  - `vhn-heatmap.component.ts` (SVG heatmap)
  - `vhn-heatmap.component.html`
  - `vhn-year-review.service.ts`
  - `vhn-year-review.service.spec.ts`
  - `vhn-heatmap.component.spec.ts`
  - `vhn-excel-export.service.ts`
- Modify: `src/app/app.routes.ts` (thêm route `/year-review`)
- Modify: `src/assets/i18n/vi.json` (key `VHN.YEAR_REVIEW.*`)

**Interfaces:**
- Consumes: `WorklogService` (WorklogYear/Month/Day); `TaskArchiveService.getArchiveTasksForRange(start, end)`; `ProjectService.projects$`; Angular CDK/Material.
- Produces: route `/year-review`; `VhnYearReviewService.getYearData(year): YearData`; `VhnHeatmapComponent` input `@Input() data: HeatmapDay[]`.

- [ ] **Step 1: Viết test cho service — KPI và heatmap data**

`src/app/features/vhn-year-review/vhn-year-review.service.spec.ts`:
```typescript
import { VhnYearReviewService, buildHeatmapDays, computeKpis } from './vhn-year-review.service';

describe('buildHeatmapDays', () => {
  it('returns 365 entries for a non-leap year', () => {
    const days = buildHeatmapDays(2025, {});
    expect(days.length).toBe(365);
  });

  it('returns 366 entries for 2024 (leap year)', () => {
    const days = buildHeatmapDays(2024, {});
    expect(days.length).toBe(366);
  });

  it('maps done count correctly', () => {
    const doneCounts = { '2025-03-15': 5 };
    const days = buildHeatmapDays(2025, doneCounts);
    const march15 = days.find(d => d.date === '2025-03-15');
    expect(march15?.count).toBe(5);
  });
});

describe('computeKpis', () => {
  it('calculates longest streak correctly', () => {
    // 3 ngày liên tiếp
    const doneCounts = { '2025-01-01': 2, '2025-01-02': 3, '2025-01-03': 1 };
    const kpis = computeKpis(buildHeatmapDays(2025, doneCounts));
    expect(kpis.longestStreak).toBe(3);
  });

  it('longestStreak is 0 when no tasks done', () => {
    const kpis = computeKpis(buildHeatmapDays(2025, {}));
    expect(kpis.longestStreak).toBe(0);
  });
});
```
Chạy: FAILED.

- [ ] **Step 2: Implement service**

`vhn-year-review.service.ts`:
```typescript
import { Injectable, inject } from '@angular/core';
import { WorklogService } from '../worklog/worklog.service';

export interface HeatmapDay { date: string; count: number; }
export interface YearKpis { totalDone: number; activeDays: number; longestStreak: number; totalTrackedMs: number; }

export function buildHeatmapDays(year: number, doneCounts: Record<string, number>): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const total = isLeap ? 366 : 365;
  const start = new Date(`${year}-01-01T00:00:00`);
  for (let i = 0; i < total; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({ date: dateStr, count: doneCounts[dateStr] ?? 0 });
  }
  return days;
}

export function computeKpis(days: HeatmapDay[]): YearKpis {
  let totalDone = 0, activeDays = 0, longestStreak = 0, currentStreak = 0;
  for (const d of days) {
    totalDone += d.count;
    if (d.count > 0) { activeDays++; currentStreak++; longestStreak = Math.max(longestStreak, currentStreak); }
    else { currentStreak = 0; }
  }
  return { totalDone, activeDays, longestStreak, totalTrackedMs: 0 };
}

@Injectable({ providedIn: 'root' })
export class VhnYearReviewService {
  private _worklogService = inject(WorklogService);

  getDoneCountsByDay$(year: number) {
    // Trả về Observable<Record<string, number>>
    // Map worklog data: với mỗi ngày, đếm task có doneOn trong năm đó
    return this._worklogService.worklogData$.pipe(
      // ... mapping logic dựa trên API thực tế của WorklogService
    );
  }
}
```
(Điều chỉnh cách lấy dữ liệu worklog cho đúng API của `WorklogService` — xem `worklog.service.ts` trước.)

- [ ] **Step 3: Chạy test service**

```powershell
npx ng test --include=**/vhn-year-review.service.spec.ts --watch=false 2>&1 | Select-String "FAILED|PASSED|SUCCESS"
```

- [ ] **Step 4: Viết test cho HeatmapComponent**

`vhn-heatmap.component.spec.ts`:
```typescript
import { buildHeatmapDays } from './vhn-year-review.service';

describe('buildHeatmapDays grid layout', () => {
  it('has 53 weeks worth of cells for a year starting Mon', () => {
    // 2024-01-01 là Thứ Hai
    const days = buildHeatmapDays(2024, {});
    // 53 tuần * 7 = 371 cells, nhưng chỉ 366 ngày thực — phần còn lại là placeholder
    expect(days.length).toBe(366);
  });
});
```

- [ ] **Step 5: Implement HeatmapComponent**

`vhn-heatmap.component.ts`:
```typescript
import { Component, input, computed } from '@angular/core';
import { HeatmapDay } from './vhn-year-review.service';

@Component({
  selector: 'vhn-heatmap',
  standalone: true,
  templateUrl: './vhn-heatmap.component.html',
  styleUrls: ['../vhn-morning-ritual/vhn-morning-ritual.component.scss'],
})
export class VhnHeatmapComponent {
  data = input<HeatmapDay[]>([]);

  readonly CELL_SIZE = 14;
  readonly GAP = 2;

  // Nhóm theo tuần (cột), mỗi tuần 7 ngày (hàng)
  weeks = computed(() => {
    const days = this.data();
    if (!days.length) return [];
    // Tìm dayOfWeek của ngày đầu (0=Sun, điều chỉnh để 0=Mon)
    const firstDow = (new Date(days[0].date).getDay() + 6) % 7;
    const padded: (HeatmapDay | null)[] = [
      ...Array(firstDow).fill(null),
      ...days,
    ];
    const weeks: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));
    return weeks;
  });

  colorForCount(count: number): string {
    if (!count) return 'var(--surface-0)';
    if (count < 2) return '#6ee7b7';   // emerald-200
    if (count < 5) return '#34d399';   // emerald-400
    if (count < 10) return '#10b981';  // emerald-500
    return '#059669';                  // emerald-600
  }
}
```

`vhn-heatmap.component.html`:
```html
<svg
  [attr.width]="(weeks().length) * (CELL_SIZE + GAP)"
  [attr.height]="7 * (CELL_SIZE + GAP)"
  style="display:block">
  @for (week of weeks(); track $index; let wi = $index) {
    @for (day of week; track $index; let di = $index) {
      @if (day) {
        <rect
          [attr.x]="wi * (CELL_SIZE + GAP)"
          [attr.y]="di * (CELL_SIZE + GAP)"
          [attr.width]="CELL_SIZE"
          [attr.height]="CELL_SIZE"
          [attr.fill]="colorForCount(day.count)"
          rx="2"
          [matTooltip]="day.date + ': ' + day.count + ' việc'"
        />
      }
    }
  }
</svg>
```

- [ ] **Step 6: Implement YearReview component (shell)**

`vhn-year-review.component.ts` — tạo component với tab Năm/Tháng/Tuần, selector năm, hiển thị heatmap và KPI cards. Nút "Xuất .xlsx" gọi `VhnExcelExportService.export()`.

- [ ] **Step 7: Implement Excel export (lazy)**

`vhn-excel-export.service.ts`:
```typescript
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VhnExcelExportService {
  async export(yearData: any, year: number): Promise<void> {
    // Import động — chỉ tải exceljs khi người dùng bấm nút
    const ExcelJS = await import('exceljs');
    const wb = new ExcelJS.Workbook();

    // Sheet 1: Tổng quan
    const ws1 = wb.addWorksheet('Tổng quan');
    ws1.addRow(['Năm', year]);
    ws1.addRow(['Tổng việc hoàn thành', yearData.kpis.totalDone]);
    ws1.addRow(['Ngày hoạt động', yearData.kpis.activeDays]);
    ws1.addRow(['Chuỗi ngày dài nhất', yearData.kpis.longestStreak]);

    // Sheet 2: Chi tiết task
    const ws2 = wb.addWorksheet('Chi tiết task');
    ws2.addRow(['Ngày hoàn thành', 'Tiêu đề', 'Dự án', 'Tags', 'Thời gian (phút)']);
    for (const task of yearData.tasks ?? []) {
      ws2.addRow([task.doneOn, task.title, task.projectName, task.tags, Math.round((task.timeSpent ?? 0) / 60000)]);
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `viec-hom-nay-${year}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  }
}
```

Thêm `exceljs` vào dependencies:
```powershell
npm install exceljs --save
```

- [ ] **Step 8: Thêm route `/year-review`**

`src/app/app.routes.ts`:
```typescript
{
  path: 'year-review',
  loadComponent: () => import('./features/vhn-year-review/vhn-year-review.component')
    .then(m => m.VhnYearReviewComponent),
},
```

- [ ] **Step 9: Build + test**

```powershell
npx ng test --include=**/vhn-year-review* --include=**/vhn-heatmap* --watch=false 2>&1 | Select-String "FAILED|PASSED|SUCCESS"
npx ng build --configuration=productionWeb 2>&1 | Select-String "error TS|✔ Building" | Select -Last 5
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(vhn-year-review): heatmap, KPI dashboard, Excel export with lazy exceljs"
```

---

## Task 9: Web production build & Docker smoke test

**Files:**
- Modify: `docker-compose.yaml` (port mapping rõ ràng, image name)
- Modify: `nginx/` (nếu cần điều chỉnh caching header cho PWA)

**Interfaces:**
- Consumes: `npm run buildFrontend:prodWeb`; `docker compose up`
- Produces: PWA chạy tại `http://localhost:8080`

- [ ] **Step 1: Chạy web production build**

```powershell
npm run buildFrontend:prodWeb 2>&1 | Select-String "error|warning|✔ Building" | Select -Last 10
```
Phải xanh.

- [ ] **Step 2: Chạy Docker**

```powershell
docker compose up -d
Start-Sleep -Seconds 5
Invoke-WebRequest http://localhost:8080 -UseBasicParsing | Select-Object StatusCode,Content
```
StatusCode phải là 200, Content chứa `Việc Hôm Nay`.

- [ ] **Step 3: Kiểm tra PWA installable**

Mở Chrome → `http://localhost:8080` → DevTools → Application → Manifest.
Trường `name` phải hiện `Việc Hôm Nay`.

- [ ] **Step 4: Stop Docker**

```powershell
docker compose down
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: confirm web production build + Docker serve OK"
```

---

## Task 10: Build Windows installer (NSIS)

**Files:**
- Modify: `electron-builder.yaml` (xoá comment `identityName` chưa có, giữ Windows NSIS target)
- Verify: `npm run dist:win`

**Interfaces:**
- Consumes: toàn bộ code đã build ở Task 1–8
- Produces: `.tmp/app-builds/Viec-Hom-Nay-x64.exe`

- [ ] **Step 1: Build Electron production**

```powershell
npm run dist:win 2>&1 | Select-String "error|✔|target" | Select -Last 20
```

- [ ] **Step 2: Kiểm tra file output**

```powershell
Get-ChildItem .tmp\app-builds -Filter *.exe | Select Name,Length
```
Tên phải là `Viec-Hom-Nay-x64.exe` (theo `artifactName` đã đặt), kích thước > 80MB.

- [ ] **Step 3: Cài và kiểm tra thủ công**

- Chạy `.exe`, chấp nhận SmartScreen
- Kiểm tra: tiêu đề cửa sổ = `Việc Hôm Nay`, tray icon hiện, Morning Ritual xuất hiện khi khởi động lần đầu
- Cài đặt → shortcut Start Menu hiện `Việc Hôm Nay`

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: Windows NSIS build verified (Viec-Hom-Nay-x64.exe)"
```

---

## Checklist Spec Coverage

| Spec requirement | Task |
|---|---|
| Đổi appId, productName, tên cửa sổ, tray, installer | Task 1 |
| Ngôn ngữ mặc định vi, firstDayOfWeek=1, locale vi-VN | Task 1 Step 9 |
| Màu brand #10B981, accent #F59E0B | Task 2 |
| Logo placeholder | Task 2 |
| Xoá issue providers Jira/GitLab/OpenProject/Redmine/Nextcloud/Caldav/Plainspace | Task 3 |
| Xoá Plugin system, Donate, Please-rate, SuperSync UI | Task 3 |
| Giữ Habits, Focus mode, Pomodoro | Không có Task xoá — giữ nguyên |
| Sidebar 7 mục cố định | Task 4 |
| Kanban mặc định 3 cột Hôm nay | Task 5 |
| Đóng ngày rút gọn + dời task sang mai (TZ Asia/Ho_Chi_Minh) | Task 6 |
| Morning Ritual dialog | Task 7 |
| Báo cáo năm: heatmap SVG, KPI, xuất Excel (lazy exceljs) | Task 8 |
| Route /year-review | Task 8 |
| Web production + Docker | Task 9 |
| Windows NSIS installer | Task 10 |
| BroadcastChannel tên mới (tránh xung đột với bản gốc) | Task 1 Step 8 |
| Disable upstream update-check | Task 1 Step 8 |
| Attribution MIT trong README | Task 1 Step 13 |
