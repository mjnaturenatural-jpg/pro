import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { uploadImage, uploadVideo, isCloudinaryConfigured } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

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
        { error: "Uploads are not configured. Paste a URL instead." },
        { status: 503 }
      );
    }
    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: isVideo ? "Video must be under 50MB" : "File must be under 8MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = isVideo ? await uploadVideo(base64) : await uploadImage(base64);
    return NextResponse.json({ url: result.url, publicId: result.publicId });
  } catch (err) {
    console.error("upload error", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
