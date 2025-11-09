// src/pages/admin/AdvancedOrders.jsx
import React, { use, useEffect, useMemo, useState } from "react";
import { api } from "@/utils/config";
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import toast from "react-hot-toast";



const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};



export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("newest"); // newest | oldest
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");


  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // fetch
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (status) params.append("status", status);
      if (source) params.append("source", source);

      params.append("page", page);
      params.append("limit", limit);
      params.append("sort", sort);

      const res = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(res.data.orders || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("fetchOrders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, source, page, limit, sort]);



  // change status (open modal)


  // perform status change
  const doChangeStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setStatusChanging(true);
    try {
      const res = await api.put(`/admin/orders/${selectedOrder._id}/status`, { status: newStatus });
      // optimistic: update in UI
      setOrders((cur) => cur.map((o) => (o._id === selectedOrder._id ? res.data.order : o)));
      setShowStatusModal(false);
    } catch (err) {
      console.error("change status:", err);
      alert("Failed to update status.");
    } finally {
      setStatusChanging(false);
    }
  };

 

  const pageCount = Math.ceil(total / limit) || 1;

  const onActivateRow = (id) => navigate(`/admin/orders/${id}`);
  const tableRows = useMemo(() => {
    return (orders || []).map((o) => {
      const customerName = o.shippingAddress
        ? `${o.shippingAddress.firstName || ""} ${o.shippingAddress.lastName || ""}`.trim()
        : "";
      const customerPhone = o.shippingAddress?.phone || "";

      // itemCount from API, fallback to items length or sum qty
      const itemCount = typeof o.itemCount === "number"
        ? o.itemCount
        : Array.isArray(o.items)
          ? o.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)
          : 0;

      // normalize items to { image, title, qty }
      const items = (o.items || []).map((it) => ({
        image: it.mainImage || (it.images && it.images[0]) || null,
        title: it.title || "",
        qty: Number(it.quantity) || 1,
      }));

      return {
        id: String(o._id),
        orderNumber: o.orderNumber || "—",
        email: o.email || "—",
        total: Number(o.total || 0),
        status: o.orderStatus || "pending",
        createdAt: o.createdAt || null,
        itemCount,
        items,
        customerName,
        customerPhone,
        paymentMethod: o.paymentMethod || "cod",
        paymentStatus: o.paymentStatus || "pending",
      };
    });
  }, [orders]);

  /* helper (place near top of component) */
  function deliveryBadge(paymentMethod, paymentStatus) {
    if (paymentMethod === "cod") {
      if (paymentStatus === "pending") return { text: "COD — Pending", cls: "bg-yellow-100 text-yellow-800" };
      if (paymentStatus === "success") return { text: "COD — Collected", cls: "bg-green-100 text-green-800" };
      return { text: "COD", cls: "bg-gray-100 text-gray-800" };
    }
    // prepaid (razorpay etc)
    if (paymentStatus === "success") return { text: "Prepaid — Paid", cls: "bg-green-100 text-green-800" };
    if (paymentStatus === "pending") return { text: "Prepaid — Pending", cls: "bg-yellow-100 text-yellow-800" };
    return { text: "Prepaid", cls: "bg-gray-100 text-gray-800" };
  }
 // exportCsv utility — call exportCsv(orders) or exportCsv(orders, { filename })
const exportCsv = () => {
  console.log("Generating CSV for orders:", orders); // <<-- debug line

  if (!Array.isArray(orders) || orders.length === 0) {
    toast.warn("No orders available to export");
    return;
  }

  const cols = [
    { key: "orderNumber", label: "OrderNumber" },
    { key: "email", label: "Email" },
    { key: "orderStatus", label: "Status" },
    { key: "total", label: "Total" },
    { key: "itemCount", label: "ItemsCount" },
    { key: "createdAt", label: "CreatedAt" },
    { key: "source", label: "Source" },
      { key: "paymentMethod", label: "PaymentMethod" },
    { key: "paymentStatus", label: "PaymentStatus" },
  ];

  const safe = (v) => {
    if (v === null || v === undefined) return "";
    return String(v).replace(/"/g, '""');
  };

  const header = cols.map((c) => `"${c.label}"`).join(",");
  const rows = orders.map((o) => {
    const itemCount =
      typeof o.itemCount === "number"
        ? o.itemCount
        : Array.isArray(o.items)
        ? o.items.reduce((s, it) => s + (Number(it.quantity) || 1), 0)
        : 0;

    const rowObj = {
      orderNumber: o.orderNumber ?? "",
      email: o.email ?? "",
      orderStatus: o.orderStatus ?? "",
      total: o.total ?? "",
      itemCount,
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : "",
      source: o.source ?? "",
            paymentMethod: o.paymentMethod ?? "",
      paymentStatus: o.paymentStatus ?? "",
    };

    return cols.map((c) => `"${safe(rowObj[c.key])}"`).join(",");
  });

  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast.success("CSV export initiated");
};

  return (
    <div className="p-8  mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 bg-black text-white px-3 py-2 rounded-md hover:bg-gray-900"
            title="Export visible orders"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <Link to="/admin/orders/create" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:bg-gray-50">
            New Order
          </Link>
        </div>
      </div>

      {/* Filters */}

      <div className="bg-white border border-gray-100 rounded-lg p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-end">
        {/* 🔍 Search */}
        <div className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3  w-full max-w-lg">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by order #, email or phone"
              className="w-full outline-none text-sm bg-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 🟡 Status */}
          <Select
            value={status || "all"}
            onValueChange={(v) => {
              setStatus(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>


          {/* 🌐 Source */}
          <Select
            value={source || "all"}
            onValueChange={(v) => {
              setSource(v === "all" ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="mobile">Mobile</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>


          {/* 📦 Limit */}
          {/* LIMIT */}
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Items / page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>

          {/* SORT */}
          {/* ensure value is never empty; fallback to 'newest' */}
          <Select
            value={sort || "newest"}
            onValueChange={(v) => {
              setSort(v);
              setPage(1); // reset pagination when sorting changes
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>



          {/* 🔄 Reset */}
          <button
            onClick={() => {
              setSearch("");
              setStatus("");
              setSource("");

              setPage(1);
            }}
            className="px-3 py-2 rounded-md border border-gray-200 text-sm hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>
      </div>


      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <>
            <Table className="min-w-full divide-y divide-gray-100 text-sm">

              <TableHeader className="bg-gray-50 text-gray-700 font-semibold">
                <tr>
                  <TableHead className="px-4 py-3 text-left">Image</TableHead>
                  <TableHead className="px-4 py-3 text-left">Order Number</TableHead>
                  <TableHead className="px-4 py-3 text-left">Customer</TableHead>
                  <TableHead className="px-4 py-3 text-left">Email</TableHead>
                  <TableHead className="px-4 py-3 text-left">Delivery</TableHead>
                  <TableHead className="px-4 py-3 text-left">Status</TableHead>
                  <TableHead className="px-4 py-3 text-left">Items</TableHead>
                  <TableHead className="px-4 py-3 text-left">Total</TableHead>
                  <TableHead className="px-4 py-3 text-left">Created</TableHead>
                </tr>
              </TableHeader>

              <TableBody className="divide-y divide-gray-100">
                {tableRows.length > 0 ? (
                  tableRows.map((r) => {
                    const delivery = deliveryBadge(r.paymentMethod, r.paymentStatus);
                    return (
                      <TableRow
                        key={r.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => onActivateRow(r.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onActivateRow(r.id);
                          }
                        }}
                        aria-label={`Open order ${r.orderNumber}`}
                      >
                        {/* Order + thumbnails */}
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {/* thumbnails: up to 3 */}
                            <div className="relative flex items-center" title={`${r.itemCount} item${r.itemCount === 1 ? "" : "s"}`}>
                              {r.items.slice(0, 3).map((it, idx) => (
                                it.image ? (
                                  <img
                                    key={idx}
                                    src={it.image}
                                    alt={it.title || `Item ${idx + 1}`}
                                    title={it.title || `Item ${idx + 1}`}
                                    className="w-9 h-9 rounded-md object-cover border border-white shadow-sm transition-transform duration-150 hover:scale-[1.05]"
                                    style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: idx + 1 }}
                                  />
                                ) : (
                                  <div
                                    key={idx}
                                    className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-400 border border-white shadow-sm"
                                    style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: idx + 1 }}
                                  >
                                    ?
                                  </div>
                                )
                              ))}
                              {r.items.length > 3 && (
                                <div
                                  className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700 border border-white shadow-sm ml-[-6px]"
                                  style={{ zIndex: 4 }}
                                >
                                  +{r.items.length - 3}
                                </div>
                              )}
                            </div>


                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">{r.orderNumber}</div>

                          </div>
                        </TableCell>
                        {/* Customer */}
                        <TableCell className="px-4 py-3">
                          <div className="font-medium text-gray-900">{r.customerName || r.email}</div>
                          <div className="text-xs text-gray-500">{r.customerPhone || "—"}</div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="px-4 py-3">
                          <div className="text-sm text-gray-700 break-all">{r.email}</div>
                        </TableCell>

                        {/* Delivery */}
                        <TableCell className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${delivery.cls}`}>
                            {delivery.text}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-800"}`}
                            role="status"
                            aria-label={`Order status ${r.status}`}
                          >
                            {r.status}
                          </span>
                        </TableCell>

                        {/* Items count */}
                        <TableCell className="px-4 py-3">
                          <div className="text-sm text-gray-700">{Number(r.itemCount || 0)}</div>
                        </TableCell>

                        {/* Total */}
                        <TableCell className="px-4 py-3 font-semibold">₹{Number(r.total || 0)}</TableCell>

                        {/* Created */}
                        <TableCell className="px-4 py-3 text-gray-600">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="p-8 text-center text-gray-500">
                      No orders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>


            {/* pagination */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-sm px-3">{page}</div>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="p-2 border border-gray-200 rounded-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

  
    </div>
  );
}
