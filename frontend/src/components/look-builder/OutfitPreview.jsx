import { X } from "lucide-react";

export default function OutfitPreview({
  products,
  setSelectedProducts,
  setSelectedSizes,
}) {
  if (!products.length) {
    return (
      <div className="mt-6 h-24 rounded-2xl border border-dashed border-neutral-300 flex items-center justify-center text-sm text-neutral-400">
        Select products to build your look
      </div>
    );
  }

  const removeProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p._id !== productId)
    );

    setSelectedSizes((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          {products.length} Selected
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.slice(0, 6).map((product) => (
          <div
            key={product._id}
            className="relative shrink-0"
          >
            <img
              src={product.images?.[0]}
              alt={product.title}
              className="
                w-16
                h-16
                rounded-xl
                object-cover
                border
                border-neutral-200
                bg-neutral-100
              "
            />

            <button
              onClick={() =>
                removeProduct(product._id)
              }
              className="
                absolute
                top-5
                right-5
                w-5
                h-5
                rounded-full
                bg-black
                text-white
                flex
                items-center
                justify-center
                shadow-md
                hover:scale-110
                transition
              "
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {products.length > 6 && (
          <div
            className="
              w-16
              h-16
              rounded-xl
              border
              border-neutral-200
              flex
              items-center
              justify-center
              text-xs
              font-bold
              shrink-0
              bg-white
            "
          >
            +{products.length - 6}
          </div>
        )}
      </div>
    </div>
  );
}