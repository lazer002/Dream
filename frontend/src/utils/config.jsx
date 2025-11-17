import axios from "axios";

// Get the base API URL from environment variables
export function getApiBaseUrl() {
  // Use Vite env variable, fallback to localhost if not set
  return import.meta.env.VITE_API_URL || "http://localhost:4000/api";
}

// Create a pre-configured axios instance
export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api