// src/pages/Cart.jsx

import {
  memo,
  useCallback,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Trash2,
  RotateCcw,
  ShieldCheck,
  Truck,
  ChevronDown,
  Heart,
  LockKeyhole,
  PackageCheck,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useCart } from "../state/CartContext.jsx";
import { useWishlist } from "../state/WishlistContext.jsx";
import { getDeliveryDate } from "@/utils/public.js";

export default function Cart() {
  const {
    items = [],
    update,
    remove,
    loading,
    updatingItemId,
  } = useCart();

  const {
    wishlist = [],
    addToWishlist,
    removeFromWishlist,
  } = useWishlist();

  const [expandedBundles, setExpandedBundles] =
    useState({});

  const [removeModal, setRemoveModal] =
    useState({
      open: false,
      id: null,
      size: null,
      isBundle: false,
      image: null,
      title: "",
    });

  const formatCurrency = useCallback(
    (value) =>
      `₹${Number(value || 0).toLocaleString(
        "en-IN"
      )}`,
    []
  );

  const isBundleItem = useCallback(
    (item) => item?.type === "bundle",
    []
  );

  const getProductPublicId = useCallback(
    (item) =>
      item?.publicId ||
      item?.product?.publicId ||
      null,
    []
  );

  const getBundleCartItemId = useCallback(
    (item) => item?._id || null,
    []
  );

  const getItemImage = useCallback(
    (item) => {
      if (isBundleItem(item)) {
        return (
          item?.bundle?.mainImage ||
          item?.bundle?.images?.[0] ||
          item?.bundleProducts?.[0]?.image ||
          item?.mainImage ||
          "/placeholder.jpg"
        );
      }

      return (
        item?.mainImage ||
        item?.product?.images?.[0] ||
        "/placeholder.jpg"
      );
    },
    [isBundleItem]
  );

  const getItemTitle = useCallback(
    (item) => {
      if (isBundleItem(item)) {
        return (
          item?.bundle?.title ||
          item?.bundleTitle ||
          item?.customBundle?.title ||
          "Bundle"
        );
      }

      return (
        item?.title ||
        item?.product?.title ||
        "Product"
      );
    },
    [isBundleItem]
  );

  const getItemPrice = useCallback(
    (item) => {
      if (isBundleItem(item)) {
        return Number(
          item?.bundle?.price ??
            item?.bundlePrice ??
            item?.customBundle?.price ??
            item?.price ??
            0
        );
      }

      return Number(
        item?.price ??
          item?.product?.price ??
          0
      );
    },
    [isBundleItem]
  );

  const getInventory = useCallback(
    (item) => {
      if (isBundleItem(item)) {
        return null;
      }

      return (
        item?.product?.inventory ||
        item?.inventory ||
        null
      );
    },
    [isBundleItem]
  );

const getAvailableForSize = useCallback(
  (item) => {
    if (isBundleItem(item)) {
      const products =
        item?.bundleProducts || [];

      if (!products.length) {
        return Infinity;
      }

      return products.reduce(
        (lowest, product) => {
          const stock = Number(
            product?.inventory?.stock?.[
              product?.size
            ] ?? 0
          );

          return Math.min(
            lowest,
            stock
          );
        },
        Infinity
      );
    }

    const inventory =
      item?.product?.inventory ||
      item?.inventory;

    if (!inventory) {
      return Infinity;
    }

    const stock = Number(
      inventory?.stock?.[item?.size] ?? 0
    );

    const reserved = Number(
      inventory?.reserved || 0
    );

    return Math.max(
      0,
      stock - reserved
    );
  },
  [isBundleItem]
);

  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      getItemPrice(item) *
        Number(item.quantity || 0),
    0
  );

  const tax = subtotal * 0.05;

  const deliveryFee =
    subtotal > 500 ||
    subtotal === 0
      ? 0
      : 50;

  const discount = 0;

  const total =
    subtotal +
    tax +
    deliveryFee -
    discount;

  const closeRemoveModal = useCallback(
    () => {
      setRemoveModal({
        open: false,
        id: null,
        size: null,
        isBundle: false,
        image: null,
        title: "",
      });
    },
    []
  );

  const openRemoveModal = useCallback(
    ({
      id,
      size = null,
      isBundle = false,
      image = null,
      title = "",
    }) => {
      setRemoveModal({
        open: true,
        id,
        size,
        isBundle,
        image,
        title,
      });
    },
    []
  );

  const handleDecrease = useCallback(
    async (item) => {
      const bundle =
        isBundleItem(item);

      const currentQuantity =
        Number(item.quantity || 0);

      if (currentQuantity <= 1) {
        openRemoveModal({
          id: bundle
            ? getBundleCartItemId(item)
            : getProductPublicId(item),
          size: bundle
            ? null
            : item.size,
          isBundle: bundle,
          image: getItemImage(item),
          title: getItemTitle(item),
        });

        return;
      }

      await update(
        bundle
          ? getBundleCartItemId(item)
          : getProductPublicId(item),
        currentQuantity - 1,
        bundle
          ? null
          : item.size,
        bundle
      );
    },
    [
      update,
      isBundleItem,
      openRemoveModal,
      getBundleCartItemId,
      getProductPublicId,
      getItemImage,
      getItemTitle,
    ]
  );

  const handleIncrease = useCallback(
  async (item) => {
    const isBundle =
      isBundleItem(item);

    const currentQuantity =
      Number(item.quantity || 0);

    const available =
      getAvailableForSize(item);

    if (
      Number.isFinite(available) &&
      currentQuantity >= available
    ) {
      toast.error(
        isBundle
          ? "One or more products in this bundle have reached their available stock."
          : `Only ${available} available`
      );

      return;
    }

    await update(
      isBundle
        ? getBundleCartItemId(item)
        : getProductPublicId(item),
      currentQuantity + 1,
      isBundle
        ? null
        : item.size,
      isBundle
    );
  },
  [
    update,
    isBundleItem,
    getAvailableForSize,
    getBundleCartItemId,
    getProductPublicId,
  ]
);

  const handleRemove = useCallback(
    async () => {
      const {
        id,
        size,
        isBundle,
      } = removeModal;

      closeRemoveModal();

      await remove(
        id,
        size,
        isBundle
      );
    },
    [
      removeModal,
      closeRemoveModal,
      remove,
    ]
  );

  const handleMoveToWishlist =
    useCallback(async () => {
      const {
        id,
        size,
        isBundle,
      } = removeModal;

      if (isBundle) {
        closeRemoveModal();

        await remove(
          id,
          null,
          true
        );

        return;
      }

      if (!id) {
        return;
      }

      const publicId = String(id);

      try {
        if (
          wishlist.includes(publicId)
        ) {
          await removeFromWishlist(
            publicId
          );
        } else {
          await addToWishlist(
            publicId
          );
        }

        closeRemoveModal();

        await remove(
          publicId,
          size,
          false
        );
      } catch (error) {
        console.error(
          "MOVE TO WISHLIST ERROR:",
          error
        );
      }
    }, [
      removeModal,
      wishlist,
      addToWishlist,
      removeFromWishlist,
      closeRemoveModal,
      remove,
    ]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] px-5 py-10 md:px-8">
        <div className="animate-pulse">
          <div className="mb-10 h-12 w-48 rounded bg-neutral-100" />

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              {[1, 2, 3].map(
                (item) => (
                  <div
                    key={item}
                    className="flex gap-5 border-b border-neutral-100 pb-7"
                  >
                    <div className="h-36 w-28 rounded-2xl bg-neutral-100" />

                    <div className="flex-1 space-y-4">
                      <div className="h-5 w-56 rounded bg-neutral-100" />
                      <div className="h-4 w-24 rounded bg-neutral-100" />
                      <div className="h-4 w-32 rounded bg-neutral-100" />
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="h-[420px] rounded-3xl bg-neutral-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center px-5 text-center">
        <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
          <PackageCheck
            size={30}
            strokeWidth={1.5}
          />
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
          Shopping Bag
        </p>

        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight md:text-6xl">
          Your cart is empty
        </h1>

        <p className="mt-4 max-w-md text-sm leading-6 text-neutral-500">
          Discover something you love
          and add it to your bag.
        </p>

        <Link
          to="/products"
          className="mt-8 inline-flex h-14 items-center justify-center bg-black px-10 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <>
      <main className="mx-auto w-full max-w-[1400px] px-5 py-8 md:px-8 md:py-12">
        <header className="mb-10 border-b border-neutral-200 pb-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
                Shopping Bag
              </p>

              <h1 className="text-4xl font-black uppercase tracking-[-0.04em] md:text-6xl">
                Cart
              </h1>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
              <span className="h-2 w-2 rounded-full bg-black" />

              {items.length}{" "}
              {items.length === 1
                ? "Item"
                : "Items"}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <section>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.18em]">
                Your items
              </p>

              {deliveryFee === 0 && (
                <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 sm:flex">
                  <Truck size={13} />
                  Free shipping unlocked
                </div>
              )}
            </div>

            <div>
              {items.map(
                (item, index) => (
                  <CartItemCard
                    key={
                      isBundleItem(item)
                        ? `bundle-${item._id}`
                        : `${getProductPublicId(
                            item
                          )}-${item.size}`
                    }
                    item={item}
                    index={index}
                    totalItems={
                      items.length
                    }
                    updatingItemId={
                      updatingItemId
                    }
                    expandedBundles={
                      expandedBundles
                    }
                    setExpandedBundles={
                      setExpandedBundles
                    }
                    handleIncrease={
                      handleIncrease
                    }
                    handleDecrease={
                      handleDecrease
                    }
                    openRemoveModal={
                      openRemoveModal
                    }
                    getProductPublicId={
                      getProductPublicId
                    }
                    getBundleCartItemId={
                      getBundleCartItemId
                    }
                    isBundleItem={
                      isBundleItem
                    }
                    getItemImage={
                      getItemImage
                    }
                    getItemTitle={
                      getItemTitle
                    }
                    getItemPrice={
                      getItemPrice
                    }
                    getAvailableForSize={
                      getAvailableForSize
                    }
                    getDeliveryDate={
                      getDeliveryDate
                    }
                    formatCurrency={
                      formatCurrency
                    }
                  />
                )
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TrustItem
                icon={
                  <ShieldCheck
                    size={15}
                  />
                }
                title="Secure payment"
              />

              <TrustItem
                icon={
                  <RotateCcw
                    size={15}
                  />
                }
                title="15 day returns"
              />

              <TrustItem
                icon={
                  <PackageCheck
                    size={15}
                  />
                }
                title="Quality checked"
              />
            </div>
          </section>

          <aside>
            <div className="sticky top-6 overflow-hidden border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 p-6 md:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">
                      Summary
                    </p>

                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
                      Your order
                    </h2>
                  </div>

                  <LockKeyhole
                    size={17}
                    className="text-neutral-300"
                  />
                </div>
              </div>

              <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4 md:px-7">
                <div className="flex items-center gap-3">
                  <Truck size={15} />

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider">
                      {deliveryFee ===
                      0
                        ? "Free shipping unlocked"
                        : `Add ${formatCurrency(
                            Math.max(
                              0,
                              500 -
                                subtotal
                            )
                          )} for free shipping`}
                    </p>

                    <div className="mt-2 h-1 w-full min-w-40 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-full bg-black transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            (subtotal /
                              500) *
                              100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-6 md:p-7">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(
                    subtotal
                  )}
                />

                <SummaryRow
                  label="Tax"
                  value={formatCurrency(
                    tax
                  )}
                />

                <SummaryRow
                  label="Shipping"
                  value={
                    deliveryFee ===
                    0
                      ? "Free"
                      : formatCurrency(
                          deliveryFee
                        )
                  }
                />

                {discount > 0 && (
                  <SummaryRow
                    label="Discount"
                    value={`-${formatCurrency(
                      discount
                    )}`}
                    highlight
                  />
                )}

                <div className="border-t border-neutral-200 pt-5">
                  <div className="flex items-end justify-between gap-5">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                        Total
                      </p>

                      <p className="mt-1 text-[9px] text-neutral-400">
                        Inclusive of applicable
                        taxes
                      </p>
                    </div>

                    <p className="text-3xl font-black tracking-tight">
                      {formatCurrency(
                        total
                      )}
                    </p>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="mt-3 flex h-14 w-full items-center justify-center gap-3 bg-black text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-neutral-800"
                >
                  <LockKeyhole
                    size={14}
                  />
                  Secure checkout
                </Link>

                <Link
                  to="/products"
                  className="flex h-12 w-full items-center justify-center border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:border-black"
                >
                  Continue shopping
                </Link>
              </div>

              <div className="border-t border-neutral-200 px-6 py-5 md:px-7">
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-[8px] font-bold uppercase tracking-[0.14em] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck
                      size={11}
                    />
                    Secure
                  </span>

                  <span className="text-neutral-200">
                    /
                  </span>

                  <span className="flex items-center gap-1">
                    <RotateCcw
                      size={11}
                    />
                    15 Day Returns
                  </span>

                  <span className="text-neutral-200">
                    /
                  </span>

                  <span className="flex items-center gap-1">
                    <Truck
                      size={11}
                    />
                    Fast Delivery
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-24 border-t border-neutral-200 pt-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400">
                Curated for you
              </p>

              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight md:text-5xl">
                You might also like
              </h2>
            </div>

            <Link
              to="/products"
              className="hidden text-[10px] font-bold uppercase tracking-[0.16em] underline underline-offset-4 sm:block"
            >
              View all
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="aspect-[3/4] animate-pulse bg-neutral-50"
                />
              )
            )}
          </div>
        </section>
      </main>

      {removeModal.open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={
              closeRemoveModal
            }
            className="absolute inset-0 bg-black/35 backdrop-blur-[3px]"
          />

          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.2)]">
            <button
              type="button"
              onClick={
                closeRemoveModal
              }
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 transition hover:bg-black hover:text-white"
            >
              <X size={15} />
            </button>

            <div className="p-6 sm:p-7">
              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-neutral-400">
                  Shopping Bag
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
                  Remove item?
                </h2>

                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  Choose what you want
                  to do with this item.
                </p>
              </div>

              <div className="mt-6 flex gap-4 rounded-2xl bg-neutral-50 p-3">
                <img
                  src={
                    removeModal.image ||
                    "/placeholder.jpg"
                  }
                  alt=""
                  className="h-24 w-20 rounded-xl object-cover"
                />

                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <p className="line-clamp-3 text-sm font-bold uppercase leading-5">
                    {
                      removeModal.title
                    }
                  </p>

                  {removeModal.isBundle && (
                    <span className="mt-2 w-fit rounded-full bg-black px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-white">
                      Bundle
                    </span>
                  )}

                  {removeModal.size && (
                    <span className="mt-2 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                      Size{" "}
                      {
                        removeModal.size
                      }
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-2.5">
                {!removeModal.isBundle && (
                  <button
                    type="button"
                    onClick={
                      handleMoveToWishlist
                    }
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-black text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-neutral-800"
                  >
                    <Heart
                      size={15}
                    />
                    Move to wishlist
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    handleRemove
                  }
                  className="flex h-12 w-full items-center justify-center rounded-2xl border border-neutral-200 text-xs font-bold uppercase tracking-[0.14em] transition hover:border-red-300 hover:text-red-500"
                >
                  Remove from bag
                </button>

                <button
                  type="button"
                  onClick={
                    closeRemoveModal
                  }
                  className="h-12 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 transition hover:text-black"
                >
                  Keep item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const CartItemCard = memo(
  function CartItemCard({
    item,
    index,
    totalItems,
    updatingItemId,
    expandedBundles,
    setExpandedBundles,
    handleIncrease,
    handleDecrease,
    openRemoveModal,
    getProductPublicId,
    getBundleCartItemId,
    isBundleItem,
    getItemImage,
    getItemTitle,
    getItemPrice,
    getAvailableForSize,
    getDeliveryDate,
    formatCurrency,
  }) {
    const bundle =
      isBundleItem(item);

    const key = bundle
      ? `bundle-${item._id}`
      : `${getProductPublicId(
          item
        )}-${item.size}`;

    const image =
      getItemImage(item);

    const title =
      getItemTitle(item);

    const price =
      getItemPrice(item);

    const available =
      getAvailableForSize(item);

    const isAtLimit =
  Number.isFinite(available) &&
  Number(item.quantity) >= available;

const itemUpdateId = isBundleItem(item)
  ? `bundle-${item._id}`
  : `product-${getProductPublicId(item)}-${item.size}`;

const isUpdatingThisItem =
  updatingItemId === itemUpdateId;

    return (
      <article
        className={`group py-7 ${
          index !== totalItems - 1
            ? "border-b border-neutral-200"
            : ""
        }`}
      >
        <div className="flex gap-4 sm:gap-6">
          <Link
            to={
              bundle
                ? "#"
                : `/products/${
                    item.slug ||
                    item.publicId
                  }`
            }
            className="relative h-32 w-24 shrink-0 overflow-hidden bg-neutral-100 sm:h-40 sm:w-32"
          >
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              onError={(e) => {
                e.currentTarget.src =
                  "/placeholder.jpg";
              }}
            />

            {bundle && (
              <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-wider">
                Bundle
              </span>
            )}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="line-clamp-2 text-sm font-bold uppercase tracking-wide sm:text-base">
                    {title}
                  </h2>

                {bundle ? (
  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
      {item.bundleProducts?.length || 0} items
    </span>

    <span className="text-neutral-200">
      •
    </span>

    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
      {item.bundleProducts
        ?.map((product) => product.size)
        .filter(Boolean)
        .join(" · ") || "One size"}
    </span>

    {Number.isFinite(available) && (
      <>
        <span className="text-neutral-200">
          •
        </span>

        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          {available > 0
            ? `${available} available`
            : "Out of stock"}
        </span>
      </>
    )}
  </div>
) : (
  <div className="mt-2 flex flex-wrap items-center gap-3">
    {item.size && (
      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
        Size {item.size}
      </span>
    )}

    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
      {Number.isFinite(available)
        ? available > 0
          ? `${available} available`
          : "Out of stock"
        : "Available"}
    </span>
  </div>
)}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openRemoveModal({
                      id: bundle
                        ? getBundleCartItemId(
                            item
                          )
                        : getProductPublicId(
                            item
                          ),
                      size: bundle
                        ? null
                        : item.size,
                      isBundle:
                        bundle,
                      image,
                      title,
                    })
                  }
                  className="shrink-0 text-neutral-300 transition hover:text-red-500"
                  aria-label="Remove item"
                >
                  <Trash2
                    size={17}
                    strokeWidth={1.7}
                  />
                </button>
              </div>

              {!bundle &&
                item.sku && (
                  <p className="mt-2 text-[9px] font-medium uppercase tracking-widest text-neutral-300">
                    SKU {item.sku}
                  </p>
                )}
            </div>

            <div className="mt-5 flex items-end justify-between gap-3">
          <div className="flex h-9 items-center border border-neutral-200">
  <button
    type="button"
    disabled={isUpdatingThisItem}
    onClick={() => handleDecrease(item)}
    className="flex h-full w-9 items-center justify-center transition-opacity disabled:cursor-not-allowed disabled:opacity-30"
  >
    {isUpdatingThisItem ? (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-neutral-300 border-t-black" />
    ) : (
      <Minus size={13} />
    )}
  </button>

  <span
    className={`w-8 text-center text-xs font-bold transition-opacity ${
      isUpdatingThisItem
        ? "opacity-40"
        : "opacity-100"
    }`}
  >
    {item.quantity}
  </span>

  <button
    type="button"
    disabled={
      isUpdatingThisItem ||
      isAtLimit
    }
    onClick={() => handleIncrease(item)}
    className={`flex h-full w-9 items-center justify-center transition-opacity ${
      isAtLimit
        ? "cursor-not-allowed opacity-30"
        : "opacity-100 hover:opacity-60"
    }`}
  >
    {isUpdatingThisItem ? (
      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-neutral-300 border-t-black" />
    ) : (
      <Plus size={13} />
    )}
  </button>
</div>

              <p className="text-sm font-bold">
                {formatCurrency(
                  price *
                    Number(
                      item.quantity ||
                        0
                    )
                )}
              </p>
            </div>
          </div>
        </div>

        {bundle &&
          item.bundleProducts
            ?.length > 0 && (
            <div className="ml-28 mt-5 sm:ml-38">
              <button
                type="button"
                onClick={() =>
                  setExpandedBundles(
                    (prev) => ({
                      ...prev,
                      [key]:
                        !prev[key],
                    })
                  )
                }
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400 transition hover:text-black"
              >
                <span>
                  {expandedBundles[key]
                    ? "Hide items"
                    : "View items"}
                </span>

                <ChevronDown
                  size={13}
                  className={`transition-transform ${
                    expandedBundles[
                      key
                    ]
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {expandedBundles[
                key
              ] && (
                <div className="mt-4 space-y-3 border-l border-neutral-200 pl-4">
                  {item.bundleProducts.map(
                    (
                      bp,
                      bpIndex
                    ) => (
                      <div
                        key={`${bp.publicId}-${bp.size}-${bpIndex}`}
                        className="flex items-center gap-3"
                      >
                        <img
                          src={
                            bp.image ||
                            "/placeholder.jpg"
                          }
                          alt={
                            bp.title ||
                            "Product"
                          }
                          className="h-11 w-9 bg-neutral-100 object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/placeholder.jpg";
                          }}
                        />

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide">
                            {bp.title ||
                              "Product"}
                          </p>

                          {bp.sku && (
                            <p className="mt-0.5 text-[8px] uppercase tracking-wider text-neutral-300">
                              SKU{" "}
                              {bp.sku}
                            </p>
                          )}

                          <div className="mt-1 flex gap-3 text-[9px] uppercase tracking-wider text-neutral-400">
                            {bp.size && (
                              <span>
                                Size{" "}
                                {bp.size}
                              </span>
                            )}

                            <span>
                              Qty{" "}
                              {
                                bp.quantity
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}

        <p className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
          <Truck size={12} />

          Delivery by{" "}

          <span className="text-black">
            {getDeliveryDate()}
          </span>
        </p>
      </article>
    );
  }
);

function SummaryRow({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="flex items-center justify-between gap-5 text-sm">
      <span className="text-neutral-500">
        {label}
      </span>

      <span
        className={
          highlight
            ? "font-semibold text-green-600"
            : "font-medium text-black"
        }
      >
        {value}
      </span>
    </div>
  );
}

function TrustItem({
  icon,
  title,
}) {
  return (
    <div className="flex items-center gap-3 border border-neutral-100 px-4 py-3">
      <div className="text-neutral-500">
        {icon}
      </div>

      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-neutral-500">
        {title}
      </span>
    </div>
  );
}