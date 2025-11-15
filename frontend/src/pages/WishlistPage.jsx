import React, { useEffect, useMemo, useState } from "react";
import { useWishlist } from "../state/WishlistContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import api from "../utils/config.jsx";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, X, Heart as HeartOutline } from "lucide-react"; // or your icon set

function ProductCard({ product, onRemove, onToggle, isWishlisted }) {
  return (
    <div className="bg-white/95 dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800 overflow-hidden transition-transform transform hover:-translate-y-0.5">
      <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-neutral-900">
        <img
          src={product?.images?.[0] || "/placeholder.png"}
          alt={product?.title}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onToggle(product?._id);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 p-2"
        >
         {isWishlisted ?  <Heart className="h-5 w-5 text-red-500 fill-red-500" /> :  <HeartOutline className="h-5 w-5 text-black dark:text-white" />}
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-black dark:text-white truncate uppercase">
              {product?.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1 line-clamp-2">
              {product?.subtitle || ""}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-sm font-bold text-black dark:text-white">₹{Number(product?.price ?? 0).toLocaleString()}</div>
            {product?.onSale && (
              <div className="text-[10px] font-semibold bg-black text-white px-2 py-1 rounded">{/* small badge */}
                SALE
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(product?._id); }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white hover:bg-gray-50 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-sm transition"
          >
            {isWishlisted ? "Remove" : "Save"}
          </button>

          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(product?._id); }}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:bg-red-50 text-red-600 transition"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const { user } = useAuth();
  const { wishlist, removeFromWishlist, toggleWishlist, syncWishlistToUser } = useWishlist();

  const [products, setProducts] = useState([]); // product objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ids = useMemo(() => (Array.isArray(wishlist) ? wishlist : []), [wishlist]);

useEffect(() => {
  let mounted = true;
  async function fetchProducts() {
    setLoading(true);
    setError(null);

    if (!ids.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      // Try batch endpoint first: /products?ids=1,2,3
      const idsParam = ids.join(",");

      try {
        const { data } = await api.get("/products", { params: { ids: idsParam } });
        // some APIs return { items: [...] } or an array directly
        const returned = Array.isArray(data) ? data : data.items ?? [];
        // FILTER returned list to only wishlist ids (defensive)
        const filtered = returned.filter((p) => {
          const pid = p?._id ?? p?.id;
          return pid && ids.includes(String(pid));
        });
        if (mounted) setProducts(filtered);
      } catch (batchErr) {
        // fallback: fetch individually (this already returns only wishlist items)
        const promises = ids.map((id) =>
          api.get(`/products/${id}`).then((r) => r.data).catch(() => null)
        );
        const results = await Promise.all(promises);
        if (mounted) setProducts(results.filter(Boolean));
      }
    } catch (err) {
      console.error("Failed to load wishlist products", err);
      if (mounted) setError("Failed to load products. Try again later.");
    } finally {
      if (mounted) setLoading(false);
    }
  }

  fetchProducts();
  return () => { mounted = false; };
}, [ids]);


  const handleRemove = async (productId) => {
    removeFromWishlist(productId);
  };

  const handleToggle = async (productId) => {
    await toggleWishlist(productId);
  };

  const handleSync = async () => {
    if (!user) {
      window.location.href = `/login?next=/wishlist`;
      return;
    }
    await syncWishlistToUser();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white">Your Wishlist</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400">
            {user ? "Items saved to your account." : "Browsing as guest. Sign in to save your wishlist across devices."}
          </p>
        </div>

        {!user && (
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium">Sign in</Link>
            <button onClick={handleSync} className="px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg text-sm">Save now</button>
          </div>
        )}
      </header>

      <main>
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-100 dark:bg-neutral-900 animate-pulse h-72" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 text-sm text-red-600">{error}</div>
        )}

        {!loading && !ids.length && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-black/5 dark:bg-white/5 mb-6">
              <Heart className="w-8 h-8 text-black dark:text-white" />
            </div>
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-6">Save items you love and find them here anytime.</p>
            <Link to="/" className="inline-block px-5 py-3 bg-black text-white rounded-lg">Browse products</Link>
          </div>
        )}

        {!loading && ids.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <Link key={p._id || p.id} to={`/product/${p._id || p.id}`} className="no-underline">
                <ProductCard
                  product={p}
                  onRemove={handleRemove}
                  onToggle={handleToggle}
                  isWishlisted={ids.includes(p._id || p.id)}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
