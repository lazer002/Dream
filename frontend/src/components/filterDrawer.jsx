import React, { useEffect, useMemo, useState } from "react";
import { Filter as FilterIcon } from "lucide-react";

const PRICE_RANGES = [
  { value: "0-500", label: "Under ₹500" },
  { value: "500-1000", label: "₹500 – ₹1,000" },
  { value: "1000-2000", label: "₹1,000 – ₹2,000" },
  { value: "2000+", label: "₹2,000+" },
];

const COLORS = [
  { value: "red", label: "Red", color: "#EF4444" },
  { value: "black", label: "Black", color: "#080808" },
  { value: "white", label: "White", color: "#FFFFFF" },
  { value: "blue", label: "Blue", color: "#3B82F6" },
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const FABRICS = ["cotton", "linen"];

const FITS = ["oversized", "regular"];

const getActiveFilterCount = (filters = {}) =>
  [
    filters.categories?.length > 0,
    !!filters.priceRange,
    filters.color?.length > 0,
    filters.size?.length > 0,
    filters.fabric?.length > 0,
    filters.fit?.length > 0,
    !!filters.inStock,
    !!filters.isNew,
    !!filters.onSale,
  ].filter(Boolean).length;

const hasActiveFilters = (filters = {}) =>
  getActiveFilterCount(filters) > 0;

const EMPTY_FILTERS = {
  categories: [],
  priceRange: "",
  color: [],
  size: [],
  fabric: [],
  fit: [],
  inStock: false,
  isNew: false,
  onSale: false,
};

export default function Filter({
  categories = [],
  selectedFilters,
  onChange,
  onApply,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const [draftFilters, setDraftFilters] = useState(
    selectedFilters || EMPTY_FILTERS
  );

  const activeFilterCount = useMemo(
    () => getActiveFilterCount(selectedFilters),
    [selectedFilters]
  );

  const draftFilterCount = useMemo(
    () => getActiveFilterCount(draftFilters),
    [draftFilters]
  );

  useEffect(() => {
    if (!isOpen) {
      setDraftFilters(
        selectedFilters || EMPTY_FILTERS
      );
    }
  }, [selectedFilters, isOpen]);

  const toggleValue = (type, value) => {
    setDraftFilters((prev) => {
      if (Array.isArray(prev[type])) {
        return {
          ...prev,
          [type]: prev[type].includes(value)
            ? prev[type].filter(
                (item) => item !== value
              )
            : [...prev[type], value],
        };
      }

      return {
        ...prev,
        [type]: value,
      };
    });
  };

  const clearFilters = () => {
    setDraftFilters({
      ...EMPTY_FILTERS,
      categories: [],
      color: [],
      size: [],
      fabric: [],
      fit: [],
    });
  };

  const applyFilters = () => {
    onApply(draftFilters);
    setIsOpen(false);
  };

  return (
    <>
      {/* FILTER BUTTON */}

      <button
        type="button"
        onClick={() => {
          setDraftFilters(
            selectedFilters || EMPTY_FILTERS
          );
          setIsOpen(true);
        }}
        className="relative flex items-center gap-2 px-4 py-2 bg-black text-white font-bold uppercase transition hover:bg-[#B6FF2E] hover:text-black"
      >
        <FilterIcon className="w-5 h-5" />

        <span className="max-[500px]:hidden">
          Filter
        </span>

        {activeFilterCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full  bg-[#B6FF2E] px-1.5 text-[10px] font-black text-black ">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* OVERLAY */}

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        />
      )}

      {/* DRAWER */}

      <aside
        className={`
          fixed top-0 left-0 z-50 flex h-full w-[340px] max-w-[90vw]
          flex-col bg-white shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.18em]">
                Filters
              </h2>

              {activeFilterCount > 0 && (
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
                  {activeFilterCount}{" "}
                  {activeFilterCount === 1
                    ? "filter"
                    : "filters"}{" "}
                  applied
                </p>
              )}
            </div>

            {activeFilterCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#B6FF2E] px-2 text-[10px] font-black text-black">
                {activeFilterCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-black transition hover:bg-gray-100"
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        {/* CONTENT */}

        <div
          className="flex-1 overflow-y-auto px-6 py-6"
          data-lenis-prevent
        >
          <div className="space-y-8">

            {/* CATEGORY */}

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[11px] font-black uppercase tracking-[0.16em]">
                  Category
                </h3>

                {draftFilters.categories?.length > 0 && (
                  <span className="text-[10px] font-bold text-gray-400">
                    {draftFilters.categories.length} selected
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const active =
                    draftFilters.categories?.includes(
                      cat.name
                    );

                  return (
                    <button
                      key={cat._id}
                      type="button"
                      onClick={() =>
                        toggleValue(
                          "categories",
                          cat.name
                        )
                      }
                      className={`
                        rounded-full border px-4 py-2 text-[11px]
                        font-bold uppercase tracking-wide transition-all
                        ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white text-black hover:border-black"
                        }
                      `}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* PRICE */}

            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em]">
                Price
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {PRICE_RANGES.map((range) => {
                  const active =
                    draftFilters.priceRange ===
                    range.value;

                  return (
                    <button
                      key={range.value}
                      type="button"
                      onClick={() =>
                        setDraftFilters((prev) => ({
                          ...prev,
                          priceRange: active
                            ? ""
                            : range.value,
                        }))
                      }
                      className={`
                        rounded-lg border px-3 py-3 text-left
                        text-[11px] font-bold transition
                        ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white text-black hover:border-black"
                        }
                      `}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* COLOR */}

            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em]">
                Color
              </h3>

              <div className="flex flex-wrap gap-2">
                {COLORS.map((item) => {
                  const active =
                    draftFilters.color?.includes(
                      item.value
                    );

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        toggleValue(
                          "color",
                          item.value
                        )
                      }
                      className={`
                        flex items-center gap-2 rounded-full border
                        px-3 py-2 text-[11px] font-bold uppercase
                        transition
                        ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white text-black hover:border-black"
                        }
                      `}
                    >
                      <span
                        className={`
                          h-3.5 w-3.5 rounded-full border
                          ${
                            item.value === "white"
                              ? "border-gray-300"
                              : "border-black/10"
                          }
                        `}
                        style={{
                          backgroundColor:
                            item.color,
                        }}
                      />

                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* SIZE */}

            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em]">
                Size
              </h3>

              <div className="grid grid-cols-3 gap-2">
                {SIZES.map((size) => {
                  const active =
                    draftFilters.size?.includes(size);

                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        toggleValue("size", size)
                      }
                      className={`
                        h-10 rounded-lg border text-[11px]
                        font-bold transition
                        ${
                          active
                            ? "border-black bg-black text-white"
                            : "border-gray-200 bg-white text-black hover:border-black"
                        }
                      `}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* FABRIC */}

            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em]">
                Fabric
              </h3>

              <div className="space-y-2">
                {FABRICS.map((fabric) => {
                  const active =
                    draftFilters.fabric?.includes(
                      fabric
                    );

                  return (
                    <button
                      key={fabric}
                      type="button"
                      onClick={() =>
                        toggleValue(
                          "fabric",
                          fabric
                        )
                      }
                      className="flex w-full items-center justify-between border-b border-gray-100 py-2 text-left"
                    >
                      <span className="text-xs font-medium capitalize">
                        {fabric}
                      </span>

                      <span
                        className={`
                          flex h-5 w-5 items-center justify-center
                          rounded border transition
                          ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-gray-300 bg-white"
                          }
                        `}
                      >
                        {active && (
                          <span className="text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* FIT */}

            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em]">
                Fit
              </h3>

              <div className="space-y-2">
                {FITS.map((fit) => {
                  const active =
                    draftFilters.fit?.includes(fit);

                  return (
                    <button
                      key={fit}
                      type="button"
                      onClick={() =>
                        toggleValue("fit", fit)
                      }
                      className="flex w-full items-center justify-between border-b border-gray-100 py-2 text-left"
                    >
                      <span className="text-xs font-medium capitalize">
                        {fit}
                      </span>

                      <span
                        className={`
                          flex h-5 w-5 items-center justify-center
                          rounded border transition
                          ${
                            active
                              ? "border-black bg-black text-white"
                              : "border-gray-300 bg-white"
                          }
                        `}
                      >
                        {active && (
                          <span className="text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* AVAILABILITY */}

            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em]">
                Availability
              </h3>

              <button
                type="button"
                onClick={() =>
                  setDraftFilters((prev) => ({
                    ...prev,
                    inStock: !prev.inStock,
                  }))
                }
                className="flex w-full items-center justify-between border-b border-gray-100 py-2 text-left"
              >
                <span className="text-xs font-medium">
                  In Stock Only
                </span>

                <span
                  className={`
                    relative h-6 w-11 rounded-full transition
                    ${
                      draftFilters.inStock
                        ? "bg-black"
                        : "bg-gray-200"
                    }
                  `}
                >
                  <span
                    className={`
                      absolute top-1 h-4 w-4 rounded-full bg-white
                      transition-all
                      ${
                        draftFilters.inStock
                          ? "left-6"
                          : "left-1"
                      }
                    `}
                  />
                </span>
              </button>
            </section>

            {/* OFFERS */}

            <section>
              <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.16em]">
                Offers
              </h3>

              <div className="space-y-2">

                {/* NEW */}

                <button
                  type="button"
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      isNew: !prev.isNew,
                    }))
                  }
                  className="flex w-full items-center justify-between border-b border-gray-100 py-2 text-left"
                >
                  <span className="text-xs font-medium">
                    New Arrivals
                  </span>

                  <span
                    className={`
                      relative h-6 w-11 rounded-full transition
                      ${
                        draftFilters.isNew
                          ? "bg-black"
                          : "bg-gray-200"
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 h-4 w-4 rounded-full bg-white
                        transition-all
                        ${
                          draftFilters.isNew
                            ? "left-6"
                            : "left-1"
                        }
                      `}
                    />
                  </span>
                </button>

                {/* SALE */}

                <button
                  type="button"
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      onSale: !prev.onSale,
                    }))
                  }
                  className="flex w-full items-center justify-between border-b border-gray-100 py-2 text-left"
                >
                  <span className="text-xs font-medium">
                    On Sale
                  </span>

                  <span
                    className={`
                      relative h-6 w-11 rounded-full transition
                      ${
                        draftFilters.onSale
                          ? "bg-black"
                          : "bg-gray-200"
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 h-4 w-4 rounded-full bg-white
                        transition-all
                        ${
                          draftFilters.onSale
                            ? "left-6"
                            : "left-1"
                        }
                      `}
                    />
                  </span>
                </button>

              </div>
            </section>

          </div>
        </div>

        {/* FOOTER */}

        <div className="border-t bg-white p-4">
          <div className="flex items-center gap-3">

            {hasActiveFilters(draftFilters) && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-12 flex-1 border border-gray-200 text-[10px] font-black uppercase tracking-[0.15em] transition hover:border-black"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={applyFilters}
              className="h-12 flex-[2] bg-black text-[10px] font-black uppercase tracking-[0.18em] text-white transition hover:bg-[#B6FF2E] hover:text-black"
            >
              Apply

              {draftFilterCount > 0 && (
                <span className="ml-2">
                  · {draftFilterCount}
                </span>
              )}
            </button>

          </div>
        </div>

      </aside>
    </>
  );
}