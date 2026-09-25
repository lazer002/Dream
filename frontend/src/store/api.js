// store/api.js

import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

const getGuestId = () => {
  let guestId =
    localStorage.getItem("ds_guest");

  if (!guestId) {
    guestId = crypto.randomUUID();

    localStorage.setItem(
      "ds_guest",
      guestId
    );
  }

  return guestId;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  credentials: "include",

  prepareHeaders: (headers) => {
    const token =
      localStorage.getItem("ds_access");

    const guestId = getGuestId();

    if (guestId) {
      headers.set(
        "x-guest-id",
        guestId
      );
    }

    if (token) {
      headers.set(
        "Authorization",
        `Bearer ${token}`
      );
    }

    return headers;
  },
});

let refreshPromise = null;

const baseQueryWithReauth = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(
    args,
    api,
    extraOptions
  );

  if (result?.error?.status !== 401) {
    return result;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshResult =
          await rawBaseQuery(
            {
              url: "/auth/refresh",
              method: "POST",
            },
            api,
            extraOptions
          );

        if (
          refreshResult?.data?.accessToken
        ) {
          localStorage.setItem(
            "ds_access",
            refreshResult.data.accessToken
          );

          return refreshResult.data.accessToken;
        }

        throw new Error(
          "Refresh token failed"
        );
      } finally {
        refreshPromise = null;
      }
    })();
  }

  try {
    const newToken =
      await refreshPromise;

    if (!newToken) {
      throw new Error(
        "No access token returned"
      );
    }

    result = await rawBaseQuery(
      args,
      api,
      extraOptions
    );

    return result;
  } catch (error) {
    localStorage.removeItem(
      "ds_access"
    );

    api.dispatch(
      api.util.resetApiState()
    );

    window.location.href = "/login";

    return {
      error: {
        status: 401,
        data: {
          message:
            "Session expired",
        },
      },
    };
  }
};

export const api = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithReauth,

  tagTypes: [
    "Categories",
    "Products",
    "Bundles",
    "Cart",
    "Wishlist",
    "User",
     "Orders",
  "Addresses",
   "Inventory",
   "AdminStats",
    "Returns",
  ],

  keepUnusedDataFor: 300,

  refetchOnFocus: false,
  refetchOnReconnect: true,

  endpoints: (builder) => ({
    /* =====================================================
       CATEGORIES
    ===================================================== */

    getCategories: builder.query({
      query: () => "/categories",

      transformResponse: (response) => {
        return Array.isArray(
          response?.categories
        )
          ? response.categories
          : Array.isArray(response)
            ? response
            : [];
      },

      providesTags: (result) =>
        result
          ? [
              ...result.map(
                (category) => ({
                  type: "Categories",
                  id:
                    category.publicId ||
                    category._id,
                })
              ),
              {
                type: "Categories",
                id: "LIST",
              },
            ]
          : [
              {
                type: "Categories",
                id: "LIST",
              },
            ],
    }),

    /* =====================================================
       PRODUCTS
    ===================================================== */

    getProducts: builder.query({
      query: (params = {}) => ({
        url: "/products",
        params,
      }),

      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(
                (product) => ({
                  type: "Products",
                  id:
                    product.publicId ||
                    product._id,
                })
              ),
              {
                type: "Products",
                id: "LIST",
              },
            ]
          : [
              {
                type: "Products",
                id: "LIST",
              },
            ],
    }),

    getProduct: builder.query({
      query: (publicId) =>
        `/products/${publicId}`,

      providesTags: (
        result,
        error,
        publicId
      ) => [
        {
          type: "Products",
          id: publicId,
        },
      ],
    }),



getProductsByIds: builder.query({
  query: (ids) => ({
    url: "/products/by-ids",
    params: {
      ids: Array.isArray(ids)
        ? ids.map(String).join(",")
        : String(ids || ""),
    },
  }),

  providesTags: (result) =>
    Array.isArray(result?.items)
      ? result.items.map((product) => ({
          type: "Products",
          id: String(
            product?.publicId ||
              product?._id
          ),
        }))
      : [],
}),


    getRelatedProducts: builder.query({
      query: ({
        type = "product",
        publicId,
      }) => ({
        url:
          type === "bundle"
            ? `/bundles/${publicId}/related`
            : `/products/${publicId}/related`,
      }),

      providesTags: (
        result,
        error,
        { type, publicId }
      ) => [
        {
          type:
            type === "bundle"
              ? "Bundles"
              : "Products",
          id: `RELATED-${publicId}`,
        },
      ],
    }),

    /* =====================================================
       BUNDLES
    ===================================================== */

    getBundles: builder.query({
      query: (params = {}) => ({
        url: "/bundles",
        params,
      }),

      providesTags: (result) =>
        result?.items
          ? [
              ...result.items.map(
                (bundle) => ({
                  type: "Bundles",
                  id:
                    bundle.publicId ||
                    bundle._id,
                })
              ),
              {
                type: "Bundles",
                id: "LIST",
              },
            ]
          : [
              {
                type: "Bundles",
                id: "LIST",
              },
            ],
    }),

    getBundle: builder.query({
      query: (publicId) =>
        `/bundles/${publicId}`,

      providesTags: (
        result,
        error,
        publicId
      ) => [
        {
          type: "Bundles",
          id: publicId,
        },
      ],
    }),

    getRelatedBundles: builder.query({
      query: (publicId) =>
        `/bundles/${publicId}/related`,

      providesTags: (
        result,
        error,
        publicId
      ) => [
        {
          type: "Bundles",
          id: `RELATED-${publicId}`,
        },
      ],
    }),

    /* =====================================================
       AUTH
    ===================================================== */

    getMe: builder.query({
      query: () => "/auth/me",

      providesTags: ["User"],
    }),

    login: builder.mutation({
      query: ({
        email,
        password,
      }) => ({
        url: "/auth/login",
        method: "POST",
        body: {
          email,
          password,
        },
      }),

      invalidatesTags: [
        "User",
        "Wishlist",
        "Cart",
      ],
    }),

    register: builder.mutation({
      query: ({
        name,
        email,
        password,
      }) => ({
        url: "/auth/register",
        method: "POST",
        body: {
          name,
          email,
          password,
        },
      }),

      invalidatesTags: [
        "User",
        "Wishlist",
        "Cart",
      ],
    }),

    googleLogin: builder.mutation({
      query: ({ token }) => ({
        url: "/auth/google",
        method: "POST",
        body: {
          token,
        },
      }),

      invalidatesTags: [
        "User",
        "Wishlist",
        "Cart",
      ],
    }),

    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "POST",
      }),
    }),

    /* =====================================================
       CART
    ===================================================== */

    getCart: builder.query({
      query: () => "/cart/",

      providesTags: [
        {
          type: "Cart",
          id: "LIST",
        },
      ],
    }),

    addCartItem: builder.mutation({
      query: ({
        publicId,
        size,
        quantity = 1,
      }) => ({
        url: "/cart/add",
        method: "POST",
        body: {
          publicId,
          size,
          quantity,
        },
      }),

      invalidatesTags: [
        {
          type: "Cart",
          id: "LIST",
        },
        "Products",
      ],
    }),

updateCartItem: builder.mutation({
  query: ({
    publicId,
    size,
    quantity,
    isBundle,
    cartItemId,
  }) => ({
    url: isBundle
      ? "/cart/updatebundle"
      : "/cart/update",
    method: "POST",
    body: isBundle
      ? {
          cartItemId,
          quantity: Number(quantity),
        }
      : {
          publicId: String(publicId),
          size: String(size),
          quantity: Number(quantity),
        },
  }),

  async onQueryStarted(
    args,
    { dispatch, queryFulfilled }
  ) {
    const patchResult =
      dispatch(
        api.util.updateQueryData(
          "getCart",
          undefined,
          (draft) => {
            if (!draft?.items) return;

            const item =
              draft.items.find((item) =>
                args.isBundle
                  ? String(item._id) ===
                    String(args.cartItemId)
                  : String(item.publicId) ===
                      String(args.publicId) &&
                    String(item.size) ===
                      String(args.size)
              );

            if (item) {
              item.quantity =
                Number(args.quantity);
            }
          }
        )
      );

    try {
      await queryFulfilled;
    } catch {
      patchResult.undo();
    }
  },
}),

    removeCartItem: builder.mutation({
      query: ({
        cartItemId,
        publicId,
        size,
      }) => ({
        url: "/cart/remove",
        method: "POST",
        body: {
          cartItemId,
          publicId,
          size,
        },
      }),

      invalidatesTags: [
        {
          type: "Cart",
          id: "LIST",
        },
      ],
    }),

    clearCart: builder.mutation({
      query: () => ({
        url: "/cart/clear",
        method: "POST",
      }),

      invalidatesTags: [
        {
          type: "Cart",
          id: "LIST",
        },
      ],
    }),

    mergeCart: builder.mutation({
      query: ({ guestId }) => ({
        url: "/cart/merge",
        method: "POST",
        body: {
          guestId,
        },
      }),

      invalidatesTags: [
        {
          type: "Cart",
          id: "LIST",
        },
      ],
    }),

    addBundleToCart:
      builder.mutation({
        query: (body) => ({
          url: "/cart/addbundle",
          method: "POST",
          body,
        }),

        invalidatesTags: [
          {
            type: "Cart",
            id: "LIST",
          },
          "Products",
          "Bundles",
        ],
      }),

    /* =====================================================
       WISHLIST
    ===================================================== */

    getWishlist: builder.query({
      query: () => "/wishlist",

      transformResponse: (response) => ({
        items: Array.isArray(
          response?.items
        )
          ? response.items
              .map((item) => {
                if (
                  typeof item ===
                  "string"
                ) {
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
          : [],
      }),

      providesTags: (result) => {
        const items =
          Array.isArray(result?.items)
            ? result.items
            : [];

        return [
          ...items.map((id) => ({
            type: "Wishlist",
            id: String(id),
          })),

          {
            type: "Wishlist",
            id: "LIST",
          },
        ];
      },
    }),

    /* =====================================================
       ADD WISHLIST
    ===================================================== */

    addWishlist: builder.mutation({
      query: ({ productId }) => ({
        url: "/wishlist/wishadd",
        method: "POST",

        body: {
          productId: String(productId),
        },
      }),

      async onQueryStarted(
        { productId },
        { dispatch, queryFulfilled }
      ) {
        const id =
          String(productId);

        const patch =
          dispatch(
            api.util.updateQueryData(
              "getWishlist",
              undefined,
              (draft) => {
                if (
                  !draft ||
                  !Array.isArray(
                    draft.items
                  )
                ) {
                  return;
                }

                if (
                  !draft.items.includes(id)
                ) {
                  draft.items.push(id);
                }
              }
            )
          );

        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },

      invalidatesTags: [
        {
          type: "Wishlist",
          id: "LIST",
        },
      ],
    }),

    /* =====================================================
       REMOVE WISHLIST
    ===================================================== */

    removeWishlist:
      builder.mutation({
        query: ({ productId }) => ({
          url: "/wishlist/wishremove",
          method: "POST",

          body: {
            productId: String(productId),
          },
        }),

        async onQueryStarted(
          { productId },
          { dispatch, queryFulfilled }
        ) {
          const id =
            String(productId);

          const patch =
            dispatch(
              api.util.updateQueryData(
                "getWishlist",
                undefined,
                (draft) => {
                  if (
                    !draft ||
                    !Array.isArray(
                      draft.items
                    )
                  ) {
                    return;
                  }

                  draft.items =
                    draft.items.filter(
                      (item) =>
                        String(item) !==
                        id
                    );
                }
              )
            );

          try {
            await queryFulfilled;
          } catch {
            patch.undo();
          }
        },

        invalidatesTags: [
          {
            type: "Wishlist",
            id: "LIST",
          },
        ],
      }),

    /* =====================================================
       SYNC WISHLIST
    ===================================================== */

    syncWishlist:
      builder.mutation({
        query: ({ items }) => ({
          url: "/wishlist/sync",
          method: "POST",

          body: {
            items: Array.isArray(
              items
            )
              ? items.map(String)
              : [],
          },
        }),

        async onQueryStarted(
          _args,
          { dispatch, queryFulfilled }
        ) {
          try {
            const { data } =
              await queryFulfilled;

            dispatch(
              api.util.updateQueryData(
                "getWishlist",
                undefined,
                (draft) => {
                  draft.items =
                    Array.isArray(
                      data?.items
                    )
                      ? data.items.map(
                          String
                        )
                      : [];
                }
              )
            );
          } catch {
            // Keep previous cache.
          }
        },

        invalidatesTags: [
          {
            type: "Wishlist",
            id: "LIST",
          },
          "User",
        ],
      }),

trackOrder: builder.query({
  query: ({ orderNumber, email }) => ({
    url: "/orders/track",
    params: {
      orderNumber,
      ...(email ? { email } : {}),
    },
  }),

  providesTags: (result, error, { orderNumber }) => [
    {
      type: "Orders",
      id: `TRACK-${orderNumber}`,
    },
  ],
}),



orders: builder.query({
  query: () => "/orders/mine",

  providesTags: (result) => [
    {
      type: "Orders",
      id: "LIST",
    },
    ...(Array.isArray(result?.orders)
      ? result.orders.map((order) => ({
          type: "Orders",
          id: String(order._id || order.id),
        }))
      : []),
  ],
}),

cancelOrder: builder.mutation({
  query: (orderId) => ({
    url: "/orders/cancel",
    method: "PUT",
    body: {
      orderId,
    },
  }),

  invalidatesTags: [
    {
      type: "Orders",
      id: "LIST",
    },
    "Cart",
  ],
}),

addresses: builder.query({
  query: () => "/address",
  providesTags: (result) => [
    {
      type: "Addresses",
      id: "LIST",
    },
    ...(Array.isArray(result?.addresses)
      ? result.addresses.map((address) => ({
          type: "Addresses",
          id: String(address._id),
        }))
      : []),
  ],
}),

addAddress: builder.mutation({
  query: (body) => ({
    url: "/address",
    method: "POST",
    body,
  }),

  invalidatesTags: [
    {
      type: "Addresses",
      id: "LIST",
    },
  ],
}),

updateAddress: builder.mutation({
  query: ({ id, ...body }) => ({
    url: `/address/${id}`,
    method: "PUT",
    body,
  }),

  invalidatesTags: [
    {
      type: "Addresses",
      id: "LIST",
    },
  ],
}),

deleteAddress: builder.mutation({
  query: (id) => ({
    url: `/address/${id}`,
    method: "DELETE",
  }),

  invalidatesTags: [
    {
      type: "Addresses",
      id: "LIST",
    },
  ],
}),

/* =====================================================
   INVENTORY
===================================================== */

getInventory: builder.query({
  query: () => "/inventory",

  transformResponse: (response) => {
    return Array.isArray(response?.items)
      ? response.items
      : [];
  },

  providesTags: (result) => [
    ...(Array.isArray(result)
      ? result.map((inventory) => ({
          type: "Inventory",
          id: String(inventory._id),
        }))
      : []),

    {
      type: "Inventory",
      id: "LIST",
    },
  ],
}),

getInventoryById: builder.query({
  query: (id) => `/inventory/${id}`,

  providesTags: (result, error, id) => [
    {
      type: "Inventory",
      id: String(id),
    },
  ],
}),

getInventoryByProduct: builder.query({
  query: (productId) =>
    `/inventory/product/${productId}`,

  providesTags: (result, error, productId) => [
    {
      type: "Inventory",
      id: `PRODUCT-${productId}`,
    },
  ],
}),

createInventory: builder.mutation({
  query: (body) => ({
    url: "/inventory",
    method: "POST",
    body,
  }),

  invalidatesTags: [
    {
      type: "Inventory",
      id: "LIST",
    },
    "Products",
  ],
}),

updateInventory: builder.mutation({
  query: ({ id, ...body }) => ({
    url: `/inventory/${id}`,
    method: "PUT",
    body,
  }),

  invalidatesTags: (result, error, { id }) => [
    {
      type: "Inventory",
      id: String(id),
    },
    {
      type: "Inventory",
      id: "LIST",
    },
    "Products",
  ],
}),

updateProductInventory: builder.mutation({
  query: ({ productId, ...body }) => ({
    url: `/inventory/product/${productId}`,
    method: "PUT",
    body,
  }),

  invalidatesTags: (result, error, { productId }) => [
    {
      type: "Inventory",
      id: `PRODUCT-${productId}`,
    },
    {
      type: "Inventory",
      id: "LIST",
    },
    "Products",
  ],
}),

deleteInventory: builder.mutation({
  query: (id) => ({
    url: `/inventory/${id}`,
    method: "DELETE",
  }),

  invalidatesTags: [
    {
      type: "Inventory",
      id: "LIST",
    },
    "Products",
  ],
}),


// =====================================================
// ADMIN PRODUCTS
// =====================================================
// ADMIN STATS
getAdminStats: builder.query({
  query: (range = 30) => ({
    url: "/admin/stats",
    method: "GET",
    params: { range },
  }),
  providesTags: ["AdminStats"],
}),

// ADMIN ORDERS
getAdminOrders: builder.query({
  query: ({
    search = "",
    status = "",
    source = "",
    page = 1,
    limit = 20,
    sort = "newest",
  } = {}) => ({
    url: "/admin/orders",
    method: "GET",
    params: {
      ...(search && { search }),
      ...(status && { status }),
      ...(source && { source }),
      page,
      limit,
      sort,
    },
  }),
  providesTags: ["Orders"],
}),

// ADMIN PRODUCTS


getAdminProducts: builder.query({
  query: () => "/admin/products",

  transformResponse: (response) => {
    if (Array.isArray(response)) return response;

    return (
      response?.products ||
      response?.items ||
      response?.data ||
      []
    );
  },

  providesTags: (result) => [
    ...(Array.isArray(result)
      ? result.map((product) => ({
          type: "Products",
          id: String(
            product.publicId ||
              product._id
          ),
        }))
      : []),
    {
      type: "Products",
      id: "LIST",
    },
  ],
}),


updateAdminProduct: builder.mutation({
  query: ({ id, data }) => ({
    url: `/admin/products/${id}`,
    method: "PUT",
    body: data,
  }),
  invalidatesTags: [
    "Products",
    "Inventory",
    "AdminStats",
  ],
}),

deleteAdminProduct: builder.mutation({
  query: (id) => ({
    url: `/admin/products/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: [
    "Products",
    "Inventory",
    "AdminStats",
  ],
}),
createAdminProduct: builder.mutation({
  query: (body) => ({
    url: "/admin/products",
    method: "POST",
    body,
  }),
  invalidatesTags: [
    "Products",
    "Inventory",
    "AdminStats",
  ],
}),

getAdminProductById: builder.query({
  query: (publicId) => `/admin/products/${publicId}`,

  transformResponse: (response) =>
    response?.product ||
    response?.data ||
    response ||
    null,

  providesTags: (result, error, publicId) => [
    {
      type: "Products",
      id: String(publicId),
    },
  ],
}),

deleteAdminProductImage: builder.mutation({
  query: ({ id, image }) => ({
    url: `/admin/products/${id}/images`,
    method: "DELETE",
    body: { image },
  }),

  invalidatesTags: (result, error, { id }) => [
    {
      type: "Products",
      id: String(id),
    },
    {
      type: "Products",
      id: "LIST",
    },
  ],
}),

uploadAdminImages: builder.mutation({
  query: (formData) => ({
    url: "/admin/upload/images",
    method: "POST",
    body: formData,
  }),
}),
createBundle: builder.mutation({
  query: (body) => ({
    url: "/bundles",
    method: "POST",
    body,
  }),
  invalidatesTags: [
    "Bundles",
    "Products",
    "AdminStats",
  ],
}),


getUsers: builder.query({
  query: () => "/admin",
  transformResponse: (response) => {
    if (Array.isArray(response)) return response;

    return (
      response?.items ||
      response?.users ||
      response?.data ||
      []
    );
  },
  providesTags: (result) => [
    ...(Array.isArray(result)
      ? result.map((user) => ({
          type: "User",
          id: String(user._id),
        }))
      : []),
    { type: "User", id: "LIST" },
  ],
}),

updateUserRole: builder.mutation({
  query: ({ id, role }) => ({
    url: `/admin/${id}`,
    method: "PATCH",
    body: { role },
  }),
  invalidatesTags: (result, error, { id }) => [
    { type: "User", id: String(id) },
    { type: "User", id: "LIST" },
  ],
}),

deleteUser: builder.mutation({
  query: (id) => ({
    url: `/admin/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: [
    { type: "User", id: "LIST" },
    "AdminStats",
  ],
}),

//======================================================
// admin categories
// ======================================================
getAdminCategories: builder.query({
  query: () => "/admin/getCategory",
  transformResponse: (response) => {
    return Array.isArray(response?.categories)
      ? response.categories
      : [];
  },
  providesTags: (result) => [
    ...(Array.isArray(result)
      ? result.map((category) => ({
          type: "Categories",
          id: String(category._id),
        }))
      : []),
    {
      type: "Categories",
      id: "LIST",
    },
  ],
}),

createCategory: builder.mutation({
  query: (body) => ({
    url: "/admin/createCategory",
    method: "POST",
    body,
  }),
  invalidatesTags: [
    {
      type: "Categories",
      id: "LIST",
    },
    "Categories",
    "Products",
    "AdminStats",
  ],
}),

updateCategory: builder.mutation({
  query: ({ id, data }) => ({
    url: `/admin/category/${id}`,
    method: "PUT",
    body: data,
  }),
  invalidatesTags: (result, error, { id }) => [
    {
      type: "Categories",
      id: String(id),
    },
    {
      type: "Categories",
      id: "LIST",
    },
    "Categories",
    "Products",
    "AdminStats",
  ],
}),

deleteCategory: builder.mutation({
  query: (id) => ({
    url: `/admin/category/${id}`,
    method: "DELETE",
  }),
  invalidatesTags: [
    {
      type: "Categories",
      id: "LIST",
    },
    "Categories",
    "Products",
    "AdminStats",
  ],
}),
getReturns: builder.query({
  query: (params = {}) => ({
    url: "/returns",
    method: "GET",
    params: {
      limit: 100,
      ...params,
    },
  }),

  transformResponse: (response) => {
    if (Array.isArray(response)) {
      return response;
    }

    return (
      response?.items ||
      response?.returns ||
      response?.data ||
      []
    );
  },

  providesTags: (result) => [
    ...(Array.isArray(result)
      ? result.map((returnItem) => ({
          type: "Returns",
          id: String(returnItem._id),
        }))
      : []),

    {
      type: "Returns",
      id: "LIST",
    },
  ],
}),
getReturnByRma: builder.query({
  query: (rmaNumber) =>
    `/returns/${encodeURIComponent(rmaNumber)}`,

  transformResponse: (response) =>
    response?.returnRequest ||
    response?.return ||
    response?.data ||
    response ||
    null,

  providesTags: (result, error, rmaNumber) => [
    {
      type: "Returns",
      id: String(rmaNumber),
    },
  ],
}),

updateReturnStatus: builder.mutation({
  query: ({ id, status, note = "" }) => ({
    url: `/returns/${id}/status`,
    method: "PATCH",
    body: {
      status,
      note,
    },
  }),

  invalidatesTags: (result, error, { id }) => [
    {
      type: "Returns",
      id: String(id),
    },
    "Returns",
    "AdminStats",
  ],
}),
// ======================================================
// admin bunlde detailed page 
// =====================================================

getAdminBundleById: builder.query({
  query: (publicId) => `/admin/bundles/${publicId}`,

  transformResponse: (response) => {
    return (
      response?.bundle ||
      response?.data ||
      response ||
      null
    );
  },

  providesTags: (result, error, publicId) => [
    {
      type: "Bundles",
      id: String(publicId),
    },
  ],
}),

updateBundle: builder.mutation({
  query: ({ publicId, data }) => ({
    url: `/admin/bundles/${publicId}`,
    method: "PUT",
    body: data,
  }),

  invalidatesTags: (result, error, { publicId }) => [
    {
      type: "Bundles",
      id: String(publicId),
    },
    {
      type: "Bundles",
      id: "LIST",
    },
    "Products",
    "AdminStats",
  ],
}),


deleteBundleImage: builder.mutation({
  query: ({ publicId, image }) => ({
    url: `/admin/bundles/${publicId}/images`,
    method: "DELETE",
    body: { image },
  }),

  invalidatesTags: (result, error, { publicId }) => [
    {
      type: "Bundles",
      id: String(publicId),
    },
    {
      type: "Bundles",
      id: "LIST",
    },
  ],
}),
deleteBundle: builder.mutation({
  query: (publicId) => ({
    url: `/admin/bundles/${publicId}`,
    method: "DELETE",
  }),

  invalidatesTags: [
    {
      type: "Bundles",
      id: "LIST",
    },
    "Products",
    "AdminStats",
  ],
}),
// =====================================================
// order detail page
// =====================================================
getAdminOrderById: builder.query({
  query: (publicOrderId) =>
    `/admin/orders/${publicOrderId}`,

  transformResponse: (response) =>
    response?.order ||
    response?.data ||
    response ||
    null,

  providesTags: (result, error, publicOrderId) => [
    {
      type: "Orders",
      id: String(publicOrderId),
    },
  ],
}),

updateAdminOrderStatus: builder.mutation({
  query: ({ publicOrderId, status }) => ({
    url: `/admin/orders/${publicOrderId}/status`,
    method: "PATCH",
    body: { status },
  }),

  invalidatesTags: (result, error, { publicOrderId }) => [
    {
      type: "Orders",
      id: String(publicOrderId),
    },
    {
      type: "Orders",
      id: "LIST",
    },
    "AdminStats",
  ],
}),

updateAdminOrderShipment: builder.mutation({
  query: ({ publicOrderId, trackingNumber }) => ({
    url: `/admin/orders/${publicOrderId}/shipment`,
    method: "PATCH",
    body: { trackingNumber },
  }),

  invalidatesTags: (result, error, { publicOrderId }) => [
    {
      type: "Orders",
      id: String(publicOrderId),
    },
    {
      type: "Orders",
      id: "LIST",
    },
  ],
}),

addAdminOrderNote: builder.mutation({
  query: ({ publicOrderId, text }) => ({
    url: `/admin/orders/${publicOrderId}/notes`,
    method: "POST",
    body: { text },
  }),

  invalidatesTags: (result, error, { publicOrderId }) => [
    {
      type: "Orders",
      id: String(publicOrderId),
    },
  ],
}),

sendAdminOrderEmail: builder.mutation({
  query: ({ publicOrderId, template = "status_change" }) => ({
    url: `/admin/orders/${publicOrderId}/send-email`,
    method: "POST",
    body: { template },
  }),
}),








  }),
});

export const {
  /* Categories */
  useGetCategoriesQuery,

  /* Products */
  useGetProductsQuery,
  useGetProductQuery,
  useGetRelatedProductsQuery,
  useGetProductsByIdsQuery,
  

  /* Bundles */
  useGetBundlesQuery,
  useGetBundleQuery,
  useGetRelatedBundlesQuery,

  /* Auth */
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useRefreshTokenMutation,

  /* Cart */
  useGetCartQuery,
  useAddCartItemMutation,
  useUpdateCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
  useMergeCartMutation,
  useAddBundleToCartMutation,

  /* Wishlist */
  useGetWishlistQuery,
  useAddWishlistMutation,
  useRemoveWishlistMutation,
  useSyncWishlistMutation,

  /* Orders */
  useOrdersQuery,
  useCancelOrderMutation,
useTrackOrderQuery,

  /* Addresses */ 
   useAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,

/* Inventory */
useGetInventoryQuery,
useGetInventoryByIdQuery,
useGetInventoryByProductQuery,
useCreateInventoryMutation,
useUpdateInventoryMutation,
useUpdateProductInventoryMutation,
useDeleteInventoryMutation,



//  Admin Products
  useGetAdminStatsQuery,
  useGetAdminOrdersQuery,
useGetAdminProductsQuery,
  useUpdateAdminProductMutation,
  useDeleteAdminProductMutation,
useGetAdminProductByIdQuery,
useDeleteAdminProductImageMutation,

  // add product
    useCreateAdminProductMutation,
    // upload images admin
  useUploadAdminImagesMutation,

  // add bundle
  useCreateBundleMutation,
useUpdateBundleMutation,
useDeleteBundleMutation,
 useGetAdminBundleByIdQuery,
  useDeleteBundleImageMutation,


  // Admin Users
  useGetUsersQuery,
useUpdateUserRoleMutation,
useDeleteUserMutation,

// admin categories
useCreateCategoryMutation,
useUpdateCategoryMutation,
useDeleteCategoryMutation,
useGetAdminCategoriesQuery,

// return
useGetReturnsQuery,
useGetReturnByRmaQuery,
useUpdateReturnStatusMutation,

// admin order details
useGetAdminOrderByIdQuery,
useUpdateAdminOrderStatusMutation,
useUpdateAdminOrderShipmentMutation,
useAddAdminOrderNoteMutation,
useSendAdminOrderEmailMutation,



  
} = api;