import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/CustomCheckbox.jsx";
import { useCart } from "@/state/CartContext";

export default function CheckoutPage() {
    const { items } = useCart();
  const [shippingMethod, setShippingMethod] = useState("express");
  const [billingSame, setBillingSame] = useState(true);
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)

  return (
    <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-3 gap-10">
      {/* Left Section */}
      <div className="lg:col-span-2 flex flex-col gap-8 max-h-[calc(100vh-4rem)] overflow-y-auto overflow-hidden">
        
        {/* Contact */}
        <div className="bg-white shadow rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Contact</h2>
          <div className="space-y-3">
            <Input type="email" placeholder="Enter your email" className="px-4 py-3" />
            <div className="flex items-center gap-2">
              <Checkbox id="news" />
              <Label htmlFor="news">Email me with news and offers</Label>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-white shadow rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Delivery</h2>
          <p className="text-sm text-gray-500">
            Shipping outside of India?{" "}
            <a href="#" className="text-blue-600 underline">
              Click here
            </a>{" "}
            to visit our global website.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <Input placeholder="First name" />
            <Input placeholder="Last name" />
          </div>
          <Input placeholder="Address" />
          <Input placeholder="Apartment, suite, etc. (optional)" />
          <Input placeholder="City" />
          <div className="grid md:grid-cols-3 gap-4">
            <Input placeholder="State" value="Delhi" />
            <Input placeholder="ZIP / Postal Code" value="110045" />
            <Input placeholder="Country" value="India" />
          </div>
          <Input placeholder="Phone number" />
          <div className="flex items-center gap-2">
            <Checkbox id="save" />
            <Label htmlFor="save">Save this information for next time</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="sms" />
            <Label htmlFor="sms">Text me with news and offers</Label>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            *Use Indian number only, OTP needed for delivery
          </p>
        </div>

        {/* Shipping Method */}
        <div className="bg-white shadow rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Shipping Method</h2>
          <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="space-y-3">
            <div
              className={`flex justify-between items-center p-4 rounded-lg border cursor-pointer ${
                shippingMethod === "express" ? "border-black bg-gray-50" : "border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="express" id="express" />
                <Label htmlFor="express">Express Delivery</Label>
              </div>
              <span className="font-medium">₹100.00</span>
            </div>
            <p className="text-sm text-gray-500 ml-8">
              Your order will be delivered by <strong>Oct 4</strong>.
            </p>

            <div
              className={`flex justify-between items-center p-4 rounded-lg border cursor-pointer ${
                shippingMethod === "free" ? "border-black bg-gray-50" : "border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="free" id="free" />
                <Label htmlFor="free">Free Shipping</Label>
              </div>
              <span className="font-medium">Free</span>
            </div>
            <p className="text-sm text-gray-500 ml-8">
              Get your order by <strong>Oct 9</strong>. (Public holidays may delay delivery.)
            </p>
          </RadioGroup>
        </div>

        {/* Payment */}
        <div className="bg-white shadow rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Payment</h2>
          <p className="text-sm text-gray-500">All transactions are secure and encrypted.</p>
          <div className="flex flex-col gap-3">
            {[
              { label: "Razorpay Secure", subtitle: "(UPI, Cards, Wallets, Int’l Cards)", img: "/payments/razorpay.png" },
              { label: "PayU India", subtitle: "(Cards, UPI, NetBanking, BNPL)", img: "/payments/payu.png" },
            ].map((p) => (
              <div key={p.label} className="flex justify-between items-center border rounded-lg p-4 hover:shadow-sm cursor-pointer">
                <div>
                  <p className="font-medium">{p.label}</p>
                  <p className="text-xs text-gray-500">{p.subtitle}</p>
                </div>
                <img src={p.img} alt={p.label} className="h-6" />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Cash on Delivery (COD) unavailable for Express Delivery.
          </p>
        </div>

        {/* Billing Address */}
        <div className="bg-white shadow rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold border-b pb-2">Billing Address</h2>
          <RadioGroup value={billingSame ? "same" : "different"} onValueChange={(val) => setBillingSame(val === "same")} className="space-y-2">
            <div className="flex items-center gap-3">
              <RadioGroupItem value="same" id="same" />
              <Label htmlFor="same">Same as shipping address</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="different" id="different" />
              <Label htmlFor="different">Use a different billing address</Label>
            </div>
          </RadioGroup>
          <div className="flex items-center gap-2">
            <Checkbox id="gst" />
            <Label htmlFor="gst">Issue a GST Invoice</Label>
          </div>
          <p className="text-xs text-gray-400">
            • Ensure billing address matches GST registered address.<br />
            • GST invoice changes delivery date to Oct 14.<br />
            • Not available for gift cards.
          </p>
        </div>
      </div>

      {/* Right Section - Order Summary */}
{/* Right Section - Order Summary */}
<div className="lg:col-span-1 sticky top-20 bg-white shadow rounded-xl p-6 flex flex-col gap-6 h-fit">
  <h2 className="text-xl font-semibold">Order Summary</h2>

  {items.map((item) => (
    <div
      key={item.product._id}
      className="flex items-center gap-4 border-b border-gray-200 pb-4"
    >
      {/* Product Image */}
      <img
        src={item.product.images?.[0]}
        alt={item.product.title}
        className="w-16 h-16 object-cover rounded-lg"
      />

      {/* Product Info */}
      <div className="flex-1 flex flex-col">
        <span className="font-medium text-gray-900">{item.product.title}</span>
        <span className="text-sm text-gray-500">
          {item.quantity} × ₹{item.product.price}
        </span>
      </div>

      {/* Item Total */}
      <span className="font-semibold text-gray-900">
        ₹{(item.quantity * item.product.price).toFixed(2)}
      </span>
    </div>
  ))}

  {/* Summary Totals */}
  <div className="border-t border-gray-200 pt-4 flex flex-col gap-2">
    <div className="flex justify-between text-gray-700">
      <span>Subtotal</span>
      <span>₹{subtotal.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-gray-700">
      <span>Shipping</span>
      <span>{shippingMethod === "express" ? "₹100.00" : "Free"}</span>
    </div>
    <div className="flex justify-between font-bold text-lg mt-2">
      <span>Total</span>
      <span>₹{shippingMethod === "express" ? (subtotal + 100).toFixed(2) : subtotal.toFixed(2)}</span>
    </div>
  </div>

  <Button className="w-full bg-black text-white py-3 hover:bg-gray-800 mt-4">
    Pay Now
  </Button>
</div>

    </div>
  );
}
