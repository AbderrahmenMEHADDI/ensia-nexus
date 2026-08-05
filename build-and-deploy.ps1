# build-and-deploy.ps1
# Builds the frontend, patches the API URL, and zips the dist folder.

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Push-Location $projectDir
try {
    # 1. Build
    Write-Host "`n[1/3] Running npm run build..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
    Write-Host "  Build completed." -ForegroundColor Green

    # 2. Replace localhost URL with production URL in all JS assets
    Write-Host "`n[2/3] Patching API URL in dist/assets/*.js..." -ForegroundColor Cyan
    $jsFiles = Get-ChildItem -Path "dist\assets\*.js"
    $count = 0
    foreach ($file in $jsFiles) {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if ($content.Contains("http://localhost:8000")) {
            $content = $content.Replace("http://localhost:8000", "https://api.aisi-team.com")
            [System.IO.File]::WriteAllText($file.FullName, $content)
            $count++
            Write-Host "  Patched: $($file.Name)" -ForegroundColor Yellow
        }
    }
    Write-Host "  $count file(s) patched." -ForegroundColor Green

    # 3. Zip the dist folder
    Write-Host "`n[3/3] Zipping dist folder..." -ForegroundColor Cyan
    $zipPath = Join-Path $projectDir "dist.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path "dist\*" -DestinationPath $zipPath -Force
    Write-Host "  Created: $zipPath" -ForegroundColor Green

    Write-Host "`nDone! Deploy dist.zip to your server." -ForegroundColor Cyan
}
finally {
    Pop-Location
}
