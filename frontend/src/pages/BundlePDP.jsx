// BundlePDP.jsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "@/utils/config";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  ShoppingCart,
  Heart,
  CreditCard,
  Gift,
} from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/state/CartContext";
import RelatedProducts from "@/components/RelatedProducts";
import RecentlyViewed from "@/components/RecentlyViewed";

export default function BundlePDP() {
  const { addBundleToCart } = useCart();
  const { publicId } = useParams();

  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({});

  const [showMagnifier, setShowMagnifier] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({
    x: 50,
    y: 50,
  });

  useEffect(() => {
    const fetchBundle = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/bundles/${publicId}`);

        setBundle(res.data);
      } catch (err) {
        console.error("GET BUNDLE ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBundle();
  }, [publicId]);

  const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }));
  };

  const getSizeName = (size) => {
    if (typeof size === "object" && size !== null) {
      return size.name;
    }

    return size;
  };

  const getSizeId = (size) => {
    if (typeof size === "object" && size !== null) {
      return size._id;
    }

    return size;
  };

  const getAvailableSizes = (product) => {
    return (product?.sizes || []).filter((size) => {
      if (typeof size === "object") {
        return size.active !== false;
      }

      return true;
    });
  };

  const isProductOutOfStock = (product) => {
    return product?.isOutOfStock === true;
  };

  const isBundleOutOfStock =
    bundle?.isOutOfStock === true ||
    bundle?.products?.some(isProductOutOfStock);

  const allSizesSelected =
    bundle?.products?.every(
      (product) =>
        isProductOutOfStock(product) ||
        selectedSizes[product._id]
    );

  const handleAddToCart = () => {
    if (isBundleOutOfStock) return;

    const missingSize = bundle.products.find(
      (product) =>
        !isProductOutOfStock(product) &&
        !selectedSizes[product._id]
    );

    if (missingSize) {
      alert(`Please select size for ${missingSize.title}`);
      return;
    }

    addBundleToCart(bundle, selectedSizes);
  };

  const images = bundle
    ? [
        ...new Set([
          ...(bundle.mainImages || []),
          ...bundle.products.flatMap((product) =>
            (product.images || []).slice(0, 2)
          ),
        ]),
      ]
    : [];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-gray-500">
          Loading bundle...
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-gray-500">
          Bundle not found.
        </div>
      </div>
    );
  }

  const discount =
    bundle.discount ??
    (bundle.oldPrice && bundle.price
      ? Math.round(
          ((bundle.oldPrice - bundle.price) /
            bundle.oldPrice) *
            100
        )
      : 0);

  return (
    <div>


    
   <div className="flex flex-col md:flex-row gap-12 p-6 relative mb-40 isolate">

      {/* ========================= */}
      {/* IMAGE SECTION */}
      {/* ========================= */}

<div className="md:w-[60%] md:sticky md:top-0 h-[100vh] flex flex-col justify-center relative z-10">
          <div className="flex flex-col gap-3 h-full justify-between">

          <div className="flex-1 flex gap-6 relative">

            <Card
              className="
                relative
                overflow-hidden
                border-0
                flex-1
                bg-[#f5f5f3]
                cursor-crosshair
              "
              onMouseEnter={() => {
                if (window.innerWidth < 1024) return;
                setShowMagnifier(true);
              }}
              onMouseLeave={() => {
                setShowMagnifier(false);
              }}
              onMouseMove={(e) => {
                if (window.innerWidth < 1024) return;

                const {
                  left,
                  top,
                  width,
                  height,
                } = e.currentTarget.getBoundingClientRect();

                const x =
                  ((e.clientX - left) / width) * 100;

                const y =
                  ((e.clientY - top) / height) * 100;

                setZoomPosition({
                  x,
                  y,
                });
              }}
            >
              <div
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${
                    activeImage * 100
                  }%)`,
                }}
              >
                {images.map((img, idx) => (
                  <img
                    key={`${img}-${idx}`}
                    src={img}
                    alt={`${bundle.title}-${idx}`}
                    className="
                      w-full
                      shrink-0
                      max-h-[55vh]
                      md:max-h-[82vh]
                      object-cover
                    "
                  />
                ))}
              </div>

              <div
                className="
                  absolute
                  bottom-3
                  right-3
                  bg-black/70
                  text-white
                  px-3 py-1
                  rounded-full
                  text-xs
                  md:hidden
                "
              >
                {activeImage + 1}/{images.length}
              </div>

              <div className="flex justify-center gap-2 mt-3 md:hidden">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setActiveImage(idx)
                    }
                    className={`h-2 rounded-full transition-all ${
                      activeImage === idx
                        ? "w-6 bg-black"
                        : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {showMagnifier && (
                <div
                  className="
                    absolute
                    z-10
                    w-60 h-60
                    border-2 border-black/20
                    bg-white/20
                    pointer-events-none
                    shadow-lg
                  "
                  style={{
                    left: `calc(${zoomPosition.x}% - 80px)`,
                    top: `calc(${zoomPosition.y}% - 80px)`,
                  }}
                />
              )}
            </Card>

            {/* Zoom */}
          <div
  className={`
    hidden xl:block
    absolute
    left-[calc(100%+24px)]
    top-0
    w-[620px]
    h-[620px]
    overflow-hidden
    bg-[#f5f5f3]
    border border-gray-200
    shadow-2xl
    z-20
    pointer-events-none
    transition-all duration-300
    ${
      showMagnifier
        ? "opacity-100"
        : "opacity-0"
    }
  `}
>
              <div
                className="w-full h-full bg-no-repeat"
                style={{
                  backgroundImage: `url(${images[activeImage]})`,
                  backgroundSize: "250%",
                  backgroundPosition: `
                    ${Math.min(
                      Math.max(
                        zoomPosition.x,
                        15
                      ),
                      85
                    )}%
                    ${Math.min(
                      Math.max(
                        zoomPosition.y,
                        15
                      ),
                      85
                    )}%
                  `,
                }}
              />
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
            {images.map((img, idx) => (
              <img
                key={`${img}-${idx}`}
                src={img}
                alt={`${bundle.title}-${idx}`}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer flex-shrink-0 border transition ${
                  activeImage === idx
                    ? "border-black"
                    : "border-gray-200"
                }`}
                onClick={() =>
                  setActiveImage(idx)
                }
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========================= */}
      {/* DETAILS */}
      {/* ========================= */}

      <div className="md:w-[40%] flex flex-col pr-2">

        <div className="flex items-center gap-2 mb-3">

          {bundle.isNewBundle && (
            <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-bold tracking-wider">
              NEW
            </span>
          )}

          {bundle.onSale && discount > 0 && (
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold tracking-wider">
              {discount}% OFF
            </span>
          )}

          {isBundleOutOfStock && (
            <span className="px-3 py-1 rounded-full bg-gray-800 text-white text-xs font-bold tracking-wider">
              SOLD OUT
            </span>
          )}
        </div>

        <h1 className="text-[44px] font-bold text-gray-900">
          {bundle.title}
        </h1>

        <p className="text-[19px] text-gray-700 leading-relaxed">
          {bundle.description ||
            "Check out this curated bundle of products for a complete style upgrade!"}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-3 mt-4 flex-wrap">

          <span className="text-[30px] font-bold">
            ₹ {Number(bundle.price || 0).toFixed(2)}
          </span>

          {bundle.oldPrice &&
            bundle.oldPrice > bundle.price && (
              <span className="text-xl line-through text-gray-500">
                ₹{" "}
                {Number(bundle.oldPrice).toFixed(2)}
              </span>
            )}

          {discount > 0 && (
            <span className="text-[21px] font-semibold text-red-600">
              {discount}% OFF
            </span>
          )}
        </div>

        <span className="text-green-700 text-[19px] mt-1">
          Inclusive of all taxes
        </span>

        {/* ========================= */}
        {/* PRODUCTS */}
        {/* ========================= */}

      {/* ========================= */}
{/* PRODUCTS / SIZE SELECTION */}
{/* ========================= */}

<div className="mt-8">
  <div className="flex items-center justify-between mb-4">
    <div>
      <h2 className="text-lg font-semibold text-gray-900">
        Choose your sizes
      </h2>

      <p className="text-sm text-gray-500 mt-1">
        Select a size for each item in this bundle
      </p>
    </div>

    <span className="text-xs text-gray-400">
      {
        Object.keys(selectedSizes).filter(
          (id) => selectedSizes[id]
        ).length
      }{" "}
      / {bundle.products.length} selected
    </span>
  </div>

  <div className="space-y-4">
    {bundle.products.map((product, index) => {
      const sizes = getAvailableSizes(product);
      const outOfStock = isProductOutOfStock(product);
      const selectedSize = selectedSizes[product._id];

      return (
        <div
          key={product._id}
          className={`
            rounded-2xl
            border
            overflow-hidden
            transition-all
            duration-200
            ${
              outOfStock
                ? "border-gray-200 bg-gray-50"
                : selectedSize
                ? "border-black bg-white shadow-sm"
                : "border-gray-200 bg-white"
            }
          `}
        >
          {/* PRODUCT HEADER */}
          <div className="flex items-center gap-4 p-4">
            <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              <img
                src={
                  product.images?.[0] ||
                  "/images/placeholder.png"
                }
                alt={product.title}
                className={`
                  w-full h-full object-cover
                  ${outOfStock ? "grayscale opacity-60" : ""}
                `}
              />

              <div className="absolute top-1.5 left-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white text-xs font-semibold">
                  {index + 1}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {product.title}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                ₹{Number(product.price || 0).toLocaleString("en-IN")}
              </p>

              {outOfStock ? (
                <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">
                  Out of stock
                </span>
              ) : selectedSize ? (
                <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-black text-white text-xs font-medium">
                  Size {selectedSize}
                </span>
              ) : (
                <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                  Size required
                </span>
              )}
            </div>
          </div>

          {/* SIZE AREA */}
          {!outOfStock && (
            <div className="border-t border-gray-100 px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900">
                  Select size
                </span>

                {selectedSize && (
                  <button
                    type="button"
                    onClick={() =>
                      handleSizeChange(product._id, "")
                    }
                    className="text-xs text-gray-500 hover:text-black underline underline-offset-2"
                  >
                    Clear
                  </button>
                )}
              </div>

              {sizes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const sizeName = getSizeName(size);
                    const sizeId = getSizeId(size);

                    const active =
                      selectedSize === sizeName;

                    return (
                      <button
                        key={sizeId || sizeName}
                        type="button"
                        onClick={() =>
                          handleSizeChange(
                            product._id,
                            sizeName
                          )
                        }
                        className={`
                          relative
                          min-w-[58px]
                          h-11
                          px-4
                          rounded-xl
                          border
                          text-sm
                          font-semibold
                          transition-all
                          duration-200
                          ${
                            active
                              ? "border-black bg-black text-white shadow-md scale-[1.02]"
                              : "border-gray-200 bg-white text-gray-800 hover:border-black hover:bg-gray-50"
                          }
                        `}
                      >
                        {sizeName}

                        {active && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black border-2 border-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-500">
                  No sizes available for this product.
                </div>
              )}
            </div>
          )}

          {/* SOLD OUT */}
          {outOfStock && (
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600 font-medium">
                  This item is currently unavailable
                </span>

                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Sold Out
                </span>
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>

        <Separator className="my-6" />

        {/* ========================= */}
        {/* BUTTONS */}
        {/* ========================= */}

        <div className="flex flex-col gap-3">

          <div className="flex gap-3">

            <Button
              disabled={
                isBundleOutOfStock ||
                !allSizesSelected
              }
              className="
                w-1/2
                flex
                items-center
                justify-center
                gap-2
                text-xl
                py-6
              "
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {isBundleOutOfStock
                ? "Sold Out"
                : "Add to Cart"}
            </Button>

            <Button
              variant="outline"
              className="
                w-1/2
                flex
                items-center
                justify-center
                gap-2
                border-black
                text-black
                hover:bg-pink-50
                text-xl
                py-6
              "
              onClick={() =>
                setWishlisted(!wishlisted)
              }
            >
              <Heart
                className={`w-5 h-5 ${
                  wishlisted
                    ? "fill-black text-black"
                    : ""
                }`}
              />
              Wishlist
            </Button>

          </div>

          <Button
            disabled={
              isBundleOutOfStock ||
              !allSizesSelected
            }
            variant="outline"
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              border-brand-600
              text-brand-600
              hover:bg-brand-50
              text-xl
              py-6
            "
          >
            <CreditCard className="w-5 h-5" />
            Buy Now
          </Button>

        </div>

        {/* ========================= */}
        {/* OFFERS */}
        {/* ========================= */}

        <div className="flex flex-col gap-3 mt-6">

          {[
            "EXTRA 10% OFF ON PURCHASE OF ₹ 2999",
            "EXTRA 10% OFF ON PURCHASE OF ₹ 3299",
          ].map((offer, idx) => (
            <div
              key={idx}
              className="
                border
                rounded-lg
                p-3
                flex
                items-center
                gap-3
                hover:bg-gray-50
                transition
              "
            >
              <div className="p-2 bg-brand-100 rounded-full">
                <Gift className="w-6 h-6 text-brand-600" />
              </div>

              <p className="text-[16px] font-medium text-gray-800">
                {offer}
              </p>
            </div>
          ))}

        </div>

        {/* ========================= */}
        {/* ACCORDION */}
        {/* ========================= */}

        <Accordion
          type="single"
          collapsible
          className="text-xl w-full mt-6"
        >

          <AccordionItem value="description">
            <AccordionTrigger>
              DESCRIPTION
            </AccordionTrigger>

            <AccordionContent>
              <p className="text-gray-700 text-base leading-relaxed">
                {bundle.description ||
                  "A thoughtfully curated bundle that brings comfort, style, and quality together."}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="details">
            <AccordionTrigger>
              PRODUCT DETAILS & CARE
            </AccordionTrigger>

            <AccordionContent>
              <div className="space-y-4">

                {bundle.products.map((product) => (
                  <div key={product._id}>
                    <p className="font-medium text-gray-900">
                      {product.title}
                    </p>

                    <ul className="text-gray-700 text-base list-disc pl-5 mt-1">
                      {product.fabric && (
                        <li>
                          Fabric: {product.fabric}
                        </li>
                      )}

                      {product.fit && (
                        <li>
                          Fit: {product.fit}
                        </li>
                      )}

                      {product.care && (
                        <li>
                          Care: {product.care}
                        </li>
                      )}
                    </ul>
                  </div>
                ))}

              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="shipping">
            <AccordionTrigger>
              SHIPPING & PAYMENT
            </AccordionTrigger>

            <AccordionContent>
              <p className="text-gray-700 text-base">
                <strong>Shipping:</strong>{" "}
                Metros 2–4 days • Rest of India
                3–6 days
                <br />
                <strong>Payment:</strong>{" "}
                Credit/Debit Cards, UPI, Net
                Banking & Wallets.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="returns">
            <AccordionTrigger>
              RETURN & EXCHANGE
            </AccordionTrigger>

            <AccordionContent>
              <p className="text-gray-700 text-base">
                Returns accepted only for
                defective or incorrect items.
                Exchange available within 7
                days of delivery.
                <br />
                For support, contact{" "}
                <strong>
                  urbanfits519@gmail.com
                </strong>.
              </p>
            </AccordionContent>
          </AccordionItem>

        </Accordion>

      </div>
      </div>
<RelatedProducts
  type="bundle"
  publicId={publicId}
/>

<RecentlyViewed currentProduct={bundle}  type="bundle" />
    </div>
  );
}