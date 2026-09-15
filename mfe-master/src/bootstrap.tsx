import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  SharedProvider,
  LoadingProvider,
  GlobalLoadingOverlay,
  TooltipProvider,
  SonnerToaster,
  NotificationListener,
  type AuthContextType,
} from '@template/shared';
import App from './App';
import './global.css';

const queryClient = new QueryClient();

// Mock Auth Context untuk standalone development (:5008)
const getStandaloneAuthContext = (): AuthContextType => {
  let role = 'SA';
  try {
    const raw = localStorage.getItem('sast_user') || localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      role = u.roles?.[0] || 'SA';
    }
  } catch {}

  const isSa = role.toUpperCase() === 'SA';
  const isOwner = role.toUpperCase() === 'OWNER';
  const isAdmin = role.toUpperCase() === 'ADMIN';

  const menuPermissions: Record<string, any> = {
    'master-produk': {
      menuCode: 'master-produk',
      fullPath: '/master/produk',
      canRead: true,
      canCreate: isSa || isOwner || isAdmin,
      canUpdate: true,
      canDelete: isSa || isOwner,
      canToggleActive: isSa || isOwner,
    },
    'master-kategori': {
      menuCode: 'master-kategori',
      fullPath: '/master/kategori',
      canRead: isSa || isOwner || isAdmin,
      canCreate: isSa || isOwner || isAdmin,
      canUpdate: isSa || isOwner || isAdmin,
      canDelete: isSa || isOwner,
      canToggleActive: isSa || isOwner,
    },
    'master-ekspedisi': {
      menuCode: 'master-ekspedisi',
      fullPath: '/master/ekspedisi',
      canRead: isSa || isOwner,
      canCreate: isSa || isOwner,
      canUpdate: isSa || isOwner,
      canDelete: isSa || isOwner,
      canToggleActive: isSa || isOwner,
    },
  };

  return {
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: isSa ? '1' : isOwner ? '2' : '3',
      name: `${isSa ? 'Super Admin' : isOwner ? 'Pemilik Toko' : 'Admin Toko'} (Standalone)`,
      email: `${role.toLowerCase()}@tokogklaku.com`,
      roles: [role.toUpperCase()],
      permissions: isSa || isOwner ? ['*'] : ['read', 'write'],
    },
    hasPermission: () => true,
    hasRole: (r: string) => r.toUpperCase() === role.toUpperCase(),
    menuPermissions,
    canAccessMenu: (menuCodeOrPath: string) => {
      if (isSa) return true;
      const lower = menuCodeOrPath.toLowerCase().replace(/^\/+/, '');
      const item = menuPermissions[lower] || Object.values(menuPermissions).find(
        (p: any) => p.fullPath?.toLowerCase().replace(/^\/+/, '') === lower
      );
      return item ? Boolean(item.canRead) : true;
    },
    canPerformAction: (menuCodeOrPath: string, action: 'create' | 'update' | 'delete' | 'status') => {
      if (isSa) return true;
      const lower = menuCodeOrPath.toLowerCase().replace(/^\/+/, '');
      const item = menuPermissions[lower] || Object.values(menuPermissions).find(
        (p: any) => p.fullPath?.toLowerCase().replace(/^\/+/, '') === lower
      );
      if (!item) return false;
      if (action === 'create') return Boolean(item.canCreate);
      if (action === 'update') return Boolean(item.canUpdate);
      if (action === 'delete') return Boolean(item.canDelete);
      if (action === 'status') return Boolean(item.canToggleActive);
      return false;
    },
    login: async () => {},
    logout: () => {},
  };
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SharedProvider queryClient={queryClient} authContext={getStandaloneAuthContext()}>
          <LoadingProvider>
            <TooltipProvider>
              <App />
              <SonnerToaster />
              <NotificationListener />
              <GlobalLoadingOverlay />
            </TooltipProvider>
          </LoadingProvider>
        </SharedProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
