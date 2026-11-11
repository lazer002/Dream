// src/state/AuthContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
} from "@/store/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const AuthContext = createContext(null);

const getOrCreateGuestId = () => {
  let gid = localStorage.getItem("ds_guest");

  if (!gid) {
    gid = crypto.randomUUID();
    localStorage.setItem("ds_guest", gid);
  }

  return gid;
};

export function AuthProvider({ children }) {
  const [guestId, setGuestId] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("ds_access")
  );
  const [authStatus, setAuthStatus] = useState("loading");
  const [isMerged, setIsMerged] = useState(false);

  /* =========================
     GUEST ID
  ========================= */

  useEffect(() => {
    setGuestId(getOrCreateGuestId());
  }, []);

  /* =========================
     CURRENT USER
  ========================= */

  const {
    data,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
    isError: isUserError,
    error: userError,
    refetch: refetchUser,
  } = useGetMeQuery(undefined, {
    skip: !authToken,
  });

  /* =========================
     SERVER USER
  ========================= */

  useEffect(() => {
    if (data?.user) {
      setAuthUser(data.user);
    }
  }, [data]);

  /* =========================
     AUTH STATUS
  ========================= */

  useEffect(() => {
    if (!authToken) {
      setAuthUser(null);
      setAuthStatus("unauthenticated");
      return;
    }

    if (isUserLoading || isUserFetching) {
      setAuthStatus("loading");
      return;
    }

    if (isUserError) {
      setAuthUser(null);
      setAuthStatus("unauthenticated");
      return;
    }

    if (data?.user) {
      setAuthStatus("authenticated");
    }
  }, [
    authToken,
    data,
    isUserLoading,
    isUserFetching,
    isUserError,
  ]);

  /*
   * Never accept a token from the URL (?accessToken=...): anyone could send
   * a link that silently logs the visitor into the sender's account.
   * Google login returns the token in the API response instead.
   */

  /* =========================
     LOGIN
  ========================= */

  const [loginMutation, { isLoading: isLoggingIn }] =
    useLoginMutation();

  const login = useCallback(
    async (email, password) => {
      setAuthStatus("loading");

      try {
        const data = await loginMutation({
          email,
          password,
        }).unwrap();

        if (!data?.accessToken) {
          throw new Error(
            "Authentication token missing"
          );
        }

        localStorage.setItem(
          "ds_access",
          data.accessToken
        );

        setAuthToken(data.accessToken);

        if (data.user) {
          setAuthUser(data.user);
        }

        setAuthStatus("authenticated");

        return data;
      } catch (error) {
        setAuthUser(null);
        setAuthStatus("unauthenticated");

        throw error;
      }
    },
    [loginMutation]
  );

  /* =========================
     REGISTER
  ========================= */

  const [
    registerMutation,
    { isLoading: isRegistering },
  ] = useRegisterMutation();

  const register = useCallback(
    async (name, email, password) => {
      setAuthStatus("loading");

      try {
        const data = await registerMutation({
          name,
          email,
          password,
        }).unwrap();

        if (!data?.accessToken) {
          throw new Error(
            "Authentication token missing"
          );
        }

        localStorage.setItem(
          "ds_access",
          data.accessToken
        );

        setAuthToken(data.accessToken);

        if (data.user) {
          setAuthUser(data.user);
        }

        setAuthStatus("authenticated");

        return data;
      } catch (error) {
        setAuthUser(null);
        setAuthStatus("unauthenticated");

        throw error;
      }
    },
    [registerMutation]
  );

  /* =========================
     GOOGLE LOGIN
  ========================= */

  const [
    googleLoginMutation,
    { isLoading: isGoogleLoggingIn },
  ] = useGoogleLoginMutation();

  const loginWithGoogle = useCallback(
    async (googleToken) => {
      if (!googleToken) {
        throw new Error(
          "Google token is required"
        );
      }

      setAuthStatus("loading");

      try {
        const data =
          await googleLoginMutation({
            token: googleToken,
          }).unwrap();

        if (!data?.accessToken) {
          throw new Error(
            "Authentication token missing"
          );
        }

        localStorage.setItem(
          "ds_access",
          data.accessToken
        );

        setAuthToken(data.accessToken);

        if (data.user) {
          setAuthUser(data.user);
        }

        setAuthStatus("authenticated");

        return data;
      } catch (error) {
        setAuthUser(null);
        setAuthStatus("unauthenticated");

        throw error;
      }
    },
    [googleLoginMutation]
  );

  /* =========================
     LOGOUT
  ========================= */

  const logout = useCallback(async () => {
    // Tell the server first: it revokes the session and clears the httpOnly
    // refresh cookie (JS can't remove that cookie itself).
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Offline: still log out locally.
    }

    localStorage.removeItem("ds_access");
    localStorage.removeItem("ds_user");
    // Don't show this person's address/email/order to the next user.
    localStorage.removeItem("checkoutInfo");
    localStorage.removeItem("track_order_last");
    sessionStorage.removeItem("cart_merged");

    const newGuestId = crypto.randomUUID();

    localStorage.setItem(
      "ds_guest",
      newGuestId
    );

    setGuestId(newGuestId);
    setAuthToken(null);
    setAuthUser(null);
    setIsMerged(false);
    setAuthStatus("unauthenticated");

    window.location.href = "/login";
  }, []);

  /* =========================
     REFRESH USER
  ========================= */

  const refreshUser = useCallback(async () => {
    if (!authToken) return null;

    try {
      const result = await refetchUser();

      if (result?.data?.user) {
        setAuthUser(result.data.user);
        setAuthStatus("authenticated");

        return result.data.user;
      }

      return null;
    } catch (error) {
      console.error(
        "REFRESH USER ERROR:",
        error
      );

      return null;
    }
  }, [authToken, refetchUser]);

  /* =========================
     LOADING
  ========================= */

  const loading =
    authStatus === "loading" ||
    isLoggingIn ||
    isRegistering ||
    isGoogleLoggingIn;

  /* =========================
     PROVIDER
  ========================= */

  return (
    <AuthContext.Provider
      value={{
        user: authUser,

        setUser: setAuthUser,

        guestId,

        loading,

        authStatus,

        isMerged,

        setIsMerged,

        login,

        register,

        loginWithGoogle,

        logout,

        refetchUser: refreshUser,

        userError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () =>
  useContext(AuthContext);