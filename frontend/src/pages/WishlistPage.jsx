import React, { useEffect, useMemo, useState } from "react";
import { useWishlist } from "../state/WishlistContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import api from "../utils/config.jsx";
import { Link } from "react-router-dom"; // optional - remove/replace if not using react-router

function ProductCard({ product, onRemove, onToggle, isWishlisted }) {
  return (
    <div className="flex gap-4 p-4 bg-white rounded shadow-sm">
      <img
        src={product?.image || "/placeholder.png"}
        alt={product?.title || "Product"}
        className="w-24 h-24 object-cover rounded"
      />

      <div className="flex-1">
        <h3 className="text-sm font-semibold">{product?.title || "Unknown product"}</h3>
        <p className="text-xs text-gray-500 mt-1">{product?.subtitle}</p>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div>
            <div className="text-base font-bold">₹{product?.price ?? "—"}</div>
            {product?.badge && <div className="text-xs text-green-600 mt-1">{product.badge}</div>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(product?._id)}
              className="px-3 py-1 text-sm rounded border"
              aria-pressed={isWishlisted}
            >
              {isWishlisted ? "Remove" : "Wishlist"}
            </button>

            <button
              onClick={() => onRemove(product?._id)}
              className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 border border-red-200"
            >
              Remove
            </button>
          </div>
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
          if (mounted) setProducts(Array.isArray(data) ? data : data.items ?? []);
        } catch (batchErr) {
          // fallback: fetch individually
          const promises = ids.map((id) => api.get(`/products/${id}`).then((r) => r.data).catch(() => null));
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
    // optimistic UI: remove locally first
    removeFromWishlist(productId);
  };

  const handleToggle = async (productId) => {
    // toggle uses wishlist context and will call server if user is logged in
    toggleWishlist(productId);
  };

  const handleSync = async () => {
    // Called by guests who want to save their wishlist to server (requires login)
    if (!user) {
      // optional: redirect to login + preserve returnTo
      window.location.href = `/login?next=/wishlist`;
      return;
    }
    await syncWishlistToUser();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Your Wishlist</h1>
        <p className="text-sm text-gray-600 mt-1">
          {user ? "Items saved to your account." : "You are browsing as a guest. Log in to save your wishlist across devices."}
        </p>
      </header>

      {!user && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-300 rounded">
          <div className="flex items-center justify-between gap-4">
            <div>
              <strong className="block">Guest wishlist</strong>
              <div className="text-sm text-gray-700">Sign in to save your wishlist permanently and access it from any device.</div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Sign in</Link>
              <button onClick={handleSync} className="px-4 py-2 border rounded">Save now</button>
            </div>
          </div>
        </div>
      )}

      <main>
        {loading && <div className="text-center py-8">Loading wishlist…</div>}

        {!loading && error && (
          <div className="text-center py-8 text-red-600">{error}</div>
        )}

        {!loading && !ids.length && (
          <div className="text-center py-12">
            <p className="text-lg">Your wishlist is empty.</p>
            <Link to="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded">Browse products</Link>
          </div>
        )}

        {!loading && ids.length > 0 && (
          <div className="grid gap-4">
            {products.map((p) => (
              <ProductCard
                key={p._id || p.id}
                product={p}
                onRemove={handleRemove}
                onToggle={handleToggle}
                isWishlisted={ids.includes(p._id || p.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
