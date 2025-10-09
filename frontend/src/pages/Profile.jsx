import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import { Box, Heart, MapPin, User, LogOut } from "lucide-react";

export default function Profile() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("orders"); // Default active tab

  if (!user) return <Navigate to="/login" replace />;

  const tabs = [
    { id: "orders", label: "Orders & Returns", icon: <Box size={20} /> },
    { id: "wishlist", label: "My Wishlist", icon: <Heart size={20} /> },
    { id: "addresses", label: "Saved Addresses", icon: <MapPin size={20} /> },
    { id: "account", label: "Account Settings", icon: <User size={20} /> },
  ];

  return (
    <div className="container mx-auto p-6 flex flex-col md:flex-row gap-6 bg-gray-50 min-h-screen">
      {/* Left Side - Tabs */}
      <div className="md:w-1/3 bg-white rounded-lg shadow divide-y border border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 w-full p-4 text-left transition
              ${activeTab === tab.id ? "bg-gray-100 font-semibold" : "hover:bg-gray-50"}`}
          >
            {tab.icon}
            <span className="text-gray-700">{tab.label}</span>
          </button>
        ))}

        {/* Sign Out */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full p-4 text-left text-red-500 hover:bg-red-50 transition"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {/* Right Side - Content */}
      <div className="md:w-2/3 bg-white rounded-lg shadow p-6 min-h-[400px] border border-gray-200">
        {activeTab === "orders" && <OrdersContent />}
        {activeTab === "wishlist" && <WishlistContent />}
        {activeTab === "addresses" && <AddressesContent />}
        {activeTab === "account" && <AccountContent user={user} />}
      </div>
    </div>
  );
}

// Example Content Components
function OrdersContent() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Your Orders</h2>
      <p className="text-gray-600">No recent orders found.</p>
    </div>
  );
}

function WishlistContent() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Wishlist</h2>
      <p className="text-gray-600">Your wishlist is empty.</p>
    </div>
  );
}

function AddressesContent() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Saved Addresses</h2>
      <p className="text-gray-600">No saved addresses yet.</p>
    </div>
  );
}

function AccountContent({ user }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Account Details</h2>
      <p className="text-gray-700"><strong>Name:</strong> {user.name}</p>
      <p className="text-gray-700"><strong>Email:</strong> {user.email}</p>
      <p className="text-gray-700"><strong>Role:</strong> {user.role}</p>
    </div>
  );
}
