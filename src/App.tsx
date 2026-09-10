import { useState } from "react";
import { Route, Routes } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import { AppShell } from "@/components/layout/AppShell";
import { LockScreen } from "@/components/layout/LockScreen";
import { Toaster } from "@/components/ui/toast";

import Dashboard from "@/pages/Dashboard";
import DataKaryawan from "@/pages/DataKaryawan";
import InputGaji from "@/pages/InputGaji";
import SlipGaji from "@/pages/SlipGaji";
import HutangKaryawan from "@/pages/HutangKaryawan";
import RekapHutang from "@/pages/RekapHutang";
import BackupLisensi from "@/pages/BackupLisensi";

const SESSION_KEY = "dmtech.payroll.unlocked";

export default function App() {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  const unlock = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setUnlocked(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div key="lock" exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="h-full">
            <LockScreen onUnlock={unlock} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="h-full"
          >
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="karyawan" element={<DataKaryawan />} />
                <Route path="input-gaji" element={<InputGaji />} />
                <Route path="slip-gaji" element={<SlipGaji />} />
                <Route path="hutang" element={<HutangKaryawan />} />
                <Route path="rekap-hutang" element={<RekapHutang />} />
                <Route path="backup-lisensi" element={<BackupLisensi />} />
              </Route>
            </Routes>
          </motion.div>
        )}
      </AnimatePresence>
      <Toaster />
    </>
  );
}
