import { useId } from "react";
import { cn } from "@/lib/cn";
import { rupiahCompact } from "@/lib/format";

/** Lightweight column chart — pure divs, theme-aware, always-on value labels. */
export function ColumnChart({
  data,
  height = 180,
  valueFormat = rupiahCompact,
  className,
}: {
  data: { label: string; value: number; hint?: string }[];
  height?: number;
  valueFormat?: (n: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const plot = height - 30; // room for the value label row
  return (
    <div className={cn("relative", className)}>
      {/* baseline */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[22px] h-px bg-border" />
      <div className="flex items-end justify-around gap-3" style={{ height }}>
        {data.map((d, i) => {
          const h = Math.max(6, (d.value / max) * (plot - 22));
          const last = i === data.length - 1;
          return (
            <div key={d.label} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <span
                className={cn(
                  "tnum mb-1.5 whitespace-nowrap text-[11px] font-semibold tabular-nums transition-colors",
                  last ? "text-brand" : "text-muted"
                )}
              >
                {valueFormat(d.value)}
              </span>
              <div
                className="relative w-full max-w-[78px] overflow-hidden rounded-t-md ring-1 ring-inset ring-black/5 transition-all duration-300"
                style={{ height: h }}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-t-md",
                    last
                      ? "bg-gradient-to-b from-brand to-brand-hover"
                      : "bg-gradient-to-b from-navy-200 to-navy-300 group-hover:from-navy-300 group-hover:to-navy-400 dark:from-navy-600 dark:to-navy-700"
                  )}
                />
              </div>
              <span className="mt-2 text-[11px] font-medium text-subtle">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Small trend sparkline. */
export function Sparkline({
  points,
  width = 120,
  height = 34,
  tone = "brand",
}: {
  points: number[];
  width?: number;
  height?: number;
  tone?: "brand" | "pos" | "neg";
}) {
  const id = useId();
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  const coords = points.map((p, i) => [i * step, height - 3 - ((p - min) / span) * (height - 6)] as const);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const stroke = tone === "pos" ? "var(--pos)" : tone === "neg" ? "var(--neg)" : "var(--brand)";
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${id})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={coords[coords.length - 1][0]} cy={coords[coords.length - 1][1]} r="2.5" fill={stroke} />
    </svg>
  );
}

/** Horizontal proportion bar used in Rekap / Dashboard breakdowns. */
export function MeterRow({
  label,
  value,
  total,
  tone = "brand",
  right,
}: {
  label: string;
  value: number;
  total: number;
  tone?: "brand" | "pos" | "neg" | "warn";
  right?: React.ReactNode;
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  const bar = { brand: "bg-brand", pos: "bg-pos", neg: "bg-neg", warn: "bg-warn" }[tone];
  return (
    <div className="py-2">
      <div className="flex items-center justify-between gap-4 text-[13px]">
        <span className="truncate font-medium text-text">{label}</span>
        <span className="tnum shrink-0 text-muted">{right}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full transition-[width] duration-500", bar)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
