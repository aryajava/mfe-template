import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { eventBus, type EventBusInstance } from '../lib/eventBus';
import { getApiBaseUrl } from '../lib/env';

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

export interface MenuPermissionItem {
  menuCode?: string;
  groupCode?: string;
  groupName?: string;
  urlPrefix?: string;
  fullPath?: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canToggleActive: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  menuPermissions: Record<string, MenuPermissionItem>;
  canAccessMenu: (menuCodeOrPath: string) => boolean;
  canPerformAction: (menuCodeOrPath: string, action: 'create' | 'update' | 'delete' | 'status') => boolean;
}

export interface SharedContextType {
  queryClient: QueryClient;
  authContext: AuthContextType;
  apiBaseUrl: string;
  eventBus: EventBusInstance;
}

const SharedContext = createContext<SharedContextType | null>(null);

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: () => {},
  hasPermission: () => false,
  hasRole: () => false,
  menuPermissions: {},
  canAccessMenu: () => false,
  canPerformAction: () => false,
};

const defaultFallbackContext: SharedContextType = {
  queryClient: new QueryClient(),
  authContext: defaultAuthContext,
  apiBaseUrl: getApiBaseUrl(),
  eventBus,
};

export const useSharedContext = (): SharedContextType => {
  const context = useContext(SharedContext);
  if (!context) {
    return defaultFallbackContext;
  }
  return context;
};

interface SharedProviderProps {
  children: ReactNode;
  queryClient?: QueryClient;
  authContext?: AuthContextType;
  apiBaseUrl?: string;
}

export const SharedProvider: React.FC<SharedProviderProps> = ({
  children,
  queryClient,
  authContext,
  apiBaseUrl,
}) => {
  const parent = useContext(SharedContext);

  const value = useMemo(
    () => ({
      queryClient: queryClient || parent?.queryClient || new QueryClient(),
      authContext: authContext || parent?.authContext || defaultAuthContext,
      apiBaseUrl: apiBaseUrl || parent?.apiBaseUrl || getApiBaseUrl(),
      eventBus,
    }),
    [queryClient, authContext, apiBaseUrl, parent]
  );

  return <SharedContext.Provider value={value}>{children}</SharedContext.Provider>;
};
