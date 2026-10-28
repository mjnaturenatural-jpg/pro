"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

/**
 * Media field that accepts either a pasted URL or a file uploaded from the
 * device (stored on Cloudinary via /api/admin/upload).
 */
export function MediaField({
  label,
  value,
  onChange,
  kind = "image",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  kind?: "image" | "video";
  placeholder?: string;
  hint?: string;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const accept = kind === "video" ? "video/mp4,video/webm,video/quicktime" : "image/*";

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast({ message: data.error || "Upload failed", type: "error" });
        return;
      }
      onChange(data.url);
      toast({ message: `${kind === "video" ? "Video" : "Image"} uploaded`, type: "success" });
    } catch {
      toast({ message: "Upload failed", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const preview =
    value && kind === "video" ? (
      <video src={value} className="h-24 w-40 rounded-lg border border-bark-800/10 bg-black object-cover" muted />
    ) : value ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={value} alt="" className="h-20 w-20 rounded-lg border border-bark-800/10 object-cover" />
    ) : null;

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap items-start gap-3">
        {preview}
        <div className="min-w-[220px] flex-1 space-y-2">
          <input
            className="input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || (kind === "video" ? "https://…/video.mp4" : "https://res.cloudinary.com/…")}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary btn-sm"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {uploading ? "Uploading…" : `Upload from device`}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="btn-secondary btn-sm text-bark-500"
                aria-label={`Remove ${kind}`}
              >
                <X size={14} /> Remove
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.currentTarget.value = "";
              }}
            />
          </div>
          {hint && <p className="text-[11px] text-bark-400">{hint}</p>}
        </div>
      </div>
      {kind === "image" && (
        <div className="mt-2 flex gap-2">
          <input
            className="input"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="…or paste an image URL and press Add"
          />
          <button
            type="button"
            onClick={() => {
              if (urlDraft.trim()) {
                onChange(urlDraft.trim());
                setUrlDraft("");
              }
            }}
            className="btn-secondary btn-sm shrink-0"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
