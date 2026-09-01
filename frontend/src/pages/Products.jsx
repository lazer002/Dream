// src/pages/Products.jsx

import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  ShoppingBag,
  Filter,
  ArrowUpDown,
  Heart as HeartOutline,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.jsx";

import FilterDrawer from "@/components/filterDrawer";

import { useCart } from "../state/CartContext.jsx";
import { useWishlist } from "../state/WishlistContext.jsx";

import {
  useGetProductsQuery,
  useGetCategoriesQuery,
} from "@/store/api";

// =====================================================
// SKELETON
// =====================================================

function ProductSkeleton() {
  return (
    <div className="bg-white border border-gray-200 p-4 flex flex-col gap-2 animate-pulse">
      <div className="w-full h-48 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  );
}

// =====================================================
// COMPONENT
// =====================================================

export default function Products() {
  const location = useLocation();

  const { add } = useCart();

  const {
    wishlist,
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  // ===================================================
  // STATE
  // ===================================================

  const [sort, setSort] =
    useState("newest");

  const [page, setPage] =
    useState(1);

  const [allProducts, setAllProducts] =
    useState([]);

  const [hasMore, setHasMore] =
    useState(true);

  const [isFilterOpen, setIsFilterOpen] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [showTopBtn, setShowTopBtn] =
    useState(false);

  const [selectedFilters, setSelectedFilters] =
    useState({
      categories: [],
      priceRange: "",
      color: [],
      size: [],
      fabric: [],
      fit: [],
      inStock: false,
      isNew: false,
      onSale: false,
    });

  // ===================================================
  // CATEGORY FROM URL
  // ===================================================

  const categoryFromQuery =
    new URLSearchParams(
      location.search
    ).get("category");

  // ===================================================
  // API PARAMS
  // ===================================================



const apiParams = useMemo(() => {
  const params = {
    limit: 10,
    page,
    sort,
  };

  if (categoryFromQuery) {
    params.category =
      categoryFromQuery.toLowerCase();
  } else if (
    selectedFilters.categories?.length
  ) {
    params.category =
      selectedFilters.categories.join(",");
  }

  if (selectedFilters.priceRange) {
    params.priceRange =
      selectedFilters.priceRange;
  }

  const tags = [
    ...(selectedFilters.color || []),
    ...(selectedFilters.size || []),
    ...(selectedFilters.fabric || []),
    ...(selectedFilters.fit || []),
  ];

  if (tags.length) {
    params.tags = tags.join(",");
  }

  if (selectedFilters.inStock) {
    params.inStock = "true";
  }

  if (selectedFilters.isNew) {
    params.isNew = "true";
  }

  if (selectedFilters.onSale) {
    params.onSale = "true";
  }

  return params;
}, [
  page,
  sort,
  categoryFromQuery,
  selectedFilters.categories,
  selectedFilters.priceRange,
  selectedFilters.color,
  selectedFilters.size,
  selectedFilters.fabric,
  selectedFilters.fit,
  selectedFilters.inStock,
  selectedFilters.isNew,
  selectedFilters.onSale,
]);

const {
  data: productsData,
  isLoading,
  isFetching,
  isError,
  error,
} = useGetProductsQuery(apiParams, {
  refetchOnMountOrArgChange: true,
});

console.log("PRODUCT API PARAMS:", apiParams);
console.log("PRODUCT API DATA:", productsData);
console.log("PRODUCT API ERROR:", error);
  // ===================================================
  // PRODUCTS API
  // ===================================================



  // ===================================================
  // CATEGORIES API
  // ===================================================

  const {
    data: categoriesData,
  } = useGetCategoriesQuery();

  const categories =
    Array.isArray(categoriesData)
      ? categoriesData
      : [];

  // ===================================================
  // MERGE PAGINATION RESULTS
  // ===================================================


useEffect(() => {
  const newProducts = productsData?.items || [];

  setAllProducts((prev) => {
    if (page === 1) {
      return newProducts;
    }

    const existingIds = new Set(
      prev.map(
        (item) =>
          item.publicId || item._id
      )
    );

    const uniqueProducts =
      newProducts.filter(
        (item) =>
          !existingIds.has(
            item.publicId || item._id
          )
      );

    return [
      ...prev,
      ...uniqueProducts,
    ];
  });

  setHasMore(
    Number(productsData?.currentPage || page) <
      Number(productsData?.totalPages || 0)
  );
}, [productsData, page]);


// ADD this effect for filter/sort changes

useEffect(() => {
  setPage(1);
  setHasMore(true);
}, [
  sort,
  categoryFromQuery,
  selectedFilters.categories,
  selectedFilters.priceRange,
  selectedFilters.color,
  selectedFilters.size,
  selectedFilters.fabric,
  selectedFilters.fit,
  selectedFilters.inStock,
  selectedFilters.isNew,
  selectedFilters.onSale,
]);

  // ===================================================
  // INFINITE SCROLL
  // ===================================================

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(
        window.scrollY > 500
      );

      const nearBottom =
        window.innerHeight +
          window.scrollY >=
        document.documentElement
          .scrollHeight - 300;

      if (
        nearBottom &&
        !isFetching &&
        hasMore &&
        !isLoading
      ) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener(
      "scroll",
      handleScroll
    );

    return () =>
      window.removeEventListener(
        "scroll",
        handleScroll
      );
  }, [
    isFetching,
    isLoading,
    hasMore,
  ]);

  // ===================================================
  // MODAL
  // ===================================================

  const openModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleSelectSize = (
    sizeKey
  ) => {
    if (!selectedProduct) return;

    const qty = Number(
      selectedProduct.inventory?.[
        sizeKey
      ] ??
        selectedProduct.inventory
          ?.stock?.[sizeKey] ??
        0
    );

    if (qty <= 0) return;

    add(
      selectedProduct.publicId,
      sizeKey
    );

    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // ===================================================
  // FILTER
  // ===================================================

  const handleFilterChange = (
    type,
    value
  ) => {
    setSelectedFilters(
      (prev) => {
        if (
          Array.isArray(
            prev[type]
          )
        ) {
          return prev[type].includes(
            value
          )
            ? {
                ...prev,
                [type]:
                  prev[type].filter(
                    (v) =>
                      v !== value
                  ),
              }
            : {
                ...prev,
                [type]: [
                  ...prev[type],
                  value,
                ],
              };
        }

        return {
          ...prev,
          [type]: value,
        };
      }
    );
  };

  // ===================================================
  // SOLD OUT
  // ===================================================

  const isProductSoldOut = (
    product
  ) => {
    const hasAvailableSize =
      Array.isArray(
        product.sizes
      ) &&
      product.sizes.some(
        (size) => {
          const name =
            typeof size === "string"
              ? size
              : size?.name;

          if (!name) return false;

          const qty = Number(
            product.inventory?.[
              name
            ] ??
              product.inventory
                ?.stock?.[name] ??
              0
          );

          return (
            (typeof size ===
              "string" ||
              size.active !== false) &&
            qty > 0
          );
        }
      );

    return (
      !hasAvailableSize &&
      (
        product.isOutOfStock ===
          true ||
        Number(
          product.inventory
            ?.available
        ) <= 0
      )
    );
  };

  // ===================================================
  // SCROLL TOP
  // ===================================================

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="bg-white min-h-screen text-black relative">
      {/* ================================================
          CONTROLS
      ================================================= */}

      <div className="mx-auto px-4 py-10 flex flex-wrap gap-4 items-center justify-between">
        <button
          onClick={() =>
            setIsFilterOpen(true)
          }
          className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold uppercase hover:bg-black transition"
        >
          <Filter className="w-5 h-5" />

          <span className="max-[500px]:hidden">
            Filter
          </span>
        </button>

        <div className="w-48">
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value);
            }}
          >
            <SelectTrigger className="w-full px-1 py-2 bg-gray-100 text-black flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-gray-700" />

              <SelectValue placeholder="Sort By" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="newest">
                Newest
              </SelectItem>

              <SelectItem value="low-high">
                Price: Low to High
              </SelectItem>

              <SelectItem value="high-low">
                Price: High to Low
              </SelectItem>

              <SelectItem value="popular">
                Popular
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ================================================
          PRODUCTS
      ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 pb-10">
        {allProducts.map(
          (p) => {
            const id = String(
              p.publicId
            );

            const soldOut =
              isProductSoldOut(p);

            return (
              <Link
                key={
                  p.publicId ||
                  p._id
                }
                to={`/product/${p.publicId}`}
                className="cursor-pointer"
              >
                <div className="bg-white transition border border-gray-100 overflow-hidden relative rounded-2xl">
                  {/* IMAGE */}

                  <div className="relative w-full h-[50vh] overflow-hidden">
                    <img
                      src={
                        p.images?.[0] ||
                        "/images/placeholder.png"
                      }
                      alt={p.title}
                      className={`w-full h-full object-cover transition-all duration-500 rounded-xl ${
                        soldOut
                          ? "grayscale"
                          : ""
                      }`}
                    />

                    {p.images?.[1] && (
                      <img
                        src={
                          p.images[1]
                        }
                        alt={`${p.title} hover`}
                        className={`w-full h-full object-cover absolute top-0 left-0 opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-xl ${
                          soldOut
                            ? "grayscale"
                            : ""
                        }`}
                      />
                    )}

                    {/* SOLD OUT */}

                    {soldOut && (
                      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    )}

                    {/* NEW */}

                    {p.isNew && (
                      <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 uppercase">
                        NEW
                      </span>
                    )}

                    {/* DISCOUNT */}

                    {p.discount > 0 && (
                      <span className="absolute top-3 right-3 z-20 bg-red-500 text-white text-[12px] font-black uppercase tracking-wide px-4 py-2 rounded-full shadow-lg shadow-red-500/30">
                        {Math.round(
                          p.discount
                        )}
                        % OFF
                      </span>
                    )}

                    {/* WISHLIST */}

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        wishlist.includes(
                          id
                        )
                          ? removeFromWishlist(
                              id
                            )
                          : addToWishlist(
                              id
                            );
                      }}
                      aria-label={
                        wishlist.includes(
                          id
                        )
                          ? "Remove from wishlist"
                          : "Add to wishlist"
                      }
                      className="absolute bottom-2 right-2 flex items-center justify-center w-10 h-10 hover:scale-110 transition z-10 p-2"
                    >
                      {wishlist.includes(
                        id
                      ) ? (
                        <Heart className="h-10 w-10 text-black fill-black" />
                      ) : (
                        <HeartOutline className="h-10 w-10 text-black" />
                      )}
                    </button>

                    {/* STATUS */}

                    <div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2">
                      {soldOut ? (
                        <div className="bg-black/80 backdrop-blur-md text-white text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-2 rounded-full">
                          Sold Out
                        </div>
                      ) : (
                        <>
                          {p.onSale && (
                            <div className="bg-black/80 backdrop-blur-md text-white text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-2 rounded-full">
                              Sale
                            </div>
                          )}

                          {p.isNewProduct && (
                            <div className="bg-black/80 backdrop-blur-md text-white text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-2 rounded-full">
                              NEW
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-black uppercase truncate">
                        {p.title}
                      </h3>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (!soldOut) {
                            openModal(p);
                          }
                        }}
                        disabled={soldOut}
                        className={`p-1 w-7 h-7 flex items-center justify-center transition ${
                          soldOut
                            ? "opacity-30 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-10 h-10" />
                      </button>
                    </div>

                    {/* PRICE */}

                    <div className="flex items-center gap-2 flex-wrap">
                      {p.oldPrice &&
                        Number(
                          p.oldPrice
                        ) >
                          Number(
                            p.price
                          ) && (
                          <span className="text-xs text-gray-500 line-through">
                            ₹{" "}
                            {Number(
                              p.oldPrice
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}

                      <span className="text-md font-bold text-red-600">
                        ₹{" "}
                        {Number(
                          p.price || 0
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          }
        )}
      </div>

      {/* ================================================
          LOADING
      ================================================= */}

      {(isLoading ||
        (isFetching &&
          page > 1)) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-10">
          {Array.from({
            length: 8,
          }).map((_, i) => (
            <ProductSkeleton
              key={i}
            />
          ))}
        </div>
      )}

      {/* ================================================
          EMPTY
      ================================================= */}

      {!isLoading &&
        !isFetching &&
        allProducts.length ===
          0 && (
          <div className="text-center text-gray-500 mt-20 mb-20">
            {isError
              ? "Failed to load products"
              : "No products found"}
          </div>
        )}

      {/* ================================================
          SIZE MODAL
      ================================================= */}

      <Dialog
        open={isModalOpen}
        onOpenChange={
          setIsModalOpen
        }
      >
        <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">
              Select Size
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="px-6 py-5">
              {selectedProduct
                .sizes?.length ? (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedProduct.sizes.map(
                      (size) => {
                        const name =
                          typeof size ===
                          "string"
                            ? size
                            : size?.name;

                        if (!name)
                          return null;

                        const qty =
                          Number(
                            selectedProduct
                              .inventory?.[
                              name
                            ] ??
                              selectedProduct
                                .inventory
                                ?.stock?.[
                                name
                              ] ??
                              0
                          );

                        const isAvailable =
                          (typeof size ===
                            "string" ||
                            size.active !==
                              false) &&
                          qty > 0;

                        return (
                          <button
                            key={name}
                            type="button"
                            disabled={
                              !isAvailable
                            }
                            onClick={() => {
                              if (
                                isAvailable
                              ) {
                                handleSelectSize(
                                  name
                                );
                              }
                            }}
                            className={`group relative min-h-[72px] rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                              isAvailable
                                ? "border-gray-200 bg-white hover:border-black hover:shadow-sm active:scale-[0.98]"
                                : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`text-base font-semibold ${
                                  isAvailable
                                    ? "text-gray-900"
                                    : "text-gray-400"
                                }`}
                              >
                                {name}
                              </span>

                              <span
                                className={`h-2 w-2 rounded-full ${
                                  isAvailable
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              />
                            </div>

                            <span
                              className={`mt-1 block text-xs ${
                                isAvailable
                                  ? "text-gray-500"
                                  : "text-gray-400"
                              }`}
                            >
                              {isAvailable
                                ? qty <=
                                  5
                                  ? `Only ${qty} left`
                                  : "Available"
                                : "Out of stock"}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {!selectedProduct.sizes.some(
                    (size) => {
                      const name =
                        typeof size ===
                        "string"
                          ? size
                          : size?.name;

                      if (!name)
                        return false;

                      const qty =
                        Number(
                          selectedProduct
                            .inventory?.[
                            name
                          ] ??
                            selectedProduct
                              .inventory
                              ?.stock?.[
                              name
                            ] ??
                            0
                        );

                      return (
                        (typeof size ===
                          "string" ||
                          size.active !==
                            false) &&
                        qty > 0
                      );
                    }
                  ) && (
                    <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                      <p className="text-sm font-medium text-red-600">
                        This product is
                        currently out
                        of stock.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                  <p className="text-sm text-gray-500">
                    No sizes available
                    for this product.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================
          FILTER DRAWER
      ================================================= */}

      {isFilterOpen && (
        <div
          onClick={() =>
            setIsFilterOpen(false)
          }
          className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300"
        />
      )}

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() =>
          setIsFilterOpen(false)
        }
        selectedFilters={
          selectedFilters
        }
        onChange={
          handleFilterChange
        }
        onApply={() => {
          setPage(1);
          setHasMore(true);
          setAllProducts([]);
          setIsFilterOpen(false);
        }}
        categories={categories}
      />

      {/* ================================================
          TOP BUTTON
      ================================================= */}

      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-black text-white px-5 py-3 rounded-full shadow-lg hover:bg-white hover:text-black transition z-50"
          title="Go to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}