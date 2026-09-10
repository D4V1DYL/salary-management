import { cn } from "@/lib/cn";

export function Table({
  children,
  className,
  minWidth,
}: {
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
}) {
  return (
    <div className="scrollbar-thin w-full overflow-x-auto">
      <table
        className={cn("w-full border-separate border-spacing-0 text-[13px]", className)}
        style={minWidth ? { minWidth } : undefined}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      className={cn(
        "sticky top-0 z-10 border-b border-border bg-surface-2 px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-subtle",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  align = "left",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <td
      className={cn(
        "border-b border-border px-3 py-2.5 text-text",
        align === "right" && "text-right tnum",
        align === "center" && "text-center",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  hover = true,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }) {
  return (
    <tr
      className={cn(hover && "transition-colors hover:bg-surface-2/50", className)}
      {...props}
    >
      {children}
    </tr>
  );
}
