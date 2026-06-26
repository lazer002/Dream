import React, { useEffect, useMemo, useState } from "react";
import { useWishlist } from "../state/WishlistContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { useCart } from "../state/CartContext.jsx";
import api from "../utils/config.js";
import { Link } from "react-router-dom";
import { Heart, Heart as HeartOutline } from "lucide-react"; // or your icon set
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function ProductCard({
  product,
  onRemove,
  onToggle,
  add,
  isWishlisted,
}) {

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]">

      {/* IMAGE */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

        <img
          src={product?.images?.[0] || "/placeholder.png"}
          alt={product?.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* WISHLIST */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            onToggle(product?._id);
          }}
          aria-label={
            isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-all duration-300 hover:scale-110"
        >
          {isWishlisted ? (
            <Heart className="h-5 w-5 fill-black text-black" />
          ) : (
            <HeartOutline className="h-5 w-5 text-black" />
          )}
        </button>

        {/* SALE */}
        {product?.onSale && (
          <div className="absolute left-4 top-4 rounded-full bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
            Sale
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-5">

        {/* TITLE */}
        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold uppercase tracking-wide text-black">
              {product?.title}
            </h3>

            {product?.subtitle && (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">
                {product.subtitle}
              </p>
            )}
          </div>

          {/* PRICE */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-black">
              ₹
              {Number(
                product?.price ?? 0
              ).toLocaleString()}
            </p>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mt-5 flex items-center gap-3">

          {/* ADD TO CART */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              add(product)
            }}
            className="flex-1 rounded-2xl bg-black py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90  hover:text-white/70"
          >
            Add to Cart
          </button>

          {/* REMOVE */}
     <button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    onRemove(product?._id);
  }}
  title="Remove"
  className="
    h-12 px-6 rounded-2xl
    bg-gray-100
    text-sm font-medium text-black
    transition-all duration-200
    hover:bg-black hover:text-white

  "
>
  Remove
</button>
        </div>
      </div>
    </div>
  );
}
export default function WishlistPage() {
  const { user } = useAuth();
  const { add } = useCart();
  const { wishlist, removeFromWishlist, toggleWishlist, syncWishlistToUser } = useWishlist();

  const [products, setProducts] = useState([]); // product objects
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);

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
      const promises = ids.map((id) =>
        api
          .get(`/products/${id}`)
          .then((r) => r.data)
          .catch(() => null)
      );

      const results = await Promise.all(promises);

      if (mounted) {
        setProducts(results.filter(Boolean));
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

const handleAddClick = async (product) => {
  if (
    !product?.inventory ||
    Object.keys(product.inventory).length === 0
  ) {
    toast.error("Please select a size!");
    return;
  }

  setSelectedProduct(product);
  setIsModalOpen(true);
};

const handleSelectSize = async (size) => {
  if (!selectedProduct) return;

  await add(
    selectedProduct._id,
    size,
    1
  );
 removeFromWishlist(selectedProduct._id);
  setIsModalOpen(false);
  setSelectedProduct(null);
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
                  add={handleAddClick}
                  onRemove={handleRemove}
                  onToggle={handleToggle}
                  isWishlisted={ids.some(
                    (id) => String(id) === String(p._id || p.id)
                  )}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="max-w-sm w-[90%]">
    <DialogHeader>
      <DialogTitle>Select Size</DialogTitle>
    </DialogHeader>

    <div className="p-4 flex flex-col gap-4">
      {selectedProduct && (
        <div>
          <div className="text-sm text-gray-600 mb-2">
            Choose Size
          </div>
        
          <div className="flex flex-wrap gap-2">
            {Object.entries(selectedProduct.inventory || {}).map(
              ([size, qty]) => (
                <button
                  key={size}
                  onClick={() => handleSelectSize(size)}
                  disabled={qty <= 0}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                    qty <= 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                      : "hover:bg-black hover:text-white"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span>{size}</span>
                    <small className="text-xs">
                      {qty > 0 ? `${qty} left` : "Out"}
                    </small>
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}
