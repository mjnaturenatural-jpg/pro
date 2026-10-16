/**
 * Mock Shiprocket API for scripts/shipping-tests.ps1.
 * Serviceability behavior is selected by the delivery postcode query param:
 *   500001 healthy (mixed valid/invalid courier entries)
 *   500002 flaky  — first request 500, then healthy (tests bounded read retry)
 *   500003 slow   — responds after 2.5s (tests timeout)
 *   500004 malformed — 200 with invalid JSON (tests MALFORMED handling)
 *   500005 unserviceable — message-only body (tests empty options)
 *   500006 token expiry — first request 401, then healthy (tests refresh guard)
 *   500007 always 500 (tests bounded retry → UPSTREAM)
 *   500008 always 401 (tests bounded refresh → no recursion)
 *
 * Shipment lifecycle endpoints:
 *   POST /orders/create/adhoc        — returns shipment_id, and awb_code unless
 *                                      config.createAwb === false
 *   POST /courier/assign/awb         — returns an AWB
 *   POST /courier/generate/label     — returns label_url
 *   POST /manifests/generate         — returns manifest_url
 *   POST /courier/generate/pickup    — returns pickup_status 1 + schedule
 *   GET  /courier/track/awb/:awb     — returns tracking scans
 *
 * Control:
 *   GET  /__stats  returns counts; POST /__reset clears them
 *   POST /__config { "createAwb": false } toggles AWB auto-assignment
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

const config = { createAwb: true, failCreate: false, failLogin: false };
const counts = { logins: 0, serviceability: {}, ops: {} };
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

function op(name) {
  counts.ops[name] = (counts.ops[name] || 0) + 1;
  return counts.ops[name];
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 1e6) req.destroy();
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  try {
    if (req.method === "GET" && url.pathname === "/__stats") {
      return json(res, 200, counts);
    }
    if (req.method === "POST" && url.pathname === "/__reset") {
      counts.logins = 0;
      counts.serviceability = {};
      counts.ops = {};
      config.createAwb = true;
      config.failCreate = false;
      config.failLogin = false;
      for (const k of Object.keys(seen)) delete seen[k];
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && url.pathname === "/__config") {
      const body = await readBody(req);
      if (typeof body.createAwb === "boolean") config.createAwb = body.createAwb;
      if (typeof body.failCreate === "boolean") config.failCreate = body.failCreate;
      if (typeof body.failLogin === "boolean") config.failLogin = body.failLogin;
      return json(res, 200, { ok: true, config });
    }
    if (req.method === "POST" && url.pathname === "/v1/external/auth/login") {
      counts.logins += 1;
      if (config.failLogin) {
        return json(res, 403, { message: "User blocked due to too many failed login attempts." });
      }
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
    if (req.method === "POST" && url.pathname === "/v1/external/orders/create/adhoc") {
      const n = op("create");
      const body = await readBody(req);
      if (config.failCreate) return json(res, 500, { message: "shipment creation failed upstream" });
      return json(res, 200, {
        order_id: 90000 + n,
        shipment_id: 80000 + n,
        awb_code: config.createAwb ? `AWB${10000 + n}` : null,
        courier_name: config.createAwb ? "Test Surface" : "",
        status: "NEW",
        // Echo enough for debugging without leaking anything.
        order_id_internal: body.order_id || "",
      });
    }
    if (req.method === "POST" && url.pathname === "/v1/external/courier/assign/awb") {
      op("assign_awb");
      return json(res, 200, {
        awb_assign_status: 1,
        response: { data: { awb_code: "AWB99999", courier_name: "Test Air", courier_company_id: 102 } },
      });
    }
    if (req.method === "POST" && url.pathname === "/v1/external/courier/generate/label") {
      op("label");
      return json(res, 200, { label_created: 1, label_url: `http://127.0.0.1:${PORT}/label.pdf` });
    }
    if (req.method === "POST" && url.pathname === "/v1/external/manifests/generate") {
      op("manifest");
      return json(res, 200, { manifest_url: `http://127.0.0.1:${PORT}/manifest.pdf` });
    }
    if (req.method === "POST" && url.pathname === "/v1/external/courier/generate/pickup") {
      op("pickup");
      return json(res, 200, {
        pickup_status: 1,
        response: { pickup_scheduled_date: "2026-01-01 10:00:00", pickup_token_number: "PT123" },
      });
    }
    if (req.method === "GET" && url.pathname.startsWith("/v1/external/courier/track/awb/")) {
      op("track");
      const awb = decodeURIComponent(url.pathname.split("/").pop() || "");
      return json(res, 200, {
        tracking_data: {
          track_status: 1,
          track_status_name: "In Transit",
          etd: "2026-01-05",
          shipment_track: [{ status: "Picked up", location: "Delhi", date: "2026-01-01 10:00:00" }],
        },
        awb,
      });
    }
    json(res, 404, { message: "not found" });
  } catch {
    try { res.destroy(); } catch { /* ignore */ }
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock shiprocket listening on http://127.0.0.1:${PORT}`);
});
