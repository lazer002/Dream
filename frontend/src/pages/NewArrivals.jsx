// src/pages/NewArrivals.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Search,
  SlidersHorizontal,
  Heart,
  ShoppingBag,
  X,
  ChevronDown,
  ArrowUpRight,
  Loader2,
} from "lucide-react";

import {
  useGetProductsQuery,
  useGetCategoriesQuery,
} from "@/store/api";

import {
  useWishlist,
} from "@/state/WishlistContext";

import {
  useCart,
} from "@/state/CartContext";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Badge,
} from "@/components/ui/badge";


const PAGE_SIZE = 24;


/* =========================================================
   HELPERS
========================================================= */

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getStock = (product) => {
  const inventory = product?.inventory;

  if (!inventory) return 0;

  if (inventory.trackInventory === false) {
    return Infinity;
  }

  return Math.max(
    0,
    Number(inventory.available) || 0
  );
};

const isSoldOut = (product) => {
  if (product?.inventory?.trackInventory === false) {
    return false;
  }

  return getStock(product) <= 0;
};

const getStockLabel = (product) => {
  if (
    product?.inventory?.trackInventory === false
  ) {
    return "In stock";
  }

  const stock = getStock(product);

  if (stock <= 0) return "Sold out";

  if (stock <= 3) {
    return `Only ${stock} left`;
  }

  if (stock <= 5) {
    return "Low stock";
  }

  return "In stock";
};


/* =========================================================
   SKELETON
========================================================= */

function ProductSkeleton() {
  return (
    <div className="overflow-hidden">
      <div className="aspect-[3/4] animate-pulse bg-[#eeeeee]" />

      <div className="space-y-3 py-4">
        <div className="h-3 w-3/4 animate-pulse bg-[#eeeeee]" />
        <div className="h-3 w-1/3 animate-pulse bg-[#eeeeee]" />
        <div className="h-4 w-1/2 animate-pulse bg-[#eeeeee]" />
      </div>
    </div>
  );
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onRemoveFromWishlist,
  onAddToWishlist,
  isInWishlist,
}) {
  const soldOut = isSoldOut(product);

  const stockLabel =
    getStockLabel(product);

  const price =
    Number(product.price) || 0;

  const oldPrice =
    Number(product.oldPrice) ||
    Number(product.originalPrice) ||
    0;

  const discount =
    product.discount ||
    (
      oldPrice > price
        ? Math.round(
            ((oldPrice - price) /
              oldPrice) *
              100
          )
        : 0
    );

  const liked =
    isInWishlist(product.publicId);

  return (
    <article className="group relative min-w-0">

      {/* IMAGE */}

      <div className="relative overflow-hidden bg-[#f4f4f4]">

        <Link
          to={`/product/${product.publicId}`}
          className="block aspect-[3/4]"
        >
          <img
            src={
              product.images?.[0] ||
              "/images/placeholder-400.png"
            }
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
          />

          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
        </Link>

        {/* BADGES */}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">

          {product.isNewProduct && (
            <Badge className="rounded-none bg-white px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-black shadow-none hover:bg-white">
              NEW
            </Badge>
          )}

          {discount > 0 && (
            <Badge className="rounded-none bg-black px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] text-white shadow-none hover:bg-black">
              {discount}% OFF
            </Badge>
          )}

        </div>

        {/* WISHLIST */}

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (liked) {
              onRemoveFromWishlist(
                product.publicId
              );
            } else {
              onAddToWishlist(
                product.publicId
              );
            }
          }}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 backdrop-blur transition-transform hover:scale-105"
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          <Heart
            className={`h-[17px] w-[17px] transition ${
              liked
                ? "fill-black"
                : ""
            }`}
          />
        </button>

        {/* QUICK VIEW */}

        <button
          type="button"
          onClick={() =>
            onQuickView(product)
          }
          className="absolute bottom-3 left-3 right-3 hidden h-11 items-center justify-center gap-2 bg-white text-[10px] font-bold uppercase tracking-[0.2em] transition group-hover:flex hover:bg-black hover:text-white"
        >
          Quick view
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>

        {/* SOLD OUT */}

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <span className="bg-white px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em]">
              Sold out
            </span>
          </div>
        )}
      </div>

      {/* INFO */}

      <div className="pt-4">

        <div className="mb-1 flex items-start justify-between gap-3">

          <Link
            to={`/product/${product.publicId}`}
            className="min-w-0"
          >
            <h3 className="truncate text-[12px] font-semibold uppercase tracking-[0.08em]">
              {product.title}
            </h3>
          </Link>

        </div>

        <div className="flex items-center gap-2">

          <span className="text-[13px] font-bold">
            {formatPrice(price)}
          </span>

          {oldPrice > price && (
            <span className="text-[11px] text-gray-400 line-through">
              {formatPrice(oldPrice)}
            </span>
          )}

        </div>

        <div className="mt-2 flex items-center justify-between">

          <span
            className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${
              soldOut
                ? "text-red-500"
                : getStock(product) <= 5
                  ? "text-orange-500"
                  : "text-gray-400"
            }`}
          >
            {stockLabel}
          </span>

          {!soldOut && (
            <button
              type="button"
              onClick={() =>
                onAddToCart(product)
              }
              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] opacity-0 transition-opacity group-hover:opacity-100"
            >
              Add to bag
              <ShoppingBag className="h-3 w-3" />
            </button>
          )}

        </div>
      </div>
    </article>
  );
}


/* =========================================================
   QUICK VIEW
========================================================= */

function QuickView({
  product,
  onClose,
  onAddToCart,
}) {
  const [imageIndex, setImageIndex] =
    useState(0);

  useEffect(() => {
    setImageIndex(0);
  }, [product]);

  if (!product) return null;

  const soldOut =
    isSoldOut(product);

  const price =
    Number(product.price) || 0;

  const oldPrice =
    Number(product.oldPrice) ||
    Number(product.originalPrice) ||
    0;

  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-[1000px] overflow-hidden border-0 p-0">

        <div className="grid md:grid-cols-2">

          {/* IMAGE */}

          <div className="bg-[#f5f5f5]">

            <div className="aspect-[3/4]">
              <img
                src={
                  product.images?.[
                    imageIndex
                  ] ||
                  product.images?.[0] ||
                  "/images/placeholder-400.png"
                }
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>

            {product.images?.length > 1 && (
              <div className="flex gap-2 overflow-x-auto p-3">

                {product.images.map(
                  (image, index) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() =>
                        setImageIndex(index)
                      }
                      className={`h-16 w-14 shrink-0 overflow-hidden border ${
                        imageIndex === index
                          ? "border-black"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )
                )}

              </div>
            )}
          </div>

          {/* DETAILS */}

          <div className="flex flex-col p-7 sm:p-10">

            <div className="mb-8">

              <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
                New arrival
              </p>

              <h2 className="text-2xl font-semibold tracking-tight">
                {product.title}
              </h2>

              <div className="mt-4 flex items-center gap-3">

                <span className="text-xl font-bold">
                  {formatPrice(price)}
                </span>

                {oldPrice > price && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(oldPrice)}
                  </span>
                )}

              </div>
            </div>

            <p className="mb-8 text-sm leading-7 text-gray-500">
              {product.description}
            </p>

            {/* SIZES */}

            {product.sizes?.length > 0 && (
              <div className="mb-8">

                <div className="mb-3 flex justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em]">
                    Size
                  </span>

                  <Link
                    to={`/product/${product.publicId}`}
                    className="text-[9px] font-bold uppercase tracking-[0.15em] underline underline-offset-4"
                  >
                    Size guide
                  </Link>
                </div>

                <div className="grid grid-cols-4 gap-2">

                  {product.sizes.map(
                    (size) => {
                      const stock =
                        Number(
                          product.inventory
                            ?.stock?.[
                            size.name
                          ]
                        ) || 0;

                      const disabled =
                        product.inventory
                          ?.trackInventory !==
                          false &&
                        stock <= 0;

                      return (
                        <div
                          key={size._id || size.name}
                          className={`flex h-11 items-center justify-center border text-xs ${
                            disabled
                              ? "cursor-not-allowed bg-gray-50 text-gray-300 line-through"
                              : "border-black"
                          }`}
                        >
                          {size.name}
                        </div>
                      );
                    }
                  )}

                </div>
              </div>
            )}

            {/* STOCK */}

            <div className="mb-8 border-y py-4">

              <div className="flex items-center justify-between">

                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Availability
                </span>

                <span
                  className={`text-[10px] font-bold uppercase tracking-[0.15em] ${
                    soldOut
                      ? "text-red-500"
                      : "text-black"
                  }`}
                >
                  {getStockLabel(
                    product
                  )}
                </span>

              </div>

            </div>

            <div className="mt-auto space-y-3">

              <Button
                disabled={soldOut}
                onClick={() =>
                  onAddToCart(product)
                }
                className="h-14 w-full rounded-none bg-black text-[10px] font-bold uppercase tracking-[0.25em] text-white hover:bg-white hover:text-black hover:ring-1 hover:ring-black"
              >
                {soldOut
                  ? "Sold out"
                  : "Add to bag"}
              </Button>

              <Link
                to={`/product/${product.publicId}`}
                onClick={onClose}
                className="flex h-12 items-center justify-center border border-black text-[10px] font-bold uppercase tracking-[0.22em] transition hover:bg-black hover:text-white"
              >
                View full product
              </Link>

            </div>

          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function NewArrivals() {
  const navigate = useNavigate();

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
  } = useWishlist();

  const {
    add,
  } = useCart();

  const [search, setSearch] =
    useState("");

  const [sort, setSort] =
    useState("newest");

  const [category, setCategory] =
    useState("");

  const [size, setSize] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [products, setProducts] =
    useState([]);

  const [quickProduct, setQuickProduct] =
    useState(null);

  const [mobileFilters, setMobileFilters] =
    useState(false);

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);

    return () =>
      clearTimeout(timer);
  }, [search]);

  /* =======================================================
     REDUX / RTK QUERY
  ======================================================= */

  const {
    data: categoryData,
    isLoading: categoriesLoading,
  } = useGetCategoriesQuery();

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useGetProductsQuery({
    q: debouncedSearch || undefined,
    page,
    perPage: PAGE_SIZE,
    sort,
    category: category || undefined,
    size: size || undefined,
    tag: "new-arrival",
  });

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    if (
      Array.isArray(
        categoryData?.categories
      )
    ) {
      return categoryData.categories;
    }

    if (
      Array.isArray(categoryData)
    ) {
      return categoryData;
    }

    return [];
  }, [categoryData]);

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const incomingProducts = useMemo(() => {
    if (
      Array.isArray(data?.items)
    ) {
      return data.items;
    }

    if (
      Array.isArray(data)
    ) {
      return data;
    }

    return [];
  }, [data]);

  useEffect(() => {
    if (page === 1) {
      setProducts(
        incomingProducts
      );
    } else if (
      incomingProducts.length
    ) {
      setProducts((prev) => {
        const existing = new Set(
          prev.map(
            (item) =>
              item.publicId ||
              item._id
          )
        );

        const next = [
          ...prev,
        ];

        incomingProducts.forEach(
          (item) => {
            const id =
              item.publicId ||
              item._id;

            if (!existing.has(id)) {
              next.push(item);
            }
          }
        );

        return next;
      });
    }
  }, [
    incomingProducts,
    page,
  ]);

  /* =======================================================
     RESET PAGINATION
  ======================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    sort,
    category,
    size,
  ]);

  /* =======================================================
     HAS MORE
  ======================================================= */

  const hasMore =
    incomingProducts.length ===
    PAGE_SIZE;

  /* =======================================================
     ADD TO CART
  ======================================================= */

  const handleAddToCart =
    useCallback(
      async (product) => {
        if (isSoldOut(product)) {
          return;
        }

        try {
          await add({
            publicId:
              product.publicId,
            quantity: 1,
          });

          setQuickProduct(
            null
          );
        } catch (error) {
          console.error(
            "ADD TO CART ERROR:",
            error
          );
        }
      },
      [add]
    );

  /* =======================================================
     FILTER RESET
  ======================================================= */

  const clearFilters =
    useCallback(() => {
      setSearch("");
      setCategory("");
      setSize("");
      setSort("newest");
      setPage(1);
    }, []);

  const activeFilters =
    [
      category,
      size,
    ].filter(Boolean)
      .length;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-white">

      {/* ===================================================
         HERO
      =================================================== */}

      <section className="border-b border-black/10">

        <div className="mx-auto max-w-[1600px] px-5 pb-12 pt-16 sm:px-8 lg:px-12">

          <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">

            <div>

              <p className="mb-5 text-[9px] font-bold uppercase tracking-[0.4em] text-gray-400">
                The latest drop
              </p>

              <h1 className="text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                New
                <br />
                Arrivals.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-6 text-gray-500">
                Fresh silhouettes, new-season
                essentials and pieces just added
                to the collection.
              </p>

            </div>

            <div className="flex items-center gap-8">

              <div>
                <p className="text-2xl font-semibold">
                  {products.length}
                </p>

                <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Pieces
                </p>
              </div>

              <div className="h-10 w-px bg-black/10" />

              <Link
                to="/"
                className="text-[9px] font-bold uppercase tracking-[0.2em] underline underline-offset-4"
              >
                Shop all
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
         TOOLBAR
      =================================================== */}

      <section className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-12">

          <button
            type="button"
            onClick={() =>
              setMobileFilters(true)
            }
            className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em]"
          >
            <SlidersHorizontal className="h-4 w-4" />

            Filters

            {activeFilters > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[8px] text-white">
                {activeFilters}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-8 md:flex">

            <div className="relative">

              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search"
                className="h-9 w-64 rounded-none border-0 border-b border-black/20 bg-transparent pl-7 text-xs shadow-none focus:border-black focus:ring-0"
              />

            </div>

            <div className="flex items-center gap-2">

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-400">
                Sort
              </span>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(
                    e.target.value
                  )
                }
                className="h-9 border-0 bg-transparent pr-8 text-xs font-semibold outline-none"
              >
                <option value="newest">
                  Newest
                </option>

                <option value="price_asc">
                  Price low to high
                </option>

                <option value="price_desc">
                  Price high to low
                </option>

                <option value="popular">
                  Popular
                </option>
              </select>

            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              setMobileFilters(true)
            }
            className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] md:hidden"
          >
            {activeFilters > 0
              ? `${activeFilters} applied`
              : "Filter & sort"}

            <ChevronDown className="h-3 w-3" />
          </button>

        </div>

      </section>

      {/* ===================================================
         MOBILE SEARCH
      =================================================== */}

      <div className="border-b border-black/10 px-5 py-3 md:hidden">

        <div className="relative">

          <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <Input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search products"
            className="h-10 rounded-none border-0 border-b border-black/20 bg-transparent pl-7 text-xs shadow-none focus:border-black focus:ring-0"
          />

        </div>

      </div>

      {/* ===================================================
         PRODUCTS
      =================================================== */}

      <section className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">

        {isError ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center text-center">

            <p className="text-[10px] font-bold uppercase tracking-[0.25em]">
              Something went wrong
            </p>

            <p className="mt-3 text-sm text-gray-400">
              We couldn't load the collection.
            </p>

          </div>
        ) : isLoading && page === 1 ? (

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">

            {Array.from({
              length: 12,
            }).map((_, index) => (
              <ProductSkeleton
                key={index}
              />
            ))}

          </div>

        ) : products.length === 0 ? (

          <div className="flex min-h-[450px] flex-col items-center justify-center text-center">

            <ShoppingBag className="mb-5 h-8 w-8 stroke-[1]" />

            <h2 className="text-xl font-semibold">
              No products found
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Try changing your search or filters.
            </p>

            <Button
              onClick={clearFilters}
              className="mt-6 rounded-none bg-black px-7 text-[9px] font-bold uppercase tracking-[0.2em]"
            >
              Clear filters
            </Button>

          </div>

        ) : (

          <>

            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">

              {products.map(
                (product) => (
                  <ProductCard
                    key={
                      product.publicId ||
                      product._id
                    }
                    product={product}
                    onQuickView={
                      setQuickProduct
                    }
                    onAddToCart={
                      handleAddToCart
                    }
                    onAddToWishlist={
                      addToWishlist
                    }
                    onRemoveFromWishlist={
                      removeFromWishlist
                    }
                    isInWishlist={
                      isInWishlist
                    }
                  />
                )
              )}

            </div>

            {/* LOAD MORE */}

            {hasMore && (
              <div className="mt-16 flex justify-center">

                <Button
                  disabled={isFetching}
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                  className="h-12 rounded-none border border-black bg-white px-12 text-[9px] font-bold uppercase tracking-[0.25em] text-black hover:bg-black hover:text-white"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Loading
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>

              </div>
            )}

            {!hasMore &&
              products.length > 0 && (
                <div className="mt-20 text-center">

                  <div className="mx-auto mb-5 h-px w-12 bg-black" />

                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
                    End of collection
                  </p>

                </div>
              )}

          </>

        )}

      </section>

      {/* ===================================================
         QUICK VIEW
      =================================================== */}

      <QuickView
        product={quickProduct}
        onClose={() =>
          setQuickProduct(null)
        }
        onAddToCart={
          handleAddToCart
        }
      />

      {/* ===================================================
         MOBILE FILTERS
      =================================================== */}

      <Dialog
        open={mobileFilters}
        onOpenChange={
          setMobileFilters
        }
      >
        <DialogContent className="fixed bottom-0 left-0 right-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2">

          <div className="p-6">

            <div className="mb-8 flex items-center justify-between">

              <div>

                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
                  Collection
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Filter & sort
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFilters(
                    false
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border"
              >
                <X className="h-4 w-4" />
              </button>

            </div>

            {/* SEARCH */}

            <div className="mb-7">

              <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Search
              </label>

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search products"
                className="h-12 rounded-none border-black/20 focus:border-black focus:ring-0"
              />

            </div>

            {/* CATEGORY */}

            <div className="mb-7">

              <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Category
              </label>

              <select
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
                className="h-12 w-full border border-black/20 bg-white px-3 text-xs outline-none focus:border-black"
              >
                <option value="">
                  All categories
                </option>

                {categories.map(
                  (item) => (
                    <option
                      key={
                        item._id ||
                        item.id
                      }
                      value={
                        item._id ||
                        item.id
                      }
                    >
                      {item.name ||
                        item.title}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* SIZE */}

            <div className="mb-7">

              <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Size
              </label>

              <div className="grid grid-cols-4 gap-2">

                {[
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                  "XXL",
                ].map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() =>
                        setSize(
                          size === item
                            ? ""
                            : item
                        )
                      }
                      className={`h-11 border text-xs font-semibold ${
                        size === item
                          ? "border-black bg-black text-white"
                          : "border-black/15"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              </div>

            </div>

            {/* SORT */}

            <div className="mb-8">

              <label className="mb-2 block text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Sort by
              </label>

              <div className="grid grid-cols-2 gap-2">

                {[
                  [
                    "newest",
                    "Newest",
                  ],
                  [
                    "popular",
                    "Popular",
                  ],
                  [
                    "price_asc",
                    "Price low",
                  ],
                  [
                    "price_desc",
                    "Price high",
                  ],
                ].map(
                  ([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setSort(value)
                      }
                      className={`h-11 border text-[9px] font-bold uppercase tracking-[0.12em] ${
                        sort === value
                          ? "border-black bg-black text-white"
                          : "border-black/15"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}

              </div>

            </div>

            <div className="flex gap-2">

              <Button
                onClick={() => {
                  clearFilters();
                  setMobileFilters(
                    false
                  );
                }}
                variant="outline"
                className="h-12 flex-1 rounded-none border-black text-[9px] font-bold uppercase tracking-[0.2em]"
              >
                Clear
              </Button>

              <Button
                onClick={() =>
                  setMobileFilters(
                    false
                  )
                }
                className="h-12 flex-1 rounded-none bg-black text-[9px] font-bold uppercase tracking-[0.2em]"
              >
                Apply
              </Button>

            </div>

          </div>

        </DialogContent>
      </Dialog>

    </main>
  );
}