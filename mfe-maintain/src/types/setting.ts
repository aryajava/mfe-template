export interface SettingItem {
  id: number;
  key: string;
  value: string;
  label: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  version: number;
}

export interface UpdateSettingPayload {
  value: string;
  version: number;
}

export interface ApiResponse<T> {
  traceId?: string;
  isSuccess: boolean;
  statusCode: number;
  message?: string;
  data: T;
  errors?: string[] | null;
  timestamp?: string;
}
