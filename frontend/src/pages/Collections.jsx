// src/pages/Collections.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/utils/config.js";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

/**
 * Collections (Bundles) — modern improved page
 *
 * Features:
 *  - Featured hero bundle
 *  - Responsive grid with large / medium / small cards
 *  - Carousel preview per bundle (keyboard & touch friendly)
 *  - Loading skeletons, empty & error states
 *  - Search + sort + category filter
 *  - Modal detail view per bundle (quick-buy + share)
 *  - Accessibility and lazy images
 *
 * Notes:
 *  - Wire `addBundleToCart` to your cart context
 *  - The `api` instance must support `signal` (AbortController) for cancellable fetches
 */

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

/* ------------------ Simple UI skeletons ------------------ */
function BundleSkeleton() {
  return (
    <div className="animate-pulse bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="w-full aspect-[16/10] bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

/* ------------------ Bundle Card ------------------ */
function BundleCard({ bundle, onOpen, onAddBundle, idx }) {
  const carouselRef = useRef(null);

  // accessibility: allow left/right keyboard
  const scrollBy = (offset) => {
    carouselRef.current?.scrollBy({ left: offset, behavior: "smooth" });
  };

  const totalPrice = useMemo(
    () => (bundle.products?.reduce((s, p) => s + (Number(p.price) || 0), 0) || 0),
    [bundle]
  );

  // compute bundle savings if bundle.price exists
  const bundlePrice = Number(bundle.price || bundle.bundlePrice || bundle.salePrice || 0);
  const savings = bundlePrice && totalPrice ? Math.max(0, totalPrice - bundlePrice) : 0;
  const savingsPercent = savings && totalPrice ? Math.round((savings / totalPrice) * 100) : 0;

  return (
    <article
      className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition bg-white border border-gray-100"
      aria-labelledby={`bundle-${bundle._id}-title`}
    >
      <div className="relative">
        {/* Left/Right controls (visible on hover / desktop) */}
        <button
          aria-label={`Scroll left for ${bundle.title}`}
          onClick={() => scrollBy(-160)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
        >
          ‹
        </button>

        <div
          ref={carouselRef}
          className="flex overflow-x-auto gap-3 p-4 scrollbar-thin scroll-smooth"
          tabIndex={0}
          aria-label={`${bundle.title} images`}
        >
          {(bundle.mainImages?.length ? bundle.mainImages : bundle.products?.map((p) => p.images?.[0]) || []).slice(0, 6).map((img, i) => (
            <img
              key={i}
              src={img || "/images/placeholder-300.png"}
              alt={`${bundle.title} image ${i + 1}`}
              loading="lazy"
              className="w-36 h-36 object-cover rounded-xl flex-shrink-0 border border-gray-200"
              style={{ minWidth: 144 }}
            />
          ))}
        </div>

        <button
          aria-label={`Scroll right for ${bundle.title}`}
          onClick={() => scrollBy(160)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
        >
          ›
        </button>

        {/* badges */}
        <div className="absolute top-3 left-3 z-30 flex gap-2">
          {bundle.isNew && <span className="bg-black text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">NEW</span>}
          {bundle.onSale && savingsPercent > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">{savingsPercent}% OFF</span>
          )}
        </div>
      </div>

      {/* info */}
      <div className="p-4 bg-white">
        <h3 id={`bundle-${bundle._id}-title`} className="text-lg font-semibold mb-1 truncate">{bundle.title}</h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-3">{bundle.description}</p>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-extrabold">₹{bundlePrice ? bundlePrice.toLocaleString() : totalPrice.toLocaleString()}</div>
            {savings > 0 && <div className="text-xs line-through text-gray-400">₹{totalPrice.toLocaleString()}</div>}
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>{bundle.products?.length || 0} item{bundle.products?.length > 1 ? "s" : ""}</div>
            {savings > 0 && <div className="text-green-600 font-semibold">Save ₹{savings.toLocaleString()}</div>}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddBundle(bundle); }}
            className="flex-1 bg-black text-white px-4 py-2 rounded-md font-semibold hover:bg-gray-900 transition"
            aria-label={`Add bundle ${bundle.title} to cart`}
          >
            Add bundle
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onOpen(bundle); }}
            className="border border-gray-200 px-4 py-2 rounded-md text-sm hover:bg-gray-50"
            aria-label={`Open details for ${bundle.title}`}
          >
            View bundle
          </button>
        </div>
      </div>
    </article>
  );
}

/* ------------------ Page component ------------------ */
export default function Collections() {
  const [bundles, setBundles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 350);
  const [sort, setSort] = useState("recent");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);
  const [activeBundle, setActiveBundle] = useState(null);
  const abortRef = useRef(null);

  // fetch categories (one-time)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/categories");
        if (!mounted) return;
        setCategories(Array.isArray(res.data?.categories) ? res.data.categories : []);
      } catch (err) {
        // non-critical
        console.error("categories fetch error", err);
      }
    })();
    return () => (mounted = false);
  }, []);

  // fetch bundles with debounce, supports pagination
  // fetch bundles with debounce, supports pagination
  useEffect(() => {
    const controller = new AbortController();
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = controller;

    const fetchBundles = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get("/bundles", {
          params: {
            q: debouncedQ || undefined,
            page: 1,
            perPage: 12,
            sort,
            category: selectedCategory || undefined,
          },
          signal: controller.signal,
        });
        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        setBundles(items);
        setPage(1);
      } catch (err) {
        // Ignore cancellations (Axios throws CanceledError, browsers use AbortError)
        const isAbort =
          err?.name === "AbortError" ||
          err?.name === "CanceledError" ||
          err?.code === "ERR_CANCELED";

        if (isAbort) {
          // request was intentionally cancelled — do nothing
          return;
        }

        console.error("bundles fetch error", err);
        setError("Failed to load bundles. Try again.");
        setBundles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBundles();

    return () => controller.abort();
  }, [debouncedQ, sort, selectedCategory]);

  const loadMore = async () => {
    try {
      setLoading(true);
      const next = page + 1;
      const res = await api.get("/bundles", { params: { page: next, perPage: 12, q: debouncedQ || undefined, sort, category: selectedCategory || undefined } });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setBundles((prev) => [...prev, ...items]);
      setPage(next);
    } catch (err) {
      console.error("load more bundles error", err);
    } finally {
      setLoading(false);
    }
  };

  // handlers (wire these up to your cart & analytics)
  const handleAddBundle = (bundle) => {
    // TODO: integrate with cart context (add all products in bundle or a bundle SKU)
    console.log("Add bundle to cart:", bundle._id);
  };

  const openBundleModal = (bundle) => setActiveBundle(bundle);
  const closeBundleModal = () => setActiveBundle(null);

  // UI states
  const featured = bundles[0];
  const gridBundles = bundles.slice(featured ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Collections & Bundles</h1>
          <p className="text-sm text-gray-600 mt-1">Curated sets, limited drops, and value bundles — pick your vibe.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bundles, tags, products..." className="w-full md:w-80" />
          <Select onValueChange={(v) => setSort(v)} defaultValue={sort} className="w-44">
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="savings">Most savings</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => setSelectedCategory(v)} defaultValue={selectedCategory} className="w-44">
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All</SelectItem>
              {categories.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured hero */}
      {featured && (
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2 rounded-3xl overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${featured.heroImage || featured.mainImages?.[0] || featured.products?.[0]?.images?.[0] || '/images/placeholder-800.png'})`, minHeight: 380 }}>
              <div className="bg-gradient-to-b from-black/60 via-black/30 to-transparent p-8 h-full flex flex-col justify-end">
                <div className="max-w-xl text-white">
                  <h2 className="text-3xl font-bold mb-2">{featured.title}</h2>
                  <p className="mb-4 text-sm text-white/90 line-clamp-3">{featured.description}</p>
                  <div className="flex gap-3">
                    <Button onClick={() => openBundleModal(featured)} className="bg-white text-black hover:bg-gray-100">View bundle</Button>
                    <Button variant="outline" onClick={() => handleAddBundle(featured)} className="bg-white text-black">Add bundle</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* quick bundle stats */}
            <div className="rounded-2xl border border-gray-100 p-6 bg-white shadow-sm hover:shadow-md transition">
              {/* Top row: items + price */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm text-gray-500">Includes</div>
                  <div className="text-xl font-bold">
                    {featured.products?.length || 0} item{featured.products?.length > 1 ? "s" : ""}
                  </div>
                </div>

                {/* Price section with discount */}
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-1">Bundle price</div>

                  {/* calculate discount */}
                  {(() => {
                    const totalOriginal =
                      featured.products?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0;
                    const bundlePrice = Number(featured.bundlePrice || featured.price || totalOriginal);
                    const discountPercent =
                      totalOriginal > bundlePrice
                        ? Math.round(((totalOriginal - bundlePrice) / totalOriginal) * 100)
                        : 0;

                    return (
                      <div>
                        <div className="flex items-baseline justify-end gap-2">
                          <span className="text-xl font-extrabold text-black">
                            ₹{bundlePrice.toLocaleString()}
                          </span>

                          {discountPercent > 0 && (
                            <>
                              <span className="text-gray-400 line-through text-sm">
                                ₹{totalOriginal.toLocaleString()}
                              </span>
                              <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {discountPercent}% OFF
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* product thumbnails */}
              <div className="flex gap-2 flex-wrap mb-4">
                {(featured.products || []).slice(0, 6).map((p) => (
                  <img
                    key={p._id}
                    src={p.images?.[0]}
                    alt={p.title}
                    className="w-12 h-12 object-cover rounded-md border border-gray-200"
                  />
                ))}
                {featured.products?.length > 6 && (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                    +{featured.products.length - 6}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => openBundleModal(featured)}
                  className="flex-1 bg-black text-white hover:bg-gray-900"
                >
                  View Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAddBundle(featured)}
                  className="flex-1 hover:bg-gray-50"
                >
                  Add
                </Button>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* Grid */}
      <section>
        {loading && bundles.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <BundleSkeleton key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600">{error}</div>
        ) : bundles.length === 0 ? (
          <div className="text-center py-20 text-gray-600">No bundles found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridBundles.map((b, i) => (
              <BundleCard key={b._id} bundle={b} onOpen={openBundleModal} onAddBundle={handleAddBundle} idx={i} />
            ))}
          </div>
        )}

        {/* load more */}
        <div className="mt-8 text-center">
          <Button onClick={loadMore} className="bg-black text-white px-6 py-3" disabled={loading}>
            {loading ? "Loading…" : "Load more bundles"}
          </Button>
        </div>
      </section>

      {/* Bundle modal */}
      <Dialog open={!!activeBundle} onOpenChange={(open) => { if (!open) closeBundleModal(); }}>
        <DialogContent>
          {activeBundle ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-[4/5] bg-gray-100 rounded overflow-hidden">
                  <img src={activeBundle.mainImages?.[0] || activeBundle.products?.[0]?.images?.[0]} alt={activeBundle.title} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">{activeBundle.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{activeBundle.description}</p>

                <div className="mb-4">
                  <div className="text-lg font-extrabold">₹{Number(activeBundle.price || activeBundle.bundlePrice || 0).toLocaleString()}</div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Items in this bundle</h4>
                  <ul className="space-y-2 text-sm">
                    {activeBundle.products?.map((p) => (
                      <li key={p._id} className="flex items-center gap-3">
                        <img src={p.images?.[0]} alt={p.title} className="w-10 h-10 object-cover rounded" />
                        <div>
                          <div className="font-medium">{p.title}</div>
                          <div className="text-xs text-gray-500">₹{p.price}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => handleAddBundle(activeBundle)} className="bg-black text-white">Add bundle to cart</Button>
                  <Link to={`/collections/${activeBundle._id}`} className="border border-gray-200 px-4 py-2 rounded-md">Open bundle page</Link>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );

}
