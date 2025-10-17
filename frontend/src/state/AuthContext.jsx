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

  // persist state
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

  // axios instance with interceptors
  const api = useMemo(() => {
    const instance = baseApi;

    // Request interceptor
    const requestInterceptor = instance.interceptors.request.use((config) => {
      if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    // Response interceptor
    const responseInterceptor = instance.interceptors.response.use(
      (res) => res,
      async (error) => {
        if (error.response?.status === 401 && refreshToken && !error.config._retry) {
          try {
            error.config._retry = true; // prevent infinite loop
            const { data } = await baseApi.post(`/auth/refresh`, { refreshToken });
            setAccessToken(data.accessToken);
            error.config.headers.Authorization = `Bearer ${data.accessToken}`;
            return instance(error.config);
          } catch (e) {
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance; // ✅ return the axios instance, not a cleanup function
  }, [accessToken, refreshToken]);

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

  const loginWithGoogle = async (googleToken) => {
    try {
      console.log("Sending token to backend:", googleToken);

      const { data } = await baseApi.post(
        `/auth/google`,
        { token: googleToken },
        { withCredentials: true }
      );

      console.log("Received from backend:", data);
      setUser(data.user);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      return data;
    } catch (err) {
      console.error("Google login failed at backend:", err.response?.data || err.message);
      throw err;
    }
  };

  // 🚪 Logout
  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const value = { user, api, login, register, loginWithGoogle, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
