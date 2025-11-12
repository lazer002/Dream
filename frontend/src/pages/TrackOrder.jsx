// src/pages/TrackOrder.jsx
import React, { useEffect, useState,useRef } from "react";
import { Loader2, Copy, Mail, ArrowLeft } from "lucide-react";
import { api } from "@/utils/config"; // your axios instance
import { Link } from "react-router-dom";


function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function TrackOrder() {
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const [copied, setCopied] = useState(false);
  const printRef = useRef();
  
useEffect(() => {
  try {
    const raw = localStorage.getItem("track_order_last");
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.email) setEmail(saved.email);
    if (saved.orderNumber) setOrderNumber(saved.orderNumber);
  } catch {
    localStorage.removeItem("track_order_last");
  }
}, []);

useEffect(() => {
  if (!remember) {
    localStorage.removeItem("track_order_last");
    return;
  }

  // only store if both have some value (avoids useless writes)
  if (email || orderNumber) {
    localStorage.setItem(
      "track_order_last",
      JSON.stringify({ email, orderNumber })
    );
  }
}, [email, orderNumber, remember]);



  const validateInput = () => {
    // require at least email OR orderNumber; but recommend both
    if (!email && !orderNumber) {
      setError("Please enter your email or order number to track your order.");
      return false;
    }
    // basic email pattern if provided
    if (email && !/.+@.+\..+/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleTrack = async (e) => {
    e && e.preventDefault();
    setError("");
    setOrder(null);
    if (!validateInput()) return;

    setLoading(true);
    try {
      // Using GET query (backend route described below)
      const params = new URLSearchParams();
      if (email) params.append("email", email);
      if (orderNumber) params.append("orderNumber", orderNumber);
      const res = await api.get(`/orders/track?${params.toString()}`);
      if (res.data && res.data.order) {
        setOrder(res.data.order);
        // optionally persist remembered query only on success
        if (remember) {
          localStorage.setItem("track_order_last", JSON.stringify({ email, orderNumber }));
        }
      } else {
        setError(res.data?.message || "Order not found. Please check your details.");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Unable to find order. Please check and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleEmailTracking = async () => {
    if (!order) return;
    try {
      setLoading(true);
      await api.post("/orders/track-email", {
        email: order.email,
        orderNumber: order.orderNumber,
        orderId: order._id,
      });
      setError(""); // clear
      alert("Tracking link sent to your email.");
    } catch (err) {
      setError("Failed to send email. Try again later.");
    } finally {
      setLoading(false);
    }
  };





  return (
    <div className="max-w-4xl mx-auto p-6 py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to shop
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-4">Track Your Order</h1>
      <p className="text-sm text-gray-600 mb-8">
        Enter your email and order number to see the latest status. If you don't have the order number, just provide the email (we will return most recent).
      </p>

      <form onSubmit={handleTrack} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <input
          type="email"
          placeholder="Email (you used at checkout)"
          className="col-span-1 sm:col-span-1 border border-gray-200 rounded-md px-4 py-3 focus:border-black"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Order number (e.g. DD-2025-0001)"
          className="col-span-1 sm:col-span-1 border border-gray-200 rounded-md px-4 py-3 focus:border-black"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
        />
        <div className="col-span-1 sm:col-span-1 flex items-center gap-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-5 py-3 rounded-md hover:bg-gray-900 transition flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track Order"}
          </button>
          <label className="ml-2 inline-flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={remember} onChange={() => setRemember((s) => !s)} className="w-4 h-4" />
            Remember
          </label>
        </div>
      </form>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      {/* Result */}
      {order && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6" id="print-section" ref={printRef}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">{order.orderNumber}</h2>
                <button
                  onClick={() => handleCopy(order.orderNumber)}
                  className="inline-flex items-center gap-2 text-xs text-gray-600 px-2 py-1 border border-gray-200 rounded-full hover:bg-gray-50"
                >
                  <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-sm text-gray-500">Placed: {formatDate(order.createdAt)}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {order.orderStatus?.toUpperCase()}
              </span>
              <div className="text-sm text-gray-500 mt-2">Payment: {order.paymentMethod?.toUpperCase()}</div>
            </div>
          </div>

          {/* timeline */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Order Progress</h3>
            <ol className="space-y-3">
              {order.statusHistory && order.statusHistory.length ? (
                order.statusHistory.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-8">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs">
                        {i + 1}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{s.status}</div>
                      <div className="text-xs text-gray-500">{formatDate(s.updatedAt)}</div>
                      {s.note && <div className="text-xs text-gray-600 mt-1">{s.note}</div>}
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-sm text-gray-500">No status history available.</div>
              )}
            </ol>
          </div>

          {/* items */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
            <div className="divide-y divide-gray-100">
{order.items.map((it) => (
  <div
    key={it._id || it.title}
    className="py-3 flex items-center justify-between border-b border-gray-100 last:border-0"
  >
    {/* Left: Image + Info */}
    <div className="flex items-center gap-4">
      <Link
        to={
          it.bundleId
            ? `/collections/${it.bundleId}`
            : it.productId
            ? `/product/${it.productId}`
            : "#"
        }
        className="block flex-shrink-0"
      >
        <img
          src={it.mainImage || it.bundleProducts?.[0]?.mainImage || "/placeholder.svg"}
          alt={it.title}
          className="w-14 h-14 object-cover rounded-md border border-gray-200 bg-gray-50 hover:scale-105 transition-transform"
        />
      </Link>

      <div>
        <Link
          to={
            it.bundleId
              ? `/collections/${it.bundleId}`
              : it.productId
              ? `/product/${it.productId}`
              : "#"
          }
          className="text-sm font-medium text-gray-900 hover:underline"
        >
          {it.title}
        </Link>

        {it.variant && (
          <div className="text-xs text-gray-500">Variant: {it.variant}</div>
        )}

        {/* Bundle items */}
        {it.bundleProducts && it.bundleProducts.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Bundle contents:
            <ul className="ml-3 list-disc">
              {it.bundleProducts.map((bp) => (
                <li
                  key={bp._id || bp.title}
                  className="flex items-center gap-2 mt-1"
                >
                  <Link
                    to={`/product/${bp.productId}`}
                    className="flex items-center gap-2 hover:text-gray-900"
                  >
                    {bp.mainImage && (
                      <img
                        src={bp.mainImage}
                        alt={bp.title}
                        className="w-6 h-6 object-cover rounded border border-gray-200 bg-gray-50"
                      />
                    )}
                    <span>
                      {bp.title} — {bp.variant || "—"} × {bp.quantity || 1}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>

    {/* Right: Price */}
    <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
      ₹{it.total}
    </div>
  </div>
))}


            </div>

            <div className="mt-4 flex justify-end gap-6">
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="text-sm font-semibold">₹{order.subtotal}</div>
            </div>
            <div className="mt-1 flex justify-end gap-6">
              <div className="text-sm text-gray-600">Shipping</div>
              <div className="text-sm font-semibold">₹{order.shippingFee}</div>
            </div>
            <div className="mt-2 flex justify-end gap-6">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-bold">₹{order.total}</div>
            </div>
          </div>

          {/* shipping */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-100 p-4 rounded-md">
              <h4 className="font-semibold text-gray-900 mb-2">Shipping Address</h4>
              <div className="text-sm text-gray-700">
                {order.shippingAddress?.firstName} {order.shippingAddress?.lastName}
                <div>{order.shippingAddress?.address}</div>
                <div>{order.shippingAddress?.apartment}</div>
                <div>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zip}
                </div>
                <div>{order.shippingAddress?.country}</div>
                <div className="mt-2">Phone: {order.shippingAddress?.phone}</div>
                <div>Email: {order.email}</div>
              </div>
            </div>

            <div className="border border-gray-100 p-4 rounded-md">
              <h4 className="font-semibold text-gray-900 mb-2">Shipping & Tracking</h4>
              <div className="text-sm text-gray-700 mb-2">
                Method: {order.shippingMethod || "free"}
              </div>

              {order.trackingId ? (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm text-gray-700">Tracking ID: {order.trackingId}</div>
                    <div className="text-xs text-gray-500">Estimated: {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : "—"}</div>
                  </div>
                  <Link 
                    className="text-sm inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
                    to={`https://www.trackcourier.example/track/${order.trackingId}`} // replace with real courier url if available
                    target="_blank"
                    rel="noreferrer"
                  >
                    Track <span className="sr-only">tracking</span>
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Tracking not yet available.</div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleEmailTracking}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm"
                >
                  <Mail className="w-4 h-4" /> Email me tracking
                </button>
                              <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50 text-sm">
                                  Print
                              </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* no order found */}
      {!order && !loading && !error && (
        <div className="text-sm text-gray-500 mt-4">You can also find your order number in the confirmation email we sent after purchase.</div>
      )}
    </div>
  );
}
