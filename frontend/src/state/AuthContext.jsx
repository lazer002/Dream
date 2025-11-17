import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api as baseApi } from "../utils/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("ds_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [accessToken, setAccessToken] = useState(localStorage.getItem("ds_access") || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("ds_refresh") || null);

  // 🧠 Persist user and tokens
  useEffect(() => {
    if (user) localStorage.setItem("ds_user", JSON.stringify(user));
    else localStorage.removeItem("ds_user");
  }, [user]);

  useEffect(() => {
    if (accessToken) localStorage.setItem("ds_access", accessToken);
    else localStorage.removeItem("ds_access");
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) localStorage.setItem("ds_refresh", refreshToken);
    else localStorage.removeItem("ds_refresh");
  }, [refreshToken]);

  // 🧩 Memoized Axios instance
  const api = useMemo(() => {
    const instance = baseApi;

    // Remove old interceptors before adding new ones (avoid stacking)
    instance.interceptors.request.handlers = [];
    instance.interceptors.response.handlers = [];

    // Request interceptor → attach token
    instance.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    // Response interceptor → handle 401 and refresh logic
    instance.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401 && refreshToken && !error.config._retry) {
          try {
            error.config._retry = true;
            const { data } = await baseApi.post(`/auth/refresh`, { refreshToken });

            // ✅ Update token and retry the failed request
            setAccessToken(data.accessToken);
            error.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return instance(error.config);
          } catch (err) {
            console.warn("Token refresh failed, logging out...");
            handleLogout();
          }
        }

        // Any other error → reject
        return Promise.reject(error);
      }
    );

    return instance;
  }, [accessToken, refreshToken]);

  // 🚪 Centralized Logout Handler
  const handleLogout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("ds_user");
    localStorage.removeItem("ds_access");
    localStorage.removeItem("ds_refresh");
    window.location.href = "/login"; // 🔁 Redirect immediately
  };

  // 🔐 Standard Login
  const login = async (email, password) => {
    const { data } = await baseApi.post(`/auth/login`, { email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return data;
  };

  // 🆕 Register
  const register = async (name, email, password) => {
    const { data } = await baseApi.post(`/auth/register`, { name, email, password });
    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return data;
  };

  // 🔐 Google Login
  const loginWithGoogle = async (googleToken) => {
    try {
      const { data } = await baseApi.post(`/auth/google`, { token: googleToken }, { withCredentials: true });
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data;
    } catch (err) {
      console.error("Google login failed:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = handleLogout;

  const value = { user, api, login, register, loginWithGoogle, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}