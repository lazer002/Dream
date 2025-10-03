import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/CustomCheckbox.jsx";
import { useCart } from "@/state/CartContext";

export default function CheckoutPage() {
  const { items } = useCart();
  const [shippingMethod, setShippingMethod] = useState("free");
  const [billingSame, setBillingSame] = useState(true);

  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
<div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-3 gap-10 text-gray-900">
  {/* Left Section */}
<div className="lg:col-span-2 flex flex-col gap-8 max-h-[calc(100vh-4rem)] overflow-y-auto">

  {/* Contact */}
  <h2 className="text-xl font-semibold border-b pb-2">Contact</h2>
  <div className="space-y-3">
    <div className="border border-gray-300 rounded-lg">
      <Input
        type="email"
        placeholder="Enter your email"
        className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
      />
    </div>
    <div className="flex items-center gap-2">
      <Checkbox id="news" />
      <Label htmlFor="news">Email me with news and offers</Label>
    </div>
  </div>

  {/* Delivery */}
  <h2 className="text-xl font-semibold border-b pb-2">Delivery</h2>
  <div className="grid md:grid-cols-2 gap-4">
    <div className="border border-gray-300 rounded-lg">
      <Input
        placeholder="First name"
        className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
      />
    </div>
    <div className="border border-gray-300 rounded-lg">
      <Input
        placeholder="Last name"
        className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
      />
    </div>
  </div>

  <div className="border border-gray-300 rounded-lg">
    <Input
      placeholder="Address"
      className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
    />
  </div>

  <div className="border border-gray-300 rounded-lg">
    <Input
      placeholder="Apartment, suite, etc. (optional)"
      className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
    />
  </div>

  <div className="border border-gray-300 rounded-lg">
    <Input
      placeholder="City"
      className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
    />
  </div>

  <div className="grid md:grid-cols-3 gap-4">
    <div className="border border-gray-300 rounded-lg">
      <Input
        placeholder="State"
        value="Delhi"
        className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
      />
    </div>
    <div className="border border-gray-300 rounded-lg">
      <Input
        placeholder="ZIP / Postal Code"
        value="110045"
        className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
      />
    </div>
    <div className="border border-gray-300 rounded-lg">
      <Input
        placeholder="Country"
        value="India"
        className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
      />
    </div>
  </div>

  <div className="border border-gray-300 rounded-lg">
    <Input
      placeholder="Phone number"
      className="w-full px-4 py-3 rounded-md focus:ring-2 focus:ring-black focus:border-black border-none"
    />
  </div>

  <div className="flex items-center gap-2">
    <Checkbox id="save" />
    <Label htmlFor="save">Save this information for next time</Label>
  </div>

  {/* Shipping Method */}
  <div className="bg-white shadow rounded-xl p-6 space-y-4 border border-gray-200">
    <h2 className="text-xl font-semibold border-b pb-2">Shipping Method</h2>
    <RadioGroup
      value={shippingMethod}
      onValueChange={setShippingMethod}
      className="space-y-3"
    >
      <div className="flex justify-between items-center p-4 rounded-lg border-2 border-black bg-gray-50">
        <div className="flex items-center gap-3">
          <RadioGroupItem value="free" id="free" />
          <Label htmlFor="free" className="font-medium">
            Free Shipping
          </Label>
        </div>
        <span className="font-medium">Free</span>
      </div>
      <p className="text-sm text-gray-600 ml-8">
        Get your order by <strong>Oct 9</strong>.
      </p>
    </RadioGroup>
  </div>

  {/* Billing Address */}
  <div className="bg-white shadow rounded-xl p-6 space-y-4 border border-gray-200">
    <h2 className="text-xl font-semibold border-b pb-2">Billing Address</h2>
    <RadioGroup
      value={billingSame ? "same" : "different"}
      onValueChange={(val) => setBillingSame(val === "same")}
      className="space-y-2"
    >
      <div className="flex items-center gap-3">
        <RadioGroupItem value="same" id="same" />
        <Label htmlFor="same">Same as shipping address</Label>
      </div>
      <div className="flex items-center gap-3">
        <RadioGroupItem value="different" id="different" />
        <Label htmlFor="different">Use a different billing address</Label>
      </div>
    </RadioGroup>
  </div>
</div>


  {/* Right Section - Order Summary + Cart Items */}
<div className="lg:col-span-1 sticky top-20 bg-white shadow rounded-xl p-6 flex flex-col gap-6 h-fit">

  {/* Order Summary Header */}
  <h2 className="text-xl font-semibold border-b pb-3">Order Summary</h2>

  {/* Cart Items */}
  <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
    {items.map((item) => (
      <div
        key={item.product._id}
        className="flex flex-col border-b border-gray-200 pb-3"
      >
        <div className="flex items-start gap-3">
          {/* Product Image */}
          <img
            src={item.product.images?.[0]}
            alt={item.product.title}
            className="w-16 h-16 object-cover rounded-md border"
          />

          {/* Product Info */}
          <div className="flex-1 flex flex-col">
            <span className="font-medium text-gray-900">
              {item.product.title}
            </span>
            {item.product.variant && (
              <span className="text-sm text-gray-500">
                {item.product.variant}
              </span>
            )}
            <span className="text-sm text-gray-500">
              Quantity: {item.quantity}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              Delivery by tomorrow
            </span>
          </div>

          {/* Item Total */}
          <span className="font-semibold text-gray-900 mt-1">
            ₹{(item.quantity * item.product.price).toFixed(2)}
          </span>
        </div>
      </div>
    ))}
  </div>

  {/* Discount / Gift Code */}
  <div className="mt-4 flex justify-between gap-2">
     <div className="border border-gray-300 rounded-lg w-full">
    <input
      type="text"
      placeholder="Discount code or gift card"
      className="px-4 w-full py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black"
    />
    </div>
    <button className=" bg-black text-white p-2 rounded-md hover:bg-gray-800">
      Submit
    </button>
  </div>

  {/* Cost Summary */}
  <div className="mt-4 border-t border-gray-200 pt-4 flex flex-col gap-2">
    <div className="flex justify-between text-gray-800">
      <span>Subtotal</span>
      <span>₹{subtotal.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-gray-800">
      <span>Shipping</span>
      <span>₹100.00</span>
    </div>
    <div className="flex justify-between font-bold text-lg mt-2">
      <span>Total (INR)</span>
      <span>₹{(subtotal + 100).toFixed(2)}</span>
    </div>
  </div>

  {/* Razorpay Pay Button */}
  <button className="w-full bg-black text-white py-3 rounded-lg text-lg mt-4 hover:bg-gray-800">
    Pay Securely with Razorpay
  </button>
</div>

</div>

  );
}
