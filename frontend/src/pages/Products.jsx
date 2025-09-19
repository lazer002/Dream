// src/pages/Products.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import ProductCard from "../components/ProductCard.jsx";
import { Heart, Filter, ArrowUpDown ,Heart as HeartOutline} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="bg-white min-h-screen text-black">
      {/* Top Controls */}
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-wrap gap-4 items-center justify-between">
        <Button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#042354] text-white hover:bg-black transition"
        >
          <Filter className="w-5 h-5" />
          Filter
        </Button>

        <div className="w-48">
          <Select value={sort} onValueChange={(v) => setSort(v)}>
            <SelectTrigger className="w-full rounded-full px-4 py-2 bg-gray-100 text-black flex items-center gap-2">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
  {products.map((p) => (
    <Link to={`/product/${p._id}`} className="cursor-pointer">
    <div
      key={p._id}
      className="bg-white rounded-lg lg:my-6  transition overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative w-full h-96 overflow-hidden">
        <img
          src={p.images[0]} // default image
          alt={p.title}
          className="w-full h-full object-cover transition-all duration-500 hover:opacity-0"
        />
        {p.images[1] && (
          <img
            src={p.images[1]} // second image on hover
            alt={p.title + ' hover'}
            className="w-full h-full object-cover absolute top-0 left-0 opacity-0 hover:opacity-100 transition-all duration-500"
          />
        )}

        {/* Heart Icon */}
        <button
          onClick={() => toggleWishlist(p._id)}
          className="absolute bottom-2 right-2 p-1 rounded-full  flex items-center justify-center w-7 h-7 hover:scale-110 transition"
        >
     {wishlist.includes(p._id) ? (
    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
  ) : (
    <HeartOutline className="h-4 w-4 text-black" />
  )}
        </button>
      </div>
      {/* Product Info */}
      <div className="p-4 flex flex-col gap-1">
        <h3 className="text-sm font-medium text-black hover:text-gray-400 transition">{p.title}</h3>
        <span className="text-sm font-semibold text-[#042354]">₹{p.price}</span>
      </div>
    </div>
      </Link>
  ))}
</div>



      {products.length === 0 && <div className="text-center text-gray-500 mt-20">No products found</div>}

      {/* Filter Sidebar */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="fixed left-0 top-0 h-full w-64 p-6 bg-white shadow-lg border-r border-gray-200">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold text-black">Filters</DialogTitle>
            <DialogClose asChild>
              <button className="text-black hover:text-[#042354]">×</button>
            </DialogClose>
          </DialogHeader>

          <Separator className="my-4" />

          <div className="space-y-6">
            {/* Categories */}
            <div>
              <h3 className="font-medium mb-2 text-black">Categories</h3>
              {["Shirts", "Jeans", "Shoes", "Accessories"].map(cat => (
                <label key={cat} className="flex items-center gap-2 mb-1 cursor-pointer text-black">
                  <input
                    type="checkbox"
                    checked={selectedFilters.categories.includes(cat)}
                    onChange={() => handleFilterChange("categories", cat)}
                    className="accent-[#042354]"
                  />
                  {cat}
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-2 text-black">Price Range</h3>
              {["0-50", "50-100", "100-200", "200+"].map(range => (
                <label key={range} className="flex items-center gap-2 mb-1 cursor-pointer text-black">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={selectedFilters.priceRange === range}
                    onChange={() => handleFilterChange("priceRange", range)}
                    className="accent-[#042354]"
                  />
                  {range}
                </label>
              ))}
            </div>

            {/* Brand */}
            <div>
              <h3 className="font-medium mb-2 text-black">Brand</h3>
              {["Levi's", "H&M", "Zara"].map(brand => (
                <label key={brand} className="flex items-center gap-2 mb-1 cursor-pointer text-black">
                  <input
                    type="checkbox"
                    checked={selectedFilters.brand.includes(brand)}
                    onChange={() => handleFilterChange("brand", brand)}
                    className="accent-[#042354]"
                  />
                  {brand}
                </label>
              ))}
            </div>

            <Button
              className="w-full mt-4 bg-[#042354] text-white hover:bg-black transition"
              onClick={() => setIsFilterOpen(false)}
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
