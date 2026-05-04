# kur.ps1 - Yonetici PowerShell ile calistirin.
$ErrorActionPreference = "Stop"

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Title,

    [Parameter(Mandatory = $true)]
    [scriptblock]$Command
  )

  Write-Host $Title -ForegroundColor Cyan
  & $Command

  if ($LASTEXITCODE -ne 0) {
    throw "$Title adimi basarisiz oldu. Cikis kodu: $LASTEXITCODE"
  }
}

Write-Host "Marketin24 Yazilim Takimi Kuruluyor..." -ForegroundColor Cyan
Write-Host ""

$projectDir = $PSScriptRoot
$env:PROJECT_DIR = $projectDir
$processName = "marketin24-team"

Invoke-Step "Bagimliliklar yukleniyor..." {
  npm install
}

Invoke-Step "Uretim derlemesi hazirlaniyor..." {
  npm run build
}

Invoke-Step "pm2 kuruluyor..." {
  npm install -g pm2
}

Write-Host "Takim baslatiliyor..." -ForegroundColor Cyan
pm2 describe $processName *> $null

if ($LASTEXITCODE -eq 0) {
  pm2 restart $processName --update-env
}
else {
  pm2 start npm --name $processName --cwd $projectDir -- run start
}

if ($LASTEXITCODE -ne 0) {
  throw "PM2 sureci baslatilamadi. Cikis kodu: $LASTEXITCODE"
}

Invoke-Step "Windows baslangici icin PM2 ayarlari kaydediliyor..." {
  pm2 startup
  pm2 save
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
