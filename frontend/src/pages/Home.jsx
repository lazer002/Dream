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
import { X ,ChevronRight} from "lucide-react";
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

<div className="bg-[#fafafa] rounded-[40px] p-5 md:p-8">

  {/* Section Header */}

  <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

    <div>

      <p className="text-xs uppercase tracking-[0.45em] text-neutral-400">
        SHOP BY CATEGORY
      </p>

      <h2 className="mt-3 text-5xl md:text-6xl font-black tracking-tight">
        Discover Collections
      </h2>

      <p className="mt-4 max-w-xl text-neutral-500 leading-7">
        Explore premium collections curated for every style.
        Crafted with timeless silhouettes and modern essentials.
      </p>

    </div>

    <Link
      to="/products"
      className="
        group
        inline-flex
        items-center
        gap-3
        rounded-full
        border
        border-black
        bg-white
        px-6
        py-3
        text-sm
        font-semibold
        uppercase
        tracking-[0.2em]
        transition
        hover:bg-black
        hover:text-white
      "
    >
      Shop All

      <ChevronRight
        size={18}
        className="
          transition-transform
          duration-300
          group-hover:translate-x-1
        "
      />

    </Link>

  </div>

  <div className="flex flex-col xl:flex-row gap-8">

    {/* HERO */}

    <div className="xl:w-[420px] shrink-0">

      <Link
        to="/products"
        className="group block"
      >

        <div className="relative overflow-hidden rounded-[36px]">

          <img
            src="https://bzmvvcdngqoxwpbulakr.supabase.co/storage/v1/object/public/product-images/products/1760803192692-zasrnaykki8.webp"
            className="
              h-[500px]
              w-full
              object-cover
              transition
              duration-700
              group-hover:scale-110
            "
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>

          <div className="absolute bottom-8 left-8 right-8 text-white">

            <span
              className="
                inline-flex
                rounded-full
                bg-white
                px-4
                py-2
                text-xs
                font-bold
                uppercase
                tracking-[0.25em]
                text-black
              "
            >
              Featured
            </span>

            <h2 className="mt-5 text-4xl font-black">
              MEN'S COLLECTION
            </h2>

            <p className="mt-3 max-w-xs text-white/75">
              Premium essentials designed for everyday wear.
            </p>

            <div
              className="
                mt-6
                inline-flex
                items-center
                gap-3
                rounded-full
                bg-black
                px-6
                py-3
                text-sm
                font-semibold
                uppercase
                tracking-[0.2em]
              "
            >
              Shop Now

              <ChevronRight
                size={18}
                className="text-lime-400"
              />

            </div>

          </div>

        </div>

      </Link>

    </div>

    {/* CATEGORY SLIDER */}

    <div className="min-w-0 flex-1">

      <Swiper
        spaceBetween={24}
        grabCursor

        breakpoints={{
          0:{
            slidesPerView:1.15
          },
          640:{
            slidesPerView:1.5
          },
          768:{
            slidesPerView:2
          },
          1200:{
            slidesPerView:2.6
          },
          1600:{
            slidesPerView:3
          }
        }}
      >
        {categories.map((category) => (

  <SwiperSlide
    key={category._id}
    className="!w-[320px] md:!w-[360px]"
  >

    <Link
      to={`/products?category=${category.slug}`}
      className="group block"
    >

      <div
        className="
          overflow-hidden
          rounded-[32px]
          bg-white
          shadow-sm
          transition-all
          duration-500
          hover:-translate-y-2
          hover:shadow-[0_20px_60px_rgba(0,0,0,.12)]
        "
      >

        {/* IMAGE */}

        <div className="relative overflow-hidden">

          <img
            src={
              category.photo ||
              `https://via.placeholder.com/600x800?text=${encodeURIComponent(category.name)}`
            }
            alt={category.name}
            className="
              h-[460px]
              w-full
              object-cover
              transition-transform
              duration-700
              group-hover:scale-110
            "
          />

          {/* Gradient */}

          <div
            className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/80
              via-black/10
              to-transparent
            "
          />

          {/* Product Count */}

          <div
            className="
              absolute
              left-5
              top-5
              rounded-full
              bg-white
              px-4
              py-2
              text-xs
              font-bold
              uppercase
              tracking-[0.2em]
            "
          >
            Collection
          </div>

          {/* Bottom Info */}

          <div
            className="
              absolute
              bottom-0
              left-0
              right-0
              p-6
              text-white
            "
          >

            <h3 className="text-3xl font-black">
              {category.name}
            </h3>

            <p className="mt-2 text-sm text-white/75">
              Explore premium essentials curated for your wardrobe.
            </p>

            <div className="mt-6 flex items-center justify-between">

              <div>

                <span className="text-xs uppercase tracking-[0.25em] text-white/60">
                  Shop Collection
                </span>

              </div>

              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/30
                  backdrop-blur-md
                  transition-all
                  group-hover:bg-white
                  group-hover:text-black
                "
              >

                <ChevronRight
                  size={20}
                  className="group-hover:text-lime-500"
                />

              </div>

            </div>

          </div>

        </div>

      </div>

    </Link>

  </SwiperSlide>

))}
    </Swiper>

    {/* Bottom Controls */}

    <div className="mt-8 flex items-center justify-between">

      <div className="flex items-center gap-3">

        <div className="h-[2px] w-16 bg-black rounded-full" />

        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">
          Scroll
        </span>

      </div>

      <Link
        to="/products"
        className="
          group
          inline-flex
          items-center
          gap-2
          text-sm
          font-semibold
          uppercase
          tracking-[0.2em]
          transition
          hover:text-neutral-600
        "
      >
        View All

        <ChevronRight
          size={18}
          className="
            transition-transform
            duration-300
            group-hover:translate-x-1
          "
        />

      </Link>

    </div>

  </div>

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



{/* <section
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

      <div
        className="
          mt-10
          border-t border-[#d7d7d7]
          pt-6
        "
      >

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
</section> */}






      {/* ======================================================
          JOURNAL / FOOTER
      ====================================================== */}
      {/* <section className="bg-gray-50 text-center py-20 px-6 md:px-20 relative overflow-hidden">
     
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 rounded-full opacity-30 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-gradient-to-tr from-yellow-300 via-orange-400 to-red-400 rounded-full opacity-30 blur-3xl pointer-events-none"></div>

        <h3 className="text-2xl md:text-3xl font-extrabold mb-4 tracking-tight uppercase text-gray-900">
          From the GARRIB
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
      </section> */}


      {/* ======================================================
          FEATURED PRODUCTS
      ====================================================== */}
<section className="bg-[#fafafa] py-20 overflow-hidden">

  <div className="mx-auto max-w-[1700px] px-5 md:px-8">

    {/* Header */}

    <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

      <div>

        <span className="text-xs uppercase tracking-[0.45em] text-neutral-400">
          FEATURED COLLECTION
        </span>

        <h2 className="mt-4 text-5xl md:text-6xl font-black tracking-tight">
          Featured Products
        </h2>

        <p className="mt-5 max-w-xl text-lg text-neutral-500 leading-8">
          Discover timeless essentials crafted with premium fabrics,
          clean silhouettes and modern styling.
        </p>

      </div>

      <Link
        to="/products"
        className="
          group
          inline-flex
          items-center
          gap-3
          rounded-full
          border
          border-black
          bg-white
          px-7
          py-3
          text-sm
          font-semibold
          uppercase
          tracking-[0.2em]
          transition-all
          hover:bg-black
          hover:text-white
        "
      >
        Shop Collection

        <ChevronRight
          size={18}
          className="
            transition-transform
            duration-300
            group-hover:translate-x-1
          "
        />

      </Link>

    </div>

    {/* Products */}

    <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

      {heroes?.length ? (

        heroes.map((p) => (

          <article
            key={p._id}
            className="
              group
              overflow-hidden
              rounded-[32px]
              bg-white
              shadow-sm
              transition-all
              duration-500
              hover:-translate-y-2
              hover:shadow-[0_25px_80px_rgba(0,0,0,.12)]
            "
          >

            <Link
              to={`/product/${p._id}`}
              className="block"
            >

              <div className="relative h-[420px] overflow-hidden">

                <img
                  src={
                    p.images?.[0] ||
                    "https://via.placeholder.com/900x1200"
                  }
                  alt={p.title}
                  loading="lazy"
                  className="
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-700
                    group-hover:scale-110
                  "
                />

                {/* Gradient */}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"/>

                {/* Badges */}

                <div className="absolute left-5 top-5 flex gap-2">

                  {p.isNewProduct && (

                    <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold uppercase">
                      NEW
                    </span>

                  )}

                  {p.onSale && (

                    <span className="rounded-full bg-lime-400 px-3 py-1 text-[11px] font-bold uppercase">
                      SALE
                    </span>

                  )}

                </div>

               <div className="absolute bottom-0 left-0 right-0 p-6 text-white">

  {/* Category */}

  <p className="text-xs uppercase tracking-[0.35em] text-white/70">
    {p.category?.name || "ESSENTIAL"}
  </p>

  {/* Product */}

  <h3
    className="
      mt-2
      text-3xl
      font-black
      leading-tight
      transition-transform
      duration-300
      group-hover:-translate-y-1
    "
  >
    {p.title}
  </h3>

  {/* Price */}

  <div className="mt-4 flex items-center gap-3 flex-wrap">

    <span className="text-3xl font-black">
      ₹{Number(p.price).toLocaleString()}
    </span>

    {p.onSale && (
      <>
        <span className="text-white/60 line-through text-sm">
          ₹{Math.round(Number(p.price) / 0.7).toLocaleString()}
        </span>

        <span className="rounded-full bg-lime-400 px-2 py-1 text-[11px] font-bold text-black">
          30% OFF
        </span>
      </>
    )}

  </div>

  {/* Description */}

  <p className="mt-4 max-w-sm text-sm leading-6 text-white/80 line-clamp-2">
    {p.shortDescription ||
      "Premium everyday essential designed with comfort, durability and timeless style."}
  </p>

  {/* CTA */}

  <div className="mt-7 flex items-center justify-between">

    <button
      onClick={(e) => {
        e.preventDefault();
        openModal(p);
      }}
      className="
        rounded-full
        bg-white
        px-6
        py-3
        text-xs
        font-bold
        uppercase
        tracking-[0.2em]
        text-black
        transition-all
        hover:bg-lime-400
        hover:scale-105
      "
    >
      QUICK ADD
    </button>

    <div className="flex items-center gap-3">

      <span className="text-sm uppercase tracking-[0.2em] text-white/70">
        View
      </span>

      <div
        className="
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-full
          border
          border-white/30
          backdrop-blur-md
          transition-all
          group-hover:bg-white
          group-hover:text-black
        "
      >
        <ChevronRight size={20} />
      </div>

    </div>

  </div>

</div>

</div>

</Link>

</article>

))) : (

  <div
    className="
      col-span-full
      flex
      h-[520px]
      items-center
      justify-center
      rounded-[32px]
      bg-white
      border
    "
  >

    <div className="text-center">

      <p className="text-xs uppercase tracking-[0.35em] text-neutral-400">
        Coming Soon
      </p>

      <h3 className="mt-4 text-4xl font-black">
        More Products Are On The Way
      </h3>

      <p className="mt-4 text-neutral-500">
        New arrivals will appear here shortly.
      </p>

    </div>

  </div>

)}

</div>

{/* Bottom CTA */}

<div className="mt-16 flex justify-center">

  <Link
    to="/products"
    className="
      group
      flex
      items-center
      gap-3
      rounded-full
      bg-black
      px-8
      py-4
      text-sm
      font-semibold
      uppercase
      tracking-[0.25em]
      text-white
      transition-all
      hover:scale-105
    "
  >

    Explore All Products

    <ChevronRight
      size={18}
      className="
        text-lime-400
        transition-transform
        duration-300
        group-hover:translate-x-1
      "
    />

  </Link>

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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {bundles.slice(0, 4).map((bundle) => {
            const total =
              bundle.products?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0;
            const bundlePrice = Number(bundle.bundlePrice || total);
            const fakeOriginal = Math.round(bundlePrice / 0.7);
            const discountPercent = Math.round(((fakeOriginal - bundlePrice) / fakeOriginal) * 100);

            return (
          <div
  key={bundle._id}
  className="
    group
    overflow-hidden
    rounded-[30px]
    bg-white
    shadow-sm
    transition-all
    duration-500
    hover:-translate-y-2
    hover:shadow-[0_25px_70px_rgba(0,0,0,.12)]
  "
>

  <div className="relative overflow-hidden">

    <img
      src={
        bundle.heroImage ||
        bundle.mainImages?.[0] ||
        bundle.products?.[0]?.images?.[0] ||
        "/images/placeholder.png"
      }
      alt={bundle.title}
      className="
        h-[420px]
        w-full
        object-cover
        transition-transform
        duration-700
        group-hover:scale-110
      "
    />

    {/* Gradient */}

    <div
      className="
        absolute
        inset-0
        bg-gradient-to-t
        from-black/80
        via-black/15
        to-transparent
      "
    />

    {/* Top */}

    <div className="absolute left-5 right-5 top-5 flex justify-between">

      <span
        className="
          rounded-full
          bg-white
          px-3
          py-1
          text-[11px]
          font-bold
          uppercase
        "
      >
        Bundle
      </span>

      {discountPercent > 0 && (

        <span
          className="
            rounded-full
            bg-lime-400
            px-3
            py-1
            text-[11px]
            font-bold
            uppercase
          "
        >
          {discountPercent}% OFF
        </span>

      )}

    </div>

   <div
  className="
    absolute
    bottom-0
    left-0
    right-0
    p-6
    text-white
  "
>

  {/* Title */}

  <p className="text-xs uppercase tracking-[0.35em] text-white/60">
    Curated Bundle
  </p>

  <h3 className="mt-2 text-3xl font-black leading-tight">
    {bundle.title}
  </h3>

  {/* Price */}

  <div className="mt-4 flex items-center gap-3 flex-wrap">

    <span className="text-3xl font-black">
      ₹{bundlePrice.toLocaleString()}
    </span>

    <span className="text-sm text-white/60 line-through">
      ₹{fakeOriginal.toLocaleString()}
    </span>

    <span
      className="
        rounded-full
        bg-lime-400
        px-2
        py-1
        text-[11px]
        font-bold
        text-black
      "
    >
      SAVE {discountPercent}%
    </span>

  </div>

  {/* Description */}

  <p className="mt-4 line-clamp-2 max-w-sm text-sm leading-6 text-white/75">
    {bundle.description ||
      "Premium pieces curated together for the perfect outfit."}
  </p>

  {/* Included Products */}

  <div className="mt-6 flex items-center justify-between">

    <div className="flex -space-x-3">

      {(bundle.products || [])
        .slice(0, 4)
        .map((p) => (

          <img
            key={p._id}
            src={p.images?.[0]}
            alt={p.title}
            className="
              h-11
              w-11
              rounded-full
              border-2
              border-black
              object-cover
            "
          />

      ))}

      {bundle.products?.length > 4 && (

        <div
          className="
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-full
            border-2
            border-black
            bg-white
            text-xs
            font-bold
            text-black
          "
        >
          +{bundle.products.length - 4}
        </div>

      )}

    </div>

    <div className="text-right">

      <p className="text-xs uppercase tracking-[0.2em] text-white/60">
        Included
      </p>

      <p className="font-semibold">
        {bundle.products?.length} Items
      </p>

    </div>

  </div>

  {/* CTA */}

  <div className="mt-7 flex items-center justify-between">

    <button
      onClick={() => openBundleModal(bundle)}
      className="
        rounded-full
        bg-white
        px-6
        py-3
        text-xs
        font-bold
        uppercase
        tracking-[0.2em]
        text-black
        transition
        hover:bg-lime-400
      "
    >
      View Bundle
    </button>

    <button
      onClick={() => openBundleModal(bundle)}
      className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        border
        border-white/30
        backdrop-blur-md
        transition
        group-hover:bg-white
        group-hover:text-black
      "
    >
      <ChevronRight
        size={20}
        className="group-hover:text-lime-500"
      />
    </button>

  </div>

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
            <div className="relative  px-2">
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
                className="absolute left-0 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          transition-all duration-300 ease-in-out
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs
          peer-valid:top-0 peer-valid:-translate-y-1 peer-valid:text-black peer-valid:text-xs"
              >
                Name
              </label>
            </div>

            {/* Email */}
           <div className="relative  px-2">
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
                className="absolute left-0 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
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
                className="absolute left-0 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
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
                className="absolute left-0 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
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
  <DialogContent className="w-[95vw] max-w-md overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-[0_25px_80px_rgba(0,0,0,.18)]">

    {selectedProduct && (
      <>

        {/* Header */}

        <div className="relative">

          <img
            src={selectedProduct.images?.[0]}
            alt={selectedProduct.title}
            className="h-64 w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          <button
            onClick={() => setIsModalOpen(false)}
            className="
              absolute
              right-4
              top-4
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-white
              shadow
            "
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">

            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              QUICK ADD
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {selectedProduct.title}
            </h2>

            <p className="mt-2 text-2xl font-bold">
              ₹{Number(selectedProduct.price).toLocaleString()}
            </p>

          </div>

        </div>

        {/* Body */}

        <div className="p-6">

          <div className="flex items-center justify-between">

            <h3 className="font-semibold">
              Select Size
            </h3>

            <button className="text-sm text-neutral-500 underline">
              Size Guide
            </button>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">

            {Object.entries(selectedProduct.inventory || {}).map(
              ([size, qty]) => {

                const disabled = qty <= 0;

                return (
                  <button
                    key={size}
                    disabled={disabled}
                    onClick={() => handleSelectSize(size)}
                    className={`
                      rounded-2xl
                      border
                      py-4
                      transition-all

                      ${
                        disabled
                          ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                          : "border-black hover:bg-black hover:text-white"
                      }
                    `}
                  >

                    <div className="font-semibold">
                      {size}
                    </div>

                    <div className="mt-1 text-xs opacity-70">
                      {disabled ? "Out" : `${qty} Left`}
                    </div>

                  </button>
                );
              }
            )}

          </div>

          {Object.values(selectedProduct.inventory || {}).every(
            (q) => q <= 0
          ) && (
            <div className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-sm font-medium text-red-600">
              This product is currently out of stock.
            </div>
          )}

        </div>

      </>
    )}

  </DialogContent>
</Dialog>


      {/* bundle model */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); }}>
   <DialogContent className="w-[95vw] max-w-6xl overflow-hidden rounded-3xl border-0 bg-[#fafafa] p-0 shadow-2xl" >

  {/* Close */}

  <button
    onClick={() => setIsOpen(false)}
    className="
      absolute
      right-5
      top-5
      z-50
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-full
      bg-white
      shadow
      transition
      hover:bg-neutral-100
    "
  >
    <X className="h-5 w-5"/>
  </button>

  {/* Desktop */}

  <div className="hidden lg:grid lg:grid-cols-[420px_1fr]">

    {/* LEFT */}

    <div className="relative bg-neutral-100">

      <img
        src={
          selectedBundle?.mainImages?.[0] ||
          selectedBundle?.products?.[0]?.images?.[0] ||
          "/images/placeholder.png"
        }
        alt={selectedBundle?.title}
        className="
          h-full
          w-full
          object-cover
        "
      />

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/70
          via-black/10
          to-transparent
        "
      />

      <div
        className="
          absolute
          bottom-0
          left-0
          right-0
          p-8
          text-white
        "
      >

        <p className="text-xs uppercase tracking-[0.3em] opacity-80">
          Build Your Outfit
        </p>

        <h2 className="mt-3 text-4xl font-black leading-tight">
          {selectedBundle?.title}
        </h2>

        <div className="mt-5 flex items-center gap-4">

          <span className="text-3xl font-bold">
            ₹{fmt(selectedBundle?.price || selectedBundle?.bundlePrice || 0)}
          </span>

          <span className="rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold text-black">
            Bundle
          </span>

        </div>

        <button
          onClick={() =>
            navigate(`/collections/${selectedBundle?._id}`)
          }
          className="
            mt-6
            flex
            items-center
            gap-2
            text-sm
            underline
          "
        >
          View Details →
        </button>

      </div>

    </div>

    {/* RIGHT */}

    <div className="flex h-[85vh] flex-col">

      <div className="border-b bg-white px-8 py-6">

        <h3 className="text-2xl font-bold">
          Complete the Look
        </h3>

        <p className="mt-2 text-neutral-500">
          Select a size for each product before adding the bundle.
        </p>

      </div>

     <div className="flex-1 overflow-y-auto bg-[#fafafa] px-8 py-8"  data-lenis-prevent>

  <div className="space-y-6">

    {(selectedBundle?.products || []).map((p, idx) => (

      <div
        key={p._id}
        className="
          rounded-3xl
          border
          border-neutral-200
          bg-white
          p-5
          shadow-sm
          transition
          hover:shadow-md
        "
      >

        <div className="flex flex-col gap-5 md:flex-row">

          {/* Image */}

          <div className="relative w-full md:w-44">

            <img
              src={p.images?.[0] || "/images/placeholder.png"}
              alt={p.title}
              className="
                h-60
                w-full
                rounded-2xl
                object-cover
              "
            />

            <div
              className="
                absolute
                left-3
                top-3
                rounded-full
                bg-black
                px-3
                py-1
                text-[11px]
                font-semibold
                uppercase
                tracking-wider
                text-white
              "
            >
              Included
            </div>

          </div>

          {/* Right */}

          <div className="flex flex-1 flex-col justify-between">

            <div>

              <div className="flex items-start justify-between">

                <div>

                  <h3 className="text-xl font-bold">
                    {p.title}
                  </h3>

                  <p className="mt-2 text-neutral-500">
                    Premium quality essential for your look.
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-2xl font-bold">
                    ₹{fmt(p.price)}
                  </p>

                  <p className="mt-1 text-xs text-lime-600 font-semibold">
                    Bundle Item
                  </p>

                </div>

              </div>

              {/* Gallery */}

              {p.images?.length > 1 && (

                <div className="mt-5 flex gap-2">

                  {p.images.slice(0,4).map((img,i)=>(

                    <img
                      key={i}
                      src={img}
                      className="
                        h-14
                        w-14
                        rounded-xl
                        border
                        object-cover
                      "
                    />

                  ))}

                </div>

              )}

            </div>

            {/* Bottom */}

            <div className="mt-8">

              <div className="mb-3 flex items-center justify-between">

                <span className="font-medium">
                  Choose Size
                </span>

                <button
                  className="
                    text-sm
                    text-neutral-500
                    underline
                  "
                >
                  Size Guide
                </button>

              </div>

              <Select
                value={selectedSizes[p._id] ?? ""}
                onValueChange={(val)=>
                  handleSizeChange(p._id,val)
                }
              >

                <SelectTrigger className="h-12 rounded-xl border-neutral-300">

                  <SelectValue placeholder="Select Size"/>

                </SelectTrigger>

                <SelectContent>

                  {["XS","S","M","L","XL","XXL"].map((size)=>(

                    <SelectItem
                      key={size}
                      value={size}
                    >
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

{/* ---------- Sticky Footer ---------- */}

<div
  className="
    border-t
    bg-white
    px-8
    py-6
  "
>

  <div className="flex items-center justify-between">

    <div>

      <p className="text-sm text-neutral-500">
        Bundle Total
      </p>

      <p className="mt-1 text-3xl font-black">
        ₹{fmt(selectedBundle?.price || selectedBundle?.bundlePrice || 0)}
      </p>

    </div>

    <button
      onClick={handleAddBundle}
      className="
        flex
        items-center
        gap-3
        rounded-2xl
        bg-black
        px-8
        py-4
        font-semibold
        uppercase
        tracking-[0.15em]
        text-white
        transition
        hover:bg-neutral-900
      "
    >
      ADD TO CART

      <ChevronRight
        size={18}
        className="text-lime-400"
      />

    </button>

  </div>

</div>
</div>
</div>

{/* ================= MOBILE ================= */}

<div className="lg:hidden flex flex-col max-h-[92vh]">

  {/* Hero */}

  <div className="relative">

    <img
      src={
        selectedBundle?.mainImages?.[0] ||
        selectedBundle?.products?.[0]?.images?.[0] ||
        "/images/placeholder.png"
      }
      className="h-64 w-full object-cover"
      alt={selectedBundle?.title}
    />

    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"/>

    <button
      onClick={() => setIsOpen(false)}
      className="
        absolute
        right-4
        top-4
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-full
        bg-white
      "
    >
      <X className="h-5 w-5"/>
    </button>

    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">

      <p className="text-xs uppercase tracking-[0.3em] opacity-80">
        Bundle
      </p>

      <h2 className="mt-2 text-3xl font-black">
        {selectedBundle?.title}
      </h2>

      <div className="mt-3 flex items-center gap-3">

        <span className="text-3xl font-bold">
          ₹{fmt(selectedBundle?.price || selectedBundle?.bundlePrice || 0)}
        </span>

        <span className="rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold text-black">
          SAVE
        </span>

      </div>

    </div>

  </div>

  {/* Products */}

  <div className="flex-1 overflow-y-auto bg-neutral-100 p-4 space-y-4"  data-lenis-prevent>

    {(selectedBundle?.products || []).map((p)=>(
      <div
        key={p._id}
        className="
          rounded-3xl
          bg-white
          p-4
          shadow-sm
        "
      >

        <div className="flex gap-4">

          <img
            src={p.images?.[0]}
            className="
              h-28
              w-24
              rounded-2xl
              object-cover
            "
          />

          <div className="flex-1">

            <div className="flex justify-between">

              <div>

                <h3 className="font-semibold">
                  {p.title}
                </h3>

                <p className="mt-1 text-sm text-neutral-500">
                  ₹{fmt(p.price)}
                </p>

              </div>

              <span
                className="
                  rounded-full
                  bg-lime-100
                  px-2
                  py-1
                  text-[11px]
                  font-semibold
                  text-lime-700
                  h-fit
                "
              >
                Included
              </span>

            </div>

            <div className="mt-4">

              <Select
                value={selectedSizes[p._id] ?? ""}
                onValueChange={(v)=>
                  handleSizeChange(p._id,v)
                }
              >

                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Choose Size"/>
                </SelectTrigger>

                <SelectContent>

                  {["XS","S","M","L","XL","XXL"].map(size=>(
                    <SelectItem
                      key={size}
                      value={size}
                    >
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

  {/* Sticky Footer */}

  <div
    className="
      border-t
      bg-white
      p-5
      shadow-[0_-8px_30px_rgba(0,0,0,.08)]
    "
  >

    <div className="mb-4 flex justify-between">

      <div>

        <p className="text-sm text-neutral-500">
          Bundle Price
        </p>

        <p className="text-3xl font-black">
          ₹{fmt(selectedBundle?.price || selectedBundle?.bundlePrice || 0)}
        </p>

      </div>

      <div className="text-right">

        <p className="text-sm text-neutral-500">
          Items
        </p>

        <p className="text-xl font-bold">
          {selectedBundle?.products?.length}
        </p>

      </div>

    </div>

    <button
      onClick={handleAddBundle}
      className="
        flex
        w-full
        items-center
        justify-center
        gap-2
        rounded-2xl
        bg-black
        py-4
        font-semibold
        uppercase
        tracking-[0.2em]
        text-white
      "
    >
      ADD BUNDLE

      <ChevronRight
        size={18}
        className="text-lime-400"
      />

    </button>

  </div>

</div>

</DialogContent>
      </Dialog>
    </div>
  );
}
