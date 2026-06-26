import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/config";
import { useCart } from "@/state/CartContext";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  CircleX,
  ChevronRight,
  X,
  ShoppingBag,
} from "lucide-react";
const BuildYourLookPage = () => {
  const { addBundleToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showLookDrawer, setShowLookDrawer] = useState(false);
  const [activeCategory, setActiveCategory] =
    useState("all");

  const [selectedProducts, setSelectedProducts] = useState(() => {
    const saved = localStorage.getItem("build-look-products");
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedSizes, setSelectedSizes] = useState(() => {
    const saved = localStorage.getItem("build-look-sizes");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "build-look-products",
      JSON.stringify(selectedProducts)
    );
  }, [selectedProducts]);

  useEffect(() => {
    localStorage.setItem(
      "build-look-sizes",
      JSON.stringify(selectedSizes)
    );
  }, [selectedSizes]);

  async function fetchProducts() {
    try {
      const res = await api.get("/products");

      setProducts(
        Array.isArray(res.data?.items)
          ? res.data.items
          : []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await api.get("/categories");

      setCategories(
        Array.isArray(res.data?.categories)
          ? res.data.categories
          : []
      );
    } catch (error) {
      console.error(error);
    }
  }

  const filteredProducts = useMemo(() => {
    const list =
      activeCategory === "all"
        ? products
        : products.filter(
          (product) =>
            product.category?._id === activeCategory
        );

    const selectedIds = new Set(
      selectedProducts.map((p) => p._id)
    );

    const selected = list.filter((p) =>
      selectedIds.has(p._id)
    );

    const remaining = list.filter(
      (p) => !selectedIds.has(p._id)
    );

    return [...selected, ...remaining];
  }, [products, activeCategory, selectedProducts]);

  const toggleProduct = (product) => {
    const exists = selectedProducts.some(
      (p) => p._id === product._id
    );

    // remove if already selected
    if (exists) {
      setSelectedProducts((prev) =>
        prev.filter((p) => p._id !== product._id)
      );
      return;
    }

    // limit to 3 products
    if (selectedProducts.length >= 3) {
      toast.error("You can select only 3 pieces");
      return;
    }

    // add product
    setSelectedProducts((prev) => [
      ...prev,
      product,
    ]);
  };

  const subtotal = useMemo(() => {
    return selectedProducts.reduce(
      (sum, item) =>
        sum + Number(item.price || 0),
      0
    );
  }, [selectedProducts]);

  const discount = Math.round(subtotal * 0.1);

  const total = subtotal - discount;

  const handleAddLook = (a) => {
    if (!selectedProducts.length) return;

    const customBundle = {
      title: "My Custom Look",
      products: selectedProducts,
      price: total,
      custom: true,
    };

    addBundleToCart(
      customBundle,
      selectedSizes
    );
    localStorage.removeItem("build-look-products");
    localStorage.removeItem("build-look-sizes");

    setSelectedProducts([]);
    setSelectedSizes({});
  };


  const removeProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.filter((p) => p._id !== productId)
    );

    setSelectedSizes((prev) => {
      const copy = { ...prev };
      delete copy[productId];
      return copy;
    });
  };

  return (
    <div className="bg-white min-h-screen">
      {/* HERO */}
      <section className="border-b border-neutral-200">
        <div className="max-w-[1800px] mx-auto px-6 md:px-10 py-14">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
            <div>
              <p className="uppercase tracking-[0.35em] text-xs text-neutral-500">
                Personal Styling
              </p>

              <h1 className="mt-4 text-5xl md:text-7xl font-black tracking-tight leading-none">
                BUILD YOUR LOOK
              </h1>

              <p className="mt-5 max-w-2xl text-neutral-600 text-lg">
                Curate your outfit from our latest collection.
                Select sizes, mix pieces and unlock bundle savings.
              </p>
            </div>

            <div className="flex gap-12">
              <div>
                <div className="text-4xl font-black">
                  {selectedProducts.length}
                </div>

                <div className="text-sm text-neutral-500 uppercase tracking-widest">
                  Items
                </div>
              </div>

              <div>
                <div className="text-4xl font-black">
                  10%
                </div>

                <div className="text-sm text-neutral-500 uppercase tracking-widest">
                  Savings
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-10">
        {/* CATEGORY BAR */}

        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md py-4 mb-10 border-b">
          <div className="flex gap-3 overflow-x-auto">
            <button
              onClick={() =>
                setActiveCategory("all")
              }
              className={`
pb-3
text-sm
uppercase
tracking-[0.2em]
border-b-2

${activeCategory === "all"
                  ? "border-black text-black"
                  : "border-transparent text-neutral-400"
                }
`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() =>
                  setActiveCategory(
                    category._id
                  )
                }
                className={`
pb-3
text-sm
uppercase
tracking-[0.2em]
border-b-2
transition-all

${activeCategory === category._id
                    ? "border-black text-black"
                    : "border-transparent text-neutral-400 hover:text-black"
                  }
`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_440px] gap-12">
          {/* PRODUCTS */}

          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse"
                  >
                    {/* Image */}
                    <div className="h-[460px] w-full bg-neutral-200 rounded-xl" />

                    <div className="p-6">

                      {/* Category */}
                      <div className="h-3 w-20 bg-neutral-200 rounded mb-4" />

                      {/* Title */}
                      <div className="h-6 w-3/4 bg-neutral-200 rounded mb-4" />

                      {/* Price */}
                      <div className="h-6 w-24 bg-neutral-200 rounded mb-6" />

                      {/* Sizes */}
                      <div className="flex gap-2 mb-5">
                        {[...Array(4)].map((_, idx) => (
                          <div
                            key={idx}
                            className="h-8 w-10 bg-neutral-200 rounded"
                          />
                        ))}
                      </div>

                      {/* Button */}
                      <div className="h-12 w-full bg-neutral-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                No products found
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(
                  (product) => {
                    const selected =
                      selectedProducts.some(
                        (p) =>
                          p._id === product._id
                      );

                    return (
                      <div
                        key={product._id}

                        className="
                        group
                        overflow-hidden
                       bg-white
                        transition-all
                        duration-500
                        hover:-translate-y-1
                       
                      "
                      >
                        <div className="relative overflow-hidden">
                          {selected && (
                            <div
                              className="
      absolute
      top-3
      right-3
      z-10
      bg-black
      text-white
      text-[10px]
      uppercase
      tracking-widest
      px-3
      py-1
      rounded-full
    "
                            >
                              Selected
                            </div>
                          )}
                          <img
                            src={
                              product
                                .images?.[0]
                            }
                            alt={
                              product.title
                            }
                            className="
                            h-[460px]
                            w-full
                            object-cover
                            transition-transform
                            duration-700
                            border border-black/10
                            group-hover:scale-[1.03]
                          "
                            onClick={() => navigate(`/product/${product._id}`)}
                          />
                        </div>

                        <div className="p-6">
                          <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                            {
                              product
                                .category
                                ?.name
                            }
                          </p>

                          <h3 className="font-bold text-xl mt-2">
                            {
                              product.title
                            }
                          </h3>

                          <p className="mt-3 font-semibold text-lg">
                            ₹
                            {Number(
                              product.price
                            ).toLocaleString()}
                          </p>

                          {/* SIZE SELECTOR */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {Object.entries(product.inventory || {}).map(
                              ([size, qty]) => (
                                <button
                                  key={size}
                                  type="button"
                                  disabled={qty <= 0 || selected}
                                  onClick={() =>
                                    setSelectedSizes((prev) => ({
                                      ...prev,
                                      [product._id]: size,
                                    }))
                                  }
                                  className={`
        relative
        h-8
        px-3
        border
        text-xs
        font-medium
        transition-all

        ${qty <= 0
                                      ? "cursor-not-allowed border-neutral-200 text-neutral-400 line-through"
                                      : ""
                                    }

        ${selected
                                      ? "pointer-events-none opacity-50"
                                      : ""
                                    }

        ${selectedSizes[product._id] === size
                                      ? "bg-black text-white border-black"
                                      : qty > 0
                                        ? "border-neutral-300 hover:border-black"
                                        : ""
                                    }
      `}
                                >
                                  {size}


                                </button>
                              )
                            )}
                          </div>

                          <button
                            disabled={!selectedSizes[product._id]}
                            onClick={() => toggleProduct(product)}
                            className={`
    mt-5

    w-full

    py-3

    border

    uppercase
    tracking-[0.15em]
    text-xs
    font-semibold

    transition-all

    ${!selectedSizes[product._id]
                                ? "border-neutral-300 text-neutral-400 cursor-not-allowed"
                                : selected
                                  ? "bg-black text-white border-black"
                                  : "border-black hover:bg-black hover:text-white"
                              }
  `}
                          >
                            {!selectedSizes[product._id] ? (
                              "Select Size"
                            ) : selected ? (
                              <>
                                <span className="group-hover:hidden">
                                  ✓ Added
                                </span>

                                <span className="hidden group-hover:inline">
                                  Remove
                                </span>
                              </>
                            ) : (
                              "Add To Look"
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* SUMMARY */}

          <aside
            className="
         hidden
lg:block
sticky
top-24
h-fit
rounded-[32px]
border
bg-white
p-6
shadow-xl
            "
          >
            <div className="border-b pb-6">
              <p className="uppercase tracking-[0.25em] text-xs text-neutral-500">
                Styling Board
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Your Look
              </h2>

              <p className="mt-2 text-neutral-500">
                {selectedProducts.length}/3 selected pieces
              </p>
            </div>

            {/* Preview */}

            {/* Preview */}

            <div className="mt-8 space-y-4">
              {selectedProducts.map((product) => (
                <div
                  key={product._id}
                  className="
        flex
        gap-4

        border-b
        pb-4
      "
                >
                  <img
                    src={product.images?.[0]}
                    alt={product.title}
                    className="
          w-20
          h-24

          object-cover
        "
                  />

                  <div className="flex-1">
                    <p className="font-medium">
                      {product.title}
                    </p>

                    <p className="text-sm text-neutral-500 mt-1">
                      Size: {selectedSizes[product._id]}
                    </p>

                    <p className="mt-2 font-semibold">
                      ₹{Number(product.price).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProducts((prev) =>
                        prev.filter(
                          (p) => p._id !== product._id
                        )
                      );

                      setSelectedSizes((prev) => {
                        const copy = { ...prev };
                        delete copy[product._id];
                        return copy;
                      });
                    }}
                    className="
          text-neutral-400
          hover:text-black
        "
                  >
                    <CircleX className=" h-10 " />
                  </button>
                </div>
              ))}
            </div>

            <div className=" pt-8 space-y-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>
                  ₹
                  {subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-green-600">
                <span>
                  Bundle Saving
                </span>
                <span>
                  -₹
                  {discount.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-3xl font-black">
                <span>Total</span>

                <span>
                  ₹
                  {total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              disabled={
                !selectedProducts.length
              }
              onClick={handleAddLook}
              className="
  w-full

  mt-8

  bg-black
  text-white

  py-4

  uppercase
  tracking-[0.25em]
  text-xs
  font-semibold

  transition-all

  hover:opacity-90

  disabled:opacity-40
"
            >
              ADD LOOK TO CART
            </button>
          </aside>
        </div>
      </div>
      {/* MOBILE FLOATING BAR */}



{selectedProducts.length > 0 && (
  <>
    {/* Floating Bar */}
    {!showLookDrawer && (
      <div
        onClick={() => setShowLookDrawer(true)}
        className="
          lg:hidden
          fixed
          bottom-4
          left-4
          right-4
          z-[60]
          rounded-3xl
          bg-black
          text-white
          shadow-[0_20px_50px_rgba(0,0,0,.35)]
          px-5
          py-4
          active:scale-95
          transition-all
          duration-300
        "
      >
        <div className="flex items-center justify-between">

          {/* Left */}

          <div className="flex items-center gap-4">

            <div className="flex -space-x-3">

              {selectedProducts
                .slice(0, 3)
                .map((product) => (
                  <img
                    key={product._id}
                    src={product.images?.[0]}
                    alt=""
                    className="
                      h-11
                      w-11
                      rounded-xl
                      border-2
                      border-black
                      object-cover
                    "
                  />
                ))}

            </div>

            <div>

              <h4 className="font-semibold">
                {selectedProducts.length} Item
                {selectedProducts.length > 1 && "s"}
              </h4>

              <p className="text-xs text-lime-400">
                Save ₹{discount.toLocaleString()}
              </p>

            </div>

          </div>

          {/* Right */}

   <div className="flex items-center gap-2">

  <span className="text-xl font-bold">
    ₹{total.toLocaleString()}
  </span>

  <ChevronRight
    size={18}
    className="text-lime-400"
  />

</div>

        </div>
      </div>
    )}

    {/* Backdrop */}

    {showLookDrawer && (
      <div
        onClick={() => setShowLookDrawer(false)}
        className="
          lg:hidden
          fixed
          inset-0
          z-[65]
          bg-black/40
          backdrop-blur-[6px]
        "
      />
    )}

    {/* Drawer */}

    <div
      className={`
        lg:hidden
        fixed
        inset-x-0
        bottom-0
        z-[70]

        h-[82vh]

        rounded-t-[34px]

        bg-[#fafafa]

        shadow-[0_-15px_40px_rgba(0,0,0,.18)]

        transition-all
        duration-300

        ${
          showLookDrawer
            ? "translate-y-0"
            : "translate-y-full"
        }
      `}
    >

      <div className="flex h-full flex-col">

        {/* Handle */}

        <div className="pt-3">

          <div className="mx-auto h-1.5 w-12 rounded-full bg-neutral-300"/>

        </div>

        {/* Header */}

        <div className="px-5 pt-5 pb-4 border-b bg-white">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">
                YOUR LOOK
              </p>

              <h2 className="mt-1 text-3xl font-black">
                Styling Board
              </h2>

              <p className="mt-1 text-sm text-lime-600 font-medium">
                {selectedProducts.length}/3 Selected
              </p>

            </div>

            <button
              onClick={() =>
                setShowLookDrawer(false)
              }
              className="
                h-10
                w-10
                rounded-full
                bg-neutral-100
                flex
                items-center
                justify-center
              "
            >
              <X size={20}/>
            </button>

          </div>

        </div>

        {/* ========= PART 2 STARTS FROM HERE ========= */}

        <div className="flex-1 overflow-y-auto px-5 py-5">

{selectedProducts.length === 0 ? (
  <div className="flex h-full items-center justify-center text-neutral-400">
    No products selected
  </div>
) : (
  <div className="space-y-4">
    {selectedProducts.map((product) => (
      <div
        key={product._id}
        className="
          rounded-3xl
          bg-white
          border
          border-neutral-200
          p-3
          shadow-sm
        "
      >
        <div className="flex gap-3">

          {/* Image */}

          <img
            src={product.images?.[0]}
            alt={product.title}
            className="
              h-24
              w-20
              rounded-2xl
              object-cover
            "
          />

          {/* Details */}

          <div className="flex flex-1 flex-col justify-between">

            <div className="flex justify-between">

              <div>

                <h3 className="font-semibold text-[15px] leading-5">
                  {product.title}
                </h3>

                <p className="mt-2 text-sm text-neutral-500">
                  Size {selectedSizes[product._id]}
                </p>

              </div>

              <button
                onClick={() =>
                  removeProduct(product._id)
                }
                className="
                  h-9
                  w-9
                  rounded-full
                  bg-neutral-100
                  flex
                  items-center
                  justify-center
                "
              >
                <CircleX size={18} />
              </button>

            </div>

            <div className="mt-3 flex items-center justify-between">

              <p className="text-lg font-bold">
                ₹{Number(product.price).toLocaleString()}
              </p>

              <span className="rounded-full bg-lime-100 px-2 py-1 text-[11px] font-semibold text-lime-700">
                Added
              </span>

            </div>

          </div>

        </div>

        {/* Gallery */}

        {product.images?.length > 1 && (

          <div className="mt-4 flex gap-2">

            {product.images
              .slice(0,4)
              .map((img,index)=>(
                <img
                  key={index}
                  src={img}
                  className="
                    h-10
                    w-10
                    rounded-xl
                    object-cover
                    border
                    border-neutral-200
                  "
                />
            ))}

            {product.images.length > 4 && (
              <div
                className="
                  h-10
                  w-10
                  rounded-xl
                  bg-neutral-100
                  flex
                  items-center
                  justify-center
                  text-xs
                  font-semibold
                "
              >
                +{product.images.length-4}
              </div>
            )}

          </div>

        )}

      </div>
    ))}

    {/* Add More */}

    {selectedProducts.length < 3 && (

      <button
        onClick={() => setShowLookDrawer(false)}
        className="
          w-full
          rounded-2xl
          border-2
          border-dashed
          border-lime-400
          bg-lime-50
          py-4
          font-semibold
          text-black
          transition
          hover:bg-lime-100
        "
      >
        + Add Another Item ({3-selectedProducts.length} Left)
      </button>

    )}

  </div>
)}

</div>

{/* ---------- Sticky Footer ---------- */}

<div
  className="
    border-t
    bg-white
    px-5
    pt-4
    pb-5
    shadow-[0_-8px_30px_rgba(0,0,0,.05)]
  "
>

  <div className="rounded-3xl bg-neutral-50 p-2">

    <div className="flex justify-between text-sm">

      <span className="text-neutral-500">
        Subtotal
      </span>

      <span className="font-medium">
        ₹{subtotal.toLocaleString()}
      </span>

    </div>

    <div className="mt-3 flex justify-between text-sm">

      <span className="font-medium text-lime-600">
        Bundle Saving
      </span>

      <span className="font-bold text-lime-600">
        -₹{discount.toLocaleString()}
      </span>

    </div>

    <div className="my-2 border-t"/>

    <div className="flex justify-between">

      <span className="text-xl font-black">
        Total
      </span>

      <span className="text-2xl font-black">
        ₹{total.toLocaleString()}
      </span>

    </div>

  </div>

  <button
    onClick={handleAddLook}
    disabled={!selectedProducts.length}
    className="
      mt-4
      flex
      w-full
      items-center
      justify-center
      gap-2
      rounded-2xl
      bg-black
      py-4
      text-sm
      font-semibold
      uppercase
      tracking-[0.2em]
      text-white
      transition
      hover:bg-neutral-900
      disabled:opacity-40
    "
  >
    ADD LOOK TO CART

    <ChevronRight
      size={18}
      className="text-lime-400"
    />

  </button>

</div>

{/* End Sticky Footer */}

</div>

{/* End Drawer */}

</div>



  </>
)}




    </div>
  );
};

export default BuildYourLookPage;