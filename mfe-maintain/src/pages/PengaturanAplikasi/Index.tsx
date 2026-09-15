import React, { useState, useEffect, useCallback } from 'react';
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
        message: 'Ambang blokir harus berupa bilangan bulat antara 1 dan 99.',
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
        message: 'Kunci rahasia ALTCHA minimal harus 16 karakter untuk keamanan.',
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

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Sliders className="h-6 w-6" />
            </span>
            <span>Pengaturan Aplikasi</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi keamanan global, ambang penguncian akun, dan proteksi CAPTCHA
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
          <p className="text-xs">Memuat konfigurasi aplikasi...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Card 1: Ambang Penguncian Akun */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Ambang Penguncian Akun Login
                </h2>
                <p className="text-xs text-slate-500">
                  Batas percobaan gagal login sebelum akun diblokir otomatis demi keamanan
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleSaveThreshold} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Maksimal Percobaan Gagal Login (1-99)
                  </label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      disabled={!canUpdate || isSaving}
                      className="w-32 text-center text-sm font-semibold"
                    />
                    <span className="text-xs text-slate-500">kali percobaan gagal</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Default sistem adalah 5 kali. Jika terlampaui, status akun pengguna beralih menjadi terblokir hingga di-unblock oleh administrator.
                  </p>
                </div>

                {thresholdSetting?.updatedAt && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    Terakhir diperbarui:{' '}
                    {new Date(thresholdSetting.updatedAt).toLocaleString('id-ID')}
                    {thresholdSetting.updatedBy ? ` oleh ${thresholdSetting.updatedBy}` : ''}
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
                      <span>Simpan Ambang Login</span>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Card 2: ALTCHA Captcha Secret Key */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Proteksi ALTCHA (Konfirmasi Pesanan)
                </h2>
                <p className="text-xs text-slate-500">
                  Verifikasi keamanan self-hosted berbasis HMAC proof-of-work tanpa pihak ketiga
                </p>
              </div>
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleSaveAltcha} className="space-y-4 max-w-lg">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">Petunjuk Konfigurasi:</p>
                  <p>
                    Kosongkan kolom kunci untuk menonaktifkan verifikasi CAPTCHA saat checkout pesanan.
                  </p>
                  <p>
                    Isi kunci rahasia minimal 16 karakter (misal dari string acak hex 32 byte) untuk mengaktifkannya secara penuh.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Kunci Rahasia HMAC ALTCHA
                  </label>
                  <div className="relative">
                    <Input
                      type={showAltchaKey ? 'text' : 'password'}
                      value={altchaInput}
                      onChange={(e) => setAltchaInput(e.target.value)}
                      placeholder="Masukkan kunci HMAC rahasia..."
                      disabled={!canUpdate || isSaving}
                      className="font-mono text-xs pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAltchaKey(!showAltchaKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showAltchaKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {altchaSetting?.updatedAt && (
                  <p className="text-[11px] text-slate-400 pt-1">
                    Terakhir diperbarui:{' '}
                    {new Date(altchaSetting.updatedAt).toLocaleString('id-ID')}
                    {altchaSetting.updatedBy ? ` oleh ${altchaSetting.updatedBy}` : ''}
                  </p>
                )}

                {canUpdate && (
                  <div className="pt-2">
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span>Simpan Kunci ALTCHA</span>
                    </Button>
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
