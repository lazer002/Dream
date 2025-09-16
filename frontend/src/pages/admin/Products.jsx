import { useEffect, useState } from 'react'
import { useAuth } from '../../state/AuthContext.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function AdminProducts() {
  const { api } = useAuth()
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', price: 0, description: '', images: '' })

  async function load() {
    const r = await fetch(`${API_URL}/products?limit=1000`)
    const d = await r.json()
    setItems(d.items)
  }
  useEffect(() => { load() }, [])

  async function createProduct(e) {
    e.preventDefault()
    const payload = { ...form, price: Number(form.price), images: form.images ? [form.images] : [] }
    await api.post('/products', payload)
    setForm({ title: '', price: 0, description: '', images: '' })
    await load()
  }

  async function remove(id) {
    await api.delete(`/products/${id}`)
    await load()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
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
      <div>
        <h2 className="text-xl font-semibold mb-4">Create product</h2>
        <form onSubmit={createProduct} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input className="w-full rounded-md" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Price</label>
            <input className="w-full rounded-md" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Image URL</label>
            <input className="w-full rounded-md" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea className="w-full rounded-md" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button className="w-full px-4 py-2 bg-brand-600 text-white rounded-md">Create</button>
        </form>
      </div>
    </div>
  )
}


