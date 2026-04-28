import { createContext, useContext, useEffect, useState } from "react";
import api from "../utils/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMerged, setIsMerged] = useState(false);

  /* ================= INIT ================= */

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("ds_user");
      const at = localStorage.getItem("ds_access");
      const rt = localStorage.getItem("ds_refresh");
      let gid = localStorage.getItem("ds_guest");

      // guest
      if (!gid) {
        gid = crypto.randomUUID();
        localStorage.setItem("ds_guest", gid);
      }
      setGuestId(gid);

      // restore user
      if (at && rawUser) {
        setUser(JSON.parse(rawUser));
        setAccessToken(at);
        setRefreshToken(rt);
      }

    } catch (err) {
      console.error("Init error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= AXIOS ================= */

  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      const token = localStorage.getItem("ds_access");
      const gid = localStorage.getItem("ds_guest");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (gid) {
        config.headers["x-guest-id"] = gid;
      }

      return config;
    });

    const resId = api.interceptors.response.use(
      (res) => res,
      async (error) => {
        const originalReq = error.config;

        if (
          error.response?.status === 401 &&
          refreshToken &&
          !originalReq._retry
        ) {
          try {
            originalReq._retry = true;

            const { data } = await api.post("/auth/refresh", {
              refreshToken,
            });

            setAccessToken(data.accessToken);
            localStorage.setItem("ds_access", data.accessToken);

            originalReq.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(originalReq);

          } catch (err) {
            logout();
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, [refreshToken]);

  /* ================= PERSIST ================= */

  useEffect(() => {
    user
      ? localStorage.setItem("ds_user", JSON.stringify(user))
      : localStorage.removeItem("ds_user");
  }, [user]);

  useEffect(() => {
    accessToken
      ? localStorage.setItem("ds_access", accessToken)
      : localStorage.removeItem("ds_access");
  }, [accessToken]);

  useEffect(() => {
    refreshToken
      ? localStorage.setItem("ds_refresh", refreshToken)
      : localStorage.removeItem("ds_refresh");
  }, [refreshToken]);

  /* ================= GOOGLE CALLBACK ================= */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const at = params.get("accessToken");
    const rt = params.get("refreshToken");

    if (!at) return;

    localStorage.setItem("ds_access", at);
    if (rt) localStorage.setItem("ds_refresh", rt);

    setAccessToken(at);
    setRefreshToken(rt || null);

    window.history.replaceState({}, document.title, "/");
  }, []);

  /* ================= MERGE ================= */

  const mergeGuestData = async (gid) => {
    if (!accessToken || !gid || isMerged) return;

    try {
      await api.post("/wishlist/sync");

      localStorage.removeItem("ds_guest");
      setGuestId(null);
      setIsMerged(true);

    } catch (err) {
      console.error("Merge error:", err);
    }
  };

  useEffect(() => {
    if (user && guestId) {
      mergeGuestData(guestId);
    }
  }, [user, guestId]);

  /* ================= AUTH ================= */

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });

    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    return data;
  };

  const loginWithGoogle = async (token) => {
    const { data } = await api.post("/auth/google", { token });

    setUser(data.user);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);

    return data;
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    localStorage.removeItem("ds_user");
    localStorage.removeItem("ds_access");
    localStorage.removeItem("ds_refresh");

    const gid = crypto.randomUUID();
    localStorage.setItem("ds_guest", gid);
    setGuestId(gid);

    setIsMerged(false);

    window.location.href = "/login";
  };

  /* ================= PROVIDER ================= */

  return (
    <AuthContext.Provider
      value={{
        user,
        guestId,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);