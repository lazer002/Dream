import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import api from "@/utils/config";
import { Link, useNavigate } from "react-router-dom";
import {
  Pencil,
  Trash2,
  Search,
  Package,
  ImagePlus,
  X,
  Check,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ShowBundle() {
  const navigate = useNavigate()
  const [bundles, setBundles] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editBundle, setEditBundle] = useState(null);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [images, setImages] = useState([]);

  const [productSearch, setProductSearch] = useState("");
  const [bundleSearch, setBundleSearch] = useState("");

  const fetchBundles = async () => {
    try {
      setLoading(true);

      const res = await api.get("/bundles");

      setBundles(res.data.items || []);
    } catch (err) {
      console.error("Error fetching bundles:", err);
      toast.error("Failed to load bundles");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products", {
        params: {
          limit: 100,
        },
      });

      setAllProducts(res.data.items || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      toast.error("Failed to load products");
    }
  };

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, []);

  const filteredBundles = useMemo(() => {
    const query = bundleSearch.trim().toLowerCase();

    if (!query) return bundles;

    return bundles.filter((bundle) =>
      bundle.title?.toLowerCase().includes(query)
    );
  }, [bundles, bundleSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    const products = [...allProducts].sort((a, b) => {
      const aSelected = selectedProducts.includes(a._id);
      const bSelected = selectedProducts.includes(b._id);

      if (aSelected && !bSelected) return -1;
      if (!aSelected && bSelected) return 1;

      return 0;
    });

    if (!query) return products;

    return products.filter((product) =>
      product.title?.toLowerCase().includes(query)
    );
  }, [
    allProducts,
    productSearch,
    selectedProducts,
  ]);

  const deleteBundle = async (id) => {
    if (!confirm("Are you sure you want to delete this bundle?")) {
      return;
    }

    try {
      await api.delete(`/bundles/${id}`);

      setBundles((prev) =>
        prev.filter((bundle) => bundle._id !== id)
      );

      toast.success("Bundle deleted");
    } catch (err) {
      console.error("Failed to delete:", err);

      toast.error(
        err?.response?.data?.error ||
          "Failed to delete bundle"
      );
    }
  };

  const openEdit = (bundle) => {
    setEditBundle({
      ...bundle,

      title: bundle.title || "",
      description: bundle.description || "",
      price: bundle.price ?? "",
      oldPrice: bundle.oldPrice ?? "",
      discount: bundle.discount ?? 0,

      category:
        typeof bundle.category === "object"
          ? bundle.category?._id || ""
          : bundle.category || "",

      tags: Array.isArray(bundle.tags)
        ? bundle.tags.join(", ")
        : "",

      active:
        bundle.active !== false,

      published:
        bundle.published !== false,

      featured:
        bundle.featured === true,

      isNewBundle:
        bundle.isNewBundle === true,

      onSale:
        bundle.onSale === true,
    });

    setSelectedProducts(
      (bundle.products || []).map((product) =>
        typeof product === "object"
          ? product._id
          : product
      )
    );

    setImages(
      (bundle.mainImages || []).map((url) => ({
        preview: url,
        existing: true,
      }))
    );

    setProductSearch("");
  };

  const closeEdit = () => {
    if (saving) return;

    setEditBundle(null);
    setSelectedProducts([]);
    setImages([]);
    setProductSearch("");
  };

  const handleProductToggle = (id) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((pid) => pid !== id)
        : [...prev, id]
    );
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      existing: false,
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

  const calculateProductTotal = () => {
    return selectedProducts.reduce(
      (total, id) => {
        const product = allProducts.find(
          (p) => p._id === id
        );

        return (
          total + Number(product?.price || 0)
        );
      },
      0
    );
  };

  const calculatedOldPrice = useMemo(() => {
    if (!editBundle) return 0;

    if (
      editBundle.oldPrice !== "" &&
      editBundle.oldPrice !== null &&
      editBundle.oldPrice !== undefined
    ) {
      return Number(editBundle.oldPrice) || 0;
    }

    return calculateProductTotal();
  }, [
    editBundle,
    selectedProducts,
    allProducts,
  ]);

  const calculatedDiscount = useMemo(() => {
    if (!editBundle) return 0;

    const oldPrice =
      Number(calculatedOldPrice) || 0;

    const price =
      Number(editBundle.price) || 0;

    if (oldPrice <= 0 || price >= oldPrice) {
      return 0;
    }

    return Math.round(
      ((oldPrice - price) / oldPrice) * 100
    );
  }, [
    editBundle,
    calculatedOldPrice,
  ]);

  const handleSave = async () => {
    if (!editBundle) return;

    if (!editBundle.title?.trim()) {
      toast.error("Bundle title is required");
      return;
    }

    if (!selectedProducts.length) {
      toast.error(
        "Select at least one product"
      );
      return;
    }

    try {
      setSaving(true);

      const imageUrls = [];

      const existingImages = images
        .filter(
          (image) =>
            image.existing && !image.file
        )
        .map((image) => image.preview);

      imageUrls.push(...existingImages);

      const newFiles = images.filter(
        (image) => image.file
      );

      if (newFiles.length) {
        const formData = new FormData();

        newFiles.forEach((image) => {
          formData.append("files", image.file);
        });

        const uploadResponse =
          await api.post(
            "/admin/upload/images",
            formData
          );

        imageUrls.push(
          ...(uploadResponse.data.images || []).map(
            (image) => image.url
          )
        );
      }

      const oldPrice =
        Number(calculatedOldPrice) || 0;

      const price =
        Number(editBundle.price) || 0;

      const discount =
        oldPrice > price && oldPrice > 0
          ? Math.round(
              ((oldPrice - price) /
                oldPrice) *
                100
            )
          : 0;

      const tags = String(
        editBundle.tags || ""
      )
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await api.put(
        `/bundles/${editBundle._id}`,
        {
          title:
            editBundle.title.trim(),

          description:
            editBundle.description || "",

          products:
            selectedProducts,

          category:
            editBundle.category || "",

          tags,

          mainImages:
            imageUrls,

          price,

          oldPrice,

          discount,

          onSale:
            oldPrice > price,

          active:
            editBundle.active !== false,

          published:
            editBundle.published !== false,

          featured:
            editBundle.featured === true,

          isNewBundle:
            editBundle.isNewBundle === true,
        }
      );

      toast.success(
        "Bundle updated successfully"
      );

      closeEdit();

      await fetchBundles();
    } catch (err) {
      console.error(
        "Failed to update bundle:",
        err
      );

      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Failed to update bundle"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] p-6">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 rounded bg-gray-200" />
            <div className="h-12 rounded-xl bg-gray-200" />
            <div className="h-96 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#f7f7f5]"
      data-lenis-prevent
    >
      <div className="mx-auto max-w-auto space-y-6 p-4 md:p-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                <Package className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-black">
                  Product Bundles
                </h1>

                <p className="text-sm text-gray-500">
                  Manage your product bundles
                </p>
              </div>
            </div>
          </div>

          <Button
            asChild
            className="h-11 rounded-xl bg-black px-5 text-white hover:bg-gray-800"
          >
            <Link to="/admin/new/bundles">
              + Create Bundle
            </Link>
          </Button>
        </div>

        {/* SEARCH */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <Input
            value={bundleSearch}
            onChange={(e) =>
              setBundleSearch(e.target.value)
            }
            placeholder="Search bundles..."
            className="h-11 border-gray-300 bg-white pl-10"
          />
        </div>

        {/* TABLE */}
      {/* TABLE */}
<div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
  <div className="overflow-x-auto">
    <Table className="min-w-[1400px]">
      <TableHeader>
        <TableRow className="bg-gray-50">
          <TableHead className="w-[90px]">
            Image
          </TableHead>

          <TableHead>
            Bundle
          </TableHead>

          <TableHead>
            Products
          </TableHead>

          <TableHead>
            Pricing
          </TableHead>

          <TableHead>
            Discount
          </TableHead>

          <TableHead>
            Tags
          </TableHead>

          <TableHead>
            Status
          </TableHead>

          <TableHead>
            Visibility
          </TableHead>

          <TableHead>
            Created
          </TableHead>

          <TableHead className="text-right">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {filteredBundles.length > 0 ? (
          filteredBundles.map((bundle) => {
            const oldPrice =
              Number(bundle.oldPrice || 0);

            const price =
              Number(bundle.price || 0);

            const calculatedDiscount =
              oldPrice > price && oldPrice > 0
                ? Math.round(
                    ((oldPrice - price) /
                      oldPrice) *
                      100
                  )
                : 0;

            const discount =
              bundle.discount ??
              calculatedDiscount;

            const productCount =
              bundle.products?.length || 0;

            const imageCount =
              bundle.mainImages?.length || 0;

            const category =
              typeof bundle.category ===
              "object"
                ? bundle.category?.name
                : bundle.category;

            return (
              <TableRow
                key={bundle._id}
                className="align-top hover:bg-gray-50"
              >
                {/* IMAGE */}
                <TableCell>
                  <div className="relative">
                    {bundle.mainImages?.[0] ? (
                      <img
                        src={bundle.mainImages[0]}
                        alt={bundle.title}
                        className="h-16 w-16 rounded-xl border object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-100">
                        <Package className="h-6 w-6 text-gray-300" />
                      </div>
                    )}

                    {imageCount > 1 && (
                      <span className="absolute -bottom-1 -right-1 rounded-full bg-black px-1.5 py-0.5 text-[9px] font-semibold text-white">
                        +{imageCount - 1}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* BUNDLE */}
                <TableCell >
                  <div className="w-[240px]">
                    <p className="font-semibold text-black">
                      {bundle.title || "Untitled Bundle"}
                    </p>

                    {category && (
                      <p className="mt-1 text-xs font-medium capitalize text-gray-500">
                        {category}
                      </p>
                    )}

                    {bundle.description && (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-gray-400">
                        {bundle.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1">
                      {bundle.featured && (
                        <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold text-white">
                          Featured
                        </span>
                      )}

                      {bundle.isNewBundle && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          New
                        </span>
                      )}

                      {bundle.onSale && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          Sale
                        </span>
                      )}

                      {bundle.isOutOfStock && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                          Out of Stock
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* PRODUCTS */}
                <TableCell>
                  <div className="w-[280px]">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                        {productCount}{" "}
                        {productCount === 1
                          ? "Product"
                          : "Products"}
                      </span>
                    </div>

              <div className="space-y-2">
  {bundle.products?.slice(0, 5).map((product) => (
    <div
      key={product._id}
      onClick={() =>
        navigate(`/admin/products/${product.publicId}`)
      }
      className="flex items-center gap-2 cursor-pointer hover:underline"
    >
      {product.images?.[0] ? (
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-9 w-9 rounded-lg border object-cover"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
          <Package className="h-4 w-4 text-gray-300" />
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-800">
          {product.title}
        </p>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500">
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </span>

          {product.isOutOfStock && (
            <span className="text-[10px] font-medium text-red-500">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </div>
  ))}

  {productCount > 5 && (
    <span className="text-xs font-medium text-gray-400">
      +{productCount - 5} more products
    </span>
  )}
</div>
                  </div>
                </TableCell>

                {/* PRICING */}
                <TableCell>
                  <div className="min-w-[130px]">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-black">
                        ₹
                        {price.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>

                    {oldPrice > price && (
                      <span className="text-xs text-gray-400 line-through">
                        ₹
                        {oldPrice.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    )}

                    <p className="mt-1 text-[11px] text-gray-400">
                      {bundle.currency || "INR"}
                    </p>
                  </div>
                </TableCell>

                {/* DISCOUNT */}
                <TableCell>
                  <div className="min-w-[100px]">
                    {discount > 0 ? (
                      <>
                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                          {discount}% OFF
                        </span>

                        <p className="mt-1 text-[11px] text-gray-400">
                          Save ₹
                          {Math.max(
                            0,
                            oldPrice - price
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No discount
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* TAGS */}
                <TableCell>
                  <div className="flex w-[180px] flex-wrap gap-1">
                    {bundle.tags?.length ? (
                      bundle.tags
                        .slice(0, 6)
                        .map((tag, index) => (
                          <span
                            key={`${tag}-${index}`}
                            className="rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600"
                          >
                            #{tag}
                          </span>
                        ))
                    ) : (
                      <span className="text-xs text-gray-400">
                        No tags
                      </span>
                    )}

                    {bundle.tags?.length > 6 && (
                      <span className="text-[10px] text-gray-400">
                        +{bundle.tags.length - 6}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* ACTIVE STATUS */}
                <TableCell>
                  <div className="flex flex-col gap-2">
                    <span
                      className={`
                        inline-flex w-fit items-center gap-1.5
                        rounded-full px-2.5 py-1
                        text-xs font-medium
                        ${
                          bundle.active !== false
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      `}
                    >
                      {bundle.active !== false ? (
                        <>
                          <Eye className="h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Inactive
                        </>
                      )}
                    </span>

                    {bundle.isOutOfStock ? (
                      <span className="text-[10px] font-medium text-red-500">
                        Out of Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-green-600">
                        In Stock
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* VISIBILITY */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`text-xs font-medium ${
                        bundle.published !== false
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      {bundle.published !== false
                        ? "Published"
                        : "Draft"}
                    </span>

                    <span className="text-[10px] text-gray-400">
                      {bundle.featured
                        ? "Featured"
                        : "Standard"}
                    </span>
                  </div>
                </TableCell>

                {/* CREATED */}
                <TableCell>
                  <div className="min-w-[110px]">
                    {bundle.createdAt ? (
                      <>
                        <p className="text-xs font-medium text-gray-700">
                          {new Date(
                            bundle.createdAt
                          ).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          {new Date(
                            bundle.createdAt
                          ).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">
                        —
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* ACTIONS */}
                <TableCell>
                  <div className="flex justify-end gap-2">
                       <Button
                      variant="outline"
                      size="sm"
                        onClick={() =>
        navigate(
          `/admin/bundles/${bundle.publicId}`
        )
      }
                      className="h-9 w-9 rounded-lg p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        openEdit(bundle)
                      }
                      className="h-9 w-9 rounded-lg p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        deleteBundle(bundle._id)
                      }
                      className="h-9 w-9 rounded-lg border-red-200 p-0 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={10}
              className="py-16 text-center"
            >
              <Package className="mx-auto mb-3 h-8 w-8 text-gray-300" />

              <p className="font-medium text-gray-600">
                No bundles found
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Create your first bundle to
                get started.
              </p>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
</div>

        {/* EDIT MODAL */}
        <Dialog
          open={!!editBundle}
          onOpenChange={(open) => {
            if (!open) closeEdit();
          }}
        >
          <DialogContent className="flex max-h-[92vh] w-[96vw] max-w-6xl flex-col overflow-hidden rounded-2xl p-0">
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
                <Pencil className="h-5 w-5" />
                Edit Bundle
              </DialogTitle>

              <p className="text-sm text-gray-500">
                Update pricing, products, images and
                bundle visibility.
              </p>
            </DialogHeader>

            {editBundle && (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  {/* LEFT */}
                  <div className="space-y-6">
                    {/* BASIC */}
                    <section className="rounded-2xl border border-gray-200 p-5">
                      <div className="mb-5">
                        <h3 className="font-semibold text-black">
                          Bundle Information
                        </h3>
                      </div>

                      <div className="space-y-5">
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Title
                          </label>

                          <Input
                            value={
                              editBundle.title
                            }
                            onChange={(e) =>
                              setEditBundle(
                                (prev) => ({
                                  ...prev,
                                  title:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            className="h-11"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Description
                          </label>

                          <Textarea
                            value={
                              editBundle.description ||
                              ""
                            }
                            onChange={(e) =>
                              setEditBundle(
                                (prev) => ({
                                  ...prev,
                                  description:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            rows={4}
                            className="resize-none"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Category
                            </label>

                            <Input
                              value={
                                editBundle.category ||
                                ""
                              }
                              onChange={(e) =>
                                setEditBundle(
                                  (prev) => ({
                                    ...prev,
                                    category:
                                      e.target
                                        .value,
                                  })
                                )
                              }
                              placeholder="hoodie"
                              className="h-11"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium">
                              Tags
                            </label>

                            <Input
                              value={
                                editBundle.tags ||
                                ""
                              }
                              onChange={(e) =>
                                setEditBundle(
                                  (prev) => ({
                                    ...prev,
                                    tags:
                                      e.target
                                        .value,
                                  })
                                )
                              }
                              placeholder="combo, streetwear, sale"
                              className="h-11"
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* IMAGES */}
                    <section className="rounded-2xl border border-gray-200 p-5">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            Bundle Images
                          </h3>

                          <p className="text-sm text-gray-500">
                            Add or remove bundle images.
                          </p>
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800">
                          <ImagePlus className="h-4 w-4" />
                          Add Images

                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={
                              handleImageUpload
                            }
                            className="hidden"
                          />
                        </label>
                      </div>

                      {images.length ? (
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                          {images.map(
                            (image, index) => (
                              <div
                                key={`${image.preview}-${index}`}
                                className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200"
                              >
                                <img
                                  src={
                                    image.preview
                                  }
                                  alt={`Bundle ${index + 1}`}
                                  className="h-full w-full object-cover"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeImage(
                                      index
                                    )
                                  }
                                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/80 text-white opacity-0 transition group-hover:opacity-100"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center">
                          <ImagePlus className="mx-auto mb-2 h-7 w-7 text-gray-300" />

                          <p className="text-sm text-gray-500">
                            No images
                          </p>
                        </div>
                      )}
                    </section>

                    {/* PRODUCTS */}
                    <section className="rounded-2xl border border-gray-200 p-5">
                      <div className="mb-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              Included Products
                            </h3>

                            <p className="text-sm text-gray-500">
                              Select products included in
                              this bundle.
                            </p>
                          </div>

                          <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                            {
                              selectedProducts.length
                            }{" "}
                            selected
                          </span>
                        </div>

                        <div className="relative mt-4">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                          <Input
                            value={
                              productSearch
                            }
                            onChange={(e) =>
                              setProductSearch(
                                e.target
                                  .value
                              )
                            }
                            placeholder="Search products..."
                            className="h-11 pl-10"
                          />
                        </div>
                      </div>

                      <div className="grid max-h-[440px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                        {filteredProducts.map(
                          (product) => {
                            const isSelected =
                              selectedProducts.includes(
                                product._id
                              );

                            return (
                              <button
                                key={
                                  product._id
                                }
                                type="button"
                                onClick={() =>
                                  handleProductToggle(
                                    product._id
                                  )
                                }
                                className={`
                                  relative overflow-hidden rounded-xl border text-left transition
                                  ${
                                    isSelected
                                      ? "border-black ring-1 ring-black"
                                      : "border-gray-200 hover:border-gray-400"
                                  }
                                `}
                              >
                                <div className="aspect-square bg-gray-100">
                                  <img
                                    src={
                                      product
                                        .images?.[0]
                                    }
                                    alt={
                                      product.title
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                </div>

                                {isSelected && (
                                  <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black text-white">
                                    <Check className="h-4 w-4" />
                                  </div>
                                )}

                                <div className="p-3">
                                  <p className="truncate text-sm font-semibold">
                                    {
                                      product.title
                                    }
                                  </p>

                                  <p className="mt-1 text-xs text-gray-500">
                                    ₹
                                    {Number(
                                      product.price ||
                                        0
                                    ).toLocaleString(
                                      "en-IN"
                                    )}
                                  </p>
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </section>
                  </div>

                  {/* RIGHT */}
                  <aside className="space-y-6">
                    {/* PRICING */}
                    <section className="rounded-2xl border border-gray-200 p-5">
                      <h3 className="mb-5 font-semibold">
                        Pricing
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Original Price
                          </label>

                          <Input
                            type="number"
                            min="0"
                            value={
                              editBundle.oldPrice
                            }
                            onChange={(e) =>
                              setEditBundle(
                                (prev) => ({
                                  ...prev,
                                  oldPrice:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            placeholder={String(
                              calculateProductTotal()
                            )}
                            className="h-11"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Bundle Price
                          </label>

                          <Input
                            type="number"
                            min="0"
                            value={
                              editBundle.price
                            }
                            onChange={(e) =>
                              setEditBundle(
                                (prev) => ({
                                  ...prev,
                                  price:
                                    e.target
                                      .value,
                                })
                              )
                            }
                            className="h-11"
                          />
                        </div>

                        <div className="rounded-xl bg-gray-50 p-4">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">
                              Products total
                            </span>

                            <span className="font-semibold">
                              ₹
                              {calculateProductTotal().toLocaleString(
                                "en-IN"
                              )}
                            </span>
                          </div>

                          <div className="mt-3 flex justify-between">
                            <span className="text-sm text-gray-500">
                              Discount
                            </span>

                            <span className="font-semibold text-green-600">
                              {Math.round(
                                calculatedDiscount
                              )}
                              % OFF
                            </span>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* STATUS */}
                    <section className="rounded-2xl border border-gray-200 p-5">
                      <h3 className="mb-4 font-semibold">
                        Visibility & Status
                      </h3>

                      <div className="space-y-2">
                        {[
                          {
                            key: "active",
                            label: "Active",
                            icon:
                              editBundle.active ? (
                                <Eye className="h-4 w-4" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              ),
                          },
                          {
                            key: "published",
                            label: "Published",
                            icon: (
                              <Eye className="h-4 w-4" />
                            ),
                          },
                          {
                            key: "featured",
                            label: "Featured",
                            icon: (
                              <Star className="h-4 w-4" />
                            ),
                          },
                          {
                            key: "isNewBundle",
                            label: "New Bundle",
                            icon: (
                              <Sparkles className="h-4 w-4" />
                            ),
                          },
                        ].map(
                          ({
                            key,
                            label,
                            icon,
                          }) => {
                            const value =
                              !!editBundle[key];

                            return (
                              <button
                                key={key}
                                type="button"
                                onClick={() =>
                                  setEditBundle(
                                    (prev) => ({
                                      ...prev,
                                      [key]:
                                        !prev[key],
                                    })
                                  )
                                }
                                className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition hover:bg-gray-50"
                              >
                                <span className="flex items-center gap-2 text-sm font-medium">
                                  {icon}
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
                            );
                          }
                        )}
                      </div>
                    </section>

                    {/* SELECTED */}
                    <section className="rounded-2xl border border-gray-200 p-5">
                      <h3 className="mb-4 font-semibold">
                        Selected Products
                      </h3>

                      <div className="space-y-2">
                        {selectedProducts
                          .map((id) =>
                            allProducts.find(
                              (product) =>
                                product._id ===
                                id
                            )
                          )
                          .filter(Boolean)
                          .map((product) => (
                            <div
                              key={
                                product._id
                              }
                              className="flex items-center gap-3 rounded-xl border border-gray-100 p-2"
                            >
                              <img
                                src={
                                  product
                                    .images?.[0]
                                }
                                alt={
                                  product.title
                                }
                                className="h-11 w-11 rounded-lg object-cover"
                              />

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {
                                    product.title
                                  }
                                </p>

                                <p className="text-xs text-gray-500">
                                  ₹
                                  {Number(
                                    product.price ||
                                      0
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  handleProductToggle(
                                    product._id
                                  )
                                }
                                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </section>
                  </aside>
                </div>
              </div>
            )}

            <DialogFooter className="border-t px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={closeEdit}
                disabled={saving}
                className="rounded-xl"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-black px-6 text-white hover:bg-gray-800"
              >
                {saving
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}