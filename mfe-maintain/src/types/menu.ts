export interface MenuItem {
  id: number;
  menuCode: string;
  menuName: string;
  groupId: number;
  groupCode: string;
  groupName: string;
  groupUrlPrefix: string;
  urlPrefix: string;
  fullPath: string;
  sortOrder: number;
  icon?: string | null;
  isActive: boolean;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version: number;
}

export interface CreateMenuInput {
  groupId: number;
  menuCode: string;
  menuName: string;
  urlPrefix: string;
  sortOrder?: number;
  icon?: string | null;
}

export interface UpdateMenuInput {
  groupId: number;
  menuName: string;
  urlPrefix: string;
  sortOrder?: number;
  icon?: string | null;
  version: number;
}

export interface MenuQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  groupId?: number;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PagedMenuResult {
  items: MenuItem[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
