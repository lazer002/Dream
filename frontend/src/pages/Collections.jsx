import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { api } from "@/utils/config";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X } from "lucide-react";
import { useCart } from "@/state/CartContext";

const BundlesPage = () => {
  const { addBundleToCart } = useCart();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const bundleAbortRef = useRef(null);
  const navigate = useNavigate();

  const fmt = (v) => Number(v || 0).toLocaleString();

  // Fetch bundles
  const fetchBundles = async () => {
    if (bundleAbortRef.current) {
      try {
        bundleAbortRef.current.abort();
      } catch {}
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
    return () => {
      try {
        bundleAbortRef.current?.abort();
      } catch {}
    };
  }, []);

  const openBundleModal = (bundle) => {
    setSelectedBundle(bundle);
    const initialSizes = (bundle.products || []).reduce((acc, p) => {
      acc[p._id] = ""; // no preselection
      return acc;
    }, {});
    setSelectedSizes(initialSizes);
    setIsOpen(true);
  };

  const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddBundle = () => {
    if (!selectedBundle) return;
    addBundleToCart(selectedBundle,selectedSizes);
    setIsOpen(false);
  };

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
        {loading && <div className="text-gray-500 text-center py-20">Loading...</div>}
        {error && <div className="text-red-500 text-center py-20">{error}</div>}
        {!loading && !error && bundles.length === 0 && (
          <div className="text-gray-500 text-center py-20">No bundles available yet.</div>
        )}

        {/* Grid */}
        {!loading && bundles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {bundles.map((bundle) => {
              const total = bundle.products?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0;
              const bundlePrice = Number(bundle.price || total);
              const fakeOriginal = Math.round(bundlePrice / 0.7);
              const discountPercent = Math.round(((fakeOriginal - bundlePrice) / fakeOriginal) * 100);

              return (
                <Link key={bundle._id} to={`/collections/${bundle._id}`}>
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
                      {bundle.description || "Exclusive curated items in one pack."}
                    </p>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold text-black">₹{bundlePrice.toLocaleString()}</span>
                      <span className="line-through text-sm text-gray-400">₹{fakeOriginal.toLocaleString()}</span>
                      {discountPercent > 0 && (
                        <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <div className="flex gap-1 mb-3">
                      {(bundle.products || []).slice(0, 4).map((p) => (
                        <img
                          key={p._id}
                          src={p.images?.[0] || "/images/placeholder.png"}
                          alt={p.title}
                          className="w-10 h-10 rounded-md border border-gray-200 object-cover"
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/collections/${bundle._id}`)}
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
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL --- */}
<Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); }}>
  <DialogContent className="max-w-3xl w-full bg-white  p-6 relative ">
    {/* Close X */}
    <button
      onClick={() => {
        setIsOpen(false);
      
      }}
      aria-label="Close"
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center  hover:bg-gray-100 transition"
    >
    <X className="w-5 h-5 text-gray-600" />
    </button>

    {/* Top header: title + price + small see details */}
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <img
          src={selectedBundle?.mainImages?.[0] || selectedBundle?.products?.[0]?.images?.[0] || "/images/placeholder.png"}
          alt={selectedBundle?.title}
          className="w-14 h-14 object-cover rounded-md border"
        />
        <div>
          <h3 className="text-lg font-semibold">{selectedBundle?.title}</h3>
          <div className="text-sm text-gray-700 font-semibold">₹{fmt(selectedBundle?.price || selectedBundle?.bundlePrice || 0)}</div>
          <button
            onClick={() => selectedBundle && navigate(`/collections/${selectedBundle._id}`)}
            className="text-xs text-gray-500 underline mt-1"
          >
            See Details
          </button>
        </div>
      </div>

      <div className="text-right text-gray-500 text-sm"></div>
    </div>

    {/* Main row: product cards side-by-side with + in the middle */}
    <div className="w-full bg-white border-t border-b py-6 px-2 mb-6 relative  overflow-y-auto h-[300px]">
   <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start justify-between relative">
  {(selectedBundle?.products || []).map((p, idx) => (
    <div
      key={p._id}
      className="bg-white flex flex-col sm:flex-row gap-4 items-start"
    >
      {/* product image */}
      <div className="w-full sm:w-44 flex-shrink-0">
        <img
          src={p.images?.[0] || "/images/placeholder.png"}
          alt={p.title}
          className="w-full h-44 object-cover rounded-md border"
        />
      </div>

      {/* product meta + select */}
      <div className="flex-1">
          
            <div className="text-sm font-semibold text-black">{p.title}</div>
            
          
          <div className="text-sm font-semibold text-gray-900">
            ₹{fmt(p.price)}
          </div>

        {/* size guide + size select */}
        <div className="mt-4">
       

          {/* Hardcoded sizes Select */}
          <div className="mt-24 max-w-xs">
         
         <Select
                    value={selectedSizes[p._id] ?? ""}
                    onValueChange={(val) => handleSizeChange(p._id, val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
          </div>
        </div>
      </div>
    </div>
  ))}

 
</div>

    </div>

    {/* Quantity + CTA row */}
    <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
      {/* left: quantity control */}
     

      {/* CTA */}
      <div className="w-full sm:w-1/3">
        <button
          onClick={handleAddBundle}
          className="w-full  text-white py-3  font-semibold bg-black transition"
        >
          Add To Cart
        </button>
      </div>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
};

export default BundlesPage;
