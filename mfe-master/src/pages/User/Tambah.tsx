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
  Crown,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
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
  cn,
} from '@template/shared';
import { userApi } from '../../services/userApi';

const ROLE_OPTIONS = [
  {
    id: 'ADMIN',
    title: 'Admin Toko',
    description: 'Akses operasional harian, katalog produk, kategori, dan pesanan toko.',
    icon: Shield,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  {
    id: 'OWNER',
    title: 'Pemilik Toko',
    description: 'Manajemen lengkap toko, evaluasi diskon, laporan finansial, dan akun staf.',
    icon: ShieldCheck,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  {
    id: 'SA',
    title: 'Super Admin',
    description: 'Wewenang tertinggi sistem, akses audit penuh, konfigurasi aplikasi & sistem.',
    icon: Crown,
    colorClass: 'text-purple-600',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
  },
];

export const UserTambah: React.FC = () => {
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'user', action: 'create', id: created.id });

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
                Tambah User Baru
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Daftarkan akun staf baru untuk mengelola operasional toko
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {apiError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-xs">Pendaftaran Gagal</p>
              <p className="text-xs mt-0.5">{apiError}</p>
            </div>
          </div>
        )}

        {/* Section 1: Identitas Pengguna */}
        <Card className="border border-gray-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="p-5 border-b border-gray-100 bg-gray-50/40">
            <CardTitle className="text-sm font-bold text-gray-900">
              Identitas Pengguna
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Kredensial username dan nama tampilan yang digunakan dalam sistem
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {/* Username Field */}
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-xs font-semibold text-gray-700">
                Username <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  placeholder="misal: kasir01, admin_gudang"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-10 text-sm font-mono bg-white"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>3-50 karakter huruf kecil dan angka tanpa spasi</span>
                <span className="font-mono tabular-nums">{username.length}/50</span>
              </div>
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
                placeholder="misal: Budi Santoso (Kasir Shift Pagi)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 text-sm bg-white"
              />
              <p className="text-[11px] text-gray-400">
                Nama staf yang akan tampil di header, struk kasir, dan riwayat mutasi toko.
              </p>
              {errors.displayName && (
                <p className="text-xs text-red-600 font-medium">{errors.displayName}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Hak Akses & Peran */}
        <Card className="border border-gray-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="p-5 border-b border-gray-100 bg-gray-50/40">
            <CardTitle className="text-sm font-bold text-gray-900">
              Hak Akses & Peran <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Pilih tingkat wewenang dan cakupan menu yang dapat diakses pengguna
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 gap-3">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = role === opt.id;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setRole(opt.id)}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-4',
                      isSelected
                        ? 'border-orange-500 bg-orange-50/30 ring-1 ring-orange-500/20 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-lg border shrink-0 mt-0.5',
                          opt.bgClass,
                          opt.colorClass,
                          opt.borderClass
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{opt.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                          {opt.description}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center border shrink-0 mt-1 transition-colors',
                        isSelected
                          ? 'border-orange-600 bg-orange-600 text-white'
                          : 'border-gray-300 bg-white'
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.role && <p className="text-xs text-red-600 font-medium mt-2">{errors.role}</p>}
          </CardContent>
        </Card>

        {/* Section 3: Keamanan Akun */}
        <Card className="border border-gray-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="p-5 border-b border-gray-100 bg-gray-50/40">
            <CardTitle className="text-sm font-bold text-gray-900">
              Kata Sandi Awal <span className="text-red-500">*</span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Kata sandi sementara yang digunakan untuk login pertama kali
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-10 text-sm bg-white"
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
              Pengguna disarankan untuk memperbarui kata sandi setelah berhasil login ke aplikasi.
            </p>
            {errors.password && (
              <p className="text-xs text-red-600 font-medium">{errors.password}</p>
            )}
          </CardContent>
        </Card>

        {/* Form Action Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
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
            <span>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan User Baru'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserTambah;
