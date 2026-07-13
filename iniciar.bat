@echo off
title Sistema Financeiro Alpha
cd /d "%~dp0"

echo.
echo  ========================================
echo   SISTEMA FINANCEIRO ALPHA - v2.0
echo  ========================================
echo.

:: Verifica se Node.js esta instalado
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERRO] Node.js nao encontrado!
    echo.
    echo  Por favor, instale o Node.js antes de continuar:
    echo  1. Acesse: https://nodejs.org
    echo  2. Baixe a versao LTS
    echo  3. Instale e reinicie o computador
    echo  4. Execute este arquivo novamente
    echo.
    pause
    start "" "https://nodejs.org"
    exit /b 1
)

:: Verifica node_modules
if not exist "node_modules" (
    echo  Instalando dependencias pela primeira vez, aguarde...
    call npm install --silent
    if errorlevel 1 (
        echo  [ERRO] Falha ao instalar dependencias.
        pause
        exit /b 1
    )
    echo  Dependencias instaladas com sucesso!
    echo.
)

:: Verifica se dist existe, se nao builda
if not exist "dist\index.html" (
    echo  Gerando build de producao...
    call npm run build --silent
    if errorlevel 1 (
        echo  [ERRO] Falha ao gerar build.
        pause
        exit /b 1
    )
    echo  Build concluido!
    echo.
)

:: Mata processo anterior na porta 4173 se houver
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4173 "') do (
    taskkill /f /pid %%a >nul 2>&1
)

:: Inicia o servidor em background
echo  Iniciando servidor...
start /B npm run preview -- --port 4173

:: Aguarda e abre o browser
timeout /t 2 /nobreak >nul
start "" "http://localhost:4173"

echo  Sistema rodando em: http://localhost:4173
echo.
echo  Mantenha esta janela aberta enquanto usar o sistema.
echo  Feche esta janela para encerrar o servidor.
echo.

:loop
timeout /t 5 /nobreak >nul
curl -s -o nul http://localhost:4173 >nul 2>&1
if errorlevel 1 goto fim
goto loop

:fim
echo  Servidor encerrado.
pause
