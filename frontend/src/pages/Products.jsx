import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function Products() {
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/products?q=${encodeURIComponent(q)}&limit=48`)
      .then((r) => r.json())
      .then((d) => setProducts(d.items || []))
  }, [q])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">All Products</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="rounded-md border-gray-300" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  )
}


