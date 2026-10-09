import { Star } from "lucide-react";

export function TestimonialsSection({
  testimonials,
  enabled,
}: {
  testimonials: { name: string; quote: string; location?: string; rating?: number }[];
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <section className="container-site pb-16">
        <div className="rounded-2xl border border-bark-800/10 bg-white px-6 py-12 text-center">
          <p className="eyebrow mb-2">Testimonials</p>
          <h2 className="font-serif text-2xl text-bark-900">Customer stories coming soon.</h2>
        </div>
      </section>
    );
  }
  if (!testimonials?.length) return null;

  return (
    <section className="container-site py-16 sm:py-20">
      <div className="mb-10 text-center">
        <p className="eyebrow mb-2">Testimonials</p>
        <h2 className="section-title">What Our Customers Say</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.slice(0, 6).map((t, i) => (
          <div key={i} className="card flex flex-col p-6">
            {t.rating && (
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={14}
                    className={s < t.rating! ? "fill-caramel-400 text-caramel-400" : "text-sand-300"}
                  />
                ))}
              </div>
            )}
            <p className="flex-1 text-sm leading-relaxed text-bark-700">“{t.quote}”</p>
            <div className="mt-4 border-t border-bark-800/10 pt-3">
              <p className="text-sm font-semibold text-bark-900">{t.name}</p>
              {t.location && <p className="text-xs text-bark-500">{t.location}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
