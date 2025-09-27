"use client";
import { useState } from "react";
import { ShoppingCart, Search, User, Menu, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  {
    title: "MEN",
    url: "/collections/men",
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
        img: "https://mypepr.com/cdn/shop/files/Drift_Jacket.webp",
        url: "/products/drift-jacket",
      },
      {
        title: "Drift Joggers",
        img: "https://mypepr.com/cdn/shop/files/Drift_Joggers.webp",
        url: "/products/drift-joggers",
      },
    ],
  },
  {
    title: "WOMEN",
    url: "/collections/women",
    mega: [
      {
        heading: "TOPWEAR",
        links: [
          { title: "Crew", url: "/collections/her-crew" },
          { title: "Tank", url: "/collections/her-tank" },
          { title: "Polo", url: "/collections/her-polo" },
        ],
      },
      {
        heading: "BOTTOMWEAR",
        links: [
          { title: "Shorts", url: "/collections/shorts-women" },
          { title: "Pants", url: "/collections/her-pants" },
          { title: "Joggers", url: "/products/her-drift-joggers" },
        ],
      },
    ],
    promos: [
      {
        title: "Her Tank",
        img: "https://mypepr.com/cdn/shop/files/HER_Tank_3.webp",
        url: "/products/her-tank",
      },
    ],
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
  { title: "CLEARANCE", url: "/pages/clearance-sale" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

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
                  <button className="flex items-center gap-1 font-semibold">
                    {item.title}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {/* Full Width Mega Menu */}
                  <div className="absolute left-0 top-full w-screen bg-white shadow-lg border-t border-gray-100 hidden group-hover:block">
                    <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8 p-8">
                      {/* Subcategories */}
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

                      {/* Promo product images */}
                      {item.promos?.map((promo) => (
                        <Link
                          key={promo.title}
                          to={promo.url}
                          className="block group overflow-hidden"
                        >
                          <img
                            src={promo.img}
                            alt={promo.title}
                            className="w-full h-40 object-cover rounded-md group-hover:opacity-90 transition"
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
                  <button className="flex items-center gap-1 font-semibold">
                    {item.title}
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {/* Dropdown */}
                  <div className="absolute left-0 top-full bg-white shadow-lg p-4 hidden group-hover:block">
                    <ul className="space-y-2">
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
                  className="font-semibold hover:text-black"
                >
                  {item.title}
                </Link>
              )
            )}
          </nav>
        </div>

        {/* Logo */}
        <Link to="/" className="font-bold text-2xl">
          PEPR
        </Link>

        {/* Right Icons */}
        <div className="flex items-center gap-4">
          <Link to="/search">
            <Search className="w-6 h-6" />
          </Link>
          <Link to="/account">
            <User className="w-6 h-6" />
          </Link>
          <Link to="/cart" className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-40 z-40">
          <div className="bg-white w-64 h-full p-6">
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
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
