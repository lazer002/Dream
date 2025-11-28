// src/pages/admin/AdminReturnDetailPage.jsx
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
import api from "@/utils/config";

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

async function fetchReturnByRma(rmaNumber) {
  const res = await api.get(`/returns/${encodeURIComponent(rmaNumber)}`);
  if (!res.data || res.data.success === false) {
    throw new Error(res.data?.message || "Return not found");
  }
  return res.data.returnRequest;
}

export default function AdminReturnDetailPage() {
  const { rmaNumber } = useParams();

  const [data, setData] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchReturnByRma(rmaNumber);
      setData(result);
      setNewStatus(result.status || "submitted");
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to load return");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!rmaNumber) {
      setError("Missing RMA in URL");
      setLoading(false);
      return;
    }
    load();
  }, [rmaNumber]);

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
  if (!data || !data._id) return;
  if (!newStatus) return;

  try {
    setSaving(true);
    setError(null);

    const res = await api.patch(`/returns/${data._id}/status`, {
      status: newStatus,
      note: note || "",
    });

    const updated = res.data?.rma || res.data;

    if (updated) {
      setData(updated);   // update UI with latest status + history
      setNote("");        // clear note box
    }
  } catch (e) {
    console.error(e);
    const msg =
      e.response?.data?.message ||
      e.message ||
      "Failed to update status";
    setError(msg);
  } finally {
    setSaving(false);
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
            <p className="text-sm text-gray-500">Please wait.</p>
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

              <div className="flex gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-black text-black hover:bg-black hover:text-white"
                >
                  <Link to="/admin/returnslist">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
            {/* Left: status bar + items */}
         <div className="space-y-4">
  {/* Status bar */}
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

    {/* ✔ continuous line in the middle connecting circles */}
    <div className="relative mt-1 pb-1">
      {/* base track */}
      <div className="absolute left-[16px] right-[16px] top-[15px] h-[2px] rounded-full bg-neutral-300" />
      {/* filled track up to current step */}
      <div
        className="absolute left-[16px] top-[15px] h-[2px] rounded-full bg-black transition-all"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="relative flex flex-row items-start justify-between gap-2 overflow-x-auto">
        {RETURN_STATUS_STEPS.map((step, index) => {
          const isCompleted =
            currentIndex !== -1 && index < currentIndex;
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;

          const dotClasses = [
            "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold transition-all",
            isCompleted || isCurrent
              ? "bg-black text-white border-black"
              : "bg-white text-black border-neutral-400",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={step}
              className="flex min-w-[75px] flex-1 flex-col items-center text-center"
            >
              {/* dot sits on the line */}
              <div className={dotClasses}>{index + 1}</div>

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
  </div>

  {/* Items (unchanged) */}
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
                    <a
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
                    </a>
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
                  {item.action === "exchange" &&
                    item.exchangeSize && (
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
                  {data.statusHistory.map((entry, idx) => {
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
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
