import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Copy,
  FileText,
  Headphones,
  MapPin,
  Navigation,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
  XCircle,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import toast from "react-hot-toast";

import {
  useTrackOrderQuery,
  useCancelOrderMutation,
} from "@/store/api";

const formatPrice = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (
  value,
  withTime = false
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
};

const STATUS_STEPS = [
  "pending",
  "confirmed",
  "dispatched",
  "shipped",
  "out for delivery",
  "delivered",
];

const DISPLAY_STEPS = [
  {
    key: "placed",
    title: "Order Placed",
  },
  {
    key: "confirmed",
    title: "Confirmed",
  },
  {
    key: "shipped",
    title: "Shipped",
  },
  {
    key: "delivered",
    title: "Delivered",
  },
];

const getDisplayIndex = (status) => {
  const normalized = String(
    status || ""
  ).toLowerCase();

  if (
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    return -1;
  }

  const index =
    STATUS_STEPS.indexOf(normalized);

  if (index < 0) return 0;
  if (index >= 5) return 3;
  if (index >= 3) return 2;
  if (index >= 1) return 1;

  return 0;
};

const normalizeStatus = (status) =>
  String(status || "")
    .toLowerCase()
    .replace(/_/g, " ");

const getCurrentStatus = (order) => {
  if (
    Array.isArray(order?.statusHistory) &&
    order.statusHistory.length
  ) {
    return normalizeStatus(
      order.statusHistory[
        order.statusHistory.length - 1
      ]?.status
    );
  }

  return normalizeStatus(
    order?.orderStatus || "processing"
  );
};

const getImage = (item) =>
  item?.mainImage ||
  item?.image ||
  item?.product?.images?.[0] ||
  "/images/placeholder-400.png";

const isBundle = (item) =>
  Array.isArray(item?.bundleProducts) &&
  item.bundleProducts.length > 0 &&
  (!!item?.bundleId ||
    !!item?.customBundle ||
    !!item?.customBundleId ||
    item?.bundleProducts?.length > 0);

const getItemSize = (item) =>
  item?.variant ||
  item?.size ||
  "OS";

function ProgressTimeline({
  order,
  currentStatus,
}) {
  const displayIndex =
    getDisplayIndex(currentStatus);

  if (
    currentStatus === "cancelled" ||
    currentStatus === "canceled"
  ) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="relative">
        {/* TRACK */}
        <div
          className="
            absolute
            left-[12.5%]
            right-[12.5%]
            top-[11px]
            h-[2px]
            bg-[#E0E0E0]
          "
        />

        <div
          className="
            absolute
            left-[12.5%]
            top-[11px]
            h-[2px]
            bg-[#176B2A]
            transition-all
            duration-500
          "
          style={{
            width:
              displayIndex <= 0
                ? "0%"
                : displayIndex === 1
                ? "25%"
                : displayIndex === 2
                ? "58.33%"
                : "75%",
          }}
        />

        <div className="relative grid grid-cols-4">
          {DISPLAY_STEPS.map(
            (step, index) => {
              const active =
                index <= displayIndex;

              const historyItem =
                order?.statusHistory?.[
                  index
                ];

              return (
                <div
                  key={step.key}
                  className="flex min-w-0 flex-col items-center"
                >
                  <div
                    className={`
                      flex
                      h-[22px]
                      w-[22px]
                      items-center
                      justify-center
                      rounded-full
                      border
                      transition-all
                      duration-300
                      ${
                        active
                          ? "border-[#176B2A] bg-[#176B2A]"
                          : "border-[#D8D8D8] bg-white"
                      }
                    `}
                  >
                    {active && (
                      <Check
                        className="h-3 w-3 text-white"
                      />
                    )}
                  </div>

                  <p
                    className={`
                      mt-2
                      text-center
                      text-[9px]
                      leading-3
                      ${
                        active
                          ? "font-bold text-[#222]"
                          : "font-medium text-gray-400"
                      }
                    `}
                  >
                    {step.title}
                  </p>

                  <p className="mt-1 text-center text-[8px] text-gray-400">
                    {historyItem?.updatedAt
                      ? formatDate(
                          historyItem.updatedAt
                        )
                      : index <= displayIndex
                      ? formatDate(
                          order?.createdAt
                        )
                      : "—"}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  order,
  currentStatus,
}) {
  const delivered =
    currentStatus === "delivered";

  const cancelled =
    currentStatus === "cancelled" ||
    currentStatus === "canceled";

  const outForDelivery =
    currentStatus === "out for delivery";

  const deliveredDate =
    order?.statusHistory?.find(
      (item) =>
        normalizeStatus(item?.status) ===
        "delivered"
    )?.updatedAt;

  return (
    <section
      className="
        rounded-xl
        border
        border-[#D8D8D8]
        bg-white
        p-5
        sm:p-6
      "
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className={`
                text-sm
                font-black
                ${
                  cancelled
                    ? "text-[#B42318]"
                    : "text-[#176B2A]"
                }
              `}
            >
              {cancelled
                ? "Cancelled"
                : delivered
                ? "Delivered"
                : outForDelivery
                ? "Out for Delivery"
                : "Order in Progress"}
            </h2>

            {delivered && (
              <span
                className="
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-[#B6FF2E]
                "
              >
                <Check className="h-3 w-3" />
              </span>
            )}
          </div>

          <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">
            {delivered
              ? `Your order was delivered on ${formatDate(
                  deliveredDate
                )}.`
              : cancelled
              ? "This order has been cancelled."
              : "Your order is moving through our delivery network."}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            toast("Order tracking can be connected here.")
          }
          className="
            inline-flex
            shrink-0
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-gray-200
            px-4
            py-2.5
            text-[9px]
            font-black
            uppercase
            tracking-[0.15em]
            transition
            hover:border-black
          "
        >
          <Navigation className="h-3.5 w-3.5" />
          Track Order
        </button>
      </div>

      <ProgressTimeline
        order={order}
        currentStatus={currentStatus}
      />
    </section>
  );
}

function AddressCard({ address }) {
  return (
    <section
      className="
        rounded-xl
        border
        border-[#D8D8D8]
        bg-white
        p-5
        sm:p-6
      "
    >
      <div className="flex items-start gap-4">
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#F1F8E9]
          "
        >
          <MapPin className="h-4 w-4 text-[#176B2A]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-black">
                Delivery Address
              </h2>

              <p className="mt-3 text-sm font-bold">
                {[
                  address?.firstName,
                  address?.lastName,
                ]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {address?.address ||
                  "Address not available"}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {[
                  address?.apartment,
                  address?.city,
                  address?.state,
                  address?.pincode ||
                    address?.zip,
                  address?.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>

              {address?.phone && (
                <p className="mt-2 text-sm font-medium text-black">
                  {address.phone}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                toast("Address change can be connected here.")
              }
              className="
                shrink-0
                text-[10px]
                font-black
                uppercase
                tracking-[0.15em]
                text-[#176B2A]
              "
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BundleItems({
  products,
}) {
  return (
    <div
      className="
        mt-4
        overflow-hidden
        rounded-lg
        border
        border-gray-200
        bg-[#FAFAFA]
      "
    >
      {products.map((sub, index) => (
        <div
          key={
            sub?._id ||
            sub?.productId ||
            index
          }
          className={`
            flex
            items-center
            gap-3
            px-3
            py-3
            ${
              index !==
              products.length - 1
                ? "border-b border-gray-200"
                : ""
            }
          `}
        >
          <img
            src={getImage(sub)}
            alt={sub?.title || "Product"}
            className="
              h-10
              w-10
              shrink-0
              rounded-md
              bg-white
              object-cover
            "
          />

          <span className="w-5 text-[9px] text-gray-400">
            {index + 1}.
          </span>

          <p className="min-w-0 flex-1 truncate text-xs font-semibold">
            {sub?.title ||
              sub?.product?.title ||
              "Product"}
          </p>

          <p className="shrink-0 text-[9px] text-gray-500">
            Qty: {sub?.quantity || 1}
          </p>
        </div>
      ))}
    </div>
  );
}

function OrderItem({
  item,
  index,
  expanded,
  onToggle,
}) {
  const bundle = isBundle(item);

  const paidPrice = Number(
    item?.total ||
      item?.price ||
      0
  );

  const quantity = Number(
    item?.quantity || 1
  );

  const originalPrice = bundle
    ? Number(item?.price || paidPrice)
    : Number(item?.price || paidPrice) *
      quantity;

  const hasDiscount =
    originalPrice > paidPrice;

  const discountAmount = Math.max(
    originalPrice - paidPrice,
    0
  );

  return (
    <div
      className="
        rounded-xl
        border
        border-[#E5E5E5]
        bg-white
        p-4
      "
    >
      <div className="flex gap-4">
        <img
          src={getImage(item)}
          alt={item?.title || "Product"}
          className="
            h-28
            w-24
            shrink-0
            rounded-xl
            bg-[#F7F7F7]
            object-cover
            sm:h-32
            sm:w-28
          "
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              {bundle && (
                <span
                  className="
                    inline-flex
                    rounded-md
                    bg-[#EAF5DD]
                    px-2
                    py-1
                    text-[8px]
                    font-black
                    uppercase
                    tracking-[0.12em]
                    text-[#176B2A]
                  "
                >
                  Bundle (
                  {item.bundleProducts.length}{" "}
                  Items)
                </span>
              )}

              <h3 className="mt-1 line-clamp-2 text-sm font-black">
                {item?.title ||
                  "GARRIB Product"}
              </h3>

              {!bundle && (
                <>
                  <p className="mt-2 text-xs text-gray-500">
                    Size: {getItemSize(item)}
                  </p>

                  {item?.color && (
                    <p className="mt-1 text-xs text-gray-500">
                      Color: {item.color}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-gray-500">
                    Qty: {quantity}
                  </p>
                </>
              )}

              {bundle && (
                <>
                  <p className="mt-2 text-xs text-gray-500">
                    {item.bundleProducts.length}{" "}
                    Items
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Qty: {quantity}
                  </p>
                </>
              )}
            </div>

            <div className="shrink-0 text-right">
              <div className="flex flex-col items-end">
                {hasDiscount && (
                  <span className="text-xs text-gray-400 line-through">
                    {formatPrice(
                      originalPrice
                    )}
                  </span>
                )}

                <span className="text-lg font-black">
                  {formatPrice(paidPrice)}
                </span>
              </div>

              {hasDiscount && (
                <p className="mt-1 text-[9px] font-bold text-[#176B2A]">
                  You save{" "}
                  {formatPrice(
                    discountAmount
                  )}
                </p>
              )}

              <p className="mt-1 text-[9px] font-medium capitalize text-gray-400">
                {item?.status ||
                  "Confirmed"}
              </p>
            </div>
          </div>

          {bundle && (
            <button
              type="button"
              onClick={onToggle}
              className="
                mt-4
                flex
                items-center
                gap-1.5
                text-[9px]
                font-black
                uppercase
                tracking-[0.12em]
                text-[#176B2A]
              "
            >
              {expanded
                ? "Hide bundle items"
                : `${item.bundleProducts.length} items in this bundle`}

              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {bundle && expanded && (
        <BundleItems
          products={
            item.bundleProducts
          }
        />
      )}

      <div
        className="
          mt-4
          flex
          flex-wrap
          border-t
          border-gray-100
          pt-3
        "
      >
        {bundle ? (
          <>
            <button
              type="button"
              onClick={onToggle}
              className="
                flex
                items-center
                gap-2
                border-r
                border-gray-200
                pr-5
                text-[9px]
                font-black
                uppercase
                tracking-[0.1em]
              "
            >
              <Package className="h-3.5 w-3.5" />
              {expanded
                ? "Hide Bundle Items"
                : "View Bundle Items"}
            </button>

            <button
              type="button"
              onClick={() =>
                toast("Buy Again can be connected here.")
              }
              className="
                flex
                items-center
                gap-2
                pl-5
                text-[9px]
                font-black
                uppercase
                tracking-[0.1em]
              "
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Buy Again
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() =>
                toast("Reorder can be connected here.")
              }
              className="
                flex
                items-center
                gap-2
                border-r
                border-gray-200
                pr-5
                text-[9px]
                font-black
                uppercase
                tracking-[0.1em]
              "
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reorder
            </button>

            <button
              type="button"
              onClick={() =>
                toast("Return / Exchange can be connected here.")
              }
              className="
                flex
                items-center
                gap-2
                border-r
                border-gray-200
                px-5
                text-[9px]
                font-black
                uppercase
                tracking-[0.1em]
              "
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Return / Exchange
            </button>

            <button
              type="button"
              onClick={() =>
                toast("Buy Again can be connected here.")
              }
              className="
                flex
                items-center
                gap-2
                pl-5
                text-[9px]
                font-black
                uppercase
                tracking-[0.1em]
              "
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Buy Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function OrderItems({ items }) {
  const [expandedBundle, setExpandedBundle] =
    useState(null);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-1">
        <h2 className="text-sm font-black">
          Order Items
        </h2>

        <span className="text-sm text-gray-400">
          ({items.length})
        </span>
      </div>

      <div
        className="
          overflow-hidden
          rounded-xl
          border
          border-[#E4E4E4]
          bg-white
          p-2
        "
      >
        <p className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em]">
          Order Items ({items.length})
        </p>

        <div className="space-y-2">
          {items.map((item, index) => (
            <OrderItem
              key={
                item?._id ||
                item?.productId ||
                index
              }
              item={item}
              index={index}
              expanded={
                expandedBundle === index
              }
              onToggle={() =>
                setExpandedBundle(
                  (current) =>
                    current === index
                      ? null
                      : index
                )
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function OrderSummary({ order, itemCount }) {
  return (
    <section
      className="
        rounded-xl
        border
        border-[#D8D8D8]
        bg-white
        p-5
        sm:p-6
      "
    >
      <h2 className="text-sm font-black">
        Order Summary
      </h2>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Price ({itemCount} Items)
          </span>

          <span className="text-sm font-semibold">
            {formatPrice(
              order?.subtotal
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Discount
          </span>

          <span className="text-sm font-semibold text-[#176B2A]">
            -{formatPrice(
              order?.discountAmount
            )}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500">
            Shipping Charges
          </span>

          <span className="text-sm font-semibold text-[#176B2A]">
            {Number(
              order?.shippingFee || 0
            ) > 0
              ? formatPrice(
                  order.shippingFee
                )
              : "FREE"}
          </span>
        </div>

        {Number(order?.taxAmount || 0) >
          0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-500">
              Tax
            </span>

            <span className="text-sm font-semibold">
              {formatPrice(
                order.taxAmount
              )}
            </span>
          </div>
        )}

        <div className="border-t border-gray-100 pt-5">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-black">
                Total Amount
              </p>

              <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-gray-400">
                Paid via{" "}
                {order?.paymentMethod ||
                  "Online Payment"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-black">
                {formatPrice(
                  order?.total
                )}
              </p>

              <p className="mt-1 text-[9px] font-bold capitalize text-[#176B2A]">
                {order?.paymentStatus ||
                  "Paid"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportCard() {
  return (
    <section
      className="
        flex
        flex-col
        gap-5
        rounded-xl
        border
        border-[#D8D8D8]
        bg-white
        p-5
        sm:flex-row
        sm:items-center
        sm:p-6
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-[#F5F5F5]
        "
      >
        <Headphones className="h-5 w-5" />
      </div>

      <div className="flex-1">
        <h2 className="text-sm font-black">
          Need Help?
        </h2>

        <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">
          If you have any issues with your
          order, our support team is here to
          help.
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          toast("Support contact can be connected here.")
        }
        className="
          shrink-0
          rounded-lg
          bg-black
          px-5
          py-3
          text-[9px]
          font-black
          uppercase
          tracking-[0.15em]
          text-white
          transition
          hover:bg-[#B6FF2E]
          hover:text-black
        "
      >
        Contact Support
      </button>
    </section>
  );
}

function BenefitsCard() {
  const benefits = [
    {
      icon: Truck,
      title: "Free Delivery",
      text: "On orders above ₹499",
    },
    {
      icon: RefreshCw,
      title: "Easy Returns",
      text: "15 days return policy",
    },
    {
      icon: ShieldCheck,
      title: "Secure Payment",
      text: "100% secure checkout",
    },
    {
      icon: Headphones,
      title: "Support",
      text: "9 AM - 9 PM",
    },
  ];

  return (
    <section
      className="
        grid
        grid-cols-2
        overflow-hidden
        rounded-xl
        border
        border-[#D8D8D8]
        bg-white
        sm:grid-cols-4
      "
    >
      {benefits.map(
        (benefit, index) => {
          const Icon = benefit.icon;

          return (
            <div
              key={benefit.title}
              className={`
                flex
                flex-col
                items-center
                px-4
                py-6
                text-center
                ${
                  index !==
                    benefits.length - 1 &&
                  "border-r border-gray-100"
                }
                ${
                  index < 2
                    ? "border-b sm:border-b-0"
                    : ""
                }
              `}
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F5F5F5]
                "
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className="mt-3 text-[10px] font-black">
                {benefit.title}
              </p>

              <p className="mt-1 text-[9px] text-gray-400">
                {benefit.text}
              </p>
            </div>
          );
        }
      )}
    </section>
  );
}

function CancelModal({
  open,
  loading,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/50
        p-5
        backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          bg-white
          p-6
          shadow-2xl
        "
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-gray-100
            "
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-2">
          <h2 className="text-xl font-black">
            Cancel Order?
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500">
            Are you sure you want to cancel
            this order? This action may not
            be reversible once confirmed.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              border
              border-gray-200
              px-4
              py-3.5
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
            "
          >
            Keep Order
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="
              rounded-xl
              bg-black
              px-4
              py-3.5
              text-[10px]
              font-black
              uppercase
              tracking-[0.12em]
              text-white
              disabled:opacity-50
            "
          >
            {loading
              ? "Cancelling..."
              : "Cancel Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const navigate = useNavigate();
  const { orderNumber } = useParams();

  const decodedOrderNumber =
    decodeURIComponent(
      orderNumber || ""
    );

  const {
    data: orderResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useTrackOrderQuery(
    {
      orderNumber:
        decodedOrderNumber,
    },
    {
      skip: !decodedOrderNumber,
    }
  );

  const [
    cancelOrder,
    {
      isLoading: isCancelling,
    },
  ] = useCancelOrderMutation();

  const [cancelModalOpen, setCancelModalOpen] =
    useState(false);

  const order =
    orderResponse?.order ||
    orderResponse ||
    null;

  const items = Array.isArray(
    order?.items
  )
    ? order.items
    : [];

  const currentStatus =
    getCurrentStatus(order);

  const canCancel = [
    "pending",
    "confirmed",
    "processing",
  ].includes(currentStatus);

  const canReturn = [
    "shipped",
    "out for delivery",
    "delivered",
  ].includes(currentStatus);

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          Number(item?.quantity || 1),
        0
      ),
    [items]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        order?.orderNumber || ""
      );

      toast.success(
        "Order ID copied"
      );
    } catch {
      toast.error(
        "Unable to copy order ID"
      );
    }
  };

  const handleCancel = async () => {
    if (!order?._id) return;

    try {
      await cancelOrder(
        order._id
      ).unwrap();

      setCancelModalOpen(false);

      await refetch();

      toast.success(
        "Order cancelled"
      );
    } catch (error) {
      toast.error(
        error?.data?.message ||
          "Unable to cancel order"
      );
    }
  };

  if (isLoading || isFetching) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-[#F5F5F5]
              "
            >
              <Package className="h-6 w-6 animate-pulse" />
            </div>

            <p className="mt-5 text-[9px] font-black uppercase tracking-[0.25em] text-gray-400">
              Loading order...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
          <Package className="h-12 w-12 text-gray-300" />

          <h1 className="mt-6 text-2xl font-black">
            Order not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            We couldn't load this order.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            className="
              mt-6
              rounded-xl
              bg-black
              px-7
              py-3.5
              text-[9px]
              font-black
              uppercase
              tracking-[0.2em]
              text-white
            "
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-[1150px] px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
          {/* HEADER */}
          <header className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                navigate(-1)
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-gray-200
                transition
                hover:border-black
              "
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <h1 className="text-sm font-black uppercase tracking-[0.12em]">
              Order Details
            </h1>

            <button
              type="button"
              onClick={() =>
                toast("Contact support can be connected here.")
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-gray-200
              "
            >
              <Headphones className="h-4 w-4" />
            </button>
          </header>

          {/* ORDER META */}
          <div
            className="
              flex
              flex-col
              gap-5
              py-7
              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-gray-400">
                  ORDER ID
                </span>

                <span className="text-sm font-black">
                  #{order.orderNumber}
                </span>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="
                    text-gray-400
                    transition
                    hover:text-black
                  "
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="mt-2 text-[10px] text-gray-500">
                Placed on{" "}
                {formatDate(
                  order.createdAt,
                  true
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                toast("Invoice download can be connected here.")
              }
              className="
                flex
                items-center
                gap-2
                self-start
                text-[10px]
                font-black
                uppercase
                tracking-[0.12em]
                text-[#176B2A]
              "
            >
              View Invoice

              <FileText className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-6">
            {/* STATUS */}
            <StatusCard
              order={order}
              currentStatus={currentStatus}
            />

            {/* ADDRESS */}
            <AddressCard
              address={
                order.shippingAddress
              }
            />

            {/* ITEMS */}
            <OrderItems
              items={items}
            />

            {/* SUMMARY */}
            <OrderSummary
              order={order}
              itemCount={itemCount}
            />

            {/* SUPPORT */}
            <SupportCard />

            {/* BENEFITS */}
            <BenefitsCard />

            {/* ACTIONS */}
            {(canCancel || canReturn) && (
              <div className="flex flex-col gap-3 sm:flex-row">
                {canCancel && (
                  <button
                    type="button"
                    onClick={() =>
                      setCancelModalOpen(
                        true
                      )
                    }
                    className="
                      flex
                      flex-1
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-black
                      px-5
                      py-4
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      text-white
                      transition
                      hover:bg-[#B6FF2E]
                      hover:text-black
                    "
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </button>
                )}

                {canReturn && (
                  <button
                    type="button"
                    onClick={() =>
                      toast(
                        "You can reject delivery or request return."
                      )
                    }
                    className="
                      flex
                      flex-1
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-black
                      px-5
                      py-4
                      text-[10px]
                      font-black
                      uppercase
                      tracking-[0.15em]
                      transition
                      hover:bg-black
                      hover:text-white
                    "
                  >
                    <RefreshCw className="h-4 w-4" />
                    Return / Exchange
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <CancelModal
        open={cancelModalOpen}
        loading={isCancelling}
        onClose={() =>
          setCancelModalOpen(false)
        }
        onConfirm={handleCancel}
      />
    </>
  );
}