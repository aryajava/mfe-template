import React, { useState, type FormEvent } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginStaffFormProps {
  onGoToResetPassword: (prefillUsername?: string) => void;
}

export const LoginStaffForm: React.FC<LoginStaffFormProps> = ({ onGoToResetPassword }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsBlocked(false);
    setLoading(true);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      const msg = err.message || 'Login gagal. Periksa kembali username dan password Anda.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('terblokir') || msg.toLowerCase().includes('blokir') || err.isBlocked) {
        setIsBlocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {errorMessage && (
        <div className="p-3.5 bg-red-50/90 border border-red-200/90 text-red-700 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{errorMessage}</span>
            {isBlocked && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <button
                  type="button"
                  onClick={() => onGoToResetPassword(username)}
                  className="font-semibold text-red-800 hover:text-red-950 underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Buka Blokir & Atur Kata Sandi Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-1.5">
        <label htmlFor="staff-username" className="block text-xs font-semibold text-gray-700">
          Username Pengurus
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <User className="w-4 h-4" />
          </div>
          <input
            id="staff-username"
            type="text"
            placeholder="Masukkan username (contoh: admin)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
            className="w-full h-10.5 pl-10 pr-3.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="staff-password" className="block text-xs font-semibold text-gray-700">
            Kata Sandi
          </label>
          <button
            type="button"
            onClick={() => onGoToResetPassword(username)}
            className="text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Lupa sandi?
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            id="staff-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full h-10.5 pl-10 pr-10 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-orange-600 hover:bg-orange-700 active:scale-[0.99] text-white font-semibold rounded-xl text-xs sm:text-sm shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Memverifikasi Kredensial...
          </span>
        ) : (
          <>
            <span>Masuk ke Panel Pengurus</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Helper text */}
      <div className="text-center pt-2">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Akun terblokir setelah 3x gagal masuk?{' '}
          <button
            type="button"
            onClick={() => onGoToResetPassword(username)}
            className="font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Buka blokir di sini
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginStaffForm;
