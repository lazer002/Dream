// src/pages/Cart.jsx
import { Link } from "react-router-dom"
import { useCart } from "../state/CartContext.jsx"
import { X } from "lucide-react"

export default function Cart() {
  const { items, update, remove, loading } = useCart()

const subtotal = items.reduce((s, it) => {
  return s + (it.bundle ? it.bundle.price * it.quantity : (it.product?.price || 0) * it.quantity);
}, 0);

const tax = subtotal * 0.05;
const deliveryFee = subtotal > 500 ? 0 : 50;
const discount = 0;
const total = subtotal + tax + deliveryFee - discount;


 if (loading) {
    // Skeleton loader
    return (
      <div className="flex flex-col md:flex-row gap-6 px-6 py-8 min-h-screen">
        <div className="md:w-2/3 flex flex-col gap-4">
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-4 p-5 border border-gray-200 rounded-xl bg-white shadow-sm animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-300 rounded-lg" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-5 bg-gray-300 rounded w-3/4" />
                    <div className="h-4 bg-gray-300 rounded w-1/2" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="w-6 h-6 bg-gray-300 rounded-full" />
                  <div className="h-4 bg-gray-300 rounded w-12 mt-2" />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 border-t pt-3">
                <div className="h-6 w-20 bg-gray-300 rounded" />
                <div className="flex items-center gap-1">
                  <div className="h-6 w-6 bg-gray-300 rounded" />
                  <div className="h-6 w-12 bg-gray-300 rounded" />
                  <div className="h-6 w-6 bg-gray-300 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="md:w-1/3 flex flex-col gap-4">
          <div className="p-5 border rounded-lg shadow-sm flex flex-col gap-4 sticky top-6 bg-white animate-pulse">
            <div className="h-7 bg-gray-300 w-3/4 rounded" />
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 w-full rounded" />
            ))}
            <div className="h-6 bg-gray-300 w-full rounded mt-3" />
            <div className="h-10 bg-gray-300 w-full rounded mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        {/* Cart Icon */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
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
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-black">Your Cart is Empty</h2>

        {/* Subtext */}
        <p className="text-gray-700 max-w-md">
          Looks like you haven’t added any products yet. Explore our collection and find your favorites.
        </p>

        {/* Buttons */}
        <div className="flex gap-4 mt-6">
          <Link to="/products"
            className="px-6 py-3 font-medium text-white bg-black rounded-lg hover:bg-gray-900 transition"
          >
            Continue Shopping
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 font-medium text-black border-2 border-black rounded-lg hover:bg-black hover:text-white transition"
          >
            Sign In
          </Link>
        </div>
      </div>
    )

return (
  <div className="flex flex-col md:flex-row gap-6 px-6 py-8 min-h-screen">
    {/* Left: Cart Items */}
    <div className="md:w-2/3 flex flex-col gap-4">
    {items.map((it) => {
  const isBundle = !!it.bundle;
  const key = isBundle ? it.bundle._id : `${it.product._id}-${it.size}`;

  // 👇 Choose correct image for bundles or single products
const imageSrc = isBundle
  ? it.mainImage || "/placeholder.jpg"
  : it.product?.images?.[0] || "/placeholder.jpg";


  return (
    <div
      key={key}
      className="flex flex-col gap-4 p-5 border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition duration-300"
    >
      {/* Top Row */}
      <div className="flex items-start justify-between">
        {/* Left: Product Info */}
        <div className="flex items-start gap-4">
          {/* Image */}
          <img
            src={imageSrc}
            alt={isBundle ? it.bundle?.title : it.product?.title}
            className="w-20 h-20 rounded-lg object-cover border border-gray-200"
          />

          {/* Title + Info */}
          <div className="flex flex-col justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {isBundle ? it.bundle.title : it.product.title}
            </h3>

            {isBundle ? (
              <p className="text-sm text-gray-600 mt-1">
                Bundle of {it.bundleProducts?.length || 0} products
              </p>
            ) : (
              it.size && (
                <p className="text-sm text-gray-600 mt-1">
                  Size: <span className="font-medium">{it.size}</span>
                </p>
              )
            )}
          </div>
        </div>

        {/* Right: Remove & Price */}
        <div className="flex flex-col items-end">
          <X
            className="cursor-pointer text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full p-1 transition"
            onClick={() =>
              isBundle
                ? remove(it.bundle._id, null, true)
                : remove(it.product._id, it.size)
            }
          />
          <div className="mt-3 text-right">
            <p className="text-sm text-gray-600">
              Delivery by{" "}
              <span className="font-medium text-gray-900">Oct 3</span>
            </p>
            <p className="font-bold text-[#042354] text-lg">
              ₹{" "}
              {(isBundle
                ? it.bundle.price * it.quantity
                : it.product.price * it.quantity
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 🧩 Bundle Products (if applicable) */}
      {isBundle && (
        <div className="ml-6 mt-3 border-t pt-3 space-y-2">
          {it.bundleProducts?.map((bp, i) => (
            <div
              key={i}
              className="flex items-center gap-3 text-sm text-gray-700"
            >
              <img
                src={bp.product?.images?.[0] || "/placeholder.jpg"}
                alt={bp.product?.title}
                className="w-14 h-14 rounded border object-cover"
              />
              <div>
                <p className="font-medium">{bp.product?.title}</p>
                {bp.size && (
                  <p className="text-gray-600 text-xs">Size: {bp.size}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quantity Section */}
      <div className="flex items-center justify-between mt-3 border-t pt-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 text-sm font-medium">Qty:</span>
          <div className="flex items-center border border-gray-300 rounded overflow-hidden">
            <button
              onClick={() => {
                if (it.quantity === 1) {
                  isBundle
                    ? remove(it.bundle._id)
                    : remove(it.product._id, it.size);
                } else {
                  update(
                    isBundle ? it.bundle._id : it.product._id,
                    it.quantity - 1,
                    it.size,
                    isBundle
                  );
                }
              }}
              className="px-3 py-1 text-gray-700 font-bold hover:bg-gray-100 transition"
            >
              -
            </button>

            <input
              type="number"
              min={1}
              value={it.quantity}
              onChange={(e) =>
                update(
                  isBundle ? it.bundle._id : it.product._id,
                  Number(e.target.value),
                  it.size,
                  isBundle
                )
              }
              className="w-14 text-center border-l border-r border-gray-300 focus:outline-none"
            />

            <button
              onClick={() =>
                update(
                  isBundle ? it.bundle._id : it.product._id,
                  it.quantity + 1,
                  it.size,
                  isBundle
                )
              }
              className="px-3 py-1 text-gray-700 font-bold hover:bg-gray-100 transition"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
})}

    </div>

    {/* Right: Order Summary */}
    <div className="md:w-1/3 flex flex-col gap-4">
      <div className="p-5 border rounded-lg shadow-sm flex flex-col gap-4 sticky top-6 bg-white">
        <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>

        <div className="flex justify-between text-gray-700 text-sm">
          <span>Subtotal</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700 text-sm">
          <span>Tax (5%)</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700 text-sm">
          <span>Delivery Fee</span>
          <span>₹{deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-700 text-sm">
          <span>Discount</span>
          <span>-₹{discount.toFixed(2)}</span>
        </div>

        <div className="border-t mt-2 pt-2 flex justify-between font-bold text-lg text-gray-900">
          <span>Total</span>
          <span>₹{total.toFixed(2)}</span>
        </div>

        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Enter coupon code"
            className="flex-1 border rounded px-3 py-2 text-gray-900"
          />
          <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-900 transition">
            Apply
          </button>
        </div>

        <Link to="/checkout">
          <button className="mt-4 w-full bg-black text-white py-2 rounded hover:bg-gray-900 transition">
            Proceed to Checkout
          </button>
        </Link>
      </div>
    </div>
  </div>
);

}
