// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import api, { setAccessToken, setRefreshToken, clearAuth } from "../utils/config.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("ds_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  useEffect(() => {
    try {
      if (user) localStorage.setItem("ds_user", JSON.stringify(user));
      else localStorage.removeItem("ds_user");
    } catch {}
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    clearAuth();
    window.location.href = "/login";
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user ?? null);
    if (data.accessToken) setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    setUser(data.user ?? null);
    if (data.accessToken) setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async (googleToken) => {
    const { data } = await api.post("/auth/google", { token: googleToken }, { withCredentials: true });
    setUser(data.user ?? null);
    if (data.accessToken) setAccessToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data;
  }, []);

  const value = useMemo(() => ({ user, api, login, register, loginWithGoogle, logout }), [user, login, register, loginWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
