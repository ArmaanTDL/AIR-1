import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Plus, Play, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";

const COLUMNS = ["PENDING", "PROCESSING", "COMPLETED", "FAILED"];
const COL_COLOR = {
  PENDING: "border-amber/30",
  PROCESSING: "border-cyan/30",
  COMPLETED: "border-emerald/30",
  FAILED: "border-danger/30",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState([{ product_id: "", warehouse_id: "", quantity: 1 }]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    const { data } = await client.get("/orders");
    setOrders(data);
  }, []);

  useEffect(() => {
    load();
    client.get("/products").then((r) => setProducts(r.data));
    client.get("/warehouses").then((r) => setWarehouses(r.data));
  }, [load]);

  async function fulfill(id) {
    setBusy(id);
    try {
      await client.post(`/orders/${id}/fulfill`);
      toast.success("Order fulfilled — stock decremented atomically");
      load();
    } catch {
      toast.error("Fulfillment rolled back — see Transaction Log");
      load();
    } finally {
      setBusy(null);
    }
  }

  async function remove(id) {
    try {
      await client.delete(`/orders/${id}`);
      toast.success("Order deleted");
      load();
    } catch {
      /* toasted */
    }
  }

  async function createOrder(e) {
    e.preventDefault();
    const payload = {
      notes: notes || null,
      items: items
        .filter((i) => i.product_id && i.warehouse_id)
        .map((i) => ({
          product_id: parseInt(i.product_id, 10),
          warehouse_id: parseInt(i.warehouse_id, 10),
          quantity: parseInt(i.quantity, 10),
        })),
    };
    if (!payload.items.length) return toast.error("Add at least one item");
    try {
      await client.post("/orders", payload);
      toast.success("Order created");
      setModalOpen(false);
      setItems([{ product_id: "", warehouse_id: "", quantity: 1 }]);
      setNotes("");
      load();
    } catch {
      /* toasted */
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Fulfillment runs as an ACID transaction with rollback"
        icon={ShoppingCart}
        action={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            <Plus size={18} /> New Order
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const colOrders = orders.filter((o) => o.status === col);
          return (
            <div key={col} className={`glass rounded-2xl border-t-2 p-4 ${COL_COLOR[col]}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wide text-white">{col}</h3>
                <span className="rounded-full bg-white/10 px-2 text-xs text-slate-300">
                  {colOrders.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <AnimatePresence>
                  {colOrders.map((o) => (
                    <motion.div
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="rounded-xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-cyan">{o.order_number}</span>
                        <button
                          onClick={() => remove(o.id)}
                          className="text-slate-500 hover:text-danger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-white">
                        ₹{Number(o.total_amount || 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {o.items.length} item(s) · {new Date(o.created_at).toLocaleDateString()}
                      </div>
                      {(col === "PENDING" || col === "FAILED") && (
                        <button
                          onClick={() => fulfill(o.id)}
                          disabled={busy === o.id}
                          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald/80 to-emerald py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          <Play size={13} /> {busy === o.id ? "Processing…" : "Fulfill"}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {colOrders.length === 0 && (
                  <p className="py-6 text-center text-xs text-slate-600">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Order" width="max-w-2xl">
        <form onSubmit={createOrder} className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <div className="col-span-5">
                {i === 0 && <label>Product</label>}
                <select
                  value={it.product_id}
                  onChange={(e) =>
                    setItems(items.map((x, j) => (j === i ? { ...x, product_id: e.target.value } : x)))
                  }
                >
                  <option value="">— product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-4">
                {i === 0 && <label>Warehouse</label>}
                <select
                  value={it.warehouse_id}
                  onChange={(e) =>
                    setItems(items.map((x, j) => (j === i ? { ...x, warehouse_id: e.target.value } : x)))
                  }
                >
                  <option value="">— warehouse —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                {i === 0 && <label>Qty</label>}
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) =>
                    setItems(items.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))
                  }
                />
              </div>
              <div className="col-span-1 flex items-end">
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="rounded-lg p-2 text-slate-400 hover:text-danger"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems([...items, { product_id: "", warehouse_id: "", quantity: 1 }])}
            className="text-xs text-cyan hover:underline"
          >
            + Add line item
          </button>
          <div>
            <label>Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button className="rounded-lg bg-gradient-to-r from-cyan to-violet px-4 py-2 text-sm font-semibold text-white">
              Create Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
