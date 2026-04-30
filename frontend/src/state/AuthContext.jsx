import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import api from "../utils/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [guestId, setGuestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState("loading");
  const [isMerged, setIsMerged] = useState(false);

  /* ================= INIT ================= */

  useEffect(() => {
    const initAuth = async () => {
      try {
        let gid = localStorage.getItem("ds_guest");
        if (!gid) {
          gid = crypto.randomUUID();
          localStorage.setItem("ds_guest", gid);
        }
        setGuestId(gid);

        const token = localStorage.getItem("ds_access");

        // no token → logged out
        if (!token) {
          setUser(null);
          setAuthStatus("unauthenticated");
          return;
        }

        // 🔥 IMPORTANT: let interceptor handle refresh automatically
        const { data } = await api.get("/auth/me");

        setUser(data.user);
        setAuthStatus("authenticated");

      } catch (err) {
        console.log("Auth init failed → user not authenticated");

        setUser(null);
        setAuthStatus("unauthenticated");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  /* ================= GOOGLE CALLBACK ================= */

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const at = params.get("accessToken");
    if (!at) return;

    localStorage.setItem("ds_access", at);

    api.get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
        setAuthStatus("authenticated");
      })
      .catch(() => {
        setUser(null);
        setAuthStatus("unauthenticated");
      });

    window.history.replaceState({}, document.title, "/");
  }, []);

  /* ================= MERGE ================= */

  const mergeGuestData = async (gid) => {
    if (!gid || isMerged) return;

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
    setAuthStatus("loading");

    const { data } = await api.post("/auth/login", { email, password });

    localStorage.setItem("ds_access", data.accessToken);

    const res = await api.get("/auth/me");

    setUser(res.data.user);
    setAuthStatus("authenticated");
  };

  const register = async (name, email, password) => {
    setAuthStatus("loading");

    const { data } = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    localStorage.setItem("ds_access", data.accessToken);

    const res = await api.get("/auth/me");

    setUser(res.data.user);
    setAuthStatus("authenticated");
  };

  const loginWithGoogle = async (token) => {
    setAuthStatus("loading");

    const { data } = await api.post("/auth/google", { token });

    localStorage.setItem("ds_access", data.accessToken);

    const res = await api.get("/auth/me");

    setUser(res.data.user);
    setAuthStatus("authenticated");
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    setUser(null);
    setAuthStatus("unauthenticated");

    localStorage.removeItem("ds_user");
    localStorage.removeItem("ds_access");

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
        authStatus,
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