# ===================================================================================
#  Script PowerShell (.ps1) para iniciar o ambiente de desenvolvimento do BetFit
#  Autor: Gemini
#  Data: 13/09/2025
#
#  NOTA: Para executar este script, a politica de execucao do PowerShell
#  precisa ser alterada (veja as instrucoes no final).
# ===================================================================================

Write-Host "+-+-+-+-+-+-+-+-+-+-+-+-+-+" -ForegroundColor Green
Write-Host "| S T A R T I N G   B E T F I T |" -ForegroundColor Green
Write-Host "+-+-+-+-+-+-+-+-+-+-+-+-+-+" -ForegroundColor Green
Write-Host ""
Write-Host "Abrindo janelas de servico..."
Write-Host ""

# --- 1. Argumentos para o Backend ---
$backendArgs = "& {
    `$host.UI.RawUI.WindowTitle = 'BetFit Backend';
    Write-Host '--- [BACKEND] Navegando para a pasta...' -ForegroundColor Green;
    Set-Location 'C:\Temp\BetFit\backend';
    
    if (-not (Test-Path .\venv)) {
        Write-Host '--- [BACKEND] Ambiente virtual nao encontrado. Criando `venv`...' -ForegroundColor Yellow;
        python -m venv venv;
    };
    
    Write-Host '--- [BACKEND] Ativando ambiente virtual e iniciando servidor Flask...' -ForegroundColor Green;
    .\venv\Scripts\activate; 
    python src\main.py;
}"
Start-Process powershell -ArgumentList $backendArgs

# --- Pequena pausa ---
Start-Sleep -Seconds 2

# --- 2. Argumentos para o Frontend ---
$frontendArgs = "& {
    `$host.UI.RawUI.WindowTitle = 'BetFit Frontend';
    Write-Host '--- [FRONTEND] Navegando para a pasta...' -ForegroundColor Cyan;
    Set-Location 'C:\Temp\BetFit\frontend';
    
    Write-Host '--- [FRONTEND] Instalando dependencias (npm install)...' -ForegroundColor Cyan;
    npm install;
    
    Write-Host '--- [FRONTEND] Iniciando servidor de desenvolvimento (npm run dev)...' -ForegroundColor Cyan;
    npm run dev;
}"
Start-Process powershell -ArgumentList $frontendArgs

# --- Mais uma pequena pausa ---
Start-Sleep -Seconds 2

# --- 3. Argumentos para o Painel de Administracao ---
$adminArgs = "& {
    `$host.UI.RawUI.WindowTitle = 'BetFit Admin Panel';
    Write-Host '--- [ADMIN] Navegando para a pasta...' -ForegroundColor Yellow;
    Set-Location 'C:\Temp\BetFit\admin';

    Write-Host '--- [ADMIN] Instalando dependencias (npm install)...' -ForegroundColor Yellow;
    npm install;
    
    Write-Host '--- [ADMIN] Fazendo o build para producao (npm run build)...' -ForegroundColor Yellow;
    npm run build;
    
    Write-Host '--- [ADMIN] Servindo o build na porta 8080...' -ForegroundColor Yellow;
    npx serve -s dist -l 8080;
}"
Start-Process powershell -ArgumentList $adminArgs


Write-Host "====================================================================" -ForegroundColor Green
Write-Host " TODOS OS SERVICOS FORAM INICIADOS EM JANELAS SEPARADAS."
Write-Host "===================================================================="
Write-Host ""
# Mantem a janela principal aberta por alguns segundos para ler a mensagem
Start-Sleep -Seconds 10