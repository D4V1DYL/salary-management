import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "pos" | "neg" | "warn" | "info" | "violet";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand-tint text-brand",
  pos: "bg-pos-soft text-pos",
  neg: "bg-neg-soft text-neg",
  warn: "bg-warn-soft text-warn",
  info: "bg-info-soft text-info",
  violet: "bg-[color-mix(in_srgb,var(--violet)_14%,transparent)] text-violet",
};

export function Badge({
  tone = "neutral",
  className,
  dot,
  children,
}: {
  tone?: Tone;
  className?: string;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[3px] text-[11px] font-semibold",
        "tracking-[0.01em] whitespace-nowrap",
        TONE[tone],
        className
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
