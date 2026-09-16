import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { eventBus, type EventBusInstance } from '../lib/eventBus';
import { getApiBaseUrl } from '../lib/env';

export interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  displayName?: string;
  roles: string[];
  permissions: string[];
}

export interface MenuPermissionItem {
  menuCode?: string;
  menuName?: string;
  groupCode?: string;
  groupName?: string;
  groupUrlPrefix?: string;
  mfeKey?: string;
  urlPrefix?: string;
  fullPath?: string;
  icon?: string | null;
  groupIcon?: string | null;
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
  loginCustomer?: (email: string, password: string) => Promise<void>;
  registerCustomer?: (name: string, email: string, password: string) => Promise<any>;
  resetPassword?: (identifier: string, newPassword: string, confirmPassword: string, isCustomer: boolean) => Promise<any>;
}

export interface SharedContextType {
  queryClient: QueryClient;
  authContext: AuthContextType;
  apiBaseUrl: string;
  eventBus: EventBusInstance;
}

const GLOBAL_SHARED_CONTEXT_KEY = '__MFE_SHARED_REACT_CONTEXT__';

const SharedContext: React.Context<SharedContextType | null> =
  typeof window !== 'undefined'
    ? ((window as any)[GLOBAL_SHARED_CONTEXT_KEY] =
        (window as any)[GLOBAL_SHARED_CONTEXT_KEY] ||
        createContext<SharedContextType | null>(null))
    : createContext<SharedContextType | null>(null);

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

const getCachedAuthContext = (): AuthContextType => {
  if (typeof window === 'undefined') return defaultAuthContext;

  try {
    const cachedUserStr = localStorage.getItem('user') || localStorage.getItem('sast_user');
    const cachedPermsStr = localStorage.getItem('menuPermissions') || localStorage.getItem('sast_menuPermissions');
    const user = cachedUserStr ? JSON.parse(cachedUserStr) : null;
    const menuPermissions = cachedPermsStr ? JSON.parse(cachedPermsStr) : {};

    const isSa = user?.roles?.some((r: string) => ['sa', 'superadmin', 'super admin'].includes(r.toLowerCase()));

    return {
      user,
      isAuthenticated: Boolean(user),
      isLoading: false,
      login: async () => {},
      logout: () => {},
      hasPermission: (perm: string) => {
        if (!user?.permissions) return false;
        if (user.permissions.includes('*')) return true;
        return user.permissions.includes(perm);
      },
      hasRole: (role: string) => {
        if (!user?.roles) return false;
        return user.roles.some((r: string) => r.toLowerCase() === role.toLowerCase());
      },
      menuPermissions,
      canAccessMenu: (menuCodeOrPath: string) => {
        if (!user) return false;
        if (isSa) return true;
        const key = menuCodeOrPath.toLowerCase().trim();
        if (key === 'dashboard' || key === '/dashboard' || key === 'master' || key === '/master') return true;
        const perm = menuPermissions[key];
        if (perm !== undefined) return Boolean(perm.canRead);
        for (const item of Object.values(menuPermissions)) {
          if ((item as any)?.fullPath && (item as any).fullPath.toLowerCase() === key) {
            return Boolean((item as any).canRead);
          }
        }
        return false;
      },
      canPerformAction: (menuCodeOrPath: string, action: 'create' | 'update' | 'delete' | 'status') => {
        if (!user) return false;
        if (isSa) return true;
        const key = menuCodeOrPath.toLowerCase().trim();
        let perm = menuPermissions[key];
        if (!perm) {
          for (const item of Object.values(menuPermissions)) {
            if ((item as any)?.fullPath && (item as any).fullPath.toLowerCase() === key) {
              perm = item;
              break;
            }
          }
        }
        if (!perm) return false;
        if (action === 'create') return Boolean(perm.canCreate);
        if (action === 'update') return Boolean(perm.canUpdate);
        if (action === 'delete') return Boolean(perm.canDelete);
        if (action === 'status') return Boolean(perm.canToggleActive);
        return Boolean(perm.canRead);
      },
    };
  } catch {
    return defaultAuthContext;
  }
};

const getDefaultFallbackContext = (): SharedContextType => ({
  queryClient: new QueryClient(),
  authContext: getCachedAuthContext(),
  apiBaseUrl: getApiBaseUrl(),
  eventBus,
});

export const useSharedContext = (): SharedContextType => {
  const context = useContext(SharedContext);
  if (!context || !context.authContext?.user) {
    const cached = getCachedAuthContext();
    if (cached.user) {
      return {
        queryClient: context?.queryClient || new QueryClient(),
        authContext: cached,
        apiBaseUrl: context?.apiBaseUrl || getApiBaseUrl(),
        eventBus,
      };
    }
  }
  return context || getDefaultFallbackContext();
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
      authContext:
        authContext ||
        (parent?.authContext?.user ? parent.authContext : getCachedAuthContext()),
      apiBaseUrl: apiBaseUrl || parent?.apiBaseUrl || getApiBaseUrl(),
      eventBus,
    }),
    [queryClient, authContext, apiBaseUrl, parent]
  );

  return <SharedContext.Provider value={value}>{children}</SharedContext.Provider>;
};
