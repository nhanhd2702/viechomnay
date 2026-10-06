# =====================================================================
#                 🌟 VIỆC HÔM NAY - 1-CLICK SETUP (POWERSHELL) 🌟
# =====================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Clear-Host

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "                🌟 VIỆC HÔM NAY - 1-CLICK SETUP 🌟" -ForegroundColor Yellow
Write-Host "       Ứng dụng quản lý công việc hằng ngày cho người Việt" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Kiểm tra Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[LỖI] Chưa tìm thấy Node.js trên máy tính!" -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Node.js phiên bản 20 hoặc 22 từ https://nodejs.org/"
    Read-Host "Nhấn Enter để thoát..."
    exit 1
}

$nodeVer = node -v
Write-Host "[✓] Đã phát hiện Node.js phiên bản: $nodeVer" -ForegroundColor Green

# 2. Kiểm tra node_modules
if (-not (Test-Path "node_modules")) {
    Write-Host "`n[*] Đang tự động cài đặt thư viện (npm install)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[LỖI] Cài đặt dependencies thất bại!" -ForegroundColor Red
        Read-Host "Nhấn Enter để thoát..."
        exit 1
    }
    Write-Host "[✓] Cài đặt dependencies thành công!" -ForegroundColor Green
}

function Show-Menu {
    Write-Host "`n=====================================================================" -ForegroundColor Cyan
    Write-Host "                     CHỌN HÀNH ĐỘNG BẠN MUỐN THỰC HIỆN:" -ForegroundColor Yellow
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host "  [1] Khởi chạy Web App (Trình duyệt - http://localhost:4200)" -ForegroundColor White
    Write-Host "  [2] Khởi chạy Desktop App (Electron Windows)" -ForegroundColor White
    Write-Host "  [3] Đóng gói bản cài đặt Windows (.exe Installer vào .tmp/app-builds)" -ForegroundColor White
    Write-Host "  [4] Build Web Production (PWA)" -ForegroundColor White
    Write-Host "  [5] Thoát" -ForegroundColor Gray
    Write-Host "=====================================================================" -ForegroundColor Cyan
}

do {
    Show-Menu
    $choice = Read-Host "Nhập lựa chọn của bạn (1-5)"

    switch ($choice) {
        '1' {
            Write-Host "`n[*] Đang khởi động Web App trên cổng 4200..." -ForegroundColor Green
            Start-Process "http://localhost:4200"
            npm run serve
        }
        '2' {
            Write-Host "`n[*] Đang biên dịch và khởi chạy Việc Hôm Nay Desktop..." -ForegroundColor Green
            npm run start
        }
        '3' {
            Write-Host "`n[*] Đang tiến hành đóng gói bộ cài đặt Windows (.exe)..." -ForegroundColor Green
            npm run dist:win
            Write-Host "[✓] Hoàn tất! Đang mở thư mục chứa file cài đặt..." -ForegroundColor Green
            explorer ".tmp\app-builds"
        }
        '4' {
            Write-Host "`n[*] Đang build Web Production PWA..." -ForegroundColor Green
            npm run buildFrontend:prodWeb
            Write-Host "[✓] Hoàn tất build Web tại: .tmp\angular-dist\browser\" -ForegroundColor Green
        }
        '5' {
            Write-Host "Cảm ơn bạn đã sử dụng Việc Hôm Nay!" -ForegroundColor Cyan
            break
        }
        default {
            Write-Host "Lựa chọn không hợp lệ, vui lòng chọn từ 1 đến 5." -ForegroundColor Red
        }
    }
} while ($choice -ne '5')
