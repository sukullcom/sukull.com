# PowerShell script to test daily reset functionality
Write-Host "🧪 Testing Daily Reset Functionality" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$baseUrl = "http://localhost:3000"

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{}
    )
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -ErrorAction Stop
        return @{
            Success = $true
            Data = $response
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode
        }
    }
}

# Test 1: Check current state
Write-Host "`n🔍 Step 1: Checking current user state..." -ForegroundColor Cyan
$debugResult = Invoke-ApiRequest -Url "$baseUrl/api/debug-streak" -Method "GET"

if ($debugResult.Success) {
    Write-Host "✅ Debug info retrieved successfully!" -ForegroundColor Green
    Write-Host "Turkey Time: $($debugResult.Data.turkeyTime)" -ForegroundColor Yellow
    Write-Host "Users analyzed: $($debugResult.Data.userCount)" -ForegroundColor Yellow
    Write-Host "Summary:" -ForegroundColor Yellow
    Write-Host "  - Users with null previous_total_points: $($debugResult.Data.summary.usersWithNullPreviousPoints)" -ForegroundColor Red
    Write-Host "  - Users with correct baseline: $($debugResult.Data.summary.usersWithCorrectBaseline)" -ForegroundColor Green
    Write-Host "  - Users with outdated baseline: $($debugResult.Data.summary.usersWithOutdatedBaseline)" -ForegroundColor Red
}
else {
    Write-Host "❌ Failed to get debug info: $($debugResult.Error)" -ForegroundColor Red
}

# Test 2: Trigger manual daily reset
Write-Host "`n🚀 Step 2: Triggering manual daily reset..." -ForegroundColor Cyan
$resetResult = Invoke-ApiRequest -Url "$baseUrl/api/test-points" -Method "POST"

if ($resetResult.Success) {
    Write-Host "✅ Daily reset completed successfully!" -ForegroundColor Green
    if ($resetResult.Data.summary) {
        Write-Host "Summary:" -ForegroundColor Yellow
        Write-Host "  - Users updated: $($resetResult.Data.summary.usersUpdated)" -ForegroundColor Green
        Write-Host "  - Streaks reset: $($resetResult.Data.summary.streaksReset)" -ForegroundColor Yellow
        Write-Host "  - Duration: $($resetResult.Data.summary.durationMs)ms" -ForegroundColor Yellow
    }
}
else {
    Write-Host "❌ Daily reset failed: $($resetResult.Error)" -ForegroundColor Red
    if ($resetResult.StatusCode) {
        Write-Host "Status Code: $($resetResult.StatusCode)" -ForegroundColor Red
    }
}

# Test 3: Check state after reset
Write-Host "`n🔍 Step 3: Checking state after reset..." -ForegroundColor Cyan
Start-Sleep -Seconds 2  # Wait a bit for database updates

$debugResult2 = Invoke-ApiRequest -Url "$baseUrl/api/debug-streak" -Method "GET"

if ($debugResult2.Success) {
    Write-Host "✅ Post-reset debug info retrieved!" -ForegroundColor Green
    Write-Host "Summary after reset:" -ForegroundColor Yellow
    Write-Host "  - Users with null previous_total_points: $($debugResult2.Data.summary.usersWithNullPreviousPoints)" -ForegroundColor $(if ($debugResult2.Data.summary.usersWithNullPreviousPoints -eq 0) { "Green" } else { "Red" })
    Write-Host "  - Users with correct baseline: $($debugResult2.Data.summary.usersWithCorrectBaseline)" -ForegroundColor Green
    Write-Host "  - Users with outdated baseline: $($debugResult2.Data.summary.usersWithOutdatedBaseline)" -ForegroundColor $(if ($debugResult2.Data.summary.usersWithOutdatedBaseline -eq 0) { "Green" } else { "Red" })
    
    if ($debugResult2.Data.summary.usersWithOutdatedBaseline -eq 0) {
        Write-Host "`n🎉 SUCCESS: All users now have correct previous_total_points baseline!" -ForegroundColor Green
    }
    else {
        Write-Host "`n⚠️  WARNING: Some users still have outdated baseline" -ForegroundColor Yellow
    }
}
else {
    Write-Host "❌ Failed to get post-reset debug info: $($debugResult2.Error)" -ForegroundColor Red
}

Write-Host "`n✅ Test completed!" -ForegroundColor Green 