import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Layers,
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
  FolderPlus,
  ShieldAlert,
  Boxes,
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
import { menuGroupApi } from '../../services/menuGroupApi';
import {
  MenuGroupItem,
  CreateMenuGroupInput,
  UpdateMenuGroupInput,
} from '../../types/menuGroup';

export const GrupMenuIndex: React.FC = () => {
  const { canPerformAction } = useAuth();
  const { publish } = useEventBus();

  const canCreate =
    canPerformAction('master-grup-menu', 'create') || canPerformAction('grup-menu', 'create');
  const canUpdate =
    canPerformAction('master-grup-menu', 'update') || canPerformAction('grup-menu', 'update');
  const canDelete =
    canPerformAction('master-grup-menu', 'delete') || canPerformAction('grup-menu', 'delete');
  const canToggleStatus =
    canPerformAction('master-grup-menu', 'status') || canPerformAction('grup-menu', 'status');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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
  const [groups, setGroups] = useState<MenuGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Form State (Tambah / Ubah)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<MenuGroupItem | null>(null);
  const [formData, setFormData] = useState<{
    groupCode: string;
    groupName: string;
    urlPrefix: string;
    mfeKey: string;
    sortOrder: number;
    icon: string;
  }>({
    groupCode: '',
    groupName: '',
    urlPrefix: '',
    mfeKey: '',
    sortOrder: 10,
    icon: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Hapus State
  const [deletingGroup, setDeletingGroup] = useState<MenuGroupItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Data Server-Side Paged
  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await menuGroupApi.getPaged({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch.trim() || undefined,
        active: selectedStatus !== '' ? selectedStatus === 'true' : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      setGroups(res.items || []);
      const totalCount = res.total ?? res.totalItems ?? 0;
      setPagination((prev) => ({ ...prev, total: totalCount }));
      setTotalPages(res.totalPages || Math.ceil(totalCount / pagination.pageSize) || 1);
    } catch (err: any) {
      console.error('Gagal memuat daftar grup menu:', err);
      setError(err?.message || 'Gagal memuat daftar grup menu dari server.');
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
    loadGroups();
  }, [loadGroups]);

  // Reaktif terhadap perubahan grup menu dari tab/jendela lain
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'menu-group') {
      loadGroups();
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
    setEditingGroup(null);
    setFormData({
      groupCode: '',
      groupName: '',
      urlPrefix: '',
      mfeKey: '',
      sortOrder: (pagination.total + 1) * 10,
      icon: 'Layers',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Handler Buka Modal Ubah
  const handleOpenEditModal = (group: MenuGroupItem) => {
    setEditingGroup(group);
    setFormData({
      groupCode: group.groupCode,
      groupName: group.groupName,
      urlPrefix: group.urlPrefix || '',
      mfeKey: group.mfeKey || '',
      sortOrder: group.sortOrder,
      icon: group.icon || '',
    });
    setFormErrors({});
    setIsFormModalOpen(true);
  };

  // Validasi Form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editingGroup) {
      if (!formData.groupCode.trim()) {
        errors.groupCode = 'Kode grup wajib diisi.';
      } else if (!/^[a-z0-9-]+$/.test(formData.groupCode.trim())) {
        errors.groupCode = 'Kode grup harus huruf kecil, angka, atau tanda hubung (-).';
      }
    }

    if (!formData.groupName.trim()) {
      errors.groupName = 'Nama grup wajib diisi.';
    }

    if (formData.mfeKey.trim()) {
      if (!/^[a-z0-9-]+$/.test(formData.mfeKey.trim().toLowerCase())) {
        errors.mfeKey = 'MFE Key harus huruf kecil, angka, atau tanda hubung (-).';
      }
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
      if (editingGroup) {
        // Update
        const payload: UpdateMenuGroupInput = {
          groupName: formData.groupName.trim(),
          urlPrefix: formData.urlPrefix.trim(),
          mfeKey: formData.mfeKey.trim() ? formData.mfeKey.trim().toLowerCase() : null,
          sortOrder: Number(formData.sortOrder),
          icon: formData.icon.trim() || null,
          version: editingGroup.version,
        };
        await menuGroupApi.update(editingGroup.id, payload);
        publish(MFE_EVENTS.NOTIFICATION_SHOW, {
          type: 'success',
          title: 'Grup Menu Diperbarui',
          message: `Grup menu "${formData.groupName}" berhasil diperbarui.`,
        });
      } else {
        // Create
        const payload: CreateMenuGroupInput = {
          groupCode: formData.groupCode.trim(),
          groupName: formData.groupName.trim(),
          urlPrefix: formData.urlPrefix.trim(),
          mfeKey: formData.mfeKey.trim() ? formData.mfeKey.trim().toLowerCase() : null,
          sortOrder: Number(formData.sortOrder),
          icon: formData.icon.trim() || null,
        };
        await menuGroupApi.create(payload);
        publish(MFE_EVENTS.NOTIFICATION_SHOW, {
          type: 'success',
          title: 'Grup Menu Dibuat',
          message: `Grup menu "${formData.groupName}" berhasil ditambahkan.`,
        });
      }

      setIsFormModalOpen(false);
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      publish(MFE_EVENTS.DATA_UPDATED, {
        entity: 'menu-group',
        action: editingGroup ? 'update' : 'create',
      });
      await loadGroups();
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
  const handleToggleStatus = async (group: MenuGroupItem) => {
    const newStatus = !group.isActive;
    const statusLabel = newStatus ? 'mengaktifkan' : 'menonaktifkan';

    try {
      await menuGroupApi.toggleStatus(group.id, newStatus);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Status Diperbarui',
        message: `Grup menu "${group.groupName}" berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
      });
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      publish(MFE_EVENTS.DATA_UPDATED, {
        entity: 'menu-group',
        action: 'status',
      });
      await loadGroups();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Gagal Ubah Status',
        message: err?.message || `Gagal ${statusLabel} grup menu.`,
      });
    }
  };

  // Submit Hapus Permanen
  const handleDeleteSubmit = async () => {
    if (!deletingGroup) return;

    setIsDeleting(true);
    try {
      await menuGroupApi.delete(deletingGroup.id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Grup Menu Dihapus',
        message: `Grup menu "${deletingGroup.groupName}" berhasil dihapus permanen.`,
      });
      setDeletingGroup(null);
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      publish(MFE_EVENTS.DATA_UPDATED, {
        entity: 'menu-group',
        action: 'delete',
      });
      await loadGroups();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Gagal Menghapus',
        message: err?.message || 'Terjadi kesalahan saat menghapus grup menu.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<DataTableColumn<MenuGroupItem>[]>(
    () => [
      {
        key: 'no',
        label: 'No',
        align: 'center',
        width: 'w-14',
        className: 'text-xs text-slate-500 font-mono',
        render: (_, __, index) => (pagination.page - 1) * pagination.pageSize + index + 1,
      },
      {
        key: 'sortOrder',
        label: 'Urutan',
        sortable: true,
        align: 'center',
        width: 'w-20',
        className: 'font-mono text-slate-600',
      },
      {
        key: 'groupName',
        label: 'Nama Grup',
        sortable: true,
        render: (_, row) => (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              {React.createElement(resolveLucideIcon(row.icon, Layers), { className: 'w-4 h-4' })}
            </div>
            <div>
              <div className="font-semibold text-slate-900">{row.groupName}</div>
              {row.icon && (
                <div className="text-[10px] text-slate-400 font-mono">
                  icon: {row.icon}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        key: 'groupCode',
        label: 'Kode Grup',
        sortable: true,
        className: 'font-mono text-slate-700 font-medium',
      },
      {
        key: 'urlPrefix',
        label: 'Prefix URL',
        className: 'font-mono text-slate-600',
        render: (value) => value || '-',
      },
      {
        key: 'mfeKey',
        label: 'Micro Frontend',
        render: (value) =>
          value ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-orange-50 text-orange-700 border border-orange-200">
              <Boxes className="h-3 w-3 text-orange-500" />
              <span>{value}</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
              Belum Terhubung
            </span>
          ),
      },
      {
        key: 'menuCount',
        label: 'Menu',
        align: 'center',
        render: (value) => (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {value} menu
          </span>
        ),
      },
      {
        key: 'isActive',
        label: 'Status',
        sortable: true,
        align: 'center',
        render: (value) =>
          value ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3" />
              <span>Aktif</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
              <XCircle className="h-3 w-3" />
              <span>Nonaktif</span>
            </span>
          ),
      },
      {
        key: 'actions',
        label: 'Aksi',
        align: 'center',
        width: 'w-28',
        render: (_, row) => (
          <div className="flex items-center justify-center gap-1">
            {canToggleStatus && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStatus(row)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                  >
                    {row.isActive ? (
                      <ToggleRight className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {row.isActive ? 'Nonaktifkan grup menu' : 'Aktifkan grup menu'}
                </TooltipContent>
              </Tooltip>
            )}

            {canUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditModal(row)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-orange-600"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ubah grup menu</TooltipContent>
              </Tooltip>
            )}

            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingGroup(row)}
                    className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Hapus grup menu</TooltipContent>
              </Tooltip>
            )}
          </div>
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
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Master Grup Menu
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 tabular-nums">
                  {pagination.total} Grup
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola kelompok menu navigasi utama pada panel navigasi sistem.
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
                onClick={() => loadGroups()}
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
              <span>Tambah Grup Menu</span>
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
          <Button variant="destructive" size="sm" onClick={() => loadGroups()}>
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
              placeholder="Cari kode, nama, atau url prefix..."
              className="!pl-10 h-10 text-sm bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:ring-2 focus:ring-orange-500 w-full"
            />
          </div>

          {/* Filter Status Dinamis */}
          <div className="w-full sm:w-44 shrink-0">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              aria-label="Filter status grup menu"
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
              aria-label="Urutkan grup menu"
              className="w-full h-10 !px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 cursor-pointer"
            >
              <option value="sortOrder-asc">Urutan (Kecil - Besar)</option>
              <option value="sortOrder-desc">Urutan (Besar - Kecil)</option>
              <option value="groupName-asc">Nama Grup (A - Z)</option>
              <option value="groupName-desc">Nama Grup (Z - A)</option>
              <option value="groupCode-asc">Kode Grup (A - Z)</option>
              <option value="groupCode-desc">Kode Grup (Z - A)</option>
              <option value="createdAt-desc">Terbaru Dibuat</option>
              <option value="createdAt-asc">Terlama Dibuat</option>
            </select>
          </div>
        </div>

        {/* Notifikasi Standar Pencarian & Filter */}
        <div className="mt-3 pt-2.5 border-t border-gray-100">
          <SearchNotification
            total={pagination.total}
            itemLabel="grup menu"
            search={debouncedSearch}
            category={selectedStatus === 'true' ? 'Aktif' : selectedStatus === 'false' ? 'Nonaktif' : undefined}
            sortKey={`${sortConfig.key}-${sortConfig.direction}`}
          />
        </div>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={groups}
        pagination={pagination}
        onPaginationChange={setPagination}
        sortConfig={sortConfig}
        onSortChange={(newSort) => {
          setSortConfig(newSort);
          setPagination((prev) => ({ ...prev, page: 1 }));
        }}
        isLoading={isLoading}
        itemLabel="grup menu"
        emptyMessage="Tidak ada grup menu ditemukan"
        emptyDescription={
          searchTerm || selectedStatus
            ? 'Tidak ada data grup menu yang cocok dengan kata kunci atau filter status.'
            : 'Belum ada grup menu yang terdaftar di sistem.'
        }
      />

      {/* Modal Tambah / Ubah */}
      {isFormModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center">
                  <FolderPlus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingGroup ? 'Ubah Grup Menu' : 'Tambah Grup Menu Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingGroup
                      ? `Perbarui informasi grup menu "${editingGroup.groupName}"`
                      : 'Lengkapi formulir untuk membuat kelompok menu navigasi baru'}
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
                  Kode Grup <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="contoh: keuangan"
                  value={formData.groupCode}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, groupCode: e.target.value.toLowerCase() }))
                  }
                  disabled={!!editingGroup || isSubmitting}
                  className={`text-xs font-mono ${formErrors.groupCode ? 'border-rose-400' : ''}`}
                />
                {formErrors.groupCode ? (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.groupCode}</p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {editingGroup
                      ? 'Kode grup bersifat unik dan permanen.'
                      : 'Unik, huruf kecil tanpa spasi (contoh: operasional, keuangan).'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Grup <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="contoh: Keuangan dan Penagihan"
                  value={formData.groupName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, groupName: e.target.value }))
                  }
                  disabled={isSubmitting}
                  className={`text-xs ${formErrors.groupName ? 'border-rose-400' : ''}`}
                />
                {formErrors.groupName && (
                  <p className="text-[11px] text-rose-500 mt-1">{formErrors.groupName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Prefix
                  </label>
                  <Input
                    type="text"
                    placeholder="contoh: /keuangan"
                    value={formData.urlPrefix}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, urlPrefix: e.target.value }))
                    }
                    disabled={isSubmitting}
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Awalan subpath rute navigasi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MFE Key
                  </label>
                  <Input
                    type="text"
                    list="mfe-key-options"
                    placeholder="pilih / ketik mfeKey"
                    value={formData.mfeKey}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, mfeKey: e.target.value.toLowerCase() }))
                    }
                    disabled={isSubmitting}
                    className={`text-xs font-mono ${formErrors.mfeKey ? 'border-rose-400' : ''}`}
                  />
                  <datalist id="mfe-key-options">
                    <option value="master">MFE Master (Katalog & Data Induk)</option>
                    <option value="trx">MFE Trx (Transaksi & Operasional)</option>
                    <option value="monitor">MFE Monitor (Monitoring & Persetujuan)</option>
                    <option value="report">MFE Report (Laporan & Cetak)</option>
                    <option value="maintain">MFE Maintain (Pengaturan & Menu)</option>
                    <option value="child">Child MFE Starter</option>
                    <option value="hallo">MFE Hallo Demo</option>
                  </datalist>
                  {formErrors.mfeKey ? (
                    <p className="text-[11px] text-rose-500 mt-1">{formErrors.mfeKey}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">
                      Kunci mapping ke remote MFE fisik (opsional).
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Icon Lucide
                    </label>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      <span>Preview:</span>
                      {React.createElement(resolveLucideIcon(formData.icon, Layers), { className: 'w-3.5 h-3.5 text-orange-600' })}
                    </div>
                  </div>
                  <Input
                    type="text"
                    placeholder="contoh: Layers, Database, ShoppingBag, Settings"
                    value={formData.icon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
                    disabled={isSubmitting}
                    className="text-xs font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Nama icon resmi Lucide (PascalCase atau kebab-case). Fallback: Layers.
                  </p>
                </div>
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
                  <span>{editingGroup ? 'Simpan Perubahan' : 'Buat Grup Menu'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Konfirmasi Hapus */}
      {deletingGroup && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Hapus Grup Menu
                </h3>
                <p className="text-xs text-slate-500">Konfirmasi tindakan permanen</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus grup menu{' '}
              <span className="font-bold text-slate-900">"{deletingGroup.groupName}"</span> (kode:{' '}
              <span className="font-mono text-slate-800">{deletingGroup.groupCode}</span>)?
            </p>

            {deletingGroup.menuCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <p>
                  Grup ini masih memiliki <span className="font-bold">{deletingGroup.menuCount} menu</span> terdaftar. Pindahkan atau hapus menu tersebut terlebih dahulu sebelum menghapus grup ini.
                </p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingGroup(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSubmit}
                disabled={isDeleting || deletingGroup.menuCount > 0}
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

export default GrupMenuIndex;
