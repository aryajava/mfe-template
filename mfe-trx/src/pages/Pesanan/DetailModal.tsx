import React from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Package,
  Calendar,
  User,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Button, LoadingSpinner } from '@template/shared';
import {
  OrderDetail,
  formatRupiah,
  getOrderStatusBadge,
} from '../../types/pesanan';

interface DetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onPack?: (id: number) => void;
  onShip?: (id: number) => void;
  onOpenCancel?: (order: OrderDetail) => void;
  canUpdate?: boolean;
}

export const DetailModal: React.FC<DetailModalProps> = ({
  order,
  isOpen,
  isLoading,
  onClose,
  onPack,
  onShip,
  onOpenCancel,
  canUpdate = false,
}) => {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const badge = order ? getOrderStatusBadge(order.status) : null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Detail Pesanan #{order?.orderNumber || order?.id || '-'}
              </h2>
              <p className="text-xs text-slate-500">
                Informasi lengkap transaksi dan riwayat pengiriman
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <LoadingSpinner size="lg" />
              <p className="text-sm">Memuat detail pesanan...</p>
            </div>
          ) : !order ? (
            <div className="py-8 text-center text-slate-500">
              Data pesanan tidak ditemukan.
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${badge?.className}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${badge?.dotColor}`} />
                    {badge?.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Alasan Batal jika status batal */}
              {order.status === 'DIBATALKAN' && order.batalReason && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/60 text-rose-800 text-xs flex gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Alasan Pembatalan:</span>{' '}
                    {order.batalReason}
                    {order.batalBy && (
                      <span className="block mt-0.5 text-rose-600/80">
                        Oleh: {order.batalBy}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Informasi Pelanggan & Pengiriman */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <div className="flex items-center gap-2 font-medium text-slate-800 mb-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Pelanggan</span>
                  </div>
                  <p className="font-semibold text-slate-900">{order.customerName || '-'}</p>
                  <p className="text-xs text-slate-500">{order.customerEmail || '-'}</p>
                  {order.shipPhone && (
                    <p className="text-xs text-slate-600 mt-1">Telp: {order.shipPhone}</p>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-slate-100 bg-white">
                  <div className="flex items-center gap-2 font-medium text-slate-800 mb-2">
                    <Truck className="h-4 w-4 text-slate-400" />
                    <span>Pengiriman</span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {order.courierName || 'Ekspedisi Standar'}
                  </p>
                  <p className="text-xs text-slate-600 flex items-start gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{order.shipAddress || 'Alamat tidak disertakan'}</span>
                  </p>
                  {order.note && (
                    <p className="text-xs text-slate-500 italic mt-2">
                      Catatan: "{order.note}"
                    </p>
                  )}
                </div>
              </div>

              {/* Daftar Barang */}
              <div>
                <h3 className="font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span>Item Pesanan ({order.items?.length || 0})</span>
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatRupiah(item.unitPrice)} x {item.quantity} unit
                          </p>
                        </div>
                        <div className="text-right font-semibold text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada detail item pesanan.
                    </div>
                  )}
                </div>
              </div>

              {/* Ringkasan Biaya */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Produk</span>
                  <span className="font-medium">{formatRupiah(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim</span>
                  <span className="font-medium">{formatRupiah(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Pajak</span>
                  <span className="font-medium">{formatRupiah(order.taxAmount)}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                  <span>Total Pembayaran</span>
                  <span className="text-orange-600">{formatRupiah(order.totalAmount)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>

          {canUpdate && order && (
            <div className="flex items-center gap-2">
              {(order.status === 'MENUNGGU_KONFIRMASI' || order.status === 'DIKEMAS') && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => onOpenCancel?.(order)}
                >
                  Batalkan Pesanan
                </Button>
              )}

              {order.status === 'MENUNGGU_KONFIRMASI' && (
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => onPack?.(order.id)}
                >
                  Kemas Pesanan
                </Button>
              )}

              {order.status === 'DIKEMAS' && (
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => onShip?.(order.id)}
                >
                  Tandai Dikirim
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
