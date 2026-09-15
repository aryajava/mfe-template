import {
  ProductApiItem,
  PagedProductData,
  CategoryItem,
  ApiResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from '../types/produk';
import { storage } from '../utils/sastStorage';

const API_BASE_URL = 'http://localhost:5251';
const FALLBACK_API_KEY = 'TEST123';

/**
 * Mengambil header request secara dinamis berdasarkan sesi login aktif (SecretKey).
 * Jika belum login, gunakan fallback key untuk kompatibilitas standalone.
 */
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

export interface PagedParams {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const productApi = {
  /**
   * Mengambil data produk berhalaman dengan filter, search, sort, dan pagination
   * GET /api/products/paged
   */
  getPaged: async (params: PagedParams = {}): Promise<PagedProductData> => {
    const query = new URLSearchParams();
    if (params.page) query.set('Page', params.page.toString());
    if (params.pageSize) query.set('PageSize', params.pageSize.toString());
    if (params.search) query.set('Search', params.search);
    if (params.category && params.category !== 'Semua') {
      query.set('Category', params.category);
    }
    if (params.isActive !== undefined) {
      query.set('IsActive', params.isActive.toString());
    }
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortOrder) query.set('SortOrder', params.sortOrder);

    const url = `${API_BASE_URL}/api/products/paged?${query.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<PagedProductData>(res);
  },

  /**
   * Mengambil semua produk aktif
   * GET /api/products
   */
  getAll: async (): Promise<ProductApiItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<ProductApiItem[]>(res);
  },

  /**
   * Mengambil detail produk berdasarkan ID
   * GET /api/products/{id}
   */
  getById: async (id: number | string): Promise<ProductApiItem> => {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<ProductApiItem>(res);
  },

  /**
   * Membuat produk baru
   * POST /api/products
   */
  create: async (payload: CreateProductPayload): Promise<ProductApiItem> => {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ProductApiItem>(res);
  },

  /**
   * Memperbarui data produk (memerlukan version untuk concurrency check)
   * PUT /api/products/{id}
   */
  update: async (
    id: number | string,
    payload: UpdateProductPayload
  ): Promise<ProductApiItem> => {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ProductApiItem>(res);
  },

  /**
   * Mengubah status operasional produk (Aktif / Nonaktif)
   * POST /api/products/{id}/status
   */
  toggleStatus: async (
    id: number | string,
    isActive: boolean
  ): Promise<{ id: number; isActive: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    });
    return handleResponse<{ id: number; isActive: boolean }>(res);
  },

  /**
   * Menghapus produk permanen (hard delete).
   * Produk dengan riwayat pesanan tidak dapat dihapus.
   * DELETE /api/products/{id}
   */
  delete: async (id: number | string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<string>(res);
  },

  /**
   * Mengambil daftar seluruh kategori
   * GET /api/categories
   */
  getCategories: async (): Promise<CategoryItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<CategoryItem[]>(res);
  },
};
