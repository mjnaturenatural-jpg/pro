const ITEMS = [
  "Pure Ghee",
  "Original Jaggery",
  "100% Eggless",
  "No Maida",
  "No Refined Sugar",
  "Small-Batch Kitchen",
  "Ships Across India",
];

export function TrustMarquee() {
  return (
    <div className="overflow-hidden bg-brown-900 py-3.5" aria-label="Our promises">
      <div className="animate-marquee flex w-max whitespace-nowrap">
        {[0, 1].map((n) => (
          <div key={n} className="flex shrink-0 items-center" aria-hidden={n === 1}>
            {ITEMS.map((c) => (
              <span key={c} className="px-6 text-xs font-bold uppercase tracking-[0.2em] text-ivory-50">
                {c} <span className="pl-12 text-turmeric-400">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
