export interface UserItem {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  lastLoginAt: string | null;
  loginFailedCount: number;
  isBlocked: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version: number;
  display: string;
}

export interface PagedUserData {
  items: UserItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserPayload {
  username: string;
  displayName?: string;
  password: string;
  role: string;
}

export interface UpdateUserPayload {
  displayName?: string;
  version: number;
}

export interface ChangeRolePayload {
  role: string;
}

export interface ResetUserPasswordPayload {
  newPassword: string;
}

export interface SetUserActivePayload {
  isActive: boolean;
}
