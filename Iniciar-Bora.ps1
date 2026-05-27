# Script de Inicializacao Rapida - Bora! MVP Curitiba
# Abra este arquivo com o PowerShell ou de dois cliques no arquivo demo-local.html

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                  BORA! MVP CURITIBA                      " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Abrindo o MVP do Bora! no seu navegador padrao..." -ForegroundColor White
Write-Host ""
Write-Host " O que voce podera testar neste MVP de Custo Zero:" -ForegroundColor Green
Write-Host " 1. Descoberta de Locais: Jardim Botanico, Opera de Arame, etc." -ForegroundColor Gray
Write-Host " 2. Mapa Interativo Leaflet com visual Dark Matter premium." -ForegroundColor Gray
Write-Host " 3. Botoes de acao rapida integrados para Uber, 99 e Google Maps." -ForegroundColor Gray
Write-Host " 4. Favoritar locais com persistencia no LocalStorage local." -ForegroundColor Gray
Write-Host " 5. Filtros dinamicos de busca e categorias." -ForegroundColor Gray
Write-Host " 6. Login Social demonstrativo integrado." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

# Caminho do arquivo de demo
$filePath = Join-Path -Path $PSScriptRoot -ChildPath "demo-local.html"

# Iniciar o navegador padrao com o arquivo HTML
Start-Process $filePath

Write-Host " Pronto! Se o seu navegador nao abriu automaticamente," -ForegroundColor Yellow
Write-Host " de dois cliques no arquivo 'demo-local.html' na pasta do seu projeto." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Pressione ENTER para fechar esta janela..." -ForegroundColor Gray
Read-Host
