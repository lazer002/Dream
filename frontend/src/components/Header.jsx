"use client";
import { useState } from "react";
import { ShoppingCart, Search, User, Menu, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../state/CartContext.jsx"; 
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
  const [mobileOpen, setMobileOpen] = useState(false);
const { items } = useCart()
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
      <Link to="/search">
        <Search className="w-6 h-6" />
      </Link>
      <Link to="/account">
        <User className="w-6 h-6" />
      </Link>
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
        </ul>
      </div>
    </div>
  )}
</header>


  );
}
