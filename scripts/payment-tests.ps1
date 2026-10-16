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

# --- New coverage: reuse, signature binding, idempotency, no-downgrade, rate limit ---

# 9. Second customer: fresh pending order (no reuse across emails)
$body2 = $body -replace "test@example.com", "test2@example.com"
$oid2 = ""; $rzp2 = ""
try {
  $r9 = Invoke-WebRequest -Uri "$base/api/checkout" -Method POST -ContentType "application/json" -Body $body2 -UseBasicParsing -TimeoutSec 40
  $d9 = $r9.Content | ConvertFrom-Json
  $oid2 = $d9.orderId; $rzp2 = $d9.razorpayOrderId
  Status "second customer gets pending order" ($r9.StatusCode -eq 200 -and $oid2 -and $rzp2 -and -not $d9.paid)
} catch { Status "second customer gets pending order" $false }

# 10. Pending attempt reuse: same customer + same cart returns the SAME order
try {
  $r10 = Invoke-WebRequest -Uri "$base/api/checkout" -Method POST -ContentType "application/json" -Body $body2 -UseBasicParsing -TimeoutSec 40
  $d10 = $r10.Content | ConvertFrom-Json
  Status "pending attempt reused (same order id)" ($d10.orderId -eq $oid2 -and $d10.razorpayOrderId -eq $rzp2 -and -not $d10.paid)
} catch { Status "pending attempt reused (same order id)" $false }

# Signed payloads: we hold KEY_SECRET locally, so we can forge Razorpay's
# browser-callback signature for negative/edge cases (never done in prod code).
$keySecret = (Get-Content .env.local | Where-Object { $_ -match "^RAZORPAY_KEY_SECRET=" }) -replace "^RAZORPAY_KEY_SECRET=", ""
function HmacHex([string]$msg, [string]$secret) {
  $hm = New-Object System.Security.Cryptography.HMACSHA256
  $hm.Key = [Text.Encoding]::UTF8.GetBytes($secret)
  $hex = [BitConverter]::ToString($hm.ComputeHash([Text.Encoding]::UTF8.GetBytes($msg))) -replace "-", ""
  return $hex.ToLower()
}

# 11. Valid signature but wrong internal order id -> 400 (binding enforced)
$sigA = HmacHex ($rzp2 + "|pay_bind_test") $keySecret
try {
  Invoke-WebRequest -Uri "$base/api/payments/verify" -Method POST -ContentType "application/json" -Body ('{"razorpay_order_id":"' + $rzp2 + '","razorpay_payment_id":"pay_bind_test","razorpay_signature":"' + $sigA + '","internal_order_id":"' + $oid + '"}') -UseBasicParsing -TimeoutSec 30 | Out-Null
  Status "verify wrong internal_order_id 400" $false
} catch { Status "verify wrong internal_order_id 400" ([int]$_.Exception.Response.StatusCode -eq 400) }

# 12. Valid signature + correct internal id but unknown payment -> 502 (authoritative fetch)
$sigB = HmacHex ($rzp2 + "|pay_not_real_1") $keySecret
try {
  Invoke-WebRequest -Uri "$base/api/payments/verify" -Method POST -ContentType "application/json" -Body ('{"razorpay_order_id":"' + $rzp2 + '","razorpay_payment_id":"pay_not_real_1","razorpay_signature":"' + $sigB + '","internal_order_id":"' + $oid2 + '"}') -UseBasicParsing -TimeoutSec 30 | Out-Null
  Status "verify unknown payment 502" $false
} catch { Status "verify unknown payment 502" ([int]$_.Exception.Response.StatusCode -eq 502) }

# 13. Duplicate verify callback on an already-PAID order -> idempotent ok:true
$sigC = HmacHex ($rzp + "|pay_dup_callback") $keySecret
try {
  $r13 = Invoke-WebRequest -Uri "$base/api/payments/verify" -Method POST -ContentType "application/json" -Body ('{"razorpay_order_id":"' + $rzp + '","razorpay_payment_id":"pay_dup_callback","razorpay_signature":"' + $sigC + '","internal_order_id":"' + $oid + '"}') -UseBasicParsing -TimeoutSec 30
  $d13 = $r13.Content | ConvertFrom-Json
  Status "duplicate verify idempotent ok" ($r13.StatusCode -eq 200 -and $d13.ok -eq $true -and $d13.orderId -eq $oid)
} catch { Status "duplicate verify idempotent ok" $false }

# 14. Delayed payment.failed for a PAID order -> never downgrades
$failPaid = '{"id":"evt_late_fail_1","event":"payment.failed","payload":{"payment":{"entity":{"id":"pay_late_fail","order_id":"' + $rzp + '","status":"failed","amount":' + $co.amount + '}}}}'
$sigF1 = HmacHex $failPaid $whSecret
try {
  Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $failPaid -Headers @{"x-razorpay-signature" = $sigF1} -UseBasicParsing -TimeoutSec 30 | Out-Null
  $s14 = Invoke-WebRequest -Uri "$base/api/orders/$oid/status?token=$tok" -UseBasicParsing -TimeoutSec 30
  $d14 = $s14.Content | ConvertFrom-Json
  Status "late failed event does not downgrade PAID" ($d14.paymentStatus -eq "PAID")
} catch { Status "late failed event does not downgrade PAID" $false }

# 15. payment.failed for a PENDING order -> FAILED
$failPending = '{"id":"evt_fail_pending_1","event":"payment.failed","payload":{"payment":{"entity":{"id":"pay_fail_p1","order_id":"' + $rzp2 + '","status":"failed","amount":' + $co.amount + '}}}}'
$sigF2 = HmacHex $failPending $whSecret
try {
  $w15 = Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $failPending -Headers @{"x-razorpay-signature" = $sigF2} -UseBasicParsing -TimeoutSec 30
  $s15 = Invoke-WebRequest -Uri "$base/api/orders/$oid2/status?token=$($d9.accessToken)" -UseBasicParsing -TimeoutSec 30
  $d15 = $s15.Content | ConvertFrom-Json
  Status "failed event marks pending order FAILED" ($w15.StatusCode -eq 200 -and $d15.paymentStatus -eq "FAILED")
} catch { Status "failed event marks pending order FAILED" $false }

# 16. Delayed payment.captured (new event id) for PAID order -> 200, still PAID
$lateCap = '{"id":"evt_late_cap_1","event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_late_cap","order_id":"' + $rzp + '","status":"captured","amount":' + $co.amount + ',"currency":"INR","method":"upi"}}}}'
$sigL = HmacHex $lateCap $whSecret
try {
  $r16 = Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $lateCap -Headers @{"x-razorpay-signature" = $sigL} -UseBasicParsing -TimeoutSec 30
  $s16 = Invoke-WebRequest -Uri "$base/api/orders/$oid/status?token=$tok" -UseBasicParsing -TimeoutSec 30
  $d16 = $s16.Content | ConvertFrom-Json
  Status "late captured event acked, order stays PAID" ($r16.StatusCode -eq 200 -and $d16.paymentStatus -eq "PAID")
} catch { Status "late captured event acked, order stays PAID" $false }

# 17. Rate limit on the verify endpoint
$got429 = $false
for ($i = 0; $i -lt 20; $i++) {
  try {
    Invoke-WebRequest -Uri "$base/api/payments/verify" -Method POST -ContentType "application/json" -Body ('{"razorpay_order_id":"x","razorpay_payment_id":"y","razorpay_signature":"z"}') -UseBasicParsing -TimeoutSec 15 | Out-Null
  } catch {
    if ([int]$_.Exception.Response.StatusCode -eq 429) { $got429 = $true; break }
  }
}
Status "verify rate limited with 429" $got429

"order=$($co.orderNumber) rzp=$rzp | order2=$($d9.orderNumber) rzp2=$rzp2"
