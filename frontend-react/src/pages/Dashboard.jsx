import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  Wallet,
  Siren,
  ShoppingCart,
  TrendingUp,
  Boxes,
} from "lucide-react";
import client from "../api/client";
import AnimatedCard, {
  cardVariants,
  containerVariants,
} from "../components/ui/AnimatedCard";
import MetricBadge from "../components/ui/MetricBadge";
import StatusBadge from "../components/ui/StatusBadge";
import StockLevelChart from "../components/charts/StockLevelChart";
import RegionDonut from "../components/charts/RegionDonut";
import { useAlerts } from "../hooks/useAlerts";

function Metric({ icon: Icon, label, value, prefix, decimals, accent }) {
  return (
    <AnimatedCard className="relative overflow-hidden">
      <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${accent} opacity-20 blur-2xl`} />
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon size={18} className="text-cyan" />
      </div>
      <div className="mt-3 text-3xl font-extrabold text-white">
        <MetricBadge value={value} prefix={prefix} decimals={decimals} />
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-emerald">
        <TrendingUp size={14} /> live
      </div>
    </AnimatedCard>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [levels, setLevels] = useState({ by_region: [], by_category: [] });
  const { alerts } = useAlerts();

  useEffect(() => {
    client.get("/analytics/dashboard").then((r) => setStats(r.data));
    client.get("/analytics/stock-levels").then((r) => setLevels(r.data));
  }, []);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={cardVariants} className="mb-6 flex items-center gap-3">
        <Boxes className="text-cyan" />
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-slate-400">
            Real-time view across all regional partitions
          </p>
        </div>
      </motion.div>

      {/* Metric row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Package} label="Total Products" value={stats?.total_products || 0} accent="bg-cyan" />
        <Metric
          icon={Wallet}
          label="Stock Value"
          value={stats?.total_stock_value || 0}
          prefix="₹"
          decimals={0}
          accent="bg-violet"
        />
        <Metric icon={Siren} label="Active Alerts" value={stats?.active_alerts || 0} accent="bg-danger" />
        <Metric icon={ShoppingCart} label="Orders Today" value={stats?.orders_today || 0} accent="bg-emerald" />
      </div>

      {/* Charts row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AnimatedCard className="lg:col-span-2" hover={false}>
          <h3 className="mb-4 font-semibold text-white">Stock Units by Region</h3>
          <StockLevelChart data={levels.by_region} />
        </AnimatedCard>
        <AnimatedCard hover={false}>
          <h3 className="mb-4 font-semibold text-white">Distribution by Region</h3>
          <RegionDonut data={levels.by_region} />
        </AnimatedCard>
      </div>

      {/* Alerts + category row */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AnimatedCard className="lg:col-span-2" hover={false}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-white">Stock by Category</h3>
          </div>
          <RegionDonut data={levels.by_category} nameKey="category" />
        </AnimatedCard>

        <AnimatedCard hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-danger animate-pulseDot" />
            <h3 className="font-semibold text-white">Live Low-Stock Feed</h3>
          </div>
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
            {alerts.length === 0 && (
              <p className="text-sm text-slate-500">No active alerts. All healthy ✨</p>
            )}
            {alerts.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-xl border border-danger/20 bg-danger/5 px-3 py-2"
              >
                <div>
                  <div className="text-sm font-medium text-white">{a.product_name}</div>
                  <div className="text-[11px] text-slate-400">
                    {a.warehouse_region} · qty {a.current_quantity}/{a.threshold}
                  </div>
                </div>
                <StatusBadge status="CRITICAL" />
              </motion.div>
            ))}
          </div>
        </AnimatedCard>
      </div>
    </motion.div>
  );
}
