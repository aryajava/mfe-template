import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ArrowUpDown,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  LoadingSpinner,
  SearchNotification,
  DataTable,
  type DataTableColumn,
  type PaginationConfig,
  type SortConfig,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useAuth,
  useEventSubscription,
  MFE_EVENTS,
  cn,
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: DiscountQueryParams = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        status: selectedStatus || undefined,
        onlyMine: true,
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
      setError(err.message || 'Gagal memuat daftar permintaan diskon.');
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
  }, [loadData]);

  // Reaktif terhadap perubahan status permintaan diskon (disetujui/ditolak)
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'discount') {
      loadData();
    }
  });

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
    ],
    [pagination.page, pagination.pageSize]
  );

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
                  Status Pengajuan Diskon
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {pagination.total} Total Pengajuan
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
                  aria-label="Urutkan permintaan diskon"
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
        itemLabel="pengajuan"
        emptyMessage="Tidak ada pengajuan ditemukan"
        emptyDescription={
          searchTerm || selectedStatus
            ? 'Tidak ada permohonan yang sesuai dengan filter atau kata kunci Anda.'
            : 'Belum ada riwayat permohonan diskon yang diajukan oleh Anda.'
        }
      />
    </div>
  );
};

export default PermintaanDiskonIndex;
