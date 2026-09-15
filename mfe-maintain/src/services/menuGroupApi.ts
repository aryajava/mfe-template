import {
  MenuGroupItem,
  CreateMenuGroupInput,
  UpdateMenuGroupInput,
  MenuGroupQueryParams,
  PagedMenuGroupResult,
} from '../types/menuGroup';
import { ApiResponse } from '../types/setting';
import { storage } from '../utils/sastStorage';

const API_BASE_URL = 'http://localhost:5251';
const FALLBACK_API_KEY = 'TEST123';

const getHeaders = (): Record<string, string> => {
  const currentKey =
    storage.retrieve('apiKey') ||
    storage.retrieve('token') ||
    FALLBACK_API_KEY;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': currentKey,
  };

  const token = storage.retrieve('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
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

export const menuGroupApi = {
  getAll: async (): Promise<MenuGroupItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/menu-groups`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<MenuGroupItem[]>(res);
  },

  getActive: async (): Promise<MenuGroupItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/menu-groups/active`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<MenuGroupItem[]>(res);
  },

  getPaged: async (params: MenuGroupQueryParams = {}): Promise<PagedMenuGroupResult> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.pageSize) searchParams.append('pageSize', params.pageSize.toString());
    if (params.search) searchParams.append('search', params.search);
    if (params.active !== undefined) searchParams.append('active', params.active.toString());
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

    const queryStr = searchParams.toString();
    const url = `${API_BASE_URL}/api/menu-groups/paged${queryStr ? `?${queryStr}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<PagedMenuGroupResult>(res);
  },

  getById: async (id: number): Promise<MenuGroupItem> => {
    const res = await fetch(`${API_BASE_URL}/api/menu-groups/${id}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<MenuGroupItem>(res);
  },

  create: async (payload: CreateMenuGroupInput): Promise<MenuGroupItem> => {
    const res = await fetch(`${API_BASE_URL}/api/menu-groups`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<MenuGroupItem>(res);
  },

  update: async (id: number, payload: UpdateMenuGroupInput): Promise<MenuGroupItem> => {
    const res = await fetch(`${API_BASE_URL}/api/menu-groups/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return handleResponse<MenuGroupItem>(res);
  },

  toggleStatus: async (id: number, isActive: boolean): Promise<{ id: number; isActive: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/api/menu-groups/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ isActive }),
    });
    return handleResponse<{ id: number; isActive: boolean }>(res);
  },

  delete: async (id: number): Promise<{ id: number }> => {
    const res = await fetch(`${API_BASE_URL}/api/menu-groups/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse<{ id: number }>(res);
  },
};
