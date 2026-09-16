import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { Button, Input, LoadingSpinner } from '@template/shared';
import { OrderSummary } from '../../types/pesanan';

interface BatalModalProps {
  order: OrderSummary | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (id: number, reason: string) => Promise<void>;
}

export const BatalModal: React.FC<BatalModalProps> = ({
  order,
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !order) return null;
  if (typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError('Alasan pembatalan wajib diisi.');
      return;
    }
    setValidationError(null);
    await onConfirm(order.id, reason.trim());
    setReason('');
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Batalkan Pesanan
              </h2>
              <p className="text-xs text-slate-500">
                #{order.orderNumber || order.id}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <p>
              Pembatalan pesanan akan mengembalikan stok produk ke basis data secara otomatis dan memulihkan status ketersediaan di toko.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alasan Pembatalan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Contoh: Stok rusak saat pengemasan / Permintaan pembeli..."
              className="w-full text-xs rounded-xl border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
              autoFocus
            />
            {validationError && (
              <p className="text-xs text-rose-600 mt-1">{validationError}</p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Kembali
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <LoadingSpinner size="sm" />
                  <span>Membatalkan...</span>
                </span>
              ) : (
                'Konfirmasi Batalkan'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
