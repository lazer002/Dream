import OutfitPreview from "./OutfitPreview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LookSummary({
  products,
  subtotal,
  discount,
  total,
  selectedSizes,
  setSelectedSizes,
  onAddToCart,
}) {
  return (
    <aside className="sticky top-24 h-fit bg-white border rounded-[32px] p-7 shadow-xl">

      <h2 className="text-2xl font-black">
        Your Look
      </h2>

      <OutfitPreview
  products={products}
  onRemove={(id) =>
    setSelectedProducts((prev) =>
      prev.filter(
        (item) => item._id !== id
      )
    )
  }
/>

      <div className="mt-8 space-y-5">

        {products.map((product,i) => (
      <div
  key={product._id}
  className="
    flex
    items-center
    gap-3
    border-b
    pb-3
  "
>
  <img
    src={product.images?.[0]}
    alt=""
    className="
      w-12
      h-12
      rounded-lg
      object-cover
    "
  />

  <div className="flex-1">
    <p className="font-medium text-sm">
      {product.title}
    </p>

    <p className="text-xs text-neutral-500">
      Size: {selectedSizes[product._id]}
    </p>
  </div>

  <p className="font-semibold">
    ₹{product.price}
  </p>
</div>
        ))}
      </div>

      <div className="mt-8 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{subtotal}</span>
        </div>

        <div className="flex justify-between text-green-600">
          <span>Bundle Saving</span>
          <span>
            -₹{discount.toFixed(0)}
          </span>
        </div>

        <div className="flex justify-between text-xl font-black">
          <span>Total</span>
          <span>
            ₹{total.toFixed(0)}
          </span>
        </div>
      </div>

      <button
        disabled={!products.length}
        onClick={onAddToCart}
        className="mt-8 w-full py-4 rounded-full bg-black text-white font-semibold disabled:opacity-40"
      >
        ADD LOOK TO CART
      </button>
    </aside>
  );
}