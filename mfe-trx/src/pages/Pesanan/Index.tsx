import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  RotateCcw,
  Eye,
  Package,
  Truck,
  XCircle,
  X,
  ArrowUpDown,
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
  SearchNotification,
  DataTable,
  type DataTableColumn,
  type PaginationConfig,
  type SortConfig,
  useLoading,
  useAuth,
  useEventBus,
  useEventSubscription,
  MFE_EVENTS,
  cn,
} from '@template/shared';
import { orderApi, OrderQueryParams } from '../../services/orderApi';
import {
  OrderSummary,
  OrderDetail,
  formatRupiah,
  getOrderStatusBadge,
} from '../../types/pesanan';
import { DetailModal } from './DetailModal';
import { BatalModal } from './BatalModal';

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu Konfirmasi', value: 'MENUNGGU_KONFIRMASI' },
  { label: 'Dikemas', value: 'DIKEMAS' },
  { label: 'Dikirim', value: 'DIKIRIM' },
  { label: 'Diterima', value: 'DITERIMA' },
  { label: 'Dibatalkan', value: 'DIBATALKAN' },
];

export const PesananIndex: React.FC = () => {
  const { canPerformAction } = useAuth();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const canUpdate = canPerformAction('pesanan', 'update');

  // Query state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });

  // Data state
  const [orders, setOrders] = useState<OrderSummary[]>([]);
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
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load orders
  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: OrderQueryParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
      };

      const res = await orderApi.getPaged(params);
      setOrders(res.items || []);
      setPagination((prev) => ({
        ...prev,
        total: res.totalCount || 0,
      }));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pesanan.');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    debouncedSearch,
    selectedStatus,
    sortConfig.key,
    sortConfig.direction,
  ]);

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

  const columns = useMemo<DataTableColumn<OrderSummary>[]>(
    () => [
      {
        key: 'no',
        label: 'No',
        align: 'center',
        width: 'w-14',
        render: (_, __, idx) => (
          <span className="text-slate-400 font-mono tabular-nums">
            {(pagination.page - 1) * pagination.pageSize + idx + 1}
          </span>
        ),
      },
      {
        key: 'id',
        label: 'Nomor Pesanan',
        sortable: true,
        render: (_, ord) => (
          <span className="font-semibold text-slate-900 font-mono tabular-nums">
            #{ord.orderNumber || ord.id}
          </span>
        ),
      },
      {
        key: 'customerName',
        label: 'Pelanggan',
        sortable: true,
        render: (_, ord) => (
          <div>
            <div className="font-medium text-slate-800 leading-tight">
              {ord.customerName || '-'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{ord.customerEmail}</div>
          </div>
        ),
      },
      {
        key: 'courierName',
        label: 'Ekspedisi',
        render: (_, ord) => (
          <span className="text-slate-600">{ord.courierName || 'Ekspedisi'}</span>
        ),
      },
      {
        key: 'totalAmount',
        label: 'Total Tagihan',
        align: 'right',
        sortable: true,
        render: (val) => (
          <span className="font-bold text-slate-900 font-mono tabular-nums">
            {formatRupiah(val)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        sortable: true,
        render: (_, ord) => {
          const badge = getOrderStatusBadge(ord.status);
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
              {badge.label}
            </span>
          );
        },
      },
      {
        key: 'createdAt',
        label: 'Tanggal Pesan',
        sortable: true,
        render: (val) => (
          <span className="text-slate-500 whitespace-nowrap font-mono tabular-nums text-[11px]">
            {new Date(val).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Aksi',
        align: 'center',
        width: 'w-28',
        render: (_, ord) => (
          <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
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
              (ord.status === 'MENUNGGU_KONFIRMASI' || ord.status === 'DIKEMAS') && (
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
        ),
      },
    ],
    [pagination.page, pagination.pageSize, canUpdate]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Kelola Pesanan
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {pagination.total} Pesanan
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Pantau dan proses transaksi belanja pelanggan secara langsung
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={loadOrders}
                disabled={isLoading}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ambil data pesanan terbaru dari server</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {STATUS_TABS.map((tab) => {
                const isActive = selectedStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setSelectedStatus(tab.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 font-semibold border border-orange-200/70 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search & Sort Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative w-full lg:w-72 shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nomor pesanan, pembeli..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-8 text-xs h-9 bg-white w-full"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                    title="Hapus pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting Dropdown */}
              <div className="w-full sm:w-48 shrink-0">
                <select
                  value={`${sortConfig.key}-${sortConfig.direction}`}
                  onChange={(e) => {
                    const [key, direction] = e.target.value.split('-');
                    setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  aria-label="Urutkan pesanan"
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 cursor-pointer"
                >
                  <option value="createdAt-desc">Terbaru Dibuat</option>
                  <option value="createdAt-asc">Terlama Dibuat</option>
                  <option value="totalAmount-desc">Total: Terbesar</option>
                  <option value="totalAmount-asc">Total: Terkecil</option>
                  <option value="customerName-asc">Pelanggan (A - Z)</option>
                  <option value="customerName-desc">Pelanggan (Z - A)</option>
                  <option value="status-asc">Status (A - Z)</option>
                  <option value="status-desc">Status (Z - A)</option>
                  <option value="id-desc">Nomor: Terbesar</option>
                  <option value="id-asc">Nomor: Terkecil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Result Summary Notification */}
          {(debouncedSearch || selectedStatus) && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <SearchNotification
                total={pagination.total}
                itemLabel="pesanan"
                search={debouncedSearch}
                category={selectedStatus ? STATUS_TABS.find((t) => t.value === selectedStatus)?.label : undefined}
                allCategoryLabel="semua status"
              />
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('');
                }}
                className="text-orange-600 hover:text-orange-700 font-medium underline underline-offset-2 shrink-0 ml-3"
              >
                Reset Filter
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadOrders} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={orders}
        pagination={pagination}
        onPaginationChange={setPagination}
        sortConfig={sortConfig}
        onSortChange={(newSort) => {
          setSortConfig(newSort);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        isLoading={isLoading}
        itemLabel="pesanan"
        emptyMessage="Tidak ada pesanan ditemukan"
        emptyDescription={
          searchTerm || selectedStatus
            ? 'Tidak ada data yang sesuai dengan kata kunci atau filter yang dipilih.'
            : 'Belum ada transaksi pesanan yang dibuat.'
        }
        onRowClick={(ord) => handleOpenDetail(ord.id)}
      />

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
