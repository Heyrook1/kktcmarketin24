# kur.ps1 - Yonetici PowerShell ile calistirin
$ErrorActionPreference = "Stop"

Write-Host "Marketin24 Yazilim Takimi Kuruluyor..." -ForegroundColor Cyan

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$orchestratorPath = Join-Path $scriptDirectory "orchestrator.js"

if (-not (Test-Path $orchestratorPath)) {
  Write-Host "orchestrator.js bulunamadi: $orchestratorPath" -ForegroundColor Red
  Write-Host "Lutfen kurulum betigini orchestrator.js ile ayni klasorden calistirin."
  exit 1
}

Write-Host "Bagimliliklar yukleniyor..."
npm install

Write-Host "pm2 kuruluyor..."
npm install -g pm2

Write-Host "Takim baslatiliyor..."
$env:PROJECT_DIR = $scriptDirectory
pm2 start $orchestratorPath --name "marketin24-team" --cwd $scriptDirectory

Write-Host "Windows baslangicinda otomatik calismasi icin PM2 ayarlaniyor..."
pm2 startup
pm2 save

Write-Host ""
Write-Host "TAKIM KURULDU!" -ForegroundColor Green
Write-Host ""
Write-Host "Kullanim:" -ForegroundColor Yellow
Write-Host "  pm2 status                        Durum"
Write-Host "  pm2 logs marketin24-team           Canli loglar"
Write-Host "  pm2 stop marketin24-team           Durdur"
Write-Host "  pm2 restart marketin24-team        Yeniden basla"
Write-Host "  pm2 delete marketin24-team         Kaldir"
