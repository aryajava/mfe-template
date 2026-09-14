import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Layers,
  Users,
  Truck,
  UserCheck,
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

export const Home: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [produkCount, setProdukCount] = useState<number | null>(null);
  const [kategoriCount, setKategoriCount] = useState<number | null>(null);

  useEffect(() => {
    productApi
      .getPaged({ pageSize: 1 })
      .then((res) => setProdukCount(res.total))
      .catch(() => setProdukCount(null));

    productApi
      .getCategories()
      .then((cats) => setKategoriCount(cats.length))
      .catch(() => setKategoriCount(null));
  }, []);

  const masterModules = [
    {
      id: 'produk',
      title: 'Master Produk',
      description: 'Kelola katalog produk, harga dasar, persentase diskon promosi, dan kuota stok.',
      icon: Package,
      path: 'produk',
      countLabel:
        produkCount !== null ? `${produkCount} Produk` : null,
      active: true,
      color: 'bg-orange-500 text-white',
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      id: 'kategori',
      title: 'Master Kategori',
      description: 'Kelola hierarki klasifikasi produk (Elektronik, Fashion, Otomotif, Rumah).',
      icon: Layers,
      path: 'kategori',
      countLabel:
        kategoriCount !== null ? `${kategoriCount} Kategori` : null,
      active: false,
      color: 'bg-blue-500 text-white',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'user',
      title: 'Master User & Staf',
      description: 'Manajemen hak akses pengurus (Admin Toko, Pemilik Toko, Super Admin).',
      icon: Users,
      path: 'user',
      countLabel: 'Akses Terbatas',
      active: false,
      color: 'bg-purple-500 text-white',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'ekspedisi',
      title: 'Master Ekspedisi',
      description: 'Pengaturan opsi kurir pengiriman (Kurir Toko, J&T, SiCepat) dan tarif ongkir.',
      icon: Truck,
      path: 'ekspedisi',
      countLabel: 'Konfigurasi Toko',
      active: false,
      color: 'bg-emerald-500 text-white',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'pelanggan',
      title: 'Master Pelanggan',
      description: 'Daftar data akun pembeli terdaftar, status verifikasi, dan riwayat pesanan.',
      icon: UserCheck,
      path: 'pelanggan',
      countLabel: 'Data Pengunjung',
      active: false,
      color: 'bg-teal-500 text-white',
      badgeColor: 'bg-teal-100 text-teal-800',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & User info from useAuth */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
            <span>Beranda</span>
            <span>/</span>
            <span className="text-orange-600 font-semibold">Master Data Hub</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Pusat Data Master Toko
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
              <Sparkles className="w-3 h-3" />
              MFE Master
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Pusat pengelolaan entitas master data untuk aplikasi toko online Toko GKLaku.
          </p>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-xs text-xs text-gray-600">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>Pengguna: <strong className="text-gray-900">{user.name}</strong></span>
          </div>
        )}
      </div>

      {/* Grid of Master Modules with Card component from @template/shared */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {masterModules.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.id}
              className={cn(
                'flex flex-col justify-between transition-all duration-200',
                module.active
                  ? 'hover:shadow-md hover:border-orange-300'
                  : 'opacity-80 border-gray-200/70'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shadow-xs', module.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {module.countLabel ? (
                    <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', module.badgeColor)}>
                      {module.countLabel}
                    </span>
                  ) : (
                    <LoadingSpinner size="sm" />
                  )}
                </div>
                <CardTitle className="text-base font-bold text-gray-900">
                  {module.title}
                </CardTitle>
                <CardDescription className="text-xs text-gray-500 leading-relaxed line-clamp-2 mt-1">
                  {module.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {module.active ? (
                  <Button asChild variant="secondary" className="w-full justify-between bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800">
                    <Link to={module.path}>
                      <span>Buka Kelola Data</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                ) : (
                  <div className="text-xs text-gray-400 bg-gray-50 py-2 px-3 rounded-md text-center italic">
                    Tersedia untuk ekspansi mendatang
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
