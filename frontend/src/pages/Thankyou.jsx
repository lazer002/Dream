import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { CheckCircle,Truck,CreditCard,MapPin } from "lucide-react";
import api  from "@/utils/config"; // your axios instance

export default function ThankYouPage() {
  const { state } = useLocation();
  const { id } = useParams(); // 👈 for Razorpay case
  const navigate = useNavigate();

  const [order, setOrder] = useState(state?.order || null);
  const [loading, setLoading] = useState(!state?.order);

  // ✅ Fetch order if not passed in state
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
    return <div className="p-10 text-center">Loading order...</div>;
  }

  if (!order) {
    return <div className="p-10 text-center">Order not found</div>;
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

return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* SUCCESS HEADER */}
        <div className="bg-white p-6 rounded-2xl shadow flex items-center gap-4">
          <CheckCircle className="text-green-600 w-12 h-12" />
          <div>
            <h1 className="text-2xl font-semibold">
              Order Confirmed 🎉
            </h1>
            <p className="text-gray-600 text-sm">
              Your order has been placed successfully.
            </p>

            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-gray-500">
                Order: <b>{orderNumber}</b>
              </span>

              <span className={`px-2 py-1 rounded text-xs font-medium ${
                paymentStatus === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {paymentStatus === "success" ? "Paid" : "COD"}
              </span>
            </div>
          </div>
        </div>

        {/* DELIVERY + PAYMENT INFO */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* DELIVERY */}
          <div className="bg-white p-5 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold">Delivery</h3>
            </div>
            <p className="text-sm text-gray-600">
              Estimated delivery in <b>5-7 days</b>
            </p>
          </div>

          {/* PAYMENT */}
          <div className="bg-white p-5 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold">Payment</h3>
            </div>
            <p className="text-sm text-gray-600">
              {paymentMethod === "razorpay" ? "Online Payment" : "Cash on Delivery"}
            </p>
          </div>

          {/* ADDRESS */}
          <div className="bg-white p-5 rounded-xl shadow">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold">Shipping</h3>
            </div>
            <p className="text-sm text-gray-600">
              {shippingAddress.firstName} {shippingAddress.lastName}
              <br />
              {shippingAddress.address}
              <br />
              {shippingAddress.city}, {shippingAddress.state}
            </p>
          </div>
        </div>

        {/* ITEMS */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Items in your order</h2>

      <div className="divide-y">
  {items.map((item, i) => {
    const isBundle = !!item.bundleId;

    return (
      <div key={i} className="py-4 space-y-3">

        {/* MAIN ITEM */}
        <div className="flex gap-4">
          <img
            src={
              item.mainImage ||
              item.bundleProducts?.[0]?.mainImage ||
              "/placeholder.jpg"
            }
            className="w-16 h-16 object-cover rounded border"
          />

          <div className="flex-1">
            <p className="font-medium">
              {item.title} {isBundle && "(Bundle)"}
            </p>

            <p className="text-sm text-gray-500">
              Qty: {item.quantity}
            </p>
          </div>

          <div className="font-medium">
            ₹{item.total?.toFixed(2)}
          </div>
        </div>

        {/* 📦 BUNDLE SUB ITEMS */}
        {isBundle && item.bundleProducts?.length > 0 && (
          <div className="ml-20 space-y-2 border-l pl-4">
            {item.bundleProducts.map((bp, idx) => (
              <div key={idx} className="flex gap-3 items-center">
                <img
                  src={bp.mainImage || "/placeholder.jpg"}
                  className="w-10 h-10 rounded border object-cover"
                />

                <div className="text-sm text-gray-600">
                  <p>{bp.title}</p>
                  <p>
                    {bp.variant && `Size: ${bp.variant}`} • Qty: {bp.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    );
  })}
</div>
        </div>

        {/* BILL SUMMARY */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{shippingFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-semibold text-black pt-2 border-t">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            Continue Shopping
          </button>

          <button
            onClick={() =>
              navigate(`/trackorder?orderNumber=${orderNumber}`)
            }
            className="px-6 py-3 border rounded-lg hover:bg-gray-100"
          >
            Track Order
          </button>
        </div>

      </div>
    </div>
  );
}