import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/utils/config";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star } from "lucide-react";

// NEW ARRIVALS PAGE
// - Designed for a black/white Shopify-like theme using shadcn/ui + Tailwind
// - Features: debounced search, filters (category, size), sort, grid, infinite scroll, quick-view modal, add-to-cart, wishlist, skeletons
// - Drop-in single-file component; wire addToCart and wishlist handlers to your app state

// small debounce hook
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Skeleton tile for loading state
function ProductSkeleton() {
  return (
    <div className="animate-pulse bg-white border border-gray-100 rounded-lg overflow-hidden">
      <div className="w-full aspect-[4/5] bg-gray-200" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// Product Card
function ProductCard({ product, onQuickView, onAddToCart, onToggleWishlist, wishlist }) {
  const price = Number(product.displayPrice ?? product.price) || 0;
  const original = product.originalPrice ? Number(product.originalPrice) : null;
  const discount = product.discountPercent ?? null;

  return (
    <article className="bg-white border border-gray-100 rounded-lg overflow-hidden group relative">
      <Link to={`/product/${product._id}`} className="block no-underline" aria-label={`Open ${product.title}`}>
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-gray-50">
          <img
            src={product.images?.[0] || "/images/placeholder-400.png"}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt={`${product.title} alternate`}
              loading="lazy"
              className="w-full h-full object-cover absolute top-0 left-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
            />
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {product.isNewProduct && (
              <span className="bg-black text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">NEW</span>
            )}
            {discount ? (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">{discount}% OFF</span>
            ) : product.onSale ? (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded font-semibold uppercase">SALE</span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase truncate">{product.title}</h3>

        <div className="flex items-center gap-3">
          <div className="text-base font-extrabold">₹{price.toLocaleString()}</div>
          {original && original > price && (
            <div className="text-xs line-through text-gray-400">₹{Math.round(original).toLocaleString()}</div>
          )}
          {discount && <div className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">{discount}% OFF</div>}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="flex-1 bg-black text-white text-xs py-2 rounded font-semibold hover:bg-gray-900 transition"
            aria-label={`Add ${product.title} to cart`}
          >
            Add to bag
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="border border-gray-200 text-xs py-2 rounded px-3 hover:bg-gray-50"
          >
            Quick view
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleWishlist(product._id);
            }}
            className="p-2"
            aria-label={`Wishlist ${product.title}`}
          >
            {wishlist.includes(product._id) ? (
              <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 21s-6.716-4.605-9.5-7.077C-0.132 10.79 1.51 6.5 5.5 6.5c2.28 0 3.5 1.5 3.5 1.5s1.22-1.5 3.5-1.5c4 0 5.632 4.29 2.999 7.423C18.716 16.395 12 21 12 21z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 21s-6.716-4.605-9.5-7.077C-0.132 10.79 1.51 6.5 5.5 6.5c2.28 0 3.5 1.5 3.5 1.5s1.22-1.5 3.5-1.5c4 0 5.632 4.29 2.999 7.423C18.716 16.395 12 21 12 21z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function NewArrivals() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [q, setQ] = useState("");
  const debouncedQ = useDebounce(q, 300);
  const [sort, setSort] = useState("newest");
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterSize, setFilterSize] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [quickProduct, setQuickProduct] = useState(null);
  const abortRef = useRef(null);

  // normalize function
  const normalize = useCallback((p) => {
    const original = p.compareAtPrice ?? p.originalPrice ?? p.mrp ?? null;
    const price = Number(p.price) || 0;
    let discountPercent = null;
    if (p.discountPercent) discountPercent = Number(p.discountPercent);
    else if (original && original > price) discountPercent = Math.round(((original - price) / original) * 100);
    return { ...p, displayPrice: price, originalPrice: original ? Number(original) : null, discountPercent };
  }, []);

  // fetch categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/categories");
        if (!mounted) return;
        setCategories(Array.isArray(res.data?.categories) ? res.data.categories : []);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => (mounted = false);
  }, []);

  // fetch products (paginated)
  useEffect(() => {
    // cancel previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchPage = async (p = 1, append = false) => {
      setLoading(true);
      try {
        const res = await api.get("/products", {
          params: {
            q: debouncedQ || undefined,
            page: p,
            perPage: 24,
            sort: sort,
            category: filterCategory || undefined,
            size: filterSize || undefined,
            tag: "new-arrival",
          },
          signal: controller.signal,
        });

        const items = Array.isArray(res.data?.items) ? res.data.items : [];
        const norm = items.map(normalize);

        setProducts((prev) => (append ? [...prev, ...norm] : norm));
        setHasMore(items.length === 24);
        setPage(p);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Products fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPage(1, false);

    return () => controller.abort();
  }, [debouncedQ, sort, filterCategory, filterSize, normalize]);

  // load more
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setLoading(true);
    try {
      const res = await api.get("/products", { params: { page: next, perPage: 24, sort, category: filterCategory, size: filterSize, tag: "new-arrival" } });
      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setProducts((prev) => [...prev, ...items.map(normalize)]);
      setHasMore(items.length === 24);
      setPage(next);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [hasMore, loading, page, sort, filterCategory, filterSize, normalize]);

  // handlers
  const openQuickView = useCallback((p) => setQuickProduct(p), []);
  const closeQuickView = useCallback(() => setQuickProduct(null), []);
  const addToCart = useCallback((p) => {
    // integrate with your cart context
    console.log("add to cart", p._id);
  }, []);
  const toggleWishlist = useCallback((id) => setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])), []);

  const sortedProducts = useMemo(() => products, [products]);

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12"> 
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold uppercase">New Arrivals</h1>
          <p className="text-sm text-gray-600 mt-1">Fresh drops — curated just for you.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, artists, tags..." className="w-full md:w-80" />

          <Select onValueChange={(v) => setSort(v)} defaultValue={sort} className="w-40">
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(v) => setFilterCategory(v)} defaultValue={filterCategory} className="w-40">
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Grid */}
      <section>
        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sortedProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                onQuickView={openQuickView}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                wishlist={wishlist}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        <div className="mt-8 flex justify-center">
          {hasMore ? (
            <Button onClick={loadMore} className="bg-black text-white px-6 py-3">{loading ? 'Loading...' : 'Load more'}</Button>
          ) : (
            <div className="text-sm text-gray-500">End of results</div>
          )}
        </div>
      </section>

      {/* Quick View Dialog */}
      <Dialog open={!!quickProduct} onOpenChange={(open) => { if (!open) closeQuickView(); }}> 
        <DialogContent>
          {quickProduct ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <img src={quickProduct.images?.[0]} alt={quickProduct.title} className="w-full h-96 object-cover rounded" />
              <div>
                <h3 className="text-xl font-bold">{quickProduct.title}</h3>
                <div className="mt-2 text-lg font-extrabold">₹{Number(quickProduct.displayPrice || quickProduct.price).toLocaleString()}</div>
                <p className="mt-4 text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: quickProduct.description || '' }} />
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => addToCart(quickProduct)} className="bg-black text-white">Add to bag</Button>
                  <Button variant="outline" onClick={() => navigate(`/product/${quickProduct._id}`)}>View product</Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
