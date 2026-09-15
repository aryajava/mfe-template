import React, { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShoppingBag, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginCustomerFormProps {
  onGoToRegister: () => void;
  onGoToResetPassword: (prefillEmail?: string) => void;
}

export const LoginCustomerForm: React.FC<LoginCustomerFormProps> = ({
  onGoToRegister,
  onGoToResetPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const { loginCustomer } = useAuth();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsBlocked(false);
    setLoading(true);

    try {
      if (!loginCustomer) {
        throw new Error('Metode login pelanggan belum tersedia di konteks autentikasi.');
      }
      await loginCustomer(email.trim(), password);
    } catch (err: any) {
      const msg = err.message || 'Email atau kata sandi salah.';
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
                  onClick={() => onGoToResetPassword(email)}
                  className="font-semibold text-red-800 hover:text-red-950 underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Buka Blokir & Ganti Kata Sandi
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label htmlFor="customer-email" className="block text-xs font-semibold text-gray-700">
          Alamat Email
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            id="customer-email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
            className="w-full h-10.5 pl-10 pr-3.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="customer-password" className="block text-xs font-semibold text-gray-700">
            Kata Sandi
          </label>
          <button
            type="button"
            onClick={() => onGoToResetPassword(email)}
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
            id="customer-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Masukkan kata sandi akun"
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
            Memproses Masuk...
          </span>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            <span>Masuk &amp; Mulai Belanja</span>
          </>
        )}
      </button>

      {/* Footer Navigation */}
      <div className="pt-2 flex flex-col items-center gap-2 text-xs">
        <p className="text-gray-600">
          Belum punya akun pelanggan?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Daftar di sini
          </button>
        </p>
        <p className="text-[11px] text-gray-400">
          Akun terblokir?{' '}
          <button
            type="button"
            onClick={() => onGoToResetPassword(email)}
            className="font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Buka blokir kata sandi
          </button>
        </p>
      </div>
    </form>
  );
};

export default LoginCustomerForm;
