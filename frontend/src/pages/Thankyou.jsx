import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Truck,
  CreditCard,
  MapPin,
  Package,
  ArrowRight,
  ShoppingBag,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock3,
} from "lucide-react";
import api from "@/utils/config";

export default function ThankYouPage() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order && id) {
      const fetchOrder = async () => {
        try {
          const res = await api.get(`/orders/${id}`);
          setOrder(res.data.order);
        } catch (err) {
          console.error("Failed to fetch order", err);
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-black" />
          <p className="text-sm text-gray-500">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-7 w-7 text-gray-500" />
          </div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Order not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            We couldn't find the order you're looking for.
          </p>

          <button
            onClick={() => navigate("/")}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  const {
    items = [],
    shippingAddress = {},
    subtotal = 0,
    shippingFee = 0,
    total = 0,
    orderNumber,
    paymentStatus,
    paymentMethod,
  } = order;

  const isPaid = paymentStatus === "success";

  const formatPrice = (value = 0) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(orderNumber || "");
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      console.error(error);
    }
  };

  const getDeliveryDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };
const ORDER_STEPS = [
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: ShoppingBag },
];

const statusIndex = {
  confirmed: 0,
  processing: 1,
  shipped: 2,
  delivered: 3,
};

const currentStatus = order.status?.toLowerCase() || "confirmed";
const currentIndex = statusIndex[currentStatus] ?? 0;
  return (
    <div className="min-h-screen bg-[#f7f7f7] text-gray-900">
      {/* TOP SUCCESS SECTION */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:px-10">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-7">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-100 opacity-60" />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <CheckCircle2 className="h-11 w-11 text-green-600" />
              </div>
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-green-600">
              Order successfully placed
            </p>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Thank you for your order!
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
              Your order has been confirmed. We'll carefully prepare your
              items and get them on their way to you.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <div className="flex items-center gap-2 rounded-full border bg-gray-50 px-4 py-2.5">
                <span className="text-xs text-gray-500">
                  Order number
                </span>

                <span className="text-sm font-semibold">
                  #{orderNumber}
                </span>

                <button
                  onClick={copyOrderNumber}
                  className="ml-1 rounded-md p-1.5 transition hover:bg-gray-200"
                  title="Copy order number"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>

              <div
                className={`rounded-full px-4 py-2.5 text-xs font-semibold ${
                  isPaid
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {isPaid ? "Payment successful" : "Cash on Delivery"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {/* ORDER PROGRESS */}
        <section className="mb-8 rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Order status
              </p>

              <h2 className="mt-1 text-xl font-semibold">
                Your order is confirmed
              </h2>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock3 className="h-4 w-4" />
              Estimated delivery by{" "}
              <span className="font-semibold text-gray-900">
                {getDeliveryDate()}
              </span>
            </div>
          </div>

<div className="mt-10">
  <div className="relative px-[7%]">
    {/* BASE LINE */}
    <div className="absolute left-[7%] right-[7%] top-5 h-[2px] bg-gray-200" />

    {/* ACTIVE PROGRESS */}
    <div
      className="absolute left-[7%] top-5 h-[2px] bg-black transition-all duration-500"
      style={{
        width:
          currentIndex === 0
            ? "0%"
            : `${(currentIndex / (ORDER_STEPS.length - 1)) * 86}%`,
      }}
    />

    <div className="relative flex justify-between">
      {ORDER_STEPS.map((step, index) => {
        const Icon = step.icon;
        const isActive = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div
            key={step.key}
            className="flex flex-col items-center"
          >
            <div
              className={`
                flex h-10 w-10 items-center justify-center
                rounded-full border-4 border-white
                transition-all duration-300
                ${
                  isCurrent
                    ? "bg-black text-white shadow-md"
                    : isActive
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-400"
                }
              `}
            >
              <Icon className="h-4 w-4" />
            </div>

            <span
              className={`
                mt-3 text-xs font-medium
                ${
                  isActive
                    ? "text-gray-900"
                    : "text-gray-400"
                }
              `}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  </div>
</div>
        </section>

        {/* INFO CARDS */}
        <section className="mb-8 grid gap-5 md:grid-cols-3">
          {/* DELIVERY */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
                <Truck className="h-5 w-5 text-gray-900" />
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-semibold text-green-700">
                On time
              </span>
            </div>

            <h3 className="mt-6 text-base font-semibold">
              Delivery
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Your order should arrive by{" "}
              <span className="font-semibold text-gray-900">
                {getDeliveryDate()}
              </span>
            </p>
          </div>

          {/* PAYMENT */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
              <CreditCard className="h-5 w-5 text-gray-900" />
            </div>

            <h3 className="mt-6 text-base font-semibold">
              Payment
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {paymentMethod === "razorpay"
                ? "Online payment"
                : "Cash on Delivery"}
            </p>

            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isPaid
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isPaid ? "Paid" : "Pay on delivery"}
            </div>
          </div>

          {/* SHIPPING */}
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100">
              <MapPin className="h-5 w-5 text-gray-900" />
            </div>

            <h3 className="mt-6 text-base font-semibold">
              Shipping address
            </h3>

            <div className="mt-2 text-sm leading-6 text-gray-500">
              <p className="font-medium text-gray-900">
                {shippingAddress.firstName}{" "}
                {shippingAddress.lastName}
              </p>

              <p>{shippingAddress.address}</p>

              {shippingAddress.apartment && (
                <p>{shippingAddress.apartment}</p>
              )}

              <p>
                {shippingAddress.city},{" "}
                {shippingAddress.state}
              </p>

              {shippingAddress.zip && (
                <p>{shippingAddress.zip}</p>
              )}
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <div className="grid gap-8 lg:grid-cols-[1fr_370px]">
          {/* ITEMS */}
          <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="border-b px-6 py-6 sm:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Order contents
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    Items in your order
                  </h2>
                </div>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-full bg-gray-100 px-3 text-xs font-semibold">
                  {items.length}
                </div>
              </div>
            </div>

            <div className="divide-y">
              {items.map((item, index) => {
                const isBundle =
                  !!item.bundleId ||
                  !!item.customBundle;

                const image =
                  item.mainImage ||
                  item.bundleProducts?.[0]?.mainImage ||
                  "/placeholder.jpg";

                return (
                  <div
                    key={index}
                    className="px-6 py-6 sm:px-8"
                  >
                    <div className="flex gap-4 sm:gap-5">
                      <div className="h-24 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100 sm:h-28 sm:w-24">
                        <img
                          src={image}
                          alt={item.title || "Product"}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {item.title ||
                                  "Product"}
                              </h3>

                              {isBundle && (
                                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                                  Bundle
                                </span>
                              )}
                            </div>

                            {!isBundle &&
                              item.variant && (
                                <p className="mt-2 text-sm text-gray-500">
                                  Size:{" "}
                                  <span className="font-medium text-gray-900">
                                    {item.variant}
                                  </span>
                                </p>
                              )}

                            <p className="mt-1 text-sm text-gray-500">
                              Quantity:{" "}
                              <span className="font-medium text-gray-900">
                                {item.quantity}
                              </span>
                            </p>
                          </div>

                          <p className="font-semibold text-gray-900">
                            {formatPrice(
                              item.total ??
                                item.price *
                                  item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* BUNDLE PRODUCTS */}
                    {isBundle &&
                      item.bundleProducts?.length > 0 && (
                        <div className="mt-5 rounded-2xl bg-gray-50 p-4 sm:ml-24">
                          <div className="mb-3 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />

                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Bundle includes
                            </p>
                          </div>

                          <div className="space-y-3">
                            {item.bundleProducts.map(
                              (bp, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3"
                                >
                                  <div className="h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                                    <img
                                      src={
                                        bp.mainImage ||
                                        "/placeholder.jpg"
                                      }
                                      alt={
                                        bp.title ||
                                        "Bundle item"
                                      }
                                      className="h-full w-full object-cover"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-800">
                                      {bp.title}
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-500">
                                      {bp.variant &&
                                        `Size: ${bp.variant}`}
                                      {" • "}
                                      Qty:{" "}
                                      {bp.quantity}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* SUMMARY */}
          <aside className="h-fit space-y-5 lg:sticky lg:top-6">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Payment summary
                </p>

                <h2 className="mt-1 text-xl font-semibold">
                  Order summary
                </h2>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">
                    {shippingFee > 0
                      ? formatPrice(shippingFee)
                      : "Free"}
                  </span>
                </div>
              </div>

              <div className="my-6 border-t" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Total
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {formatPrice(total)}
                  </p>
                </div>

                <span className="text-xs text-gray-400">
                  INR
                </span>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-gray-50 p-4">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

                <p className="text-xs leading-5 text-gray-500">
                  Your order and payment information are
                  securely processed.
                </p>
              </div>
            </section>

            {/* ORDER NUMBER */}
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Need help?
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Keep your order number handy if you need
                assistance with your delivery.
              </p>

              <div className="mt-4 flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3">
                <span className="text-sm font-semibold">
                  #{orderNumber}
                </span>

                <button
                  onClick={copyOrderNumber}
                  className="text-xs font-medium text-gray-500 hover:text-black"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </section>
          </aside>
        </div>

        {/* ACTIONS */}
        <section className="mt-10 rounded-3xl bg-black px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Your order is on its way to becoming yours.
              </h2>

              <p className="mt-1 text-sm text-white/60">
                Track your delivery anytime using your order
                number.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() =>
                  navigate(
                    `/trackorder?orderNumber=${orderNumber}`
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
              >
                Track Order
                <ExternalLink className="h-4 w-4" />
              </button>

              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}