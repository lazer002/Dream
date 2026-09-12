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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, RefreshCw } from "lucide-react";
import {
  useGetReturnByRmaQuery,
  useUpdateReturnStatusMutation,
} from "@/store/api";

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
  submitted: "New request – waiting for review.",
  awaiting_shipment: "Waiting for customer to ship items.",
  received: "Parcel has arrived at your facility.",
  inspecting: "Items are being checked for quality.",
  approved: "Return approved – process refund or exchange.",
  refunded: "Refund has been issued.",
  completed: "Return flow finished.",
  rejected: "Return was rejected – customer should be informed.",
  cancelled: "Return was cancelled.",
};

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

function MetricCard({ icon, label, value, subvalue }) {
  return (
    <Card className="border-neutral-200 bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700">
            {icon}
          </div>
          <ArrowUpRight className="h-4 w-4 text-neutral-300" />
        </div>
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate text-lg font-bold text-neutral-950">
            {value}
          </p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {subvalue}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ icon, label, value, mono = false }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <p
          className={`mt-0.5 truncate text-xs font-semibold text-neutral-900 ${
            mono ? "font-mono" : ""
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function AdminReturnDetailPage() {
  const { rmaNumber } = useParams();

  const {
    data: returnData,
    isLoading: loading,
    isFetching: refreshing,
    error: queryError,
    refetch,
  } = useGetReturnByRmaQuery(rmaNumber, {
    skip: !rmaNumber,
  });

  const [updateReturnStatus, { isLoading: saving }] =
    useUpdateReturnStatusMutation();

  const data =
    returnData?.returnRequest ||
    returnData?.return ||
    returnData?.data ||
    returnData ||
    null;

  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.status) {
      setNewStatus(data.status);
    }
  }, [data?.status]);

  useEffect(() => {
    if (!rmaNumber) {
      setError("Missing RMA in URL");
      return;
    }

    if (queryError) {
      setError(
        queryError?.data?.message ||
          queryError?.data?.error ||
          queryError?.error ||
          "Failed to load return"
      );
    } else {
      setError(null);
    }
  }, [rmaNumber, queryError]);

  const copyText = async (value) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };


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

  const createdDate =
    data && data.createdAt ? new Date(data.createdAt).toLocaleString() : null;

  const currentStatusHint =
    data && data.status ? STATUS_HINTS[data.status] : null;

    const progressPercent =
  currentIndex > 0 && RETURN_STATUS_STEPS.length > 1
    ? (currentIndex / (RETURN_STATUS_STEPS.length - 1)) * 100
    : 0;


async function handleUpdateStatus() {
  if (!data?._id || !newStatus || saving) return;

  try {
    setError(null);

    const response = await updateReturnStatus({
      id: data._id,
      status: newStatus,
      note: note.trim(),
    }).unwrap();

    setNote("");

    if (response?.rma || response?.returnRequest || response?.return) {
      // RTK Query invalidation/refetch is the source of truth.
    }

    await refetch();
  } catch (e) {
    console.error(e);

    setError(
      e?.data?.message ||
        e?.data?.error ||
        e?.message ||
        "Failed to update status"
    );
  }
}

  if (loading) {
    return (
      <div className="mx-auto">
        <Card className="border border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Return · Admin
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Loading return details…
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-neutral-100" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-100" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto">
        <Card className="border border-neutral-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Return · Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-600">
              {error || "Return not found"}
            </p>
            <Button asChild variant="outline" className="border-black text-black">
              <Link to="/admin/returnslist">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to returns
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <Card className="border border-neutral-200 bg-white">
        <CardHeader className="border-b border-neutral-200 bg-neutral-50/70">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                <span>Return Detail</span>
              </div>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {data.rmaNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Order{" "}
                <span className="font-medium text-foreground">
                  {data.orderNumber}
                </span>{" "}
                · {data.guestEmail || "Guest user"}
              </p>
              <p className="text-xs text-gray-500">
                Created: {createdDate}
              </p>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <Badge
                  variant="outline"
                  className="rounded-full border-black px-3 py-1 text-[11px] font-medium uppercase tracking-wide"
                >
                  {STATUS_LABELS[data.status]}
                </Badge>
                {stats && (
                  <>
                    <span className="h-4 w-px bg-neutral-300" />
                    <span className="text-muted-foreground">
                      {stats.totalItems} item
                      {stats.totalItems > 1 ? "s" : ""}
                    </span>
                    <span className="h-1 w-1 rounded-full bg-neutral-400" />
                    <span className="font-medium">
                      {formatCurrency(stats.subtotal)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={refreshing}
                  className="border-neutral-300"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(data.rmaNumber)}
                  className="border-neutral-300"
                >
                  {copied ? (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy RMA"}
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white"
                >
                  <Link to="/admin/returnslist">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={<PackageCheck className="h-4 w-4" />}
              label="Items"
              value={stats?.totalItems ?? 0}
              subvalue={`${stats?.totalQty ?? 0} total units`}
            />
            <MetricCard
              icon={<IndianRupee className="h-4 w-4" />}
              label="Return value"
              value={formatCurrency(stats?.subtotal ?? 0)}
              subvalue="Item subtotal"
            />
            <MetricCard
              icon={<Clock3 className="h-4 w-4" />}
              label="Current stage"
              value={STATUS_LABELS[data.status] || data.status}
              subvalue={currentStatusHint || "Return workflow"}
            />
            <MetricCard
              icon={<CalendarDays className="h-4 w-4" />}
              label="Created"
              value={createdDate || "—"}
              subvalue="Request timestamp"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">




         <div className="space-y-4">

  <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-2">
      <span>
        Step {currentIndex >= 0 ? currentIndex + 1 : "-"} of{" "}
        {RETURN_STATUS_STEPS.length}
      </span>
      <span className="font-medium text-foreground">
        {STATUS_LABELS[data.status]}
      </span>
    </div>

    {/* status bar */}
    <div className="w-full pb-2">
      <div className="flex items-start">
        {RETURN_STATUS_STEPS.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;

          const dotClasses = [
            "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition-all",
            isCompleted || isCurrent
              ? "bg-black text-white border-black"
              : "bg-white text-black border-neutral-400",
          ].join(" ");

          return (
            <div
              key={step}
              className="flex flex-1 items-start"
            >
              {/* Circle + text (centered) */}
              <div className="w-[75px] flex flex-col items-center text-center">
                <div className={dotClasses}>{index + 1}</div>

                <div className="mt-1 text-[10px] font-medium text-black">
                  {STATUS_LABELS[step]}
                </div>

                {index > currentIndex && (
                  <div className="mt-0.5 text-[9px] text-muted-foreground">
                    Pending
                  </div>
                )}

                {isCurrent && (
                  <div className="mt-0.5 text-[9px] text-black font-semibold">
                    In progress
                  </div>
                )}
              </div>

              {/* Connector line (touches both circles) */}
              {index < RETURN_STATUS_STEPS.length - 1 && (
                <div
                  className={`h-[2px] flex-1 mt-[14px] -mx-6 rounded-full ${
                    currentIndex > index ? "bg-black" : "bg-neutral-300"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>

  {/* ITEMS BELOW – unchanged */}
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Items in this return
      </div>

      {stats && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            {stats.totalItems} item
            {stats.totalItems > 1 ? "s" : ""}
          </span>
          <span className="h-1 w-1 rounded-full bg-neutral-500" />
          <span className="font-medium text-foreground">
            {formatCurrency(stats.subtotal)}
          </span>
        </div>
      )}
    </div>

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

        const rowBg = idx % 2 === 0 ? "bg-white" : "bg-neutral-50";

        return (
          <div
            key={item.orderItemId}
            className={`flex gap-3 rounded-lg border border-neutral-200 ${rowBg} p-3`}
          >
            <div className="flex flex-col gap-2">
              <div className="aspect-square h-20 w-20 overflow-hidden rounded-md border border-neutral-200 bg-muted">
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
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="h-7 w-7 flex-shrink-0 overflow-hidden rounded border border-neutral-200 bg-muted"
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

            <div className="flex flex-1 flex-col justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="line-clamp-2 text-sm font-medium">
                    {item.title}
                  </div>
                  <span className="whitespace-nowrap rounded-full border border-neutral-300 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {actionLabel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>Variant: {item.variant}</span>
                  <span>Qty: {item.qty}</span>
                  {item.action === "exchange" && item.exchangeSize && (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px]">
                      Exchange to{" "}
                      <span className="ml-1 font-semibold">
                        {item.exchangeSize}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {item.reason && (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-muted-foreground">
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
</div>







            {/* Right: status control + history */}
            <div className="space-y-4">
              <Card className="overflow-hidden border-neutral-200 bg-white shadow-sm">
                <CardHeader className="border-b bg-neutral-50/60">
                  <CardTitle className="text-sm font-semibold">
                    Return overview
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Core request and customer information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="divide-y p-0 text-xs">
                  <DetailRow
                    icon={<User className="h-4 w-4" />}
                    label="Customer"
                    value={data.guestEmail || "Guest user"}
                  />
                  <DetailRow
                    icon={<PackageCheck className="h-4 w-4" />}
                    label="Order"
                    value={data.orderNumber || "—"}
                  />
                  <DetailRow
                    icon={<RotateCcw className="h-4 w-4" />}
                    label="RMA"
                    value={data.rmaNumber || "—"}
                    mono
                  />
                  <DetailRow
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Created"
                    value={createdDate || "—"}
                  />
                </CardContent>
              </Card>
              <Card className="border border-neutral-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Update Status
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Change the return status and log an internal note.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Status
                    </p>
                    <Select
                      value={newStatus}
                      onValueChange={(v) => setNewStatus(v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {RETURN_STATUS_STEPS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newStatus && (
                      <p className="pt-1 text-[11px] text-muted-foreground">
                        {STATUS_HINTS[newStatus] || ""}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      Internal note
                    </p>
                    <Textarea
                      rows={3}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="text-xs"
                      placeholder="Add a short note about this change..."
                    />
                  </div>

                  {error && (
                    <p className="text-[11px] text-red-600">
                      {error}
                    </p>
                  )}

                  <Button
                    className="w-full bg-black text-white hover:bg-neutral-900"
                    size="sm"
                    onClick={handleUpdateStatus}
                    disabled={saving || !newStatus}
                  >
                    {saving ? "Updating..." : "Save change"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border border-neutral-200 bg-neutral-50">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">
                    Status History
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Every change tracked for this return.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {Array.isArray(data.statusHistory) && data.statusHistory.length ? (
                    data.statusHistory.map((entry, idx) => {
                    const statusKey = entry.to || entry.status;
                    const label = STATUS_LABELS[statusKey] || statusKey || "-";
                    const dateValue = entry.at || entry.createdAt;

                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {label}
                            </span>
                            {entry.by && (
                              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                by {entry.by}
                              </span>
                            )}
                          </div>
                          {dateValue && (
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(dateValue).toLocaleString()}
                            </span>
                          )}
                        </div>
                        {entry.note && (
                          <p className="text-[11px] text-muted-foreground">
                            {entry.note}
                          </p>
                        )}
                        {idx !== data.statusHistory.length - 1 && (
                          <Separator className="mt-2" />
                        )}
                      </div>
                    );
                    })
                  ) : (
                    <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
                      <History className="mx-auto h-5 w-5 mb-2" />
                      No status history recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}