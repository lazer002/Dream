"use client";
import { useState, useEffect } from "react";
import { ShoppingCart, Search, User, Menu, ChevronDown, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../state/CartContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { api } from "@/utils/config.js";
import { useNavigate } from "react-router-dom";

const navItems = [
  { title: "HOME", url: "/" },
  {
    title: "MEN",
    url: "/products",
    showCategories: true,
    // promos: [
    //   { title: "Jackets", img: "/images/2.avif", url: "/products?category=Jacket" },
    //   { title: "Pants", img: "/images/3.avif", url: "/products?category=Pant" },
    // ],

  },
  {
    title: "COLLECTIONS",
    dropdown: [
      { title: "Drift - Relaxed Fits", url: "/collections/drift-collection" },
      { title: "Linen Collection", url: "/collections/linen" },
      { title: "Caelum - For Movement", url: "/collections/caelum" },
      { title: "Basics - Wardrobe Essentials", url: "/collections/basics" },
    ],
  },
  { title: "NEW ARRIVALS", url: "/NEW" },
];


export default function Header() {
  const navigate = useNavigate();
  const handleCategoryClick = (category) => {
    const currentParams = new URLSearchParams(location.search);
    currentParams.set("category", category.toLowerCase()); // update category
    navigate(`/products?${currentParams.toString()}`);
  };

  const { user } = useAuth();
  const { items } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [visible, setVisible] = useState(false); // controls DOM visibility
  const [animate, setAnimate] = useState(false); // controls transition
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);


  useEffect(() => {
    let timer;
    if (searchOpen) {
      setVisible(true); // mount overlay
      timer = setTimeout(() => setAnimate(true), 20);
    } else {
      setAnimate(false);
      timer = setTimeout(() => setVisible(false), 1000);
    }
    return () => clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/search/products?q=${encodeURIComponent(query)}`
        );
        setResults(res.data);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setResults([]); // no results found
        } else {
          console.error("Search error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(fetchResults, 400); // debounce 400ms
    return () => clearTimeout(delayDebounce);
  }, [query]);

 const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      const cats = Array.isArray(res.data.categories)
        ? res.data.categories
        : [];
      setCategories(cats);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

    const baseClass =
    "font-bold text-[18px] transition-colors duration-200 flex items-center gap-1 px-[20px] py-[5px] rounded-[10px]";
  const hoverClass = "hover:bg-[#d7d4d4]";

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-5">
        {/* Left: Mobile Menu + Nav */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <button
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Nav */}
     <nav className="hidden lg:flex gap-8">
      {navItems.map((item) => {
        if (item.showCategories) {
          return (
            <div key={item.title} className="relative group">
              {/* Parent link */}
              <Link to={item.url} className={`${baseClass} ${hoverClass}`}>
                {item.title}
              </Link>

              {/* Category scroll (replaces mega menu) */}
<div
  className="fixed left-0 top-[79px] w-screen bg-gradient-to-b from-gray-50 to-gray-100 shadow-lg border-t border-gray-200 
    opacity-0 invisible translate-y-2 
    group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 
    transition-all duration-300 ease-in-out z-40"
>
  <div className="relative flex items-center justify-center py-12 px-8 gap-8">
    {/* LEFT PROMO BANNER */}
    <div className="hidden lg:flex flex-col justify-center items-center 
      bg-gradient-to-br from-white to-gray-100 text-gray-900 
      rounded-2xl p-8 w-72 h-[350px] shadow-md hover:shadow-lg 
      hover:scale-[1.02] transition-all duration-300 border border-gray-200"
    >
      <h3 className="text-2xl font-bold mb-2 tracking-tight text-center">
        🎉 20% OFF IN-APP
      </h3>
      <p className="text-sm text-gray-600 text-center mb-4">
        Get 20% off your first purchase in our app — limited time only!
      </p>
      <Link
        to="/app-offer"
        className="bg-black text-white font-semibold rounded-full px-5 py-2 text-sm hover:bg-gray-800 transition"
      >
        Shop Now
      </Link>
    </div>

    {/* CATEGORY SCROLLER */}
    <div className="relative flex-1 overflow-x-auto scrollbar-thin">
      <div className="flex gap-8 pr-12 justify-start">
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/products?category=${category.slug}`}
            className="flex-shrink-0 w-64 relative group/card shadow rounded-xl overflow-hidden bg-white border border-gray-100 hover:shadow-lg transition-all duration-300"
          >
            {/* Image Wrapper with Smooth Zoom Effect */}
            <div className="w-full h-[240px] overflow-hidden">
              <img
                src={
                  category.photo ||
                  `https://via.placeholder.com/250x300?text=${encodeURIComponent(
                    category.name
                  )}`
                }
                alt={category.name}
                className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-700 ease-in-out"
              />
            </div>

            {/* Category pill label at bottom */}
            <p
              className="absolute bottom-3 left-1/2 -translate-x-1/2
              bg-red-600 text-white hover:text-white/85 text-sm font-semibold
              uppercase tracking-wide px-8 py-[3px] rounded-full
              shadow-sm backdrop-blur-sm transition-all duration-300"
            >
              {category.name}
            </p>
          </Link>
        ))}
      </div>
    </div>
  </div>
</div>







            </div>
          );
        }

        if (item.dropdown) {
          return (
            <div key={item.title} className="relative group">
              <Link to={item.url} className={`${baseClass} ${hoverClass}`}>
                {item.title}
              </Link>

              {/* Dropdown */}
              <div
                className="fixed left-0 top-[75px] w-screen bg-white shadow-lg border-t border-gray-100 
                  opacity-0 invisible translate-y-2 
                  group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 
                  transition-all duration-300 ease-in-out z-40"
              >
                <ul className="max-w-7xl mx-auto flex gap-8 p-6">
                  {item.dropdown.map((d) => (
                    <li key={d.title}>
                      <Link
                        to={d.url}
                        className="text-gray-600 hover:text-black text-lg"
                      >
                        {d.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.title}
            to={item.url}
            className={`${baseClass} ${hoverClass}`}
          >
            {item.title}
          </Link>
        );
      })}
    </nav>


        </div>

        {/* Logo */}
        <Link to="/" className="font-bold text-2xl">
          DRIPDESI
        </Link>

        {/* Right Icons */}
        <div className="flex items-center gap-6 ps-32">
          {user ? (
            <Link to="/admin">
              <div className="text-gray-600 hover:text-black text-sm">admin</div>
            </Link>
          ) : (
            ""
          )}
          <button onClick={() => setSearchOpen(true)}>
            <Search className="w-6 h-6" />
          </button>

          {/* User Icon: show /login only if not logged in */}
          {user ? (
            <Link to="/profile">
              <User className="w-6 h-6" />
            </Link>
          ) : (
            <Link to="/login">
              <User className="w-6 h-6" />
            </Link>
          )}

          <Link to="/cart" className="relative">
            <ShoppingCart className="w-6 h-6" />
            {items.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {items.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-40">
          <div className="bg-white w-64 h-full p-6 transition-transform duration-300 ease-in-out transform translate-x-0">
            <button
              onClick={() => setMobileOpen(false)}
              className="mb-4 font-bold"
            >
              Close
            </button>
            <ul className="space-y-4">
              {navItems.map((item) => (
                <li key={item.title}>
                  <Link to={item.url || "#"}>{item.title}</Link>
                </li>
              ))}
              <li>
                <Link to="/wishlist">Wishlist</Link>
              </li>

            </ul>
          </div>
        </div>
      )}
      {visible && (
        <div
          className={`fixed inset-0 z-50 flex items-start justify-center p-6 transition-opacity duration-1000 ${searchOpen ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0 pointer-events-none"
            }`}
        >
          <div
            className={`relative bg-white w-full max-w-7xl rounded-md p-6 transform transition-all duration-1000 ${searchOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 -translate-y-6 opacity-0"
              }`}
          >
            {/* ✅ Smooth close button */}
            <button
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-gray-200 hover:bg-gray-400 transition"
              onClick={() => setSearchOpen(false)}
            >
              <X className="w-6 h-6 text-black" />
            </button>

            {/* Search Input */}
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, collections..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-black"
              autoFocus
            />

            {/* Trending */}
            <div className="mt-4">
              <h4 className="font-bold mb-2">Trending</h4>
              <div className="flex flex-wrap gap-2">
                <Link to="/collections/drift-collection" className="px-3 py-1 bg-gray-100 rounded-full hover:bg-black hover:text-white transition">
                  Drift Collection
                </Link>
                <Link to="/products/drift-hoodie" className="px-3 py-1 bg-gray-100 rounded-full hover:bg-black hover:text-white transition">
                  Drift Hoodie
                </Link>
                <Link to="/collections/linen" className="px-3 py-1 bg-gray-100 rounded-full hover:bg-black hover:text-white transition">
                  Linen Collection
                </Link>
              </div>
            </div>

            {/* Dynamic Search Results */}
            {results.length > 0 && (
              <div className="mt-6">
                <h4 className="font-bold mb-4 text-lg">Search Results</h4>
                <div className="max-h-[400px] sm:max-h-max overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ">
                    {results.map((p) => (
                      <Link
                        key={p._id}
                        to={`/products/${p._id}`}
                        className="group border border-gray-200 rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
                      >
                        {/* Product Image */}
                        <div className="w-full h-48 bg-gray-100 overflow-hidden">
                          <img
                            src={p.images && p.images[0] ? p.images[0] : "/placeholder.png"}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                          <h5 className="font-semibold text-gray-800 group-hover:text-black truncate">
                            {p.title}
                          </h5>
                          <p className="text-gray-500 mt-1">${p.price.toFixed(2)}</p>
                          {p.isNewProduct && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-bold text-white bg-green-500 rounded">
                              NEW
                            </span>
                          )}
                          {p.onSale && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-bold text-white bg-red-500 rounded ml-2">
                              SALE
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}
    </header>


  );
}
