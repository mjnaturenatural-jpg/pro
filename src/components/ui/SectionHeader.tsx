import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/Badge";

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  linkHref?: string;
  linkLabel?: string;
  className?: string;
}

export function SectionHeader({ eyebrow, title, subtitle, align = "center", linkHref, linkLabel, className }: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <div className={cn("mb-8 sm:mb-10", centered ? "text-center" : "flex flex-wrap items-end justify-between gap-4", className)}>
      <div className={centered ? "mx-auto max-w-2xl" : "max-w-2xl"}>
        <Eyebrow className={centered ? "" : "mb-2"}>{eyebrow}</Eyebrow>
        <h2 className="mt-2 font-serif text-3xl leading-tight text-bark-900 sm:text-4xl">{title}</h2>
        {subtitle && <p className="mt-3 text-sm leading-relaxed text-bark-600 sm:text-base">{subtitle}</p>}
      </div>
      {linkHref && !centered && (
        <Link href={linkHref} className="hidden items-center gap-1 text-sm font-semibold text-caramel-700 hover:text-caramel-600 sm:inline-flex">
          {linkLabel || "View all"} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
