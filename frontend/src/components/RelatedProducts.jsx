import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/utils/config";

export default function RelatedProducts({
  type = "product",
  publicId,
}) {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isBundle = type === "bundle";

  useEffect(() => {
    if (!publicId) return;

    const fetchRelated = async () => {
      try {
        setLoading(true);

        const endpoint = isBundle
          ? `/bundles/${publicId}/related`
          : `/products/${publicId}/related`;

        const { data } = await api.get(endpoint);

        setItems(
          data?.products ||
            data?.bundles ||
            data?.items ||
            []
        );
      } catch (error) {
        console.error("GET RELATED ITEMS ERROR:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [publicId, isBundle]);

  const handleNavigate = (item) => {
    navigate(
      isBundle
        ? `/collections/${item.publicId}`
        : `/product/${item.publicId}`
    );

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  };

  const scrollRelated = (direction) => {
    const container = document.getElementById(
      "related-products-scroll"
    );

    if (!container) return;

    container.scrollBy({
      left: direction === "left" ? -360 : 360,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <section className="w-full border-t border-neutral-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-0">
          <div className="mb-8">
            <div className="h-3 w-28 animate-pulse rounded-full bg-neutral-200" />
            <div className="mt-3 h-9 w-60 animate-pulse rounded-lg bg-neutral-200" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index}>
                <div className="aspect-[4/5] animate-pulse rounded-[22px] bg-neutral-100" />
                <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-neutral-100" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!items.length) return null;

 return (
  <section className="w-full border-t border-neutral-100 bg-white py-16 sm:py-20">
    <div className="mx-4 max-w-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between md:mb-10">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-neutral-500">
            You may also like
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-black md:text-5xl">
            Related {isBundle ? "Bundles" : "Products"}
          </h2>
        </div>

        <button
          onClick={() =>
            navigate(
              isBundle
                ? "/collections"
                : "/products"
            )
          }
          className="
            hidden
            items-center
            gap-2
            text-sm
            font-medium
            text-neutral-700
            transition
            hover:text-black
            md:flex
          "
        >
          View all →
        </button>
      </div>

      {/* Products */}
      <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {items.slice(0, 8).map((item) => {
          const image = isBundle
            ? item.mainImages?.[0]
            : item.images?.[0];

          const secondImage = isBundle
            ? item.mainImages?.[1]
            : item.images?.[1];

          return (
            <article
              key={item.publicId || item._id}
              role="button"
              tabIndex={0}
              onClick={() => handleNavigate(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNavigate(item);
                }
              }}
              className="group cursor-pointer"
            >
              {/* IMAGE */}
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
                  <>
                    <img
                      src={image}
                      alt={item.title || "Product"}
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                        object-cover
                        transition-all
                        duration-700
                        group-hover:scale-110
                        group-hover:opacity-0
                      "
                    />

                    <img
                      src={secondImage || image}
                      alt={item.title || "Product"}
                      className="
                        absolute
                        inset-0
                        h-full
                        w-full
                        object-cover
                        opacity-0
                        transition-all
                        duration-700
                        group-hover:scale-110
                        group-hover:opacity-100
                      "
                    />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    No image
                  </div>
                )}

                {/* GRADIENT */}
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

                {/* STATUS */}
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

                      {item.isNewProduct && (
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

                      {item.discount > 0 && (
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
                          {item.discount}% Off
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* PRICE */}
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
                    backdrop-blur-md
                    md:text-sm
                  "
                >
                  ₹
                  {Number(
                    item.price ?? 0
                  ).toLocaleString("en-IN")}
                </div>

                {/* CONTENT */}
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

                  <p
                    className="
                      mt-1
                      text-xs
                      text-white/70
                      md:text-sm
                    "
                  >
                    {isBundle
                      ? "Premium Bundle"
                      : "Premium Collection"}
                  </p>

                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <div className="flex items-center gap-2">
                      {item.oldPrice &&
                        Number(item.oldPrice) >
                          Number(item.price) && (
                          <span
                            className="
                              text-xs
                              text-white/50
                              line-through
                              md:text-sm
                            "
                          >
                            ₹
                            {Number(
                              item.oldPrice
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        )}

                      <span
                        className="
                          text-xs
                          text-white/90
                          md:text-sm
                        "
                      >
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

      {/* MOBILE VIEW ALL */}
      <button
        onClick={() =>
          navigate(
            isBundle
              ? "/collections"
              : "/products"
          )
        }
        className="
          mt-6
          w-full
          rounded-xl
          border
          border-neutral-200
          py-3
          text-sm
          font-medium
          text-neutral-700
          transition
          hover:border-black
          hover:text-black
          md:hidden
        "
      >
        View All →
      </button>
    </div>
  </section>
);
}