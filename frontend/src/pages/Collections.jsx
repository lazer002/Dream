import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { X, ChevronRight } from "lucide-react";
import { useCart } from "@/state/CartContext";
import { useGetBundlesQuery } from "@/store/api";

const BundlesPage = () => {
  const { addBundleToCart } = useCart();
  const navigate = useNavigate();

  const {
    data,
    isLoading: loading,
    isError,
    refetch,
  } = useGetBundlesQuery();

  const bundles = data?.items || data?.bundles || [];

  const [isOpen, setIsOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});

  const fmt = (v) =>
    Number(v || 0).toLocaleString("en-IN");

  const openBundleModal = (bundle) => {
    setSelectedBundle(bundle);

    const initialSizes = (bundle.products || []).reduce(
      (acc, product) => {
        acc[product._id] = "";
        return acc;
      },
      {}
    );

    setSelectedSizes(initialSizes);
    setIsOpen(true);
  };

  const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }));
  };

  const handleAddBundle = () => {
    if (!selectedBundle) return;

    addBundleToCart(
      selectedBundle,
      selectedSizes
    );

    setIsOpen(false);
    setSelectedBundle(null);
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 px-6 py-20 text-center">
        <p className="text-red-500 mb-4">
          Failed to load bundles.
        </p>

        <button
          onClick={refetch}
          className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* HEADER */}
        <div className="mb-14 md:mb-20">
          <p className="mb-4 text-[11px] uppercase tracking-[0.45em] text-neutral-400">
            Curated Collection
          </p>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-black leading-none tracking-tight md:text-6xl xl:text-7xl">
                GET THE
                <br />
                LOOK
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg">
                Complete outfits carefully curated by
                GARRIB. Save more when purchased as a
                complete look and discover pieces that
                are designed to work perfectly together.
              </p>
            </div>

            <button
              onClick={() =>
                navigate("/build-your-look")
              }
              className="
                self-start lg:self-auto
                rounded-full
                bg-black
                px-6 py-3
                text-sm font-semibold text-white
                transition-all duration-300
                hover:bg-neutral-800
                hover:scale-[1.02]
              "
            >
              Build Your Own Look →
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[34px] bg-white animate-pulse"
              >
                <div className="h-[620px] bg-neutral-200" />
              </div>
            ))}
          </div>
        )}

        {/* EMPTY */}
        {!loading && bundles.length === 0 && (
          <div className="rounded-[30px] border border-dashed border-neutral-300 bg-white py-24 text-center">
            <p className="text-neutral-500">
              No collections available right now.
            </p>
          </div>
        )}

        {/* BUNDLES */}
        {!loading && bundles.length > 0 && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {bundles.map((bundle) => {
              const image =
                bundle.mainImages?.[0] ||
                bundle.products?.find(
                  (p) => p.images?.length
                )?.images?.[0] ||
                "/images/placeholder.png";

              const oldPrice =
                Number(bundle.oldPrice || 0);

              const price =
                Number(bundle.price || 0);

              const savings =
                oldPrice > price
                  ? oldPrice - price
                  : 0;

              return (
                <Link
                  key={bundle.publicId}
                  to={`/collections/${bundle.publicId}`}
                  className="group block"
                >
                  <article
                    className="
                      relative
                      h-[620px]
                      overflow-hidden
                      rounded-[34px]
                      bg-black
                      shadow-sm
                      transition-all duration-500
                      hover:-translate-y-2
                      hover:shadow-[0_25px_80px_rgba(0,0,0,.18)]
                    "
                  >
                    {/* IMAGE */}
                    <img
                      src={image}
                      alt={bundle.title}
                      onError={(e) => {
                        e.currentTarget.src =
                          "/images/placeholder.png";
                      }}
                      className="
                        absolute inset-0
                        h-full w-full
                        object-cover
                        transition-transform duration-700
                        group-hover:scale-105
                      "
                    />

                    {/* OVERLAY */}
                    <div className="
                      absolute inset-0
                      bg-gradient-to-t
                      from-black via-black/40
                      to-transparent
                    " />

                    {/* TOP */}
                    <div className="
                      absolute left-6 right-6 top-6
                      flex items-center justify-between
                    ">
                      <span className="
                        rounded-full
                        bg-white
                        px-4 py-2
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-[0.25em]
                        text-black
                      ">
                        Bundle
                      </span>

                      {bundle.discount > 0 && (
                        <span className="
                          rounded-full
                          bg-lime-400
                          px-4 py-2
                          text-[11px]
                          font-bold
                          uppercase
                          text-black
                        ">
                          {Math.round(bundle.discount)}% OFF
                        </span>
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="
                      absolute
                      bottom-0 left-0 right-0
                      p-7
                      text-white
                    ">
                      <p className="
                        text-[11px]
                        uppercase
                        tracking-[0.45em]
                        text-white/60
                      ">
                        Curated Bundle
                      </p>

                      <h2 className="
                        mt-3
                        max-w-[280px]
                        text-4xl
                        font-black
                        leading-none
                        tracking-tight
                        md:text-5xl
                      ">
                        {bundle.title}
                      </h2>

                      {/* PRICE */}
                      <div className="
                        mt-6
                        flex flex-wrap
                        items-center
                        gap-3
                      ">
                        <span className="text-4xl font-black">
                          ₹{fmt(price)}
                        </span>

                        {oldPrice > price && (
                          <span className="
                            text-lg
                            text-white/50
                            line-through
                          ">
                            ₹{fmt(oldPrice)}
                          </span>
                        )}

                        {savings > 0 && (
                          <span className="
                            rounded-full
                            bg-lime-400
                            px-3 py-2
                            text-[11px]
                            font-bold
                            uppercase
                            text-black
                          ">
                            Save ₹{fmt(savings)}
                          </span>
                        )}
                      </div>

                      {/* DESCRIPTION */}
                      <p className="
                        mt-5
                        max-w-[300px]
                        text-sm
                        leading-7
                        text-white/70
                        line-clamp-2
                      ">
                        {bundle.description ||
                          "Premium pieces curated together for effortless everyday styling."}
                      </p>

                      {/* PRODUCTS */}
                      <div className="
                        mt-7
                        flex
                        items-end
                        justify-between
                      ">
                        <div className="flex -space-x-4">
                          {(bundle.products || [])
                            .slice(0, 4)
                            .map((product) => (
                              <img
                                key={product._id}
                                src={
                                  product.images?.[0] ||
                                  "/images/placeholder.png"
                                }
                                alt={product.title}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "/images/placeholder.png";
                                }}
                                className="
                                  h-14 w-14
                                  rounded-full
                                  border-[3px]
                                  border-white
                                  bg-neutral-200
                                  object-cover
                                  shadow-lg
                                "
                              />
                            ))}
                        </div>

                        <div className="text-right">
                          <p className="
                            text-[10px]
                            uppercase
                            tracking-[0.3em]
                            text-white/50
                          ">
                            Included
                          </p>

                          <p className="mt-1 text-3xl font-black">
                            {bundle.products?.length || 0}
                          </p>

                          <p className="text-xs text-white/60">
                            Items
                          </p>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="
                        mt-8
                        flex
                        items-center
                        justify-between
                      ">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openBundleModal(bundle);
                          }}
                          className="
                            rounded-full
                            bg-white
                            px-7 py-4
                            text-sm
                            font-black
                            uppercase
                            tracking-[0.2em]
                            text-black
                            transition-all duration-300
                            hover:scale-105
                            hover:bg-neutral-200
                          "
                        >
                          View Bundle
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openBundleModal(bundle);
                          }}
                          className="
                            flex h-14 w-14
                            items-center justify-center
                            rounded-full
                            border border-white/30
                            bg-white/10
                            backdrop-blur-xl
                            transition-all duration-300
                            hover:scale-110
                            hover:bg-white
                          "
                        >
                          <ChevronRight
                            size={25}
                            className="
                              text-white
                              transition-colors
                              group-hover:text-black
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

      {/* BUNDLE SIZE MODAL */}
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DialogContent className="max-w-2xl rounded-3xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="
                text-[10px]
                uppercase
                tracking-[0.3em]
                text-neutral-400
              ">
                Bundle
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {selectedBundle?.title}
              </h2>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="
                flex h-9 w-9
                items-center justify-center
                rounded-full
                hover:bg-neutral-100
              "
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {(selectedBundle?.products || []).map(
              (product) => {
                const sizes = Array.isArray(
                  product.sizes
                )
                  ? product.sizes
                  : [];

                return (
                  <div
                    key={product._id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      rounded-2xl
                      border
                      border-neutral-200
                      p-4
                    "
                  >
                    <div className="
                      flex
                      min-w-0
                      items-center
                      gap-3
                    ">
                      <img
                        src={
                          product.images?.[0] ||
                          "/images/placeholder.png"
                        }
                        alt={product.title}
                        className="
                          h-16 w-16
                          shrink-0
                          rounded-xl
                          object-cover
                        "
                      />

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {product.title}
                        </p>

                        <p className="
                          mt-1
                          text-xs
                          text-neutral-400
                        ">
                          ₹{fmt(product.price)}
                        </p>
                      </div>
                    </div>

                    <Select
                      value={
                        selectedSizes[product._id] || ""
                      }
                      onValueChange={(value) =>
                        handleSizeChange(
                          product._id,
                          value
                        )
                      }
                    >
                      <SelectTrigger className="w-[130px] rounded-xl">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>

                      <SelectContent>
                        {sizes.map((size) => {
                          const name =
                            typeof size === "string"
                              ? size
                              : size?.name;

                          if (!name) return null;

                          return (
                            <SelectItem
                              key={name}
                              value={name}
                            >
                              {name}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
            )}
          </div>

          <button
            onClick={handleAddBundle}
            disabled={
              !selectedBundle ||
              (selectedBundle.products || []).some(
                (p) => !selectedSizes[p._id]
              )
            }
            className="
              mt-6
              w-full
              rounded-full
              bg-black
              px-6 py-4
              text-sm
              font-bold
              uppercase
              tracking-[0.2em]
              text-white
              transition
              hover:bg-neutral-800
              disabled:cursor-not-allowed
              disabled:bg-neutral-300
            "
          >
            Add Bundle to Cart
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BundlesPage;