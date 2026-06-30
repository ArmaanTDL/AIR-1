const STYLES = {
  HEALTHY: "bg-emerald/15 text-emerald border-emerald/30",
  WARNING: "bg-amber/15 text-amber border-amber/30",
  CRITICAL: "bg-danger/15 text-danger border-danger/40",
  SUCCESS: "bg-emerald/15 text-emerald border-emerald/30",
  COMPLETED: "bg-emerald/15 text-emerald border-emerald/30",
  PENDING: "bg-amber/15 text-amber border-amber/30",
  PROCESSING: "bg-cyan/15 text-cyan border-cyan/30",
  FAILED: "bg-danger/15 text-danger border-danger/40",
  ROLLED_BACK: "bg-danger/15 text-danger border-danger/40",
  ACTIVE: "bg-danger/15 text-danger border-danger/40",
  RESOLVED: "bg-emerald/15 text-emerald border-emerald/30",
  ACKNOWLEDGED: "bg-cyan/15 text-cyan border-cyan/30",
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || "bg-white/10 text-slate-300 border-white/15";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {(status === "CRITICAL" || status === "ACTIVE") && (
        <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulseDot" />
      )}
      {status}
    </span>
  );
}
