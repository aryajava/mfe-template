import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
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
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  LoadingSpinner,
  useAuth,
  useEventBus,
  useEventSubscription,
  MFE_EVENTS,
  resolveLucideIcon,
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

  // State Data
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [groups, setGroups] = useState<MenuGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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

  // Fetch Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [menuList, groupList] = await Promise.all([
        menuApi.getAll(),
        menuGroupApi.getAll(),
      ]);
      setMenus(menuList || []);
      setGroups(groupList || []);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar menu sistem.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reaktif terhadap perubahan menu dan grup menu
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'menu' || payload?.entity === 'menu-group') {
      loadData();
    }
  });

  // Filtering Logic
  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      const matchSearch =
        m.menuName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.menuCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.urlPrefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.groupName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGroup =
        selectedGroupId === 'all'
          ? true
          : m.groupId.toString() === selectedGroupId;

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? m.isActive
          : !m.isActive;

      return matchSearch && matchGroup && matchStatus;
    });
  }, [menus, searchTerm, selectedGroupId, statusFilter]);

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
      sortOrder: (menus.length + 1) * 10,
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
      await loadData();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        title: 'Operasi Gagal',
        message: err?.message || 'Terjadi kesalahan saat memproses data menu.',
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
      await loadData();
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
      await loadData();
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
                  {menus.length} Menu
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola daftar rute modul dan halaman sistem yang terdaftar di basis data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer h-9 px-3"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>

          {canCreate && (
            <Button
              variant="default"
              size="sm"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white cursor-pointer shadow-xs h-9 px-3.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Menu</span>
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Filter Card */}
      <Card className="border-slate-200 shadow-xs">
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari kode, nama, path, grup..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filters: Grup & Status */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Grup:</span>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                aria-label="Filter berdasarkan grup menu"
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="all">Semua Grup ({groups.length})</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id.toString()}>
                    {g.groupName}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter status menu"
                className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="all">Semua Status</option>
                <option value="active">Aktif Saja</option>
                <option value="inactive">Nonaktif Saja</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-16 text-center">Urutan</th>
                <th className="py-3 px-4">Nama Menu</th>
                <th className="py-3 px-4">Kode Menu</th>
                <th className="py-3 px-4">Grup Induk</th>
                <th className="py-3 px-4">Path URL</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <LoadingSpinner size="md" />
                      <p className="text-xs">Memuat daftar menu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredMenus.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <p className="text-sm font-medium">Tidak ada menu yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba sesuaikan kata kunci pencarian atau filter pilihan
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMenus.map((m) => (
                  <tr
                    key={m.id}
                    className="hover:bg-slate-50/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-500">
                      {m.sortOrder}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                          {React.createElement(resolveLucideIcon(m.icon, Box), { className: 'w-4 h-4' })}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{m.menuName}</div>
                          {m.icon && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              icon: {m.icon}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {m.menuCode}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                        <FolderTree className="h-3 w-3 text-slate-400" />
                        <span>{m.groupName || 'Tanpa Grup'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {m.fullPath || m.urlPrefix || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {m.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Aktif</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="h-3 w-3" />
                          <span>Nonaktif</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canToggleStatus && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(m)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                              >
                                {m.isActive ? (
                                  <ToggleRight className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-slate-400" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {m.isActive ? 'Nonaktifkan menu' : 'Aktifkan menu'}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {canUpdate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(m)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-teal-600"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ubah data menu</TooltipContent>
                          </Tooltip>
                        )}

                        {canDelete && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingMenu(m)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Hapus menu</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
                  className={`w-full h-9 px-3 rounded-lg border bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
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
                    {React.createElement(resolveLucideIcon(formData.icon, Box), { className: 'w-3.5 h-3.5 text-teal-600' })}
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
