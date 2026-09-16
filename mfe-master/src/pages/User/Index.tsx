import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  UserCog,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ShieldCheck,
  ShieldAlert,
  Shield,
  KeyRound,
  ToggleLeft,
  ToggleRight,
  Crown,
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
import { userApi } from '../../services/userApi';
import { UserItem } from '../../types/user';

export const UserIndex: React.FC = () => {
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { canPerformAction, user: currentUser } = useAuth();

  const canCreate = canPerformAction('master-user', 'create');
  const canUpdate = canPerformAction('master-user', 'update');
  const canDelete = canPerformAction('master-user', 'delete');

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
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
  const [totalPages, setTotalPages] = useState(1);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [roleModalTarget, setRoleModalTarget] = useState<UserItem | null>(null);
  const [newSelectedRole, setNewSelectedRole] = useState<string>('ADMIN');

  const [resetModalTarget, setResetModalTarget] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [deleteModalTarget, setDeleteModalTarget] = useState<UserItem | null>(null);
  const [activeModalTarget, setActiveModalTarget] = useState<UserItem | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await userApi.getPaged({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: debouncedSearch || undefined,
        role: selectedRole || undefined,
        active: selectedStatus !== '' ? selectedStatus === 'true' : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
      });

      setUsers(res.items || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
      }));
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      const msg = err?.message || 'Gagal memuat daftar pengguna.';
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
    selectedRole,
    selectedStatus,
    sortConfig,
    publish,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reaktif terhadap perubahan data user
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'user') {
      fetchUsers();
    }
  });

  // Sort handler
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
    setSelectedRole('');
    setSelectedStatus('');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Action Handlers
  const handleExecuteChangeRole = async () => {
    if (!roleModalTarget) return;
    setIsProcessingAction(true);
    showLoading();
    try {
      await userApi.changeRole(roleModalTarget.id, { role: newSelectedRole });
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Peran pengguna "${roleModalTarget.display}" berhasil diubah menjadi ${newSelectedRole}.`,
      });
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'user', action: 'role', id: roleModalTarget.id });
      setRoleModalTarget(null);
      fetchUsers();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal mengubah peran pengguna.',
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
      await userApi.resetPassword(resetModalTarget.id, { newPassword });
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Kata sandi pengguna "${resetModalTarget.display}" berhasil di-reset.`,
      });
      setResetModalTarget(null);
      setNewPassword('');
      setShowPassword(false);
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal reset kata sandi pengguna.',
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
      await userApi.setActive(activeModalTarget.id, { isActive: !activeModalTarget.isActive });
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Status pengguna "${activeModalTarget.display}" berhasil diperbarui.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'user', action: 'status', id: activeModalTarget.id });
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      setActiveModalTarget(null);
      fetchUsers();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal mengubah status aktif pengguna.',
      });
    } finally {
      setIsProcessingAction(false);
      hideLoading();
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteModalTarget) return;
    setIsProcessingAction(true);
    showLoading();
    try {
      await userApi.delete(deleteModalTarget.id);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Pengguna "${deleteModalTarget.display}" berhasil dihapus.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'user', action: 'delete', id: deleteModalTarget.id });
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);
      setDeleteModalTarget(null);
      fetchUsers();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err?.message || 'Gagal menghapus pengguna.',
      });
    } finally {
      setIsProcessingAction(false);
      hideLoading();
    }
  };

  // Helper date
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  // Helper Role Badge
  const renderRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'SA') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Crown className="w-3.5 h-3.5 text-purple-600" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (r === 'OWNER') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Pemilik Toko</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        <span>Admin Toko</span>
      </span>
    );
  };

  const hasActiveFilters = Boolean(searchTerm || selectedRole || selectedStatus !== '');

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
              <UserCog className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Master User
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 tabular-nums">
                  {pagination.total} User Staf
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Kelola data staf toko, pembagian peran akses, dan keamanan akun internal.
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
                onClick={() => fetchUsers()}
                className="gap-1.5 cursor-pointer text-xs h-9 px-3"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ambil data staf terbaru dari server</p>
            </TooltipContent>
          </Tooltip>

          {canCreate && (
            <Button
              asChild
              size="sm"
              className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-xs cursor-pointer text-xs h-9 px-3.5"
            >
              <Link to="/master/user/tambah">
                <Plus className="w-4 h-4" />
                <span>Tambah User</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="border border-gray-200/90 bg-white shadow-xs rounded-xl overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input with Clear Button */}
            <div className="lg:col-span-2 relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10 pointer-events-none" />
                <Input
                  placeholder="Cari username atau nama tampilan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-9 h-10 text-sm bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:ring-2 focus:ring-orange-500 w-full"
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

            {/* Filter Peran */}
            <div>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full h-10 px-3 text-sm bg-white hover:bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 transition-colors cursor-pointer"
              >
                <option value="">Semua Peran</option>
                <option value="SA">Super Admin</option>
                <option value="OWNER">Pemilik Toko</option>
                <option value="ADMIN">Admin Toko</option>
              </select>
            </div>

            {/* Filter Status Aktif */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full h-10 px-3 text-sm bg-white hover:bg-white focus:bg-white border border-gray-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700 transition-colors cursor-pointer"
              >
                <option value="">Semua Status</option>
                <option value="true">Status: Aktif</option>
                <option value="false">Status: Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Reset Filter Action Bar */}
          {hasActiveFilters && (
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600 flex-wrap">
                <span className="font-medium">Filter aktif:</span>
                {debouncedSearch && (
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px] font-mono">
                    "{debouncedSearch}"
                  </span>
                )}
                {selectedRole !== '' && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-200/50">
                    Peran: {selectedRole}
                  </span>
                )}
                {selectedStatus !== '' && (
                  <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[11px] font-medium border border-orange-200/50">
                    Status: {selectedStatus === 'true' ? 'Aktif' : 'Nonaktif'}
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

      {/* Main Table Container */}
      <Card className="border border-gray-200/90 bg-white shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/90 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3.5 px-4 w-14 text-center">No</th>
                <th
                  onClick={() => handleSort('username')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Pengguna</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('displayName')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Tampilan</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('role')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Peran Akses</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th
                  onClick={() => handleSort('lastLoginAt')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Terakhir Login</span>
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
                      <p className="text-xs text-gray-500">Memuat data user...</p>
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
                        onClick={fetchUsers}
                        className="mt-2 text-xs cursor-pointer"
                      >
                        Coba Lagi
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                      <UserCog className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                      <p className="text-sm font-medium text-gray-700">Tidak ada user ditemukan</p>
                      <p className="text-xs text-gray-500 max-w-sm">
                        {hasActiveFilters
                          ? 'Coba sesuaikan kata kunci pencarian atau bersihkan filter yang aktif.'
                          : 'Belum ada akun pengguna staf yang terdaftar pada sistem.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u, idx) => {
                  const rowNumber = (pagination.page - 1) * pagination.pageSize + idx + 1;
                  const initialChar = (u.displayName || u.username || 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className={cn(
                        'hover:bg-gray-50/80 transition-colors',
                        u.isBlocked && 'bg-red-50/20'
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
                            <div className="font-semibold text-gray-900 font-mono text-xs">
                              {u.username}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono tabular-nums">ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-gray-900 font-medium">{u.displayName || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {renderRoleBadge(u.role)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {u.isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              <ShieldAlert className="w-3 h-3 text-red-600" />
                              <span>Diblokir</span>
                            </span>
                          )}
                          {u.isActive ? (
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
                        {formatDate(u.lastLoginAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {canUpdate || canDelete ? (
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Profil Nama */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(`/master/user/edit/${u.id}`)}
                                    className="h-8 w-8 text-gray-600 hover:text-orange-600 hover:bg-orange-50 cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ubah Nama Tampilan</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Ganti Peran */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setRoleModalTarget(u);
                                      setNewSelectedRole(u.role);
                                    }}
                                    className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 cursor-pointer"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ganti Peran Akses</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Reset Password */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setResetModalTarget(u);
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

                            {/* Toggle Status Aktif */}
                            {canUpdate && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setActiveModalTarget(u)}
                                    className="h-8 w-8 text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer"
                                  >
                                    {u.isActive ? (
                                      <ToggleRight className="w-4 h-4 text-emerald-600" />
                                    ) : (
                                      <ToggleLeft className="w-4 h-4 text-gray-400" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{u.isActive ? 'Nonaktifkan User' : 'Aktifkan User'}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Hapus User */}
                            {canDelete && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setDeleteModalTarget(u)}
                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Hapus User</p>
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
        {!isLoading && !errorMessage && users.length > 0 && (
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

      {/* Modal: Ganti Peran Akses */}
      {roleModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-purple-600 mb-4">
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Ubah Peran Pengguna</h3>
                <p className="text-xs text-gray-500">Sesuaikan tingkat wewenang akun internal</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pengguna:</div>
              <div className="font-semibold text-gray-900 text-sm">{roleModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">Username: {roleModalTarget.username}</div>
            </div>

            <div className="mb-6 space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">Peran Baru</label>
              <select
                value={newSelectedRole}
                onChange={(e) => setNewSelectedRole(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 cursor-pointer"
              >
                <option value="ADMIN">Admin Toko (Operasional & Katalog)</option>
                <option value="OWNER">Pemilik Toko (Manajemen Lengkap Toko)</option>
                <option value="SA">Super Admin (Akses Penuh Sistem)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setRoleModalTarget(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={isProcessingAction || newSelectedRole === roleModalTarget.role}
                onClick={handleExecuteChangeRole}
                className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
              >
                {isProcessingAction ? 'Memproses...' : 'Simpan Peran'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal: Reset Password */}
      {resetModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reset Kata Sandi User</h3>
                <p className="text-xs text-gray-500">Tetapkan kata sandi baru untuk staf</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pengguna:</div>
              <div className="font-semibold text-gray-900 text-sm">{resetModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">Username: {resetModalTarget.username}</div>
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

      {/* Modal: Toggle Status Aktif */}
      {activeModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {activeModalTarget.isActive ? 'Nonaktifkan Akun Staf' : 'Aktifkan Akun Staf'}
                </h3>
                <p className="text-xs text-gray-500">Ubah status aktif login pengguna</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pengguna:</div>
              <div className="font-semibold text-gray-900 text-sm">{activeModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">Username: {activeModalTarget.username}</div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin {activeModalTarget.isActive ? 'menonaktifkan' : 'mengaktifkan kembali'}{' '}
              akun pengguna staf ini?
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

      {/* Modal: Hapus User */}
      {deleteModalTarget && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2.5 bg-red-50 rounded-xl border border-red-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Hapus Akun Pengguna</h3>
                <p className="text-xs text-gray-500">Tindakan ini permanen dan tidak dapat dibatalkan</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100 mb-4 space-y-1">
              <div className="text-xs text-gray-500 font-medium">Target Pengguna:</div>
              <div className="font-semibold text-gray-900 text-sm">{deleteModalTarget.display}</div>
              <div className="text-xs text-gray-500 font-mono">Username: {deleteModalTarget.username}</div>
            </div>

            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun staf ini dari database? Seluruh wewenang akses akan dicabut selamanya.
            </p>

            <div className="flex justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isProcessingAction}
                onClick={() => setDeleteModalTarget(null)}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isProcessingAction}
                onClick={handleExecuteDelete}
                className="cursor-pointer"
              >
                {isProcessingAction ? 'Memproses...' : 'Ya, Hapus Pengguna'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserIndex;
