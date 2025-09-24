# ==================== INICIALIZADOR BETFIT ====================
# Script para iniciar todos os serviços do BetFit
# Versão: 2.0.0 - Melhorada e Otimizada

param(
    [string]$BasePath = "D:\Sistemas\BetFit",
    [switch]$SkipBrowser,
    [switch]$Verbose
)

# Configurações
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Cores para output
$Colors = @{
    Title = "Cyan"
    Success = "Green" 
    Warning = "Yellow"
    Error = "Red"
    Info = "Blue"
    Highlight = "Magenta"
}

# Função para log com cores
function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$Prefix = ""
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    if ($Prefix) {
        Write-Host "[$timestamp] $Prefix $Message" -ForegroundColor $Color
    } else {
        Write-Host "[$timestamp] $Message" -ForegroundColor $Color
    }
}

# Função para verificar se porta está em uso
function Test-Port {
    param([int]$Port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Função para aguardar serviço ficar online
function Wait-ForService {
    param(
        [string]$Name,
        [int]$Port,
        [int]$TimeoutSeconds = 60
    )
    
    Write-ColorLog "Aguardando $Name ficar online na porta $Port..." -Color $Colors.Info -Prefix "⏳"
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-Port -Port $Port) {
            Write-ColorLog "$Name está online!" -Color $Colors.Success -Prefix "✅"
            return $true
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
        
        if ($Verbose) {
            Write-ColorLog "Tentativa $($elapsed/2)... ($elapsed/$TimeoutSeconds segundos)" -Color $Colors.Warning
        }
    }
    
    Write-ColorLog "$Name não ficou online em $TimeoutSeconds segundos" -Color $Colors.Error -Prefix "❌"
    return $false
}

# Função para iniciar serviço em nova janela
function Start-ServiceWindow {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command,
        [int]$Port,
        [string]$Icon = "🚀"
    )

    Write-ColorLog "Iniciando $Name..." -Color $Colors.Info -Prefix $Icon
    
    # Verificar se o diretório existe
    if (-not (Test-Path $Path)) {
        Write-ColorLog "Diretório não encontrado: $Path" -Color $Colors.Error -Prefix "❌"
        return $false
    }
    
    # Verificar se a porta já está em uso
    if (Test-Port -Port $Port) {
        Write-ColorLog "$Name já está rodando na porta $Port" -Color $Colors.Warning -Prefix "⚠️"
        return $true
    }
    
    # Comando completo para executar
    $fullCommand = @"
Set-Location '$Path'
Write-Host '🚀 Iniciando $Name...' -ForegroundColor Cyan
Write-Host 'Diretório: $Path' -ForegroundColor Blue
Write-Host 'Porta: $Port' -ForegroundColor Blue
Write-Host '================================' -ForegroundColor Cyan
$Command
"@
    
    # Iniciar em nova janela do PowerShell
    try {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", $fullCommand -WindowStyle Normal
        Write-ColorLog "$Name iniciado em nova janela" -Color $Colors.Success -Prefix "✅"
        return $true
    } catch {
        Write-ColorLog "Erro ao iniciar $Name: $($_.Exception.Message)" -Color $Colors.Error -Prefix "❌"
        return $false
    }
}

# Função para verificar dependências
function Test-Dependencies {
    Write-ColorLog "Verificando dependências..." -Color $Colors.Info -Prefix "🔍"
    
    $dependencies = @(
        @{ Name = "Python"; Command = "python"; Required = $true },
        @{ Name = "Node.js"; Command = "node"; Required = $true },
        @{ Name = "NPM"; Command = "npm"; Required = $true }
    )
    
    $allOk = $true
    
    foreach ($dep in $dependencies) {
        try {
            $null = Get-Command $dep.Command -ErrorAction Stop
            Write-ColorLog "$($dep.Name) encontrado" -Color $Colors.Success -Prefix "✅"
        } catch {
            Write-ColorLog "$($dep.Name) não encontrado" -Color $Colors.Error -Prefix "❌"
            if ($dep.Required) {
                $allOk = $false
            }
        }
    }
    
    return $allOk
}

# Função principal
function Start-BetFitSystem {
    # Header
    Clear-Host
    Write-Host ""
    Write-Host "🎯 ====================================== 🎯" -ForegroundColor $Colors.Title
    Write-Host "🚀        SISTEMA BETFIT v2.0.0        🚀" -ForegroundColor $Colors.Title  
    Write-Host "🎯 ====================================== 🎯" -ForegroundColor $Colors.Title
    Write-Host ""
    
    Write-ColorLog "Caminho base: $BasePath" -Color $Colors.Info -Prefix "📁"
    Write-Host ""
    
    # Verificar se o diretório base existe
    if (-not (Test-Path $BasePath)) {
        Write-ColorLog "Diretório base não encontrado: $BasePath" -Color $Colors.Error -Prefix "❌"
        Write-ColorLog "Execute primeiro o script de instalação: .\scripts\install.ps1" -Color $Colors.Warning -Prefix "💡"
        return
    }
    
    # Verificar dependências
    if (-not (Test-Dependencies)) {
        Write-ColorLog "Dependências não atendidas. Execute o instalador primeiro." -Color $Colors.Error -Prefix "❌"
        return
    }
    
    Write-Host ""
    Write-ColorLog "Iniciando serviços do BetFit..." -Color $Colors.Highlight -Prefix "🚀"
    Write-Host ""
    
    # 1. Backend (API Flask)
    $backendStarted = Start-ServiceWindow -Name "Backend API" `
        -Path "$BasePath\backend" `
        -Command "if (-not (Test-Path 'venv')) { python -m venv venv }; & .\venv\Scripts\Activate.ps1; python src\main.py" `
        -Port 5001 `
        -Icon "🐍"
    
    if ($backendStarted) {
        Wait-ForService -Name "Backend API" -Port 5001 -TimeoutSeconds 30
    }
    
    Start-Sleep -Seconds 3
    
    # 2. Frontend (React)
    $frontendStarted = Start-ServiceWindow -Name "Frontend React" `
        -Path "$BasePath\frontend" `
        -Command "if (-not (Test-Path 'node_modules')) { npm install }; npm run dev" `
        -Port 5173 `
        -Icon "⚛️"
    
    if ($frontendStarted) {
        Wait-ForService -Name "Frontend React" -Port 5173 -TimeoutSeconds 45
    }
    
    Start-Sleep -Seconds 3
    
    # 3. Painel Admin
    $adminStarted = Start-ServiceWindow -Name "Painel Admin" `
        -Path "$BasePath\admin" `
        -Command "if (-not (Test-Path 'node_modules')) { npm install }; npm run dev" `
        -Port 5174 `
        -Icon "🛡️"
    
    if ($adminStarted) {
        Wait-ForService -Name "Painel Admin" -Port 5174 -TimeoutSeconds 45
    }
    
    Start-Sleep -Seconds 2
    
    # Resumo dos serviços
    Write-Host ""
    Write-ColorLog "RESUMO DOS SERVIÇOS" -Color $Colors.Title -Prefix "📊"
    Write-Host "================================" -ForegroundColor $Colors.Title
    
    $services = @(
        @{ Name = "Backend API"; Port = 5001; URL = "http://localhost:5001" },
        @{ Name = "Frontend React"; Port = 5173; URL = "http://localhost:5173" },
        @{ Name = "Painel Admin"; Port = 5174; URL = "http://localhost:5174" }
    )
    
    foreach ($service in $services) {
        $status = if (Test-Port -Port $service.Port) { "🟢 ONLINE" } else { "🔴 OFFLINE" }
        $color = if (Test-Port -Port $service.Port) { $Colors.Success } else { $Colors.Error }
        Write-Host "  $($service.Name): $status - $($service.URL)" -ForegroundColor $color
    }
    
    Write-Host ""
    
    # Abrir navegador
    if (-not $SkipBrowser) {
        Write-ColorLog "Abrindo navegador..." -Color $Colors.Info -Prefix "🌐"
        
        Start-Sleep -Seconds 2
        
        # Abrir Frontend
        if (Test-Port -Port 5173) {
            Start-Process "http://localhost:5173"
            Write-ColorLog "Frontend aberto no navegador" -Color $Colors.Success -Prefix "✅"
        }
        
        Start-Sleep -Seconds 1
        
        # Abrir Painel Admin
        if (Test-Port -Port 5174) {
            Start-Process "http://localhost:5174"
            Write-ColorLog "Painel Admin aberto no navegador" -Color $Colors.Success -Prefix "✅"
        }
    }
    
    Write-Host ""
    Write-ColorLog "SISTEMA BETFIT INICIADO!" -Color $Colors.Success -Prefix "🎉"
    Write-Host ""
    Write-ColorLog "URLs de Acesso:" -Color $Colors.Highlight -Prefix "🔗"
    Write-Host "  Frontend: http://localhost:5173" -ForegroundColor $Colors.Info
    Write-Host "  Admin: http://localhost:5174" -ForegroundColor $Colors.Info
    Write-Host "  API: http://localhost:5001" -ForegroundColor $Colors.Info
    Write-Host ""
    Write-ColorLog "Credenciais Admin:" -Color $Colors.Highlight -Prefix "🔑"
    Write-Host "  Email: admin@betfit.com" -ForegroundColor $Colors.Info
    Write-Host "  Senha: admin123" -ForegroundColor $Colors.Info
    Write-Host ""
    Write-ColorLog "Para parar os serviços, feche as janelas do PowerShell" -Color $Colors.Warning -Prefix "⚠️"
    Write-Host ""
}

# Executar função principal
Start-BetFitSystem

Read-Host "Pressione Enter para fechar esta janela"

