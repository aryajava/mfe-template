import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProdukIndex from '../pages/Produk/Index';
import ProdukTambah from '../pages/Produk/Tambah';
import ProdukUbah from '../pages/Produk/Ubah';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

/**
 * Sentral Rute MFE Master
 *
 * Struktur hirarki:
 * - / (index)           -> MasterHub / Overview kartu master
 * - /produk             -> Landing / Tabel Data Produk
 * - /produk/tambah      -> Formulir Tambah Produk
 * - /produk/edit/:id    -> Formulir Edit Produk
 *
 * Master lainnya (Kategori, User, Ekspedisi, Pelanggan) dapat langsung
 * ditambahkan di bawah rute ini tanpa mengubah konfigurasi Shell.
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

      {/*
        Contoh penambahan domain master lainnya di masa depan:
        <Route path="kategori">
          <Route index element={<KategoriIndex />} />
          <Route path="tambah" element={<KategoriTambah />} />
          <Route path="edit/:id" element={<KategoriUbah />} />
        </Route>
        <Route path="user/*" element={<UserRoutes />} />
        <Route path="ekspedisi/*" element={<EkspedisiRoutes />} />
        <Route path="pelanggan/*" element={<PelangganRoutes />} />
      */}

      {/* Fallback 404 jika rute master tidak ditemukan */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default MasterRoutes;
