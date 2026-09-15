export interface SalesRow {
  productId: number;
  title: string;
  totalQuantity: number;
  revenue: number;
}

export interface SalesReportData {
  label: string;
  top: SalesRow[];
  bottom: SalesRow[];
}

export interface ApiResponse<T> {
  traceId?: string;
  isSuccess: boolean;
  statusCode: number;
  message?: string;
  data: T;
  errors?: string[] | null;
  timestamp?: string;
}

export const formatRupiah = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return 'Rp 0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};
