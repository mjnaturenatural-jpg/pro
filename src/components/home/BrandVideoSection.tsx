export function BrandVideoSection({
  src,
  poster,
  title,
  body,
}: {
  src?: string;
  poster?: string;
  title?: string;
  body?: string;
}) {
  if (!src) return null;

  return (
    <section className="container-site py-12 sm:py-16">
      <div className="mx-auto mb-6 max-w-2xl text-center">
        <p className="eyebrow mb-2">Our Brand</p>
        <h2 className="section-title">{title || "A Look Inside Our Kitchen"}</h2>
        {body ? (
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-bark-600">{body}</p>
        ) : null}
      </div>
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-bark-800/10 bg-bark-900 shadow-lift">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          className="aspect-video w-full"
          controls
          playsInline
          preload="metadata"
          poster={poster || undefined}
        >
          <source src={src} />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
