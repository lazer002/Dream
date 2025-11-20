import React, { useState, useEffect, useMemo } from "react";
import api from "@/utils/config"; // axios instance
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { Upload, ArrowRight, Check } from "lucide-react";
import { useAuth } from "../state/AuthContext.jsx";

// Simple return/exchange page — **global photos removed**
// Per-item photos are uploaded and included per item in payload

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

function Stepper({ step }) {
  const steps = ["Order", "Items", "Confirm"];
  return (
    <div className="flex items-center gap-3 text-sm">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`px-3 py-1 rounded-full flex items-center gap-2 min-w-[90px] justify-center ${step === i + 1 ? "bg-black text-white shadow" : "bg-gray-100 text-gray-700"}`}
        >
          <div className="text-xs font-semibold">{i + 1}</div>
          <div className="text-xs">{s}</div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order }) {
  if (!order) return null;
  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-gray-500">Order</div>
          <div className="font-semibold text-sm">{order.orderNumber || order.id || order._id}</div>
          <div className="text-xs text-gray-500">Placed: {new Date(order.createdAt || order.date).toLocaleDateString()}</div>
        </div>
        <div className="w-36">
          {(order.items || []).slice(0, 3).map((it) => (
            <div key={it._id || it.id || it.sku} className="flex items-center gap-2 mb-2">
              <img src={it.mainImage || it.image || (it.images && it.images[0]) || "/images/placeholder.png"} alt="" className="w-12 h-12 rounded object-cover" />
              <div className="text-xs truncate">{it.title || it.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FileUploader({ previews = [], onFiles, label = "Attach photos", limit = 5 }) {
  return (
    <div>
      <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 border rounded px-3 py-2 inline-flex">
        <Upload className="w-4 h-4" />
        <span>{label}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(Array.from(e.target.files || []).slice(0, limit))}
          className="hidden"
        />
      </label>

      <div className="mt-2 flex gap-2 flex-wrap">
        {previews.map((u, i) => (
          <div key={i} className="w-20 h-20 overflow-hidden rounded border flex items-center justify-center text-xs p-1">
            <img src={u} alt={`preview-${i}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

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

export default function ReturnExchangePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // selection + per-item states
  const [itemsSelected, setItemsSelected] = useState({}); // { itemId: qty }
  const [perItemAction, setPerItemAction] = useState({}); // { itemId: 'refund'|'exchange'|'repair' }
  const [perItemReason, setPerItemReason] = useState({});
  const [perItemExchangeSize, setPerItemExchangeSize] = useState({});
  const [perItemDetails, setPerItemDetails] = useState({});
  const [perItemFiles, setPerItemFiles] = useState({}); // File objects per item
  const [perItemPreviews, setPerItemPreviews] = useState({}); // preview URLs per item

  // global simple fields (no global photos anymore)
  const [actionType, setActionType] = useState("refund");
  const [reason, setReason] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [notes, setNotes] = useState("");
  const [rma, setRma] = useState(null);

  useEffect(() => {
    if (user) loadMyOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    return () => {
      // cleanup previews
      Object.values(perItemPreviews).flat().forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) {} });
    };
  }, [perItemPreviews]);

  async function loadMyOrders() {
    setLoading(true);
    try {
      const { data } = await api.get("/orders/my");
      if (Array.isArray(data.orders) && data.orders.length) setOrder(data.orders[0]);
    } catch (err) {
      console.error("Failed to load orders:", err);
      toast.error("Failed to load your orders");
    } finally {
      setLoading(false);
    }
  }

  function toggleItemSelection(itemId, qty = 1) {
    setItemsSelected((p) => {
      const next = { ...p };
      if (next[itemId]) {
        delete next[itemId];
        // clear per-item fields
        setPerItemAction((s) => { const c = { ...s }; delete c[itemId]; return c; });
        setPerItemReason((s) => { const c = { ...s }; delete c[itemId]; return c; });
        setPerItemExchangeSize((s) => { const c = { ...s }; delete c[itemId]; return c; });
        setPerItemDetails((s) => { const c = { ...s }; delete c[itemId]; return c; });
        (perItemPreviews[itemId] || []).forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
        setPerItemFiles((s) => { const c = { ...s }; delete c[itemId]; return c; });
        setPerItemPreviews((s) => { const c = { ...s }; delete c[itemId]; return c; });
      } else {
        next[itemId] = qty;
        setPerItemAction((s) => ({ ...s, [itemId]: s[itemId] || actionType || "refund" }));
      }
      return next;
    });
  }

  function handlePerItemFiles(itemId, files) {
    const arr = Array.from(files || []).slice(0, 5);
    setPerItemFiles((prev) => ({ ...prev, [itemId]: arr }));
    const previews = arr.map((f) => URL.createObjectURL(f));
    (perItemPreviews[itemId] || []).forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
    setPerItemPreviews((p) => ({ ...p, [itemId]: previews }));
  }

  async function lookupOrderGuest() {
    if (!orderId || !email) { toast.error("Order ID and email are required"); return; }
    setLoading(true); setError(""); setOrder(null);
    try {
      const res = await api.get("/orders/track", { params: { email, orderNumber: orderId } });
      if (res.data?.order) { setOrder(res.data.order); setStep(2); toast.success("Order found!"); }
      else { setError(res.data?.message || "Order not found"); toast.error(res.data?.message || "Order not found"); }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Lookup failed");
      toast.error(err?.response?.data?.message || "Lookup failed");
    } finally { setLoading(false); }
  }

  const hasDeliverableItems = useMemo(() => order && order.orderStatus === "delivered" && (order.items || []).length > 0, [order]);

  // ---------- SIMPLE submit: upload only per-item photos and post items with photos array ----------
  async function submitReturnRequest() {
    setLoading(true);
    console.log("submitReturnRequest START", {
      orderId: order?._id || order?.id || order?.orderNumber,
      itemsSelected,
      perItemFilesKeys: Object.keys(perItemFiles || {}),
    });

    try {
      const perItemUploaded = {}; // itemId -> [urls]
      const itemIds = Object.keys(itemsSelected || {});

      // upload per-item files (one-by-one)
      for (const itemId of itemIds) {
        perItemUploaded[itemId] = [];
        const files = perItemFiles[itemId] || [];
        for (const f of files) {
          console.log(`Uploading file for item ${itemId}:`, f.name || f);
          const fd = new FormData();
          fd.append("file", f);
          // upload endpoint - keep same pattern you used successfully
          const res = await api.post("/upload/image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          console.log("per-item upload resp:", res?.data);
          if (res?.data?.url) perItemUploaded[itemId].push(res.data.url);
          else if (res?.data?.path) perItemUploaded[itemId].push(res.data.path);
          else if (res?.data?.publicUrl) perItemUploaded[itemId].push(res.data.publicUrl);
        }
      }

      console.log("perItemUploaded:", perItemUploaded);

      // build items payload (simple, minimal)
      const payloadItems = itemIds.map((itemId) => {
        const it = (order?.items || []).find((o) => (o._id || o.id || o.sku) === itemId) || {};
        return {
          orderItemId: itemId,
          productId: it?.productId || it?.product_id || null,
          qty: itemsSelected[itemId] || 1,
          action: perItemAction[itemId] || actionType || "refund",
          reason: perItemReason[itemId] || reason || "",
          exchangeSize: perItemExchangeSize[itemId] || null,
          details: perItemDetails[itemId] || "",
          photos: perItemUploaded[itemId] || [],
          title: it?.title || it?.name || "",
          variant: it?.variant || it?.size || "",
          price: Number(it?.price || it?.unitPrice || 0),
        };
      });

      // final payload — **no global photos field**
      const payload = {
        orderId: order?._id?.toString ? order._id.toString() : order?.id || order?.orderNumber || orderId,
        orderNumber: order?.orderNumber || order?.id || null,
        guestEmail: (user && user.email) ? user.email : (email || order?.email || null),
        items: payloadItems,
        details: additionalDetails || "",
        notes: notes || "",
      };

      console.log("Final payload to /returns (no global photos):", payload);

      const { data } = await api.post("/returns", payload, { headers: { "Content-Type": "application/json" } });
      console.log("Returned from /returns:", data);

      if (data && data.success) {
        setRma(data.rma || data.return || { id: data.rmaId || "RMA12345", status: data.status || "pending" });
        setStep(3);
        toast.success("Return request created");
      } else {
        console.error("Returns API responded (not success):", data);
        toast.error(data?.message || "Failed to create return");
      }
    } catch (err) {
      console.error("submitReturnRequest error:", err);
      toast.error(err?.response?.data?.message || err.message || "Error creating return");
    } finally {
      setLoading(false);
      console.log("submitReturnRequest DONE");
    }
  }
  // ---------- END submit ----------

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <header className="mb-6">
            <h1 className="text-3xl font-bold">Returns & Exchanges</h1>
            <p className="text-gray-600 mt-2">Pick items, attach per-item photos, and submit.</p>
          </header>

          <Stepper step={step} />

          <section className="mt-6 bg-white p-6 rounded-2xl shadow-sm">
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  {!user ? (
                    <div className="space-y-3">
                      <Label>Guest Order Lookup</Label>
                      <Input placeholder="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} />
                      <Input placeholder="Email used on order" value={email} onChange={(e) => setEmail(e.target.value)} />

                      <div className="flex gap-2 mt-2">
                        <Button onClick={lookupOrderGuest} className="bg-black text-white" disabled={loading}>{loading ? "Searching..." : "Find Order"}</Button>
                        <Button variant="outline" onClick={() => { setOrderId(""); setEmail(""); }}>Clear</Button>
                      </div>

                      {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

                      <div className="mt-4 text-sm text-gray-500">Lookup by Order ID & Email. Only delivered orders can be returned or exchanged.</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label>Your recent order</Label>
                      {loading ? <div className="text-gray-500">Loading...</div> : <OrderCard order={order} />}
                      <div className="mt-3 flex gap-2">
                        <Button onClick={() => setStep(2)} className="bg-black text-white">Use this order</Button>
                        <Button variant="outline" onClick={() => setOrder(null)}>Choose another</Button>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">To use a different order paste an Order ID above.</div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Order Preview</Label>
                  {order ? <OrderCard order={order} /> : <div className="text-gray-500">No order selected yet.</div>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Select items to return or exchange</h2>

                <div className="space-y-4">
                  {(order?.items || []).map((it) => {
                    const id = it._id || it.id || it.sku;
                    const img = it.mainImage || it.image || (it.images && it.images[0]) || "/images/placeholder.png";
                    const orderedQty = it.quantity || 1;
                    const selectedQty = itemsSelected[id] || 0;
                    const action = perItemAction[id] || actionType;
                    const reasonOptions = getReasonsForAction(action);

                    return (
                      <div key={id} className="border rounded-xl p-4 bg-white flex gap-4 items-start">
                        <img src={img} alt="" className="w-24 h-24 object-cover rounded-md" />

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-medium">{it.title || it.name}</div>
                              <div className="text-xs text-gray-500">Variant: {it.variant || it.size || "-"} • Ordered: {orderedQty}</div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <div className="text-sm text-gray-600">₹ {Number(it.price || it.unitPrice || 0).toLocaleString()}</div>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedQty > 0} onChange={() => toggleItemSelection(id)} className="w-5 h-5" />
                              </div>
                            </div>
                          </div>

                          {selectedQty > 0 && (
                            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label>Action</Label>
                                <Select value={action} onValueChange={(v) => { setPerItemAction((s) => ({ ...s, [id]: v })); setPerItemReason((r) => ({ ...r, [id]: "" })); }}>
                                  <SelectTrigger className="w-full"><SelectValue placeholder="Select action" /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="refund">Refund</SelectItem>
                                    <SelectItem value="exchange">Exchange</SelectItem>
                                    <SelectItem value="repair">Repair</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Reason</Label>
                                <Select value={perItemReason[id] || ""} onValueChange={(v) => setPerItemReason((s) => ({ ...s, [id]: v }))}>
                                  <SelectTrigger className="w-full"><SelectValue placeholder="Select reason" /></SelectTrigger>
                                  <SelectContent>
                                    {(reasonOptions || []).map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Qty</Label>
                                <div className="px-3 py-1 border rounded">{itemsSelected[id] || 1}</div>
                              </div>

                              {(perItemAction[id] || actionType) === 'exchange' && (
                                <div className="md:col-span-3">
                                  <Label>Exchange size</Label>
                                  <div className="flex gap-2 mt-2 flex-wrap">
                                    {SIZE_OPTIONS.map((s) => (
                                      <button key={s} type="button" onClick={() => setPerItemExchangeSize((p) => ({ ...p, [id]: s }))} className={`px-3 py-1 border rounded ${perItemExchangeSize[id] === s ? 'bg-black text-white' : 'bg-white'}`}>
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="md:col-span-2">
                                <Label>Description (optional)</Label>
                                <Input placeholder="Describe the issue..." value={perItemDetails[id] || ""} onChange={(e) => setPerItemDetails((s) => ({ ...s, [id]: e.target.value }))} />
                              </div>

                              <div>
                                <Label>Photos</Label>
                                <FileUploader previews={perItemPreviews[id] || []} onFiles={(files) => handlePerItemFiles(id, files)} label="Attach photos" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mt-6 p-4 bg-gray-50 rounded">
                      <div className="text-sm text-gray-700">
                        <strong>Return Window:</strong> 15 days from delivery.
                        <div className="text-xs text-gray-500 mt-1">Items must be unused, with tags. Some categories are non-returnable.</div>
                      </div>
                      <div className="text-sm text-gray-700 mt-3"><strong>Refunds:</strong> Processed to original payment method within 5-7 business days after we receive the item.</div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Button className="bg-black text-white" onClick={() => { if (!hasDeliverableItems) { toast.error("No delivered items available for return/exchange."); return; } setStep(3); }}><ArrowRight /> Continue</Button>
                      <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <div className="p-4 bg-white border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs text-gray-500">Order</div>
                          <div className="font-semibold">{order?.orderNumber || order?.id}</div>
                          <div className="text-xs text-gray-500">Placed: {order?.createdAt || order?.date ? new Date(order?.createdAt || order?.date).toLocaleDateString() : "—"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Status</div>
                          <div className="font-semibold text-sm capitalize">{order?.orderStatus || "—"}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">Items in return</div>
                        <div className="mt-2 space-y-2">
                          {Object.keys(itemsSelected).map((id) => {
                            const it = (order.items || []).find((o) => (o._id || o.id || o.sku) === id) || {};
                            const img = it.mainImage || it.image || (it.images && it.images[0]) || "/images/placeholder.png";
                            return (
                              <div key={id} className="flex items-center gap-3">
                                <img src={img} alt={it.title || it.name || "item"} className="w-12 h-12 object-cover rounded" />
                                <div className="text-sm flex-1">
                                  <div className="font-medium truncate">{it.title || it.name}</div>
                                  <div className="text-xs text-gray-500">Qty: {itemsSelected[id] || 1} • {perItemAction[id] || actionType}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500">Attached photos (per-item)</div>
                        <div className="mt-2 flex gap-2 flex-wrap">
                          {Object.values(perItemPreviews).flat().map((u, i) => (
                            <div key={i} className="w-16 h-16 overflow-hidden rounded border">
                              <img src={u} alt={`preview-${i}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                          {Object.values(perItemPreviews).flat().length === 0 && (
                            <div className="text-xs text-gray-500">No photos attached</div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t" />

                      <div className="text-sm text-gray-700">
                        <strong>Need to change selections?</strong>
                        <div className="mt-2">
                          <Button variant="outline" onClick={() => setStep(2)}>Edit items</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <div className="p-6 bg-white border rounded-lg space-y-4">
                      <h3 className="text-lg font-semibold">Confirm your return</h3>

                      <div className="grid gap-4">
                        {Object.keys(itemsSelected).map((id) => {
                          const it = (order.items || []).find((o) => (o._id || o.id || o.sku) === id) || {};
                          const img = it.mainImage || it.image || (it.images && it.images[0]) || "/images/placeholder.png";
                          return (
                            <div key={id} className="flex items-start gap-4">
                              <img src={img} alt={it.title || it.name || "item"} className="w-20 h-20 object-cover rounded" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{it.title || it.name}</div>
                                    <div className="text-xs text-gray-500">{it.variant || it.size || "-"}</div>
                                  </div>
                                  <div className="text-sm text-gray-600">Qty: {itemsSelected[id] || 1}</div>
                                </div>

                                <div className="mt-2 text-sm text-gray-700 space-y-1">
                                  <div>Action: <strong>{perItemAction[id] || actionType}</strong></div>
                                  <div>Reason: <strong>{perItemReason[id] || "—"}</strong></div>
                                  {(perItemAction[id] || actionType) === "exchange" && perItemExchangeSize[id] && (
                                    <div>Exchange size: <strong>{perItemExchangeSize[id]}</strong></div>
                                  )}
                                  {perItemDetails[id] && (
                                    <div>Notes: <span className="text-gray-600">{perItemDetails[id]}</span></div>
                                  )}
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                  <Button variant="ghost" onClick={() => setStep(2)}>Edit</Button>
                                  <Button variant="outline" onClick={() => {
                                    setItemsSelected((p) => { const c = { ...p }; delete c[id]; return c; });
                                    setPerItemAction((p) => { const c = { ...p }; delete c[id]; return c; });
                                    setPerItemReason((p) => { const c = { ...p }; delete c[id]; return c; });
                                    setPerItemDetails((p) => { const c = { ...p }; delete c[id]; return c; });
                                    setPerItemExchangeSize((p) => { const c = { ...p }; delete c[id]; return c; });
                                    (perItemPreviews[id] || []).forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
                                    setPerItemFiles((p) => { const c = { ...p }; delete c[id]; return c; });
                                    setPerItemPreviews((p) => { const c = { ...p }; delete c[id]; return c; });
                                  }}>Remove</Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-4 border-t" />

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-700">Total items</div>
                        <div className="font-semibold">{Object.keys(itemsSelected).reduce((acc, k) => acc + (itemsSelected[k] || 0), 0)}</div>
                      </div>

                      <div className="text-sm text-gray-600">By submitting, you agree to our return policy above. We will email you a shipping label if eligible.</div>

                      <div className="flex gap-3 mt-4">
                        <Button className="bg-black text-white" onClick={() => submitReturnRequest()} disabled={loading}>
                          <Check className="mr-2" /> Confirm & Submit
                        </Button>

                        <Button variant="outline" onClick={() => setStep(2)}>Back & Edit</Button>

                        <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(order?.orderNumber || order?.id || ""); toast.success("Order copied"); }}>
                          Copy Order
                        </Button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            )}

            {rma && (
              <div className="mt-6 p-4 border rounded bg-white">
                <h4 className="font-semibold">Return created</h4>
                <p className="text-sm text-gray-600 mt-2">Your RMA: <strong>{rma.rmaNumber || rma.id || rma._id}</strong></p>
                <p className="text-sm text-gray-600">Status: <strong>{rma.status}</strong></p>
                <div className="mt-3 flex gap-2">
                  <Button onClick={() => { navigator.clipboard.writeText(rma.rmaNumber || rma.id || rma._id || ""); toast.success("RMA copied"); }}>Copy RMA</Button>
                  <a href={`/returns/${rma.rmaNumber || rma.id || rma._id}`} className="ml-2 text-sm text-black underline">View status</a>
                </div>
              </div>
            )}

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
