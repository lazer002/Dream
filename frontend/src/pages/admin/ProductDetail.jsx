import {
  ArrowLeft,
  AlertTriangle,
  Check,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Save,
  ShoppingBag,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/utils/config";

export default function AdminProductDetail() {
  const { publicId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editing, setEditing] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);

  const [uploadingImages, setUploadingImages] = useState(false);
  const [deletingImage, setDeletingImage] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    details: "",
    price: "",
    oldPrice: "",
    category: "",
    tags: "",
    active: true,
    published: true,
    isNewProduct: false,
    onSale: false,
    featured: false,
  });

  const [inventory, setInventory] = useState({});

  useEffect(() => {
    fetchProduct();
    fetchCategories();
  }, [publicId]);

  async function fetchProduct() {
    try {
      setLoading(true);

      const { data } = await api.get(
        `/admin/products/${publicId}`
      );

      const p = data?.product || data;
      console.log('✌️p --->', p);


      setProduct(p);

      setForm({
        title: p?.title || "",
        description: p?.description || "",
        details: p?.details || "",
        price: p?.price ?? "",
        oldPrice: p?.oldPrice ?? "",
        category:
          typeof p?.category === "object"
            ? p.category?._id || ""
            : p?.category || "",
        tags: Array.isArray(p?.tags)
          ? p.tags.join(", ")
          : "",
        active: Boolean(p?.active),
        published: Boolean(p?.published),
        isNewProduct: Boolean(p?.isNewProduct),
        onSale: Boolean(p?.onSale),
        featured: Boolean(p?.featured),
      });

      setInventory(
        p?.inventory?.stock &&
          typeof p.inventory.stock === "object"
          ? { ...p.inventory.stock }
          : {}
      );

      setSelectedImage(0);
    } catch (error) {
      console.error(
        "FETCH PRODUCT ERROR:",
        error
      );

      setProduct(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await api.get(
        "/categories"
      );

      setCategories(
        Array.isArray(data)
          ? data
          : data?.categories || []
      );
    } catch (error) {
      console.error(
        "FETCH CATEGORIES ERROR:",
        error
      );
    }
  }

  async function uploadProductImages(files) {
    if (!files?.length || !product?._id) {
      return;
    }

    try {
      setUploadingImages(true);

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

      const newImages =
        data?.images
          ?.map((image) => image?.url)
          .filter(Boolean) || [];

      if (!newImages.length) {
        throw new Error(
          "No images were uploaded"
        );
      }

      const existingImages = Array.isArray(
        product.images
      )
        ? product.images
        : [];

      const updatedImages = [
        ...existingImages,
        ...newImages,
      ];

      const { data: updateData } =
        await api.put(
          `/products/${product._id}`,
          {
            images: updatedImages,
          }
        );

      const updatedProduct =
        updateData?.product || updateData;

      setProduct((prev) => ({
        ...prev,
        ...updatedProduct,
        images: updatedImages,
      }));

      setSelectedImage(
        updatedImages.length - 1
      );
    } catch (error) {
      console.error(
        "UPLOAD PRODUCT IMAGES ERROR:",
        error
      );

      window.alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to upload images"
      );
    } finally {
      setUploadingImages(false);
    }
  }

  async function deleteProductImage(image) {
    if (!image || !product?._id) {
      return;
    }

    const images = Array.isArray(product.images)
      ? product.images
      : [];

    if (images.length <= 1) {
      window.alert(
        "A product must have at least one image."
      );
      return;
    }

    const confirmed = window.confirm(
      "Delete this image permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingImage(image);

      const { data } = await api.delete(
        `/products/${product._id}/images`,
        {
          data: {
            image,
          },
        }
      );

      const updated =
        data?.product || data;

      const updatedImages =
        Array.isArray(updated?.images)
          ? updated.images
          : images.filter(
              (item) => item !== image
            );

      setProduct((prev) => ({
        ...prev,
        ...updated,
        images: updatedImages,
      }));

      setSelectedImage((current) => {
        if (!updatedImages.length) {
          return 0;
        }

        if (current >= updatedImages.length) {
          return updatedImages.length - 1;
        }

        return current;
      });
    } catch (error) {
      console.error(
        "DELETE PRODUCT IMAGE ERROR:",
        error
      );

      window.alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to delete image"
      );
    } finally {
      setDeletingImage(null);
    }
  }

  async function saveProduct() {
    if (!product?._id) {
      return;
    }

    try {
      setSaving(true);

      const sizes = Object.keys(inventory).map(
        (size) => ({
          name: size,
          active: true,
        })
      );

      const payload = {
        title: form.title.trim(),
        description: form.description,
        details: form.details,

        price: Number(form.price),

        oldPrice:
          form.oldPrice === ""
            ? undefined
            : Number(form.oldPrice),

        category: form.category,

        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),

        active: Boolean(form.active),
        published: Boolean(form.published),
        isNewProduct: Boolean(
          form.isNewProduct
        ),
        onSale: Boolean(form.onSale),
        featured: Boolean(form.featured),

        sizes,

        inventory: {
          stock: {
            ...inventory,
          },
        },
      };

      const { data } = await api.put(
        `/products/${product._id}`,
        payload
      );

      const updated =
        data?.product || data;

      setProduct((prev) => ({
        ...prev,
        ...updated,
      }));

      setEditing(false);

      await fetchProduct();
    } catch (error) {
      console.error(
        "UPDATE PRODUCT ERROR:",
        error
      );

      window.alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct() {
    if (!product?._id) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(
        `/products/${product._id}`
      );

      navigate("/admin/products");
    } catch (error) {
      console.error(
        "DELETE PRODUCT ERROR:",
        error
      );

      window.alert(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to delete product"
      );
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  function updateInventory(size, value) {
    setInventory((prev) => ({
      ...prev,
      [size]: Math.max(
        0,
        Number(value) || 0
      ),
    }));
  }

  function addInventorySize() {
    const size = window.prompt(
      "Enter size"
    );

    if (!size?.trim()) {
      return;
    }

    const normalized = size.trim();

    if (
      Object.prototype.hasOwnProperty.call(
        inventory,
        normalized
      )
    ) {
      window.alert(
        "This size already exists."
      );
      return;
    }

    setInventory((prev) => ({
      ...prev,
      [normalized]: 0,
    }));
  }

  function removeInventorySize(size) {
    setInventory((prev) => {
      const next = {
        ...prev,
      };

      delete next[size];

      return next;
    });
  }

  function cancelEditing() {
    setEditing(false);
    fetchProduct();
  }

  const inventoryTotal = useMemo(() => {
    return Object.values(inventory).reduce(
      (sum, value) =>
        sum + Number(value || 0),
      0
    );
  }, [inventory]);

  const stockStatus =
    inventoryTotal === 0
      ? "Out of stock"
      : inventoryTotal <= 5
      ? "Low stock"
      : "In stock";

  const stockStatusClass =
    inventoryTotal === 0
      ? "bg-red-50 text-red-700 border-red-100"
      : inventoryTotal <= 5
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : "bg-emerald-50 text-emerald-700 border-emerald-100";

  const images = Array.isArray(
    product?.images
  )
    ? product.images
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="h-12 w-64 animate-pulse rounded-xl bg-gray-200" />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="h-[700px] animate-pulse rounded-2xl bg-white" />
            <div className="h-[700px] animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f6f7]">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Package className="h-8 w-8 text-gray-300" />
          </div>

          <h2 className="mt-5 text-xl font-semibold">
            Product not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            The product may have been deleted
            or the URL is invalid.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/admin/products")
            }
            className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      {/* HEADER */}
      <header className="sticky top-[-3vh] z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/admin/products")
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-white transition hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Products</span>
                <span>/</span>
                <span>Details</span>
              </div>

              <h1 className="mt-1 truncate text-base font-bold text-gray-900 sm:text-lg">
                {product.title}
              </h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setShowDeleteModal(true)
              }
              className="hidden h-10 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:flex"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>

            {editing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    Cancel
                  </span>
                </button>

                <button
                  type="button"
                  onClick={saveProduct}
                  disabled={saving}
                  className="flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saving
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setEditing(true)
                }
                className="flex h-10 items-center gap-2 rounded-xl bg-black px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <Pencil className="h-4 w-4" />
                Edit product
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* LEFT */}
          <div className="min-w-0 space-y-6">
            {/* MEDIA */}
            <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b px-5 py-5 sm:px-6">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <ImageIcon className="h-4 w-4" />
                    Product media
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {images.length}{" "}
                    {images.length === 1
                      ? "image"
                      : "images"}
                  </p>
                </div>

                {editing && (
                  <label
                    className={`flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${
                      uploadingImages
                        ? "pointer-events-none opacity-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    {uploadingImages ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          Add images
                        </span>
                        <span className="sm:hidden">
                          Add
                        </span>
                      </>
                    )}

                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      disabled={
                        uploadingImages
                      }
                      onChange={(e) => {
                        const files =
                          Array.from(
                            e.target.files || []
                          );

                        if (files.length) {
                          uploadProductImages(
                            files
                          );
                        }

                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_112px]">
                  {/* MAIN IMAGE */}
                  <div className="relative aspect-square overflow-hidden rounded-2xl border bg-[#f7f7f7]">
                    {images[selectedImage] ? (
                      <>
                        <img
                          src={
                            images[
                              selectedImage
                            ]
                          }
                          alt={
                            product.title
                          }
                          className="h-full w-full object-contain"
                        />

                        <div className="absolute left-4 top-4 rounded-full border bg-white/95 px-3 py-1.5 text-xs font-bold shadow-sm">
                          {selectedImage + 1} /{" "}
                          {images.length}
                        </div>

                        {selectedImage ===
                          0 && (
                          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-lg bg-black px-3 py-1.5 text-xs font-bold text-white">
                            <Check className="h-3.5 w-3.5" />
                            Main image
                          </div>
                        )}

                        {editing && (
                          <button
                            type="button"
                            disabled={
                              deletingImage ===
                                images[
                                  selectedImage
                                ] ||
                              images.length <=
                                1
                            }
                            onClick={() =>
                              deleteProductImage(
                                images[
                                  selectedImage
                                ]
                              )
                            }
                            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-600 shadow-lg transition hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingImage ===
                            images[
                              selectedImage
                            ] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="h-14 w-14" />

                        <p className="mt-4 text-sm font-medium">
                          No product images
                        </p>

                        {editing && (
                          <p className="mt-1 text-xs">
                            Add images above
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* THUMBNAILS */}
                  <div className="flex gap-3 overflow-x-auto lg:flex-col lg:overflow-y-auto lg:pr-1">
                    {images.map(
                      (image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="group relative shrink-0"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedImage(
                                index
                              )
                            }
                            className={`h-24 w-24 overflow-hidden rounded-xl border-2 bg-gray-50 transition ${
                              selectedImage ===
                              index
                                ? "border-black ring-2 ring-black/10"
                                : "border-transparent hover:border-gray-300"
                            }`}
                          >
                            <img
                              src={image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </button>

                          {index === 0 && (
                            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black px-1.5 py-0.5 text-[9px] font-bold text-white">
                              MAIN
                            </span>
                          )}

                          {editing && (
                            <button
                              type="button"
                              disabled={
                                deletingImage ===
                                  image ||
                                images.length <=
                                  1
                              }
                              onClick={() =>
                                deleteProductImage(
                                  image
                                )
                              }
                              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border bg-white text-red-600 opacity-0 shadow-md transition group-hover:opacity-100 disabled:opacity-30"
                            >
                              {deletingImage ===
                              image ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )
                    )}

                    {editing && (
                      <label
                        className={`flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-gray-400 transition hover:border-black hover:text-black ${
                          uploadingImages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      >
                        {uploadingImages ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-5 w-5" />
                            <span className="mt-1 text-[10px] font-bold">
                              Add images
                            </span>
                          </>
                        )}

                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          disabled={
                            uploadingImages
                          }
                          onChange={(e) => {
                            const files =
                              Array.from(
                                e.target
                                  .files || []
                              );

                            if (
                              files.length
                            ) {
                              uploadProductImages(
                                files
                              );
                            }

                            e.target.value =
                              "";
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* PRODUCT INFORMATION */}
            <section className="rounded-2xl border bg-white shadow-sm">
              <SectionHeader
                title="Product information"
                description="Manage the content displayed for this product."
              />

              <div className="space-y-6 p-5 sm:p-6">
                <Field
                  label="Product title"
                  value={form.title}
                  editing={editing}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      title: value,
                    }))
                  }
                />

                <Field
                  label="Description"
                  value={form.description}
                  editing={editing}
                  textarea
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      description:
                        value,
                    }))
                  }
                />

                <Field
                  label="Product details"
                  value={form.details}
                  editing={editing}
                  textarea
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      details: value,
                    }))
                  }
                />
              </div>
            </section>

            {/* INVENTORY */}
            <section className="rounded-2xl border bg-white shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b px-5 py-5 sm:px-6">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <ShoppingBag className="h-4 w-4" />
                    Inventory
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {inventoryTotal} total units
                  </p>
                </div>

                <span
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold ${stockStatusClass}`}
                >
                  {stockStatus}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                {Object.keys(inventory).length ===
                0 ? (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <ShoppingBag className="mx-auto h-8 w-8 text-gray-300" />

                    <p className="mt-3 text-sm font-semibold">
                      No inventory sizes
                    </p>

                    {editing && (
                      <p className="mt-1 text-xs text-gray-500">
                        Add a size to start
                        tracking stock.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(
                      inventory
                    ).map(
                      ([size, quantity]) => {
                        const qty =
                          Number(
                            quantity
                          ) || 0;

                        return (
                          <div
                            key={size}
                            className="flex items-center gap-4 rounded-xl border p-4 transition hover:bg-gray-50"
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-900">
                              {size}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold">
                                Size {size}
                              </p>

                              <p className="mt-0.5 text-xs text-gray-500">
                                Available
                                stock
                              </p>
                            </div>

                            {editing ? (
                              <input
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(
                                  e
                                ) =>
                                  updateInventory(
                                    size,
                                    e
                                      .target
                                      .value
                                  )
                                }
                                className="h-11 w-24 rounded-xl border bg-white px-3 text-right text-sm font-bold outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                              />
                            ) : (
                              <span
                                className={`text-sm font-bold ${
                                  qty === 0
                                    ? "text-red-600"
                                    : qty <=
                                      5
                                    ? "text-amber-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {qty}
                              </span>
                            )}

                            {editing && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeInventorySize(
                                    size
                                  )
                                }
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {editing && (
                  <button
                    type="button"
                    onClick={
                      addInventorySize
                    }
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-semibold text-gray-600 transition hover:border-black hover:text-black"
                  >
                    <Plus className="h-4 w-4" />
                    Add size
                  </button>
                )}

                {editing && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                    <p className="text-xs leading-5 text-blue-700">
                      Inventory changes are
                      saved together with
                      the product when you
                      click{" "}
                      <strong>
                        Save changes
                      </strong>
                      .
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-6">
            {/* STATUS */}
            <section className="rounded-2xl border bg-white shadow-sm">
              <SectionHeader
                title="Product status"
                description="Control product visibility and merchandising."
              />

              <div className="space-y-3 p-5 sm:p-6">
                <StatusRow
                  label="Active"
                  description="Product is active"
                  value={form.active}
                  editing={editing}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      active: value,
                    }))
                  }
                />

                <StatusRow
                  label="Published"
                  description="Visible on storefront"
                  value={form.published}
                  editing={editing}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      published: value,
                    }))
                  }
                />

                <StatusRow
                  label="New product"
                  description="Show as new"
                  value={
                    form.isNewProduct
                  }
                  editing={editing}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      isNewProduct:
                        value,
                    }))
                  }
                />

                <StatusRow
                  label="On sale"
                  description="Product is on sale"
                  value={form.onSale}
                  editing={editing}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      onSale: value,
                    }))
                  }
                />

                <StatusRow
                  label="Featured"
                  description="Show as featured"
                  value={form.featured}
                  editing={editing}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      featured: value,
                    }))
                  }
                />
              </div>
            </section>

            {/* PRICING */}
            <section className="rounded-2xl border bg-white shadow-sm">
              <SectionHeader
                title="Pricing"
                description="Set the selling and compare-at prices."
              />

              <div className="space-y-5 p-5 sm:p-6">
                <Field
                  label="Price"
                  value={form.price}
                  editing={editing}
                  type="number"
                  prefix="₹"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      price: value,
                    }))
                  }
                />

                <Field
                  label="Compare-at price"
                  value={form.oldPrice}
                  editing={editing}
                  type="number"
                  prefix="₹"
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      oldPrice:
                        value,
                    }))
                  }
                />

                <div className="rounded-xl bg-gray-50 p-4">
                  <InfoValue
                    label="Discount"
                    value={
                      product.discount
                        ? `${Number(
                            product.discount
                          ).toFixed(2)}%`
                        : "—"
                    }
                  />

                  <div className="mt-4">
                    <InfoValue
                      label="Currency"
                      value={
                        product.currency ||
                        "INR"
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ORGANIZATION */}
            <section className="rounded-2xl border bg-white shadow-sm">
              <SectionHeader
                title="Organization"
                icon={
                  <Tag className="h-4 w-4" />
                }
                description="Manage category and product tags."
              />

              <div className="space-y-5 p-5 sm:p-6">
                <div>
                  <label className="text-xs font-bold text-gray-500">
                    Category
                  </label>

                  {editing ? (
                    <select
                      value={
                        form.category
                      }
                      onChange={(e) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            category:
                              e.target
                                .value,
                          })
                        )
                      }
                      className="mt-2 h-11 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
                    >
                      <option value="">
                        Select category
                      </option>

                      {categories.map(
                        (category) => (
                          <option
                            key={
                              category._id
                            }
                            value={
                              category._id
                            }
                          >
                            {
                              category.name
                            }
                          </option>
                        )
                      )}
                    </select>
                  ) : (
                    <div className="mt-2 rounded-xl bg-gray-50 px-4 py-3 text-sm font-semibold">
                      {typeof product.category ===
                      "object"
                        ? product
                            .category
                            ?.name ||
                          "—"
                        : product.category ||
                          "—"}
                    </div>
                  )}
                </div>

                <Field
                  label="Tags"
                  value={form.tags}
                  editing={editing}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      tags: value,
                    }))
                  }
                />
              </div>
            </section>

            {/* IDENTIFIERS */}
            <section className="rounded-2xl border bg-white shadow-sm">
              <SectionHeader
                title="Product identifiers"
                description="System generated product information."
              />

              <div className="divide-y">
                <InfoRow
                  label="SKU"
                  value={
                    product.sku
                  }
                />

                <InfoRow
                  label="Public ID"
                  value={
                    product.publicId
                  }
                  mono
                />

                <InfoRow
                  label="Slug"
                  value={
                    product.slug
                  }
                  mono
                />

                <InfoRow
                  label="Product ID"
                  value={
                    product._id
                  }
                  mono
                />
              </div>
            </section>

            {/* TIMELINE */}
            <section className="rounded-2xl border bg-white shadow-sm">
              <SectionHeader
                title="Product timeline"
                description="Creation and latest update."
              />

              <div className="divide-y">
                <InfoRow
                  label="Created"
                  value={formatDate(
                    product.createdAt
                  )}
                />

                <InfoRow
                  label="Updated"
                  value={formatDate(
                    product.updatedAt
                  )}
                />
              </div>
            </section>

            {/* STOREFRONT */}
            <button
              type="button"
              disabled={!product.slug}
              onClick={() => {
                if (!product.slug) {
                  return;
                }

                window.open(
                  `/product/${product.slug}`,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border bg-white text-sm font-semibold shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ExternalLink className="h-4 w-4" />
              View storefront product
            </button>

            {/* MOBILE DELETE */}
            <button
              type="button"
              onClick={() =>
                setShowDeleteModal(true)
              }
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 transition hover:bg-red-100 sm:hidden"
            >
              <Trash2 className="h-4 w-4" />
              Delete product
            </button>
          </aside>
        </div>
      </main>

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>

              <h2 className="mt-5 text-lg font-bold text-gray-900">
                Delete product?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                This will permanently delete{" "}
                <strong className="text-gray-900">
                  {product.title}
                </strong>
                . This action cannot be undone.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteModal(
                      false
                    )
                  }
                  disabled={deleting}
                  className="flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={deleteProduct}
                  disabled={deleting}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deleting...
                    </span>
                  ) : (
                    "Delete product"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  description,
  icon,
}) {
  return (
    <div className="border-b px-5 py-5 sm:px-6">
      <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
        {icon}
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {description}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  editing,
  onChange,
  textarea = false,
  type = "text",
  prefix,
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500">
        {label}
      </label>

      {editing ? (
        <div className="relative mt-2">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
              {prefix}
            </span>
          )}

          {textarea ? (
            <textarea
              value={value ?? ""}
              onChange={(e) =>
                onChange(
                  e.target.value
                )
              }
              rows={6}
              className="w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-black focus:ring-2 focus:ring-black/5"
            />
          ) : (
            <input
              type={type}
              value={value ?? ""}
              onChange={(e) =>
                onChange(
                  e.target.value
                )
              }
              className={`h-11 w-full rounded-xl border bg-white px-4 text-sm outline-none transition focus:border-black focus:ring-2 focus:ring-black/5 ${
                prefix ? "pl-8" : ""
              }`}
            />
          )}
        </div>
      ) : (
        <div
          className={`mt-2 whitespace-pre-wrap rounded-xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700 ${
            textarea
              ? "min-h-[120px]"
              : ""
          }`}
        >
          {value || "—"}
        </div>
      )}
    </div>
  );
}

function StatusRow({
  label,
  description,
  value,
  editing,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800">
          {label}
        </p>

        <p className="mt-0.5 text-xs text-gray-500">
          {description}
        </p>
      </div>

      {editing ? (
        <button
          type="button"
          aria-label={`Toggle ${label}`}
          onClick={() =>
            onChange(!value)
          }
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            value
              ? "bg-black"
              : "bg-gray-200"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
              value
                ? "left-6"
                : "left-1"
            }`}
          />
        </button>
      ) : (
        <span
          className={`flex shrink-0 items-center gap-1.5 text-xs font-bold ${
            value
              ? "text-emerald-600"
              : "text-gray-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              value
                ? "bg-emerald-500"
                : "bg-gray-300"
            }`}
          />

          {value ? "Yes" : "No"}
        </span>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}) {
  return (
    <div className="flex items-start justify-between gap-5 px-5 py-4 sm:px-6">
      <span className="shrink-0 text-xs font-medium text-gray-500">
        {label}
      </span>

      <span
        className={`max-w-[250px] break-all text-right text-xs font-semibold text-gray-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function InfoValue({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500">
        {label}
      </span>

      <strong className="text-sm text-gray-900">
        {value}
      </strong>
    </div>
  );
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}