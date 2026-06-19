import { motion } from "framer-motion";
import { Bell, LogOut, Search } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";

export default function TopBar({ alertCount = 0 }) {
  const { username, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass sticky top-0 z-30 mb-6 flex items-center gap-4 rounded-2xl px-5 py-3"
    >
      <div className="relative hidden flex-1 items-center sm:flex">
        <Search size={16} className="absolute left-3 text-slate-500" />
        <input
          placeholder="Search products, orders, SKUs…"
          className="!pl-9"
          style={{ maxWidth: 420 }}
        />
      </div>
      <div className="flex-1 sm:hidden" />

      <div className="relative">
        <Bell size={20} className="text-slate-300" />
        {alertCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {alertCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-semibold text-white">{username || "admin"}</div>
          <div className="text-[11px] text-slate-400">Operations</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet to-cyan text-sm font-bold text-white">
          {(username || "A").charAt(0).toUpperCase()}
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          title="Log out"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-danger"
        >
          <LogOut size={18} />
        </button>
      </div>
    </motion.header>
  );
}
