import React, { createContext, useContext, useEffect, useState } from "react";
import { apiService } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "coach" | "player";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: string
  ) => Promise<void>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for persisted user in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password);
      if (!response.user) throw new Error("Login failed");

      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("session", JSON.stringify(response.session));
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: string = "player"
  ) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(name, email, password, role);
      if (!response.user) throw new Error("Registration failed");

      // Auto-login after registration
      setUser(response.user);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("session", JSON.stringify(response.session));
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("session");
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Stable export for Vite Fast Refresh
const useAuthHook = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export { useAuthHook as useAuth };
export default AuthProvider;

// Optional: HMR support for development
if (import.meta.hot) {
  import.meta.hot.accept();
}
