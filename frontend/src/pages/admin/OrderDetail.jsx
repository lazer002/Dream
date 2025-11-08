import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "@/utils/config";
import { Loader2 } from "lucide-react";

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    const res = await api.get(`/admin/orders/${id}`);
    setOrder(res.data.order);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;
  if (!order) return <div className="text-center py-12">Order not found.</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order {order.orderNumber}</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Customer Info</h2>
          <p>{order.email}</p>
          <p>{order.shippingAddress?.firstName} {order.shippingAddress?.lastName}</p>
          <p>{order.shippingAddress?.phone}</p>
        </div>
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Payment</h2>
          <p>Method: {order.paymentMethod}</p>
          <p>Status: {order.paymentStatus}</p>
          <p>Total: ₹{order.total}</p>
        </div>
      </div>
    </div>
  );
}
