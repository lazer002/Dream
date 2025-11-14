// src/pages/admin/AdminBundles.jsx
import { useState, useEffect } from "react";
import api  from "@/utils/config.jsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function Bundle() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products", { params: { limit: 100 } });
        setAllProducts(res.data.items || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

  const toggleProductSelection = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages([...images, ...newImages]);
  };

  const calculateTotalPrice = () => {
    return selectedProducts
      .map((id) => allProducts.find((p) => p._id === id)?.price || 0)
      .reduce((a, b) => a + b, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || selectedProducts.length === 0)
      return alert("Add title and select products.");

    try {
      setLoading(true);

      // Upload images first
      const imageUrls = [];
      for (const img of images) {
        if (img.file) {
          const formData = new FormData();
          formData.append("file", img.file);
          const res = await api.post("/admin/upload/image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          imageUrls.push(res.data.url);
        } else {
          imageUrls.push(img.preview);
        }
      }

      const finalPrice = price ? Number(price) : calculateTotalPrice();

      await api.post("/bundles", {
        title,
        description,
        products: selectedProducts,
        price: finalPrice,
        images: imageUrls,
      });

      toast.success("Bundle created!");
      setTitle("");
      setDescription("");
      setPrice("");
      setSelectedProducts([]);
      setImages([]);
    } catch (err) {
      console.error(err);
      toast.error("Error creating bundle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-10 text-black">Admin: Bundles</h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-2xl shadow-lg"
      >
        {/* Bundle Title */}
        <div>
          <label className="font-semibold text-black mb-2 block">Bundle Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter bundle title"
            className="bg-gray-50 border-black"
          />
        </div>

        {/* Description */}
        <div>
          <label className="font-semibold text-black mb-2 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description"
            className="w-full border border-black rounded-md px-4 py-2 bg-gray-50 text-black"
          />
        </div>

        {/* Price */}
        <div>
          <label className="font-semibold text-black mb-2 block">
            Bundle Price (leave empty for auto-calculation)
          </label>
          <Input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Auto-calculated if left empty"
            className="bg-gray-50 border-black"
          />
        </div>

        {/* Images Upload */}
        <div>
          <label className="font-semibold text-black mb-2 block">Main Images</label>
          <input
            type="file"
            multiple
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-black file:text-white hover:file:bg-gray-800"
          />
          <div className="flex flex-wrap gap-3 mt-4">
            {images.length > 0 &&
              images.map((img, i) => (
                <div key={i} className="relative group">
                  <img
                    src={img.preview}
                    alt="preview"
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
                    onClick={() =>
                      setImages(images.filter((_, idx) => idx !== i))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Products Selection */}
        <div>
          <label className="font-semibold text-black mb-2 block">Select Products</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {allProducts.map((p) => (
              <div
                key={p._id}
                onClick={() => toggleProductSelection(p._id)}
                className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center transition ${
                  selectedProducts.includes(p._id)
                    ? "border-black bg-gray-100"
                    : "border-gray-200 hover:border-black"
                }`}
              >
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="w-24 h-24 object-cover rounded-md mb-2"
                />
                <p className="text-sm font-semibold text-black text-center truncate">{p.title}</p>
                <p className="text-xs text-gray-500">₹{p.price}</p>
                {selectedProducts.includes(p._id) && (
                  <span className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded-full">
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-black text-white font-bold hover:bg-white hover:text-black border border-black"
          disabled={loading}
        >
          {loading ? "Saving..." : "Create Bundle"}
        </Button>
      </form>
    </div>
  );
}
