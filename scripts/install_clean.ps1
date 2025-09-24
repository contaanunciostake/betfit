param([string]$InstallPath = "D:\Sistemas\BetFit")

Write-Host "INSTALADOR BETFIT PARA WINDOWS 11" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair..."
    exit 1
}

Write-Host "Executando como Administrador." -ForegroundColor Green
Write-Host "Caminho de instalacao: $InstallPath" -ForegroundColor Blue

if (Get-Command choco -ErrorAction SilentlyContinue) {
    Write-Host "Chocolatey encontrado!" -ForegroundColor Green
    choco --version
} else {
    Write-Host "Chocolatey nao encontrado. Reinicie o PowerShell." -ForegroundColor Red
}

if (-not (Test-Path $InstallPath)) {
    New-Item -ItemType Directory -Path $InstallPath -Force | Out-Null
    Write-Host "Diretorio criado em: $InstallPath" -ForegroundColor Green
} else {
    Write-Host "Diretorio ja existe em: $InstallPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "Teste concluido com sucesso!" -ForegroundColor Green
Read-Host "Pressione Enter para finalizar"