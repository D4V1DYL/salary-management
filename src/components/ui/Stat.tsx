import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  sub,
  icon,
  delta,
  accent = "brand",
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  delta?: { value: string; dir: "up" | "down"; good?: boolean };
  accent?: "brand" | "pos" | "neg" | "warn";
  children?: React.ReactNode;
}) {
  const chip = {
    brand: "bg-brand-tint text-brand",
    pos: "bg-pos-soft text-pos",
    neg: "bg-neg-soft text-neg",
    warn: "bg-warn-soft text-warn",
  }[accent];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium text-muted">{label}</p>
        {icon && (
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-md [&_svg]:size-4", chip)}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex items-end gap-2">
        <span className="tnum font-display text-[22px] leading-none text-text">{value}</span>
        {delta && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 text-[12px] font-semibold",
              (delta.good ?? delta.dir === "up") ? "text-pos" : "text-neg"
            )}
          >
            {delta.dir === "up" ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      {sub && <p className="mt-1.5 text-[11.5px] text-subtle">{sub}</p>}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
