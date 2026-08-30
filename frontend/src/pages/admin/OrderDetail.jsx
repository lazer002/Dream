import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/utils/config";
import {
  Loader2,
  Mail,
  RefreshCw,
  Save,
  ArrowUpRight,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Package,
  Truck,
  MapPin,
  CreditCard,
  User,
  Clock3,
  ExternalLink,
  ShieldCheck,
  CircleDollarSign,
  ShoppingBag,
  FileText,
  AlertCircle,
  MoreHorizontal,
   Tag
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Dispatched",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Refunded",
];

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  dispatched: {
    label: "Dispatched",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  shipped: {
    label: "Shipped",
    className: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  "out for delivery": {
    label: "Out for Delivery",
    className: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    className: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-500",
  },
};

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600' viewBox='0 0 600 600'%3E%3Crect width='600' height='600' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23909090' font-family='Arial' font-size='22'%3ENo image%3C/text%3E%3C/svg%3E";

const getItemImages = (item) => {
  const images = [];

  if (item?.mainImage) images.push(item.mainImage);
  if (item?.image) images.push(item.image);
  if (item?.thumbnail) images.push(item.thumbnail);

  if (Array.isArray(item?.images)) {
    images.push(...item.images);
  }

  if (Array.isArray(item?.bundleProducts)) {
    item.bundleProducts.forEach((product) => {
      if (product?.mainImage) images.push(product.mainImage);
      if (product?.image) images.push(product.image);
      if (product?.thumbnail) images.push(product.thumbnail);

      if (Array.isArray(product?.images)) {
        images.push(...product.images);
      }
    });
  }

  const unique = [...new Set(images.filter(Boolean))];

  return unique.length ? unique : [PLACEHOLDER];
};

const normalizeStatus = (status) =>
  String(status || "Pending").toLowerCase();

const formatMoney = (value = 0) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (iso) => {
  if (!iso) return "-";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
};

const getItemName = (item) =>
  item?.title ||
  item?.name ||
  item?.product?.title ||
  item?.product?.name ||
  "Product";

const getItemPrice = (item) =>
  Number(item?.price || item?.product?.price || 0);

const getItemQuantity = (item) =>
  Number(item?.quantity || 1);

export default function OrderDetail() {
  const { publicOrderId } = useParams();
  const navigate = useNavigate()
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const [savingStatus, setSavingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingShipment, setSavingShipment] = useState(false);

  const [internalNote, setInternalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);

  const [notif, setNotif] = useState(null);

  const [openItem, setOpenItem] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [copied, setCopied] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/admin/orders/${publicOrderId}`);
      const ord = res.data.order;

      setOrder(ord);
      setSelectedStatus(ord?.status || ord?.orderStatus || "");
      setTrackingNumber(
        ord?.shipment?.trackingNumber ||
          ord?.trackingNumber ||
          ""
      );
    } catch (error) {
      console.error(error);

      setNotif({
        type: "error",
        text: "Failed to load order.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicOrderId]);

  const showNotif = (type, text, duration = 4000) => {
    setNotif({
      type,
      text,
    });

    setTimeout(() => {
      setNotif(null);
    }, duration);
  };

  const updateStatus = async (newStatus) => {
    if (!order || !newStatus || savingStatus) return;

    try {
      setSavingStatus(true);

      await api.patch(`/admin/orders/${publicOrderId}/status`, {
        status: newStatus,
      });

      showNotif(
        "success",
        `Order status updated to ${newStatus}.`
      );

      await fetchOrder();
    } catch (error) {
      console.error(error);

      showNotif(
        "error",
        "Failed to update order status."
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const saveShipment = async () => {
    try {
      setSavingShipment(true);

      await api.patch(`/admin/orders/${publicOrderId}/shipment`, {
        trackingNumber: trackingNumber.trim(),
      });

      showNotif(
        "success",
        "Shipment information saved."
      );

      await fetchOrder();
    } catch (error) {
      console.error(error);

      showNotif(
        "error",
        "Failed to update shipment."
      );
    } finally {
      setSavingShipment(false);
    }
  };

  const saveNote = async () => {
    if (!internalNote.trim()) {
      showNotif("error", "Note cannot be empty.");
      return;
    }

    try {
      setSavingNote(true);

      await api.post(`/admin/orders/${publicOrderId}/notes`, {
        text: internalNote.trim(),
      });

      setInternalNote("");

      showNotif(
        "success",
        "Internal note added."
      );

      await fetchOrder();
    } catch (error) {
      console.error(error);

      showNotif(
        "error",
        "Failed to save note."
      );
    } finally {
      setSavingNote(false);
    }
  };

  const triggerEmail = async () => {
    try {
      setSendingEmail(true);

      await api.post(`/admin/orders/${publicOrderId}/send-email`, {
        template: "status_change",
      });

      showNotif(
        "success",
        "Order email sent successfully."
      );
    } catch (error) {
      console.error(error);

      showNotif(
        "error",
        "Failed to send email."
      );
    } finally {
      setSendingEmail(false);
    }
  };

  const copyOrderNumber = async () => {
    if (!order?.orderNumber) return;

    try {
      await navigator.clipboard.writeText(
        String(order.orderNumber)
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error(error);
    }
  };

  const totals = useMemo(() => {
    if (!order) {
      return {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0,
      };
    }

    const calculatedSubtotal =
      order.items?.reduce((sum, item) => {
        return (
          sum +
          getItemPrice(item) *
            getItemQuantity(item)
        );
      }, 0) || 0;

    const subtotal =
      Number(order.subtotal ?? calculatedSubtotal);

    const tax = Number(
      order.tax ?? order.taxAmount ?? 0
    );

    const shipping = Number(
      order.shippingFee ??
        order.shipping ??
        0
    );

    const discount = Number(
      order.discount ??
        order.discountAmount ??
        0
    );

    const total = Number(
      order.total ??
        subtotal +
          tax +
          shipping -
          discount
    );

    return {
      subtotal,
      tax,
      shipping,
      discount,
      total,
    };
  }, [order]);

  const currentStatus = normalizeStatus(
    order?.status || order?.orderStatus
  );

  const statusConfig =
    STATUS_CONFIG[currentStatus] ||
    STATUS_CONFIG.pending;

  const customerName = [
    order?.shippingAddress?.firstName,
    order?.shippingAddress?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const itemsCount =
    order?.items?.reduce(
      (sum, item) =>
        sum + getItemQuantity(item),
      0
    ) || 0;

  const openItemModal = (item) => {
    setOpenItem(item);
    setActiveImageIndex(0);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-white shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
          </div>

          <p className="text-sm text-gray-500">
            Loading order...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20">
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Order not found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              This order may have been deleted or is
              no longer available.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      {/* NOTIFICATION */}
      {notif && (
        <div className="fixed right-6 top-6 z-[100]">
          <div
            className={`flex min-w-[320px] items-center gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl ${
              notif.type === "success"
                ? "border-emerald-200 bg-white text-emerald-700"
                : "border-red-200 bg-white text-red-700"
            }`}
          >
            {notif.type === "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}

            <span className="font-medium">
              {notif.text}
            </span>

            <button
              onClick={() => setNotif(null)}
              className="ml-auto rounded-lg p-1 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-5 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-gray-950">
                  Order #{order.orderNumber}
                </h1>

                <Badge
                  variant="outline"
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}
                >
                  <span
                    className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
                  />
                  {statusConfig.label}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span>
                  Placed {formatDate(order.createdAt)}
                </span>

                <span className="text-gray-300">
                  •
                </span>

                <span>
                  {itemsCount}{" "}
                  {itemsCount === 1
                    ? "item"
                    : "items"}
                </span>

                <button
                  onClick={copyOrderNumber}
                  className="inline-flex items-center gap-1.5 font-medium text-gray-700 hover:text-black"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy order number
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={fetchOrder}
                className="rounded-xl"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>

              <Button
                onClick={triggerEmail}
                disabled={sendingEmail}
                className="rounded-xl bg-black text-white hover:bg-gray-800"
              >
                {sendingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Email customer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-6 px-5 py-6 lg:px-8">
        {/* KPI CARDS */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <CircleDollarSign className="h-5 w-5 text-gray-800" />
                </div>

                <span className="text-xs font-medium text-gray-400">
                  ORDER VALUE
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold tracking-tight">
                {formatMoney(totals.total)}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Total order value
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <ShoppingBag className="h-5 w-5 text-gray-800" />
                </div>

                <span className="text-xs font-medium text-gray-400">
                  ITEMS
                </span>
              </div>

              <p className="mt-5 text-2xl font-semibold tracking-tight">
                {itemsCount}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Products in this order
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <CreditCard className="h-5 w-5 text-gray-800" />
                </div>

                <span className="text-xs font-medium text-gray-400">
                  PAYMENT
                </span>
              </div>

              <p className="mt-5 truncate text-lg font-semibold">
                {order.paymentMethod || "—"}
              </p>

              <p
                className={`mt-1 text-xs font-medium ${
                  String(
                    order.paymentStatus || ""
                  ).toLowerCase() === "success"
                    ? "text-emerald-600"
                    : "text-amber-600"
                }`}
              >
                {order.paymentStatus || "Pending"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <Truck className="h-5 w-5 text-gray-800" />
                </div>

                <span className="text-xs font-medium text-gray-400">
                  SHIPPING
                </span>
              </div>

              <p className="mt-5 text-lg font-semibold">
                {trackingNumber
                  ? "Tracking added"
                  : "Not shipped"}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {trackingNumber ||
                  "Add tracking information"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* STATUS TIMELINE */}
      {/* ORDER PROGRESS */}
<Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
  <CardHeader className="border-b bg-white px-6 py-5">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-base font-semibold">
          Order progress
        </CardTitle>

        <CardDescription className="mt-1">
          Track fulfillment from confirmation to delivery.
        </CardDescription>
      </div>

      <Badge
        variant="outline"
        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusConfig.className}`}
      >
        <span
          className={`mr-1.5 h-1.5 w-1.5 rounded-full ${statusConfig.dot}`}
        />
        {statusConfig.label}
      </Badge>
    </div>
  </CardHeader>

  <CardContent className="bg-white px-6 py-10">
    {(() => {
      const steps = [
        {
          label: "Pending",
          description: "Order received",
          icon: Clock3,
          keys: ["pending"],
        },
        {
          label: "Confirmed",
          description: "Order confirmed",
          icon: Check,
          keys: ["confirmed"],
        },
        {
          label: "Dispatched",
          description: "Packed & dispatched",
          icon: Package,
          keys: ["dispatched", "processing"],
        },
        {
          label: "Shipped",
          description: "On the way",
          icon: Truck,
          keys: ["shipped"],
        },
        {
          label: "Delivered",
          description: "Order delivered",
          icon: ShoppingBag,
          keys: ["delivered"],
        },
      ];

      const currentIndex = Math.max(
        0,
        steps.findIndex((step) =>
          step.keys.includes(currentStatus)
        )
      );

      const isCancelled =
        currentStatus === "cancelled";

      const isRefunded =
        currentStatus === "refunded";

      return (
        <div>
          {(isCancelled || isRefunded) && (
            <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>

              <div>
                <p className="text-sm font-semibold text-red-900">
                  Order{" "}
                  {isCancelled
                    ? "cancelled"
                    : "refunded"}
                </p>

                <p className="text-xs text-red-600">
                  This order is no longer in the normal
                  fulfillment process.
                </p>
              </div>
            </div>
          )}

          {/* DESKTOP TIMELINE */}
          <div className="hidden md:block">
            <div className="relative px-[5%]">
  {/* TRACK */}
  <div className="absolute left-[10%] right-[10%] top-[22px] h-[3px] rounded-full bg-gray-100">
    <div
      className="h-full rounded-full bg-black transition-all duration-700"
      style={{
        width:
          currentIndex === 0
            ? "0%"
            : `${(currentIndex / (steps.length - 1)) * 100}%`,
      }}
    />
  </div>

  <div className="relative flex items-start justify-between">
    {steps.map((step, index) => {
      const Icon = step.icon;

      const completed = index < currentIndex;
      const active = index === currentIndex;

      return (
        <div
          key={step.label}
          className="flex w-32 flex-col items-center"
        >
          {/* ICON */}
          <div
            className={`
              relative z-10 flex h-11 w-11 items-center
              justify-center rounded-full border-[4px]
              border-white transition-all duration-500
              ${
                active
                  ? "scale-110 bg-black text-white shadow-[0_0_0_5px_rgba(0,0,0,0.07)]"
                  : completed
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-400"
              }
            `}
          >
            {completed || active ? (
              <Check className="h-4 w-4 stroke-[2.5]" />
            ) : (
              <Icon className="h-4 w-4" />
            )}
          </div>

          {/* LABEL */}
          <div className="mt-4 text-center">
            <p
              className={`text-xs font-semibold ${
                completed || active
                  ? "text-gray-950"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </p>

            <p
              className={`mt-1 text-[11px] ${
                active
                  ? "text-gray-600"
                  : "text-gray-400"
              }`}
            >
              {step.description}
            </p>
          </div>
        </div>
      );
    })}
  </div>
</div>
          </div>

          {/* MOBILE TIMELINE */}
          <div className="md:hidden">
            <div className="space-y-0">
              {steps.map((step, index) => {
                const Icon = step.icon;

                const completed =
                  index < currentIndex;

                const active =
                  index === currentIndex;

                const last =
                  index === steps.length - 1;

                return (
                  <div
                    key={step.label}
                    className="relative flex gap-4"
                  >
                    {/* VERTICAL LINE */}
                    {!last && (
                      <div
                        className={`absolute left-[19px] top-10 h-[calc(100%-4px)] w-[2px] ${
                          index < currentIndex
                            ? "bg-black"
                            : "bg-gray-100"
                        }`}
                      />
                    )}

                    {/* ICON */}
                    <div
                      className={`
                        relative z-10
                        flex h-10 w-10 shrink-0 items-center justify-center
                        rounded-full
                        border-[3px] border-white
                        ${
                          active
                            ? "bg-black text-white shadow-[0_0_0_4px_rgba(0,0,0,0.06)]"
                            : completed
                            ? "bg-black text-white"
                            : "bg-gray-100 text-gray-400"
                        }
                      `}
                    >
                      {completed ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>

                    {/* CONTENT */}
                    <div className="pb-8 pt-1">
                      <p
                        className={`text-sm font-semibold ${
                          active || completed
                            ? "text-gray-950"
                            : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {step.description}
                      </p>

                      {active && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-black" />
                          Current status
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CURRENT STATUS FOOTER */}
          {!isCancelled && !isRefunded && (
            <div className="mt-8 flex flex-col gap-3 rounded-2xl border bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Clock3 className="h-4 w-4 text-gray-700" />
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Current status
                  </p>

                  <p className="text-sm font-semibold text-gray-900">
                    {statusConfig.label}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-[11px] text-gray-400">
                  Last updated
                </p>

                <p className="text-xs font-medium text-gray-700">
                  {formatDate(
                    order.updatedAt ||
                      order.createdAt
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    })()}
  </CardContent>
</Card>

        {/* MAIN GRID */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          {/* LEFT */}
          <div className="min-w-0 space-y-6">
            {/* ITEMS */}
         {/* ITEMS */}
<Card className="overflow-hidden rounded-2xl border-0 shadow-sm">
  <CardHeader className="border-b px-6 py-5">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2 text-base">
          <Package className="h-4 w-4" />
          Order items
        </CardTitle>

        <CardDescription>
          {itemsCount} total units
        </CardDescription>
      </div>

      <Badge
        variant="secondary"
        className="rounded-full"
      >
        {order.items?.length || 0} lines
      </Badge>
    </div>
  </CardHeader>

  <CardContent className="p-0">
    <div className="divide-y">
      {order.items?.map((item, index) => {
        const images = getItemImages(item);
        console.log('✌️item --->', item);


        const isBundle = Boolean(
          item?.bundleId ||
            item?.customBundle ||
            item?.bundleProducts?.length
        );

        const name = getItemName(item);
        const price = getItemPrice(item);
        const quantity = getItemQuantity(item);

        const lineTotal = Number(
          item?.total ?? price * quantity
        );


        
const productId =
  item?.productId?.publicId ||
  item?.product?.publicId ||
  null;

const openProduct = () => {
  if (!productId) {
    openItemModal(item);
    return;
  }

  navigate(`/admin/products/${productId}`);
};

        return (
          <div
            key={
              item?._id ||
              item?.productId ||
              index
            }
            className="group p-5 transition hover:bg-gray-50 sm:p-6"
          >
            <div className="flex gap-4">
              {/* IMAGE */}
              <button
                type="button"
                onClick={openProduct}
                className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border bg-gray-50 sm:h-28 sm:w-24"
              >
                <img
                  src={images[0] || PLACEHOLDER}
                  alt={name}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      PLACEHOLDER;
                  }}
                />

                {images.length > 1 && (
                  <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    +{images.length - 1}
                  </span>
                )}
              </button>

              {/* INFO */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={openProduct}
                        className="text-left font-semibold text-gray-900 hover:underline"
                      >
                        {name}
                      </button>

                      {isBundle && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-purple-200 bg-purple-50 text-purple-700"
                        >
                          Bundle
                        </Badge>
                      )}
                    </div>

                    {/* SKU / SIZE / VARIANT */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      {item?.sku && (
                        <span>
                          SKU:{" "}
                          <strong className="text-gray-800">
                            {item.sku}
                          </strong>
                        </span>
                      )}

                      {item?.variantName && (
                        <span>
                          Variant:{" "}
                          <strong className="text-gray-800">
                            {item.variantName}
                          </strong>
                        </span>
                      )}

                      {item?.variant && (
                        <span>
                          Size:{" "}
                          <strong className="text-gray-800">
                            {item.variant}
                          </strong>
                        </span>
                      )}

                      <span>
                        Qty:{" "}
                        <strong className="text-gray-800">
                          {quantity}
                        </strong>
                      </span>
                    </div>

                    {/* PRODUCT LINK */}
                    <button
                      type="button"
                      onClick={openProduct}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 transition hover:text-black"
                    >
                      View product
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* PRICE */}
                  <div className="shrink-0 text-left sm:text-right">
                    <p className="font-semibold text-gray-900">
                      {formatMoney(lineTotal)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatMoney(price)} × {quantity}
                    </p>
                  </div>
                </div>

                {/* STATUS */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="rounded-full text-[11px]"
                  >
                    {item?.fulfillmentStatus ||
                      "Unfulfilled"}
                  </Badge>

                  {item?.weight && (
                    <span className="text-xs text-gray-400">
                      {item.weight}{" "}
                      {item.weightUnit || "g"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* BUNDLE CONTENTS */}
            {isBundle &&
              Array.isArray(
                item?.bundleProducts
              ) &&
              item.bundleProducts.length > 0 && (
                <div className="mt-5 rounded-2xl border bg-gray-50 p-4 sm:ml-28">
                  <div className="mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />

                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Bundle contents
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {item.bundleProducts.map(
                      (
                        product,
                        productIndex
                      ) => {
                        const bpImages =
                          getItemImages(product);


                     const bpId =
  product?.productId?.publicId ||
  product?.product?.publicId ||
  product?.publicId ||
  null;

const openBundleProduct = () => {
  if (!bpId) {
    openItemModal(product);
    return;
  }

  navigate(`/admin/products/${bpId}`);
};

                      
                        const bpName =
                          product?.title ||
                          product?.name ||
                          product?.product?.title ||
                          "Product";

                        const bpSku =
                          product?.sku ||
                          product?.product?.sku;

                  

                        return (
                          <div
                            key={
                              product?._id ||
                              product?.productId ||
                              productIndex
                            }
                            className="group flex items-center gap-3 rounded-xl border bg-white p-3 transition hover:border-gray-300 hover:shadow-sm"
                          >
                            <button
                              type="button"
                              onClick={
                                openBundleProduct
                              }
                              className="h-14 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-50"
                            >
                              <img
                                src={
                                  bpImages[0] ||
                                  PLACEHOLDER
                                }
                                alt={bpName}
                                className="h-full w-full object-cover transition group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.onerror =
                                    null;

                                  e.currentTarget.src =
                                    PLACEHOLDER;
                                }}
                              />
                            </button>

                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={
                                  openBundleProduct
                                }
                                className="block max-w-full truncate text-left text-sm font-medium text-gray-900 hover:underline"
                              >
                                {bpName}
                              </button>

                              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500">
                                {bpSku && (
                                  <span>
                                    SKU:{" "}
                                    <strong className="text-gray-700">
                                      {bpSku}
                                    </strong>
                                  </span>
                                )}

                                {product?.variant && (
                                  <span>
                                    Size:{" "}
                                    <strong className="text-gray-700">
                                      {
                                        product.variant
                                      }
                                    </strong>
                                  </span>
                                )}

                                <span>
                                  Qty:{" "}
                                  <strong className="text-gray-700">
                                    {product?.quantity ||
                                      1}
                                  </strong>
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={
                                openBundleProduct
                              }
                              className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-black sm:flex"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
          </div>
        );
      })}
    </div>
  </CardContent>
</Card>

            {/* CUSTOMER */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Customer information
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Customer
                    </p>

                    <p className="mt-2 font-semibold">
                      {customerName || "—"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {order.email || "No email"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {order.shippingAddress
                        ?.phone || "No phone"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Shipping address
                    </p>

                    <div className="mt-2 flex gap-2 text-sm leading-6 text-gray-600">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-gray-400" />

                      <div>
                        <p>
                          {
                            order
                              .shippingAddress
                              ?.address
                          }
                          {order
                            .shippingAddress
                            ?.apartment &&
                            `, ${order.shippingAddress.apartment}`}
                        </p>

                        <p>
                          {
                            order.shippingAddress
                              ?.city
                          }
                          {order
                            .shippingAddress
                            ?.state &&
                            `, ${order.shippingAddress.state}`}
                        </p>

                        <p>
                          {
                            order.shippingAddress
                              ?.country
                          }{" "}
                          {order.shippingAddress?.zip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* STATUS HISTORY */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock3 className="h-4 w-4" />
                  Activity
                </CardTitle>

                <CardDescription>
                  Order status history
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                {order.statusHistory?.length ? (
                  <div className="relative ml-2 space-y-6 border-l border-gray-200 pl-7">
                    {[
                      ...order.statusHistory,
                    ]
                      .reverse()
                      .map((history, index) => {
                        const config =
                          STATUS_CONFIG[
                            normalizeStatus(
                              history.status
                            )
                          ] ||
                          STATUS_CONFIG.pending;

                        return (
                          <div
                            key={index}
                            className="relative"
                          >
                            <div
                              className={`absolute -left-[34px] top-1 h-3 w-3 rounded-full border-2 border-white ${config.dot}`}
                            />

                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold capitalize">
                                  {
                                    history.status
                                  }
                                </p>

                                {history.note && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {history.note}
                                  </p>
                                )}
                              </div>

                              <span className="text-xs text-gray-400">
                                {formatDate(
                                  history.updatedAt ||
                                    history.createdAt ||
                                    history.at
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <Clock3 className="mx-auto h-5 w-5 text-gray-300" />

                    <p className="mt-2 text-sm text-gray-500">
                      No status history yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            {/* STATUS */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="text-base">
                  Fulfillment
                </CardTitle>

                <CardDescription>
                  Update the current order status.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>

                  <SelectContent>
                    {STATUS_OPTIONS.map(
                      (status) => (
                        <SelectItem
                          key={status}
                          value={status}
                        >
                          {status}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() =>
                    updateStatus(
                      selectedStatus
                    )
                  }
                  disabled={
                    !selectedStatus ||
                    savingStatus
                  }
                  className="h-11 w-full rounded-xl bg-black text-white hover:bg-gray-800"
                >
                  {savingStatus ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                  )}
                  Update status
                </Button>
              </CardContent>
            </Card>

            {/* PAYMENT */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Method
                  </span>

                  <span className="text-sm font-semibold capitalize">
                    {order.paymentMethod ||
                      "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Status
                  </span>

                  <Badge
                    variant="outline"
                    className={`rounded-full ${
                      String(
                        order.paymentStatus ||
                          ""
                      ).toLowerCase() ===
                      "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {order.paymentStatus ||
                      "Pending"}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Subtotal
                    </span>

                    <span>
                      {formatMoney(
                        totals.subtotal
                      )}
                    </span>
                  </div>

                  {totals.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>

                      <span>
                        -
                        {formatMoney(
                          totals.discount
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Tax
                    </span>

                    <span>
                      {formatMoney(
                        totals.tax
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Shipping
                    </span>

                    <span>
                      {totals.shipping
                        ? formatMoney(
                            totals.shipping
                          )
                        : "Free"}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      Total
                    </span>

                    <span className="text-xl font-semibold">
                      {formatMoney(
                        totals.total
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

                  <p className="text-[11px] leading-5 text-gray-500">
                    Payment and order information is
                    securely stored.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* SHIPMENT */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Shipment
                </CardTitle>

                <CardDescription>
                  Add courier tracking information.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 p-6">
                <Input
                  placeholder="Tracking number"
                  value={trackingNumber}
                  onChange={(e) =>
                    setTrackingNumber(
                      e.target.value
                    )
                  }
                  className="h-11 rounded-xl"
                />

                <Button
                  onClick={saveShipment}
                  disabled={savingShipment}
                  className="h-11 w-full rounded-xl bg-black text-white hover:bg-gray-800"
                >
                  {savingShipment ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save shipment
                </Button>

                {trackingNumber && (
                  <div className="flex items-center justify-between rounded-xl border bg-gray-50 px-3 py-2.5">
                    <span className="truncate text-xs font-medium">
                      {trackingNumber}
                    </span>

                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(
                          trackingNumber
                        )
                      }
                      className="ml-3 shrink-0 rounded-lg p-1.5 hover:bg-gray-200"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* COMMUNICATION */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4" />
                  Customer communication
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 p-6">
                <Button
                  onClick={triggerEmail}
                  disabled={sendingEmail}
                  variant="outline"
                  className="h-11 w-full rounded-xl"
                >
                  {sendingEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send status email
                </Button>
              </CardContent>
            </Card>

            {/* NOTES */}
            <Card className="rounded-2xl border-0 shadow-sm">
              <CardHeader className="border-b px-6 py-5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Internal notes
                </CardTitle>

                <CardDescription>
                  Private notes for your team.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-6">
                <Textarea
                  placeholder="Add a private note..."
                  value={internalNote}
                  onChange={(e) =>
                    setInternalNote(
                      e.target.value
                    )
                  }
                  className="min-h-[100px] resize-none rounded-xl"
                />

                <Button
                  onClick={saveNote}
                  disabled={
                    savingNote ||
                    !internalNote.trim()
                  }
                  className="h-11 w-full rounded-xl bg-black text-white hover:bg-gray-800"
                >
                  {savingNote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Add note
                </Button>

                {order.notes?.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    {order.notes
                      .slice()
                      .reverse()
                      .map(
                        (note, index) => (
                          <div
                            key={index}
                            className="rounded-xl bg-gray-50 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-gray-500">
                                {note.createdBy ||
                                  "Admin"}
                              </span>

                              <span className="text-[10px] text-gray-400">
                                {formatDate(
                                  note.createdAt
                                )}
                              </span>
                            </div>

                            <p className="mt-2 text-xs leading-5 text-gray-700">
                              {note.text}
                            </p>
                          </div>
                        )
                      )}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>

      {/* ITEM DETAILS MODAL */}
      <Dialog
        open={!!openItem}
        onOpenChange={(value) => {
          if (!value) {
            setOpenItem(null);
            setActiveImageIndex(0);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-3xl p-0">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle className="text-lg">
              {getItemName(openItem)}
            </DialogTitle>

            <DialogClose asChild>
              <button className="absolute right-5 top-5 rounded-xl p-2 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          {openItem && (
            <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
              {/* IMAGES */}
              <div className="border-b p-6 md:border-b-0 md:border-r">
                <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-50">
                  <img
                    src={
                      getItemImages(
                        openItem
                      )[activeImageIndex]
                    }
                    alt={getItemName(
                      openItem
                    )}
                    className="h-full w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.onerror =
                        null;

                      e.currentTarget.src =
                        PLACEHOLDER;
                    }}
                  />

                  {getItemImages(
                    openItem
                  ).length > 1 && (
                    <>
                      <button
                        disabled={
                          activeImageIndex <=
                          0
                        }
                        onClick={() =>
                          setActiveImageIndex(
                            (index) =>
                              Math.max(
                                0,
                                index - 1
                              )
                          )
                        }
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-30"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      <button
                        disabled={
                          activeImageIndex >=
                          getItemImages(
                            openItem
                          ).length -
                            1
                        }
                        onClick={() =>
                          setActiveImageIndex(
                            (index) =>
                              Math.min(
                                getItemImages(
                                  openItem
                                ).length -
                                  1,
                                index + 1
                              )
                          )
                        }
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md disabled:opacity-30"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                  {getItemImages(
                    openItem
                  ).map((image, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        setActiveImageIndex(
                          index
                        )
                      }
                      className={`h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 ${
                        index ===
                        activeImageIndex
                          ? "border-black"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror =
                            null;

                          e.currentTarget.src =
                            PLACEHOLDER;
                        }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* DETAILS */}
              <div className="p-6">
                <div className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Product
                    </p>

                    <h3 className="mt-1 text-xl font-semibold">
                      {getItemName(
                        openItem
                      )}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400">
                        Price
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {formatMoney(
                          getItemPrice(
                            openItem
                          )
                        )}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs text-gray-400">
                        Quantity
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {getItemQuantity(
                          openItem
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {openItem.sku && (
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          SKU
                        </span>

                        <span className="font-medium">
                          {openItem.sku}
                        </span>
                      </div>
                    )}

                    {openItem.variantName && (
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          Variant
                        </span>

                        <span className="font-medium">
                          {
                            openItem.variantName
                          }
                        </span>
                      </div>
                    )}

                    {openItem.variant && (
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          Size
                        </span>

                        <span className="font-medium">
                          {openItem.variant}
                        </span>
                      </div>
                    )}

                    {openItem.weight && (
                      <div className="flex items-center justify-between border-b pb-3">
                        <span className="text-sm text-gray-500">
                          Weight
                        </span>

                        <span className="font-medium">
                          {openItem.weight}{" "}
                          {openItem.weightUnit ||
                            "g"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Line total
                      </span>

                      <span className="text-lg font-semibold">
                        {formatMoney(
                          getItemPrice(
                            openItem
                          ) *
                            getItemQuantity(
                              openItem
                            )
                        )}
                      </span>
                    </div>
                  </div>

                  {openItem.options &&
                    Object.keys(
                      openItem.options
                    ).length > 0 && (
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                          Options
                        </p>

                        <div className="mt-3 space-y-2">
                          {Object.entries(
                            openItem.options
                          ).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between text-sm"
                              >
                                <span className="text-gray-500">
                                  {key}
                                </span>

                                <span className="font-medium">
                                  {String(
                                    value
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  <div className="flex gap-2 pt-2">
                    {openItem.sku && (
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            openItem.sku
                          );

                          showNotif(
                            "success",
                            "SKU copied."
                          );
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy SKU
                      </Button>
                    )}

                    <Button
                      className="flex-1 rounded-xl bg-black text-white hover:bg-gray-800"
                      onClick={() =>
                        setOpenItem(null)
                      }
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DEBUG */}
      <details className="mx-auto mb-8 mt-6 max-w-[1500px] px-5 lg:px-8">
        <summary className="cursor-pointer text-xs font-medium text-gray-400">
          Developer data
        </summary>

        <pre className="mt-3 max-h-96 overflow-auto rounded-2xl border bg-white p-5 text-xs text-gray-600 shadow-sm">
          {JSON.stringify(order, null, 2)}
        </pre>
      </details>
    </div>
  );
}