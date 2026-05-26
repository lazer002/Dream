export default function CategoryTabs({
  categories,
  activeCategory,
  setActiveCategory,
}) {
  return (
    <div className="sticky top-0 z-30 bg-white py-6">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {categories.map((category) => {
          const value =
            category._id === "all"
              ? "all"
              : category._id;

          return (
            <button
              key={value}
              onClick={() =>
                setActiveCategory(value)
              }
              className={`
                px-6 py-3
                rounded-full
                border
                text-sm
                font-semibold
                whitespace-nowrap
                transition-all
                duration-300

                ${
                  activeCategory === value
                    ? "bg-black text-white border-black"
                    : "border-neutral-300 hover:border-black"
                }
              `}
            >
              {category.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}