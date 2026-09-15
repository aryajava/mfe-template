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
  type MenuPermissionItem,
} from '@template/shared';
import App from './App';
import './global.css';

const queryClient = new QueryClient();

// Matriks izin cadangan standar (sesuai kontrak backend C# RoleMenu)
const getRolePermissionMatrix = (role: string): Record<string, MenuPermissionItem> => {
  const r = role.toUpperCase();
  const isSa = r === 'SA' || r === 'SUPERADMIN' || r === 'SUPER ADMIN';
  const isOwner = r === 'OWNER';
  const isAdmin = r === 'ADMIN';
  const isStaff = r === 'STAFF';

  return {
    'master-produk': {
      menuCode: 'master-produk',
      groupCode: 'master',
      groupName: 'Master Data',
      urlPrefix: '/produk',
      fullPath: '/master/produk',
      canRead: isSa || isOwner || isAdmin || isStaff,
      canCreate: isSa || isOwner || isAdmin,
      canUpdate: isSa || isOwner || isAdmin,
      canDelete: isSa || isOwner,
      canToggleActive: isSa || isOwner,
    },
    'master-kategori': {
      menuCode: 'master-kategori',
      groupCode: 'master',
      groupName: 'Master Data',
      urlPrefix: '/kategori',
      fullPath: '/master/kategori',
      canRead: isSa || isOwner, // Admin dan Staff TIDAK diizinkan akses kategori
      canCreate: isSa || isOwner,
      canUpdate: isSa || isOwner,
      canDelete: isSa || isOwner,
      canToggleActive: isSa || isOwner,
    },
    'master-ekspedisi': {
      menuCode: 'master-ekspedisi',
      groupCode: 'master',
      groupName: 'Master Data',
      urlPrefix: '/ekspedisi',
      fullPath: '/master/ekspedisi',
      canRead: isSa || isOwner, // Admin dan Staff TIDAK diizinkan akses ekspedisi
      canCreate: isSa || isOwner,
      canUpdate: isSa || isOwner,
      canDelete: isSa || isOwner,
      canToggleActive: isSa || isOwner,
    },
  };
};

// Standalone Auth Context untuk standalone development (:5008) yang fail-closed
const getStandaloneAuthContext = (): AuthContextType => {
  let user: any = null;
  let role = 'ADMIN';

  try {
    const raw = localStorage.getItem('sast_user') || localStorage.getItem('user');
    if (raw) {
      user = JSON.parse(raw);
      role = (user.roles?.[0] || 'ADMIN').toUpperCase();
    }
  } catch {}

  const isSa = role === 'SA' || role === 'SUPERADMIN' || role === 'SUPER ADMIN';

  // 1. Coba baca izin yang disimpan/disinkronkan dari backend terlebih dahulu
  let menuPermissions: Record<string, MenuPermissionItem> = {};
  try {
    const cachedPerms = localStorage.getItem('sast_menuPermissions') || localStorage.getItem('menuPermissions');
    if (cachedPerms) {
      menuPermissions = JSON.parse(cachedPerms);
    }
  } catch {}

  // 2. Jika belum ada sinkronisasi, gunakan matriks bawaan yang sesuai kontrak backend
  if (Object.keys(menuPermissions).length === 0) {
    menuPermissions = getRolePermissionMatrix(role);
  }

  // Standar user jika belum ada
  if (!user && role !== 'GUEST') {
    user = {
      id: role === 'SA' ? '1' : role === 'OWNER' ? '2' : role === 'ADMIN' ? '3' : '4',
      name: `${role === 'SA' ? 'Super Admin' : role === 'OWNER' ? 'Pemilik Toko' : role === 'ADMIN' ? 'Admin Toko' : 'Staf Toko'} (Standalone)`,
      email: `${role.toLowerCase()}@tokogklaku.com`,
      roles: [role.toLowerCase(), role.toUpperCase()],
      permissions: isSa ? ['*'] : ['read', 'write'],
    };
  }

  const isAuthenticated = Boolean(user && role !== 'GUEST');

  return {
    isAuthenticated,
    isLoading: false,
    user: isAuthenticated ? user : null,
    hasPermission: (perm: string) => {
      if (!isAuthenticated || !user) return false;
      if (isSa || user.permissions?.includes('*')) return true;
      return Boolean(user.permissions?.includes(perm));
    },
    hasRole: (r: string) => {
      if (!isAuthenticated || !user) return false;
      return user.roles?.some((ur: string) => ur.toUpperCase() === r.toUpperCase());
    },
    menuPermissions,
    canAccessMenu: (menuCodeOrPath: string) => {
      if (!isAuthenticated || !user) return false;
      if (isSa) return true;
      const lower = menuCodeOrPath.toLowerCase().trim().replace(/^\/+/, '');
      if (lower === 'master' || lower === '') return true; // Hub diperbolehkan

      const item =
        menuPermissions[lower] ||
        Object.values(menuPermissions).find(
          (p: any) => p.fullPath?.toLowerCase().trim().replace(/^\/+/, '') === lower
        );
      return item ? Boolean(item.canRead) : false; // Strictly FAIL-CLOSED
    },
    canPerformAction: (
      menuCodeOrPath: string,
      action: 'create' | 'update' | 'delete' | 'status'
    ) => {
      if (!isAuthenticated || !user) return false;
      if (isSa) return true;
      const lower = menuCodeOrPath.toLowerCase().trim().replace(/^\/+/, '');
      const item =
        menuPermissions[lower] ||
        Object.values(menuPermissions).find(
          (p: any) => p.fullPath?.toLowerCase().trim().replace(/^\/+/, '') === lower
        );
      if (!item) return false; // Strictly FAIL-CLOSED
      if (action === 'create') return Boolean(item.canCreate);
      if (action === 'update') return Boolean(item.canUpdate);
      if (action === 'delete') return Boolean(item.canDelete);
      if (action === 'status') return Boolean(item.canToggleActive);
      return false;
    },
    login: async () => {},
    logout: () => {
      localStorage.removeItem('sast_user');
      localStorage.removeItem('user');
      localStorage.removeItem('sast_menuPermissions');
      localStorage.removeItem('menuPermissions');
      localStorage.removeItem('sast_apiKey');
      localStorage.removeItem('apiKey');
      window.location.reload();
    },
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
