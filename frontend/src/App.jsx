import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminUsers from "./pages/admin/Users.jsx";
import AdminProducts from "./pages/admin/Products.jsx";
import AdminLayout from "./pages/admin/Layout.jsx";
import AdminAddProduct from "./pages/admin/AddProduct.jsx";
import CategoriesAdmin from "./pages/admin/Category.jsx";

import { AuthProvider, useAuth } from "./state/AuthContext.jsx";
import { CartProvider } from "./state/CartContext.jsx";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

import { Toaster } from "react-hot-toast";
import Checkout from "./pages/Checkout.jsx";
import AuthCallback from "./pages/AuthCallback.jsx";
import Profile from "./pages/Profile.jsx";

// ✅ Protect admin routes
function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}

// ✅ Main App Component
export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
          {/* Hide header/footer for admin routes */}
          {!isAdminRoute && <Header />}

          <main className="flex-grow">
            <Routes>
              {/* 🏠 Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* 👤 User Profile */}
              <Route path="/profile" element={<Profile />} />

              {/* 🔐 Admin Routes */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminAddProduct />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="category" element={<CategoriesAdmin />} />
              </Route>
            </Routes>
          </main>

          {!isAdminRoute && <Footer />}
        </div>

        {/* ✅ Global toaster */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#111",
              color: "#fff",
              fontSize: "14px",
              borderRadius: "10px",
            },
          }}
        />
      </CartProvider>
    </AuthProvider>
  );
}
