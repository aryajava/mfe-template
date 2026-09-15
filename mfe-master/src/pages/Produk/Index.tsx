import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertCircle,
  RotateCcw,
  Tag,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ToggleLeft,
  ToggleRight,
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
  MFE_EVENTS,
  cn,
  type PaginationConfig,
  type SortConfig,
} from '@template/shared';
import { productApi } from '../../services/productApi';
import {
  ProductApiItem,
  CategoryItem,
  formatRupiah,
  hitungHargaEfektif,
} from '../../types/produk';

export const ProdukIndex: React.FC = () => {
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { user, canPerformAction } = useAuth();

  const canCreate = canPerformAction('master-produk', 'create');
  const canUpdate = canPerformAction('master-produk', 'update');
  const canDelete = canPerformAction('master-produk', 'delete');
  const canToggleStatus = canPerformAction('master-produk', 'status');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // '' = Semua, 'true' = Aktif, 'false' = Nonaktif
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10,
    total: 0,
  });

  // Data States
  const [products, setProducts] = useState<ProductApiItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete & Status Target Modals
  const [deleteTarget, setDeleteTarget] = useState<ProductApiItem | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ item: ProductApiItem; nextStatus: boolean } | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load categories
  useEffect(() => {
    productApi
      .getCategories()
      .then((cats) => setCategories(cats))
      .catch((err) => console.error('Gagal memuat kategori:', err));
  }, []);

  // Fetch paged products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await productApi.getPaged({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim() || undefined,
        category: selectedCategory !== 'Semua' ? selectedCategory : undefined,
        isActive: selectedStatus !== '' ? selectedStatus === 'true' : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      setProducts(res.items || []);
      setPagination((prev) => ({ ...prev, total: res.total || 0 }));
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Gagal mengambil data produk:', err);
      setError(err.message || 'Gagal memuat data dari server backend.');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, debouncedSearch, selectedCategory, selectedStatus, sortConfig]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle status toggle modal open
  const handleToggleStatusClick = (item: ProductApiItem) => {
    if (!canToggleStatus) return;

    if (!item.isActive && item.stock <= 0) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        message: `Produk "${item.title}" memiliki stok 0 dan tidak dapat diaktifkan. Silakan isi stok terlebih dahulu.`,
        type: 'warning',
      });
      return;
    }

    setStatusTarget({ item, nextStatus: !item.isActive });
  };

  // Execute status toggle after modal confirmation
  const handleToggleStatusConfirm = async () => {
    if (!statusTarget || !canToggleStatus) return;

    const { item, nextStatus } = statusTarget;
    const actionLabel = nextStatus ? 'Mengaktifkan' : 'Menonaktifkan';
    showLoading(`${actionLabel} produk "${item.title}"...`);

    try {
      await productApi.toggleStatus(item.id, nextStatus);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        message: `Produk "${item.title}" berhasil ${nextStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
        type: 'success',
      });
      setStatusTarget(null);
      fetchProducts();
    } catch (err: any) {
      console.error('Gagal mengubah status produk:', err);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        message: err.message || `Gagal ${actionLabel.toLowerCase()} produk.`,
        type: 'error',
      });
    } finally {
      hideLoading();
    }
  };

  // Handle hard delete with global loading context
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !canDelete) return;

    showLoading(`Menghapus produk "${deleteTarget.title}"...`);
    try {
      await productApi.delete(deleteTarget.id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        message: `Produk "${deleteTarget.title}" berhasil dihapus permanen.`,
        type: 'success',
      });
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      console.error('Gagal menghapus produk:', err);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        message: err.message || 'Gagal menghapus produk. Jika produk memiliki riwayat transaksi, nonaktifkan produk sebagai gantinya.',
        type: 'error',
      });
    } finally {
      hideLoading();
    }
  };

  const toggleSort = (columnKey: string) => {
    setSortConfig((prev) => ({
      key: columnKey,
      direction:
        prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
            <Link to="/dashboard" className="hover:text-orange-600 transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link to="/master" className="hover:text-orange-600 transition-colors">
              Master
            </Link>
            <span>/</span>
            <span className="text-orange-600 font-semibold">Produk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Produk
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {pagination.total} Produk
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola katalog produk, harga, diskon, dan ketersediaan stok toko secara terpusat.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchProducts()}
                className="gap-1.5 cursor-pointer"
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
            <Button asChild className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-xs">
              <Link to="tambah">
                <Plus className="w-4 h-4" />
                <span>Tambah Produk</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900">Gagal terhubung ke API backend</h4>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => fetchProducts()}
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Filter & Toolbar using Card & Input from @template/shared */}
      <Card className="p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box using Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari produk (nama / deskripsi)..."
              className="pl-10 bg-gray-50 focus:bg-white w-full"
            />
          </div>

          {/* Filter Kategori Dinamis */}
          <div className="w-full sm:w-56 flex-shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:bg-white text-gray-800 cursor-pointer"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Dinamis */}
          <div className="w-full sm:w-44 flex-shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:bg-white text-gray-800 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="w-full sm:w-56 flex-shrink-0">
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:bg-white text-gray-800 cursor-pointer"
            >
              <option value="createdAt-desc">Terbaru dibuat</option>
              <option value="createdAt-asc">Terlama dibuat</option>
              <option value="title-asc">Nama Produk (A - Z)</option>
              <option value="title-desc">Nama Produk (Z - A)</option>
              <option value="price-asc">Harga: Termurah</option>
              <option value="price-desc">Harga: Termahal</option>
              <option value="stock-asc">Stok: Paling Sedikit</option>
              <option value="stock-desc">Stok: Paling Banyak</option>
            </select>
          </div>
        </div>

        {/* Notifikasi Standar Pencarian & Filter Tabel (tanpa background-color) */}
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          <SearchNotification
            total={pagination.total}
            itemLabel="produk"
            search={debouncedSearch}
            category={selectedCategory}
            sortKey={`${sortConfig.key}-${sortConfig.direction}`}
          />
        </div>
      </Card>

      {/* Data Table Card using Card component */}
      <Card className="shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase font-semibold text-gray-700 tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center whitespace-nowrap">#</th>
                <th className="py-3.5 px-4 w-24 text-center whitespace-nowrap">Aksi</th>
                <th
                  onClick={() => toggleSort('title')}
                  className="py-3.5 px-4 min-w-[280px] cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Produk</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 w-32 whitespace-nowrap">Kategori</th>
                <th
                  onClick={() => toggleSort('price')}
                  className="py-3.5 px-4 w-36 text-right cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Harga Dasar</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 w-24 text-center whitespace-nowrap">Diskon</th>
                <th className="py-3.5 px-4 w-36 text-right whitespace-nowrap">Harga Efektif</th>
                <th
                  onClick={() => toggleSort('stock')}
                  className="py-3.5 px-4 w-32 text-center cursor-pointer hover:bg-gray-100 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Stok</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 w-28 text-center whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <LoadingSpinner size="lg" />
                      <span className="text-xs text-gray-500 font-medium">
                        Memuat data produk dari API...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                        <Package className="w-6 h-6 text-orange-500" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Tidak ada data produk
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        {debouncedSearch || selectedCategory !== 'Semua'
                          ? 'Tidak ditemukan produk yang cocok dengan kata kunci atau filter saat ini.'
                          : 'Belum ada produk di database.'}
                      </p>
                      {(debouncedSearch || selectedCategory !== 'Semua') && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedCategory('Semua');
                          }}
                          className="text-orange-600"
                        >
                          Hapus filter pencarian
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((item, idx) => {
                  const itemIndex =
                    (pagination.page - 1) * pagination.pageSize + idx + 1;
                  const discountVal = item.discountPercent || 0;
                  const hargaEfektif = hitungHargaEfektif(item.price, discountVal);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/70 transition-colors"
                    >
                      {/* # */}
                      <td className="py-3.5 px-4 text-center text-xs text-gray-400 font-mono whitespace-nowrap">
                        {itemIndex}
                      </td>

                      {/* Aksi with Tooltip & Button from shared */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1">
                          {canUpdate && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`edit/${item.id}`)}
                                  className="h-8 w-8 hover:text-orange-600 hover:bg-orange-50"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ubah Produk</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Tombol Toggle Status (Aktifkan / Nonaktifkan) */}
                          {canToggleStatus && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleStatusClick(item)}
                                  className={cn(
                                    "h-8 w-8",
                                    item.isActive
                                      ? "hover:text-amber-600 hover:bg-amber-50 text-emerald-600"
                                      : "hover:text-emerald-600 hover:bg-emerald-50 text-gray-400"
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
                                <p>{item.isActive ? 'Nonaktifkan Produk' : 'Aktifkan Produk'}</p>
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
                                  onClick={() => setDeleteTarget(item)}
                                  className="h-8 w-8 hover:text-red-600 hover:bg-red-50"
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
                      </td>

                      {/* Produk */}
                      <td className="py-3.5 px-4 min-w-[280px]">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Tag className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <span
                              className="font-semibold text-gray-900 block truncate hover:text-orange-600 transition-colors"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                            <span
                              className="text-xs text-gray-500 truncate block"
                              title={item.description || ''}
                            >
                              {item.description || 'Tidak ada deskripsi'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                          {item.category || '-'}
                        </span>
                      </td>

                      {/* Harga Dasar */}
                      <td className="py-3.5 px-4 text-right font-medium text-gray-600 whitespace-nowrap">
                        {discountVal > 0 ? (
                          <span className="line-through text-xs text-gray-400 block whitespace-nowrap">
                            {formatRupiah(item.price)}
                          </span>
                        ) : null}
                        <span className="whitespace-nowrap">{formatRupiah(item.price)}</span>
                      </td>

                      {/* Diskon */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {discountVal > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                            {discountVal}%
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>

                      {/* Harga Efektif */}
                      <td className="py-3.5 px-4 text-right font-bold text-orange-600 whitespace-nowrap">
                        <span className="whitespace-nowrap">{formatRupiah(hargaEfektif)}</span>
                      </td>

                      {/* Stok */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.stock === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
                            Habis
                          </span>
                        ) : item.stock <= 5 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                            {item.stock} (Menipis)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium text-gray-700 whitespace-nowrap">
                            {item.stock} unit
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                            <XCircle className="w-3 h-3 flex-shrink-0" />
                            Nonaktif
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

        {/* Table Footer / Pagination */}
        <div className="py-3 px-4 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-gray-600">
          <div className="flex flex-wrap items-center gap-4">
            {/* Selector Jumlah Baris per Halaman */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Baris:</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPagination((prev) => ({
                    ...prev,
                    pageSize: newSize,
                    page: 1,
                  }));
                }}
                className="h-7 px-2 py-0 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-800 font-medium cursor-pointer"
                aria-label="Pilih jumlah baris per halaman"
              >
                {[5, 10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size} / hal
                  </option>
                ))}
              </select>
            </div>

            <div>
              Menampilkan{' '}
              <span className="font-semibold text-gray-900">
                {pagination.total === 0
                  ? 0
                  : (pagination.page - 1) * pagination.pageSize + 1}
              </span>{' '}
              sampai{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-gray-900">
                {pagination.total}
              </span>{' '}
              produk
            </div>


          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1 || isLoading}
                className="h-7 px-2 text-xs"
              >
                Sebelumnya
              </Button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && pagination.page > 3) {
                  pageNum = pagination.page - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({ ...prev, page: pageNum }))
                    }
                    className={cn(
                      'h-7 w-7 p-0 text-xs',
                      pagination.page === pageNum && 'bg-orange-600 hover:bg-orange-700'
                    )}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === totalPages || isLoading}
                className="h-7 px-2 text-xs"
              >
                Berikutnya
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal Dialog Konfirmasi Ubah Status (Aktif / Nonaktif) */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  statusTarget.nextStatus
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-amber-100 text-amber-600"
                )}
              >
                {statusTarget.nextStatus ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900">
                  {statusTarget.nextStatus
                    ? 'Konfirmasi Pengaktifan Produk'
                    : 'Konfirmasi Penonaktifan Produk'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {statusTarget.nextStatus
                    ? `Apakah Anda yakin ingin mengaktifkan produk "${statusTarget.item.title}"? Produk akan kembali ditampilkan di katalog belanja publik.`
                    : `Apakah Anda yakin ingin menonaktifkan produk "${statusTarget.item.title}"? Produk akan disembunyikan dari katalog belanja publik.`}
                </p>
                {statusTarget.nextStatus && statusTarget.item.stock <= 0 && (
                  <div className="mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
                    Perhatian: Produk ini memiliki stok 0 dan tidak dapat diaktifkan. Silakan perbarui stok terlebih dahulu.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setStatusTarget(null)}
              >
                Batal
              </Button>
              <Button
                disabled={statusTarget.nextStatus && statusTarget.item.stock <= 0}
                className={cn(
                  statusTarget.nextStatus
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                )}
                onClick={handleToggleStatusConfirm}
              >
                {statusTarget.nextStatus ? 'Ya, Aktifkan' : 'Ya, Nonaktifkan'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Hapus Permanen */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <Card className="max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Konfirmasi Hapus Permanen
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Apakah Anda yakin ingin menghapus permanen produk{' '}
                  <span className="font-semibold text-gray-800">
                    "{deleteTarget.title}"
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                  Perhatian: Bila produk pernah tercatat dalam transaksi belanja pelanggan, produk tidak dapat dihapus permanen demi keutuhan riwayat pesanan. Silakan gunakan tombol pengalih status untuk menonaktifkannya.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
              >
                Ya, Hapus Permanen
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProdukIndex;
