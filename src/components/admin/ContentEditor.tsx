"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

interface Content {
  hero: {
    eyebrow: string;
    headline: string;
    subheading: string;
    ctaText: string;
    ctaHref: string;
    secondaryCtaText: string;
    secondaryCtaHref: string;
    image: string;
  };
  trustPoints: { title: string; description: string }[];
  featuredProductSlugs: string[];
  story: { title: string; body: string; image: string; ctaText: string; ctaHref: string };
  highlight: { title: string; body: string; image: string; productSlug: string; ctaText: string };
  whyPoints: { title: string; description: string }[];
  testimonials: { name: string; location: string; quote: string; rating: number }[];
  testimonialsEnabled: boolean;
  newsletter: { title: string; body: string; enabled: boolean };
  instagramUrl: string;
}

export function ContentEditor({
  content,
  products,
}: {
  content: Content;
  products: { name: string; slug: string }[];
  categories: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<Content>(content);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ message: "Content saved", type: "success" });
        router.refresh();
      } else {
        toast({ message: data.error || "Failed to save", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const setHero = (k: keyof Content["hero"], v: string) =>
    setForm((f) => ({ ...f, hero: { ...f.hero, [k]: v } }));
  const setStory = (k: keyof Content["story"], v: string) =>
    setForm((f) => ({ ...f, story: { ...f.story, [k]: v } }));
  const setHighlight = (k: keyof Content["highlight"], v: string) =>
    setForm((f) => ({ ...f, highlight: { ...f.highlight, [k]: v } }));

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-bark-900">Content</h1>
          <p className="text-sm text-bark-500">Manage homepage and store-wide content.</p>
        </div>
        <button onClick={save} disabled={saving} className="btn-primary btn-sm">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <Section title="Hero Section">
        <Row>
          <Field label="Eyebrow">
            <input className="input" value={form.hero.eyebrow} onChange={(e) => setHero("eyebrow", e.target.value)} />
          </Field>
          <Field label="Headline">
            <input className="input" value={form.hero.headline} onChange={(e) => setHero("headline", e.target.value)} />
          </Field>
        </Row>
        <Field label="Subheading">
          <textarea className="input min-h-[70px]" value={form.hero.subheading} onChange={(e) => setHero("subheading", e.target.value)} />
        </Field>
        <Row>
          <Field label="Primary CTA">
            <input className="input" value={form.hero.ctaText} onChange={(e) => setHero("ctaText", e.target.value)} />
          </Field>
          <Field label="Primary CTA Link">
            <input className="input" value={form.hero.ctaHref} onChange={(e) => setHero("ctaHref", e.target.value)} />
          </Field>
          <Field label="Secondary CTA">
            <input className="input" value={form.hero.secondaryCtaText} onChange={(e) => setHero("secondaryCtaText", e.target.value)} />
          </Field>
          <Field label="Secondary CTA Link">
            <input className="input" value={form.hero.secondaryCtaHref} onChange={(e) => setHero("secondaryCtaHref", e.target.value)} />
          </Field>
        </Row>
        <Field label="Hero Image URL (Cloudinary)">
          <input className="input" value={form.hero.image} onChange={(e) => setHero("image", e.target.value)} placeholder="https://res.cloudinary.com/…" />
        </Field>
      </Section>

      <Section title="Trust Strip (3–4 points)">
        {form.trustPoints.map((t, i) => (
          <Row key={i}>
            <Field label={`Title ${i + 1}`}>
              <input
                className="input"
                value={t.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    trustPoints: f.trustPoints.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)),
                  }))
                }
              />
            </Field>
            <Field label="Description">
              <input
                className="input"
                value={t.description}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    trustPoints: f.trustPoints.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)),
                  }))
                }
              />
            </Field>
          </Row>
        ))}
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, trustPoints: [...f.trustPoints, { title: "", description: "" }] }))}
          className="btn-secondary btn-sm"
        >
          Add Trust Point
        </button>
      </Section>

      <Section title="Featured Products">
        <p className="text-xs text-bark-500">
          Select products to feature. If none selected, bestsellers are shown automatically.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const selected = form.featuredProductSlugs.includes(p.slug);
            return (
              <label
                key={p.slug}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                  selected ? "border-caramel-500 bg-caramel-500 text-forest-900" : "border-bark-800/10 text-bark-600"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() =>
                    setForm((f) => ({
                      ...f,
                      featuredProductSlugs: selected
                        ? f.featuredProductSlugs.filter((s) => s !== p.slug)
                        : [...f.featuredProductSlugs, p.slug],
                    }))
                  }
                  className="rounded"
                />
                <span className="truncate">{p.name}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Brand Story">
        <Field label="Title">
          <input className="input" value={form.story.title} onChange={(e) => setStory("title", e.target.value)} />
        </Field>
        <Field label="Body">
          <textarea className="input min-h-[110px]" value={form.story.body} onChange={(e) => setStory("body", e.target.value)} />
        </Field>
        <Row>
          <Field label="Image URL">
            <input className="input" value={form.story.image} onChange={(e) => setStory("image", e.target.value)} />
          </Field>
          <Field label="CTA Text">
            <input className="input" value={form.story.ctaText} onChange={(e) => setStory("ctaText", e.target.value)} />
          </Field>
          <Field label="CTA Link">
            <input className="input" value={form.story.ctaHref} onChange={(e) => setStory("ctaHref", e.target.value)} />
          </Field>
        </Row>
      </Section>

      <Section title="Product Highlight">
        <Field label="Title">
          <input className="input" value={form.highlight.title} onChange={(e) => setHighlight("title", e.target.value)} />
        </Field>
        <Field label="Body">
          <textarea className="input min-h-[80px]" value={form.highlight.body} onChange={(e) => setHighlight("body", e.target.value)} />
        </Field>
        <Row>
          <Field label="Product Slug">
            <input
              className="input"
              list="product-slugs"
              value={form.highlight.productSlug}
              onChange={(e) => setHighlight("productSlug", e.target.value)}
            />
            <datalist id="product-slugs">
              {products.map((p) => (
                <option key={p.slug} value={p.slug} />
              ))}
            </datalist>
          </Field>
          <Field label="Image URL (optional)">
            <input className="input" value={form.highlight.image} onChange={(e) => setHighlight("image", e.target.value)} />
          </Field>
          <Field label="CTA Text">
            <input className="input" value={form.highlight.ctaText} onChange={(e) => setHighlight("ctaText", e.target.value)} />
          </Field>
        </Row>
      </Section>

      <Section title="Why MJ Nature Naturals">
        {form.whyPoints.map((w, i) => (
          <Row key={i}>
            <Field label={`Title ${i + 1}`}>
              <input
                className="input"
                value={w.title}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    whyPoints: f.whyPoints.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)),
                  }))
                }
              />
            </Field>
            <Field label="Description">
              <input
                className="input"
                value={w.description}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    whyPoints: f.whyPoints.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)),
                  }))
                }
              />
            </Field>
          </Row>
        ))}
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, whyPoints: [...f.whyPoints, { title: "", description: "" }] }))}
          className="btn-secondary btn-sm"
        >
          Add Point
        </button>
      </Section>

      <Section title="Testimonials">
        <label className="flex items-center gap-2.5 text-sm text-bark-700">
          <input
            type="checkbox"
            checked={form.testimonialsEnabled}
            onChange={(e) => setForm((f) => ({ ...f, testimonialsEnabled: e.target.checked }))}
            className="h-4 w-4 rounded"
          />
          Show testimonials section (only add real customer reviews)
        </label>
        {form.testimonials.map((t, i) => (
          <div key={i} className="rounded-lg border border-bark-800/10 p-4">
            <Row>
              <Field label="Name">
                <input
                  className="input"
                  value={t.name}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      testimonials: f.testimonials.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                    }))
                  }
                />
              </Field>
              <Field label="Location">
                <input
                  className="input"
                  value={t.location}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      testimonials: f.testimonials.map((x, idx) => (idx === i ? { ...x, location: e.target.value } : x)),
                    }))
                  }
                />
              </Field>
            </Row>
            <Field label="Quote">
              <textarea
                className="input min-h-[60px]"
                value={t.quote}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    testimonials: f.testimonials.map((x, idx) => (idx === i ? { ...x, quote: e.target.value } : x)),
                  }))
                }
              />
            </Field>
            <button
              type="button"
              onClick={() =>
                setForm((f) => ({ ...f, testimonials: f.testimonials.filter((_, idx) => idx !== i) }))
              }
              className="mt-2 text-xs text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setForm((f) => ({
              ...f,
              testimonials: [...f.testimonials, { name: "", location: "", quote: "", rating: 5 }],
            }))
          }
          className="btn-secondary btn-sm"
        >
          Add Testimonial
        </button>
      </Section>

      <Section title="Newsletter & Social">
        <label className="flex items-center gap-2.5 text-sm text-bark-700">
          <input
            type="checkbox"
            checked={form.newsletter.enabled}
            onChange={(e) => setForm((f) => ({ ...f, newsletter: { ...f.newsletter, enabled: e.target.checked } }))}
            className="h-4 w-4 rounded"
          />
          Show newsletter section
        </label>
        <Row>
          <Field label="Newsletter Title">
            <input
              className="input"
              value={form.newsletter.title}
              onChange={(e) => setForm((f) => ({ ...f, newsletter: { ...f.newsletter, title: e.target.value } }))}
            />
          </Field>
          <Field label="Instagram URL">
            <input className="input" value={form.instagramUrl} onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))} placeholder="https://instagram.com/…" />
          </Field>
        </Row>
        <Field label="Newsletter Body">
          <textarea
            className="input min-h-[60px]"
            value={form.newsletter.body}
            onChange={(e) => setForm((f) => ({ ...f, newsletter: { ...f.newsletter, body: e.target.value } }))}
          />
        </Field>
      </Section>

      <div className="flex justify-end pb-10">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save All Changes"}
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

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
