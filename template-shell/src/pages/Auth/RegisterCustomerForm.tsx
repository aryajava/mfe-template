import React, { useState, type FormEvent } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface RegisterCustomerFormProps {
  onGoToLogin: () => void;
}

export const RegisterCustomerForm: React.FC<RegisterCustomerFormProps> = ({ onGoToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { registerCustomer } = useAuth();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      if (!registerCustomer) {
        throw new Error('Metode registrasi pelanggan belum tersedia.');
      }
      await registerCustomer(name.trim(), email.trim(), password);
      setSuccessMessage('Akun pelanggan berhasil dibuat! Silakan masuk untuk mulai berbelanja.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftarkan akun. Silakan coba lagi.');
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
          <h3 className="text-base font-bold text-gray-900">Pendaftaran Berhasil!</h3>
          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            {successMessage}
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToLogin}
          className="w-full h-10.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          Lanjut ke Halaman Masuk
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleRegister} className="space-y-3.5">
      {errorMessage && (
        <div className="p-3 bg-red-50/90 border border-red-200/90 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Nama Lengkap */}
      <div className="space-y-1">
        <label htmlFor="reg-name" className="block text-xs font-semibold text-gray-700">
          Nama Lengkap
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="reg-name"
            type="text"
            placeholder="Nama lengkap Anda"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            autoFocus
            className="w-full h-10 pl-10 pr-3.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label htmlFor="reg-email" className="block text-xs font-semibold text-gray-700">
          Alamat Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="reg-email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full h-10 pl-10 pr-3.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1">
        <label htmlFor="reg-password" className="block text-xs font-semibold text-gray-700">
          Kata Sandi (Minimal 6 Karakter)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Buat kata sandi aman"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full h-10 pl-10 pr-10 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1">
        <label htmlFor="reg-confirm" className="block text-xs font-semibold text-gray-700">
          Konfirmasi Kata Sandi
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="reg-confirm"
            type={showPassword ? 'text' : 'password'}
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full h-10 pl-10 pr-3.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-10.5 mt-2 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Mendaftarkan Akun...
          </span>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>Buat Akun Pelanggan</span>
          </>
        )}
      </button>

      {/* Back to Login */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onGoToLogin}
          className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-orange-600 cursor-pointer transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Sudah punya akun? Masuk</span>
        </button>
      </div>
    </form>
  );
};

export default RegisterCustomerForm;
