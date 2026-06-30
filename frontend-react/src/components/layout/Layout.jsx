import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useAlerts } from "../../hooks/useAlerts";

export default function Layout() {
  const { count } = useAlerts();
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      <Sidebar alertCount={count} />
      <main className="flex-1 px-4 py-4 md:px-8">
        <TopBar alertCount={count} />
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.995 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
