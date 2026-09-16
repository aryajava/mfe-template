import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Truck,
  AlertCircle,
  Coins,
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
import { courierApi } from '../../services/courierApi';
import { formatRupiah } from '../../types/ekspedisi';

export const EkspedisiTambah: React.FC = () => {
  const navigate = useNavigate();
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();

  const [name, setName] = useState('');
  const [shippingFeeInput, setShippingFeeInput] = useState('10000');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedShippingFee = parseFloat(shippingFeeInput) || 0;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      newErrors.name = 'Nama ekspedisi wajib diisi.';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Nama ekspedisi maksimal 100 karakter.';
    }

    if (isNaN(parsedShippingFee) || parsedShippingFee < 0) {
      newErrors.shippingFee = 'Tarif ongkir harus berupa angka 0 atau lebih.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      setApiError(null);
      showLoading();

      const created = await courierApi.create({
        name: name.trim(),
        shippingFee: parsedShippingFee,
      });

      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        title: 'Ekspedisi Berhasil Didaftarkan',
        message: `Layanan ekspedisi "${created.name}" dengan tarif ongkir ${formatRupiah(
          created.shippingFee
        )} berhasil disimpan.`,
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'courier', action: 'create', id: created.id });

      navigate('/master/ekspedisi');
    } catch (err: any) {
      setApiError(err.message || 'Gagal menyimpan ekspedisi baru.');
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
              onClick={() => navigate('/master/ekspedisi')}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-gray-600 cursor-pointer"
              title="Kembali ke Ekspedisi"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-xs">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tambah Ekspedisi Baru</h1>
                <p className="text-sm text-gray-500">
                  Daftarkan mitra ekspedisi pengiriman baru beserta tarif ongkos kirim standar toko
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
            <h4 className="font-semibold text-red-900">Gagal Menyimpan Ekspedisi</h4>
            <p className="text-xs text-red-700 mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <Card className="border border-gray-200 shadow-xs bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/40">
            <div className="flex items-center gap-2 text-orange-600">
              <Truck className="h-4 w-4" />
              <CardTitle className="text-base font-bold text-gray-900">
                Informasi Ekspedisi
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-gray-500 mt-0.5">
              Nama ekspedisi akan muncul sebagai pilihan pengiriman pada ringkasan checkout pesanan pelanggan.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-5">
            {/* Input Nama Ekspedisi */}
            <div>
              <Label htmlFor="courierName" className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Nama Ekspedisi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="courierName"
                type="text"
                placeholder="Contoh: JNE Reguler, SiCepat Kilat, Pengiriman Toko..."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  if (apiError) setApiError(null);
                }}
                className={`h-10 text-sm bg-white focus:bg-white border-gray-200 focus:ring-orange-500 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : ''
                }`}
                autoFocus
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name}</p>}
            </div>

            {/* Input Tarif Ongkir */}
            <div>
              <Label htmlFor="shippingFee" className="text-sm font-semibold text-gray-800 mb-1.5 block">
                Tarif Ongkos Kirim (Rupiah) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                  Rp
                </span>
                <Input
                  id="shippingFee"
                  type="number"
                  min="0"
                  step="500"
                  placeholder="10000"
                  value={shippingFeeInput}
                  onChange={(e) => {
                    setShippingFeeInput(e.target.value);
                    if (errors.shippingFee) setErrors((prev) => ({ ...prev, shippingFee: '' }));
                    if (apiError) setApiError(null);
                  }}
                  className={`pl-11 h-10 text-sm bg-white focus:bg-white border-gray-200 focus:ring-orange-500 ${
                    errors.shippingFee ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.shippingFee && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.shippingFee}</p>
              )}

              {/* Live Preview Tarif */}
              <div className="mt-2.5 flex items-center gap-2 p-3 rounded-lg bg-orange-50/60 border border-orange-200/60 text-xs text-orange-900">
                <Coins className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <span>
                  Pratinjau Tarif Ongkir:{' '}
                  <strong className="font-bold text-orange-700 font-mono text-sm">
                    {formatRupiah(parsedShippingFee)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/master/ekspedisi')}
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
                    <span>Simpan Ekspedisi</span>
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

export default EkspedisiTambah;
