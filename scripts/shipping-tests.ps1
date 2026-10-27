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

function Request-Json($uri, $method = "GET", $body = $null, $session = $null) {
  try {
    $args = @{ Uri = $uri; Method = $method; UseBasicParsing = $true; TimeoutSec = 40 }
    if ($body) { $args.ContentType = "application/json"; $args.Body = $body }
    if ($session) { $args.WebSession = $session }
    $r = Invoke-WebRequest @args
    return @{ status = $r.StatusCode; data = ($r.Content | ConvertFrom-Json) }
  } catch {
    $response = $_.Exception.Response
    if (-not $response) { return @{ status = 0; data = $null } }
    $text = (New-Object System.IO.StreamReader($response.GetResponseStream())).ReadToEnd()
    $data = $null; try { $data = $text | ConvertFrom-Json } catch { }
    return @{ status = [int]$response.StatusCode; data = $data }
  }
}

function New-Checkout($email) {
  $body = '{"items":[{"productId":"' + $productId + '","packSize":"250g","quantity":1}],"address":{"fullName":"Shipping Test","phone":"9000000000","email":"' + $email + '","line1":"1 Main St","area":"Area","city":"Hyderabad","state":"Telangana","pincode":"500001"},"couponCode":null}'
  return Request-Json "$base/api/checkout" "POST" $body
}

if ($Phase -eq "A" -or $Phase -eq "B") {
  "--- Live Delhivery rates are intentionally unavailable ---"
  $availability = Request-Json "$base/api/shipping/rates"
  Status "GET availability returns available:false" ($availability.status -eq 200 -and $availability.data.available -eq $false)
  $rates = Request-Json "$base/api/shipping/rates" "POST" '{"pincode":"500001","items":[{"packSize":"250g","quantity":1}]}'
  Status "POST rates returns fallback 503" ($rates.status -eq 503 -and $rates.data.code -eq "NOT_CONFIGURED" -and $rates.data.fallback -eq $true)
}

if ($Phase -eq "C") {
  "--- Shipment creation and tracking against mock Delhivery ---"
  $envFile = ".env.local"
  $adminEmail = (Get-Content $envFile | Where-Object { $_ -match "^ADMIN_EMAIL=" }) -replace "^ADMIN_EMAIL=", ""
  $adminPass = (Get-Content $envFile | Where-Object { $_ -match "^ADMIN_PASSWORD=" }) -replace "^ADMIN_PASSWORD=", ""
  $webhookSecret = (Get-Content $envFile | Where-Object { $_ -match "^RAZORPAY_WEBHOOK_SECRET=" }) -replace "^RAZORPAY_WEBHOOK_SECRET=", ""
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $csrf = Request-Json "$base/api/auth/csrf" "GET" $null $session
  $login = "csrfToken=$([uri]::EscapeDataString($csrf.data.csrfToken))&email=$([uri]::EscapeDataString($adminEmail))&password=$([uri]::EscapeDataString($adminPass))&json=true"
  try { Invoke-WebRequest -Uri "$base/api/auth/callback/credentials" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $login -WebSession $session -UseBasicParsing | Out-Null } catch { }
  $auth = Request-Json "$base/api/auth/session" "GET" $null $session
  Status "admin login" ($auth.data.user.role -eq "ADMIN")
  Request-Json "$mock/__reset" "POST" "{}" | Out-Null

  function Mark-Paid($razorpayOrderId, $amount, $eventId) {
    $payload = '{"id":"' + $eventId + '","event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_' + $eventId + '","order_id":"' + $razorpayOrderId + '","status":"captured","amount":' + $amount + ',"currency":"INR","method":"upi"}}}}'
    $hmac = New-Object System.Security.Cryptography.HMACSHA256
    $hmac.Key = [Text.Encoding]::UTF8.GetBytes($webhookSecret)
    $signature = ([BitConverter]::ToString($hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))) -replace "-", "").ToLower()
    try { return (Invoke-WebRequest -Uri "$base/api/payments/webhook" -Method POST -ContentType "application/json" -Body $payload -Headers @{ "x-razorpay-signature" = $signature } -UseBasicParsing).StatusCode } catch { return 0 }
  }

  $unpaid = New-Checkout "unpaid@example.com"
  $blocked = Request-Json "$base/api/admin/orders/$($unpaid.data.orderId)" "PATCH" '{"action":"create_delhivery_shipment"}' $session
  Status "unpaid order shipment is blocked" ($blocked.status -eq 409)

  $checkout = New-Checkout "paid@example.com"
  $paid = Mark-Paid $checkout.data.razorpayOrderId $checkout.data.amount "delhivery_paid"
  Status "paid order is verified" ($paid -eq 200)
  $created = Request-Json "$base/api/admin/orders/$($checkout.data.orderId)" "PATCH" '{"action":"create_delhivery_shipment"}' $session
  Status "shipment creation persists AWB" ($created.status -eq 200 -and $created.data.order.awb -match "^DLV" -and $created.data.order.delhiveryShipmentId)
  $duplicate = Request-Json "$base/api/admin/orders/$($checkout.data.orderId)" "PATCH" '{"action":"create_delhivery_shipment"}' $session
  Status "duplicate shipment is blocked" ($duplicate.status -eq 400)
  $tracked = Request-Json "$base/api/admin/orders/$($checkout.data.orderId)" "PATCH" '{"action":"refresh_delhivery_tracking"}' $session
  Status "tracking refresh persists scans" ($tracked.status -eq 200 -and $tracked.data.order.shipmentStatus -eq "Picked up" -and @($tracked.data.order.shipmentHistory).Count -eq 1)
  $stats = Request-Json "$mock/__stats"
  Status "mock create and tracking APIs were used" ($stats.data.counts.create -eq 1 -and $stats.data.counts.track -eq 1)
}

""
"shipping-tests phase $Phase : $($script:total - $script:fail)/$($script:total) passed"
if ($script:fail -gt 0) { exit 1 }
