import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Layers,
  AlertCircle,
  Package,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  LoadingSpinner,
  useLoading,
  useEventBus,
  MFE_EVENTS,
} from '@template/shared';
import { categoryApi } from '../../services/categoryApi';
import { CategoryItem } from '../../types/kategori';

export const KategoriUbah: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const [category, setCategory] = useState<CategoryItem | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/master/kategori');
      return;
    }

    setIsLoading(true);
    categoryApi
      .getById(id)
      .then((res) => {
        setCategory(res);
        setName(res.name);
      })
      .catch((err) => {
        console.error('Gagal mengambil data kategori:', err);
        setApiError(err.message || 'Kategori tidak ditemukan.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setError('Nama kategori tidak boleh kosong.');
      return;
    }

    if (trimmed.length > 100) {
      setError('Nama kategori maksimal 100 karakter.');
      return;
    }

    setError(null);
    setApiError(null);
    setIsSubmitting(true);
    showLoading();

    try {
      const updated = await categoryApi.update(category.id, {
        name: trimmed,
        version: category.version,
      });

      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Kategori Berhasil Diperbarui',
        message: `Kategori "${updated.name}" berhasil disimpan.`,
      });

      navigate('/master/kategori');
    } catch (err: any) {
      console.error('Gagal memperbarui kategori:', err);
      setApiError(err.message || 'Gagal memperbarui kategori.');
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-medium text-gray-500">Memuat data kategori...</p>
      </div>
    );
  }

  if (!category && apiError) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Kategori Tidak Ditemukan</h3>
        <p className="text-sm text-gray-500 mb-4">{apiError}</p>
        <Button onClick={() => navigate('/master/kategori')} variant="outline" size="sm" className="cursor-pointer">
          Kembali ke Kategori
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header & Breadcrumbs */}
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
          <Link to="/dashboard" className="hover:text-orange-600 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link to="/master" className="hover:text-orange-600 transition-colors">
            Master
          </Link>
          <span>/</span>
          <Link to="/master/kategori" className="hover:text-orange-600 transition-colors">
            Kategori
          </Link>
          <span>/</span>
          <span className="text-orange-600 font-semibold">Ubah</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/master/kategori')}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
              title="Kembali ke Kategori"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ubah Kategori</h1>
                <p className="text-sm text-gray-500">
                  Perbarui nama dan konfigurasi klasifikasi produk toko
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Gagal Memperbarui Kategori</h4>
            <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <Card className="border border-gray-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 text-orange-600">
                <Layers className="h-4 w-4" />
                <CardTitle className="text-base font-bold text-gray-900">
                  Detail Kategori
                </CardTitle>
              </div>

              {category && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    <Package className="h-3.5 w-3.5 text-gray-500" />
                    <span>{category.productCount} Produk Terkait</span>
                  </span>
                  {category.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>Aktif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                      <XCircle className="h-3 w-3 text-gray-500" />
                      <span>Nonaktif</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Sistem menggunakan concurrency check untuk memastikan tidak ada konflik pembaruan data secara bersamaan.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            <div>
              <Label htmlFor="categoryName" className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Nama Kategori <span className="text-red-500">*</span>
              </Label>
              <Input
                id="categoryName"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                  if (apiError) setApiError(null);
                }}
                className={`h-10 text-sm bg-white focus:bg-white border-gray-200 focus:ring-orange-500 ${
                  error ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                autoFocus
              />
              {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/kategori')}
                disabled={isSubmitting}
                className="cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default KategoriUbah;
