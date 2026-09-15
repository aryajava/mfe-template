import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Edit,
  ImageIcon,
  Sparkles,
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
  cn,
} from '@template/shared';
import { productApi } from '../../services/productApi';
import {
  CategoryItem,
  UpdateProductPayload,
  hitungHargaEfektif,
  formatRupiah,
} from '../../types/produk';

export const ProdukUbah: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [formData, setFormData] = useState<{
    title: string;
    price: number;
    categoryId: number;
    description: string;
    image: string;
    discountPercent: number;
    stock: number;
    version: number;
  } | null>(null);

  const [discountInput, setDiscountInput] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load product and categories
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    Promise.all([productApi.getById(id), productApi.getCategories()])
      .then(([prod, cats]) => {
        setCategories(cats);
        if (prod) {
          setFormData({
            title: prod.title,
            price: prod.price,
            categoryId: prod.categoryId,
            description: prod.description || '',
            image: prod.image || '',
            discountPercent: prod.discountPercent || 0,
            stock: prod.stock,
            version: prod.version,
          });
          setDiscountInput(
            prod.discountPercent !== null && prod.discountPercent !== undefined
              ? String(prod.discountPercent)
              : '0'
          );
        }
      })
      .catch((err: any) => {
        console.error('Gagal mengambil data produk atau kategori:', err);
        setApiError(err.message || 'Gagal memuat data dari API.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 text-sm text-gray-500">
        <LoadingSpinner size="lg" />
        <span>Memuat data produk dari API backend...</span>
      </div>
    );
  }

  if (!formData || !id) {
    return (
      <div className="p-8 max-w-lg mx-auto">
        <Card className="p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Produk Tidak Ditemukan
          </h2>
          <p className="text-sm text-gray-500">
            Produk dengan ID <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{id}</code> tidak ditemukan pada API backend.
          </p>
          {apiError && <p className="text-xs text-red-600 font-mono">{apiError}</p>}
          <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
            <Link to="../.." relative="path">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Produk</span>
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const hargaEfektif = hitungHargaEfektif(formData.price, formData.discountPercent);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDiscountInput(val);
    const num = parseFloat(val);
    const parsed = isNaN(num) ? 0 : num;

    setFormData((prev) =>
      prev
        ? {
            ...prev,
            discountPercent: parsed,
          }
        : null
    );

    if (parsed >= 100) {
      setErrors((prev) => ({
        ...prev,
        discountPercent: 'Diskon harus kurang dari 100% (maksimal 99.99%).',
      }));
    } else if (parsed < 0) {
      setErrors((prev) => ({
        ...prev,
        discountPercent: 'Diskon tidak boleh bernilai negatif.',
      }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.discountPercent;
        return copy;
      });
    }
  };

  const validate = (): boolean => {
    if (!formData) return false;
    const err: Record<string, string> = {};
    if (!formData.title.trim()) {
      err.title = 'Nama produk wajib diisi.';
    }
    if (formData.price < 100 || !Number.isInteger(Number(formData.price))) {
      err.price = 'Harga dasar minimal Rp 100 dan harus bilangan bulat.';
    }
    if (formData.discountPercent < 0 || formData.discountPercent >= 100) {
      err.discountPercent = 'Diskon harus kurang dari 100% (maksimal 99.99%).';
    }
    if (formData.stock < 0 || !Number.isInteger(Number(formData.stock))) {
      err.stock = 'Stok tidak boleh bernilai negatif dan harus bilangan bulat.';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    showLoading(`Menyimpan perubahan produk #${id}...`);
    try {
      const payload: UpdateProductPayload = {
        title: formData.title.trim(),
        price: Number(formData.price),
        categoryId: Number(formData.categoryId),
        stock: Number(formData.stock),
        version: formData.version,
        description: formData.description.trim() || null,
        image: formData.image.trim() || null,
        discountPercent:
          formData.discountPercent > 0 ? Number(formData.discountPercent) : null,
      };

      const updated = await productApi.update(id, payload);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        message: `Produk "${updated.title}" berhasil diperbarui di server.`,
        type: 'success',
      });
      navigate('../..', { relative: 'path' });
    } catch (err: any) {
      console.error('Gagal memperbarui produk:', err);
      const errorMsg = err.message || 'Terjadi kesalahan saat memperbarui produk.';
      setApiError(errorMsg);
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        message: errorMsg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
      hideLoading();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-1">
            <span>Beranda</span>
            <span>/</span>
            <span>Master</span>
            <span>/</span>
            <Link to="../.." relative="path" className="hover:text-orange-600">
              Produk
            </Link>
            <span>/</span>
            <span className="text-orange-600 font-semibold">Ubah</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Edit className="w-6 h-6 text-orange-600" />
              Ubah Data Produk #{id}
            </h1>
            <span className="text-xs bg-gray-100 text-gray-600 font-mono px-2 py-0.5 rounded">
              v{formData.version}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Perubahan akan dikirim via <code className="bg-gray-100 text-xs px-1 py-0.5 rounded">PUT /api/products/{id}</code>.
          </p>
        </div>

        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link to="../.." relative="path">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
            <span>Kembali</span>
          </Link>
        </Button>
      </div>

      {/* Api Error Alert */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-800 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Gagal Memperbarui Produk</h4>
            <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Informasi Dasar Produk
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Identitas nama, kategori produk, dan deskripsi singkat.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nama Produk with Label & Input */}
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="title" className="font-semibold text-gray-800">
                  Nama Produk (Title) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Contoh: Sepatu Running Pro Ultralight"
                  className={cn(errors.title && 'border-red-400 bg-red-50/20')}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 font-medium">{errors.title}</p>
                )}
              </div>

              {/* Kategori */}
              <div className="space-y-1.5">
                <Label htmlFor="categoryId" className="font-semibold text-gray-800">
                  Kategori <span className="text-red-500">*</span>
                </Label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      categoryId: Number(e.target.value),
                    })
                  }
                  className="w-full h-10 px-3 py-2 text-sm bg-gray-50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:bg-white text-gray-900 cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stok */}
              <div className="space-y-1.5">
                <Label htmlFor="stock" className="font-semibold text-gray-800">
                  Jumlah Stok <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stock: Number(e.target.value) || 0,
                    })
                  }
                  className={cn(errors.stock && 'border-red-400 bg-red-50/20')}
                />
                {errors.stock && (
                  <p className="text-xs text-red-600 font-medium">{errors.stock}</p>
                )}
              </div>

              {/* Deskripsi */}
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="description" className="font-semibold text-gray-800">
                  Deskripsi Produk
                </Label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Rincian fitur, spesifikasi bahan, ukuran, dll..."
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:bg-white text-gray-900 resize-none transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harga & Diskon */}
        <Card className="shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Harga & Diskon
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Atur harga dasar jual dan persentase potongan harga.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Harga Dasar */}
              <div className="space-y-1.5">
                <Label htmlFor="price" className="font-semibold text-gray-800">
                  Harga Dasar (Rp) <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                    Rp
                  </span>
                  <Input
                    id="price"
                    type="number"
                    min="100"
                    step="1"
                    value={formData.price === 0 ? '' : formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="100"
                    className={cn('pl-10', errors.price && 'border-red-400 bg-red-50/20')}
                  />
                </div>
                {errors.price && (
                  <p className="text-xs text-red-600 font-medium">{errors.price}</p>
                )}
              </div>

              {/* Diskon */}
              <div className="space-y-1.5">
                <Label htmlFor="discount" className="font-semibold text-gray-800">
                  Diskon Promosi (%)
                </Label>
                <div className="relative">
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="99.99"
                    step="0.01"
                    allowDecimal={true}
                    maxDecimalDigits={2}
                    value={discountInput}
                    onChange={handleDiscountChange}
                    placeholder="0"
                    className={cn('pr-8', errors.discountPercent && 'border-red-400 bg-red-50/20')}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                    %
                  </span>
                </div>
                {errors.discountPercent && (
                  <p className="text-xs text-red-600 font-medium">
                    {errors.discountPercent}
                  </p>
                )}
              </div>
            </div>

            {/* Kotak Ringkasan Harga Efektif */}
            <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-950">
                    Kalkulasi Harga Efektif Toko
                  </h4>
                  <p className="text-xs text-orange-800 mt-0.5">
                    Harga yang akan dibayar oleh pembeli setelah diskon.
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                {formData.discountPercent > 0 && (
                  <span className="text-xs text-gray-500 line-through block">
                    {formatRupiah(formData.price)} (Diskon {formData.discountPercent}%)
                  </span>
                )}
                <span className="text-lg font-bold text-orange-600">
                  {formatRupiah(hargaEfektif)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gambar Produk */}
        <Card className="shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold text-gray-900">
              Media & Foto Produk
            </CardTitle>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Masukkan tautan gambar produk (opsional, disarankan rasio 4:3).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="image" className="font-semibold text-gray-800">
                  URL Gambar Produk
                </Label>
                <Input
                  id="image"
                  type="url"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://fakestoreapi.com/img/..."
                />
              </div>

              {/* Pratinjau Foto */}
              <div className="w-full h-28 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt="Pratinjau"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-2 text-gray-400">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                    <span className="text-xs">Pratinjau Foto</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons using Button from shared */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button asChild variant="outline">
            <Link to="../.." relative="path">
              Batal
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProdukUbah;
