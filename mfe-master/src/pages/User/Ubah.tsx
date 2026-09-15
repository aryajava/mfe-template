import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  UserCog,
  AlertCircle,
  Shield,
  User,
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

      navigate('/master/user');
    } catch (err: any) {
      console.error('Gagal memperbarui user:', err);
      setApiError(err?.message || 'Gagal menyimpan perubahan pengguna.');
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-gray-500">Memuat profil pengguna...</p>
      </div>
    );
  }

  if (apiError && !user) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <p className="font-semibold text-sm">Pengguna Tidak Ditemukan</p>
          <p className="text-xs mt-1">{apiError}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/master/user')}
          className="text-xs"
        >
          Kembali ke Daftar User
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header & Breadcrumbs */}
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
          <Link to="/master/user" className="hover:text-orange-600 transition-colors">
            User
          </Link>
          <span>/</span>
          <span className="text-orange-600 font-semibold">Ubah</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/master/user')}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
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

      {/* Form Card */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <CardHeader className="p-6 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">
            Detail Akun Staf
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Username dan peran diatur secara terkendali untuk mematuhi kebijakan audit sistem
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-xs">Pembaruan Gagal</p>
                <p className="text-xs mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Readonly */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  disabled
                  value={user?.username || ''}
                  className="pl-9 h-10 text-sm bg-gray-50 font-mono text-gray-500 border-gray-200 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-gray-400">Username bersifat permanen dan tidak dapat diubah.</p>
            </div>

            {/* Peran Readonly Info */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Peran Akses Saat Ini</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  disabled
                  value={
                    user?.role === 'SA'
                      ? 'Super Admin (SA)'
                      : user?.role === 'OWNER'
                      ? 'Pemilik Toko (OWNER)'
                      : 'Admin Toko (ADMIN)'
                  }
                  className="pl-9 h-10 text-sm bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Untuk mengubah peran staf, gunakan aksi "Ganti Peran" langsung pada tabel Master User.
              </p>
            </div>

            {/* Nama Tampilan Field */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-semibold text-gray-700">
                Nama Tampilan
              </Label>
              <Input
                id="displayName"
                placeholder="Contoh: Budi Santoso (Kasir Shift Pagi)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 text-sm"
              />
              <p className="text-[11px] text-gray-400">
                Nama lengkap yang tampil pada header dan riwayat audit.
              </p>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/user')}
                disabled={isSubmitting}
                className="h-10 px-4 text-xs font-medium cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 cursor-pointer"
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
