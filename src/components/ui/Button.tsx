import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle" | "brand";
type Size = "sm" | "md" | "lg" | "icon";

const VARIANT: Record<Variant, string> = {
  // The one committed action — near-black fill
  primary:
    "bg-ink text-ink-fg hover:bg-ink-hover active:bg-ink-active shadow-[var(--shadow-card)] disabled:opacity-50",
  // Navy — for brand-weighted actions where near-black would read as generic
  brand: "bg-brand text-brand-fg hover:bg-brand-hover active:bg-brand-active shadow-[var(--shadow-card)]",
  // The workhorse — white with a hairline border
  secondary:
    "bg-surface text-text border border-border-strong hover:bg-surface-2 active:bg-surface-3",
  subtle: "bg-surface-2 text-text hover:bg-surface-3 border border-transparent",
  ghost: "bg-transparent text-muted hover:bg-surface-2 hover:text-text border border-transparent",
  danger: "bg-neg text-white hover:brightness-105 active:brightness-95 shadow-[var(--shadow-card)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[7px]",
  md: "h-9 px-3.5 text-[13.5px] gap-2 rounded-lg",
  lg: "h-10 px-4.5 text-sm gap-2 rounded-lg",
  icon: "h-9 w-9 rounded-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, icon, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "no-drag inline-flex select-none items-center justify-center whitespace-nowrap font-medium",
        "transition-[background,border-color,color,box-shadow,transform] duration-150 ease-[var(--ease-out-expo)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        "active:translate-y-px disabled:pointer-events-none disabled:opacity-55",
        VARIANT[variant],
        SIZE[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        icon && <span className="-ml-0.5 shrink-0 [&_svg]:size-4">{icon}</span>
      )}
      {size !== "icon" && children}
    </button>
  );
});
