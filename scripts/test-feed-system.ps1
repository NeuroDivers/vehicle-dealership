# Test Feed-Based Scraper System
# PowerShell script to verify deployment

Write-Host "🧪 Testing Feed-Based Scraper System..." -ForegroundColor Cyan
Write-Host ""

$feedManagementApi = "https://feed-management-api.nick-damato0011527.workers.dev"
$feedScraperApi = "https://feed-scraper.nick-damato0011527.workers.dev"

$allTestsPassed = $true

# Test 1: Feed Management API - Get all feeds
Write-Host "Test 1: Get all feeds..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$feedManagementApi/api/feeds" -Method Get -ErrorAction Stop
    
    if ($response.success -and $response.feeds) {
        Write-Host "✅ PASS: Found $($response.feeds.Count) feeds" -ForegroundColor Green
        
        # Display feeds
        foreach ($feed in $response.feeds) {
            Write-Host "   - $($feed.vendor_name) ($($feed.vendor_id))" -ForegroundColor Gray
            Write-Host "     URL: $($feed.feed_url)" -ForegroundColor DarkGray
            Write-Host "     Status: $(if ($feed.is_active) { 'Active' } else { 'Inactive' })" -ForegroundColor DarkGray
            Write-Host "     Last Sync: $(if ($feed.last_sync_at) { $feed.last_sync_at } else { 'Never' })" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "❌ FAIL: Invalid response format" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}
Write-Host ""

# Test 2: Feed Management API - Get single feed
Write-Host "Test 2: Get single feed (lambert)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$feedManagementApi/api/feeds/lambert" -Method Get -ErrorAction Stop
    
    if ($response.success -and $response.feed) {
        Write-Host "✅ PASS: Retrieved Lambert feed" -ForegroundColor Green
        Write-Host "   Vendor: $($response.feed.vendor_name)" -ForegroundColor Gray
        Write-Host "   Feed URL: $($response.feed.feed_url)" -ForegroundColor Gray
    } else {
        Write-Host "❌ FAIL: Invalid response format" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}
Write-Host ""

# Test 3: Check if feeds are accessible
Write-Host "Test 3: Verify feed URLs are accessible..." -ForegroundColor Yellow
try {
    $feedsResponse = Invoke-RestMethod -Uri "$feedManagementApi/api/feeds" -Method Get -ErrorAction Stop
    
    if ($feedsResponse.success) {
        $accessibleCount = 0
        $totalFeeds = $feedsResponse.feeds.Count
        
        foreach ($feed in $feedsResponse.feeds) {
            try {
                $feedTest = Invoke-WebRequest -Uri $feed.feed_url -Method Head -TimeoutSec 10 -ErrorAction Stop
                if ($feedTest.StatusCode -eq 200) {
                    Write-Host "   ✅ $($feed.vendor_name): Accessible" -ForegroundColor Green
                    $accessibleCount++
                }
            } catch {
                Write-Host "   ⚠️  $($feed.vendor_name): Not accessible ($($_.Exception.Message))" -ForegroundColor Yellow
            }
        }
        
        if ($accessibleCount -eq $totalFeeds) {
            Write-Host "✅ PASS: All $totalFeeds feeds are accessible" -ForegroundColor Green
        } else {
            Write-Host "⚠️  WARNING: Only $accessibleCount/$totalFeeds feeds are accessible" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}
Write-Host ""

# Test 4: Test scraper API (dry run - just check endpoint)
Write-Host "Test 4: Check scraper API endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $feedScraperApi -Method Get -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PASS: Scraper API is responding" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: Unexpected status code $($response.StatusCode)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}
Write-Host ""

# Test 5: Database check (optional - requires wrangler)
Write-Host "Test 5: Check database schema..." -ForegroundColor Yellow
try {
    $dbCheck = wrangler d1 execute vehicle-dealership-analytics --command "SELECT COUNT(*) as count FROM vendor_feeds" --remote 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PASS: vendor_feeds table exists" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: vendor_feeds table not found" -ForegroundColor Red
        Write-Host "   Run: wrangler d1 execute vehicle-dealership-analytics --file=migrations/add-vendor-feeds.sql --remote" -ForegroundColor Yellow
        $allTestsPassed = $false
    }
} catch {
    Write-Host "⚠️  SKIP: Cannot check database (wrangler not available)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
if ($allTestsPassed) {
    Write-Host "✅ All tests passed! System is ready to use." -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Test a sync:" -ForegroundColor Gray
    Write-Host "      curl -X POST $feedScraperApi/api/scrape \\" -ForegroundColor Gray
    Write-Host "        -H 'Content-Type: application/json' \\" -ForegroundColor Gray
    Write-Host "        -d '{`"vendorId`": `"lambert`"}'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   2. Access Feed Management UI in your admin dashboard" -ForegroundColor Gray
} else {
    Write-Host "X Some tests failed. Please review the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Documentation: docs/FEED_SCRAPER_MIGRATION.md" -ForegroundColor Cyan
}
Write-Host ""
