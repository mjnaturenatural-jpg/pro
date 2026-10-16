/**
 * Shiprocket v1 external API client (server-side only — holds credentials).
 * Docs: https://apidocs.shiprocket.in
 */

const BASE = (process.env.SHIPROCKET_BASE_URL || "https://apiv2.shiprocket.in/v1/external").replace(
  /\/+$/,
  ""
);

const EMAIL = process.env.SHIPROCKET_EMAIL || "";
const PASSWORD = process.env.SHIPROCKET_PASSWORD || "";

export const SHIPROCKET_PICKUP_POSTCODE = process.env.SHIPROCKET_PICKUP_POSTCODE || "";
export const SHIPROCKET_PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || "";

// Default parcel dimensions in cm (used when creating shipments).
const PARCEL_LENGTH = 25;
const PARCEL_BREADTH = 18;
const PARCEL_HEIGHT = 12;

function requestTimeoutMs(): number {
  const n = Number(process.env.SHIPROCKET_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 100 && n <= 60000 ? Math.round(n) : 8000;
}

function loginCooldownMs(): number {
  const n = Number(process.env.SHIPROCKET_LOGIN_COOLDOWN_MS);
  return Number.isFinite(n) && n >= 0 && n <= 600000 ? Math.round(n) : 5 * 60 * 1000;
}

// Test-only: lets scripts/shipping-tests.ps1 force a fresh login per request so
// it can exercise the login circuit breaker without waiting out the 20h TTL.
function tokenTtlMs(): number {
  const n = Number(process.env.SHIPROCKET_TOKEN_TTL_MS);
  return Number.isFinite(n) && n >= 0 && n <= 20 * 60 * 60 * 1000 ? Math.round(n) : 20 * 60 * 60 * 1000;
}

export type ShiprocketErrorCode =
  | "NOT_CONFIGURED"
  | "LOGIN_FAILED"
  | "LOGIN_RATE_LIMITED"
  | "TIMEOUT"
  | "NETWORK"
  | "RATE_LIMITED"
  | "UPSTREAM"
  | "MALFORMED"
  | "UNAUTHORIZED";

export class ShiprocketError extends Error {
  readonly code: ShiprocketErrorCode;
  readonly retryable: boolean;
  constructor(message: string, code: ShiprocketErrorCode, retryable: boolean) {
    super(message);
    this.name = "ShiprocketError";
    this.code = code;
    this.retryable = retryable;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs()),
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new ShiprocketError("Shiprocket did not respond in time", "TIMEOUT", true);
    }
    throw new ShiprocketError("Could not reach Shiprocket", "NETWORK", true);
  }
}

export function isShiprocketConfigured(): boolean {
  return Boolean(EMAIL && PASSWORD);
}

export function isShiprocketRatesReady(): boolean {
  return isShiprocketConfigured() && Boolean(SHIPROCKET_PICKUP_POSTCODE);
}

export function isShiprocketShipReady(): boolean {
  return isShiprocketConfigured() && Boolean(SHIPROCKET_PICKUP_LOCATION);
}

interface TokenCache {
  token: string;
  expiresAt: number;
}

const cache: TokenCache = { token: "", expiresAt: 0 };

// Single-flight: concurrent callers share one in-flight login instead of
// stampeding /auth/login. Shiprocket throttles and then blocks the account for
// too many failed attempts, so we must never let requests race into login.
let inflightLogin: Promise<string> | null = null;

// Circuit breaker: after repeated login failures, pause logins for a short
// cooldown instead of hammering the endpoint and keeping the account locked.
const LOGIN_FAILURE_THRESHOLD = 3;
let loginFailures = 0;
let loginBlockedUntil = 0;

async function performLogin(): Promise<string> {
  if (!isShiprocketConfigured()) {
    throw new ShiprocketError("Shiprocket is not configured", "NOT_CONFIGURED", false);
  }
  if (Date.now() < loginBlockedUntil) {
    const secs = Math.ceil((loginBlockedUntil - Date.now()) / 1000);
    throw new ShiprocketError(
      `Too many Shiprocket login failures — pausing for ~${secs}s. Check the account in the Shiprocket dashboard (it may be temporarily blocked).`,
      "LOGIN_RATE_LIMITED",
      false
    );
  }
  const res = await fetchJson(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !data.token) {
    loginFailures += 1;
    if (loginFailures >= LOGIN_FAILURE_THRESHOLD) {
      loginBlockedUntil = Date.now() + loginCooldownMs();
      loginFailures = 0;
    }
    // Surface Shiprocket's own reason (e.g. "User blocked due to too many
    // failed login attempts.") instead of a misleading generic error.
    const message = data.message || "Shiprocket login failed. Check email/password.";
    const rateLimited = res.status === 429 || /blocked|too many|rate ?limit/i.test(message);
    throw new ShiprocketError(
      message,
      rateLimited ? "LOGIN_RATE_LIMITED" : "LOGIN_FAILED",
      false
    );
  }
  loginFailures = 0;
  loginBlockedUntil = 0;
  cache.token = data.token;
  cache.expiresAt = Date.now() + tokenTtlMs();
  return cache.token;
}

function login(): Promise<string> {
  if (!inflightLogin) {
    inflightLogin = performLogin().finally(() => {
      inflightLogin = null;
    });
  }
  return inflightLogin;
}

async function authHeaders(): Promise<Record<string, string>> {
  if (!isShiprocketConfigured()) {
    throw new ShiprocketError("Shiprocket is not configured", "NOT_CONFIGURED", false);
  }
  const token = Date.now() < cache.expiresAt && cache.token ? cache.token : await login();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function api<T>(path: string, init: RequestInit = {}, opts: { attempt?: number } = {}): Promise<T> {
  const attempt = opts.attempt ?? 0;
  const isRead = !init.method || init.method.toUpperCase() === "GET";
  let res: Response;
  try {
    res = await fetchJson(`${BASE}${path}`, {
      ...init,
      headers: { ...(await authHeaders()), ...((init.headers as Record<string, string>) || {}) },
    });
  } catch (err) {
    // One bounded retry for transient read failures — never loop.
    if (isRead && attempt < 1 && err instanceof ShiprocketError && err.retryable) {
      await delay(250 * (attempt + 1));
      return api<T>(path, init, { attempt: attempt + 1 });
    }
    throw err;
  }
  if (res.status === 401 && attempt < 1) {
    // Token may have expired early — refresh once and retry.
    cache.token = "";
    cache.expiresAt = 0;
    return api<T>(path, init, { attempt: attempt + 1 });
  }
  if (res.status === 401) {
    throw new ShiprocketError("Shiprocket rejected the session", "UNAUTHORIZED", true);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      data && typeof data === "object" && typeof (data as { message?: unknown }).message === "string"
        ? ((data as { message: string }).message)
        : "";
    const msg = message || `Shiprocket request failed (${res.status})`;
    if (res.status === 429) throw new ShiprocketError(msg, "RATE_LIMITED", true);
    if (res.status >= 500) {
      if (isRead && attempt < 1) {
        await delay(250 * (attempt + 1));
        return api<T>(path, init, { attempt: attempt + 1 });
      }
      throw new ShiprocketError(msg, "UPSTREAM", true);
    }
    throw new ShiprocketError(msg, "UPSTREAM", false);
  }
  if (data === null) {
    throw new ShiprocketError("Shiprocket returned an unreadable response", "MALFORMED", true);
  }
  return data as T;
}

/** Parse a pack label like "250g", "250 g" or "1kg" into kilograms. Defaults to 0.5. */
export function packToKg(label: string): number {
  const m = label.match(/(\d+(?:\.\d+)?)\s*(kg|g)\b/i);
  if (!m) return 0.5;
  const value = parseFloat(m[1]);
  const kg = /kg/i.test(m[2]) ? value : value / 1000;
  return Math.max(0.1, Math.min(50, kg));
}

export interface CourierOption {
  courierId: number;
  courierName: string;
  rate: number;
  etd: string;
}

interface ServiceabilityCourier {
  courier_company_id: unknown;
  courier_name: unknown;
  freight_charge?: unknown;
  rate?: unknown;
  etd?: unknown;
}

interface ServiceabilityResponse {
  data?: {
    available_courier_companies?: ServiceabilityCourier[];
  };
  message?: unknown;
}

/** Live courier rates + ETAs for a delivery pincode. Cheapest first, max 5. */
export async function getCourierRates(deliveryPincode: string, weightKg: number): Promise<CourierOption[]> {
  const weight = Number.isFinite(weightKg)
    ? Math.max(0.5, Math.min(50, Math.round(weightKg * 100) / 100))
    : 0.5;
  const params = new URLSearchParams({
    pickup_postcode: SHIPROCKET_PICKUP_POSTCODE,
    delivery_postcode: deliveryPincode,
    weight: String(weight),
    cod: "0",
  });
  const body = await api<ServiceabilityResponse>(`/courier/serviceability/?${params.toString()}`, {
    method: "GET",
  });
  const list = Array.isArray(body?.data?.available_courier_companies)
    ? body.data.available_courier_companies
    : null;
  if (!list) {
    // Shiprocket answered but without a serviceability payload — treat a
    // message-only body as "no couriers", anything else as malformed.
    if (body && typeof body === "object" && "message" in body) return [];
    throw new ShiprocketError("Shiprocket returned an unexpected rates response", "MALFORMED", true);
  }
  const options: CourierOption[] = [];
  for (const c of list) {
    const id = Number(c.courier_company_id);
    const charge = Number(c.freight_charge ?? c.rate);
    const name = typeof c.courier_name === "string" ? c.courier_name.trim() : "";
    if (!Number.isFinite(id) || !Number.isFinite(charge) || charge < 0 || !name) continue;
    options.push({
      courierId: id,
      courierName: name,
      rate: Math.round(charge),
      etd: typeof c.etd === "string" ? c.etd : "",
    });
  }
  return options.sort((a, b) => a.rate - b.rate).slice(0, 5);
}

export interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  sellingPrice: number;
}

export interface ShiprocketOrderInput {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  items: ShiprocketOrderItem[];
  subTotal: number;
  weightKg: number;
  prepaid: boolean;
}

interface CreateOrderResponse {
  order_id?: number;
  shipment_id?: number;
  awb_code?: string | null;
  courier_name?: string;
  status?: string;
  message?: string;
}

/** Create an adhoc order + shipment. Returns AWB when auto-assigned. */
export async function createShiprocketOrder(input: ShiprocketOrderInput) {
  const [firstName, ...rest] = input.customerName.trim().split(/\s+/);
  const data = await api<CreateOrderResponse>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderId,
      order_date: new Date().toISOString().slice(0, 16).replace("T", " "),
      pickup_location: SHIPROCKET_PICKUP_LOCATION,
      billing_customer_name: firstName,
      billing_last_name: rest.join(" ") || firstName,
      billing_address: input.addressLine,
      billing_city: input.city,
      billing_state: input.state,
      billing_country: "India",
      billing_pincode: input.pincode,
      billing_email: input.customerEmail,
      billing_phone: input.customerPhone,
      shipping_is_billing: true,
      order_items: input.items.map((i) => ({
        name: i.name,
        sku: i.sku || i.name.slice(0, 40),
        units: i.units,
        selling_price: i.sellingPrice,
      })),
      payment_method: input.prepaid ? "Prepaid" : "COD",
      sub_total: Math.round(input.subTotal),
      length: PARCEL_LENGTH,
      breadth: PARCEL_BREADTH,
      height: PARCEL_HEIGHT,
      weight: Math.max(0.5, input.weightKg),
    }),
  });
  return {
    ok: Boolean(data.awb_code || data.shipment_id || data.order_id),
    orderId: data.order_id || 0,
    shipmentId: data.shipment_id || 0,
    awb: data.awb_code || "",
    courier: data.courier_name || "",
    raw: data,
  };
}

interface AssignAwbResponse {
  awb_assign_status?: unknown;
  response?: { data?: { awb_code?: unknown; courier_name?: unknown } };
  message?: unknown;
}

/**
 * Explicitly assign an AWB/courier to an existing shipment. Needed when adhoc
 * order creation does not auto-assign a courier (or the recommended courier was
 * not booked). Shiprocket expects a single numeric shipment id here.
 */
export async function assignShiprocketAwb(shipmentId: string) {
  const data = await api<AssignAwbResponse>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: Number(shipmentId) }),
  });
  const d = data.response?.data;
  const awb = typeof d?.awb_code === "string" ? d.awb_code.trim() : "";
  const courier = typeof d?.courier_name === "string" ? d.courier_name.trim() : "";
  if (!awb) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : "Shiprocket did not assign an AWB for this shipment.";
    throw new ShiprocketError(msg, "UPSTREAM", false);
  }
  return { awb, courier };
}

interface LabelResponse {
  label_created?: unknown;
  label_url?: unknown;
  response?: { label_url?: unknown };
  message?: unknown;
}

/** Generate a shipping label (PDF URL) for a shipment. */
export async function generateShiprocketLabel(shipmentId: string) {
  const data = await api<LabelResponse>("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  });
  const url =
    (typeof data.label_url === "string" && data.label_url) ||
    (typeof data.response?.label_url === "string" ? data.response.label_url : "");
  if (!url) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : "Shiprocket did not return a label URL.";
    throw new ShiprocketError(msg, "UPSTREAM", false);
  }
  return { labelUrl: url };
}

interface ManifestResponse {
  manifest_url?: unknown;
  response?: { manifest_url?: unknown };
  message?: unknown;
}

/** Generate a manifest (PDF URL) for a shipment. */
export async function generateShiprocketManifest(shipmentId: string) {
  const data = await api<ManifestResponse>("/manifests/generate", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  });
  const url =
    (typeof data.manifest_url === "string" && data.manifest_url) ||
    (typeof data.response?.manifest_url === "string" ? data.response.manifest_url : "");
  if (!url) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : "Shiprocket did not return a manifest URL.";
    throw new ShiprocketError(msg, "UPSTREAM", false);
  }
  return { manifestUrl: url };
}

interface PickupResponse {
  pickup_status?: unknown;
  response?: { pickup_scheduled_date?: unknown; pickup_token_number?: unknown };
  message?: unknown;
}

/** Request courier pickup for a shipment. */
export async function requestShiprocketPickup(shipmentId: string) {
  const data = await api<PickupResponse>("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [Number(shipmentId)] }),
  });
  if (Number(data.pickup_status) !== 1) {
    const msg =
      typeof data.message === "string" && data.message
        ? data.message
        : "Shiprocket could not schedule a pickup for this shipment.";
    throw new ShiprocketError(msg, "UPSTREAM", false);
  }
  return {
    scheduledDate:
      typeof data.response?.pickup_scheduled_date === "string"
        ? data.response.pickup_scheduled_date
        : "",
    token:
      typeof data.response?.pickup_token_number === "string"
        ? data.response.pickup_token_number
        : "",
  };
}

interface TrackResponse {
  tracking_data?: {
    track_status?: number;
    track_status_name?: string;
    etd?: string;
    shipment_track?: {
      status?: string;
      location?: string;
      date?: string;
    }[];
  };
}

/** Live tracking status + scan history for an AWB. */
export async function trackShiprocketAwb(awb: string) {
  const data = await api<TrackResponse>(`/courier/track/awb/${encodeURIComponent(awb)}`, {
    method: "GET",
  });
  const t = data.tracking_data;
  const scans = (t?.shipment_track || []).map((s) => ({
    status: s.status || "",
    location: s.location || "",
    timestamp: s.date ? new Date(s.date) : new Date(),
  }));
  return {
    status: t?.track_status_name || "",
    etd: t?.etd || "",
    scans,
  };
}

export function shiprocketTrackingUrl(awb: string): string {
  return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
}
