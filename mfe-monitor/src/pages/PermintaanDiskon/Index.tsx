import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Search,
  RotateCcw,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  LoadingSpinner,
  useAuth,
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
        // Staff monitoring their requests
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Tag className="h-6 w-6" />
            </span>
            <span>Permintaan Diskon</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau status pengajuan diskon harga produk Anda kepada pemilik toko
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
            Total: <span className="font-semibold text-slate-800">{totalCount}</span> pengajuan
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
                <th className="py-3.5 px-4 text-center">Pengajuan Diskon</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Pengaju</th>
                <th className="py-3.5 px-4">Tanggal Pengajuan</th>
                <th className="py-3.5 px-4">Catatan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner size="lg" />
                      <p className="text-xs">Memuat daftar permintaan diskon...</p>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <Tag className="h-8 w-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-700">Tidak ada data ditemukan</p>
                      <p className="text-xs text-slate-400">
                        {searchTerm || selectedStatus
                          ? 'Coba sesuaikan kata kunci atau filter status.'
                          : 'Belum ada pengajuan diskon yang tercatat.'}
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
    </div>
  );
};

export default PermintaanDiskonIndex;
