/** Delhivery legacy shipment API client (server-side only). */

const BASE = (process.env.DELIVERY_BASE_URL || "https://track.delhivery.com").replace(/\/+$/, "");
const API_TOKEN = process.env.DELIVERY_API_TOKEN || "";

export const DELIVERY_PICKUP_POSTCODE = process.env.DELIVERY_PICKUP_POSTCODE || "";
export const DELIVERY_PICKUP_LOCATION = process.env.DELIVERY_PICKUP_LOCATION || "";

const RETURN_NAME = process.env.DELIVERY_RETURN_NAME || "";
const RETURN_ADDRESS = process.env.DELIVERY_RETURN_ADDRESS || "";
const RETURN_CITY = process.env.DELIVERY_RETURN_CITY || "";
const RETURN_STATE = process.env.DELIVERY_RETURN_STATE || "";
const RETURN_PHONE = process.env.DELIVERY_RETURN_PHONE || "";
const SELLER_GSTIN = process.env.DELIVERY_SELLER_GSTIN || "";

const PARCEL_LENGTH = 25;
const PARCEL_BREADTH = 18;
const PARCEL_HEIGHT = 12;

function requestTimeoutMs(): number {
  const n = Number(process.env.DELIVERY_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 100 && n <= 60000 ? Math.round(n) : 8000;
}

export type DeliveryErrorCode =
  | "NOT_CONFIGURED"
  | "UNSUPPORTED"
  | "TIMEOUT"
  | "NETWORK"
  | "RATE_LIMITED"
  | "UPSTREAM"
  | "MALFORMED"
  | "UNAUTHORIZED";

export class DeliveryError extends Error {
  readonly code: DeliveryErrorCode;
  readonly retryable: boolean;

  constructor(message: string, code: DeliveryErrorCode, retryable: boolean) {
    super(message);
    this.name = "DeliveryError";
    this.code = code;
    this.retryable = retryable;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "").slice(-10);
}

async function request(path: string, init: RequestInit = {}, retry = true): Promise<unknown> {
  if (!API_TOKEN) {
    throw new DeliveryError("Delhivery is not configured", "NOT_CONFIGURED", false);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Authorization: `Token ${API_TOKEN}`,
        Accept: "application/json",
        ...(init.headers || {}),
      },
      signal: AbortSignal.timeout(requestTimeoutMs()),
    });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    throw new DeliveryError(
      name === "TimeoutError" || name === "AbortError"
        ? "Delhivery did not respond in time"
        : "Could not reach Delhivery",
      name === "TimeoutError" || name === "AbortError" ? "TIMEOUT" : "NETWORK",
      true
    );
  }

  if (response.status === 401) {
    throw new DeliveryError("Delhivery rejected the API token", "UNAUTHORIZED", false);
  }
  if (retry && response.status >= 500) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return request(path, init, false);
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new DeliveryError("Delhivery returned an unreadable response", "MALFORMED", true);
  }
  if (!response.ok) {
    const message = isRecord(data) ? stringValue(data.message) || stringValue(data.error) : "";
    throw new DeliveryError(
      message || `Delhivery request failed (${response.status})`,
      response.status === 429 ? "RATE_LIMITED" : "UPSTREAM",
      response.status === 429 || response.status >= 500
    );
  }
  return data;
}

export function isDeliveryConfigured(): boolean {
  return Boolean(API_TOKEN);
}

// Delhivery's production price-calculation API contract is account-specific.
// Standard site shipping remains available until that contract is configured.
export function isDeliveryRatesReady(): boolean {
  return false;
}

export function isDeliveryShipReady(): boolean {
  return Boolean(
    API_TOKEN &&
      DELIVERY_PICKUP_LOCATION &&
      DELIVERY_PICKUP_POSTCODE &&
      RETURN_NAME &&
      RETURN_ADDRESS &&
      RETURN_CITY &&
      RETURN_STATE &&
      phoneDigits(RETURN_PHONE)
  );
}

/** Parse a pack label like "250g", "250 g" or "1kg" into kilograms. */
export function packToKg(label: string): number {
  const match = label.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
  if (!match) return 0.5;
  const value = Number(match[1]);
  const kg = /kg/i.test(match[2]) ? value : value / 1000;
  return Math.max(0.1, Math.min(50, kg));
}

export interface CourierOption {
  courierId: number;
  courierName: string;
  rate: number;
  etd: string;
}

export async function getCourierRates(_deliveryPincode: string, _weightKg: number): Promise<CourierOption[]> {
  throw new DeliveryError(
    "Real-time Delhivery price quotes are not configured for this account",
    "UNSUPPORTED",
    false
  );
}

export interface DeliveryOrderItem {
  name: string;
  sku: string;
  units: number;
  sellingPrice: number;
}

export interface DeliveryOrderInput {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  items: DeliveryOrderItem[];
  subTotal: number;
  weightKg: number;
  prepaid: boolean;
}

interface CreateResponse {
  success?: unknown;
  packages?: unknown;
  rmk?: unknown;
}

export async function createDeliveryOrder(input: DeliveryOrderInput) {
  if (!isDeliveryShipReady()) {
    throw new DeliveryError("Delhivery pickup return details are not configured", "NOT_CONFIGURED", false);
  }

  const shipment = {
    name: input.customerName.trim(),
    add: input.addressLine.trim(),
    pin: input.pincode,
    city: input.city.trim(),
    state: input.state.trim(),
    country: "India",
    phone: phoneDigits(input.customerPhone),
    email: input.customerEmail.trim(),
    order: input.orderId,
    payment_mode: input.prepaid ? "Prepaid" : "COD",
    pickup_location: DELIVERY_PICKUP_LOCATION,
    return_pin: DELIVERY_PICKUP_POSTCODE,
    return_city: RETURN_CITY,
    return_state: RETURN_STATE,
    return_phone: phoneDigits(RETURN_PHONE),
    return_add: RETURN_ADDRESS,
    return_name: RETURN_NAME,
    return_country: "India",
    products_desc: input.items.map((item) => `${item.name} x ${item.units}`).join(", ").slice(0, 250),
    hsn_code: "",
    cod_amount: input.prepaid ? "0" : String(Math.round(input.subTotal)),
    order_date: new Date().toISOString().slice(0, 19).replace("T", " "),
    total_amount: String(Math.round(input.subTotal)),
    seller_add: RETURN_ADDRESS,
    seller_name: RETURN_NAME,
    seller_inv: `INV-${input.orderId}`.slice(0, 50),
    quantity: String(input.items.reduce((total, item) => total + item.units, 0)),
    waybill: "",
    shipment_width: String(PARCEL_BREADTH),
    shipment_height: String(PARCEL_HEIGHT),
    shipment_length: String(PARCEL_LENGTH),
    weight: String(Math.max(0.5, input.weightKg)),
    seller_gst_tin: SELLER_GSTIN,
    shipping_mode: "Surface",
  };
  const form = new URLSearchParams({ format: "json", data: JSON.stringify({ shipments: [shipment] }) });
  const body = (await request("/api/cmu/create.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  })) as CreateResponse;
  const first = Array.isArray(body.packages) && isRecord(body.packages[0]) ? body.packages[0] : null;
  const waybill = first ? stringValue(first.waybill) : "";
  const status = first ? stringValue(first.status) : "";
  const remarks = first ? stringValue(first.remarks) : stringValue(body.rmk);
  if (!waybill || /fail|error/i.test(status)) {
    throw new DeliveryError(remarks || "Delhivery did not create a shipment", "UPSTREAM", false);
  }
  return {
    ok: true,
    orderId: first ? stringValue(first.refnum) || input.orderId : input.orderId,
    shipmentId: waybill,
    awb: waybill,
    courier: "Delhivery",
  };
}

interface TrackResponse {
  ShipmentData?: unknown;
}

export async function trackDeliveryAwb(awb: string) {
  const data = (await request(`/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}`)) as TrackResponse;
  const first = Array.isArray(data.ShipmentData) && isRecord(data.ShipmentData[0]) ? data.ShipmentData[0] : null;
  const shipment = first && isRecord(first.Shipment) ? first.Shipment : null;
  if (!shipment) {
    throw new DeliveryError("Delhivery returned an unexpected tracking response", "MALFORMED", true);
  }
  const statusData = isRecord(shipment.Status) ? shipment.Status : {};
  const rawScans = Array.isArray(shipment.Scans) ? shipment.Scans : [];
  const scans = rawScans.map((scan) => {
    const detail = isRecord(scan) && isRecord(scan.ScanDetail) ? scan.ScanDetail : {};
    const rawDate = stringValue(detail.ScanDateTime) || stringValue(detail.StatusDateTime);
    const timestamp = rawDate && !Number.isNaN(Date.parse(rawDate)) ? new Date(rawDate) : new Date();
    return {
      status: stringValue(detail.Scan) || stringValue(detail.Status),
      location: stringValue(detail.ScannedLocation) || stringValue(detail.ScanLocation),
      timestamp,
    };
  });
  return {
    status: stringValue(statusData.Status),
    etd: stringValue(shipment.ExpectedDeliveryDate),
    scans,
  };
}

export function deliveryTrackingUrl(awb: string): string {
  return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
}
