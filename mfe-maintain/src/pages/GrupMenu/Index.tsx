import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
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
  useAuth,
  useEventBus,
  useEventSubscription,
  MFE_EVENTS,
  resolveLucideIcon,
} from '@template/shared';
import { menuGroupApi } from '../../services/menuGroupApi';
import { MenuGroupItem, CreateMenuGroupInput, UpdateMenuGroupInput } from '../../types/menuGroup';

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

  // State Data
  const [groups, setGroups] = useState<MenuGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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

  // Fetch Data
  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await menuGroupApi.getAll();
      setGroups(data || []);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat daftar grup menu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // Reaktif terhadap perubahan grup menu dari tab/jendela lain
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'menu-group') {
      loadGroups();
    }
  });

  // Filtering Logic
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchSearch =
        g.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.groupCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.urlPrefix.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? g.isActive
          : !g.isActive;

      return matchSearch && matchStatus;
    });
  }, [groups, searchTerm, statusFilter]);

  // Handler Buka Modal Tambah
  const handleOpenCreateModal = () => {
    setEditingGroup(null);
    setFormData({
      groupCode: '',
      groupName: '',
      urlPrefix: '',
      mfeKey: '',
      sortOrder: (groups.length + 1) * 10,
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
                  {groups.length} Grup
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola kelompok menu navigasi utama pada panel navigasi sistem.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadGroups}
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
              <span>Tambah Grup Menu</span>
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
          <Button variant="outline" size="sm" onClick={loadGroups} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Filter & Controls Card */}
      <Card className="border-slate-200 shadow-xs">
        <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari kode, nama, atau url prefix..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter status grup menu"
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif Saja</option>
              <option value="inactive">Nonaktif Saja</option>
            </select>
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
                <th className="py-3 px-4">Nama Grup</th>
                <th className="py-3 px-4">Kode Grup</th>
                <th className="py-3 px-4">URL Prefix</th>
                <th className="py-3 px-4">MFE Key</th>
                <th className="py-3 px-4 text-center">Jumlah Menu</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <LoadingSpinner size="md" />
                      <p className="text-xs">Memuat daftar grup menu...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <p className="text-sm font-medium">Tidak ada grup menu yang cocok</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Coba ubah kata kunci pencarian atau filter status
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGroups.map((g) => (
                  <tr
                    key={g.id}
                    className="hover:bg-slate-50/60 transition-colors duration-150"
                  >
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-500">
                      {g.sortOrder}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          {React.createElement(resolveLucideIcon(g.icon, Layers), { className: 'w-4 h-4' })}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{g.groupName}</div>
                          {g.icon && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              icon: {g.icon}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                      {g.groupCode}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {g.urlPrefix || '-'}
                    </td>
                    <td className="py-3 px-4">
                      {g.mfeKey ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Boxes className="h-3 w-3 text-indigo-500" />
                          <span>{g.mfeKey}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Belum Terhubung
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                        {g.menuCount} menu
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {g.isActive ? (
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
                                onClick={() => handleToggleStatus(g)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800"
                              >
                                {g.isActive ? (
                                  <ToggleRight className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-slate-400" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {g.isActive ? 'Nonaktifkan grup menu' : 'Aktifkan grup menu'}
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {canUpdate && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(g)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
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
                                onClick={() => setDeletingGroup(g)}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Hapus grup menu</TooltipContent>
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
                      {React.createElement(resolveLucideIcon(formData.icon, Layers), { className: 'w-3.5 h-3.5 text-indigo-600' })}
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
