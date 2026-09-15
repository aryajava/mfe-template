import React, { useState } from 'react';
import { XCircle, X } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Tolak Permintaan Diskon
              </h2>
              <p className="text-xs text-slate-500">
                {item.productTitle}
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
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p>
              Pengajuan diskon sebesar <span className="font-semibold text-slate-900">{item.newValue}%</span> oleh <span className="font-semibold text-slate-900">{item.requestedBy}</span> akan ditolak.
            </p>
            <p className="text-[11px] text-slate-400">
              Produk akan tetap menggunakan diskon lama ({item.oldValue}%).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Alasan Penolakan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Berikan catatan alasan penolakan untuk pengaju..."
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
                  <span>Menolak...</span>
                </span>
              ) : (
                'Konfirmasi Tolak'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
