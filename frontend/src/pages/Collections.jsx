import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/config";

const BundlesPage = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);

  const [selectedSizes, setSelectedSizes] = useState({});
  const bundleAbortRef = useRef(null);
  const navigate = useNavigate();

  const fetchBundles = async () => {
    if (bundleAbortRef.current) {
      try {
        bundleAbortRef.current.abort();
      } catch (e) {}
      bundleAbortRef.current = null;
    }

    const controller = new AbortController();
    bundleAbortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await api.get("/bundles", { signal: controller.signal });
      setBundles(res.data?.items || []);
    } catch (err) {
      if (err.name === "AbortError" || err.message === "canceled") return;
      console.error("Bundles fetch error:", err);
      setError("Failed to load bundles. Try again.");
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
    return () => {
      try {
        bundleAbortRef.current?.abort();
      } catch (e) {}
    };
  }, []);

  const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddBundleToCart = () => {
    if (!selectedBundle) return;
    const bundleWithSizes = selectedBundle.products.map((p) => ({
      ...p,
      selectedSize: selectedSizes[p._id] || null,
    }));
    console.log("Added bundle to cart:", bundleWithSizes);
    setIsOpen(false);
  };

  const openBundleModal = (bundle) => {
    setSelectedBundle(bundle);
    setSelectedSizes(
      bundle.products?.reduce((acc, p) => {
        acc[p._id] = p.sizes?.[0] || "";
        return acc;
      }, {}) || {}
    );
    setIsOpen(true);
  };

  console.log("Bundles render:", bundles);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-black tracking-tight">
            Exclusive Bundles
          </h1>
          <button
            onClick={fetchBundles}
            className="text-sm text-gray-500 hover:text-black transition"
          >
            Refresh
          </button>
        </div>

        {/* States */}
        {loading && (
          <div className="text-gray-500 text-center py-20">Loading...</div>
        )}
        {error && (
          <div className="text-red-500 text-center py-20">{error}</div>
        )}

        {!loading && !error && bundles.length === 0 && (
          <div className="text-gray-500 text-center py-20">
            No bundles available yet.
          </div>
        )}

        {/* Grid */}
        {!loading && bundles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bundles.map((bundle) => {
              const total =
                bundle.products?.reduce(
                  (sum, p) => sum + Number(p.price || 0),
                  0
                ) || 0;
              const bundlePrice = Number(bundle.price || total);
              const fakeOriginal = Math.round(bundlePrice / 0.7);
              const discountPercent = Math.round(
                ((fakeOriginal - bundlePrice) / fakeOriginal) * 100
              );

              return (
                <div
                  key={bundle._id}
                  className="group border border-gray-200 rounded-2xl bg-white hover:shadow-lg transition overflow-hidden"
                >
                  {/* Image */}
                  <div className="relative">
                    <img
                      src={
                        bundle.mainImages?.[0] ||
                        bundle.products?.[0]?.images?.[0] ||
                        "/images/placeholder-800.png"
                      }
                      alt={bundle.title}
                      className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute top-4 left-4 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full tracking-wide">
                      Bundle
                    </span>
                    {discountPercent > 0 && (
                      <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col gap-3">
                    <h3 className="text-lg font-semibold text-black truncate">
                      {bundle.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {bundle.description ||
                        "Exclusive curated items in one pack."}
                    </p>

                    {/* Price */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-black">
                        ₹{bundlePrice.toLocaleString()}
                      </span>
                      <span className="line-through text-sm text-gray-400">
                        ₹{fakeOriginal.toLocaleString()}
                      </span>
                      {discountPercent > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-1 mb-3">
                      {(bundle.products || []).slice(0, 4).map((p) => (
                        <img
                          key={p._id}
                          src={p.images?.[0] || "/images/placeholder.png"}
                          alt={p.title}
                          className="w-10 h-10 rounded-md border border-gray-200 object-cover"
                        />
                      ))}
                      {bundle.products?.length > 4 && (
                        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                          +{bundle.products.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => openBundleModal(bundle)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50 transition"
                      >
                        View
                      </button>
                      <button
                        onClick={() => openBundleModal(bundle)}
                        className="flex-1 px-4 py-2.5 text-sm font-medium bg-black text-white rounded-full hover:bg-gray-900 transition"
                      >
                        Add Bundle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
     <Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="max-w-4xl w-full bg-white rounded-2xl p-6">
    {selectedBundle && (
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left: Images */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          {(selectedBundle.products || []).map((p) => (
            <img
              key={p._id}
              src={p.images?.[0] || "/images/placeholder.png"}
              alt={p.title}
              className="w-full h-40 object-cover rounded-lg border"
            />
          ))}
        </div>

        {/* Right: Info */}
        <div className="flex-1 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-black">
            {selectedBundle.title}
          </h2>
          <p className="text-sm text-gray-600">{selectedBundle.description}</p>

          {/* Product list with size dropdowns */}
          <div className="space-y-5 mt-4">
            {(selectedBundle.products || []).map((p) => (
              <div key={p._id} className="border-b pb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-black">{p.title}</span>
                  <span className="text-gray-900 font-semibold">
                    ₹{p.price.toLocaleString()}
                  </span>
                </div>

                {/* Size selection dropdown */}
                {p.sizes?.length > 0 ? (
                  <div className="mt-1">
                    <label className="text-xs text-gray-500">Select Size</label>
                    <select
                      value={selectedSizes[p._id] || ""}
                      onChange={(e) =>
                        handleSizeChange(p._id, e.target.value)
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black focus:border-black bg-white"
                    >
                      <option value="">Choose a size</option>
                      {p.sizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">
                    No size options
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Add to cart button */}
          <Button
            onClick={handleAddBundleToCart}
            className="mt-auto bg-black text-white hover:bg-gray-900 rounded-full py-3"
          >
            Add Bundle to Cart
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

    </div>
  );
};

export default BundlesPage;
