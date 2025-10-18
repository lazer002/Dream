import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../state/AuthContext.jsx";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch.jsx";

export default function AddProduct() {
  const [categories, setCategories] = useState([]);
  const fileInputRef = useRef(null);
  const { api } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    published: true,
    isNewProduct: true,
    onSale: true,
    inventory: {
      XS: 0,
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
    },
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      let uploadedUrls = [];
      if (files.length) {
        const urls = [];
        for (const f of files) {
          const fd = new FormData();
          fd.append("file", f);
          const { data } = await api.post("/admin/upload/image", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          urls.push(data.url);
        }
        uploadedUrls = urls;
      }
 
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        images: uploadedUrls,
       category: form.category,
        inventory: form.inventory,
        published: Boolean(form.published),
        isNewProduct: Boolean(form.isNewProduct),
        onSale: Boolean(form.onSale),
      };
      await api.post("/products", payload);

      setMsg("✅ Product created successfully");
      setForm({
        title: "",
        description: "",
        price: "",
        category: "",
        published: true,
        isNewProduct: true,
        onSale: true,
        inventory: {
          XS: 0,
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          XXL: 0,
        },
      });
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      console.error(e);
      setMsg("❌ Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get("/admin/getCategory");
        if (data.success) setCategories(data.categories);
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!files.length) {
      setPreviews([]);
      return;
    }
    const newPreviews = files.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setPreviews(newPreviews);
    return () => newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [files]);

  return (

  <Card className="border-none edit-modal">
    <CardContent className="px-8 py-6 space-y-8">
      {msg && (
        <div
          className={`text-sm px-4 py-3 rounded-md border ${
            msg.startsWith("✅")
              ? "bg-green-50 text-green-700 border-green-300"
              : "bg-red-50 text-red-700 border-red-300"
          }`}
        >
          {msg}
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {/* === Basic Info Section === */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Enter product title"
                className="!border-gray-300 bg-white"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select
       
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="!border-gray-300 bg-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Write a short description..."
                className="!border-gray-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* === Media Upload Section === */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Product Images</h3>
          <div>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="!border-gray-300 bg-white"
            />
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {previews.map((p, i) => (
                  <div
                    key={i}
                    className="relative group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={p.url}
                      alt={`preview-${i}`}
                      className="aspect-square object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* === Pricing & Inventory Section === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Pricing</h3>
            <Label>Price</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
              placeholder="0.00"
              className="!border-gray-300 bg-white"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Inventory</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(form.inventory).map((size) => (
                <div key={size}>
                  <Label className="text-xs text-gray-600">{size}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.inventory[size]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        inventory: {
                          ...form.inventory,
                          [size]: e.target.value,
                        },
                      })
                    }
                    className="!border-gray-300 bg-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === Visibility Section === */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Visibility Settings</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center justify-between border p-3 rounded-lg hover:bg-gray-50 transition">
              <Label htmlFor="published">Published</Label>
              <Switch
                id="published"
                checked={form.published}
                onCheckedChange={(v) => setForm({ ...form, published: v })}
              />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-lg hover:bg-gray-50 transition">
              <Label htmlFor="isNew">New Product</Label>
              <Switch
                id="isNew"
                checked={form.isNewProduct || false}
                onCheckedChange={(v) =>
                  setForm({ ...form, isNewProduct: v })
                }
              />
            </div>
            <div className="flex items-center justify-between border p-3 rounded-lg hover:bg-gray-50 transition">
              <Label htmlFor="onSale">On Sale</Label>
              <Switch
                id="onSale"
                checked={form.onSale || false}
                onCheckedChange={(v) =>
                  setForm({ ...form, onSale: v })
                }
              />
            </div>
          </div>
        </div>

        <CardFooter className="border-t pt-6 flex justify-end">
          <Button type="submit" disabled={saving} className="px-6 text-base">
            {saving ? "Saving..." : "Create Product"}
          </Button>
        </CardFooter>
      </form>
    </CardContent>
  </Card>


  );
}
