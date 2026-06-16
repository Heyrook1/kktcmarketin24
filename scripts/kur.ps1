#requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

Write-Host "Marketin24 Yazilim Takimi Kuruluyor..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$orchestratorPath = Join-Path $scriptDir "orchestrator.js"
$env:PROJECT_DIR = $projectDir

Push-Location $projectDir
try {
  Write-Host "Bagimliliklar yukleniyor..."
  npm install

  Write-Host "pm2 kuruluyor..."
  npm install -g pm2

  Write-Host "Takim baslatiliyor..."
  pm2 start $orchestratorPath --name "marketin24-team" --cwd $scriptDir

  Write-Host "Windows baslangicinda otomatik calismasi ayarlaniyor..."
  pm2 startup
  pm2 save
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "TAKIM KURULDU!" -ForegroundColor Green
Write-Host ""
Write-Host "Kullanim:" -ForegroundColor Yellow
Write-Host "  pm2 status                       Durum"
Write-Host "  pm2 logs marketin24-team          Canli loglar"
Write-Host "  pm2 stop marketin24-team          Durdur"
Write-Host "  pm2 restart marketin24-team        Yeniden basla"
Write-Host "  pm2 delete marketin24-team         Kaldir"
