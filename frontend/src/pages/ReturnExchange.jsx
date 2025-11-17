// src/pages/ReturnExchange.jsx
import React, { useState, useEffect } from "react";
import api from "@/utils/config"; // your axios instance
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { X, Upload, ArrowRight } from "lucide-react";
import { useAuth } from "../state/AuthContext.jsx";

export default function ReturnExchangePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // selection + per-item states
  const [itemsSelected, setItemsSelected] = useState({}); // { itemId: qty }
  const [perItemAction, setPerItemAction] = useState({}); // { itemId: 'refund'|'exchange'|'repair' }
  const [perItemReason, setPerItemReason] = useState({}); // { itemId: 'wrong_item' ... }
  const [perItemExchangeSize, setPerItemExchangeSize] = useState({}); // { itemId: 'M' }
  const [perItemDetails, setPerItemDetails] = useState({}); // { itemId: 'user text' }
  const [perItemFiles, setPerItemFiles] = useState({}); // { itemId: [File,...] }
  const [perItemPreviews, setPerItemPreviews] = useState({}); // { itemId: [url,...] }

  // global fields
  const [actionType, setActionType] = useState("refund"); // global fallback (kept for legacy)
  const [reason, setReason] = useState(""); // global fallback reason if per-item not provided
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState([]); // legacy global photos (kept)
  const [photos, setPhotos] = useState([]); // legacy global photos (kept)
  const [rma, setRma] = useState(null);
  const [error, setError] = useState("");

  // sizes available for exchange selection — override with product-specific list if you have one.
  const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];
// per-item UI stage tracker: 0..4
const [perItemStage, setPerItemStage] = useState({}); // { itemId: stageNumber }
function setStage(itemId, stage) {
  setPerItemStage((s) => ({ ...s, [itemId]: stage }));
}
function advanceStage(itemId) {
  setPerItemStage((s) => ({ ...s, [itemId]: Math.min(4, (s[itemId] || 0) + 1) }));
}
function resetStage(itemId) {
  setPerItemStage((s) => {
    const copy = { ...s };
    delete copy[itemId];
    return copy;
  });
}

  // Load logged-in user's orders
  useEffect(() => {
    if (user) {
      loadMyOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      // revoke per-item previews
      Object.values(perItemPreviews).flat().forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
      // revoke global previews
      photoPreviews.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch {}
      });
    };
  }, []); // run once on unmount

  async function loadMyOrders() {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/my");
      if (Array.isArray(data.orders) && data.orders.length) {
        setOrder(data.orders[0]);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Failed to load your orders");
    } finally {
      setLoading(false);
    }
  }

  // toggle/set qty for an item
  function setItemQty(itemId, qty) {
    setItemsSelected((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[itemId];
        // clear per-item exchange size and other per-item fields
        setPerItemExchangeSize((p) => { const c = { ...p }; delete c[itemId]; return c; });
        setPerItemAction((p) => { const c = { ...p }; delete c[itemId]; return c; });
        setPerItemReason((p) => { const c = { ...p }; delete c[itemId]; return c; });
        setPerItemDetails((p) => { const c = { ...p }; delete c[itemId]; return c; });
        // revoke file previews and clear files
        (perItemPreviews[itemId] || []).forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
        setPerItemFiles((p) => { const c = { ...p }; delete c[itemId]; return c; });
        setPerItemPreviews((p) => { const c = { ...p }; delete c[itemId]; return c; });
      } else {
        next[itemId] = qty;
      }
      return next;
    });
  }

  // legacy global file handler (kept)
  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const limited = [...photos, ...files].slice(0, 5);
    setPhotos(limited);
    const previews = limited.map((f) => URL.createObjectURL(f));
    photoPreviews.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
    setPhotoPreviews(previews);
  }

  // per-item files and previews handler
  function handlePerItemFiles(itemId, files) {
    const arr = Array.from(files || []);
    setPerItemFiles((prev) => {
      const existing = prev[itemId] || [];
      const combined = [...existing, ...arr].slice(0, 5);
      const next = { ...prev, [itemId]: combined };
      // previews
      const oldPreviews = perItemPreviews[itemId] || [];
      oldPreviews.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
      const previews = combined.map((f) => URL.createObjectURL(f));
      setPerItemPreviews((p) => ({ ...p, [itemId]: previews }));
      return next;
    });
  }

  // GET /orders/track?email=...&orderNumber=...
  async function lookupOrderGuest() {
    if (!orderId || !email) {
      toast.error("Order ID and email are required");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await api.get("/orders/track", {
        params: {
          email: email,
          orderNumber: orderId,
        },
      });

      if (res.data?.order) {
        setOrder(res.data.order);
        setStep(2);
        toast.success("Order found!");
      } else {
        setError(res.data?.message || "Order not found.");
        toast.error(res.data?.message || "Order not found.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Lookup failed");
      toast.error(err?.response?.data?.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  // reasons per action
  function getReasonsForAction(action) {
    if (action === "refund") {
      return [
        { value: "wrong_item", label: "Wrong Item Delivered" },
        { value: "changed_mind", label: "Changed my mind" },
        { value: "size_issue", label: "Size / Fit Issue" },
        { value: "other", label: "Other" },
      ];
    } else if (action === "exchange") {
      return [
        { value: "size_issue", label: "Size / Fit Issue" },
        { value: "wrong_item", label: "Wrong Item Delivered" },
        { value: "damaged", label: "Damaged / Defective" },
        { value: "other", label: "Other" },
      ];
    } else if (action === "repair") {
      return [
        { value: "damaged", label: "Damaged / Defective" },
        { value: "manufacturing", label: "Manufacturing defect" },
        { value: "other", label: "Other" },
      ];
    }
    return [];
  }

  // validation: require per-item reason (or global fallback) and exchange size when needed
  function validateSubmission() {
    if (!order) {
      toast.error("Select an order first");
      return false;
    }
    const itemIds = Object.keys(itemsSelected);
    if (!itemIds.length) {
      toast.error("Select item(s) to return or exchange");
      return false;
    }

    if (order.orderStatus !== "delivered") {
      toast.error("Only delivered orders are eligible for returns / exchanges.");
      return false;
    }

    // per-item validation
    for (const id of itemIds) {
      const selectedQty = itemsSelected[id] || 0;
      if (!selectedQty || selectedQty <= 0) {
        toast.error("Selected quantity must be at least 1 for each chosen item.");
        return false;
      }
      // reason: per-item reason OR global reason
      const r = perItemReason[id] || reason;
      if (!r) {
        toast.error("Please provide a reason (either per-item or global).");
        return false;
      }
      // if action is exchange require size
      const act = perItemAction[id] || actionType;
      if (act === "exchange") {
        if (!perItemExchangeSize[id]) {
          toast.error("Please choose an exchange size for each item marked for exchange.");
          return false;
        }
      }
    }

    return true;
  }

  // submit: build per-item payload + append per-item files into FormData
  async function submitReturnRequest() {
    if (!validateSubmission()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("orderId", order._id || order.id || order.orderNumber || order.orderId);
      fd.append("guestEmail", user ? user.email : email || "");
      fd.append("notes", notes || "");
      fd.append("details", additionalDetails || "");
      fd.append("globalAction", actionType || "refund");
      fd.append("globalReason", reason || "");

      // items: array of per-item objects
      const payloadItems = Object.keys(itemsSelected).map((itemId) => {
        const it = (order.items || []).find((o) => (o._id || o.id || o.sku) === itemId);
        return {
          itemId,
          qty: itemsSelected[itemId],
          productId: it?.productId || null,
          title: it?.title || it?.name || "",
          variant: it?.variant || it?.size || "",
          action: perItemAction[itemId] || actionType || "refund",
          reason: perItemReason[itemId] || reason || "",
          exchangeSize: perItemExchangeSize[itemId] || null,
          details: perItemDetails[itemId] || "",
        };
      });

      fd.append("items", JSON.stringify(payloadItems));

      // attach per-item files using name pattern itemsFiles[itemId][]
      Object.entries(perItemFiles).forEach(([itemId, files]) => {
        if (!files || !files.length) return;
        files.forEach((f, idx) => {
          // key example: itemFiles[itemId][]
          fd.append(`itemFiles[${itemId}][]`, f);
        });
      });

      // also attach legacy global photos if any
      photos.forEach((f) => fd.append("photos[]", f));

      const { data } = await api.post("/returns", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (!data.success) {
        toast.error(data.message || "Failed to create return");
        return;
      }

      setRma(data.rma || { id: data.rmaId || "RMA12345", status: data.status || "pending" });
      setStep(3);
      toast.success("Return request created");
    } catch (err) {
      console.error("Error creating return:", err);
      const msg = err?.response?.data?.message || "Error creating return";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function OrderSummary({ order }) {
    if (!order) return null;
    return (
      <div className="border rounded-lg p-4 bg-white text-black">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Order</div>
            <div className="font-semibold">{order.orderNumber || order.id || order._id}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Placed</div>
            <div className="font-semibold">{new Date(order.createdAt || order.date).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {(order.items || []).map((it) => {
            const id = it._id || it.id || it.sku;
            const img = it.mainImage || it.image || (it.images && it.images[0]) || "/images/placeholder.png";
            return (
              <div key={id} className="flex items-center gap-3">
                <img src={img} alt={it.title || it.name} className="w-14 h-14 object-cover rounded" />
                <div className="flex-1">
                  <div className="font-medium">{it.title || it.name}</div>
                  <div className="text-xs text-gray-600">Variant: {it.variant || it.size || "-"} • Qty: {it.quantity || 1}</div>
                </div>
                <div className="text-sm font-semibold">₹ {Number(it.price || it.unitPrice || 0).toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Helper: check if there are any deliverable items
  const hasDeliverableItems = order && order.orderStatus === "delivered" && (order.items || []).length > 0;

  // dynamic reasons for the UI (global)
  const currentReasons = getReasonsForAction(actionType);

  return (
    <main className="min-h-screen bg-white text-black py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold">Return & Exchange</h1>
            <p className="text-gray-600 mt-2">
              Start a return or exchange for your order. Guests can lookup by Order ID + Email.
            </p>
          </header>

          <div className="flex items-center gap-3 text-sm text-gray-600 mb-6">
            <div className={`px-3 py-1 rounded ${step === 1 ? "bg-black text-white" : "bg-gray-100 text-black"}`}>1. Order</div>
            <div className={`px-3 py-1 rounded ${step === 2 ? "bg-black text-white" : "bg-gray-100 text-black"}`}>2. Items</div>
            <div className={`px-3 py-1 rounded ${step === 3 ? "bg-black text-white" : "bg-gray-100 text-black"}`}>3. Confirm</div>
          </div>

          <section className="bg-gray-50 border rounded-lg p-6">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  {!user && (
                    <>
                      <Label>Guest Order Lookup</Label>
                      <Input placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
                      <Input placeholder="Email used on order" value={email} onChange={(e) => setEmail(e.target.value)} />
                      <div className="flex gap-2 mt-2">
                        <Button onClick={lookupOrderGuest} className="bg-black text-white" disabled={loading}>
                          {loading ? "Searching..." : "Find Order"}
                        </Button>
                        <Button variant="outline" onClick={() => { setOrderId(""); setEmail(""); }}>
                          Clear
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Lookup by Order ID & Email. Only delivered orders can be returned or exchanged.
                      </p>
                      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}
                    </>
                  )}

                  {user && (
                    <>
                      <Label>Your recent order</Label>
                      {loading ? <div className="text-gray-500">Loading...</div> : <OrderSummary order={order} />}
                      <div className="mt-2 flex gap-2">
                        <Button onClick={() => setStep(2)} className="bg-black text-white">Use this order</Button>
                        <Button variant="outline" onClick={() => setOrder(null)}>Choose another</Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">To use a different order paste an Order ID above.</p>
                    </>
                  )}
                </div>

                <div>
                  <Label>Order Preview</Label>
                  {order ? <OrderSummary order={order} /> : <div className="text-gray-500">No order selected yet.</div>}
                </div>
              </div>
            )}

         {step === 2 && (
  <div className="grid grid-cols-1 gap-6">
    <h2 className="text-xl font-semibold">Select items to return / exchange</h2>

    {/* List products */}
    <div className="space-y-4">
      {(order?.items || []).map((it) => {
        const id = it._id || it.id || it.sku;
        const img = it.mainImage || it.image || (it.images && it.images[0]) || "/images/placeholder.png";
        const orderedQty = it.quantity || 1;
        const selectedQty = itemsSelected[id] || 0;
        const stage = perItemStage[id] || 0; // 0..4

        // computed values
        const itemAction = perItemAction[id] || "refund";
        const itemReasonOptions = getReasonsForAction(itemAction);

        return (
          <div key={id} className="border rounded-lg p-4 bg-white">
            {/* Header row: image + name + size + select checkbox */}
            <div className="flex items-center gap-4">
              <img src={img} alt={it.title || it.name} className="w-20 h-20 object-cover rounded" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{it.title || it.name}</div>
                    <div className="text-xs text-gray-600 truncate">Size: {it.variant || it.size || "-"}</div>
                    <div className="text-xs text-gray-500 mt-1">Ordered: {orderedQty}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500">Select</div>
                    <input
                      type="checkbox"
                      checked={selectedQty > 0}
                      onChange={(e) => {
                        const newQty = e.target.checked ? 1 : 0;
                        setItemQty(id, newQty);
                        if (e.target.checked) {
                          // open the first step (action)
                          setPerItemAction((s) => ({ ...s, [id]: s[id] || actionType || "refund" }));
                          setStage(id, 1);
                        } else {
                          // unselect: clear per-item fields & stage
                          setPerItemAction((s) => { const c = { ...s }; delete c[id]; return c; });
                          setPerItemReason((s) => { const c = { ...s }; delete c[id]; return c; });
                          setPerItemExchangeSize((s) => { const c = { ...s }; delete c[id]; return c; });
                          setPerItemDetails((s) => { const c = { ...s }; delete c[id]; return c; });
                          setPerItemFiles((s) => { const c = { ...s }; delete c[id]; return c; });
                          setPerItemPreviews((s) => { const c = { ...s }; delete c[id]; return c; });
                          resetStage(id);
                        }
                      }}
                      className="w-5 h-5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stage container: each block is shown step-by-step */}
            <div className="mt-4 space-y-3">
              {/* Stage 1: Action - shown when stage >= 1 */}
              {stage >= 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-xs text-gray-700 block mb-1">Action</label>
                    <Select
                      value={perItemAction[id] || actionType}
                      onValueChange={(v) => {
                        setPerItemAction((s) => ({ ...s, [id]: v }));
                        setPerItemReason((r) => ({ ...r, [id]: "" })); // reset reason on action change
                        // auto-advance to reason
                        setStage(id, 2);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="refund">Refund</SelectItem>
                        <SelectItem value="exchange">Exchange</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStage(id, Math.max(0, stage - 1))}
                      className="text-sm px-3 py-2 border rounded"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStage(id, Math.min(4, Math.max(1, stage + 1)))}
                      className="text-sm px-3 py-2 bg-black text-white rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 2: Reason - shown when stage >= 2 */}
              {stage >= 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="text-xs text-gray-700 block mb-1">Reason</label>
                    <Select
                      value={perItemReason[id] || ""}
                      onValueChange={(v) => {
                        setPerItemReason((s) => ({ ...s, [id]: v }));
                        // auto-advance to details
                        setStage(id, 3);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemReasonOptions.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStage(id, Math.max(1, stage - 1))}
                      className="text-sm px-3 py-2 border rounded"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStage(id, Math.min(4, stage + 1))}
                      className="text-sm px-3 py-2 bg-black text-white rounded"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Stage 3: Description (optional) */}
              {stage >= 3 && (
                <div>
                  <label className="text-xs text-gray-700 block mb-1">Describe (optional)</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={perItemDetails[id] || ""}
                      onChange={(e) => setPerItemDetails((s) => ({ ...s, [id]: e.target.value }))}
                      placeholder="Describe issue..."
                      className="flex-1 border rounded px-3 py-2 text-sm"
                    />
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setStage(id, Math.max(2, stage - 1))}
                        className="text-sm px-3 py-2 border rounded"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStage(id, 4)}
                        className="text-sm px-3 py-2 bg-black text-white rounded"
                      >
                        Continue → Upload
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Stage 4: Photo upload */}
              {stage >= 4 && (
                <div>
                  <label className="text-xs text-gray-700 block mb-1">Upload photos (optional)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 border rounded px-3 py-2">
                      <Upload className="w-4 h-4" /> <span>Attach</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handlePerItemFiles(id, e.target.files)}
                        className="hidden"
                      />
                    </label>

                    <div className="flex gap-2">
                      {(perItemPreviews[id] || []).map((u, i) => (
                        <div key={i} className="w-16 h-16 overflow-hidden rounded border">
                          <img src={u} alt={`preview-${i}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    <div className="ml-auto flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStage(id, Math.max(3, stage - 1))}
                        className="text-sm px-3 py-2 border rounded"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => { /* optionally mark item as final, or keep stage as-is */ toast.success("Item ready"); }}
                        className="text-sm px-3 py-2 bg-black text-white rounded"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>

    {/* Global controls below (same as before) */}
    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label>Global Reason (fallback)</Label>
        <Select value={reason} onValueChange={(v) => setReason(v)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select reason (applies if item-level reason not set)" />
          </SelectTrigger>
          <SelectContent>
            {getReasonsForAction(actionType).map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="mt-4">
          <Label>Describe the issue (optional)</Label>
          <Textarea value={additionalDetails} onChange={(e) => setAdditionalDetails(e.target.value)} placeholder="Tell us more about the issue..." />
        </div>
      </div>

      <div>
        <Label>Upload photos (optional)</Label>
        <label className="flex items-center gap-2 mt-2 cursor-pointer text-sm text-gray-700">
          <Upload /> <span>Attach photos</span>
          <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
        </label>

        <div className="mt-2 flex gap-2">
          {photoPreviews.map((u, i) => (
            <div key={i} className="w-20 h-20 overflow-hidden rounded border flex items-center justify-center text-xs p-1">
              <img src={u} alt={`preview-${i}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Label>Review & Policy</Label>
          <div className="mt-3 space-y-3 text-sm text-gray-700">
            <div className="p-3 border rounded bg-white">
              <strong>Return Window:</strong> 15 days from delivery.
              <div className="text-xs text-gray-500 mt-1">Items must be unused, with tags. Some categories are non-returnable.</div>
            </div>
            <div className="p-3 border rounded bg-white">
              <strong>Refunds:</strong> Refunds processed to original payment method within 5-7 business days after we receive the item.
            </div>
            <div className="p-3 border rounded bg-white">
              <strong>Shipping:</strong> Pre-paid labels available where eligible.
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            className="bg-black text-white"
            onClick={() => {
              if (!hasDeliverableItems) {
                toast.error("No delivered items available for return/exchange.");
                return;
              }
              setStep(3);
            }}
          >
            <ArrowRight /> Continue
          </Button>
          <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
        </div>
      </div>
    </div>
  </div>
)}


            {step === 3 && (
              <div className="space-y-4">
                <div className="p-4 border rounded bg-white">
                  <h4 className="font-semibold">Confirm Return / Exchange</h4>
                  <p className="text-sm text-gray-600 mt-2">Order: <strong>{order?.orderNumber || order?.id}</strong></p>
                  <p className="text-sm text-gray-600">Items: <strong>{Object.keys(itemsSelected).reduce((acc, k) => acc + (itemsSelected[k]||0), 0)}</strong></p>
                  <div className="mt-2 text-sm text-gray-700">
                    <strong>Per-item selections:</strong>
                    <ul className="list-disc pl-5 mt-2">
                      {Object.keys(itemsSelected).map((id) => {
                        const it = (order.items || []).find((o) => (o._id || o.id || o.sku) === id) || {};
                        return (
                          <li key={id}>
                            {it.title || it.name || id} — action: <strong>{perItemAction[id] || actionType}</strong>,
                            reason: <strong>{perItemReason[id] || reason || "—"}</strong>
                            { (perItemAction[id] || actionType) === "exchange" && perItemExchangeSize[id] ? <> , size: <strong>{perItemExchangeSize[id]}</strong> </> : null }
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {additionalDetails && (
                    <div className="mt-2 text-sm text-gray-700">
                      <strong>Additional Details:</strong> {additionalDetails}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button className="bg-black text-white" onClick={() => submitReturnRequest()} disabled={loading}>Submit Request</Button>
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                </div>
              </div>
            )}

            {/* After successful RMA */}
            {rma && (
              <div className="mt-6 p-4 border rounded bg-white">
                <h4 className="font-semibold">Return created</h4>
                <p className="text-sm text-gray-600 mt-2">Your RMA: <strong>{rma.id}</strong></p>
                <p className="text-sm text-gray-600">Status: <strong>{rma.status}</strong></p>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => { navigator.clipboard.writeText(rma.id); toast.success("RMA copied"); }}>Copy RMA</Button>
                  <a href={`/returns/${rma.id}`} className="ml-2 text-sm text-black underline">View status</a>
                </div>
              </div>
            )}

            {/* No delivered items helper */}
            {order && !hasDeliverableItems && (
              <div className="mt-4 p-3 rounded border bg-yellow-50 text-yellow-900 text-sm">
                This order has status <strong>{order.orderStatus}</strong>. Returns & exchanges are allowed only after delivery.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
