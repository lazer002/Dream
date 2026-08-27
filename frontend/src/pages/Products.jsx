// src/pages/Products.jsx
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Heart, ShoppingBag, Filter, ArrowUpDown, Heart as HeartOutline } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "../state/CartContext.jsx"
import { useWishlist } from "../state/WishlistContext.jsx"
import api from "@/utils/config";
import { useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog.jsx";
import FilterDrawer from "@/components/filterDrawer";

export default function Products() {
  const { add } = useCart()
  const [products, setProducts] = useState([]);
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const [sort, setSort] = useState("newest");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    categories: [],
    priceRange: "",
    color: [],
    size: [],
    fabric: [],
    fit: [],
    inStock: false,
    isNew: false,
    onSale: false,
  });
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
    if (!selectedProduct) return;
    const qty = Number(selectedProduct.inventory?.[sizeKey] ?? 0);
    if (qty <= 0) return; // disabled anyway

    add(selectedProduct._id, sizeKey); // 👈 always with size
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const fetchProducts = async (reset = false, categoryFromQueryParam = null) => {
    if (!reset && (loading || !hasMore)) return; // only block when NOT resetting

    const currentPage = reset ? 1 : page;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("limit", 10);
      params.append("page", currentPage);
      params.append("sort", sort);

      const apiCategory = categoryFromQueryParam
        ? [categoryFromQueryParam.toLowerCase()] // normalize to lowercase
        : selectedFilters.categories;

      if (apiCategory.length) params.append("category", apiCategory.join(","));


      if (selectedFilters.priceRange)
        params.append("priceRange", selectedFilters.priceRange);
      // 🔥 TAG FILTERS
      let tags = [];

      if (selectedFilters.color.length)
        tags.push(...selectedFilters.color);

      if (selectedFilters.size.length)
        tags.push(...selectedFilters.size);

      if (selectedFilters.fabric.length)
        tags.push(...selectedFilters.fabric);

      if (selectedFilters.fit.length)
        tags.push(...selectedFilters.fit);

      if (tags.length)
        params.append("tags", tags.join(","));

      // 🔥 BOOLEAN FILTERS
      if (selectedFilters.inStock)
        params.append("inStock", "true");

      if (selectedFilters.isNew)
        params.append("isNew", "true");

      if (selectedFilters.onSale)
        params.append("onSale", "true");

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



  const handleFilterChange = (type, value) => {
    setSelectedFilters(prev => {
      if (Array.isArray(prev[type])) {
        return prev[type].includes(value)
          ? { ...prev, [type]: prev[type].filter(v => v !== value) }
          : { ...prev, [type]: [...prev[type], value] };
      }
      return { ...prev, [type]: value };
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
          <span className="max-[500]:hidden"> Filter</span>
        </button>

        <div className="w-48">
          <Select value={sort} onValueChange={(v) => setSort(v)}>
            <SelectTrigger className="w-full px-1 py-2 bg-gray-100 text-black flex items-center gap-2">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 pb-10">
        {products.map((p) => {
          // console.log("[ProductCard] render", { _id: p._id, isWished: wishlist.includes(String(p._id)), wishlistSample: wishlist.slice(0, 6) });
          const id = String(p._id);
          return (
            <Link key={p.publicId} to={`/product/${p.publicId}`} className="cursor-pointer">
              <div className="bg-white transition border border-gray-100 overflow-hidden relative rounded-2xl">
                <div className="relative w-full h-[50vh] overflow-hidden">
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-full h-full object-cover transition-all duration-500 hover:opacity-0 rounded-xl"
                  />
                  {p.images[1] && (
                    <img
                      src={p.images[1]}
                      alt={p.title + " hover"}
                      className="w-full h-full object-cover absolute top-0 left-0 opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                  )}
                  {p.isNew && (
                    <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 uppercase">
                      NEW
                    </span>
                  )}
                  {p.discount && (
                    <span
                      className="
    absolute
    top-3
    right-3

    z-20

    bg-red-500
    text-white

    text-[12px]
    font-black

    uppercase
    tracking-wide

    px-4 py-2

    rounded-full

    shadow-lg
    shadow-red-500/30
  "
                    >
                      {Math.round(p.discount)}% OFF
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      wishlist.includes(id)
                        ? removeFromWishlist(id)
                        : addToWishlist(id);
                    }}
                    aria-label={wishlist.includes(id) ? "Remove from wishlist" : "Add to wishlist"}
                    className="absolute bottom-2 right-2  flex items-center justify-center w-10 h-10 hover:scale-110 transition z-10 p-2"
                  >
                    {wishlist.includes(id) ? (
                      <Heart className="h-10 w-10 text-black fill-black" />
                    ) : (
                      <HeartOutline className="h-10 w-10 text-black" />
                    )}
                  </button>


                </div>

                <div className="p-3 flex flex-col gap-1">

<div className="absolute top-3 left-3 z-20 flex flex-col items-start gap-2">
  {(() => {
    const hasAvailableSize =
      Array.isArray(p.sizes) &&
      p.sizes.some((size) => {
        const name =
          typeof size === "string"
            ? size
            : size?.name;

        if (!name) return false;

        const qty = Number(
          p.inventory?.[name] ??
            p.inventory?.stock?.[name] ??
            0
        );

        return (
          (typeof size === "string" ||
            size.active !== false) &&
          qty > 0
        );
      });

    const soldOut =
      p.isOutOfStock === true &&
      !hasAvailableSize;

    if (soldOut) {
      return (
        <div
          className="
            bg-black/80
            backdrop-blur-md
            text-white
            text-[11px]
            font-bold
            tracking-[0.15em]
            uppercase
            px-3 py-2
            rounded-full
          "
        >
          Sold Out
        </div>
      );
    }

    return (
      <>
        {p.onSale && (
          <div
            className="
              bg-black/80
              backdrop-blur-md
              text-white
              text-[11px]
              font-bold
              tracking-[0.15em]
              uppercase
              px-3 py-2
              rounded-full
            "
          >
            Sale
          </div>
        )}

        {p.isNewProduct && (
          <div
            className="
              bg-black/80
              backdrop-blur-md
              text-white
              text-[11px]
              font-bold
              tracking-[0.15em]
              uppercase
              px-3 py-2
              rounded-full
            "
          >
            NEW
          </div>
        )}
      </>
    );
  })()}
</div>


                  <div className="flex items-center justify-between">

                    <h3 className="text-sm font-bold text-black uppercase truncate">{p.title}</h3>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        openModal(p);
                      }}
                      className="p-1 w-7 h-7 flex items-center justify-center transition"
                      title="Add to Cart"
                    >
                      <ShoppingBag className="w-10 h-10" />
                    </button>
                  </div>

                  {/* 💰 Price Section */}
                  <div className="flex items-center gap-2 flex-wrap">

                    {/* If on sale — show a mock original price and discount */}
                    {p.oldPrice && (
                      <>
                        {/* Fake original price (e.g. 30% higher) */}
                        <span className="text-xs text-gray-500 line-through">
                          ₹ {p.oldPrice}.00
                        </span>


                      </>
                    )}

                    {/* Actual Price */}
                    <span className="text-md font-bold text-red-600">
                      ₹ {Number(p.price).toLocaleString()}.00
                    </span>
                    {/* Discount label */}
                    {/* <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded">
          30% OFF
        </span> */}
                  </div>


                </div>

              </div>
            </Link>
          )
        })}
      </div>
      {loading && (
        <div className="transition-opacity duration-[300ms]">
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

<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
  <DialogContent className="w-[calc(100%-32px)] max-w-md rounded-2xl p-0 overflow-hidden">
    <DialogHeader className="px-6 pt-6 pb-4 border-b">
      <DialogTitle className="text-xl font-semibold">
        Select Size
      </DialogTitle>
      <p className="text-sm text-muted-foreground">
        Choose your preferred size
      </p>
    </DialogHeader>

{selectedProduct && (
  <div className="px-6 py-5">
    {selectedProduct.sizes?.length ? (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {selectedProduct.sizes.map((size) => {
            const name = size.name;

            const qty = Number(
              selectedProduct.inventory?.[name] ??
                selectedProduct.inventory?.stock?.[name] ??
                0
            );

            const isAvailable =
              size.active !== false && qty > 0;

            return (
              <button
                key={name}
                type="button"
                disabled={!isAvailable}
                onClick={() => {
                  if (isAvailable) {
                    handleSelectSize(name);
                  }
                }}
                className={`
                  group
                  relative
                  min-h-[72px]
                  rounded-xl
                  border
                  px-4
                  py-3
                  text-left
                  transition-all
                  duration-200

                  ${
                    isAvailable
                      ? `
                        border-gray-200
                        bg-white
                        hover:border-black
                        hover:shadow-sm
                        active:scale-[0.98]
                      `
                      : `
                        cursor-not-allowed
                        border-gray-100
                        bg-gray-50
                        text-gray-400
                      `
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`
                      text-base font-semibold
                      ${
                        isAvailable
                          ? "text-gray-900"
                          : "text-gray-400"
                      }
                    `}
                  >
                    {name}
                  </span>

                  <span
                    className={`
                      h-2 w-2 rounded-full
                      ${
                        isAvailable
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }
                    `}
                  />
                </div>

                <span
                  className={`
                    mt-1 block text-xs
                    ${
                      isAvailable
                        ? "text-gray-500"
                        : "text-gray-400"
                    }
                  `}
                >
                  {isAvailable
                    ? qty <= 5
                      ? `Only ${qty} left`
                      : "Available"
                    : "Out of stock"}
                </span>
              </button>
            );
          })}
        </div>

        {(() => {
          const hasAvailableSize =
            selectedProduct.sizes.some((size) => {
              const qty = Number(
                selectedProduct.inventory?.[size.name] ??
                  selectedProduct.inventory?.stock?.[
                    size.name
                  ] ??
                  0
              );

              return (
                size.active !== false &&
                qty > 0
              );
            });

          return !hasAvailableSize ? (
            <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-600">
                This product is currently out of stock.
              </p>
            </div>
          ) : null;
        })()}
      </>
    ) : (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm text-gray-500">
          No sizes available for this product.
        </p>
      </div>
    )}
  </div>
)}
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


      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedFilters={selectedFilters}
        onChange={handleFilterChange}
        onApply={() => {
          setPage(1);        // 🔥 reset pagination
          setHasMore(true);  // 🔥 allow new fetch
          setIsFilterOpen(false);
        }}
        categories={categories}
      />

    </div>


  );
}
