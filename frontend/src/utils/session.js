// utils/session.js
//
// ONE token refresh for the whole site (RTK Query in store/api.js and axios in
// utils/config.js both use it). The refresh token lives in an httpOnly cookie
// set by the backend; this only stores the short-lived access token.
//
// Rules:
//  - only refresh when a token was actually sent (guests never refresh)
//  - never refresh for /auth/* calls (a wrong password must show its error)
//  - a rate limit (429) or network error is NOT a logout
//  - only a real "session expired" logs the user out

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const TOKEN_KEY = "ds_access";

export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const setAccessToken = (token) => token && localStorage.setItem(TOKEN_KEY, token);
export const clearAccessToken = () => localStorage.removeItem(TOKEN_KEY);

// Login-type calls: a 401 here is a real answer ("wrong password"), never a
// reason to refresh. /auth/me is NOT one of them (it needs a fresh token).
export const isAuthUrl = (url = "") =>
  /\/auth\/(login|register|google|refresh|logout|otp|change-password)/.test(String(url));

let refreshing = null;

/**
 * Returns a new access token, or null when the session is really over.
 * Throws for temporary problems (429 / offline) so callers keep the user
 * logged in.
 */
export function refreshAccessToken() {
  if (!refreshing) {
    refreshing = (async () => {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (res.status === 429 || res.status >= 500) {
        throw new Error("Refresh temporarily unavailable");
      }

      if (!res.ok) {
        clearAccessToken();
        return null;
      }

      const data = await res.json().catch(() => ({}));

      if (!data?.accessToken) {
        clearAccessToken();
        return null;
      }

      setAccessToken(data.accessToken);
      return data.accessToken;
    })().finally(() => {
      refreshing = null;
    });
  }

  return refreshing;
}

const tokenExpiresAt = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Number(payload.exp) * 1000 || 0;
  } catch {
    return 0;
  }
};

/**
 * Token to send with a request. Some endpoints treat an expired token as a
 * guest (no 401 to trigger a refresh), so renew it shortly BEFORE it expires.
 */
export async function freshAccessToken() {
  const token = getAccessToken();

  if (!token) return null;

  if (tokenExpiresAt(token) - Date.now() > 30 * 1000) return token;

  try {
    return (await refreshAccessToken()) || null;
  } catch {
    return token; // temporary problem: try with the current token
  }
}

/** Session is over: go to the login page (once). */
export function goToLogin() {
  if (window.location.pathname.startsWith("/login")) return;

  window.location.assign("/login");
}

/** Readable message from an RTK (`{data}`) or axios (`{response:{data}}`) error. */
export function errorMessage(error, fallback = "Something went wrong") {
  const data = error?.data || error?.response?.data;

  if (error?.status === 429 || error?.response?.status === 429) {
    return data?.error || "Too many attempts. Please wait a minute and try again.";
  }

  return data?.error || data?.message || fallback;
}
