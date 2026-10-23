# PowerShell script to package the LPU Wi-Fi Auto-Login Browser Extension for release

$manifestPath = Join-Path $PSScriptRoot "manifest.json"
if (-not (Test-Path $manifestPath)) {
    Write-Error "manifest.json not found in $PSScriptRoot"
    exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$version = $manifest.version
Write-Host "Packaging LPU Wi-Fi Auto-Login Extension v$version..." -ForegroundColor Cyan

$distDir = Join-Path $PSScriptRoot "dist"
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

$versionedZip = Join-Path $distDir "LPU-Wifi-Auto-Login-v$version.zip"
$latestZip = Join-Path $distDir "LPU-Wifi-Auto-Login-Extension.zip"

# Clean up older builds if present
if (Test-Path $versionedZip) { Remove-Item $versionedZip -Force }
if (Test-Path $latestZip) { Remove-Item $latestZip -Force }

# Files and directories to package
$includeItems = @(
    "manifest.json",
    "background.js",
    "content.js",
    "popup.html",
    "popup.css",
    "popup.js",
    "fonts",
    "icons"
)

$sourcePaths = $includeItems | ForEach-Object { Join-Path $PSScriptRoot $_ }

# Compress into release zip archive
Compress-Archive -Path $sourcePaths -DestinationPath $versionedZip -Force
Copy-Item -Path $versionedZip -Destination $latestZip -Force

$zipInfo = Get-Item $versionedZip
$sizeKB = [math]::Round($zipInfo.Length / 1KB, 1)

Write-Host "Extension successfully packaged!" -ForegroundColor Green
Write-Host "Created: $versionedZip ($sizeKB KB)"
Write-Host "Created: $latestZip ($sizeKB KB)"
Write-Host ""
Write-Host "How users install it:" -ForegroundColor Yellow
Write-Host "1. Extract the zip file."
Write-Host "2. Go to chrome://extensions or brave://extensions in your browser."
Write-Host "3. Turn on 'Developer mode' and click 'Load unpacked'."
Write-Host "4. Select the extracted folder."
