import { initials } from "@/lib/format";
import { cn } from "@/lib/cn";

const PALETTE = [
  "bg-[#1f4a6e] text-white",
  "bg-[#0a7d57] text-white",
  "bg-[#7a4a12] text-white",
  "bg-[#5b2a6e] text-white",
  "bg-[#1f5c87] text-white",
  "bg-[#8a2f3a] text-white",
];

export function Avatar({
  nama,
  id = 0,
  size = "md",
  className,
}: {
  nama: string;
  id?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dims =
    size === "sm" ? "size-7 text-[11px]" : size === "lg" ? "size-11 text-sm" : "size-9 text-[12.5px]";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold ring-1 ring-black/5 select-none",
        dims,
        PALETTE[id % PALETTE.length],
        className
      )}
      aria-hidden
    >
      {initials(nama)}
    </span>
  );
}
