import { AnimatePresence, motion } from "framer-motion";
import { Lock, Zap, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

const STEPS = [
  { key: "lock", label: "Acquiring row locks (SELECT … FOR UPDATE)", icon: Lock },
  { key: "exec", label: "Executing batch updates", icon: Zap },
  { key: "commit", label: "Committing transaction", icon: CheckCircle2 },
];

// phase: 'lock' | 'exec' | 'commit' | 'done' | 'rollback'
export default function TransactionOverlay({ open, phase, result, error, onClose }) {
  const order = ["lock", "exec", "commit", "done"];
  const idx = order.indexOf(phase === "rollback" ? "exec" : phase);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="glass relative z-10 w-full max-w-md rounded-2xl p-7"
          >
            <h3 className="mb-1 text-lg font-bold text-white">ACID Batch Transaction</h3>
            <p className="mb-5 text-xs text-slate-400">
              All-or-nothing · row-level pessimistic locking
            </p>

            <div className="space-y-3">
              {STEPS.map((step, i) => {
                const done = idx > i || phase === "done";
                const active = idx === i && phase !== "done" && phase !== "rollback";
                const failedHere = phase === "rollback" && i >= 1;
                return (
                  <div
                    key={step.key}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                      failedHere
                        ? "border-danger/30 bg-danger/5"
                        : done
                        ? "border-emerald/30 bg-emerald/5"
                        : active
                        ? "border-cyan/40 bg-cyan/5"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <div
                      className={
                        failedHere
                          ? "text-danger"
                          : done
                          ? "text-emerald"
                          : active
                          ? "text-cyan"
                          : "text-slate-500"
                      }
                    >
                      {active ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : failedHere ? (
                        <AlertTriangle size={18} />
                      ) : (
                        <step.icon size={18} />
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        done || active ? "text-white" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <AnimatePresence>
              {phase === "done" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl border border-emerald/30 bg-emerald/10 p-3 text-sm text-emerald"
                >
                  ✅ Committed — {result?.updated?.length} rows updated in{" "}
                  {result?.duration_ms} ms
                </motion.div>
              )}
              {phase === "rollback" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger"
                >
                  ⚠️ Rolled back — no changes persisted.
                  <div className="mt-1 text-xs text-danger/80">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {(phase === "done" || phase === "rollback") && (
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Close
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
