import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Layers,
  AlertCircle,
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

export const KategoriTambah: React.FC = () => {
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const created = await categoryApi.create({ name: trimmed });

      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Kategori Berhasil Dibuat',
        message: `Kategori "${created.name}" telah terdaftar di database.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'category', action: 'create', id: created.id });

      navigate('/master/kategori');
    } catch (err: any) {
      console.error('Gagal membuat kategori:', err);
      setApiError(err.message || 'Gagal menyimpan kategori baru.');
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>

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
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tambah Kategori Baru</h1>
                <p className="text-sm text-gray-500">
                  Daftarkan kategori baru untuk klasifikasi produk toko
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
            <h4 className="font-semibold text-red-900">Gagal Menyimpan Kategori</h4>
            <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <Card className="border border-gray-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/40">
            <div className="flex items-center gap-2 text-orange-600">
              <Layers className="h-4 w-4" />
              <CardTitle className="text-base font-bold text-gray-900">
                Informasi Kategori
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Nama kategori harus unik, jelas, dan belum terdaftar pada sistem toko sebelumnya.
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
                placeholder="Contoh: Elektronik, Pakaian Pria, Makanan Ringan..."
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
              <p className="mt-1.5 text-xs text-gray-400">
                Maksimal 100 karakter. Gunakan huruf kapital di awal setiap kata.
              </p>
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
                    <span>Simpan Kategori</span>
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

export default KategoriTambah;
