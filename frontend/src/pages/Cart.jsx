import { useCart } from '../state/CartContext.jsx'

export default function Cart() {
  const { items, update } = useCart()
  const subtotal = items.reduce((s, it) => s + (it.product?.price || 0) * it.quantity, 0)
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Your Cart</h1>
      <div className="grid grid-cols-1 gap-4">
        {items.map((it) => (
          <div key={it._id} className="flex gap-4 items-center border rounded-lg p-4">
            <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
              {it.product?.images?.[0] && <img src={it.product.images[0]} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="font-medium">{it.product?.title}</div>
              <div className="text-gray-600 text-sm">${it.product?.price?.toFixed(2)}</div>
            </div>
            <input type="number" min={0} value={it.quantity}
              onChange={(e) => update(it.product?._id, Number(e.target.value))}
              className="w-20 rounded-md" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-lg">Subtotal</div>
        <div className="text-xl font-semibold">${subtotal.toFixed(2)}</div>
      </div>
      <button className="mt-4 w-full md:w-auto px-4 py-2 bg-brand-600 text-white rounded-md">Checkout (stub)</button>
    </div>
  )
}


