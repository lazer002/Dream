export default function FilterDrawer({
    isOpen,
    onClose,
    selectedFilters,
    onChange,
    onApply,
    categories
}) {
    return (
        <>
            {/* Drawer */}
            <div
                className={`fixed top-0 left-0 h-full w-72 bg-white shadow-xl border-r 
  transform transition-transform duration-300 z-50 flex flex-col
  ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b">
                    <h2 className="font-bold uppercase">Filters</h2>
                    <button onClick={onClose}>✕</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" data-lenis-prevent>


                    <div>
                        <h3 className="font-bold mb-2 uppercase">Category</h3>

                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat._id}
                                    onClick={() => onChange("categories", cat.name)}
                                    className={`px-3 py-1 border text-sm font-medium transition rounded
          ${selectedFilters.categories.includes(cat.name)
                                            ? "bg-black text-white"
                                            : "bg-white text-black"
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold mb-2 uppercase">Price</h3>

                        <div className="flex flex-wrap gap-2">
                            {["0-500", "500-1000", "1000-2000", "2000+"].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => onChange("priceRange", range)}
                                    className={`px-3 py-1 border text-sm font-medium transition rounded
          ${selectedFilters.priceRange === range
                                            ? "bg-black text-white"
                                            : "bg-white text-black"
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* COLOR */}
                    <div>
                        <h3 className="font-bold mb-2 uppercase">Color</h3>

                        <div className="flex flex-wrap gap-2">
                            {["red", "black", "white", "blue"].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => onChange("color", color)}
                                    className={`flex items-center gap-2 px-3 py-1 border rounded text-sm font-medium transition
          ${selectedFilters.color.includes(color)
                                            ? "bg-black text-white border-black"
                                            : "bg-white text-black"
                                        }`}
                                >
                                    {/* color dot */}
                                    <span
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: color }}
                                    />

                                    {/* label */}
                                    <span className="capitalize">{color}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SIZE */}
                    <div>
                        <h3 className="font-bold mb-2 uppercase">Size</h3>
                        <div className="flex gap-2 flex-wrap">
                            {["S", "M", "L", "XL"].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => onChange("size", s)}
                                    className={`px-3 py-1 border ${selectedFilters.size.includes(s)
                                            ? "bg-black text-white"
                                            : ""
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* FABRIC */}
                    <div>
                        <h3 className="font-bold mb-2 uppercase">Fabric</h3>
                        {["cotton", "linen"].map((f) => (
                            <label key={f} className="flex gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    checked={selectedFilters.fabric.includes(f)}
                                    onChange={() => onChange("fabric", f)}
                                />
                                {f}
                            </label>
                        ))}
                    </div>

                    {/* FIT */}
                    <div>
                        <h3 className="font-bold mb-2 uppercase">Fit</h3>
                        {["oversized", "regular"].map((fit) => (
                            <label key={fit} className="flex gap-2 mb-1">
                                <input
                                    type="checkbox"
                                    checked={selectedFilters.fit.includes(fit)}
                                    onChange={() => onChange("fit", fit)}
                                />
                                {fit}
                            </label>
                        ))}
                    </div>

                    {/* STOCK */}
                    <div>
                        <h3 className="font-bold mb-2 uppercase">Availability</h3>
                        <label className="flex gap-2">
                            <input
                                type="checkbox"
                                checked={selectedFilters.inStock}
                                onChange={() => onChange("inStock", !selectedFilters.inStock)}
                            />
                            In Stock Only
                        </label>
                    </div>

                    {/* OFFERS */}
                    <div>
                        <h3 className="font-bold mb-2 uppercase">Offers</h3>

                        <label className="flex gap-2">
                            <input
                                type="checkbox"
                                checked={selectedFilters.isNew}
                                onChange={() => onChange("isNew", !selectedFilters.isNew)}
                            />
                            New Arrivals
                        </label>

                        <label className="flex gap-2">
                            <input
                                type="checkbox"
                                checked={selectedFilters.onSale}
                                onChange={() => onChange("onSale", !selectedFilters.onSale)}
                            />
                            On Sale
                        </label>
                    </div>

                    {/* APPLY */}

                </div>
                <div className="p-4 border-t bg-white">
                    <button
                        onClick={onApply}
                        className="w-full bg-black text-white py-2 font-bold"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/40 z-40"
                />
            )}
        </>
    );
}