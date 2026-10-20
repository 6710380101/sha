import React, { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  variant = 'danger',
  onClose,
  onConfirm,
}) => {
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                variant === 'danger'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white rounded-lg transition-colors cursor-pointer ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-700 hover:bg-amber-800'
            }`}
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
