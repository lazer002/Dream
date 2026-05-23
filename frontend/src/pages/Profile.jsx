import { useEffect, useMemo, useState,useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import api  from "@/utils/config";
import {
  Box,
  Heart,
  MapPin,
  User,
  LogOut,

  Mail,
  SearchIcon ,
  RefreshCcw, 
} from "lucide-react";
import { useWishlist } from "@/state/WishlistContext";
import { useCart } from "@/state/CartContext";
import { Dialog,DialogContent,DialogHeader ,DialogTitle ,DialogClose   } from "@/components/ui/dialog.jsx";
import toast from "react-hot-toast";

function TabButton({ tab, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-4 text-left transition rounded-tl-lg rounded-tr-lg ${
        active
          ? "bg-gray-100 dark:bg-slate-800 font-semibold text-gray-900 dark:text-slate-100"
          : "hover:bg-gray-50 dark:hover:bg-slate-900 text-gray-700 dark:text-slate-300"
      }`}
    >
      {tab.icon}
      <span className="truncate">{tab.label}</span>
      {tab.hint && <span className="ml-auto text-xs text-gray-400">{tab.hint}</span>}
    </button>
  );
}

export default function Profile() {
  const { user, logout, updateUser,setUser, loading,authStatus  } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

if (authStatus === "loading") {
  return (
    <div className="flex items-center justify-center h-screen">
      Loading...
    </div>
  );
}

if (authStatus === "unauthenticated") {
  return <Navigate to="/login" replace />;
}


  const tabs = [
    { id: "orders", label: "Orders & Returns", icon: <Box size={18} /> },
    { id: "wishlist", label: "My Wishlist", icon: <Heart size={18} /> },
    { id: "addresses", label: "Saved Addresses", icon: <MapPin size={18} /> },
    { id: "account", label: "Account Settings", icon: <User size={18} /> },
  ];

return (
  <div className="min-h-screen bg-neutral-50">
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

      <div className="space-y-6">

        {/* HERO CARD */}
        <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">

          {/* Top */}
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center gap-5 sm:flex-row sm:items-center sm:text-left">

              <img
                src={
                  user?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.name || "User"
                  )}`
                }
                alt="avatar"
                className="h-24 w-24 rounded-full object-cover ring-4 ring-neutral-100"
              />

             <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="truncate text-3xl font-bold text-neutral-900">
                  {user?.name}
                </h1>

                <p className="mt-1 truncate text-neutral-500">
                  {user?.email}
                </p>
              </div>

         <button
  onClick={() => setShowLogoutConfirm(true)}
  className="
    w-full
    sm:w-auto
    rounded-2xl
    border
    border-red-200
    px-5
    py-3
    font-medium
    text-red-600
    transition
    hover:bg-red-50
  "
>
  Sign Out
</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-neutral-200 px-4 py-4">

            <div
              className="
                flex
                gap-3
                overflow-x-auto
                pb-1
              "
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex-shrink-0
                    rounded-2xl
                    px-5
                    py-3
                    text-sm
                    font-medium
                    transition-all
                    ${
                      activeTab === tab.id
                        ? "bg-black text-white shadow-sm"
                        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* CONTENT */}
        <div
          className="
            rounded-[32px]
            border
            border-neutral-200
            bg-white
            p-4
            sm:p-8
            shadow-sm
          "
        >
          {activeTab === "orders" && <OrdersContent />}

          {activeTab === "wishlist" && (
            <WishlistContent user={user} />
          )}

          {activeTab === "addresses" && (
            <AddressesContent user={user} />
          )}

          {activeTab === "account" && (
            <AccountContent user={user} />
          )}
        </div>

      </div>

      {/* LOGOUT MODAL */}
      {showLogoutConfirm && (
        <Modal onClose={() => setShowLogoutConfirm(false)}>
          <div className="p-6">

            <h3 className="text-xl font-semibold text-black">
              Confirm Sign Out
            </h3>

            <p className="mt-2 text-sm text-neutral-500">
              Are you sure you want to sign out of your account?
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="
                  rounded-xl
                  border
                  border-neutral-300
                  px-4
                  py-2
                  text-sm
                  font-medium
                  hover:bg-neutral-50
                "
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="
                  rounded-xl
                  bg-red-600
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  hover:bg-red-700
                "
              >
                Sign Out
              </button>

            </div>
          </div>
        </Modal>
      )}
    </div>
  </div>
);
}

/* ---------------------
   OrdersContent
   --------------------- */
function formatCurrency(v) {
  if (v == null) return "₹0";
  const num = Number(v) || 0;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
}
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString();
}

 function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 const { add, addBundle } = useCart();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDir, setSortDir] = useState("desc");
  const [refreshing, setRefreshing] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
  const [modalOrder, setModalOrder] = useState(null);
  const [cancelModal, setCancelModal] = useState({
  open: false,
  order: null,
});
  const printRef = useRef(null);
  async function fetchOrders() {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get("/orders/mine");
      const data = res.data?.orders || [];
      const normalized = data.map((o) => {
        const total = o.total ?? o.totalPrice ?? o.amount ?? 0;
        const createdAt = o.createdAt || o.created_at || o.createdAt;
        const itemCount = Array.isArray(o.items) ? o.items.length : o.itemCount ?? 0;
        return { ...o, total, createdAt, itemCount };
      });
      setOrders(normalized);
    } catch (err) {
      console.error("fetch orders failed", err?.response?.data || err.message);
      setError(err?.response?.data?.error || err.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrders();
  }, []);

const filtered = useMemo(() => {
  let list = [...orders];

  if (searchTerm.trim()) {
    const q = searchTerm.trim().toLowerCase();

    list = list.filter((o) => {
      const num = (o.orderNumber || o._id || o.id || "")
        .toString()
        .toLowerCase();

      const email = (o.email || "").toLowerCase();

      const items = (o.items || []).some((it) =>
        (it.title || it.productName || "")
          .toLowerCase()
          .includes(q)
      );

      return num.includes(q) || email.includes(q) || items;
    });
  }

  if (statusFilter !== "all") {
    list = list.filter(
      (o) =>
        (o.orderStatus || o.status || "").toLowerCase() ===
        statusFilter.toLowerCase()
    );
  }

  list.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime() || 0;
    const tb = new Date(b.createdAt).getTime() || 0;
    return sortDir === "desc" ? tb - ta : ta - tb;
  });

  return list;
}, [orders, searchTerm, statusFilter, sortDir]);



useEffect(() => {
  const timer = setTimeout(() => {
    setSearchTerm(query);
  }, 300);

  return () => clearTimeout(timer);
}, [query]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }


async function handleCancel(orderId) {
  try {
    const { data } = await api.put("/orders/cancel", {
      orderId,
    });

    toast.success(
      data.message || "Order cancelled successfully"
    );

    await fetchOrders();

    setModalOrder(null);
  } catch (err) {
    toast.error(
      err.response?.data?.error ||
      "Cancel failed"
    );
  }
}

async function handleReorder(order) {
  try {
    for (const item of order.items) {
      if (item.productId) {
        for (let i = 0; i < item.quantity; i++) {
          add(item.productId, item.variant);
        }
      }

      if (item.bundleId) {
        addBundle(item.bundleId, item.quantity);
      }
    }

  } catch (err) {
    toast.error(err.message || "Reorder failed");
  }
}

  const StatusBadge = ({ status }) => {
    const s = (status || "pending").toLowerCase();
    const bg =
      s === "pending" ? "bg-yellow-100 text-yellow-800" :
      s === "fulfilled" || s === "completed" ? "bg-green-100 text-green-800" :
      s === "cancelled" || s === "canceled" ? "bg-red-100 text-red-800" :
      "bg-gray-100 text-gray-800";
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg}`}>{status}</span>;
  };
  const canCancel =
    modalOrder &&
    ["pending", "confirmed"].includes(
      (
        modalOrder.orderStatus ||
        modalOrder.status ||
        ""
      ).toLowerCase()
    );


  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="p-4 border rounded animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
{/* Controls */}
<div
  className="
    flex
    flex-col
    lg:flex-row
    lg:items-center
    lg:justify-between
    gap-4
  "
>
  {/* Left Side */}
  <div
    className="
      flex
      flex-col
      md:flex-row
      md:items-center
      gap-3
      flex-1
    "
  >
    {/* Search */}
    <div
      className="
        flex
        items-center
        h-12
        w-full
        md:w-80
        rounded-2xl
        border
        border-gray-200
        bg-white
        px-4
      "
    >
      <SearchIcon
        size={16}
        className="text-gray-400 shrink-0"
      />

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search order number, email or item..."
        className="
          ml-2
          w-full
          border-none
          bg-transparent
          outline-none
          text-sm
        "
      />
    </div>

    {/* Status Filter */}
    <select
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      className="
        h-12
        w-full
        md:w-auto
        min-w-[180px]
        rounded-2xl
        border
        border-gray-200
        bg-white
        px-4
        text-sm
      "
    >
      <option value="all">All statuses</option>
      <option value="pending">Pending</option>
      <option value="fulfilled">Fulfilled</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>

    {/* Sort */}
    <select
      value={sortDir}
      onChange={(e) => setSortDir(e.target.value)}
      className="
        h-12
        w-full
        md:w-auto
        min-w-[170px]
        rounded-2xl
        border
        border-gray-200
        bg-white
        px-4
        text-sm
      "
    >
      <option value="desc">Newest first</option>
      <option value="asc">Oldest first</option>
    </select>
  </div>

  {/* Right Side */}
  <div className="flex items-center">
    <button
      onClick={handleRefresh}
      className="
        h-12
        rounded-2xl
        border
        border-gray-200
        bg-white
        px-5
        flex
        items-center
        justify-center
        gap-2
        whitespace-nowrap
        transition
        hover:bg-gray-50
      "
    >
      <RefreshCcw
        size={16}
        className={refreshing ? "animate-spin" : ""}
      />

      {refreshing ? "Refreshing..." : "Refresh"}
    </button>
  </div>
</div>
      {error && <div className="p-3 bg-red-50 text-red-800 border rounded">Error: {error}</div>}

      {!filtered.length && <div className="p-6 border rounded text-center text-gray-500">No orders found.</div>}

<div className="space-y-5">
  {filtered.map((order) => {
    const firstItem =
      Array.isArray(order.items) && order.items.length
        ? order.items[0]
        : null;

    const img =
      firstItem?.mainImage ||
      firstItem?.image ||
      "";

    const productId =
      firstItem?.productId || null;

    const bundleId =
      firstItem?.bundleId || null;

    const pdpUrl = productId
      ? `/product/${productId}`
      : bundleId
      ? `/bundle/${bundleId}`
      : "#";

    return (
      <div
        key={order._id || order.id}
        className="
          group
          overflow-hidden
          rounded-[30px]
          border
          border-neutral-200
          bg-white
          p-5
          transition-all
          duration-300
          hover:border-neutral-300
          hover:shadow-xl
        "
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_240px]">

          {/* LEFT SIDE */}
          <div className="flex flex-col sm:flex-row gap-5">

            {/* IMAGE */}
            <Link
              to={pdpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                mx-auto
                sm:mx-0
                h-28
                w-28
                overflow-hidden
                rounded-2xl
                border
                border-neutral-200
                bg-neutral-100
                flex-shrink-0
              "
            >
              {img ? (
                <img
                  src={img}
                  alt={firstItem?.title || "Product"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                  No Image
                </div>
              )}
            </Link>

            {/* DETAILS */}
            <div className="flex flex-1 flex-col justify-center">

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  justify-center
                  sm:justify-start
                  gap-3
                "
              >
                <button
                  onClick={() => setModalOrder(order)}
                  className="
                    text-xl
                    font-bold
                    text-neutral-900
                    hover:text-blue-600
                  "
                >
                  #
                  {order.orderNumber ||
                    (order._id || order.id).slice(-8)}
                </button>

                <StatusBadge
                  status={
                    order.orderStatus ||
                    order.status ||
                    "pending"
                  }
                />
              </div>

              <div
                className="
                  mt-2
                  text-center
                  sm:text-left
                  text-sm
                  text-neutral-500
                "
              >
                {formatDate(order.createdAt)}
              </div>

              {firstItem?.title && (
                <Link
                  to={pdpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    mt-3
                    text-center
                    sm:text-left
                    text-lg
                    font-medium
                    text-neutral-900
                    hover:text-blue-600
                  "
                >
                  {firstItem.title}
                </Link>
              )}

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  justify-center
                  sm:justify-start
                  gap-5
                  text-sm
                "
              >
                <div>
                  <span className="font-semibold">
                    Items:
                  </span>{" "}
                  {order.itemCount ??
                    (order.items || []).length}
                </div>

                <div>
                  <span className="font-semibold">
                    Payment:
                  </span>{" "}
                  {order.paymentStatus || "Paid"}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div
            className="
              flex
              flex-col
              justify-center
              rounded-3xl
              bg-neutral-100
              p-5
              text-center
              lg:text-right
            "
          >
            <div
              className="
                text-xs
                uppercase
                tracking-widest
                text-neutral-500
              "
            >
              Order Total
            </div>

            <div
              className="
                mt-2
                text-4xl
                font-bold
                text-black
              "
            >
              {formatCurrency(order.total)}
            </div>

            <button
              onClick={() => setModalOrder(order)}
              className="
                mt-5
                h-12
                w-full
                rounded-xl
                bg-black
                font-medium
                text-white
                transition
                hover:bg-neutral-800
              "
            >
              View Order
            </button>
          </div>

        </div>
      </div>
    );
  })}
</div>



      {/* modal */}
{modalOrder && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    role="dialog"
    aria-modal="true"
  >
    <div
      id="print-section"
      ref={printRef}
      className="w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-2xl print-area"
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-bold text-gray-900">
                Order {modalOrder.orderNumber || (modalOrder._id || modalOrder.id)}
              </h3>

              <StatusBadge
                status={modalOrder.orderStatus || modalOrder.status || "pending"}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>{formatDate(modalOrder.createdAt)}</span>
              <span>•</span>
              <span>{modalOrder.email || "—"}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
            >
              Print
            </button>

            <button
              onClick={() => setModalOrder(null)}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-3">
        {/* LEFT SIDEBAR */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Summary
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(
                    modalOrder.subtotal ??
                    modalOrder.total ??
                    modalOrder.amount ??
                    0
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>
                  {modalOrder.shippingFee
                    ? formatCurrency(modalOrder.shippingFee)
                    : "—"}
                </span>
              </div>

              {modalOrder.couponDiscount ? (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span>
                    -{formatCurrency(modalOrder.couponDiscount)}
                  </span>
                </div>
              ) : null}

              <div className="flex justify-between border-t pt-4 text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(modalOrder.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Payment
            </div>

            <div className="font-medium text-gray-900">
              {modalOrder.paymentMethod
                ? modalOrder.paymentMethod.toUpperCase()
                : "—"}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Shipping Address
            </div>

            <div className="text-sm leading-6 text-gray-600">
              {modalOrder.shippingAddress?.firstName}{" "}
              {modalOrder.shippingAddress?.lastName}
              <br />
              {modalOrder.shippingAddress?.address}
              {modalOrder.shippingAddress?.apartment
                ? `, ${modalOrder.shippingAddress.apartment}`
                : ""}
              <br />
              {modalOrder.shippingAddress?.city},{" "}
              {modalOrder.shippingAddress?.state}{" "}
              {modalOrder.shippingAddress?.zip}
              <br />
              {modalOrder.shippingAddress?.country}
              <br />
              Phone: {modalOrder.shippingAddress?.phone}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-4 text-lg font-semibold">
              Order Progress
            </div>

            {Array.isArray(modalOrder.statusHistory) &&
            modalOrder.statusHistory.length ? (
              <ol className="space-y-4">
                {modalOrder.statusHistory.map((s, idx) => (
                  <li
                    key={s._id || s.id || idx}
                    className="flex gap-4"
                  >
                    <div className="mt-2 h-3 w-3 rounded-full bg-black" />

                    <div>
                      <div className="font-medium">
                        {s.status}
                      </div>

                      <div className="text-xs text-gray-500">
                        {s.updatedAt
                          ? formatDate(s.updatedAt)
                          : "—"}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-gray-500">
                No status updates yet
              </div>
            )}
          </div>

          {/* Items */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="mb-5 text-lg font-semibold">
              Items (
              {modalOrder.itemCount ??
                (modalOrder.items || []).length}
              )
            </div>

            <ul className="space-y-4">
              {Array.isArray(modalOrder.items) &&
              modalOrder.items.length ? (
                modalOrder.items.map((it) => {
                  const img =
                    it.mainImage || it.image || "";

                  const badge = it.bundleId
                    ? "Bundle"
                    : it.productId
                    ? "Product"
                    : "Item";

                  return (
                    <li
                      key={
                        it._id ||
                        it.id ||
                        `${it.productId}-${it.variant || ""}`
                      }
                      className="flex gap-4 rounded-2xl border border-gray-200 p-4 transition hover:bg-gray-50"
                    >
                      <div className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                        {img ? (
                          <img
                            src={img}
                            alt={it.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No image
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="font-semibold text-gray-900">
                            {it.title || "Item"}
                          </div>

                          <div className="text-lg font-semibold">
                            {formatCurrency(it.price)}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                          <span>
                            Variant: {it.variant ?? it.size ?? "—"}
                          </span>
                          <span>Qty: {it.quantity}</span>
                          <span>{badge}</span>
                        </div>

                        {it.sku && (
                          <div className="mt-2 text-xs text-gray-400">
                            SKU: {it.sku}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">
                  No items
                </div>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
      

              <button
                onClick={() => handleReorder(modalOrder)}
                className="rounded-xl bg-black px-5 py-2.5 font-medium text-white hover:bg-gray-800"
              >
                Reorder
              </button>

              <button
                disabled={!canCancel}
                onClick={() =>
                  setCancelModal({
                    open: true,
                    order: modalOrder,
                  })
                }
                className={`rounded-xl px-5 py-2.5 font-medium transition ${
                  canCancel
                    ? "border border-gray-300 hover:bg-gray-50"
                    : "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400"
                }`}
              >
                {canCancel ? "Cancel Order" : "Order Cancelled"}
              </button>

            <Link
              to={`mailto:support@yourdomain.com?subject=Order%20${encodeURIComponent(
                modalOrder.orderNumber ||
                modalOrder._id
              )}`}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

{/* order CANCEL MODAL */}
{cancelModal.open && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">

    {/* BACKDROP */}
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
      onClick={() =>
        setCancelModal({
          open: false,
          order: null,
        })
      }
    />

    {/* MODAL */}
    <div className="relative w-full max-w-md rounded-[30px] bg-white p-7 shadow-[0_20px_60px_rgba(0,0,0,0.12)]">

      {/* CLOSE */}
      <button
        onClick={() =>
          setCancelModal({
            open: false,
            order: null,
          })
        }
        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition"
      >
        ✕
      </button>

      {/* HEADER */}
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-gray-400">
          Order Management
        </p>

        <h2 className="mt-3 text-[30px] font-semibold tracking-tight text-black">
          Cancel Order
        </h2>
      </div>

      {/* ORDER CARD */}
<div className="mt-6 rounded-3xl border border-gray-200 p-5">
  <div className="flex gap-4">

    {/* IMAGE */}
    <img
      src={
        cancelModal.order?.items?.[0]?.mainImage ||
        cancelModal.order?.items?.[0]?.image ||
        "/placeholder.png"
      }
      alt={cancelModal.order?.items?.[0]?.title || "Product"}
      className="h-24 w-20 flex-shrink-0 rounded-xl object-cover bg-gray-100"
    />

    {/* CONTENT */}
    <div className="flex-1">
      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
        Order Number
      </p>

      <p className="mt-1 text-lg font-semibold text-black">
        #{cancelModal.order?.orderNumber}
      </p>

      <p className="mt-2 line-clamp-2 text-sm font-medium text-black">
        {cancelModal.order?.items?.[0]?.title}
      </p>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          Total
        </span>

        <span className="font-semibold text-black">
          {formatCurrency(cancelModal.order?.total)}
        </span>
      </div>
    </div>
  </div>

  <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
    Are you sure you want to cancel this order?
    <br />
    This action cannot be undone.
  </div>
</div>

      {/* BUTTONS */}
      <div className="mt-8 grid grid-cols-2 gap-3">

        {/* KEEP ORDER */}
        <button
          onClick={() =>
            setCancelModal({
              open: false,
              order: null,
            })
          }
          className="h-14 rounded-2xl border border-gray-300 bg-white text-sm font-semibold tracking-wide text-black transition hover:bg-gray-100"
        >
          KEEP ORDER
        </button>

        {/* CANCEL ORDER */}
        <button
          onClick={async () => {
            try {
              await handleCancel(
                cancelModal.order._id ||
                cancelModal.order.id
              );

              setCancelModal({
                open: false,
                order: null,
              });

          
            } catch (err) {
              toast.error("Cancel failed");
            }
          }}
          className="h-14 rounded-2xl bg-black text-sm font-semibold tracking-wide text-white transition hover:opacity-90"
        >
          CANCEL ORDER
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}


/* ---------------------
   WishlistContent
   --------------------- */

function WishlistContent() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { add } = useCart();
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedProduct, setSelectedProduct] = useState(null);
const [selectedSize, setSelectedSize] = useState(null);
  const [products, setProducts] = useState([]);

  /* 🔥 Fetch full product data from IDs */
  useEffect(() => {
    if (!wishlist.length) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await api.get("/products/by-ids", {
          params: { ids: wishlist.join(",") },
        });

        setProducts(res.data.items || []);
      } catch (err) {
        console.error("Wishlist fetch error:", err);
      }
    };

    fetchProducts();
  }, [wishlist]);

const addToCart = (product) => {
  setSelectedProduct(product);
  setSelectedSize(null);
  setIsModalOpen(true);
};

const handleSelectSize = (size) => {
  if (!selectedProduct) return;

  add(selectedProduct._id, size); // your cart context

    removeFromWishlist(selectedProduct._id);
  setIsModalOpen(false);
  setSelectedProduct(null);
};

return (
    <div>

<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="max-w-sm w-[90%]">
    <DialogHeader>
      <DialogTitle>Select Size</DialogTitle>
      <DialogClose />
    </DialogHeader>

    <div className="p-4 flex flex-col gap-4">
      {selectedProduct && (
        <>
       

          <div>
            <div className="text-sm text-gray-600 mb-2">Choose Size</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedProduct.inventory || {}).map(([size, qty]) => (
                <button
                  key={size}
                  onClick={() => handleSelectSize(size)}
                  disabled={qty <= 0}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition
                    ${
                      qty <= 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "hover:bg-black hover:text-white"
                    }`}
                  title={qty <= 0 ? "Out of stock" : `Add ${size} to cart`}
                >
                  <div className="flex flex-col items-center">
                    <span>{size}</span>
                    <small className="text-xs">{qty > 0 ? `${qty} left` : "Out"}</small>
                  </div>
                </button>
              ))}
            </div>

            {Object.values(selectedProduct.inventory || {}).every((q) => q <= 0) && (
              <div className="mt-3 text-sm text-red-500 font-medium">Out of Stock</div>
            )}
          </div>
        </>
      )}
    </div>
  </DialogContent>
</Dialog>

    <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4">
  <div>
    <h2 className="text-2xl font-bold tracking-tight">
      Wishlist
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Products you've saved for later
    </p>
  </div>

  <div className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium">
    {products.length} items
  </div>
</div>

      {products.length === 0 ? (
        <p className="text-gray-600">Your wishlist is empty.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {products.map((it) => (
   <li
  key={it._id}
  className="group flex items-center gap-5 rounded-3xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:shadow-lg"
>
  {/* IMAGE */}
  <Link
    to={`/product/${it._id}`}
    className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-100"
  >
    {it.images?.[0] ? (
      <img
        src={it.images[0]}
        alt={it.title}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
        No Image
      </div>
    )}
  </Link>

  {/* PRODUCT INFO */}
  <div className="min-w-0 flex-1">
    <Link to={`/product/${it._id}`}>
      <h3 className="text-lg font-semibold text-black hover:underline">
        {it.title}
      </h3>
    </Link>

    <p className="mt-1 text-sm text-gray-500">
      Saved for later
    </p>

    <div className="mt-3 text-2xl font-bold text-black">
      ₹{Number(it.price).toLocaleString()}
    </div>

    <div className="mt-4 flex flex-wrap gap-3">
      <button
        onClick={() => addToCart(it)}
        className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
      >
        Add To Cart
      </button>

      <button
        onClick={() => removeFromWishlist(it._id)}
        className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-black transition hover:bg-gray-50"
      >
        Remove
      </button>
    </div>
  </div>
</li>
          ))}
        </ul>
      )}
      
    </div>
  );

  
}
/* ---------------------
   AddressesContent
   --------------------- */
function AddressesContent({ user, updateUser }) {
const [addresses, setAddresses] = useState([]);
const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

useEffect(() => {
  const fetchAddresses = async () => {
    try {
      const { data } = await api.get("/address");
      setAddresses(data.addresses || []);
    } catch (err) {
      console.error("Failed to load addresses", err);
    } finally {
      setLoading(false);
    }
  };

  fetchAddresses();
}, []);

const save = (updatedAddresses) => {
  setAddresses([...updatedAddresses]); // ✅ correct
  setShowModal(false);
  setEditing(null);
};

const remove = async (id) => {
  const address = addresses.find((a) => a._id === id);

  // 🚫 block default delete
  if (address?.isDefault) {
    toast.error("Default address cannot be deleted" );
    return;
  }

  try {
    await api.delete(`/address/${id}`);

    // update UI
    setAddresses((prev) =>
      prev.filter((a) => a._id !== id)
    );

    toast.success("Address deleted" );

  } catch (err) {
    console.error("Delete failed:", err);
    toast.error("Failed to delete address" );
  }
};
const setDefaultAddress = async (id) => {
  try {
    const { data } = await api.put(`/address/${id}`, {
      isDefault: true,
    });

    // backend returns updated list
    setAddresses(data.addresses);
    toast.success("Default address updated" );
  } catch (err) {
    console.error("Set default failed:", err);
    toast.error("Failed to set default address" );
  }
};


return (
  <div className=" mx-auto">
    {/* Header */}
<div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <div>
    <h2 className="text-3xl font-bold tracking-tight text-black">
      Addresses
    </h2>

    <p className="mt-1 text-sm text-gray-500">
      Manage your saved delivery addresses
    </p>
  </div>

  <button
    onClick={() => {
      setEditing(null);
      setShowModal(true);
    }}
    className="rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
  >
    Add Address
  </button>
</div>

    {/* Empty state */}
    {addresses.length === 0 ? (
      <div className="border border-gray-200 p-10 text-center">
        <p className="text-gray-600 mb-4">
          You haven’t added any addresses yet.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="border border-black px-4 py-2 text-sm hover:bg-black hover:text-white transition"
        >
          Add your first address
        </button>
      </div>
    ) : (
      <div className="grid gap-4">
{addresses.map((a) => (
  <div
    key={a._id}
    className={`group rounded-3xl border bg-white p-6 transition-all duration-300
      ${
        a?.isDefault
          ? "border-black shadow-sm"
          : "border-gray-200 hover:border-gray-400 hover:shadow-sm"
      }
    `}
  >
    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

      {/* LEFT */}
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-3">

          <h3 className="text-lg font-semibold text-black">
            {a?.name || "Address"}
          </h3>

          {a?.isDefault ? (
            <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
              Default Address
            </span>
          ) : (
            <button
              onClick={() => setDefaultAddress(a._id)}
              className="rounded-full border border-gray-300 px-3 py-1 text-xs font-medium transition hover:border-black"
            >
              Set as Default
            </button>
          )}
        </div>

        <div className="mt-4 space-y-1 text-sm leading-6 text-gray-600">
          <p>{a?.address}</p>

          <p>
            {a?.city}, {a?.state} - {a?.zip}
          </p>

          {a?.phone && (
            <p className="text-gray-500">
              {a.phone}
            </p>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setEditing(a);
            setShowModal(true);
          }}
          className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium transition hover:border-black hover:bg-gray-50"
        >
          Edit
        </button>

        {!a?.isDefault && (
          <button
            onClick={() => remove(a._id)}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  </div>
))}
      </div>
    )}

    {/* Modal */}
    {showModal && (
      <AddressModal
        initial={editing}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSave={save}
      />
    )}
  </div>
);
}

function AddressModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [city, setCity] = useState(initial?.city || "");
  const [state, setState] = useState(initial?.state || "");
  const [zip, setZip] = useState(initial?.zip || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

const submit = async () => {
  if (!name || !address || !city || !state || !zip) {
    setError("Please fill all required fields");
    return;
  }

  try {
    setError("");
    setSaving(true);

    const payload = {
      name,
      phone,
      address,
      city,
      state,
      zip,
      isDefault: initial?.isDefault || false,
    };

    let res;

    if (initial?._id) {
      // 🔥 UPDATE
      res = await api.put(`/address/${initial._id}`, payload);
    } else {
      // 🔥 ADD
      res = await api.post(`/address`, payload);
    }

    // backend returns full list → use it
    onSave(res.data.addresses);

    setSaving(false);
    onClose();

  } catch (err) {
    console.error(err);
    setError("Failed to save address");
    setSaving(false);
  }
};

  return (
    <Modal onClose={onClose} className="p-4 ">
      <div className="w-full max-w-lg bg-white p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-black">
            {initial ? "Edit Address" : "Add Address"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        {/* Form */}
    <div className="grid gap-4 edit-modal">

  <input
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Full Name *"
    className="w-full border-b border-gray-300 px-0 py-2 text-sm bg-transparent 
               focus:outline-none focus:border-black placeholder-gray-400"
  />

  <input
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
    placeholder="Phone Number"
    className="w-full border-b border-gray-300 px-0 py-2 text-sm bg-transparent 
               focus:outline-none focus:border-black placeholder-gray-400"
  />

  <textarea
    value={address}
    onChange={(e) => setAddress(e.target.value)}
    placeholder="Street Address *"
    rows={3}
    className="w-full border-b border-gray-300 px-0 py-2 text-sm bg-transparent 
               focus:outline-none focus:border-black placeholder-gray-400 resize-none"
  />

  <div className="grid grid-cols-2 gap-4">
    <input
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="City *"
      className="w-full border-b border-gray-300 px-0 py-2 text-sm bg-transparent 
                 focus:outline-none focus:border-black placeholder-gray-400"
    />

    <input
      value={state}
      onChange={(e) => setState(e.target.value)}
      placeholder="State *"
      className="w-full border-b border-gray-300 px-0 py-2 text-sm bg-transparent 
                 focus:outline-none focus:border-black placeholder-gray-400"
    />
  </div>

  <input
    value={zip}
    onChange={(e) => setZip(e.target.value)}
    placeholder="PIN Code *"
    className="w-full border-b border-gray-300 px-0 py-2 text-sm bg-transparent 
               focus:outline-none focus:border-black placeholder-gray-400"
  />

  {error && (
    <p className="text-sm text-red-500">{error}</p>
  )}
</div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm hover:border-black"
          >
            Cancel
          </button>

          <button
            onClick={submit}
            className="px-5 py-2 bg-black text-white text-sm hover:opacity-90"
          >
            {saving ? "Saving..." : "Save Address"}
          </button>
        </div>
      </div>
    </Modal>
  );
}




 function AccountContent({ user ,loading }) {
  const { setUser } = useAuth();
const [editing, setEditing] = useState(false);
const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [avatarPreview, setAvatarPreview] = useState("");
const [avatarFile, setAvatarFile] = useState(null);
const [saving, setSaving] = useState(false);

// address
const [addresses, setAddresses] = useState([]);


/* ================= INIT ================= */
useEffect(() => {
  if (!user) return;

  setName(user.name || "");
  setPhone(user.phone || "");
  setAvatarPreview(user.avatar || null);
}, [user]);

useEffect(() => {
fetchAddresses();
}, []);

const fetchAddresses = async () => {
try {
const { data } = await api.get("/address");
setAddresses(data.addresses || []);
} catch (err) {
console.error("Fetch address failed", err);
}
};

/* ================= ACCOUNT ================= */
const pickFile = (file) => {
if (!file) return;
setAvatarFile(file);
setAvatarPreview(URL.createObjectURL(file));
};

const save = async () => {
try {
if (!name.trim()) {
toast.error("Name is required");
return;
}


setSaving(true);

let avatarUrl = user.avatar;

/* ================= UPLOAD IMAGE ================= */
if (avatarFile) {
  const formData = new FormData();
  formData.append("file", avatarFile);

  const uploadRes = await api.post("/upload/image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

avatarUrl =
  uploadRes.data.url +
  "?v=" +
  Date.now();
}


useEffect(() => {
  return () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
  };
}, [avatarPreview]);
/* ================= ONLY CHANGED FIELDS ================= */
const payload = {};

if (name !== user.name) payload.name = name;
if (phone !== user.phone) payload.phone = phone;
if (avatarUrl !== user.avatar) payload.avatar = avatarUrl;

if (Object.keys(payload).length === 0) {
  toast.info("No changes made");
  setSaving(false);
  return;
}

/* ================= UPDATE USER ================= */
const res = await api.put("/user/update", payload);

setUser(res.data.user);


setAvatarPreview(
  res.data.user.avatar
    ? `${res.data.user.avatar}?t=${Date.now()}`
    : null
);


setEditing(false);
setAvatarFile(null);
toast.success("Profile updated successfully" );

} catch (err) {
console.error("Update error:", err);
toast.error(err.response?.data?.message || "Failed to update profile" );
} finally {
setSaving(false);
}
};



const defaultAddress = addresses.find((a) => a.isDefault);



if (!user) return null;

return ( <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">

  {/* ================= ACCOUNT ================= */}
<div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
  <div className="grid gap-10 lg:grid-cols-[280px_1fr]">

    {/* Avatar */}
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-white shadow-lg">
        <img
          src={
            avatarPreview
              ? avatarPreview
              : user?.avatar
              ? user.avatar
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user?.name || "User"
                )}`
          }
          onError={(e) => {
            e.currentTarget.src =
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.name || "User"
              )}`;
          }}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-5 text-center">
        <h2 className="text-xl font-semibold">
          {user.name}
        </h2>

        <p className="text-sm text-gray-500">
          {user.email}
        </p>
      </div>

      {editing && (
        <input
          type="file"
          onChange={(e) => pickFile(e.target.files?.[0])}
          className="mt-5 w-full text-sm"
        />
      )}
    </div>

    {/* Form */}
    <div className="space-y-6">

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">
          Full Name
        </label>

        <input
          disabled={!editing}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full Name"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            editing
              ? "border border-gray-300 focus:border-black"
              : "border border-gray-200 bg-gray-50"
          }`}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">
          Phone Number
        </label>

        <input
          disabled={!editing}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className={`w-full rounded-xl px-4 py-3 outline-none transition ${
            editing
              ? "border border-gray-300 focus:border-black"
              : "border border-gray-200 bg-gray-50"
          }`}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-600">
          Email Address
        </label>

        <input
          disabled
          value={user.email}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {editing ? (
          <>
            <button
              onClick={() => setEditing(false)}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Edit Profile
          </button>
        )}
      </div>

    </div>
  </div>
</div>

  {/* ================= DEFAULT ADDRESS ================= */}
<div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
  <div className="mb-6 flex items-center justify-between">
    <div>
      <h3 className="text-xl font-semibold">
        Default Address
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Your primary shipping address
      </p>
    </div>

    {defaultAddress && (
      <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
        Default
      </span>
    )}
  </div>

  {defaultAddress ? (
    <div className="rounded-2xl border border-gray-200 p-5">
      <h4 className="text-lg font-semibold">
        {defaultAddress.name}
      </h4>

      <div className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
        <p>{defaultAddress.address}</p>

        <p>
          {defaultAddress.city}, {defaultAddress.state} -{" "}
          {defaultAddress.zip}
        </p>

        {defaultAddress.phone && (
          <p>{defaultAddress.phone}</p>
        )}
      </div>
    </div>
  ) : (
    <p className="text-sm text-gray-500">
      No default address found.
    </p>
  )}
</div>

</div>


);
}



/* ---------------------
   Small UI Helpers: Modal
   --------------------- */
function Modal({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-800 rounded shadow-lg overflow-hidden">
        {children}
      </div>
    </div>
  );
}
