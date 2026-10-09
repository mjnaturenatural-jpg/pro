"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function ContactForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Contact submissions are stored via newsletter-style endpoint fallback:
      // For production, wire this to an email provider or CRM webhook.
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ message: "Message sent! We'll get back to you soon.", type: "success" });
        setForm({ name: "", email: "", message: "" });
      } else {
        toast({ message: data.error || "Could not send message", type: "error" });
      }
    } catch {
      toast({ message: "Could not send message. Please try again.", type: "error" });
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
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
