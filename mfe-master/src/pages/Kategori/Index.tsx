import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Package,
} from 'lucide-react';
import {
  Button,
  Input,
  SearchNotification,
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
  cn,
  type PaginationConfig,
  type SortConfig,
} from '@template/shared';
import { categoryApi } from '../../services/categoryApi';
import { CategoryItem } from '../../types/kategori';

export const KategoriIndex: React.FC = () => {
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { user, canPerformAction } = useAuth();

  const canCreate = canPerformAction('master-kategori', 'create');
  const canUpdate = canPerformAction('master-kategori', 'update');
  const canDelete = canPerformAction('master-kategori', 'delete');
  const canToggleStatus = canPerformAction('master-kategori', 'status');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // '' = Semua, 'true' = Aktif, 'false' = Nonaktif
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'name',
    direction: 'asc',
  });
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [totalPages, setTotalPages] = useState(1);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [statusModalTarget, setStatusModalTarget] = useState<CategoryItem | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<CategoryItem | null>(null);
  const [warningModalTarget, setWarningModalTarget] = useState<CategoryItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await categoryApi.getPaged({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        active: selectedStatus !== '' ? selectedStatus === 'true' : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      setCategories(res.items || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total,
      }));
      setTotalPages(res.totalPages || Math.ceil(res.total / pagination.pageSize) || 1);
    } catch (err: any) {
      console.error('Gagal mengambil data kategori:', err);
      setErrorMessage(err.message || 'Gagal memuat data kategori dari server.');
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
    fetchCategories();
  }, [fetchCategories]);

  // Reaktif terhadap perubahan kategori
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'category') {
      fetchCategories();
    }
  });

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return {
        key,
        direction: 'asc',
      };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleStatusToggleConfirm = async () => {
    if (!statusModalTarget) return;

    try {
      setIsProcessingAction(true);
      const nextStatus = !statusModalTarget.isActive;
      await categoryApi.toggleStatus(statusModalTarget.id, nextStatus);

      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Status Kategori Diperbarui',
        message: `Kategori "${statusModalTarget.name}" berhasil di${
          nextStatus ? 'aktifkan' : 'nonaktifkan'
        }.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'category', action: 'status', id: statusModalTarget.id });

      setStatusModalTarget(null);
      fetchCategories();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Gagal Mengubah Status',
        message: err.message || 'Terjadi kesalahan saat mengubah status kategori.',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleDeleteClick = (cat: CategoryItem) => {
    if (cat.productCount > 0) {
      setWarningModalTarget(cat);
    } else {
      setDeleteModalTarget(cat);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalTarget) return;

    try {
      setIsProcessingAction(true);
      await categoryApi.delete(deleteModalTarget.id);

      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Kategori Berhasil Dihapus',
        message: `Kategori "${deleteModalTarget.name}" berhasil dihapus permanen.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'category', action: 'delete', id: deleteModalTarget.id });

      setDeleteModalTarget(null);
      fetchCategories();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Gagal Menghapus Kategori',
        message: err.message || 'Terjadi kesalahan saat menghapus kategori.',
      });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const hasAnyRowAction = canUpdate || canToggleStatus || canDelete;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kategori</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {pagination.total} Kategori
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola klasifikasi dan pengelompokan produk toko secara terpusat.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchCategories()}
                className="gap-1.5 cursor-pointer text-gray-700 hover:text-gray-900"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ambil data terbaru dari API backend</p>
            </TooltipContent>
          </Tooltip>

          {canCreate && (
            <Button
              asChild
              size="sm"
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-xs cursor-pointer"
            >
              <Link to="tambah">
                <Plus className="h-4 w-4" />
                <span>Tambah Kategori</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar Filter & Search */}
      <Card className="p-4 sm:p-5 shadow-xs border border-gray-200/90 bg-white rounded-xl">
        <div className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-stretch md:items-center gap-3">
          {/* Search box using Input */}
          <div className="relative flex-1 min-w-[220px] w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kategori produk..."
              className="!pl-10 h-10 text-sm bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:ring-2 focus:ring-orange-500 w-full"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* Filter Status Dinamis */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 !px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="w-full sm:w-56 shrink-0">
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 !px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 cursor-pointer"
            >
              <option value="name-asc">Nama Kategori (A - Z)</option>
              <option value="name-desc">Nama Kategori (Z - A)</option>
              <option value="createdAt-desc">Terbaru Dibuat</option>
              <option value="createdAt-asc">Terlama Dibuat</option>
              <option value="productCount-desc">Produk: Terbanyak</option>
              <option value="productCount-asc">Produk: Tersedikit</option>
            </select>
          </div>
        </div>

        {/* Notifikasi Standar Pencarian & Filter Tabel */}
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          <SearchNotification
            total={pagination.total}
            itemLabel="kategori"
            search={debouncedSearch}
            sortKey={`${sortConfig.key}-${sortConfig.direction}`}
          />
        </div>
      </Card>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Gagal terhubung ke server</h4>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => fetchCategories()}
            className="cursor-pointer"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Data Table Card */}
      <Card className="shadow-xs overflow-hidden border border-gray-200/90 bg-white rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-semibold text-gray-700 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center whitespace-nowrap">#</th>
                <th className="py-3.5 px-4 w-28 text-center whitespace-nowrap">Aksi</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Kategori</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('productCount')}
                  className="py-3.5 px-4 w-40 text-center cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap select-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Produk Terkait</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 w-32 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <LoadingSpinner size="lg" />
                      <span className="text-xs text-gray-500 font-medium">
                        Memuat data kategori dari API backend...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Tidak Ada Kategori Ditemukan
                      </h3>
                      <p className="text-xs text-gray-500 mb-4 text-center">
                        {debouncedSearch
                          ? `Tidak ditemukan kategori yang cocok dengan pencarian "${debouncedSearch}".`
                          : 'Belum ada data kategori tersimpan dalam sistem toko.'}
                      </p>
                      {debouncedSearch ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedStatus('');
                          }}
                          className="cursor-pointer text-xs"
                        >
                          Reset Pencarian
                        </Button>
                      ) : canCreate ? (
                        <Button
                          asChild
                          size="sm"
                          className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs cursor-pointer font-medium"
                        >
                          <Link to="tambah">
                            <Plus className="w-4 h-4" />
                            <span>Tambah Kategori Pertama</span>
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((item, index) => {
                  const itemNumber = (pagination.page - 1) * pagination.pageSize + index + 1;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'transition-colors hover:bg-gray-50/80',
                        !item.isActive && 'bg-gray-50/40 text-gray-500'
                      )}
                    >
                      {/* Nomor Urut */}
                      <td className="py-3.5 px-4 text-center font-medium text-gray-400 text-xs">
                        {itemNumber}
                      </td>

                      {/* Kolom Aksi Terproteksi Hak Akses */}
                      <td className="py-3.5 px-4 text-center">
                        {hasAnyRowAction ? (
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Ubah Kategori */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                    className="h-8 w-8 text-gray-500 hover:text-orange-600 hover:bg-orange-50 cursor-pointer"
                                  >
                                    <Link to={`edit/${item.id}`}>
                                      <Edit2 className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ubah Kategori</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Tombol Alih Status Operasional */}
                            {canToggleStatus && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setStatusModalTarget(item)}
                                    className={cn(
                                      'h-8 w-8 cursor-pointer transition-colors',
                                      item.isActive
                                        ? 'text-emerald-600 hover:text-amber-600 hover:bg-amber-50'
                                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                    )}
                                  >
                                    {item.isActive ? (
                                      <ToggleRight className="w-4 h-4" />
                                    ) : (
                                      <ToggleLeft className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{item.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori'}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Tombol Hapus Permanen */}
                            {canDelete && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(item)}
                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Hapus Permanen</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium select-none" title="Hanya Baca">
                            —
                          </span>
                        )}
                      </td>

                      {/* Nama Kategori */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900 hover:text-orange-600 transition-colors">
                          {item.name}
                        </div>
                      </td>

                      {/* Produk Terkait */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                          <Package className="w-3.5 h-3.5 text-gray-500" />
                          <span>{item.productCount} Produk</span>
                        </span>
                      </td>

                      {/* Status Operasional */}
                      <td className="py-3.5 px-4 text-center">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <XCircle className="w-3 h-3 text-gray-500" />
                            <span>Nonaktif</span>
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
        {!isLoading && !errorMessage && categories.length > 0 && (
          <div className="py-3.5 px-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Menampilkan{' '}
              <span className="font-semibold text-gray-900">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </span>{' '}
              sampai{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{' '}
              dari <span className="font-semibold text-gray-900">{pagination.total}</span> data
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="h-8 px-2.5 text-xs cursor-pointer disabled:opacity-40"
              >
                Sebelumnya
              </Button>
              <span className="px-2 text-xs font-medium text-gray-700">
                {pagination.page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= totalPages}
                className="h-8 px-2.5 text-xs cursor-pointer disabled:opacity-40"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Konfirmasi Ubah Status */}
      {statusModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    'p-2.5 rounded-full',
                    statusModalTarget.isActive
                      ? 'bg-amber-50 text-amber-600 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  )}
                >
                  {statusModalTarget.isActive ? (
                    <ToggleRight className="h-6 w-6" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {statusModalTarget.isActive ? 'Nonaktifkan Kategori?' : 'Aktifkan Kategori?'}
                  </h3>
                  <p className="text-xs text-gray-500">Konfirmasi perubahan status operasional</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Apakah Anda yakin ingin {statusModalTarget.isActive ? 'menonaktifkan' : 'mengaktifkan'}{' '}
                kategori <span className="font-semibold text-gray-900">"{statusModalTarget.name}"</span>?
                {statusModalTarget.isActive && (
                  <span className="block mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Perhatian: Kategori yang nonaktif tidak dapat dipilih saat mendaftarkan produk baru di toko.
                  </span>
                )}
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusModalTarget(null)}
                  disabled={isProcessingAction}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleStatusToggleConfirm}
                  disabled={isProcessingAction}
                  className={cn(
                    'text-white cursor-pointer shadow-xs',
                    statusModalTarget.isActive
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  {isProcessingAction ? (
                    <span className="flex items-center gap-1.5">
                      <LoadingSpinner size="sm" />
                      <span>Menyimpan...</span>
                    </span>
                  ) : statusModalTarget.isActive ? (
                    'Ya, Nonaktifkan'
                  ) : (
                    'Ya, Aktifkan'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Peringatan: Tidak Bisa Hapus karena Terikat Produk */}
      {warningModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-amber-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Penghapusan Tidak Diizinkan</h3>
                  <p className="text-xs text-gray-500">Integritas relasional katalog produk</p>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-2.5 leading-relaxed">
                <p>
                  Kategori <span className="font-semibold text-gray-900">"{warningModalTarget.name}"</span>{' '}
                  tidak dapat dihapus karena saat ini masih menaungi{' '}
                  <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    {warningModalTarget.productCount} produk aktif/nonaktif
                  </span>.
                </p>
                <p className="text-xs text-gray-500">
                  Untuk menjaga konsistensi katalog toko, silakan pindahkan atau ubah kategori produk-produk
                  tersebut terlebih dahulu, atau cukup nonaktifkan status kategori ini.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <Button
                  size="sm"
                  onClick={() => setWarningModalTarget(null)}
                  className="bg-gray-800 hover:bg-gray-900 text-white cursor-pointer"
                >
                  Saya Mengerti
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Konfirmasi Hapus Permanen */}
      {deleteModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-red-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Hapus Kategori Permanen?</h3>
                  <p className="text-xs text-gray-500">Aksi ini tidak dapat dibatalkan</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus kategori{' '}
                <span className="font-semibold text-gray-900">"{deleteModalTarget.name}"</span> secara
                permanen dari database sistem?
              </p>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModalTarget(null)}
                  disabled={isProcessingAction}
                  className="cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteConfirm}
                  disabled={isProcessingAction}
                  className="cursor-pointer shadow-xs"
                >
                  {isProcessingAction ? (
                    <span className="flex items-center gap-1.5">
                      <LoadingSpinner size="sm" />
                      <span>Menghapus...</span>
                    </span>
                  ) : (
                    'Ya, Hapus Permanen'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default KategoriIndex;
