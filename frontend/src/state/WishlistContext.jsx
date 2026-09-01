// src/state/WishlistContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  useAddWishlistMutation,
  useGetWishlistQuery,
  useRemoveWishlistMutation,
  useSyncWishlistMutation,
} from "@/store/api";

import { useAuth } from "./AuthContext";
import { toast } from "react-hot-toast";

const WishlistContext = createContext(null);

const LS_KEY = "wishlist";

/* =====================================================
   LOCAL STORAGE
===================================================== */

const readLocal = () => {
  try {
    const value = localStorage.getItem(LS_KEY);
    const parsed = value ? JSON.parse(value) : [];

    return Array.isArray(parsed)
      ? [...new Set(parsed.map(String))]
      : [];
  } catch {
    return [];
  }
};

const writeLocal = (items) => {
  localStorage.setItem(
    LS_KEY,
    JSON.stringify([...new Set(items.map(String))])
  );
};

/* =====================================================
   PROVIDER
===================================================== */

export const WishlistProvider = ({ children }) => {
  const { user, guestId } = useAuth();

  const isGuest = !user;

  /* =====================================================
     GUEST STATE
  ===================================================== */

  const [guestWishlist, setGuestWishlist] = useState(
    () => readLocal()
  );

  /* =====================================================
     SERVER WISHLIST
  ===================================================== */

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetWishlistQuery(undefined, {
    skip: !user && !guestId,
  });

  /* =====================================================
     MUTATIONS
  ===================================================== */

  const [addWishlist, { isLoading: isAdding }] =
    useAddWishlistMutation();

  const [removeWishlist, { isLoading: isRemoving }] =
    useRemoveWishlistMutation();

  const [syncWishlist, { isLoading: isSyncing }] =
    useSyncWishlistMutation();

  /* =====================================================
     SERVER WISHLIST
  ===================================================== */

  const serverWishlist = Array.isArray(data?.items)
    ? [
        ...new Set(
          data.items
            .map((item) => {
              if (typeof item === "string") {
                return item;
              }

              return (
                item?.publicId ??
                item?.product?.publicId ??
                item?.productId ??
                null
              );
            })
            .filter(Boolean)
            .map(String)
        ),
      ]
    : [];

  /* =====================================================
     UI WISHLIST
  ===================================================== */

  const wishlist = isGuest
    ? guestWishlist
    : serverWishlist;

  /* =====================================================
     REFRESH GUEST STATE
  ===================================================== */

  useEffect(() => {
    if (!isGuest) return;

    setGuestWishlist(readLocal());
  }, [isGuest, guestId]);

  /* =====================================================
     GUEST -> USER SYNC
  ===================================================== */

  useEffect(() => {
    if (!user || !guestId) return;

    let cancelled = false;

    const sync = async () => {
      try {
        const local = readLocal();

        const result = await syncWishlist({
          items: local,
        }).unwrap();

        if (cancelled) return;

        localStorage.removeItem(LS_KEY);
        setGuestWishlist([]);

        /*
         * syncWishlist invalidates the Wishlist LIST tag,
         * so RTK Query will refresh the wishlist automatically.
         *
         * No manual refetch here.
         */

        if (local.length || result?.items?.length) {
          toast.success(
            "Wishlist synced successfully"
          );
        }
      } catch (error) {
        if (cancelled) return;

        console.error(
          "WISHLIST SYNC ERROR:",
          error
        );

        toast.error(
          error?.data?.message ||
            error?.error ||
            "Failed to sync wishlist"
        );
      }
    };

    sync();

    return () => {
      cancelled = true;
    };
  }, [
    user,
    guestId,
    syncWishlist,
  ]);

  /* =====================================================
     ADD
     
     Guest:
       React state
       localStorage
       Guest DB

     User:
       User DB
       RTK cache invalidation
  ===================================================== */

  const addToWishlist = useCallback(
    async (id) => {
      if (!id) return;

      const publicId = String(id);

      /* =========================
         GUEST
      ========================= */

      if (isGuest) {
        const current = readLocal();

        if (current.includes(publicId)) {
          toast("Already in your wishlist");
          return;
        }

        const next = [
          ...current,
          publicId,
        ];

        /*
         * Optimistic local UI
         */
        setGuestWishlist(next);
        writeLocal(next);

        try {
          /*
           * DB:
           * Guest.wishlist
           *
           * x-guest-id is automatically sent
           * by the Axios interceptor.
           */
          await addWishlist({
            productId: publicId,
          }).unwrap();

          toast.success(
            "Added to wishlist ❤️"
          );
        } catch (error) {
          /*
           * Rollback local state if DB fails.
           */
          setGuestWishlist(current);
          writeLocal(current);

          console.error(
            "GUEST ADD WISHLIST ERROR:",
            error
          );

          toast.error(
            error?.data?.message ||
              error?.error ||
              "Failed to add to wishlist"
          );
        }

        return;
      }

      /* =========================
         LOGGED USER
      ========================= */

      try {
        await addWishlist({
          productId: publicId,
        }).unwrap();

        /*
         * RTK Query invalidates LIST automatically.
         * Do NOT call refetch().
         */

        toast.success(
          "Added to wishlist ❤️"
        );
      } catch (error) {
        console.error(
          "USER ADD WISHLIST ERROR:",
          error
        );

        toast.error(
          error?.data?.message ||
            error?.error ||
            "Failed to add to wishlist"
        );
      }
    },
    [
      isGuest,
      addWishlist,
    ]
  );

  /* =====================================================
     REMOVE
  ===================================================== */

  const removeFromWishlist = useCallback(
    async (id) => {
      if (!id) return;

      const publicId = String(id);

      /* =========================
         GUEST
      ========================= */

      if (isGuest) {
        const current = readLocal();

        if (!current.includes(publicId)) {
          return;
        }

        const next = current.filter(
          (item) => item !== publicId
        );

        /*
         * Optimistic local UI
         */
        setGuestWishlist(next);
        writeLocal(next);

        try {
          /*
           * DB:
           * Guest.wishlist
           */
          await removeWishlist({
            productId: publicId,
          }).unwrap();

          toast.success(
            "Removed from wishlist"
          );
        } catch (error) {
          /*
           * Rollback if DB fails.
           */
          setGuestWishlist(current);
          writeLocal(current);

          console.error(
            "GUEST REMOVE WISHLIST ERROR:",
            error
          );

          toast.error(
            error?.data?.message ||
              error?.error ||
              "Failed to remove from wishlist"
          );
        }

        return;
      }

      /* =========================
         LOGGED USER
      ========================= */

      try {
        await removeWishlist({
          productId: publicId,
        }).unwrap();

        /*
         * RTK Query invalidates LIST automatically.
         * Do NOT call refetch().
         */

        toast.success(
          "Removed from wishlist"
        );
      } catch (error) {
        console.error(
          "USER REMOVE WISHLIST ERROR:",
          error
        );

        toast.error(
          error?.data?.message ||
            error?.error ||
            "Failed to remove from wishlist"
        );
      }
    },
    [
      isGuest,
      removeWishlist,
    ]
  );

  /* =====================================================
     CHECK
  ===================================================== */

  const isInWishlist = useCallback(
    (id) => {
      if (!id) return false;

      return wishlist.includes(
        String(id)
      );
    },
    [wishlist]
  );

  /* =====================================================
     CLEAR GUEST
  ===================================================== */

  const clearGuestWishlist = useCallback(
    () => {
      setGuestWishlist([]);
      localStorage.removeItem(LS_KEY);

      toast.success(
        "Wishlist cleared"
      );
    },
    []
  );

  /* =====================================================
     PROVIDER
  ===================================================== */

  return (
    <WishlistContext.Provider
      value={{
        wishlist,

        addToWishlist,

        removeFromWishlist,

        isInWishlist,

        clearGuestWishlist,

        loading:
          isLoading ||
          isFetching ||
          isAdding ||
          isRemoving ||
          isSyncing,

        isAdding,
        isRemoving,
        isSyncing,

        refetchWishlist: refetch,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

/* =====================================================
   HOOK
===================================================== */

export const useWishlist = () =>
  useContext(WishlistContext);