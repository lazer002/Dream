// src/pages/Collections.jsx
import { useEffect, useState, useRef } from "react";
import { api } from "@/utils/config.js"; // axios instance
import { Link } from "react-router-dom";

export default function Collections() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bundles", { params: { limit: 10, page: 1 } });
      setBundles(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  if (loading) return <div className="text-center py-20">Loading bundles...</div>;
  if (!bundles.length) return <div className="text-center py-20">No bundles found.</div>;

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-10 text-black">Collections & Bundles</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {bundles.map((bundle) => (
          <BundleCard key={bundle._id} bundle={bundle} />
        ))}
      </div>
    </div>
  );
}

// Single Bundle Card Component
function BundleCard({ bundle }) {
  const carouselRef = useRef(null);

  const scrollLeft = () => carouselRef.current?.scrollBy({ left: -140, behavior: "smooth" });
  const scrollRight = () => carouselRef.current?.scrollBy({ left: 140, behavior: "smooth" });

  // Use mainImages if available, else fallback to first product images
  const mainImages = bundle.mainImages?.length
    ? bundle.mainImages
    : bundle.products?.map((p) => p.images[0]);

  const totalPrice = bundle.products?.reduce((sum, p) => sum + p.price, 0) || 0;

  return (
    <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 bg-white border border-gray-100">
      {/* Image Carousel */}
      <div className="relative">
        {mainImages?.length > 0 && (
          <>
            <button
              onClick={scrollLeft}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full opacity-70 hover:opacity-100 transition"
            >
              ◀
            </button>
            <div
              ref={carouselRef}
              className="flex overflow-x-auto gap-3 p-4 scrollbar-hide scroll-smooth"
            >
              {mainImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`bundle-${bundle.title}-${idx}`}
                  className="w-36 h-36 object-cover rounded-xl flex-shrink-0 border border-gray-200"
                />
              ))}
            </div>
            <button
              onClick={scrollRight}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full opacity-70 hover:opacity-100 transition"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {/* Bundle Info */}
      <div className="p-4 bg-white">
        <h2 className="text-lg font-semibold mb-2 truncate">{bundle.title}</h2>
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{bundle.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-[#042354]">₹ {totalPrice}</span>
          <span className="text-gray-400 text-sm">
            {bundle.products?.length} item{bundle.products?.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {bundle.products?.slice(0, 4).map((p) => (
            <img
              key={p._id}
              src={p.images[0]}
              alt={p.title}
              className="w-10 h-10 object-cover rounded-md border border-gray-200"
            />
          ))}
          {bundle.products?.length > 4 && (
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
              +{bundle.products.length - 4}
            </div>
          )}
        </div>

        <Link
          to={`/collections/${bundle._id}`}
          className="inline-block w-full text-center px-4 py-2 bg-black text-white rounded-md font-semibold hover:bg-gray-900 transition"
        >
          View Bundle
        </Link>
      </div>
    </div>
  );
}
