import {
  DiscountApprovalItem,
  PagedDiscountApprovalResult,
  ApiResponse,
} from '../types/discount';
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

export interface DiscountQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  onlyMine?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export const discountApi = {
  getPaged: async (params: DiscountQueryParams = {}): Promise<PagedDiscountApprovalResult> => {
    const query = new URLSearchParams();
    if (params.page) query.set('Page', params.page.toString());
    if (params.pageSize) query.set('PageSize', params.pageSize.toString());
    if (params.search) query.set('Search', params.search);
    if (params.status && params.status !== 'Semua') {
      query.set('Status', params.status);
    }
    if (params.onlyMine !== undefined) {
      query.set('OnlyMine', params.onlyMine.toString());
    }
    if (params.sortBy) query.set('SortBy', params.sortBy);
    if (params.sortDirection) {
      query.set('SortDirection', params.sortDirection);
      query.set('SortOrder', params.sortDirection);
    }

    const res = await fetch(`${API_BASE_URL}/api/discount-approvals?${query.toString()}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<PagedDiscountApprovalResult>(res);
  },

  approve: async (id: number, version: number): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/discount-approvals/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ version }),
    });
    return handleResponse<any>(res);
  },

  reject: async (id: number, reason: string, version: number): Promise<any> => {
    const res = await fetch(`${API_BASE_URL}/api/discount-approvals/${id}/reject`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reason, version }),
    });
    return handleResponse<any>(res);
  },
};
