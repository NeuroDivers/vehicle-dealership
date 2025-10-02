$body = @{
    dealerUrl = "https://sltautos.com"
    dealerId = "sltautos"
    dealerName = "SLT Autos"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://generic-dealer-scraper.nick-damato0011527.workers.dev/api/scrape" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

Write-Host "Success: $($response.success)"
Write-Host "Vehicles found: $($response.vehicles.Count)"

if ($response.vehicles.Count -gt 0) {
    $vehicle = $response.vehicles[0]
    Write-Host "`nFirst vehicle:"
    Write-Host "Make: $($vehicle.make)"
    Write-Host "Model: $($vehicle.model)"
    Write-Host "VIN: $($vehicle.vin)"
    Write-Host "Odometer: $($vehicle.odometer)"
    Write-Host "Color: $($vehicle.color)"
    Write-Host "Engine Size: $($vehicle.engineSize)"
    Write-Host "Cylinders: $($vehicle.cylinders)"
}
