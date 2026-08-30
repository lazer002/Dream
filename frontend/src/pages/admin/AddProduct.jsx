// src/pages/admin/AddProduct.jsx

import { useState, useRef, useEffect } from "react";
import {
  Package,
  ImagePlus,
  X,
  Plus,
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

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch.jsx";
import api from "@/utils/config";
import toast from "react-hot-toast";

const SIZE_OPTIONS = {
  apparel: ["XS", "S", "M", "L", "XL", "XXL"],
  pants: ["28", "30", "32", "34", "36", "38", "40", "42"],
};

const getSizeOptions = (categoryId, categories) => {
  const category = categories.find(
    (item) => String(item._id) === String(categoryId)
  );

  const value = String(category?.name || "").toLowerCase();

  if (
    value.includes("pant") ||
    value.includes("trouser") ||
    value.includes("jean") ||
    value.includes("bottom")
  ) {
    return SIZE_OPTIONS.pants;
  }

  return SIZE_OPTIONS.apparel;
};

const INITIAL_FORM = {
  title: "",
  description: "",
  details: "",
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
const detailsRef = useRef(null);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [descriptionMode, setDescriptionMode] =
    useState("html");
const [detailsMode, setDetailsMode] =
  useState("html");

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
    setFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleFiles = (event) => {
    const selected = Array.from(
      event.target.files || []
    );

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

    const selected = form.description.slice(
      start,
      end
    );

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
        start +
        before.length +
        selected.length +
        after.length;

      textarea.setSelectionRange(
        cursorPosition,
        cursorPosition
      );
    });
  };
const insertDetailsHtml = (before, after) => {
  const textarea = detailsRef.current;

  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const selected =
    form.details.slice(start, end);

  const value =
    form.details.slice(0, start) +
    before +
    selected +
    after +
    form.details.slice(end);

  updateForm("details", value);

  requestAnimationFrame(() => {
    textarea.focus();

    const cursor =
      start +
      before.length +
      selected.length +
      after.length;

    textarea.setSelectionRange(
      cursor,
      cursor
    );
  });
};
  const insertLink = () => {
    const url = window.prompt("Enter URL");

    if (!url) return;

    insertHtml(`<a href="${url}">`, "</a>");
  };
const insertDetailsLink = () => {
  const url = window.prompt(
    "Enter URL"
  );

  if (!url) return;

  insertDetailsHtml(
    `<a href="${url}" target="_blank" rel="noopener noreferrer">`,
    "</a>"
  );
};
  const insertCode = () => {
    insertHtml("<code>", "</code>");
  };

async function submit(e) {
  e?.preventDefault();

  if (!form.title.trim()) {
    toast.error("Product title is required");
    return;
  }

  if (!form.category) {
    toast.error("Please select a category");
    return;
  }

  if (!form.price || Number(form.price) < 0) {
    toast.error("Enter a valid price");
    return;
  }

  if (!form.sizes.length) {
    toast.error("Select at least one size");
    return;
  }

  setSaving(true);

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

      uploadedUrls =
        data.images?.map((image) => image.url) || [];
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      details: form.details?.trim() || "",

      price: Number(form.price),

      oldPrice:
        form.oldPrice !== ""
          ? Number(form.oldPrice)
          : undefined,

      images: uploadedUrls,

      // MongoDB category ObjectId
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

    if (
      !data?.success &&
      data?.success !== undefined
    ) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Failed to create product"
      );
    }

    toast.success("Product created successfully");

    setForm(INITIAL_FORM);
    setFiles([]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  } catch (error) {
    console.error("create product:", error);

    toast.error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to create product"
    );
  } finally {
    setSaving(false);
  }
}

  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data } = await api.get(
          "/admin/getCategory"
        );

        if (data.success) {
          setCategories(
            data.categories || []
          );
        }
      } catch (error) {
        console.error(
          "fetch categories:",
          error
        );
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

const sizeOptions = getSizeOptions(
  form.category,
  categories
)

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add Product
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create and publish a new product
          </p>
        </div>

        <Button
          type="button"
          onClick={submit}
          disabled={saving}
          className="hidden sm:flex"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}

          {saving
            ? "Creating..."
            : "Create Product"}
        </Button>
      </div>



      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* LEFT */}
        <div className="space-y-5">
          {/* BASIC */}
          <section className="rounded-xl border bg-white">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Basic Information
                  </h2>

                  <p className="text-xs text-gray-500">
                    Product name, category and description
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 border-b">
                  <Label className="font-bold">
                    Product Title
                  </Label>

                  <Input
                    value={form.title}
                    onChange={(e) =>
                      updateForm(
                        "title",
                        e.target.value
                      )
                    }
                    placeholder="Premium Oversized T-Shirt"
                    maxLength={200}
                  />
                </div>

                <div className="space-y-2">
                   <Label className="font-bold">
                    Category
                  </Label>

               <Select
  value={form.category}
  onValueChange={(value) => {
    updateForm("category", value);

    setForm((prev) => ({
      ...prev,
      category: value,
      sizes: [],
    }));
  }}
>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      {categories.map(
                        (category) => (
                          <SelectItem
                            key={category._id}
                            value={category._id}
                          >
                            {category.name}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* DESCRIPTION */}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                     <Label className="font-bold">
                      Description
                    </Label>

                    <div className="flex rounded-md border bg-gray-50 p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setDescriptionMode(
                            "html"
                          )
                        }
                        className={`rounded px-2.5 py-1 text-xs font-medium ${
                          descriptionMode ===
                          "html"
                            ? "bg-black text-white"
                            : "text-gray-600"
                        }`}
                      >
                        HTML
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDescriptionMode(
                            "normal"
                          )
                        }
                        className={`rounded px-2.5 py-1 text-xs font-medium ${
                          descriptionMode ===
                          "normal"
                            ? "bg-black text-white"
                            : "text-gray-600"
                        }`}
                      >
                        Normal
                      </button>
                    </div>
                  </div>

                  {descriptionMode ===
                  "html" ? (
                    <div className="overflow-hidden rounded-lg border">
                      <div className="flex items-center gap-1 border-b bg-gray-50 p-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            insertHtml(
                              "<strong>",
                              "</strong>"
                            )
                          }
                          className="rounded p-1.5 hover:bg-gray-200"
                        >
                          <Bold className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertHtml(
                              "<em>",
                              "</em>"
                            )
                          }
                          className="rounded p-1.5 hover:bg-gray-200"
                        >
                          <Italic className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertHtml(
                              "<ul>\n  <li>",
                              "</li>\n</ul>"
                            )
                          }
                          className="rounded p-1.5 hover:bg-gray-200"
                        >
                          <List className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            insertHtml(
                              "<ol>\n  <li>",
                              "</li>\n</ol>"
                            )
                          }
                          className="rounded p-1.5 hover:bg-gray-200"
                        >
                          <ListOrdered className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={insertLink}
                          className="rounded p-1.5 hover:bg-gray-200"
                        >
                          <Link className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={insertCode}
                          className="rounded p-1.5 hover:bg-gray-200"
                        >
                          <Code className="h-4 w-4" />
                        </button>
                      </div>

                      <Textarea
                        ref={descriptionRef}
                        rows={6}
                        value={form.description}
                        onChange={(e) =>
                          updateForm(
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="<p>Write your product description...</p>"
                        className="h-36 min-h-0 resize-y rounded-none border-0 font-mono text-sm shadow-none focus-visible:ring-0"
                      />

                      <div className="border-t bg-gray-50 px-3 py-1.5 text-[11px] text-gray-500">
                        HTML supported
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      rows={6}
                      value={form.description}
                      onChange={(e) =>
                        updateForm(
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Write your product description..."
                      className="h-36 min-h-0 resize-y"
                    />
                  )}
                </div>

{/* DETAILS */}
<div className="space-y-2 md:col-span-2">
  <div className="flex items-center justify-between">
     <Label className="font-bold">Product Details</Label>

    <div className="flex rounded-md border bg-gray-50 p-0.5">
      <button
        type="button"
        onClick={() =>
          setDetailsMode("html")
        }
        className={`rounded px-2.5 py-1 text-xs font-medium ${
          detailsMode === "html"
            ? "bg-black text-white"
            : "text-gray-600"
        }`}
      >
        HTML
      </button>

      <button
        type="button"
        onClick={() =>
          setDetailsMode("normal")
        }
        className={`rounded px-2.5 py-1 text-xs font-medium ${
          detailsMode === "normal"
            ? "bg-black text-white"
            : "text-gray-600"
        }`}
      >
        Normal
      </button>
    </div>
  </div>

  {detailsMode === "html" ? (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-gray-50 p-1.5">
        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<strong>",
              "</strong>"
            )
          }
          className="rounded p-1.5 hover:bg-gray-200"
        >
          <Bold className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<em>",
              "</em>"
            )
          }
          className="rounded p-1.5 hover:bg-gray-200"
        >
          <Italic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<h2>",
              "</h2>"
            )
          }
          className="rounded px-2 py-1 text-xs font-bold hover:bg-gray-200"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<h3>",
              "</h3>"
            )
          }
          className="rounded px-2 py-1 text-xs font-bold hover:bg-gray-200"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<ul>\n  <li>",
              "</li>\n</ul>"
            )
          }
          className="rounded p-1.5 hover:bg-gray-200"
        >
          <List className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<ol>\n  <li>",
              "</li>\n</ol>"
            )
          }
          className="rounded p-1.5 hover:bg-gray-200"
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<p>",
              "</p>"
            )
          }
          className="rounded px-2 py-1 text-xs font-medium hover:bg-gray-200"
        >
          P
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<blockquote>",
              "</blockquote>"
            )
          }
          className="rounded px-2 py-1 text-xs hover:bg-gray-200"
        >
          Quote
        </button>

        <button
          type="button"
          onClick={insertDetailsLink}
          className="rounded p-1.5 hover:bg-gray-200"
        >
          <Link className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            insertDetailsHtml(
              "<hr />",
              ""
            )
          }
          className="rounded px-2 py-1 text-xs hover:bg-gray-200"
        >
          HR
        </button>
      </div>

      <Textarea
        ref={detailsRef}
        rows={8}
        value={form.details}
        onChange={(e) =>
          updateForm(
            "details",
            e.target.value
          )
        }
        placeholder="<p>Product details...</p>"
        className="
          min-h-[180px]
          resize-y
          rounded-none
          border-0
          font-mono
          text-sm
          shadow-none
          focus-visible:ring-0
        "
      />

      <div className="border-t bg-gray-50 px-3 py-1.5 text-[11px] text-gray-500">
        HTML supported
      </div>
    </div>
  ) : (
    <Textarea
      rows={8}
      value={form.details}
      onChange={(e) =>
        updateForm(
          "details",
          e.target.value
        )
      }
      placeholder="Write product details..."
      className="min-h-[180px] resize-y"
    />
  )}
</div>

                <div className="space-y-2 md:col-span-2">
                   <Label className="font-bold">
                    Tags
                  </Label>

                  <Input
                    value={form.tags}
                    onChange={(e) =>
                      updateForm(
                        "tags",
                        e.target.value
                      )
                    }
                    placeholder="t-shirt, oversized, cotton"
                  />

                  <p className="text-xs text-gray-500">
                    Separate tags with commas
                  </p>
                </div>


              </div>
            </div>
          </section>

          {/* IMAGES */}
          <section className="rounded-xl border bg-white">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Product Images
                  </h2>

                  <p className="text-xs text-gray-500">
                    Upload product photos
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center hover:bg-gray-100"
              >
                <ImagePlus className="mb-2 h-7 w-7 text-gray-400" />

                <p className="text-sm font-medium text-gray-700">
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
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                  {previews.map(
                    (preview, index) => (
                      <div
                        key={`${preview.file.name}-${index}`}
                        className="group relative overflow-hidden rounded-lg border bg-white"
                      >
                        <img
                          src={preview.url}
                          alt={`Product ${
                            index + 1
                          }`}
                          className="aspect-square w-full object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded bg-black px-2 py-1 text-[10px] text-white">
                            Main
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            removeImage(index)
                          }
                          className="absolute right-2 top-2 rounded-full bg-white p-1.5 shadow opacity-0 transition group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </section>

          {/* PRICING */}
          <section className="rounded-xl border bg-white">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Pricing
                  </h2>

                  <p className="text-xs text-gray-500">
                    Selling and comparison prices
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
              <div className="space-y-2 border-b">
                 <Label className="font-bold">
                  Selling Price
                </Label>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    updateForm(
                      "price",
                      e.target.value
                    )
                  }
                  placeholder="enter price"
                />
              </div>

              <div className="space-y-2">
                 <Label className="font-bold border-b">
                  Old Price
                </Label>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.oldPrice}
                  onChange={(e) =>
                    updateForm(
                      "oldPrice",
                      e.target.value
                    )
                  }
                  placeholder="enter price"
                />
              </div>

              <div className="flex items-end">
                <div className="w-full rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
                  {form.oldPrice &&
                  Number(form.oldPrice) >
                    Number(form.price)
                    ? `${Math.round(
                        ((Number(
                          form.oldPrice
                        ) -
                          Number(
                            form.price
                          )) /
                          Number(
                            form.oldPrice
                          )) *
                          100
                      )}% discount`
                    : "No discount"}
                </div>
              </div>
            </div>
          </section>

          {/* SIZES */}
          <section className="rounded-xl border bg-white">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Available Sizes
                  </h2>

                  <p className="text-xs text-gray-500">
                    Sizes change automatically based on category
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-5 sm:grid-cols-4 md:grid-cols-6">
              {sizeOptions.map((size) => {
                const selected =
                  form.sizes.includes(size);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() =>
                      toggleSize(size)
                    }
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
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
        </div>

        {/* RIGHT */}
        <div className="h-fit space-y-5 xl:sticky xl:top-5">
          {/* SETTINGS */}
          <section className="rounded-xl border bg-white">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />

                <div>
                  <h2 className="font-semibold">
                    Product Settings
                  </h2>

                  <p className="text-xs text-gray-500">
                    Visibility and merchandising
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5">
              {[
                {
                  id: "active",
                  label: "Active",
                  description:
                    "Product is available",
                },
                {
                  id: "published",
                  label: "Published",
                  description:
                    "Visible in storefront",
                },
                {
                  id: "isNewProduct",
                  label: "New Product",
                  description:
                    "Show as new",
                },
                {
                  id: "featured",
                  label: "Featured",
                  description:
                    "Show in featured",
                },
                {
                  id: "onSale",
                  label: "On Sale",
                  description:
                    "Mark as discounted",
                },
              ].map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                     <Label className="font-bold">
                      {item.label}
                    </Label>

                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.description}
                    </p>
                  </div>

                  <Switch
                    checked={Boolean(
                      form[item.id]
                    )}
                    onCheckedChange={(value) =>
                      updateForm(
                        item.id,
                        value
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ACTION */}
          <section className="rounded-xl border bg-white p-5">
            <Button
              type="button"
              onClick={submit}
              disabled={saving}
              className="w-full"
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

            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setForm(INITIAL_FORM);
                setFiles([]);
                

                if (fileInputRef.current) {
                  fileInputRef.current.value =
                    "";
                }
              }}
              className="mt-2 w-full"
            >
              Reset
            </Button>
          </section>
        </div>
      </div>
    </div>
  );
}