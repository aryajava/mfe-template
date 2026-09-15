import {
  UserItem,
  PagedUserData,
  UserQueryParams,
  CreateUserPayload,
  UpdateUserPayload,
  ChangeRolePayload,
  ResetUserPasswordPayload,
  SetUserActivePayload,
} from '../types/user';
import { ApiResponse } from '../types/produk';
import { storage } from '../utils/sastStorage';

const API_BASE_URL = 'http://localhost:5251';
const FALLBACK_API_KEY = 'TEST123';

const getHeaders = (): Record<string, string> => {
  const currentKey =
    storage.retrieve('apiKey') ||
    storage.retrieve('token') ||
    FALLBACK_API_KEY;

  return {
    'Content-Type': 'application/json',
    'X-Api-Key': currentKey,
  };
};

async function handleResponse<T>(res: Response): Promise<T> {
  const json: ApiResponse<T> = await res.json().catch(() => ({
    isSuccess: false,
    statusCode: res.status,
    message: res.statusText || 'Terjadi kesalahan pada server.',
    data: null as any,
  }));

  if (!res.ok || !json.isSuccess) {
    const errorMsg =
      (json.errors && json.errors.length > 0 ? json.errors.join(', ') : '') ||
      json.message ||
      `Permintaan gagal (${res.status})`;
    throw new Error(errorMsg);
  }

  return json.data;
}

export const userApi = {
  /**
   * Mengambil data user berhalaman dengan filter pencarian, role, status aktif, dan sorting
   * GET /api/users/paged
   */
  getPaged: async (params: UserQueryParams = {}): Promise<PagedUserData> => {
    const query = new URLSearchParams();
    if (params.page) query.set('Page', params.page.toString());
    if (params.pageSize) query.set('PageSize', params.pageSize.toString());
    if (params.search) query.set('Search', params.search);
    if (params.role) query.set('Role', params.role);
    if (params.active !== undefined) {
      query.set('Active', params.active.toString());
    }
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortOrder) query.set('SortOrder', params.sortOrder);

    const res = await fetch(`${API_BASE_URL}/api/users/paged?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse<PagedUserData>(res);
  },

  /**
   * Mengambil detail user berdasarkan ID
   * GET /api/users/{id}
   */
  getById: async (id: number): Promise<UserItem> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse<UserItem>(res);
  },

  /**
   * Menambahkan user baru
   * POST /api/users
   */
  create: async (payload: CreateUserPayload): Promise<UserItem> => {
    const res = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse<UserItem>(res);
  },

  /**
   * Mengubah nama tampilan user
   * PUT /api/users/{id}
   */
  update: async (id: number, payload: UpdateUserPayload): Promise<UserItem> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse<UserItem>(res);
  },

  /**
   * Menghapus user
   * DELETE /api/users/{id}
   */
  delete: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },

  /**
   * Mengubah status aktif/nonaktif user
   * POST /api/users/{id}/active
   */
  setActive: async (id: number, payload: SetUserActivePayload): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/active`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse<string>(res);
  },

  /**
   * Mengubah peran/role user
   * POST /api/users/{id}/role
   */
  changeRole: async (id: number, payload: ChangeRolePayload): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/role`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse<string>(res);
  },

  /**
   * Reset kata sandi user
   * POST /api/users/{id}/reset-password
   */
  resetPassword: async (id: number, payload: ResetUserPasswordPayload): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse<string>(res);
  },

  /**
   * Memblokir user
   * POST /api/users/{id}/block
   */
  block: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/block`, {
      method: 'POST',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },

  /**
   * Membuka blokir user
   * POST /api/users/{id}/unblock
   */
  unblock: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/users/${id}/unblock`, {
      method: 'POST',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },
};
