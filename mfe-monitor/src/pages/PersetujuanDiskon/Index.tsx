import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Search,
  RotateCcw,
  Tag,
  Clock,
  User,
  AlertCircle,
  FileCheck,
  ArrowRight,
  X,
  SlidersHorizontal,
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
import { discountApi, DiscountQueryParams } from '../../services/discountApi';
import {
  DiscountApprovalItem,
  getDiscountStatusBadge,
} from '../../types/discount';
import { RejectModal } from './RejectModal';

const STATUS_TABS = [
  { label: 'Menunggu Persetujuan', value: 'MENUNGGU' },
  { label: 'Semua Status', value: '' },
  { label: 'Disetujui', value: 'DISETUJUI' },
  { label: 'Ditolak', value: 'DITOLAK' },
];

export const PersetujuanDiskonIndex: React.FC = () => {
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { canPerformAction } = useAuth();

  const canUpdate = canPerformAction('persetujuan-diskon', 'update');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('MENUNGGU');
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });

  const [items, setItems] = useState<DiscountApprovalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status Metric Counts
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Reject modal state
  const [rejectTarget, setRejectTarget] = useState<DiscountApprovalItem | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRejectLoading, setIsRejectLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadCounts = useCallback(async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.allSettled([
        discountApi.getPaged({ status: 'MENUNGGU', pageSize: 1, onlyMine: false }),
        discountApi.getPaged({ status: 'DISETUJUI', pageSize: 1, onlyMine: false }),
        discountApi.getPaged({ status: 'DITOLAK', pageSize: 1, onlyMine: false }),
      ]);

      setCounts({
        pending: pendingRes.status === 'fulfilled' ? pendingRes.value.totalCount : 0,
        approved: approvedRes.status === 'fulfilled' ? approvedRes.value.totalCount : 0,
        rejected: rejectedRes.status === 'fulfilled' ? rejectedRes.value.totalCount : 0,
      });
    } catch {
      // Non-critical background telemetry
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: DiscountQueryParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        onlyMine: false,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
      };

      const res = await discountApi.getPaged(params);
      setItems(res.items || []);
      setPagination((prev) => ({
        ...prev,
        total: res.totalCount || 0,
      }));
    } catch (err: any) {
      setError(err.message || 'Gagal memuat permohonan persetujuan diskon.');
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
    loadData();
    loadCounts();
  }, [loadData, loadCounts]);

  // Reaktif terhadap perubahan status/permintaan diskon
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'discount') {
      loadData();
      loadCounts();
    }
  });

  // Actions
  const handleApprove = async (item: DiscountApprovalItem) => {
    try {
      showLoading();
      await discountApi.approve(item.id, item.version);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Diskon ${item.newValue}% untuk "${item.productTitle}" berhasil disetujui.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'discount', action: 'approve', id: item.id });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'product', action: 'update', id: item.productId });
      loadData();
      loadCounts();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal menyetujui diskon.',
      });
    } finally {
      hideLoading();
    }
  };

  const handleOpenReject = (item: DiscountApprovalItem) => {
    setRejectTarget(item);
    setIsRejectOpen(true);
  };

  const handleConfirmReject = async (id: number, reason: string, version: number) => {
    try {
      setIsRejectLoading(true);
      await discountApi.reject(id, reason, version);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: 'Permintaan diskon berhasil ditolak.',
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'discount', action: 'reject', id });
      setIsRejectOpen(false);
      setRejectTarget(null);
      loadData();
      loadCounts();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal menolak diskon.',
      });
    } finally {
      setIsRejectLoading(false);
    }
  };

  const columns = useMemo<DataTableColumn<DiscountApprovalItem>[]>(
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
        key: 'title',
        label: 'Produk',
        sortable: true,
        render: (_, it) => (
          <div>
            <div className="font-semibold text-slate-900 leading-tight">
              {it.productTitle}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              ID Produk #{it.productId}
            </div>
          </div>
        ),
      },
      {
        key: 'newValue',
        label: 'Perubahan Diskon',
        align: 'center',
        sortable: true,
        render: (_, it) => (
          <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
            <span className="text-slate-400 line-through text-[11px]">
              {it.oldValue ? `${it.oldValue}%` : '0%'}
            </span>
            <ArrowRight className="h-3 w-3 text-slate-300" />
            <span className="font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md text-xs">
              {it.newValue}%
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        align: 'center',
        sortable: true,
        render: (_, it) => {
          const badge = getDiscountStatusBadge(it.status);
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
        key: 'requestedBy',
        label: 'Pengaju',
        sortable: true,
        render: (_, it) => (
          <span className="text-slate-700 font-medium">{it.requestedBy}</span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Waktu Pengajuan',
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
        key: 'reason',
        label: 'Catatan Pengajuan',
        render: (_, it) => (
          <div className="text-slate-600 max-w-xs">
            {it.reason ? (
              <span className="truncate block" title={it.reason}>
                {it.reason}
              </span>
            ) : (
              <span className="text-slate-300 italic">Tanpa catatan</span>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Aksi',
        align: 'center',
        render: (_, it) => (
          <div>
            {canUpdate && it.status === 'MENUNGGU' ? (
              <div className="flex items-center justify-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center gap-1 text-xs cursor-pointer shadow-2xs"
                      onClick={() => handleApprove(it)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Setujui</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Setujui diskon {it.newValue}%</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95 flex items-center gap-1 text-xs cursor-pointer"
                      onClick={() => handleOpenReject(it)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Tolak</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Tolak permohonan diskon</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium italic">
                {it.status === 'DISETUJUI' ? 'Sudah disetujui' : 'Sudah ditolak'}
              </span>
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
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Persetujuan Diskon
                </h1>
                {counts.pending > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    {counts.pending} Perlu Ditinjau
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Tinjau dan putuskan permohonan perubahan diskon produk dari staf toko
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
                onClick={() => {
                  loadData();
                  loadCounts();
                }}
                disabled={isLoading}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Perbarui data antrean permohonan</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setSelectedStatus('MENUNGGU');
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'MENUNGGU'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-amber-200 hover:bg-slate-50/50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Menunggu Persetujuan</span>
            <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {counts.pending}
            </span>
            <span className="text-[11px] text-amber-700 font-medium">butuh tindakan</span>
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedStatus('DISETUJUI');
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'DISETUJUI'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-emerald-200 hover:bg-slate-50/50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Telah Disetujui</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {counts.approved}
            </span>
            <span className="text-[11px] text-slate-500">disetujui</span>
          </div>
        </div>

        <div
          onClick={() => {
            setSelectedStatus('DITOLAK');
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            selectedStatus === 'DITOLAK'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-rose-200 hover:bg-slate-50/50 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">Permohonan Ditolak</span>
            <span className="p-1.5 rounded-lg bg-rose-100 text-rose-700">
              <XCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {counts.rejected}
            </span>
            <span className="text-[11px] text-slate-500">ditolak</span>
          </div>
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
                  placeholder="Cari judul produk..."
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
                  aria-label="Urutkan persetujuan diskon"
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-700 cursor-pointer"
                >
                  <option value="createdAt-desc">Terbaru Diajukan</option>
                  <option value="createdAt-asc">Terlama Diajukan</option>
                  <option value="title-asc">Nama Produk (A - Z)</option>
                  <option value="title-desc">Nama Produk (Z - A)</option>
                  <option value="newValue-desc">Diskon: Terbesar</option>
                  <option value="newValue-asc">Diskon: Terkecil</option>
                  <option value="status-asc">Status (A - Z)</option>
                  <option value="status-desc">Status (Z - A)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Search Result Summary Notification */}
          {(debouncedSearch || selectedStatus) && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <SearchNotification
                total={pagination.total}
                itemLabel="permohonan diskon"
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
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={items}
        pagination={pagination}
        onPaginationChange={setPagination}
        sortConfig={sortConfig}
        onSortChange={(newSort) => {
          setSortConfig(newSort);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        isLoading={isLoading}
        itemLabel="permohonan"
        emptyMessage={
          selectedStatus === 'MENUNGGU'
            ? 'Semua pengajuan telah diproses'
            : 'Tidak ada data ditemukan'
        }
        emptyDescription={
          selectedStatus === 'MENUNGGU'
            ? 'Tidak ada permohonan diskon yang sedang menunggu persetujuan Anda saat ini.'
            : 'Coba sesuaikan kata kunci pencarian atau ganti filter status.'
        }
      />

      {/* Reject Modal */}
      <RejectModal
        item={rejectTarget}
        isOpen={isRejectOpen}
        isLoading={isRejectLoading}
        onClose={() => {
          setIsRejectOpen(false);
          setRejectTarget(null);
        }}
        onConfirm={handleConfirmReject}
      />
    </div>
  );
};

export default PersetujuanDiskonIndex;

