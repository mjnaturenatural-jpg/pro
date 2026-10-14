"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { BadgeCheck, ChevronLeft, ChevronRight, Instagram } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Rating } from "@/components/ui/Rating";
import { REVIEWS, reviewSummary, type Review } from "@data/reviews";

interface ReviewsSectionProps {
  instagramUrl?: string;
  googleReviewsUrl?: string;
}

export function ReviewsSection({ instagramUrl, googleReviewsUrl }: ReviewsSectionProps) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: "start" });
  const [selected, setSelected] = useState(0);
  const summary = reviewSummary();

  const onSelect = useCallback(() => {
    if (!embla) return;
    setSelected(embla.selectedScrollSnap());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);

  return (
    <section className="bg-sand-100 py-16 sm:py-20">
      <div className="container-site">
        <SectionHeader
          eyebrow="Reviews"
          title="Loved Across India"
          subtitle="Real words from real kitchens — unedited and unscripted."
          align="center"
        />

        <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-4 rounded-3xl border border-bark-800/10 bg-ivory-100 px-6 py-7 shadow-soft sm:flex-row sm:gap-8">
          <div className="text-center">
            <p className="font-serif text-5xl font-bold text-brown-900">{summary.average.toFixed(1)}</p>
            <div className="mt-1.5 flex justify-center">
              <Rating value={summary.average} size={15} />
            </div>
            <p className="mt-1 text-xs font-semibold text-bark-500">{summary.total} verified reviews</p>
          </div>
          <div className="w-full flex-1 space-y-1.5">
            {summary.distribution.map((d) => (
              <div key={d.stars} className="flex items-center gap-2 text-xs">
                <span className="w-6 shrink-0 font-bold text-bark-600">{d.stars}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-bark-800/10" role="img" aria-label={`${d.count} ${d.stars}-star reviews`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-turmeric-500 to-turmeric-400"
                    style={{ width: `${summary.total ? Math.round((d.count / summary.total) * 100) : 0}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-bark-500">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {REVIEWS.map((r: Review) => (
                <div key={`${r.name}-${r.city}`} className="min-w-0 shrink-0 grow-0 basis-full px-1 sm:basis-1/2 lg:basis-1/3 sm:px-2.5">
                  <figure className="flex h-full flex-col rounded-3xl border border-bark-800/10 bg-ivory-100 p-6 shadow-soft sm:p-7">
                    <Rating value={r.rating} size={14} />
                    <blockquote className="mt-4 flex-1 font-serif text-[17px] italic leading-relaxed text-bark-800">
                      “{r.quote}”
                    </blockquote>
                    {r.product && (
                      <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-caramel-700">
                        Bought: {r.product}
                      </p>
                    )}
                    <figcaption className="mt-4 flex items-center gap-3 border-t border-bark-800/10 pt-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-caramel-600 to-turmeric-500 font-serif text-base font-bold text-white" aria-hidden="true">
                        {r.name.charAt(0)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-bark-900">
                          {r.name} · {r.city}
                        </span>
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-leaf-700">
                          <BadgeCheck size={12} /> Verified buyer
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button type="button" onClick={scrollPrev} aria-label="Previous reviews" className="flex h-11 w-11 items-center justify-center rounded-full border border-bark-800/15 bg-ivory-100 text-bark-700 shadow-sm transition hover:border-caramel-600 hover:text-caramel-700">
              <ChevronLeft size={18} />
            </button>
            <span className="text-xs font-bold text-bark-500" aria-live="polite">
              {selected + 1} / {REVIEWS.length}
            </span>
            <button type="button" onClick={scrollNext} aria-label="Next reviews" className="flex h-11 w-11 items-center justify-center rounded-full border border-bark-800/15 bg-ivory-100 text-bark-700 shadow-sm transition hover:border-caramel-600 hover:text-caramel-700">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {(instagramUrl || googleReviewsUrl) && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                <Instagram size={14} /> Follow on Instagram
              </a>
            )}
            {googleReviewsUrl && (
              <a href={googleReviewsUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                Review us on Google
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
