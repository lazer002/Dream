import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  CircleX,
  ChevronRight,
  X,
  ShoppingBag,
  Check,
  Plus,
} from "lucide-react";

import { useCart } from "@/state/CartContext";
import { useGetCategoriesQuery, useGetProductsQuery } from "@/store/api";

const BuildYourLookPage = () => {
  const { addBundleToCart } = useCart();
  const navigate = useNavigate();

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useGetProductsQuery();

  const {
    data: categoriesData,
    isLoading: categoriesLoading,
  } = useGetCategoriesQuery();

  const products = Array.isArray(productsData?.items)
    ? productsData.items
    : [];

  const categories = Array.isArray(categoriesData?.categories)
    ? categoriesData.categories
    : [];

  const loading = productsLoading || categoriesLoading;

  const [showLookDrawer, setShowLookDrawer] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const [selectedProducts, setSelectedProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "build-look-products"
      );

      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedSizes, setSelectedSizes] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "build-look-sizes"
      );

      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "build-look-products",
      JSON.stringify(selectedProducts)
    );
  }, [selectedProducts]);

  useEffect(() => {
    localStorage.setItem(
      "build-look-sizes",
      JSON.stringify(selectedSizes)
    );
  }, [selectedSizes]);

  useEffect(() => {
    if (productsError) {
      toast.error("Unable to load products");
    }
  }, [productsError]);

  const filteredProducts = useMemo(() => {
    const list =
      activeCategory === "all"
        ? products
        : products.filter(
            (product) =>
              String(product.category?._id) ===
              String(activeCategory)
          );

    const selectedIds = new Set(
      selectedProducts.map((p) => String(p._id))
    );

    const selected = list.filter((p) =>
      selectedIds.has(String(p._id))
    );

    const remaining = list.filter(
      (p) => !selectedIds.has(String(p._id))
    );

    return [...selected, ...remaining];
  }, [
    products,
    activeCategory,
    selectedProducts,
  ]);

  const toggleProduct = (product) => {
    const exists = selectedProducts.some(
      (p) => String(p._id) === String(product._id)
    );

    if (exists) {
      removeProduct(product._id);
      return;
    }

    if (selectedProducts.length >= 3) {
      toast.error(
        "Your look can have up to 3 pieces"
      );
      return;
    }

    if (!selectedSizes[product._id]) {
      toast.error("Please select a size first");
      return;
    }

    setSelectedProducts((prev) => [
      ...prev,
      product,
    ]);
  };

  const removeProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.filter(
        (p) => String(p._id) !== String(productId)
      )
    );

    setSelectedSizes((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  const subtotal = useMemo(() => {
    return selectedProducts.reduce(
      (sum, item) =>
        sum + Number(item.price || 0),
      0
    );
  }, [selectedProducts]);

  const discount =
    selectedProducts.length > 0
      ? Math.round(subtotal * 0.1)
      : 0;

  const total = subtotal - discount;

  const handleAddLook = () => {
    if (!selectedProducts.length) return;

    const customBundle = {
      title: "My Custom Look",
      products: selectedProducts,
      price: total,
      custom: true,
    };

    addBundleToCart(
      customBundle,
      selectedSizes
    );

    localStorage.removeItem(
      "build-look-products"
    );

    localStorage.removeItem(
      "build-look-sizes"
    );

    setSelectedProducts([]);
    setSelectedSizes({});
    setShowLookDrawer(false);

    toast.success("Your look was added to cart");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      {/* HERO */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1800px] px-5 py-10 sm:px-8 md:px-10 md:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
                <ShoppingBag className="h-3.5 w-3.5" />
                Personal Styling
              </div>

              <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Build Your Look
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-500 sm:text-base md:text-lg">
                Pick your favorite pieces, choose your
                sizes, and create a complete look with{" "}
                <span className="font-semibold text-black">
                  10% bundle savings.
                </span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4">
                <p className="text-2xl font-black">
                  {selectedProducts.length}/3
                </p>

                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Pieces
                </p>
              </div>

              <div className="rounded-2xl bg-black px-5 py-4 text-white">
                <p className="text-2xl font-black">
                  10%
                </p>

                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Bundle Saving
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1800px] px-4 py-6 sm:px-6 md:px-8 md:py-10">
        {/* CATEGORY NAV */}
        <div className="sticky top-0 z-30 -mx-4 border-b border-neutral-200 bg-[#fafafa]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() =>
                setActiveCategory("all")
              }
              className={`
                shrink-0 rounded-full px-5 py-2.5
                text-xs font-semibold uppercase tracking-[0.16em]
                transition-all
                ${
                  activeCategory === "all"
                    ? "bg-black text-white shadow-sm"
                    : "border border-neutral-200 bg-white text-neutral-500 hover:border-black hover:text-black"
                }
              `}
            >
              All Pieces
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                type="button"
                onClick={() =>
                  setActiveCategory(category._id)
                }
                className={`
                  shrink-0 rounded-full px-5 py-2.5
                  text-xs font-semibold uppercase tracking-[0.16em]
                  transition-all
                  ${
                    String(activeCategory) ===
                    String(category._id)
                      ? "bg-black text-white shadow-sm"
                      : "border border-neutral-200 bg-white text-neutral-500 hover:border-black hover:text-black"
                  }
                `}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-14">
          {/* PRODUCTS */}
          <main>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
                  Curate
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
                  Choose Your Pieces
                </h2>
              </div>

              <p className="text-xs text-neutral-400">
                {filteredProducts.length} items
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-2xl border border-neutral-200 bg-white"
                  >
                    <div className="aspect-[3/4] animate-pulse bg-neutral-200" />

                    <div className="space-y-3 p-4">
                      <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                      <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
                      <div className="h-5 w-20 animate-pulse rounded bg-neutral-200" />
                      <div className="h-10 animate-pulse rounded-xl bg-neutral-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex min-h-[400px] items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white">
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                    <ShoppingBag className="h-6 w-6 text-neutral-400" />
                  </div>

                  <h3 className="mt-4 font-semibold">
                    No pieces found
                  </h3>

                  <p className="mt-1 text-sm text-neutral-400">
                    Try another category.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
                {filteredProducts.map((product) => {
                  const selected =
                    selectedProducts.some(
                      (p) =>
                        String(p._id) ===
                        String(product._id)
                    );

                  const selectedSize =
                    selectedSizes[product._id];

                  const availableSizes =
                    Object.entries(
                      product.inventory || {}
                    ).filter(
                      ([, qty]) =>
                        Number(qty) > 0
                    );

                  return (
                    <article
                      key={product._id}
                      className={`
                        group overflow-hidden rounded-2xl
                        border bg-white
                        transition-all duration-300
                        ${
                          selected
                            ? "border-black ring-1 ring-black"
                            : "border-neutral-200 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl"
                        }
                      `}
                    >
                      <div
                        className="relative aspect-[3/4] cursor-pointer overflow-hidden bg-neutral-100"
                        onClick={() =>
                          navigate(
                            `/product/${product.publicId || product._id}`
                          )
                        }
                      >
                        <img
                          src={
                            product.images?.[0] ||
                            "/images/placeholder.png"
                          }
                          alt={product.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />

                        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/50 to-transparent opacity-60" />

                        {selected && (
                          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white">
                            <Check className="h-3 w-3" />
                            Added
                          </div>
                        )}

                        {product.isNewProduct &&
                          !selected && (
                            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur">
                              New
                            </span>
                          )}

                        {product.isOutOfStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                            <span className="rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-widest text-white">
                              Sold Out
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 sm:p-5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                          {product.category?.name ||
                            "Collection"}
                        </p>

                        <h3 className="mt-1.5 line-clamp-2 min-h-[40px] text-sm font-bold leading-5 sm:text-base">
                          {product.title}
                        </h3>

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-base font-black sm:text-lg">
                            ₹
                            {Number(
                              product.price || 0
                            ).toLocaleString()}
                          </span>

                          {product.oldPrice &&
                            Number(
                              product.oldPrice
                            ) >
                              Number(
                                product.price
                              ) && (
                              <span className="text-xs text-neutral-400 line-through">
                                ₹
                                {Number(
                                  product.oldPrice
                                ).toLocaleString()}
                              </span>
                            )}
                        </div>

                        <div className="mt-4">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                              Select Size
                            </span>

                            {selectedSize && (
                              <span className="text-[10px] font-semibold text-black">
                                {selectedSize} selected
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {availableSizes.length ? (
                              availableSizes.map(
                                ([size]) => {
                                  const active =
                                    selectedSize ===
                                    size;

                                  return (
                                    <button
                                      key={size}
                                      type="button"
                                      disabled={
                                        selected ||
                                        product.isOutOfStock
                                      }
                                      onClick={() =>
                                        setSelectedSizes(
                                          (prev) => ({
                                            ...prev,
                                            [product._id]:
                                              size,
                                          })
                                        )
                                      }
                                      className={`
                                        min-w-[40px]
                                        rounded-lg
                                        border px-2.5 py-2
                                        text-[11px]
                                        font-semibold
                                        transition-all
                                        ${
                                          active
                                            ? "border-black bg-black text-white"
                                            : "border-neutral-200 bg-white text-neutral-700 hover:border-black"
                                        }
                                        ${
                                          selected ||
                                          product.isOutOfStock
                                            ? "cursor-not-allowed opacity-50"
                                            : ""
                                        }
                                      `}
                                    >
                                      {size}
                                    </button>
                                  );
                                }
                              )
                            ) : (
                              <span className="text-xs text-red-500">
                                Out of stock
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            (!selectedSize &&
                              !selected) ||
                            product.isOutOfStock
                          }
                          onClick={() =>
                            toggleProduct(product)
                          }
                          className={`
                            mt-4 flex w-full items-center justify-center gap-2
                            rounded-xl px-4 py-3
                            text-xs font-bold uppercase tracking-[0.15em]
                            transition-all
                            ${
                              selected
                                ? "bg-black text-white hover:bg-neutral-800"
                                : selectedSize
                                  ? "bg-black text-white hover:bg-neutral-800"
                                  : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                            }
                          `}
                        >
                          {selected ? (
                            <>
                              <Check className="h-4 w-4" />
                              Added to Look
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add to Look
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>

          {/* DESKTOP SUMMARY */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-200 p-7">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                      Styling Board
                    </p>

                    <h2 className="mt-2 text-3xl font-black tracking-tight">
                      Your Look
                    </h2>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3">
                  <span className="text-sm text-neutral-500">
                    Selected pieces
                  </span>

                  <span className="font-bold">
                    {selectedProducts.length}/3
                  </span>
                </div>
              </div>

              <div className="max-h-[48vh] overflow-y-auto p-6">
                {selectedProducts.length === 0 ? (
                  <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                      <ShoppingBag className="h-7 w-7 text-neutral-400" />
                    </div>

                    <h3 className="mt-5 font-semibold">
                      Start building your look
                    </h3>

                    <p className="mt-2 max-w-[230px] text-sm leading-5 text-neutral-400">
                      Choose up to 3 pieces and select
                      a size for each one.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedProducts.map(
                      (product, index) => (
                        <div
                          key={product._id}
                          className="group flex gap-4 rounded-2xl border border-neutral-200 p-3"
                        >
                          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                            <img
                              src={
                                product.images?.[0] ||
                                "/images/placeholder.png"
                              }
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />

                            <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                              {index + 1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2">
                              <div className="min-w-0">
                                <p className="line-clamp-2 text-sm font-semibold leading-5">
                                  {product.title}
                                </p>

                                <p className="mt-1 text-xs text-neutral-400">
                                  {product.category?.name}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeProduct(
                                    product._id
                                  )
                                }
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition hover:bg-black hover:text-white"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold">
                                Size{" "}
                                {
                                  selectedSizes[
                                    product._id
                                  ]
                                }
                              </span>

                              <span className="text-sm font-bold">
                                ₹
                                {Number(
                                  product.price
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {selectedProducts.length < 3 && (
                      <button
                        type="button"
                        onClick={() =>
                          window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                          })
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 transition hover:border-black hover:text-black"
                      >
                        <Plus className="h-4 w-4" />
                        Add Another Piece
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-200 bg-neutral-50 p-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-black">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="font-medium text-neutral-500">
                      Bundle saving
                    </span>

                    <span className="font-semibold text-green-600">
                      -₹{discount.toLocaleString()}
                    </span>
                  </div>

                  <div className="my-4 border-t border-neutral-200" />

                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold">
                      Total
                    </span>

                    <span className="text-3xl font-black tracking-tight">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!selectedProducts.length}
                  onClick={handleAddLook}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Add Look to Cart
                  <ChevronRight className="h-4 w-4" />
                </button>

                <p className="mt-3 text-center text-[10px] text-neutral-400">
                  10% bundle discount applied automatically
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE */}
      {selectedProducts.length > 0 && (
        <div className="lg:hidden">
          {!showLookDrawer && (
            <button
              type="button"
              onClick={() =>
                setShowLookDrawer(true)
              }
              className="fixed bottom-4 left-4 right-4 z-[60] rounded-2xl bg-black px-4 py-3.5 text-white shadow-[0_15px_50px_rgba(0,0,0,.3)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {selectedProducts
                      .slice(0, 3)
                      .map((product) => (
                        <img
                          key={product._id}
                          src={
                            product.images?.[0] ||
                            "/images/placeholder.png"
                          }
                          alt=""
                          className="h-10 w-10 rounded-xl border-2 border-black object-cover"
                        />
                      ))}
                  </div>

                  <div className="text-left">
                    <p className="text-sm font-semibold">
                      {selectedProducts.length}/3
                      pieces
                    </p>

                    <p className="text-[11px] text-neutral-400">
                      Save ₹
                      {discount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-lg font-black">
                    ₹{total.toLocaleString()}
                  </span>

                  <ChevronRight
                    size={18}
                  />
                </div>
              </div>
            </button>
          )}

          {showLookDrawer && (
            <div
              onClick={() =>
                setShowLookDrawer(false)
              }
              className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm"
            />
          )}

          <div
            className={`
              fixed inset-x-0 bottom-0 z-[70]
              max-h-[88vh]
              rounded-t-[28px]
              bg-[#fafafa]
              shadow-[0_-20px_60px_rgba(0,0,0,.2)]
              transition-transform duration-300
              ${
                showLookDrawer
                  ? "translate-y-0"
                  : "translate-y-full"
              }
            `}
          >
            <div className="flex max-h-[88vh] flex-col">
              <div className="shrink-0 bg-white px-5 pb-4 pt-3">
                <div className="mx-auto h-1.5 w-12 rounded-full bg-neutral-300" />

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                      Styling Board
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      Your Look
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowLookDrawer(false)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                  <span className="text-xs text-neutral-500">
                    Pieces selected
                  </span>

                  <span className="text-sm font-bold">
                    {selectedProducts.length}/3
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-3">
                  {selectedProducts.map(
                    (product, index) => (
                      <div
                        key={product._id}
                        className="rounded-2xl border border-neutral-200 bg-white p-3"
                      >
                        <div className="flex gap-3">
                          <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl">
                            <img
                              src={
                                product.images?.[0] ||
                                "/images/placeholder.png"
                              }
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />

                            <span className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[9px] font-bold text-white">
                              {index + 1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between gap-2">
                              <div>
                                <h3 className="line-clamp-2 text-sm font-semibold leading-5">
                                  {product.title}
                                </h3>

                                <p className="mt-1 text-xs text-neutral-400">
                                  {product.category?.name}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  removeProduct(
                                    product._id
                                  )
                                }
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-semibold">
                                Size{" "}
                                {
                                  selectedSizes[
                                    product._id
                                  ]
                                }
                              </span>

                              <span className="font-bold">
                                ₹
                                {Number(
                                  product.price
                                ).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  {selectedProducts.length < 3 && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowLookDrawer(false)
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-300 bg-white py-4 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500"
                    >
                      <Plus className="h-4 w-4" />
                      Add Another Piece
                    </button>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t border-neutral-200 bg-white px-4 pb-5 pt-4">
                <div className="rounded-2xl bg-neutral-50 p-4">
                  <div className="flex justify-between text-xs text-neutral-500">
                    <span>Subtotal</span>

                    <span className="font-medium text-black">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-3 flex justify-between text-xs">
                    <span className="font-medium text-green-600">
                      Bundle saving
                    </span>

                    <span className="font-bold text-green-600">
                      -₹{discount.toLocaleString()}
                    </span>
                  </div>

                  <div className="my-3 border-t border-neutral-200" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Total
                    </span>

                    <span className="text-2xl font-black">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddLook}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-black py-4 text-xs font-bold uppercase tracking-[0.18em] text-white"
                >
                  Add Look to Cart
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildYourLookPage;