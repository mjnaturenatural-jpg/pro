"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { getWhatsAppLink } from "@/lib/whatsapp";

export function ContactForm({ whatsapp }: { whatsapp?: string } = {}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const waMessage = `Hello MJ Nature Natural,\n\nName: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`;
        const waLink = getWhatsAppLink(waMessage, whatsapp);
        window.open(waLink, "_blank", "noopener,noreferrer");
        toast({ message: "Redirecting to WhatsApp...", type: "success" });
        setForm({ name: "", email: "", message: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ message: data.error || "Could not send message", type: "error" });
      }
    } catch {
      const waMessage = `Hello MJ Nature Natural,\n\nName: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`;
      const waLink = getWhatsAppLink(waMessage, whatsapp);
      window.open(waLink, "_blank", "noopener,noreferrer");
      toast({ message: "Redirecting to WhatsApp...", type: "success" });
      setForm({ name: "", email: "", message: "" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoComplete="name"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            required
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
          />
        </div>
      </div>
      <div>
        <label className="label">Message</label>
        <textarea
          required
          rows={6}
          className="input resize-y"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Redirecting…" : "Send Message"}
      </button>
    </form>
  );
}
