// src/utils/config.js
import axios from "axios";

/** INLINE: base URL */
function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}

/** Your localStorage keys */
const ACCESS_KEY = "ds_access";
const REFRESH_KEY = "ds_refresh";
const USER_KEY = "ds_user";
const GUEST_KEY = "ds_guest";

/** Token helpers */
function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}
function setAccessToken(token) {
  if (token) localStorage.setItem(ACCESS_KEY, token);
  else localStorage.removeItem(ACCESS_KEY);
}
function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}
function setRefreshToken(token) {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}
function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Create axios instance */
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

/** Request interceptor — attach access token */
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Refresh logic */
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
    const res = await axios.post(
      `${getApiBaseUrl()}/auth/refresh`,
      body,
      { withCredentials: true }  // allows httpOnly cookie refresh style
    );

    const { accessToken, refreshToken } = res.data || {};

    if (accessToken) setAccessToken(accessToken);
    if (refreshToken) setRefreshToken(refreshToken);

    return accessToken;
  } catch (err) {
    clearAuth();
    throw err;
  }
}

/** Response interceptor — auto-refresh on 401 */
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    if (original._retry) {
      return Promise.reject(error);
    }

    if (original.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (token) => {
            if (!token) return reject(error);
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    original._retry = true;

    try {
      const newToken = await refreshTokenRequest();
      isRefreshing = false;
      processQueue(null, newToken);

      if (!newToken) throw new Error("Refresh returned no token");

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
