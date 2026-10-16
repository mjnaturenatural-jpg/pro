param(
  [ValidateSet("A", "B", "C")]
  [string]$Phase = "A"
)

$ErrorActionPreference = "Continue"

$base = "http://localhost:3000"
$mock = "http://127.0.0.1:4600"
$script:fail = 0
$script:total = 0
$productId = "6ac889f64394d5c2cf14228d"

function Status($label, $ok) {
  $script:total++
  if (-not $ok) { $script:fail++ }
  "{0} : {1}" -f $(if ($ok) { "PASS" } else { "FAIL" }), $label
}

function Get-Json($url) {
  $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
  return @{ status = $r.StatusCode; data = ($r.Content | ConvertFrom-Json) }
}

function Post-Rates($pin, $itemsJson) {
  $body = '{"pincode":"' + $pin + '","items":' + $itemsJson + '}'
  try {
    $r = Invoke-WebRequest -Uri "$base/api/shipping/rates" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 40
    return @{ status = $r.StatusCode; data = ($r.Content | ConvertFrom-Json); err = $null }
  } catch {
    $resp = $_.Exception.Response
    $code = [int]$resp.StatusCode
    $stream = $resp.GetResponseStream()
    $stream.Position = 0
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    $parsed = $null
    try { $parsed = $text | ConvertFrom-Json } catch { }
    return @{ status = $code; data = $parsed; err = $text }
  }
}

function Post-Checkout($body) {
  try {
    $r = Invoke-WebRequest -Uri "$base/api/checkout" -Method POST -ContentType "application/json" -Body $body -UseBasicParsing -TimeoutSec 40
    return @{ status = $r.StatusCode; data = ($r.Content | ConvertFrom-Json) }
  } catch {
    $resp = $_.Exception.Response
    $code = [int]$resp.StatusCode
    $stream = $resp.GetResponseStream()
    $stream.Position = 0
    $reader = New-Object System.IO.StreamReader($stream)
    $text = $reader.ReadToEnd()
    $parsed = $null
    try { $parsed = $text | ConvertFrom-Json } catch { }
    return @{ status = $code; data = $parsed }
  }
}

$oneItem = '[{"packSize":"250g","quantity":1}]'
$checkoutPrefix = '{"items":[{"productId":"' + $productId + '","packSize":"250g","quantity":1}],"address":{"fullName":"Ship Test","phone":"9493435877","email":"test@example.com","line1":"1 Main St","area":"Area","city":"Hyderabad","state":"Telangana","pincode":"500001"},"couponCode":null'

if ($Phase -eq "A") {
  "--- Phase A: rates NOT configured (default env) ---"

  try {
    $g = Get-Json "$base/api/shipping/rates"
    Status "GET availability 200 available:false" ($g.status -eq 200 -and $g.data.available -eq $false)
  } catch { Status "GET availability 200 available:false" $false }

  $r = Post-Rates "500001" $oneItem
  Status "POST valid pincode -> 503 NOT_CONFIGURED structured" (
    $r.status -eq 503 -and $r.data.code -eq "NOT_CONFIGURED" -and $r.data.fallback -eq $true -and $r.data.error
  )

  $r = Post-Rates "123" $oneItem
  Status "POST invalid pincode -> 400 INVALID_INPUT" ($r.status -eq 400 -and $r.data.code -eq "INVALID_INPUT")

  $r = Post-Rates "500001" "[]"
  Status "POST empty items -> 400" ($r.status -eq 400 -and $r.data.code -eq "INVALID_INPUT")

  $r = Post-Rates "500001" '[{"packSize":"250g","quantity":0}]'
  Status "POST quantity 0 -> 400" ($r.status -eq 400 -and $r.data.code -eq "INVALID_INPUT")
}

if ($Phase -eq "B") {
  "--- Phase B: rates configured against mock Shiprocket ---"

  try {
    $g = Get-Json "$base/api/shipping/rates"
    Status "GET availability 200 available:true" ($g.status -eq 200 -and $g.data.available -eq $true)
  } catch { Status "GET availability 200 available:true" $false }

  $r = Post-Rates "500001" $oneItem
  $opts = @()
  if ($r.data -and $r.data.options) { $opts = @($r.data.options) }
  $sorted = $opts.Count -eq 2 -and $opts[0].courierId -eq 101 -and $opts[0].rate -eq 55 -and $opts[1].courierId -eq 102 -and $opts[1].rate -eq 63
  Status "healthy: 200, invalid entries filtered, sorted, rounded (55,63)" (
    $r.status -eq 200 -and $sorted -and $r.data.weightKg -ge 0.1
  )

  $r = Post-Rates "500002" $oneItem
  Status "flaky 500 once: read retry recovers -> 200" ($r.status -eq 200 -and @($r.data.options).Count -eq 2)

  $r = Post-Rates "500003" $oneItem
  Status "slow provider: -> 504 TIMEOUT retryable" (
    $r.status -eq 504 -and $r.data.code -eq "TIMEOUT" -and $r.data.retryable -eq $true -and $r.data.error
  )

  $r = Post-Rates "500004" $oneItem
  Status "malformed JSON: -> 502 MALFORMED retryable" (
    $r.status -eq 502 -and $r.data.code -eq "MALFORMED" -and $r.data.retryable -eq $true
  )

  $r = Post-Rates "500005" $oneItem
  Status "unserviceable message body: -> 200 options []" ($r.status -eq 200 -and @($r.data.options).Count -eq 0)

  $r = Post-Rates "500006" $oneItem
  Status "401 once: token refresh recovers -> 200" ($r.status -eq 200 -and @($r.data.options).Count -eq 2)

  $r = Post-Rates "500007" $oneItem
  $st = $null
  try { $st = (Invoke-WebRequest -Uri "$mock/__stats" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json } catch { }
  Status "always 500: -> 502 UPSTREAM retryable, bounded (2 hits)" (
    $r.status -eq 502 -and $r.data.code -eq "UPSTREAM" -and $r.data.retryable -eq $true -and
    $st -and $st.serviceability."500007" -eq 2
  )

  $r = Post-Rates "500008" $oneItem
  $st = $null
  try { $st = (Invoke-WebRequest -Uri "$mock/__stats" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json } catch { }
  Status "always 401: -> 502 UNAUTHORIZED, bounded (2 hits, no recursion)" (
    $r.status -eq 502 -and $r.data.code -eq "UNAUTHORIZED" -and
    $st -and $st.serviceability."500008" -eq 2
  )

  # Checkout server-side courier verification against the mock.
  $body = $checkoutPrefix + ',"shippingOption":{"courierId":101,"rate":55}}'
  $r = Post-Checkout $body
  Status "checkout verifies courier rate server-side: totals.shipping=55" (
    $r.status -eq 200 -and $r.data.totals.shipping -eq 55
  )

  $body = $checkoutPrefix + ',"shippingOption":{"courierId":101,"rate":1}}'
  $r = Post-Checkout $body
  Status "checkout rejects tampered rate -> 409" ($r.status -eq 409)

  $body = $checkoutPrefix + ',"shippingOption":{"courierId":999999,"rate":55}}'
  $r = Post-Checkout $body
  Status "checkout rejects unknown courier -> 409" ($r.status -eq 409)
}

if ($Phase -eq "C") {
  "--- Phase C: shipment lifecycle against mock Shiprocket ---"

  $envFile = ".env.local"
  $adminEmail = (Get-Content $envFile | Where-Object { $_ -match "^ADMIN_EMAIL=" }) -replace "^ADMIN_EMAIL=", ""
  $adminPass = (Get-Content $envFile | Where-Object { $_ -match "^ADMIN_PASSWORD=" }) -replace "^ADMIN_PASSWORD=", ""
  $whSecretC = (Get-Content $envFile | Where-Object { $_ -match "^RAZORPAY_WEBHOOK_SECRET=" }) -replace "^RAZORPAY_WEBHOOK_SECRET=", ""

  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  try {
    $csrf = (Invoke-WebRequest -Uri "$base/api/auth/csrf" -WebSession $session -UseBasicParsing -TimeoutSec 20).Content | ConvertFrom-Json
    $form = "csrfToken=$([uri]::EscapeDataString($csrf.csrfToken))&email=$([uri]::EscapeDataString($adminEmail))&password=$([uri]::EscapeDataString($adminPass))&json=true"
    try { Invoke-WebRequest -Uri "$base/api/auth/callback/credentials" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $form -WebSession $session -UseBasicParsing -TimeoutSec 30 | Out-Null } catch { }
    $sessInfo = (Invoke-WebRequest -Uri "$base/api/auth/session" -WebSession $session -UseBasicParsing -TimeoutSec 20).Content | ConvertFrom-Json
    Status "admin login (role ADMIN)" ($sessInfo.user.role -eq "ADMIN")
  } catch { Status "admin login (role ADMIN)" $false }

  try { Invoke-WebRequest -Uri "$mock/__reset" -Method POST -UseBasicParsing -TimeoutSec 10 | Out-Null } catch { }

  function Mark-PaidC($rzp, $amountPaise, $eventId, $payId) {
    $payload = '{"id":"' + $eventId + '","event":"payment.captured","payload":{"payment":{"entity":{"id":"' + $payId + '","order_id":"' + $rzp + '","status":"captured","amount":' + $amountPaise + ',"currency":"INR","method":"upi"}}}}'
    $hm = New-Object System.Security.Cryptography.HMACSHA256
    $hm.Key = [Text.Encoding]::UTF8.GetBytes($whSecretC)
    $sig = ([BitConverter]::ToString($hm.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))) -replace "-", "").ToLower()
    try { return (Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $payload -Headers @{"x-razorpay-signature" = $sig} -UseBasicParsing -TimeoutSec 30).StatusCode } catch { return 0 }
  }

  function Admin-PatchC($orderId, $json) {
    try {
      $r = Invoke-WebRequest -Uri "$base/api/admin/orders/$orderId" -Method PATCH -ContentType "application/json" -Body $json -WebSession $session -UseBasicParsing -TimeoutSec 40
      return @{ status = $r.StatusCode; data = ($r.Content | ConvertFrom-Json) }
    } catch {
      $resp = $_.Exception.Response
      $code = [int]$resp.StatusCode
      $text = (New-Object System.IO.StreamReader($resp.GetResponseStream())).ReadToEnd()
      $parsed = $null; try { $parsed = $text | ConvertFrom-Json } catch { }
      return @{ status = $code; data = $parsed }
    }
  }

  function New-ShipOrder($email) {
    $b = '{"items":[{"productId":"' + $productId + '","packSize":"250g","quantity":1}],"address":{"fullName":"Ship Test","phone":"9493435877","email":"' + $email + '","line1":"1 Main St","area":"Area","city":"Hyderabad","state":"Telangana","pincode":"500001"},"couponCode":null,"shippingOption":{"courierId":101,"rate":55}}'
    return Post-Checkout $b
  }

  # 1. A paid order (checkout creates the Razorpay order; webhook marks it PAID)
  $coA = New-ShipOrder "test@example.com"
  Status "paid order: checkout 200 + totals.shipping 55" ($coA.status -eq 200 -and $coA.data.totals.shipping -eq 55)
  $oidA = $coA.data.orderId
  $paidA = Mark-PaidC $coA.data.razorpayOrderId $coA.data.amount "evt_ship_paid_a" "pay_ship_a"
  Status "paid order A marked PAID via webhook" ($paidA -eq 200)

  # 2. An unpaid order must NOT be shippable (payment guard)
  $coB = New-ShipOrder "ship-unpaid@example.com"
  $oidB = $coB.data.orderId
  $gB = Admin-PatchC $oidB '{"action":"create_shiprocket_shipment"}'
  Status "unpaid order shipment blocked 409" ($gB.status -eq 409)

  # 3. Create shipment on the paid order (mock auto-assigns an AWB)
  $c1 = Admin-PatchC $oidA '{"action":"create_shiprocket_shipment"}'
  Status "create shipment 200 + awb + order/shipment ids" (
    $c1.status -eq 200 -and $c1.data.order.awb -and $c1.data.order.shiprocketShipmentId -and $c1.data.order.shiprocketOrderId
  )

  # 4. Duplicate creation blocked
  $c2 = Admin-PatchC $oidA '{"action":"create_shiprocket_shipment"}'
  Status "duplicate shipment blocked 400" ($c2.status -eq 400)

  # 5. Tracking refresh persists status + scan history
  $t1 = Admin-PatchC $oidA '{"action":"refresh_shiprocket_tracking"}'
  Status "refresh tracking 200 + status + history" (
    $t1.status -eq 200 -and $t1.data.order.shipmentStatus -and @($t1.data.order.shipmentHistory).Count -ge 1
  )

  # 6. Label + manifest
  $l1 = Admin-PatchC $oidA '{"action":"generate_shiprocket_label"}'
  Status "generate label 200 + labelUrl" ($l1.status -eq 200 -and $l1.data.labelUrl)
  $m1 = Admin-PatchC $oidA '{"action":"generate_shiprocket_manifest"}'
  Status "generate manifest 200 + manifestUrl" ($m1.status -eq 200 -and $m1.data.manifestUrl)

  # 7. Pickup
  $p1 = Admin-PatchC $oidA '{"action":"request_shiprocket_pickup"}'
  Status "request pickup 200 + scheduled" ($p1.status -eq 200 -and $p1.data.order.shipmentStatus -match "Pickup")

  # 8. AWB-pending path: disable auto-AWB, create shipment, then assign explicitly
  try { Invoke-WebRequest -Uri "$mock/__config" -Method POST -ContentType "application/json" -Body '{"createAwb":false}' -UseBasicParsing -TimeoutSec 10 | Out-Null } catch { }
  $coD = New-ShipOrder "test@example.com"
  $oidD = $coD.data.orderId
  $paidD = Mark-PaidC $coD.data.razorpayOrderId $coD.data.amount "evt_ship_paid_d" "pay_ship_d"
  $d1 = Admin-PatchC $oidD '{"action":"create_shiprocket_shipment"}'
  Status "shipment created without AWB (pending)" (
    $paidD -eq 200 -and $d1.status -eq 200 -and -not $d1.data.order.awb -and $d1.data.order.shiprocketShipmentId
  )
  $d2 = Admin-PatchC $oidD '{"action":"assign_shiprocket_awb"}'
  Status "assign AWB 200 + awb set" ($d2.status -eq 200 -and $d2.data.order.awb)
  $d3 = Admin-PatchC $oidD '{"action":"assign_shiprocket_awb"}'
  Status "assign AWB again blocked 400" ($d3.status -eq 400)

  # 9. A Shiprocket failure must NOT change a verified payment status.
  $coE = New-ShipOrder "ship-fail@example.com"
  $oidE = $coE.data.orderId
  $paidE = Mark-PaidC $coE.data.razorpayOrderId $coE.data.amount "evt_ship_paid_e" "pay_ship_e"
  try { Invoke-WebRequest -Uri "$mock/__config" -Method POST -ContentType "application/json" -Body '{"failCreate":true}' -UseBasicParsing -TimeoutSec 10 | Out-Null } catch { }
  $f1 = Admin-PatchC $oidE '{"action":"create_shiprocket_shipment"}'
  Status "shiprocket failure -> 502" ($f1.status -eq 502)
  try {
    $g1 = Invoke-WebRequest -Uri "$base/api/admin/orders/$oidE" -WebSession $session -UseBasicParsing -TimeoutSec 30
    $g1d = $g1.Content | ConvertFrom-Json
    Status "verified payment stays PAID after shiprocket failure" ($g1d.order.paymentStatus -eq "PAID" -and $g1d.order.shipmentError)
  } catch { Status "verified payment stays PAID after shiprocket failure" $false }
  try { Invoke-WebRequest -Uri "$mock/__config" -Method POST -ContentType "application/json" -Body '{"failCreate":false}' -UseBasicParsing -TimeoutSec 10 | Out-Null } catch { }

  # 10. Mock op counters prove the endpoints were actually exercised
  try {
    $st = (Invoke-WebRequest -Uri "$mock/__stats" -UseBasicParsing -TimeoutSec 10).Content | ConvertFrom-Json
    Status "mock ops exercised (create/track/label/manifest/pickup/assign)" (
      $st.ops.create -ge 2 -and $st.ops.track -ge 1 -and $st.ops.label -ge 1 -and $st.ops.manifest -ge 1 -and $st.ops.pickup -ge 1 -and $st.ops.assign_awb -ge 1
    )
  } catch { Status "mock ops exercised" $false }

  try { Invoke-WebRequest -Uri "$mock/__config" -Method POST -ContentType "application/json" -Body '{"createAwb":true}' -UseBasicParsing -TimeoutSec 10 | Out-Null } catch { }
}

""
"shipping-tests phase $Phase : $($script:total - $script:fail)/$($script:total) passed"
if ($script:fail -gt 0) { exit 1 }
exit 0
