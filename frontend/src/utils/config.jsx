// src/utils/config.jsx
import axios from "axios";

/** INLINE: base URL */
function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}

/** LocalStorage keys */
const ACCESS_KEY = "ds_access";
const REFRESH_KEY = "ds_refresh";
const USER_KEY = "ds_user";
const GUEST_KEY = "ds_guest";

/** Token helpers (named exports) */
export function getAccessToken() {
  try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
}
export function setAccessToken(token) {
  try {
    if (token) localStorage.setItem(ACCESS_KEY, token);
    else localStorage.removeItem(ACCESS_KEY);
  } catch {}
}
export function getRefreshToken() {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setRefreshToken(token) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch {}
}
export function clearAuth() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(GUEST_KEY);
  } catch {}
}

/** Axios instance (default export) */
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// request interceptor attaches access token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// refresh queue
let isRefreshing = false;
let queue = [];

function processQueue(err, token = null) {
  queue.forEach(({ resolve, reject }) => {
    if (err) reject(err);
    else resolve(token);
  });
  queue = [];
}

async function refreshTokenRequest() {
  try {
    const body = getRefreshToken() ? { refreshToken: getRefreshToken() } : {};
    // use raw axios to avoid our interceptors
    const res = await axios.post(`${getApiBaseUrl()}/auth/refresh`, body, { withCredentials: true });
    const { accessToken, refreshToken } = res.data || {};
    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);
    return res.data;
  } catch (err) {
    clearAuth();
    throw err;
  }
}

function isRefreshEndpoint(url) {
  try {
    const full = new URL(url, getApiBaseUrl());
    return full.pathname.includes("/auth/refresh");
  } catch {
    return String(url || "").includes("/auth/refresh");
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!error.response) return Promise.reject(error);
    if (error.response.status !== 401) return Promise.reject(error);
    if (!original || original._retry) return Promise.reject(error);
    if (isRefreshEndpoint(original.url)) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: async (token) => {
            if (!token) return reject(error);
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${token}`;
            try { resolve(api(original)); } catch (e) { reject(e); }
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    original._retry = true;

    try {
      const payload = await refreshTokenRequest();
      const newToken = payload?.accessToken ?? null;
      isRefreshing = false;
      processQueue(null, newToken);

      if (!newToken) throw new Error("Refresh returned no access token");
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (err) {
      isRefreshing = false;
      processQueue(err, null);
      return Promise.reject(err);
    }
  }
);

export default api;
