// src/components/RecentlyViewed.jsx

import { useEffect,useRef  } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  addRecentlyViewed,
  clearRecentlyViewed,
} from "@/store/recentlyViewedSlice";

const MAX_ITEMS = 8;

export default function RecentlyViewed({
  currentProduct,
  type = "product",
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const scrollerRef = useRef(null);

const scrollProducts = (direction) => {
  if (!scrollerRef.current) return;

  scrollerRef.current.scrollBy({
    left: direction === "left" ? -400 : 400,
    behavior: "smooth",
  });
};
const smoothScroll = (direction) => {
  const el = scrollerRef.current;
  if (!el) return;

  const start = el.scrollLeft;
  const distance = direction === "left" ? -350 : 350;
  const duration = 650;

  let startTime = null;

  const easeInOut = (t) =>
    t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const animate = (time) => {
    if (!startTime) startTime = time;

    const progress = Math.min((time - startTime) / duration, 1);
    const eased = easeInOut(progress);

    el.scrollLeft = start + distance * eased;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};
  const items = useSelector(
    (state) => state.recentlyViewed.items
  );

  const isBundle = type === "bundle";

  useEffect(() => {
    if (
      !currentProduct?.publicId &&
      !currentProduct?._id
    ) {
      return;
    }

    dispatch(
      addRecentlyViewed({
        _id: currentProduct._id,
        publicId: currentProduct.publicId,
        title: currentProduct.title,
        price: currentProduct.price,
        oldPrice: currentProduct.oldPrice,
        discount: currentProduct.discount || 0,

        type: isBundle
          ? "bundle"
          : "product",

        images: isBundle
          ? Array.isArray(currentProduct.mainImages)
            ? currentProduct.mainImages
            : []
          : Array.isArray(currentProduct.images)
            ? currentProduct.images
            : [],

        mainImages: isBundle
          ? Array.isArray(currentProduct.mainImages)
            ? currentProduct.mainImages
            : []
          : [],

        onSale: currentProduct.onSale || false,

        isOutOfStock:
          currentProduct.isOutOfStock || false,

        isNewProduct:
          currentProduct.isNewProduct || false,

        isNewBundle:
          currentProduct.isNewBundle || false,
      })
    );
  }, [
    currentProduct,
    isBundle,
    dispatch,
  ]);

  const openItem = (item) => {
    if (!item?.publicId) return;

    navigate(
      item.type === "bundle"
        ? `/collections/${item.publicId}`
        : `/product/${item.publicId}`
    );

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  };


  if (!items.length) return null;

  return (
    <section className="w-full border-t border-neutral-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-auto px-4">


<div className="mb-8 flex items-end justify-between md:mb-10">
  <div>
    <p className="mb-2 text-sm uppercase tracking-[0.3em] text-neutral-500">
      Your Journey
    </p>

    <h2 className="text-2xl font-bold tracking-tight text-black md:text-5xl">
      Recently Viewed
    </h2>
  </div>

  <div className="flex items-center gap-2">
<button
  type="button"
  onClick={() => smoothScroll("left")}
  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:border-black hover:bg-black hover:text-white"
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 18l-6-6 6-6" />
  </svg>
</button>

<button
  type="button"
  onClick={() => smoothScroll("right")}
  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white transition hover:border-black hover:bg-black hover:text-white"
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
</button>

    {/* DESKTOP CLEAR */}

  </div>
</div>



<div
  ref={scrollerRef}
  className="
    flex
    gap-4
    overflow-x-auto
    scroll-smooth
    
    pb-2
    scrollbar-hide
    md:gap-6
  "
>
  {items.slice(0, MAX_ITEMS).map((item) => {
    const image =
      item.type === "bundle"
        ? item.mainImages?.[0] || item.images?.[0]
        : item.images?.[0];

    return (
      <article
        key={item.publicId || item._id}
        role="button"
        tabIndex={0}
        onClick={() => openItem(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            openItem(item);
          }
        }}
        className="
          group
          w-[72vw]
          shrink-0
          cursor-pointer
         
          sm:w-[45vw]
          md:w-[31vw]
          lg:w-[23.5vw]
        "
      >
        <div
          className="
            relative
            aspect-[3/4]
            overflow-hidden
            rounded-2xl
            bg-neutral-100
            shadow-sm
            transition-all
            duration-500
            group-hover:shadow-2xl
          "
        >
          {image ? (
            <img
              src={image}
              alt={item.title || "Product"}
              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-700
                group-hover:scale-110
              "
              onError={(e) => {
                e.currentTarget.src = "/images/placeholder.png";
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-400">
              No image
            </div>
          )}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/75
              via-black/20
              to-transparent
            "
          />

          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {item.isOutOfStock ? (
              <span
                className="
                  rounded-full
                  bg-black/80
                  px-3
                  py-1.5
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-white
                  backdrop-blur-md
                "
              >
                Sold Out
              </span>
            ) : (
              <>
                {item.onSale && (
                  <span
                    className="
                      rounded-full
                      bg-white/90
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      text-black
                      backdrop-blur-md
                    "
                  >
                    Sale
                  </span>
                )}

                {(item.isNewProduct || item.isNewBundle) && (
                  <span
                    className="
                      rounded-full
                      bg-black/80
                      px-3
                      py-1.5
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.15em]
                      text-white
                      backdrop-blur-md
                    "
                  >
                    New
                  </span>
                )}
              </>
            )}
          </div>

          <div
            className="
              absolute
              right-3
              top-3
              rounded-full
              bg-white/90
              px-3
              py-1.5
              text-xs
              font-semibold
              text-black
              backdrop-blur-md
              md:text-sm
            "
          >
            ₹
            {Number(item.price || 0).toLocaleString("en-IN")}
          </div>

          <div
            className="
              absolute
              bottom-0
              left-0
              right-0
              p-4
              text-white
              md:p-5
            "
          >
            <h3
              className="
                line-clamp-2
                text-sm
                font-semibold
                leading-tight
                md:text-lg
              "
            >
              {item.title}
            </h3>

            <p className="mt-1 text-xs text-white/70 md:text-sm">
              {item.type === "bundle"
                ? "Premium Bundle"
                : "Premium Collection"}
            </p>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Number(item.oldPrice || 0) >
                  Number(item.price || 0) && (
                  <span
                    className="
                      text-xs
                      text-white/50
                      line-through
                      md:text-sm
                    "
                  >
                    ₹
                    {Number(item.oldPrice).toLocaleString("en-IN")}
                  </span>
                )}

                <span className="text-xs text-white/90 md:text-sm">
                  Inclusive of taxes
                </span>
              </div>

              <span
                className="
                  translate-x-3
                  text-sm
                  font-medium
                  opacity-0
                  transition-all
                  duration-300
                  group-hover:translate-x-0
                  group-hover:opacity-100
                "
              >
                View →
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  })}
</div>

      </div>
    </section>
  );
}