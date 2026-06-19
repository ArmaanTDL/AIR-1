import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Pencil, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { containerVariants, cardVariants } from "../components/ui/AnimatedCard";

const EMPTY = {
  sku: "",
  name: "",
  category: "Electronics",
  unit_price: "",
  supplier_id: "",
  low_stock_threshold: 10,
};
const CATEGORIES = ["Electronics", "Apparel", "Food & Beverage", "Automotive", "Pharmaceuticals"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, s] = await Promise.all([
      client.get("/products"),
      client.get("/suppliers"),
    ]);
    setProducts(p.data);
    setSuppliers(s.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      category: p.category || "Electronics",
      unit_price: p.unit_price,
      supplier_id: p.supplier_id || "",
      low_stock_threshold: p.low_stock_threshold,
    });
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      unit_price: parseFloat(form.unit_price),
      low_stock_threshold: parseInt(form.low_stock_threshold, 10),
      supplier_id: form.supplier_id ? parseInt(form.supplier_id, 10) : null,
    };
    try {
      if (editing) {
        await client.put(`/products/${editing.id}`, payload);
        toast.success("Product updated");
      } else {
        await client.post("/products", payload);
        toast.success("Product created");
      }
      setModalOpen(false);
      load();
    } catch {
      /* toasted */
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await client.delete(`/products/${deleteId}`);
      toast.success("Product deleted");
      load();
    } catch {
      /* toasted */
    }
  }

  const filtered = products.filter((p) =>
    `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} SKUs in catalog`}
        icon={Package}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            <Plus size={18} /> Add Product
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1" style={{ maxWidth: 360 }}>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="!pl-9"
          />
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
              {filtered.map((p) => (
                <motion.tr
                  key={p.id}
                  variants={cardVariants}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="px-4 py-3 font-mono text-xs text-cyan">{p.sku}</td>
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-slate-300">{p.category}</td>
                  <td className="px-4 py-3 text-slate-400">{p.supplier_name || "—"}</td>
                  <td className="px-4 py-3 text-right text-slate-200">
                    ₹{Number(p.unit_price).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">{p.low_stock_threshold}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-cyan/10 hover:text-cyan"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              )}
            </motion.tbody>
          </table>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "Add Product"}
      >
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>SKU</label>
              <input
                required
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>
            <div>
              <label>Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label>Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label>Unit Price (₹)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              />
            </div>
            <div>
              <label>Threshold</label>
              <input
                type="number"
                min="0"
                value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
              />
            </div>
            <div>
              <label>Supplier</label>
              <select
                value={form.supplier_id}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              >
                <option value="">— None —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-cyan to-violet px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save changes" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        message="Delete this product? Its inventory and alerts will also be removed."
      />
    </div>
  );
}
