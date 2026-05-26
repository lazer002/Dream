import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/config";
import { useCart } from "@/state/CartContext";

const BuildYourLookPage = () => {
  const { addBundleToCart } = useCart();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] =
    useState("all");

  const [selectedProducts, setSelectedProducts] =
    useState([]);

  const [selectedSizes, setSelectedSizes] =
    useState({});

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

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
    if (activeCategory === "all") {
      return products;
    }

    return products.filter(
      (product) =>
        product.category?._id === activeCategory
    );
  }, [products, activeCategory]);

  const toggleProduct = (product) => {
    const exists = selectedProducts.some(
      (p) => p._id === product._id
    );

    if (exists) {
      setSelectedProducts((prev) =>
        prev.filter((p) => p._id !== product._id)
      );
    } else {
      setSelectedProducts((prev) => [
        ...prev,
        product,
      ]);
    }
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
  };
  return (
    <div className="bg-white min-h-screen">
      {/* HERO */}
      <section className="relative h-[65vh] overflow-hidden">
        <img
          src={
            filteredProducts?.[0]?.images?.[0] ||
            "/images/placeholder.png"
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 h-full flex items-center justify-center text-center text-white px-5">
          <div>
            <p className="uppercase tracking-[0.45em] text-xs mb-5">
              Personal Styling
            </p>

            <h1 className="text-5xl md:text-7xl font-black leading-none">
              BUILD
              <br />
              YOUR LOOK
            </h1>

            <p className="max-w-xl mx-auto mt-6 text-white/80">
              Create your own outfit from our
              latest collection and unlock
              exclusive bundle savings.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-10">
        {/* CATEGORY BAR */}

        <div className="sticky top-0 z-30 bg-white py-5 mb-10">
          <div className="flex gap-3 overflow-x-auto">
            <button
              onClick={() =>
                setActiveCategory("all")
              }
              className={`px-5 py-3 rounded-full border text-sm font-semibold whitespace-nowrap transition
                ${
                  activeCategory === "all"
                    ? "bg-black text-white border-black"
                    : "border-neutral-300 hover:border-black"
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
                className={`px-5 py-3 rounded-full border text-sm font-semibold whitespace-nowrap transition
                  ${
                    activeCategory ===
                    category._id
                      ? "bg-black text-white border-black"
                      : "border-neutral-300 hover:border-black"
                  }
                `}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_420px] gap-10">
          {/* PRODUCTS */}

          <div>
            {loading ? (
              <div className="text-center py-20">
                Loading...
              </div>
            ) : filteredProducts.length ===
              0 ? (
              <div className="text-center py-20">
                No products found
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-2 gap-8">
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
                        rounded-[30px]
                        border
                        bg-white
                        transition-all
                        duration-500
                        hover:-translate-y-1
                        hover:shadow-2xl
                      "
                      >
                        <div className="overflow-hidden">
                          <img
                            src={
                              product
                                .images?.[0]
                            }
                            alt={
                              product.title
                            }
                            className="
                            h-[500px]
                            w-full
                            object-cover
                            transition-transform
                            duration-700
                            group-hover:scale-105
                          "
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

             <p className="mt-3 font-semibold">
  ₹
  {Number(
    product.price
  ).toLocaleString()}
</p>

{/* SIZE SELECTOR */}
<div className="mt-4 flex flex-wrap gap-2">
  {Object.entries(
    product.inventory || {}
  )
    .filter(([_, qty]) => qty > 0)
    .map(([size]) => (
      <button
        key={size}
        type="button"
        onClick={() =>
          setSelectedSizes((prev) => ({
            ...prev,
            [product._id]: size,
          }))
        }
        className={`
          h-10 w-10
          rounded-full
          border
          text-sm
          font-medium
          transition

          ${
            selectedSizes[
              product._id
            ] === size
              ? "bg-black text-white border-black"
              : "border-neutral-300 hover:border-black"
          }
        `}
      >
        {size}
      </button>
    ))}
</div>

<button
  disabled={
    !selectedSizes[product._id]
  }
  onClick={() =>
    toggleProduct(product)
  }
  className={`mt-5 w-full py-3 rounded-full text-sm font-semibold transition
    ${
      !selectedSizes[product._id]
        ? "bg-neutral-300 cursor-not-allowed"
        : selected
        ? "bg-green-600 text-white"
        : "bg-black text-white"
    }
  `}
>
  {!selectedSizes[product._id]
    ? "SELECT SIZE"
    : selected
    ? "ADDED TO LOOK"
    : "ADD TO LOOK"}
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
            <h2 className="text-2xl font-black">
              Your Look
            </h2>

            <p className="text-neutral-500 mt-1">
              {selectedProducts.length} items
              selected
            </p>

            {/* Preview */}

 {/* Preview */}

<div className="mt-6">
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
    {selectedProducts.map((product) => (
      <div
        key={product._id}
        className="relative shrink-0"
      >
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="
            w-16
            h-16
            rounded-xl
            object-cover
            border
          "
        />

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
            absolute
            top-1
            right-1
            w-5
            h-5
            rounded-full
            bg-black
            text-white
            text-xs
            flex
            items-center
            justify-center
          "
        >
          ×
        </button>
      </div>
    ))}
  </div>
</div>

            {/* Selected */}

            <div className="space-y-4 mt-8 max-h-[300px] overflow-y-auto pr-2">
              {selectedProducts.map(
                (product) => (
                  <div
                    key={product._id}
                    className="border-b pb-4"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">
                        {
                          product.title
                        }
                      </p>

                      <p>
                        ₹
                        {product.price}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="border-t mt-8 pt-6 space-y-3">
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

              <div className="flex justify-between text-xl font-black">
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
                mt-6
                bg-black
                text-white
                py-4
                rounded-full
                font-semibold
                disabled:opacity-40
              "
            >
              ADD LOOK TO CART
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BuildYourLookPage;