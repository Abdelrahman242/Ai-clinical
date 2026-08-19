import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    const token = localStorage.getItem("codex_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      localStorage.removeItem("codex_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (username, password) => {
    const { access_token } = await api.login(username, password);
    localStorage.setItem("codex_token", access_token);
    const me = await api.me();
    setUser(me);
  };

  const register = async (username, email, password) => {
    await api.register(username, email, password);
  };

  const logout = () => {
    localStorage.removeItem("codex_token");
    setUser(null);
  };

  const refreshUser = async () => {
    const me = await api.me();
    setUser(me);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, isAdmin: !!user?.is_admin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
