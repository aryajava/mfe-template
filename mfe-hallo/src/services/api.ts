import { createApiClient, getApiUrl } from '@template/shared';
import { storage } from '../utils/sastStorage';

export const getApiClient = () => {
  const token = storage.retrieve('token');
  return createApiClient({
    baseUrl: getApiUrl('auth'),
    getToken: () => token,
    onUnauthorized: () => {
      storage.remove('token');
      storage.remove('authenticated');
      window.location.href = '/login';
    },
  });
};

export const api = {
  getUsers: async () => {
    const client = getApiClient();
    return client.get<any>('/users');
  },

  getUserById: async (id: string) => {
    const client = getApiClient();
    return client.get<any>(`/users/${id}`);
  },
};
