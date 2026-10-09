"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Pencil, Trash2, X, Upload } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { slugify, cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  published: boolean;
  order: number;
  productCount: number;
}

const EMPTY = { name: "", slug: "", description: "", image: "", published: true, order: 0 };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing({ ...EMPTY });
    setIsNew(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setIsNew(false);
  };

  const save = async () => {
    if (!editing?.name?.trim()) {
      toast({ message: "Name is required", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editing.name.trim(),
        slug: editing.slug || slugify(editing.name),
        description: editing.description || "",
        image: editing.image || "",
        published: editing.published ?? true,
        order: editing.order ?? 0,
      };
      const res = await fetch(
        isNew ? "/api/admin/categories" : `/api/admin/categories/${editing._id}`,
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
      toast({ message: isNew ? "Category created" : "Category updated", type: "success" });
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${c._id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast({ message: "Category deleted", type: "success" });
      router.refresh();
    } else {
      toast({ message: data.error || "Failed to delete", type: "error" });
    }
  };

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setEditing((e) => ({ ...e!, image: data.url }));
    } else {
      toast({ message: data.error || "Upload failed", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-bark-900">Categories</h1>
          <p className="text-sm text-bark-500">{categories.length} categories</p>
        </div>
        <button onClick={openNew} className="btn-primary btn-sm">
          <Plus size={15} /> New Category
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <div key={c._id} className="card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold text-bark-900">{c.name}</h2>
                <p className="text-xs text-bark-400">/{c.slug}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c)} className="rounded p-1.5 text-bark-500 hover:bg-sand-50" aria-label="Edit">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(c)} className="rounded p-1.5 text-bark-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {c.description && <p className="mt-2 line-clamp-2 text-xs text-bark-500">{c.description}</p>}
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="rounded-full bg-sand-50 px-2 py-0.5 font-medium text-bark-600">
                {c.productCount} products
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold",
                  c.published ? "bg-leaf-100 text-leaf-700" : "bg-sand-100 text-bark-500"
                )}
              >
                {c.published ? "Published" : "Draft"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-bark-900/40" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-lg animate-fadeUp rounded-2xl bg-white p-6 shadow-lift sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg text-bark-900">
                {isNew ? "New Category" : "Edit Category"}
              </h2>
              <button onClick={() => setEditing(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  value={editing.name || ""}
                  onChange={(e) =>
                    setEditing((ed) => ({
                      ...ed!,
                      name: e.target.value,
                      slug: isNew ? slugify(e.target.value) : ed!.slug,
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">Slug</label>
                <input
                  className="input"
                  value={editing.slug || ""}
                  onChange={(e) => setEditing((ed) => ({ ...ed!, slug: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  className="input min-h-[70px]"
                  value={editing.description || ""}
                  onChange={(e) => setEditing((ed) => ({ ...ed!, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Image</label>
                <div className="flex items-center gap-3">
                  {editing.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editing.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  )}
                  <label className="btn-secondary btn-sm cursor-pointer">
                    <Upload size={14} /> Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) upload(f);
                      }}
                    />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-bark-700">
                <input
                  type="checkbox"
                  checked={editing.published ?? true}
                  onChange={(e) => setEditing((ed) => ({ ...ed!, published: e.target.checked }))}
                  className="h-4 w-4 rounded"
                />
                Published
              </label>
              <button onClick={save} disabled={saving} className="btn-primary w-full">
                {saving ? "Saving…" : isNew ? "Create Category" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
