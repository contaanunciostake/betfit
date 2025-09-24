function Install-Chocolatey {
    Write-Host "Chocolatey nao encontrado. Instalando..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    try {
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "Chocolatey instalado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "Falha ao instalar o Chocolatey." -ForegroundColor Red
        Read-Host "Pressione Enter para sair..."
        exit 1
    }
}

Install-Chocolatey
