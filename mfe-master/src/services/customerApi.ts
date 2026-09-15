import {
  CustomerItem,
  PagedCustomerData,
  CustomerQueryParams,
  ResetCustomerPasswordPayload,
} from '../types/pelanggan';
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

export const customerApi = {
  /**
   * Mengambil data pelanggan berhalaman dengan filter pencarian, status aktif, status blokir, dan sorting
   * GET /api/customers/paged
   */
  getPaged: async (params: CustomerQueryParams = {}): Promise<PagedCustomerData> => {
    const query = new URLSearchParams();
    if (params.page) query.set('Page', params.page.toString());
    if (params.pageSize) query.set('PageSize', params.pageSize.toString());
    if (params.search) query.set('Search', params.search);
    if (params.active !== undefined) {
      query.set('Active', params.active.toString());
    }
    if (params.blocked !== undefined) {
      query.set('Blocked', params.blocked.toString());
    }
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortOrder) query.set('SortOrder', params.sortOrder);

    const res = await fetch(`${API_BASE_URL}/api/customers/paged?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    return handleResponse<PagedCustomerData>(res);
  },

  /**
   * Memblokir pelanggan
   * POST /api/customers/{id}/block
   */
  block: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}/block`, {
      method: 'POST',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },

  /**
   * Membuka blokir pelanggan
   * POST /api/customers/{id}/unblock
   */
  unblock: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}/unblock`, {
      method: 'POST',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },

  /**
   * Menonaktifkan pelanggan
   * POST /api/customers/{id}/deactivate
   */
  deactivate: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}/deactivate`, {
      method: 'POST',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },

  /**
   * Mengaktifkan kembali pelanggan
   * POST /api/customers/{id}/reactivate
   */
  reactivate: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}/reactivate`, {
      method: 'POST',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },

  /**
   * Reset kata sandi pelanggan
   * POST /api/customers/{id}/reset-password
   */
  resetPassword: async (id: number, payload: ResetCustomerPasswordPayload): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    return handleResponse<string>(res);
  },

  /**
   * Melepas sesi aktif pelanggan
   * POST /api/customers/{id}/release-session
   */
  releaseSession: async (id: number): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/customers/${id}/release-session`, {
      method: 'POST',
      headers: getHeaders(),
    });

    return handleResponse<string>(res);
  },
};
