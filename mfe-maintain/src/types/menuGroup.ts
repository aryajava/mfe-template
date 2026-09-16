export interface MenuGroupItem {
  id: number;
  groupCode: string;
  groupName: string;
  urlPrefix: string;
  sortOrder: number;
  icon?: string | null;
  mfeKey?: string | null;
  isActive: boolean;
  menuCount: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version: number;
}

export interface CreateMenuGroupInput {
  groupCode: string;
  groupName: string;
  urlPrefix?: string;
  mfeKey?: string | null;
  sortOrder?: number;
  icon?: string | null;
}

export interface UpdateMenuGroupInput {
  groupName: string;
  urlPrefix?: string;
  mfeKey?: string | null;
  sortOrder?: number;
  icon?: string | null;
  version: number;
}

export interface MenuGroupQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PagedMenuGroupResult {
  items: MenuGroupItem[];
  page: number;
  pageSize: number;
  total?: number;
  totalItems?: number;
  totalPages: number;
}
