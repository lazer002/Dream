import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCart } from '../state/CartContext.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const { add } = useCart()

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`).then((r) => r.json()).then(setProduct)
  }, [id])

  if (!product) return <div>Loading...</div>
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-square rounded-lg bg-gray-100 overflow-hidden">
          {product.images?.[0] && <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />}
        </div>
      </div>
      <div>
        <h1 className="text-2xl font-semibold mb-2">{product.title}</h1>
        <div className="text-brand-600 font-semibold mb-4 text-xl">${product.price?.toFixed(2)}</div>
        <p className="text-gray-700 mb-6">{product.description}</p>
        <button onClick={() => add(product._id, 1)} className="px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700">Add to cart</button>
      </div>
    </div>
  )
}


