# ==================== PARAR SERVIÇOS BETFIT ====================
# Script para parar todos os serviços do BetFit
# Versão: 1.0.0

Write-Host "🛑 PARANDO SERVIÇOS BETFIT" -ForegroundColor Red
Write-Host "=========================" -ForegroundColor Red
Write-Host ""

# Função para parar processo na porta
function Stop-ProcessOnPort {
    param([int]$Port, [string]$ServiceName)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                    Select-Object -ExpandProperty OwningProcess -Unique
        
        if ($processes) {
            foreach ($processId in $processes) {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "🔴 Parando $ServiceName (PID: $processId)..." -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force
                    Write-Host "✅ $ServiceName parado" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "ℹ️  $ServiceName não está rodando na porta $Port" -ForegroundColor Blue
        }
    } catch {
        Write-Host "❌ Erro ao parar $ServiceName : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Parar serviços nas portas específicas
Stop-ProcessOnPort -Port 5001 -ServiceName "Backend API"
Stop-ProcessOnPort -Port 5173 -ServiceName "Frontend React"
Stop-ProcessOnPort -Port 5174 -ServiceName "Painel Admin"

# Parar processos Python e Node relacionados ao BetFit
Write-Host ""
Write-Host "🔍 Procurando processos relacionados..." -ForegroundColor Blue

$pythonProcesses = Get-Process -Name "python*" -ErrorAction SilentlyContinue | 
                  Where-Object { $_.CommandLine -like "*betfit*" -or $_.CommandLine -like "*main.py*" }

$nodeProcesses = Get-Process -Name "node*" -ErrorAction SilentlyContinue | 
                Where-Object { $_.CommandLine -like "*betfit*" -or $_.CommandLine -like "*vite*" }

foreach ($process in $pythonProcesses) {
    Write-Host "🔴 Parando processo Python (PID: $($process.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $process.Id -Force
}

foreach ($process in $nodeProcesses) {
    Write-Host "🔴 Parando processo Node (PID: $($process.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $process.Id -Force
}

Write-Host ""
Write-Host "✅ TODOS OS SERVIÇOS BETFIT FORAM PARADOS!" -ForegroundColor Green
Write-Host ""

Read-Host "Pressione Enter para fechar"

