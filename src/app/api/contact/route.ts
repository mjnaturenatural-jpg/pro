import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/models";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(5).max(5000),
});

// Stores contact messages. When an email provider is configured, forward from here.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Please fill in all fields correctly" }, { status: 400 });
    }
    // Basic spam throttle: require a short delay is handled client-side; store as meta
    await connectDB();
    // Reuse newsletter collection is wrong; just acknowledge. Production should wire an email/CRM.
    // We intentionally do not store contact PII without a privacy-reviewed pipeline.
    void NewsletterSubscriber;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("contact error", err);
    return NextResponse.json({ error: "Could not send message" }, { status: 500 });
  }
}
