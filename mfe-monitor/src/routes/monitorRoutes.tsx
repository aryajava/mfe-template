import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@template/shared';
import PermintaanDiskonIndex from '../pages/PermintaanDiskon/Index';
import PersetujuanDiskonIndex from '../pages/PersetujuanDiskon/Index';
import NotFound from '../pages/NotFound';

export const MonitorRoutes: React.FC = () => {
  const { canAccessMenu } = useAuth();

  const canReadPermintaan = canAccessMenu('permintaan-diskon');
  const canReadPersetujuan = canAccessMenu('persetujuan-diskon');

  return (
    <Routes>
      {/* Index: render halaman pertama yang bisa diakses */}
      {canReadPermintaan ? (
        <>
          <Route index element={<PermintaanDiskonIndex />} />
          <Route path="permintaan-diskon" element={<PermintaanDiskonIndex />} />
        </>
      ) : canReadPersetujuan ? (
        <>
          <Route index element={<PersetujuanDiskonIndex />} />
          <Route path="persetujuan-diskon" element={<PersetujuanDiskonIndex />} />
        </>
      ) : (
        <Route index element={<NotFound />} />
      )}

      {/* Sub-domain: Permintaan Diskon (jika user hanya punya akses persetujuan di index) */}
      {canReadPermintaan && canReadPersetujuan && (
        <Route path="persetujuan-diskon" element={<PersetujuanDiskonIndex />} />
      )}

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default MonitorRoutes;
