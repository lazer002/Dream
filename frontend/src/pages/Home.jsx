import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.items || []));
  }, [q]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <div className="px-8 py-24 sm:px-12 lg:px-16 max-w-7xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Elevate Your Style
          </h1>
          <p className="text-lg sm:text-xl mb-6 max-w-2xl">
            Discover the latest streetwear trends and premium essentials that make a statement.
          </p>
          <div className="flex gap-4">
            <Link
              to="/products"
              className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition"
            >
              Shop Now
            </Link>
            <a
              href="https://urbanfits.co.in"
              target="_blank"
              className="px-6 py-3 border border-white text-white rounded-lg hover:bg-white hover:text-purple-600 transition"
            >
              Explore Styles
            </a>
          </div>
        </div>
        {/* Hero Illustration / Image */}
        <div className="absolute top-0 right-0 w-1/2 h-full hidden md:block overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1602810319064-7ac434d5d541?auto=format&fit=crop&w=800&q=80"
            alt="Hero"
            className="h-full w-full object-cover rounded-l-3xl"
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {["T-Shirts", "Hoodies", "Sneakers", "Accessories"].map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${cat}`}
              className="relative overflow-hidden rounded-xl group cursor-pointer"
            >
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition"></div>
              <img
                src={`https://source.unsplash.com/400x400/?${cat}`}
                alt={cat}
                className="w-full h-56 object-cover rounded-xl transition-transform group-hover:scale-105"
              />
              <span className="absolute bottom-4 left-4 text-white text-lg font-semibold drop-shadow-lg">
                {cat}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Selling Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Best Selling</h2>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="px-4 py-2 border rounded-lg focus:ring focus:ring-purple-300 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map((p) => <ProductCard key={p._id} product={p} />)
          ) : (
            <p className="text-gray-500 col-span-full text-center">
              No products found.
            </p>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-purple-50 py-12 rounded-3xl text-center">
        <h2 className="text-2xl font-bold mb-3">Join Our Newsletter</h2>
        <p className="text-gray-700 mb-6">Get updates on new arrivals and exclusive offers.</p>
        <form className="flex flex-col sm:flex-row justify-center gap-4 max-w-xl mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="px-4 py-3 rounded-lg border focus:ring focus:ring-purple-300 outline-none flex-1"
          />
          <button className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition">
            Subscribe
          </button>
        </form>
      </section>
    </div>
  );
}
