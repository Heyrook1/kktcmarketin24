# kur.ps1 - Yonetici PowerShell ile calistir
Write-Host "Marketin24 Yazilim Takimi Kuruluyor..." -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$orchestratorPath = Join-Path $scriptDir "orchestrator.js"

if (-not (Test-Path $orchestratorPath)) {
    Write-Error "orchestrator.js bulunamadi: $orchestratorPath"
    exit 1
}

Set-Location $scriptDir
$env:PROJECT_DIR = $projectDir

# Bagimliliklari yukle
Write-Host "Bagimliliklar yukleniyor..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Error "npm install basarisiz oldu."
    exit 1
}

# pm2 kur
Write-Host "pm2 kuruluyor..."
npm install -g pm2
if ($LASTEXITCODE -ne 0) {
    Write-Error "pm2 kurulumu basarisiz oldu."
    exit 1
}

# Takimi baslat
Write-Host "Takim baslatiliyor..."
pm2 start orchestrator.js --name "marketin24-team" --cwd $scriptDir
if ($LASTEXITCODE -ne 0) {
    Write-Error "PM2 baslatma islemi basarisiz oldu."
    exit 1
}

# Windows baslangicinda otomatik calissin
pm2 startup
if ($LASTEXITCODE -ne 0) {
    Write-Error "pm2 startup basarisiz oldu."
    exit 1
}

pm2 save
if ($LASTEXITCODE -ne 0) {
    Write-Error "pm2 save basarisiz oldu."
    exit 1
}

Write-Host ""
Write-Host "TAKIM KURULDU!" -ForegroundColor Green
Write-Host ""
Write-Host "Kullanim:" -ForegroundColor Yellow
Write-Host "  pm2 status                         Durum"
Write-Host "  pm2 logs marketin24-team           Canli loglar"
Write-Host "  pm2 stop marketin24-team           Durdur"
Write-Host "  pm2 restart marketin24-team        Yeniden basla"
Write-Host "  pm2 delete marketin24-team         Kaldir"
