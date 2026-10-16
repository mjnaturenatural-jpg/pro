param(
  [ValidateSet("A", "B")]
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

""
"shipping-tests phase $Phase : $($script:total - $script:fail)/$($script:total) passed"
if ($script:fail -gt 0) { exit 1 }
exit 0
