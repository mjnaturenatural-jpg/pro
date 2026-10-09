import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadImage, isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    if (!isCloudinaryConfigured()) {
      const body = await req.json().catch(() => ({}));
      if (body.url && typeof body.url === "string") {
        return NextResponse.json({ url: body.url, publicId: "" });
      }
      return NextResponse.json(
        { error: "Image uploads are not configured. Paste an image URL instead." },
        { status: 503 }
      );
    }
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 8MB" }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    const result = await uploadImage(base64);
    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
