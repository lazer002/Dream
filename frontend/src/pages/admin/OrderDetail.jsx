import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/utils/config";
import {
  Loader2,
  Mail,
  RefreshCw,
  Save,
  ArrowUpRight,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
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

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [notif, setNotif] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingShipment, setSavingShipment] = useState(false);
  const [internalNote, setInternalNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // modal state for item details
  const [openItem, setOpenItem] = useState(null); // item object currently shown
  const [activeImageIndex, setActiveImageIndex] = useState(0);

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
  const STATUS_COLORS = {
    Pending: "bg-yellow-100 text-yellow-800",
    Processing: "bg-blue-100 text-blue-800",
    Dispatched: "bg-indigo-100 text-indigo-800",
    Shipped: "bg-sky-100 text-sky-800",
    "Out for Delivery": "bg-orange-100 text-orange-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
    Refunded: "bg-gray-100 text-gray-800",
  };

// replace previous PLACEHOLDER constant or keep same one
const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23909aa0' font-family='Arial, Helvetica, sans-serif' font-size='20'%3ENo image%3C/text%3E%3C/svg%3E";

// NEW getItemImages that understands `mainImage` and bundleProducts
const getItemImages = (item) => {
  const imgs = [];

  // direct single-image fields your API returns
  if (item.mainImage) imgs.push(item.mainImage);
  if (item.image) imgs.push(item.image);
  if (item.thumbnail) imgs.push(item.thumbnail);

  // if this is a bundle, include bundle product images
  if (Array.isArray(item.bundleProducts) && item.bundleProducts.length) {
    item.bundleProducts.forEach((bp) => {
      if (bp.mainImage) imgs.push(bp.mainImage);
      if (bp.image) imgs.push(bp.image);
    });
  }

  // some APIs return images array
  if (Array.isArray(item.images) && item.images.length) {
    imgs.push(...item.images);
  }

  // dedupe and keep only truthy absolute/relative urls
  const unique = [...new Set(imgs.filter(Boolean))];

  return unique.length ? unique : [PLACEHOLDER];
};

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/orders/${id}`);
      setOrder(res.data.order);
      setSelectedStatus(res.data.order?.status || "");
      setTrackingNumber(res.data.order?.shipment?.trackingNumber || "");
    } catch (err) {
      console.error(err);
      setNotif({ type: "error", text: "Failed to load order." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const showNotif = (type, text, duration = 4000) => {
    setNotif({ type, text });
    setTimeout(() => setNotif(null), duration);
  };

  const updateStatus = async (newStatus) => {
    if (!order || savingStatus) return;
    setSavingStatus(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus });
      showNotif("success", `Status updated to "${newStatus}"`);
      fetchOrder();
    } catch (err) {
      console.error(err);
      showNotif("error", "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const saveShipment = async () => {
    setSavingShipment(true);
    try {
      await api.patch(`/admin/orders/${id}/shipment`, { trackingNumber });
      showNotif("success", "Shipment updated.");
      fetchOrder();
    } catch {
      showNotif("error", "Failed to update shipment.");
    } finally {
      setSavingShipment(false);
    }
  };

  const saveNote = async () => {
    if (!internalNote.trim()) return showNotif("error", "Note cannot be empty.");
    setSavingNote(true);
    try {
      await api.post(`/admin/orders/${id}/notes`, { text: internalNote });
      setInternalNote("");
      showNotif("success", "Note saved.");
      fetchOrder();
    } catch {
      showNotif("error", "Failed to save note.");
    } finally {
      setSavingNote(false);
    }
  };

  const triggerEmail = async () => {
    setSendingEmail(true);
    try {
      await api.post(`/admin/orders/${id}/send-email`, {
        template: "status_change",
      });
      showNotif("success", "Email sent.");
    } catch {
      showNotif("error", "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  };

  // compute order-level totals (safe fallback)
  const totals = useMemo(() => {
    if (!order?.items) return { subtotal: 0, tax: order?.tax || 0, shipping: order?.shipping || 0, total: order?.total || 0 };
    const subtotal = order.items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
    return {
      subtotal,
      tax: order.tax || 0,
      shipping: order.shipping || 0,
      total: order.total ?? subtotal + (order.tax || 0) + (order.shipping || 0),
    };
  }, [order]);

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-neutral-500" />
      </div>
    );

  if (!order)
    return (
      <div className="text-center py-12 text-neutral-600">Order not found.</div>
    );

  // helper to open modal for an item
  const openItemModal = (item) => {
    setOpenItem(item);
    setActiveImageIndex(0);
  };



  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 text-neutral-900 dark:text-neutral-50">
      {/* Notifications */}
      {notif && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 text-sm ${
            notif.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {notif.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order #{order.orderNumber}</h1>
          <p className="text-sm text-neutral-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-500">Total</p>
          <p className="text-xl font-semibold">₹{totals.total}</p>
        </div>
      </div>

      <Separator />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column: Customer, Payment, Items */}
        <div className="space-y-4">
          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
              <CardDescription>{order.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">
                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
              </p>
              <p className="text-neutral-500">{order.shippingAddress?.phone}</p>
              <p className="text-neutral-500">
                {order.shippingAddress?.address} {order.shippingAddress?.apartment ? `, ${order.shippingAddress.city}` : ""}, {order.shippingAddress?.state} 
              </p>
              <p>{order.shippingAddress?.country}-{order.shippingAddress?.zip}</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Details & status</CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p>Method: {order.paymentMethod}</p>
              <p>Status: {order.paymentStatus}</p>
              <p>Subtotal: ₹{totals.subtotal}</p>
              <p>Tax: ₹{totals.tax}</p>
              <p>Shipping: ₹{order.shippingFee}</p>
              <p className="font-semibold">Total: ₹{totals.total}</p>
            </CardContent>
          </Card>

          {/* Items list with improved UI */}
          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>Items</CardTitle>
              <CardDescription>{order.items?.length || 0} items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items?.map((it) => {
                const images = getItemImages(it);
                const lineTotal = (it.price || 0) * (it.quantity || 1);
                return (
                  <div
                    key={it._id || it.productId || `${it.name}-${Math.random()}`}
                    className="flex items-start gap-4 rounded-md p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer"
                    onClick={() => openItemModal(it)}
                  >
                    <div className="w-16 h-16 flex-shrink-0 relative">
                      <img
                        src={images[0]}
                        alt={it.name}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = PLACEHOLDER;
                        }}
                        className="w-16 h-16 object-cover rounded-md border"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium">{it.name}</div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {it.variantName ? it.variantName : it.options ? Object.entries(it.options).map(([k, v]) => `${k}: ${v}`).join(", ") : ""}
                          </div>
                          {it.sku && <div className="text-xs text-neutral-400 mt-1">SKU: {it.sku}</div>}
                        </div>

                        <div className="text-right">
                          <div className="font-medium">₹{it.price}</div>
                          <div className="text-xs text-neutral-500">Qty: {it.quantity}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-sm">
                        <Badge className="bg-gray-100 text-gray-800">{it.fulfillmentStatus || "Unfulfilled"}</Badge>
                        {it.weight && <span className="text-neutral-500 text-xs">• {it.weight} {it.weightUnit || "g"}</span>}
                        <div className="ml-auto text-sm font-medium">Line total: ₹{lineTotal}</div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* order totals summary (compact) */}
              <div className="border-t pt-3 text-sm text-neutral-700">
                <div className="flex justify-between">
                  <div>Subtotal</div>
                  <div>₹{totals.subtotal}</div>
                </div>
                <div className="flex justify-between">
                  <div>Tax</div>
                  <div>₹{totals.tax}</div>
                </div>
                <div className="flex justify-between">
                  <div>Shipping</div>
                  <div>₹{order.shippingFee}</div>
                </div>
                <div className="flex justify-between font-semibold mt-2">
                  <div>Total</div>
                  <div>₹{totals.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Status, Shipment, Communication, Notes */}
        <div className="space-y-4">
          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Update order status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => updateStatus(selectedStatus)} disabled={!selectedStatus || savingStatus} className="w-full bg-black hover:bg-neutral-800 text-white">
                {savingStatus ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <ArrowUpRight className="h-4 w-4 mr-2" />}
                Update Status
              </Button>

              <div className="space-y-2 text-sm">
                <p className="font-medium text-neutral-700">History</p>
                <div className="border rounded-lg divide-y text-neutral-600">
                  {order.statusHistory?.length ? (
                    order.statusHistory.map((h, i) => (
                      <div key={i} className="px-3 py-2 flex justify-between">
                        <span>{h.status}</span>
                        <span className="text-xs">{formatDate(h.at)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-neutral-400">No history</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Tracking number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              <Button onClick={saveShipment} disabled={savingShipment} className="w-full bg-neutral-900 hover:bg-black text-white">
                {savingShipment ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Shipment
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={triggerEmail} disabled={sendingEmail} className="w-full bg-neutral-900 hover:bg-black text-white">
                {sendingEmail ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                Send Email
              </Button>
              <Button onClick={fetchOrder} variant="outline" className="w-full border-neutral-300 text-neutral-800">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea placeholder="Add a private note..." value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
              <Button onClick={saveNote} disabled={savingNote} className="w-full bg-neutral-900 hover:bg-black text-white">
                {savingNote ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Note
              </Button>

              <div className="space-y-2 text-sm text-neutral-700">
                {order.notes?.length ? (
                  order.notes.map((n, i) => (
                    <div key={i} className="border rounded-lg px-3 py-2">
                      <p className="text-xs text-neutral-500">{n.createdBy || "admin"} • {formatDate(n.createdAt)}</p>
                      <p>{n.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-neutral-400 text-sm">No notes yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Item details dialog */}
      <Dialog open={!!openItem} onOpenChange={(val) => { if (!val) setOpenItem(null); }}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{openItem?.name}</DialogTitle>
            <DialogClose asChild>
              <button className="absolute right-4 top-4 rounded p-2 hover:bg-neutral-100">
                <X />
              </button>
            </DialogClose>
          </DialogHeader>

          {openItem && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="relative bg-neutral-50 rounded-md overflow-hidden border">
                  <img
                    src={getItemImages(openItem)[activeImageIndex]}
                    alt={openItem.name}
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
                    className="w-full h-80 object-contain bg-white"
                    loading="lazy"
                  />
                </div>

                {/* thumbnail strip */}
                <div className="flex items-center gap-2 overflow-x-auto pt-2">
                  {getItemImages(openItem).map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-16 rounded border ${idx === activeImageIndex ? "ring-2 ring-black" : "opacity-80"}`}
                    >
                      <img
                        src={src}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
                        alt={`thumb-${idx}`}
                        className="w-full h-full object-cover rounded"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>

                {/* prev / next controls */}
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveImageIndex((i) => Math.max(0, i - 1))}
                    disabled={activeImageIndex <= 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="mr-2" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveImageIndex((i) => Math.min(getItemImages(openItem).length - 1, i + 1))}
                    disabled={activeImageIndex >= getItemImages(openItem).length - 1}
                    className="flex-1"
                  >
                    Next <ChevronRight className="ml-2" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-neutral-600">SKU: <span className="font-medium text-neutral-900">{openItem.sku || "—"}</span></div>
                {openItem.variantName && <div className="text-sm text-neutral-600">Variant: <span className="font-medium text-neutral-900">{openItem.variantName}</span></div>}
                {openItem.options && Object.keys(openItem.options).length > 0 && (
                  <div className="text-sm">
                    <div className="text-neutral-600">Options</div>
                    <ul className="mt-1 space-y-1 text-sm">
                      {Object.entries(openItem.options).map(([k, v]) => (
                        <li key={k} className="flex justify-between">
                          <span className="text-neutral-700">{k}</span>
                          <span className="text-neutral-500">{v}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-sm">
                  <div className="text-neutral-600">Price</div>
                  <div className="font-medium text-lg">₹{openItem.price}</div>
                </div>

                <div className="text-sm">
                  <div className="text-neutral-600">Quantity</div>
                  <div className="font-medium">{openItem.quantity}</div>
                </div>

                <div className="text-sm">
                  <div className="text-neutral-600">Line total</div>
                  <div className="font-medium">₹{(openItem.price || 0) * (openItem.quantity || 1)}</div>
                </div>

                {openItem.weight && (
                  <div className="text-sm">
                    <div className="text-neutral-600">Weight</div>
                    <div className="font-medium">{openItem.weight} {openItem.weightUnit || "g"}</div>
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={() => { navigator.clipboard?.writeText(openItem.sku || ""); showNotif("success", "SKU copied"); }} className="w-full">
                    Copy SKU
                  </Button>
                  <Button onClick={() => setOpenItem(null)} variant="ghost" className="w-full mt-2">
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* debug JSON (optional) */}
      <details className="mt-6 p-4 border rounded bg-slate-50 dark:bg-neutral-900 text-sm">
        <summary className="cursor-pointer font-medium">Order JSON (debug)</summary>
        <pre className="mt-2 text-xs overflow-auto max-h-64">{JSON.stringify(order, null, 2)}</pre>
      </details>
    </div>
  );
}
