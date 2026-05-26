import { motion } from "framer-motion";

export default function ProductCard({
  product,
  selected,
  onToggle,
}) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25 }}
      className="
        group
        overflow-hidden
        rounded-[32px]
        bg-white
        border
        border-neutral-200
        hover:shadow-2xl
        transition-all
      "
    >
      {/* IMAGE */}
      <div className="relative overflow-hidden">
        <img
          src={
            product.images?.[0] ||
            "/images/placeholder.png"
          }
          alt={product.title}
          className="
            w-full
            h-[480px]
            md:h-[560px]
            object-cover
            transition-transform
            duration-700
            group-hover:scale-105
          "
        />

        {/* Overlay */}
        <div
          className="
            absolute inset-0
            bg-gradient-to-t
            from-black/50
            via-black/10
            to-transparent
          "
        />

        {/* Category Badge */}
        <div
          className="
            absolute
            top-4
            left-4

            bg-white/90
            backdrop-blur

            rounded-full

            px-4
            py-2

            text-[11px]
            font-bold

            uppercase
            tracking-[0.25em]
          "
        >
          {product.category?.name || "Product"}
        </div>

        {/* Status */}
        {selected && (
          <div
            className="
              absolute
              top-4
              right-4

              bg-green-600
              text-white

              px-3
              py-1.5

              rounded-full

              text-xs
              font-semibold
            "
          >
            Added
          </div>
        )}

        {/* Bottom Overlay Content */}
        <div
          className="
            absolute
            bottom-0
            left-0
            right-0

            p-6

            text-white
          "
        >
          <p
            className="
              text-xs
              uppercase
              tracking-[0.3em]
              text-white/70
              mb-2
            "
          >
            Build Your Look
          </p>

          <h3
            className="
              text-2xl
              font-black
              tracking-tight
            "
          >
            {product.title}
          </h3>

          <p
            className="
              mt-2
              text-xl
              font-bold
            "
          >
            ₹
            {Number(
              product.price || 0
            ).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6">
        <button
          onClick={onToggle}
          className={`
            w-full
            py-4
            rounded-full

            text-sm
            font-semibold

            transition-all

            ${
              selected
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-black text-white hover:bg-neutral-800"
            }
          `}
        >
          {selected
            ? "REMOVE FROM LOOK"
            : "ADD TO LOOK"}
        </button>
      </div>
    </motion.div>
  );
}