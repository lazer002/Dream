// src/pages/admin/AdvancedOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/config";
import { Link } from "react-router-dom";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  MoreHorizontal,
  ChevronDown
} from "lucide-react";



const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString();
}

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [sendingEmailFor, setSendingEmailFor] = useState(null);

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
      if (dateFrom) params.append("from", dateFrom);
      if (dateTo) params.append("to", dateTo);
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
  }, [debouncedSearch, status, source, page, limit, sort, dateFrom, dateTo]);

  // CSV export
  const exportCsv = () => {
    if (!orders || orders.length === 0) return;
    const rows = [
      [
        "OrderNumber",
        "Email",
        "Status",
        "Total",
        "ItemsCount",
        "CreatedAt",
        "Source",
      ],
      ...orders.map((o) => [
        o.orderNumber,
        o.email,
        o.orderStatus,
        o.total,
        o.itemCount ?? o.items?.length ?? 0,
        o.createdAt,
        o.source,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // change status (open modal)
  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus || "pending");
    setShowStatusModal(true);
  };

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

  const doSendEmail = async (orderId) => {
    try {
      setSendingEmailFor(orderId);
      await api.post(`/admin/orders/${orderId}/email`);
      alert("Email queued/sent.");
    } catch (err) {
      console.error("send email:", err);
      alert("Failed to send email");
    } finally {
      setSendingEmailFor(null);
    }
  };

  const pageCount = Math.ceil(total / limit) || 1;

  const tableRows = useMemo(() => {
    if (!orders) return [];
    return orders.map((o) => ({
      id: o._id,
      orderNumber: o.orderNumber,
      email: o.email,
      total: o.total,
      status: o.orderStatus,
      createdAt: o.createdAt,
      itemCount: o.itemCount ?? (o.items?.length ?? 0),
      source: o.source,
    }));
  }, [orders]);

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
  <div className="flex items-center gap-2 flex-1">
    <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 w-full max-w-lg">
      <Search className="w-4 h-4 text-gray-500" />
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by order #, email or phone"
        className="w-full outline-none text-sm"
      />
    </div>
  </div>

  <div className="flex items-center gap-2 flex-wrap">
    {/* STATUS */}
    <div className="relative">
      <select
        value={status}
        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        className="appearance-none pr-8 pl-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="dispatched">Dispatched</option>
        <option value="delivered">Delivered</option>
        <option value="canceled">Canceled</option>
      </select>
      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>

    {/* SOURCE */}
    <div className="relative">
      <select
        value={source}
        onChange={(e) => { setSource(e.target.value); setPage(1); }}
        className="appearance-none pr-8 pl-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
      >
        <option value="">All sources</option>
        <option value="web">Web</option>
        <option value="mobile">Mobile</option>
        <option value="admin">Admin</option>
      </select>
      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>

    {/* LIMIT */}
    <div className="relative">
      <select
        value={limit}
        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
        className="appearance-none pr-8 pl-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
      >
        <option value={10}>10 / page</option>
        <option value={20}>20 / page</option>
        <option value={50}>50 / page</option>
        <option value={100}>100 / page</option>
      </select>
      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>

    {/* SORT */}
    <div className="relative">
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value)}
        className="appearance-none pr-8 pl-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
      </select>
      <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>

    {/* DATE RANGE */}
    <div className="flex items-center gap-2">
      <div className="relative">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="appearance-none pr-8 pl-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
        />
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>

      <div className="relative">
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="appearance-none pr-8 pl-3 py-2 border border-gray-200 rounded-md text-sm bg-white"
        />
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
      </div>
    </div>

    <button
      onClick={() => {
        setSearch("");
        setStatus("");
        setSource("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
      }}
      className="px-3 py-2 rounded-md border border-gray-200 text-sm"
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
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-gray-700 font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Order</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Items</th>
                  <th className="px-4 py-3 text-left">Total</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableRows.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{r.orderNumber}</div>
                      <div className="text-xs text-gray-500">#{r.id}</div>
                    </td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[r.status] || "bg-gray-100 text-gray-800"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.itemCount}</td>
                    <td className="px-4 py-3 font-semibold">₹{r.total}</td>
                    <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/orders/${r.id}`} className="text-sm text-blue-600 hover:underline">View</Link>
                        <button onClick={() => openStatusModal(orders.find(o => o._id === r.id))} className="px-2 py-1 rounded-md border border-gray-200 text-sm">Change</button>
                        <button onClick={() => doSendEmail(r.id)} className="px-2 py-1 rounded-md border border-gray-200 text-sm inline-flex items-center gap-2">
                          {sendingEmailFor === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Email
                        </button>
                        <button className="p-1 rounded-md border border-gray-200">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">No orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>

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

      {/* Status modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Change status — {selectedOrder.orderNumber}</h3>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 mb-4">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="canceled">Canceled</option>
            </select>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowStatusModal(false)} className="px-3 py-2 rounded-md border border-gray-200">Cancel</button>
              <button onClick={doChangeStatus} disabled={statusChanging} className="px-3 py-2 rounded-md bg-black text-white">
                {statusChanging ? "Updating..." : "Update status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
