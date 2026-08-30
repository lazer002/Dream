// src/pages/admin/BundleDetail.jsx

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  Loader2,
  Package,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "@/utils/config";

export default function AdminBundleDetail() {
  const { publicId } = useParams();
  const navigate = useNavigate();

  const [bundle, setBundle] = useState(null);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    oldPrice: "",
    currency: "INR",
    mainImages: [],
    products: [],
    active: true,
    published: true,
    featured: false,
    isNewBundle: false,
    onSale: false,
    isOutOfStock: false,
    tags: [],
  });

  // =========================================================
  // FETCH BUNDLE
  // =========================================================

  const fetchBundle = async () => {
    try {
      setLoading(true);

      const res = await api.get(`/admin/bundles/${publicId}`);

      const data =
        res.data?.bundle ||
        res.data?.data ||
        res.data;

      if (!data) {
        throw new Error("Bundle not found");
      }

      setBundle(data);

      setForm({
        title: data.title || "",
        description: data.description || "",
        price: data.price ?? "",
        oldPrice: data.oldPrice ?? "",
        currency: data.currency || "INR",

        mainImages: Array.isArray(data.mainImages)
          ? data.mainImages
          : Array.isArray(data.images)
          ? data.images
          : data.mainImage
          ? [data.mainImage]
          : [],

        products: Array.isArray(data.products)
          ? data.products
          : [],

        active: data.active ?? true,
        published: data.published ?? true,
        featured: data.featured ?? false,
        isNewBundle: data.isNewBundle ?? false,
        onSale: data.onSale ?? false,
        isOutOfStock: data.isOutOfStock ?? false,

        tags: Array.isArray(data.tags)
          ? data.tags
          : [],
      });
    } catch (error) {
      console.error("FETCH BUNDLE ERROR:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to load bundle"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH PRODUCTS
  // =========================================================

  const fetchProducts = async () => {
    try {
      const res = await api.get("/admin/products");

      const data =
        res.data?.products ||
        res.data?.data ||
        [];

      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("FETCH PRODUCTS ERROR:", error);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    if (!publicId) return;

    fetchBundle();
    fetchProducts();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId]);

  // =========================================================
  // FIELD UPDATE
  // =========================================================

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // DISCOUNT
  // =========================================================

  const discount = useMemo(() => {
    const price = Number(form.price) || 0;
    const oldPrice = Number(form.oldPrice) || 0;

    if (oldPrice <= 0 || price >= oldPrice) {
      return 0;
    }

    return Number(
      (((oldPrice - price) / oldPrice) * 100).toFixed(2)
    );
  }, [form.price, form.oldPrice]);

  // =========================================================
  // UPLOAD IMAGES
  // =========================================================



async function uploadBundleImages(files) {
  if (!files?.length || !bundle?.publicId) return;

  try {
    setUploading(true);

    const fd = new FormData();

    files.forEach((file) => {
      fd.append("files", file);
    });

    fd.append("folder", "bundles");

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

    const newImages =
      data?.images
        ?.map((image) =>
          typeof image === "string"
            ? image
            : image?.url
        )
        .filter(Boolean) || [];

    if (!newImages.length) {
      throw new Error("No images were uploaded");
    }

    const existingImages = Array.isArray(
      form.mainImages
    )
      ? form.mainImages
      : [];

    const updatedImages = [
      ...existingImages,
      ...newImages,
    ];

    await api.put(
      `/admin/bundles/${bundle.publicId}`,
      {
        mainImages: updatedImages,
      }
    );

    setForm((prev) => ({
      ...prev,
      mainImages: updatedImages,
    }));

    setBundle((prev) => ({
      ...prev,
      mainImages: updatedImages,
    }));

    toast.success("Images uploaded");
  } catch (error) {
    console.error(
      "UPLOAD BUNDLE IMAGES ERROR:",
      error
    );

    toast.error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to upload images"
    );
  } finally {
    setUploading(false);
  }
}
  // =========================================================
  // DELETE IMAGE FROM SUPABASE
  // =========================================================


async function deleteBundleImage(image) {
  if (!image || !bundle?.publicId) return;

  const images = Array.isArray(form.mainImages)
    ? form.mainImages
    : [];

  if (images.length <= 1) {
    toast.error(
      "A bundle must have at least one image."
    );
    return;
  }

  if (
    !window.confirm(
      "Delete this image permanently?"
    )
  ) {
    return;
  }

  try {
    setDeleting(true);

    const { data } = await api.delete(
      `/admin/bundles/${bundle.publicId}/images`,
      {
        data: {
          image,
        },
      }
    );

    const updatedImages = Array.isArray(
      data?.bundle?.mainImages
    )
      ? data.bundle.mainImages
      : images.filter(
          (item) => item !== image
        );

    setForm((prev) => ({
      ...prev,
      mainImages: updatedImages,
    }));

    setBundle((prev) => ({
      ...prev,
      mainImages: updatedImages,
    }));

    toast.success("Image deleted");
  } catch (error) {
    console.error(
      "DELETE BUNDLE IMAGE ERROR:",
      error
    );

    toast.error(
      error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete image"
    );
  } finally {
    setDeleting(false);
  }
}
  // =========================================================
  // ADD PRODUCT
  // =========================================================

  const getProductId = (item) => {
    return (
      item?.productId?._id ||
      item?.productId?.publicId ||
      item?.productId
    );
  };

  const getProductObject = (item) => {
    if (
      item?.productId &&
      typeof item.productId === "object"
    ) {
      return item.productId;
    }

    return products.find(
      (product) =>
        product._id === item?.productId ||
        product.publicId === item?.productId
    );
  };

  const addProduct = (product) => {
  const exists = form.products.some(
    (item) =>
      item?._id === product?._id ||
      item?.publicId === product?.publicId
  );

  if (exists) {
    toast.error("Product already added");
    return;
  }

  setForm((prev) => ({
    ...prev,
    products: [
      ...prev.products,
      product,
    ],
  }));
};

  // =========================================================
  // REMOVE PRODUCT
  // =========================================================

  const removeProduct = (index) => {
    setForm((prev) => ({
      ...prev,
      products: prev.products.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // =========================================================
  // UPDATE BUNDLE PRODUCT
  // =========================================================

  const updateBundleProduct = (
    index,
    field,
    value
  ) => {
    setForm((prev) => {
      const updated = [...prev.products];

      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      return {
        ...prev,
        products: updated,
      };
    });
  };

  // =========================================================
  // SAVE
  // =========================================================

  const saveBundle = async () => {
    try {
      setSaving(true);

    const payload = {
  title: form.title.trim(),
  description: form.description.trim(),
  price: Number(form.price) || 0,
  oldPrice: Number(form.oldPrice) || 0,
  currency: form.currency || "INR",

  mainImages: form.mainImages || [],

  products: form.products.map(
    (product) =>
      product?._id
  ),

  active: Boolean(form.active),
  published: Boolean(form.published),
  featured: Boolean(form.featured),
  isNewBundle: Boolean(form.isNewBundle),
  isOutOfStock: Boolean(form.isOutOfStock),

  tags: Array.isArray(form.tags)
    ? form.tags
    : [],
};

      const res = await api.put(
        `/admin/bundles/${publicId}`,
        payload
      );

      const updated =
        res.data?.bundle ||
        res.data?.data ||
        res.data;

      setBundle(updated);

      toast.success(
        "Bundle updated successfully"
      );

      await fetchBundle();
    } catch (error) {
      console.error(
        "UPDATE BUNDLE ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to update bundle"
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE BUNDLE
  // =========================================================

  const deleteBundle = async () => {
    const confirmed = window.confirm(
      "Delete this bundle permanently?"
    );

    if (!confirmed) return;

    try {
      setDeleting(true);

      await api.delete(
        `/admin/bundles/${publicId}`
      );

      toast.success("Bundle deleted");

      navigate("/admin/bundles");
    } catch (error) {
      console.error(
        "DELETE BUNDLE ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to delete bundle"
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="p-10 text-center">
        <p className="mb-4">
          Bundle not found
        </p>

        <button
          onClick={() =>
            navigate("/admin/bundles")
          }
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Back to Bundles
        </button>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1500px]">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={() =>
                navigate("/admin/bundles")
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Bundle
              </p>

              <h1 className="truncate text-2xl font-bold text-gray-950 md:text-3xl">
                {form.title || "Bundle"}
              </h1>

              <p className="mt-1 truncate text-xs text-gray-400">
                {bundle.publicId}
              </p>
            </div>

          </div>

          <div className="flex gap-2">

<button
  type="button"
  disabled={deleting}
  onClick={() => deleteBundleImage(image)}
  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 shadow hover:bg-red-50 disabled:opacity-50"
>
  {deleting ? (
    <Loader2 className="h-4 w-4 animate-spin" />
  ) : (
    <X className="h-4 w-4" />
  )}
</button>

            <button
              type="button"
              onClick={saveBundle}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              Save Changes
            </button>

          </div>
        </div>

        {/* MAIN GRID */}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">

          {/* LEFT */}

          <div className="space-y-6">

            {/* BASIC INFORMATION */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">

              <div className="mb-5">
                <h2 className="text-lg font-bold">
                  Bundle Information
                </h2>

                <p className="text-sm text-gray-500">
                  Manage the bundle's basic information.
                </p>
              </div>

              <div className="space-y-5">

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Title
                  </label>

                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      updateField(
                        "title",
                        e.target.value
                      )
                    }
                    className="admin-bundle-input h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Description
                  </label>

                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }
                    rows={6}
                    className="admin-bundle-input w-full rounded-lg border border-gray-300 bg-white p-3 text-gray-900 outline-none focus:border-black"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) =>
                        updateField(
                          "price",
                          e.target.value
                        )
                      }
                      className="admin-bundle-input h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Old Price
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={form.oldPrice}
                      onChange={(e) =>
                        updateField(
                          "oldPrice",
                          e.target.value
                        )
                      }
                      className="admin-bundle-input h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-black"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Discount
                    </label>

                    <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 font-semibold">
                      {discount}%
                    </div>
                  </div>

                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Currency
                  </label>

                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) =>
                      updateField(
                        "currency",
                        e.target.value
                      )
                    }
                    className="admin-bundle-input h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Tags
                  </label>

                  <input
                    type="text"
                    value={form.tags.join(", ")}
                    onChange={(e) =>
                      updateField(
                        "tags",
                        e.target.value
                          .split(",")
                          .map((tag) => tag.trim())
                          .filter(Boolean)
                      )
                    }
                    placeholder="jeans, shirt, combo"
                    className="admin-bundle-input h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-black"
                  />
                </div>

              </div>
            </section>

            {/* IMAGES */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">

              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-lg font-bold">
                    Bundle Images
                  </h2>

                  <p className="text-sm text-gray-500">
                    Upload or delete bundle images.
                  </p>
                </div>

                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">

                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}

                  {uploading
                    ? "Uploading..."
                    : "Upload Images"}

           <input
  type="file"
  accept="image/*"
  multiple
  className="hidden"
  disabled={uploading}
  onChange={(e) => {
    uploadBundleImages(
      Array.from(e.target.files || [])
    );

    e.target.value = "";
  }}
/>

                </label>

              </div>

              {form.mainImages.length === 0 ? (

                <div className="flex h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                  <ImageIcon className="mb-2 h-9 w-9" />
                  <p className="text-sm">
                    No images
                  </p>
                </div>

              ) : (

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">

                  {form.mainImages.map(
                    (image, index) => (

                      <div
                        key={`${image}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                      >

                        <img
                          src={image}
                          alt={`Bundle ${index + 1}`}
                          className="h-full w-full object-cover"
                        />

                        {index === 0 && (
                          <span className="absolute left-2 top-2 rounded-full bg-black px-2 py-1 text-[10px] font-bold text-white">
                            MAIN
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={deleting}
                          onClick={() =>
                            deleteBundleImage(image)
                          }
                          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-600 shadow hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </button>

                      </div>

                    )
                  )}

                </div>

              )}

            </section>

            {/* PRODUCTS */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">

              <div className="mb-5">
                <h2 className="text-lg font-bold">
                  Bundle Products
                </h2>

                <p className="text-sm text-gray-500">
                  Manage products included in this bundle.
                </p>
              </div>

              <div className="space-y-3">

{form.products.map((product, index) => (
  <div
    key={product?._id || product?.publicId || index}
  
    className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center "
  >
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {product?.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.title || "Product"}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="m-5 h-6 w-6 text-gray-400" />
        )}
      </div>

      <div className="min-w-0"  >
        <p className="truncate font-semibold  cursor-pointer hover:underline"  onClick={() => {
      if (product?.publicId) {
        navigate(`/admin/products/${product.publicId}`);
      }
    }}>
          {product?.title || "Product"}
        </p>

        <p className="text-xs text-gray-500">
          SKU: {product?.sku || "-"}
        </p>

        <p className="text-xs text-gray-400">
          ₹{Number(product?.price || 0).toLocaleString("en-IN")}
        </p>

        {/* Inventory */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {product?.inventory?.stock &&
          typeof product.inventory.stock === "object" ? (
            Object.entries(product.inventory.stock).map(
              ([size, quantity]) => (
                <span
                  key={size}
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                    Number(quantity) > 0
                      ? "border-gray-200 bg-gray-50 text-gray-600"
                      : "border-red-100 bg-red-50 text-red-500"
                  }`}
                >
                  {size}: {Number(quantity) || 0}
                </span>
              )
            )
          ) : (
            <span className="text-[10px] text-gray-400">
              No inventory
            </span>
          )}
        </div>

        {product?.isOutOfStock && (
          <p className="mt-1 text-[10px] font-medium text-red-500">
            Out of stock
          </p>
        )}
      </div>
    </div>

    <button
      type="button"
      onClick={() => removeProduct(index)}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  </div>
))}
                {form.products.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
                    No products added.
                  </div>
                )}

              </div>
            </section>

          </div>

          {/* RIGHT */}

          <div className="space-y-6">

            {/* VISIBILITY */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h2 className="mb-5 text-lg font-bold">
                Visibility
              </h2>

              <div className="space-y-3">

                {[
                  [
                    "active",
                    "Active",
                    "Bundle can be used.",
                  ],
                  [
                    "published",
                    "Published",
                    "Show bundle to customers.",
                  ],
                  [
                    "featured",
                    "Featured",
                    "Show in featured sections.",
                  ],
                  [
                    "isNewBundle",
                    "New Bundle",
                    "Mark as a new bundle.",
                  ],
                ].map(
                  ([
                    field,
                    title,
                    description,
                  ]) => (
                    <label
                      key={field}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50"
                    >

                      <div>
                        <p className="font-semibold">
                          {title}
                        </p>

                        <p className="text-xs text-gray-500">
                          {description}
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        checked={Boolean(
                          form[field]
                        )}
                        onChange={(e) =>
                          updateField(
                            field,
                            e.target.checked
                          )
                        }
                        className="h-5 w-5 accent-black"
                      />

                    </label>
                  )
                )}

              </div>
            </section>

            {/* ADD PRODUCTS */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <div className="mb-4">

                <h2 className="text-lg font-bold">
                  Add Products
                </h2>

                <p className="text-xs text-gray-500">
                  Add products to this bundle.
                </p>

              </div>

              <div className="max-h-[600px] space-y-2 overflow-y-auto pr-1">

                {products.map((product) => {

                  const exists =
                    form.products.some(
                      (item) => {
                        const id =
                          getProductId(item);

                        return (
                          id === product._id ||
                          id === product.publicId
                        );
                      }
                    );

                  return (
                    <div
                      key={
                        product._id ||
                        product.publicId
                      }
                      className="flex items-center gap-3 rounded-xl border border-gray-200 p-3"
                    >

                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                        {product?.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="m-3 h-6 w-6 text-gray-400" />
                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold">
                          {product.title}
                        </p>

                        <p className="text-xs text-gray-500">
                          {product.sku}
                        </p>

                      </div>

                      <button
                        type="button"
                        disabled={exists}
                        onClick={() =>
                          addProduct(product)
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {exists ? (
                          "✓"
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>

                    </div>
                  );
                })}

              </div>
            </section>

            {/* META */}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <h2 className="mb-4 text-lg font-bold">
                Bundle Details
              </h2>

              <div className="space-y-3 text-sm">

                <div className="flex items-center justify-between gap-4 border-b pb-3">
                  <span className="text-gray-500">
                    Public ID
                  </span>

                  <span className="max-w-[220px] truncate font-mono text-xs">
                    {bundle.publicId}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-500">
                    Products
                  </span>

                  <span className="font-semibold">
                    {form.products.length}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-500">
                    Images
                  </span>

                  <span className="font-semibold">
                    {form.mainImages.length}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-gray-500">
                    Discount
                  </span>

                  <span className="font-semibold">
                    {discount}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    Status
                  </span>

                  <span
                    className={
                      form.published &&
                      form.active
                        ? "font-semibold text-green-600"
                        : "font-semibold text-gray-400"
                    }
                  >
                    {form.published &&
                    form.active
                      ? "Active"
                      : "Hidden"}
                  </span>
                </div>

              </div>
            </section>

            {/* PUBLIC PDP */}

            {bundle.publicId && (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/collections/${bundle.publicId}`
                  )
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-gray-50"
              >
                <ExternalLink className="h-4 w-4" />
                Open Public Bundle
              </button>
            )}

          </div>
        </div>
      </div>

      {/* ADMIN INPUT OVERRIDE */}

      <style>{`
        .admin-bundle-input,
        .admin-bundle-select {
          -webkit-appearance: auto !important;
          -moz-appearance: auto !important;
          appearance: auto !important;
          background-color: #fff !important;
          border-width: 1px !important;
          border-color: #d1d5db !important;
          box-shadow: none !important;
          outline: none !important;
        }

        .admin-bundle-input:focus,
        .admin-bundle-select:focus {
          border-color: #000 !important;
          box-shadow: 0 0 0 1px #000 !important;
        }
      `}</style>
    </div>
  );
}