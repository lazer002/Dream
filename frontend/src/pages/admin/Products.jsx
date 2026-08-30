// replace ProductList.jsx with this

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Boxes,
  Tag,
  Star,
  Percent,
} from "lucide-react";

import api from "@/utils/config";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const EMPTY_STOCK = {
  XS: 0,
  S: 0,
  M: 0,
  L: 0,
  XL: 0,
  XXL: 0,
};

export default function ProductList() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    oldPrice: "",
    category: "",
    published: true,
    onSale: false,
    isNewProduct: false,
    featured: false,
  });

  async function loadData() {
    try {
      setLoading(true);

      const [productsRes, inventoryRes, categoriesRes] =
        await Promise.all([
          api.get("/products"),
          api.get("/inventory"),
          api.get("/categories"),
        ]);

        console.log(productsRes.data?.items[0],'productsRes.data?.items')
      setProducts(
        productsRes.data?.items ||
          productsRes.data?.products ||
          productsRes.data ||
          []
      );

      setInventories(
        inventoryRes.data?.items ||
          inventoryRes.data?.inventories ||
          inventoryRes.data ||
          []
      );

      setCategories(
        categoriesRes.data?.categories ||
          categoriesRes.data?.items ||
          categoriesRes.data ||
          []
      );
    } catch (error) {
      console.error("LOAD PRODUCT DATA:", error);
      setMessage(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to load data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const inventoryMap = useMemo(() => {
    const map = new Map();

    inventories.forEach((inventory) => {
      const productId =
        inventory.product?._id ||
        inventory.product;

      if (productId) {
        map.set(String(productId), inventory);
      }
    });

    return map;
  }, [inventories]);

  function getInventory(product) {
    return (
      inventoryMap.get(String(product._id)) || {
        product: product._id,
        sku: product.sku || "",
        stock: EMPTY_STOCK,
        reserved: 0,
        lowStockThreshold: 5,
        trackInventory: true,
        allowBackorder: false,
        active: false,
      }
    );
  }

  function getTotalStock(inventory) {
    if (!inventory?.trackInventory) return Infinity;

    return SIZES.reduce(
      (total, size) =>
        total + Number(inventory?.stock?.[size] || 0),
      0
    );
  }

  function getAvailableStock(inventory) {
    if (!inventory?.trackInventory) return Infinity;

    return Math.max(
      0,
      getTotalStock(inventory) -
        Number(inventory?.reserved || 0)
    );
  }

  function getDiscount(product) {
    const price = Number(product.price || 0);
    const oldPrice = Number(product.oldPrice || 0);

    if (!oldPrice || oldPrice <= price) return 0;

    return Math.round(
      ((oldPrice - price) / oldPrice) * 100
    );
  }

  const stats = useMemo(() => {
    let totalStock = 0;
    let available = 0;
    let reserved = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let withoutInventory = 0;

    products.forEach((product) => {
      const inventory = inventoryMap.get(
        String(product._id)
      );

      if (!inventory) {
        withoutInventory++;
        return;
      }

      const total = getTotalStock(inventory);
      const availableStock =
        getAvailableStock(inventory);

      if (Number.isFinite(total)) {
        totalStock += total;
        available += availableStock;
        reserved += Number(
          inventory.reserved || 0
        );

        if (
          total > 0 &&
          total <=
            Number(
              inventory.lowStockThreshold ?? 5
            )
        ) {
          lowStock++;
        }

        if (availableStock <= 0) {
          outOfStock++;
        }
      }
    });

    return {
      products: products.length,
      totalStock,
      available,
      reserved,
      lowStock,
      outOfStock,
      withoutInventory,
    };
  }, [products, inventoryMap]);

  const filteredProducts = useMemo(() => {
    const query = search.toLowerCase().trim();

    return products.filter((product) => {
      const inventory = getInventory(product);

  const categoryName =
  product.category?.name || "—";

      const matchesSearch =
        !query ||
        product.title
          ?.toLowerCase()
          .includes(query) ||
        product.sku
          ?.toLowerCase()
          .includes(query) ||
        inventory.sku
          ?.toLowerCase()
          .includes(query) ||
        categoryName
          ?.toLowerCase()
          .includes(query) ||
        product.tags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );

const matchesCategory =
  categoryFilter === "all" ||
  String(product.category?.slug || "")
    .toLowerCase()
    === String(categoryFilter).toLowerCase();

      const available =
        getAvailableStock(inventory);

      const total =
        getTotalStock(inventory);

      let matchesStatus = true;

      if (statusFilter === "published") {
        matchesStatus = product.published;
      }

      if (statusFilter === "draft") {
        matchesStatus = !product.published;
      }

      if (statusFilter === "sale") {
        matchesStatus = product.onSale;
      }

      if (statusFilter === "new") {
        matchesStatus = product.isNewProduct;
      }

      if (statusFilter === "featured") {
        matchesStatus = product.featured;
      }

      if (statusFilter === "low") {
        matchesStatus =
          inventory?.trackInventory &&
          total > 0 &&
          total <=
            Number(
              inventory.lowStockThreshold ?? 5
            );
      }

      if (statusFilter === "out") {
        matchesStatus =
          inventory?.trackInventory &&
          available <= 0;
      }

      if (statusFilter === "missing-inventory") {
        matchesStatus =
          !inventoryMap.has(String(product._id));
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    inventories,
    categories,
    search,
    categoryFilter,
    statusFilter,
    inventoryMap,
  ]);

  function handleEdit(product) {
    setEditing(product);

setForm({
  title: product.title || "",
  description: product.description || "",
  details: product.details || "",
  price: product.price ?? "",
  oldPrice: product.oldPrice ?? "",
  category: String(
    product.category?._id ||
    product.category ||
    ""
  ),
  published: Boolean(product.published),
  onSale: Boolean(product.onSale),
  isNewProduct: Boolean(product.isNewProduct),
  featured: Boolean(product.featured),
});

    setOpen(true);
  }

  async function saveProduct() {
    if (!editing) return;

    try {
      setSaving(true);

      const price = Number(form.price);
      const oldPrice =
        form.oldPrice === ""
          ? undefined
          : Number(form.oldPrice);

      const discount =
        oldPrice &&
        oldPrice > price
          ? Number(
              (
                ((oldPrice - price) /
                  oldPrice) *
                100
              ).toFixed(2)
            )
          : 0;

      await api.put(
        `/admin/products/${editing._id}`,
        {
          title: form.title.trim(),
          description: form.description,
          details:form.details,
          price,
          oldPrice,
          discount,
          category: form.category,
          published: Boolean(form.published),
          onSale: Boolean(form.onSale),
          isNewProduct: Boolean(
            form.isNewProduct
          ),
          featured: Boolean(form.featured),
        }
      );

      setMessage("Product updated");

      setOpen(false);
      setEditing(null);

      await loadData();
    } catch (error) {
      console.error("UPDATE PRODUCT:", error);

      setMessage(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateInventory(
    productId,
    updates
  ) {
    try {
      await api.put(
        `/inventory/product/${productId}`,
        updates
      );

      await loadData();
    } catch (error) {
      console.error(
        "UPDATE INVENTORY:",
        error
      );

      setMessage(
        error?.response?.data?.error ||
          "Failed to update inventory"
      );
    }
  }

  async function confirmDelete() {
    try {
      await api.delete(
        `/admin/products/${deleteId}`
      );

      setDeleteOpen(false);
      setDeleteId(null);

      await loadData();
    } catch (error) {
      console.error(
        "DELETE PRODUCT:",
        error
      );
    }
  }
const sizes =
  editing?.sizes?.map((size) =>
    typeof size === "string"
      ? size
      : size.name
  ) || [];
  const categoryOptions = categories;

const openProduct = (product) => {
  if (product?.publicId) {
    navigate(`/admin/products/${product.publicId}`);
  }
};



  return (
    <div className="w-full space-y-6">
      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Products
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage products, pricing, inventory,
            visibility and sales status.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {message && (
        <div className="border border-gray-200 bg-gray-50 rounded-lg px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        <Stat
          icon={Package}
          label="Products"
          value={stats.products}
        />

        <Stat
          icon={Boxes}
          label="Total Stock"
          value={stats.totalStock}
        />

        <Stat
          icon={CheckCircle2}
          label="Available"
          value={stats.available}
        />

        <Stat
          icon={Package}
          label="Reserved"
          value={stats.reserved}
        />

        <Stat
          icon={TrendingDown}
          label="Low Stock"
          value={stats.lowStock}
          danger={stats.lowStock > 0}
        />

        <Stat
          icon={XCircle}
          label="Out of Stock"
          value={stats.outOfStock}
          danger={stats.outOfStock > 0}
        />

        <Stat
          icon={AlertTriangle}
          label="No Inventory"
          value={stats.withoutInventory}
          danger={stats.withoutInventory > 0}
        />
      </div>

      {/* FILTERS */}

      <Card >
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

              <Input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search title, SKU, category, tags..."
                className="pl-10 border border-gray-200"
              />
            </div>

         <Select
  value={categoryFilter}
  onValueChange={setCategoryFilter}
>
  <SelectTrigger className="border border-gray-200">
    <SelectValue placeholder="Category" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem value="all">
      All Categories
    </SelectItem>

{categoryOptions.map((category) => (
  <SelectItem
    key={category._id}
    value={category.slug}
  >
    {category.name}
  </SelectItem>
))}
  </SelectContent>
</Select>

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="border border-gray-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Products
                </SelectItem>

                <SelectItem value="published">
                  Published
                </SelectItem>

                <SelectItem value="draft">
                  Draft
                </SelectItem>

                <SelectItem value="sale">
                  On Sale
                </SelectItem>

                <SelectItem value="new">
                  New Products
                </SelectItem>

                <SelectItem value="featured">
                  Featured
                </SelectItem>

                <SelectItem value="low">
                  Low Stock
                </SelectItem>

                <SelectItem value="out">
                  Out of Stock
                </SelectItem>

                <SelectItem value="missing-inventory">
                  Missing Inventory
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Showing {filteredProducts.length} of{" "}
            {products.length} products
          </div>
        </CardContent>
      </Card>

      {/* PRODUCT TABLE */}

      <Card  data-lenis-prevent>
        <CardHeader>
          <CardTitle>
            Product Catalog
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-20 flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px]">
                <thead>
                  <tr className="border-b text-xs uppercase text-gray-500">
                    <th className="text-left px-4 py-4">
                      Product
                    </th>

                    <th className="text-left px-4 py-4">
                      SKU
                    </th>

                    <th className="text-left px-4 py-4">
                      Price
                    </th>

                    <th className="text-left px-4 py-4">
                      Discount
                    </th>

                    <th className="text-left px-4 py-4">
                      Inventory
                    </th>

                    <th className="text-left px-4 py-4">
                      Sizes
                    </th>

                    <th className="text-left px-4 py-4">
                      Category
                    </th>

                    <th className="text-left px-4 py-4">
                      Tags
                    </th>

                    <th className="text-left px-4 py-4">
                      Flags
                    </th>

                    <th className="text-left px-4 py-4">
                      Status
                    </th>

                    <th className="text-right px-4 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map(
                    (product) => {
                      const inventory =
                        getInventory(product);

                      const total =
                        getTotalStock(
                          inventory
                        );

                      const available =
                        getAvailableStock(
                          inventory
                        );

                      const discount =
                        getDiscount(product);

                      const categoryName =
                      product.category?.name || "—";

                      const low =
                        inventory?.trackInventory &&
                        total > 0 &&
                        total <=
                          Number(
                            inventory.lowStockThreshold ??
                              5
                          );

                      const out =
                        inventory?.trackInventory &&
                        available <= 0;

                        const sizes =
                          product?.sizes?.map((size) =>
                            typeof size === "string"
                              ? size
                              : size.name
                          ) || [];

                      return (
                        <tr
                          key={product._id}
                          onClick={() => openProduct(product)}
                          className="border-b hover:bg-gray-50 "
                        >
                          {/* PRODUCT */}

                         <td
    className="px-4 py-4 cursor-pointer group"
    onClick={() => openProduct(product)}
  >
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                {product.images?.[0] ? (
                                  <img
                                    src={
                                      product.images[0]
                                    }
                                    alt={
                                      product.title
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 m-auto mt-4 text-gray-300" />
                                )}
                              </div>

                              <div className="min-w-[220px]">
                                <p className="font-semibold">
                                  {product.title}
                                </p>

                                <p className="text-xs text-gray-500 mt-1">
                                  {product.slug}
                                </p>

                                <p className="text-xs text-gray-400 mt-1">
                                  {product.currency ||
                                    "INR"}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* SKU */}

                          <td className="px-4 py-4">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {inventory.sku ||
                                product.sku ||
                                "—"}
                            </code>
                          </td>

                          {/* PRICE */}

                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold">
                                ₹
                                {Number(
                                  product.price
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </p>

                              {product.oldPrice && (
                                <p className="text-xs text-gray-400 line-through">
                                  ₹
                                  {Number(
                                    product.oldPrice
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* DISCOUNT */}

                          <td className="px-4 py-4">
                            {discount > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-semibold">
                                <Percent className="h-3 w-3" />
                                {discount}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">
                                0%
                              </span>
                            )}
                          </td>

                          {/* INVENTORY */}

                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="flex gap-2">
                                <span className="text-xs text-gray-500">
                                  Total
                                </span>

                                <span className="text-sm font-semibold">
                                  {Number.isFinite(
                                    total
                                  )
                                    ? total
                                    : "∞"}
                                </span>
                              </div>

                              <div className="flex gap-2">
                                <span className="text-xs text-gray-500">
                                  Available
                                </span>

                                <span
                                  className={`text-sm font-semibold ${
                                    out
                                      ? "text-red-600"
                                      : low
                                      ? "text-orange-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {Number.isFinite(
                                    available
                                  )
                                    ? available
                                    : "∞"}
                                </span>
                              </div>

                              <div className="text-xs text-gray-500">
                                Reserved:{" "}
                                {inventory.reserved ||
                                  0}
                              </div>

                              {low && (
                                <span className="text-[11px] text-orange-600 font-medium">
                                  Low stock
                                </span>
                              )}

                              {out && (
                                <span className="text-[11px] text-red-600 font-medium">
                                  Out of stock
                                </span>
                              )}

                              {!inventoryMap.has(
                                String(
                                  product._id
                                )
                              ) && (
                                <span className="text-[11px] text-red-600 font-medium">
                                  Inventory missing
                                </span>
                              )}
                            </div>
                          </td>

                          {/* SIZES */}

                        <td className="px-4 py-4">
  <div className="flex flex-wrap gap-1 max-w-[180px]">
    {sizes.map((size) => {
      const count = Number(
        inventory?.stock?.[size] ??
        inventory?.stock?.get?.(size) ??
        0
      );

      return (
        <span
          key={size}
          className={`px-1.5 py-1 rounded text-[10px] font-medium ${
            count > 0
              ? "bg-black text-white"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {size} {count}
        </span>
      );
    })}
  </div>
</td>

                          {/* CATEGORY */}

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs font-medium">
                              <Tag className="h-3 w-3" />
                              {categoryName}
                            </span>
                          </td>

                          {/* TAGS */}

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {product.tags?.length ? (
                                product.tags.map(
                                  (tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 bg-gray-100 rounded text-[10px]"
                                    >
                                      #{tag}
                                    </span>
                                  )
                                )
                              ) : (
                                <span className="text-xs text-gray-400">
                                  No tags
                                </span>
                              )}
                            </div>
                          </td>

                          {/* FLAGS */}

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {product.onSale && (
                                <Badge>
                                  Sale
                                </Badge>
                              )}

                              {product.isNewProduct && (
                                <Badge>
                                  New
                                </Badge>
                              )}

                              {product.featured && (
                                <Badge>
                                  <Star className="h-3 w-3" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4">
                            {product.published ? (
                              <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Published
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                                <XCircle className="h-4 w-4" />
                                Draft
                              </span>
                            )}

                            <p className="text-[10px] text-gray-400 mt-1">
                              {new Date(
                                product.createdAt
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </p>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() =>
                                  (window.location.href =
                                    `/product/${product.publicId}`)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                           <Button
  size="icon"
  variant="outline"
  onClick={(e) => {
    e.stopPropagation();
    handleEdit(product);
  }}
>
                                <Pencil className="h-4 w-4" />
                              </Button>

                              <Button
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteId(
                                    product._id
                                  );
                                  setDeleteOpen(
                                    true
                                  );
                                }}
                                className="bg-black text-white hover:bg-gray-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!loading &&
            filteredProducts.length === 0 && (
              <div className="py-16 text-center">
                <Package className="mx-auto h-10 w-10 text-gray-300" />

                <p className="font-medium mt-3">
                  No products found
                </p>

                <p className="text-sm text-gray-500">
                  Try changing your search or
                  filters.
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* EDIT */}

   <Dialog
  open={open}
  onOpenChange={setOpen}
>
  <DialogContent className="max-w-fit w-full max-h-[90vh] overflow-y-auto px-4">
    <DialogHeader>
      <DialogTitle>
        Edit Product
      </DialogTitle>
    </DialogHeader>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-4">
      {/* LEFT */}
      <div className="space-y-6">

        {/* BASIC INFORMATION */}
        <section className="space-y-4">
          <h3 className="font-semibold">
            Basic Information
          </h3>

          <div className="space-y-2">
            <Label>Title</Label>

            <Input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              className="border border-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (₹)</Label>

              <Input
                type="number"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
                className="border border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <Label>Old Price (₹)</Label>

              <Input
                type="number"
                value={form.oldPrice}
                onChange={(e) =>
                  setForm({
                    ...form,
                    oldPrice: e.target.value,
                  })
                }
                className="border border-gray-300"
              />
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 border p-4">
            <p className="text-xs text-gray-500">
              Calculated Discount
            </p>

            <p className="text-2xl font-bold mt-1">
              {getDiscount({
                price: form.price,
                oldPrice: form.oldPrice,
              })}
              %
            </p>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <Label>Description</Label>

            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
              className="min-h-[220px] border border-gray-300"
            />
          </div>

          {/* PRODUCT DETAILS */}
          <div className="space-y-2">
            <Label>Product Details</Label>

            <Textarea
              value={form.details || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  details: e.target.value,
                })
              }
              placeholder="Enter product details..."
              className="min-h-[180px] border border-gray-300"
            />

            <p className="text-xs text-gray-500">
              HTML is supported.
            </p>
          </div>
        </section>

        {/* CATEGORY */}
        <section className="space-y-4">
          <h3 className="font-semibold">
            Category
          </h3>
<Select
  value={String(form.category?._id || form.category || "")}
  onValueChange={(value) => {
    updateForm("category", value);
  }}
>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>

  <SelectContent>
    {categories.map((category) => (
      <SelectItem
        key={category._id}
        value={String(category._id)}
      >
        {category.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
        </section>
      </div>

      {/* RIGHT */}
      <div className="space-y-6">

        {/* INVENTORY */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              Inventory
            </h3>

            {editing && (
              <span className="text-sm text-gray-500">
                Available:{" "}
                {getAvailableStock(
                  getInventory(editing)
                )}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sizes.map((size) => {
              const inventory = editing
                ? getInventory(editing)
                : null;

              const value = Number(
                inventory?.stock?.[size] ??
                  inventory?.stock?.get?.(size) ??
                  0
              );

              return (
                <div
                  key={size}
                  className="border rounded-lg p-3"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">
                      {size}
                    </span>

                    <span className="text-xs text-gray-400">
                      units
                    </span>
                  </div>

                  <Input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => {
                      if (!editing) return;

                      const next = Math.max(
                        0,
                        Number(e.target.value) || 0
                      );

                      setInventories((current) =>
                        current.map((item) =>
                          String(
                            item.product?._id ||
                              item.product
                          ) === String(editing._id)
                            ? {
                                ...item,
                                stock: {
                                  ...(item.stock || {}),
                                  [size]: next,
                                },
                              }
                            : item
                        )
                      );
                    }}
                    onBlur={async (e) => {
                      if (!editing) return;

                      const inventory =
                        getInventory(editing);

                      const next = Math.max(
                        0,
                        Number(e.target.value) || 0
                      );

                      await updateInventory(
                        editing._id,
                        {
                          stock: {
                            ...(inventory?.stock || {}),
                            [size]: next,
                          },
                        }
                      );
                    }}
                    className="border border-gray-300"
                  />
                </div>
              );
            })}
          </div>

          {editing && (
            <div className="grid grid-cols-3 gap-3">
              <InfoBox
                label="Total"
                value={getTotalStock(
                  getInventory(editing)
                )}
              />

              <InfoBox
                label="Reserved"
                value={
                  getInventory(editing)
                    .reserved || 0
                }
              />

              <InfoBox
                label="Available"
                value={getAvailableStock(
                  getInventory(editing)
                )}
              />
            </div>
          )}
        </section>

        {/* STATUS */}
        <section className="space-y-3">
          <h3 className="font-semibold">
            Product Flags
          </h3>

          {[
            ["published", "Published"],
            ["onSale", "On Sale"],
            ["isNewProduct", "New Product"],
            ["featured", "Featured"],
          ].map(([key, label]) => (
            <div
              key={key}
              className="flex items-center justify-between border rounded-lg p-4"
            >
              <Label>{label}</Label>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    [key]: !form[key],
                  })
                }
                className={`w-11 h-6 rounded-full p-1 ${
                  form[key]
                    ? "bg-black"
                    : "bg-gray-300"
                }`}
              >
                <span
                  className={`block h-4 w-4 bg-white rounded-full transition ${
                    form[key]
                      ? "translate-x-5"
                      : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setOpen(false)}
      >
        Cancel
      </Button>

      <Button
        disabled={saving}
        onClick={saveProduct}
        className="bg-black text-white hover:bg-gray-800"
      >
        {saving
          ? "Saving..."
          : "Save Changes"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* DELETE */}

      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Delete Product
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500">
            This will permanently delete the
            product. Continue?
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setDeleteOpen(false)
              }
            >
              Cancel
            </Button>

            <Button
              onClick={confirmDelete}
              className="bg-black text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  danger,
}) {
  return (
    <Card
      className={
        danger
          ? "border-red-200"
          : "border-gray-200"
      }
    >
      <CardContent className="p-4">
        <div className="flex justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500">
              {label}
            </p>

            <p
              className={`text-xl font-bold mt-1 ${
                danger
                  ? "text-red-600"
                  : ""
              }`}
            >
              {value}
            </p>
          </div>

          <Icon
            className={`h-5 w-5 ${
              danger
                ? "text-red-500"
                : "text-gray-400"
            }`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="text-xl font-bold mt-1">
        {value}
      </p>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-[10px] font-medium">
      {children}
    </span>
  );
}