// src/pages/admin/Inventory.jsx

import { useMemo, useState } from "react";
import {
  Package,
  Search,
  RefreshCw,
  Plus,
  Minus,
  Save,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Boxes,
  TrendingDown,
  ShieldAlert,
  Edit3,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useGetInventoryQuery,
  useGetProductsQuery,
  useCreateInventoryMutation,
  useUpdateInventoryMutation,
} from "@/store/api";

/* =========================================================
   DEFAULT FORM
========================================================= */

const emptyInventory = {
  product: null,
  sku: "",
  stock: {},
  reserved: 0,
  lowStockThreshold: 5,
  trackInventory: true,
  allowBackorder: false,
  active: true,
};

/* =========================================================
   HELPERS
========================================================= */

function getSizeName(size) {
  if (typeof size === "string") {
    return size.trim();
  }

  return String(size?.name || "").trim();
}

function getProductSizes(product) {
  if (!Array.isArray(product?.sizes)) {
    return [];
  }

  return product.sizes
    .map(getSizeName)
    .filter(Boolean);
}

function getCleanStock(product, stock) {
  const source = stock || {};
  const sizes = getProductSizes(product);

  if (!sizes.length) {
    return { ...source };
  }

  const allowed = new Set(sizes);

  return Object.fromEntries(
    Object.entries(source).filter(([key]) =>
      allowed.has(key)
    )
  );
}

function getTotalStock(inventory, product) {
  if (!inventory) return 0;

  const stock = inventory.stock || {};
  const sizes = getProductSizes(product);

  if (sizes.length) {
    return sizes.reduce((total, size) => {
      return (
        total +
        Number(stock?.[size] || 0)
      );
    }, 0);
  }

  return Object.values(stock).reduce(
    (total, value) =>
      total + Number(value || 0),
    0
  );
}

function getAvailableStock(inventory, product) {
  if (!inventory) return 0;

  if (!inventory.trackInventory) {
    return Infinity;
  }

  const total = getTotalStock(
    inventory,
    product
  );

  const reserved = Number(
    inventory.reserved || 0
  );

  return Math.max(
    0,
    total - reserved
  );
}

function getStatus(
  inventory,
  product
) {
  if (!inventory) {
    return "not-created";
  }

  if (!inventory.active) {
    return "inactive";
  }

  if (!inventory.trackInventory) {
    return "untracked";
  }

  const total = getTotalStock(
    inventory,
    product
  );

  const available =
    getAvailableStock(
      inventory,
      product
    );

  const threshold = Number(
    inventory.lowStockThreshold ?? 5
  );

  if (available <= 0) {
    return "out";
  }

  if (
    total <= threshold &&
    total > 0
  ) {
    return "low";
  }

  return "healthy";
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
  danger = false,
}) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              {title}
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                danger
                  ? "text-red-600"
                  : "text-gray-950"
              }`}
            >
              {value}
            </p>
          </div>

          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              danger
                ? "bg-red-50 text-red-600"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {
  if (status === "not-created") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Not Created
      </span>
    );
  }

  if (status === "inactive") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
        <XCircle className="h-3.5 w-3.5" />
        Inactive
      </span>
    );
  }

  if (status === "out") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        Out of Stock
      </span>
    );
  }

  if (status === "low") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        Low Stock
      </span>
    );
  }

  if (status === "untracked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
        <Boxes className="h-3.5 w-3.5" />
        Untracked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Healthy
    </span>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminInventory() {
  const {
    data: inventoryData = [],
    isLoading: inventoryLoading,
    refetch: refetchInventory,
  } = useGetInventoryQuery();

  const {
    data: productsData,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useGetProductsQuery();

  const inventories = Array.isArray(
    inventoryData
  )
    ? inventoryData
    : inventoryData?.items ||
      inventoryData?.inventories ||
      [];

  const products = Array.isArray(
    productsData
  )
    ? productsData
    : productsData?.items ||
      productsData?.products ||
      [];

  const [
    createInventory,
    {
      isLoading: creatingInventory,
    },
  ] =
    useCreateInventoryMutation();

  const [
    updateInventory,
    {
      isLoading: updatingInventory,
    },
  ] =
    useUpdateInventoryMutation();

  const loading =
    inventoryLoading ||
    productsLoading;

  const saving =
    creatingInventory ||
    updatingInventory;

  const [search, setSearch] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  const [selected, setSelected] =
    useState(null);

  const [form, setForm] =
    useState(emptyInventory);

  const [message, setMessage] =
    useState("");

  /* =======================================================
     INVENTORY MAP
  ======================================================= */

  const inventoryMap = useMemo(() => {
    const map = new Map();

    inventories.forEach(
      (item) => {
        const productId =
          item.product?._id ||
          item.product;

        if (productId) {
          map.set(
            String(productId),
            item
          );
        }
      }
    );

    return map;
  }, [inventories]);

  /* =======================================================
     ROWS
  ======================================================= */

  const rows = useMemo(() => {
    return products.map(
      (product) => {
        const inventory =
          inventoryMap.get(
            String(product._id)
          ) || null;

        return {
          product,
          inventory,
        };
      }
    );
  }, [
    products,
    inventoryMap,
  ]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredRows =
    useMemo(() => {
      return rows.filter(
        ({
          product,
          inventory,
        }) => {
          const query =
            search
              .toLowerCase()
              .trim();

          const matchesSearch =
            !query ||
            product.title
              ?.toLowerCase()
              .includes(query) ||
            product.sku
              ?.toLowerCase()
              .includes(query) ||
            inventory?.sku
              ?.toLowerCase()
              .includes(query);

          const total =
            getTotalStock(
              inventory,
              product
            );

          const available =
            getAvailableStock(
              inventory,
              product
            );

          const threshold =
            Number(
              inventory?.lowStockThreshold ??
                5
            );

          let matchesFilter =
            true;

          if (
            filter === "low"
          ) {
            matchesFilter =
              Boolean(
                inventory &&
                  inventory.trackInventory &&
                  total <= threshold &&
                  total > 0
              );
          }

          if (
            filter === "out"
          ) {
            matchesFilter =
              Boolean(
                inventory &&
                  inventory.trackInventory &&
                  available <= 0
              );
          }

          if (
            filter === "inactive"
          ) {
            matchesFilter =
              !inventory ||
              inventory.active === false;
          }

          if (
            filter === "active"
          ) {
            matchesFilter =
              inventory?.active === true;
          }

          return (
            matchesSearch &&
            matchesFilter
          );
        }
      );
    }, [
      rows,
      search,
      filter,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    let totalUnits = 0;
    let reserved = 0;
    let available = 0;
    let lowStock = 0;
    let outOfStock = 0;

    inventories.forEach(
      (inventory) => {
        const product =
          products.find(
            (p) =>
              String(p._id) ===
              String(
                inventory.product?._id ||
                  inventory.product
              )
          );

        if (!product) return;

        if (
          !inventory.trackInventory
        ) {
          return;
        }

        const total =
          getTotalStock(
            inventory,
            product
          );

        const availableStock =
          getAvailableStock(
            inventory,
            product
          );

        const threshold =
          Number(
            inventory.lowStockThreshold ??
              5
          );

        totalUnits += total;

        reserved += Number(
          inventory.reserved || 0
        );

        available +=
          Number(
            availableStock === Infinity
              ? 0
              : availableStock
          );

        if (
          total > 0 &&
          total <= threshold
        ) {
          lowStock++;
        }

        if (
          availableStock <= 0
        ) {
          outOfStock++;
        }
      }
    );

    return {
      totalProducts:
        products.length,
      totalUnits,
      reserved,
      available,
      lowStock,
      outOfStock,
    };
  }, [
    inventories,
    products,
  ]);

  /* =======================================================
     OPEN EDITOR
  ======================================================= */

  function openInventory(
    product,
    inventory
  ) {
    setSelected(product);
    setMessage("");

    setForm({
      product: product._id,
      sku:
        inventory?.sku ||
        product.sku ||
        "",
      stock: getCleanStock(
        product,
        inventory?.stock
      ),
      reserved: Number(
        inventory?.reserved || 0
      ),
      lowStockThreshold:
        Number(
          inventory?.lowStockThreshold ??
            5
        ),
      trackInventory:
        inventory?.trackInventory ??
        true,
      allowBackorder:
        inventory?.allowBackorder ??
        false,
      active:
        inventory?.active ??
        true,
    });
  }

  /* =======================================================
     CLOSE EDITOR
  ======================================================= */

  function closeEditor() {
    setSelected(null);
    setForm({
      ...emptyInventory,
      stock: {},
    });
    setMessage("");
  }

  /* =======================================================
     STOCK UPDATE
  ======================================================= */

  function updateStock(
    size,
    value
  ) {
    setForm(
      (current) => ({
        ...current,
        stock: {
          ...current.stock,
          [size]: Math.max(
            0,
            Number(value) || 0
          ),
        },
      })
    );
  }

  function changeStock(
    size,
    amount
  ) {
    setForm(
      (current) => ({
        ...current,
        stock: {
          ...current.stock,
          [size]: Math.max(
            0,
            Number(
              current.stock?.[
                size
              ] || 0
            ) + amount
          ),
        },
      })
    );
  }

  /* =======================================================
     SAVE INVENTORY
  ======================================================= */

  async function saveInventory() {
    if (!selected) return;

    try {
      setMessage("");

      const cleanedStock =
        getCleanStock(
          selected,
          form.stock
        );

      const payload = {
        sku: form.sku,
        stock: cleanedStock,
        reserved: Number(
          form.reserved || 0
        ),
        lowStockThreshold:
          Number(
            form.lowStockThreshold ||
              0
          ),
        trackInventory:
          Boolean(
            form.trackInventory
          ),
        allowBackorder:
          Boolean(
            form.allowBackorder
          ),
        active:
          Boolean(form.active),
      };

      const existing =
        inventoryMap.get(
          String(selected._id)
        );

      if (existing?._id) {
        await updateInventory({
          id: existing._id,
          ...payload,
        }).unwrap();
      } else {
        await createInventory({
          product: selected._id,
          ...payload,
        }).unwrap();
      }

      setMessage(
        "Inventory saved successfully"
      );

      await refetchInventory();
      await refetchProducts();
    } catch (error) {
      console.error(
        "SAVE INVENTORY ERROR:",
        error
      );

      setMessage(
        error?.data?.error ||
          error?.data?.message ||
          error?.message ||
          "Failed to save inventory"
      );
    }
  }

  /* =======================================================
     TOGGLE INVENTORY ACTIVE
  ======================================================= */

  async function toggleInventory(
    product,
    inventory
  ) {
    if (!inventory?._id) return;

    try {
      setMessage("");

      await updateInventory({
        id: inventory._id,
        active:
          !inventory.active,
      }).unwrap();

      setMessage(
        `Inventory ${
          inventory.active
            ? "deactivated"
            : "activated"
        } successfully`
      );

      await refetchInventory();
    } catch (error) {
      console.error(
        "TOGGLE INVENTORY ERROR:",
        error
      );

      setMessage(
        error?.data?.error ||
          error?.data?.message ||
          error?.message ||
          "Failed to update inventory"
      );
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-full w-full space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div className="flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white shadow-sm">
            <Package className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Inventory
            </h1>

            <p className="text-sm text-gray-500">
              Manage stock, variants and inventory availability
            </p>
          </div>

        </div>

        <Button
          variant="outline"
          disabled={loading}
          onClick={async () => {
            try {
              setMessage("");

              await Promise.all([
                refetchInventory(),
                refetchProducts(),
              ]);
            } catch {
              setMessage(
                "Failed to refresh inventory"
              );
            }
          }}
          className="gap-2 rounded-xl"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </Button>

      </div>

      {/* MESSAGE */}

      {message && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          {message}
        </div>
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">

        <StatCard
          title="Products"
          value={
            stats.totalProducts
          }
          icon={Boxes}
        />

        <StatCard
          title="Total Units"
          value={stats.totalUnits}
          icon={Package}
        />

        <StatCard
          title="Available"
          value={stats.available}
          icon={CheckCircle2}
        />

        <StatCard
          title="Reserved"
          value={stats.reserved}
          icon={Package}
        />

        <StatCard
          title="Low Stock"
          value={stats.lowStock}
          icon={TrendingDown}
          danger
        />

        <StatCard
          title="Out of Stock"
          value={
            stats.outOfStock
          }
          icon={XCircle}
          danger
        />

      </div>

      {/* MAIN */}

      <Card
        className="overflow-hidden border-gray-200 shadow-sm"
        data-lenis-prevent
      >

        <CardHeader className="border-b border-gray-100 space-y-4">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <CardTitle className="text-lg">
                Product Inventory
              </CardTitle>

              <p className="mt-1 text-sm text-gray-500">
                {filteredRows.length} products
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="relative w-full sm:w-80">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search product or SKU..."
                  className="h-10 rounded-xl border-gray-200 pl-10"
                />

              </div>

              <Select
                value={filter}
                onValueChange={
                  setFilter
                }
              >

                <SelectTrigger className="h-10 w-full rounded-xl border-gray-200 sm:w-44">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    All
                  </SelectItem>

                  <SelectItem value="active">
                    Active
                  </SelectItem>

                  <SelectItem value="low">
                    Low Stock
                  </SelectItem>

                  <SelectItem value="out">
                    Out of Stock
                  </SelectItem>

                  <SelectItem value="inactive">
                    Inactive
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>

        </CardHeader>

        <CardContent className="p-0">

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-24 text-center">

              <Package className="mx-auto h-10 w-10 text-gray-300" />

              <p className="mt-4 font-semibold text-gray-900">
                No inventory found
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your search or filter.
              </p>

            </div>
          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1100px]">

                <thead>

                  <tr className="border-b bg-gray-50/70 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">

                    <th className="px-5 py-4">
                      Product
                    </th>

                    <th className="px-5 py-4">
                      SKU
                    </th>

                    <th className="px-5 py-4">
                      Sizes
                    </th>

                    <th className="px-5 py-4">
                      Reserved
                    </th>

                    <th className="px-5 py-4">
                      Available
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredRows.map(
                    ({
                      product,
                      inventory,
                    }) => {

                      const total =
                        getTotalStock(
                          inventory,
                          product
                        );

                      const available =
                        getAvailableStock(
                          inventory,
                          product
                        );

                      const status =
                        getStatus(
                          inventory,
                          product
                        );

                      return (
                        <tr
                          key={
                            product._id
                          }
                          className="border-b last:border-0 hover:bg-gray-50/70"
                        >

                          {/* PRODUCT */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">

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
                                  <div className="flex h-full w-full items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-300" />
                                  </div>
                                )}

                              </div>

                              <div className="min-w-0">

                                <p className="max-w-[280px] truncate font-semibold text-gray-900">
                                  {
                                    product.title
                                  }
                                </p>

                                <p className="mt-1 text-xs text-gray-500">
                                  {product.category?.name ||
                                    product.category ||
                                    "No category"}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* SKU */}

                          <td className="px-5 py-4">

                            <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                              {inventory?.sku ||
                                product.sku ||
                                "—"}
                            </span>

                          </td>

                          {/* SIZES */}

                          <td className="px-5 py-4">

                            <div className="flex max-w-[300px] flex-wrap gap-1.5">

                              {getProductSizes(
                                product
                              ).map(
                                (size) => {

                                  const stock =
                                    Number(
                                      inventory?.stock?.[
                                        size
                                      ] || 0
                                    );

                                  return (
                                    <span
                                      key={
                                        size
                                      }
                                      className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                                        stock >
                                        0
                                          ? "bg-gray-100 text-gray-900"
                                          : "bg-red-50 text-red-600"
                                      }`}
                                    >
                                      {size}{" "}
                                      <span className="font-bold">
                                        {stock}
                                      </span>
                                    </span>
                                  );
                                }
                              )}

                              {!getProductSizes(
                                product
                              ).length && (
                                <span className="text-xs text-gray-400">
                                  No variants
                                </span>
                              )}

                            </div>

                          </td>

                          {/* RESERVED */}

                          <td className="px-5 py-4 font-semibold text-gray-900">
                            {Number(
                              inventory?.reserved ||
                                0
                            )}
                          </td>

                          {/* AVAILABLE */}

                          <td className="px-5 py-4">

                            <span
                              className={`text-lg font-bold ${
                                available ===
                                0
                                  ? "text-red-600"
                                  : available <=
                                    Number(
                                      inventory?.lowStockThreshold ??
                                        5
                                    )
                                  ? "text-orange-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {inventory?.trackInventory
                                ? available
                                : "∞"}
                            </span>

                            <p className="text-xs text-gray-400">
                              {inventory?.trackInventory
                                ? `${total} total`
                                : "Not tracked"}
                            </p>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            <StatusBadge
                              status={
                                status
                              }
                            />

                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4 text-right">

                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 rounded-xl"
                              onClick={() =>
                                openInventory(
                                  product,
                                  inventory
                                )
                              }
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit Stock
                            </Button>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </CardContent>

      </Card>

      {/* =====================================================
          INVENTORY EDITOR
      ===================================================== */}


<Dialog
  open={Boolean(selected)}
  onOpenChange={(open) => {
    if (!open) closeEditor();
  }}
>
  <DialogContent
    className="
      w-[96vw]
      max-w-[66vw]
      max-h-[92vh]
      overflow-y-auto
      rounded-[28px]
      border-0
      bg-white
      p-0
      shadow-2xl
    "
  >
    <DialogHeader className="border-b border-gray-100 px-8 py-7">
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black text-white">
            <Package className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <DialogTitle className="truncate text-2xl font-bold tracking-tight text-gray-950">
              {selected?.title || "Inventory"}
            </DialogTitle>

            <DialogDescription className="mt-1 text-sm text-gray-500">
              Manage stock and inventory settings for this product.
            </DialogDescription>
          </div>
        </div>

        <div className="hidden shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 sm:block">
          {getProductSizes(selected).length
            ? `${getProductSizes(selected).length} variants`
            : "No variants"}
        </div>
      </div>
    </DialogHeader>

    {selected && (
      <div className="px-8 py-8">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.45fr_0.8fr]">

          {/* LEFT */}
          <div className="min-w-0 space-y-7">

            {/* PRODUCT */}
            <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-5">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {selected.images?.[0] ? (
                    <img
                      src={selected.images[0]}
                      alt={selected.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-7 w-7 text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-950">
                    {selected.title}
                  </p>

                  <p className="mt-1 font-mono text-xs text-gray-500">
                    {selected.sku || form.sku || "No SKU"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
                      {getProductSizes(selected).length
                        ? `${getProductSizes(selected).length} sizes`
                        : "No configured sizes"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        selected.isOutOfStock
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {selected.isOutOfStock
                        ? "Out of Stock"
                        : "In Stock"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* SKU */}
            <section>
              <div className="mb-3">
                <Label className="text-sm font-semibold text-gray-900">
                  SKU
                </Label>
                <p className="mt-1 text-xs text-gray-500">
                  Inventory identifier for this product.
                </p>
              </div>

              <Input
                value={form.sku}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    sku: e.target.value,
                  }))
                }
                placeholder="Product SKU"
                className="h-12 rounded-xl border-gray-200 bg-white px-4 font-mono text-sm"
              />
            </section>

            {/* STOCK */}
            <section>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-950">
                    Stock by Variant
                  </h3>

                  <p className="mt-1 text-xs text-gray-500">
                    Only sizes configured on this product are shown.
                  </p>
                </div>

                <div className="shrink-0 rounded-xl bg-black px-4 py-2 text-sm font-bold text-white">
                  {getProductSizes(selected).reduce(
                    (sum, size) =>
                      sum + Number(form.stock?.[size] || 0),
                    0
                  )}{" "}
                  units
                </div>
              </div>

              {getProductSizes(selected).length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {getProductSizes(selected).map((size) => {
                    const value = Number(
                      form.stock?.[size] || 0
                    );

                    const isInStock = value > 0;

                    return (
                      <div
                        key={size}
                        className="
                          rounded-2xl
                          border
                          border-gray-200
                          bg-white
                          p-5
                          transition
                          hover:border-gray-300
                          hover:shadow-sm
                        "
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                              Size
                            </p>

                            <p className="mt-1 text-lg font-bold text-gray-950">
                              {size}
                            </p>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              isInStock
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-600"
                            }`}
                          >
                            {isInStock ? "IN STOCK" : "OUT"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0 rounded-xl border-gray-200"
                            onClick={() =>
                              changeStock(size, -1)
                            }
                            disabled={value <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <Input
                            type="number"
                            min="0"
                            value={value}
                            onChange={(e) =>
                              updateStock(
                                size,
                                e.target.value
                              )
                            }
                            className="
                              h-11
                              rounded-xl
                              border-gray-200
                              text-center
                              text-base
                              font-bold
                            "
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-11 w-11 shrink-0 rounded-xl border-gray-200"
                            onClick={() =>
                              changeStock(size, 1)
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center">
                  <Boxes className="mx-auto h-9 w-9 text-gray-300" />

                  <p className="mt-3 font-semibold text-gray-800">
                    No product variants configured
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Existing inventory keys will be preserved.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT */}
          <div className="min-w-0 space-y-5">

            {/* INVENTORY SUMMARY */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h3 className="font-bold text-gray-950">
                  Inventory Summary
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Current inventory configuration.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Total Stock
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-950">
                    {getProductSizes(selected).reduce(
                      (sum, size) =>
                        sum +
                        Number(form.stock?.[size] || 0),
                      0
                    )}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Reserved
                  </p>

                  <p className="mt-1 text-2xl font-bold text-gray-950">
                    {Number(form.reserved || 0)}
                  </p>
                </div>
              </div>

              <div
                className={`mt-3 rounded-xl p-4 ${
                  getProductSizes(selected).reduce(
                    (sum, size) =>
                      sum +
                      Number(form.stock?.[size] || 0),
                    0
                  ) > 0
                    ? "bg-green-50"
                    : "bg-red-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getProductSizes(selected).reduce(
                    (sum, size) =>
                      sum +
                      Number(form.stock?.[size] || 0),
                    0
                  ) > 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}

                  <div>
                    <p className="text-sm font-bold text-gray-950">
                      {getProductSizes(selected).reduce(
                        (sum, size) =>
                          sum +
                          Number(form.stock?.[size] || 0),
                        0
                      ) > 0
                        ? "Stock Available"
                        : "Out of Stock"}
                    </p>

                    <p className="mt-0.5 text-xs text-gray-600">
                      Based on current variant stock.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* NUMERIC SETTINGS */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-5">
                <h3 className="font-bold text-gray-950">
                  Stock Settings
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Configure reservation and low-stock behavior.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="text-sm font-semibold text-gray-900">
                    Reserved Stock
                  </Label>

                  <Input
                    type="number"
                    min="0"
                    value={form.reserved}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        reserved: Math.max(
                          0,
                          Number(e.target.value) || 0
                        ),
                      }))
                    }
                    className="mt-2 h-11 rounded-xl border-gray-200"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-900">
                    Low Stock Threshold
                  </Label>

                  <Input
                    type="number"
                    min="0"
                    value={form.lowStockThreshold}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        lowStockThreshold: Math.max(
                          0,
                          Number(e.target.value) || 0
                        ),
                      }))
                    }
                    className="mt-2 h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </section>

            {/* TOGGLES */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {[
                {
                  key: "trackInventory",
                  title: "Track Inventory",
                  description:
                    "Enable stock validation and availability checks.",
                },
                {
                  key: "allowBackorder",
                  title: "Allow Backorders",
                  description:
                    "Allow purchases when stock reaches zero.",
                },
                {
                  key: "active",
                  title: "Inventory Active",
                  description:
                    "Enable this inventory record for use.",
                },
              ].map((item, index) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between gap-5 p-5 ${
                    index !== 2
                      ? "border-b border-gray-100"
                      : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-950">
                      {item.title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        [item.key]:
                          !current[item.key],
                      }))
                    }
                    className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                      form[item.key]
                        ? "bg-black"
                        : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                        form[item.key]
                          ? "left-6"
                          : "left-1"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </section>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={closeEditor}
            className="h-11 rounded-xl px-6"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={saving}
            onClick={saveInventory}
            className="h-11 gap-2 rounded-xl bg-black px-7 text-white hover:bg-gray-800"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {saving ? "Saving..." : "Save Inventory"}
          </Button>
        </div>
      </div>
    )}
  </DialogContent>
</Dialog>

    </div>
  );
}