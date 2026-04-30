import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 10000,
  withCredentials: true,
});

/* ================= REQUEST ================= */

api.interceptors.request.use((config) => {
  let guestId = localStorage.getItem("ds_guest");
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem("ds_guest", guestId);
  }

  config.headers = config.headers || {};
  config.headers["x-guest-id"] = guestId;

  const token = localStorage.getItem("ds_access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= RESPONSE (🔥 ADD THIS) ================= */

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalReq = error.config;

    // 🔥 only handle 401
    if (error.response?.status === 401 && !originalReq._retry) {
      originalReq._retry = true;

      // 🔁 if already refreshing → wait
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        })
          .then((token) => {
            originalReq.headers.Authorization = `Bearer ${token}`;
            return api(originalReq);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        console.log("🔥 REFRESH CALL");

        const { data } = await api.post("/auth/refresh", {}, {
          withCredentials: true,
        });

        // save new token
        localStorage.setItem("ds_access", data.accessToken);

        // resolve queued requests
        queue.forEach((p) => p.resolve(data.accessToken));
        queue = [];

        // retry original request
        originalReq.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalReq);

      } catch (err) {
        queue.forEach((p) => p.reject(err));
        queue = [];

        // logout fallback
        localStorage.removeItem("ds_access");
        localStorage.removeItem("ds_refresh");

        window.location.href = "/login";

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;