import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@template/shared';
import ProdukIndex from '../pages/Produk/Index';
import ProdukTambah from '../pages/Produk/Tambah';
import ProdukUbah from '../pages/Produk/Ubah';
import KategoriIndex from '../pages/Kategori/Index';
import KategoriTambah from '../pages/Kategori/Tambah';
import KategoriUbah from '../pages/Kategori/Ubah';
import EkspedisiIndex from '../pages/Ekspedisi/Index';
import EkspedisiTambah from '../pages/Ekspedisi/Tambah';
import EkspedisiUbah from '../pages/Ekspedisi/Ubah';
import PelangganIndex from '../pages/Pelanggan/Index';
import UserIndex from '../pages/User/Index';
import UserTambah from '../pages/User/Tambah';
import UserUbah from '../pages/User/Ubah';
import Home from '../pages/Home';
import NotFound from '../pages/NotFound';

/**
 * Sentral Rute MFE Master (Backend-Driven Dynamic Route Registration)
 *
 * Rute dirakit secara dinamis berdasarkan izin otorisasi backend (canRead, canCreate, canUpdate).
 * Rute yang tidak diizinkan sama sekali tidak didaftarkan ke dalam React Router,
 * sehingga navigasi langsung di address bar otomatis jatuh ke rute 404 (NotFound).
 */
export const MasterRoutes: React.FC = () => {
  const { canAccessMenu, canPerformAction } = useAuth();

  // Evaluasi hak akses Produk
  const canReadProduk = canAccessMenu('master-produk');
  const canCreateProduk = canPerformAction('master-produk', 'create');
  const canUpdateProduk = canPerformAction('master-produk', 'update');

  // Evaluasi hak akses Kategori
  const canReadKategori = canAccessMenu('master-kategori');
  const canCreateKategori = canPerformAction('master-kategori', 'create');
  const canUpdateKategori = canPerformAction('master-kategori', 'update');

  // Evaluasi hak akses Ekspedisi
  const canReadEkspedisi = canAccessMenu('master-ekspedisi');
  const canCreateEkspedisi = canPerformAction('master-ekspedisi', 'create');
  const canUpdateEkspedisi = canPerformAction('master-ekspedisi', 'update');

  // Evaluasi hak akses Pelanggan
  const canReadPelanggan = canAccessMenu('master-pelanggan');

  // Evaluasi hak akses User
  const canReadUser = canAccessMenu('master-user');
  const canCreateUser = canPerformAction('master-user', 'create');
  const canUpdateUser = canPerformAction('master-user', 'update');

  return (
    <Routes>
      {/* Halaman Hub Utama Master Data */}
      <Route index element={<Home />} />

      {/* Sub-Domain: Master Produk */}
      {canReadProduk && (
        <Route path="produk">
          <Route index element={<ProdukIndex />} />
          {canCreateProduk && <Route path="tambah" element={<ProdukTambah />} />}
          {canUpdateProduk && <Route path="edit/:id" element={<ProdukUbah />} />}
        </Route>
      )}

      {/* Sub-Domain: Master Kategori */}
      {canReadKategori && (
        <Route path="kategori">
          <Route index element={<KategoriIndex />} />
          {canCreateKategori && <Route path="tambah" element={<KategoriTambah />} />}
          {canUpdateKategori && <Route path="edit/:id" element={<KategoriUbah />} />}
        </Route>
      )}

      {/* Sub-Domain: Master Ekspedisi */}
      {canReadEkspedisi && (
        <Route path="ekspedisi">
          <Route index element={<EkspedisiIndex />} />
          {canCreateEkspedisi && <Route path="tambah" element={<EkspedisiTambah />} />}
          {canUpdateEkspedisi && <Route path="edit/:id" element={<EkspedisiUbah />} />}
        </Route>
      )}

      {/* Sub-Domain: Master Pelanggan */}
      {canReadPelanggan && (
        <Route path="pelanggan">
          <Route index element={<PelangganIndex />} />
        </Route>
      )}

      {/* Sub-Domain: Master User */}
      {canReadUser && (
        <Route path="user">
          <Route index element={<UserIndex />} />
          {canCreateUser && <Route path="tambah" element={<UserTambah />} />}
          {canUpdateUser && <Route path="edit/:id" element={<UserUbah />} />}
        </Route>
      )}

      {/* Fallback 404 jika rute master tidak ditemukan atau tidak memiliki izin */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default MasterRoutes;
