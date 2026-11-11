import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Plus, Search, ShoppingBag, Sparkles, X } from "lucide-react";

import { useCart } from "@/state/CartContext";
import { useGetCategoriesQuery, useGetProductsQuery } from "@/store/api";

// A custom bundle is exactly two pieces with 10% off (same rule as checkout).
const BUNDLE_SIZE = 2;
const DISCOUNT = 0.1;

const STORAGE_PRODUCTS = "build-look-products";
const STORAGE_SIZES = "build-look-sizes";

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const inr = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const sizesInStock = (product) =>
  Object.entries(product?.inventory || {})
    .filter(([, qty]) => Number(qty) > 0)
    .map(([size]) => size);

const productImage = (product) => product?.images?.[0] || "/images/placeholder.png";

/* =========================================================
   SLOT (one of the two pieces in the bundle)
========================================================= */

function Slot({ index, product, size, onRemove, compact = false }) {
  if (!product) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-center ${
          compact ? "h-14 w-12" : "aspect-[3/4] w-full"
        }`}
      >
        <Plus className={compact ? "h-4 w-4 text-neutral-400" : "h-6 w-6 text-neutral-400"} />
        {!compact && (
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Piece {index + 1}
          </span>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <img
        src={productImage(product)}
        alt=""
        className="h-14 w-12 rounded-xl border-2 border-white object-cover"
      />
    );
  }

  return (
    <div className="relative">
      <div className="aspect-[3/4] w-full overflow-hidden rounded-2xl bg-neutral-100">
        <img src={productImage(product)} alt={product.title} className="h-full w-full object-cover" />
      </div>

      <button
        type="button"
        onClick={() => onRemove(product._id)}
        aria-label={`Remove ${product.title}`}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-black shadow transition hover:bg-black hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mt-2 min-w-0">
        <p className="truncate text-sm font-semibold">{product.title}</p>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-semibold">Size {size}</span>
          <span className="font-bold">{inr(product.price)}</span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PRICE SUMMARY
========================================================= */

function PriceSummary({ subtotal, discount, total }) {
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between text-neutral-500">
        <span>Subtotal</span>
        <span className="font-medium text-black">{inr(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-neutral-500">Bundle saving (10%)</span>
        <span className="font-semibold text-green-600">-{inr(discount)}</span>
      </div>
      <div className="flex items-end justify-between border-t border-neutral-200 pt-3">
        <span className="font-semibold">Total</span>
        <span className="text-2xl font-black tracking-tight">{inr(total)}</span>
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function PieceCard({ product, selected, chosenSize, bundleFull, onSize, onToggle, onOpen }) {
  const sizes = sizesInStock(product);
  const soldOut = sizes.length === 0;
  const hasOldPrice = Number(product.oldPrice) > Number(product.price);
  const canAdd = !soldOut && !bundleFull && Boolean(chosenSize);

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
        selected
          ? "border-black ring-1 ring-black"
          : "border-neutral-200 hover:border-neutral-300 hover:shadow-lg"
      }`}
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-neutral-100"
        aria-label={`View ${product.title}`}
      >
        <img
          src={productImage(product)}
          alt={product.title}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${
            soldOut ? "grayscale" : ""
          }`}
        />

        {selected && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white sm:left-3 sm:top-3">
            <Check className="h-3 w-3" />
            In bundle
          </span>
        )}

        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white">
              Sold out
            </span>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
          {product.category?.name || "Collection"}
        </p>

        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-[13px] font-bold leading-5 sm:text-sm">
          {product.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-black sm:text-base">{inr(product.price)}</span>
          {hasOldPrice && (
            <span className="text-[11px] text-neutral-400 line-through">{inr(product.oldPrice)}</span>
          )}
        </div>

        {/* Sizes: one scrollable row so narrow phone cards never overflow */}
        {!soldOut && (
          <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-hide">
            {sizes.map((size) => {
              const active = chosenSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  disabled={selected}
                  onClick={() => onSize(size)}
                  className={`h-8 min-w-[2.25rem] shrink-0 rounded-lg border px-2 text-[11px] font-semibold transition ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white text-neutral-700 hover:border-black"
                  } ${selected ? "cursor-not-allowed opacity-60" : ""}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto pt-3">
          <button
            type="button"
            onClick={onToggle}
            disabled={!selected && !canAdd}
            className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.12em] transition sm:h-11 sm:text-xs ${
              selected
                ? "bg-neutral-100 text-black hover:bg-neutral-200"
                : canAdd
                  ? "bg-black text-white hover:bg-neutral-800"
                  : "cursor-not-allowed bg-neutral-100 text-neutral-400"
            }`}
          >
            {selected ? (
              <>
                <X className="h-3.5 w-3.5" /> Remove
              </>
            ) : soldOut ? (
              "Sold out"
            ) : bundleFull ? (
              "Bundle full"
            ) : chosenSize ? (
              <>
                <Plus className="h-3.5 w-3.5" /> Add
              </>
            ) : (
              "Pick a size"
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   PAGE
========================================================= */

const BuildYourLookPage = () => {
  const { addBundleToCart, isAddingBundle } = useCart();
  const navigate = useNavigate();

  const { data: productsData, isLoading: productsLoading, isError: productsError } =
    useGetProductsQuery();
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery();

  const products = useMemo(
    () => (Array.isArray(productsData?.items) ? productsData.items : []),
    [productsData]
  );
  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const loading = productsLoading || categoriesLoading;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showSheet, setShowSheet] = useState(false);

  // Saved between visits; only ids + sizes are trusted (prices come fresh below).
  const [selectedIds, setSelectedIds] = useState(() =>
    readStorage(STORAGE_PRODUCTS, [])
      .map((p) => String(p?._id ?? p))
      .filter(Boolean)
      .slice(0, BUNDLE_SIZE)
  );
  const [sizes, setSizes] = useState(() => readStorage(STORAGE_SIZES, {}));

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(selectedIds));
      localStorage.setItem(STORAGE_SIZES, JSON.stringify(sizes));
    } catch {
      // storage full / private mode: selection just isn't remembered
    }
  }, [selectedIds, sizes]);

  useEffect(() => {
    if (productsError) toast.error("Unable to load products");
  }, [productsError]);

  // Current product data (price, stock) for the selected ids.
  const selectedProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [String(p._id), p]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [products, selectedIds]);

  // Drop pieces that disappeared or whose chosen size sold out.
  useEffect(() => {
    if (!products.length) return;

    const stillValid = selectedIds.filter((id) => {
      const product = products.find((p) => String(p._id) === id);
      return product && sizesInStock(product).includes(sizes[id]);
    });

    if (stillValid.length !== selectedIds.length) {
      setSelectedIds(stillValid);
      toast("A piece in your bundle sold out and was removed");
    }
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const inCategory =
        activeCategory === "all" || String(product.category?._id) === String(activeCategory);
      const matches =
        !query ||
        String(product.title || "").toLowerCase().includes(query) ||
        String(product.category?.name || "").toLowerCase().includes(query);

      return inCategory && matches;
    });
  }, [products, activeCategory, searchQuery]);

  const bundleFull = selectedIds.length >= BUNDLE_SIZE;
  const ready = selectedProducts.length === BUNDLE_SIZE;

  const subtotal = selectedProducts.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const total = Math.round(subtotal * (1 - DISCOUNT)); // same rounding as the server
  const discount = subtotal - total;

  const removePiece = (id) => {
    setSelectedIds((prev) => prev.filter((x) => x !== String(id)));
  };

  const togglePiece = (product) => {
    const id = String(product._id);

    if (selectedIds.includes(id)) {
      removePiece(id);
      return;
    }

    if (bundleFull) {
      toast("Your bundle already has 2 pieces. Remove one to swap.");
      return;
    }

    if (!sizes[id]) {
      toast("Pick a size first");
      return;
    }

    setSelectedIds((prev) => [...prev, id]);
  };

  const handleAddBundle = async () => {
    if (isAddingBundle) return;

    if (!ready) {
      toast.error(`Choose ${BUNDLE_SIZE} pieces for your bundle`);
      return;
    }

    const added = await addBundleToCart(
      { title: "My Custom Look", products: selectedProducts, price: total, custom: true },
      Object.fromEntries(selectedProducts.map((p) => [p._id, sizes[String(p._id)]]))
    );

    // addBundleToCart shows its own success / error toast.
    if (!added) return;

    setSelectedIds([]);
    setSizes({});
    setShowSheet(false);
  };

  const slots = Array.from({ length: BUNDLE_SIZE }, (_, i) => selectedProducts[i] || null);

  const ctaLabel = ready
    ? "Add Bundle to Bag"
    : `Choose ${BUNDLE_SIZE - selectedProducts.length} more piece${
        BUNDLE_SIZE - selectedProducts.length > 1 ? "s" : ""
      }`;

  return (
    <div className="min-h-screen bg-[#fafafa] pb-28 text-black lg:pb-0">
      {/* HERO */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 md:px-8 md:py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500">
            <Sparkles className="h-3.5 w-3.5" />
            Create your bundle
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-5xl md:text-6xl">
            Pick 2. Save 10%.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">
            Mix any two pieces into your own bundle and get{" "}
            <span className="font-semibold text-black">10% off</span> automatically.
          </p>

          <ol className="mt-6 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
            {["Pick a piece", "Choose its size", "Add the bundle"].map((step, i) => (
              <li
                key={step}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-3 sm:px-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  Step {i + 1}
                </span>
                <p className="mt-1 text-xs font-semibold leading-4 sm:text-sm">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {/* SEARCH + CATEGORIES */}
        <div className="sticky top-0 z-30 -mx-4 bg-[#fafafa]/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
          <div className="flex h-11 items-center rounded-2xl border border-neutral-200 bg-white px-4 focus-within:border-black">
            <Search size={18} className="mr-3 shrink-0 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pieces..."
              className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium outline-none placeholder:text-neutral-400 focus:ring-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-black hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[{ _id: "all", name: "All pieces" }, ...categories].map((category) => {
              const active = String(activeCategory) === String(category._id);

              return (
                <button
                  key={category._id}
                  type="button"
                  onClick={() => setActiveCategory(category._id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] transition ${
                    active
                      ? "bg-black text-white"
                      : "border border-neutral-200 bg-white text-neutral-500 hover:border-black hover:text-black"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
          {/* PIECES */}
          <main>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="text-xl font-black tracking-tight md:text-2xl">Choose your pieces</h2>
              <p className="text-xs text-neutral-400">{filteredProducts.length} items</p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 2xl:grid-cols-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <div className="aspect-[3/4] animate-pulse bg-neutral-200" />
                    <div className="space-y-2 p-3">
                      <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                      <div className="h-9 animate-pulse rounded-xl bg-neutral-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white text-center">
                <ShoppingBag className="h-8 w-8 text-neutral-300" />
                <h3 className="mt-3 font-semibold">No pieces found</h3>
                <p className="mt-1 text-sm text-neutral-400">Try another category or search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 2xl:grid-cols-4">
                {filteredProducts.map((product) => {
                  const id = String(product._id);

                  return (
                    <PieceCard
                      key={id}
                      product={product}
                      selected={selectedIds.includes(id)}
                      chosenSize={sizes[id]}
                      bundleFull={bundleFull}
                      onSize={(size) => setSizes((prev) => ({ ...prev, [id]: size }))}
                      onToggle={() => togglePiece(product)}
                      onOpen={() =>
                        navigate(`/product/${product.publicId}`, {
                          state: { fromBuildYourLook: true },
                        })
                      }
                    />
                  );
                })}
              </div>
            )}
          </main>

          {/* DESKTOP: YOUR BUNDLE */}
          <aside className="hidden lg:block">
            <div className="sticky top-36 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight">Your bundle</h2>
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold">
                  {selectedProducts.length}/{BUNDLE_SIZE}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {slots.map((product, i) => (
                  <Slot
                    key={i}
                    index={i}
                    product={product}
                    size={product ? sizes[String(product._id)] : null}
                    onRemove={removePiece}
                  />
                ))}
              </div>

              <div className="mt-6">
                <PriceSummary subtotal={subtotal} discount={discount} total={total} />
              </div>

              <button
                type="button"
                disabled={!ready || isAddingBundle}
                onClick={handleAddBundle}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {isAddingBundle ? "Adding…" : ctaLabel}
                <ChevronRight className="h-4 w-4" />
              </button>

              <p className="mt-3 text-center text-[11px] text-neutral-400">
                10% bundle discount applied automatically
              </p>
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE / TABLET: bottom bar + sheet */}
      <div className="lg:hidden">
        <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-neutral-200 bg-white/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSheet(true)}
              className="flex shrink-0 -space-x-3"
              aria-label="Show your bundle"
            >
              {slots.map((product, i) => (
                <Slot key={i} index={i} product={product} compact onRemove={removePiece} />
              ))}
            </button>

            <button
              type="button"
              onClick={() => setShowSheet(true)}
              className="min-w-0 flex-1 text-left"
            >
              <p className="text-xs text-neutral-500">
                {selectedProducts.length}/{BUNDLE_SIZE} pieces
                {discount > 0 && <span className="text-green-600"> · save {inr(discount)}</span>}
              </p>
              <p className="text-lg font-black leading-6">{inr(total)}</p>
            </button>

            <button
              type="button"
              disabled={!ready || isAddingBundle}
              onClick={handleAddBundle}
              className="h-11 shrink-0 rounded-xl bg-black px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              {isAddingBundle ? "Adding…" : ready ? "Add to bag" : `Pick ${BUNDLE_SIZE - selectedProducts.length}`}
            </button>
          </div>
        </div>

        {showSheet && (
          <>
            <div
              onClick={() => setShowSheet(false)}
              className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm"
            />

            <div className="fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-[28px] bg-white px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 shadow-[0_-20px_60px_rgba(0,0,0,.2)]">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-neutral-300" />

              <div className="mt-4 flex items-center justify-between">
                <h2 className="text-2xl font-black">Your bundle</h2>
                <button
                  type="button"
                  onClick={() => setShowSheet(false)}
                  aria-label="Close"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mx-auto mt-4 grid max-w-sm grid-cols-2 gap-3">
                {slots.map((product, i) => (
                  <Slot
                    key={i}
                    index={i}
                    product={product}
                    size={product ? sizes[String(product._id)] : null}
                    onRemove={removePiece}
                  />
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                <PriceSummary subtotal={subtotal} discount={discount} total={total} />
              </div>

              <button
                type="button"
                disabled={!ready || isAddingBundle}
                onClick={ready ? handleAddBundle : () => setShowSheet(false)}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-40"
              >
                {isAddingBundle ? "Adding…" : ready ? "Add Bundle to Bag" : "Keep choosing"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BuildYourLookPage;
