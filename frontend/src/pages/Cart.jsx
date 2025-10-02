// src/pages/Cart.jsx
import { Link } from "react-router-dom"
import { useCart } from "../state/CartContext.jsx"
import { X } from "lucide-react"

export default function Cart() {
  const { items, update, remove } = useCart()

  const subtotal = items.reduce(
    (s, it) => s + (it.product?.price || 0) * it.quantity,
    0
  )
  const tax = subtotal * 0.05
  const deliveryFee = subtotal > 500 ? 0 : 50
  const discount = 0
  const total = subtotal + tax + deliveryFee - discount

  if (items.length === 0)
    return (
    <div className="flex flex-col items-center justify-center py-32 gap-8">
    {/* Floating cart illustration */}
    <div className="relative w-36 h-36 animate-bounce">
      <div className="absolute inset-0 bg-brand-50 rounded-full flex items-center justify-center shadow-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-16 h-16 text-black"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.6 8H19M7 13L5.4 5M19 21a1 1 0 100-2 1 1 0 000 2zm-10 0a1 1 0 100-2 1 1 0 000 2z"
          />
        </svg>
      </div>
      {/* subtle shadow */}
      <div className="absolute bottom-0 w-32 h-1 bg-black opacity-10 rounded-full blur-sm"></div>
    </div>

    {/* Heading */}
    <h2 className="text-3xl font-extrabold text-gray-900">
      Oops! Your Bag is Empty
    </h2>

    {/* Subtext */}
    <p className="text-gray-600 text-base max-w-sm text-center">
      But don’t worry, amazing products are waiting for you. Start filling it up!
    </p>

    {/* Buttons */}
    <div className="flex gap-4">
      <a
        href="/login"
        className="px-6 py-3 font-semibold text-white bg-black rounded-lg shadow hover:bg-brand-700 transition"
      >
        Sign In
      </a>
      <a
        href="/products"
        className="px-6 py-3 font-semibold text-black border-2 border-brand-600 rounded-lg hover:bg-brand-50 transition"
      >
        Continue Shopping
      </a>
    </div>
  </div>
    )

  return (
    <div className="flex flex-col md:flex-row gap-6 px-6 py-8 min-h-screen">
      {/* Left: Cart Items */}
   <div className="md:w-2/3 flex flex-col gap-4">
  {items.map((it) => (
    <div
      key={it.product._id}
      className="flex gap-4 p-4 border border-gray-200 rounded-xl transition duration-300 bg-white relative"
    >
      {/* Product Image */}
      <img
        src={it.product.images?.[0]}
        alt={it.product.title}
        className="w-28 h-28 object-cover rounded-lg"
      />

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Title + Remove */}
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-gray-900 text-lg truncate">
            {it.product.title}
          </h3>
          <div className="flex flex-col items-end gap-2">
            <X
              className="cursor-pointer text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full p-1 transition"
              onClick={() => remove(it.product._id)}
            />
            {/* Delivery & Price */}
            <div className="text-right text-sm text-gray-600 mt-1">
              <p>Delivery by <span className="font-medium text-gray-900">Oct 3</span></p>
              <p className="font-bold text-[#042354]">₹ { (it.product.price * it.quantity).toLocaleString() }</p>
            </div>
          </div>
        </div>

        {/* Variants */}
        <div className="flex flex-wrap gap-2 mt-2">
          {it.selectedSize && (
            <span className="text-sm border border-gray-300 px-2 py-0.5 rounded text-gray-700">
              Size: {it.selectedSize}
            </span>
          )}
          {it.selectedColor && (
            <span className="text-sm border border-gray-300 px-2 py-0.5 rounded text-gray-700">
              Color: {it.selectedColor}
            </span>
          )}
        </div>

        {/* Quantity with +/- */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-gray-700 text-sm font-medium">Qty:</span>
          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => update(it.product._id, Math.max(1, it.quantity - 1))}
              className="px-2 py-1  transition text-gray-700 font-bold"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={it.quantity}
              onChange={(e) => update(it.product._id, Number(e.target.value))}
              className="w-16 text-center border-l border-r border-gray-300 focus:outline-none"
            />
            <button
              onClick={() => update(it.product._id, it.quantity + 1)}
              className="px-2 py-1  transition text-gray-700 font-bold"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  ))}
</div>

      {/* Right: Order Summary */}
  {/* Right: Order Summary */}
<div className="md:w-1/3 flex flex-col gap-4">
  <div className="p-4 border rounded-lg shadow-sm flex flex-col gap-4 sticky top-6">
    <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>

    <div className="flex justify-between text-gray-700">
      <span>Subtotal</span>
      <span>${subtotal.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-gray-700">
      <span>Tax (5%)</span>
      <span>${tax.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-gray-700">
      <span>Delivery Fee</span>
      <span>${deliveryFee.toFixed(2)}</span>
    </div>
    <div className="flex justify-between text-gray-700">
      <span>Discount</span>
      <span>-${discount.toFixed(2)}</span>
    </div>

    <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg text-gray-900">
      <span>Total</span>
      <span>${total.toFixed(2)}</span>
    </div>

    {/* Coupon */}
    <div className="flex gap-2 mt-2">
      <input
        type="text"
        placeholder="Enter coupon code"
        className="flex-1 border rounded px-3 py-2 text-gray-900"
      />
      <button className="bg-black text-white px-4 py-2 rounded hover:bg-brand-700 transition">
        Apply
      </button>
    </div>
<Link to="/checkout">
    <button className="mt-4 w-full bg-black text-white py-2 rounded hover:bg-brand-700 transition">
      Proceed to Checkout
    </button>
    </Link>
  </div>
</div>

    </div>
  )
}
