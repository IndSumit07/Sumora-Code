param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("start","stop")]
    [string]$Action
)

$CODEBOX_DIR  = "d:\codebox"
$APP_DIR      = "d:\My Projects\sumora-code"
$APP_PORT     = 3001
$CODEBOX_PORT = 3000

if ($Action -eq "start") {

    Write-Host ""
    Write-Host "==> Starting CodeBox executor (Docker)..." -ForegroundColor Cyan
    Push-Location $CODEBOX_DIR
    docker-compose up -d 2>&1 | Out-Null
    $exitCode = $LASTEXITCODE
    Pop-Location

    if ($exitCode -ne 0) {
        Write-Host "  [FAIL] Could not start CodeBox. Run docker-compose up -d in $CODEBOX_DIR" -ForegroundColor Red
        exit 1
    }
    Write-Host "  [OK] CodeBox starting on http://localhost:$CODEBOX_PORT" -ForegroundColor Green

    Write-Host ""
    Write-Host "==> Waiting for CodeBox health check..." -ForegroundColor Cyan
    $tries = 0
    $healthy = $false
    while ($tries -lt 20) {
        try {
            $res = Invoke-RestMethod "http://localhost:$CODEBOX_PORT/health" -ErrorAction Stop
            if ($res.status -eq "healthy") { $healthy = $true; break }
        } catch {}
        Start-Sleep 1
        $tries++
    }

    if ($healthy) {
        Write-Host "  [OK] CodeBox is healthy" -ForegroundColor Green
    } else {
        Write-Host "  [WARN] CodeBox not ready yet - check: docker-compose logs api" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "==> Starting sumora-code Next.js app on port $APP_PORT..." -ForegroundColor Cyan
    $cmd = "Set-Location '$APP_DIR'; npm run dev -- --port $APP_PORT"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd
    Write-Host "  [OK] Next.js launching in new window" -ForegroundColor Green

    Write-Host ""
    Write-Host "-----------------------------------------------------" -ForegroundColor DarkGray
    Write-Host "  CodeBox   -> http://localhost:$CODEBOX_PORT" -ForegroundColor Yellow
    Write-Host "  App       -> http://localhost:$APP_PORT" -ForegroundColor Yellow
    Write-Host "  Stop all  -> .\scripts\dev.ps1 stop" -ForegroundColor DarkGray
    Write-Host "-----------------------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
}

if ($Action -eq "stop") {

    Write-Host ""
    Write-Host "==> Stopping CodeBox (Docker)..." -ForegroundColor Cyan
    Push-Location $CODEBOX_DIR
    docker-compose down 2>&1 | Out-Null
    Pop-Location
    Write-Host "  [OK] CodeBox stopped" -ForegroundColor Green

    Write-Host ""
    Write-Host "==> Stopping Next.js on port $APP_PORT..." -ForegroundColor Cyan
    $conns = Get-NetTCPConnection -LocalPort $APP_PORT -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        $conns | ForEach-Object {
            $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($proc) {
                Stop-Process -Id $proc.Id -Force
                Write-Host "  [OK] Stopped process $($proc.Name) (PID $($proc.Id))" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "  [OK] Nothing running on port $APP_PORT" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "All services stopped." -ForegroundColor Green
    Write-Host ""
}
