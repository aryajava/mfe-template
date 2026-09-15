import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@template/shared';
import PesananIndex from '../pages/Pesanan/Index';
import NotFound from '../pages/NotFound';

export const TrxRoutes: React.FC = () => {
  const { canAccessMenu } = useAuth();
  const canReadPesanan = canAccessMenu('pesanan');

  return (
    <Routes>
      {canReadPesanan ? (
        <>
          <Route index element={<PesananIndex />} />
          <Route path="pesanan" element={<PesananIndex />} />
        </>
      ) : (
        <Route index element={<NotFound />} />
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default TrxRoutes;
