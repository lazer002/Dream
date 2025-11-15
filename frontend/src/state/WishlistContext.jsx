import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../utils/config.jsx";
import { useAuth } from "./AuthContext.jsx";

const WishlistContext = createContext();
const GUEST_KEY = "ds_wishlist";  // guest storage key

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  // ------------------------------
  // Load wishlist on mount or login
  // ------------------------------
useEffect(() => {
  async function loadWishlist() {
    if (user === undefined) return;    // ⬅ WAIT until auth finishes

    if (!user) {
      // guest mode → read from localStorage
      try {
        const raw = localStorage.getItem("ds_wishlist");
        setWishlist(raw ? JSON.parse(raw) : []);
      } catch {
        setWishlist([]);
      }
      return;
    }

    // logged in → fetch from server
    try {
      const res = await api.get("/wishlist");
      setWishlist(res.data.items || []);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    }
  }

  loadWishlist();
}, [user]);


  // ------------------------------
  // Persist guest wishlist
  // ------------------------------
  useEffect(() => {
    if (!user) {
      localStorage.setItem(GUEST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  // ------------------------------
  // Add
  // ------------------------------
  const addToWishlist = useCallback(
    async (productId) => {
      if (!productId) return;

      if (!user) {
        // guest
        setWishlist((prev) => [...new Set([...prev, productId])]);
        return;
      }

      // logged in → server
      try {
        const res = await api.post("/wishlist/wishadd", { productId });
        setWishlist(res.data.items || []);
      } catch (err) {
        console.error("Add error:", err);
      }
    },
    [user]
  );

  // ------------------------------
  // Remove
  // ------------------------------
  const removeFromWishlist = useCallback(
    async (productId) => {
      if (!productId) return;

      if (!user) {
        // guest
        setWishlist((prev) => prev.filter((id) => id !== productId));
        return;
      }

      try {
        const res = await api.post("/wishlist/wishremove", { productId });
        setWishlist(res.data.items || []);
      } catch (err) {
        console.error("Remove error:", err);
      }
    },
    [user]
  );

  // ------------------------------
  // Toggle
  // ------------------------------
  const toggleWishlist = useCallback(
    (productId) => {
      if (wishlist.includes(productId)) {
        removeFromWishlist(productId);
      } else {
        addToWishlist(productId);
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
