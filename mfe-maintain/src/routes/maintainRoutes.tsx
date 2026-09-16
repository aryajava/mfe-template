import React from 'react';
import { Routes, Route } from 'react-router-dom';
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

  // Cari halaman pertama yang bisa diakses untuk index
  const IndexPage = (() => {
    if (canReadGrupMenu) return <GrupMenuIndex />;
    if (canReadMenu) return <MenuIndex />;
    if (canReadAplikasi) return <PengaturanAplikasiIndex />;
    if (canReadToko) return <PengaturanTokoIndex />;
    return <NotFound />;
  })();

  return (
    <Routes>
      {/* Index: render halaman pertama yang bisa diakses */}
      <Route index element={IndexPage} />

      {/* Sub-domain: Master Grup Menu */}
      {canReadGrupMenu && (
        <>
          <Route path="grup-menu" element={<GrupMenuIndex />} />
          <Route path="master-grup-menu" element={<GrupMenuIndex />} />
        </>
      )}

      {/* Sub-domain: Master Menu */}
      {canReadMenu && (
        <>
          <Route path="menu" element={<MenuIndex />} />
          <Route path="master-menu" element={<MenuIndex />} />
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
