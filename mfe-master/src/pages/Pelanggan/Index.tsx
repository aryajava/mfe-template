import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  UserX,
  UserCheck,
  Eye,
  EyeOff,
  X,
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
  useEventSubscription,
  MFE_EVENTS,
  cn,
  type PaginationConfig,
  type SortConfig,
} from '@template/shared';
import { customerApi } from '../../services/customerApi';
import { CustomerItem } from '../../types/pelanggan';

export const PelangganIndex: React.FC = () => {
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { canPerformAction } = useAuth();

  const canUpdate = canPerformAction('master-pelanggan', 'update');
  const canDelete = canPerformAction('master-pelanggan', 'delete');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(''); // '' = Semua, 'true' = Aktif, 'false' = Nonaktif
  const [selectedBlocked, setSelectedBlocked] = useState<string>(''); // '' = Semua, 'true' = Diblokir, 'false' = Tidak
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 1,
    pageSize: 10,
    total: 0,
  });
  const [totalPages, setTotalPages] = useState(1);

  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [blockModalTarget, setBlockModalTarget] = useState<CustomerItem | null>(null);
  const [unblockModalTarget, setUnblockModalTarget] = useState<CustomerItem | null>(null);
  const [activeModalTarget, setActiveModalTarget] = useState<CustomerItem | null>(null);
  const [resetModalTarget, setResetModalTarget] = useState<CustomerItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [releaseModalTarget, setReleaseModalTarget] = useState<CustomerItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Customers
  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await customerApi.getPaged({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        active: selectedStatus !== '' ? selectedStatus === 'true' : undefined,
        blocked: selectedBlocked !== '' ? selectedBlocked === 'true' : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      setCustomers(res.items || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
      }));
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      const msg = err?.message || 'Gagal memuat daftar pelanggan.';
      setErrorMessage(msg);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.pageSize,
    debouncedSearch,
    selectedStatus,
    selectedBlocked,
    sortConfig,
    publish,
  ]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Reaktif terhadap perubahan data pelanggan
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'customer') {
      fetchCustomers();
    }
  });

  // Sorting handler
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Reset filters
  const handleResetFilter = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedStatus('');
    setSelectedBlocked('');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Action Handlers
  const handleExecuteBlock = async () => {
    if (!blockModalTarget) return;
    setIsProcessingAction(true);
    showLoading();
    try {
      await customerApi.block(blockModalTarget.id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Pelanggan "${blockModalTarget.display}" berhasil diblokir.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'customer', action: 'block', id: blockModalTarget.id });
      setBlockModalTarget(null);
      fetchCustomers();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal memblokir pelanggan.',
      });
    } finally {
      setIsProcessingAction(false);
      hideLoading();
    }
  };

  const handleExecuteUnblock = async () => {
    if (!unblockModalTarget) return;
    setIsProcessingAction(true);
    showLoading();
    try {
      await customerApi.unblock(unblockModalTarget.id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Blokir pelanggan "${unblockModalTarget.display}" berhasil dibuka.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'customer', action: 'unblock', id: unblockModalTarget.id });
      setUnblockModalTarget(null);
      fetchCustomers();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal membuka blokir pelanggan.',
      });
    } finally {
      setIsProcessingAction(false);
      hideLoading();
    }
  };

  const handleExecuteToggleActive = async () => {
    if (!activeModalTarget) return;
    setIsProcessingAction(true);
    showLoading();
    try {
      if (activeModalTarget.isActive) {
        await customerApi.deactivate(activeModalTarget.id);
        publish(MFE_EVENTS.NOTIFICATION_SHOW, {
          type: 'success',
          message: `Pelanggan "${activeModalTarget.display}" dinonaktifkan.`,
        });
      } else {
        await customerApi.reactivate(activeModalTarget.id);
        publish(MFE_EVENTS.NOTIFICATION_SHOW, {
          type: 'success',
          message: `Pelanggan "${activeModalTarget.display}" diaktifkan kembali.`,
        });
      }
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'customer', action: 'status', id: activeModalTarget.id });
      setActiveModalTarget(null);
      fetchCustomers();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal mengubah status aktif pelanggan.',
      });
    } finally {
      setIsProcessingAction(false);
      hideLoading();
    }
  };

  const handleExecuteResetPassword = async () => {
    if (!resetModalTarget) return;
    if (newPassword.length < 6) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: 'Kata sandi baru minimal 6 karakter.',
      });
      return;
    }

    setIsProcessingAction(true);
    showLoading();
    try {
      await customerApi.resetPassword(resetModalTarget.id, { newPassword });
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Kata sandi pelanggan "${resetModalTarget.display}" berhasil di-reset.`,
      });
      setResetModalTarget(null);
      setNewPassword('');
      setShowPassword(false);
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal mereset kata sandi pelanggan.',
      });
    } finally {
      setIsProcessingAction(false);
      hideLoading();
    }
  };

  const handleExecuteReleaseSession = async () => {
    if (!releaseModalTarget) return;
    setIsProcessingAction(true);
    showLoading();
    try {
      await customerApi.releaseSession(releaseModalTarget.id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Sesi aktif pelanggan "${releaseModalTarget.display}" telah dilepas.`,
      });
      setReleaseModalTarget(null);
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal melepas sesi pelanggan.',
      });
    } finally {
      setIsProcessingAction(false);
      hideLoading();
    }
  };

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const hasActiveFilters = Boolean(searchTerm || selectedStatus !== '' || selectedBlocked !== '');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Master Pelanggan
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 tabular-nums">
                  {pagination.total} Pelanggan
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola status akun, keamanan sesi, dan pemblokiran pelanggan toko secara terpusat.
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
                onClick={() => fetchCustomers()}
                className="gap-1.5 cursor-pointer text-xs h-9 px-3"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ambil data pelanggan terbaru dari server</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <Card className="border border-gray-200/90 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input with Clear Button */}
            <div className="lg:col-span-2 relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                <Input
                  placeholder="Cari email, nama, atau no. HP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="!pl-10 pr-9 h-10 text-sm bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:ring-2 focus:ring-orange-500 w-full"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                    title="Hapus pencarian"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Status Aktif */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full h-10 !px-3 text-sm bg-white hover:bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 transition-colors cursor-pointer"
              >
                <option value="">Semua Status Akun</option>
                <option value="true">Akun Aktif</option>
                <option value="false">Akun Nonaktif</option>
              </select>
            </div>

            {/* Filter Status Blokir */}
            <div>
              <select
                value={selectedBlocked}
                onChange={(e) => {
                  setSelectedBlocked(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full h-10 !px-3 text-sm bg-white hover:bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 transition-colors cursor-pointer"
              >
                <option value="">Semua Status Blokir</option>
                <option value="true">Status: Diblokir</option>
                <option value="false">Status: Tidak Diblokir</option>
              </select>
            </div>
          </div>

          {/* Reset Filter Action Bar */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">Filter aktif:</span>
                {debouncedSearch && (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px] font-mono">
                    "{debouncedSearch}"
                  </span>
                )}
                {selectedStatus !== '' && (
                  <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[11px] font-medium border border-orange-200/50">
                    Status: {selectedStatus === 'true' ? 'Aktif' : 'Nonaktif'}
                  </span>
                )}
                {selectedBlocked !== '' && (
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 text-[11px] font-medium border border-red-200/50">
                    Blokir: {selectedBlocked === 'true' ? 'Diblokir' : 'Normal'}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                className="h-7 px-2.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card className="border border-gray-200/90 bg-white shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/90 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Pelanggan</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email Akun</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4">No. HP</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Terdaftar</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <LoadingSpinner size="md" />
                      <p className="text-xs text-gray-500">Memuat data pelanggan...</p>
                    </div>
                  </td>
                </tr>
              ) : errorMessage ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                      <AlertCircle className="w-8 h-8" />
                      <p className="font-medium text-sm">{errorMessage}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchCustomers}
                        className="mt-2 text-xs cursor-pointer"
                      >
                        Coba Lagi
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                      <Users className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                      <p className="text-sm font-medium text-gray-700">Tidak ada pelanggan ditemukan</p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        {hasActiveFilters
                          ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.'
                          : 'Belum ada data pelanggan yang terdaftar pada sistem toko.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c, idx) => {
                  const rowNumber = (pagination.page - 1) * pagination.pageSize + idx + 1;
                  const initialChar = (c.name || c.email || 'P').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        'hover:bg-gray-50/80 transition-colors',
                        c.isBlocked && 'bg-red-50/20'
                      )}
                    >
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono tabular-nums">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-orange-50 border border-orange-200/60 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {initialChar}
                          </div>
                          <div>
                            <div className="text-gray-900 font-semibold">{c.name || 'Pelanggan Toko'}</div>
                            <div className="text-xs text-gray-400 font-mono tabular-nums">ID: #{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-800 font-medium text-xs font-mono">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-xs tabular-nums">
                        {c.phone || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {c.isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <ShieldAlert className="w-3 h-3 text-red-600" />
                              <span>Diblokir</span>
                            </span>
                          )}
                          {c.isActive ? (
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
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono tabular-nums">
                        {formatDate(c.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {canUpdate || canDelete ? (
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Blokir / Buka Blokir */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  {c.isBlocked ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setUnblockModalTarget(c)}
                                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                    >
                                      <Unlock className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setBlockModalTarget(c)}
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                                    >
                                      <Lock className="w-4 h-4" />
                                    </Button>
                                  )}
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{c.isBlocked ? 'Buka Blokir' : 'Blokir Pelanggan'}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Tombol Reset Password */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setResetModalTarget(c);
                                      setNewPassword('');
                                      setShowPassword(false);
                                    }}
                                    className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 cursor-pointer"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reset Kata Sandi</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Tombol Toggle Status Aktif / Nonaktif */}
                            {(canDelete || canUpdate) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setActiveModalTarget(c)}
                                    className="h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                                  >
                                    {c.isActive ? (
                                      <UserX className="w-4 h-4" />
                                    ) : (
                                      <UserCheck className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{c.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Tombol Lepas Sesi */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setReleaseModalTarget(c)}
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                                  >
                                    <LogOut className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Lepas Sesi Aktif</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium select-none" title="Hanya Baca">
                            -
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
        {!isLoading && !errorMessage && customers.length > 0 && (
          <div className="py-3.5 px-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Menampilkan{' '}
              <span className="font-semibold text-gray-900 tabular-nums">
                {(pagination.page - 1) * pagination.pageSize + 1}
              </span>{' '}
              sampai{' '}
              <span className="font-semibold text-gray-900 tabular-nums">
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
              </span>{' '}
              dari <span className="font-semibold text-gray-900 tabular-nums">{pagination.total}</span> data
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
              <div className="px-2 font-medium text-gray-700 tabular-nums">
                Halaman {pagination.page} dari {totalPages}
              </div>
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

      {/* Modal: Blokir Pelanggan */}
      {blockModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Blokir Pelanggan</h3>
                <p className="text-xs text-gray-500">Batasi hak checkout transaksi pelanggan</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pelanggan:</div>
              <div className="font-semibold text-gray-900 text-sm">{blockModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">{blockModalTarget.email}</div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Pelanggan yang diblokir tidak akan dapat melakukan checkout atau memesan produk toko sampai blokir dibuka kembali.
            </p>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setBlockModalTarget(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteBlock}
                className="cursor-pointer"
              >
                {isProcessingAction ? 'Memproses...' : 'Ya, Blokir Pelanggan'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Buka Blokir Pelanggan */}
      {unblockModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <Unlock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Buka Blokir Pelanggan</h3>
                <p className="text-xs text-gray-500">Pulihkan hak bertransaksi normal</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pelanggan:</div>
              <div className="font-semibold text-gray-900 text-sm">{unblockModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">{unblockModalTarget.email}</div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Pelanggan akan kembali dapat berbelanja dan melakukan pembayaran pesanan di toko Anda.
            </p>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setUnblockModalTarget(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteUnblock}
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {isProcessingAction ? 'Memproses...' : 'Buka Blokir'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Ubah Status Aktif/Nonaktif */}
      {activeModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {activeModalTarget.isActive ? 'Nonaktifkan Akun' : 'Aktifkan Kembali Akun'}
                </h3>
                <p className="text-xs text-gray-500">Ubah status operasional akun pelanggan</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pelanggan:</div>
              <div className="font-semibold text-gray-900 text-sm">{activeModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">{activeModalTarget.email}</div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin {activeModalTarget.isActive ? 'menonaktifkan' : 'mengaktifkan kembali'}{' '}
              akun pelanggan ini? Akun nonaktif tidak dapat masuk ke aplikasi.
            </p>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setActiveModalTarget(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteToggleActive}
                className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
              >
                {isProcessingAction ? 'Memproses...' : 'Konfirmasi Perubahan'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Reset Kata Sandi */}
      {resetModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reset Kata Sandi Pelanggan</h3>
                <p className="text-xs text-gray-500">Tetapkan kata sandi baru untuk pelanggan</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pelanggan:</div>
              <div className="font-semibold text-gray-900 text-sm">{resetModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">{resetModalTarget.email}</div>
            </div>

            <div className="mb-6 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  title={showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400">
                Gunakan minimal 6 karakter kombinasi yang aman.
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => {
                  setResetModalTarget(null);
                  setNewPassword('');
                  setShowPassword(false);
                }}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction || newPassword.length < 6}
                onClick={handleExecuteResetPassword}
                className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
              >
                {isProcessingAction ? 'Memproses...' : 'Simpan Kata Sandi'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Lepas Sesi Aktif */}
      {releaseModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-blue-600 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Lepas Sesi Pelanggan</h3>
                <p className="text-xs text-gray-500">Putuskan login aktif di semua perangkat</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pelanggan:</div>
              <div className="font-semibold text-gray-900 text-sm">{releaseModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">{releaseModalTarget.email}</div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Pelanggan akan secara otomatis dikeluarkan dari akun di seluruh browser atau aplikasi yang sedang aktif dan harus login kembali.
            </p>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setReleaseModalTarget(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteReleaseSession}
                className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                {isProcessingAction ? 'Memproses...' : 'Lepas Sesi Sekarang'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PelangganIndex;
