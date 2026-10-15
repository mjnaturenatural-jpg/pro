import { NextResponse } from "next/server";
import { z } from "zod";
import { getCourierRates, isShiprocketRatesReady, packToKg } from "@/lib/shiprocket";
import { isValidPincode } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ratesSchema = z.object({
  pincode: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => isValidPincode(v), "Enter a valid 6-digit pincode"),
  items: z
    .array(
      z.object({
        packSize: z.string().min(1).max(20),
        quantity: z.number().min(1).max(50),
      })
    )
    .min(1)
    .max(50),
});

/** Public live courier rates for a pincode. Never exposes credentials. */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = ratesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid pincode or items" }, { status: 400 });
    }
    if (!isShiprocketRatesReady()) {
      return NextResponse.json(
        { error: "Live rates are not configured yet", fallback: true },
        { status: 503 }
      );
    }
    const weightKg = parsed.data.items.reduce(
      (n, i) => n + packToKg(i.packSize) * i.quantity,
      0
    );
    const options = await getCourierRates(parsed.data.pincode, weightKg);
    return NextResponse.json({ options, weightKg: Math.round(weightKg * 100) / 100 });
  } catch (err) {
    console.error("shipping rates error", err);
    const message = err instanceof Error ? err.message : "Could not fetch live rates";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
