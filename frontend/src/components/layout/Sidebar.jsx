import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Factory,
  ClipboardList,
  ShoppingCart,
  Handshake,
  Siren,
  Repeat,
  Boxes,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/warehouses", label: "Warehouses", icon: Factory },
  { to: "/inventory", label: "Inventory", icon: ClipboardList, badge: "inventory" },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/suppliers", label: "Suppliers", icon: Handshake },
  { to: "/alerts", label: "Alerts", icon: Siren, badge: "alerts" },
  { to: "/transactions", label: "Transaction Log", icon: Repeat },
];

export default function Sidebar({ alertCount = 0 }) {
  return (
    <aside className="glass sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-5 md:flex">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan to-violet shadow-glow">
          <Boxes size={20} className="text-white" />
        </div>
        <div>
          <div className="gradient-text text-lg font-extrabold leading-none">TRACK</div>
          <div className="text-[10px] tracking-[0.3em] text-slate-400">OS</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30, delay: i * 0.03 }}
          >
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-cyan/20 to-violet/20 text-white shadow-glow"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.badge && alertCount > 0 && (
                <span className="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold text-white animate-pulseDot">
                  {alertCount}
                </span>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4 text-[11px] text-slate-500">
        ADBMS Showcase · ACID · Triggers · Partitioning
      </div>
    </aside>
  );
}
