import React, { useState, type FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';
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
      setSuccessMessage('Kata sandi berhasil diperbarui dan status blokir akun telah dibuka.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengatur ulang kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="text-center py-2 space-y-4">
        <div className="w-13 h-13 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-6 h-6" strokeWidth={1.85} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Kata Sandi Berhasil Diganti</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            {successMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToLogin}
          className="w-full h-12 bg-orange-600 hover:bg-orange-700 active:scale-[0.985] text-white font-semibold rounded-xl text-sm shadow-md shadow-orange-600/20 transition-all cursor-pointer flex items-center justify-center"
        >
          Masuk ke Akun Sekarang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner Informasi Buka Blokir */}
      <div className="p-3.5 bg-amber-50/90 border border-amber-200/80 text-amber-900 rounded-xl text-xs leading-relaxed flex items-start gap-2.5">
        <ShieldCheck className="w-4.5 h-4.5 text-amber-700 shrink-0 mt-0.5" strokeWidth={1.75} />
        <div>
          <span className="font-semibold block text-amber-950 mb-0.5">Buka Blokir Mandiri</span>
          <span className="text-amber-800">
            Akun pengurus diblokir karena salah sandi berturut-turut? Atur kata sandi baru untuk mengaktifkan kembali akun.
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50/90 border border-red-200/80 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <span className="font-medium text-red-800">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Username Field */}
        <div className="space-y-1.5">
          <label htmlFor="reset-username" className="block text-xs font-semibold text-slate-700 tracking-wide">
            Username Pengurus
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4.5 h-4.5" strokeWidth={1.75} />
            </div>
            <input
              id="reset-username"
              type="text"
              placeholder="Masukkan username (contoh: admin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full h-12 pl-11 pr-4 bg-slate-50/70 hover:bg-slate-50/40 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
            />
          </div>
        </div>

        {/* Kata Sandi Baru */}
        <div className="space-y-1.5">
          <label htmlFor="reset-new-password" className="block text-xs font-semibold text-slate-700 tracking-wide">
            Kata Sandi Baru (Minimal 6 Karakter)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4.5 h-4.5" strokeWidth={1.75} />
            </div>
            <input
              id="reset-new-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Masukkan kata sandi baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full h-12 pl-11 pr-11 bg-slate-50/70 hover:bg-slate-50/40 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* Konfirmasi Kata Sandi */}
        <div className="space-y-1.5">
          <label htmlFor="reset-confirm-password" className="block text-xs font-semibold text-slate-700 tracking-wide">
            Konfirmasi Kata Sandi Baru
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4.5 h-4.5" strokeWidth={1.75} />
            </div>
            <input
              id="reset-confirm-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Ulangi kata sandi baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full h-12 pl-11 pr-4 bg-slate-50/70 hover:bg-slate-50/40 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
            />
          </div>
        </div>

        {/* Nested CTA (Button-in-Button) */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.985] text-white font-semibold text-sm pl-5 pr-2 flex items-center justify-between group shadow-md shadow-orange-600/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:pointer-events-none select-none mt-5"
        >
          {loading ? (
            <div className="w-full flex items-center justify-center gap-2.5">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-sm font-semibold">Menyimpan Kata Sandi...</span>
            </div>
          ) : (
            <>
              <span className="tracking-tight font-semibold">Simpan &amp; Buka Blokir</span>
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white transition-transform duration-200 group-hover:translate-x-0.5">
                <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </div>
            </>
          )}
        </button>

        {/* Kembali ke Masuk */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onGoToLogin}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Kembali ke Halaman Masuk</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
