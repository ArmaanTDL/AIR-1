import { AlertTriangle } from "lucide-react";
import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message }) {
  return (
    <Modal open={open} onClose={onClose} title={title || "Confirm delete"} width="max-w-md">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-danger/15 p-2 text-danger">
          <AlertTriangle size={20} />
        </div>
        <p className="text-sm text-slate-300">
          {message || "This action cannot be undone."}
        </p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white hover:bg-danger/80"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}
