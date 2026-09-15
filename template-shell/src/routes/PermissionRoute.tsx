import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Forbidden from '../pages/Forbidden';

interface PermissionRouteProps {
  children: React.ReactNode;
}

/**
 * PermissionRoute: Mengorkestrasikan otorisasi rute di tingkat Shell Host.
 * Memeriksa location.pathname terhadap kamus menuPermissions sebelum remote MFE dieksekusi.
 */
export const PermissionRoute: React.FC<PermissionRouteProps> = ({ children }) => {
  const location = useLocation();
  const { canAccessMenu, user } = useAuth();

  const path = location.pathname.toLowerCase();

  // 1. Halaman beranda master dan dashboard selalu diizinkan
  if (path === '/master' || path === '/master/' || path === '/dashboard' || path === '/dashboard/') {
    return <>{children}</>;
  }

  // 2. Super Admin selalu lolos
  const isSa = user?.roles?.some((r) =>
    ['sa', 'superadmin', 'super admin'].includes(r.toLowerCase())
  );
  if (isSa) {
    return <>{children}</>;
  }

  // 3. Periksa rute modul master
  let requiredMenuOrPath: string | null = null;
  if (path.startsWith('/master/produk')) {
    requiredMenuOrPath = '/master/produk';
  } else if (path.startsWith('/master/kategori')) {
    requiredMenuOrPath = '/master/kategori';
  } else if (path.startsWith('/master/ekspedisi')) {
    requiredMenuOrPath = '/master/ekspedisi';
  } else if (path.startsWith('/master/pelanggan')) {
    requiredMenuOrPath = '/master/pelanggan';
  } else if (path.startsWith('/master/user')) {
    requiredMenuOrPath = '/master/user';
  }

  if (requiredMenuOrPath && !canAccessMenu(requiredMenuOrPath)) {
    return <Forbidden />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
