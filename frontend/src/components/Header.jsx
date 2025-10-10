"use client";
import { useState,useEffect } from "react";
import { ShoppingCart, Search, User, Menu, ChevronDown,X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../state/CartContext.jsx"; 
import { useAuth } from "../state/AuthContext.jsx";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const navItems = [
  { title: "HOME", url: "/" },
  {
    title: "MEN",
    url: "/products",
    mega: [
      {
        heading: "TOPWEAR",
        links: [
          { title: "Drift Hoodie", url: "/products/drift-hoodie" },
          { title: "Linen Shirt", url: "/products/linen-shirt" },
          { title: "Crew Tee", url: "/collections/crew-tee" },
          { title: "Polo", url: "/collections/polo-tee" },
        ],
      },
      {
        heading: "BOTTOMWEAR",
        links: [
          { title: "Shorts", url: "/collections/shorts" },
          { title: "Pants", url: "/collections/pants" },
          { title: "Joggers", url: "/products/drift-joggers" },
        ],
      },
    ],
    promos: [
      {
        title: "Drift Jacket",
        img: "/images/2.avif",
        url: "/products/drift-jacket",
      },
      {
        title: "Drift Joggers",
        img: "/images/3.avif",
        url: "/products/drift-joggers",
      },
    ],
  },
  // {
  //   title: "WOMEN",
  //   url: "/collections/women",
  //   mega: [
  //     {
  //       heading: "TOPWEAR",
  //       links: [
  //         { title: "Crew", url: "/collections/her-crew" },
  //         { title: "Tank", url: "/collections/her-tank" },
  //         { title: "Polo", url: "/collections/her-polo" },
  //       ],
  //     },
  //     {
  //       heading: "BOTTOMWEAR",
  //       links: [
  //         { title: "Shorts", url: "/collections/shorts-women" },
  //         { title: "Pants", url: "/collections/her-pants" },
  //         { title: "Joggers", url: "/products/her-drift-joggers" },
  //       ],
  //     },
  //   ],
  //   promos: [
  //     {
  //       title: "Her Tank",
  //       img: "https://mypepr.com/cdn/shop/files/HER_Tank_3.webp",
  //       url: "/products/her-tank",
  //     },
  //   ],
  // },
  {
    title: "COLLECTIONS",
    dropdown: [
      { title: "Drift - Relaxed Fits", url: "/collections/drift-collection" },
      { title: "Linen Collection", url: "/collections/linen" },
      { title: "Caelum - For Movement", url: "/collections/caelum" },
      { title: "Basics - Wardrobe Essentials", url: "/collections/basics" },
    ],
  },
  // { title: "CONTACT", url: "/pages/contact" },
];

export default function Header() {
  const { user } = useAuth();
  const { items } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [visible, setVisible] = useState(false); // controls DOM visibility
  const [animate, setAnimate] = useState(false); // controls transition
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);


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
        const res = await axios.get(
          `${API_URL}/search/products?q=${encodeURIComponent(query)}`
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







  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
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
          <nav className="hidden lg:flex gap-6">
            {navItems.map((item) =>
              item.mega ? (
                <div key={item.title} className="relative group">
                  {/* Parent link */}
                  <Link
                    to={item.url}
                    className="flex items-center gap-1 font-bold text-[14px]"
                  >
                    {item.title}
                  </Link>

                  {/* Full Width Mega Menu */}
                  <div
                    className="fixed left-0 top-[50px] w-screen bg-white shadow-lg border-t border-gray-100 
                     opacity-0 invisible translate-y-2 
                     group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 
                     transition-all duration-300 ease-in-out z-40"
                  >
                    <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8 p-8">
                      {item.mega.map((col) => (
                        <div key={col.heading}>
                          <h3 className="font-bold mb-2">{col.heading}</h3>
                          <ul className="space-y-1">
                            {col.links.map((link) => (
                              <li key={link.title}>
                                <Link
                                  to={link.url}
                                  className="text-gray-600 hover:text-black text-sm"
                                >
                                  {link.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {item.promos?.map((promo) => (
                        <Link
                          key={promo.title}
                          to={promo.url}
                          className="block group overflow-hidden"
                        >
                          <img
                            src={promo.img}
                            alt={promo.title}
                            className="w-full h-fit object-cover rounded-md group-hover:opacity-90 transition"
                          />
                          <p className="mt-2 text-sm text-gray-700 group-hover:underline">
                            {promo.title}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : item.dropdown ? (
                <div key={item.title} className="relative group">
                  {/* Parent link */}
                  <Link
                    to={item.url}
                    className="flex items-center gap-1 font-bold text-[14px]"
                  >
                    {item.title}
                  </Link>

                  {/* Dropdown */}
                  <div
                    className="fixed left-0 top-[50px] w-screen bg-white shadow-lg border-t border-gray-100 
                     opacity-0 invisible translate-y-2 
                     group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 
                     transition-all duration-300 ease-in-out z-40"
                  >
                    <ul className="max-w-7xl mx-auto flex gap-8 p-6">
                      {item.dropdown.map((d) => (
                        <li key={d.title}>
                          <Link
                            to={d.url}
                            className="text-gray-600 hover:text-black text-sm"
                          >
                            {d.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.title}
                  to={item.url}
                  className="font-bold text-[14px] hover:text-black"
                >
                  {item.title}
                </Link>
              )
            )}
          </nav>

        </div>

        {/* Logo */}
        <Link to="/" className="font-bold text-2xl">
          DRIP
        </Link>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
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
          className={`fixed inset-0 z-50 flex items-start justify-center p-6 transition-opacity duration-1000 ${
            searchOpen ? "bg-black/60 opacity-100" : "bg-black/0 opacity-0 pointer-events-none"
          }`}
        >
          <div
            className={`relative bg-white w-full max-w-7xl rounded-md p-6 transform transition-all duration-1000 ${
              searchOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 -translate-y-6 opacity-0"
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
