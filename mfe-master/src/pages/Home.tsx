import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Truck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  LoadingSpinner,
  useAuth,
  cn,
} from '@template/shared';
import { productApi } from '../services/productApi';
import { categoryApi } from '../services/categoryApi';
import { courierApi } from '../services/courierApi';

export const Home: React.FC = () => {
  const { user, canAccessMenu } = useAuth();

  // Evaluasi hak akses berbasis Shell Auth Context
  const canAccessProduk = canAccessMenu('master-produk') || canAccessMenu('/master/produk');
  const canAccessKategori = canAccessMenu('master-kategori') || canAccessMenu('/master/kategori');
  const canAccessEkspedisi = canAccessMenu('master-ekspedisi') || canAccessMenu('/master/ekspedisi');

  // Data hitungan entitas (hanya diambil jika memiliki hak akses)
  const [produkCount, setProdukCount] = useState<number | null>(null);
  const [kategoriCount, setKategoriCount] = useState<number | null>(null);
  const [ekspedisiCount, setEkspedisiCount] = useState<number | null>(null);

  // Evaluasi label peran
  const roles = useMemo(() => {
    return (user?.roles || []).map((r: string) => r.toLowerCase());
  }, [user]);

  const isSa = useMemo(() => {
    return roles.some((r) => ['sa', 'superadmin', 'super admin'].includes(r));
  }, [roles]);

  const isOwner = useMemo(() => {
    return roles.some((r) => r === 'owner');
  }, [roles]);

  const roleLabel = useMemo(() => {
    if (isSa) return 'Super Admin';
    if (isOwner) return 'Pemilik Toko';
    if (roles.includes('admin')) return 'Admin Toko';
    if (user?.roles?.[0]) return user.roles[0].toUpperCase();
    return 'Pengguna Aktif';
  }, [isSa, isOwner, roles, user]);

  // Ambil hitungan hanya untuk modul yang diizinkan (mencegah 403 Forbidden di API)
  useEffect(() => {
    if (canAccessProduk) {
      productApi
        .getPaged({ pageSize: 1 })
        .then((res) => setProdukCount(res?.total ?? null))
        .catch(() => setProdukCount(null));
    } else {
      setProdukCount(null);
    }

    if (canAccessKategori) {
      categoryApi
        .getPaged({ pageSize: 1 })
        .then((res) => setKategoriCount(res?.total ?? null))
        .catch(() => setKategoriCount(null));
    } else {
      setKategoriCount(null);
    }

    if (canAccessEkspedisi) {
      courierApi
        .getPaged({ pageSize: 1 })
        .then((res) => setEkspedisiCount(res?.total ?? null))
        .catch(() => setEkspedisiCount(null));
    } else {
      setEkspedisiCount(null);
    }
  }, [canAccessProduk, canAccessKategori, canAccessEkspedisi]);

  // Master modules definition
  const allModules = useMemo(
    () => [
      {
        id: 'produk',
        menuCode: 'master-produk',
        title: 'Produk',
        description: 'Katalog produk toko, penetapan harga dasar, persentase diskon promosi, dan kuota stok gudang.',
        icon: Package,
        path: 'produk',
        hasAccess: canAccessProduk,
        countLabel: produkCount !== null ? `${produkCount} Produk` : 'Memuat data...',
      },
      {
        id: 'kategori',
        menuCode: 'master-kategori',
        title: 'Kategori',
        description: 'Hierarki klasifikasi produk untuk pengelompokan etalase dan pemetaan barang jualan.',
        icon: Layers,
        path: 'kategori',
        hasAccess: canAccessKategori,
        countLabel: kategoriCount !== null ? `${kategoriCount} Kategori` : 'Memuat data...',
      },
      {
        id: 'ekspedisi',
        menuCode: 'master-ekspedisi',
        title: 'Ekspedisi',
        description: 'Pengaturan mitra kurir logistik pengiriman pesanan dan batas tarif ongkos kirim.',
        icon: Truck,
        path: 'ekspedisi',
        hasAccess: canAccessEkspedisi,
        countLabel: ekspedisiCount !== null ? `${ekspedisiCount} Mitra Kurir` : 'Memuat data...',
      },
    ],
    [canAccessProduk, canAccessKategori, canAccessEkspedisi, produkCount, kategoriCount, ekspedisiCount]
  );

  // Hanya tampilkan kartu modul yang memiliki izin akses (dinamis disembunyikan sesuai keputusan Q4)
  const visibleModules = useMemo(() => {
    return allModules.filter((m) => m.hasAccess);
  }, [allModules]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Utama & Status Sesi Aktif */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
            <span>Beranda</span>
            <span className="text-gray-300">/</span>
            <span className="text-orange-600 font-semibold">Master Data Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Pusat Data Master Toko
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/60">
              <Sparkles className="w-3 h-3 text-orange-600" />
              MFE Master
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Pengelolaan entitas master data terpusat untuk aplikasi Toko GKLaku.
          </p>
        </div>

        {/* Informasi Sesi Pengguna Aktif */}
        {user && (
          <div className="flex items-center gap-3 px-3.5 py-2 bg-white border border-gray-200/90 rounded-lg shadow-2xs text-xs">
            <div className="w-8 h-8 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Sesi:</span>
                <strong className="text-gray-900 font-semibold">
                  {user.name || user.email || 'Pengguna Aktif'}
                </strong>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-orange-100 text-orange-800">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid Kartu Modul Master yang Diizinkan */}
      {visibleModules.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500">
            Tidak ada modul master yang dapat Anda akses dengan peran saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleModules.map((module) => {
            const Icon = module.icon;

            return (
              <Card
                key={module.id}
                className={cn(
                  'flex flex-col justify-between transition-all duration-200 bg-white border',
                  'border-gray-200 shadow-2xs hover:shadow-md hover:border-orange-300'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center border shadow-2xs bg-orange-50 text-orange-600 border-orange-100">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      {module.countLabel ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/60">
                          {module.countLabel}
                        </span>
                      ) : (
                        <LoadingSpinner size="sm" />
                      )}
                    </div>
                  </div>

                  <CardTitle className="text-base font-bold tracking-tight text-gray-900">
                    {module.title}
                  </CardTitle>

                  <CardDescription className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-1">
                    {module.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <Button
                    asChild
                    variant="secondary"
                    size="sm"
                    className="w-full justify-between bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800 border border-orange-200/70 font-medium text-xs transition-colors cursor-pointer"
                  >
                    <Link to={module.path}>
                      <span>Buka Kelola Data</span>
                      <ArrowRight className="w-4 h-4 ml-2 text-orange-600" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Home;
