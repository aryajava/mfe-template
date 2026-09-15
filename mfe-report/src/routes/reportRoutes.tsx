import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@template/shared';
import LaporanPenjualanIndex from '../pages/LaporanPenjualan/Index';
import NotFound from '../pages/NotFound';

export const ReportRoutes: React.FC = () => {
  const { canAccessMenu } = useAuth();
  const canReadLaporan = canAccessMenu('laporan-penjualan');

  return (
    <Routes>
      {canReadLaporan ? (
        <>
          <Route index element={<LaporanPenjualanIndex />} />
          <Route path="laporan-penjualan" element={<LaporanPenjualanIndex />} />
        </>
      ) : (
        <Route index element={<NotFound />} />
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default ReportRoutes;
