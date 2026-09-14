import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getApiUrl, eventBus, MFE_EVENTS } from "@template/shared";
import { useNavigate } from "react-router-dom";
import { storage } from "../utils/sastStorage";

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

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
  const navigate = useNavigate();

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
          await fetchUserProfile(token);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        storage.remove("token");
        storage.remove("apiKey");
        storage.remove("authenticated");
        storage.remove("user");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
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
        } else {
          await fetchUserProfile(apiKey);
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

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
