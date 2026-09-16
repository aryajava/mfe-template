import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { XCircle, X, ArrowRight, AlertTriangle } from 'lucide-react';
import { Button, LoadingSpinner } from '@template/shared';
import { DiscountApprovalItem } from '../../types/discount';

interface RejectModalProps {
  item: DiscountApprovalItem | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (id: number, reason: string, version: number) => Promise<void>;
}

export const RejectModal: React.FC<RejectModalProps> = ({
  item,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError('Alasan penolakan diskon wajib diisi.');
      return;
    }
    setValidationError(null);
    await onConfirm(item.id, reason.trim(), item.version);
    setReason('');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Tolak Permintaan Diskon
              </h2>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">
                {item.productTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Tutup dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Summary Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Pengaju Diskon:</span>
              <span className="font-semibold text-slate-900">{item.requestedBy}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="text-slate-500 font-medium">Perubahan yang Ditolak:</span>
              <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                <span className="text-slate-400 line-through">
                  {item.oldValue ? `${item.oldValue}%` : '0%'}
                </span>
                <ArrowRight className="h-3 w-3 text-slate-300" />
                <span className="font-bold text-rose-600 bg-rose-50 border border-rose-200/60 px-2 py-0.5 rounded-md">
                  {item.newValue}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Produk akan tetap mempertahankan diskon aktif saat ini ({item.oldValue || 0}%).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Alasan Penolakan <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                {reason.length} karakter
              </span>
            </div>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Jelaskan alasan penolakan untuk catatan staf pengaju..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
              autoFocus
            />
            {validationError && (
              <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 shrink-0" />
                <span>{validationError}</span>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs h-9 px-4 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs h-9 px-4 cursor-pointer shadow-2xs"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <LoadingSpinner size="sm" />
                  <span>Menolak...</span>
                </span>
              ) : (
                'Konfirmasi Penolakan'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

