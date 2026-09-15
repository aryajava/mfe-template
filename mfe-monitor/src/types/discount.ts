export type DiscountApprovalStatus = 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK';

export interface DiscountApprovalItem {
  id: number;
  productId: number;
  productTitle: string;
  oldValue: number;
  newValue: number;
  status: DiscountApprovalStatus;
  reason?: string | null;
  requestedBy: string;
  approvedBy?: string | null;
  createdAt: string;
  decidedAt?: string | null;
  version: number;
}

export interface PagedDiscountApprovalResult {
  items: DiscountApprovalItem[];
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

export const getDiscountStatusBadge = (status: DiscountApprovalStatus | string) => {
  switch (status) {
    case 'MENUNGGU':
      return {
        label: 'Menunggu',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
      };
    case 'DISETUJUI':
      return {
        label: 'Disetujui',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
      };
    case 'DITOLAK':
      return {
        label: 'Ditolak',
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
