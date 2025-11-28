// src/contexts/WishlistContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import api from "../utils/config.jsx";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext();
const GUEST_KEY = "ds_wishlist";
const GUEST_ID_KEY = "ds_guest";

/* ---------------------- Helpers: normalize IDs ---------------------- */
const normalizeId = (id) => String(id);
const normalizeList = (list) => {
  if (!Array.isArray(list)) return [];
  return list.map((i) => String(i));
};

/* ---------------------- Safe localStorage helpers ---------------------- */
const hasWindow = typeof window !== "undefined";

function safeReadWishlist() {
  if (!hasWindow) return [];
  try {
    const raw = window.localStorage.getItem(GUEST_KEY);
    return raw ? normalizeList(JSON.parse(raw)) : [];
  } catch (err) {
    console.error("[Wishlist] safeReadWishlist parse error:", err);
    return [];
  }
}

let writeTimeout = null;
function safeWriteWishlistDebounced(items) {
  if (!hasWindow) return;
  // debounce to avoid spamming localStorage on rapid updates
  try {
    if (writeTimeout) clearTimeout(writeTimeout);
    writeTimeout = setTimeout(() => {
      try {
        window.localStorage.setItem(GUEST_KEY, JSON.stringify(normalizeList(items)));
      } catch (err) {
        console.error("[Wishlist] safeWriteWishlist write error:", err);
      } finally {
        writeTimeout = null;
      }
    }, 120); // 120ms debounce
  } catch (err) {
    console.error("[Wishlist] safeWriteWishlistDebounced error:", err);
  }
}

/* ---------------------- Wishlist Provider ---------------------- */
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const initializedRef = useRef(false); // true after first authoritative load
  const pendingRef = useRef([]); // queued actions while init not complete
  const isMountedRef = useRef(true);

  useEffect(() => {
    // mount/unmount tracking to prevent state updates after unmount
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (writeTimeout) {
        clearTimeout(writeTimeout);
        writeTimeout = null;
      }
    };
  }, []);




  // Helper to drain pending actions and apply them via callback (sync or async)
  // Returns a Promise that resolves when callback finishes or rejects on error
  function applyPending(callback) {
    const actions = pendingRef.current.slice(); // copy
    pendingRef.current = []; // clear queue
    try {
      const res = callback(actions);
      if (res && typeof res.then === "function") {
        return res.catch((err) => {
          console.error("[Wishlist] applyPending async callback error:", err);
          // swallow to avoid unhandled, but return rejection so callers know
          throw err;
        });
      }
      return Promise.resolve(res);
    } catch (err) {
      console.error("[Wishlist] applyPending sync callback error:", err);
      return Promise.reject(err);
    }
  }

  // Load wishlist when auth state is resolved (or if storage shows we are already guest)
  useEffect(() => {
    let abort = false;
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;

    async function load() {
      // If auth not initialized, but localStorage shows ds_user === "null" (guest saved)
      // OR we already have a ds_wishlist in storage, load it now so UI isn't empty.
      if (user === undefined) {
        try {
          if (!hasWindow) {
            console.log("[Wishlist] no window - skipping early guest load");
            return;
          }
          const rawDsUser = window.localStorage.getItem("ds_user");
          const rawGuestWishlist = window.localStorage.getItem(GUEST_KEY);

          if ((rawDsUser === "null") || (rawGuestWishlist && rawGuestWishlist !== "[]")) {
            const items = safeReadWishlist();
            console.log("[Wishlist] (early) loading guest wishlist from localStorage because ds_user/raw storage says guest:", items);
            // Merge pending actions if any
            const pending = pendingRef.current.slice();
            if (pending.length > 0) {
              console.log("[Wishlist] merging pending actions into loaded guest wishlist (early):", pending);
              let current = items.slice();
              for (const a of pending) {
                const pid = normalizeId(a.productId);
                if (a.type === "add") {
                  if (!current.includes(pid)) current.push(pid);
                } else if (a.type === "remove") {
                  current = current.filter((id) => id !== pid);
                }
              }
              current = Array.from(new Set(current));
              safeWriteWishlistDebounced(current);
              pendingRef.current = [];
              if (isMountedRef.current) setWishlist(current);
              initializedRef.current = true;
              return;
            }

            if (isMountedRef.current) setWishlist(items);
            initializedRef.current = true;
            return;
          }
        } catch (err) {
          console.error("[Wishlist] early load check error:", err);
        }

        console.log("[Wishlist] auth initializing — skipping load");
        return;
      }

      // If auth explicitly indicates guest, load from storage normally
      if (user === null) {
        const items = safeReadWishlist();

        const pending = pendingRef.current.slice();
        if (pending.length > 0) {
          let current = items.slice();
          for (const a of pending) {
            const pid = normalizeId(a.productId);
            if (a.type === "add") {
              if (!current.includes(pid)) current.push(pid);
            } else if (a.type === "remove") {
              current = current.filter((id) => id !== pid);
            }
          }
          current = Array.from(new Set(current));
          safeWriteWishlistDebounced(current);
          pendingRef.current = [];
          if (isMountedRef.current) setWishlist(current);
          initializedRef.current = true;
          return;
        }

        if (isMountedRef.current) setWishlist(items);
        initializedRef.current = true;
        return;
      }

      // Logged in: fetch from server
      try {
        // prefer passing abort signal if your `api` supports axios: { signal: controller.signal }
        const axiosConfig = controller ? { signal: controller.signal } : {};
        const res = await api.get("/wishlist", axiosConfig);
        if (abort) return;
        const items = normalizeList(res?.data?.items || []);
        console.log("[Wishlist] loading logged-in wishlist from server:", items);
        if (isMountedRef.current) setWishlist(items);
        initializedRef.current = true;

        // replay pending actions to server
        await applyPending(async (actions) => {
          for (const a of actions) {
            const pid = normalizeId(a.productId);
            try {
              if (a.type === "add") {
                await api.post("/wishlist/wishadd", { productId: pid }, axiosConfig);
              } else if (a.type === "remove") {
                await api.post("/wishlist/wishremove", { productId: pid }, axiosConfig);
              }
            } catch (err) {
              console.error("[Wishlist] failed to replay action:", err);
            }
          }
          // refresh server state after replay
          try {
            const final = await api.get("/wishlist", axiosConfig);
            if (isMountedRef.current) setWishlist(normalizeList(final?.data?.items || []));
          } catch (err) {
            console.error("[Wishlist] failed to refresh server wishlist after replay:", err);
          }
        });
      } catch (err) {
        if (controller && err?.name === "CanceledError") {
          // aborted — do not fallback to guest behavior on intentional abort
          console.log("[Wishlist] fetch aborted");
          return;
        }
        console.error("[Wishlist] failed to fetch wishlist from server:", err);
        // treat as guest: apply pending actions locally
        let current = [];
        const pending = pendingRef.current.slice();
        pendingRef.current = [];
        for (const a of pending) {
          const pid = normalizeId(a.productId);
          if (a.type === "add") {
            if (!current.includes(pid)) current.push(pid);
          } else if (a.type === "remove") {
            current = current.filter((id) => id !== pid);
          }
        }
        current = Array.from(new Set(current));
        if (isMountedRef.current) setWishlist(current);
        safeWriteWishlistDebounced(current);
        initializedRef.current = true;
      }
    }

    load();

    return () => {
      abort = true;
      if (controller && typeof controller.abort === "function") controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Persist guest wishlist after initialization (only for explicit guest)
  useEffect(() => {
    if (!initializedRef.current) return;
    if (user !== null) return;
    safeWriteWishlistDebounced(wishlist);
  }, [wishlist, user]);

  // ----------------------------
  // Add to wishlist
  // ----------------------------
  const addToWishlist = useCallback(
    async (productId) => {
      if (!productId) return;
      const pid = normalizeId(productId);

      // If not initialized, optimistic update + queue + persist immediately if guest detected
      if (!initializedRef.current) {
        setWishlist((prev) => {
          const next = Array.from(new Set([...prev, pid]));
          console.log("[Wishlist] optimistic add ->", next);
          return next;
        });

        pendingRef.current.push({ type: "add", productId: pid });

        // If ds_guest exists, persist optimistic change immediately
        try {
          if (hasWindow) {
            const guestId = window.localStorage.getItem(GUEST_ID_KEY);
            if (guestId !== null) {
              const currentRaw = window.localStorage.getItem(GUEST_KEY);
              const arr = currentRaw ? normalizeList(JSON.parse(currentRaw)) : [];
              const merged = Array.from(new Set([...arr, pid]));
              safeWriteWishlistDebounced(merged);
              console.log("[Wishlist] optimistic add persisted immediately to localStorage:", merged);
            }
          }
        } catch (err) {
          console.error("[Wishlist] Failed to persist optimistic guest add:", err);
        }

        return;
      }

      // If initialized and guest
      if (user === null) {
        setWishlist((prev) => {
          const next = Array.from(new Set([...prev, pid]));
          safeWriteWishlistDebounced(next);
          console.log("[Wishlist] guest add ->", next);
          return next;
        });
        return;
      }

      // logged-in user: call server
      try {
        const res = await api.post("/wishlist/wishadd", { productId: pid });
        if (!isMountedRef.current) return;
        setWishlist(normalizeList(res.data.items || []));
      } catch (err) {
        console.error("[Wishlist] Add error (server):", err);
      }
    },
    [user]
  );

  // ----------------------------
  // Remove from wishlist
  // ----------------------------
  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId) return;
      const pid = normalizeId(productId);

      if (!initializedRef.current) {
        setWishlist((prev) => {
          const next = prev.filter((id) => id !== pid);
          console.log("[Wishlist] optimistic remove while initializing ->", next);
          return next;
        });

        pendingRef.current.push({ type: "remove", productId: pid });

        try {
          if (hasWindow) {
            const guestId = window.localStorage.getItem(GUEST_ID_KEY);
            if (guestId !== null) {
              const currentRaw = window.localStorage.getItem(GUEST_KEY);
              const arr = currentRaw ? normalizeList(JSON.parse(currentRaw)) : [];
              const merged = arr.filter((id) => id !== pid);
              safeWriteWishlistDebounced(merged);
              console.log("[Wishlist] optimistic remove persisted immediately to localStorage:", merged);
            }
          }
        } catch (err) {
          console.error("[Wishlist] Failed to persist optimistic guest remove:", err);
        }

        return;
      }

      if (user === null) {
        setWishlist((prev) => {
          const next = prev.filter((id) => id !== pid);
          safeWriteWishlistDebounced(next);
          console.log("[Wishlist] guest remove ->", next);
          return next;
        });
        return;
      }

      try {
        const res = await api.post("/wishlist/wishremove", { productId: pid });
        if (!isMountedRef.current) return;
        setWishlist(normalizeList(res.data.items || []));
      } catch (err) {
        console.error("[Wishlist] Remove error (server):", err);
      }
    },
    [user]
  );

  // ----------------------------
  // Toggle helper (accepts any id type)
  // ----------------------------
  const toggleWishlist = useCallback(
    (productId) => {
      if (!productId) return;
      const pid = normalizeId(productId);
      if (wishlist.includes(pid)) {
        removeFromWishlist(pid);
      } else {
        addToWishlist(pid);
      }
    },
    [wishlist, addToWishlist, removeFromWishlist]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
