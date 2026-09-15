import {
  CourierItem,
  PagedCourierData,
  CreateCourierPayload,
  UpdateCourierPayload,
  CourierQueryParams,
} from '../types/ekspedisi';
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

export const courierApi = {
  /**
   * Mengambil data ekspedisi berhalaman dengan filter pencarian, status, dan sorting
   * GET /api/couriers/paged
   */
  getPaged: async (params: CourierQueryParams = {}): Promise<PagedCourierData> => {
    const query = new URLSearchParams();
    if (params.page) query.set('Page', params.page.toString());
    if (params.pageSize) query.set('PageSize', params.pageSize.toString());
    if (params.search) query.set('Search', params.search);
    if (params.active !== undefined) {
      query.set('Active', params.active.toString());
    }
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortOrder) query.set('SortOrder', params.sortOrder);

    const url = `${API_BASE_URL}/api/couriers/paged?${query.toString()}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<PagedCourierData>(res);
  },

  /**
   * Mengambil semua ekspedisi aktif
   * GET /api/couriers/active
   */
  getActive: async (): Promise<CourierItem[]> => {
    const res = await fetch(`${API_BASE_URL}/api/couriers/active`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<CourierItem[]>(res);
  },

  /**
   * Mengambil detail ekspedisi berdasarkan ID
   * GET /api/couriers/{id}
   */
  getById: async (id: number | string): Promise<CourierItem> => {
    // Karena /api/couriers/{id} belum ada, ambil dari paged dengan search atau filter
    const res = await fetch(`${API_BASE_URL}/api/couriers/paged?pageSize=100`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const paged = await handleResponse<PagedCourierData>(res);
    const found = paged.items.find((item) => item.id.toString() === id.toString());
    if (!found) {
      throw new Error(`Ekspedisi dengan ID ${id} tidak ditemukan.`);
    }
    return found;
  },

  /**
   * Membuat ekspedisi baru
   * POST /api/couriers
   */
  create: async (payload: CreateCourierPayload): Promise<CourierItem> => {
    const res = await fetch(`${API_BASE_URL}/api/couriers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CourierItem>(res);
  },

  /**
   * Memperbarui ekspedisi (nama dan tarif ongkir)
   * PUT /api/couriers/{id}
   */
  update: async (
    id: number | string,
    payload: UpdateCourierPayload
  ): Promise<CourierItem> => {
    const res = await fetch(`${API_BASE_URL}/api/couriers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<CourierItem>(res);
  },

  /**
   * Mengubah status operasional ekspedisi (Aktif / Nonaktif)
   * POST /api/couriers/{id}/status
   */
  toggleStatus: async (
    id: number | string,
    isActive: boolean
  ): Promise<{ id: number; isActive: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/api/couriers/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ isActive }),
    });
    return handleResponse<{ id: number; isActive: boolean }>(res);
  },

  /**
   * Menghapus ekspedisi permanen (hard delete terlindungi relasi transaksi pesanan).
   * DELETE /api/couriers/{id}
   */
  delete: async (id: number | string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/couriers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<string>(res);
  },
};
