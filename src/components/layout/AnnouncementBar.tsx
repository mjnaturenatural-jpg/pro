const MESSAGES = [
  "Free shipping on all orders",
  "100% Eggless • No Maida • No Refined Sugar",
  "Made fresh in small batches",
  "Festive gifting hampers available",
];

export function AnnouncementBar({ adminText = "" }: { adminText?: string }) {
  const messages = adminText ? [adminText, ...MESSAGES] : MESSAGES;

  return (
    <div className="bg-gradient-to-r from-caramel-700 via-caramel-600 to-caramel-700 text-white">
      <div className="overflow-hidden py-2" aria-label="Announcements">
        <div className="animate-marquee flex w-max whitespace-nowrap">
          {[0, 1].map((n) => (
            <div key={n} className="flex shrink-0 items-center" aria-hidden={n === 1}>
              {messages.map((m) => (
                <span
                  key={m}
                  className="px-6 text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs"
                >
                  {m} <span className="pl-10 text-turmeric-300">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
