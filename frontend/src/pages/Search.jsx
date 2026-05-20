import { useEffect, useState } from "react";

import {
  useSearchParams,
  Link,
} from "react-router-dom";

import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

import api from "@/utils/config";
import FilterDrawer from "@/components/filterDrawer";

export default function SearchResultsPage() {

  const [searchParams] =
    useSearchParams();

  const query =
    searchParams.get("q") || "";

  const [products, setProducts] =
    useState([]);
const [isFilterOpen, setIsFilterOpen] =
  useState(false);
  const [loading, setLoading] =
    useState(true);
const [selectedFilters, setSelectedFilters] =
  useState({

    categories: [],

    color: [],

    size: [],

    fabric: [],

    fit: [],

    priceRange: "",

    inStock: false,

    isNew: false,

    onSale: false,

  });
const [categories, setCategories] =
  useState([]);

useEffect(() => {

  const fetchCategories = async () => {

    try {

      const res = await api.get(
        "/categories"
      );

      console.log(
        "Categories:",
        res.data
      );

      setCategories(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (error) {

      console.error(error);

      setCategories([]);

    }

  };

  fetchCategories();

}, []);



const handleFilterChange = (
  type,
  value
) => {

  setSelectedFilters((prev) => {

    // ARRAY FILTERS
    if (
      Array.isArray(prev[type])
    ) {

      return prev[type].includes(
        value
      )

        ? {
            ...prev,

            [type]:
              prev[type].filter(
                (v) =>
                  v !== value
              ),
          }

        : {
            ...prev,

            [type]: [
              ...prev[type],
              value,
            ],
          };

    }

    // SINGLE VALUE
    return {
      ...prev,

      [type]: value,
    };

  });

};

const fetchProducts = async (
  activeFilters = selectedFilters
) => {

  try {

    setLoading(true);

    const params =
      new URLSearchParams();

    // SEARCH
    if (query) {
      params.append("q", query);
    }

    // CATEGORY
    activeFilters.categories.forEach(
      (cat) => {

        params.append(
          "category",
          cat
        );

      }
    );

    // PRICE
    if (
      activeFilters.priceRange
    ) {

      params.append(
        "priceRange",
        activeFilters.priceRange
      );

    }

    // COLOR
    activeFilters.color.forEach(
      (c) => {

        params.append(
          "color",
          c
        );

      }
    );

    // SIZE
    activeFilters.size.forEach(
      (s) => {

        params.append(
          "size",
          s
        );

      }
    );

    // FABRIC
    activeFilters.fabric.forEach(
      (f) => {

        params.append(
          "fabric",
          f
        );

      }
    );

    // FIT
    activeFilters.fit.forEach(
      (f) => {

        params.append(
          "fit",
          f
        );

      }
    );

    // BOOLEAN
    if (
      activeFilters.inStock
    ) {

      params.append(
        "inStock",
        "true"
      );

    }

    if (
      activeFilters.isNew
    ) {

      params.append(
        "isNew",
        "true"
      );

    }

    if (
      activeFilters.onSale
    ) {

      params.append(
        "onSale",
        "true"
      );

    }

    const res = await api.get(
      `/products?${params.toString()}`
    );

    setProducts(
      res.data.items || []
    );

  } catch (error) {

    console.error(error);

  } finally {

    setLoading(false);

  }

};
useEffect(() => {

  if (query.trim()) {

    fetchProducts();

  }

}, [query]);

  return (

    <section className="min-h-screen bg-[#fafafa]">

      {/* HERO */}
      <div
        className="
          relative

          overflow-hidden

          border-b border-gray-200

          bg-white
        "
      >

        {/* BACKGROUND GLOW */}
        <div
          className="
            absolute
            inset-0

            bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.04),transparent_60%)]
          "
        />

        <div
          className="
            relative

            max-w-7xl
            mx-auto

            px-6
            pt-24
            pb-20

            text-center
          "
        >

          {/* LABEL */}
          <p
            className="
              text-[11px]
              uppercase
              tracking-[0.35em]

              text-gray-400

              mb-5
            "
          >
            Search Results
          </p>

          {/* TITLE */}
          <h1
            className="
              text-5xl
              md:text-7xl

              font-black

              tracking-[-0.05em]

              leading-none
            "
          >
            {products.length}
            <span className="mx-3">
              RESULTS
            </span>

            <br />

            <span className="italic">
              "{query}"
            </span>
          </h1>

   

        </div>

      </div>

      {/* CONTENT */}
      <div
        className="
          max-w-7xl
          mx-auto

          px-6
          py-14
        "
      >

        {/* TOP BAR */}
        <div
          className="
            flex flex-col
            md:flex-row

            md:items-center
            md:justify-between

            gap-6

            mb-14
          "
        >

          {/* LEFT */}
          <div
            className="
              flex items-center gap-4
            "
          >

     <button
  onClick={() =>
    setIsFilterOpen(true)
  }

  className="
    flex items-center gap-3

    border border-gray-200

    bg-white

    h-12

    px-5

    rounded-full

    text-sm
    font-semibold

    hover:border-black

    transition
  "
>

  <SlidersHorizontal className="w-4 h-4" />

  FILTERS

</button>

            <p
              className="
                text-sm
                text-gray-500
              "
            >
           Showing {products.length} products
            </p>

          </div>

          {/* RIGHT */}
          <div
            className="
              flex items-center gap-3
            "
          >

            <button
              className="
                w-11 h-11

                rounded-full

                border border-black

                bg-black
              "
            />

            <button
              className="
                w-11 h-11

                rounded-full

                border border-gray-300
              "
            />

            <button
              className="
                w-11 h-11

                rounded-full

                border border-gray-300
              "
            />

          </div>

        </div>

        {/* LOADING */}
        {loading && (

          <div
            className="
              py-40

              flex flex-col
              items-center
              justify-center
            "
          >

            <div
              className="
                w-14 h-14

                border-[3px]
                border-black/10
                border-t-black

                rounded-full

                animate-spin

                mb-5
              "
            />

            <p className="text-gray-500">
              Loading products...
            </p>

          </div>
        )}

        {/* EMPTY */}
        {!loading && products.length === 0 && (

          <div
            className="
              py-40

              text-center
            "
          >

            <h2
              className="
                text-4xl
                font-black

                mb-4
              "
            >
              No Products Found
            </h2>

            <p className="text-gray-500">
              Try searching with another keyword.
            </p>

          </div>
        )}

        {/* PRODUCTS */}
        {!loading && products.length > 0 && (

          <div
            className="
              grid

              grid-cols-2
              md:grid-cols-3
              xl:grid-cols-4

              gap-x-6
              gap-y-14
            "
          >

            {products.map((p) => (

              <Link
                key={p._id}

                to={`/product/${p._id}`}

                className="group"
              >

                {/* IMAGE */}
                <div
                  className="
                    relative

                    aspect-[3/4]

                    overflow-hidden

                    rounded-[28px]

                    bg-[#f3f3f3]
                  "
                >

                  {/* DISCOUNT */}
                  {p.onSale && (
                    <div
                      className="
                        absolute
                        top-4
                        right-4

                        z-20

                        bg-red-500
                        text-white

                        text-[11px]
                        font-black

                        px-3 py-2

                        rounded-full
                      "
                    >
                      SALE
                    </div>
                  )}

                  {/* STOCK */}
                  {Object.values(
                    p.inventory || {}
                  ).every(qty => qty === 0) && (

                    <div
                      className="
                        absolute
                        inset-0

                        z-20

                        flex items-center
                        justify-center

                        bg-white/40
                        backdrop-blur-[2px]
                      "
                    >

                      <div
                        className="
                          w-24 h-24

                          rounded-full

                          bg-white

                          flex items-center justify-center

                          text-sm
                          font-medium

                          shadow-xl
                        "
                      >
                        Sold Out
                      </div>

                    </div>
                  )}

                  <img
                    src={
                      p.images?.[0]
                    }

                    alt={p.title}

                    className="
                      w-full
                      h-full

                      object-cover

                      transition duration-700

                      group-hover:scale-[1.04]
                    "
                  />

                </div>

                {/* INFO */}
                <div className="pt-5">

                  <h3
                    className="
                      text-base
                      md:text-lg

                      font-semibold

                      tracking-tight

                      mb-2
                    "
                  >
                    {p.title}
                  </h3>

                  {/* PRICE */}
                  <div
                    className="
                      flex items-center gap-2

                      flex-wrap
                    "
                  >

                    {p.onSale && (
                      <span
                        className="
                          text-sm
                          text-gray-400
                          line-through
                        "
                      >
                        ₹
                        {Math.round(
                          Number(p.price) / 0.7
                        ).toLocaleString()}
                      </span>
                    )}

                    <span
                      className="
                        text-lg
                        font-black

                        text-red-600
                      "
                    >
                      ₹
                      {Number(
                        p.price
                      ).toLocaleString()}
                    </span>

                  </div>

                </div>

              </Link>

            ))}

          </div>
        )}

      </div>
<FilterDrawer
  isOpen={isFilterOpen}

  onClose={() =>
    setIsFilterOpen(false)
  }

  selectedFilters={selectedFilters}

  onChange={handleFilterChange}

  onApply={() => {

  fetchProducts();

    setIsFilterOpen(false);

  }}

  categories={categories}
/>
    </section>
  );

}