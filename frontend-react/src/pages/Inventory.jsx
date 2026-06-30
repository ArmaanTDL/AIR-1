import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  Layers,
  Plus,
  Trash2,
  Zap,
  Beaker,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";
import Modal from "../components/ui/Modal";
import TransactionOverlay from "../components/modals/TransactionOverlay";
import { containerVariants, cardVariants } from "../components/ui/AnimatedCard";

const REGIONS = ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"];

const cellColor = (status) =>
  status === "CRITICAL"
    ? "text-danger font-bold animate-pulseDot"
    : status === "WARNING"
    ? "text-amber font-semibold"
    : "text-emerald font-semibold";

export default function Inventory() {
  const [warehouses, setWarehouses] = useState([]);
  const [activeWh, setActiveWh] = useState(null);
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);

  // batch drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [batch, setBatch] = useState([]); // {product_id, warehouse_id, name, delta}

  // transaction overlay
  const [txOpen, setTxOpen] = useState(false);
  const [phase, setPhase] = useState("lock");
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState("");

  // add inventory modal
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ product_id: "", quantity: 0 });

  const loadWarehouses = useCallback(async () => {
    const { data } = await client.get("/warehouses");
    setWarehouses(data);
    if (data.length && activeWh == null) setActiveWh(data[0].id);
  }, [activeWh]);

  const loadRows = useCallback(async () => {
    if (!activeWh) return;
    const { data } = await client.get(`/inventory/${activeWh}`);
    setRows(data);
  }, [activeWh]);

  useEffect(() => {
    loadWarehouses();
    client.get("/products").then((r) => setProducts(r.data));
  }, [loadWarehouses]);
  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const currentWh = useMemo(
    () => warehouses.find((w) => w.id === activeWh),
    [warehouses, activeWh]
  );

  function addToBatch(row) {
    if (batch.some((b) => b.product_id === row.product_id)) return;
    setBatch((b) => [
      ...b,
      {
        product_id: row.product_id,
        warehouse_id: row.warehouse_id,
        name: row.product_name,
        current: row.quantity,
        delta: -5,
      },
    ]);
    setDrawerOpen(true);
  }

  async function runBatch() {
    if (!batch.length) return;
    setDrawerOpen(false);
    setTxResult(null);
    setTxError("");
    setTxOpen(true);
    setPhase("lock");
    await wait(700);
    setPhase("exec");
    try {
      const { data } = await client.post("/inventory/batch-update", {
        updates: batch.map((b) => ({
          product_id: b.product_id,
          warehouse_id: b.warehouse_id,
          quantity_delta: parseInt(b.delta, 10),
        })),
      });
      await wait(600);
      setPhase("commit");
      await wait(500);
      setTxResult(data);
      setPhase("done");
      setBatch([]);
      loadRows();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setTxError(detail?.error || "Transaction failed");
      setPhase("rollback");
      loadRows();
    }
  }

  async function runConcurrentTest(row) {
    const t = toast.loading("Firing two concurrent transactions…");
    try {
      const { data } = await client.post("/inventory/demo/concurrent-test", null, {
        params: { product_id: row.product_id, warehouse_id: row.warehouse_id, delta: 3 },
      });
      toast.success(
        `Winner: TX-${data.winner}. The other waited ${
          Math.max(...data.results.map((r) => r.waited_ms))
        }ms for the lock.`,
        { id: t, duration: 6000 }
      );
      loadRows();
    } catch {
      toast.dismiss(t);
    }
  }

  async function addInventory(e) {
    e.preventDefault();
    try {
      await client.post("/inventory", {
        product_id: parseInt(addForm.product_id, 10),
        warehouse_id: activeWh,
        quantity: parseInt(addForm.quantity, 10),
      });
      toast.success("Inventory row added");
      setAddOpen(false);
      setAddForm({ product_id: "", quantity: 0 });
      loadRows();
    } catch {
      /* toasted */
    }
  }

  async function deleteRow(row) {
    try {
      await client.delete(`/inventory/${row.id}`, {
        params: { region: row.warehouse_region },
      });
      toast.success("Removed");
      loadRows();
    } catch {
      /* toasted */
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Per-warehouse stock · partitioned by region · live ACID updates"
        icon={ClipboardList}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
            >
              <Plus size={18} /> Add Stock Row
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              <Layers size={18} /> Batch Update {batch.length > 0 && `(${batch.length})`}
            </button>
          </div>
        }
      />

      {/* Warehouse tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {warehouses.map((w) => (
          <button
            key={w.id}
            onClick={() => setActiveWh(w.id)}
            className="relative rounded-xl px-4 py-2 text-sm font-medium transition"
            style={{ color: activeWh === w.id ? "#fff" : "#94a3b8" }}
          >
            {activeWh === w.id && (
              <motion.span
                layoutId="wh-pill"
                className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-cyan/20 to-violet/20 shadow-glow"
              />
            )}
            {w.name}
            <span className="ml-2 rounded bg-white/10 px-1.5 text-[10px]">{w.region}</span>
          </button>
        ))}
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
              {rows.map((r) => (
                <motion.tr
                  key={r.id}
                  variants={cardVariants}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-mono text-xs text-cyan">{r.sku}</td>
                  <td className="px-4 py-3 font-medium text-white">{r.product_name}</td>
                  <td className={`px-4 py-3 text-right ${cellColor(r.status)}`}>{r.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{r.threshold}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => addToBatch(r)}
                        title="Add to batch update"
                        className="rounded-lg p-2 text-slate-400 hover:bg-cyan/10 hover:text-cyan"
                      >
                        <Zap size={16} />
                      </button>
                      <button
                        onClick={() => runConcurrentTest(r)}
                        title="Run concurrency demo on this row"
                        className="rounded-lg p-2 text-slate-400 hover:bg-violet/10 hover:text-violet"
                      >
                        <Beaker size={16} />
                      </button>
                      <button
                        onClick={() => deleteRow(r)}
                        title="Delete row"
                        className="rounded-lg p-2 text-slate-400 hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No stock rows for this warehouse.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      {/* Batch drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 240 }}
              className="glass fixed right-0 top-0 z-50 flex h-screen w-full max-w-md flex-col p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Batch Stock Update</h3>
                <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="mb-4 text-xs text-slate-400">
                Applied atomically. Any invalid line (stock &lt; 0) rolls back the whole batch.
              </p>

              <div className="flex-1 space-y-3 overflow-y-auto">
                {batch.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Click the ⚡ icon on rows to stage them here.
                  </p>
                )}
                {batch.map((b, i) => (
                  <div key={b.product_id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{b.name}</span>
                      <button
                        onClick={() => setBatch(batch.filter((_, j) => j !== i))}
                        className="text-slate-400 hover:text-danger"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-slate-400">current {b.current} →</span>
                      <input
                        type="number"
                        value={b.delta}
                        onChange={(e) =>
                          setBatch(
                            batch.map((x, j) => (j === i ? { ...x, delta: e.target.value } : x))
                          )
                        }
                        className="w-24"
                      />
                      <span className="text-xs text-slate-400">
                        = {b.current + (parseInt(b.delta, 10) || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={runBatch}
                disabled={!batch.length}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet py-3 font-semibold text-white shadow-glow disabled:opacity-50"
              >
                <Zap size={18} /> Commit Transaction
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TransactionOverlay
        open={txOpen}
        phase={phase}
        result={txResult}
        error={txError}
        onClose={() => setTxOpen(false)}
      />

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Add Stock Row — ${currentWh?.name || ""}`}>
        <form onSubmit={addInventory} className="space-y-3">
          <div>
            <label>Product</label>
            <select
              required
              value={addForm.product_id}
              onChange={(e) => setAddForm({ ...addForm, product_id: e.target.value })}
            >
              <option value="">— Select product —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Initial quantity</label>
            <input
              type="number"
              min="0"
              value={addForm.quantity}
              onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button className="rounded-lg bg-gradient-to-r from-cyan to-violet px-4 py-2 text-sm font-semibold text-white">
              Add
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
