import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import FAQ from "@/components/Faq";
import FeaturesCarousel from "@/components/FeaturesCarousel";
import api  from "@/utils/config";
import { useCart } from "@/state/CartContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog.jsx";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Swiper, SwiperSlide } from "swiper/react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
/* ---------- small debounce hook ---------- */
function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Home() {
  const fmt = (v) => Number(v || 0).toLocaleString();
  const { add, addBundleToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [q, setQ] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const debouncedQ = useDebounce(q, 350);
  const productAbortRef = useRef(null);
  const bundleAbortRef = useRef(null);
  const [loading, setLoading] = useState(false);
const [form, setForm] = useState({
  name: "",
  email: "",
  phone: "",
  message: "",
});





const handleChange = (e) => {
  setForm({ ...form, [e.target.name]: e.target.value });
};

const handleSubmit = async (e) => {

  if (!form.name || !form.email || !form.message) {
    toast.error("Please fill all required fields");
    return;
  }

  try {
    setLoading(true);

    await api.post("/contact", form);

    toast.success("Message sent 🚀");

    setForm({
      name: "",
      email: "",
      phone: "",
      message: "",
    });

  } catch (err) {
    toast.error("Failed to send message");
  } finally {
    setLoading(false);
  }
};


const navigate = useNavigate();
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

  const openBundleModal = (bundle) => {
    setSelectedBundle(bundle);
    const initialSizes = (bundle.products || []).reduce((acc, p) => {
      acc[p._id] = ""; // no preselection
      return acc;
    }, {});
    setSelectedSizes(initialSizes);
    setIsOpen(true);
  };
  const handleAddBundle = () => {
    if (!selectedBundle) return;
    addBundleToCart(selectedBundle, selectedSizes);
    setIsOpen(false);
  };
  useEffect(() => {
    // abort previous product request if any
    if (productAbortRef.current) {
      try {
        productAbortRef.current.abort();
      } catch (e) { }
      productAbortRef.current = null;
    }

    // abort previous bundle request if any
    if (bundleAbortRef.current) {
      try {
        bundleAbortRef.current.abort();
      } catch (e) { }
      bundleAbortRef.current = null;
    }

    const productController = new AbortController();
    const bundleController = new AbortController();
    productAbortRef.current = productController;
    bundleAbortRef.current = bundleController;

    const fetchProducts = async () => {
      try {
        const res = await api.get("/products", {
          params: { q: debouncedQ || "" },
          signal: productController.signal,
        });
        setProducts(res.data?.items || []);
      } catch (err) {
        if (err?.name !== "AbortError" && err?.message !== "canceled") {
          console.error("Error fetching products:", err);
          setProducts([]);
        }
      } finally {
        productAbortRef.current = null;
      }
    };

    const fetchBundles = async () => {
      try {
        const res = await api.get("/bundles", {
          params: { limit: 4 },
          signal: bundleController.signal,
        });
        setBundles(res.data.items || []);
      } catch (err) {
        if (err?.name !== "AbortError" && err?.message !== "canceled") {
          console.error("Error fetching bundles:", err);
          setBundles([]);
          setError("Failed to load bundles. Try again.");
        }
      } finally {
        bundleAbortRef.current = null;
      }
    };

    fetchProducts();
    fetchBundles();

    // cleanup: abort when effect re-runs or unmounts
    return () => {
      try {
        productController.abort();
        bundleController.abort();
      } catch (e) { }
    };
  }, [debouncedQ]);
  const handleSizeChange = (productId, size) => {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  };

  // Fetch categories once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get("/categories");
        if (!mounted) return;
        const cats = Array.isArray(res.data?.categories) ? res.data.categories : [];
        setCategories(cats);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        mounted
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // normalize product (memoized)
  const normalize = useCallback((p) => {
    const original = p.compareAtPrice ?? p.originalPrice ?? p.mrp ?? null;
    const price = Number(p.price) || 0;

    let discountPercent = null;
    if (p.discountPercent) {
      discountPercent = Number(p.discountPercent);
    } else if (original && Number(original) > price) {
      discountPercent = Math.round(((Number(original) - price) / Number(original)) * 100);
    }

    return {
      ...p,
      displayPrice: price,
      originalPrice: original ? Number(original) : null,
      discountPercent,
    };
  }, []);

  const normalized = useMemo(
    () => (Array.isArray(products) ? products.map(normalize) : []),
    [products, normalize]
  );

  const heroes = useMemo(() => normalized.slice(0, 3), [normalized]);
useEffect(() => {
  document.body.style.overflow = isOpen ? "hidden" : "auto";
  return () => (document.body.style.overflow = "auto");
}, [isOpen]);
  
  return (

    <div className="bg-white text-black">

 <section
  className="
    relative

    min-h-screen

    flex items-end

    overflow-hidden
    bg-black
  "
>

  {/* BG IMAGE */}
  <img
    src="/images/banner_web.webp"
    alt=""
    aria-hidden="true"
    loading="lazy"
    className="
      absolute inset-0
      w-full h-full
   object-cover

object-[72%_center]

md:object-[72%_center

      scale-[1.03]

      animate-[heroZoom_12s_ease-in-out_infinite_alternate]
    "
  />

  {/* CINEMATIC OVERLAY */}
  <div
    className="
      absolute inset-0

      bg-gradient-to-t
      from-black/80
      via-black/30
      to-black/10
    "
  />

  {/* NOISE TEXTURE */}
  <div
    className="
      absolute inset-0
      opacity-[0.03]
      mix-blend-overlay
      pointer-events-none
    "
    style={{
      backgroundImage:
        'url(\"https://grainy-gradients.vercel.app/noise.svg\")',
    }}
  />

  {/* CONTENT */}
  <div
    className="
      relative z-20

      w-full

      px-6
      md:px-12
      lg:px-20

      pb-16
      md:pb-24
      lg:pb-32
    "
  >

    {/* MINI LABEL */}
    <p
      className="
        text-[11px]
        md:text-xs

        uppercase
        tracking-[0.45em]

        text-white/70

        mb-6
      "
    >
      New Season — 2026 Drop
    </p>

    {/* HUGE TITLE */}
    <h1
      className="
        max-w-5xl

        text-[3.5rem]
        sm:text-[5rem]
        md:text-[7rem]
        lg:text-[9rem]

        font-black
        uppercase

        leading-[0.9]
        tracking-[-0.06em]

        text-white
      "
    >
      REDEFINE
      <br />
      STREETWEAR
    </h1>

    {/* BOTTOM ROW */}
    <div
      className="
        mt-10

        flex
        flex-col
        md:flex-row

        md:items-end
        md:justify-between

        gap-8
      "
    >

      {/* DESCRIPTION */}
      <p
        className="
          max-w-md

          text-sm
          md:text-base

          leading-relaxed

          text-white/70
        "
      >
        Elevated essentials crafted for
        modern street culture. Explore
        oversized hoodies, heavyweight
        sweats, and premium everyday fits.
      </p>

      {/* BUTTON */}
      <Link
        to="/collections/hoodies"
        className="
          group

          inline-flex items-center
          gap-4

          w-fit

          bg-white
          text-black

          rounded-full

          px-8 py-4
z-0
          text-sm
          font-black
          uppercase
          tracking-[0.25em]

          transition-all duration-500

          hover:bg-black
          hover:text-white

          border border-white
        "
      >

        <span>Shop Collection</span>

        <span
          className="
            transition-transform duration-300
            group-hover:translate-x-1
          "
        >
          →
        </span>

      </Link>

    </div>

  </div>

</section>





  <section className="py-20 bg-white relative overflow-hidden">

  <div className="text-center mb-14">

    {/* MINI LABEL */}
    <p
      className="
        text-[11px]
        uppercase
        tracking-[0.35em]
        text-gray-400
        mb-3
      "
    >
      Curated Fashion Edit
    </p>

    {/* TITLE */}
    <h2
      className="
        text-4xl
        md:text-6xl

        font-black
        uppercase

        tracking-tight
        leading-none
      "
    >
      FEATURED
      <br />
      COLLECTIONS
    </h2>

    {/* SUBTEXT */}
    <div
      className="
        flex items-center justify-center
        gap-3

        mt-6
      "
    >
      <div className="w-10 h-px bg-gray-300" />

      <p
        className="
          text-sm
          text-gray-500
          tracking-wide
        "
      >
        Scroll to explore the latest drops
      </p>

      <div className="w-10 h-px bg-gray-300" />
    </div>

  </div>

  <div
    className="
      flex
      flex-col

      md:flex-row

      max-w-full

      relative
    "
  >

    {/* LEFT FIXED COLUMN */}
    <div
      className="
        w-full

        md:w-96
        md:flex-shrink-0

        md:sticky
        md:top-20

        h-auto

        bg-white

        z-20

        mb-6
        md:mb-0
      "
    >

      <Link
        to="/products"
        className="block group"
      >

        <div className="relative overflow-hidden rounded-[28px]">

          {/* IMAGE */}
          <img
            src="https://bzmvvcdngqoxwpbulakr.supabase.co/storage/v1/object/public/product-images/products/1760803192692-zasrnaykki8.webp"

            alt="MEN'S COLLECTION"

            className="
              w-full

              h-[400px]
              md:h-[500px]

              object-cover

              transition duration-700

              group-hover:scale-[1.03]
            "
          />

          {/* OVERLAY */}
          <div
            className="
              absolute inset-0

              bg-gradient-to-t
              from-black/45
              via-black/5
              to-transparent
            "
          />

          {/* LABEL */}
          <div
            className="
              absolute

              bottom-5
              left-1/2

              -translate-x-1/2
            "
          >

            <div
              className="
                bg-red-500
                text-white

                px-8 py-3

                rounded-full

                text-sm
                font-black
                uppercase
                tracking-wide

                shadow-lg

                transition-all duration-300

                group-hover:scale-105
              "
            >
              MEN'S COLLECTION
            </div>

          </div>

        </div>

      </Link>

    </div>

    {/* RIGHT SCROLLABLE SECTION */}
    <div
      className="
        relative

        flex-1

        overflow-x-auto

        md:pl-6

        scrollbar-thin
      "
    >

      <div className="flex gap-8 md:pr-12">

        <Swiper
          spaceBetween={30}
          slidesPerView="auto"
          grabCursor={true}
        >

          {categories.map((category) => (

            <SwiperSlide
              key={category._id}
              style={{ width: "380px" }}
            >

              <Link
                to={`/products?category=${category.slug}`}
                className="block group"
              >

                <div className="relative overflow-hidden rounded-[18px]">

                  {/* IMAGE */}
                  <img
                    src={
                      category.photo ||
                      `https://via.placeholder.com/250x300?text=${encodeURIComponent(
                        category.name
                      )}`
                    }

                    alt={category.name}

                    className="
                      w-full

                      h-[400px]
                      md:h-[500px]

                      object-cover

                      transition duration-700

                      group-hover:scale-[1.03]
                    "
                  />

                  {/* DARK OVERLAY */}
                  <div
                    className="
                      absolute inset-0

                      bg-gradient-to-t
                      from-black/40
                      via-black/5
                      to-transparent
                    "
                  />

                  {/* CATEGORY BUTTON */}
                  <div
                    className="
                      absolute

                      bottom-5
                      left-1/2

                      -translate-x-1/2
                    "
                  >

                    <div
                      className="
                        bg-red-500
                        text-white

                        px-8 py-3

                        rounded-full

                        text-sm
                        font-black
                        uppercase
                        tracking-wide

                        shadow-lg

                        transition-all duration-300

                        group-hover:scale-105
                      "
                    >
                      {category.name}
                    </div>

                  </div>

                </div>

              </Link>

            </SwiperSlide>

          ))}

        </Swiper>

      </div>

      {/* MOBILE LEFT FADE */}
      <div
        className="
          md:hidden

          pointer-events-none

          absolute
          top-0
          bottom-0
          left-0

          w-10

          bg-gradient-to-r
          from-white
          to-transparent

          z-20
        "
      />

      {/* MOBILE RIGHT FADE */}
      <div
        className="
          md:hidden

          pointer-events-none

          absolute
          top-0
          bottom-0
          right-0

          w-10

          bg-gradient-to-l
          from-white
          to-transparent

          z-20
        "
      />

      {/* DESKTOP LEFT FADE */}
      <div
        className="
          hidden md:block

          pointer-events-none

          absolute
          top-0
          bottom-0

          left-6

          w-12

          bg-gradient-to-r
          from-white
          to-transparent

          z-20
        "
      />

      {/* DESKTOP RIGHT FADE */}
      <div
        className="
          hidden md:block

          pointer-events-none

          absolute
          top-0
          bottom-0

          right-[3rem]

          w-12

          bg-gradient-to-l
          from-white
          to-transparent

          z-20
        "
      />

    </div>

  </div>

</section>

      {/* ======================================================
          END OF SEASON SALE
      ====================================================== */}
      <section className="relative overflow-hidden py-24 bg-gradient-to-b from-black via-[#000000] to-black text-white text-center">
        {/* Subtle background glow */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] bg-white/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30" />
        </div>

        {/* Content */}
        <div className="relative z-10 px-6">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight uppercase leading-tight">
            END OF SEASON SALE
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-10">
            Up to <span className="text-white font-bold">30% OFF</span> on our latest collections.
          </p>

          <Button
            asChild
            className="bg-white text-black px-10 py-4 text-sm md:text-base font-semibold tracking-wide rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-transform duration-300"
          >
            <Link to="/newarrivals">GRAB THE DEAL</Link>
          </Button>
        </div>

        {/* Floating gradient shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_4s_infinite]" />
      </section>



<section
  className="
    bg-[#f3f3f1]
    px-4
    md:px-10
    lg:px-16
    py-12
    md:py-20
  "
>
  <div
    className="
      max-w-7xl
      mx-auto

      border border-[#dddddd]

      grid
      lg:grid-cols-2

      bg-[#f5f5f3]
    "
  >

    {/* LEFT IMAGE SIDE */}
    <div
      className="
        relative

        flex items-center justify-center

        p-8
        md:p-14

        border-b
        lg:border-b-0
        lg:border-r

        border-[#dddddd]
      "
    >

      {/* TAG */}
      <div
        className="
          absolute
          top-6
          left-6

          bg-[#b84332]
          text-white

          text-[10px]
          md:text-xs

          uppercase
          tracking-[0.35em]

          px-4 py-2
        "
      >
        Collection 001
      </div>

      {/* PRODUCT IMAGE */}
      <img
        src="/images/banner_web.webp"
        alt="Collection"
        className="
          w-full
          max-w-[420px]

          object-contain

          drop-shadow-[0_30px_60px_rgba(0,0,0,0.18)]

          transition-transform duration-700
          hover:scale-[1.03]
        "
      />

    </div>

    {/* RIGHT CONTENT */}
    <div
      className="
        flex flex-col justify-center

        px-6
        md:px-12
        lg:px-14

        py-10
        md:py-16
      "
    >

      {/* MINI LABEL */}
      <div
        className="
          flex items-center gap-4
          mb-6
        "
      >
        <p
          className="
            text-[11px]
            uppercase
            tracking-[0.4em]
            text-[#b84332]
            font-semibold
          "
        >
          Now Live
        </p>

        <div className="w-10 h-px bg-[#b84332]" />
      </div>

      {/* TITLE */}
      <h2
        className="
          text-[3rem]
          md:text-[4.5rem]

          leading-[0.9]

          font-black
          tracking-[-0.05em]

          uppercase
        "
      >
        THE FIRST
        <br />

        <span
          className="
            italic
            font-medium
            text-[#b84332]
            lowercase
          "
        >
          Stories.
        </span>
      </h2>

      {/* DESCRIPTION */}
      <p
        className="
          mt-8

          text-[#6b6b6b]

          text-base
          md:text-lg

          leading-relaxed

          max-w-xl
        "
      >
        Stories older than civilisation.
        The gods your ancestors prayed
        to — printed on heavyweight
        oversized silhouettes designed
        for modern street culture.
      </p>

      {/* DIVIDER */}
      <div
        className="
          mt-10
          border-t border-[#d7d7d7]
          pt-6
        "
      >

        {/* FEATURES */}
        <div
          className="
            flex flex-wrap
            gap-6
            md:gap-10

            text-[11px]
            md:text-xs

            uppercase
            tracking-[0.3em]

            text-black
            font-semibold
          "
        >

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#b84332]" />
            240 GSM Cotton
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#b84332]" />
            Made in Bharat
          </div>

          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#b84332]" />
            Limited Edition
          </div>

        </div>

      </div>

      {/* CTA */}
      <div
        className="
          mt-10

          flex flex-col
          sm:flex-row

          sm:items-center

          gap-5
        "
      >

        <Link
          to="/collections"
          className="
            group

            inline-flex
            items-center
            justify-center

            gap-4

            bg-black
            text-white

            px-8
            md:px-10

            py-5

            uppercase
            text-xs

            tracking-[0.28em]
            font-bold

            transition-all duration-500

            hover:bg-[#b84332]
          "
        >

          <span>
            Explore Collection
          </span>

          <span
            className="
              transition-transform duration-300
              group-hover:translate-x-1
            "
          >
            →
          </span>

        </Link>

        <p
          className="
            text-sm
            uppercase
            tracking-[0.3em]
            text-gray-500
          "
        >
          5 Pieces
        </p>

      </div>

    </div>

  </div>
</section>


      {/* ======================================================
          LOOKBOOK SECTION
      ====================================================== */}
      <section className="py-24 bg-white relative overflow-hidden w-full">
  <div className="text-center mb-16">

  {/* TOP LABEL */}
  <p
    className="
      text-[11px]
      uppercase
      tracking-[0.45em]
      text-gray-400
      mb-4
    "
  >
    Editorial Selection
  </p>

  {/* MAIN TITLE */}
  <h2
    className="
      relative inline-block

      text-5xl
      md:text-7xl

      font-black
      uppercase

      tracking-[-0.04em]
      leading-none
    "
  >
    LOOKBOOK

    {/* SUBTLE ACCENT */}
    <span
      className="
        absolute
        -bottom-3
        left-1/2
        -translate-x-1/2

        w-20 h-[3px]

        rounded-full
        bg-black
      "
    />
  </h2>

  {/* SUBTEXT */}
  <p
    className="
      mt-8
      text-sm
      text-gray-500
      tracking-wide
    "
  >
    Curated looks from the latest drop
  </p>

</div>

        <div className="flex overflow-x-auto gap-8 px-5 w-full scrollbar-thin">
     <Swiper
  spaceBetween={30}
  slidesPerView="auto"
  grabCursor={true}
>
  {categories.map((category) => {
    const categoryProducts = products
      .filter((p) => p.category?._id === category._id)
      .slice(0, 3);

    if (!categoryProducts.length) return null;

    return (
      <SwiperSlide key={category._id} style={{ width: "380px" }}>
        
        <div className="group cursor-pointer relative">
          
          <div className="relative h-[400px] md:h-[450px]">
            {categoryProducts.map((product, index) => {
              const rotations = ["rotate-0", "-rotate-2", "rotate-2"];
              const topOffsets = ["top-0", "-top-4", "-top-8"];
              const leftOffsets = ["left-0", "-left-4", "-left-8"];
              const zIndex = [10, 20, 30];

              return (
                <img
                  key={product._id}
                  src={product.images?.[0] || category.photo}
                  alt={product.title}
                  className={`absolute w-full h-full object-cover rounded-lg shadow-2xl transition-transform
                    ${rotations[index]}
                    ${topOffsets[index]}
                    ${leftOffsets[index]}
                    group-hover:scale-105`}
                  style={{ zIndex: zIndex[index] }}
                />
              );
            })}
          </div>

          <Link to={`/products?category=${category.slug}`}>
            <button className="z-50 absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/70 px-4 py-2 text-sm uppercase rounded-md hover:bg-black transition">
              SHOP THE LOOK
            </button>
          </Link>

        </div>

      </SwiperSlide>
    );
  })}
</Swiper>

          <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10" />
        </div>
      </section>






      {/* ======================================================
          JOURNAL / FOOTER
      ====================================================== */}
      <section className="bg-gray-50 text-center py-20 px-6 md:px-20 relative overflow-hidden">
        {/* Decorative gradient accent */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-gradient-to-tr from-yellow-300 via-orange-400 to-red-400 rounded-full opacity-30 blur-3xl pointer-events-none"></div>

        <h3 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight uppercase text-gray-900">
          From the DripJournal
        </h3>

        <p className="text-gray-700 mb-2 text-sm md:text-base max-w-xl mx-auto">
          Get 10% Off Your First Order.
        </p>

        <p className="text-gray-500 text-xs md:text-sm max-w-md mx-auto mb-6">
          Be the first to know about our latest drops, exclusive collections, and insider news.
        </p>

        <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-gray-900 transition shadow-lg">
          Subscribe Now
        </button>
      </section>


      {/* ======================================================
          FEATURED PRODUCTS
      ====================================================== */}
      <section className="bg-white pt-12 pb-16 text-black">
        <div className=" px-4 sm:px-6 lg:px-8 ">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-bold uppercase tracking-tight">FEATURED PRODUCTS</h2>

            <div className="flex items-center gap-3">
              <Link
                to="/products"
                className="hidden md:inline-flex items-center gap-2 text-sm font-semibold uppercase text-black hover:text-gray-700 transition"
              >
                DISCOVER MORE
                <svg role="presentation" focusable="false" width="8" height="12" className="stroke-current" viewBox="0 0 8 12">
                  <path d="m1 11 5-5-5-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* small homepage CTA (mobile) */}
              <Link to="/collections/bestseller" className="md:hidden text-xs font-semibold uppercase text-black/80">
                More
              </Link>
            </div>
          </div>

          {/* Layout: hero left, scroller right */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroes && heroes.length > 0 ? (
              heroes.map((p) => (
                <article
                  key={p._id}
                  className="bg-gray-50 rounded-lg overflow-hidden relative group"
                >
                  <Link to={`/product/${p._id}`} className="block overflow-hidden">
                    <div className="relative h-72 sm:h-80 lg:h-[420px] overflow-hidden">
                      <img
                        src={p.images?.[0] || "https://via.placeholder.com/800x600?text=No+Image"}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                        {p.isNewProduct && (
                          <span className="bg-black text-white px-3 py-1 text-xs uppercase font-semibold rounded">
                            NEW
                          </span>
                        )}
                        {p.onSale && (
                          <span className="bg-red-600 text-white px-3 py-1 text-xs uppercase font-semibold rounded">
                            SALE
                          </span>
                        )}
                      </div>

                      {/* Info Box */}
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-md p-4 shadow-md max-w-xs">
                        <h3 className="text-base font-bold uppercase truncate">
                          {p.title}
                        </h3>

                        {/* Price + Discount Row */}
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {/* Actual Price */}
                          <span className="text-sm font-bold text-[#042354]">
                            ₹{Number(p.price).toLocaleString()}
                          </span>

                          {/* If on sale — show a fake original price and discount */}
                          {p.onSale && (
                            <>
                              <span className="text-xs text-gray-500 line-through">
                                ₹{Math.round(Number(p.price) / 0.7).toLocaleString()}
                              </span>
                              <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                30% OFF
                              </span>
                            </>
                          )}
                        </div>

                        {/* Buttons */}
                        <div className="mt-3 flex gap-2">
                     <span className="bg-black text-white px-3 py-2 rounded text-sm font-semibold">
                            View Product
                            </span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              openModal(p);
                            }}
                            className="border border-gray-200 px-3 py-2 rounded text-sm font-medium hover:bg-gray-100"
                            aria-label={`Add ${p.title} to cart`}
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </article>
              ))
            ) : (
              <div className="col-span-3 h-72 sm:h-96 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                No featured products available
              </div>
            )}
          </div>




        </div>
      </section>




      {/* App Promo Section */}
      <section id="app" className="relative overflow-hidden text-white bg-black py-24">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 flex flex-col-reverse lg:flex-row items-center gap-12">

          {/* Text Section */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl font-extrabold uppercase tracking-tight leading-tight">
              Get 10% Extra Discount on Our App
            </h1>
            <p className="text-gray-300 text-lg sm:text-xl max-w-lg mx-auto lg:mx-0">
              Download our app for exclusive offers, faster checkout, personalized recommendations, and early access to new drops.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mt-6">
              <Link to="#"
                className="px-6 py-3 bg-white text-black font-bold uppercase border border-white rounded-lg shadow-lg hover:bg-gray-100 hover:scale-105 transition-transform"
              >
                Download on iOS
              </Link>
              <Link
                to="#"
                className="px-6 py-3 bg-transparent text-white font-bold uppercase border border-white rounded-lg shadow-lg hover:bg-white hover:text-black hover:scale-105 transition-transform"
              >
                Download on Android
              </Link>
            </div>
          </div>

          {/* Phone / App Mockup Section */}
          <div className="flex-1 flex justify-center relative">
            <div className="relative w-64 sm:w-72 md:w-80 lg:w-96">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl blur-xl opacity-50 animate-pulse"></div>
              <div className="relative border-4 border-white rounded-3xl overflow-hidden shadow-2xl">
                <video
                  src="/videos/app-preview.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-auto object-cover rounded-3xl"
                />
              </div>
            </div>
          </div>

        </div>
      </section>




      {/* 🧩 Bundle Section */}

      <section className=" mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-14">

  <div>

    {/* MINI LABEL */}
    <p
      className="
        text-[11px]
        uppercase
        tracking-[0.4em]
        text-gray-400
        mb-3
      "
    >
      Curated Essentials
    </p>

    {/* TITLE */}
    <h2
      className="
        text-4xl
        md:text-6xl

        font-black
        uppercase

        tracking-[-0.04em]
        leading-none
      "
    >
      Featured
      <br />
      Bundle
    </h2>

  </div>

  {/* OPTIONAL SIDE TEXT */}
  <p
    className="
      hidden md:block

      text-sm
      text-gray-500
      tracking-wide
      max-w-[220px]
      text-right
    "
  >
    Handpicked pieces styled together for the perfect fit.
  </p>

</div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {bundles.slice(0, 4).map((bundle) => {
            const total =
              bundle.products?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0;
            const bundlePrice = Number(bundle.bundlePrice || total);
            const fakeOriginal = Math.round(bundlePrice / 0.7);
            const discountPercent = Math.round(((fakeOriginal - bundlePrice) / fakeOriginal) * 100);

            return (
              <div
                key={bundle._id}
                className="group border border-gray-200 rounded-2xl bg-white hover:shadow-md transition overflow-hidden"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={
                      bundle.heroImage ||
                      bundle.mainImages?.[0] ||
                      bundle.products?.[0]?.images?.[0] ||
                      "/images/placeholder-800.png"
                    }
                    alt={bundle.title}
                    className="w-full h-72 object-cover"
                  />

                  {/* Bundle Tag */}
                  <span className="absolute top-4 left-4 bg-black text-white text-xs font-semibold px-3 py-1 rounded-full tracking-wide">
                    Bundle
                  </span>

                  {discountPercent > 0 && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col gap-3">
                  <h3 className="text-lg font-semibold text-black truncate">
                    {bundle.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {bundle.description || "Exclusive curated items in one pack."}
                  </p>

                  {/* Price */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-black">
                      ₹{bundlePrice.toLocaleString()}
                    </span>
                    {bundle && (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{Math.round(Number(bundle.price) / 0.7).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded">
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-1 mb-3">
                    {(bundle.products || []).slice(0, 4).map((p) => (
                      <img
                        key={p._id}
                        src={p.images?.[0] || "/images/placeholder.png"}
                        alt={p.title}
                        className="w-10 h-10 rounded-md border border-gray-200 object-cover"
                      />
                    ))}
                    {bundle.products?.length > 4 && (
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-100 text-gray-600 text-xs rounded-md border border-gray-200">
                        +{bundle.products.length - 4}
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openBundleModal(bundle)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-50 transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => openBundleModal(bundle)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium bg-black text-white rounded-full hover:bg-gray-900 transition"
                    >
                      Add Bundle
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>



      <FAQ />
      <FeaturesCarousel />
      <section className="py-20 bg-white text-black">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold uppercase mb-4">
              Reach Out To Us
            </h2>
            <p className="text-gray-700 text-lg md:text-xl max-w-2xl mx-auto">
              Got questions, ideas, or just wanna vibe with us? At{" "}
              <span className="font-bold uppercase">MONKIESS</span>, we’re all ears.
            </p>
          </div>

          {/* Form */}
          <div
    
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Name */}
            <div className="relative">
              <input
                type="text"
                name="name"
                onChange={handleChange}
                value={form.name}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none uppercase"
                required
              />
              <label
                htmlFor="ContactForm-name"
                className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          transition-all duration-300 ease-in-out
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs
          peer-valid:top-0 peer-valid:-translate-y-1 peer-valid:text-black peer-valid:text-xs"
              >
                Name
              </label>
            </div>

            {/* Email */}
            <div className="relative">
              <input
                type="email"
                name="email"
                onChange={handleChange}
                value={form.email}
                placeholder=" "
                className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none uppercase"
                required
              />
              <label
                htmlFor="ContactForm-email"
                className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          transition-all duration-300 ease-in-out
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs
          peer-valid:top-0 peer-valid:-translate-y-1 peer-valid:text-black peer-valid:text-xs"
              >
                Email
              </label>
            </div>

            {/* Phone */}
            <div className="relative md:col-span-2">
              <input
                type="tel"
                name="phone"
                pattern="[0-9\-]*"
                onChange={handleChange}
                placeholder=" "
                value={form.phone}
                required
                className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none uppercase"
              />
              <label
                htmlFor="ContactForm-phone"
                className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          transition-all duration-300 ease-in-out
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs
          peer-valid:top-0 peer-valid:-translate-y-1 peer-valid:text-black peer-valid:text-xs"
              >
                Phone Number
              </label>
            </div>

            {/* Comment */}
            <div className="relative md:col-span-2">
              <textarea
                name="message"
                rows={5}
                placeholder=" "
                required
                className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none resize-none uppercase"
                onChange={handleChange}
                value={form.message}
              />
              <label
                htmlFor="ContactForm-body"
                className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          transition-all duration-300 ease-in-out
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs
          peer-valid:top-0 peer-valid:-translate-y-1 peer-valid:text-black peer-valid:text-xs"
              >
                Comment
              </label>
            </div>

            {/* Submit */}
            <div className="md:col-span-2 text-center mt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-12 py-3 bg-black text-white font-bold uppercase tracking-wide transition-colors duration-300 ease-in-out hover:bg-gray-900"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* product size modal */}
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
                    ${qty <= 0
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


      {/* bundle model */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); }}>
       <DialogContent className="max-w-3xl w-full bg-white p-6 relative max-h-[90vh] overflow-y-auto">
          {/* Close X */}
          <button
            onClick={() => {
              setIsOpen(false);

            }}
            aria-label="Close"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center  hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Top header: title + price + small see details */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <img
                src={selectedBundle?.mainImages?.[0] || selectedBundle?.products?.[0]?.images?.[0] || "/images/placeholder.png"}
                alt={selectedBundle?.title}
                className="w-14 h-14 object-cover rounded-md border"
              />
              <div>
                <h3 className="text-lg font-semibold">{selectedBundle?.title}</h3>
                <div className="text-sm text-gray-700 font-semibold">₹{fmt(selectedBundle?.price || selectedBundle?.bundlePrice || 0)}</div>
                <button
                  onClick={() => selectedBundle && navigate(`/collections/${selectedBundle._id}`)}
                  className="text-xs text-gray-500 underline mt-1"
                >
                  See Details
                </button>
              </div>
            </div>

            <div className="text-right text-gray-500 text-sm"></div>
          </div>

          {/* Main row: product cards side-by-side with + in the middle */}
          <div className="w-full bg-white border-t border-b py-6 px-2 mb-6 relative  ">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start justify-between relative">
              {(selectedBundle?.products || []).map((p, idx) => (
                <div
                  key={p._id}
                  className="bg-white flex flex-col sm:flex-row gap-4 items-start"
                >
                  {/* product image */}
                  <div className="w-full sm:w-44 flex-shrink-0">
                    <img
                      src={p.images?.[0] || "/images/placeholder.png"}
                      alt={p.title}
                      className="w-full h-44 object-cover rounded-md border"
                    />
                  </div>

                  {/* product meta + select */}
                  <div className="flex-1">

                    <div className="text-sm font-semibold text-black">{p.title}</div>


                    <div className="text-sm font-semibold text-gray-900">
                      ₹{fmt(p.price)}
                    </div>

                    {/* size guide + size select */}
                    <div className="mt-4">


                      {/* Hardcoded sizes Select */}
                      <div className="mt-24 max-w-xs">

                        <Select
                          value={selectedSizes[p._id] ?? ""}
                          onValueChange={(val) => handleSizeChange(p._id, val)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Size" />
                          </SelectTrigger>
                          <SelectContent>
                            {["XS", "S", "M", "L", "XL", "XXL"].map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}


            </div>

          </div>

          {/* Quantity + CTA row */}
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            {/* left: quantity control */}


            {/* CTA */}
            <div className="w-full sm:w-1/3">
              <button
                onClick={handleAddBundle}
                className="w-full  text-white py-3  font-semibold bg-black transition"
              >
                Add To Cart
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
