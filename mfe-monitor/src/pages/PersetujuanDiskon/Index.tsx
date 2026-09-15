import React, { useState, useEffect, useCallback } from 'react';
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

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: DiscountQueryParams = {
        page,
        pageSize,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        // All requests for owner/admin
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
  }, [loadData]);

  // Actions
  const handleApprove = async (item: DiscountApprovalItem) => {
    try {
      showLoading();
      await discountApi.approve(item.id, item.version);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Diskon ${item.newValue}% untuk "${item.productTitle}" berhasil disetujui.`,
      });
      loadData();
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
      setIsRejectOpen(false);
      setRejectTarget(null);
      loadData();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal menolak diskon.',
      });
    } finally {
      setIsRejectLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <FileCheck className="h-6 w-6" />
            </span>
            <span>Persetujuan Diskon</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tinjau dan putuskan permohonan perubahan diskon produk dari staf toko
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-1.5 self-start sm:self-center"
        >
          <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </Button>
      </div>

      {/* Tabs */}
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

      {/* Search & Counter */}
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari judul produk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="text-xs text-slate-500 self-end sm:self-center">
            Total: <span className="font-semibold text-slate-800">{totalCount}</span> permohonan
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Produk</th>
                <th className="py-3.5 px-4 text-center">Diskon Lama</th>
                <th className="py-3.5 px-4 text-center">Pengajuan Baru</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Pengaju</th>
                <th className="py-3.5 px-4">Tanggal Diajukan</th>
                <th className="py-3.5 px-4">Catatan / Alasan</th>
                <th className="py-3.5 px-4 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs">Memuat permohonan diskon...</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <CheckCircle2 className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-700">
                        {selectedStatus === 'MENUNGGU'
                          ? 'Tidak ada permohonan diskon yang menunggu persetujuan.'
                          : 'Tidak ada data diskon ditemukan.'}
                      </p>
                      <p className="text-xs text-slate-400">
                        Semua permohonan telah diproses atau belum ada pengajuan baru.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => {
                  const badge = getDiscountStatusBadge(it.status);
                  const rowNumber = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {it.productTitle}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500">
                        {it.oldValue ? `${it.oldValue}%` : '0%'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-orange-600">
                        {it.newValue}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${badge.className}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${badge.dotColor}`} />
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{it.requestedBy}</td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(it.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {it.reason || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {canUpdate && it.status === 'MENUNGGU' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 text-[11px]"
                                  onClick={() => handleApprove(it)}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Setujui</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Setujui diskon ini</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1 text-[11px]"
                                  onClick={() => handleOpenReject(it)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  <span>Tolak</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Tolak permohonan ini</TooltipContent>
                            </Tooltip>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
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
