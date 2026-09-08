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

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
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
  const value = useMemo(
    () => ({
      queryClient: queryClient || new QueryClient(),
      authContext: authContext || defaultAuthContext,
      apiBaseUrl: apiBaseUrl || getApiBaseUrl(),
      eventBus,
    }),
    [queryClient, authContext, apiBaseUrl]
  );

  return <SharedContext.Provider value={value}>{children}</SharedContext.Provider>;
};
