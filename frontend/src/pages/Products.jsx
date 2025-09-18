import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";
import { Heart, Filter, ChevronDown,ArrowUpDown   } from "lucide-react";
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
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-wrap gap-4 items-center">
        {/* Pill-style Filter Button */}
        <Button
          onClick={() => setIsFilterOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white hover:bg-gray-900 transition"
        >
          <Filter className="w-5 h-5" />
          Filter
        </Button>

        <div className="w-40">
  <Select value={sort} onValueChange={(v) => setSort(v)}>
    <SelectTrigger className="flex items-center justify-between w-full rounded-full px-4 py-2 bg-gray-100 text-gray-900">
      {/* Left Icon */}
      <ArrowUpDown className="w-5 h-5 text-gray-700 mr-2 flex-shrink-0" />
      {/* Center Text */}
      <SelectValue placeholder="Sort By" className="flex-1 text-left" />
      {/* Right Icon */}
      <ChevronDown className="w-5 h-5 text-gray-700 flex-shrink-0" />
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
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map(p => (
          <div key={p._id} className="relative group">
            <ProductCard product={p} />
            <button
              onClick={() => toggleWishlist(p._id)}
              className="absolute top-2 right-2 p-2 bg-white rounded-full shadow hover:scale-110 transition"
            >
              <Heart className={`h-5 w-5 ${wishlist.includes(p._id) ? "text-red-500" : "text-gray-400"}`} />
            </button>
          </div>
        ))}
      </div>

      {products.length === 0 && <div className="text-center text-gray-500 mt-20">No products found</div>}

      {/* Off-canvas Filter Sidebar */}
      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <DialogContent className="fixed left-0 top-0 h-full w-64 p-6 bg-white shadow-lg">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle>Filters</DialogTitle>
            <DialogClose asChild />
          </DialogHeader>

          <Separator className="my-4" />

          <div className="space-y-4">
            {/* Categories */}
            <div>
              <h3 className="font-semibold mb-2">Categories</h3>
              {["Shirts", "Jeans", "Shoes", "Accessories"].map(cat => (
                <label key={cat} className="flex items-center gap-2 mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters.categories.includes(cat)}
                    onChange={() => handleFilterChange("categories", cat)}
                    className="accent-black"
                  />
                  {cat}
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold mb-2">Price Range</h3>
              {["0-50", "50-100", "100-200", "200+"].map(range => (
                <label key={range} className="flex items-center gap-2 mb-1 cursor-pointer">
                  <input
                    type="radio"
                    name="priceRange"
                    checked={selectedFilters.priceRange === range}
                    onChange={() => handleFilterChange("priceRange", range)}
                    className="accent-black"
                  />
                  {range}
                </label>
              ))}
            </div>

            {/* Brand */}
            <div>
              <h3 className="font-semibold mb-2">Brand</h3>
              {["Levi's", "H&M", "Zara"].map(brand => (
                <label key={brand} className="flex items-center gap-2 mb-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedFilters.brand.includes(brand)}
                    onChange={() => handleFilterChange("brand", brand)}
                    className="accent-black"
                  />
                  {brand}
                </label>
              ))}
            </div>

            <Button className="w-full mt-4" onClick={() => setIsFilterOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
