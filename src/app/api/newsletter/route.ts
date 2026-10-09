import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
    }
    await connectDB();
    const existing = await NewsletterSubscriber.findOne({ email: parsed.data.email.toLowerCase() });
    if (existing) {
      if (existing.subscribed) {
        return NextResponse.json({ error: "You are already subscribed" }, { status: 409 });
      }
      existing.subscribed = true;
      await existing.save();
      return NextResponse.json({ ok: true });
    }
    await NewsletterSubscriber.create({ email: parsed.data.email, subscribed: true });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("newsletter error", err);
    return NextResponse.json({ error: "Could not subscribe. Please try again." }, { status: 500 });
  }
}
