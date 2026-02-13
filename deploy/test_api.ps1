$base = "http://localhost:3000/api/v1"
$user = @{ email = "admin@fxtao.com"; password = "admin" } | ConvertTo-Json

Write-Host "1. Logging in..."
$loginRes = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body $user -ContentType "application/json"
$token = $loginRes.token
Write-Host "Token received: $($token.Substring(0, 10))..."

$headers = @{ Authorization = "Bearer $token" }

Write-Host "`n2. Creating Bank Account..."
$bank = @{ description = "Conta Principal"; bank_name = "Nubank"; agency = "0001"; account_number = "12345-6" } | ConvertTo-Json
$createRes = Invoke-RestMethod -Uri "$base/bank-accounts" -Method Post -Body $bank -Headers $headers -ContentType "application/json"
Write-Host "Created Bank Account ID: $($createRes.id)"

Write-Host "`n3. Listing Bank Accounts..."
$listRes = Invoke-RestMethod -Uri "$base/bank-accounts" -Method Get -Headers $headers
Write-Host "Found $($listRes.Count) bank accounts."

Write-Host "`n4. Listing TAOs..."
$taosRes = Invoke-RestMethod -Uri "$base/taos" -Method Get -Headers $headers
Write-Host "Found $($taosRes.data.Count) TAOs."

Write-Host "`n✅ API Verification Complete!"
