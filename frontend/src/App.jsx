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
import CategoriesAdmin from "./pages/admin/Category.jsx";
import { Facebook, Instagram } from "lucide-react";
// Reusable navigation links for public header
const navLinks = [
  { name: "Home", path: "/" },
  { name: "Products", path: "/products" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
];

function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="h-16 flex items-center justify-between container mx-auto px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="font-semibold text-lg">
            Dream Shop
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="hover:text-brand-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/cart"
            className="hover:text-brand-600 transition-colors"
          >
            Cart
          </Link>
          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="hover:text-brand-600 transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-brand-600 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hover:text-brand-600 transition-colors"
              >
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
                <Route path="category" element={<CategoriesAdmin />} />

              </Route>
            </Routes>
          </main>

          {!isAdminRoute && (
 <footer className="bg-purple-900 text-gray-200 pt-12 pb-6">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
   {/* TOP */}
   <div className="grid grid-cols-1 md:grid-cols-4 gap-10 border-b border-purple-700 pb-10">
     {/* Brand Info */}
     <div>
       <img
         src="/logo.png"
         alt="Bowchika"
         className="h-10 mb-4"
       />
       <h2 className="text-xl font-bold">Bowchika – Wear Your Vibe</h2>
       <p className="text-sm mt-3">
         From street chaos to spiritual sass, Bowchika’s tees are made for
         the bold, the chill, and the unapologetically real. Designed in
         India. Worn by rebels.
       </p>
       {/* Socials */}
       <div className="flex gap-4 mt-4">
         <a
           href="https://www.facebook.com/profile.php?id=61577897545414"
           target="_blank"
           rel="noreferrer"
           className="p-2 rounded-full bg-purple-800 hover:bg-purple-700 transition"
         >
           <Facebook className="w-5 h-5 text-white" />
         </a>
         <a
           href="https://www.instagram.com/bowchikastore"
           target="_blank"
           rel="noreferrer"
           className="p-2 rounded-full bg-purple-800 hover:bg-purple-700 transition"
         >
           <Instagram className="w-5 h-5 text-white" />
         </a>
       </div>
     </div>

     {/* Links */}
     <div>
       <h3 className="text-lg font-semibold mb-4">Know Bowchika</h3>
       <ul className="space-y-2 text-sm">
         <li>
           <Link to="/pages/about-us" className="hover:text-white">
             About Us
           </Link>
         </li>
         <li>
           <Link to="/pages/contact" className="hover:text-white">
             Contact Us
           </Link>
         </li>
       </ul>
     </div>

     <div>
       <h3 className="text-lg font-semibold mb-4">Policies</h3>
       <ul className="space-y-2 text-sm">
         <li>
           <Link to="/policies/privacy-policy" className="hover:text-white">
             Privacy Policy
           </Link>
         </li>
         <li>
           <Link to="/policies/refund-policy" className="hover:text-white">
             Refund Policy
           </Link>
         </li>
         <li>
           <Link to="/policies/shipping-policy" className="hover:text-white">
             Shipping Policy
           </Link>
         </li>
         <li>
           <Link to="/policies/terms-of-service" className="hover:text-white">
             Terms of Service
           </Link>
         </li>
       </ul>
     </div>

     {/* Newsletter */}
     <div>
       <h3 className="text-lg font-semibold mb-4">Subscribe</h3>
       <form className="flex flex-col sm:flex-row gap-2">
         <input
           type="email"
           placeholder="Enter your email"
           className="w-full px-3 py-2 rounded-md text-black focus:outline-none"
         />
         <button
           type="submit"
           className="px-4 py-2 bg-white text-purple-900 rounded-md hover:bg-gray-200 transition"
         >
           Subscribe
         </button>
       </form>
     </div>
   </div>

   {/* BOTTOM */}
   <div className="mt-8 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
     <p>© 2025 Bowchika. All rights reserved.</p>
     <p className="mt-2 md:mt-0">
       Powered by <span className="text-white">React + Tailwind</span>
     </p>
   </div>
 </div>
</footer>
          )}
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
