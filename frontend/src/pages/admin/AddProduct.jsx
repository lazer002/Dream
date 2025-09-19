import { useState } from "react"
import { useAuth } from "../../state/AuthContext.jsx"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
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

export default function AddProduct() {
  const { api } = useAuth()
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    inventory: 0,
    category: "hoodies",
    published: true,
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")
  const [files, setFiles] = useState([])

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setMsg("")

    try {
      // 1. Upload images
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

      // 2. Payload (no SKU here, backend will auto-generate)
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        images: uploadedUrls,
        inventory: Number(form.inventory),
        category: form.category,
        published: Boolean(form.published),
      }

      // 3. Create product
      await api.post("/products", payload)

      setMsg("✅ Product created successfully")
      setForm({
        title: "",
        description: "",
        price: "",
        inventory: 0,
        category: "hoodies",
        published: true,
      })
      setFiles([])
    } catch (e) {
      setMsg("❌ Failed to create product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Add Product</CardTitle>
        </CardHeader>
        <CardContent>
          {msg && (
            <div className="mb-4 text-sm px-3 py-2 rounded bg-gray-100 text-gray-700">
              {msg}
            </div>
          )}

          <form
            onSubmit={submit}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* LEFT SIDE */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={8}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <Label>Upload Images</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setFiles(Array.from(e.target.files || []))
                  }
                />
                {files.length > 0 && (
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {files.map((f, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(f)}
                        alt="preview"
                        className="aspect-square object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Inventory</Label>
                <Input
                  type="number"
                  value={form.inventory}
                  onChange={(e) =>
                    setForm({ ...form, inventory: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) =>
                    setForm({ ...form, category: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hoodies">Hoodies</SelectItem>
                    <SelectItem value="jackets">Jackets</SelectItem>
                    <SelectItem value="tshirts">T-Shirts</SelectItem>
                    <SelectItem value="pants">Pants</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="published"
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) =>
                    setForm({ ...form, published: e.target.checked })
                  }
                />
                <Label htmlFor="published">Published</Label>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : "Create Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
