import { useEffect, useState } from 'react'
import { useAuth } from '../../state/AuthContext.jsx'
import { Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function AdminProducts() {
  const { api } = useAuth()
  const [items, setItems] = useState([])

  async function load() {
    const r = await fetch(`${API_URL}/products?limit=1000`)
    const d = await r.json()
    setItems(d.items)
  }
  useEffect(() => { load() }, [])

  async function remove(id) {
    await api.delete(`/products/${id}`)
    await load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Products</h2>
        <Link to="/admin/products/new" className="px-3 py-2 rounded-md bg-gray-900 text-white hover:bg-black text-sm">Add product</Link>
      </div>
      <div className="border rounded-lg divide-y">
        {items.map(p => (
          <div key={p._id} className="p-4 flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
              {p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="font-medium">{p.title}</div>
              <div className="text-sm text-gray-600">${p.price?.toFixed(2)}</div>
            </div>
            <button onClick={() => remove(p._id)} className="text-red-600 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}


