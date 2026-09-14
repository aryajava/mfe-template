export interface CategoryItem {
  id: number;
  name: string;
  isActive: boolean;
  productCount: number;
}

export interface ProductApiItem {
  id: number;
  title: string;
  price: number;
  description: string | null;
  categoryId: number;
  category: string;
  image: string | null;
  ratingRate: number | null;
  ratingCount: number | null;
  discountPercent: number | null;
  stock: number;
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  updatedAt: string | null;
  updatedBy?: string | null;
  version: number;
}

export interface PagedProductData {
  items: ProductApiItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  traceId?: string;
  isSuccess: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: string[] | null;
  timestamp?: string;
}

export interface CreateProductPayload {
  title: string;
  price: number;
  description?: string | null;
  categoryId: number;
  image?: string | null;
  ratingRate?: number | null;
  ratingCount?: number | null;
  discountPercent?: number | null;
  stock: number;
}

export interface UpdateProductPayload extends CreateProductPayload {
  version: number;
}

export function hitungHargaEfektif(hargaDasar: number, diskon?: number | null): number {
  if (!diskon || diskon <= 0) return hargaDasar;
  const potongan = (hargaDasar * diskon) / 100;
  return Math.max(0, Math.round(hargaDasar - potongan));
}

export function formatRupiah(nilai: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nilai);
}
