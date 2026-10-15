/**
 * Shiprocket v1 external API client (server-side only — holds credentials).
 * Docs: https://apidocs.shiprocket.in
 */

const BASE = "https://apiv2.shiprocket.in/v1/external";

const EMAIL = process.env.SHIPROCKET_EMAIL || "";
const PASSWORD = process.env.SHIPROCKET_PASSWORD || "";

export const SHIPROCKET_PICKUP_POSTCODE = process.env.SHIPROCKET_PICKUP_POSTCODE || "";
export const SHIPROCKET_PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || "";

// Default parcel dimensions in cm (used when creating shipments).
const PARCEL_LENGTH = 25;
const PARCEL_BREADTH = 18;
const PARCEL_HEIGHT = 12;

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

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !data.token) {
    throw new Error(data.message || "Shiprocket login failed. Check email/password.");
  }
  cache.token = data.token;
  cache.expiresAt = Date.now() + 20 * 60 * 60 * 1000;
  return data.token;
}

async function authHeaders(): Promise<Record<string, string>> {
  if (!isShiprocketConfigured()) throw new Error("Shiprocket is not configured");
  const token = Date.now() < cache.expiresAt && cache.token ? cache.token : await login();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(await authHeaders()), ...(init?.headers || {}) },
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (res.status === 401 && cache.token) {
    // Token may have expired early — refresh once and retry.
    cache.token = "";
    cache.expiresAt = 0;
    return api<T>(path, init);
  }
  if (!res.ok) {
    const msg = (data as { message?: string }).message || `Shiprocket request failed (${res.status})`;
    throw new Error(msg);
  }
  return data;
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

interface ServiceabilityResponse {
  data?: {
    available_courier_companies?: {
      courier_company_id: number;
      courier_name: string;
      freight_charge: number;
      cod_charges?: number;
      etd?: string;
    }[];
  };
}

/** Live courier rates + ETAs for a delivery pincode. Cheapest first, max 5. */
export async function getCourierRates(deliveryPincode: string, weightKg: number): Promise<CourierOption[]> {
  const weight = Math.max(0.5, Math.min(50, Math.round(weightKg * 100) / 100));
  const params = new URLSearchParams({
    pickup_postcode: SHIPROCKET_PICKUP_POSTCODE,
    delivery_postcode: deliveryPincode,
    weight: String(weight),
    cod: "0",
  });
  const data = await api<ServiceabilityResponse>(`/courier/serviceability/?${params.toString()}`, {
    method: "GET",
  });
  const list = data.data?.available_courier_companies || [];
  return list
    .filter((c) => Number.isFinite(c.freight_charge))
    .map((c) => ({
      courierId: c.courier_company_id,
      courierName: c.courier_name,
      rate: Math.round(Number(c.freight_charge)),
      etd: c.etd || "",
    }))
    .sort((a, b) => a.rate - b.rate)
    .slice(0, 5);
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
    awb: data.awb_code || "",
    shipmentId: data.shipment_id || 0,
    courier: data.courier_name || "",
    raw: data,
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
