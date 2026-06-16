# kur.ps1 - Yonetici PowerShell ile calistirin.
$ErrorActionPreference = "Stop"

Write-Host "Marketin24 Yazilim Takimi Kuruluyor..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PROJECT_DIR = $scriptDir

Set-Location $env:PROJECT_DIR

Write-Host "Bagimliliklar yukleniyor..."
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  $env:MARKETIN24_PACKAGE_MANAGER = "pnpm"
  pnpm install
  Write-Host "Uygulama derleniyor..."
  pnpm build
} else {
  $env:MARKETIN24_PACKAGE_MANAGER = "npm"
  npm install
  Write-Host "Uygulama derleniyor..."
  npm run build
}

Write-Host "pm2 kuruluyor..."
npm install -g pm2

Write-Host "Takim baslatiliyor..."
pm2 start orchestrator.js --name "marketin24-team" --cwd $env:PROJECT_DIR

pm2 startup
pm2 save

Write-Host ""
Write-Host "TAKIM KURULDU!" -ForegroundColor Green
Write-Host ""
Write-Host "Kullanim:" -ForegroundColor Yellow
Write-Host "  pm2 status                         Durum"
Write-Host "  pm2 logs marketin24-team            Canli loglar"
Write-Host "  pm2 stop marketin24-team            Durdur"
Write-Host "  pm2 restart marketin24-team         Yeniden basla"
Write-Host "  pm2 delete marketin24-team          Kaldir"
