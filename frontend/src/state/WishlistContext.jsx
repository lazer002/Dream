import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../utils/config.jsx";
import { useAuth } from "./AuthContext.jsx"; // adjust path as needed

const WishlistContext = createContext();

const STORAGE_KEY = "ds_wishlist";      

export function WishlistProvider({ children }) {
  const { user } = useAuth(); // null if guest
  const [wishlist, setWishlist] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // persist guest wishlist to localStorage
  useEffect(() => {
    try {
      // only persist if user is not logged in; once logged in we rely on server
      if (!user) localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch {}
  }, [wishlist, user]);

  // Add item locally and optionally to server if logged in
  const addToWishlist = useCallback(async (productId) => {
    // optimistic local update
    setWishlist((prev) => (prev.includes(productId) ? prev : [...prev, productId]));

    if (user) {
      try {
        const { data } = await api.post("/wishlist/add", { productId });
        setWishlist(data.items || []);
      } catch (err) {
        console.error("Failed to add to server wishlist:", err);
        // optionally revert or refetch; here we simply refetch server state
        try {
          const { data } = await api.get("/wishlist");
          setWishlist(data.items || []);
        } catch {}
      }
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (productId) => {
    setWishlist((prev) => prev.filter((id) => id !== productId));

    if (user) {
      try {
        const { data } = await api.post("/wishlist/remove", { productId });
        setWishlist(data.items || []);
      } catch (err) {
        console.error("Failed to remove from server wishlist:", err);
        try {
          const { data } = await api.get("/wishlist");
          setWishlist(data.items || []);
        } catch {}
      }
    }
  }, [user]);

const toggleWishlist = useCallback(async (productId) => {
  const id = String(productId);
  if (wishlist.includes(id)) {
    return removeFromWishlist(id);
  } else {
    return addToWishlist(id);
  }
}, [wishlist, addToWishlist, removeFromWishlist]);


  // sync guest -> server (called when user logs in)
  const syncWishlistToUser = useCallback(async () => {
    const guest = (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();

    if (!user) return; // nothing to sync

    try {
      if (guest.length > 0) {
        // server will merge (union) and return the resulting list
        const { data } = await api.post("/wishlist/sync", { items: guest });
        setWishlist(data.items || []);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // if no guest list, just fetch server wishlist
      const { data } = await api.get("/wishlist");
      setWishlist(data.items || []);
    } catch (err) {
      console.error("Failed to sync wishlist:", err);
      // fallback: try to fetch server wishlist
      try {
        const { data } = await api.get("/wishlist");
        setWishlist(data.items || []);
      } catch {}
    }
  }, [user]);

  // When user becomes logged in, auto-sync
  useEffect(() => {
    if (user) {
      // don't await in effect directly: call and ignore result
      syncWishlistToUser();
    } else {
      // when logged out, populate from localStorage guest list
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setWishlist(raw ? JSON.parse(raw) : []);
      } catch {
        setWishlist([]);
      }
    }
  }, [user, syncWishlistToUser]);




  return (
    <WishlistContext.Provider value={{
      wishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      syncWishlistToUser,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
