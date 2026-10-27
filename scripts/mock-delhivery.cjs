/** Mock Delhivery legacy APIs for scripts/shipping-tests.ps1. */
const http = require("http");

const PORT = Number(process.env.MOCK_DELIVERY_PORT || 4600);
const config = { failCreate: false };
const counts = { create: 0, track: 0 };

function json(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(text) });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => resolve(raw));
    req.on("error", () => resolve(""));
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (req.method === "GET" && url.pathname === "/__stats") return json(res, 200, { counts, config });
  if (req.method === "POST" && url.pathname === "/__reset") {
    counts.create = 0;
    counts.track = 0;
    config.failCreate = false;
    return json(res, 200, { ok: true });
  }
  if (req.method === "POST" && url.pathname === "/__config") {
    const body = JSON.parse((await readBody(req)) || "{}");
    if (typeof body.failCreate === "boolean") config.failCreate = body.failCreate;
    return json(res, 200, { ok: true, config });
  }
  if (!req.headers.authorization?.startsWith("Token ")) {
    return json(res, 401, { message: "Token required" });
  }
  if (req.method === "POST" && url.pathname === "/api/cmu/create.json") {
    counts.create++;
    if (config.failCreate) {
      return json(res, 200, { success: false, packages: [{ status: "Fail", remarks: "mock create failure" }] });
    }
    const form = new URLSearchParams(await readBody(req));
    const payload = JSON.parse(form.get("data") || "{}");
    const shipment = payload.shipments?.[0] || {};
    if (!shipment.pickup_location) {
      return json(res, 200, { success: false, packages: [{ status: "Fail", remarks: "pickup location required" }] });
    }
    const waybill = `DLV${10000 + counts.create}`;
    return json(res, 200, {
      success: true,
      packages: [{ refnum: shipment.order || "", waybill, status: "Success", remarks: "Shipment created" }],
    });
  }
  if (req.method === "GET" && url.pathname === "/api/v1/packages/json/") {
    counts.track++;
    const waybill = url.searchParams.get("waybill") || "";
    return json(res, 200, {
      ShipmentData: [{
        Shipment: {
          AWB: waybill,
          ExpectedDeliveryDate: "2026-01-05",
          Status: { Status: "In Transit" },
          Scans: [{ ScanDetail: { Scan: "Picked up", ScannedLocation: "Hyderabad", ScanDateTime: "2026-01-01T10:00:00Z" } }],
        },
      }],
    });
  }
  return json(res, 404, { message: "not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock delhivery listening on http://127.0.0.1:${PORT}`);
});
