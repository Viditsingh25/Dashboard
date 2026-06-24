import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, destructive }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-full p-2 ${destructive !== false ? "bg-red-50" : "bg-green-50"}`}>
            <AlertTriangle size={22} className={destructive !== false ? "text-red-500" : "text-green-600"} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title || "Confirm"}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message || "Are you sure?"}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
            {cancelLabel || "Cancel"}
          </button>
          <button onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
              destructive !== false ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
            }`}>
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
