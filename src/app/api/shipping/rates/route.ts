import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getCourierRates,
  isShiprocketRatesReady,
  packToKg,
  ShiprocketError,
} from "@/lib/shiprocket";
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

/**
 * Availability probe: lets the checkout skip the rates request entirely when
 * live rates are not configured, so no console errors are thrown for the
 * normal "free standard shipping" state.
 */
export async function GET() {
  return NextResponse.json(
    { available: isShiprocketRatesReady() },
    { headers: { "cache-control": "no-store" } }
  );
}

/** Public live courier rates for a pincode. Never exposes credentials. */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = ratesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid pincode or items", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }
    if (!isShiprocketRatesReady()) {
      return NextResponse.json(
        { error: "Live rates are not configured yet", code: "NOT_CONFIGURED", fallback: true },
        { status: 503 }
      );
    }
    const weightKg = parsed.data.items.reduce(
      (n, i) => n + packToKg(i.packSize) * i.quantity,
      0
    );
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      return NextResponse.json(
        { error: "Invalid cart weight", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }
    const weight = Math.min(weightKg, 50);
    const options = await getCourierRates(parsed.data.pincode, weight);
    return NextResponse.json({ options, weightKg: Math.round(weight * 100) / 100 });
  } catch (err) {
    if (err instanceof ShiprocketError) {
      if (err.code === "NOT_CONFIGURED") {
        return NextResponse.json(
          { error: "Live rates are not configured yet", code: "NOT_CONFIGURED", fallback: true },
          { status: 503 }
        );
      }
      const message =
        err.code === "TIMEOUT"
          ? "Live courier rates are taking too long to load. Please retry."
          : "Live courier rates are unavailable right now. Please retry.";
      return NextResponse.json(
        { error: message, code: err.code, retryable: err.retryable },
        { status: err.code === "TIMEOUT" ? 504 : 502 }
      );
    }
    console.error("shipping rates error", err);
    return NextResponse.json(
      {
        error: "Live courier rates are unavailable right now. Please retry.",
        code: "UPSTREAM",
        retryable: true,
      },
      { status: 502 }
    );
  }
}
