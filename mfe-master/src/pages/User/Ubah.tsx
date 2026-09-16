import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  UserCog,
  AlertCircle,
  Shield,
  User,
  Crown,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  LoadingSpinner,
  useLoading,
  useEventBus,
  MFE_EVENTS,
} from '@template/shared';
import { userApi } from '../../services/userApi';
import { UserItem } from '../../types/user';

export const UserUbah: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const [user, setUser] = useState<UserItem | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch detail user
  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await userApi.getById(Number(id));
        setUser(data);
        setDisplayName(data.displayName || '');
      } catch (err: any) {
        setApiError(err?.message || 'Gagal memuat informasi pengguna.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (displayName.trim().length > 200) {
      setError('Nama tampilan maksimal 200 karakter.');
      return;
    }

    setError(null);
    setApiError(null);
    setIsSubmitting(true);
    showLoading();

    try {
      const updated = await userApi.update(user.id, {
        displayName: displayName.trim() || undefined,
        version: user.version,
      });

      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Profil pengguna "${updated.username}" berhasil diperbarui.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'user', action: 'update', id: updated.id });
      publish(MFE_EVENTS.PERMISSIONS_UPDATED);

      navigate('/master/user');
    } catch (err: any) {
      console.error('Gagal memperbarui user:', err);
      setApiError(err?.message || 'Gagal menyimpan perubahan pengguna.');
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  const renderRoleBadge = (roleStr?: string) => {
    const r = (roleStr || '').toUpperCase();
    if (r === 'SA') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Crown className="w-3 h-3 text-purple-600" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (r === 'OWNER') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <ShieldCheck className="w-3 h-3 text-amber-600" />
          <span>Pemilik Toko</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Shield className="w-3 h-3 text-blue-600" />
        <span>Admin Toko</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-gray-500">Memuat profil pengguna staf...</p>
      </div>
    );
  }

  if (apiError && !user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="p-5 bg-red-50 text-red-700 rounded-2xl border border-red-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="font-bold text-sm">Pengguna Tidak Ditemukan</p>
          <p className="text-xs mt-1 text-red-600 leading-relaxed">{apiError}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/master/user')}
          className="text-xs cursor-pointer"
        >
          Kembali ke Daftar User
        </Button>
      </div>
    );
  }

  const initialChar = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/master/user')}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer shadow-2xs"
              title="Kembali ke Daftar User"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <UserCog className="w-5 h-5 text-orange-600" />
                Ubah Profil User
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Perbarui nama tampilan dan informasi pengguna staf
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Overview Card */}
      {user && (
        <Card className="border border-gray-200 shadow-xs rounded-xl overflow-hidden bg-white">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-200/60 text-orange-700 flex items-center justify-center font-bold text-lg shrink-0">
                {initialChar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-gray-900">{user.displayName || user.username}</span>
                  <span className="text-xs text-gray-400 font-mono tabular-nums">ID: #{user.id}</span>
                </div>
                <div className="text-xs text-gray-500 font-mono mt-0.5">@{user.username}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {renderRoleBadge(user.role)}
              {user.isActive ? (
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
          </CardContent>
        </Card>
      )}

      {/* Form Card */}
      <Card className="border border-gray-200 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="p-5 border-b border-gray-100 bg-gray-50/40">
          <CardTitle className="text-sm font-bold text-gray-900">
            Detail Akun Staf
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Username dan peran diatur secara terkendali untuk mematuhi kebijakan audit keamanan toko
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {apiError && (
            <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">Pembaruan Gagal</p>
                <p className="text-xs mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Readonly */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">Username</Label>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-gray-400" />
                  Permanen
                </span>
              </div>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  disabled
                  value={user?.username || ''}
                  className="pl-10 h-10 text-sm bg-gray-50/80 font-mono text-gray-600 border-gray-200 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Username merupakan pengenal unik permanen untuk riwayat audit transaksi toko.
              </p>
            </div>

            {/* Peran Readonly Info */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">Peran Akses Saat Ini</Label>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-gray-400" />
                  Terkunci
                </span>
              </div>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  disabled
                  value={
                    user?.role === 'SA'
                      ? 'Super Admin (Akses Penuh Sistem)'
                      : user?.role === 'OWNER'
                      ? 'Pemilik Toko (Kelola Toko & Buat Akun)'
                      : 'Admin Toko (Operasional Toko & Master Data)'
                  }
                  className="pl-10 h-10 text-sm bg-gray-50/80 text-gray-600 border-gray-200 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Untuk mengubah peran staf, gunakan tombol aksi "Ganti Peran" pada tabel daftar Master User.
              </p>
            </div>

            {/* Nama Tampilan Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="displayName" className="text-xs font-semibold text-gray-700">
                  Nama Tampilan
                </Label>
                <span className="text-[11px] text-gray-400 font-mono tabular-nums">
                  {displayName.length}/200
                </span>
              </div>
              <Input
                id="displayName"
                placeholder="misal: Budi Santoso (Kasir Shift Pagi)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 text-sm bg-white"
              />
              <p className="text-[11px] text-gray-400">
                Nama staf yang tampil pada header aplikasi dan riwayat audit aktivitas.
              </p>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/user')}
                disabled={isSubmitting}
                className="h-10 px-5 text-xs font-medium cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserUbah;
