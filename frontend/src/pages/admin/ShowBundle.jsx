import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2 } from "lucide-react"
import { api } from "@/utils/config"
import { Link } from "react-router-dom"

export default function ShowBundle() {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [editBundle, setEditBundle] = useState(null)
  const [allProducts, setAllProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [images, setImages] = useState([])

  const fetchBundles = async () => {
    try {
      const res = await api.get("/bundles")
      console.log(res.data, 'fetched bundles')
      setBundles(res.data.items || [])
    } catch (err) {
      console.error("Error fetching bundles:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products")
      setAllProducts(res.data.items || [])
    } catch (err) {
      console.error("Error fetching products:", err)
    }
  }

  useEffect(() => {
    fetchBundles()
    fetchProducts()
  }, [])

  const deleteBundle = async (id) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return
    try {
      await api.delete(`/bundles/${id}`)
      setBundles(bundles.filter((b) => b._id !== id))
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  const handleProductToggle = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    )
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setImages([...images, ...newImages])
  }

  const handleSave = async () => {
    try {
      const imageUrls = []

      for (const img of images) {
        if (img.file) {
          const formData = new FormData()
          formData.append("file", img.file)
          const res = await api.post("/admin/upload/image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          })
          imageUrls.push(res.data.url)
        } else {
          imageUrls.push(img.preview)
        }
      }

      await api.put(`/bundles/${editBundle._id}`, {
        title: editBundle.title,
        description: editBundle.description,
        products: selectedProducts,
        mainImages: imageUrls,
        price: editBundle.price, // or computedPrice
      })

      setEditBundle(null)
      fetchBundles()
    } catch (err) {
      console.error("Failed to update bundle:", err)
    }
  }


  if (loading)
    return <p className="text-center text-gray-500 mt-10">Loading bundles...</p>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product Bundles</h1>
        <Button asChild className="bg-black text-white">
          <Link to="/admin/new/bundles">+ Create Bundle</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bundles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.length > 0 ? (
                bundles.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell>
                      {b.mainImages?.[0] ? (
                        <img
                          src={b.mainImages[0]}
                          alt={b.title}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-md" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{b.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {b.products?.map((p) => (
                          <div
                            key={p._id}
                            className="w-16 text-center border rounded-md p-1"
                          >
                            <img
                              src={p.images?.[0]}
                              alt={p.title}
                              className="w-full h-12 object-cover rounded-md"
                            />
                            <p className="text-[10px] mt-1">{p.title}</p>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>₹{b.price}</TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditBundle(b)
                          setSelectedProducts(b.products.map((p) => p._id))
                          setImages(
                            b.mainImages?.map((url) => ({ preview: url })) || []
                          )
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBundle(b._id)}
                        className="border-red-300"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No bundles created yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ====== Edit Modal ====== */}
      <Dialog open={!!editBundle} onOpenChange={() => setEditBundle(null)}>
        <DialogContent className="max-w-5xl p-6 max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight text-gray-900">
              ✏️ Edit Bundle
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Update bundle details, images, and included products.
            </p>
          </DialogHeader>

          {editBundle && (
            <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-2">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Bundle Title
                  </label>
                  <Input
                    value={editBundle.title}
                    onChange={(e) =>
                      setEditBundle({ ...editBundle, title: e.target.value })
                    }
                    placeholder="Enter bundle title"
                    className="mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Bundle Price (₹)
                  </label>
                  <Input
                    type="number"
                    value={editBundle.price}
                    onChange={(e) =>
                      setEditBundle({ ...editBundle, price: e.target.value })
                    }
                    placeholder="Enter price"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>
                <Textarea
                  value={editBundle.description}
                  onChange={(e) =>
                    setEditBundle({
                      ...editBundle,
                      description: e.target.value,
                    })
                  }
                  placeholder="Write a short bundle description..."
                  className="mt-2 min-h-[100px]"
                />
              </div>

              {/* Images Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700">
                  Bundle Images
                </label>
                <div className="mt-2 flex items-center justify-between">
                  <input
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800"
                  />
                </div>

                <div className="flex flex-wrap gap-3 mt-4">
                  {images.length > 0 ? (
                    images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={img.preview}
                          alt="preview"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <button
                          className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
                          onClick={() =>
                            setImages(images.filter((_, idx) => idx !== i))
                          }
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400">No images uploaded yet</p>
                  )}
                </div>
              </div>

              {/* Products Section */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700">
                  Included Products
                </label>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-1">
                  {allProducts
                    .slice() // create a copy so we don't mutate the original
                    .sort((a, b) => {
                      const aSelected = selectedProducts.includes(a._id)
                      const bSelected = selectedProducts.includes(b._id)
                      // if a is selected and b is not, a goes first
                      if (aSelected && !bSelected) return -1
                      if (!aSelected && bSelected) return 1
                      return 0
                    })
                    .map((product) => {
                      const isSelected = selectedProducts.includes(product._id)
                      return (
                        <div
                          key={product._id}
                          onClick={() => handleProductToggle(product._id)}
                          className={`relative border rounded-lg cursor-pointer transition-all hover:shadow-md ${isSelected
                              ? "border-black bg-gray-50 ring-1 ring-black/20"
                              : "border-gray-200"
                            }`}
                        >
                          <img
                            src={product.images?.[0]}
                            alt={product.title}
                            className="w-full h-28 object-cover rounded-t-lg"
                          />
                          <div className="p-2">
                            <p className="text-sm font-medium truncate">{product.title}</p>
                            <p className="text-xs text-gray-500">₹{product.price}</p>
                          </div>

                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded-full">
                              ✓
                            </div>
                          )}
                        </div>
                      )
                    })}

                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 flex justify-end gap-3 border-t pt-4">
            <Button variant="outline" onClick={() => setEditBundle(null)}>
              Cancel
            </Button>
            <Button
              className="bg-black text-white hover:bg-gray-900"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
