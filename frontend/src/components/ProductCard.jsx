import { Link } from 'react-router-dom'

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product._id}`} className="group">
      <div className="aspect-square rounded-xl bg-gray-100 overflow-hidden">
        {product.images?.[0] && (
          <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
        )}
      </div>
      <div className="mt-3">
        <div className="font-medium truncate">{product.title}</div>
        <div className="text-brand-600 font-semibold">${product.price?.toFixed(2)}</div>
      </div>
    </Link>
  )
}


