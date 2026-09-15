# Template MFE - Start All Microfrontends
# Usage: .\start.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Template MFE - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if pnpm is installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: pnpm is not installed. Install it with: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

# Install deps if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pnpm install
    Write-Host ""
}

Write-Host "Starting all Microfrontend services..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Shell:     http://localhost:5000" -ForegroundColor Green
Write-Host "  Child:     http://localhost:5006" -ForegroundColor Green
Write-Host "  Hallo:     http://localhost:5007" -ForegroundColor Green
Write-Host "  Master:    http://localhost:5008" -ForegroundColor Green
Write-Host "  Trx:       http://localhost:5009" -ForegroundColor Green
Write-Host "  Monitor:   http://localhost:5010" -ForegroundColor Green
Write-Host "  Report:    http://localhost:5011" -ForegroundColor Green
Write-Host "  Maintain:  http://localhost:5012" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop all services." -ForegroundColor DarkGray
Write-Host ""

pnpm dev
