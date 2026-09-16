import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Sliders,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Lock,
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

export const PengaturanAplikasiIndex: React.FC = () => {
  const { publish } = useEventBus();
  const { showLoading, hideLoading } = useLoading();
  const { canPerformAction, hasRole } = useAuth();

  const isSa = hasRole('SA') || hasRole('SUPERADMIN') || hasRole('SUPER ADMIN');
  const canUpdate = isSa || canPerformAction('pengaturan-aplikasi', 'update');

  // State
  const [thresholdSetting, setThresholdSetting] = useState<SettingItem | null>(null);
  const [altchaSetting, setAltchaSetting] = useState<SettingItem | null>(null);

  const [thresholdInput, setThresholdInput] = useState('5');
  const [altchaInput, setAltchaInput] = useState('');
  const [showAltchaKey, setShowAltchaKey] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [thresh, altcha] = await Promise.all([
        settingApi.get(SETTING_KEYS.LOGIN_FAIL_THRESHOLD).catch(() => null),
        settingApi.get(SETTING_KEYS.ALTCHA_HMAC_KEY).catch(() => null),
      ]);

      if (thresh) {
        setThresholdSetting(thresh);
        setThresholdInput(thresh.value);
      }
      if (altcha) {
        setAltchaSetting(altcha);
        setAltchaInput(altcha.value);
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat pengaturan aplikasi.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(thresholdInput.trim(), 10);
    if (isNaN(val) || val < 1 || val > 99) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: 'Ambang batas blokir harus berupa bilangan bulat antara 1 dan 99.',
      });
      return;
    }

    try {
      setIsSaving(true);
      showLoading();
      await settingApi.update(SETTING_KEYS.LOGIN_FAIL_THRESHOLD, {
        value: val.toString(),
        version: thresholdSetting?.version || 1,
      });
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: 'Pengaturan ambang batas login berhasil disimpan.',
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'app-config', action: 'update' });
      loadSettings();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal menyimpan pengaturan ambang login.',
      });
    } finally {
      setIsSaving(false);
      hideLoading();
    }
  };

  const handleSaveAltcha = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = altchaInput.trim();
    if (val.length > 0 && val.length < 16) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: 'Kunci rahasia ALTCHA minimal harus 16 karakter untuk standar keamanan HMAC.',
      });
      return;
    }

    try {
      setIsSaving(true);
      showLoading();
      await settingApi.update(SETTING_KEYS.ALTCHA_HMAC_KEY, {
        value: val,
        version: altchaSetting?.version || 1,
      });
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'success',
        message: val
          ? 'Kunci rahasia ALTCHA berhasil diperbarui.'
          : 'ALTCHA dinonaktifkan (kunci dikosongkan).',
      });
      publish(MFE_EVENTS.DATA_UPDATED, { entity: 'app-config', action: 'update' });
      loadSettings();
    } catch (err: any) {
      publish(MFE_EVENTS.NOTIFICATION_SHOW, {
        type: 'error',
        message: err.message || 'Gagal menyimpan kunci ALTCHA.',
      });
    } finally {
      setIsSaving(false);
      hideLoading();
    }
  };

  const isAltchaActive = altchaInput.trim().length >= 16;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Pengaturan Aplikasi
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  Keamanan & Kebijakan
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Konfigurasi keamanan akun, ambang proteksi brute-force, dan verifikasi checkout
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
            <TooltipContent>Ambil pengaturan terbaru dari database</TooltipContent>
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
          <p className="text-xs text-slate-500 font-medium">Memuat konfigurasi aplikasi...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Ambang Penguncian Akun */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shadow-2xs">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Ambang Penguncian Akun Login
                  </h2>
                  <p className="text-xs text-slate-500">
                    Proteksi brute-force kata sandi
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Lock className="h-3 w-3" />
                <span>Maks {thresholdInput}x</span>
              </span>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <form onSubmit={handleSaveThreshold} className="space-y-4">
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Mekanisme Pengamanan:</p>
                  <p className="leading-relaxed">
                    Jika pengguna gagal login berturut-turut melebihi angka ini, status akun otomatis dibekukan demi mencegah upaya peretasan kamus atau tebakan berulang.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pilih Ambang Batas Cepat
                  </label>
                  <div className="flex items-center gap-2 mb-3">
                    {['3', '5', '10'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        disabled={!canUpdate || isSaving}
                        onClick={() => setThresholdInput(preset)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                          thresholdInput === preset
                            ? 'bg-orange-50 text-orange-700 border-orange-300 font-semibold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset} Percobaan {preset === '5' ? '(Rekomendasi)' : ''}
                      </button>
                    ))}
                  </div>

                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Atau Masukkan Nilai Kustom (1 - 99)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      disabled={!canUpdate || isSaving}
                      className="w-28 text-center text-sm font-semibold font-mono tabular-nums h-9"
                    />
                    <span className="text-xs text-slate-500 font-medium">kali percobaan gagal</span>
                  </div>
                </div>

                {thresholdSetting?.updatedAt && (
                  <p className="text-[11px] text-slate-400 pt-1 font-mono tabular-nums">
                    Terakhir diperbarui:{' '}
                    {new Date(thresholdSetting.updatedAt).toLocaleString('id-ID')}
                    {thresholdSetting.updatedBy ? ` oleh ${thresholdSetting.updatedBy}` : ''}
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
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan Ambang Login'}</span>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card 2: ALTCHA Captcha Secret Key */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 shadow-2xs">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Proteksi ALTCHA Proof-of-Work
                  </h2>
                  <p className="text-xs text-slate-500">
                    Verifikasi bot mandiri saat checkout
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  isAltchaActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAltchaActive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span>{isAltchaActive ? 'Aktif' : 'Nonaktif'}</span>
              </span>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <form onSubmit={handleSaveAltcha} className="space-y-4">
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Petunjuk Konfigurasi Kunci:</p>
                  <p className="leading-relaxed">
                    Sistem menggunakan kriptografi HMAC mandiri tanpa cookie pelacak pihak ketiga. Kosongkan kolom jika ingin menonaktifkan verifikasi CAPTCHA pada proses pesanan pelanggan.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kunci Rahasia HMAC ALTCHA (Min. 16 Karakter)
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {altchaInput.length} karakter
                    </span>
                  </div>
                  <div className="relative">
                    <Input
                      type={showAltchaKey ? 'text' : 'password'}
                      value={altchaInput}
                      onChange={(e) => setAltchaInput(e.target.value)}
                      placeholder="Masukkan string rahasia HMAC minimal 16 karakter..."
                      disabled={!canUpdate || isSaving}
                      className="font-mono text-xs pr-10 h-9 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAltchaKey(!showAltchaKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      title={showAltchaKey ? 'Sembunyikan kunci' : 'Tampilkan kunci'}
                    >
                      {showAltchaKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {altchaInput.length > 0 && altchaInput.length < 16 && (
                    <p className="text-[11px] text-amber-600 mt-1.5">
                      Panjang kunci saat ini ({altchaInput.length} karakter) belum memenuhi batas minimal 16 karakter.
                    </p>
                  )}
                </div>

                {altchaSetting?.updatedAt && (
                  <p className="text-[11px] text-slate-400 pt-1 font-mono tabular-nums">
                    Terakhir diperbarui:{' '}
                    {new Date(altchaSetting.updatedAt).toLocaleString('id-ID')}
                    {altchaSetting.updatedBy ? ` oleh ${altchaSetting.updatedBy}` : ''}
                  </p>
                )}

                {canUpdate && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white flex items-center gap-1.5 text-xs h-9 px-4 cursor-pointer shadow-2xs"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan Kunci ALTCHA'}</span>
                    </Button>
                    {altchaInput && (
                      <button
                        type="button"
                        onClick={() => setAltchaInput('')}
                        className="text-xs text-rose-600 hover:text-rose-700 font-medium underline underline-offset-2 cursor-pointer"
                      >
                        Nonaktifkan ALTCHA
                      </button>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PengaturanAplikasiIndex;

