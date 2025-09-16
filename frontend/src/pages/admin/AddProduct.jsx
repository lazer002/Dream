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
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadedUrls, setUploadedUrls] = useState([])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        images: [...uploadedUrls, ...form.imagesText.split(/\n|,/).map(s => s.trim()).filter(Boolean)],
        sku: form.sku.trim() || undefined,
        inventory: Number(form.inventory),
        tags: form.tagsText.split(',').map(s => s.trim()).filter(Boolean),
        published: Boolean(form.published)
      }
      await api.post('/products', payload)
      setMsg('Product created')
      setForm({ title: '', description: '', price: '', imagesText: '', sku: '', inventory: 0, tagsText: '', published: true })
      setFiles([])
      setUploadedUrls([])
    } catch (e) {
      setMsg('Failed to create product')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full rounded-md'

  async function uploadAll() {
    if (!files.length) return
    setUploading(true)
    try {
      const urls = []
      for (const f of files) {
        const fd = new FormData()
        fd.append('file', f)
        const { data } = await api.post('/admin/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        urls.push(data.url)
      }
      setUploadedUrls(urls)
      setMsg('Uploaded images')
    } catch (e) {
      setMsg('Upload failed')
    } finally {
      setUploading(false)
    }
  }

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
            <label className="block text-sm mb-1">Upload images</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
            <button type="button" onClick={uploadAll} disabled={uploading || !files.length} className="mt-2 w-full px-3 py-2 bg-gray-900 text-white rounded-md disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload to storage'}</button>
            {(files.length > 0 || uploadedUrls.length > 0) && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {files.map((f, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded" />
                ))}
                {uploadedUrls.map((u, i) => (
                  <img key={i} src={u} className="aspect-square object-cover rounded" />
                ))}
              </div>
            )}
          </div>
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


