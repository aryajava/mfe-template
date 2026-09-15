import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  getApiUrl,
  eventBus,
  MFE_EVENTS,
  type User,
  type MenuPermissionItem,
  type AuthContextType,
} from "@template/shared";
import { useNavigate } from "react-router-dom";
import { storage } from "../utils/sastStorage";

export type { User, MenuPermissionItem, AuthContextType };

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPermissionsLoaded, setIsPermissionsLoaded] = useState<boolean>(() => {
    try {
      return Boolean(storage.retrieve("menuPermissions"));
    } catch {
      return false;
    }
  });
  const [menuPermissions, setMenuPermissions] = useState<Record<string, MenuPermissionItem>>(() => {
    try {
      const cached = storage.retrieve("menuPermissions");
      if (cached) {
        const parsed = JSON.parse(cached);
        const normalized: Record<string, MenuPermissionItem> = {};
        for (const [k, v] of Object.entries(parsed)) {
          const item = v as MenuPermissionItem;
          normalized[k.toLowerCase()] = item;
          if (item.fullPath) {
            normalized[item.fullPath.toLowerCase()] = item;
          }
        }
        return normalized;
      }
      return {};
    } catch {
      return {};
    }
  });
  const navigate = useNavigate();

  const fetchMenuPermissions = async (token: string): Promise<Record<string, MenuPermissionItem> | null> => {
    try {
      const authApiUrl = getApiUrl("auth");
      const response = await fetch(`${authApiUrl}/role-menus/my-permissions`, {
        headers: {
          "X-Api-Key": token,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const resJson = await response.json();
        const rawPerms: Record<string, MenuPermissionItem> = resJson.data?.permissions || resJson.permissions || {};
        const normalized: Record<string, MenuPermissionItem> = {};
        for (const [k, v] of Object.entries(rawPerms)) {
          const item = v as MenuPermissionItem;
          normalized[k.toLowerCase()] = item;
          if (item.fullPath) {
            normalized[item.fullPath.toLowerCase()] = item;
          }
        }
        setMenuPermissions(normalized);
        setIsPermissionsLoaded(true);
        storage.store("menuPermissions", JSON.stringify(normalized));
        return normalized;
      }
    } catch (error) {
      console.warn("Failed to fetch menu permissions:", error);
    }
    return null;
  };

  const fetchUserProfile = async (token: string): Promise<User | null> => {
    try {
      const authApiUrl = getApiUrl("auth");
      const response = await fetch(`${authApiUrl}/auth/me`, {
        headers: {
          "X-Api-Key": token,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const resJson = await response.json();
        const profileData = resJson.data || resJson;
        const role = profileData.role || profileData.Role || "ADMIN";
        const userData: User = {
          id: String(profileData.id || profileData.Id || "1"),
          email: profileData.username || profileData.Username || "",
          name: profileData.displayName || profileData.display || profileData.username || "User",
          roles: [role.toLowerCase(), role.toUpperCase()],
          permissions: role.toUpperCase() === "SA" || role.toUpperCase() === "OWNER" ? ["*"] : ["read", "write"],
        };
        setUser(userData);
        storage.store("user", JSON.stringify(userData));

        return userData;
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const token = storage.retrieve("apiKey") || storage.retrieve("token");
        const cachedUserStr = storage.retrieve("user");
        if (cachedUserStr) {
          try {
            setUser(JSON.parse(cachedUserStr));
          } catch {
            // ignore parsing error
          }
        }

        if (token) {
          await Promise.allSettled([
            fetchUserProfile(token),
            fetchMenuPermissions(token),
          ]);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        storage.remove("token");
        storage.remove("apiKey");
        storage.remove("authenticated");
        storage.remove("user");
        storage.remove("menuPermissions");
        if (isMounted) {
          setMenuPermissions({});
          setIsPermissionsLoaded(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Re-evaluasi izin saat tab browser kembali aktif (focus)
    const handleFocus = () => {
      const token = storage.retrieve("apiKey") || storage.retrieve("token");
      if (token) {
        fetchMenuPermissions(token);
      }
    };

    // Re-evaluasi izin saat ada perubahan di localStorage antar-tab (storage)
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || ["token", "apiKey", "menuPermissions"].includes(e.key)) {
        const token = storage.retrieve("apiKey") || storage.retrieve("token");
        if (token) {
          fetchMenuPermissions(token);
        }
      }
    };

    // Re-evaluasi izin saat eventBus memancarkan PERMISSIONS_UPDATED
    const unsubPerms = eventBus.subscribe(MFE_EVENTS.PERMISSIONS_UPDATED, () => {
      const token = storage.retrieve("apiKey") || storage.retrieve("token");
      if (token) {
        fetchMenuPermissions(token);
      }
    });

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorage);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorage);
      unsubPerms();
    };
  }, []);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      setIsLoading(true);
      try {
        const authApiUrl = getApiUrl("auth");
        const response = await fetch(`${authApiUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameOrEmail, password }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.isSuccess) {
          const errMsg = data?.message || data?.errors?.[0] || "Username atau password salah.";
          throw new Error(errMsg);
        }

        const apiKey = data.data?.apiKey || data.data?.ApiKey;
        const rawUser = data.data?.user || data.data?.User;

        if (!apiKey) {
          throw new Error("Respon login tidak valid: API Key tidak ditemukan.");
        }

        storage.store("token", apiKey);
        storage.store("apiKey", apiKey);
        storage.store("authenticated", "true");

        if (rawUser) {
          const role = rawUser.role || "ADMIN";
          const userData: User = {
            id: String(rawUser.id),
            email: rawUser.username,
            name: rawUser.displayName || rawUser.display || rawUser.username,
            roles: [role.toLowerCase(), role.toUpperCase()],
            permissions: role.toUpperCase() === "SA" || role.toUpperCase() === "OWNER" ? ["*"] : ["read", "write"],
          };
          setUser(userData);
          storage.store("user", JSON.stringify(userData));
          await fetchMenuPermissions(apiKey);
        } else {
          await Promise.allSettled([
            fetchUserProfile(apiKey),
            fetchMenuPermissions(apiKey),
          ]);
        }

        eventBus.publish(MFE_EVENTS.USER_LOGGED_IN, { user: rawUser, token: apiKey });
        navigate("/dashboard");
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      const token = storage.retrieve("apiKey") || storage.retrieve("token");
      if (token) {
        const authApiUrl = getApiUrl("auth");
        await fetch(`${authApiUrl}/auth/logout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": token,
          },
        }).catch(() => {});
      }
    } catch {
      // ignore
    } finally {
      storage.remove("token");
      storage.remove("apiKey");
      storage.remove("authenticated");
      storage.remove("user");
      storage.remove("menuPermissions");
      setMenuPermissions({});
      setIsPermissionsLoaded(false);
      setUser(null);
      eventBus.publish(MFE_EVENTS.USER_LOGGED_OUT, {});
      navigate("/login");
    }
  }, [navigate]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user?.permissions) return false;
      if (user.permissions.includes("*")) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user?.roles) return false;
      return (
        user.roles.includes(role.toLowerCase()) ||
        user.roles.includes(role.toUpperCase()) ||
        user.roles.includes("admin") ||
        user.roles.includes("sa") ||
        user.roles.includes("owner")
      );
    },
    [user]
  );

  const canAccessMenu = useCallback(
    (menuCodeOrPath: string): boolean => {
      if (!user) return false;

      // Super Admin selalu memiliki akses penuh ke semua menu
      const isSa = user.roles?.some((r) => ["sa", "superadmin", "super admin"].includes(r.toLowerCase()));
      if (isSa) return true;

      const key = menuCodeOrPath.toLowerCase().trim();
      if (key === "dashboard" || key === "/dashboard" || key === "master" || key === "/master") {
        return true;
      }

      // 1. Cek langsung via menuCode atau fullPath
      const perm = menuPermissions[key];
      if (perm !== undefined) {
        return Boolean(perm.canRead);
      }

      // 2. Cek apakah ada item yang fullPath-nya cocok
      for (const item of Object.values(menuPermissions)) {
        if (item.fullPath && item.fullPath.toLowerCase() === key) {
          return Boolean(item.canRead);
        }
      }

      if (isPermissionsLoaded) {
        return false;
      }
      return false;
    },
    [user, menuPermissions, isPermissionsLoaded]
  );

  const canPerformAction = useCallback(
    (menuCodeOrPath: string, action: 'create' | 'update' | 'delete' | 'status'): boolean => {
      if (!user) return false;

      const isSa = user.roles?.some((r) => ["sa", "superadmin", "super admin"].includes(r.toLowerCase()));
      if (isSa) return true;

      const key = menuCodeOrPath.toLowerCase().trim();
      let perm = menuPermissions[key];
      if (!perm) {
        for (const item of Object.values(menuPermissions)) {
          if (item.fullPath && item.fullPath.toLowerCase() === key) {
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
    [user, menuPermissions]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    menuPermissions,
    canAccessMenu,
    canPerformAction,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
