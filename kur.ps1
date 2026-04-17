# kur.ps1 — Yönetici PowerShell ile çalıştır
Write-Host "Marketin24 Yazilim Takimi Kuruluyor..." -ForegroundColor Cyan

# Bağımlılıkları yükle
Write-Host "Bagimliliklar yukleniyor..."
npm install

# pm2 kur
Write-Host "pm2 kuruluyor..."
npm install -g pm2

# Takımı başlat
Write-Host "Takim baslatiliyor..."
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PROJECT_DIR = Split-Path -Parent $dir
pm2 start orchestrator.js --name "marketin24-team" --cwd $dir

# Windows başlangıcında otomatik çalışsın
pm2 startup
pm2 save

Write-Host ""
Write-Host "TAKIM KURULDU!" -ForegroundColor Green
Write-Host ""
Write-Host "Kullanim:" -ForegroundColor Yellow
Write-Host "  pm2 status                       Durum"
Write-Host "  pm2 logs marketin24-team          Canli loglar"
Write-Host "  pm2 stop marketin24-team          Durdur"
Write-Host "  pm2 restart marketin24-team        Yeniden basla"
Write-Host "  pm2 delete marketin24-team         Kaldir"
