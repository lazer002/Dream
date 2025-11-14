import { useEffect, useMemo, useState,useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import api  from "@/utils/config.jsx";
import {
  Box,
  Heart,
  MapPin,
  User,
  LogOut,
  Edit2,
  Trash2,
  Plus,
  ShoppingCart,
  CheckCircle,
  Loader2,
  Camera,
  Lock,
  Mail,
  SearchIcon ,
  RefreshCcw
} from "lucide-react";

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
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const tabs = [
    { id: "orders", label: "Orders & Returns", icon: <Box size={18} /> },
    { id: "wishlist", label: "My Wishlist", icon: <Heart size={18} /> },
    { id: "addresses", label: "Saved Addresses", icon: <MapPin size={18} /> },
    { id: "account", label: "Account Settings", icon: <User size={18} /> },
  ];

  return (
    <div className=" mx-auto p-6 flex flex-col md:flex-row gap-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      <div className="md:w-1/3 bg-white dark:bg-slate-800 rounded-lg shadow divide-y border border-gray-200 dark:border-slate-700">
        <div className="p-4 flex items-center gap-4">
          <div className="relative">
            <img
              src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}`}
              alt="avatar"
              className="w-12 h-12 rounded-full object-cover border"
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user.name || "Unnamed"}</div>
            <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-2">
              <Mail size={12} /> <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <div className="p-4">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full p-3 text-left text-red-600 hover:bg-red-50 rounded-md transition"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="md:w-2/3 bg-white dark:bg-slate-800 rounded-lg shadow p-6 min-h-[480px] border border-gray-200 dark:border-slate-700">
        {activeTab === "orders" && <OrdersContent />}
        {activeTab === "wishlist" && <WishlistContent user={user} />}
        {activeTab === "addresses" && <AddressesContent user={user} updateUser={updateUser} />}
        {activeTab === "account" && <AccountContent user={user} updateUser={updateUser} />}
      </div>

      {showLogoutConfirm && (
        <Modal onClose={() => setShowLogoutConfirm(false)}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">Confirm sign out</h3>
            <p className="text-sm text-gray-600 dark:text-slate-300">Are you sure you want to sign out?</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 rounded bg-gray-100 dark:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 rounded bg-red-600 text-white"
              >
                Sign Out
              </button>
            </div>
          </div>
        </Modal>
      )}
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

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDir, setSortDir] = useState("desc");
  const [refreshing, setRefreshing] = useState(false);

  const [modalOrder, setModalOrder] = useState(null);
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
    let list = orders.slice();

    if (query?.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((o) => {
        const num = (o.orderNumber || o._id || o.id || "").toString().toLowerCase();
        const email = (o.email || "").toLowerCase();
        const items = (o.items || []).some((it) => (it.title || it.productName || "").toLowerCase().includes(q));
        return num.includes(q) || email.includes(q) || items;
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((o) => (o.orderStatus || o.status || "").toLowerCase() === statusFilter.toLowerCase());
    }

    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime() || 0;
      const tb = new Date(b.createdAt).getTime() || 0;
      return sortDir === "desc" ? tb - ta : ta - tb;
    });

    return list;
  }, [orders, query, statusFilter, sortDir]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }

  // Reorder / Cancel placeholders — replace with your endpoints
  async function handleReorder(orderId) {
    try {
      await api.post(`/orders/${orderId}/reorder`);
      alert("Reorder request sent.");
    } catch (err) {
      console.error("reorder failed", err);
      alert("Reorder failed");
    }
  }
  async function handleCancel(orderId) {
    if (!confirm("Cancel this order?")) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      await fetchOrders();
    } catch (err) {
      console.error("cancel failed", err);
      alert("Cancel failed");
    }
  }

  // When user clicks product item in modal: navigate to PDP.
  // Adjust this function to match your routing (react-router, next/link, etc).
  function goToPDP(productId, bundleId) {
    // prefer productId, fall back to bundle route if productId missing
    if (productId) {
      // for client-side routing with react-router, replace with navigate(`/product/${productId}`)
      window.open(`/product/${productId}`, "_blank", "noopener");
    } else if (bundleId) {
      window.open(`/bundle/${bundleId}`, "_blank", "noopener");
    } else {
      // nothing to navigate to
      console.warn("No productId or bundleId to navigate to");
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order number, email or item..."
              className="pl-10 pr-3 py-2 border rounded w-72 focus:outline-none"
            />
            <div className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon size={14} />
            </div>
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-2 px-3 border rounded">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} className="py-2 px-3 border rounded">
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-2 border rounded">
            <RefreshCcw size={16} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-800 border rounded">Error: {error}</div>}

      {!filtered.length && <div className="p-6 border rounded text-center text-gray-500">No orders found.</div>}

<div className="space-y-4">
  {filtered.map((order) => {
    const firstItem = Array.isArray(order.items) && order.items.length ? order.items[0] : null;

    const img = firstItem?.mainImage || firstItem?.image || "";
    const productId = firstItem?.productId || null;
    const bundleId = firstItem?.bundleId || null;

    // PDP URL
    const pdpUrl = productId
      ? `/product/${productId}`
      : bundleId
      ? `/bundle/${bundleId}`
      : "#";

    return (
      <div key={order._id || order.id} className="p-4 border rounded">
        <div className="flex justify-between items-start gap-4">

          {/* LEFT: Thumbnail + Order info */}
          <div className="flex-1 flex gap-4">

            {/* THUMBNAIL WITH LINK */}
            <Link
              to={pdpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100"
            >
              {img ? (
                <img
                  src={img}
                  alt={firstItem?.title || "Product"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No image
                </div>
              )}
            </Link>

            {/* ORDER INFO */}
            <div>
              <div className="flex items-center gap-3">
                <div
                  className="font-medium cursor-pointer"
                  onClick={() => setModalOrder(order)}
                >
                  #{order.orderNumber || (order._id || order.id).slice(-8)}
                </div>

                <div className="text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </div>

                <StatusBadge
                  status={order.orderStatus || order.status || "pending"}
                />
              </div>

              {/* CLICKABLE TITLE TO PDP */}
              {firstItem?.title && (
                <Link
                  to={pdpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 text-sm hover:underline"
                >
                  {firstItem.title}
                </Link>
              )}

              <div className="text-sm text-gray-600">
                Items: {order.itemCount ?? (order.items || []).length}
              </div>

            
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="text-right flex-shrink-0">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-semibold">
              {formatCurrency(order.total)}
            </div>
            <div className="mt-2 flex gap-2 justify-end">
              <button
                onClick={() => setModalOrder(order)}
                className="px-2 py-1 border rounded text-xs"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>



      {/* modal */}
  {modalOrder && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    role="dialog"
    aria-modal="true"
  >
    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-5 overflow-auto max-h-[90vh]" id="print-section" ref={printRef}>
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold">
              Order {modalOrder.orderNumber || (modalOrder._id || modalOrder.id)}
            </h3>
            <span className="text-xs text-gray-500">{formatDate(modalOrder.createdAt)}</span>
            <StatusBadge status={modalOrder.orderStatus || modalOrder.status || "pending"} />
          </div>
          <div className="text-sm text-gray-600 mt-1">Email: {modalOrder.email || "—"}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1 border rounded text-sm bg-gray-50 hover:bg-gray-100"
            title="Print order"
          >
            Print
          </button>
          <button
            onClick={() => {
              // close
              setModalOrder(null);
            }}
            aria-label="Close"
            className="px-3 py-1 border rounded text-sm bg-white hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: order summary */}
        <div className="md:col-span-1 border rounded p-3 bg-gray-50">
          <div className="text-sm text-gray-700 font-medium mb-2">Summary</div>

          <div className="text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(modalOrder.subtotal ?? modalOrder.total ?? modalOrder.amount ?? 0)}</span></div>
            <div className="flex justify-between mt-1"><span>Shipping</span><span>{modalOrder.shippingFee ? formatCurrency(modalOrder.shippingFee) : "—"}</span></div>
            {modalOrder.couponDiscount ? <div className="flex justify-between mt-1"><span>Discount</span><span>-{formatCurrency(modalOrder.couponDiscount)}</span></div> : null}
            <div className="flex justify-between mt-2 font-semibold"><span>Total</span><span>{formatCurrency(modalOrder.total)}</span></div>
          </div>

          <hr className="my-3" />

          <div className="text-sm text-gray-700 font-medium">Payment & shipping</div>
          <div className="text-sm text-gray-600 mt-1">Method: {modalOrder.paymentMethod ? modalOrder.paymentMethod.toUpperCase() : "—"}</div>
          <div className="text-sm text-gray-600 mt-2">
            <div className="font-medium">Shipping address</div>
            <div className="text-sm text-gray-600">
              {modalOrder.shippingAddress?.firstName} {modalOrder.shippingAddress?.lastName}<br />
              {modalOrder.shippingAddress?.address}{modalOrder.shippingAddress?.apartment ? `, ${modalOrder.shippingAddress.apartment}` : ""}<br />
              {modalOrder.shippingAddress?.city}, {modalOrder.shippingAddress?.state} {modalOrder.shippingAddress?.zip}<br />
              {modalOrder.shippingAddress?.country}<br />
              Phone: {modalOrder.shippingAddress?.phone}
            </div>
          </div>
        </div>

        {/* Right: items + timeline */}
        <div className="md:col-span-2 space-y-4">
          {/* Status timeline */}
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-2">Order progress</div>
            {Array.isArray(modalOrder.statusHistory) && modalOrder.statusHistory.length ? (
              <ol className="space-y-2">
                {modalOrder.statusHistory.map((s, idx) => (
                  <li key={s._id || s.id || idx} className="flex items-start gap-3">
                    <div className="w-3 h-3 rounded-full mt-1 bg-blue-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{s.status}</div>
                      <div className="text-xs text-gray-500">{s.updatedAt ? formatDate(s.updatedAt) : "—"}</div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-sm text-gray-500">No status updates yet</div>
            )}
          </div>

          {/* Items grid */}
          <div className="border rounded p-3">
            <div className="text-sm font-medium mb-3">Items ({modalOrder.itemCount ?? (modalOrder.items || []).length})</div>

            <ul className="space-y-3">
              {Array.isArray(modalOrder.items) && modalOrder.items.length ? (
                modalOrder.items.map((it) => {
                  const img = it.mainImage || it.image || "";
                  // small badge for bundle vs product
                  const badge = it.bundleId ? "Bundle" : (it.productId ? "Product" : "Item");
                  return (
                    <li key={it._id || it.id || `${it.productId}-${it.variant || ""}`} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                      <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                        {img ? <img src={img} alt={it.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium truncate">{it.title || "Item"}</div>
                          <div className="text-sm text-gray-600">{formatCurrency(it.price)}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Variant: {it.variant ?? it.size ?? "—"}</div>
                        <div className="text-xs text-gray-500 mt-1">Qty: {it.quantity} • {badge}</div>
                        {it.sku && <div className="text-xs text-gray-400 mt-1">SKU: {it.sku}</div>}
                      </div>
                    </li>
                  );
                })
              ) : (
                <div className="text-sm text-gray-500">No items</div>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleReorder(modalOrder._id || modalOrder.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reorder
            </button>

            <button
              onClick={() => {
                // disable cancel if already not pending
                const s = (modalOrder.orderStatus || modalOrder.status || "").toLowerCase();
                if (!["pending", "initiated"].includes(s)) {
                  alert("This order cannot be canceled.");
                  return;
                }
                handleCancel(modalOrder._id || modalOrder.id);
              }}
              className="px-4 py-2 border rounded text-red-600 hover:bg-red-50"
            >
              Cancel Order
            </button>

            <Link
              to={`mailto:support@yourdomain.com?subject=Order%20${encodeURIComponent(modalOrder.orderNumber || modalOrder._id)}&body=Hi%2C%0A%0AI%20need%20help%20with%20order%20${encodeURIComponent(modalOrder.orderNumber || modalOrder._id)}.%0A%0AThanks`}
              className="px-4 py-2 border rounded text-sm text-gray-700 hover:bg-gray-50"
            >
              Contact Support
            </Link>
          </div>
        </div>
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
function WishlistContent({ user }) {
  const [items, setItems] = useState([
    // stubbed wishlist items - replace with API
    { id: "p1", title: "Striped Shirt", price: 799, img: "", size: "M" },
    { id: "p2", title: "Casual Hoodie", price: 1299, img: "", size: "L" },
  ]);

  const remove = (id) => {
    setItems((s) => s.filter((i) => i.id !== id));
    // TODO: call API to remove from wishlist
  };

  const addToCart = (item) => {
    // TODO: call API to add to cart
    alert(`Added ${item.title} to cart (stub)`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Wishlist</h2>
        <div className="text-sm text-gray-500 dark:text-slate-300">{items.length} items</div>
      </div>

      {items.length === 0 ? (
        <p className="text-gray-600">Your wishlist is empty.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-4 p-3 rounded border dark:border-slate-700">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded overflow-hidden flex items-center justify-center">
                {it.img ? <img src={it.img} alt={it.title} /> : <div className="text-xs text-gray-400">No Image</div>}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-slate-100">{it.title}</div>
                <div className="text-sm text-gray-500">Size: {it.size}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">₹{it.price}</div>
                <button onClick={() => addToCart(it)} className="p-2 rounded bg-blue-600 text-white">
                  <ShoppingCart size={16} />
                </button>
                <button onClick={() => remove(it.id)} className="p-2 rounded bg-red-50 text-red-600">
                  <Trash2 size={16} />
                </button>
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
  const [addresses, setAddresses] = useState(user.addresses || []);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    setAddresses(user.addresses || []);
  }, [user.addresses]);

  const save = async (address) => {
    // replace with API call - here we just update local state and optionally call updateUser
    let next;
    if (editing) {
      next = addresses.map((a) => (a.id === address.id ? address : a));
    } else {
      next = [...addresses, { ...address, id: `addr-${Date.now()}` }];
    }
    setAddresses(next);
    setShowModal(false);
    setEditing(null);
    // Optionally push to server:
    if (typeof updateUser === "function") {
      try {
        await updateUser({ addresses: next });
      } catch (e) {
        // ignore for now
      }
    }
  };

  const remove = (id) => {
    const next = addresses.filter((a) => a.id !== id);
    setAddresses(next);
    if (typeof updateUser === "function") updateUser({ addresses: next }).catch(() => {});
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Saved Addresses</h2>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded">
          <Plus size={14} /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-gray-600">No saved addresses yet.</p>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="p-3 rounded border dark:border-slate-700 flex justify-between items-start">
              <div>
                <div className="font-medium text-gray-900 dark:text-slate-100">{a.label || "Home"}</div>
                <div className="text-sm text-gray-600 dark:text-slate-300">{a.address}</div>
                {a.phone && <div className="text-xs text-gray-500">Phone: {a.phone}</div>}
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setEditing(a); setShowModal(true); }} className="p-2 rounded bg-gray-100 dark:bg-slate-700">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => remove(a.id)} className="p-2 rounded bg-red-50 text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <AddressModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={save}
        />
      )}
    </div>
  );
}

function AddressModal({ initial, onClose, onSave }) {
  const [label, setLabel] = useState(initial?.label || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!address) return alert("Address required");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400)); // simulate
    onSave({ id: initial?.id || `addr-${Date.now()}`, label, address, phone });
    setSaving(false);
  };

  return (
    <Modal onClose={onClose}>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{initial ? "Edit Address" : "Add Address"}</h3>
        <div className="space-y-2">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (Home, Work)" className="w-full p-2 border rounded" />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address" className="w-full p-2 border rounded" rows={3} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full p-2 border rounded" />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
          <button onClick={submit} className="px-4 py-2 rounded bg-blue-600 text-white">{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------------
   AccountContent
   --------------------- */
function AccountContent({ user, updateUser }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name || "");
    setAvatarPreview(user.avatar || "");
  }, [user.name, user.avatar]);

  const pickFile = (file) => {
    if (!file) return;
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const save = async () => {
    setSaving(true);
    try {
      // If avatarFile present, upload to server first (stubbed)
      let avatarUrl = user.avatar;
      if (avatarFile) {
        // TODO: upload file and get url. Here we simulate
        await new Promise((r) => setTimeout(r, 600));
        avatarUrl = avatarPreview; // replace with returned url
      }

      const updated = { ...user, name, avatar: avatarUrl };
      if (typeof updateUser === "function") {
        await updateUser(updated);
      }
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Account Details</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing((s) => !s)} className="inline-flex items-center gap-2 bg-gray-100 dark:bg-slate-700 px-3 py-1 rounded">
            <Edit2 size={14} /> {editing ? "Cancel" : "Edit"}
          </button>
          <button className="inline-flex items-center gap-2 bg-amber-600 text-white px-3 py-1 rounded">
            <Lock size={14} /> Set Password
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col items-center gap-3">
          <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
            <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
          </div>
          {editing && (
            <label className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded cursor-pointer">
              <Camera size={14} /> <input type="file" accept="image/*" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <div className="col-span-2">
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600">Full name</label>
              <input disabled={!editing} value={name} onChange={(e) => setName(e.target.value)} className={`w-full p-2 border rounded ${editing ? "" : "bg-gray-50"}`} />
            </div>

            <div>
              <label className="block text-sm text-gray-600">Email</label>
              <input disabled value={user.email} className="w-full p-2 border rounded bg-gray-50" />
            </div>

            <div>
              <label className="block text-sm text-gray-600">Role</label>
              <input disabled value={user.role} className="w-full p-2 border rounded bg-gray-50" />
            </div>

            {editing && (
              <div className="flex justify-end gap-2 mt-4">
                <button onClick={() => setEditing(false)} className="px-4 py-2 rounded bg-gray-100">Cancel</button>
                <button onClick={save} className="px-4 py-2 rounded bg-blue-600 text-white">{saving ? "Saving..." : "Save changes"}</button>
              </div>
            )}
          </div>
        </div>
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
