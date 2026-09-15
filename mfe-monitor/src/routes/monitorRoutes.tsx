import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
      {/* Index redirection based on access */}
      <Route
        index
        element={
          canReadPermintaan ? (
            <Navigate to="permintaan-diskon" replace />
          ) : canReadPersetujuan ? (
            <Navigate to="persetujuan-diskon" replace />
          ) : (
            <NotFound />
          )
        }
      />

      {/* Sub-domain: Permintaan Diskon */}
      {canReadPermintaan && (
        <Route path="permintaan-diskon" element={<PermintaanDiskonIndex />} />
      )}

      {/* Sub-domain: Persetujuan Diskon */}
      {canReadPersetujuan && (
        <Route path="persetujuan-diskon" element={<PersetujuanDiskonIndex />} />
      )}

      {/* Fallback 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default MonitorRoutes;
