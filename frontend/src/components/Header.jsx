import { useState } from "react";
import { Button } from "@/components/ui/button";
import  Avatar  from "@/components/ui/avatar";
import { ShoppingCart, Search } from "lucide-react";

export default function Header() {
    const cartCount  =3
    
  const categories = [
  { title: "Hoodies", url: "/products/hoodies" },
  { title: "T-Shirts", url: "/products/tshirts" },
  { title: "Shirt", url: "/products/shirt" },
  { title: "Pants", url: "/products/pants" },
  { title: "Jacket", url: "/products/jacket" },
];

    
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
// Flat category menu

<header className="bg-white shadow-md relative z-10">
  {/* Top Bar */}
  <div className="container mx-auto flex items-center justify-between py-2 px-4 md:px-6">
    {/* Left: Hamburger */}
    <Button
      variant="ghost"
      onClick={() => setMobileOpen(!mobileOpen)}
      className="md:hidden"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </Button>

    {/* Center: Logo */}
    <a href="/" className="text-xl font-bold">
      MyShop
    </a>

    {/* Right: Search + Profile + Cart */}
    <div className="flex items-center space-x-4">
      <Button variant="ghost" >
        <Search className="w-5 h-5" />
      </Button>
      <Avatar src="/avatar.png" alt="User" />
      <Button variant="ghost" className="relative">
        <ShoppingCart />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </Button>
    </div>
  </div>

  {/* Tabs / Category bar */}
  <div className="border-t border-gray-200 bg-gray-50">
    <div className="container mx-auto flex flex-wrap justify-center space-x-4 px-4 md:px-6 py-2">
      {categories.map((cat) => (
        <a
          key={cat.title}
          href={cat.url}
          className="py-1 px-2 rounded-md hover:bg-gray-100 text-sm md:text-base"
        >
          {cat.title}
        </a>
      ))}
    </div>
  </div>


    <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-400 ${
          mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={() => setMobileOpen(false)}
        >
          ✕
        </button>

        {/* Links */}
        <ul className="flex flex-col space-y-3 mt-12 p-4">
          {categories.map((cat) => (
            <li key={cat.title}>
              <a
                href={cat.url}
                className="block py-2 px-3 rounded hover:bg-gray-100"
                onClick={() => setMobileOpen(false)}
              >
                {cat.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

</header>

  );
}
