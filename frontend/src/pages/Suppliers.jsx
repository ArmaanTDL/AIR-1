import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Handshake, Plus, Pencil, Trash2, Star, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";
import client from "../api/client";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { containerVariants, cardVariants } from "../components/ui/AnimatedCard";

const EMPTY = { name: "", contact_email: "", contact_phone: "", reliability_score: 5 };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await client.get("/suppliers");
    setSuppliers(data);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setModalOpen(true);
  }
  function openEdit(s) {
    setEditing(s);
    setForm({
      name: s.name,
      contact_email: s.contact_email || "",
      contact_phone: s.contact_phone || "",
      reliability_score: s.reliability_score,
    });
    setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      reliability_score: parseFloat(form.reliability_score),
      contact_email: form.contact_email || null,
    };
    try {
      if (editing) {
        await client.put(`/suppliers/${editing.id}`, payload);
        toast.success("Supplier updated");
      } else {
        await client.post("/suppliers", payload);
        toast.success("Supplier created");
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
      await client.delete(`/suppliers/${deleteId}`);
      toast.success("Supplier deleted");
      load();
    } catch {
      /* toasted */
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} partners`}
        icon={Handshake}
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-violet px-4 py-2.5 text-sm font-semibold text-white shadow-glow"
          >
            <Plus size={18} /> Add Supplier
          </button>
        }
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {suppliers.map((s) => (
          <motion.div
            key={s.id}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-white">{s.name}</h3>
              <span className="flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-xs font-semibold text-amber">
                <Star size={12} fill="currentColor" /> {Number(s.reliability_score).toFixed(1)}
              </span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Mail size={14} /> {s.contact_email || "—"}
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} /> {s.contact_phone || "—"}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-1">
              <button
                onClick={() => openEdit(s)}
                className="rounded-lg p-2 text-slate-400 hover:bg-cyan/10 hover:text-cyan"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => setDeleteId(s.id)}
                className="rounded-lg p-2 text-slate-400 hover:bg-danger/10 hover:text-danger"
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
        title={editing ? "Edit Supplier" : "Add Supplier"}
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
              <label>Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label>Reliability score (0–10)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.reliability_score}
              onChange={(e) => setForm({ ...form, reliability_score: e.target.value })}
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
        message="Delete this supplier? Linked products will keep their data but lose the supplier link."
      />
    </div>
  );
}
