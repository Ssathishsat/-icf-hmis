@echo off
echo ============================================
echo  ICF HMIS - MySQL Password Reset Tool
echo ============================================
echo.
echo This will reset MySQL root password to: Admin@123
echo Run this file as ADMINISTRATOR
echo.

:: Stop MySQL
echo [1/5] Stopping MySQL service...
net stop MySQL80
timeout /t 3 /nobreak >nul

:: Create init file
echo [2/5] Creating password reset file...
echo ALTER USER 'root'@'localhost' IDENTIFIED BY 'Admin@123'; > "%TEMP%\mysql_reset.sql"
echo FLUSH PRIVILEGES; >> "%TEMP%\mysql_reset.sql"

:: Start MySQL with skip-grant-tables
echo [3/5] Starting MySQL in recovery mode...
start /B "" "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqld.exe" --skip-grant-tables --skip-networking
timeout /t 5 /nobreak >nul

:: Reset password
echo [4/5] Resetting password...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root --connect-expired-password < "%TEMP%\mysql_reset.sql"

:: Stop recovery mode and restart normally
echo [5/5] Restarting MySQL normally...
taskkill /F /IM mysqld.exe >nul 2>&1
timeout /t 3 /nobreak >nul
net start MySQL80
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo  DONE! MySQL root password is now: Admin@123
echo ============================================
echo.
pause
