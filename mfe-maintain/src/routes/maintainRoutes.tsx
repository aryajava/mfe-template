import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@template/shared';
import PengaturanAplikasiIndex from '../pages/PengaturanAplikasi/Index';
import PengaturanTokoIndex from '../pages/PengaturanToko/Index';
import NotFound from '../pages/NotFound';

export const MaintainRoutes: React.FC = () => {
  const { canAccessMenu } = useAuth();

  const canReadAplikasi = canAccessMenu('pengaturan-aplikasi');
  const canReadToko = canAccessMenu('pengaturan-toko');

  return (
    <Routes>
      {/* Index redirection based on access */}
      <Route
        index
        element={
          canReadAplikasi ? (
            <Navigate to="pengaturan-aplikasi" replace />
          ) : canReadToko ? (
            <Navigate to="pengaturan-toko" replace />
          ) : (
            <NotFound />
          )
        }
      />

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
