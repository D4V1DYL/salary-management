import { cn } from "@/lib/cn";

export function Card({
  className,
  inset,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface",
        inset && "p-0 overflow-hidden",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  title,
  subtitle,
  actions,
  icon,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-border px-5 py-4",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand [&_svg]:size-4.5">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {title && <h3 className="truncate text-[15px] font-semibold text-text">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}
