import { rupiah } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Tabular currency. `signed` colours positive green / negative red and
 * adds an explicit +/− so meaning never rests on colour alone.
 */
export function Money({
  value,
  signed = false,
  muted = false,
  strong = false,
  className,
}: {
  value: number;
  signed?: boolean;
  muted?: boolean;
  strong?: boolean;
  className?: string;
}) {
  const v = Math.round(value ?? 0);
  const tone = signed && v !== 0 ? (v > 0 ? "text-pos" : "text-neg") : muted ? "text-subtle" : "text-text";
  const prefix = signed && v !== 0 ? (v > 0 ? "+ " : "− ") : "";
  return (
    <span className={cn("tnum tracking-tight", strong && "font-semibold", tone, className)}>
      {prefix}
      {rupiah(Math.abs(v))}
    </span>
  );
}
