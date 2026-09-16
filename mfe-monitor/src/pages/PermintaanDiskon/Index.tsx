import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Search,
  RotateCcw,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  LoadingSpinner,
  SearchNotification,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useAuth,
  useEventSubscription,
  MFE_EVENTS,
} from '@template/shared';
import { discountApi, DiscountQueryParams } from '../../services/discountApi';
import {
  DiscountApprovalItem,
  getDiscountStatusBadge,
} from '../../types/discount';

const STATUS_TABS = [
  { label: 'Semua Status', value: '' },
  { label: 'Menunggu', value: 'MENUNGGU' },
  { label: 'Disetujui', value: 'DISETUJUI' },
  { label: 'Ditolak', value: 'DITOLAK' },
];

export const PermintaanDiskonIndex: React.FC = () => {
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [items, setItems] = useState<DiscountApprovalItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        onlyMine: true,
      };

      const res = await discountApi.getPaged(params);
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat daftar permintaan diskon.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, selectedStatus]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reaktif terhadap perubahan status permintaan diskon (disetujui/ditolak)
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'discount') {
      loadData();
    }
  });

  const startRecord = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalCount);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
              <Tag className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Permintaan Diskon
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {totalCount} Pengajuan
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Pantau status pengajuan diskon harga produk Anda kepada pemilik toko
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
                onClick={loadData}
                disabled={isLoading}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ambil data pengajuan terbaru dari server</TooltipContent>
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
                itemLabel="pengajuan diskon"
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs text-slate-500 font-medium">Memuat daftar permintaan diskon...</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <Tag className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">Tidak ada pengajuan diskon</p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {searchTerm || selectedStatus
                          ? 'Tidak ada data yang sesuai dengan kata kunci atau filter yang dipilih.'
                          : 'Belum ada permohonan diskon yang pernah Anda ajukan.'}
                      </p>
                      {(searchTerm || selectedStatus) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedStatus('');
                          }}
                          className="mt-2 text-xs"
                        >
                          Hapus Filter
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
            <span className="font-semibold text-slate-800 font-mono tabular-nums">{totalCount}</span> pengajuan
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
    </div>
  );
};

export default PermintaanDiskonIndex;

