// src/state/CartContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
} from "react";

import { toast } from "react-hot-toast";

import {
  useAddBundleToCartMutation,
  useAddCartItemMutation,
  useClearCartMutation,
  useGetCartQuery,
  useMergeCartMutation,
  useRemoveCartItemMutation,
  useUpdateCartItemMutation,
} from "@/store/api";

import { useAuth } from "./AuthContext.jsx";

const CartContext = createContext(null);

/* =========================================================
   GUEST ID
========================================================= */

const ensureGuestId = () => {
  let guestId = localStorage.getItem("ds_guest");

  if (!guestId) {
    guestId = crypto.randomUUID();

    localStorage.setItem(
      "ds_guest",
      guestId
    );
  }

  return guestId;
};

/* =========================================================
   PROVIDER
========================================================= */

export function CartProvider({ children }) {
  const { user, guestId } = useAuth();

  /* =======================================================
     ENSURE GUEST
  ======================================================= */

  useEffect(() => {
    ensureGuestId();
  }, []);

  /* =======================================================
     GET CART
  ======================================================= */

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetCartQuery(undefined, {
    skip: !user && !guestId,
  });

  const items = Array.isArray(data?.items)
    ? data.items
    : [];

  /* =======================================================
     MUTATIONS
  ======================================================= */
const [updatingItemId, setUpdatingItemId] =
  useState(null);

  const [
    addCartItem,
    { isLoading: isAdding },
  ] = useAddCartItemMutation();

  const [
    updateCartItem,
    { isLoading: isUpdating },
  ] = useUpdateCartItemMutation();

  const [
    removeCartItem,
    { isLoading: isRemoving },
  ] = useRemoveCartItemMutation();

  const [
    clearCartMutation,
    { isLoading: isClearing },
  ] = useClearCartMutation();

  const [
    mergeCartMutation,
    { isLoading: isMerging },
  ] = useMergeCartMutation();

  const [
    addBundleMutation,
    { isLoading: isAddingBundle },
  ] = useAddBundleToCartMutation();

  /* =======================================================
     HELPERS
  ======================================================= */

  const getProductPublicId = useCallback(
    (item) => {
      if (!item) return null;

      /*
       * Normal product
       */
      if (
        item.type === "product" &&
        item.publicId
      ) {
        return String(item.publicId);
      }

      /*
       * Bundle product
       */
      if (
        item.type === "bundle" &&
        Array.isArray(item.bundleProducts) &&
        item.bundleProducts.length
      ) {
        return (
          item.bundleProducts[0]?.publicId ||
          null
        );
      }

      return null;
    },
    []
  );

  const getCartItemId = useCallback(
    (item) => {
      return item?._id
        ? String(item._id)
        : null;
    },
    []
  );

  const isBundle = useCallback(
    (item) => {
      return item?.type === "bundle";
    },
    []
  );

  /* =======================================================
     REFRESH
  ======================================================= */

  const refresh = useCallback(
    async () => {
      return refetch();
    },
    [refetch]
  );

  /* =======================================================
     MERGE GUEST CART
  ======================================================= */

  const mergeGuestCart =
    useCallback(async () => {
      if (!user) return;

      const gid =
        guestId ||
        localStorage.getItem(
          "ds_guest"
        );

      if (!gid) return;

      try {
        await mergeCartMutation({
          guestId: gid,
        }).unwrap();

        await refetch();

        sessionStorage.setItem(
          "cart_merged",
          "true"
        );
      } catch (error) {
        console.error(
          "MERGE CART ERROR:",
          error
        );

        toast.error(
          error?.data?.error ||
            error?.data?.message ||
            "Failed to merge guest cart"
        );
      }
    }, [
      user,
      guestId,
      mergeCartMutation,
      refetch,
    ]);

  useEffect(() => {
    if (!user || !guestId) return;

    const alreadyMerged =
      sessionStorage.getItem(
        "cart_merged"
      );

    if (alreadyMerged) return;

    mergeGuestCart();
  }, [
    user,
    guestId,
    mergeGuestCart,
  ]);

  /* =======================================================
     ADD PRODUCT

     ALWAYS:
     publicId
  ======================================================= */

  const add = useCallback(
    async (
      publicId,
      size,
      quantity = 1
    ) => {
      if (!publicId) {
        toast.error(
          "Product publicId is required"
        );
        return;
      }

      if (!size) {
        toast.error(
          "Please select a size!"
        );
        return;
      }

      try {
        await addCartItem({
          publicId: String(publicId),
          size: String(size),
          quantity: Number(quantity),
        }).unwrap();

        await refetch();

        toast.success(
          "Added to cart"
        );
      } catch (error) {
        console.error(
          "ADD CART ERROR:",
          error
        );

        toast.error(
          error?.data?.error ||
            error?.data?.message ||
            error?.error ||
            "Failed to add item"
        );

        await refetch();
      }
    },
    [
      addCartItem,
      refetch,
    ]
  );

  /* =======================================================
     UPDATE

     PRODUCT:
       publicId + size

     BUNDLE:
       cartItemId
  ======================================================= */


const update = useCallback(
  async (
    id,
    quantity,
    size = null,
    bundle = false
  ) => {
    if (!id) return;

    const nextQuantity =
      Number(quantity);

    if (
      !Number.isFinite(nextQuantity) ||
      nextQuantity < 1
    ) {
      return;
    }

    const loadingId = bundle
      ? `bundle-${id}`
      : `product-${id}-${size}`;

    setUpdatingItemId(loadingId);

    try {
      await updateCartItem({
        isBundle: bundle,

        ...(bundle
          ? {
              cartItemId: String(id),
            }
          : {
              publicId: String(id),
              size: size
                ? String(size)
                : undefined,
            }),

        quantity: nextQuantity,
      }).unwrap();
    } catch (error) {
      console.error(
        "UPDATE CART ERROR:",
        error
      );

      toast.error(
        error?.data?.error ||
          error?.data?.message ||
          "Failed to update cart"
      );
    } finally {
      setUpdatingItemId(null);
    }
  },
  [updateCartItem]
);
  /* =======================================================
     REMOVE

     PRODUCT:
       publicId + size

     BUNDLE:
       cartItemId
  ======================================================= */

  const remove = useCallback(
    async (
      id,
      size,
      bundle = false
    ) => {
      if (!id) {
        return;
      }

      try {
        if (bundle) {
          await removeCartItem({
            cartItemId: String(id),
          }).unwrap();
        } else {
          await removeCartItem({
            publicId: String(id),
            size: size
              ? String(size)
              : undefined,
          }).unwrap();
        }

        await refetch();

        toast.success(
          bundle
            ? "Bundle removed from cart"
            : "Product removed from cart"
        );
      } catch (error) {
        console.error(
          "REMOVE CART ERROR:",
          error
        );

        toast.error(
          error?.data?.error ||
            error?.data?.message ||
            error?.error ||
            "Failed to remove item"
        );

        await refetch();
      }
    },
    [
      removeCartItem,
      refetch,
    ]
  );

  /* =======================================================
     CLEAR
  ======================================================= */

  const clearCart =
    useCallback(async () => {
      try {
        await clearCartMutation()
          .unwrap();

        await refetch();

        toast.success(
          "Cart cleared"
        );
      } catch (error) {
        console.error(
          "CLEAR CART ERROR:",
          error
        );

        toast.error(
          error?.data?.error ||
            error?.data?.message ||
            "Failed to clear cart"
        );

        await refetch();
      }
    }, [
      clearCartMutation,
      refetch,
    ]);

  /* =======================================================
     ADD BUNDLE

     BOTH CUSTOM + PREBUILT USE:

     {
       isCustomBundle: true/false,
       bundle: {...},
       bundleProducts: [...]
     }

     Products ALWAYS use publicId.
  ======================================================= */

  const addBundleToCart =
    useCallback(
      async (
        bundle,
        selectedSizes
      ) => {
        if (
          !bundle?.products?.length
        ) {
          toast.error(
            "Bundle has no products"
          );
          return;
        }

        const isCustomBundle =
          Boolean(
            bundle.custom
          );

        const bundleProducts =
          [];

        for (
          const product of
            bundle.products
        ) {
          const publicId =
            product?.publicId;

          if (!publicId) {
            toast.error(
              `Missing publicId for ${
                product?.title ||
                "product"
              }`
            );
            return;
          }

          /*
           * Prefer publicId as the
           * selectedSizes key.
           *
           * _id fallback is kept only
           * for old UI state.
           */
          const size =
            selectedSizes?.[
              publicId
            ] ??
            selectedSizes?.[
              product?._id
            ];

          if (!size) {
            toast.error(
              `Please select size for ${
                product.title ||
                "product"
              }`
            );
            return;
          }

          bundleProducts.push({
            publicId:
              String(publicId),

            size:
              String(size),

            quantity: 1,
          });
        }

        /* =================================================
           SAME BUNDLE STRUCTURE
        ================================================= */

        const payload = {
          isCustomBundle,

          bundle: {
            publicId:
              isCustomBundle
                ? null
                : String(
                    bundle.publicId ||
                      ""
                  ),

            title:
              bundle.title ||
              (isCustomBundle
                ? "Custom Bundle"
                : null),

            price:
              Number(
                bundle.price || 0
              ),

            mainImage:
              bundle.mainImage ||
              bundle.mainImages?.[0] ||
              bundle.images?.[0] ||
              bundle.products?.[0]
                ?.images?.[0] ||
              null,
          },

          bundleProducts,
        };

        /*
         * Custom bundle MUST NOT
         * send a fake bundle publicId.
         */
        if (isCustomBundle) {
          payload.bundle.publicId =
            null;
        }

        /*
         * Prebuilt bundle MUST
         * have publicId.
         */
        if (
          !isCustomBundle &&
          !payload.bundle.publicId
        ) {
          toast.error(
            "Bundle publicId is required"
          );
          return;
        }

        try {
          await addBundleMutation(
            payload
          ).unwrap();

          await refetch();

          toast.success(
            "Bundle added to cart!"
          );
        } catch (error) {
          console.error(
            "ADD BUNDLE ERROR:",
            error
          );

          toast.error(
            error?.data?.error ||
              error?.data?.message ||
              error?.error ||
              "Failed to add bundle"
          );

          await refetch();
        }
      },
      [
        addBundleMutation,
        refetch,
      ]
    );

  /* =======================================================
     VALUE
  ======================================================= */

  const value = {
    items,

    loading:
      isLoading ||
      isFetching ||
      isAdding ||
      isRemoving ||
      isClearing ||
      isMerging ||
      isAddingBundle,

    isLoading,
    isFetching,
    isAdding,
    isUpdating,
    isRemoving,
    isClearing,
    isMerging,
    isAddingBundle,

 updatingItemId,


    add,
    update,
    remove,

    refresh,
    mergeGuestCart,
    addBundleToCart,
    clearCart,

    getProductPublicId,
    getCartItemId,
    isBundle,
  };

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useCart() {
  return useContext(
    CartContext
  );
}