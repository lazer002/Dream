import { useState, useRef, useEffect } from "react"
import { useAuth } from "../../state/AuthContext.jsx"

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter 
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch.jsx"

export default function AddProduct() {
  const [categories, setCategories] = useState([])
  const fileInputRef = useRef(null)
  const { api } = useAuth()
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    inventory: 0,
    category: "",
    published: true,
    isNewProduct: true,
    onSale: true,

  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setMsg("")

    try {
      let uploadedUrls = []
      if (files.length) {
        const urls = []
        for (const f of files) {
          const fd = new FormData()
          fd.append("file", f)
          const { data } = await api.post("/admin/upload/image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          urls.push(data.url)
        }
        uploadedUrls = urls
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        images: uploadedUrls,
        inventory: Number(form.inventory),
        category: form.category,
        published: Boolean(form.published),
        isNewProduct: Boolean(form.isNewProduct),
        onSale: Boolean(form.onSale),
      }

      await api.post("/products", payload)

      setMsg("✅ Product created successfully")
      setForm({
        title: "",
        description: "",
        price: "",
        inventory: 0,
        category: "",
        published: true,
        isNewProduct: true,
        onSale: true,
      })
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (e) {
      setMsg("❌ Failed to create product")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get("/admin/getCategory")
        if (data.success) setCategories(data.categories)
      } catch (err) {
        console.error(err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    if (!files.length) {
      setPreviews([])
      return
    }

    const newPreviews = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }))
    setPreviews(newPreviews)

    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.url))
    }
  }, [files])

  return (
    <div className="max-w-5xl mx-auto p-6">
    <Card>
      {/* HEADER */}
      <CardHeader className="border-b">
        <CardTitle className="text-2xl font-semibold">Add Product</CardTitle>
      </CardHeader>
  
      {/* CONTENT */}
      <CardContent className="pt-6">
        {msg && (
          <div className="mb-6 text-sm px-4 py-3 rounded-md bg-muted text-muted-foreground border">
            {msg}
          </div>
        )}
  
        <form onSubmit={submit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* LEFT SIDE */}
            <div className="space-y-6">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="Enter product title"
                />
              </div>
  
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={8}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Write a short description..."
                />
              </div>
  
              <div>
                <Label>Upload Images</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                />
                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {previews.map((p, i) => (
                      <img
                        key={i}
                        src={p.url}
                        alt={`preview-${i}`}
                        className="aspect-square object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
  
            {/* RIGHT SIDE */}
            <div className="space-y-6">
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  placeholder="0.00"
                />
              </div>
  
              <div>
                <Label>Inventory</Label>
                <Input
                  type="number"
                  value={form.inventory}
                  onChange={(e) => setForm({ ...form, inventory: e.target.value })}
                  placeholder="0"
                />
              </div>
  
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
  
              {/* Toggles */}
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Published</Label>
                <Switch
                  id="published"
                  checked={form.published}
                  onCheckedChange={(v) => setForm({ ...form, published: v })}
                />
              </div>
  
              <div className="flex items-center justify-between">
                <Label htmlFor="isNew">New Product?</Label>
                <Switch
                  id="isNew"
                  checked={form.isNewProduct || false}
                  onCheckedChange={(v) => setForm({ ...form, isNewProduct: v })}
                />
              </div>
  
              <div className="flex items-center justify-between">
                <Label htmlFor="onSale">On Sale?</Label>
                <Switch
                  id="onSale"
                  checked={form.onSale || false}
                  onCheckedChange={(v) => setForm({ ...form, onSale: v })}
                />
              </div>
            </div>
          </div>
  
          {/* FOOTER */}
          <CardFooter className="border-t pt-6 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Product"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  </div>
  
  )
}
