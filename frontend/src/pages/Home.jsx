import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function Home() {
  const [products, setProducts] = useState([])
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/products?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.items || []))
  }, [q])

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white border mb-8">
        <div className="px-8 py-16 sm:px-12 sm:py-20 lg:px-16">
          <div className="max-w-2xl">
            <div className="text-sm font-medium text-brand-600 mb-2">New arrivals</div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Where every stitch is a statement</h1>
            <p className="mt-3 text-gray-600">Modern essentials inspired by streetwear aesthetics. Clean lines, premium feel.</p>
            <div className="mt-6 flex gap-3">
              <Link to="/products" className="px-4 py-2 rounded-md bg-gray-900 text-white hover:bg-black">Shop now</Link>
              <a href="https://urbanfits.co.in" target="_blank" className="px-4 py-2 rounded-md border hover:bg-gray-50">Explore styles</a>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Best selling</h2>
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


