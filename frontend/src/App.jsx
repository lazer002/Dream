import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
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
import { AuthProvider, useAuth } from "./state/AuthContext.jsx";
import { CartProvider } from "./state/CartContext.jsx";

// Reusable navigation links for public header
const navLinks = [
  { name: "Home", path: "/" },
  { name: "Products", path: "/products" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

// Dynamic header component
function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b">
      <div className="h-16 flex items-center justify-between container mx-auto px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-semibold text-lg">
            Dream Shop
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} className="hover:text-brand-600">
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link to="/cart" className="hover:text-brand-600">
            Cart
          </Link>
          {user ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="hover:text-brand-600">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-brand-600">
                Login
              </Link>
              <Link to="/register" className="hover:text-brand-600">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

// Protect admin routes
function AdminRoute({ children }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/" replace />;
}

// Main App
export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin"); // Detect admin pages

  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          {!isAdminRoute && <Header />} {/* Hide public header on admin pages */}

          <main className="">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin Routes */}
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
              </Route>
            </Routes>
          </main>

          {!isAdminRoute && (
            <footer className="border-t py-6 text-center text-sm text-gray-500">
              © {new Date().getFullYear()} Dream Shop
            </footer>
          )}
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
