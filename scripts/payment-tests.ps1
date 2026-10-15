$ErrorActionPreference = "Continue"
$base = "http://localhost:3000"

function Status($label, $ok) { "{0} : {1}" -f $(if ($ok) { "PASS" } else { "FAIL" }), $label }

# 1. Checkout
$body = '{"items":[{"productId":"6ac889f64394d5c2cf14228d","packSize":"250g","quantity":1}],"address":{"fullName":"Test User","phone":"9493435877","email":"test@example.com","line1":"1 Main St","area":"Area","city":"Hyderabad","state":"Telangana","pincode":"500001"},"couponCode":null}'
try {
  $r = Invoke-WebRequest -Uri "$base/api/checkout" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 40
  $co = $r.Content | ConvertFrom-Json
  Status "checkout 200 + accessToken" ($r.StatusCode -eq 200 -and $co.accessToken.Length -gt 20)
} catch { Status "checkout 200 + accessToken" $false; exit 1 }

$oid = $co.orderId; $tok = $co.accessToken; $rzp = $co.razorpayOrderId

# 2. Status endpoint auth
foreach ($case in @(
  @{ n = "status no token 401"; u = "$base/api/orders/$oid/status" },
  @{ n = "status wrong token 401"; u = "$base/api/orders/$oid/status?token=deadbeef" }
)) {
  try { Invoke-WebRequest -Uri $case.u -UseBasicParsing -TimeoutSec 30 | Out-Null; Status $case.n $false }
  catch { Status $case.n ([int]$_.Exception.Response.StatusCode -eq 401) }
}
try {
  $s = Invoke-WebRequest -Uri "$base/api/orders/$oid/status?token=$tok" -UseBasicParsing -TimeoutSec 30
  $sd = $s.Content | ConvertFrom-Json
  Status "status valid token 200 PENDING" ($s.StatusCode -eq 200 -and $sd.paymentStatus -eq "PENDING")
} catch { Status "status valid token 200 PENDING" $false }

# 3. Order-success page gating
try {
  $p1 = Invoke-WebRequest -Uri "$base/order-success/$oid" -UseBasicParsing -TimeoutSec 30
  Status "success page no token -> access denied" ($p1.Content -match "not valid")
} catch { Status "success page no token -> access denied" $false }
try {
  $p2 = Invoke-WebRequest -Uri "$base/order-success/$($oid)?token=$tok" -UseBasicParsing -TimeoutSec 30
  $m1 = $p2.Content -match "Payment Processing"
  $m2 = $p2.Content -match [regex]::Escape($co.orderNumber)
  if (-not ($m1 -and $m2)) {
    "  debug page: status=$($p2.StatusCode) processing=$m1 orderno=$m2 notvalid=$($p2.Content -match 'not valid') len=$($p2.Content.Length) toklen=$($tok.Length) oidlen=$($oid.Length)"
    Set-Content -LiteralPath ".tmp-page-fail.html" -Value $p2.Content
  }
  Status "success page with token renders pending" ($m1 -and $m2)
} catch { "  debug page error: $($_.Exception.Message)"; Status "success page with token renders pending" $false }

# 4. Receipt (pending wording) + token gate
try { Invoke-WebRequest -Uri "$base/api/orders/$oid/receipt" -UseBasicParsing -TimeoutSec 30 | Out-Null; Status "receipt no token 401" $false }
catch { Status "receipt no token 401" ([int]$_.Exception.Response.StatusCode -eq 401) }
try {
  $rc = Invoke-WebRequest -Uri "$base/api/orders/$oid/receipt?token=$tok" -UseBasicParsing -TimeoutSec 40
  $bytes = [System.Text.Encoding]::ASCII.GetString($rc.Content[0..3])
  Status "receipt pending PDF + attachment name" ($rc.Headers["Content-Type"] -eq "application/pdf" -and $bytes -eq "%PDF" -and $rc.Headers["Content-Disposition"] -match "MJ-Nature-Order-")
} catch { Status "receipt pending PDF + attachment name" $false }

# 5. Webhook: forged sig -> 400; valid sig -> 200; duplicate -> duplicate:true
$whSecret = (Get-Content .env.local | Where-Object { $_ -match "^RAZORPAY_WEBHOOK_SECRET=" }) -replace "^RAZORPAY_WEBHOOK_SECRET=", ""
$payload = '{"id":"evt_test_123","event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_test_1","order_id":"' + $rzp + '","status":"captured","amount":' + ($co.amount) + ',"method":"upi"}}}}'
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($whSecret)
$sig = [BitConverter]::ToString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))) -replace "-", ""
$sig = $sig.ToLower()
try { Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $payload -Headers @{"x-razorpay-signature" = "deadbeef"} -UseBasicParsing -TimeoutSec 30 | Out-Null; Status "webhook forged sig 400" $false }
catch { Status "webhook forged sig 400" ([int]$_.Exception.Response.StatusCode -eq 400) }
try {
  $w1 = Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $payload -Headers @{"x-razorpay-signature" = $sig} -UseBasicParsing -TimeoutSec 40
  Status "webhook valid sig 200" ($w1.StatusCode -eq 200)
} catch {
  $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  "  debug webhook: $([int]$_.Exception.Response.StatusCode) " + $sr.ReadToEnd()
  Status "webhook valid sig 200" $false
}
try {
  $w2 = Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $payload -Headers @{"x-razorpay-signature" = $sig} -UseBasicParsing -TimeoutSec 30
  $w2d = $w2.Content | ConvertFrom-Json
  Status "webhook duplicate idempotent" ($w2d.duplicate -eq $true)
} catch { Status "webhook duplicate idempotent" $false }

# 6. Order should now be PAID (webhook finalized it)
try {
  $s2 = Invoke-WebRequest -Uri "$base/api/orders/$oid/status?token=$tok" -UseBasicParsing -TimeoutSec 30
  $sd2 = $s2.Content | ConvertFrom-Json
  Status "webhook marked order PAID" ($sd2.paymentStatus -eq "PAID")
} catch { Status "webhook marked order PAID" $false }

# 7. Success page now shows Payment Successful; receipt is a paid receipt
try {
  $p3 = Invoke-WebRequest -Uri "$base/order-success/$($oid)?token=$tok" -UseBasicParsing -TimeoutSec 30
  Status "success page shows PAID" ($p3.Content -match "Payment Successful")
} catch { Status "success page shows PAID" $false }
try {
  $rc2 = Invoke-WebRequest -Uri "$base/api/orders/$oid/receipt?token=$tok" -UseBasicParsing -TimeoutSec 40
  $txt = [System.Text.Encoding]::UTF8.GetString($rc2.Content)
  Status "paid receipt PDF 200" ($rc2.StatusCode -eq 200 -and $rc2.Headers["Content-Type"] -eq "application/pdf")
} catch { Status "paid receipt PDF 200" $false }

# 8. Verify route: bad signature on a fresh pending order
try { Invoke-WebRequest -Uri "$base/api/payments/verify" -Method POST -ContentType "application/json" -Body ('{"razorpay_order_id":"' + $rzp + '","razorpay_payment_id":"pay_x","razorpay_signature":"bad"}') -UseBasicParsing -TimeoutSec 30 | Out-Null; Status "verify bad sig 400" $false }
catch { Status "verify bad sig 400" ([int]$_.Exception.Response.StatusCode -eq 400) }

"order=$($co.orderNumber) rzp=$rzp"
