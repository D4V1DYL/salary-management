import { create } from "zustand";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastKind = "success" | "error" | "info" | "warn";
interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  desc?: string;
}

interface ToastState {
  items: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set((s) => ({ items: [...s.items, { ...t, id }] }));
    setTimeout(() => set((s) => ({ items: s.items.filter((x) => x.id !== id) })), 4200);
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
}));

export const toast = {
  success: (title: string, desc?: string) => useToastStore.getState().push({ kind: "success", title, desc }),
  error: (title: string, desc?: string) => useToastStore.getState().push({ kind: "error", title, desc }),
  info: (title: string, desc?: string) => useToastStore.getState().push({ kind: "info", title, desc }),
  warn: (title: string, desc?: string) => useToastStore.getState().push({ kind: "warn", title, desc }),
};

const ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warn: TriangleAlert,
};
const ACCENT = {
  success: "text-pos",
  error: "text-neg",
  info: "text-info",
  warn: "text-warn",
};

export function Toaster() {
  const { items, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[200] flex w-[360px] flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-pop)]"
              role="status"
            >
              <Icon className={cn("mt-0.5 size-4.5 shrink-0", ACCENT[t.kind])} />
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold text-text">{t.title}</p>
                {t.desc && <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{t.desc}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="-m-1 rounded-md p-1 text-subtle transition-colors hover:bg-surface-2 hover:text-text"
                aria-label="Tutup notifikasi"
              >
                <XCircle className="size-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
