"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

export function NewsletterSection({
  newsletter,
  instagramUrl,
}: {
  newsletter: { title?: string; body?: string; enabled?: boolean };
  instagramUrl?: string;
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (newsletter.enabled === false) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ message: "You're subscribed. Welcome!", type: "success" });
        setEmail("");
      } else {
        toast({ message: data.error || "Could not subscribe", type: "error" });
      }
    } catch {
      toast({ message: "Could not subscribe. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-site pb-16 sm:pb-24">
      <div className="overflow-hidden rounded-2xl border border-bark-800/10 bg-gradient-to-br from-sand-50 to-ivory-100 px-6 py-12 text-center sm:px-12 sm:py-16">
        <p className="eyebrow mb-3">Newsletter</p>
        <h2 className="section-title">{newsletter.title || "Stay in the loop"}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-bark-600">
          {newsletter.body || "Be the first to hear about new launches, seasonal specials and offers."}
        </p>
        <form onSubmit={submit} className="mx-auto mt-7 flex max-w-md gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="input flex-1"
            aria-label="Email address"
          />
          <button type="submit" disabled={loading} className="btn-primary shrink-0">
            {loading ? "…" : "Subscribe"}
          </button>
        </form>
        {instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-sm font-medium text-caramel-400 hover:text-caramel-300"
          >
            Follow us on Instagram →
          </a>
        )}
      </div>
    </section>
  );
}
