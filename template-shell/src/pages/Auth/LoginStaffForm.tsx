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
        <div className="p-3.5 bg-red-50/90 border border-red-200/80 text-red-700 text-xs rounded-xl flex items-start gap-2.5 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="flex-1">
            <span className="font-medium text-red-800">{errorMessage}</span>
            {isBlocked && (
              <div className="mt-2.5 pt-2 border-t border-red-200/80">
                <button
                  type="button"
                  onClick={() => onGoToResetPassword(username)}
                  className="font-semibold text-red-900 hover:text-red-950 underline inline-flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <ShieldAlert className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Buka Blokir &amp; Atur Kata Sandi Baru
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Username Field */}
      <div className="space-y-1.5">
        <label htmlFor="staff-username" className="block text-xs font-semibold text-slate-700 tracking-wide">
          Username Pengurus
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="w-4.5 h-4.5" strokeWidth={1.75} />
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
            className="w-full h-12 pl-11 pr-4 bg-slate-50/70 hover:bg-slate-50/40 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="staff-password" className="block text-xs font-semibold text-slate-700 tracking-wide">
            Kata Sandi
          </label>
          <button
            type="button"
            onClick={() => onGoToResetPassword(username)}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer transition-colors"
          >
            Lupa sandi?
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4.5 h-4.5" strokeWidth={1.75} />
          </div>
          <input
            id="staff-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
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

      {/* Nested CTA (Button-in-Button) */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-12 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-[0.985] text-white font-semibold text-sm pl-5 pr-2 flex items-center justify-between group shadow-md shadow-orange-600/20 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:pointer-events-none select-none mt-5"
      >
        {loading ? (
          <div className="w-full flex items-center justify-center gap-2.5">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm font-semibold">Memverifikasi Kredensial...</span>
          </div>
        ) : (
          <>
            <span className="tracking-tight font-semibold">Masuk ke Panel Pengurus</span>
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white transition-transform duration-200 group-hover:translate-x-0.5">
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </div>
          </>
        )}
      </button>

      {/* Helper text */}
      <div className="text-center pt-2">
        <p className="text-xs text-slate-400 leading-relaxed font-normal">
          Akun terblokir setelah 3x salah sandi?{' '}
          <button
            type="button"
            onClick={() => onGoToResetPassword(username)}
            className="font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer transition-colors"
          >
            Buka blokir akun
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginStaffForm;
