import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, ShoppingBag } from 'lucide-react';
import AuthContainer from './Auth/AuthContainer';
import LoginStaffForm from './Auth/LoginStaffForm';
import LoginCustomerForm from './Auth/LoginCustomerForm';
import RegisterCustomerForm from './Auth/RegisterCustomerForm';
import ResetPasswordForm from './Auth/ResetPasswordForm';

type AuthMode = 'login' | 'register' | 'reset';
type LoginTab = 'staff' | 'customer';

export const Login: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode: login, register, reset
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    const m = searchParams.get('mode');
    if (m === 'register') return 'register';
    if (m === 'reset') return 'reset';
    return 'login';
  });

  // Tab: staff vs customer
  const [loginTab, setLoginTab] = useState<LoginTab>(() => {
    const t = searchParams.get('tab');
    if (t === 'customer') return 'customer';
    return 'staff';
  });

  const [resetIdentifier, setResetIdentifier] = useState<string>(() => {
    return searchParams.get('email') || searchParams.get('username') || '';
  });

  const [resetIsCustomer, setResetIsCustomer] = useState<boolean>(() => {
    return Boolean(searchParams.get('email')) || searchParams.get('type') === 'customer';
  });

  // Sinkronkan state dengan query params jika berubah dari luar
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const tabParam = searchParams.get('tab');
    const emailParam = searchParams.get('email');
    const userParam = searchParams.get('username');

    if (modeParam === 'register') {
      setAuthMode('register');
    } else if (modeParam === 'reset') {
      setAuthMode('reset');
      if (emailParam) {
        setResetIdentifier(emailParam);
        setResetIsCustomer(true);
      } else if (userParam) {
        setResetIdentifier(userParam);
        setResetIsCustomer(false);
      }
    } else {
      setAuthMode('login');
      if (tabParam === 'customer') {
        setLoginTab('customer');
      } else if (tabParam === 'staff') {
        setLoginTab('staff');
      }
    }
  }, [searchParams]);

  const handleTabChange = (tab: LoginTab) => {
    setLoginTab(tab);
    setSearchParams({ tab });
  };

  const handleGoToRegister = () => {
    setAuthMode('register');
    setSearchParams({ mode: 'register' });
  };

  const handleGoToResetPassword = (identifier?: string, isCust?: boolean) => {
    setAuthMode('reset');
    if (identifier) {
      setResetIdentifier(identifier);
    }
    if (isCust !== undefined) {
      setResetIsCustomer(isCust);
    } else {
      setResetIsCustomer(loginTab === 'customer');
    }

    const params: Record<string, string> = { mode: 'reset' };
    if (identifier) {
      if (isCust || loginTab === 'customer') {
        params.email = identifier;
      } else {
        params.username = identifier;
      }
    }
    setSearchParams(params);
  };

  const handleGoToLogin = (tab: LoginTab = loginTab) => {
    setAuthMode('login');
    setLoginTab(tab);
    setSearchParams({ tab });
  };

  // Header Title & Subtitle kontekstual
  const headerMeta = (() => {
    if (authMode === 'register') {
      return {
        title: 'Toko GKLaku',
        subtitle: 'Buat akun pelanggan baru untuk kemudahan belanja',
      };
    }
    if (authMode === 'reset') {
      return {
        title: 'Toko GKLaku',
        subtitle: 'Buka blokir akun dan atur kata sandi baru',
      };
    }
    if (loginTab === 'customer') {
      return {
        title: 'Toko GKLaku',
        subtitle: 'Masuk untuk belanja produk dan mengecek status pesanan',
      };
    }
    return {
      title: 'Toko GKLaku',
      subtitle: 'Silakan masuk ke panel pengurus toko untuk mengelola sistem',
    };
  })();

  return (
    <AuthContainer title={headerMeta.title} subtitle={headerMeta.subtitle}>
      {/* Segmented Tab Switcher (Hanya ditampilkan pada mode login) */}
      {authMode === 'login' && (
        <div className="mb-5">
          <div className="flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTabChange('staff')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginTab === 'staff'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-orange-600" />
              <span>Pengelola Toko</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('customer')}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginTab === 'customer'
                  ? 'bg-white text-gray-900 shadow-xs font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-orange-600" />
              <span>Pelanggan Toko</span>
            </button>
          </div>
        </div>
      )}

      {/* Konten Form sesuai AuthMode & Tab */}
      {authMode === 'login' && loginTab === 'staff' && (
        <LoginStaffForm onGoToResetPassword={(user) => handleGoToResetPassword(user, false)} />
      )}

      {authMode === 'login' && loginTab === 'customer' && (
        <LoginCustomerForm
          onGoToRegister={handleGoToRegister}
          onGoToResetPassword={(mail) => handleGoToResetPassword(mail, true)}
        />
      )}

      {authMode === 'register' && (
        <RegisterCustomerForm onGoToLogin={() => handleGoToLogin('customer')} />
      )}

      {authMode === 'reset' && (
        <ResetPasswordForm
          initialIdentifier={resetIdentifier}
          initialIsCustomer={resetIsCustomer}
          onGoToLogin={() => handleGoToLogin(resetIsCustomer ? 'customer' : 'staff')}
        />
      )}
    </AuthContainer>
  );
};

export default Login;
