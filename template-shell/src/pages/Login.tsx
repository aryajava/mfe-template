import React, { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@template/shared';
import { Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login gagal. Periksa kembali username dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const autofillAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">Template MFE</h1>
          <p className="text-orange-100 mt-2">Aplikasi Shell Terpadu & Micro-Frontend</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-6 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-6 h-6 text-orange-600" />
            <h2 className="text-2xl font-bold text-gray-900">Masuk Akun</h2>
          </div>
          <p className="text-gray-600 mb-6 text-sm">
            Gunakan kredensial pengurus toko untuk mengakses sistem.
          </p>

          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          <form method="post" onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900"
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 px-3 pr-10 border border-gray-300 rounded-md focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base bg-orange-600 hover:bg-orange-700 text-white font-medium shadow-sm transition-colors"
              disabled={loading}
            >
              {loading ? 'Memproses autentikasi...' : 'Masuk ke Sistem'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
