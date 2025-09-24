# ==================== INSTALADOR BETFIT PARA WINDOWS 11 ====================
# Script de instalacao automatica do sistema BetFit
# Autor: Sistema BetFit
# Versao: 1.0.0

param(
    [string]$InstallPath = "D:\Sistemas\BetFit"
)

Write-Host "🚀 INSTALADOR BETFIT PARA WINDOWS 11" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se esta executando como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "   Clique com botao direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "✅ Executando como Administrador" -ForegroundColor Green
Write-Host "📁 Caminho de instalacao: $InstallPath" -ForegroundColor Blue
Write-Host ""

# Funcao para verificar se um comando existe
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Funcao para instalar Chocolatey
function Install-Chocolatey {
    Write-Host "📦 Instalando Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    try {
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        Write-Host "✅ Chocolatey instalado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar Chocolatey: $_" -ForegroundColor Red
        exit 1
    }
}

# Funcao para instalar Python
function Install-Python {
    Write-Host "🐍 Instalando Python 3.11..." -ForegroundColor Yellow
    try {
        choco install python311 -y
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        Write-Host "✅ Python instalado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar Python: $_" -ForegroundColor Red
    }
}

# Funcao para instalar Node.js
function Install-NodeJS {
    Write-Host "📦 Instalando Node.js..." -ForegroundColor Yellow
    try {
        choco install nodejs -y
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        Write-Host "✅ Node.js instalado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar Node.js: $_" -ForegroundColor Red
    }
}

# Funcao para instalar Git
function Install-Git {
    Write-Host "📦 Instalando Git..." -ForegroundColor Yellow
    try {
        choco install git -y
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH","User")
        Write-Host "✅ Git instalado!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Erro ao instalar Git: $_" -ForegroundColor Red
    }
}

# Verificar e instalar dependencias
Write-Host "🔍 Verificando dependencias..." -ForegroundColor Blue

# Chocolatey
if (-not (Test-Command "choco")) {
    Install-Chocolatey
} else {
    Write-Host "✅ Chocolatey ja esta instalado" -ForegroundColor Green
}

# Python
if (-not (Test-Command "python")) {
    Install-Python
} else {
    Write-Host "✅ Python ja esta instalado" -ForegroundColor Green
    python --version
}

# Node.js
if (-not (Test-Command "node")) {
    Install-NodeJS
} else {
    Write-Host "✅ Node.js ja esta instalado" -ForegroundColor Green
    node --version
}

# Git
if (-not (Test-Command "git")) {
    Install-Git
} else {
    Write-Host "✅ Git ja esta instalado" -ForegroundColor Green
    git --version
}

Write-Host ""
Write-Host "📁 Criando estrutura de diretorios..." -ForegroundColor Blue

# Criar diretorio de instalacao
if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "✅ Diretorio criado: $InstallPath" -ForegroundColor Green
} else {
    Write-Host "✅ Diretorio ja existe: $InstallPath" -ForegroundColor Green
}

# Verificar se precisa copiar arquivos ou se ja esta no local correto
$SourceDir = "C:\Temp\BetFit"

if ($SourceDir -eq $InstallPath) {
    Write-Host "📋 Sistema ja esta no local correto: $InstallPath" -ForegroundColor Green
    Write-Host "   Pulando etapa de copia..." -ForegroundColor Gray
} else {
    Write-Host "📋 Copiando arquivos do sistema..." -ForegroundColor Blue
    Write-Host "   Origem: $SourceDir" -ForegroundColor Gray
    Write-Host "   Destino: $InstallPath" -ForegroundColor Gray

    # Copiar backend
    if (Test-Path "$SourceDir\backend") {
        Copy-Item -Path "$SourceDir\backend" -Destination "$InstallPath\backend" -Recurse -Force
        Write-Host "✅ Backend copiado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Pasta backend nao encontrada em $SourceDir\backend" -ForegroundColor Yellow
    }

    # Copiar frontend
    if (Test-Path "$SourceDir\frontend") {
        Copy-Item -Path "$SourceDir\frontend" -Destination "$InstallPath\frontend" -Recurse -Force
        Write-Host "✅ Frontend copiado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Pasta frontend nao encontrada em $SourceDir\frontend" -ForegroundColor Yellow
    }

    # Copiar admin
    if (Test-Path "$SourceDir\admin") {
        Copy-Item -Path "$SourceDir\admin" -Destination "$InstallPath\admin" -Recurse -Force
        Write-Host "✅ Painel Admin copiado" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Pasta admin nao encontrada em $SourceDir\admin" -ForegroundColor Yellow
    }

    # Copiar documentacao
    if (Test-Path "$SourceDir\docs") {
        Copy-Item -Path "$SourceDir\docs" -Destination "$InstallPath\docs" -Recurse -Force
        Write-Host "✅ Documentacao copiada" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Pasta docs nao encontrada em $SourceDir\docs" -ForegroundColor Yellow
    }

    # Copiar scripts
    if (Test-Path "$SourceDir\scripts") {
        Copy-Item -Path "$SourceDir\scripts" -Destination "$InstallPath\scripts" -Recurse -Force
        Write-Host "✅ Scripts copiados" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Pasta scripts nao encontrada em $SourceDir\scripts" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🔧 Configurando ambiente..." -ForegroundColor Blue

# Configurar Backend
if (Test-Path "$InstallPath\backend") {
    Write-Host "🐍 Configurando Backend Python..." -ForegroundColor Yellow
    Set-Location "$InstallPath\backend"

    # Criar ambiente virtual Python
    if (-not (Test-Path "venv")) {
        python -m venv venv
        Write-Host "✅ Ambiente virtual Python criado" -ForegroundColor Green
    }

    # Instalar dependencias se requirements.txt existir
    if (Test-Path "requirements.txt") {
        Write-Host "📦 Instalando dependencias Python..." -ForegroundColor Yellow
        & ".\venv\Scripts\pip.exe" install -r requirements.txt
        Write-Host "✅ Dependencias Python instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Arquivo requirements.txt nao encontrado" -ForegroundColor Yellow
    }

    # Criar arquivo .env se nao existir
    if (-not (Test-Path ".env") -and (Test-Path ".env.example")) {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
    }

    # Criar diretorio de dados
    if (-not (Test-Path "data")) {
        New-Item -ItemType Directory -Path "data" -Force | Out-Null
        Write-Host "✅ Diretorio de dados criado" -ForegroundColor Green
    }
}

# Configurar Frontend
if (Test-Path "$InstallPath\frontend") {
    Write-Host "⚛️ Configurando Frontend React..." -ForegroundColor Yellow
    Set-Location "$InstallPath\frontend"

    # Instalar dependencias Node.js
    if (Test-Path "package.json") {
        Write-Host "📦 Instalando dependencias Node.js..." -ForegroundColor Yellow
        npm install --legacy-peer-deps --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Dependencias Node.js instaladas" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Problemas ao instalar algumas dependencias Node.js" -ForegroundColor Yellow
            Write-Host "   Tentando instalacao alternativa..." -ForegroundColor Gray
            npm install --force
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Dependencias Node.js instaladas com --force" -ForegroundColor Green
            } else {
                Write-Host "❌ Falha na instalacao das dependencias Node.js" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "⚠️ Arquivo package.json nao encontrado" -ForegroundColor Yellow
    }

    # Criar arquivo .env.local se nao existir
    if (-not (Test-Path ".env.local") -and (Test-Path ".env.example")) {
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ Arquivo .env.local criado" -ForegroundColor Green
    }
}

# Configurar Painel Admin
if (Test-Path "$InstallPath\admin") {
    Write-Host "🛡️ Configurando Painel Admin..." -ForegroundColor Yellow
    Set-Location "$InstallPath\admin"

    # Instalar dependencias Node.js
    if (Test-Path "package.json") {
        Write-Host "📦 Instalando dependencias Node.js..." -ForegroundColor Yellow
        npm install
        Write-Host "✅ Dependencias Node.js instaladas" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Arquivo package.json nao encontrado" -ForegroundColor Yellow
    }

    # Criar arquivo .env.local se nao existir
    if (-not (Test-Path ".env.local") -and (Test-Path ".env.example")) {
        Copy-Item ".env.example" ".env.local"
        Write-Host "✅ Arquivo .env.local criado" -ForegroundColor Green
    }
}

# Voltar ao diretorio raiz
Set-Location $InstallPath

Write-Host ""
Write-Host "🎉 INSTALACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📁 Sistema instalado em: $InstallPath" -ForegroundColor Blue
Write-Host ""
Write-Host "🚀 Para iniciar o sistema, execute:" -ForegroundColor Yellow
Write-Host "   cd '$InstallPath'" -ForegroundColor White
Write-Host "   .\scripts\start.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentacao disponivel em:" -ForegroundColor Yellow
Write-Host "   $InstallPath\docs\" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Configuracoes em:" -ForegroundColor Yellow
Write-Host "   Backend: $InstallPath\backend\.env" -ForegroundColor White
Write-Host "   Frontend: $InstallPath\frontend\.env.local" -ForegroundColor White
Write-Host "   Admin: $InstallPath\admin\.env.local" -ForegroundColor White
Write-Host ""

# Mostrar status dos componentes instalados
Write-Host "📊 STATUS DOS COMPONENTES:" -ForegroundColor Cyan
if (Test-Path "$InstallPath\backend") { Write-Host "   ✅ Backend Python" -ForegroundColor Green } else { Write-Host "   ❌ Backend Python" -ForegroundColor Red }
if (Test-Path "$InstallPath\frontend") { Write-Host "   ✅ Frontend React" -ForegroundColor Green } else { Write-Host "   ❌ Frontend React" -ForegroundColor Red }
if (Test-Path "$InstallPath\admin") { Write-Host "   ✅ Painel Admin" -ForegroundColor Green } else { Write-Host "   ❌ Painel Admin" -ForegroundColor Red }
if (Test-Path "$InstallPath\docs") { Write-Host "   ✅ Documentacao" -ForegroundColor Green } else { Write-Host "   ❌ Documentacao" -ForegroundColor Red }
if (Test-Path "$InstallPath\scripts") { Write-Host "   ✅ Scripts" -ForegroundColor Green } else { Write-Host "   ❌ Scripts" -ForegroundColor Red }

Write-Host ""
Read-Host "Pressione Enter para finalizar"