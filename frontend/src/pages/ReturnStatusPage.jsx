import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import api from "@/utils/config";

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

const RETURN_STATUS_STEPS = [
  "submitted",
  "awaiting_shipment",
  "received",
  "inspecting",
  "approved",
  "refunded",
  "completed",
  "rejected",
  "cancelled",
];

const STATUS_LABELS = {
  submitted: "Submitted",
  awaiting_shipment: "Awaiting Shipment",
  received: "Received",
  inspecting: "Inspecting",
  approved: "Approved",
  refunded: "Refunded",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_HINTS = {
  submitted: "We’ve received your request and are reviewing it.",
  awaiting_shipment:
    "Please ship the items back using the instructions shared over email.",
  received: "Your parcel has reached our facility and will be inspected soon.",
  inspecting: "Our team is inspecting the items for quality and eligibility.",
  approved:
    "Your return has been approved. Refund or exchange will be processed soon.",
  refunded:
    "Refund has been processed. It may take 2–7 business days to reflect in your account.",
  completed: "Your return request is completed.",
  rejected: "This return was rejected. Check the status notes for more details.",
  cancelled: "This return was cancelled.",
};

async function fetchReturnRequest(orderNumber) {
  try {
    const res = await api.get(`/returns/order/${orderNumber}`);
    const data = res.data;
    const returnRequest = Array.isArray(data) ? data[0] : data;

    if (!returnRequest) {
      throw new Error("No return found for this order.");
    }

    return returnRequest;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const res = await api.get("/returns", {
        params: { orderNumber },
      });
      const data = res.data;
      const returnRequest = Array.isArray(data) ? data[0] : data;

      if (!returnRequest) {
        throw new Error("No return found for this order.");
      }

      return returnRequest;
    }

    console.error("Error fetching return:", error);
    throw new Error(`Failed to fetch return for order ${orderNumber}`);
  }
}

const formatCurrency = (amount) => {
  if (typeof amount !== "number") return amount;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹ ${amount}`;
  }
};

export default function ReturnStatusPage() {
  const params = useParams();
  const orderNumber = params.orderNumber || "";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderNumber) {
      setError("Missing order number in URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetchReturnRequest(orderNumber);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err && err.message ? err.message : "Something went wrong.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const currentIndex =
    data && data.status ? RETURN_STATUS_STEPS.indexOf(data.status) : -1;

  const stats = useMemo(() => {
    if (!data || !Array.isArray(data.items)) return null;
    const totalItems = data.items.length;
    const totalQty = data.items.reduce(
      (sum, item) => sum + (item.qty || 0),
      0
    );
    const subtotal = data.items.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 0),
      0
    );
    return { totalItems, totalQty, subtotal };
  }, [data]);

  const currentStatusHint =
    data && data.status ? STATUS_HINTS[data.status] : null;

  const createdDate =
    data && data.createdAt ? new Date(data.createdAt).toLocaleString() : null;

  if (loading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="rounded-2xl border bg-card/60 p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                <span>Return center</span>
              </div>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
            <Skeleton className="h-7 w-40 rounded-full" />
          </div>

          <Card className="border bg-background shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Return details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.2fr,1.3fr]">
            <Card className="border bg-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>

            <Card className="border bg-background shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10">
        <div className="rounded-2xl border bg-card/60 p-6 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">
            Return / Exchange
          </h1>
          <Card className="border bg-background shadow-sm">
            <CardContent className="space-y-4 py-8">
              <p className="text-sm text-destructive">
                {error || "Return not found."}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/account/orders">Back to Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="rounded-2xl border bg-card/60 p-5 sm:p-6 lg:p-7 space-y-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
              <span>Return center</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">
                Return / Exchange
              </h1>
              <p className="text-sm text-muted-foreground">
                Order{" "}
                <span className="font-medium text-foreground">
                  {data.orderNumber}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                RMA{" "}
                <span className="font-medium text-foreground">
                  {data.rmaNumber}
                </span>
                {createdDate && (
                  <>
                    {" "}
                    • Created{" "}
                    <span className="text-[11px]">
                      {createdDate}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="rounded-full border border-foreground px-3 py-1 text-[11px] font-medium uppercase tracking-wide"
            >
              {STATUS_LABELS[data.status]}
            </Badge>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/account/orders">Back to orders</Link>
            </Button>
          </div>
        </div>

        {/* main combined card: status bar + products */}
        <Card className="border bg-background shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Return details
            </CardTitle>
            <CardDescription className="text-xs">
              Current step and items included in this return.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* horizontal status bar */}
            <div className="space-y-2 rounded-lg border bg-muted/40 px-3 py-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Step {currentIndex >= 0 ? currentIndex + 1 : "-"} of{" "}
                  {RETURN_STATUS_STEPS.length}
                </span>
                <span className="font-medium text-foreground">
                  {STATUS_LABELS[data.status]}
                </span>
              </div>

              <div className="flex flex-row items-start justify-between gap-2 overflow-x-auto pb-1">
                {RETURN_STATUS_STEPS.map((step, index) => {
                  const isCompleted =
                    currentIndex !== -1 && index < currentIndex;
                  const isCurrent = index === currentIndex;
                  const isFuture = index > currentIndex;

                  const dotClasses = [
                    "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition-all",
                    isCompleted || isCurrent
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  const lineClasses = [
                    "h-px w-full transition-colors",
                    isCompleted
                      ? "bg-black"
                      : isCurrent
                      ? "bg-black"
                      : "bg-muted",
                  ].join(" ");

                  return (
                    <div
                      key={step}
                      className="relative flex min-w-[75px] flex-1 flex-col items-center text-center"
                    >
                      {index !== 0 && (
                        <div className="absolute left-0 right-0 top-[15px] -z-10 flex items-center">
                          <div className={lineClasses} />
                        </div>
                      )}

                      <div className={dotClasses}>
                        {index + 1}
                      </div>

                      <div className="mt-1 text-[10px] leading-tight font-medium text-black">
                        {STATUS_LABELS[step]}
                      </div>

                      {isFuture && (
                        <div className="mt-0.5 text-[9px] text-muted-foreground">
                          Pending
                        </div>
                      )}

                      {isCurrent && (
                        <div className="mt-0.5 text-[9px] font-medium text-black">
                          In progress
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* items list right under status bar */}
            <div className="space-y-3">
              {/* header row */}
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Items in this return
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    {data.items.length} item
                    {data.items.length > 1 ? "s" : ""}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  <span className="font-medium">
                    {stats ? formatCurrency(stats.subtotal) : "-"}
                  </span>
                </div>
              </div>

              {/* items list */}
              <div className="space-y-3">
                {data.items.map((item, idx) => {
                  const photos = Array.isArray(item.photos)
                    ? item.photos.filter(Boolean)
                    : [];
                  const firstPhoto = photos[0] || null;

                  const actionLabel =
                    item.action === "exchange"
                      ? "Exchange"
                      : item.action === "refund"
                      ? "Refund"
                      : item.action === "repair"
                      ? "Repair"
                      : item.action || "Return";

                  const rowBg =
                    idx % 2 === 0
                      ? "bg-background"
                      : "bg-muted/30";

                  return (
                    <div
                      key={item.orderItemId}
                      className={`flex gap-3 rounded-lg border ${rowBg} p-3 transition-colors`}
                    >
                      {/* left: main image + strip */}
                      <div className="flex flex-col gap-2">
                        <div className="aspect-square h-20 w-20 overflow-hidden rounded-md border bg-muted">
                          {firstPhoto ? (
                            <img
                              src={firstPhoto}
                              alt={item.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>

                              {photos.length > 1 && (
                                  <div className="flex max-w-[120px] items-center gap-1 overflow-x-auto">
                                      {photos.map((url, idx2) => (
                                          <Link
                                              key={idx2}
                                              to={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="h-7 w-7 flex-shrink-0 overflow-hidden rounded border bg-muted cursor-pointer"
                                          >
                                              <img
                                                  src={url}
                                                  alt={`${item.title} ${idx2 + 1}`}
                                                  className="h-full w-full object-cover"
                                              />
                                          </Link>
                                      ))}
                                  </div>
                              )}

                      </div>

                      {/* right: content */}
                      <div className="flex flex-1 flex-col justify-between text-xs">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="line-clamp-2 text-sm font-medium">
                              {item.title}
                            </div>
                            <span className="whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {actionLabel}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                            <span>Variant: {item.variant}</span>
                            <span>Qty: {item.qty}</span>
                            {item.action === "exchange" && item.exchangeSize && (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px]">
                                Exchange to{" "}
                                <span className="ml-1 font-semibold">
                                  {item.exchangeSize}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {item.reason && (
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                Reason:{" "}
                                <span className="ml-1 text-foreground">
                                  {item.reason}
                                </span>
                              </span>
                            )}
                            {item.details && (
                              <span className="line-clamp-1 text-[11px] text-muted-foreground">
                                “{item.details}”
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-muted-foreground">
                            Per item
                          </span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* bottom row: overview + history */}
        <div className="grid gap-4 lg:grid-cols-[1.2fr,1.3fr]">
          <Card className="border bg-background shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Overview</CardTitle>
              <CardDescription className="text-xs">
                A quick snapshot of your return.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Items</p>
                    <p className="mt-1 text-sm font-semibold">
                      {stats.totalItems}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total qty</p>
                    <p className="mt-1 text-sm font-semibold">
                      {stats.totalQty}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatCurrency(stats.subtotal)}
                    </p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-1 text-xs">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Current status
                </p>
                <p className="text-sm text-foreground">
                  {STATUS_LABELS[data.status]}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentStatusHint ||
                    "We’ll keep you updated as your return progresses."}
                </p>
              </div>

              <Separator />

              <div className="space-y-2 text-xs">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Need help?
                </p>
                <p className="text-xs text-muted-foreground">
                  If something doesn’t look right, reach out to our support team
                  with your RMA number.
                </p>
                <Button variant="outline" size="sm">
                  Contact support
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-background shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                Status History
              </CardTitle>
              <CardDescription className="text-xs">
                Every change recorded against this return.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.statusHistory.map((entry, idx) => {
                const statusKey = entry.to || entry.status;
                const label = STATUS_LABELS[statusKey] || statusKey || "-";
                const dateValue = entry.at || entry.createdAt;

                return (
                  <div key={idx} className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {label}
                        </span>
                        {entry.by && (
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">
                            by {entry.by}
                          </span>
                        )}
                      </div>
                      {dateValue && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(dateValue).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground">
                        {entry.note}
                      </p>
                    )}
                    {idx !== data.statusHistory.length - 1 && (
                      <Separator className="mt-2" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
