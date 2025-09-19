import { useEffect, useState } from "react"
import { useAuth } from "../../state/AuthContext.jsx"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Lucide icons
import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react"

export default function ProductList() {
  const { api } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [open, setOpen] = useState(false)

  // Delete confirm states
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    inventory: 0,
    category: "hoodies",
    published: true,
  })

  // Fetch products
  async function loadProducts() {
    setLoading(true)
    try {
      const { data } = await api.get("/products")
      setProducts(data.items)
    } catch (e) {
      console.error("Failed to load products", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Open modal for editing
  const handleEdit = (product) => {
    setEditing(product)
    setForm({
      title: product.title,
      description: product.description,
      price: product.price,
      inventory: product.inventory,
      category: product.category,
      published: product.published,
    })
    setOpen(true)
  }

  // Update product
  async function saveProduct() {
    try {
      await api.put(`/products/${editing._id}`, form)
      setOpen(false)
      setEditing(null)
      loadProducts()
    } catch (e) {
      console.error("Failed to update", e)
    }
  }

  // Delete product
  async function confirmDelete() {
    try {
      await api.delete(`/products/${deleteId}`)
      setDeleteOpen(false)
      setDeleteId(null)
      loadProducts()
    } catch (e) {
      console.error("Failed to delete", e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Inventory</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>₹{p.price}</TableCell>
                    <TableCell>{p.inventory}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>
                      {p.published ? (
                        <span className="flex items-center gap-1 text-blue-800 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Published
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-sm font-medium">
                          <XCircle className="h-4 w-4" /> Draft
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      {/* View */}
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() =>
                          (window.location.href = `/product/${p._id}`)
                        }
                        className="bg-blue-50 text-blue-900 hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => handleEdit(p)}
                        className="border-blue-800 text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      {/* Delete with confirm dialog */}
                      <Button
                        size="icon"
                        onClick={() => {
                          setDeleteId(p._id)
                          setDeleteOpen(true)
                        }}
                        className="bg-blue-800 text-white hover:bg-blue-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* EDIT MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-full rounded-2xl shadow-lg bg-white flex flex-col">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Edit Product
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({ ...form, price: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Inventory</Label>
              <Input
                type="number"
                value={form.inventory}
                onChange={(e) =>
                  setForm({ ...form, inventory: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm({ ...form, category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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

            {/* ✅ Publish Toggle */}
            <div className="flex items-center justify-between py-2">
              <Label>Published</Label>
              <button
                onClick={() =>
                  setForm({ ...form, published: !form.published })
                }
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  form.published ? "bg-blue-800" : "bg-gray-300"
                }`}
              >
                <span
                  className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform ${
                    form.published ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-white px-6 py-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-blue-800 text-blue-800 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button className="bg-blue-800 text-white hover:bg-blue-900" onClick={saveProduct}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM MODAL */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm rounded-xl bg-white shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this product? This action
            cannot be undone.
          </p>
          <DialogFooter className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="border-blue-800 text-blue-800 hover:bg-blue-50"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-blue-800 text-white hover:bg-blue-900"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
