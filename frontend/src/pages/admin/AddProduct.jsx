import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  ImagePlus,
  X,
  Plus,
  Package,
  Settings2,
  Tag,
  Eye,
  Loader2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Code,
} from "lucide-react";
import api from "@/utils/config";

const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"];

const INITIAL_FORM = {
  title: "",
  description: "",
  price: "",
  oldPrice: "",
  category: "",
  tags: "",
  active: true,
  published: true,
  isNewProduct: true,
  onSale: false,
  featured: false,
  sizes: [],
};

export default function AddProduct() {
  const fileInputRef = useRef(null);
  const descriptionRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [descriptionMode, setDescriptionMode] = useState("html");

  const updateForm = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleSize = (size) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const removeImage = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFiles = (event) => {
    const selected = Array.from(event.target.files || []);

    setFiles((prev) => [...prev, ...selected]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const insertHtml = (before, after = "") => {
    const textarea = descriptionRef.current;

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selected = form.description.slice(start, end);

    const value =
      form.description.slice(0, start) +
      before +
      selected +
      after +
      form.description.slice(end);

    updateForm("description", value);

    requestAnimationFrame(() => {
      textarea.focus();

      const cursorPosition =
        start + before.length + selected.length + after.length;

      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL");

    if (!url) return;

    insertHtml(`<a href="${url}">`, "</a>");
  };

  const insertCode = () => {
    insertHtml("<code>", "</code>");
  };

async function submit(e) {
  e.preventDefault();

  if (!form.title.trim()) {
    setMsg("❌ Product title is required");
    return;
  }

  if (!form.category) {
    setMsg("❌ Please select a category");
    return;
  }

  if (!form.price || Number(form.price) < 0) {
    setMsg("❌ Enter a valid price");
    return;
  }

  if (!form.sizes.length) {
    setMsg("❌ Select at least one size");
    return;
  }

  setSaving(true);
  setMsg("");

  try {
    let uploadedUrls = [];

    if (files.length) {
      const fd = new FormData();

      files.forEach((file) => {
        fd.append("files", file);
      });

      const { data } = await api.post(
        "/admin/upload/images",
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000,
        }
      );

      uploadedUrls = data.images.map((image) => image.url);
    }

// Product creation payload

const payload = {
  title: form.title.trim(),
  description: form.description,

  price: Number(form.price),

  oldPrice:
    form.oldPrice !== ""
      ? Number(form.oldPrice)
      : undefined,

  images: uploadedUrls,

  category: form.category, 

  sizes: form.sizes.map((size) => ({
    name: size,
    active: true,
  })),

  tags: form.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),

  active: Boolean(form.active),
  published: Boolean(form.published),
  isNewProduct: Boolean(form.isNewProduct),
  onSale: Boolean(form.onSale),
  featured: Boolean(form.featured),
};
    const { data } = await api.post(
      "/products",
      payload
    );

    if (!data?.success && data?.success !== undefined) {
      throw new Error(
        data?.message || "Failed to create product"
      );
    }

    setMsg("✅ Product created successfully");

    setForm(INITIAL_FORM);
    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  } catch (error) {
    console.error("create product:", error);

    setMsg(
      `❌ ${
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create product"
      }`
    );
  } finally {
    setSaving(false);
  }
}

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get("/admin/getCategory");

        if (data.success) {
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error("fetch categories:", error);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((preview) =>
        URL.revokeObjectURL(preview.url)
      );
    };
  }, [files]);

  return (
    <div className="max-w-auto mx-auto pb-10">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <CardTitle className="text-xl">
                Add Product
              </CardTitle>

              <CardDescription>
                Create a new product for your store
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8"  data-lenis-prevent>
    

          <form onSubmit={submit} className="space-y-8">
            {/* BASIC INFO */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <Settings2 className="h-5 w-5 text-gray-600" />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Basic Information
                  </h3>

                  <p className="text-sm text-gray-500">
                    Product name, description and category
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 border-b border-black ">
                  <Label>Product Title</Label>

<Input
  value={form.title}
  onChange={(e) => updateForm("title", e.target.value)}
  placeholder="e.g. Premium Oversized T-Shirt"
  maxLength={200}
  required
  className="border-b border-black"
/>
                </div>

        <div className="space-y-2">
  <Label>Category</Label>

  <Select
    value={form.category}
    onValueChange={(value) =>
      updateForm("category", value)
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select category" />
    </SelectTrigger>

    <SelectContent>
      {categories.map((category) => (
        <SelectItem
          key={category._id}
          value={category.slug}
        >
          {category.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

                {/* DESCRIPTION */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Description</Label>

                    <div className="flex rounded-lg border bg-gray-50 p-1">
                      <button
                        type="button"
                        onClick={() => setDescriptionMode("html")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                          descriptionMode === "html"
                            ? "bg-black text-white"
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        HTML
                      </button>

                      <button
                        type="button"
                        onClick={() => setDescriptionMode("normal")}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                          descriptionMode === "normal"
                            ? "bg-black text-white"
                            : "text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        Normal
                      </button>
                    </div>
                  </div>

                  {descriptionMode === "html" ? (
                    <div className="overflow-hidden rounded-xl border bg-white">
                      <div className="flex flex-wrap items-center gap-1 border-b bg-gray-50 p-2">
                        <button
                          type="button"
                          title="Bold"
                          onClick={() =>
                            insertHtml("<strong>", "</strong>")
                          }
                          className="rounded-md p-2 hover:bg-gray-200"
                        >
                          <Bold className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Italic"
                          onClick={() =>
                            insertHtml("<em>", "</em>")
                          }
                          className="rounded-md p-2 hover:bg-gray-200"
                        >
                          <Italic className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Bullet list"
                          onClick={() =>
                            insertHtml("<ul>\n  <li>", "</li>\n</ul>")
                          }
                          className="rounded-md p-2 hover:bg-gray-200"
                        >
                          <List className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Numbered list"
                          onClick={() =>
                            insertHtml("<ol>\n  <li>", "</li>\n</ol>")
                          }
                          className="rounded-md p-2 hover:bg-gray-200"
                        >
                          <ListOrdered className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Link"
                          onClick={insertLink}
                          className="rounded-md p-2 hover:bg-gray-200"
                        >
                          <Link className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Code"
                          onClick={insertCode}
                          className="rounded-md p-2 hover:bg-gray-200"
                        >
                          <Code className="h-4 w-4" />
                        </button>
                      </div>

                      <Textarea
                        ref={descriptionRef}
                        rows={10}
                        value={form.description}
                        onChange={(e) =>
                          updateForm(
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="<p>Write your product description...</p>"
                        className="min-h-[240px] resize-y rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0"
                      />

                      <div className="border-t bg-gray-50 px-3 py-2 text-xs text-gray-500">
                        HTML mode accepts HTML such as
                        {" "}
                        <code>&lt;p&gt;</code>,
                        {" "}
                        <code>&lt;strong&gt;</code>,
                        {" "}
                        <code>&lt;ul&gt;</code>,
                        {" "}
                        <code>&lt;li&gt;</code>.
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      rows={10}
                      value={form.description}
                      onChange={(e) =>
                        updateForm(
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Write your product description normally..."
                      className="min-h-[240px] resize-y"
                    />
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Tags</Label>

                  <Input
                    value={form.tags}
                    onChange={(e) =>
                      updateForm("tags", e.target.value)
                    }
                    placeholder="t-shirt, oversized, cotton, summer"
                  />

                  <p className="text-xs text-gray-500">
                    Separate tags with commas
                  </p>
                </div>
              </div>
            </section>

            {/* IMAGES */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <ImagePlus className="h-5 w-5 text-gray-600" />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Product Images
                  </h3>

                  <p className="text-sm text-gray-500">
                    Upload product photos
                  </p>
                </div>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center transition hover:border-gray-500 hover:bg-gray-100"
              >
                <ImagePlus className="mb-2 h-8 w-8 text-gray-400" />

                <p className="font-medium text-gray-700">
                  Click to upload images
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, WEBP
                </p>

                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFiles}
                  className="hidden"
                />
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {previews.map((preview, index) => (
                    <div
                      key={`${preview.file.name}-${index}`}
                      className="group relative overflow-hidden rounded-xl border bg-white"
                    >
                      <img
                        src={preview.url}
                        alt={`Product ${index + 1}`}
                        className="aspect-square w-full object-cover"
                      />

                      {index === 0 && (
                        <span className="absolute left-2 top-2 rounded-md bg-black px-2 py-1 text-xs font-medium text-white">
                          Main
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-gray-700 shadow opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* PRICING */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <Tag className="h-5 w-5 text-gray-600" />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Pricing
                  </h3>

                  <p className="text-sm text-gray-500">
                    Set your selling and comparison prices
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Selling Price</Label>

                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) =>
                      updateForm("price", e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Old Price</Label>

                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.oldPrice}
                    onChange={(e) =>
                      updateForm("oldPrice", e.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-end">
                  <div className="w-full rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
                    {form.oldPrice &&
                    Number(form.oldPrice) > Number(form.price)
                      ? `${Math.round(
                          ((Number(form.oldPrice) -
                            Number(form.price)) /
                            Number(form.oldPrice)) *
                            100
                        )}% discount`
                      : "No discount"}
                  </div>
                </div>
              </div>
            </section>

            {/* SIZES */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <Package className="h-5 w-5 text-gray-600" />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Available Sizes
                  </h3>

                  <p className="text-sm text-gray-500">
                    Select the sizes available for this product
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {SIZE_OPTIONS.map((size) => {
                  const selected = form.sizes.includes(size);

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                        selected
                          ? "border-black bg-black text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* VISIBILITY */}
            <section className="space-y-5">
              <div className="flex items-center gap-2 border-b pb-3">
                <Eye className="h-5 w-5 text-gray-600" />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Product Settings
                  </h3>

                  <p className="text-sm text-gray-500">
                    Control product visibility and merchandising
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  {
                    id: "active",
                    label: "Active",
                    description: "Product is available",
                  },
                  {
                    id: "published",
                    label: "Published",
                    description: "Visible in storefront",
                  },
                  {
                    id: "isNewProduct",
                    label: "New Product",
                    description: "Show as new",
                  },
                  {
                    id: "featured",
                    label: "Featured",
                    description: "Show in featured",
                  },
                      {
                    id: "onSale",
                    label: "On Sale",
                    description: " Mark this product as discounted",
                  },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border bg-white p-4"
                  >
                    <div>
                      <Label htmlFor={item.id}>
                        {item.label}
                      </Label>

                      <p className="mt-1 text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>

                    <Switch
                      id={item.id}
                      checked={Boolean(form[item.id])}
                      onCheckedChange={(value) =>
                        updateForm(item.id, value)
                      }
                    />
                  </div>
                ))}
              </div>

         
            </section>

            <CardFooter className="border-t px-0 pt-6">
      
              <div className="flex w-full items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(INITIAL_FORM);
                    setFiles([]);
                    setMsg("");
                  }}
                  disabled={saving}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-40"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Product
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
                          {msg && (
            <div
              className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
                msg.startsWith("✅")
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {msg}
            </div>
          )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}