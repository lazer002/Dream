import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.items || []));
  }, [q]);

  const categories = ["T-Shirts", "Hoodies", "Sneakers", "Accessories"];

  return (
    <div className="space-y-16">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
        <div className="px-8 py-24 sm:px-12 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              Elevate Your Style
            </h1>
            <p className="text-lg sm:text-xl max-w-xl">
              Discover the latest streetwear trends and premium essentials designed to make a statement.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/products"
                className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg shadow hover:shadow-lg transition"
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
          <div className="flex-1 relative hidden md:block">
            <img
              src="https://images.unsplash.com/photo-1602810319064-7ac434d5d541?auto=format&fit=crop&w=800&q=80"
              alt="Hero"
              className="rounded-l-3xl w-full h-96 object-cover shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h2 className="text-2xl font-bold">Shop by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat}
              to={`/products?category=${cat}`}
              className="relative group overflow-hidden rounded-xl cursor-pointer shadow hover:shadow-lg transition"
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

      {/* Search & Best Selling */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex items-center justify-between">
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
            products.map((p) => (
              <Card key={p._id} className="group overflow-hidden rounded-2xl shadow hover:shadow-lg transition">
                <Link to={`/product/${p._id}`}>
                  <img
                    src={p.images?.[0] || "https://via.placeholder.com/400x400?text=No+Image"}
                    alt={p.title}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform"
                  />
                </Link>
                <CardHeader className="px-4 pt-2">
                  <h3 className="text-gray-900 font-semibold truncate">{p.title}</h3>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-purple-600 font-bold">₹{p.price?.toFixed(2)}</p>
                  {p.discount && <Badge variant="secondary">{p.discount}% OFF</Badge>}
                </CardContent>
                <CardFooter className="px-4 pt-0 pb-4 flex gap-2">
                  <Link to={`/product/${p._id}`} className="flex-1">
                    <Button variant="outline" className="w-full">View</Button>
                  </Link>
                  <Button className="flex-1 bg-purple-600 hover:bg-purple-700 w-full">Add to Cart</Button>
                </CardFooter>
              </Card>
            ))
          ) : (
            <p className="text-gray-500 col-span-full text-center">No products found.</p>
          )}
        </div>
      </section>

      {/* Featured Section */}
      <section className="bg-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <p className="text-gray-700 max-w-xl mx-auto">
            Check out our curated collection of premium products loved by our customers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {products.slice(0, 4).map((p) => (
              <Card key={p._id} className="group overflow-hidden rounded-2xl shadow hover:shadow-lg transition">
                <Link to={`/product/${p._id}`}>
                  <img
                    src={p.images?.[0] || "https://via.placeholder.com/400x400?text=No+Image"}
                    alt={p.title}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform"
                  />
                </Link>
                <CardHeader className="px-4 pt-2">
                  <h3 className="text-gray-900 font-semibold truncate">{p.title}</h3>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-purple-600 font-bold">₹{p.price?.toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 border rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="font-semibold mb-2">Browse Products</h3>
            <p className="text-gray-600">Explore our curated catalog and find your favorite products.</p>
          </div>
          <div className="p-6 border rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="font-semibold mb-2">Add to Cart</h3>
            <p className="text-gray-600">Easily add your favorite items to your cart in one click.</p>
          </div>
          <div className="p-6 border rounded-2xl shadow hover:shadow-lg transition">
            <h3 className="font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600">Receive your products quickly and safely at your doorstep.</p>
          </div>
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
