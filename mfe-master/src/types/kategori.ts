export interface CategoryItem {
  id: number;
  name: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version: number;
}

export interface PagedCategoryData {
  items: CategoryItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CreateCategoryPayload {
  name: string;
}

export interface UpdateCategoryPayload {
  name: string;
  version: number;
}

export interface CategoryQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
