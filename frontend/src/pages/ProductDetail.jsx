// src/pages/ProductDetail.jsx

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCart } from "../state/CartContext.jsx";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RecentlyViewed from "@/components/RecentlyViewed";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ShoppingCart,
  Heart,
  CreditCard,
  Gift,
} from "lucide-react";
import toast from "react-hot-toast";
import { useWishlist } from "../state/WishlistContext.jsx";
import RelatedProducts from "@/components/RelatedProducts.jsx";

import {
  useGetProductQuery,
  useGetRelatedProductsQuery,
} from "@/store/api";

export default function ProductDetail() {
  const { wishlist, addToWishlist, removeFromWishlist } =
    useWishlist();

  const { publicId } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();

  // =====================================================
  // REDUX API
  // =====================================================

  const {
    data: product,
    isLoading: loading,
    isFetching: productFetching,
    isError: productError,
  } = useGetProductQuery(publicId, {
    skip: !publicId,
  });

  const {
    data: relatedData,
    isLoading: relatedLoading,
  } = useGetRelatedProductsQuery(
    {
      type: "product",
      publicId,
    },
    {
      skip: !publicId,
    }
  );

  const recommendedProducts =
    relatedData?.products ||
    relatedData?.items ||
    [];

  // =====================================================
  // STATE
  // =====================================================

  const [selectedSize, setSelectedSize] =
    useState("");

  const [activeImage, setActiveImage] =
    useState(0);

  const [openZoom, setOpenZoom] =
    useState(false);

  const [showMagnifier, setShowMagnifier] =
    useState(false);

  const [showRequest, setShowRequest] =
    useState(false);

  const [request, setRequest] = useState({
    email: "",
    size: "",
  });

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const [zoomPosition, setZoomPosition] =
    useState({
      x: 50,
      y: 50,
    });

  // =====================================================
  // RESET WHEN PRODUCT CHANGES
  // =====================================================

  useEffect(() => {
    setActiveImage(0);
    setSelectedSize("");
  }, [publicId]);

  // =====================================================
  // PRODUCT REQUEST
  // =====================================================

  const handleRequestSubmit = async () => {
    if (!request.email || !request.size) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const { default: api } = await import(
        "@/utils/config"
      );

      await api.post("/product-request", {
        productId: product.publicId,
        email: request.email,
        size: request.size,
      });

      toast.success(
        "We’ll notify you when available 🚀"
      );

      setShowRequest(false);

      setRequest({
        email: "",
        size: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to send request");
    }
  };

  // =====================================================
  // PRODUCT NOT FOUND
  // =====================================================

  if (!loading && (!product || productError)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div
            className="
              mx-auto mb-6
              w-24 h-24
              rounded-full
              bg-gray-100
              flex items-center justify-center
            "
          >
            <span className="text-4xl">
              📦
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Product Not Found
          </h1>

          <p className="text-gray-500 mb-8">
            The product you're looking for may have
            been removed, renamed, or is temporarily
            unavailable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="
                px-6 py-3
                border border-gray-300
                rounded-xl
                hover:bg-gray-50
                transition
              "
            >
              Go Back
            </button>

            <button
              onClick={() =>
                navigate("/products")
              }
              className="
                px-6 py-3
                bg-black
                text-white
                rounded-xl
                hover:bg-neutral-800
                transition
              "
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="px-4 py-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 animate-pulse">
          <div className="w-full md:w-1/2 flex flex-col-reverse md:flex-row gap-4">
            <div className="flex md:flex-col gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="
                    w-16 h-20
                    md:w-20 md:h-24
                    rounded-lg
                    bg-gray-200
                  "
                />
              ))}
            </div>

            <div
              className="
                flex-1
                rounded-2xl
                bg-gray-200
                h-[55vh]
                md:h-[82vh]
              "
            />
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-5">
            <div className="space-y-3">
              <div className="h-10 w-4/5 bg-gray-200 rounded-lg" />
              <div className="h-10 w-2/3 bg-gray-200 rounded-lg" />
            </div>

            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-[95%] bg-gray-200 rounded" />
              <div className="h-4 w-[80%] bg-gray-200 rounded" />
            </div>

            <div className="flex gap-3 items-center">
              <div className="h-8 w-28 bg-gray-200 rounded" />
              <div className="h-6 w-20 bg-gray-200 rounded" />
              <div className="h-6 w-16 bg-gray-200 rounded" />
            </div>

            <div className="h-5 w-40 bg-gray-200 rounded" />

            <div>
              <div className="h-6 w-24 bg-gray-200 rounded mb-4" />

              <div className="flex gap-3 flex-wrap">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="
                      w-12 h-12
                      md:w-14 md:h-14
                      rounded-full
                      bg-gray-200
                    "
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3 mt-2">
              <div className="h-14 rounded-xl bg-gray-200" />
              <div className="h-14 rounded-xl bg-gray-200" />
              <div className="h-14 rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // TOUCH
  // =====================================================

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current =
      e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEndX.current =
      e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (
      !touchStartX.current ||
      !touchEndX.current
    ) {
      return;
    }

    const distance =
      touchStartX.current -
      touchEndX.current;

    if (distance > minSwipeDistance) {
      nextImage();
    }

    if (distance < -minSwipeDistance) {
      prevImage();
    }
  };

  // =====================================================
  // IMAGES
  // =====================================================

  const images =
    Array.isArray(product?.images) &&
    product.images.length
      ? product.images
      : ["/images/placeholder.png"];

  const imageCount = images.length;

  const nextImage = () => {
    if (imageCount <= 1) return;

    setActiveImage(
      (prev) =>
        (prev + 1) % imageCount
    );
  };

  const prevImage = () => {
    if (imageCount <= 1) return;

    setActiveImage(
      (prev) =>
        (prev - 1 + imageCount) %
        imageCount
    );
  };

  // =====================================================
  // PRICE
  // =====================================================

  const price = Number(
    product?.price ?? 0
  );

  const mrp = price * 1.2;

  // =====================================================
  // SIZES / STOCK
  // =====================================================

  const activeSizes =
    product?.sizes?.filter(
      (size) => size.active !== false
    ) || [];

  const getSizeQty = (name) =>
    Number(
      product?.inventory?.[name] ??
        product?.inventory?.stock?.[name] ??
        0
    );

  const availableSizes =
    activeSizes.filter(
      ({ name }) =>
        getSizeQty(name) > 0
    );

  const isOutOfStock =
    activeSizes.length > 0 &&
    availableSizes.length === 0;

  // =====================================================
  // ADD TO CART
  // =====================================================

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }

    if (
      availableSizes.length > 0 &&
      !selectedSize
    ) {
      toast.error(
        "Please select a size before adding to cart."
      );
      return;
    }

    add(
      product.publicId,
      selectedSize || null
    );
  };

  // =====================================================
  // BUY NOW
  // =====================================================

  const handleBuyNow = () => {
    if (isOutOfStock) {
      toast.error("Product is out of stock");
      return;
    }

    if (
      availableSizes.length > 0 &&
      !selectedSize
    ) {
      toast.error(
        "Please select a size before buying."
      );
      return;
    }

    add(
      product.publicId,
      selectedSize || null
    );

    navigate("/checkout");
  };

  // =====================================================
  // WISHLIST
  // =====================================================

  const productId = String(
    product.publicId 
  );

  const wishlisted =
    wishlist.includes(productId);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();

    wishlisted
      ? removeFromWishlist(productId)
      : addToWishlist(productId);
  };

  return (
    <>
      <div
        className="
    flex flex-col
    md:flex-row

    gap-6 md:gap-12

    px-4 py-4 md:p-6

    relative
    items-start
  "
      >
        {/* Left: Images */}
        <div
          className="
   w-full
    md:w-1/2
    flex
    flex-col-reverse
    md:flex-row
    gap-4
    md:sticky
    md:top-24
    self-start
    h-fit
    relative
    z-[100]
  "
        >

          {/* THUMBNAILS */}
          <div
            className="
    flex
    md:flex-col

    gap-3

    overflow-x-auto
    md:overflow-visible

    pb-2
  "
          >
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.title} ${idx}`}

                onClick={() => setActiveImage(idx)}

                className={`
       w-16 h-20
md:w-20 md:h-24

flex-shrink-0

          object-cover

          rounded-md

          cursor-pointer

          border

          transition-all duration-300

          ${activeImage === idx
                    ? "border-black opacity-100"
                    : "border-gray-200 opacity-60 hover:opacity-100"
                  }
        `}
              />
            ))}
          </div>

          {/* MAIN IMAGE + MAGNIFIER */}
          <div
            className="
      flex-1
      flex gap-6
      relative
    "

          >

            {/* MAIN IMAGE */}
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

              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseMove={(e) => {
                if (window.innerWidth < 1024) return;
                const {
                  left,
                  top,
                  width,
                  height,
                } =
                  e.currentTarget.getBoundingClientRect()

                const x =
                  ((e.clientX - left) / width) * 100

                const y =
                  ((e.clientY - top) / height) * 100

                setZoomPosition({ x, y })

              }}
            >

              <div
                className="flex h-full transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${activeImage * 100}%)`,
                }}
              >
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${product.title}-${idx}`}
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
    backdrop-blur-sm

    text-white

    px-3 py-1

    rounded-full

    text-xs

    md:hidden
  "
              >
                {activeImage + 1}/{images.length}
              </div>
              {/* MAGNIFIER LENS */}
              <div className="flex justify-center gap-2 mt-3 md:hidden">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`
        h-2 rounded-full transition-all
        ${activeImage === idx
                        ? "w-6 bg-black"
                        : "w-2 bg-gray-300"
                      }
      `}
                  />
                ))}
              </div>
              {showMagnifier && (
                <div
                  className="
      absolute
      z-[999]

      w-60 h-60

      border-2 border-black/30

      bg-White/20

      pointer-events-none

      shadow-lg
    "
                  style={{
                    left: `${Math.min(Math.max(zoomPosition.x, 12), 88)}%`,
                    top: `${Math.min(Math.max(zoomPosition.y, 12), 88)}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                />
              )}
            </Card>



            {/* ZOOM PREVIEW */}
            <div
              className={`
  hidden xl:block

  absolute

  left-[calc(100%+24px)]
  top-0

  isolate

        w-[620px]
        h-[620px]

        overflow-hidden

        bg-[#f5f5f3]

        border border-gray-200

        shadow-2xl

        z-[44444]

        transition-all duration-300

        ${showMagnifier
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-3 pointer-events-none"
                }
      `}
              onMouseEnter={() => {
                setShowMagnifier(false);
              }}
            >

              <div
                className="
          w-full h-full

          bg-no-repeat
        "

                style={{
                  backgroundImage: `url(${images[activeImage]})`,
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "250%",

                  backgroundPosition: `
  ${Math.min(Math.max(zoomPosition.x, 15), 85)}%
  ${Math.min(Math.max(zoomPosition.y, 15), 85)}%
`,
                }}
              />

            </div>

          </div>

        </div>

        {/* Right: Info */}
        <div className="md:w-1/2 flex flex-col gap-4 " >
          <h1 className="text-[30px] md:text-[44px] leading-tight font-bold text-gray-900">{product.title}</h1>

<div
  className="
    text-base
    md:text-[19px]
    text-gray-700
    leading-relaxed

    [&_p]:mb-4
    [&_p:last-child]:mb-0

    [&_strong]:block
    [&_strong]:mt-6
    [&_strong]:mb-2
    [&_strong]:font-semibold
    [&_strong]:text-gray-900

    [&_h1]:text-2xl
    [&_h1]:font-bold
    [&_h1]:text-gray-900
    [&_h1]:mt-6
    [&_h1]:mb-3

    [&_h2]:text-xl
    [&_h2]:font-semibold
    [&_h2]:text-gray-900
    [&_h2]:mt-6
    [&_h2]:mb-3

    [&_h3]:text-lg
    [&_h3]:font-semibold
    [&_h3]:text-gray-900
    [&_h3]:mt-5
    [&_h3]:mb-2

    [&_ul]:list-disc
    [&_ul]:pl-6
    [&_ul]:my-3

    [&_ol]:list-decimal
    [&_ol]:pl-6
    [&_ol]:my-3

    [&_li]:mb-1

    [&_a]:underline
    [&_a]:underline-offset-2
    [&_a]:hover:text-black

    [&_em]:italic

    [&_u]:underline

    [&_blockquote]:border-l-4
    [&_blockquote]:border-gray-300
    [&_blockquote]:pl-4
    [&_blockquote]:my-4
    [&_blockquote]:italic
    [&_blockquote]:text-gray-500

    [&_hr]:my-6
    [&_hr]:border-gray-200

    [&_img]:max-w-full
    [&_img]:rounded-xl
    [&_img]:my-4

    [&_table]:w-full
    [&_table]:my-4
    [&_table]:border-collapse

    [&_th]:border
    [&_th]:border-gray-200
    [&_th]:p-2
    [&_th]:font-semibold
    [&_th]:text-left

    [&_td]:border
    [&_td]:border-gray-200
    [&_td]:p-2
  "
  dangerouslySetInnerHTML={{
    __html: product.description || "",
  }}
/>

          <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
            {/* Discounted / Current Price */}
            <span className="text-2xl md:text-[30px] font-bold">
              ₹ {price.toFixed(2)}
            </span>

            {/* Original MRP — 20% higher, crossed out */}
            <span className="text-gray-500 text-sm md:text-lg font-medium flex items-baseline gap-1">
              MRP
              <span className="text-base md:text-xl line-through text-gray-500">
                ₹ {mrp.toFixed(2)}
              </span>
            </span>

            {/* Optional Discount Label */}
            <span className="text-sm md:text-[21px] font-semibold text-red-600">
              {Math.floor(product.discount)}% OFF
            </span>
          </div>

          <span className="text-green-700 text-base md:text-[19px]">Inclusive of all taxes</span>
          {isOutOfStock && (
            <div className="px-3 text-lg font-semibold text-white bg-red-600 rounded-full w-max">
              Out of Stock
            </div>
          )}
          <Separator className="my-4" />

          {/* Size Selection */}
          {/* Size Selection */}
          {product.sizes?.length > 0 && (
            <div className="flex flex-col gap-4">
              <label className="font-medium text-lg md:text-xl text-black">
                Select Size
              </label>

              <div className="flex flex-wrap gap-3 px-2">
                {product.sizes
                  .filter((size) => size.active !== false)
                  .map(({ name }) => {
                    const count = Number(product.inventory?.[name] || 0);
                    const isAvailable = count > 0;
                    const isSelected = selectedSize === name;

                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => {
                          if (isAvailable) {
                            setSelectedSize(name);
                          }
                        }}
                        className={`
                relative
                w-12 h-12 md:w-14 md:h-14
                flex items-center justify-center
                rounded-full
                border
                text-sm md:text-base
                font-semibold
                transition-all duration-300 ease-out

                ${isSelected
                            ? "bg-black text-white border-black shadow-lg"
                            : isAvailable
                              ? "bg-white text-gray-700 border-gray-300 hover:border-black hover:-translate-y-[2px] hover:shadow-md"
                              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50"
                          }
              `}
                        aria-pressed={isSelected}
                        aria-label={`Size ${name} ${isAvailable ? "available" : "out of stock"
                          }`}
                      >
                        {name}

                        {!isAvailable && (
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-red-500">
                            Out of stock
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {selectedSize && (
                <p className="text-xs md:text-sm text-gray-700 mt-2">
                  Selected Size:{" "}
                  <span className="font-semibold">{selectedSize}</span>
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex flex-col gap-3">
            {!isOutOfStock ? (
              <div className="mt-4 flex flex-col gap-3">
                {/* Row 1: Cart + Wishlist */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="
                          w-full sm:w-1/2
                          flex items-center justify-center gap-2
                          text-base sm:text-xl
                          py-5 sm:py-6
                        "
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </Button>

                  <Button
                    variant="outline"
                    className={`
  w-full sm:w-1/2
  flex items-center justify-center gap-2
  border-black text-black
  hover:bg-gray-100
  text-sm sm:text-base
  py-5 sm:py-6
  transition-all duration-200
`}
                    onClick={handleWishlist}
                    aria-pressed={wishlisted}
                  >
                    <Heart
                      className={`
      w-5 h-5 transition-all
      ${wishlisted
                          ? "fill-black text-black"
                          : "text-black"
                        }
    `}
                    />

                    {wishlisted ? "Wishlisted" : "Add to Wishlist"}
                  </Button>
                </div>

                {/* Row 2: Buy Now */}
                <Button
                  variant="outline"
                  className="
  w-full
  flex items-center justify-center gap-2
  border-brand-600 text-brand-600
  hover:bg-brand-50
  text-base sm:text-xl
  py-5 sm:py-6
"
                  onClick={handleBuyNow}
                >
                  <CreditCard className="w-5 h-5" />
                  Buy Now
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex  gap-3">

                  {/* DISABLED */}
                  <Button
                    className="w-1/2 flex items-center justify-center gap-2 text-xl py-6 bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100"

                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </Button>

                  {/* REQUEST */}
                  <Button
                    onClick={() =>
                      setShowRequest(true)
                    }
                    className="
      flex-1

      py-6

      text-lg

      bg-black
      text-white

      hover:bg-neutral-800

    "
                  >
                    Request Product
                  </Button>

                </div>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          <div className=" flex flex-col gap-3">
            <p className="text-xl md:text-2xl font-semibold text-black">Offers For You</p>

            {/* Offer 1 */}
            <div className="border rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3 hover:bg-gray-50 transition hover:-translate-y-[2px] hover:shadow-md">
              <div className="p-1.5 md:p-2 bg-brand-100 rounded-full">
                <Gift className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm md:text-[16px] font-medium text-gray-800">
                  EXTRA 10% OFF ON PURCHASE OF ₹ 2999
                </p>
                <p className="text-xs md:text-[14px] text-gray-600">NORETURN</p>
              </div>
            </div>

            {/* Offer 2 */}
            <div className="border rounded-lg p-3 md:p-4 flex items-center gap-2 md:gap-3 hover:bg-gray-50 transition">
              <div className="p-1.5 md:p-2 bg-brand-100 rounded-full">
                <Gift className="w-6 h-6 text-brand-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm md:text-[16px] font-medium text-gray-800">EXTRA 10% OFF ON PURCHASE OF ₹ 3299</p>
                <p className="text-xs md:text-[14px] text-gray-600">LEVI10</p>
              </div>
            </div>
          </div>

          {/* Accordion */}
      <Accordion
  type="multiple"
  className="text-base md:text-xl w-full"
>
  {/* PRODUCT DETAILS */}
  <AccordionItem value="product-details">
    <AccordionTrigger>
      Product Details
    </AccordionTrigger>

    <AccordionContent>
      <div
        className="
          text-sm
          md:text-base
          text-gray-700
          leading-relaxed

          [&_p]:mb-4
          [&_p:last-child]:mb-0

          [&_strong]:font-semibold
          [&_strong]:text-gray-900

          [&_h1]:text-xl
          [&_h1]:font-bold
          [&_h1]:text-gray-900
          [&_h1]:mt-5
          [&_h1]:mb-3

          [&_h2]:text-lg
          [&_h2]:font-semibold
          [&_h2]:text-gray-900
          [&_h2]:mt-5
          [&_h2]:mb-2

          [&_h3]:font-semibold
          [&_h3]:text-gray-900
          [&_h3]:mt-4
          [&_h3]:mb-2

          [&_ul]:list-disc
          [&_ul]:pl-5
          [&_ul]:my-3

          [&_ol]:list-decimal
          [&_ol]:pl-5
          [&_ol]:my-3

          [&_li]:mb-1.5

          [&_table]:w-full
          [&_table]:border-collapse
          [&_table]:my-4

          [&_th]:border
          [&_th]:border-gray-200
          [&_th]:bg-gray-50
          [&_th]:p-2
          [&_th]:text-left
          [&_th]:font-semibold

          [&_td]:border
          [&_td]:border-gray-200
          [&_td]:p-2

          [&_a]:underline
          [&_a]:underline-offset-2
          [&_a]:hover:text-black

          [&_em]:italic
          [&_u]:underline

          [&_blockquote]:border-l-4
          [&_blockquote]:border-gray-300
          [&_blockquote]:pl-4
          [&_blockquote]:my-4
          [&_blockquote]:italic
          [&_blockquote]:text-gray-500

          [&_hr]:my-5
          [&_hr]:border-gray-200

          [&_img]:max-w-full
          [&_img]:rounded-xl
          [&_img]:my-4
        "
        dangerouslySetInnerHTML={{
          __html: product.details || "",
        }}
      />
    </AccordionContent>
  </AccordionItem>

  {/* WASH CARE */}
  <AccordionItem value="wash-care">
    <AccordionTrigger>
      Wash Care
    </AccordionTrigger>

    <AccordionContent>
      <ul className="list-disc pl-5 text-sm md:text-base text-gray-700 space-y-2">
        <li>
          Machine wash with similar colors.
        </li>
        <li>
          Use cold or lukewarm water to help prevent
          fading and shrinking.
        </li>
        <li>
          Turn the garment inside out before washing.
        </li>
        <li>
          Use a mild detergent and avoid harsh chemicals.
        </li>
        <li>
          Do not bleach unless specifically mentioned.
        </li>
        <li>
          Do not tumble dry unless the care label allows it.
        </li>
        <li>
          Dry in shade and avoid prolonged direct sunlight.
        </li>
        <li>
          Iron on low or medium heat when required.
        </li>
      </ul>
    </AccordionContent>
  </AccordionItem>

  {/* DELIVERY */}
  <AccordionItem value="delivery">
    <AccordionTrigger>
      Delivery & Shipping
    </AccordionTrigger>

    <AccordionContent>
      <div className="space-y-3 text-sm md:text-base text-gray-700">
        <p>
          We carefully pack every order to ensure your
          product reaches you safely.
        </p>

        <div className="space-y-2">
          <p>
            <strong>Metro Cities:</strong>{" "}
            2–4 business days
          </p>

          <p>
            <strong>Rest of India:</strong>{" "}
            3–6 business days
          </p>

          <p>
            <strong>Remote Areas:</strong>{" "}
            Delivery may take slightly longer depending
            on the courier service.
          </p>
        </div>

        <p>
          Delivery timelines may vary during weekends,
          holidays, sales, and unexpected courier delays.
        </p>
      </div>
    </AccordionContent>
  </AccordionItem>

  {/* RETURNS */}
  <AccordionItem value="returns">
    <AccordionTrigger>
      Returns & Exchange
    </AccordionTrigger>

    <AccordionContent>
      <div className="space-y-3 text-sm md:text-base text-gray-700">
        <p>
          We want you to be completely satisfied with
          your purchase.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>
            Exchange requests must be made within the
            applicable exchange period.
          </li>
          <li>
            Items must be unused and in original
            condition.
          </li>
          <li>
            Original tags and packaging should be
            retained.
          </li>
          <li>
            Defective or incorrect products can be
            reported to our support team.
          </li>
        </ul>

        <p>
          <strong>Exchange Fee:</strong> ₹399
        </p>

        <p>
          For assistance, contact{" "}
          <strong>garrib@gmail.com</strong>.
        </p>
      </div>
    </AccordionContent>
  </AccordionItem>

  {/* OFFERS */}
  <AccordionItem value="offers">
    <AccordionTrigger>
      Offers & Promotions
    </AccordionTrigger>

    <AccordionContent>
      <div className="space-y-4 text-sm md:text-base text-gray-700">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="font-semibold text-gray-900">
            Extra 10% OFF
          </p>

          <p className="mt-1">
            Get an additional 10% off on purchases
            above ₹2,999.
          </p>

          <p className="mt-2 font-medium">
            Code:{" "}
            <span className="font-bold">
              NORETURN
            </span>
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 p-4">
          <p className="font-semibold text-gray-900">
            Extra 10% OFF
          </p>

          <p className="mt-1">
            Get an additional 10% off on purchases
            above ₹3,299.
          </p>

          <p className="mt-2 font-medium">
            Code:{" "}
            <span className="font-bold">
              LEVI10
            </span>
          </p>
        </div>
      </div>
    </AccordionContent>
  </AccordionItem>

  {/* SIZE & FIT */}
  <AccordionItem value="size-fit">
    <AccordionTrigger>
      Size & Fit
    </AccordionTrigger>

    <AccordionContent>
      <div className="space-y-3 text-sm md:text-base text-gray-700">
        <p>
          Choose your regular size for the intended
          fit. For a more relaxed look, consider sizing
          up.
        </p>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
          <p>
            <strong>Fit:</strong> Regular Fit
          </p>

          <p className="mt-2">
            <strong>Model:</strong> Model is wearing
            size M.
          </p>
        </div>

        <button
          type="button"
          className="text-sm font-semibold underline underline-offset-4 hover:text-gray-600"
          onClick={() => {
            // open your size guide modal here
          }}
        >
          View Size Guide →
        </button>
      </div>
    </AccordionContent>
  </AccordionItem>

  {/* PAYMENT */}
  <AccordionItem value="payment">
    <AccordionTrigger>
      Payment & Security
    </AccordionTrigger>

    <AccordionContent>
      <div className="space-y-3 text-sm md:text-base text-gray-700">
        <p>
          Your payment information is securely processed
          through our payment provider.
        </p>

        <ul className="list-disc pl-5 space-y-2">
          <li>Secure online payments</li>
          <li>UPI and cards supported</li>
          <li>Payment information is encrypted</li>
          <li>Your card details are never stored by us</li>
        </ul>
      </div>
    </AccordionContent>
  </AccordionItem>
</Accordion>
        </div>

        {/* Fullscreen Image Zoom Modal */}
        {showRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

            {/* Modal box */}
            <div className="
  bg-white

  w-[95vw]
  md:w-full

  max-w-md

  p-4 md:p-6

  rounded-lg
  relative
">

              {/* Close button */}
              <button
                className="
  absolute
  top-2 md:top-3
  right-2 md:right-3

  text-lg md:text-xl
"
                onClick={() => setShowRequest(false)}
              >
                ✕
              </button>

              <h2 className="text-lg md:text-xl font-bold mb-4">
                Get Notified
              </h2>

              {/* Email */}
              <div className=" border-b py-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={request.email}
                  onChange={(e) =>
                    setRequest({ ...request, email: e.target.value })
                  }
                  className="
  w-full

  border

  px-3 py-2

  text-sm md:text-base

  rounded-md
"
                />
              </div>
              {/* Size */}
              <div className="border-b py-4">
                <p className="text-sm font-semibold mb-3 tracking-wide uppercase">
                  Select Size
                </p>

                <div className="flex flex-wrap gap-2 md:gap-3">
                  {Object.keys(product.inventory || {}).map((size) => {
                    const isSelected = request.size === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setRequest({ ...request, size })}
                        className={`  px-3 md:px-4
  py-2

  border

  text-xs md:text-sm
  font-medium

  transition-all duration-200
            ${isSelected
                            ? "bg-black text-white border-black"
                            : "bg-white text-black border-gray-300 hover:border-black"
                          }
          `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Submit */}
              <button
                onClick={handleRequestSubmit}
                className="
  w-full

  bg-black
  text-white

  py-3

  text-sm md:text-base

  font-bold
"
              >
                Notify Me
              </button>
            </div>
          </div>
        )}
      </div>

 <RelatedProducts
   type="product"
   publicId={publicId}
 />
      <RecentlyViewed currentProduct={product} type="product"/>
    </>
  )
}