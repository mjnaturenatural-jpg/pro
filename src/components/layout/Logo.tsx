import Image from "next/image";

/**
 * Brand mark for MJ Nature Natural.
 *
 * Falls back to the built-in MJ monogram that ships with the project when no
 * custom logo has been uploaded. Upload the original logo via
 * Admin → Settings → Logo URL to replace the monogram everywhere.
 */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="MJ Nature Natural"
      className={className}
    >
      <rect width="64" height="64" rx="16" fill="#1B6B42" />
      <text
        x="32"
        y="42"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="26"
        fontWeight="600"
        fill="#FDFCF4"
        textAnchor="middle"
      >
        MJ
      </text>
    </svg>
  );
}

export function BrandLogo({
  logo = "/images/logo.png",
  brandName = "MJ Nature Natural",
  size = 36,
  tone = "light",
}: {
  logo?: string;
  brandName?: string;
  size?: number;
  tone?: "light" | "dark";
}) {
  const nameClass =
    tone === "dark" ? "text-ivory-50" : "text-bark-900";
  return (
    <span className="flex items-center gap-2.5 shrink-0">
      {logo ? (
        <Image
          src={logo}
          alt={brandName}
          width={size * 2}
          height={size}
          className="h-10 w-auto rounded-lg bg-ivory-50 object-contain px-1"
          priority
        />
      ) : (
        <LogoMark size={size} />
      )}
      <span className="flex flex-col leading-none">
        <span className={`font-serif text-lg font-semibold sm:text-xl ${nameClass}`}>
          {brandName.split(" ").slice(0, 2).join(" ")}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.28em] text-caramel-600">
          {brandName.split(" ").slice(2).join(" ") || "Natural"}
        </span>
      </span>
    </span>
  );
}
