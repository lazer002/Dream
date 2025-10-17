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
const [categories, setCategories] = useState([]);
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
    onSale:true,
    isNewProduct:true
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


  async function loadCategories() {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.categories || []);
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  }
  
  
  
  useEffect(() => {
    loadCategories();
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
    onSale:product.onSale,
    isNewProduct:product.isNewProduct
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
// console.log(products,'products')
  return (
    <div className=" mx-auto">
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
                  {/* <TableHead>Status</TableHead> */}
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

                    <TableCell>{p.title}</TableCell>
                    <TableCell>₹{p.price}</TableCell>

                    {/* Inventory */}
                    <TableCell>
                      {p.inventory
                        ? Object.entries(p.inventory).map(([size, count]) => (
                          <span key={size} className="mr-1">
                            {size}: {count}
                          </span>
                        ))
                        : "-"}
                    </TableCell>

                    {/* Category */}
                    <TableCell>{p.category?.name || "-"}</TableCell>

                    {/* Status */}
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

                    {/* Sizes */}
                    {/* <TableCell>{p.sizes?.join(", ") || "-"}</TableCell> */}

                    {/* Actions */}
                    <TableCell className="flex justify-end gap-2">
                      {/* View */}
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => (window.location.href = `/product/${p._id}`)}
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

                      {/* Delete */}
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
  <DialogContent className="max-w-[1100px] w-full bg-white rounded-2xl shadow-2xl border border-gray-200 edit-modal">
    {/* Header */}
    <DialogHeader className="px-8 py-6 border-b bg-gray-50">
      <DialogTitle className="text-2xl font-semibold text-gray-900">
        Edit Product
      </DialogTitle>
    </DialogHeader>

    {/* Body */}
    <div className="px-10 py-8 overflow-y-auto max-h-[75vh]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* LEFT COLUMN */}
        <div className="space-y-10">
          {/* Basic Info */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Product Title
                </Label>
                <Input
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="Enter product title"
                  className="h-11 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Price (₹)
                </Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      price: Number(e.target.value),
                    })
                  }
                  placeholder="Enter price"
                  className="h-11 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe the product..."
                  className="min-h-[220px] bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </section>

          {/* Category */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Category
            </h3>
            <Select
              value={form.category?._id || ""}
              onValueChange={(v) =>
                setForm({
                  ...form,
                  category:
                    categories.find((c) => c._id === v) || null,
                })
              }
            >
              <SelectTrigger className="h-11 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-10">
          {/* Inventory */}
          <section className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
              Inventory per Size
            </h3>
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 bg-gray-50 text-sm font-semibold text-gray-700 py-3 px-5">
                <span>Size</span>
                <span className="md:col-span-3">Available Quantity</span>
              </div>

              {form.inventory &&
                Object.entries(form.inventory).map(([size, count], i) => (
                  <div
                    key={size}
                    className={`grid grid-cols-2 md:grid-cols-4 items-center px-5 py-3 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <span className="font-medium text-gray-800">
                      {size.toUpperCase()}
                    </span>
                    <div className="md:col-span-3 flex items-center gap-3">
                      <Input
                        type="number"
                        value={count}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            inventory: {
                              ...form.inventory,
                              [size]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-28 h-10 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="text-gray-500 text-xs">
                        units
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>

          {/* Status */}
     {/* Status Section */}
<section className="space-y-6">
  <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
    Product Status
  </h3>

  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
    {[
      { key: "published", label: "Published" },
      { key: "onSale", label: "On Sale" },
      { key: "isNewProduct", label: "New" },
    ].map(({ key, label }) => (
      <div
        key={key}
        className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
      >
        <Label className="font-medium text-gray-800">{label}</Label>
        <button
          onClick={() => setForm({ ...form, [key]: !form[key] })}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
            form[key] ? "bg-blue-700" : "bg-gray-300"
          }`}
        >
          <span
            className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-300 ${
              form[key] ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    ))}
  </div>
</section>

        </div>
      </div>
    </div>

    {/* Footer */}
    <DialogFooter className="border-t bg-gray-50 px-8 py-6 flex justify-end gap-4">
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
        className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        Cancel
      </Button>
      <Button
        className="bg-blue-700 text-white hover:bg-blue-800 px-6 py-2 rounded-lg"
        onClick={saveProduct}
      >
        Save Changes
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
