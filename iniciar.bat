@echo off
title Control Platano - Volante Virtual
color 0A

echo ===================================================
echo   🎮 Iniciando Sistema de Control (Mario Kart) 🎮
echo ===================================================
echo.

echo [1/2] Compilando el controlador de teclado (.NET)...
cd net\NetAppModern
dotnet build -c Release
if %errorlevel% neq 0 (
    echo Error al compilar el proyecto .NET
    pause
    exit /b %errorlevel%
)
cd ..\..
echo Controlador compilado correectamente.
echo.

echo [2/2] Iniciando el servidor web (Node.js)...
cd node
if not exist node_modules (
    echo Instalando dependencias de Node...
    call npm install
)

echo.
echo ===================================================
echo   🚀 SERVIDOR ACTIVO 🚀
echo.
echo   Abre tu navegador (Chrome/Edge recomendado) en:
echo   http://localhost:3000/manos.html
echo ===================================================
echo.
node index.js

pause
