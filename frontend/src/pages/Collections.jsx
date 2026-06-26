import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import api  from "@/utils/config";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X,ChevronRight  } from "lucide-react";
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
   <div className="mb-14 md:mb-20">

  <p
    className="
      text-[11px]
      uppercase

      tracking-[0.45em]

      text-neutral-400

      mb-4
    "
  >
    Curated Collection
  </p>

  <div
    className="
      flex
      flex-col
      lg:flex-row

      lg:items-end
      lg:justify-between

      gap-6
    "
  >
    <div>

      <h1
        className="
          text-4xl
          md:text-6xl
          xl:text-7xl

          font-black

          tracking-tight

          leading-none
        "
      >
        GET THE
        <br />
        LOOK
      </h1>

      <p
        className="
          mt-5

          max-w-2xl

          text-base
          md:text-lg

          text-neutral-500

          leading-relaxed
        "
      >
        Complete outfits carefully curated by
        GARRIB. Save more when purchased as a
        complete look and discover pieces that
        are designed to work perfectly together.
      </p>

    </div>

<button
  onClick={() => navigate("/build-your-look")}
  className="
    self-start
    lg:self-auto

    px-5 py-3

    rounded-full

    bg-black
    text-white

    text-sm
    font-semibold

    transition-all duration-300

    hover:bg-neutral-800
  "
>
  Build Your Own Look →
</button>
  </div>

</div>

        {/* States */}
        {loading && (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-[28px] overflow-hidden border border-neutral-200 animate-pulse"
      >
        {/* Image */}
        <div className="h-[420px] md:h-[520px] bg-neutral-200" />

        {/* Content */}
        <div className="p-6 md:p-8">

          {/* Title */}
          <div className="h-3 w-24 bg-neutral-200 rounded mb-4" />

          <div className="h-8 w-3/4 bg-neutral-200 rounded mb-6" />

          {/* Price */}
          <div className="flex gap-3 mb-6">
            <div className="h-8 w-24 bg-neutral-200 rounded" />
            <div className="h-8 w-20 bg-neutral-100 rounded" />
          </div>

          {/* Description */}
          <div className="space-y-2 mb-6">
            <div className="h-3 bg-neutral-200 rounded" />
            <div className="h-3 bg-neutral-200 rounded w-5/6" />
            <div className="h-3 bg-neutral-200 rounded w-4/6" />
          </div>

          {/* Avatars */}
          <div className="flex -space-x-3 mb-6">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="w-14 h-14 rounded-2xl bg-neutral-200 border-2 border-white"
              />
            ))}
          </div>

          {/* Stats */}
          <div className="flex justify-between mb-6">
            <div>
              <div className="h-3 w-16 bg-neutral-200 rounded mb-2" />
              <div className="h-6 w-24 bg-neutral-200 rounded" />
            </div>

            <div>
              <div className="h-3 w-12 bg-neutral-200 rounded mb-2" />
              <div className="h-6 w-10 bg-neutral-200 rounded" />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <div className="flex-1 h-12 rounded-full bg-neutral-200" />
            <div className="flex-1 h-12 rounded-full bg-neutral-300" />
          </div>

        </div>
      </div>
    ))}
  </div>
)}
 

        {/* Grid */}
        {!loading && bundles.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {bundles.map((bundle) => {
              const total = bundle.products?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0;
              const bundlePrice = Number(bundle.price || total);
              const fakeOriginal = Math.round(bundlePrice / 0.7);
              const discountPercent = Math.round(((fakeOriginal - bundlePrice) / fakeOriginal) * 100);

              return (
             <Link
  key={bundle._id}
  to={`/collections/${bundle._id}`}
  className="group block"
>
  <article
    className="
      relative
      overflow-hidden
      rounded-[34px]
      bg-black
      h-[620px]
      shadow-sm
      transition-all
      duration-500
      hover:-translate-y-2
      hover:shadow-[0_25px_80px_rgba(0,0,0,.18)]
    "
  >

    {/* HERO IMAGE */}

    <img
      src={
        bundle.mainImages?.[0] ||
        bundle.products?.[0]?.images?.[0] ||
        "/images/placeholder.png"
      }
      alt={bundle.title}
      className="
        absolute
        inset-0
        h-full
        w-full
        object-cover
        transition-transform
        duration-700
        group-hover:scale-105
      "
    />

    {/* Overlay */}

    <div
      className="
        absolute
        inset-0
        bg-gradient-to-t
        from-black/85
        via-black/20
        to-transparent
      "
    />

    {/* Top Row */}

    <div
      className="
        absolute
        left-6
        right-6
        top-6
        flex
        items-center
        justify-between
      "
    >

      <span
        className="
          rounded-full
          bg-white
          px-4
          py-2
          text-[11px]
          font-bold
          uppercase
          tracking-[0.25em]
          text-black
        "
      >
        Bundle
      </span>

      {discountPercent > 0 && (

        <span
          className="
            rounded-full
            bg-lime-400
            px-4
            py-2
            text-[11px]
            font-bold
            uppercase
            text-black
          "
        >
          {discountPercent}% OFF
        </span>

      )}

    </div>

    {/* Bottom Content */}

    <div
      className="
        absolute
        bottom-0
        left-0
        right-0
        p-7
        text-white
      "
    >
      <p
  className="
    text-[11px]
    uppercase
    tracking-[0.45em]
    text-white/60
  "
>
  CURATED BUNDLE
</p>

<h2
  className="
    mt-3
    text-4xl
    md:text-5xl
    font-black
    leading-none
    max-w-[260px]
  "
>
  {bundle.title}
</h2>

{/* Price */}

<div className="mt-6 flex items-center flex-wrap gap-3">

  <span className="text-4xl font-black">
    ₹{bundlePrice.toLocaleString()}
  </span>

  <span className="text-lg text-white/50 line-through">
    ₹{fakeOriginal.toLocaleString()}
  </span>

  <span
    className="
      rounded-full
      bg-lime-400
      px-3
      py-2
      text-[11px]
      font-bold
      uppercase
      text-black
    "
  >
    SAVE {discountPercent}%
  </span>

</div>

{/* Description */}

<p
  className="
    mt-6
    max-w-[280px]
    text-sm
    leading-7
    text-white/75
  "
>
  {bundle.description ||
    "Premium pieces curated together for effortless everyday styling."}
</p>

{/* Bottom Row */}

<div className="mt-8 flex items-end justify-between">

  {/* Product Images */}

  <div>

    <div className="flex -space-x-4">

      {(bundle.products || [])
        .slice(0, 3)
        .map((p) => (

          <img
            key={p._id}
            src={p.images?.[0]}
            alt={p.title}
            className="
              h-14
              w-14
              rounded-full
              border-[3px]
              border-white
              object-cover
              shadow-lg
            "
          />

      ))}

      {bundle.products?.length > 3 && (

        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            border-[3px]
            border-white
            bg-black
            text-sm
            font-bold
          "
        >
          +{bundle.products.length - 3}
        </div>

      )}

    </div>

  </div>

  {/* Included */}

  <div className="text-right">

    <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">
      Included
    </p>

    <p className="mt-2 text-3xl font-black">
      {bundle.products?.length || 0}
    </p>

    <p className="text-sm text-white/70">
      Items
    </p>

  </div>

</div>
{/* CTA */}

<div className="mt-10 flex items-center justify-between">

  <button
    onClick={(e) => {
      e.preventDefault();
      openBundleModal(bundle);
    }}
    className="
      group/button

      flex
      items-center
      justify-center

      rounded-full

      bg-white

      px-8
      py-4

      text-sm
      font-black

      uppercase
      tracking-[0.25em]

      text-black

      transition-all
      duration-300

      hover:scale-105
    "
  >

    VIEW BUNDLE

  </button>

  <button
    onClick={(e) => {
      e.preventDefault();
      openBundleModal(bundle);
    }}
    className="
      group/arrow

      flex
      h-16
      w-16

      items-center
      justify-center

      rounded-full

      border
      border-white/30

      bg-white/10
      backdrop-blur-xl

      transition-all
      duration-300

      hover:bg-white
      hover:scale-110
    "
  >

    <ChevronRight
      size={26}
      className="
        text-white
        transition-all
        duration-300
        group-hover/arrow:text-black
        group-hover/arrow:translate-x-1
      "
    />

  </button>

</div>

</div>

</article>

</Link>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
};

export default BundlesPage;
