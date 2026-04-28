import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import  api  from "../utils/config.js";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();
const LS_KEY = "wishlist";

export const WishlistProvider = ({ children }) => {
  const { user, guestId } = useAuth();

  const [wishlist, setWishlist] = useState([]);

  const isGuest = !user;

  /* ---------- LOCAL HELPERS ---------- */

  const readLocal = () => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY)) || [];
    } catch {
      return [];
    }
  };

  const writeLocal = (items) => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  };

  /* ---------- LOAD ---------- */

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get("/wishlist");
        setWishlist(data?.items || []);
      } catch {
        // fallback to local
        if (isGuest) {
          setWishlist(readLocal());
        }
      }
    };

    if (user || guestId) load();
  }, [user, guestId]);

  /* ---------- ADD ---------- */

  const addToWishlist = useCallback((id) => {
    if (!id) return;

    setWishlist((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];

      if (isGuest) writeLocal(next);

      return next;
    });

    api.post("/wishlist/wishadd", { productId: id }).catch(() => {
      setWishlist((prev) => prev.filter((i) => i !== id));
    });
  }, [isGuest]);

  /* ---------- REMOVE ---------- */

  const removeFromWishlist = useCallback((id) => {
    if (!id) return;

    setWishlist((prev) => {
      const next = prev.filter((i) => i !== id);

      if (isGuest) writeLocal(next);

      return next;
    });

    api.post("/wishlist/wishremove", { productId: id }).catch(() => {
      // fallback reload
    });
  }, [isGuest]);

  /* ---------- MERGE ON LOGIN ---------- */

  useEffect(() => {
    if (!user) return;

    const merge = async () => {
      const local = readLocal();
      if (!local.length) return;

      try {
        await api.post("/wishlist/sync", { items: local });

        localStorage.removeItem(LS_KEY);

        const { data } = await api.get("/wishlist");
        setWishlist(data?.items || []);
      } catch (e) {
        console.log("Merge error:", e);
      }
    };

    merge();
  }, [user]);

  /* ---------- CHECK ---------- */

  const isInWishlist = (id) => wishlist.includes(id);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);