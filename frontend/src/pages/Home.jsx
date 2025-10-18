import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FAQ from "@/components/Faq";
import FeaturesCarousel from "@/components/FeaturesCarousel";
import { api } from "@/utils/config";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    api
      .get(`/products?q=${encodeURIComponent(q)}`)
      .then((res) => setProducts(res.data?.items || []))
      .catch(() => setProducts([]));
  }, [q]);

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
  return (

 <div className="bg-white text-black">
      {/* ======================================================
          REDEFINE YOUR STYLE BANNER
      ====================================================== */}
<section className="relative h-[96vh] flex items-center justify-start px-6 md:px-16 bg-black/10">
  {/* Background Image */}
  <img
    src="/images/banner_web.webp"
    alt="Hero Banner"
    className="absolute inset-0 w-full h-full object-cover z-0"
  />

  {/* Overlay (optional subtle dark layer for text readability) */}
  <div className="absolute inset-0 bg-black/30 z-[1]" />

  {/* Text Content */}
  <div className="relative z-[2] max-w-xl text-white">
    <h1 className="text-5xl md:text-7xl font-extrabold mb-4 leading-tight tracking-tight drop-shadow-lg">
      REDEFINE YOUR STYLE
    </h1>
    <p className="text-gray-200 mb-8 text-lg max-w-md">
      Discover our latest collection of sweatshirts and hoodies.
    </p>

    <Button
      asChild
      className="bg-white text-black px-8 py-3 text-sm font-semibold tracking-wide hover:bg-gray-200 transition"
    >
      <Link to="/collections/hoodies">SHOP NOW</Link>
    </Button>
  </div>
</section>


      {/* ======================================================
          FEATURED COLLECTIONS
      ====================================================== */}
<section className="py-20 bg-white relative overflow-hidden">
  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center uppercase">
    FEATURED COLLECTIONS
  </h2>
  <p className="text-gray-500 text-sm text-center mb-12 mt-2">
    Scroll right to explore →
  </p>

  <div className="flex max-w-full relative">
    {/* Left fixed column */}
    <div className="flex-shrink-0 sticky top-20 w-96 h-auto bg-white z-20">
      <Link
        to="/collections/all"
        className="flex flex-col items-center group"
      >
        <img
          src="https://bzmvvcdngqoxwpbulakr.supabase.co/storage/v1/object/public/product-images/products/1760803192692-zasrnaykki8.webp"
          alt="MEN'S COLLECTION"
          className="w-full h-[400px] md:h-[500px] object-cover mb-4 rounded-lg group-hover:opacity-90 transition"
        />
        <p className="text-sm font-medium uppercase tracking-wide text-center">
          MEN'S COLLECTION
        </p>
      </Link>
    </div>

    {/* Right scrollable section */}
    <div className="relative flex-1 overflow-x-auto pl-6 scrollbar-thin">
      <div className="flex gap-8 pr-12">
        {categories.map((category) => (
          <Link
            key={category._id}
            to={`/collections/${category.slug}`}
            className="flex-shrink-0 w-96 flex flex-col items-center group"
          >
            <img
              src={
                category.photo ||
                `https://via.placeholder.com/250x300?text=${encodeURIComponent(
                  category.name
                )}`
              }
              alt={category.name}
              className="w-full h-[400px] md:h-[500px] object-cover mb-4 rounded-lg group-hover:opacity-90 transition"
            />
            <p className="text-sm font-medium uppercase tracking-wide text-center">
              {category.name}
            </p>
          </Link>
        ))}
      </div>
    </div>

    {/* Left fade */}
    <div className="pointer-events-none absolute top-0 bottom-0 left-[24rem] w-12 bg-gradient-to-r from-white to-transparent z-30" />
    {/* Right fade */}
    <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-30" />
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
      <Link to="/collections/sale">GRAB THE DEAL</Link>
    </Button>
  </div>

  {/* Floating gradient shimmer */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_4s_infinite]" />
</section>



      {/* ======================================================
          LOOKBOOK SECTION
      ====================================================== */}
<section className="pt-24 bg-white relative overflow-hidden w-full">
  <h2 className="text-2xl md:text-3xl font-bold mb-12 tracking-tight text-center uppercase">
    LOOKBOOK
  </h2>

  <div className="flex overflow-x-auto gap-8 px-6 md:px-20 w-full scrollbar-thin">
    {categories.map((category) => {
      const categoryProducts = products
        .filter((p) => p.category?._id === category._id)
        .slice(0, 3);

      if (!categoryProducts.length) return null;

      return (
        <div
          key={category._id}
          className="flex-shrink-0 w-72 md:w-96 group cursor-pointer relative"
        >
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
                    ${rotations[index] || "rotate-0"}
                    ${topOffsets[index] || "top-0"}
                    ${leftOffsets[index] || "left-0"}
                    z-[${zIndex[index] || 10}]
                    group-hover:scale-105`}
                />
              );
            })}
          </div>

          <button className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 px-4 py-2 text-sm font-medium uppercase rounded-md hover:bg-opacity-90 transition">
            SHOP THE LOOK
          </button>
        </div>
      );
    })}

    <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />
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
  <div className="mx-auto px-4 sm:px-6 lg:px-8 ">
    {/* Header */}
    <div className="flex flex-col md:flex-row items-center justify-between mb-8">
      <h2 className="text-3xl font-bold uppercase tracking-tight">FEATURED PRODUCTS</h2>
      <Link
        to="/collections/bestseller"
        className="flex items-center gap-2 text-sm font-bold uppercase text-black hover:text-gray-700 transition"
      >
        DISCOVER MORE
        <svg
          role="presentation"
          focusable="false"
          width="5"
          height="8"
          className="stroke-current"
          viewBox="0 0 5 8"
        >
          <path
            d="m.75 7 3-3-3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          ></path>
        </svg>
      </Link>
    </div>

    {/* Products Grid */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.slice(0, 8).map((p) => {
        const discountPercent = p.originalPrice
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : null;

        return (
          <Card
            key={p._id}
            className="group border border-gray-200 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition relative bg-white flex flex-col"
          >
            {/* Image: 80% height */}
            <Link
              to={`/product/${p._id}`}
              className="h-4/5 relative overflow-hidden"
            >
              <img
                src={p.images?.[0] || "https://via.placeholder.com/400x400?text=No+Image"}
                alt={p.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                {p.isNewProduct && (
                  <Badge className="bg-red-700 text-white px-2 py-1 text-xs uppercase font-bold rounded">
                    NEW
                  </Badge>
                )}
                {p.onSale && discountPercent && (
                  <Badge className="bg-red-600 text-white px-2 py-1 text-xs uppercase font-bold rounded">
                    {discountPercent}% OFF
                  </Badge>
                )}
              </div>
            </Link>

            {/* Details: 20% height */}
            <div className="h-1/5 p-4 flex flex-col justify-between">
              <h3 className="text-black font-bold uppercase truncate">{p.title}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-lg font-bold text-black">₹{p.price}</span>
                {p.originalPrice && (
                  <span className="text-gray-500 line-through text-sm uppercase">₹{p.originalPrice}</span>
                )}
              </div>
              <Link
                to={`/product/${p._id}`}
                className="mt-2 block text-center bg-black text-white px-3 py-1 text-xs font-semibold uppercase rounded hover:bg-gray-900 transition"
              >
                View
              </Link>
            </div>
          </Card>
        );
      })}
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
        <a
          href="#"
          className="px-6 py-3 bg-white text-black font-bold uppercase border border-white rounded-lg shadow-lg hover:bg-gray-100 hover:scale-105 transition-transform"
        >
          Download on iOS
        </a>
        <a
          href="#"
          className="px-6 py-3 bg-transparent text-white font-bold uppercase border border-white rounded-lg shadow-lg hover:bg-white hover:text-black hover:scale-105 transition-transform"
        >
          Download on Android
        </a>
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
        <span className="font-bold uppercase">Dream</span>, we’re all ears.
      </p>
    </div>

    {/* Form */}
    <form
      method="post"
      action="/contact#ContactForm"
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* Name */}
      <div className="relative">
        <input
          type="text"
          name="contact[Name]"
          id="ContactForm-name"
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
          name="contact[email]"
          id="ContactForm-email"
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
          name="contact[Phone number]"
          id="ContactForm-phone"
          pattern="[0-9\-]*"
          placeholder=" "
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
          name="contact[Comment]"
          id="ContactForm-body"
          rows={5}
          placeholder=" "
            required
          className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none resize-none uppercase"
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
          className="px-12 py-3 bg-black text-white font-bold uppercase tracking-wide transition-colors duration-300 ease-in-out hover:bg-gray-900"
        >
          Send
        </button>
      </div>
    </form>
  </div>
</section>

    </div>
  );
}
