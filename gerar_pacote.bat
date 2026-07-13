@echo off
title Gerando pacote de instalacao...
cd /d "%~dp0"

echo.
echo  ========================================
echo   GERANDO PACOTE DE INSTALACAO
echo  ========================================
echo.

set "DATA=%date:~6,4%-%date:~3,2%-%date:~0,2%"
set "DESTINO=C:\Alpha\SistemaFinanceiro_Alpha_%DATA%.zip"
set "TEMP_DIR=C:\Alpha\_pacote_temp"

if exist "%DESTINO%" del "%DESTINO%"
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo  Copiando arquivos...

:: Copia apenas o necessario (sem node_modules, dist, .git, .claude)
robocopy "%~dp0src"              "%TEMP_DIR%\src"    /E /NFL /NDL /NJH /NJS >nul
robocopy "%~dp0public"          "%TEMP_DIR%\public" /E /NFL /NDL /NJH /NJS >nul
copy "%~dp0package.json"        "%TEMP_DIR%\" >nul
copy "%~dp0package-lock.json"   "%TEMP_DIR%\" >nul
copy "%~dp0vite.config.js"      "%TEMP_DIR%\" >nul
copy "%~dp0index.html"          "%TEMP_DIR%\" >nul
copy "%~dp0iniciar.bat"         "%TEMP_DIR%\" >nul

echo  Compactando...

powershell -NoProfile -Command "Compress-Archive -Path '%TEMP_DIR%\*' -DestinationPath '%DESTINO%' -CompressionLevel Optimal"

rd /s /q "%TEMP_DIR%"

if exist "%DESTINO%" (
    echo.
    echo  Pacote gerado com sucesso!
    echo  Arquivo: %DESTINO%
    echo.
    echo  Para instalar em outro computador:
    echo  1. Copie o ZIP para o outro computador
    echo  2. Extraia em qualquer pasta
    echo  3. Instale o Node.js em nodejs.org  (versao LTS)
    echo  4. Clique duas vezes em  iniciar.bat
    echo.
) else (
    echo  [ERRO] Falha ao gerar o pacote.
)

pause
