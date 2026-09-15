export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  title: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export type OrderStatus =
  | 'MENUNGGU_KONFIRMASI'
  | 'DIKEMAS'
  | 'DIKIRIM'
  | 'DITERIMA'
  | 'DIBATALKAN';

export interface OrderItemDto {
  id: number;
  orderId: number;
  productId: number;
  title: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderSummary {
  id: number;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  courierId?: number | null;
  courierName?: string | null;
  shipName?: string | null;
  shipPhone?: string | null;
  shipAddress?: string | null;
  note?: string | null;
  orderNumber?: string | null;
  createdAt: string;
  diprosesAt?: string | null;
  kirimAt?: string | null;
  kirimBy?: string | null;
  terimaAt?: string | null;
  terimaBy?: string | null;
  batalAt?: string | null;
  batalBy?: string | null;
  batalReason?: string | null;
  version: number;
}

export interface OrderDetail extends OrderSummary {
  items: OrderItemDto[];
}

export interface PagedOrdersResult {
  items: OrderSummary[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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

export const getOrderStatusBadge = (status: OrderStatus | string) => {
  switch (status) {
    case 'MENUNGGU_KONFIRMASI':
      return {
        label: 'Menunggu Konfirmasi',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'DIKEMAS':
      return {
        label: 'Dikemas',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
      };
    case 'DIKIRIM':
      return {
        label: 'Dikirim',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotColor: 'bg-indigo-500',
      };
    case 'DITERIMA':
      return {
        label: 'Diterima',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    case 'DIBATALKAN':
      return {
        label: 'Dibatalkan',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        dotColor: 'bg-rose-500',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-400',
      };
  }
};
