import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@template/shared';
import PengaturanAplikasiIndex from '../pages/PengaturanAplikasi/Index';
import PengaturanTokoIndex from '../pages/PengaturanToko/Index';
import GrupMenuIndex from '../pages/GrupMenu/Index';
import MenuIndex from '../pages/Menu/Index';
import NotFound from '../pages/NotFound';

export const MaintainRoutes: React.FC = () => {
  const { canAccessMenu } = useAuth();

  const canReadAplikasi = canAccessMenu('pengaturan-aplikasi');
  const canReadToko = canAccessMenu('pengaturan-toko');
  const canReadGrupMenu =
    canAccessMenu('master-grup-menu') || canAccessMenu('grup-menu');
  const canReadMenu =
    canAccessMenu('master-menu') || canAccessMenu('menu');

  // Default target fallback
  const getDefaultTarget = (): string | null => {
    if (canReadGrupMenu) return 'grup-menu';
    if (canReadMenu) return 'menu';
    if (canReadAplikasi) return 'pengaturan-aplikasi';
    if (canReadToko) return 'pengaturan-toko';
    return null;
  };

  const defaultTarget = getDefaultTarget();

  return (
    <Routes>
      {/* Index redirection based on access */}
      <Route
        index
        element={
          defaultTarget ? (
            <Navigate to={defaultTarget} replace />
          ) : (
            <NotFound />
          )
        }
      />

      {/* Sub-domain: Master Grup Menu */}
      {canReadGrupMenu && (
        <>
          <Route path="grup-menu" element={<GrupMenuIndex />} />
          <Route path="master-grup-menu" element={<Navigate to="../grup-menu" replace />} />
        </>
      )}

      {/* Sub-domain: Master Menu */}
      {canReadMenu && (
        <>
          <Route path="menu" element={<MenuIndex />} />
          <Route path="master-menu" element={<Navigate to="../menu" replace />} />
        </>
      )}

      {/* Sub-domain: Pengaturan Aplikasi */}
      {canReadAplikasi && (
        <Route path="pengaturan-aplikasi" element={<PengaturanAplikasiIndex />} />
      )}

      {/* Sub-domain: Pengaturan Toko */}
      {canReadToko && (
        <Route path="pengaturan-toko" element={<PengaturanTokoIndex />} />
      )}

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default MaintainRoutes;
