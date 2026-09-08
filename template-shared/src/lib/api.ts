export interface ApiConfig {
  baseUrl: string;
  getToken: () => string | null;
  onUnauthorized?: () => void;
}

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

export const createApiClient = (config: ApiConfig) => {
  const { baseUrl, getToken, onUnauthorized } = config;

  const getAuthHeaders = (): HeadersInit => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const handleResponse = async <T>(response: Response): Promise<T> => {
    if (response.status === 401) {
      onUnauthorized?.();
      throw new Error('Unauthorized');
    }

    if (response.status === 403) {
      const error = await response.json().catch(() => ({ message: 'Access Denied' }));
      throw {
        message: error.message || 'You do not have permission to perform this action.',
        status: 403,
        details: error,
      } as ApiError;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw {
        message: error.message || `Request failed: ${response.status}`,
        status: response.status,
        details: error,
      } as ApiError;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  };

  return {
    get: async <T>(endpoint: string): Promise<T> => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse<T>(response);
    },

    post: async <T>(endpoint: string, data?: unknown): Promise<T> => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleResponse<T>(response);
    },

    put: async <T>(endpoint: string, data?: unknown): Promise<T> => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleResponse<T>(response);
    },

    patch: async <T>(endpoint: string, data?: unknown): Promise<T> => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      return handleResponse<T>(response);
    },

    delete: async <T>(endpoint: string): Promise<T> => {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      return handleResponse<T>(response);
    },
  };
};

export type ApiClient = ReturnType<typeof createApiClient>;
