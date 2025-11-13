import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "@/utils/config.js";
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
    <div className="container mx-auto p-6 flex flex-col md:flex-row gap-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
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
function OrdersContent() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/mine");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Your Orders</h2>
        <div className="text-sm text-gray-500 dark:text-slate-300">{orders.length} orders</div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-gray-600">No recent orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="py-2">Order</th>
                <th className="py-2">Date</th>
                <th className="py-2">Items</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t dark:border-slate-700">
                  <td className="py-3 font-medium text-gray-800 dark:text-slate-100">{o.id}</td>
                  <td className="py-3 text-gray-600 dark:text-slate-300">{o.date}</td>
                  <td className="py-3 text-gray-600 dark:text-slate-300">{o.items}</td>
                  <td className="py-3 text-gray-600 dark:text-slate-300">₹{o.amount.toFixed(2)}</td>
                  <td className="py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="py-3">
                    <button className="text-sm px-3 py-1 rounded bg-gray-100 dark:bg-slate-700">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    delivered: "bg-green-100 text-green-700",
    processing: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-700",
  };
  return <span className={`px-2 py-1 rounded text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
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
