import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 10000,
});

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

export default api;