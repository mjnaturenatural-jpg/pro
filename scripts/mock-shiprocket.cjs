/**
 * Mock Shiprocket API for scripts/shipping-tests.ps1.
 * Behavior is selected by the delivery postcode query param:
 *   500001 healthy (mixed valid/invalid courier entries)
 *   500002 flaky  — first request 500, then healthy (tests bounded read retry)
 *   500003 slow   — responds after 2.5s (tests timeout)
 *   500004 malformed — 200 with invalid JSON (tests MALFORMED handling)
 *   500005 unserviceable — message-only body (tests empty options)
 *   500006 token expiry — first request 401, then healthy (tests refresh guard)
 *   500007 always 500 (tests bounded retry → UPSTREAM)
 *   500008 always 401 (tests bounded refresh → no recursion)
 * GET  /__stats returns request counts; POST /__reset clears them.
 */
const http = require("http");

const PORT = Number(process.env.MOCK_SHIPROCKET_PORT || 4600);

const healthy = {
  status: 1,
  data: {
    available_courier_companies: [
      { courier_company_id: 101, courier_name: "Test Surface", freight_charge: 55, etd: "3-5 days" },
      { courier_company_id: 102, courier_name: "Test Air", freight_charge: 62.5, etd: "" },
      { courier_company_id: 103, courier_name: "Negative Rate", freight_charge: -5 },
      { courier_company_id: 104, courier_name: "Bad Number", freight_charge: "abc" },
      { courier_company_id: 105, freight_charge: 40 },
    ],
  },
};

const counts = { logins: 0, serviceability: {} };
const seen = {};

function json(res, status, body) {
  if (res.writableEnded || res.destroyed) return;
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(text) });
  res.end(text);
}

function bump(pin) {
  counts.serviceability[pin] = (counts.serviceability[pin] || 0) + 1;
  return counts.serviceability[pin];
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  try {
    if (req.method === "GET" && url.pathname === "/__stats") {
      return json(res, 200, counts);
    }
    if (req.method === "POST" && url.pathname === "/__reset") {
      counts.logins = 0;
      counts.serviceability = {};
      for (const k of Object.keys(seen)) delete seen[k];
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/v1/external/auth/login") {
      counts.logins += 1;
      return json(res, 200, { token: "mock-token", expires_at: "2099-01-01 00:00:00" });
    }
    if (req.method === "GET" && url.pathname === "/v1/external/courier/serviceability/") {
      const pin = url.searchParams.get("delivery_postcode") || "";
      const hit = bump(pin);

      if (pin === "500002") {
        if (hit === 1) return json(res, 500, { message: "temporary upstream hiccup" });
        return json(res, 200, healthy);
      }
      if (pin === "500003") {
        setTimeout(() => json(res, 200, healthy), 2500);
        return;
      }
      if (pin === "500004") {
        if (res.writableEnded || res.destroyed) return;
        res.writeHead(200, { "content-type": "application/json" });
        return res.end("{ definitely not json");
      }
      if (pin === "500005") {
        return json(res, 200, { status: 0, message: "No couriers available for this route" });
      }
      if (pin === "500006") {
        if (!seen.p500006) {
          seen.p500006 = true;
          return json(res, 401, { message: "Token expired" });
        }
        return json(res, 200, healthy);
      }
      if (pin === "500007") {
        return json(res, 500, { message: "Provider exploded" });
      }
      if (pin === "500008") {
        return json(res, 401, { message: "Token rejected" });
      }
      return json(res, 200, healthy);
    }
    json(res, 404, { message: "not found" });
  } catch {
    try { res.destroy(); } catch { /* ignore */ }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock shiprocket listening on http://127.0.0.1:${PORT}`);
});
