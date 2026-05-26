import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import api  from "@/utils/config";
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
        {loading && <div className="text-gray-500 text-center py-20">Loading...</div>}
        {error && <div className="text-red-500 text-center py-20">{error}</div>}
        {!loading && !error && bundles.length === 0 && (
          <div className="text-gray-500 text-center py-20">No bundles available yet.</div>
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
                <Link key={bundle._id} to={`/collections/${bundle._id}`}>
              <div
  key={bundle._id}
  className="
    group

    bg-white

    rounded-[28px]

    overflow-hidden

    border border-neutral-200

    transition-all duration-500

    hover:-translate-y-1
    hover:shadow-2xl
  "
>
  {/* HERO IMAGE */}
  <div className="relative overflow-hidden">
    <img
      src={
        bundle.mainImages?.[0] ||
        bundle.products?.[0]?.images?.[0] ||
        "/images/placeholder-800.png"
      }
      alt={bundle.title}
      className="
        w-full

        h-[420px]
        md:h-[520px]

        object-cover

        transition-transform
        duration-700

        group-hover:scale-105
      "
    />

    {/* DARK OVERLAY */}
    <div
      className="
        absolute inset-0

        bg-gradient-to-t
        from-black/70
        via-black/20
        to-transparent
      "
    />

    {/* TOP BADGE */}
    <div
      className="
        absolute

        top-5
        left-5

        bg-white/95
        backdrop-blur-md

        rounded-full

        px-4 py-2

        text-[11px]
        font-bold

        uppercase
        tracking-[0.25em]
      "
    >
      GET THE LOOK
    </div>

    {/* BOTTOM CONTENT */}
    <div
      className="
        absolute

        bottom-0
        left-0
        right-0

        p-6
        md:p-8

        text-white
      "
    >
      <p
        className="
          text-xs

          uppercase

          tracking-[0.3em]

          text-white/70

          mb-3
        "
      >
        Curated Outfit
      </p>

      <h3
        className="
          text-2xl
          md:text-4xl

          font-black

          tracking-tight

          mb-4
        "
      >
        {bundle.title}
      </h3>

      <div className="flex items-center gap-3">
        <span
          className="
            text-2xl
            md:text-3xl

            font-black
          "
        >
          ₹{bundlePrice.toLocaleString()}
        </span>

        <span
          className="
            line-through

            text-white/60
          "
        >
          ₹{fakeOriginal.toLocaleString()}
        </span>
      </div>
    </div>
  </div>

  {/* BODY */}
  <div className="p-6 md:p-8">

    {/* DESCRIPTION */}
    <p
      className="
        text-neutral-500

        leading-relaxed

        mb-6
      "
    >
      {bundle.description ||
        "A complete outfit curated by GARRIB stylists for effortless everyday wear."}
    </p>

    {/* INCLUDED PRODUCTS */}
    <div className="mb-6">
      <p
        className="
          text-xs

          uppercase

          tracking-[0.25em]

          text-neutral-400

          mb-3
        "
      >
        Included Pieces
      </p>

      <div className="flex -space-x-3">
        {(bundle.products || [])
          .slice(0, 5)
          .map((p) => (
            <img
              key={p._id}
              src={
                p.images?.[0] ||
                "/images/placeholder.png"
              }
              alt={p.title}
              className="
                w-14 h-14

                rounded-2xl

                border-2
                border-white

                object-cover

                shadow-sm
              "
            />
          ))}
      </div>
    </div>

    {/* SAVINGS */}
    <div
      className="
        flex items-center
        justify-between

        mb-6
      "
    >
      <div>
        <p
          className="
            text-xs

            uppercase

            tracking-[0.2em]

            text-neutral-400
          "
        >
          Savings
        </p>

        <p
          className="
            text-lg

            font-bold

            text-green-600
          "
        >
          Save ₹
          {(
            fakeOriginal -
            bundlePrice
          ).toLocaleString()}
        </p>
      </div>

      <div>
        <p
          className="
            text-xs

            uppercase

            tracking-[0.2em]

            text-neutral-400
          "
        >
          Items
        </p>

        <p
          className="
            text-lg

            font-bold
          "
        >
          {bundle.products?.length || 0}
        </p>
      </div>
    </div>

    {/* ACTIONS */}
    <div className="flex gap-3">
      <button
        onClick={() =>
          navigate(`/collections/${bundle._id}`)
        }
        className="
          flex-1

          border
          border-black

          py-3

          rounded-full

          text-sm
          font-semibold

          transition

          hover:bg-black
          hover:text-white
        "
      >
        VIEW LOOK
      </button>

      <button
        onClick={() =>
          openBundleModal(bundle)
        }
        className="
          flex-1

          bg-black
          text-white

          py-3

          rounded-full

          text-sm
          font-semibold

          transition

          hover:bg-neutral-800
        "
      >
        ADD COMPLETE LOOK
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


    </div>
  );
};

export default BundlesPage;
