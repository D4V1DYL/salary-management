import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, DatabaseBackup, ChevronRight, Clock } from "lucide-react";
import { ALL_NAV_ITEMS } from "@/lib/nav";
import { toggleTheme } from "@/lib/theme";
import { usePayroll } from "@/data/store";
import { useLicense } from "@/data/license";
import { waktuRelatif } from "@/lib/format";
import { appTitle } from "@/config/brand";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/Button";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Topbar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const now = useClock();
  const lastBackupAt = usePayroll((s) => s.lastBackupAt);
  const createBackup = usePayroll((s) => s.createBackup);
  const license = useLicense((s) => s.status);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const current =
    ALL_NAV_ITEMS.find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to) && i.to !== "/")) ??
    ALL_NAV_ITEMS[0];

  const trial = license?.state === "trial";

  return (
    <header className="drag-region flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-6">
      <div className="flex items-center gap-1.5 text-[13px]">
        <span className="font-medium text-subtle">{appTitle}</span>
        <ChevronRight className="size-3.5 text-border-strong" />
        <span className="font-semibold text-text">{current?.label}</span>
      </div>

      <div className="no-drag flex items-center gap-2">
        {trial && (
          <button
            onClick={() => nav("/backup-lisensi")}
            title="Aktifkan lisensi penuh"
            className="flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn-soft px-2.5 py-1 text-[11.5px] font-semibold text-warn transition-colors hover:brightness-95"
          >
            <Clock className="size-3.5" />
            Trial · {license?.daysLeft} hari lagi
          </button>
        )}

        <div className="mr-1 hidden text-right leading-tight sm:block">
          <p className="text-[12.5px] font-semibold text-text">
            {now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <p className="tnum text-[11px] text-subtle">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<DatabaseBackup />}
          onClick={() => {
            const e = createBackup("manual");
            toast.success("Backup dibuat", e.path.split(/[\\/]/).pop());
          }}
          title={`Backup terakhir ${waktuRelatif(lastBackupAt)}`}
        >
          Cadangkan
        </Button>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Ganti tema"
          onClick={() => {
            toggleTheme();
            setDark(document.documentElement.classList.contains("dark"));
          }}
        >
          {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
        </Button>
      </div>
    </header>
  );
}
