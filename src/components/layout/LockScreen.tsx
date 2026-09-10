import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, ShieldCheck, LockKeyhole, Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { brand, appTitle } from "@/config/brand";
import { getDeviceFingerprint } from "@/lib/device";

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const fp = getDeviceFingerprint();
  const [phase, setPhase] = useState<"idle" | "checking" | "ok">("idle");

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

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0b1f33] text-white">
      {/* backdrop */}
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(120% 80% at 50% -10%, rgba(49,114,166,0.45), transparent 60%), radial-gradient(90% 60% at 100% 110%, rgba(18,185,129,0.16), transparent 55%)",
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

        <div className="my-6 flex flex-col items-center text-center">
          <motion.span
            className="grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]"
            animate={
              phase === "checking"
                ? { boxShadow: ["0 0 0 0 rgba(18,185,129,0)", "0 0 0 10px rgba(18,185,129,0.14)", "0 0 0 0 rgba(18,185,129,0)"] }
                : {}
            }
            transition={{ repeat: phase === "checking" ? Infinity : 0, duration: 1.4 }}
          >
            {phase === "ok" ? (
              <ShieldCheck className="size-7 text-[#34d399]" />
            ) : phase === "checking" ? (
              <Loader2 className="size-7 animate-spin text-white/80" />
            ) : (
              <Fingerprint className="size-7 text-white/80" />
            )}
          </motion.span>
          <h1 className="mt-4 text-[17px] font-semibold">
            {phase === "ok" ? "Perangkat terverifikasi" : "Terkunci ke perangkat ini"}
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">
            Database <span className="font-mono text-white/70">payroll.db.enc</span> terikat kriptografis
            ke Volume Serial &amp; Machine GUID komputer ini. Menyalin file ke perangkat lain membuatnya
            tidak bisa dibuka.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/40">
            Device fingerprint (SHA-256)
          </p>
          <p className="break-all font-mono text-[11.5px] leading-relaxed text-[#8fd0f5]">
            {fp.short}
          </p>
        </div>

        <button
          onClick={() => setPhase("checking")}
          disabled={phase !== "idle"}
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-[#0b1f33] transition-all hover:bg-white/90 active:translate-y-px disabled:opacity-70"
        >
          <LockKeyhole className="size-4" />
          {phase === "idle" ? "Buka Aplikasi" : phase === "checking" ? "Memverifikasi…" : "Selamat datang"}
        </button>

        <p className="mt-4 text-center text-[10.5px] text-white/35">
          Dilindungi SQLCipher &middot; Argon2id key derivation &middot; {brand.vendor.name}
        </p>
      </motion.div>
    </div>
  );
}
