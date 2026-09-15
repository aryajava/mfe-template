export interface CustomerItem {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  isBlocked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version: number;
  display: string;
}

export interface PagedCustomerData {
  items: CustomerItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CustomerQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  blocked?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ResetCustomerPasswordPayload {
  newPassword: string;
}
