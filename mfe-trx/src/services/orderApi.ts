import {
  OrderSummary,
  OrderDetail,
  PagedOrdersResult,
  ApiResponse,
} from '../types/pesanan';
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

export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const orderApi = {
  getPaged: async (params: OrderQueryParams = {}): Promise<PagedOrdersResult> => {
    const query = new URLSearchParams();
    if (params.page) query.set('Page', params.page.toString());
    if (params.pageSize) query.set('PageSize', params.pageSize.toString());
    if (params.search) query.set('Search', params.search);
    if (params.status && params.status !== 'Semua') {
      query.set('Status', params.status);
    }
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortDirection) {
      query.set('SortDirection', params.sortDirection);
      query.set('SortOrder', params.sortDirection);
    }

    const res = await fetch(`${API_BASE_URL}/api/orders/paged?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<PagedOrdersResult>(res);
  },

  getById: async (id: number | string): Promise<OrderDetail> => {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<OrderDetail>(res);
  },

  pack: async (id: number | string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/pack`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<string>(res);
  },

  ship: async (id: number | string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/ship`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<string>(res);
  },

  cancel: async (id: number | string, reason: string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/orders/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<string>(res);
  },
};
