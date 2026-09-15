import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  LoadingSpinner,
  useAuth,
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

  // Aggregate metrics
  const topTotalRevenue =
    report?.top?.reduce((sum, item) => sum + (Number(item.revenue) || 0), 0) || 0;
  const topTotalUnits =
    report?.top?.reduce((sum, item) => sum + (Number(item.totalQuantity) || 0), 0) || 0;
  const slowCount = report?.bottom?.length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <TrendingUp className="h-6 w-6" />
            </span>
            <span>Laporan Penjualan</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Analisis performa produk terlaris dan produk jarang terjual sebagai masukan keputusan harga
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <RotateCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>
        </div>
      </div>

      {/* Period Selection Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl max-w-fit border border-slate-200">
        {PERIOD_OPTIONS.map((opt) => {
          const isSelected = selectedDays === opt.days;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelectedDays(opt.days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isSelected
                  ? 'bg-white text-orange-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Coba Lagi
          </Button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Omset Produk Terlaris</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {isLoading ? '...' : formatRupiah(topTotalRevenue)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {report?.label || 'Rentang terpilih'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <PackageCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Unit Terjual (Top 10)</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {isLoading ? '...' : `${topTotalUnits} Unit`}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total item produk teratas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Perlu Evaluasi (Slow Moving)</p>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                {isLoading ? '...' : `${slowCount} Produk`}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Penjualan minim / nihil
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Produk Terlaris */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
                <Award className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Produk Terlaris (Top 10)</h3>
                <p className="text-[11px] text-slate-500">Paling banyak dipesan pelanggan</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {report?.top?.length || 0} Produk
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 w-10 text-center">Rank</th>
                  <th className="py-3 px-3.5">Produk</th>
                  <th className="py-3 px-3.5 text-center">Terjual</th>
                  <th className="py-3 px-3.5 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <LoadingSpinner size="md" />
                    </td>
                  </tr>
                ) : !report?.top || report.top.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      Tidak ada data penjualan pada periode ini.
                    </td>
                  </tr>
                ) : (
                  report.top.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 text-center font-bold">
                        {idx === 0 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-xs">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-orange-100 text-orange-700 text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs">{idx + 1}</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-slate-900">
                        {item.title}
                      </td>
                      <td className="py-3 px-3.5 text-center font-semibold text-slate-800">
                        {item.totalQuantity} unit
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-orange-600">
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-600">
                <TrendingDown className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Produk Jarang Terjual (Bottom 10)</h3>
                <p className="text-[11px] text-slate-500">Kandidat promo diskon atau clearance</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
              {report?.bottom?.length || 0} Produk
            </span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-slate-600 font-semibold uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3.5 w-10 text-center">No</th>
                  <th className="py-3 px-3.5">Produk</th>
                  <th className="py-3 px-3.5 text-center">Terjual</th>
                  <th className="py-3 px-3.5 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <LoadingSpinner size="md" />
                    </td>
                  </tr>
                ) : !report?.bottom || report.bottom.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      Semua produk memiliki angka penjualan yang baik.
                    </td>
                  </tr>
                ) : (
                  report.bottom.map((item, idx) => (
                    <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3.5 font-medium text-slate-900">
                        {item.title}
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          {item.totalQuantity} unit
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-700">
                        {formatRupiah(item.revenue)}
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
