import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Search,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FolderTree,
  ShieldAlert,
  FilePlus,
  ArrowUpDown,
} from 'lucide-react';
import {
  Button,
  Input,
  SearchNotification,
  Card,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  LoadingSpinner,
  DataTable,
  type DataTableColumn,
  useAuth,
  useEventBus,
  useEventSubscription,
  MFE_EVENTS,
  resolveLucideIcon,
  cn,
  type PaginationConfig,
  type SortConfig,
} from '@template/shared';
import { menuApi } from '../../services/menuApi';
import { menuGroupApi } from '../../services/menuGroupApi';
import { MenuItem, CreateMenuInput, UpdateMenuInput } from '../../types/menu';
import { MenuGroupItem } from '../../types/menuGroup';

export const MenuIndex: React.FC = () => {
  const { canPerformAction } = useAuth();
  const { publish } = useEventBus();

  const canCreate =
    canPerformAction('master-menu', 'create') || canPerformAction('menu', 'create');
  const canUpdate =
    canPerformAction('master-menu', 'update') || canPerformAction('menu', 'update');
  const canDelete =
    canPerformAction('master-menu', 'delete') || canPerformAction('menu', 'delete');
  const canToggleStatus =
    canPerformAction('master-menu', 'status') || canPerformAction('menu', 'status');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // '' = Semua, 'true' = Aktif, 'false' = Nonaktif
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'sortOrder',
    direction: 'asc',
  });
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [totalPages, setTotalPages] = useState(1);

  // State Data
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [groups, setGroups] = useState<MenuGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Form State (Tambah / Ubah)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<{
    groupId: number;
    menuCode: string;
    menuName: string;
    urlPrefix: string;
    sortOrder: number;
    icon: string;
  }>({
    groupId: 0,
    menuCode: '',
    menuName: '',
    urlPrefix: '',
    sortOrder: 10,
    icon: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Hapus State
  const [deletingMenu, setDeletingMenu] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load parent groups list for filter & modal select
  const loadGroupsList = useCallback(async () => {
    try {
      const data = await menuGroupApi.getAll();
      setGroups(data || []);
    } catch (err: any) {
      console.error('Gagal memuat daftar grup menu:', err);
    }
  }, []);

  useEffect(() => {
    loadGroupsList();
  }, [loadGroupsList]);

  // Fetch Server-Side Paged Menus
  const loadMenus = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await menuApi.getPaged({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim() || undefined,
        groupId: selectedGroupId !== 'all' ? parseInt(selectedGroupId, 10) : undefined,
        active: selectedStatus !== '' ? selectedStatus === 'true' : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      setMenus(res.items || []);
      const totalCount = res.total ?? res.totalItems ?? 0;
      setPagination((prev) => ({ ...prev, total: totalCount }));
      setTotalPages(res.totalPages || Math.ceil(totalCount / pagination.pageSize) || 1);
    } catch (err: any) {
      console.error('Gagal memuat daftar menu:', err);
      setError(err?.message || 'Gagal memuat daftar menu dari server.');
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    debouncedSearch,
    selectedGroupId,
    selectedStatus,
    sortConfig.key,
    sortConfig.direction,
  ]);

  useEffect(() => {
    loadMenus();
  }, [loadMenus]);

  // Reaktif terhadap perubahan menu dan grup menu
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'menu') {
      loadMenus();
    } else if (payload?.entity === 'menu-group') {
      loadGroupsList();
      loadMenus();
    }
  });

  const toggleSort = (columnKey: string) => {
    setSortConfig((prev) => ({
      key: columnKey,
      direction:
        prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Handler Buka Modal Tambah
  const handleOpenCreateModal = () => {
    setEditingMenu(null);
    const defaultGroupId =
      selectedGroupId !== 'all' ? parseInt(selectedGroupId, 10) : groups[0]?.id || 0;

    setFormData({
      groupId: defaultGroupId,
      menuCode: '',
      menuName: '',
      urlPrefix: '',
      sortOrder: (pagination.total + 1) * 10,
      icon: 'Box',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handler Buka Modal Ubah
  const handleOpenEditModal = (menu: MenuItem) => {
    setEditingMenu(menu);
    setFormData({
      groupId: menu.groupId,
      menuCode: menu.menuCode,
      menuName: menu.menuName,
      urlPrefix: menu.urlPrefix || '',
      sortOrder: menu.sortOrder,
      icon: menu.icon || '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Validasi Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.groupId || formData.groupId <= 0) {
      errors.groupId = 'Grup menu induk wajib dipilih.';
    }

    if (!editingMenu) {
      if (!formData.menuCode.trim()) {
        errors.menuCode = 'Kode menu wajib diisi.';
      } else if (!/^[a-z0-9-]+$/.test(formData.menuCode.trim())) {
        errors.menuCode = 'Kode menu harus huruf kecil, angka, atau tanda hubung (-).';
      }
    }

    if (!formData.menuName.trim()) {
      errors.menuName = 'Nama menu wajib diisi.';
    }

    if (!formData.urlPrefix.trim()) {
      errors.urlPrefix = 'URL prefix wajib diisi (contoh: /pesanan).';
    }

    if (formData.sortOrder < 0) {
      errors.sortOrder = 'Urutan tidak boleh bernilai negatif.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form Tambah / Ubah
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (editingMenu) {
        // Update
        const payload: UpdateMenuInput = {
          groupId: Number(formData.groupId),
          menuName: formData.menuName.trim(),
          urlPrefix: formData.urlPrefix.trim(),
          sortOrder: Number(formData.sortOrder),
          icon: formData.icon.trim() || null,
          version: editingMenu.version,
        };
        await menuApi.update(editingMenu.id, payload);
        publish(MFE_EVENTS.NOTIFICATION_SHOW, {
          type: 'success',
          title: 'Menu Diperbarui',
          message: `Menu "${formData.menuName}" berhasil diperbarui.`,
        });
      } else {
        // Create
        const payload: CreateMenuInput = {
          groupId: Number(formData.groupId),
          menuCode: formData.menuCode.trim(),
          menuName: formData.menuName.trim(),
          urlPrefix: formData.urlPrefix.trim(),
          sortOrder: Number(formData.sortOrder),
          icon: formData.icon.trim() || null,
        };
        await menuApi.create(payload);
        publish(MFE_EVENTS.NOTIFICATION_SHOW, {
          type: 'success',
          title: 'Menu Dibuat',
          message: `Menu "${formData.menuName}" berhasil ditambahkan.`,
        });
      }

      setIsFormModalOpen(false);
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      publish(MFE_EVENTS.DATA_UPDATED, {
        entity: 'menu',
        action: editingMenu ? 'update' : 'create',
      });
      await loadMenus();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Operasi Gagal',
        message: err?.message || 'Terjadi kesalahan saat memproses data.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (menu: MenuItem) => {
    const newStatus = !menu.isActive;
    const statusLabel = newStatus ? 'mengaktifkan' : 'menonaktifkan';

    try {
      await menuApi.toggleStatus(menu.id, newStatus);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Status Diperbarui',
        message: `Menu "${menu.menuName}" berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      publish(MFE_EVENTS.DATA_UPDATED, {
        entity: 'menu',
        action: 'status',
      });
      await loadMenus();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Gagal Ubah Status',
        message: err?.message || `Gagal ${statusLabel} menu.`,
      });
    }
  };

  // Submit Hapus Permanen
  const handleDeleteSubmit = async () => {
    if (!deletingMenu) return;

    setIsDeleting(true);
    try {
      await menuApi.delete(deletingMenu.id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Menu Dihapus',
        message: `Menu "${deletingMenu.menuName}" berhasil dihapus permanen.`,
      });
      setDeletingMenu(null);
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      publish(MFE_EVENTS.DATA_UPDATED, {
        entity: 'menu',
        action: 'delete',
      });
      await loadMenus();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Gagal Menghapus',
        message: err?.message || 'Terjadi kesalahan saat menghapus menu.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<DataTableColumn<MenuItem>[]>(
    () => [
      {
        key: 'no',
        label: '#',
        align: 'center',
        width: 'w-14',
        className: 'text-center text-xs text-gray-400 font-mono whitespace-nowrap',
        render: (_, __, idx) => (pagination.page - 1) * pagination.pageSize + idx + 1,
      },
      {
        key: 'actions',
        label: 'Aksi',
        align: 'center',
        width: 'w-28',
        render: (_, m) => (
          <div className="inline-flex items-center justify-center gap-1">
            {canToggleStatus && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleStatus(m)}
                    className={cn(
                      'h-8 w-8',
                      m.isActive
                        ? 'hover:text-amber-600 hover:bg-amber-50 text-emerald-600'
                        : 'hover:text-emerald-600 hover:bg-emerald-50 text-gray-400'
                    )}
                  >
                    {m.isActive ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{m.isActive ? 'Nonaktifkan Menu' : 'Aktifkan Menu'}</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditModal(m)}
                    className="h-8 w-8 hover:text-orange-600 hover:bg-orange-50"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Ubah Menu</p>
                </TooltipContent>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingMenu(m)}
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
        ),
      },
      {
        key: 'sortOrder',
        label: 'Urutan',
        sortable: true,
        align: 'center',
        width: 'w-24',
        className: 'font-mono font-medium text-slate-500 whitespace-nowrap',
      },
      {
        key: 'menuName',
        label: 'Nama Menu',
        sortable: true,
        render: (_, m) => (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
              {React.createElement(resolveLucideIcon(m.icon, Box), { className: 'w-4 h-4' })}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{m.menuName}</div>
              {m.icon && (
                <div className="text-[10px] text-gray-400 font-mono">
                  icon: {m.icon}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'menuCode',
        label: 'Kode Menu',
        sortable: true,
        width: 'w-36',
        className: 'font-mono text-gray-700 font-medium whitespace-nowrap',
      },
      {
        key: 'groupName',
        label: 'Grup Induk',
        sortable: true,
        width: 'w-44',
        render: (_, m) => (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <FolderTree className="h-3 w-3 text-gray-400" />
            <span>{m.groupName || 'Tanpa Grup'}</span>
          </span>
        ),
      },
      {
        key: 'fullPath',
        label: 'Path URL',
        className: 'font-mono text-gray-600 text-xs whitespace-nowrap',
        render: (_, m) => m.fullPath || m.urlPrefix || '-',
      },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        align: 'center',
        width: 'w-28',
        render: (value) =>
          value ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              <span>Aktif</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
              <XCircle className="w-3 h-3 flex-shrink-0" />
              <span>Nonaktif</span>
            </span>
          ),
      },
    ],
    [pagination.page, pagination.pageSize, canToggleStatus, canUpdate, canDelete]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Master Menu
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 tabular-nums">
                  {pagination.total} Menu
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola daftar rute modul dan halaman sistem yang terdaftar di basis data.
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
                onClick={() => loadMenus()}
                className="gap-1.5 cursor-pointer text-xs text-slate-600 h-9 px-3"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ambil data terbaru dari API backend</p>
            </TooltipContent>
          </Tooltip>

          {canCreate && (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenCreateModal}
              className="gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white cursor-pointer shadow-xs h-9 px-3.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Menu</span>
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
          <Button variant="destructive" size="sm" onClick={() => loadMenus()}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Filter & Toolbar Card */}
      <Card className="p-4 sm:p-5 shadow-xs border border-gray-200/90 bg-white rounded-xl">
        <div className="flex flex-col md:flex-row flex-wrap lg:flex-nowrap items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kode, nama, path, atau grup..."
              className="!pl-10 h-10 text-sm bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:ring-2 focus:ring-orange-500 w-full"
            />
          </div>

          {/* Filter Grup Menu Dinamis */}
          <div className="w-full sm:w-52 shrink-0">
            <select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              aria-label="Filter berdasarkan grup menu"
              className="w-full h-10 !px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 cursor-pointer"
            >
              <option value="all">Semua Grup ({groups.length})</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id.toString()}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status Dinamis */}
          <div className="w-full sm:w-40 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              aria-label="Filter status menu"
              className="w-full h-10 !px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>

          {/* Sorting Dropdown */}
          <div className="w-full sm:w-52 shrink-0">
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split('-');
                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              aria-label="Urutkan menu"
              className="w-full h-10 !px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 cursor-pointer"
            >
              <option value="sortOrder-asc">Urutan (Kecil - Besar)</option>
              <option value="sortOrder-desc">Urutan (Besar - Kecil)</option>
              <option value="menuName-asc">Nama Menu (A - Z)</option>
              <option value="menuName-desc">Nama Menu (Z - A)</option>
              <option value="menuCode-asc">Kode Menu (A - Z)</option>
              <option value="menuCode-desc">Kode Menu (Z - A)</option>
              <option value="groupName-asc">Grup Induk (A - Z)</option>
              <option value="groupName-desc">Grup Induk (Z - A)</option>
              <option value="createdAt-desc">Terbaru Dibuat</option>
              <option value="createdAt-asc">Terlama Dibuat</option>
            </select>
          </div>
        </div>

        {/* Notifikasi Standar Pencarian & Filter */}
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          <SearchNotification
            total={pagination.total}
            itemLabel="menu"
            search={debouncedSearch}
            category={
              selectedGroupId !== 'all'
                ? groups.find((g) => g.id.toString() === selectedGroupId)?.groupName
                : selectedStatus === 'true'
                ? 'Aktif'
                : selectedStatus === 'false'
                ? 'Nonaktif'
                : undefined
            }
            sortKey={`${sortConfig.key}-${sortConfig.direction}`}
          />
        </div>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={menus}
        pagination={pagination}
        onPaginationChange={setPagination}
        sortConfig={sortConfig}
        onSortChange={(newSort) => {
          setSortConfig(newSort);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        isLoading={isLoading}
        itemLabel="menu"
        emptyMessage="Tidak ada menu ditemukan"
        emptyDescription={
          debouncedSearch || selectedGroupId !== 'all' || selectedStatus !== ''
            ? 'Tidak ditemukan menu yang cocok dengan kata kunci atau filter saat ini.'
            : 'Belum ada menu yang terdaftar di basis data.'
        }
      />

      {/* Modal Tambah / Ubah */}
      {isFormModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center">
                  <FilePlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingMenu ? 'Ubah Menu Sistem' : 'Tambah Menu Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingMenu
                      ? `Perbarui informasi menu "${editingMenu.menuName}"`
                      : 'Lengkapi formulir untuk mendaftarkan modul menu baru'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSubmitting}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700"
              >
                ✕
              </Button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grup Menu Induk <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.groupId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, groupId: parseInt(e.target.value, 10) }))
                  }
                  disabled={isSubmitting}
                  className={`w-full h-9 px-3 rounded-lg border bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 ${
                    formErrors.groupId ? 'border-rose-400' : 'border-slate-200'
                  }`}
                >
                  <option value={0}>-- Pilih Grup Menu --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName} ({g.groupCode})
                    </option>
                  ))}
                </select>
                {formErrors.groupId && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.groupId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Menu <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="contoh: rekap-pembayaran"
                  value={formData.menuCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, menuCode: e.target.value.toLowerCase() }))
                  }
                  disabled={!!editingMenu || isSubmitting}
                  className={`text-xs font-mono ${formErrors.menuCode ? 'border-rose-400' : ''}`}
                />
                {formErrors.menuCode ? (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.menuCode}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {editingMenu
                      ? 'Kode menu bersifat unik dan permanen.'
                      : 'Unik, huruf kecil dengan tanda hubung (contoh: laporan-stok, audit-trail).'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Menu <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="contoh: Rekap Pembayaran"
                  value={formData.menuName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, menuName: e.target.value }))}
                  disabled={isSubmitting}
                  className={`text-xs ${formErrors.menuName ? 'border-rose-400' : ''}`}
                />
                {formErrors.menuName && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.menuName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Prefix <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="contoh: /rekap-pembayaran"
                    value={formData.urlPrefix}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, urlPrefix: e.target.value }))
                    }
                    disabled={isSubmitting}
                    className={`text-xs font-mono ${formErrors.urlPrefix ? 'border-rose-400' : ''}`}
                  />
                  {formErrors.urlPrefix ? (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.urlPrefix}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Sub-path rute halaman modul ini.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urutan Tampil
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))
                    }
                    disabled={isSubmitting}
                    className={`text-xs ${formErrors.sortOrder ? 'border-rose-400' : ''}`}
                  />
                  {formErrors.sortOrder && (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.sortOrder}</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Icon Lucide
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    <span>Preview:</span>
                    {React.createElement(resolveLucideIcon(formData.icon, Box), { className: 'w-3.5 h-3.5 text-orange-600' })}
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="contoh: Package, FileText, ShoppingBag, Users"
                  value={formData.icon}
                  onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                  disabled={isSubmitting}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Nama icon resmi Lucide (PascalCase atau kebab-case). Fallback: Box.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  disabled={isSubmitting}
                  className="text-xs bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSubmitting && <LoadingSpinner size="sm" />}
                  <span>{editingMenu ? 'Simpan Perubahan' : 'Buat Menu'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingMenu && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Menu
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi tindakan permanen</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus menu{' '}
              <span className="font-bold text-slate-900">"{deletingMenu.menuName}"</span> (kode:{' '}
              <span className="font-mono text-slate-800">{deletingMenu.menuCode}</span>)?
            </p>
            <p className="text-[11px] text-slate-400">
              Penghapusan menu juga akan mencabut pemetaan hak akses peran yang terhubung ke menu ini.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingMenu(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"
              >
                {isDeleting && <LoadingSpinner size="sm" />}
                <span>Hapus Permanen</span>
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MenuIndex;
