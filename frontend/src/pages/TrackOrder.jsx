// src/pages/TrackOrder.jsx

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Mail,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  Truck,
  X,
} from "lucide-react";

import api from "@/utils/config";


/* =========================================================
   HELPERS
========================================================= */

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const date = (value) => {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const dateTime = (value) => {
  if (!value) return "";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const normalizeStatus = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();

const getStatusStep = (value) => {
  const status = normalizeStatus(value);

  if (
    status.includes("cancel") ||
    status.includes("failed")
  ) {
    return -1;
  }

  if (
    status.includes("deliver")
  ) {
    return 4;
  }

  if (
    status.includes("out for")
  ) {
    return 3;
  }

  if (
    status.includes("ship") ||
    status.includes("transit")
  ) {
    return 2;
  }

  if (
    status.includes("process") ||
    status.includes("confirm") ||
    status.includes("pack")
  ) {
    return 1;
  }

  return 0;
};

const prettyStatus = (value) => {
  if (!value) return "Processing";

  return String(value)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
};


/* =========================================================
   STATUS STEPS
========================================================= */

const STATUS_STEPS = [
  {
    key: "placed",
    title: "Order placed",
    text: "We've received your order.",
    icon: Package,
  },
  {
    key: "processing",
    title: "Processing",
    text: "Your order is being prepared.",
    icon: Box,
  },
  {
    key: "shipped",
    title: "Shipped",
    text: "Your package is on the way.",
    icon: Truck,
  },
  {
    key: "out",
    title: "Out for delivery",
    text: "Your package is arriving today.",
    icon: MapPin,
  },
  {
    key: "delivered",
    title: "Delivered",
    text: "Your order has arrived.",
    icon: CheckCircle2,
  },
];


/* =========================================================
   INPUT
========================================================= */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={
          type === "email"
            ? "email"
            : "off"
        }
        className="h-14 w-full rounded-none border border-black/15 bg-white px-4 text-sm text-black outline-none transition placeholder:text-black/25 focus:border-black"
      />
    </label>
  );
}


/* =========================================================
   SEARCH CARD
========================================================= */

function SearchCard({
  email,
  setEmail,
  orderNumber,
  setOrderNumber,
  remember,
  setRemember,
  loading,
  error,
  onSubmit,
}) {
  return (
    <div className="border border-black/10 bg-white">

      <div className="border-b border-black/10 px-6 py-6 sm:px-8">

        <div className="flex items-start justify-between gap-5">

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/40">
              Find an order
            </p>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
              Order lookup
            </h2>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-black text-white">
            <Search className="h-4 w-4" />
          </div>

        </div>

      </div>

      <form
        onSubmit={onSubmit}
        className="p-6 sm:p-8"
      >

        <div className="grid gap-5 sm:grid-cols-2">

          <Field
            label="Email address"
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            placeholder="you@example.com"
          />

          <Field
            label="Order number"
            value={orderNumber}
            onChange={(event) =>
              setOrderNumber(
                event.target.value.toUpperCase()
              )
            }
            placeholder="GAR-2026-0001"
          />

        </div>

        {error && (
          <div className="mt-5 flex items-start gap-3 border-l-2 border-red-500 bg-red-50 px-4 py-3">

            <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

            <p className="text-xs leading-5 text-red-600">
              {error}
            </p>

          </div>
        )}

        <div className="mt-7 flex flex-col gap-5 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">

          <label className="flex cursor-pointer items-center gap-3">

            <span
              className={`flex h-4 w-4 items-center justify-center border ${
                remember
                  ? "border-black bg-black"
                  : "border-black/25"
              }`}
            >
              {remember && (
                <Check className="h-3 w-3 text-white" />
              )}
            </span>

            <input
              type="checkbox"
              checked={remember}
              onChange={() =>
                setRemember(
                  (current) => !current
                )
              }
              className="sr-only"
            />

            <span className="text-[10px] text-black/50">
              Remember my order details
            </span>

          </label>

        <button
  type="submit"
  disabled={loading}
  className="flex h-10 w-[170px] items-center justify-center gap-3 bg-black text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
>
  {loading ? "Searching..." : "Track order"}

  {!loading && (
    <ArrowUpRight className="h-3 w-3" />
  )}
</button>

        </div>

      </form>
    </div>
  );
}


/* =========================================================
   HELP CARD
========================================================= */

function HelpCard() {
  return (
    <div className="relative overflow-hidden bg-black px-7 py-8 text-white sm:px-8">

      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/10" />

      <div className="relative">

        <div className="mb-8 flex h-11 w-11 items-center justify-center border border-white/15">
          <ShieldCheck className="h-5 w-5 stroke-[1.4]" />
        </div>

        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/40">
          Need help?
        </p>

        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
          We've got you.
        </h3>

        <p className="mt-4 max-w-xs text-sm leading-6 text-white/50">
          Your order number can be found
          in your confirmation email.
        </p>

        <div className="mt-8 border-t border-white/10 pt-6">

          {[
            "Use the email from checkout",
            "Order number is case insensitive",
            "Tracking updates appear automatically",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 py-2"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white/45" />

              <span className="text-xs text-white/55">
                {item}
              </span>
            </div>
          ))}

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   ORDER HEADER
========================================================= */

function OrderHeader({
  order,
  copied,
  onCopy,
}) {
  return (
    <div className="border-b border-black/10 bg-white px-6 py-7 sm:px-9">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="mb-3 flex items-center gap-3">

            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/35">
              Order confirmed
            </span>

            <span className="h-1 w-1 rounded-full bg-black/20" />

            <span className="text-[9px] uppercase tracking-[0.18em] text-black/35">
              {date(order.createdAt)}
            </span>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
              {order.orderNumber ||
                order._id}
            </h2>

            <button
              type="button"
              onClick={onCopy}
              className="flex h-8 items-center gap-2 border border-black/10 px-3 text-[9px] font-bold uppercase tracking-[0.15em] transition hover:border-black"
            >
              <Copy className="h-3 w-3" />

              {copied
                ? "Copied"
                : "Copy"}
            </button>

          </div>

        </div>

        <div className="flex items-center gap-8">

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
              Status
            </p>

            <p className="mt-1 text-sm font-bold">
              {prettyStatus(
                order.orderStatus
              )}
            </p>
          </div>

          <div className="h-9 w-px bg-black/10" />

          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
              Total
            </p>

            <p className="mt-1 text-sm font-bold">
              {money(order.total)}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   PROGRESS
========================================================= */

function Progress({
  order,
}) {
  const current =
    getStatusStep(
      order.orderStatus
    );

  const cancelled =
    current === -1;

  const history =
    Array.isArray(
      order.statusHistory
    )
      ? order.statusHistory
      : [];

  return (
    <div className="border-b border-black/10 bg-white px-6 py-8 sm:px-9 sm:py-10">

      <div className="mb-9 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

        <div>

          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/35">
            Delivery status
          </p>

          <h3 className="mt-2 text-xl font-semibold">
            {cancelled
              ? "Order cancelled"
              : "Your order is on its way"}
          </h3>

        </div>

        {order.estimatedDelivery && (
          <div className="sm:text-right">

            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
              Estimated delivery
            </p>

            <p className="mt-1 text-sm font-semibold">
              {date(
                order.estimatedDelivery
              )}
            </p>

          </div>
        )}

      </div>

      {cancelled ? (
        <div className="flex items-start gap-4 border border-red-100 bg-red-50 p-5">

          <X className="h-5 w-5 shrink-0 text-red-500" />

          <div>

            <p className="text-sm font-semibold text-red-700">
              This order has been cancelled.
            </p>

            <p className="mt-1 text-xs leading-5 text-red-500">
              Contact support if you need
              further assistance.
            </p>

          </div>

        </div>
      ) : (
        <div className="relative">

          <div className="absolute left-5 right-5 top-5 hidden h-px bg-black/10 lg:block" />

          <div className="grid gap-7 lg:grid-cols-5 lg:gap-3">

            {STATUS_STEPS.map(
              (
                step,
                index
              ) => {
                const completed =
                  current >= index;

                const active =
                  current === index;

                const Icon =
                  step.icon;

                const historyItem =
                  history.find(
                    (item) =>
                      getStatusStep(
                        item.status
                      ) === index
                  );

                return (
                  <div
                    key={step.key}
                    className="relative flex gap-4 lg:block"
                  >

                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                        completed
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white text-black/25"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="lg:mt-4">

                      <p
                        className={`text-xs font-semibold ${
                          completed
                            ? "text-black"
                            : "text-black/30"
                        }`}
                      >
                        {step.title}
                      </p>

                      <p className="mt-1 max-w-[180px] text-[10px] leading-5 text-black/35">
                        {historyItem?.note ||
                          step.text}
                      </p>

                      {(historyItem ||
                        active) && (
                        <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.1em] text-black/35">
                          {historyItem
                            ? dateTime(
                                historyItem.updatedAt ||
                                  historyItem.createdAt
                              )
                            : "Current"}
                        </p>
                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>
        </div>
      )}
    </div>
  );
}


/* =========================================================
   SHIPPING
========================================================= */

function ShippingCard({
  order,
}) {
  const address =
    order.shippingAddress ||
    order.address ||
    {};

  return (
    <div className="border border-black/10 bg-white">

      <div className="border-b border-black/10 px-6 py-5 sm:px-7">

        <div className="flex items-center gap-3">

          <MapPin className="h-4 w-4" />

          <h3 className="text-sm font-semibold">
            Delivery details
          </h3>

        </div>

      </div>

      <div className="grid gap-0 sm:grid-cols-2">

        <div className="p-6 sm:border-r sm:border-black/10 sm:p-7">

          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
            Shipping address
          </p>

          <div className="mt-4 space-y-1 text-xs leading-6 text-black/55">

            <p className="font-semibold text-black">
              {address.name ||
                `${address.firstName || ""} ${address.lastName || ""}`.trim() ||
                "—"}
            </p>

            <p>
              {address.address ||
                address.line1 ||
                "—"}
            </p>

            {address.apartment && (
              <p>
                {address.apartment}
              </p>
            )}

            <p>
              {[
                address.city,
                address.state,
                address.zip ||
                  address.postalCode,
              ]
                .filter(Boolean)
                .join(", ") ||
                "—"}
            </p>

            {address.phone && (
              <p className="pt-2">
                {address.phone}
              </p>
            )}

          </div>

        </div>

        <div className="p-6 sm:p-7">

          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black/35">
            Shipping method
          </p>

          <div className="mt-4 flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-black">
              <Truck className="h-4 w-4 text-white" />
            </div>

            <div>

              <p className="text-xs font-semibold">
                {order.shippingMethod ||
                  "Standard delivery"}
              </p>

              <p className="mt-1 text-[10px] leading-5 text-black/35">
                {order.trackingId
                  ? `Tracking ID: ${order.trackingId}`
                  : "Tracking information will appear once your order ships."}
              </p>

            </div>

          </div>

          {order.trackingId && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(
                order.trackingId
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-5 flex h-10 items-center justify-center gap-2 border border-black text-[9px] font-bold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white"
            >
              Track package
              <ArrowUpRight className="h-3 w-3" />
            </a>
          )}

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   ITEM
========================================================= */

function OrderItem({
  item,
}) {
  const productId =
    item.productId ||
    item.publicId;

  const image =
    item.mainImage ||
    item.image ||
    item.images?.[0] ||
    item.bundleProducts?.[0]
      ?.mainImage ||
    "/placeholder.svg";

  return (
    <div className="flex gap-4 border-b border-black/8 py-5 last:border-0">

      <Link
        to={
          productId
            ? `/product/${productId}`
            : "#"
        }
        className="h-28 w-22 shrink-0 overflow-hidden bg-[#f5f5f5]"
      >
        <img
          src={image}
          alt={item.title || "Product"}
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">

        <div className="flex items-start justify-between gap-4">

          <div className="min-w-0">

            <Link
              to={
                productId
                  ? `/product/${productId}`
                  : "#"
              }
              className="text-sm font-semibold leading-5 hover:underline"
            >
              {item.title ||
                "Product"}
            </Link>

            {item.variant && (
              <p className="mt-1 text-xs text-black/40">
                {item.variant}
              </p>
            )}

            <p className="mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-black/35">
              Quantity{" "}
              {item.quantity || 1}
            </p>

          </div>

          <p className="shrink-0 text-sm font-bold">
            {money(
              item.total ??
                Number(item.price || 0) *
                  Number(
                    item.quantity || 1
                  )
            )}
          </p>

        </div>

        {Array.isArray(
          item.bundleProducts
        ) &&
          item.bundleProducts.length >
            0 && (
            <div className="mt-4 border-l border-black/10 pl-3">

              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-black/35">
                Bundle contents
              </p>

              <div className="space-y-2">

                {item.bundleProducts.map(
                  (
                    product,
                    index
                  ) => (
                    <div
                      key={
                        product._id ||
                        product.productId ||
                        index
                      }
                      className="flex items-center gap-2 text-[10px] text-black/50"
                    >

                      {product.mainImage && (
                        <img
                          src={
                            product.mainImage
                          }
                          alt=""
                          className="h-8 w-7 object-cover"
                        />
                      )}

                      <span>
                        {product.title}
                        {" × "}
                        {product.quantity ||
                          1}
                      </span>

                    </div>
                  )
                )}

              </div>
            </div>
          )}

      </div>
    </div>
  );
}


/* =========================================================
   ORDER ITEMS
========================================================= */

function ItemsCard({
  order,
}) {
  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  return (
    <div className="border border-black/10 bg-white">

      <div className="flex items-center justify-between border-b border-black/10 px-6 py-5 sm:px-7">

        <div>

          <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-black/35">
            Your purchase
          </p>

          <h3 className="mt-1 text-lg font-semibold">
            Items
          </h3>

        </div>

        <span className="text-[10px] uppercase tracking-[0.15em] text-black/35">
          {items.length}{" "}
          {items.length === 1
            ? "item"
            : "items"}
        </span>

      </div>

      <div className="px-6 sm:px-7">

        {items.length ? (
          items.map(
            (item, index) => (
              <OrderItem
                key={
                  item._id ||
                  item.productId ||
                  index
                }
                item={item}
              />
            )
          )
        ) : (
          <div className="py-10 text-center text-xs text-black/35">
            No item details available.
          </div>
        )}

      </div>

      <div className="border-t border-black/10 bg-[#fafafa] px-6 py-6 sm:px-7">

        <div className="space-y-3">

          <div className="flex justify-between text-xs">

            <span className="text-black/40">
              Subtotal
            </span>

            <span>
              {money(
                order.subtotal
              )}
            </span>

          </div>

          <div className="flex justify-between text-xs">

            <span className="text-black/40">
              Shipping
            </span>

            <span>
              {money(
                order.shippingFee ||
                  order.shipping ||
                  0
              )}
            </span>

          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-xs">

              <span className="text-black/40">
                Discount
              </span>

              <span>
                -
                {money(
                  order.discount
                )}
              </span>

            </div>
          )}

          <div className="flex justify-between border-t border-black/10 pt-4">

            <span className="font-semibold">
              Total
            </span>

            <span className="text-lg font-bold">
              {money(
                order.total
              )}
            </span>

          </div>

        </div>

      </div>
    </div>
  );
}


/* =========================================================
   ACTIONS
========================================================= */

function ActionsCard({
  order,
  onEmail,
  emailSent,
  loading,
}) {
  return (
    <div className="border border-black/10 bg-white">

      <div className="border-b border-black/10 px-6 py-5 sm:px-7">

        <h3 className="text-sm font-semibold">
          Order options
        </h3>

      </div>

      <div className="space-y-2 p-6 sm:p-7">

        <button
          type="button"
          onClick={onEmail}
          disabled={loading}
          className="flex h-12 w-full items-center justify-between border border-black/10 px-4 transition hover:border-black disabled:opacity-50"
        >
          <span className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.15em]">

            <Mail className="h-4 w-4" />

            {emailSent
              ? "Tracking email sent"
              : "Email me tracking"}

          </span>

          <ChevronRight className="h-3.5 w-3.5" />

        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="flex h-12 w-full items-center justify-between border border-black/10 px-4 transition hover:border-black"
        >
          <span className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.15em]">

            <Package className="h-4 w-4" />

            Print order

          </span>

          <ChevronRight className="h-3.5 w-3.5" />

        </button>

        <Link
          to="/"
          className="flex h-12 w-full items-center justify-between bg-black px-4 text-[9px] font-bold uppercase tracking-[0.15em] text-white transition hover:bg-black/80"
        >
          <span className="flex items-center gap-3">
            <ArrowLeft className="h-4 w-4" />
            Continue shopping
          </span>

          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>

      </div>

      {emailSent && (
        <div className="border-t border-black/10 px-6 py-4 sm:px-7">

          <p className="text-[10px] leading-5 text-black/40">
            Tracking information has been
            sent to{" "}
            <span className="font-semibold text-black">
              {order.email}
            </span>
            .
          </p>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   MAIN
========================================================= */

export default function TrackOrder() {
  const [searchParams] = useSearchParams();

  const [email, setEmail] =
    useState("");

  const [orderNumber, setOrderNumber] =
    useState("");

  const [remember, setRemember] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [order, setOrder] =
    useState(null);

  const [copied, setCopied] =
    useState(false);

  const [emailSent, setEmailSent] =
    useState(false);

  /* =======================================================
     RESTORE
  ======================================================= */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          "track_order_last"
        );

      if (!saved) return;

      const parsed =
        JSON.parse(saved);

      if (parsed?.email) {
        setEmail(
          parsed.email
        );
      }

      if (parsed?.orderNumber) {
        setOrderNumber(
          parsed.orderNumber
        );
      }
    } catch {
      localStorage.removeItem(
        "track_order_last"
      );
    }
  }, []);


useEffect(() => {
  const urlOrderNumber = searchParams
    .get("orderNumber")
    ?.trim()
    .toUpperCase();

  if (!urlOrderNumber) return;

  setOrderNumber(urlOrderNumber);

  const fetchOrderFromUrl = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get(
        `/orders/track?orderNumber=${encodeURIComponent(
          urlOrderNumber
        )}`
      );

      const found =
        response.data?.order ||
        response.data?.data ||
        (
          response.data &&
          !Array.isArray(response.data)
            ? response.data
            : null
        );

      if (!found) {
        setError(
          response.data?.message ||
            "We couldn't find this order."
        );
        return;
      }

      setOrder(found);

      if (remember) {
        localStorage.setItem(
          "track_order_last",
          JSON.stringify({
            email: found.email || "",
            orderNumber: urlOrderNumber,
          })
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "We couldn't find this order."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchOrderFromUrl();
}, [searchParams]);


  /* =======================================================
     SEARCH
  ======================================================= */

  const trackOrder = async (
    event
  ) => {
    event?.preventDefault();

    setError("");
    setOrder(null);
    setEmailSent(false);

    const cleanEmail =
      email.trim();

    const cleanOrder =
      orderNumber
        .trim()
        .toUpperCase();

    if (!cleanEmail && !cleanOrder) {
      setError(
        "Enter your email or order number."
      );
      return;
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanEmail
      )
    ) {
      setError(
        "Enter a valid email address."
      );
      return;
    }

    setLoading(true);

    try {
      const params =
        new URLSearchParams();

      if (cleanEmail) {
        params.set(
          "email",
          cleanEmail
        );
      }

      if (cleanOrder) {
        params.set(
          "orderNumber",
          cleanOrder
        );
      }

      const response =
        await api.get(
          `/orders/track?${params.toString()}`
        );

      const found =
        response.data?.order ||
        response.data?.data ||
        (
          response.data &&
          !Array.isArray(
            response.data
          )
            ? response.data
            : null
        );

      if (!found) {
        setError(
          response.data?.message ||
            "We couldn't find an order with those details."
        );
        return;
      }

      setOrder(found);

      if (remember) {
        localStorage.setItem(
          "track_order_last",
          JSON.stringify({
            email: cleanEmail,
            orderNumber: cleanOrder,
          })
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "We couldn't find an order with those details."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     COPY
  ======================================================= */

  const copyOrder = async () => {
    const value =
      order?.orderNumber ||
      order?._id;

    if (!value) return;

    try {
      await navigator.clipboard.writeText(
        value
      );

      setCopied(true);

      setTimeout(
        () => setCopied(false),
        1600
      );
    } catch {}
  };

  /* =======================================================
     EMAIL
  ======================================================= */

  const sendTrackingEmail =
    async () => {
      if (!order) return;

      setLoading(true);
      setError("");

      try {
        await api.post(
          "/orders/track-email",
          {
            email: order.email,
            orderNumber:
              order.orderNumber,
            orderId: order._id,
          }
        );

        setEmailSent(true);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Unable to send the tracking email."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =======================================================
     RESULT
  ======================================================= */

  const status = useMemo(
    () =>
      prettyStatus(
        order?.orderStatus
      ),
    [order]
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f8f8f8] text-black">

      {/* ===================================================
         HERO
      =================================================== */}

      <section className="border-b border-black/10 bg-white">

        <div className="mx-auto max-w-[1400px] px-5 pb-12 pt-8 sm:px-8 sm:pt-10 lg:px-12">

          <Link
            to="/"
            className="mb-14 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-black/45 transition hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to shop
          </Link>

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

            <div>

              <p className="mb-4 text-[9px] font-bold uppercase tracking-[0.4em] text-black/35">
                Order services
              </p>

              <h1 className="text-5xl font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[72px] lg:leading-[0.92]">
                Track
                <br />
                your order.
              </h1>

            </div>

            <div className="max-w-sm md:pb-1">

              <p className="text-sm leading-6 text-black/45">
                Follow your order from our
                warehouse to your doorstep.
                Enter your details below to
                see the latest update.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
         LOOKUP
      =================================================== */}

      {!order && (
        <section className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_370px]">

            <SearchCard
              email={email}
              setEmail={setEmail}
              orderNumber={orderNumber}
              setOrderNumber={
                setOrderNumber
              }
              remember={remember}
              setRemember={setRemember}
              loading={loading}
              error={error}
              onSubmit={trackOrder}
            />

            <HelpCard />

          </div>

          <div className="mt-8 flex items-start gap-4 border-t border-black/10 pt-7">

            <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-black/25" />

            <div>

              <p className="text-xs font-semibold">
                Can't find your order number?
              </p>

              <p className="mt-1 max-w-xl text-xs leading-6 text-black/35">
                Check your confirmation email.
                Your order number is normally
                included near the top of the
                message.
              </p>

            </div>

          </div>

        </section>
      )}

      {/* ===================================================
         RESULT
      =================================================== */}

      {order && (
        <section className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12 lg:py-12">

          {/* BACK */}

          <button
            type="button"
            onClick={() => {
              setOrder(null);
              setError("");
            }}
            className="mb-7 inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-black/40 hover:text-black"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Track another order
          </button>

          {/* ORDER HEADER */}

          <OrderHeader
            order={order}
            copied={copied}
            onCopy={copyOrder}
          />

          {/* CURRENT STATUS STRIP */}

          <div className="border-x border-b border-black/10 bg-black px-6 py-5 text-white sm:px-9">

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div className="flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center bg-white text-black">
                  <Truck className="h-4 w-4" />
                </div>

                <div>

                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Current status
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {status}
                  </p>

                </div>

              </div>

              {order.trackingId && (
                <div className="text-left sm:text-right">

                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Tracking number
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {order.trackingId}
                  </p>

                </div>
              )}

            </div>

          </div>

          {/* PROGRESS */}

          <Progress
            order={order}
          />

          {/* CONTENT */}

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">

            <div className="space-y-5">

              <ItemsCard
                order={order}
              />

              <ShippingCard
                order={order}
              />

            </div>

            <div className="space-y-5">

              <ActionsCard
                order={order}
                onEmail={
                  sendTrackingEmail
                }
                emailSent={
                  emailSent
                }
                loading={loading}
              />

              <div className="border border-black/10 bg-black p-7 text-white">

                <ShieldCheck className="mb-6 h-5 w-5" />

                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/35">
                  GARIBB care
                </p>

                <h3 className="mt-2 text-lg font-semibold">
                  We're here if you need us.
                </h3>

                <p className="mt-3 text-xs leading-6 text-white/45">
                  If your order hasn't moved as
                  expected, our support team can
                  help with delivery updates.
                </p>

                <Link
                  to="/contact"
                  className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-[9px] font-bold uppercase tracking-[0.18em]"
                >
                  Contact support
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

              </div>

            </div>

          </div>

          {/* FOOTER NOTE */}

          <div className="mt-8 flex flex-col justify-between gap-3 border-t border-black/10 pt-6 sm:flex-row sm:items-center">

            <p className="text-[9px] uppercase tracking-[0.2em] text-black/30">
              Thank you for shopping with GARIBB
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em]"
            >
              Continue shopping
              <ArrowUpRight className="h-3 w-3" />
            </Link>

          </div>

        </section>
      )}

    </main>
  );
}