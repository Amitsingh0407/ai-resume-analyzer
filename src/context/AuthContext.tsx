import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "../types";
import api from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("resume_analyzer_token"));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authenticate user status if key exists in memory
  useEffect(() => {
    const initAuth = async () => {
      const cachedToken = localStorage.getItem("resume_analyzer_token");
      if (cachedToken) {
        try {
          const res = await api.get("/auth/profile");
          setUser(res.data);
          setToken(cachedToken);
        } catch (err: any) {
          console.warn("Session validation failed. Clearing authentications.", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token: receivedToken, user: receivedUser } = res.data;
      
      localStorage.setItem("resume_analyzer_token", receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
    } catch (err: any) {
      console.error("Login attempt failure:", err);
      const msg = err.response?.data?.error || "Incorrect login email or password. Please try again.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem("resume_analyzer_token", receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
    } catch (err: any) {
      console.error("Registration attempt exception:", err);
      const msg = err.response?.data?.error || "Failed to create account. Email may already be in use.";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("resume_analyzer_token");
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data);
    } catch (err) {
      console.error("Failed to sync profile context:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be called inside an AuthProvider scope.");
  }
  return context;
}
