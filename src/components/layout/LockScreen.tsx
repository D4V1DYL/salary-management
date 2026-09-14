import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Fingerprint,
  ShieldCheck,
  LockKeyhole,
  Loader2,
  ShieldAlert,
  KeyRound,
  Clock,
  Copy,
  Check,
} from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { brand, appTitle } from "@/config/brand";
import { useLicense } from "@/data/license";
import { isUsable } from "@/lib/electron";

type Phase = "loading" | "idle" | "checking" | "ok";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const { status, refresh, activate } = useLicense();
  const [phase, setPhase] = useState<Phase>("loading");
  const [key, setKey] = useState("");
  const [keyError, setKeyError] = useState("");
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    refresh()
      .then((s) => {
        if (cancelled) return;
        setPhase(isUsable(s) ? "idle" : "loading"); // "loading" here just means: stay on the locked/activation screen
      })
      .catch(() => {
        if (!cancelled) setPhase("idle"); // fail-open rather than bricking the app
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    if (phase !== "checking") return;
    const t = setTimeout(() => setPhase("ok"), 1000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "ok") return;
    const t = setTimeout(onUnlock, 480);
    return () => clearTimeout(t);
  }, [phase, onUnlock]);

  const locked = status ? !isUsable(status) : false;
  const state = status?.state;
  const deviceCode = status?.fingerprint.short ?? "…";

  async function submitActivation() {
    setKeyError("");
    setActivating(true);
    try {
      const next = await activate(key);
      if (isUsable(next)) {
        setPhase("checking"); // success → run the unlock animation
      } else {
        setKeyError("Kode aktivasi tidak valid untuk perangkat ini.");
      }
    } catch (e) {
      setKeyError(e instanceof Error ? e.message : "Kode aktivasi tidak valid.");
    } finally {
      setActivating(false);
    }
  }

  function copyCode() {
    navigator.clipboard?.writeText(deviceCode).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {}
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0b1f33] text-white">
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: locked
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

        {locked ? (
          <>
            <div className="my-6 flex flex-col items-center text-center">
              <span className="grid size-16 place-items-center rounded-2xl border border-[#c02535]/40 bg-[#c02535]/10">
                <ShieldAlert className="size-7 text-[#ff6b6f]" />
              </span>
              <h1 className="mt-4 text-[17px] font-semibold">
                {state === "trial-expired" ? "Masa trial telah berakhir" : "Lisensi tidak aktif di perangkat ini"}
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
                {state === "trial-expired"
                  ? "Data kamu tetap aman dan tidak hilang. Masukkan kode aktivasi untuk melanjutkan memakai aplikasi."
                  : "Aplikasi ini terdaftar untuk komputer lain. Minta kode aktivasi baru untuk mengaktifkannya di sini."}
              </p>
            </div>

            {/* Device code — the user sends this to DM Tech to get a key */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/40">
                  Kode Perangkat
                </p>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1 text-[10.5px] font-medium text-white/50 transition-colors hover:text-white/80"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? "Tersalin" : "Salin"}
                </button>
              </div>
              <p className="break-all font-mono text-[12px] leading-relaxed text-[#8fd0f5]">{deviceCode}</p>
              <p className="mt-1.5 text-[10.5px] leading-snug text-white/35">
                Kirim kode ini ke {brand.vendor.name} untuk mendapatkan kode aktivasi.
              </p>
            </div>

            <div className="mt-3 space-y-2">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <input
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && key && submitActivation()}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  autoFocus
                  className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-3 font-mono text-[13.5px] uppercase tracking-wider text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-white/30 outline-none focus:border-white/30"
                />
              </div>
              {keyError && <p className="text-[12px] font-medium text-[#ff8a8e]">{keyError}</p>}
              <button
                onClick={submitActivation}
                disabled={activating || !key}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-[#0b1f33] transition-all hover:bg-white/90 active:translate-y-px disabled:opacity-60"
              >
                {activating ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                {activating ? "Memverifikasi…" : "Aktifkan Lisensi"}
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
                ) : state === "trial" ? (
                  <Clock className="size-7 text-[#f0c14b]" />
                ) : (
                  <Fingerprint className="size-7 text-white/80" />
                )}
              </motion.span>
              <h1 className="mt-4 text-[17px] font-semibold">
                {phase === "ok"
                  ? "Selamat datang"
                  : phase === "loading"
                    ? "Memeriksa lisensi…"
                    : state === "trial"
                      ? "Mode Trial"
                      : "Terkunci ke perangkat ini"}
              </h1>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
                {state === "trial"
                  ? `Kamu punya ${status?.daysLeft} hari tersisa dari masa trial ${status?.trialDays} hari. Semua fitur aktif.`
                  : "Aplikasi ini berlisensi penuh untuk komputer ini."}
              </p>
            </div>

            {state === "trial" && (
              <div className="mb-4 rounded-xl border border-[#f0c14b]/20 bg-[#f0c14b]/[0.06] px-3.5 py-2.5">
                <div className="mb-1.5 flex items-center justify-between text-[11.5px]">
                  <span className="font-medium text-[#f0d488]">Sisa masa trial</span>
                  <span className="tnum font-semibold text-[#f0d488]">
                    {status?.daysLeft} / {status?.trialDays} hari
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/25">
                  <div
                    className="h-full rounded-full bg-[#f0c14b] transition-[width] duration-500"
                    style={{ width: `${((status?.daysLeft ?? 0) / (status?.trialDays || 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setPhase("checking")}
              disabled={phase !== "idle"}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-[#0b1f33] transition-all hover:bg-white/90 active:translate-y-px disabled:opacity-70"
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

        <p className="mt-4 text-center text-[10.5px] text-white/35">Aplikasi berlisensi &middot; {brand.vendor.name}</p>
      </motion.div>
    </div>
  );
}
