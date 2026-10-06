@echo off
chcp 65001 >nul
title Việc Hôm Nay - 1-Click Setup & Launcher
cls

echo =====================================================================
echo                 🌟 VIỆC HÔM NAY - 1-CLICK SETUP 🌟
echo       Ứng dụng quản lý công việc hằng ngày cho người Việt
echo =====================================================================
echo.

:: 1. Kiểm tra Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Chưa tìm thấy Node.js trên máy tính của bạn!
    echo Vui lòng cài đặt Node.js phiên bản 20 hoặc 22 từ https://nodejs.org/
    echo Sau đó mở lại script này.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [✓] Đã phát hiện Node.js phiên bản: %NODE_VER%

:: 2. Kiểm tra node_modules
if not exist "node_modules\" (
    echo.
    echo [*] Thư viện chưa được cài đặt. Đang tự động chạy 'npm install'...
    echo Quá trình này có thể mất từ 1 - 3 phút tùy tốc độ mạng...
    call npm install
    if %errorlevel% neq 0 (
        echo [LỖI] Cài đặt dependencies thất bại. Vui lòng kiểm tra kết nối mạng!
        pause
        exit /b 1
    )
    echo [✓] Cài đặt dependencies thành công!
)

:MENU
echo.
echo =====================================================================
echo                     CHỌN HÀNH ĐỘNG BẠN MUỐN THỰC HIỆN:
echo =====================================================================
echo   [1] Khởi chạy Web App (Trình duyệt - http://localhost:4200)
echo   [2] Khởi chạy Desktop App (Electron Windows)
echo   [3] Đóng gói bản cài đặt Windows (.exe Installer vào .tmp/app-builds)
echo   [4] Build Web Production (PWA)
echo   [5] Thoát
echo =====================================================================
set /p CHOICE="Nhập lựa chọn của bạn (1-5): "

if "%CHOICE%"=="1" goto RUN_WEB
if "%CHOICE%"=="2" goto RUN_DESKTOP
if "%CHOICE%"=="3" goto BUILD_WIN
if "%CHOICE%"=="4" goto BUILD_WEB
if "%CHOICE%"=="5" goto EXIT
echo Lựa chọn không hợp lệ. Vui lòng chọn từ 1 đến 5.
goto MENU

:RUN_WEB
echo.
echo [*] Đang khởi động Web App trên cổng 4200...
start "" "http://localhost:4200"
call npm run serve
goto MENU

:RUN_DESKTOP
echo.
echo [*] Đang biên dịch và khởi chạy Việc Hôm Nay Desktop...
call npm run start
goto MENU

:BUILD_WIN
echo.
echo [*] Đang tiến hành đóng gói bộ cài đặt Windows (.exe)...
echo Quá trình này sẽ mất 3 - 5 phút...
call npm run dist:win
echo.
echo [✓] Hoàn tất! File cài đặt được lưu tại: .tmp\app-builds\
explorer ".tmp\app-builds"
pause
goto MENU

:BUILD_WEB
echo.
echo [*] Đang tiến hành build Web Production PWA...
call npm run buildFrontend:prodWeb
echo [✓] Hoàn tất build Web! Thư mục xuất: .tmp\angular-dist\browser\
pause
goto MENU

:EXIT
echo Cảm ơn bạn đã sử dụng Việc Hôm Nay!
exit /b 0
