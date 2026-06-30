import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Factory, Plus, Pencil, Trash2, MapPin, Database } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { containerVariants, cardVariants } from "../components/ui/AnimatedCard";

const REGIONS = ["NORTH", "SOUTH", "EAST", "WEST", "CENTRAL"];
const EMPTY = { name: "", region: "NORTH", location: "", capacity: 10000 };

const REGION_COLOR = {
  NORTH: "from-cyan/20 to-cyan/5 text-cyan",
  SOUTH: "from-violet/20 to-violet/5 text-violet",
  EAST: "from-emerald/20 to-emerald/5 text-emerald",
  WEST: "from-amber/20 to-amber/5 text-amber",
  CENTRAL: "from-danger/20 to-danger/5 text-danger",
};

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await client.get("/warehouses");
    setWarehouses(data);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }
  function openEdit(w) {
    setEditing(w);
    setForm({ name: w.name, region: w.region, location: w.location || "", capacity: w.capacity });
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        // region is the partition key — not editable in place
        const { region, ...rest } = form;
        await client.put(`/warehouses/${editing.id}`, { ...rest, capacity: parseInt(form.capacity, 10) });
        toast.success("Warehouse updated");
      } else {
        await client.post("/warehouses", { ...form, capacity: parseInt(form.capacity, 10) });
        toast.success("Warehouse created");
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
      await client.delete(`/warehouses/${deleteId}`);
      toast.success("Warehouse deleted");
      load();
    } catch {
      /* toasted */
    }
  }

  return (
    <div>
      <PageHeader
        title="Warehouses"
        subtitle="LIST-partitioned by region — each card shows its physical partition"
        icon={Factory}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            <Plus size={18} /> Add Warehouse
          </button>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {warehouses.map((w) => (
          <motion.div
            key={`${w.id}-${w.region}`}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className={`glass relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 ${REGION_COLOR[w.region] || ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white">{w.name}</h3>
                <span className="text-xs font-bold uppercase tracking-wider">{w.region}</span>
              </div>
              <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold text-white">
                #{w.id}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={14} /> {w.location || "—"}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              Capacity: {Number(w.capacity).toLocaleString("en-IN")} units
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-mono text-slate-300">
              <Database size={12} /> partition: {w.partition}
            </div>
            <div className="mt-3 flex justify-end gap-1">
              <button
                onClick={() => openEdit(w)}
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteId(w.id)}
                className="rounded-lg p-2 text-slate-300 hover:bg-danger/20 hover:text-danger"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Warehouse" : "Add Warehouse"}
      >
        <form onSubmit={save} className="space-y-3">
          <div>
            <label>Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label>Region {editing && "(fixed — partition key)"}</label>
              <select
                disabled={!!editing}
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              >
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Capacity</label>
              <input
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label>Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
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
              {saving ? "Saving…" : editing ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteId != null}
        onClose={() => setDeleteId(null)}
        onConfirm={remove}
        message="Delete this warehouse? Make sure no inventory references it."
      />
    </div>
  );
}
