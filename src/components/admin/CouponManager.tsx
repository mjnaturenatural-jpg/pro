"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2, X, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/utils";

interface Coupon {
  _id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
}

interface CouponForm {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number;
  maxDiscount: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perUserLimit: string;
  active: boolean;
}

const EMPTY: CouponForm = {
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minOrder: 0,
  maxDiscount: "",
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  usageLimit: "",
  perUserLimit: "",
  active: true,
};

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!form.code.trim()) {
      toast({ message: "Code is required", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: Number(form.value),
          minOrder: Number(form.minOrder) || 0,
          maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
          startsAt: form.startsAt,
          endsAt: form.endsAt,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
          perUserLimit: form.perUserLimit ? Number(form.perUserLimit) : null,
          active: form.active,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ message: data.error || "Failed to create", type: "error" });
        return;
      }
      toast({ message: "Coupon created", type: "success" });
      setOpen(false);
      setForm(EMPTY);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    router.refresh();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    const res = await fetch(`/api/admin/coupons/${c._id}`, { method: "DELETE" });
    if (res.ok) {
      toast({ message: "Coupon deleted", type: "success" });
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-bark-900">Coupons</h1>
          <p className="text-sm text-bark-500">{coupons.length} coupons</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary btn-sm">
          <Plus size={15} /> New Coupon
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ivory-100 text-left text-[11px] uppercase tracking-wide text-bark-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Validity</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bark-800/5">
              {coupons.map((c) => (
                <tr key={c._id} className="hover:bg-ivory-50">
                  <td className="px-4 py-3 font-mono font-semibold text-bark-900">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.type === "PERCENTAGE" ? `${c.value}%` : `₹${c.value}`}
                    {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                  </td>
                  <td className="px-4 py-3">₹{c.minOrder}</td>
                  <td className="px-4 py-3 text-xs text-bark-500">
                    {formatDate(c.startsAt)} → {formatDate(c.endsAt)}
                  </td>
                  <td className="px-4 py-3">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.active ? "bg-leaf-100 text-leaf-700" : "bg-sand-100 text-bark-500"}`}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => toggle(c)} className="rounded p-1.5 text-bark-500 hover:bg-bark-800/10" title="Toggle active">
                        {c.active ? <ToggleRight size={16} className="text-leaf-400" /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => remove(c)} className="rounded p-1.5 text-bark-500 hover:bg-red-50 hover:text-red-600" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-bark-500">
                    No coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-900/40" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto animate-fadeUp rounded-2xl bg-ivory-100 p-6 shadow-lift sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg text-bark-900">New Coupon</h2>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Code</label>
                  <input className="input uppercase" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="WELCOME10" />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "PERCENTAGE" | "FIXED" }))}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="label">{form.type === "PERCENTAGE" ? "Percent" : "Amount"}</label>
                  <input type="number" className="input" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Min Order ₹</label>
                  <input type="number" className="input" value={form.minOrder} onChange={(e) => setForm((f) => ({ ...f, minOrder: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Max Discount ₹</label>
                  <input type="number" className="input" value={form.maxDiscount} onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Starts</label>
                  <input type="date" className="input" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Ends</label>
                  <input type="date" className="input" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Usage Limit</label>
                  <input type="number" className="input" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" />
                </div>
                <div>
                  <label className="label">Per-User Limit</label>
                  <input type="number" className="input" value={form.perUserLimit} onChange={(e) => setForm((f) => ({ ...f, perUserLimit: e.target.value }))} placeholder="Unlimited" />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-bark-700">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} className="h-4 w-4 rounded" />
                Active
              </label>
              <button onClick={create} disabled={saving} className="btn-primary w-full">
                {saving ? "Creating…" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
