import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  UserCog,
  AlertCircle,
  Shield,
  KeyRound,
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
  useLoading,
  useEventBus,
  MFE_EVENTS,
} from '@template/shared';
import { userApi } from '../../services/userApi';

export const UserTambah: React.FC = () => {
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) {
      newErrors.username = 'Username wajib diisi.';
    } else if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      newErrors.username = 'Username harus 3 hingga 50 karakter.';
    } else if (!/^[a-z0-9]+$/.test(cleanUsername)) {
      newErrors.username = 'Username hanya boleh berupa huruf kecil dan angka.';
    }

    if (displayName.trim().length > 200) {
      newErrors.displayName = 'Nama tampilan maksimal 200 karakter.';
    }

    if (!password) {
      newErrors.password = 'Kata sandi wajib diisi.';
    } else if (password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter.';
    }

    if (!role) {
      newErrors.role = 'Peran wajib dipilih.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setApiError(null);
    setIsSubmitting(true);
    showLoading();

    try {
      const created = await userApi.create({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim() || undefined,
        password,
        role,
      });

      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: `Pengguna "${created.username}" berhasil didaftarkan.`,
      });

      navigate('/master/user');
    } catch (err: any) {
      console.error('Gagal membuat user:', err);
      setApiError(err?.message || 'Gagal mendaftarkan user baru.');
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

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
          <span className="text-orange-600 font-semibold">Tambah</span>
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
                Tambah User Baru
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Daftarkan akun staf baru untuk mengelola operasional toko
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="border border-gray-200 shadow-sm rounded-xl">
        <CardHeader className="p-6 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">
            Informasi Akun Pengguna
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Isi identitas akun, hak wewenang akses, dan kata sandi awal
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {apiError && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-xs">Pendaftaran Gagal</p>
                <p className="text-xs mt-0.5">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-gray-700">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  placeholder="Contoh: kasir01, admin_gudang"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 h-10 text-sm font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Gunakan 3 hingga 50 karakter huruf kecil dan angka tanpa spasi.
              </p>
              {errors.username && (
                <p className="text-xs text-red-600 font-medium">{errors.username}</p>
              )}
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
                Nama lengkap atau keterangan staf yang tampil di aplikasi toko.
              </p>
              {errors.displayName && (
                <p className="text-xs text-red-600 font-medium">{errors.displayName}</p>
              )}
            </div>

            {/* Peran / Role Field */}
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-semibold text-gray-700">
                Peran Akses <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 h-10 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-700"
                >
                  <option value="ADMIN">Admin Toko (Operasional Toko & Master Data)</option>
                  <option value="OWNER">Pemilik Toko (Kelola Toko & Buat Akun Admin)</option>
                  <option value="SA">Super Admin (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>
              {errors.role && (
                <p className="text-xs text-red-600 font-medium">{errors.role}</p>
              )}
            </div>

            {/* Kata Sandi Awal */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
                Kata Sandi Awal <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
              <p className="text-[11px] text-gray-400">
                Pengguna dapat mengganti kata sandi ini setelah login.
              </p>
              {errors.password && (
                <p className="text-xs text-red-600 font-medium">{errors.password}</p>
              )}
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
                <span>{isSubmitting ? 'Menyimpan...' : 'Daftarkan User'}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTambah;
