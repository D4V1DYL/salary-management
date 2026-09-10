import { useState } from "react";
import { cn } from "@/lib/cn";
import { brand } from "@/config/brand";

/**
 * DM Tech mark.
 *
 * Uses the real image at `brand.vendor.logoSrc` (drop `public/brand-logo.png`
 * or `.svg`). If that file is missing / fails to load, it falls back to a
 * drawn badge — gold ring, black disc, white serif monogram — so the app
 * always shows *something* on-brand.
 */
const RING = "#efa829";
const DISC = "#0a0a0a";

function DrawnMark({ size }: { size: number }) {
  const text = brand.vendor.initials.toUpperCase().slice(0, 3);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="50" r="49" fill={RING} />
      <circle cx="50" cy="50" r="42" fill={DISC} />
      <text
        x="51"
        y="52"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontFamily="'Times New Roman', Georgia, serif"
        fontWeight="700"
        fontSize={text.length > 2 ? 36 : 52}
        letterSpacing={text.length > 2 ? "-2" : "-3"}
      >
        {text}
      </text>
    </svg>
  );
}

export function LogoMark({ className, size = 32 }: { className?: string; size?: number }) {
  const [broken, setBroken] = useState(false);

  if (broken || !brand.vendor.logoSrc) {
    return (
      <span className={cn("inline-flex shrink-0", className)}>
        <DrawnMark size={size} />
      </span>
    );
  }

  return (
    <img
      src={brand.vendor.logoSrc}
      width={size}
      height={size}
      alt={`${brand.vendor.name} logo`}
      onError={() => setBroken(true)}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

export function Wordmark({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={compact ? 26 : 32} />
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[14px] font-bold tracking-[-0.015em] text-text">
            {brand.vendor.name}
          </span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.09em] text-subtle">
            {brand.vendor.product}
          </span>
        </span>
      )}
    </span>
  );
}
