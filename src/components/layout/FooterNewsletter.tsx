"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { analytics } from "@/lib/analytics";

export function FooterNewsletter({ offer }: { offer: string }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  // Honeypot spam protection — bots fill it, humans never see it.
  const [company, setCompany] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    if (company) return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast({ message: "Please enter a valid email address.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ message: "You're subscribed. Welcome!", type: "success" });
        analytics.newsletterSignup();
        setEmail("");
      } else {
        toast({ message: data.error || "Could not subscribe.", type: "error" });
      }
    } catch {
      toast({ message: "Could not subscribe. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4">
      <p className="text-sm font-semibold text-honey-200">{offer}</p>
      <div className="mt-2.5 flex gap-2">
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          autoComplete="email"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm text-ivory-50 placeholder:text-ivory-50/50 focus:border-honey-300 focus:outline-none"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Subscribe to newsletter"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-caramel-600 to-caramel-500 text-white transition hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
}
