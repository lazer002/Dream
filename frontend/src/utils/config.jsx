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
const WISHLIST_KEY = "ds_wishlist";

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
export function getWishlist() {
  try { return JSON.parse(localStorage.getItem("ds_wishlist") || "[]"); } catch { return []; }
}


export function clearAuth() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(GUEST_KEY);
    localStorage.removeItem(WISHLIST_KEY);
    // also clear axios default header
    try { delete api.defaults.headers.common['Authorization']; } catch {}
  } catch {}
}

// set Authorization header on axios defaults immediately
export function setAuthHeader(token) {
  try {
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    else delete api.defaults.headers.common['Authorization'];
  } catch {}
}

/** Axios instance (default export) */
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  withCredentials: true, // <- send cookies if backend uses sessions
  headers: { "Content-Type": "application/json" },
});

// request interceptor attaches access token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export default api;
