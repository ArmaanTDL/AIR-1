import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Repeat, CheckCircle2, XCircle, Clock, ChevronDown } from "lucide-react";
import client from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import { containerVariants, cardVariants } from "../components/ui/AnimatedCard";

export default function TransactionLog() {
  const [logs, setLogs] = useState([]);
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    const { data } = await client.get("/analytics/transaction-log", {
      params: { type: type || undefined, status: status || undefined },
    });
    setLogs(data);
  }, [type, status]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const committed = logs.filter((l) => l.status === "SUCCESS").length;
  const rolledBack = logs.filter((l) => l.status === "ROLLED_BACK").length;

  return (
    <div>
      <PageHeader
        title="Transaction Log"
        subtitle="Proof of ACID: every commit and rollback recorded with timing"
        icon={Repeat}
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total" value={logs.length} color="text-white" />
        <Stat label="Committed" value={committed} color="text-emerald" />
        <Stat label="Rolled Back" value={rolledBack} color="text-danger" />
        <Stat
          label="Avg Duration"
          value={`${Math.round(
            logs.reduce((a, l) => a + (l.duration_ms || 0), 0) / (logs.length || 1)
          )} ms`}
          color="text-cyan"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ maxWidth: 220 }}>
          <option value="">All types</option>
          <option value="BATCH_UPDATE">BATCH_UPDATE</option>
          <option value="ORDER_FULFILLMENT">ORDER_FULFILLMENT</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="">All statuses</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="ROLLED_BACK">ROLLED_BACK</option>
        </select>
      </div>

      {/* Timeline */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative space-y-3 before:absolute before:left-4 before:top-2 before:h-full before:w-px before:bg-white/10"
      >
        {logs.map((l) => {
          const ok = l.status === "SUCCESS";
          const open = expanded === l.id;
          return (
            <motion.div key={l.id} variants={cardVariants} className="relative pl-12">
              <div
                className={`absolute left-1.5 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  ok ? "border-emerald bg-emerald/20 text-emerald" : "border-danger bg-danger/20 text-danger"
                }`}
              >
                {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              </div>
              <div
                className={`glass cursor-pointer rounded-xl p-4 ${
                  l.error_message ? "hover:border-danger/40" : ""
                }`}
                onClick={() => l.error_message && setExpanded(open ? null : l.id)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-white">
                      {l.transaction_type}
                    </span>
                    <StatusBadge status={l.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{l.affected_records} rows</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {l.duration_ms} ms
                    </span>
                    <span>{new Date(l.executed_at).toLocaleString()}</span>
                    {l.error_message && (
                      <ChevronDown
                        size={14}
                        className={`transition ${open ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                </div>
                {open && l.error_message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger"
                  >
                    <span className="font-semibold">Rollback cause:</span> {l.error_message}
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
        {logs.length === 0 && (
          <p className="py-12 text-center text-slate-500">
            No transactions yet. Run a batch update or fulfill an order to populate this proof log.
          </p>
        )}
      </motion.div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
