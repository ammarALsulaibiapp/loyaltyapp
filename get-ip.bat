@echo off
echo ========================================
echo YOUR COMPUTER'S IP ADDRESS
echo ========================================
echo.
ipconfig | findstr /C:"IPv4"
echo.
echo ========================================
echo Use this IP in your QR code URL
echo Example: http://192.168.1.100:3000
echo ========================================
pause
