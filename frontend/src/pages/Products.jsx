// src/pages/Products.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart,ShoppingBag  , Filter, ArrowUpDown ,Heart as HeartOutline} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "../state/CartContext.jsx"
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("newest");
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist")) || []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({ categories: [], priceRange: "", brand: [] });

  useEffect(() => {
    const query = new URLSearchParams();
    query.append("limit", 48);
    query.append("sort", sort);

    if (selectedFilters.categories.length) query.append("categories", selectedFilters.categories.join(","));
    if (selectedFilters.priceRange) query.append("priceRange", selectedFilters.priceRange);
    if (selectedFilters.brand.length) query.append("brand", selectedFilters.brand.join(","));

    fetch(`${API_URL}/products?${query.toString()}`)
      .then(r => r.json())
      .then(d => setProducts(d.items || []));
  }, [sort, selectedFilters]);

  const toggleWishlist = (productId) => {
    let updated;
    if (wishlist.includes(productId)) updated = wishlist.filter((id) => id !== productId);
    else updated = [...wishlist, productId];
    setWishlist(updated);
    localStorage.setItem("wishlist", JSON.stringify(updated));
  };

  const handleFilterChange = (type, value) => {
    setSelectedFilters(prev => {
      if (type === "categories" || type === "brand") {
        const arr = prev[type];
        if (arr.includes(value)) return { ...prev, [type]: arr.filter(v => v !== value) };
        else return { ...prev, [type]: [...arr, value] };
      } else if (type === "priceRange") return { ...prev, priceRange: value };
      return prev;
    });
  };

  return (
<div className="bg-white min-h-screen text-black relative">
  {/* Top Controls */}
  <div className="max-w-7xl mx-auto px-4 py-10 flex flex-wrap gap-4 items-center justify-between">
    <button
      onClick={() => setIsFilterOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-black text-white font-bold uppercase hover:bg-black transition"
    >
      <Filter className="w-5 h-5" />
      Filter
    </button>

    <div className="w-48">
      <Select value={sort} onValueChange={(v) => setSort(v)}>
        <SelectTrigger className="w-full px-4 py-2 bg-gray-100 text-black flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5 text-gray-700" />
          <SelectValue placeholder="Sort By" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="low-high">Price: Low to High</SelectItem>
          <SelectItem value="high-low">Price: High to Low</SelectItem>
          <SelectItem value="popular">Popular</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Products Grid */}
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
  {products.map((p) => {
    const { add } = useCart()
    return (
      <Link key={p._id} to={`/product/${p._id}`} className="cursor-pointer">
        <div className="bg-white border border-gray-200 transition overflow-hidden relative">
          <div className="relative w-full h-96 overflow-hidden">
            <img
              src={p.images[0]}
              alt={p.title}
              className="w-full h-full object-cover transition-all duration-500 hover:opacity-0"
            />
            {p.images[1] && (
              <img
                src={p.images[1]}
                alt={p.title + " hover"}
                className="w-full h-full object-cover absolute top-0 left-0 opacity-0 hover:opacity-100 transition-all duration-500"
              />
            )}
            {p.isNew && (
              <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 uppercase">
                NEW
              </span>
            )}
            {p.onSale && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 uppercase">
                SALE
              </span>
            )}
            <button
              onClick={() => toggleWishlist(p._id)}
              className="absolute bottom-2 right-2 p-1 flex items-center justify-center w-7 h-7 hover:scale-110 transition"
            >
              {wishlist.includes(p._id) ? (
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
              ) : (
                <HeartOutline className="h-4 w-4 text-black" />
              )}
            </button>
          </div>

          <div className="p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-black uppercase">{p.title}</h3>
              <button
                onClick={(e) => { e.preventDefault(); add(p._id, 1) }}
                className="p-1 w-7 h-7 flex items-center justify-center   transition"
                title="Add to Cart"
              >
                <ShoppingBag  className="w-4 h-4" />
              </button>
            </div>
            <span className="text-sm font-bold text-[#042354]">₹{p.price}</span>
          </div>
        </div>
      </Link>
    )
  })}
</div>

  {products.length === 0 && <div className="text-center text-gray-500 mt-20">No products found</div>}

  {/* Filter Offcanvas */}
  <div
    className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-50
                ${isFilterOpen ? "translate-x-0" : "-translate-x-full"}`}
  >
    <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
      <h2 className="text-lg font-bold uppercase">Filters</h2>
      <button
        onClick={() => setIsFilterOpen(false)}
        className="text-black hover:text-[#042354] text-2xl"
      >
        ×
      </button>
    </div>

    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Categories */}
   {/* Categories */}
<div>
  <h3 className="font-bold mb-2 uppercase text-black">Categories</h3>
  {["Shirts", "Jeans", "Shoes", "Accessories"].map((cat) => (
    <label key={cat} className="flex items-center gap-2 mb-1 cursor-pointer text-black">
      <input
        type="checkbox"
        checked={selectedFilters.categories.includes(cat)}
        onChange={() => handleFilterChange("categories", cat)}
        className="w-4 h-4 border border-black accent-black focus:ring-0"
      />
      {cat}
    </label>
  ))}
</div>

{/* Price Range */}
<div>
  <h3 className="font-bold mb-2 uppercase text-black">Price Range</h3>
  {["0-50", "50-100", "100-200", "200+"].map((range) => (
    <label key={range} className="flex items-center gap-2 mb-1 cursor-pointer text-black">
      <input
        type="radio"
        name="priceRange"
        checked={selectedFilters.priceRange === range}
        onChange={() => handleFilterChange("priceRange", range)}
        className="w-4 h-4 border border-black accent-black focus:ring-0"
      />
      {range}
    </label>
  ))}
</div>

{/* Brand */}
<div>
  <h3 className="font-bold mb-2 uppercase text-black">Brand</h3>
  {["Levi's", "H&M", "Zara"].map((brand) => (
    <label key={brand} className="flex items-center gap-2 mb-1 cursor-pointer text-black">
      <input
        type="checkbox"
        checked={selectedFilters.brand.includes(brand)}
        onChange={() => handleFilterChange("brand", brand)}
        className="w-4 h-4 border border-black accent-black focus:ring-0"
      />
      {brand}
    </label>
  ))}
</div>


      <button
        onClick={() => setIsFilterOpen(false)}
        className="w-full mt-4 bg-black text-white font-bold uppercase hover:bg-black transition py-2"
      >
        Apply Filters
      </button>
    </div>
  </div>

  {/* Overlay */}
  {isFilterOpen && (
    <div
      onClick={() => setIsFilterOpen(false)}
      className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300"
    />
  )}
</div>


  );
}
