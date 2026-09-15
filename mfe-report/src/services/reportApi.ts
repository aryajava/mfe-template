import { SalesReportData, ApiResponse } from '../types/report';
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

export const reportApi = {
  getSalesReport: async (days?: number): Promise<SalesReportData> => {
    const query = new URLSearchParams();
    if (days !== undefined && days !== null) {
      query.set('days', days.toString());
    }

    const url = `${API_BASE_URL}/api/reports/sales${query.toString() ? `?${query.toString()}` : ''}`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<SalesReportData>(res);
  },
};
