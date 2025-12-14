# Rename Database Script
# Creates new database "autopret123" and migrates data from old database

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Database Rename Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$oldDbName = "vehicle-dealership-analytics"
$newDbName = "autopret123"

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "  1. Create new database: $newDbName" -ForegroundColor White
Write-Host "  2. Export data from: $oldDbName" -ForegroundColor White
Write-Host "  3. Import data to: $newDbName" -ForegroundColor White
Write-Host "  4. Update all wrangler.toml files" -ForegroundColor White
Write-Host "  5. Redeploy all workers" -ForegroundColor White
Write-Host ""
Write-Host "WARNING: This will take 5-10 minutes" -ForegroundColor Red
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "Step 1: Creating new database..." -ForegroundColor Cyan
wrangler d1 create $newDbName

Write-Host ""
Write-Host "Step 2: Exporting schema from old database..." -ForegroundColor Cyan
wrangler d1 export $oldDbName --remote --output="backup-schema.sql"

Write-Host ""
Write-Host "Step 3: Exporting data from old database..." -ForegroundColor Cyan
# Note: You'll need to manually get the new database ID from the output above
Write-Host ""
Write-Host "IMPORTANT: Copy the database_id from the output above" -ForegroundColor Yellow
$newDbId = Read-Host "Enter the new database ID"

Write-Host ""
Write-Host "Step 4: Importing to new database..." -ForegroundColor Cyan
wrangler d1 execute $newDbName --file="backup-schema.sql" --remote

Write-Host ""
Write-Host "Step 5: Updating wrangler.toml files..." -ForegroundColor Cyan

# Get old database ID
$oldDbId = "d70754b6-fec7-483a-b103-c1c78916c497"

# Find and update all wrangler.toml files
$tomlFiles = Get-ChildItem -Path "workers" -Filter "wrangler*.toml" -Recurse

foreach ($file in $tomlFiles) {
    Write-Host "  Updating: $($file.Name)" -ForegroundColor Gray
    
    $content = Get-Content $file.FullName -Raw
    $content = $content -replace "database_name = `"$oldDbName`"", "database_name = `"$newDbName`""
    $content = $content -replace "database_id = `"$oldDbId`"", "database_id = `"$newDbId`""
    
    Set-Content -Path $file.FullName -Value $content -NoNewline
}

Write-Host ""
Write-Host "Step 6: Redeploying workers..." -ForegroundColor Cyan

$workers = @(
    "wrangler-feed-scraper.toml",
    "wrangler-feed-management-api.toml",
    "wrangler-vehicle-api.toml",
    "wrangler-image-processor.toml"
)

foreach ($worker in $workers) {
    $workerPath = "workers/$worker"
    if (Test-Path $workerPath) {
        Write-Host "  Deploying: $worker" -ForegroundColor Gray
        wrangler deploy --config $workerPath
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Database Rename Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Old database: $oldDbName" -ForegroundColor Gray
Write-Host "New database: $newDbName" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test the system to ensure everything works" -ForegroundColor White
Write-Host "  2. After confirming, you can delete the old database:" -ForegroundColor White
Write-Host "     wrangler d1 delete $oldDbName" -ForegroundColor Gray
Write-Host ""
