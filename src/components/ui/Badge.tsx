import { cn } from "@/lib/utils";

type Tone = "leaf" | "caramel" | "chilli" | "honey" | "berry" | "neutral" | "gold";

const TONES: Record<Tone, string> = {
  leaf: "bg-leaf-100 text-leaf-700",
  caramel: "bg-caramel-100 text-caramel-700",
  chilli: "bg-chilli-600 text-white",
  honey: "bg-honey-100 text-honey-700",
  berry: "bg-berry-100 text-berry-700",
  neutral: "bg-bark-800/5 text-bark-700",
  gold: "bg-turmeric-400 text-brown-900",
};

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Uppercase micro-label used for eyebrows and card kickers. */
export function Eyebrow({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("text-xs font-bold uppercase tracking-[0.2em] text-caramel-700", className)}>
      {children}
    </p>
  );
}
