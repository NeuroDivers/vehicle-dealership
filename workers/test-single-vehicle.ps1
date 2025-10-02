$body = @{
    dealerUrl = "https://sltautos.com"
    dealerId = "sltautos"
    dealerName = "SLT Autos"
} | ConvertTo-Json

Write-Host "Testing SLT Autos scraper..." -ForegroundColor Cyan
Write-Host "Calling scraper API..." -ForegroundColor Yellow

$response = Invoke-RestMethod -Uri "https://generic-dealer-scraper.nick-damato0011527.workers.dev/api/scrape" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

Write-Host "`nSuccess: $($response.success)" -ForegroundColor Green
Write-Host "Total vehicles found: $($response.vehicles.Count)" -ForegroundColor Green

if ($response.vehicles.Count -gt 0) {
    # Find the Acura RDX
    $acuraRdx = $response.vehicles | Where-Object { $_.make -eq "Acura" -and $_.url -like "*1743707407*" }
    
    if ($acuraRdx) {
        Write-Host "`n=== 2014 Acura RDX (URL: 1743707407) ===" -ForegroundColor Cyan
        Write-Host "Make: $($acuraRdx.make)" -ForegroundColor White
        Write-Host "Model: $($acuraRdx.model)" -ForegroundColor White
        Write-Host "Year: $($acuraRdx.year)" -ForegroundColor White
        Write-Host "VIN: $($acuraRdx.vin)" -ForegroundColor White
        Write-Host "Odometer: $($acuraRdx.odometer)" -ForegroundColor White
        Write-Host "Color: $($acuraRdx.color)" -ForegroundColor White
        Write-Host "Engine Size: $($acuraRdx.engineSize)" -ForegroundColor White
        Write-Host "Cylinders: $($acuraRdx.cylinders)" -ForegroundColor White
        Write-Host "Transmission: $($acuraRdx.transmission)" -ForegroundColor White
        Write-Host "Body Type: $($acuraRdx.bodyType)" -ForegroundColor White
        Write-Host "Price: $($acuraRdx.price)" -ForegroundColor White
        
        # Check what's missing
        Write-Host "`n=== Validation ===" -ForegroundColor Yellow
        if ([string]::IsNullOrEmpty($acuraRdx.model)) { Write-Host "❌ Model is MISSING" -ForegroundColor Red } else { Write-Host "✅ Model is present" -ForegroundColor Green }
        if ([string]::IsNullOrEmpty($acuraRdx.vin)) { Write-Host "❌ VIN is MISSING" -ForegroundColor Red } else { Write-Host "✅ VIN is present" -ForegroundColor Green }
        if ($acuraRdx.odometer -eq 0) { Write-Host "❌ Odometer is 0" -ForegroundColor Red } else { Write-Host "✅ Odometer is present: $($acuraRdx.odometer)" -ForegroundColor Green }
        if ($acuraRdx.color -eq "Unknown") { Write-Host "❌ Color is Unknown" -ForegroundColor Red } else { Write-Host "✅ Color is present: $($acuraRdx.color)" -ForegroundColor Green }
    } else {
        Write-Host "`n⚠️  Could not find the Acura RDX with URL 1743707407" -ForegroundColor Yellow
        Write-Host "`nFirst vehicle in results:" -ForegroundColor Cyan
        $first = $response.vehicles[0]
        Write-Host "Make: $($first.make)"
        Write-Host "Model: $($first.model)"
        Write-Host "URL: $($first.url)"
    }
}
