"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { slugify, cn, formatINR } from "@/lib/utils";

interface PackSize {
  label: string;
  mrp: number;
  price: number;
  stock: number;
  sku: string;
  weight?: string;
}

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  ingredients: string;
  allergenInfo: string;
  storageInstructions: string;
  howToUse: string;
  shippingInfo: string;
  returnInfo: string;
  category: { _id?: string; name?: string } | string;
  images: string[];
  packSizes: PackSize[];
  badges: { pureGhee: boolean; eggless: boolean; noMaida: boolean; noAddedSugar: boolean };
  featured: boolean;
  published: boolean;
  keywords: string[];
}

const DEFAULT_PACKS: PackSize[] = [
  { label: "250g", mrp: 0, price: 0, stock: 0, sku: "" },
  { label: "500g", mrp: 0, price: 0, stock: 0, sku: "" },
  { label: "1kg", mrp: 0, price: 0, stock: 0, sku: "" },
];

const BADGE_OPTIONS = [
  { key: "pureGhee" as const, label: "100% Pure Ghee" },
  { key: "eggless" as const, label: "100% Eggless" },
  { key: "noMaida" as const, label: "No Maida" },
  { key: "noAddedSugar" as const, label: "No Added Sugar" },
];

export function ProductEditor({
  product,
  categories,
}: {
  product: ProductData | null;
  categories: { _id: string; name: string; slug: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const isNew = !product;

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    shortDescription: product?.shortDescription || "",
    description: product?.description || "",
    ingredients: product?.ingredients || "",
    allergenInfo: product?.allergenInfo || "",
    storageInstructions: product?.storageInstructions || "",
    howToUse: product?.howToUse || "",
    shippingInfo: product?.shippingInfo || "",
    returnInfo: product?.returnInfo || "",
    category:
      typeof product?.category === "object" && product?.category?._id
        ? product.category._id
        : typeof product?.category === "string"
          ? product.category
          : categories[0]?._id || "",
    images: product?.images || ([] as string[]),
    packSizes: product?.packSizes?.length ? product.packSizes : DEFAULT_PACKS,
    badges: product?.badges || { pureGhee: false, eggless: false, noMaida: false, noAddedSugar: false },
    featured: product?.featured || false,
    published: product?.published ?? true,
    keywords: product?.keywords?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setPack = (index: number, patch: Partial<PackSize>) => {
    setForm((f) => ({
      ...f,
      packSizes: f.packSizes.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  };

  const addPack = () =>
    setForm((f) => ({
      ...f,
      packSizes: [...f.packSizes, { label: "", mrp: 0, price: 0, stock: 0, sku: "" }],
    }));

  const removePack = (index: number) =>
    setForm((f) => ({ ...f, packSizes: f.packSizes.filter((_, i) => i !== index) }));

  const uploadImage = async (file: File) => {
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
      setForm((f) => ({ ...f, images: [...f.images, data.url] }));
      toast({ message: "Image uploaded", type: "success" });
    } catch {
      toast({ message: "Upload failed", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast({ message: "Product name is required", type: "error" });
      return;
    }
    if (!form.category) {
      toast({ message: "Select a category", type: "error" });
      return;
    }
    if (form.images.length === 0) {
      toast({ message: "Add at least one image", type: "error" });
      return;
    }
    if (form.packSizes.length === 0) {
      toast({ message: "Add at least one pack size", type: "error" });
      return;
    }
    for (const p of form.packSizes) {
      if (!p.label.trim()) {
        toast({ message: "Every pack size needs a label", type: "error" });
        return;
      }
      if (p.price <= 0) {
        toast({ message: `Selling price required for ${p.label}`, type: "error" });
        return;
      }
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name),
        keywords: form.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
        packSizes: form.packSizes.map((p) => ({
          label: p.label.trim(),
          mrp: Number(p.mrp) || Number(p.price),
          price: Number(p.price),
          stock: Number(p.stock) || 0,
          sku: p.sku || "",
          weight: p.weight || "",
        })),
      };
      const res = await fetch(
        isNew ? "/api/admin/products" : `/api/admin/products/${product!._id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast({ message: data.error || "Failed to save", type: "error" });
        return;
      }
      toast({ message: isNew ? "Product created" : "Product updated", type: "success" });
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast({ message: "Failed to save", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-bark-900">
            {isNew ? "New Product" : "Edit Product"}
          </h1>
          {product && <p className="text-sm text-bark-500">{product.name}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => router.push("/admin/products")} className="btn-secondary btn-sm">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary btn-sm">
            {saving ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Basics */}
      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product Name">
            <input
              className="input"
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({
                  ...f,
                  name,
                  slug: slugTouched ? f.slug : slugify(name),
                }));
              }}
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              className="input"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              placeholder="auto-generated-from-name"
            />
          </Field>
        </div>
        <Field label="Short Description">
          <input
            className="input"
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            maxLength={500}
          />
        </Field>
        <Field label="Full Description">
          <textarea className="input min-h-[120px]" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Keywords (comma separated)">
            <input className="input" value={form.keywords} onChange={(e) => set("keywords", e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <Toggle label="Published" checked={form.published} onChange={(v) => set("published", v)} />
          <Toggle label="Featured" checked={form.featured} onChange={(v) => set("featured", v)} />
        </div>
      </Section>

      {/* Badges */}
      <Section title="Product Badges (optional — only enable if confirmed for this product)">
        <div className="flex flex-wrap gap-3">
          {BADGE_OPTIONS.map((b) => (
            <button
              key={b.key}
              type="button"
              onClick={() => set("badges", { ...form.badges, [b.key]: !form.badges[b.key] })}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition",
                form.badges[b.key]
                  ? "border-leaf-600 bg-leaf-100 text-leaf-700"
                  : "border-bark-800/15 text-bark-500 hover:border-bark-800/40"
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Pack sizes */}
      <Section title="Pack Sizes & Pricing">
        <div className="space-y-3">
          {form.packSizes.map((p, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 rounded-lg border border-bark-800/10 bg-ivory-50 p-4 sm:grid-cols-6">
              <div className="col-span-2 sm:col-span-1">
                <Field label="Label">
                  <input className="input" value={p.label} onChange={(e) => setPack(i, { label: e.target.value })} placeholder="250g" />
                </Field>
              </div>
              <Field label="MRP ₹">
                <input type="number" min={0} className="input" value={p.mrp} onChange={(e) => setPack(i, { mrp: Number(e.target.value) })} />
              </Field>
              <Field label="Sell ₹">
                <input type="number" min={0} className="input" value={p.price} onChange={(e) => setPack(i, { price: Number(e.target.value) })} />
              </Field>
              <Field label="Stock">
                <input type="number" min={0} className="input" value={p.stock} onChange={(e) => setPack(i, { stock: Number(e.target.value) })} />
              </Field>
              <div className="col-span-2 flex items-end justify-between sm:col-span-1">
                <Field label="SKU">
                  <input className="input" value={p.sku || ""} onChange={(e) => setPack(i, { sku: e.target.value })} />
                </Field>
                <button
                  type="button"
                  onClick={() => removePack(i)}
                  className="mb-2 ml-2 rounded p-1.5 text-bark-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove pack size"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {p.mrp > p.price && p.price > 0 && (
                <p className="col-span-full text-xs text-leaf-600">
                  Discount: {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% · Customer pays {formatINR(p.price)}
                </p>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={addPack} className="btn-secondary btn-sm mt-3">
          <Plus size={14} /> Add Pack Size
        </button>
      </Section>

      {/* Images */}
      <Section title="Images">
        <div className="flex flex-wrap gap-3">
          {form.images.map((img, i) => (
            <div key={i} className="relative h-24 w-24 overflow-hidden rounded-lg border border-bark-800/10 bg-sand-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-ivory-100/90 p-1 text-red-500 shadow"
                aria-label="Remove image"
              >
                <Trash2 size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 rounded bg-forest-800/80 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  PRIMARY
                </span>
              )}
            </div>
          ))}
          <label className={cn(
            "flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-bark-800/15 text-bark-400 transition hover:border-caramel-500 hover:text-caramel-600",
            uploading && "pointer-events-none opacity-50"
          )}>
            <Upload size={18} />
            <span className="mt-1 text-[10px]">{uploading ? "…" : "Upload"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
        <Field label="…or paste an image URL">
          <div className="flex gap-2">
            <input id="image-url" className="input" placeholder="https://res.cloudinary.com/…" />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("image-url") as HTMLInputElement;
                if (el?.value) {
                  set("images", [...form.images, el.value.trim()]);
                  el.value = "";
                }
              }}
              className="btn-secondary btn-sm shrink-0"
            >
              Add
            </button>
          </div>
        </Field>
      </Section>

      {/* Details */}
      <Section title="Product Information">
        <Field label="Ingredients">
          <textarea className="input min-h-[80px]" value={form.ingredients} onChange={(e) => set("ingredients", e.target.value)} />
        </Field>
        <Field label="Allergen Information">
          <textarea className="input min-h-[60px]" value={form.allergenInfo} onChange={(e) => set("allergenInfo", e.target.value)} />
        </Field>
        <Field label="Storage Instructions">
          <textarea className="input min-h-[60px]" value={form.storageInstructions} onChange={(e) => set("storageInstructions", e.target.value)} />
        </Field>
        <Field label="How to Use / Serving Information">
          <textarea className="input min-h-[60px]" value={form.howToUse} onChange={(e) => set("howToUse", e.target.value)} />
        </Field>
        <Field label="Shipping Information">
          <textarea className="input min-h-[60px]" value={form.shippingInfo} onChange={(e) => set("shippingInfo", e.target.value)} />
        </Field>
        <Field label="Return / Refund Information">
          <textarea className="input min-h-[60px]" value={form.returnInfo} onChange={(e) => set("returnInfo", e.target.value)} />
        </Field>
      </Section>

      <div className="flex justify-end gap-2 pb-10">
        <button onClick={() => router.push("/admin/products")} className="btn-secondary">
          Cancel
        </button>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 sm:p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-bark-700">{title}</h2>
      <div className="space-y-4">{children}</div>
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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-bark-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-bark-800/20 text-caramel-500 focus:ring-caramel-500"
      />
      {label}
    </label>
  );
}
