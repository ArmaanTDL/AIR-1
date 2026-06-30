import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function StockLevelChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="stockFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.6} />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="region" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip
          contentStyle={{
            background: "rgba(16,22,42,0.95)",
            border: "1px solid rgba(0,212,255,0.3)",
            borderRadius: 12,
            color: "#e6edf6",
          }}
        />
        <Area
          type="monotone"
          dataKey="units"
          stroke="#00D4FF"
          strokeWidth={2}
          fill="url(#stockFill)"
          animationDuration={1200}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
