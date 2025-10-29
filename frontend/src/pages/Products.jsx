// src/pages/Products.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Filter, ArrowUpDown, Heart as HeartOutline } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "../state/CartContext.jsx"
import { api } from "@/utils/config.js";
import { useLocation } from "react-router-dom";
import { Dialog,DialogContent,DialogHeader ,DialogTitle ,DialogClose   } from "@/components/ui/dialog.jsx";


export default function Products() {
  const { add } = useCart()
  const [products, setProducts] = useState([]);
  const [sort, setSort] = useState("newest");
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem("wishlist")) || []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({ categories: [], priceRange: "", brand: [] });
  const [categories, setCategories] = useState([]);

  const [showTopBtn, setShowTopBtn] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

const [selectedProduct, setSelectedProduct] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);

const openModal = (product) => {
  setSelectedProduct(product);
  setIsModalOpen(true);
};

const handleSelectSize = (sizeKey) => {
  console.log("Selected size:", sizeKey);
  if (!selectedProduct) return;
  const qty = Number(selectedProduct.inventory?.[sizeKey] ?? 0);
  if (qty <= 0) return; // disabled anyway

  add(selectedProduct._id, sizeKey); // 👈 always with size
  setIsModalOpen(false);
  setSelectedProduct(null);
};

  const fetchProducts = async (reset = false, categoryFromQueryParam = null) => {
    if (!reset && (loading || !hasMore)) return; // only block when NOT resetting


    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("limit", 10);
      params.append("page", page);
      params.append("sort", sort);

      const apiCategory = categoryFromQueryParam
        ? [categoryFromQueryParam.toLowerCase()] // normalize to lowercase
        : selectedFilters.categories;

      if (apiCategory.length) params.append("category", apiCategory.join(","));


      if (selectedFilters.priceRange)
        params.append("priceRange", selectedFilters.priceRange);
      if (selectedFilters.brand.length)
        params.append("brand", selectedFilters.brand.join(","));

      const res = await api.get("/products", {
        params: Object.fromEntries(params.entries()),
      });

      const newProducts = res.data.items || [];

      if (reset) {
        setProducts(newProducts);
      } else {
        setProducts((prev) => [...prev, ...newProducts]);
      }

      if (newProducts.length < 10) setHasMore(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const handleScroll = () => {

      if (window.scrollY > 500) setShowTopBtn(true);
      else setShowTopBtn(false);

      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300 // 300px from bottom
      ) {
        if (!loading && hasMore) {
          setPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading, hasMore]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromQuery = params.get("category");

    setPage(1);
    setHasMore(true);

    fetchProducts(true, categoryFromQuery); // reset products, force fetch
  }, [location.search, sort, selectedFilters]);


  useEffect(() => {
    console.log("Location changed:", location.search);
  }, [location.search]);



  useEffect(() => {
    if (page === 1) return; // first page already fetched on category/filter change
    fetchProducts();         // fetch next pages for infinite scroll
  }, [page]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      const cats = Array.isArray(res.data.categories)
        ? res.data.categories
        : [];
      setCategories([...cats]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);
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
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  function ProductSkeleton() {
    return (
      <div className="bg-white border border-gray-200 p-4 flex flex-col gap-2 animate-pulse">
        <div className="w-full h-48 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  return (
    <div className="bg-white min-h-screen text-black relative">
      {/* Top Controls */}
      <div className=" mx-auto px-4 py-10 flex flex-wrap gap-4 items-center justify-between">
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4 pb-10">
        {products.map((p) => {
          return (
            <Link key={p._id} to={`/product/${p._id}`} className="cursor-pointer">
              <div className="bg-white border border-gray-200 transition overflow-hidden relative">
                <div className="relative w-full h-[54vh] overflow-hidden">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-full object-cover transition-all duration-500 hover:opacity-0"
                  />
                  {p.images[1] && (
                    <img
                      src={p.images[1]}
                      alt={p.title + " hover"}
                      className="w-full h-full object-cover absolute top-0 left-0 opacity-0 hover:opacity-100 transition-opacity duration-500" />
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
                    aria-label={wishlist.includes(p._id) ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute bottom-2 right-2 p-1 flex items-center justify-center w-7 h-7 hover:scale-110 transition"
                  >
                    {wishlist.includes(p._id) ? (
                      <Heart className="h-10 w-10 text-red-500 fill-red-500" />
                    ) : (
                      <HeartOutline className="h-10 w-10 text-black" />
                    )}
                  </button>
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-black uppercase">{p.title}</h3>
                    <button
                      onClick={(e) => {   e.preventDefault();
                         openModal(p); }}
                      className="p-1 w-7 h-7 flex items-center justify-center   transition"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="w-10 h-10" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-[#042354]">₹{p.price}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      {loading && (
        <div className="transition-opacity duration-[0.3s]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        </div>
      )}


      {!loading && products.length === 0 && (
        <div className="text-center text-gray-500 mt-20">No products found</div>
      )}

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
    <div>
      <h3 className="font-bold mb-2 uppercase text-black">Categories</h3>

      {categories && categories.length > 0 ? (
        categories.map((cat) => (
          <label
            key={cat._id}
            className="flex items-center gap-2 mb-1 cursor-pointer text-black"
          >
            <input
              type="checkbox"
              checked={selectedFilters.categories.includes(cat.name)}
              onChange={() => handleFilterChange("categories", cat.name)}
              className="w-4 h-4 border border-black accent-black focus:ring-0"
            />
            {cat.name}
          </label>
        ))
      ) : (
        <p className="text-sm text-gray-500">Loading categories...</p>
      )}
    </div>

    {/* Price Range */}
    <div>
      <h3 className="font-bold mb-2 uppercase text-black">Price Range</h3>
      {["0-500", "500-1000", "1000-2000", "2000+"].map((range) => (
        <label
          key={range}
          className="flex items-center gap-2 mb-1 cursor-pointer text-black"
        >
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

    <button
      onClick={() => setIsFilterOpen(false)}
      className="w-full mt-4 bg-black text-white font-bold uppercase hover:bg-black transition py-2"
    >
      Apply Filters
    </button>
  </div>
</div>
<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="max-w-sm w-[90%]">
    <DialogHeader>
      <DialogTitle>Select Size</DialogTitle>
      <DialogClose />
    </DialogHeader>

    <div className="p-4 flex flex-col gap-4">
      {selectedProduct && (
        <>
       

          <div>
            <div className="text-sm text-gray-600 mb-2">Choose Size</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(selectedProduct.inventory || {}).map(([size, qty]) => (
                <button
                  key={size}
                  onClick={() => handleSelectSize(size)}
                  disabled={qty <= 0}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition
                    ${
                      qty <= 0
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                        : "hover:bg-black hover:text-white"
                    }`}
                  title={qty <= 0 ? "Out of stock" : `Add ${size} to cart`}
                >
                  <div className="flex flex-col items-center">
                    <span>{size}</span>
                    <small className="text-xs">{qty > 0 ? `${qty} left` : "Out"}</small>
                  </div>
                </button>
              ))}
            </div>

            {Object.values(selectedProduct.inventory || {}).every((q) => q <= 0) && (
              <div className="mt-3 text-sm text-red-500 font-medium">Out of Stock</div>
            )}
          </div>
        </>
      )}
    </div>
  </DialogContent>
</Dialog>



      {/* Overlay */}
      {isFilterOpen && (
        <div
          onClick={() => setIsFilterOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-40 transition-opacity duration-300"
        />
      )}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-black text-white px-5 py-3 rounded-full shadow-lg hover:bg-white hover:text-black  transition "
          title="Go to top"
        >
          ↑
        </button>
      )}

    </div>


  );
}
