import { useState } from 'react'
import { useAuth } from '../../state/AuthContext.jsx'

export default function AddProduct() {
  const { api } = useAuth()
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    imagesText: '',
    sku: '',
    inventory: 0,
    tagsText: '',
    published: true
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        images: form.imagesText.split(/\n|,/).map(s => s.trim()).filter(Boolean),
        sku: form.sku.trim() || undefined,
        inventory: Number(form.inventory),
        tags: form.tagsText.split(',').map(s => s.trim()).filter(Boolean),
        published: Boolean(form.published)
      }
      await api.post('/products', payload)
      setMsg('Product created')
      setForm({ title: '', description: '', price: '', imagesText: '', sku: '', inventory: 0, tagsText: '', published: true })
    } catch (e) {
      setMsg('Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full rounded-md'

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Add Product</h1>
      {msg && <div className="mb-4 text-sm text-gray-700">{msg}</div>}
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <textarea rows={8} className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Image URLs (comma or newline separated)</label>
            <textarea rows={4} className={input} value={form.imagesText} onChange={(e) => setForm({ ...form, imagesText: e.target.value })} />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Price</label>
            <input className={input} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm mb-1">SKU</label>
            <input className={input} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Inventory</label>
            <input className={input} type="number" value={form.inventory} onChange={(e) => setForm({ ...form, inventory: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (comma separated)</label>
            <input className={input} value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <input id="published" type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            <label htmlFor="published" className="text-sm">Published</label>
          </div>
          <button disabled={saving} className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black disabled:opacity-50">{saving ? 'Saving...' : 'Create product'}</button>
        </div>
      </form>
    </div>
  )
}


