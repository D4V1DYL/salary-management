import { useLocation, useOutlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="flex h-full w-full overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="scrollbar-thin relative flex-1 overflow-y-auto bg-bg bg-app-grid">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto w-full max-w-[1180px] px-6 py-7"
          >
            {outlet}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
