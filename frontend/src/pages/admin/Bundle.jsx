// src/pages/admin/AdminBundles.jsx

import { useEffect, useMemo, useState } from "react";
import api from "@/utils/config";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import {
  Package,
  Search,
  X,
  Check,
  ImagePlus,
  Trash2,
  Tag,
  IndianRupee,
} from "lucide-react";

export default function Bundle() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [images, setImages] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [published, setPublished] = useState(true);
  const [active, setActive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [isNewBundle, setIsNewBundle] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);

        const res = await api.get("/products", {
          params: {
            limit: 100,
          },
        });

        setAllProducts(res.data.items || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const selectedProductObjects = useMemo(() => {
    return selectedProducts
      .map((id) =>
        allProducts.find(
          (product) => product._id === id
        )
      )
      .filter(Boolean);
  }, [selectedProducts, allProducts]);

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return allProducts;

    return allProducts.filter((product) =>
      product.title?.toLowerCase().includes(value)
    );
  }, [allProducts, search]);

  const calculatedTotalPrice = useMemo(() => {
    return selectedProductObjects.reduce(
      (total, product) =>
        total + Number(product.price || 0),
      0
    );
  }, [selectedProductObjects]);

  const calculatedDiscount = useMemo(() => {
    const regularPrice =
      Number(oldPrice) || calculatedTotalPrice;

    const bundlePrice =
      Number(price) || calculatedTotalPrice;

    if (
      regularPrice > 0 &&
      bundlePrice < regularPrice
    ) {
      return Math.round(
        ((regularPrice - bundlePrice) /
          regularPrice) *
          100
      );
    }

    return 0;
  }, [oldPrice, price, calculatedTotalPrice]);

  const toggleProductSelection = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((productId) => productId !== id)
        : [...prev, id]
    );
  };

  const removeSelectedProduct = (id) => {
    setSelectedProducts((prev) =>
      prev.filter((productId) => productId !== id)
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [
      ...prev,
      ...newImages,
    ]);

    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setOldPrice("");
    setCategory("");
    setTags("");

    setSelectedProducts([]);
    setImages([]);

    setPublished(true);
    setActive(true);
    setFeatured(false);
    setIsNewBundle(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Bundle title is required");
      return;
    }

    if (!selectedProducts.length) {
      toast.error("Select at least one product");
      return;
    }

    if (!category.trim()) {
      toast.error("Category is required");
      return;
    }

try {
  setLoading(true);

  const finalPrice =
    price !== ""
      ? Number(price)
      : calculatedTotalPrice;

  const finalOldPrice =
    oldPrice !== ""
      ? Number(oldPrice)
      : calculatedTotalPrice;

  // mainImages is still empty because the frontend upload is not
// sending/receiving the image URLs correctly.
//
// Use this exact upload flow:

let imageUrls = [];

const files = images
  .filter((img) => img.file instanceof File)
  .map((img) => img.file);

if (files.length > 0) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  const uploadResponse = await api.post(
    "/admin/upload/images",
    formData
  );

  imageUrls =
    uploadResponse.data?.images?.map(
      (image) => image.url
    ) || [];

  console.log("UPLOADED BUNDLE IMAGES:", imageUrls);
}

await api.post("/bundles", {
  title: title.trim(),
  description: description.trim(),
  products: selectedProducts,

  category: category
    .trim()
    .toLowerCase(),

  price: finalPrice,
  oldPrice: finalOldPrice,

  discount:
    finalOldPrice > finalPrice
      ? Math.round(
          ((finalOldPrice - finalPrice) /
            finalOldPrice) *
            100
        )
      : 0,

  tags: tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean),

  // IMPORTANT
  mainImages: imageUrls,

  active,
  published,
  featured,
  isNewBundle,

  onSale:
    finalOldPrice > finalPrice,
});
  toast.success(
    "Bundle created successfully"
  );

  resetForm();
} catch (err) {
  console.error(
    "CREATE BUNDLE ERROR:",
    err
  );

  toast.error(
    err?.response?.data?.error ||
      err?.response?.data?.message ||
      "Error creating bundle"
  );
} finally {
  setLoading(false);
}
  }
  return (
    <div
      className="min-h-screen bg-[#f7f7f5]"
      data-lenis-prevent
    >
      <div className="mx-auto max-w-auto px-4 py-8 md:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-black md:text-3xl">
                Create Bundle
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Combine products into a curated bundle.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 lg:grid-cols-[1fr_380px]"
        >
          {/* LEFT */}
          <div className="space-y-6">
            {/* BASIC INFO */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <h2 className="font-semibold text-black">
                  Bundle Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Basic information about this bundle.
                </p>
              </div>

              <div className="space-y-5">
                <div className=" border-b">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Bundle Title
                  </label>

                  <Input
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    placeholder="e.g. Essential Streetwear Pack"
                    className="h-11 border-gray-300 bg-white"
                  />
                </div>

                <div className=" border-b">
                  <label className="mb-2 block text-sm font-medium text-gray-900">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Describe what's included in this bundle..."
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className=" border-b">
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Category
                    </label>

                    <Input
                      value={category}
                      onChange={(e) =>
                        setCategory(
                          e.target.value
                        )
                      }
                      placeholder="e.g. hoodie"
                      className="h-11 border-gray-300"
                    />
                  </div>

                  <div className=" border-b">
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Tags
                    </label>

                    <Input
                      value={tags}
                      onChange={(e) =>
                        setTags(e.target.value)
                      }
                      placeholder="streetwear, combo, sale"
                      className="h-11 border-gray-300"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* IMAGES */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <h2 className="font-semibold text-black">
                  Bundle Images
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add product or promotional images.
                </p>
              </div>

              <label className="flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-5 text-center transition hover:border-black hover:bg-gray-100">
                <ImagePlus className="mb-3 h-7 w-7 text-gray-500" />

                <span className="text-sm font-medium text-gray-900">
                  Click to upload images
                </span>

                <span className="mt-1 text-xs text-gray-500">
                  PNG, JPG or WEBP
                </span>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              {images.length > 0 && (
                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200"
                    >
                      <img
                        src={image.preview}
                        alt={`Bundle ${index + 1}`}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(index)
                        }
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* PRODUCTS */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-black">
                    Bundle Products
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select products included in this bundle.
                  </p>
                </div>

                <div className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
                  {selectedProducts.length} selected
                </div>
              </div>

              {/* SEARCH */}
              <div className="relative mb-5  border-b">

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search products..."
                  className="h-11 border-gray-300 pl-10"
                />
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {Array.from({
                    length: 6,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-xl border border-gray-200 p-3"
                    >
                      <div className="aspect-square rounded-lg bg-gray-200" />
                      <div className="mt-3 h-4 rounded bg-gray-200" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-gray-200" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid max-h-[560px] grid-cols-2 gap-3 overflow-y-auto pr-1 md:grid-cols-3">
                  {filteredProducts.map(
                    (product) => {
                      const selected =
                        selectedProducts.includes(
                          product._id
                        );

                      return (
                        <button
                          key={product._id}
                          type="button"
                          onClick={() =>
                            toggleProductSelection(
                              product._id
                            )
                          }
                          className={`
                            relative overflow-hidden rounded-xl border text-left transition
                            ${
                              selected
                                ? "border-black ring-1 ring-black"
                                : "border-gray-200 hover:border-gray-400"
                            }
                          `}
                        >
                          <div className="aspect-square bg-gray-100">
                            <img
                              src={
                                product.images?.[0]
                              }
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          {selected && (
                            <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white shadow">
                              <Check className="h-4 w-4" />
                            </div>
                          )}

                          <div className="p-3">
                            <p className="truncate text-sm font-semibold text-black">
                              {product.title}
                            </p>

                            <p className="mt-1 flex items-center text-xs text-gray-500">
                              ₹
                              {Number(
                                product.price || 0
                              ).toLocaleString("en-IN")}
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              {!loadingProducts &&
                filteredProducts.length === 0 && (
                  <div className="py-12 text-center">
                    <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />

                    <p className="text-sm font-medium text-gray-600">
                      No products found
                    </p>
                  </div>
                )}
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* SELECTED PRODUCTS */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-semibold text-black">
                  Selected Products
                </h2>
              </div>

              {selectedProductObjects.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                  <Package className="mx-auto mb-3 h-7 w-7 text-gray-300" />

                  <p className="text-sm text-gray-500">
                    No products selected
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProductObjects.map(
                    (product) => (
                      <div
                        key={product._id}
                        className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5"
                      >
                        <img
                          src={
                            product.images?.[0]
                          }
                          alt={product.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-black">
                            {product.title}
                          </p>

                          <p className="text-xs text-gray-500">
                            ₹
                            {Number(
                              product.price || 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeSelectedProduct(
                              product._id
                            )
                          }
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-black"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}

              {selectedProductObjects.length >
                0 && (
                <div className="mt-4 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Products total
                    </span>

                    <span className="font-semibold text-black">
                      ₹
                      {calculatedTotalPrice.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* PRICING */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="font-semibold text-black">
                  Pricing
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Original Price
                  </label>

                  <div className="relative border-b">

                    <Input
                      type="number"
                      min="0"
                      value={oldPrice}
                      onChange={(e) =>
                        setOldPrice(
                          e.target.value
                        )
                      }
                      placeholder={String(
                        calculatedTotalPrice
                      )}
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Bundle Price
                  </label>

                  <div className="relative border-b">

                    <Input
                      type="number"
                      min="0"
                      value={price}
                      onChange={(e) =>
                        setPrice(
                          e.target.value
                        )
                      }
                      placeholder={String(
                        calculatedTotalPrice
                      )}
                      className="h-11 pl-9"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Discount
                    </span>

                    <span className="font-semibold text-green-600">
                      {calculatedDiscount}% OFF
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SETTINGS */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="font-semibold text-black">
                  Settings
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  [
                    "Active",
                    active,
                    setActive,
                  ],
                  [
                    "Published",
                    published,
                    setPublished,
                  ],
                  [
                    "Featured",
                    featured,
                    setFeatured,
                  ],
                  [
                    "New Bundle",
                    isNewBundle,
                    setIsNewBundle,
                  ],
                ].map(
                  ([
                    label,
                    value,
                    setter,
                  ]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        setter(!value)
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-left"
                    >
                      <span className="text-sm font-medium text-gray-800">
                        {label}
                      </span>

                      <span
                        className={`
                          relative h-6 w-11 rounded-full transition
                          ${
                            value
                              ? "bg-black"
                              : "bg-gray-200"
                          }
                        `}
                      >
                        <span
                          className={`
                            absolute top-1 h-4 w-4 rounded-full bg-white shadow transition
                            ${
                              value
                                ? "left-6"
                                : "left-1"
                            }
                          `}
                        />
                      </span>
                    </button>
                  )
                )}
              </div>
            </section>

            {/* CREATE */}
            <Button
              type="submit"
              disabled={
                loading ||
                !title.trim() ||
                !selectedProducts.length
              }
              className="h-12 w-full rounded-xl bg-black text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Creating Bundle..."
                : "Create Bundle"}
            </Button>
          </aside>
        </form>
      </div>
    </div>
  );
}