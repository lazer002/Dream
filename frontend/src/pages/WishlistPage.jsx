// src/pages/WishlistPage.jsx

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, X } from "lucide-react";
import { toast } from "react-hot-toast";

import { useWishlist } from "@/state/WishlistContext";
import { useCart } from "@/state/CartContext";
import { useGetProductsByIdsQuery } from "@/store/api";

/* =========================================================
   HELPERS
========================================================= */

const getProductId = (product) =>
  String(product?.publicId || product?._id || "");

const getImage = (product) =>
  product?.images?.[0] ||
  product?.mainImage ||
  "/placeholder.jpg";

const getSecondImage = (product) =>
  product?.images?.[1] || null;

const getInventory = (product) =>
  product?.inventory?.stock ||
  product?.inventory ||
  {};

const getAvailableSizes = (product) => {
  const inventory = getInventory(product);

  if (!inventory || typeof inventory !== "object") {
    return [];
  }

  return Object.entries(inventory)
    .filter(([, qty]) => Number(qty) > 0)
    .map(([size, qty]) => ({
      size,
      quantity: Number(qty),
    }));
};

const isProductSoldOut = (product) => {
  const inventory = product?.inventory;

  const totalInventory =
    inventory &&
    typeof inventory === "object"
      ? Object.values(inventory).reduce(
          (total, qty) =>
            total + Math.max(0, Number(qty) || 0),
          0
        )
      : 0;

  return totalInventory <= 0;
};

/* =========================================================
   WISHLIST CARD
========================================================= */

function WishlistCard({
  product,
  onRemove,
  onAddToBag,
}) {
  const productId = getProductId(product);

  const image = getImage(product);
  const secondImage = getSecondImage(product);

  const soldOut = isProductSoldOut(product);

  const price = Number(product?.price || 0);

  const oldPrice = Number(
    product?.oldPrice ||
      product?.compareAtPrice ||
      0
  );

  const hasOldPrice = oldPrice > price;

  return (
    <article
      className="
        group
        relative
        w-full
        overflow-hidden
        rounded-[1.25rem]
        bg-gray-100
      "
    >
      <Link
        to={`/product/${product?.publicId}`}
        className="
          relative
          block
          h-[58vh]
          min-h-[430px]
          max-h-[680px]
          overflow-hidden
        "
      >
        <img
          src={image}
          alt={product?.title || "Product"}
          loading="lazy"
          className={`
            absolute
            inset-0
            h-full
            w-full
            object-cover
            transition-all
            duration-700
            ease-out
            group-hover:scale-[1.025]
            ${
              soldOut
                ? "grayscale"
                : ""
            }
          `}
        />

        {secondImage && (
          <img
            src={secondImage}
            alt={`${product?.title || "Product"} alternate`}
            loading="lazy"
            className={`
              absolute
              inset-0
              h-full
              w-full
              object-cover
              opacity-0
              transition-all
              duration-700
              ease-out
              group-hover:scale-[1.025]
              group-hover:opacity-100
              ${
                soldOut
                  ? "grayscale"
                  : ""
              }
            `}
          />
        )}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            h-[55%]
            bg-gradient-to-t
            from-black/85
            via-black/25
            to-transparent
          "
        />

        <div
          className="
            absolute
            left-3
            top-3
            z-20
            flex
            flex-col
            gap-2
          "
        >
          {soldOut ? (
            <span
              className="
                rounded-full
                bg-black/90
                px-3
                py-2
                text-[10px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-white
                backdrop-blur-md
              "
            >
              Sold Out
            </span>
          ) : (
            <>
              {product?.onSale && (
                <span
                  className="
                    rounded-full
                    bg-white
                    px-3
                    py-2
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-black
                  "
                >
                  Sale
                </span>
              )}

              {(product?.isNew ||
                product?.isNewProduct) && (
                <span
                  className="
                    rounded-full
                    bg-black/90
                    px-3
                    py-2
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
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
            z-20
            rounded-full
            bg-white/95
            px-4
            py-2.5
            text-sm
            font-bold
            text-black
            shadow-sm
            backdrop-blur-md
          "
        >
          ₹
          {price.toLocaleString("en-IN")}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(productId);
          }}
          className="
            absolute
            right-3
            bottom-3
            z-30
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            bg-white/95
            text-black
            shadow-lg
            backdrop-blur-md
            transition-all
            duration-300
            hover:scale-110
          "
          aria-label="Remove from wishlist"
        >
          <Heart className="h-5 w-5 fill-black" />
        </button>

        <div
          className="
            absolute
            inset-x-0
            bottom-0
            z-20
            p-5
            pr-16
            text-white
          "
        >
          <p className="mb-1 text-xs font-medium text-white/70">
            {product?.collection ||
              product?.category?.name ||
              "Premium Collection"}
          </p>

          <h3
            className="
              line-clamp-2
              text-[16px]
              font-bold
              leading-tight
              tracking-tight
              sm:text-[18px]
            "
          >
            {product?.title}
          </h3>

          {hasOldPrice ? (
            <p className="mt-3 text-xs text-white/60">
              <span className="line-through">
                ₹
                {oldPrice.toLocaleString("en-IN")}
              </span>

              <span className="ml-2">
                Inclusive of taxes
              </span>
            </p>
          ) : (
            <p className="mt-3 text-xs text-white/60">
              Inclusive of taxes
            </p>
          )}
        </div>
      </Link>

      <div
        className="
          absolute
          bottom-4
          left-4
          right-4
          z-40
          translate-y-3
          opacity-0
          transition-all
          duration-300
          group-hover:translate-y-0
          group-hover:opacity-100
        "
      >
        <button
          type="button"
          disabled={soldOut}
          onClick={() => onAddToBag(product)}
          className={`
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-full
            px-5
            py-3.5
            text-sm
            font-bold
            shadow-xl
            transition-all
            ${
              soldOut
                ? "cursor-not-allowed bg-white/70 text-gray-400"
                : "bg-white text-black hover:bg-black hover:text-white"
            }
          `}
        >
          <ShoppingBag className="h-4 w-4" />

          {soldOut ? "Sold Out" : "Add to Bag"}
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   SKELETON
========================================================= */

function WishlistSkeleton() {
  return (
    <div
      className="
        aspect-[4/5]
        animate-pulse
        rounded-[1.25rem]
        bg-gray-100
      "
    />
  );
}

/* =========================================================
   SIZE MODAL
========================================================= */

function SizeModal({
  product,
  onClose,
  onSelect,
}) {
  if (!product) return null;

  const sizes = getAvailableSizes(product);

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-end
        justify-center
        bg-black/50
        p-4
        backdrop-blur-sm
        sm:items-center
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          w-full
          max-w-md
          rounded-[2rem]
          bg-white
          p-6
          shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="
            absolute
            right-5
            top-5
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-full
            bg-gray-100
            transition
            hover:bg-black
            hover:text-white
          "
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-12">
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.2em]
              text-gray-400
            "
          >
            Add to bag
          </p>

          <h2
            className="
              mt-2
              text-xl
              font-black
              tracking-tight
            "
          >
            {product.title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            ₹
            {Number(
              product.price || 0
            ).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="mt-6 flex gap-4">
          <img
            src={getImage(product)}
            alt={product.title}
            className="
              h-24
              w-20
              rounded-2xl
              object-cover
            "
          />

          <div className="flex-1">
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.15em]
                text-gray-500
              "
            >
              Select size
            </p>

            {sizes.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                Sold out
              </p>
            ) : (
              <div
                className="
                  mt-3
                  grid
                  grid-cols-3
                  gap-2
                "
              >
                {sizes.map(
                  ({
                    size,
                    quantity,
                  }) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        onSelect(size)
                      }
                      className="
                        rounded-xl
                        border
                        border-gray-200
                        px-3
                        py-3
                        text-sm
                        font-bold
                        transition-all
                        hover:border-black
                        hover:bg-black
                        hover:text-white
                      "
                    >
                      {size}

                      <span
                        className="
                          mt-0.5
                          block
                          text-[9px]
                          font-normal
                          opacity-50
                        "
                      >
                        {quantity} left
                      </span>
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function WishlistPage() {
  const { add } = useCart();

  const {
    wishlist,
    removeFromWishlist,
    loading: wishlistLoading,
  } = useWishlist();

  const [selectedProduct, setSelectedProduct] =
    useState(null);

  /* =========================================================
     WISHLIST PUBLIC IDS
  ========================================================= */

  const publicIds = useMemo(
    () =>
      Array.isArray(wishlist)
        ? [
            ...new Set(
              wishlist
                .map(String)
                .filter(Boolean)
            ),
          ]
        : [],
    [wishlist]
  );

  /* =========================================================
     ONE REDUX REQUEST
     
     /products/by-ids?ids=id1,id2,id3
     
     NO Promise.all
     NO api.get per product
  ========================================================= */

  const {
    data: productsData,
    isLoading: productsLoading,
    isFetching: productsFetching,
  } = useGetProductsByIdsQuery(publicIds, {
    skip: publicIds.length === 0,
  });

  const products = useMemo(() => {
    const items = Array.isArray(
      productsData?.items
    )
      ? productsData.items
      : [];

    const byPublicId = new Map();

    items.forEach((product) => {
      const id = product?.publicId;

      if (id) {
        byPublicId.set(
          String(id),
          product
        );
      }
    });

    return publicIds
      .map((id) => byPublicId.get(id))
      .filter(Boolean);
  }, [productsData, publicIds]);

  const loading =
    wishlistLoading ||
    productsLoading ||
    productsFetching;

  /* =========================================================
     REMOVE
  ========================================================= */

  const handleRemove = async (publicId) => {
    await removeFromWishlist(publicId);
  };

  /* =========================================================
     ADD TO BAG
  ========================================================= */

  const handleAddToBag = (product) => {
    if (isProductSoldOut(product)) {
      toast.error("This product is sold out");
      return;
    }

    const sizes = getAvailableSizes(product);

    if (sizes.length === 0) {
      toast.error("This product is sold out");
      return;
    }

    if (sizes.length === 1) {
      handleSizeSelect(
        sizes[0].size,
        product
      );
      return;
    }

    setSelectedProduct(product);
  };

  /* =========================================================
     SIZE SELECT
  ========================================================= */

  const handleSizeSelect = async (
    size,
    product = selectedProduct
  ) => {
    if (!product) return;

    const inventory = getInventory(product);

    const quantity = Number(
      inventory?.[size] || 0
    );

    if (quantity <= 0) {
      toast.error(`${size} is sold out`);
      return;
    }

    try {
      await add(
        product.publicId,
        size,
        1
      );

      setSelectedProduct(null);

      toast.success("Added to bag");
    } catch (error) {
      console.error(
        "ADD TO BAG ERROR:",
        error
      );

      toast.error("Failed to add to bag");
    }
  };

  /* =========================================================
     COUNT
  ========================================================= */

  const count = publicIds.length;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-white">
      <div
        className="
          mx-auto
          max-w-[1800px]
          px-4
          py-10
          sm:px-6
          lg:px-10
          lg:py-14
        "
      >
        <div
          className="
            mb-8
            flex
            items-end
            justify-between
            gap-6
            border-b
            border-gray-100
            pb-7
          "
        >
          <div>
            <p
              className="
                mb-2
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.3em]
                text-gray-400
              "
            >
              Your collection
            </p>

            <h1
              className="
                text-4xl
                font-black
                tracking-[-0.05em]
                text-black
                sm:text-5xl
                lg:text-6xl
              "
            >
              Wishlist
            </h1>
          </div>

          <p
            className="
              shrink-0
              text-xs
              font-semibold
              uppercase
              tracking-[0.15em]
              text-gray-400
            "
          >
            {count}{" "}
            {count === 1 ? "Item" : "Items"}
          </p>
        </div>

        {loading ? (
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              xl:grid-cols-5
            "
          >
            {Array.from({
              length: 10,
            }).map((_, index) => (
              <WishlistSkeleton
                key={index}
              />
            ))}
          </div>
        ) : count === 0 ? (
          <div
            className="
              flex
              min-h-[60vh]
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <div
              className="
                flex
                h-24
                w-24
                items-center
                justify-center
                rounded-full
                bg-gray-50
              "
            >
              <Heart className="h-9 w-9" />
            </div>

            <p
              className="
                mt-7
                text-[11px]
                font-bold
                uppercase
                tracking-[0.25em]
                text-gray-400
              "
            >
              Nothing saved yet
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-black
                tracking-tight
              "
            >
              Your wishlist is empty
            </h2>

            <p
              className="
                mt-3
                max-w-sm
                text-sm
                leading-relaxed
                text-gray-500
              "
            >
              Save the pieces you love
              and come back to them
              whenever you're ready.
            </p>

            <Link
              to="/products"
              className="
                mt-7
                rounded-full
                bg-black
                px-7
                py-3.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-neutral-800
              "
            >
              Explore Products
            </Link>
          </div>
        ) : products.length === 0 ? (
          <div
            className="
              flex
              min-h-[50vh]
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <Heart className="h-10 w-10" />

            <h2 className="mt-5 text-2xl font-black">
              Products unavailable
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              The saved products are no longer available.
            </p>
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-2
              gap-3
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              xl:grid-cols-5
            "
          >
            {products.map((product) => (
              <WishlistCard
                key={
                  product?.publicId ||
                  product?._id
                }
                product={product}
                onRemove={handleRemove}
                onAddToBag={handleAddToBag}
              />
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <SizeModal
          product={selectedProduct}
          onClose={() =>
            setSelectedProduct(null)
          }
          onSelect={handleSizeSelect}
        />
      )}
    </main>
  );
}