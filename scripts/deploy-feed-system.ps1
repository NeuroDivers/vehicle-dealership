# Deploy Feed-Based Scraper System
# PowerShell script for Windows

Write-Host "🚀 Deploying Feed-Based Scraper System..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Database Migration
Write-Host "📊 Step 1: Running database migration..." -ForegroundColor Yellow
wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-vendor-feeds.sql --remote

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database migration failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Database migration completed" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Feed Scraper Worker
Write-Host "🔧 Step 2: Deploying feed-scraper worker..." -ForegroundColor Yellow
wrangler deploy --config workers/wrangler-feed-scraper.toml

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Feed scraper deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Feed scraper deployed" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy Feed Management API Worker
Write-Host "🔧 Step 3: Deploying feed-management-api worker..." -ForegroundColor Yellow
wrangler deploy --config workers/wrangler-feed-management-api.toml

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Feed management API deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Feed management API deployed" -ForegroundColor Green
Write-Host ""

# Step 4: Verify Deployment
Write-Host "🔍 Step 4: Verifying deployment..." -ForegroundColor Yellow

Write-Host "Testing feed management API..."
$feedsResponse = Invoke-RestMethod -Uri "https://feed-management-api.nick-damato0011527.workers.dev/api/feeds" -Method Get -ErrorAction SilentlyContinue

if ($feedsResponse.success) {
    Write-Host "✅ Feed management API is working" -ForegroundColor Green
    Write-Host "   Found $($feedsResponse.feeds.Count) feeds" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Feed management API test failed" -ForegroundColor Yellow
}

Write-Host ""

# Step 5: Summary
Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Database migration: COMPLETE" -ForegroundColor Green
Write-Host "✅ Feed scraper worker: DEPLOYED" -ForegroundColor Green
Write-Host "✅ Feed management API: DEPLOYED" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Worker URLs:" -ForegroundColor Cyan
Write-Host "   Feed Scraper: https://feed-scraper.nick-damato0011527.workers.dev" -ForegroundColor Gray
Write-Host "   Feed Management API: https://feed-management-api.nick-damato0011527.workers.dev" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Add environment variables to .env.local:" -ForegroundColor Gray
Write-Host "      NEXT_PUBLIC_FEED_MANAGEMENT_API=https://feed-management-api.nick-damato0011527.workers.dev" -ForegroundColor Gray
Write-Host "      NEXT_PUBLIC_FEED_SCRAPER_API=https://feed-scraper.nick-damato0011527.workers.dev" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Deploy frontend to Cloudflare Pages:" -ForegroundColor Gray
Write-Host "      git add ." -ForegroundColor Gray
Write-Host "      git commit -m 'Add feed-based scraper system'" -ForegroundColor Gray
Write-Host "      git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "   3. Test syncing a vendor:" -ForegroundColor Gray
Write-Host "      curl -X POST https://feed-scraper.nick-damato0011527.workers.dev/api/scrape \\" -ForegroundColor Gray
Write-Host "        -H 'Content-Type: application/json' \\" -ForegroundColor Gray
Write-Host "        -d '{`"vendorId`": `"lambert`"}'" -ForegroundColor Gray
Write-Host ""
Write-Host "📖 Documentation: docs/FEED_SCRAPER_MIGRATION.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
