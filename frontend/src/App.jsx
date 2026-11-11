import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import { AuthProvider, useAuth } from "./state/AuthContext.jsx";
import { CartProvider } from "./state/CartContext.jsx";

import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

import { Toaster } from "react-hot-toast";
import Checkout from "./pages/Checkout.jsx";
import Profile from "./pages/Profile.jsx";
import Collections from "./pages/Collections.jsx";
import BundlePDP from "./pages/BundlePDP.jsx";
import TrackOrder from "./pages/TrackOrder.jsx";
import UserOrders from "./pages/Orders.jsx";
import NewArrivals from "./pages/NewArrivals.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import ReturnExchange from "./pages/ReturnExchange.jsx";
import ReturnStatusPage from "./pages/ReturnStatusPage.jsx";
import ThankYouPage from "./pages/Thankyou.jsx";
import SearchResultsPage from "./pages/Search.jsx";
import BuildYourLookPage from "./pages/BuildYourLookPage.jsx";
import ScrollManager from "./components/ScrollManager.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";

// Admin pages are lazy-loaded so their code stays out of the storefront bundle.
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard.jsx"));
const AdminUsers = lazy(() => import("./pages/admin/Users.jsx"));
const AdminProducts = lazy(() => import("./pages/admin/Products.jsx"));
const AdminInventory = lazy(() => import("./pages/admin/inventory.jsx"));
const AdminLayout = lazy(() => import("./pages/admin/Layout.jsx"));
const AdminAddProduct = lazy(() => import("./pages/admin/AddProduct.jsx"));
const CategoriesAdmin = lazy(() => import("./pages/admin/Category.jsx"));
const Bundle = lazy(() => import("./pages/admin/Bundle.jsx"));
const ShowBundle = lazy(() => import("./pages/admin/ShowBundle.jsx"));
const Orders = lazy(() => import("./pages/admin/Orders.jsx"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail.jsx"));
const AdminReturns = lazy(() => import("./pages/admin/ReturnList.jsx"));
const AdminReturnDetail = lazy(() => import("./pages/admin/ReturnDetail.jsx"));
const AdminProductDetail = lazy(() => import("./pages/admin/ProductDetail.jsx"));
const AdminBundleDetail = lazy(() => import("./pages/admin/BundleDetail.jsx"));

// Suspense boundary per admin page (keeps the admin layout visible while a page loads)
const adminPage = (page) => (
  <Suspense fallback={null}>{page}</Suspense>
);
// ✅ Protect admin routes
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

 

  if (loading) return <div>Loading...</div>;

  return user?.role === "admin"
    ? children
    : <Navigate to="/" replace />;
}


// ✅ Main App Component
export default function App() {
  const location = useLocation();

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isAuthRoute =
    location.pathname === "/login" || location.pathname === "/register";

  const hideChrome = isAdminRoute 

  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
        {/* Hide header/footer for admin + auth routes */}
        {!hideChrome && <Header />}

        <main className="flex-grow ">
          <ScrollManager />
          <div className={!isAdminRoute ? "storefront" : ""}>
          <Routes>
            {/* 🏠 Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:publicId" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/collections" element={<Collections />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/collections/:publicId" element={<BundlePDP />} />
            <Route path="/trackorder" element={<TrackOrder />} />
            <Route path="/newarrivals" element={<NewArrivals />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/return" element={<ReturnExchange />} />
            <Route path="/thankyou/:publicOrderId" element={<ThankYouPage />} />
            <Route  path="/search"  element={<SearchResultsPage />}/>
            <Route path="/build-your-look"  element={<BuildYourLookPage />}/>
            <Route
  path="/orders"
  element={<UserOrders />}
/>
            <Route
  path="/order-details/:orderNumber"
  element={<OrderDetails />}
/>
            <Route
              path="/return/:orderNumber"
              element={<ReturnStatusPage />}
            />

            {/* 👤 User Profile */}
            <Route path="/profile" element={<Profile />} />

            {/* 🔐 Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  {adminPage(<AdminLayout />)}
                </AdminRoute>
              }
            >
              <Route index element={adminPage(<AdminDashboard />)} />
              <Route path="products" element={adminPage(<AdminProducts />)} />
              <Route path="inventory" element={adminPage(<AdminInventory />)} />
              <Route path="new/bundles" element={adminPage(<Bundle />)} />
              <Route path="bundles" element={adminPage(<ShowBundle />)} />
              <Route path="new/products" element={adminPage(<AdminAddProduct />)} />
              <Route path="users" element={adminPage(<AdminUsers />)} />
              <Route path="category" element={adminPage(<CategoriesAdmin />)} />
              <Route path="orders" element={adminPage(<Orders />)} />
              <Route path="orders/:publicOrderId" element={adminPage(<OrderDetail />)} />
              <Route path="returnslist" element={adminPage(<AdminReturns />)} />
              <Route path="returnslist/:rmaNumber" element={adminPage(<AdminReturnDetail />)} />
              <Route  path="/admin/products/:publicId"  element={adminPage(<AdminProductDetail />)}/>
              <Route  path="bundles/:publicId"  element={adminPage(<AdminBundleDetail />)}
/>
            </Route>
          </Routes>
          </div>
        </main>

        {!hideChrome && <Footer />}
      </div>

      {/* ✅ Global toaster */}
      <Toaster
        position="bottom-center"
          containerStyle={{
    bottom: "80px", // move higher from bottom
  }}
        toastOptions={{
          style: {
            background: "#111",
            color: "#fff",
            fontSize: "18px",
            borderRadius: "10px",
            width: "max-content",
            whiteSpace: "nowrap",
          },
        }}
      />
    </CartProvider>
  );
}
