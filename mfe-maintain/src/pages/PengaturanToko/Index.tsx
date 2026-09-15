import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  Percent,
  Truck,
  Save,
  RotateCcw,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  LoadingSpinner,
  useLoading,
  useAuth,
  useEventBus,
  MFE_EVENTS,
} from '@template/shared';
import { settingApi, SETTING_KEYS } from '../../services/settingApi';
import { SettingItem } from '../../types/setting';

export const PengaturanTokoIndex: React.FC = () => {
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { canPerformAction, hasRole } = useAuth();

  const isSa = hasRole('SA') || hasRole('SUPERADMIN') || hasRole('SUPER ADMIN');
  const isOwner = hasRole('OWNER');
  const canUpdate = isSa || isOwner || canPerformAction('pengaturan-toko', 'update');

  const [taxSetting, setTaxSetting] = useState<SettingItem | null>(null);
  const [taxInput, setTaxInput] = useState('2');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const tax = await settingApi.get(SETTING_KEYS.TAX_PERCENT).catch(() => null);
      if (tax) {
        setTaxSetting(tax);
        setTaxInput(tax.value);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pengaturan toko.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveTax = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(taxInput.trim());
    if (isNaN(val) || val < 0 || val > 100) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: 'Persentase pajak harus berupa angka antara 0 dan 100.',
      });
      return;
    }

    try {
      setIsSaving(true);
      showLoading();
      await settingApi.update(SETTING_KEYS.TAX_PERCENT, {
        value: val.toString(),
        version: taxSetting?.version || 1,
      });
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: 'Pengaturan pajak berhasil disimpan.',
      });
      loadSettings();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal menyimpan persentase pajak.',
      });
    } finally {
      setIsSaving(false);
      hideLoading();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Store className="h-6 w-6" />
            </span>
            <span>Pengaturan Toko</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola persentase pajak transaksi dan ketentuan tarif pengiriman pesanan
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSettings}
          disabled={isLoading}
          className="flex items-center gap-1.5 self-start sm:self-center"
        >
          <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan</span>
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadSettings}>
            Coba Lagi
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
          <LoadingSpinner size="lg" />
          <p className="text-xs">Memuat data pengaturan toko...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Tarif Pajak Global */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Tarif Pajak Pesanan (Global)
                </h2>
                <p className="text-xs text-slate-500">
                  Besaran persentase pajak yang dihitung dari total subjumlah pesanan
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleSaveTax} className="space-y-4 max-w-md">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1">
                  <p>
                    Nilai pajak ini disimpan permanen sebagai snapshot pada setiap pesanan yang terbentuk saat checkout.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Mengubah nilai ini tidak akan memengaruhi rekapan pesanan historis yang sudah dibuat sebelumnya.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Persentase Pajak (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      max={100}
                      value={taxInput}
                      onChange={(e) => setTaxInput(e.target.value)}
                      disabled={!canUpdate || isSaving}
                      className="w-32 text-center text-sm font-semibold"
                    />
                    <span className="text-xs text-slate-500">% dari subtotal belanja</span>
                  </div>
                </div>

                {taxSetting?.updatedAt && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    Terakhir diperbarui:{' '}
                    {new Date(taxSetting.updatedAt).toLocaleString('id-ID')}
                    {taxSetting.updatedBy ? ` oleh ${taxSetting.updatedBy}` : ''}
                  </p>
                )}

                {canUpdate && (
                  <div className="pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving}
                      className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span>Simpan Persentase Pajak</span>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card 2: Informasi Ongkos Kirim */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Tarif Ongkos Kirim Ekspedisi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pengelolaan ongkir dikonfigurasi per mitra ekspedisi
                  </p>
                </div>
              </div>

              <Link to="/master/ekspedisi">
                <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                  <span>Buka Master Ekspedisi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <CardContent className="p-6">
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs text-blue-900 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Ketentuan Ongkir Toko:</p>
                  <p>
                    Besaran ongkos kirim tidak lagi menggunakan nilai statis tunggal, melainkan diatur langsung pada masing-masing layanan mitra kurir di menu Master Ekspedisi.
                  </p>
                  <p className="text-[11px] text-blue-700">
                    Pelanggan dapat memilih opsi kurir aktif saat checkout, dan sistem otomatis menggunakan ekspedisi aktif pertama jika pilihan ekspedisi kosong.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PengaturanTokoIndex;
