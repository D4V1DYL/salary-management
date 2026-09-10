import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { NAV } from "@/lib/nav";
import { Wordmark } from "@/components/brand/Logo";
import { brand } from "@/config/brand";
import { cn } from "@/lib/cn";

export function Sidebar() {
  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Wordmark />
      </div>

      <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13px] font-medium transition-colors duration-150",
                        isActive ? "text-brand" : "text-muted hover:bg-surface-2 hover:text-text"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-active"
                            className="absolute inset-0 rounded-lg bg-brand-tint"
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          />
                        )}
                        <item.icon
                          className={cn(
                            "relative z-10 size-4 shrink-0 transition-colors",
                            isActive ? "text-brand" : "text-subtle group-hover:text-text"
                          )}
                          strokeWidth={2}
                        />
                        <span className="relative z-10">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-brand-tint text-brand">
            <ShieldCheck className="size-3.5" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="text-[11.5px] font-semibold text-text">Terkunci ke perangkat</p>
            <p className="truncate text-[10.5px] text-subtle">
              Lisensi aktif &middot; v{brand.vendor.version}
            </p>
          </div>
        </div>
        <p className="mt-2 px-1 text-[10px] text-subtle">
          &copy; {new Date().getFullYear()} {brand.vendor.name} &middot; {brand.company.name}
        </p>
      </div>
    </aside>
  );
}
