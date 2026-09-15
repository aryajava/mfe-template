import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProdukIndex from '../pages/Produk/Index';
import ProdukTambah from '../pages/Produk/Tambah';
import ProdukUbah from '../pages/Produk/Ubah';
import KategoriIndex from '../pages/Kategori/Index';
import KategoriTambah from '../pages/Kategori/Tambah';
import KategoriUbah from '../pages/Kategori/Ubah';
import EkspedisiIndex from '../pages/Ekspedisi/Index';
import EkspedisiTambah from '../pages/Ekspedisi/Tambah';
import EkspedisiUbah from '../pages/Ekspedisi/Ubah';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

/**
 * Sentral Rute MFE Master
 *
 * Struktur hirarki:
 * - / (index)              -> MasterHub / Overview kartu master
 * - /produk/*              -> Master Produk
 * - /kategori/*            -> Master Kategori
 * - /ekspedisi/*           -> Master Ekspedisi
 */
export const MasterRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Halaman Hub Utama Master Data */}
      <Route index element={<Home />} />

      {/* Sub-Domain: Master Produk */}
      <Route path="produk">
        <Route index element={<ProdukIndex />} />
        <Route path="tambah" element={<ProdukTambah />} />
        <Route path="edit/:id" element={<ProdukUbah />} />
      </Route>

      {/* Sub-Domain: Master Kategori */}
      <Route path="kategori">
        <Route index element={<KategoriIndex />} />
        <Route path="tambah" element={<KategoriTambah />} />
        <Route path="edit/:id" element={<KategoriUbah />} />
      </Route>

      {/* Sub-Domain: Master Ekspedisi */}
      <Route path="ekspedisi">
        <Route index element={<EkspedisiIndex />} />
        <Route path="tambah" element={<EkspedisiTambah />} />
        <Route path="edit/:id" element={<EkspedisiUbah />} />
      </Route>

      {/* Fallback 404 jika rute master tidak ditemukan */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default MasterRoutes;
