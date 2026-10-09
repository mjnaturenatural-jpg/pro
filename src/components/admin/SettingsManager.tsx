"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function SettingsManager({
  initial,
  integrations,
}: {
  initial: Record<string, unknown>;
  integrations: { razorpay: boolean; delhivery: boolean; cloudinary: boolean };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    brandName: (initial.brandName as string) || "",
    logo: (initial.logo as string) || "",
    favicon: (initial.favicon as string) || "",
    contactEmail: (initial.contactEmail as string) || "",
    phone: (initial.phone as string) || "",
    whatsapp: (initial.whatsapp as string) || "",
    address: (initial.address as string) || "",
    instagram: (initial.instagram as string) || "",
    facebook: (initial.facebook as string) || "",
    youtube: (initial.youtube as string) || "",
    announcementText: (initial.announcementText as string) || "",
    announcementEnabled: Boolean(initial.announcementEnabled),
    freeShippingThreshold: Number(initial.freeShippingThreshold ?? 999),
    flatShipping: Number(initial.flatShipping ?? 79),
    taxRate: Number(initial.taxRate ?? 0),
    gstNumber: (initial.gstNumber as string) || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ message: "Settings saved", type: "success" });
        router.refresh();
      } else {
        toast({ message: data.error || "Failed to save", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-bark-900">Settings</h1>
          <p className="text-sm text-bark-500">Store configuration and integrations.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary btn-sm">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">
          Brand & Contact
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Brand Name">
            <input className="input" value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />
          </Field>
          <Field label="Contact Email">
            <input type="email" className="input" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <input className="input" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </Field>
        </div>
        <Field label="Address">
          <textarea className="input min-h-[70px]" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Logo URL">
            <input className="input" value={form.logo} onChange={(e) => set("logo", e.target.value)} />
          </Field>
          <Field label="Favicon URL">
            <input className="input" value={form.favicon} onChange={(e) => set("favicon", e.target.value)} />
          </Field>
          <Field label="GST Number (leave blank if none)">
            <input className="input" value={form.gstNumber} onChange={(e) => set("gstNumber", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">Announcement Bar</h2>
        <label className="flex items-center gap-2.5 text-sm text-bark-700">
          <input
            type="checkbox"
            checked={form.announcementEnabled}
            onChange={(e) => set("announcementEnabled", e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Show announcement bar
        </label>
        <Field label="Announcement Text">
          <input
            className="input mt-3"
            value={form.announcementText}
            onChange={(e) => set("announcementText", e.target.value)}
            placeholder="Free shipping on orders above ₹999"
          />
        </Field>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">Shipping & Tax</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Free Shipping Threshold ₹">
            <input
              type="number"
              className="input"
              value={form.freeShippingThreshold}
              onChange={(e) => set("freeShippingThreshold", Number(e.target.value))}
            />
          </Field>
          <Field label="Flat Shipping ₹">
            <input
              type="number"
              className="input"
              value={form.flatShipping}
              onChange={(e) => set("flatShipping", Number(e.target.value))}
            />
          </Field>
          <Field label="Tax Rate %">
            <input
              type="number"
              className="input"
              value={form.taxRate}
              onChange={(e) => set("taxRate", Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">Social Links</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram">
            <input className="input" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="Facebook">
            <input className="input" value={form.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="YouTube">
            <input className="input" value={form.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="https://youtube.com/…" />
          </Field>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">
          Integrations Status
        </h2>
        <p className="mb-4 text-xs text-bark-400">
          Configure credentials via environment variables. Secrets are never shown here.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Integration label="Razorpay" ok={integrations.razorpay} />
          <Integration label="Delhivery" ok={integrations.delhivery} />
          <Integration label="Cloudinary" ok={integrations.cloudinary} />
        </div>
      </div>

      <div className="flex justify-end pb-10">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save All Changes"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Integration({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
        ok ? "border-leaf-200 bg-leaf-50" : "border-bark-800/10 bg-ivory-50"
      }`}
    >
      {ok ? (
        <CheckCircle2 size={17} className="text-leaf-600" />
      ) : (
        <XCircle size={17} className="text-bark-400" />
      )}
      <div>
        <p className="text-sm font-medium text-bark-900">{label}</p>
        <p className="text-[11px] text-bark-500">{ok ? "Configured" : "Not configured"}</p>
      </div>
    </div>
  );
}
