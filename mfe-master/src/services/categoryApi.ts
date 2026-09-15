import {
  CategoryItem,
  PagedCategoryData,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  CategoryQueryParams,
} from '../types/kategori';
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

export const categoryApi = {
  /**
   * Mengambil data kategori berhalaman dengan filter pencarian, status, dan sorting
   * GET /api/categories/paged
   */
  getPaged: async (params: CategoryQueryParams = {}): Promise<PagedCategoryData> => {
    const query = new URLSearchParams();
    if (params.page) query.set('Page', params.page.toString());
    if (params.pageSize) query.set('PageSize', params.pageSize.toString());
    if (params.search) query.set('Search', params.search);
    if (params.active !== undefined) {
      query.set('Active', params.active.toString());
    }
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortOrder) query.set('SortOrder', params.sortOrder);

    const url = `${API_BASE_URL}/api/categories/paged?${query.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<PagedCategoryData>(res);
  },

  /**
   * Mengambil semua kategori (termasuk nonaktif)
   * GET /api/categories
   */
  getAll: async (): Promise<CategoryItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<CategoryItem[]>(res);
  },

  /**
   * Mengambil kategori aktif saja
   * GET /api/categories/active
   */
  getActive: async (): Promise<CategoryItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/categories/active`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<CategoryItem[]>(res);
  },

  /**
   * Mengambil detail kategori berdasarkan ID
   * GET /api/categories/{id}
   */
  getById: async (id: number | string): Promise<CategoryItem> => {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<CategoryItem>(res);
  },

  /**
   * Membuat kategori baru
   * POST /api/categories
   */
  create: async (payload: CreateCategoryPayload): Promise<CategoryItem> => {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CategoryItem>(res);
  },

  /**
   * Memperbarui nama kategori (memerlukan version untuk concurrency check)
   * PUT /api/categories/{id}
   */
  update: async (
    id: number | string,
    payload: UpdateCategoryPayload
  ): Promise<CategoryItem> => {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CategoryItem>(res);
  },

  /**
   * Mengubah status operasional kategori (Aktif / Nonaktif)
   * POST /api/categories/{id}/status
   */
  toggleStatus: async (
    id: number | string,
    isActive: boolean
  ): Promise<{ id: number; isActive: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    });
    return handleResponse<{ id: number; isActive: boolean }>(res);
  },

  /**
   * Menghapus kategori permanen (hard delete terlindungi relasi produk).
   * DELETE /api/categories/{id}
   */
  delete: async (id: number | string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<string>(res);
  },
};
