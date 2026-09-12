import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, LockKeyhole, Loader2, ShieldAlert, KeyRound } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { brand, appTitle } from "@/config/brand";
import { activateLicense, fetchLicenseStatus, transferLicense } from "@/lib/useLicense";

type Phase = "loading" | "idle" | "checking" | "ok" | "mismatch";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [transferring, setTransferring] = useState(false);

  // On mount: read (and self-bind on first run) the real device license.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let status = await fetchLicenseStatus();
        if (!status.bound) status = await activateLicense();
        if (cancelled) return;
        setPhase(status.matches ? "idle" : "mismatch");
      } catch {
        if (cancelled) return;
        setPhase("idle"); // fail-open rather than bricking the app on an unexpected error
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase !== "checking") return;
    const t = setTimeout(() => setPhase("ok"), 1150);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "ok") return;
    const t = setTimeout(onUnlock, 520);
    return () => clearTimeout(t);
  }, [phase, onUnlock]);

  async function submitTransfer() {
    setPwError("");
    setTransferring(true);
    try {
      await transferLicense(pw);
      setPhase("idle");
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Password salah.");
    } finally {
      setTransferring(false);
    }
  }

  const mismatch = phase === "mismatch";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0b1f33] text-white">
      {/* backdrop */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: mismatch
            ? "radial-gradient(120% 80% at 50% -10%, rgba(192,37,53,0.4), transparent 60%), radial-gradient(90% 60% at 100% 110%, rgba(192,37,53,0.12), transparent 55%)"
            : "radial-gradient(120% 80% at 50% -10%, rgba(49,114,166,0.45), transparent 60%), radial-gradient(90% 60% at 100% 110%, rgba(18,185,129,0.16), transparent 55%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-[420px] rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl"
        style={{ boxShadow: "0 30px 80px -20px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center gap-3">
          <LogoMark size={40} />
          <div className="leading-tight">
            <p className="text-[15px] font-bold">{appTitle}</p>
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/45">
              {brand.vendor.product} &middot; v{brand.vendor.version}
            </p>
          </div>
        </div>

        {mismatch ? (
          <>
            <div className="my-6 flex flex-col items-center text-center">
              <span className="grid size-16 place-items-center rounded-2xl border border-[#c02535]/40 bg-[#c02535]/10">
                <ShieldAlert className="size-7 text-[#ff6b6f]" />
              </span>
              <h1 className="mt-4 text-[17px] font-semibold">Lisensi tidak aktif di perangkat ini</h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
                Aplikasi ini terdaftar untuk komputer lain. Kalau ini penggantian perangkat yang sah,
                masukkan password admin untuk mengaktifkannya di sini.
              </p>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Password admin"
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-3 text-[13.5px] text-white placeholder:text-white/35 outline-none focus:border-white/30"
                />
              </div>
              {pwError && <p className="text-[12px] font-medium text-[#ff8a8e]">{pwError}</p>}
              <button
                onClick={submitTransfer}
                disabled={transferring || !pw}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-[#0b1f33] transition-all hover:bg-white/90 active:translate-y-px disabled:opacity-60"
              >
                {transferring ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {transferring ? "Memverifikasi…" : "Aktifkan di perangkat ini"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="my-6 flex flex-col items-center text-center">
              <motion.span
                className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]"
                animate={
                  phase === "checking"
                    ? {
                        boxShadow: [
                          "0 0 0 0 rgba(18,185,129,0)",
                          "0 0 0 10px rgba(18,185,129,0.14)",
                          "0 0 0 0 rgba(18,185,129,0)",
                        ],
                      }
                    : {}
                }
                transition={{ repeat: phase === "checking" ? Infinity : 0, duration: 1.4 }}
              >
                {phase === "ok" ? (
                  <ShieldCheck className="size-7 text-[#34d399]" />
                ) : phase === "checking" || phase === "loading" ? (
                  <Loader2 className="size-7 animate-spin text-white/80" />
                ) : (
                  <Fingerprint className="size-7 text-white/80" />
                )}
              </motion.span>
              <h1 className="mt-4 text-[17px] font-semibold">
                {phase === "ok"
                  ? "Perangkat terverifikasi"
                  : phase === "loading"
                    ? "Memeriksa lisensi…"
                    : "Terkunci ke perangkat ini"}
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
                Aplikasi ini berlisensi khusus untuk komputer ini dan tidak bisa dijalankan di
                perangkat lain.
              </p>
            </div>

            <button
              onClick={() => setPhase("checking")}
              disabled={phase !== "idle"}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-[#0b1f33] transition-all hover:bg-white/90 active:translate-y-px disabled:opacity-70"
            >
              <LockKeyhole className="size-4" />
              {phase === "idle"
                ? "Buka Aplikasi"
                : phase === "checking"
                  ? "Memverifikasi…"
                  : phase === "loading"
                    ? "Memuat…"
                    : "Selamat datang"}
            </button>
          </>
        )}

        <p className="mt-4 text-center text-[10.5px] text-white/35">
          Aplikasi berlisensi &middot; {brand.vendor.name}
        </p>
      </motion.div>
    </div>
  );
}
