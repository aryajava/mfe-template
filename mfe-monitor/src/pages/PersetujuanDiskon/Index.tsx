import React, { useState, useEffect, useCallback } from 'react';
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
  useLoading,
  useAuth,
  useEventBus,
  useEventSubscription,
  MFE_EVENTS,
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
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [items, setItems] = useState<DiscountApprovalItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
      setPage(1);
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
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        onlyMine: false,
      };

      const res = await discountApi.getPaged(params);
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat permohonan persetujuan diskon.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedStatus]);

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

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

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
            setPage(1);
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
            setPage(1);
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
            setPage(1);
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
                      setPage(1);
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

            {/* Search Input */}
            <div className="relative w-full lg:w-80 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari judul produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 text-xs h-9 bg-white"
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
          </div>

          {/* Search Result Summary Notification */}
          {(debouncedSearch || selectedStatus) && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <SearchNotification
                total={totalCount}
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th className="py-3.5 px-4">Produk</th>
                <th className="py-3.5 px-4 text-center">Perubahan Diskon</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Pengaju</th>
                <th className="py-3.5 px-4">Waktu Pengajuan</th>
                <th className="py-3.5 px-4">Catatan / Alasan</th>
                <th className="py-3.5 px-4 text-center w-36">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs text-slate-500 font-medium">Memuat permohonan diskon...</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        {selectedStatus === 'MENUNGGU'
                          ? 'Semua pengajuan telah diproses'
                          : 'Tidak ada data ditemukan'}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {selectedStatus === 'MENUNGGU'
                          ? 'Tidak ada permohonan diskon yang sedang menunggu persetujuan Anda saat ini.'
                          : 'Coba sesuaikan kata kunci pencarian atau ganti filter status.'}
                      </p>
                      {selectedStatus !== 'MENUNGGU' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedStatus('MENUNGGU');
                          }}
                          className="mt-2 text-xs"
                        >
                          Lihat Antrean Menunggu
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const badge = getDiscountStatusBadge(it.status);
                  const rowNumber = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono tabular-nums">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {it.productTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID Produk #{it.productId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                          <span className="text-slate-400 line-through text-[11px]">
                            {it.oldValue ? `${it.oldValue}%` : '0%'}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-300" />
                          <span className="font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-md text-xs">
                            {it.newValue}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {it.requestedBy}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono tabular-nums text-[11px]">
                        {new Date(it.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                        {it.reason ? (
                          <span className="truncate block" title={it.reason}>
                            {it.reason}
                          </span>
                        ) : (
                          <span className="text-slate-300 italic">Tanpa catatan</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
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
            Menampilkan <span className="font-semibold text-slate-800 font-mono tabular-nums">{startRecord}</span> -{' '}
            <span className="font-semibold text-slate-800 font-mono tabular-nums">{endRecord}</span> dari{' '}
            <span className="font-semibold text-slate-800 font-mono tabular-nums">{totalCount}</span> permohonan
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-8"
            >
              Sebelumnya
            </Button>
            <div className="px-2 font-medium text-slate-700 font-mono tabular-nums">
              {page} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs h-8"
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>

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

