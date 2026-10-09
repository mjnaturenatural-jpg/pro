const API_URL = process.env.DELHIVERY_API_URL || "https://track.delhivery.com";
const API_KEY = process.env.DELHIVERY_API_KEY;
const CLIENT_CODE = process.env.DELHIVERY_CLIENT_CODE;

export function isDelhiveryConfigured(): boolean {
  return Boolean(API_KEY && CLIENT_CODE);
}

function headers() {
  return {
    Authorization: `Token ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

export interface DelhiveryShipmentInput {
  awb: string;
  orderNumber: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export async function createDelhiveryShipment(input: DelhiveryShipmentInput) {
  if (!isDelhiveryConfigured()) {
    return { ok: false as const, error: "Delhivery is not configured" };
  }
  const res = await fetch(`${API_URL}/api/v1/packages/create/`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      pickup_location: CLIENT_CODE,
      shipments: [
        {
          waybill: input.awb,
          order: input.orderNumber,
          add: input.address,
          city: input.city,
          state: input.state,
          pin: input.pincode,
          name: input.name,
          phone: input.phone,
          is_cod: false,
        },
      ],
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export async function trackDelhiveryShipment(awb: string) {
  if (!isDelhiveryConfigured()) {
    return { ok: false as const, error: "Delhivery is not configured" };
  }
  const res = await fetch(`${API_URL}/api/v1/track/?awb=${encodeURIComponent(awb)}`, {
    headers: headers(),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function trackingUrlFor(awb: string): string {
  return `https://www.delhivery.com/track/package/${awb}`;
}
