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
  Calculator,
  Receipt,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  CardContent,
  LoadingSpinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
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
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'store-config', action: 'update' });
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

  // Live simulation calculation
  const parsedTax = parseFloat(taxInput) || 0;
  const sampleSubtotal = 100000;
  const sampleTax = Math.round((sampleSubtotal * parsedTax) / 100);
  const sampleTotal = sampleSubtotal + sampleTax;

  const TAX_PRESETS = [
    { label: '0%', value: '0' },
    { label: '1.1%', value: '1.1' },
    { label: '2%', value: '2' },
    { label: '11%', value: '11' },
    { label: '12%', value: '12' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Pengaturan Toko
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  Operasional & Keuangan
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Kelola persentase pajak transaksi checkout dan panduan tarif ekspedisi
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSettings}
                disabled={isLoading}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ambil pengaturan toko terkini</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadSettings} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-slate-500 font-medium">Memuat data pengaturan toko...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Tarif Pajak Global */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-700 shadow-2xs">
                  <Percent className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Tarif Pajak Pesanan (Global)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dihitung otomatis dari subtotal keranjang belanja
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 font-mono tabular-nums">
                {taxInput}%
              </span>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-5">
              <form onSubmit={handleSaveTax} className="space-y-4">
                {/* Preset Pills */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilihan Tarif Pajak Umum
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {TAX_PRESETS.map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        disabled={!canUpdate || isSaving}
                        onClick={() => setTaxInput(preset.value)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer font-mono tabular-nums ${
                          taxInput === preset.value
                            ? 'bg-orange-50 text-orange-700 border-orange-300 font-semibold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Input */}
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
                      className="w-28 text-center text-sm font-semibold font-mono tabular-nums h-9"
                    />
                    <span className="text-xs text-slate-500 font-medium">% dari subtotal pesanan</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                    Nilai ini disimpan permanen sebagai snapshot pada pesanan yang baru dibuat. Pesanan lama tidak akan berubah nilainya.
                  </p>
                </div>

                {/* Live Simulation Box */}
                <div className="p-3.5 rounded-xl border border-orange-200/70 bg-orange-50/40 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-orange-800 font-semibold">
                    <Calculator className="h-3.5 w-3.5" />
                    <span>Simulasi Perhitungan Checkout:</span>
                  </div>
                  <div className="space-y-1 font-mono text-[11px] text-slate-700">
                    <div className="flex justify-between">
                      <span>Subtotal Belanja Contoh:</span>
                      <span>Rp 100.000</span>
                    </div>
                    <div className="flex justify-between text-orange-700 font-medium">
                      <span>Pajak ({parsedTax}%):</span>
                      <span>+ Rp {sampleTax.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-orange-200/80 font-bold text-slate-900 text-xs">
                      <span>Total Tagihan Pelanggan:</span>
                      <span>Rp {sampleTotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {taxSetting?.updatedAt && (
                  <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                    Terakhir diperbarui:{' '}
                    {new Date(taxSetting.updatedAt).toLocaleString('id-ID')}
                    {taxSetting.updatedBy ? ` oleh ${taxSetting.updatedBy}` : ''}
                  </p>
                )}

                {canUpdate && (
                  <div className="pt-2 border-t border-slate-100">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving}
                      className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white flex items-center gap-1.5 text-xs h-9 px-4 cursor-pointer shadow-2xs"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan Persentase Pajak'}</span>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card 2: Informasi Ongkos Kirim & Ekspedisi */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shadow-2xs">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Tarif Pengiriman Ekspedisi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Integrasi kurir & ongkos kirim per layanan
                  </p>
                </div>
              </div>

              <Link to="/master/ekspedisi">
                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs h-8 cursor-pointer">
                  <span>Kelola Ekspedisi</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/50 text-xs text-blue-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <Info className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>Sistem Ongkos Kirim Terdesentralisasi</span>
                </div>
                <p className="leading-relaxed text-blue-800">
                  Tarif pengiriman diatur secara independen pada modul Master Ekspedisi. Setiap mitra kurir (JNE, SiCepat, J&T, Pos Indonesia, dll.) dapat memiliki tarif ongkir dasar masing-masing.
                </p>
                <div className="pt-2 border-t border-blue-200/60 space-y-1 text-[11px] text-blue-700">
                  <p>• Pelanggan dapat memilih opsi kurir aktif yang tersedia saat checkout.</p>
                  <p>• Jika pelanggan tidak memilih ekspedisi khusus, sistem akan otomatis memilih layanan kurir aktif prioritas pertama.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Modul Ekspedisi Terhubung</span>
                  <span className="text-[11px] text-slate-500">Katalog kurir, nama armada, dan ongkir per kg</span>
                </div>
                <Link to="/master/ekspedisi">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs h-8 px-3 cursor-pointer shadow-2xs">
                    Buka Master
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PengaturanTokoIndex;

