# ==================== INSTALADOR BETFIT COM AUTO START ====================
# Script para instalar e iniciar automaticamente o sistema BetFit
# Versão: 3.0.0 - Com inicialização automática

param(
    [string]$SourcePath = "C:\Temp\BetFit3",
    [string]$DestinationPath = "D:\Sistemas\BetFit",
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

# Função para verificar administrador
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
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
        @{ Name = "Chocolatey"; Command = "choco"; Required = $false },
        @{ Name = "Python"; Command = "python"; Required = $true },
        @{ Name = "Node.js"; Command = "node"; Required = $true },
        @{ Name = "NPM"; Command = "npm"; Required = $true },
        @{ Name = "Git"; Command = "git"; Required = $false }
    )
    
    $results = @{}
    
    foreach ($dep in $dependencies) {
        try {
            $version = & $dep.Command --version 2>$null
            Write-ColorLog "$($dep.Name) já está instalado" -Color $Colors.Success -Prefix "✅"
            if ($version) {
                Write-ColorLog "$version" -Color $Colors.Info
            }
            $results[$dep.Name] = $true
        } catch {
            Write-ColorLog "$($dep.Name) não encontrado" -Color $Colors.Warning -Prefix "⚠️"
            $results[$dep.Name] = $false
        }
    }
    
    return $results
}

# Função para instalar dependências
function Install-Dependencies {
    $deps = Test-Dependencies
    
    if (-not $deps["Python"]) {
        Write-ColorLog "Instalando Python..." -Color $Colors.Info -Prefix "🐍"
        if ($deps["Chocolatey"]) {
            choco install python -y
        } else {
            Write-ColorLog "Baixe e instale Python de: https://www.python.org/downloads/" -Color $Colors.Warning -Prefix "💡"
            return $false
        }
    }
    
    if (-not $deps["Node.js"]) {
        Write-ColorLog "Instalando Node.js..." -Color $Colors.Info -Prefix "⚛️"
        if ($deps["Chocolatey"]) {
            choco install nodejs -y
        } else {
            Write-ColorLog "Baixe e instale Node.js de: https://nodejs.org/" -Color $Colors.Warning -Prefix "💡"
            return $false
        }
    }
    
    return $true
}

# Função principal de instalação
function Install-BetFitSystem {
    # Header
    Clear-Host
    Write-Host ""
    Write-Host "🎯 ================================================ 🎯" -ForegroundColor $Colors.Title
    Write-Host "🚀     INSTALADOR BETFIT PARA WINDOWS 11 v3.0     🚀" -ForegroundColor $Colors.Title  
    Write-Host "🎯 ================================================ 🎯" -ForegroundColor $Colors.Title
    Write-Host ""
    
    # Verificar privilégios de administrador
    if (Test-Administrator) {
        Write-ColorLog "Executando como Administrador" -Color $Colors.Success -Prefix "✅"
    } else {
        Write-ColorLog "Executando sem privilégios de administrador" -Color $Colors.Warning -Prefix "⚠️"
    }
    
    Write-ColorLog "Caminho de origem: $SourcePath" -Color $Colors.Info -Prefix "📁"
    Write-ColorLog "Caminho de instalação: $DestinationPath" -Color $Colors.Info -Prefix "📁"
    Write-Host ""
    
    # Verificar se diretório de origem existe
    if (-not (Test-Path $SourcePath)) {
        Write-ColorLog "Diretório de origem não encontrado: $SourcePath" -Color $Colors.Error -Prefix "❌"
        return $false
    }
    
    # Verificar e instalar dependências
    Write-ColorLog "Verificando dependências..." -Color $Colors.Info -Prefix "🔍"
    $deps = Test-Dependencies
    
    if (-not ($deps["Python"] -and $deps["Node.js"])) {
        Write-ColorLog "Dependências obrigatórias não encontradas" -Color $Colors.Error -Prefix "❌"
        if (-not (Install-Dependencies)) {
            return $false
        }
    }
    
    Write-Host ""
    
    # Criar estrutura de diretórios
    Write-ColorLog "Criando estrutura de diretórios..." -Color $Colors.Info -Prefix "📁"
    
    if (-not (Test-Path $DestinationPath)) {
        try {
            New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
            Write-ColorLog "Diretório criado: $DestinationPath" -Color $Colors.Success -Prefix "✅"
        } catch {
            Write-ColorLog "Erro ao criar diretório: $($_.Exception.Message)" -Color $Colors.Error -Prefix "❌"
            return $false
        }
    } else {
        Write-ColorLog "Diretório já existe: $DestinationPath" -Color $Colors.Success -Prefix "✅"
    }
    
    # Copiar arquivos
    Write-ColorLog "Copiando arquivos do sistema..." -Color $Colors.Info -Prefix "📋"
    Write-ColorLog "Origem: $SourcePath" -Color $Colors.Info
    Write-ColorLog "Destino: $DestinationPath" -Color $Colors.Info
    
    $components = @("backend", "frontend", "admin", "docs", "scripts")
    
    foreach ($component in $components) {
        $sourcePath = Join-Path $SourcePath $component
        $destPath = Join-Path $DestinationPath $component
        
        if (Test-Path $sourcePath) {
            try {
                Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
                Write-ColorLog "$component copiado" -Color $Colors.Success -Prefix "✅"
            } catch {
                Write-ColorLog "Erro ao copiar $component : $($_.Exception.Message)" -Color $Colors.Error -Prefix "❌"
            }
        } else {
            Write-ColorLog "$component não encontrado em: $sourcePath" -Color $Colors.Warning -Prefix "⚠️"
        }
    }
    
    Write-Host ""
    
    # Configurar ambiente
    Write-ColorLog "Configurando ambiente..." -Color $Colors.Info -Prefix "🔧"
    
    # Backend Python
    Write-ColorLog "Configurando Backend Python..." -Color $Colors.Info -Prefix "🐍"
    $backendPath = Join-Path $DestinationPath "backend"
    
    if (Test-Path $backendPath) {
        Push-Location $backendPath
        
        try {
            # Criar ambiente virtual
            if (-not (Test-Path "venv")) {
                Write-ColorLog "Criando ambiente virtual Python..." -Color $Colors.Info -Prefix "🐍"
                python -m venv venv
            }
            
            # Ativar ambiente virtual e instalar dependências
            Write-ColorLog "Instalando dependências Python..." -Color $Colors.Info -Prefix "📦"
            & .\venv\Scripts\Activate.ps1
            
            if (Test-Path "requirements.txt") {
                pip install -r requirements.txt
                Write-ColorLog "Dependências Python instaladas" -Color $Colors.Success -Prefix "✅"
            }
        } catch {
            Write-ColorLog "Erro na configuração do Backend: $($_.Exception.Message)" -Color $Colors.Error -Prefix "❌"
        }
        
        Pop-Location
    }
    
    # Frontend React
    Write-ColorLog "Configurando Frontend React..." -Color $Colors.Info -Prefix "⚛️"
    $frontendPath = Join-Path $DestinationPath "frontend"
    
    if (Test-Path $frontendPath) {
        Push-Location $frontendPath
        
        try {
            Write-ColorLog "Instalando dependências Node.js..." -Color $Colors.Info -Prefix "📦"
            npm install --force
            Write-ColorLog "Dependências Node.js instaladas" -Color $Colors.Success -Prefix "✅"
        } catch {
            Write-ColorLog "Erro na instalação do Frontend: $($_.Exception.Message)" -Color $Colors.Error -Prefix "❌"
        }
        
        Pop-Location
    }
    
    # Painel Admin (com correção do conflito de dependências)
    Write-ColorLog "Configurando Painel Admin..." -Color $Colors.Info -Prefix "🛡️"
    $adminPath = Join-Path $DestinationPath "admin"
    
    if (Test-Path $adminPath) {
        Push-Location $adminPath
        
        try {
            Write-ColorLog "Instalando dependências Node.js..." -Color $Colors.Info -Prefix "📦"
            # Usar --legacy-peer-deps para resolver conflito de dependências
            npm install --legacy-peer-deps
            Write-ColorLog "Dependências Node.js instaladas" -Color $Colors.Success -Prefix "✅"
        } catch {
            Write-ColorLog "Erro na instalação do Admin: $($_.Exception.Message)" -Color $Colors.Error -Prefix "❌"
        }
        
        Pop-Location
    }
    
    Write-Host ""
    Write-ColorLog "INSTALAÇÃO CONCLUÍDA!" -Color $Colors.Success -Prefix "🎉"
    Write-Host ""
    
    return $true
}

# Função para iniciar todos os serviços
function Start-BetFitServices {
    Write-ColorLog "INICIANDO SERVIÇOS AUTOMATICAMENTE" -Color $Colors.Title -Prefix "🚀"
    Write-Host "================================" -ForegroundColor $Colors.Title
    Write-Host ""
    
    # 1. Backend (API Flask)
    Write-ColorLog "Iniciando Backend API..." -Color $Colors.Info -Prefix "🐍"
    $backendStarted = Start-ServiceWindow -Name "Backend API" `
        -Path "$DestinationPath\backend" `
        -Command "& .\venv\Scripts\Activate.ps1; python src\main.py" `
        -Port 5001 `
        -Icon "🐍"
    
    if ($backendStarted) {
        Wait-ForService -Name "Backend API" -Port 5001 -TimeoutSeconds 30
    }
    
    Start-Sleep -Seconds 3
    
    # 2. Frontend (React)
    Write-ColorLog "Iniciando Frontend React..." -Color $Colors.Info -Prefix "⚛️"
    $frontendStarted = Start-ServiceWindow -Name "Frontend React" `
        -Path "$DestinationPath\frontend" `
        -Command "npm run dev" `
        -Port 5173 `
        -Icon "⚛️"
    
    if ($frontendStarted) {
        Wait-ForService -Name "Frontend React" -Port 5173 -TimeoutSeconds 45
    }
    
    Start-Sleep -Seconds 3
    
    # 3. Painel Admin
    Write-ColorLog "Iniciando Painel Admin..." -Color $Colors.Info -Prefix "🛡️"
    $adminStarted = Start-ServiceWindow -Name "Painel Admin" `
        -Path "$DestinationPath\admin" `
        -Command "npm run dev" `
        -Port 5174 `
        -Icon "🛡️"
    
    if ($adminStarted) {
        Wait-ForService -Name "Painel Admin" -Port 5174 -TimeoutSeconds 45
    }
    
    Start-Sleep -Seconds 2
    
    # Resumo dos serviços
    Write-Host ""
    Write-ColorLog "STATUS DOS SERVIÇOS" -Color $Colors.Title -Prefix "📊"
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
    
    # Abrir navegador automaticamente
    if (-not $SkipBrowser) {
        Write-ColorLog "Abrindo navegador automaticamente..." -Color $Colors.Info -Prefix "🌐"
        
        Start-Sleep -Seconds 3
        
        # Abrir Frontend
        if (Test-Port -Port 5173) {
            Start-Process "http://localhost:5173"
            Write-ColorLog "Frontend aberto no navegador" -Color $Colors.Success -Prefix "✅"
        }
        
        Start-Sleep -Seconds 2
        
        # Abrir Painel Admin
        if (Test-Port -Port 5174) {
            Start-Process "http://localhost:5174"
            Write-ColorLog "Painel Admin aberto no navegador" -Color $Colors.Success -Prefix "✅"
        }
    }
    
    Write-Host ""
    Write-ColorLog "SISTEMA BETFIT INSTALADO E INICIADO!" -Color $Colors.Success -Prefix "🎉"
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
    Write-ColorLog "Sistema instalado em: $DestinationPath" -Color $Colors.Info -Prefix "📁"
    Write-ColorLog "Para parar os serviços, feche as janelas do PowerShell" -Color $Colors.Warning -Prefix "⚠️"
    Write-Host ""
}

# Executar instalação e inicialização
try {
    if (Install-BetFitSystem) {
        Write-Host ""
        Write-ColorLog "Aguardando 5 segundos antes de iniciar os serviços..." -Color $Colors.Info -Prefix "⏳"
        Start-Sleep -Seconds 5
        
        Start-BetFitServices
    } else {
        Write-ColorLog "Instalação falhou. Verifique os erros acima." -Color $Colors.Error -Prefix "❌"
    }
} catch {
    Write-ColorLog "Erro durante a execução: $($_.Exception.Message)" -Color $Colors.Error -Prefix "❌"
    Write-ColorLog "Stack trace: $($_.ScriptStackTrace)" -Color $Colors.Error
}

Write-Host ""
Read-Host "Pressione Enter para finalizar"