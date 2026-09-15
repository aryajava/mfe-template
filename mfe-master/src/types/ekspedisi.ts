export interface CourierItem {
  id: number;
  name: string;
  shippingFee: number;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version: number;
}

export interface PagedCourierData {
  items: CourierItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateCourierPayload {
  name: string;
  shippingFee: number;
}

export interface UpdateCourierPayload {
  name: string;
  shippingFee: number;
  version: number;
}

export interface CourierQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Memformat angka menjadi format mata uang Rupiah (IDR)
 */
export const formatRupiah = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};
