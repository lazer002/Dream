// src/pages/Cart.jsx
import { useCart } from "../state/CartContext.jsx"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

export default function Cart() {
  const { items, update, remove } = useCart()
  const subtotal = items.reduce(
    (s, it) => s + (it.product?.price || 0) * it.quantity,
    0
  )
  const tax = subtotal * 0.05
  const deliveryFee = subtotal > 500 ? 0 : 50
  const discount = 0 // For now, can apply coupon
  const total = subtotal + tax + deliveryFee - discount

  if (items.length === 0)
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold">Your cart is empty</h2>
        <p className="text-gray-600 mt-2">Add some products to get started!</p>
      </div>
    )

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-screen p-6">
      {/* Left: Scrollable Products */}
      <div className="md:w-2/3 flex flex-col gap-4 overflow-y-auto max-h-[80vh]">
        {items.map((it) => (
          <Card key={it.product._id} className="flex items-center gap-4 p-4">
            <img
              src={it.product.images?.[0]}
              alt={it.product.title}
              className="w-28 h-28 object-cover rounded"
            />
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{it.product.title}</h3>
                <X
                  className="cursor-pointer text-gray-500 hover:text-red-600"
                  onClick={() => remove(it.product._id)}
                />
              </div>
              <div className="flex gap-2 items-center flex-wrap">
                {it.selectedSize && (
                  <Badge variant="outline">Size: {it.selectedSize}</Badge>
                )}
                {it.selectedColor && (
                  <Badge variant="outline">Color: {it.selectedColor}</Badge>
                )}
              </div>
              <div className="flex gap-2 mt-2 items-center">
                <label className="text-gray-700 text-sm">Qty:</label>
                <Input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    update(it.product._id, Number(e.target.value))
                  }
                  className="w-20"
                />
              </div>
              <span className="text-gray-700 font-semibold mt-1">
                Total: ${(it.product.price * it.quantity).toFixed(2)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Right: Sticky Order Summary */}
      <div className="md:w-1/3 flex flex-col gap-4 sticky top-6 self-start">
        <Card className="p-4 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">Order Summary</h2>

          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (5%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Fee</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          {/* Coupon input */}
          <div className="flex gap-2 mt-2">
            <Input placeholder="Enter coupon code" className="flex-1" />
            <Button>Apply</Button>
          </div>

          {/* Delivery date / notes */}
          <div className="mt-2 flex flex-col gap-1">
            <label className="text-gray-700 font-medium">Delivery Date:</label>
            <Input type="date" />
          </div>

          <Button className="mt-4 w-full bg-brand-600 hover:bg-brand-700">
            Proceed to Checkout
          </Button>
        </Card>
      </div>
    </div>
  )
}
