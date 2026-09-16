import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  Eye,
  Package,
  Truck,
  XCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  LoadingSpinner,
  useLoading,
  useAuth,
  useEventBus,
  useEventSubscription,
  MFE_EVENTS,
} from '@template/shared';
import { orderApi, OrderQueryParams } from '../../services/orderApi';
import {
  OrderSummary,
  OrderDetail,
  formatRupiah,
  getOrderStatusBadge,
  OrderStatus,
} from '../../types/pesanan';
import { DetailModal } from './DetailModal';
import { BatalModal } from './BatalModal';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'Semua', value: '' },
  { label: 'Menunggu Konfirmasi', value: 'MENUNGGU_KONFIRMASI' },
  { label: 'Dikemas', value: 'DIKEMAS' },
  { label: 'Dikirim', value: 'DIKIRIM' },
  { label: 'Diterima', value: 'DITERIMA' },
  { label: 'Dibatalkan', value: 'DIBATALKAN' },
];

export const PesananIndex: React.FC = () => {
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { canPerformAction } = useAuth();

  const canUpdate = canPerformAction('pesanan', 'update');

  // Query state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState('CreatedAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Data state
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [detailOrder, setDetailOrder] = useState<OrderDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [batalOrder, setBatalOrder] = useState<OrderSummary | null>(null);
  const [isBatalOpen, setIsBatalOpen] = useState(false);
  const [isBatalLoading, setIsBatalLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: OrderQueryParams = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        sortBy,
        sortDirection,
      };

      const res = await orderApi.getPaged(params);
      setOrders(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pesanan.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedStatus, sortBy, sortDirection]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Reaktif terhadap perubahan pesanan
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'order') {
      loadOrders();
    }
  });

  // Actions
  const handleOpenDetail = async (id: number) => {
    try {
      setIsDetailOpen(true);
      setIsDetailLoading(true);
      const detail = await orderApi.getById(id);
      setDetailOrder(detail);
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal memuat detail pesanan.',
      });
      setIsDetailOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handlePack = async (id: number) => {
    try {
      showLoading();
      await orderApi.pack(id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Pesanan #${id} berhasil dikemas.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'order', action: 'update', id });
      setIsDetailOpen(false);
      loadOrders();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal mengemas pesanan.',
      });
    } finally {
      hideLoading();
    }
  };

  const handleShip = async (id: number) => {
    try {
      showLoading();
      await orderApi.ship(id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Pesanan #${id} ditandai dikirim.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'order', action: 'update', id });
      setIsDetailOpen(false);
      loadOrders();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal menandai kirim pesanan.',
      });
    } finally {
      hideLoading();
    }
  };

  const handleOpenCancel = (order: OrderSummary) => {
    setBatalOrder(order);
    setIsBatalOpen(true);
  };

  const handleConfirmCancel = async (id: number, reason: string) => {
    try {
      setIsBatalLoading(true);
      await orderApi.cancel(id, reason);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Pesanan #${id} berhasil dibatalkan. Stok telah dikembalikan.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'order', action: 'cancel', id });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'product', action: 'update' });
      setIsBatalOpen(false);
      setIsDetailOpen(false);
      loadOrders();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal membatalkan pesanan.',
      });
    } finally {
      setIsBatalLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Package className="h-6 w-6" />
            </span>
            <span>Kelola Pesanan</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau dan proses transaksi belanja pelanggan secara langsung
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOrders}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Filter Status Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStatus(tab.value);
                setPage(1);
              }}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-xl transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-orange-600 text-orange-600 bg-orange-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar Pencarian & Info */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nomor pesanan, pembeli..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="text-xs text-slate-500 self-end sm:self-center">
            Total: <span className="font-semibold text-slate-800">{totalCount}</span> pesanan
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadOrders}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nomor Pesanan</th>
                <th className="py-3.5 px-4">Pelanggan</th>
                <th className="py-3.5 px-4">Ekspedisi</th>
                <th className="py-3.5 px-4 text-right">Total Tagihan</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Tanggal Pesan</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs">Memuat data pesanan...</p>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Package className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-700">Tidak ada pesanan ditemukan</p>
                      <p className="text-xs text-slate-400">
                        {searchTerm || selectedStatus
                          ? 'Coba sesuaikan kata kunci pencarian atau filter status.'
                          : 'Belum ada transaksi pesanan yang dibuat.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((ord, idx) => {
                  const badge = getOrderStatusBadge(ord.status);
                  const rowNumber = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(ord.id)}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                        #{ord.orderNumber || ord.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">
                          {ord.customerName || '-'}
                        </div>
                        <div className="text-[11px] text-slate-400">{ord.customerEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {ord.courierName || 'Ekspedisi'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(ord.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-600 hover:text-orange-600 hover:bg-orange-50"
                                onClick={() => handleOpenDetail(ord.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Lihat Detail</TooltipContent>
                          </Tooltip>

                          {canUpdate && ord.status === 'MENUNGGU_KONFIRMASI' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                  onClick={() => handlePack(ord.id)}
                                >
                                  <Package className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Kemas Pesanan</TooltipContent>
                            </Tooltip>
                          )}

                          {canUpdate && ord.status === 'DIKEMAS' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50"
                                  onClick={() => handleShip(ord.id)}
                                >
                                  <Truck className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Tandai Dikirim</TooltipContent>
                            </Tooltip>
                          )}

                          {canUpdate &&
                            (ord.status === 'MENUNGGU_KONFIRMASI' ||
                              ord.status === 'DIKEMAS') && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                                    onClick={() => handleOpenCancel(ord)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Batalkan Pesanan</TooltipContent>
                              </Tooltip>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Halaman <span className="font-semibold text-slate-800">{page}</span> dari{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DetailModal
        order={detailOrder}
        isOpen={isDetailOpen}
        isLoading={isDetailLoading}
        onClose={() => {
          setIsDetailOpen(false);
          setDetailOrder(null);
        }}
        onPack={handlePack}
        onShip={handleShip}
        onOpenCancel={handleOpenCancel}
        canUpdate={canUpdate}
      />

      <BatalModal
        order={batalOrder}
        isOpen={isBatalOpen}
        isLoading={isBatalLoading}
        onClose={() => {
          setIsBatalOpen(false);
          setBatalOrder(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default PesananIndex;
