import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthContainer from './Auth/AuthContainer';
import LoginStaffForm from './Auth/LoginStaffForm';
import ResetPasswordForm from './Auth/ResetPasswordForm';

type AuthMode = 'login' | 'reset';

export const Login: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    const m = searchParams.get('mode');
    if (m === 'reset') return 'reset';
    return 'login';
  });

  const [resetUsername, setResetUsername] = useState<string>(() => {
    return searchParams.get('username') || '';
  });

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const userParam = searchParams.get('username');

    if (modeParam === 'reset') {
      setAuthMode('reset');
      if (userParam) {
        setResetUsername(userParam);
      }
    } else {
      setAuthMode('login');
    }
  }, [searchParams]);

  const handleGoToResetPassword = (username?: string) => {
    setAuthMode('reset');
    if (username) {
      setResetUsername(username);
      setSearchParams({ mode: 'reset', username });
    } else {
      setSearchParams({ mode: 'reset' });
    }
  };

  const handleGoToLogin = () => {
    setAuthMode('login');
    setSearchParams({});
  };

  const headerMeta =
    authMode === 'reset'
      ? {
        title: 'Ganti Kata Sandi',
        subtitle: 'Buka blokir akun pengurus dan atur kata sandi baru',
      }
      : {
        title: 'Toko GKLaku',
        subtitle: 'Login - Sistem Toko GKLaku',
      };

  return (
    <AuthContainer title={headerMeta.title} subtitle={headerMeta.subtitle}>
      {authMode === 'login' ? (
        <LoginStaffForm onGoToResetPassword={handleGoToResetPassword} />
      ) : (
        <ResetPasswordForm
          initialUsername={resetUsername}
          onGoToLogin={handleGoToLogin}
        />
      )}
    </AuthContainer>
  );
};

export default Login;
