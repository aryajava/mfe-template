import { SettingItem, UpdateSettingPayload, ApiResponse } from '../types/setting';
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

export const SETTING_KEYS = {
  LOGIN_FAIL_THRESHOLD: 'LOGIN_FAIL_THRESHOLD',
  ALTCHA_HMAC_KEY: 'ALTCHA_HMAC_KEY',
  TAX_PERCENT: 'TAX_PERCENT',
  SHIPPING_FEE: 'SHIPPING_FEE',
};

export const settingApi = {
  get: async (key: string): Promise<SettingItem> => {
    const res = await fetch(`${API_BASE_URL}/api/settings/${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse<SettingItem>(res);
  },

  update: async (key: string, payload: UpdateSettingPayload): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/api/settings/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<string>(res);
  },
};
