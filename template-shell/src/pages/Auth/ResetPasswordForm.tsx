import React, { useState, type FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ResetPasswordFormProps {
  initialUsername?: string;
  onGoToLogin: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  initialUsername = '',
  onGoToLogin,
}) => {
  const [username, setUsername] = useState(initialUsername);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      if (!resetPassword) {
        throw new Error('Metode ganti kata sandi belum tersedia.');
      }
      await resetPassword(username.trim(), newPassword, confirmPassword, false);
      setSuccessMessage('Kata sandi berhasil diperbarui dan blokir akun telah dibuka. Silakan masuk kembali.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengatur ulang kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="text-center py-4 space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-gray-900">Kata Sandi Berhasil Diganti</h3>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            {successMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToLogin}
          className="w-full h-11 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-xs transition-all cursor-pointer"
        >
          Masuk ke Akun Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner Informasi Buka Blokir */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-amber-950">Buka Blokir Mandiri</span>
          <span>
            Akun pengurus diblokir setelah beberapa kali salah sandi? Atur kata sandi baru untuk membuka blokir akun Anda.
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username Field */}
        <div>
          <label htmlFor="reset-username" className="block text-sm font-medium text-gray-700 mb-1.5">
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-5 h-5" />
            </div>
            <input
              id="reset-username"
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full h-11 pl-11 pr-4 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* Kata Sandi Baru */}
        <div>
          <label htmlFor="reset-new-password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Kata Sandi Baru (Minimal 6 Karakter)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-11 pl-11 pr-11 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 transition-colors shadow-xs"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Konfirmasi Kata Sandi */}
        <div>
          <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Konfirmasi Kata Sandi Baru
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              id="reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full h-11 pl-11 pr-4 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-500/20 transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 mt-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl text-sm shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Menyimpan Kata Sandi...</span>
            </span>
          ) : (
            <span>Simpan &amp; Buka Blokir</span>
          )}
        </button>

        {/* Kembali ke Masuk */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onGoToLogin}
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-orange-600 cursor-pointer transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
