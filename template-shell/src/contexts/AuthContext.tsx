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
  login: (email: string, password: string) => Promise<void>;
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

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = storage.retrieve("token");
        if (token) {
          await fetchUserProfile(token);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        storage.remove("token");
        storage.remove("authenticated");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const fetchUserProfile = async (token: string) => {
    try {
      const authApiUrl = getApiUrl("auth");
      const response = await fetch(`${authApiUrl}/Auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        const userData: User = {
          id: profileData.id || "",
          email: profileData.email || "",
          name: profileData.name || "",
          roles: [profileData.role || "user"],
          permissions: profileData.permissions || [],
        };
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const authApiUrl = getApiUrl("auth");
        const response = await fetch(`${authApiUrl}/Auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const error: any = new Error("Login failed");
          error.status = response.status;
          throw error;
        }

        const data = await response.json();
        const token = data.token || data.Token;

        if (!token) {
          throw new Error("Invalid login response: no token");
        }

        storage.store("token", token);
        storage.store("authenticated", "true");

        await fetchUserProfile(token);
        navigate("/dashboard");
      } catch (error) {
        // Demo fallback
        const demoUser: User = {
          id: "1",
          email: email || "admin@example.com",
          name: "Demo Admin",
          roles: ["admin"],
          permissions: ["*"],
        };
        storage.store("token", "demo-token");
        storage.store("authenticated", "true");
        setUser(demoUser);
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  const logout = useCallback(() => {
    storage.remove("token");
    storage.remove("authenticated");
    storage.remove("user");
    setUser(null);
    navigate("/login");
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
      return user.roles.includes(role) || user.roles.includes("admin");
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
