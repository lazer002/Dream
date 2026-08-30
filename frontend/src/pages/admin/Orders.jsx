// src/pages/admin/AdvancedOrders.jsx

import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/config";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  "out for delivery": "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  canceled: "bg-red-100 text-red-800",
  "return requested": "bg-orange-100 text-orange-800",
  "return approved": "bg-green-100 text-green-800",
  "return rejected": "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
  refunded: "bg-gray-100 text-gray-800",
};

const STATUS_OPTIONS = [
  "pending",
  "confirmed",
  "dispatched",
  "shipped",
  "out for delivery",
  "delivered",
  "cancelled",
];

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      if (status) {
        params.append("status", status);
      }

      if (source) {
        params.append("source", source);
      }

      params.append("page", page);
      params.append("limit", limit);
      params.append("sort", sort);

      const res = await api.get(
        `/admin/orders?${params.toString()}`
      );

      setOrders(
        Array.isArray(res.data?.orders)
          ? res.data.orders
          : []
      );

      setTotal(Number(res.data?.total || 0));
    } catch (err) {
      console.error("fetchOrders:", err);
      setError(
        err?.response?.data?.error ||
          "Failed to load orders"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    status,
    source,
    page,
    limit,
    sort,
  ]);

  const deliveryBadge = (
    paymentMethod,
    paymentStatus
  ) => {
    if (paymentMethod === "cod") {
      if (paymentStatus === "pending") {
        return {
          text: "COD — Pending",
          cls: "bg-yellow-100 text-yellow-800",
        };
      }

      if (
        paymentStatus === "paid" ||
        paymentStatus === "success"
      ) {
        return {
          text: "COD — Collected",
          cls: "bg-green-100 text-green-800",
        };
      }

      return {
        text: "COD",
        cls: "bg-gray-100 text-gray-800",
      };
    }

    if (
      paymentStatus === "paid" ||
      paymentStatus === "success"
    ) {
      return {
        text: "Prepaid — Paid",
        cls: "bg-green-100 text-green-800",
      };
    }

    if (paymentStatus === "pending") {
      return {
        text: "Prepaid — Pending",
        cls: "bg-yellow-100 text-yellow-800",
      };
    }

    return {
      text: "Prepaid",
      cls: "bg-gray-100 text-gray-800",
    };
  };

  const tableRows = useMemo(() => {
    return orders.map((order) => {
      const customerName = order.shippingAddress
        ? `${order.shippingAddress.firstName || ""} ${
            order.shippingAddress.lastName || ""
          }`.trim()
        : "";

      const customerPhone =
        order.shippingAddress?.phone || "";

      const itemCount =
        typeof order.itemCount === "number"
          ? order.itemCount
          : Array.isArray(order.items)
            ? order.items.reduce(
                (sum, item) =>
                  sum +
                  (Number(item.quantity) || 1),
                0
              )
            : 0;

      const items = (
        Array.isArray(order.items)
          ? order.items
          : []
      ).map((item) => ({
        image:
          item.mainImage ||
          item.images?.[0] ||
          null,
        title: item.title || "",
        qty: Number(item.quantity) || 1,
      }));

      return {
        publicOrderId:
          order.publicOrderId || null,

        orderNumber:
          order.orderNumber || "—",

        email:
          order.email || "—",

        total:
          Number(order.total || 0),

        status:
          order.orderStatus || "pending",

        createdAt:
          order.createdAt || null,

        itemCount,

        items,

        customerName,

        customerPhone,

        paymentMethod:
          order.paymentMethod || "cod",

        paymentStatus:
          order.paymentStatus || "pending",
      };
    });
  }, [orders]);

  const onActivateRow = (publicOrderId) => {
    if (!publicOrderId) {
      toast.error(
        "This order does not have a publicOrderId"
      );
      return;
    }

    navigate(
      `/admin/orders/${publicOrderId}`
    );
  };

  const exportCsv = () => {
    if (
      !Array.isArray(orders) ||
      orders.length === 0
    ) {
      toast.warn(
        "No orders available to export"
      );
      return;
    }

    const columns = [
      {
        key: "orderNumber",
        label: "OrderNumber",
      },
      {
        key: "publicOrderId",
        label: "PublicOrderId",
      },
      {
        key: "email",
        label: "Email",
      },
      {
        key: "orderStatus",
        label: "Status",
      },
      {
        key: "total",
        label: "Total",
      },
      {
        key: "itemCount",
        label: "ItemsCount",
      },
      {
        key: "createdAt",
        label: "CreatedAt",
      },
      {
        key: "source",
        label: "Source",
      },
      {
        key: "paymentMethod",
        label: "PaymentMethod",
      },
      {
        key: "paymentStatus",
        label: "PaymentStatus",
      },
    ];

    const safe = (value) => {
      if (
        value === null ||
        value === undefined
      ) {
        return "";
      }

      return String(value).replace(
        /"/g,
        '""'
      );
    };

    const header = columns
      .map((column) => `"${column.label}"`)
      .join(",");

    const rows = orders.map((order) => {
      const itemCount =
        typeof order.itemCount === "number"
          ? order.itemCount
          : Array.isArray(order.items)
            ? order.items.reduce(
                (sum, item) =>
                  sum +
                  (Number(item.quantity) || 1),
                0
              )
            : 0;

      const row = {
        orderNumber:
          order.orderNumber || "",

        publicOrderId:
          order.publicOrderId || "",

        email:
          order.email || "",

        orderStatus:
          order.orderStatus || "",

        total:
          order.total || "",

        itemCount,

        createdAt: order.createdAt
          ? new Date(
              order.createdAt
            ).toISOString()
          : "",

        source:
          order.source || "",

        paymentMethod:
          order.paymentMethod || "",

        paymentStatus:
          order.paymentStatus || "",
      };

      return columns
        .map(
          (column) =>
            `"${safe(row[column.key])}"`
        )
        .join(",");
    });

    const csv = [
      header,
      ...rows,
    ].join("\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const anchor =
      document.createElement("a");

    anchor.href = url;

    anchor.download = `orders-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    setTimeout(
      () => URL.revokeObjectURL(url),
      2000
    );

    toast.success(
      "CSV export initiated"
    );
  };

  const resetFilters = () => {
    setSearch("");
    setStatus("");
    setSource("");
    setSort("newest");
    setPage(1);
  };

  const pageCount =
    Math.ceil(total / limit) || 1;

  return (
    <div className="min-h-full bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-[1800px]">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-950">
              Orders
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage and track customer orders
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-black px-4 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <Link
              to="/admin/orders/create"
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 transition hover:bg-gray-50"
            >
              New Order
            </Link>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            {/* SEARCH */}
            <div className="relative min-w-0 flex-1 xl:max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <Input
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );
                  setPage(1);
                }}
                placeholder="Search by order number, email or phone"
                className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 text-sm shadow-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* STATUS */}
              <Select
                value={status || "all"}
                onValueChange={(value) => {
                  setStatus(
                    value === "all"
                      ? ""
                      : value
                  );
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[160px] rounded-lg border-gray-200 bg-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">
                      All statuses
                    </SelectItem>

                    {STATUS_OPTIONS.map(
                      (value) => (
                        <SelectItem
                          key={value}
                          value={value}
                        >
                          {value
                            .charAt(0)
                            .toUpperCase() +
                            value.slice(1)}
                        </SelectItem>
                      )
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* SOURCE */}
              <Select
                value={source || "all"}
                onValueChange={(value) => {
                  setSource(
                    value === "all"
                      ? ""
                      : value
                  );
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[130px] rounded-lg border-gray-200 bg-white">
                  <SelectValue placeholder="All sources" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">
                    All sources
                  </SelectItem>

                  <SelectItem value="web">
                    Web
                  </SelectItem>

                  <SelectItem value="mobile">
                    Mobile
                  </SelectItem>

                  <SelectItem value="admin">
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* LIMIT */}
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(
                    Number(value)
                  );
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[120px] rounded-lg border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="10">
                    10 / page
                  </SelectItem>

                  <SelectItem value="20">
                    20 / page
                  </SelectItem>

                  <SelectItem value="50">
                    50 / page
                  </SelectItem>

                  <SelectItem value="100">
                    100 / page
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* SORT */}
              <Select
                value={sort || "newest"}
                onValueChange={(value) => {
                  setSort(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-[120px] rounded-lg border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="newest">
                    Newest
                  </SelectItem>

                  <SelectItem value="oldest">
                    Oldest
                  </SelectItem>
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={resetFilters}
                className="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-gray-500" />
            </div>
          ) : error ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 p-8">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>

              <button
                type="button"
                onClick={fetchOrders}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div
                className="overflow-x-auto"
                data-lenis-prevent
              >
                <Table className="min-w-[1250px]">
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-gray-50">
                      <TableHead className="h-12 px-5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Products
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Order
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Customer
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Email
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Payment
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Items
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Total
                      </TableHead>

                      <TableHead className="h-12 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {tableRows.length > 0 ? (
                      tableRows.map((row) => {
                        const delivery =
                          deliveryBadge(
                            row.paymentMethod,
                            row.paymentStatus
                          );

                        return (
                          <TableRow
                            key={
                              row.publicOrderId ||
                              row.orderNumber
                            }
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              onActivateRow(
                                row.publicOrderId
                              )
                            }
                            onKeyDown={(event) => {
                              if (
                                event.key ===
                                  "Enter" ||
                                event.key ===
                                  " "
                              ) {
                                event.preventDefault();

                                onActivateRow(
                                  row.publicOrderId
                                );
                              }
                            }}
                            className="cursor-pointer border-b border-gray-100 transition hover:bg-gray-50"
                          >
                            {/* PRODUCTS */}
                            <TableCell className="px-5 py-4">
                              <div className="flex items-center">
                                {row.items
                                  .slice(0, 3)
                                  .map(
                                    (
                                      item,
                                      index
                                    ) =>
                                      item.image ? (
                                        <img
                                          key={`${row.publicOrderId}-${index}`}
                                          src={
                                            item.image
                                          }
                                          alt={
                                            item.title ||
                                            "Product"
                                          }
                                          title={
                                            item.title ||
                                            "Product"
                                          }
                                          className={`h-11 w-11 rounded-lg border-2 border-white object-cover shadow-sm ${
                                            index >
                                            0
                                              ? "-ml-2"
                                              : ""
                                          }`}
                                          style={{
                                            zIndex:
                                              index +
                                              1,
                                          }}
                                        />
                                      ) : (
                                        <div
                                          key={`${row.publicOrderId}-empty-${index}`}
                                          className={`flex h-11 w-11 items-center justify-center rounded-lg border-2 border-white bg-gray-100 text-xs text-gray-400 shadow-sm ${
                                            index >
                                            0
                                              ? "-ml-2"
                                              : ""
                                          }`}
                                        >
                                          ?
                                        </div>
                                      )
                                  )}

                                {row.items.length >
                                  3 && (
                                  <div className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs font-semibold text-gray-700 shadow-sm">
                                    +
                                    {row.items
                                      .length -
                                      3}
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* ORDER */}
                            <TableCell className="py-4">
                              <div className="font-semibold text-gray-900">
                                {
                                  row.orderNumber
                                }
                              </div>

                              {row.publicOrderId && (
                                <div className="mt-1 max-w-[170px] truncate text-[11px] text-gray-400">
                                  {
                                    row.publicOrderId
                                  }
                                </div>
                              )}
                            </TableCell>

                            {/* CUSTOMER */}
                            <TableCell className="py-4">
                              <div className="font-medium text-gray-900">
                                {row.customerName ||
                                  row.email}
                              </div>

                              <div className="mt-1 text-xs text-gray-500">
                                {
                                  row.customerPhone ||
                                  "—"
                                }
                              </div>
                            </TableCell>

                            {/* EMAIL */}
                            <TableCell className="max-w-[230px] py-4">
                              <div className="break-all text-sm text-gray-700">
                                {row.email}
                              </div>
                            </TableCell>

                            {/* PAYMENT */}
                            <TableCell className="py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${delivery.cls}`}
                              >
                                {
                                  delivery.text
                                }
                              </span>
                            </TableCell>

                            {/* STATUS */}
                            <TableCell className="py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  STATUS_COLORS[
                                    row.status
                                  ] ||
                                  "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {row.status}
                              </span>
                            </TableCell>

                            {/* ITEMS */}
                            <TableCell className="py-4">
                              <span className="font-medium text-gray-700">
                                {Number(
                                  row.itemCount ||
                                    0
                                )}
                              </span>
                            </TableCell>

                            {/* TOTAL */}
                            <TableCell className="py-4">
                              <span className="font-semibold text-gray-950">
                                ₹
                                {Number(
                                  row.total ||
                                    0
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </span>
                            </TableCell>

                            {/* CREATED */}
                            <TableCell className="whitespace-nowrap py-4 text-sm text-gray-500">
                              {row.createdAt
                                ? new Date(
                                    row.createdAt
                                  ).toLocaleString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month:
                                        "short",
                                      year:
                                        "numeric",
                                      hour:
                                        "2-digit",
                                      minute:
                                        "2-digit",
                                    }
                                  )
                                : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="h-[300px] text-center"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                              <Search className="h-5 w-5" />
                            </div>

                            <p className="font-medium text-gray-900">
                              No orders found
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Try changing your
                              search or filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  {total > 0
                    ? `Showing ${
                        (page - 1) *
                          limit +
                        1
                      } - ${Math.min(
                        page * limit,
                        total
                      )} of ${total}`
                    : "0 orders"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                      )
                    }
                    disabled={page === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-black px-3 text-sm font-medium text-white">
                    {page}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          pageCount,
                          current + 1
                        )
                      )
                    }
                    disabled={
                      page === pageCount
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}