import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  desc,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon && (
        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-surface-2 text-subtle ring-1 ring-border [&_svg]:size-6">
          {icon}
        </span>
      )}
      <p className="text-[15px] font-semibold text-text">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.09em] text-subtle",
        className
      )}
    >
      {children}
    </p>
  );
}

export function KeyValue({
  label,
  children,
  mono,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-2">
      <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
      <dd className={cn("min-w-0 truncate text-right text-[13px] font-medium text-text", mono && "font-mono text-[12px]")}>
        {children}
      </dd>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}
