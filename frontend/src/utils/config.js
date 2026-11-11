import axios from "axios";
import {
  API_URL,
  getAccessToken,
  freshAccessToken,
  isAuthUrl,
  refreshAccessToken,
  goToLogin,
} from "@/utils/session";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
});

/* ================= REQUEST ================= */

api.interceptors.request.use(async (config) => {
  let guestId = localStorage.getItem("ds_guest");
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem("ds_guest", guestId);
  }

  config.headers = config.headers || {};
  config.headers["x-guest-id"] = guestId;

  // Renewed shortly before expiry (except for the auth calls themselves).
  const token = isAuthUrl(config.url) ? getAccessToken() : await freshAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= RESPONSE ================= */
// Same rules as store/api.js (shared refresh in utils/session.js): only a
// logged-in request with an expired token is refreshed and retried once.

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalReq = error.config || {};

    const shouldRefresh =
      error.response?.status === 401 &&
      !originalReq._retry &&
      Boolean(getAccessToken()) &&
      !isAuthUrl(originalReq.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    originalReq._retry = true;

    let newToken;

    try {
      newToken = await refreshAccessToken();
    } catch {
      // 429 / offline: stay logged in, report the original error.
      return Promise.reject(error);
    }

    if (!newToken) {
      goToLogin();
      return Promise.reject(error);
    }

    originalReq.headers = originalReq.headers || {};
    originalReq.headers.Authorization = `Bearer ${newToken}`;

    return api(originalReq);
  }
);

export default api;
