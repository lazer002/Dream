// src/pages/admin/Inventory.jsx

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

import api from "@/utils/config";

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

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const EMPTY_STOCK = {
  XS: 0,
  S: 0,
  M: 0,
  L: 0,
  XL: 0,
  XXL: 0,
};

const emptyInventory = {
  product: null,
  sku: "",
  stock: { ...EMPTY_STOCK },
  reserved: 0,
  lowStockThreshold: 5,
  trackInventory: true,
  allowBackorder: false,
  active: true,
};

export default function AdminInventory() {
  const [inventories, setInventories] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [selected, setSelected] = useState(null);

  const [form, setForm] = useState(emptyInventory);

  const [message, setMessage] = useState("");

  async function loadInventory() {
    try {
      setLoading(true);

      const { data } = await api.get("/inventory");

      setInventories(
        data?.items ||
          data?.inventories ||
          data ||
          []
      );
    } catch (error) {
      console.error("LOAD INVENTORY ERROR:", error);

      setMessage(
        error?.response?.data?.error ||
          "Failed to load inventory"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    try {
      const { data } = await api.get("/products");

      setProducts(
        data?.items ||
          data?.products ||
          data ||
          []
      );
    } catch (error) {
      console.error("LOAD PRODUCTS ERROR:", error);
    }
  }

  useEffect(() => {
    loadInventory();
    loadProducts();
  }, []);

  const inventoryMap = useMemo(() => {
    const map = new Map();

    inventories.forEach((item) => {
      const productId =
        item.product?._id ||
        item.product;

      if (productId) {
        map.set(String(productId), item);
      }
    });

    return map;
  }, [inventories]);

  const rows = useMemo(() => {
    return products.map((product) => {
      const inventory =
        inventoryMap.get(String(product._id)) || null;

      return {
        product,
        inventory,
      };
    });
  }, [products, inventoryMap]);

  const filteredRows = useMemo(() => {
    return rows.filter(({ product, inventory }) => {
      const query = search.toLowerCase().trim();

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

      const total = getTotalStock(inventory);

      const available = getAvailableStock(inventory);

      let matchesFilter = true;

      if (filter === "low") {
        matchesFilter =
          inventory &&
          inventory.trackInventory &&
          total <=
            Number(
              inventory.lowStockThreshold ?? 5
            );
      }

      if (filter === "out") {
        matchesFilter =
          inventory &&
          inventory.trackInventory &&
          available <= 0;
      }

      if (filter === "inactive") {
        matchesFilter =
          !inventory || inventory.active === false;
      }

      if (filter === "active") {
        matchesFilter =
          inventory?.active === true;
      }

      return matchesSearch && matchesFilter;
    });
  }, [rows, search, filter]);

  const stats = useMemo(() => {
    let totalUnits = 0;
    let reserved = 0;
    let available = 0;
    let lowStock = 0;
    let outOfStock = 0;

    inventories.forEach((inventory) => {
      if (!inventory.trackInventory) return;

      const stock = getTotalStock(inventory);
      const availableStock =
        getAvailableStock(inventory);

      totalUnits += stock;
      reserved += Number(inventory.reserved || 0);
      available += availableStock;

      if (
        stock <=
        Number(
          inventory.lowStockThreshold ?? 5
        )
      ) {
        lowStock++;
      }

      if (availableStock <= 0) {
        outOfStock++;
      }
    });

    return {
      totalProducts: products.length,
      totalUnits,
      reserved,
      available,
      lowStock,
      outOfStock,
    };
  }, [inventories, products]);

  function getTotalStock(inventory) {
    if (!inventory) return 0;

    if (!inventory.trackInventory) {
      return 0;
    }

    return SIZES.reduce(
      (total, size) =>
        total +
        Number(inventory.stock?.[size] || 0),
      0
    );
  }

  function getAvailableStock(inventory) {
    if (!inventory) return 0;

    if (!inventory.trackInventory) {
      return Infinity;
    }

    return Math.max(
      0,
      getTotalStock(inventory) -
        Number(inventory.reserved || 0)
    );
  }

  function openInventory(product, inventory) {
    setSelected(product);
    setMessage("");

    setForm({
      product: product._id,
      sku:
        inventory?.sku ||
        product.sku ||
        "",
      stock: {
        ...EMPTY_STOCK,
        ...(inventory?.stock || {}),
      },
      reserved:
        Number(inventory?.reserved || 0),
      lowStockThreshold:
        Number(
          inventory?.lowStockThreshold ?? 5
        ),
      trackInventory:
        inventory?.trackInventory ?? true,
      allowBackorder:
        inventory?.allowBackorder ?? false,
      active:
        inventory?.active ?? true,
    });
  }

  function closeEditor() {
    setSelected(null);
    setForm(emptyInventory);
    setMessage("");
  }

  function updateStock(size, value) {
    setForm((current) => ({
      ...current,
      stock: {
        ...current.stock,
        [size]: Math.max(
          0,
          Number(value) || 0
        ),
      },
    }));
  }

  function changeStock(size, amount) {
    setForm((current) => ({
      ...current,
      stock: {
        ...current.stock,
        [size]: Math.max(
          0,
          Number(current.stock?.[size] || 0) +
            amount
        ),
      },
    }));
  }

  async function saveInventory() {
    if (!selected) return;

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        sku: form.sku,
        stock: form.stock,
        reserved: Number(form.reserved),
        lowStockThreshold: Number(
          form.lowStockThreshold
        ),
        trackInventory: Boolean(
          form.trackInventory
        ),
        allowBackorder: Boolean(
          form.allowBackorder
        ),
        active: Boolean(form.active),
      };

      const existing = inventoryMap.get(
        String(selected._id)
      );

      let response;

      if (existing?._id) {
        response = await api.put(
          `/inventory/${existing._id}`,
          payload
        );
      } else {
        response = await api.post(
          "/inventory",
          {
            product: selected._id,
            ...payload,
          }
        );
      }

      const updated =
        response.data?.inventory ||
        response.data;

      setInventories((current) => {
        const exists = current.some(
          (item) =>
            String(item._id) ===
            String(updated._id)
        );

        if (exists) {
          return current.map((item) =>
            String(item._id) ===
            String(updated._id)
              ? updated
              : item
          );
        }

        return [...current, updated];
      });

      setMessage("Inventory saved successfully");
    } catch (error) {
      console.error(
        "SAVE INVENTORY ERROR:",
        error
      );

      setMessage(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save inventory"
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleInventory(product, inventory) {
    if (!inventory?._id) return;

    try {
      const { data } = await api.put(
        `/inventory/${inventory._id}`,
        {
          active: !inventory.active,
        }
      );

      const updated =
        data?.inventory || data;

      setInventories((current) =>
        current.map((item) =>
          String(item._id) ===
          String(updated._id)
            ? updated
            : item
        )
      );
    } catch (error) {
      console.error(
        "TOGGLE INVENTORY ERROR:",
        error
      );
    }
  }

  return (
    <div className="w-full min-h-full space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-black text-white flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Inventory
              </h1>

              <p className="text-sm text-gray-500">
                Manage product stock and availability
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            loadInventory();
            loadProducts();
          }}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* MESSAGE */}

      {message && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {/* STATS */}

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <StatCard
          title="Products"
          value={stats.totalProducts}
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
          value={stats.outOfStock}
          icon={XCircle}
          danger
        />
      </div>

      {/* MAIN */}

      <Card className="border-gray-200"  data-lenis-prevent>
        <CardHeader className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <CardTitle>
              Product Inventory
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />

                <Input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search product or SKU..."
                  className="pl-10 border border-gray-200"
                />
              </div>

              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className="w-full sm:w-44 border border-gray-200">
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

        <CardContent>
          {loading ? (
            <div className="py-20 flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="mx-auto h-10 w-10 text-gray-300" />

              <p className="mt-3 font-medium">
                No inventory found
              </p>

              <p className="text-sm text-gray-500">
                Try changing your search or filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-4">
                      Product
                    </th>

                    <th className="px-4 py-4">
                      SKU
                    </th>

                    <th className="px-4 py-4">
                      Stock
                    </th>

                    <th className="px-4 py-4">
                      Reserved
                    </th>

                    <th className="px-4 py-4">
                      Available
                    </th>

                    <th className="px-4 py-4">
                      Status
                    </th>

                    <th className="px-4 py-4 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map(
                    ({ product, inventory }) => {
                      const total =
                        getTotalStock(inventory);

                      const available =
                        getAvailableStock(
                          inventory
                        );

                      const threshold =
                        Number(
                          inventory?.lowStockThreshold ??
                            5
                        );

                      const low =
                        inventory?.trackInventory &&
                        total <= threshold &&
                        total > 0;

                      const out =
                        inventory?.trackInventory &&
                        available <= 0;

                      return (
                        <tr
                          key={product._id}
                          className="border-b last:border-0 hover:bg-gray-50"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
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
                                  <div className="h-full w-full flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-300" />
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="font-medium">
                                  {product.title}
                                </p>

                                <p className="text-xs text-gray-500">
                                  {product.category?.name ||
                                    product.category ||
                                    "No category"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-mono text-xs">
                              {inventory?.sku ||
                                product.sku ||
                                "—"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[260px]">
                              {SIZES.map((size) => (
                                <span
                                  key={size}
                                  className="rounded-md bg-gray-100 px-2 py-1 text-xs"
                                >
                                  <span className="font-medium">
                                    {size}
                                  </span>{" "}
                                  {inventory
                                    ?.stock?.[
                                      size
                                    ] || 0}
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="px-4 py-4 font-medium">
                            {inventory?.reserved ||
                              0}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`font-semibold ${
                                out
                                  ? "text-red-600"
                                  : low
                                  ? "text-orange-600"
                                  : "text-green-600"
                              }`}
                            >
                              {inventory?.trackInventory
                                ? available
                                : "∞"}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            {!inventory ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                                <AlertTriangle className="h-3 w-3" />
                                Not Created
                              </span>
                            ) : !inventory.active ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                <XCircle className="h-3 w-3" />
                                Inactive
                              </span>
                            ) : out ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                                <XCircle className="h-3 w-3" />
                                Out
                              </span>
                            ) : low ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
                                <AlertTriangle className="h-3 w-3" />
                                Low
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                <CheckCircle2 className="h-3 w-3" />
                                Healthy
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <Button
                              size="sm"
                              onClick={() =>
                                openInventory(
                                  product,
                                  inventory
                                )
                              }
                              className="bg-black text-white hover:bg-gray-800"
                            >
                              Manage
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

      {/* MANAGE PANEL */}

      {selected && (
        <Card className="border-gray-200">
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>
                  Manage Inventory
                </CardTitle>

                <p className="text-sm text-gray-500 mt-1">
                  {selected.title}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={closeEditor}
              >
                Close
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-8">
            {/* PRODUCT */}

            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-xl overflow-hidden bg-gray-100">
                {selected.images?.[0] && (
                  <img
                    src={selected.images[0]}
                    alt={selected.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>

              <div>
                <h2 className="font-semibold text-lg">
                  {selected.title}
                </h2>

                <p className="text-sm text-gray-500">
                  SKU: {form.sku}
                </p>
              </div>
            </div>

            {/* SETTINGS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>

                <Input
                  value={form.sku}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      sku: e.target.value,
                    }))
                  }
                  className="border border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Low Stock Threshold
                </Label>

                <Input
                  type="number"
                  min="0"
                  value={
                    form.lowStockThreshold
                  }
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      lowStockThreshold:
                        Math.max(
                          0,
                          Number(e.target.value)
                        ),
                    }))
                  }
                  className="border border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label>Reserved</Label>

                <Input
                  type="number"
                  min="0"
                  value={form.reserved}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      reserved: Math.max(
                        0,
                        Number(e.target.value)
                      ),
                    }))
                  }
                  className="border border-gray-200"
                />
              </div>
            </div>

            {/* STOCK */}

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">
                    Stock by Size
                  </h3>

                  <p className="text-sm text-gray-500">
                    Update quantities for each size.
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    Available
                  </p>

                  <p className="text-xl font-bold">
                    {form.trackInventory
                      ? Math.max(
                          0,
                          getTotalStock({
                            stock: form.stock,
                            trackInventory:
                              form.trackInventory,
                          }) -
                            Number(
                              form.reserved || 0
                            )
                        )
                      : "∞"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {SIZES.map((size) => {
                  const value =
                    Number(
                      form.stock?.[size] || 0
                    );

                  return (
                    <div
                      key={size}
                      className="rounded-xl border border-gray-200 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {size}
                        </span>

                        <span className="text-xs text-gray-400">
                          stock
                        </span>
                      </div>

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
                        className="border border-gray-200 text-center"
                      />

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            changeStock(
                              size,
                              -1
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            changeStock(
                              size,
                              1
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OPTIONS */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Toggle
                label="Track Inventory"
                checked={form.trackInventory}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    trackInventory: value,
                  }))
                }
              />

              <Toggle
                label="Allow Backorder"
                checked={form.allowBackorder}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    allowBackorder: value,
                  }))
                }
              />

              <Toggle
                label="Inventory Active"
                checked={form.active}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    active: value,
                  }))
                }
              />
            </div>

            {/* SAVE */}

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button
                variant="outline"
                onClick={closeEditor}
              >
                Cancel
              </Button>

              <Button
                disabled={saving}
                onClick={saveInventory}
                className="bg-black text-white hover:bg-gray-800 gap-2"
              >
                <Save className="h-4 w-4" />

                {saving
                  ? "Saving..."
                  : "Save Inventory"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  danger = false,
}) {
  return (
    <Card
      className={`border ${
        danger
          ? "border-red-100"
          : "border-gray-200"
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {title}
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                danger ? "text-red-600" : ""
              }`}
            >
              {value}
            </p>
          </div>

          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center ${
              danger
                ? "bg-red-50 text-red-600"
                : "bg-gray-100 text-black"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
      <Label>{label}</Label>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition ${
          checked ? "bg-black" : "bg-gray-200"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>
    </div>
  );
}