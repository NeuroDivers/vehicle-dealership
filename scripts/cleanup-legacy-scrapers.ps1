# Cleanup Legacy Scraper System
# Archives old vendor-specific scrapers that have been replaced by feed-scraper

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Legacy Scraper Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Create archive directory
$archivePath = "workers/archive"
if (-not (Test-Path $archivePath)) {
    New-Item -ItemType Directory -Force -Path $archivePath | Out-Null
    Write-Host "Created archive directory: $archivePath" -ForegroundColor Green
}

# Files to archive
$filesToArchive = @(
    "workers/lambert-scraper-enhanced.js",
    "workers/naniauto-scraper.js",
    "workers/sltautos-scraper.js",
    "workers/wrangler-lambert-scraper.toml",
    "workers/wrangler-naniauto-scraper.toml",
    "workers/wrangler-sltautos-scraper.toml"
)

Write-Host "Archiving old scraper files..." -ForegroundColor Yellow
Write-Host ""

$archivedCount = 0
$notFoundCount = 0

foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        $destination = Join-Path $archivePath $fileName
        
        # Check if file already exists in archive
        if (Test-Path $destination) {
            Write-Host "  [SKIP] $fileName (already archived)" -ForegroundColor Gray
        } else {
            Move-Item $file $destination -Force
            Write-Host "  [OK] Archived: $fileName" -ForegroundColor Green
            $archivedCount++
        }
    } else {
        $fileName = Split-Path $file -Leaf
        Write-Host "  [NOT FOUND] $fileName" -ForegroundColor Gray
        $notFoundCount++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files archived: $archivedCount" -ForegroundColor Green
Write-Host "  Files not found: $notFoundCount" -ForegroundColor Gray
Write-Host "  Archive location: $archivePath" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($archivedCount -gt 0) {
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Test the new feed-based system thoroughly" -ForegroundColor White
    Write-Host "2. If everything works, undeploy old workers from Cloudflare:" -ForegroundColor White
    Write-Host ""
    Write-Host "   wrangler delete lambert-scraper-enhanced" -ForegroundColor Gray
    Write-Host "   wrangler delete naniauto-scraper" -ForegroundColor Gray
    Write-Host "   wrangler delete sltautos-scraper" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. After 30 days, you can safely delete the archive folder" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "No files were archived. They may have been archived previously." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
