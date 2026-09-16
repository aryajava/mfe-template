import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Calendar,
  Award,
  AlertTriangle,
  DollarSign,
  PackageCheck,
  ShoppingBag,
  Sparkles,
  Trophy,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  LoadingSpinner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  useAuth,
  useEventSubscription,
  MFE_EVENTS,
} from '@template/shared';
import { reportApi } from '../../services/reportApi';
import { SalesReportData, SalesRow, formatRupiah } from '../../types/report';

const PERIOD_OPTIONS: { label: string; days?: number }[] = [
  { label: '7 Hari Terakhir', days: 7 },
  { label: '30 Hari Terakhir', days: 30 },
  { label: 'Sepanjang Masa', days: undefined },
];

export const LaporanPenjualanIndex: React.FC = () => {
  const [selectedDays, setSelectedDays] = useState<number | undefined>(7);
  const [report, setReport] = useState<SalesReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await reportApi.getSalesReport(selectedDays);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat laporan penjualan.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDays]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reaktif terhadap transaksi baru
  useEventSubscription(MFE_EVENTS.DATA_UPDATED, (payload: any) => {
    if (payload?.entity === 'order') {
      loadData();
    }
  });

  // Aggregate metrics
  const topTotalRevenue =
    report?.top?.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0) || 0;
  const topTotalUnits =
    report?.top?.reduce((sum, item) => sum + (Number(item.totalQuantity) || 0), 0) || 0;
  const slowCount = report?.bottom?.length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 shadow-2xs">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Laporan Penjualan
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                  {report?.label || '7 Hari Terakhir'}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Analisis performa produk terlaris dan evaluasi produk lambat terjual sebagai dasar penetapan diskon
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
                onClick={loadData}
                disabled={isLoading}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Muat Ulang</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Perbarui data laporan penjualan</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Period Selection Toolbar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Calendar className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Rentang Analisis:</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
              {PERIOD_OPTIONS.map((opt) => {
                const isSelected = selectedDays === opt.days;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedDays(opt.days)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-orange-600 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Periode aktif: <span className="font-semibold text-slate-800">{report?.label || 'Sedang memuat...'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} className="text-xs">
            Coba Lagi
          </Button>
        </div>
      )}

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Omset Produk Terlaris</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5 font-mono tabular-nums">
                {isLoading ? '...' : formatRupiah(topTotalRevenue)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total akumulasi pendapatan Top 10
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Volume Unit Terjual</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5 font-mono tabular-nums">
                {isLoading ? '...' : `${topTotalUnits.toLocaleString('id-ID')} Unit`}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total kuantitas barang terlaris
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Perlu Evaluasi (Slow Moving)</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5 font-mono tabular-nums">
                {isLoading ? '...' : `${slowCount} Produk`}
              </h3>
              <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                Kandidat promo diskon harga
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dual Grid Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Produk Terlaris */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 shadow-2xs">
                <Trophy className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Produk Terlaris (Top 10)</h3>
                <p className="text-[11px] text-slate-500">Paling banyak dipesan pelanggan</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono tabular-nums">
              {report?.top?.length || 0} Produk
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 w-14 text-center">Peringkat</th>
                  <th className="py-3 px-3.5">Produk</th>
                  <th className="py-3 px-3.5 text-center">Terjual</th>
                  <th className="py-3 px-3.5 text-right">Total Omset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <LoadingSpinner size="md" />
                        <p className="text-xs text-slate-500 font-medium">Memuat peringkat produk terlaris...</p>
                      </div>
                    </td>
                  </tr>
                ) : !report?.top || report.top.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-slate-400">
                      Tidak ada transaksi penjualan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  report.top.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 text-center">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold font-mono">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold font-mono">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 text-orange-800 border border-orange-300 text-xs font-bold font-mono">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs tabular-nums font-medium">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID #{item.productId}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 font-mono tabular-nums">
                          {item.totalQuantity} unit
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-orange-600 font-mono tabular-nums">
                        {formatRupiah(item.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom 10 Produk Jarang Terjual */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700 shadow-2xs">
                <TrendingDown className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Produk Kurang Diminati (Bottom 10)</h3>
                <p className="text-[11px] text-slate-500">Penjualan terendah untuk evaluasi diskon</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-mono tabular-nums">
              {report?.bottom?.length || 0} Produk
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 w-12 text-center">No</th>
                  <th className="py-3 px-3.5">Produk</th>
                  <th className="py-3 px-3.5 text-center">Terjual</th>
                  <th className="py-3 px-3.5 text-right">Total Omset</th>
                  <th className="py-3 px-3.5 text-center w-24">Saran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <LoadingSpinner size="md" />
                        <p className="text-xs text-slate-500 font-medium">Memuat data evaluasi...</p>
                      </div>
                    </td>
                  </tr>
                ) : !report?.bottom || report.bottom.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      Semua produk memiliki tingkat penjualan yang baik pada periode ini.
                    </td>
                  </tr>
                ) : (
                  report.bottom.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 leading-tight">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID #{item.productId}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/70 font-mono tabular-nums">
                          {item.totalQuantity} unit
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-700 font-mono tabular-nums">
                        {formatRupiah(item.revenue)}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Diskon
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaporanPenjualanIndex;

