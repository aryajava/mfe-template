import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
  UserX,
  UserCheck,
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            Master Pelanggan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola status akun, keamanan sesi, dan pemblokiran pelanggan toko.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari email, nama, atau no. HP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm bg-white"
                />
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
                className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
              >
                <option value="">Semua Status Akun</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
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
                className="w-full h-10 px-3 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
              >
                <option value="">Semua Status Blokir</option>
                <option value="true">Diblokir</option>
                <option value="false">Tidak Diblokir</option>
              </select>
            </div>
          </div>

          {/* Reset Filter Action */}
          {(searchTerm || selectedStatus !== '' || selectedBlocked !== '') && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <span className="text-gray-500">Filter aktif diterapkan</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilter}
                className="h-7 px-2 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Table Container */}
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th
                  onClick={() => handleSort('email')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Pelanggan</span>
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
                        className="mt-2 text-xs"
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
                        {searchTerm || selectedStatus || selectedBlocked
                          ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.'
                          : 'Belum ada data pelanggan yang terdaftar pada sistem.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((c, idx) => {
                  const rowNumber = (pagination.page - 1) * pagination.pageSize + idx + 1;
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        'hover:bg-gray-50/80 transition-colors',
                        c.isBlocked && 'bg-red-50/20'
                      )}
                    >
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono">
                        {rowNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-gray-900">{c.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-900 font-medium">{c.name || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-mono text-xs">
                        {c.phone || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {c.isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <ShieldAlert className="w-3 h-3 text-red-600" />
                              <span>Diblokir</span>
                            </span>
                          )}
                          {c.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Aktif</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              <XCircle className="w-3 h-3 text-gray-500" />
                              <span>Nonaktif</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-gray-500">
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
              <div className="px-2 font-medium text-gray-700">
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
      {blockModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Blokir Pelanggan</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin memblokir pelanggan{' '}
              <span className="font-semibold text-gray-900">{blockModalTarget.display}</span>?
              Pelanggan yang diblokir tidak akan dapat melakukan checkout atau memesan produk toko.
            </p>
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setBlockModalTarget(null)}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteBlock}
              >
                {isProcessingAction ? 'Memproses...' : 'Ya, Blokir'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Buka Blokir Pelanggan */}
      {unblockModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-emerald-600 mb-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Unlock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Buka Blokir Pelanggan</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Buka kembali akses untuk pelanggan{' '}
              <span className="font-semibold text-gray-900">{unblockModalTarget.display}</span>?
              Pelanggan akan kembali dapat melakukan transaksi secara normal.
            </p>
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setUnblockModalTarget(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteUnblock}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessingAction ? 'Memproses...' : 'Buka Blokir'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ubah Status Aktif/Nonaktif */}
      {activeModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {activeModalTarget.isActive ? 'Nonaktifkan Pelanggan' : 'Aktifkan Pelanggan'}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Apakah Anda yakin ingin {activeModalTarget.isActive ? 'menonaktifkan' : 'mengaktifkan kembali'}{' '}
              akun pelanggan <span className="font-semibold text-gray-900">{activeModalTarget.display}</span>?
            </p>
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setActiveModalTarget(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteToggleActive}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isProcessingAction ? 'Memproses...' : 'Konfirmasi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reset Kata Sandi */}
      {resetModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reset Kata Sandi Pelanggan</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Masukkan kata sandi baru untuk akun{' '}
              <span className="font-semibold text-gray-900">{resetModalTarget.display}</span> (minimal 6 karakter).
            </p>
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kata Sandi Baru</label>
              <Input
                type="password"
                placeholder="Masukkan kata sandi baru..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => {
                  setResetModalTarget(null);
                  setNewPassword('');
                }}
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction || newPassword.length < 6}
                onClick={handleExecuteResetPassword}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isProcessingAction ? 'Memproses...' : 'Simpan Kata Sandi'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Lepas Sesi Aktif */}
      {releaseModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-blue-600 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <LogOut className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Lepas Sesi Pelanggan</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Lepas sesi login aktif untuk pelanggan{' '}
              <span className="font-semibold text-gray-900">{releaseModalTarget.display}</span>?
              Pelanggan akan diminta login ulang di perangkat mereka.
            </p>
            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setReleaseModalTarget(null)}
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteReleaseSession}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessingAction ? 'Memproses...' : 'Lepas Sesi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PelangganIndex;
