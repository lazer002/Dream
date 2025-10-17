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
      <section className="py-20 text-center bg-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-12 tracking-tight uppercase">
          FEATURED COLLECTIONS
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-6 md:px-20">
          {[
            { label: "MEN'S COLLECTION", link: "/collections/mens" },
            { label: "HOODIES", link: "/collections/hoodies" },
            { label: "T-SHIRTS", link: "/collections/tshirts" },
            { label: "SHIRTS", link: "/collections/shirts" },
          ].map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="flex flex-col items-center group"
            >
              <img
                src={`https://via.placeholder.com/250x300?text=${encodeURIComponent(
                  item.label
                )}`}
                alt={item.label}
                className="w-full object-cover mb-4 group-hover:opacity-90 transition"
              />
              <p className="text-sm font-medium uppercase tracking-wide">
                {item.label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ======================================================
          END OF SEASON SALE
      ====================================================== */}
      <section className="bg-black text-white text-center py-20">
        <h2 className="text-3xl font-bold mb-6 tracking-tight uppercase">
          END OF SEASON SALE – UP TO 30% OFF
        </h2>
        <Button
          asChild
          className="bg-white text-black px-8 py-3 text-sm font-semibold tracking-wide hover:bg-gray-200 transition"
        >
          <Link to="/collections/sale">GRAB THE DEAL</Link>
        </Button>
      </section>

      {/* ======================================================
          LOOKBOOK SECTION
      ====================================================== */}
      <section className="py-20 text-center bg-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-12 tracking-tight uppercase">
          LOOKBOOK
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 md:px-20">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden group cursor-pointer"
            >
              <img
                src={`https://via.placeholder.com/250x300?text=LOOK+${i}`}
                alt={`Look ${i}`}
                className="w-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <button className="text-white border border-white px-4 py-2 text-sm font-medium uppercase">
                  SHOP THE LOOK
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          JOURNAL / FOOTER
      ====================================================== */}
      <footer className="bg-gray-100 text-center py-16">
        <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight uppercase">
          FROM THE DRIPJOURNAL
        </h3>
        <p className="text-gray-700 mb-2 text-sm md:text-base">
          Get 10% Off Your First Order.
        </p>
        <p className="text-gray-500 text-xs md:text-sm">
          Best to know about our latest drops.
        </p>
      </footer>

      {/* ======================================================
          FEATURED PRODUCTS
      ====================================================== */}
      <section className="bg-white pt-12 pb-16 text-black">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <h2 className="text-3xl font-bold uppercase">FEATURED PRODUCTS</h2>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((p) => {
              const discountPercent = p.originalPrice
                ? Math.round(
                    ((p.originalPrice - p.price) / p.originalPrice) * 100
                  )
                : null;

              return (
                <Card
                  key={p._id}
                  className="group overflow-hidden border border-black transition relative bg-white"
                >
                  <Link to={`/product/${p._id}`} className="relative">
                    <div
                      className="w-full h-56 bg-cover bg-center group-hover:scale-105 transition-transform"
                      style={{
                        backgroundImage: `url(${
                          p.images?.[0] ||
                          "https://via.placeholder.com/400x400?text=No+Image"
                        })`,
                      }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      {p.isNewProduct && (
                        <Badge className="bg-black text-white px-2 py-1 text-xs uppercase font-bold">
                          NEW
                        </Badge>
                      )}
                      {p.onSale && discountPercent && (
                        <Badge className="bg-black text-white px-2 py-1 text-xs uppercase font-bold">
                          {discountPercent}% OFF
                        </Badge>
                      )}
                    </div>
                  </Link>

                  <CardHeader className="px-4 pt-2">
                    <h3 className="text-black font-bold uppercase truncate">
                      {p.title}
                    </h3>
                  </CardHeader>

                  <CardContent className="px-4 pt-0 flex items-center justify-between">
                    <p className="text-black font-bold">₹{p.price}</p>
                    {p.originalPrice && (
                      <p className="text-gray-500 line-through text-sm uppercase">
                        ₹{p.originalPrice}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>



      {/* App Promo Section */}
<section id="app" className="relative overflow-hidden text-black bg-white">
  <div className="px-8 py-24 sm:px-12 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10">
    <div className="flex-1 space-y-6">
      <h1 className="text-5xl sm:text-6xl font-extrabold uppercase tracking-tight">
        10% More Discount on App
      </h1>
      <p className="text-lg sm:text-xl max-w-xl text-gray-700">
        Download our mobile app for exclusive offers, faster checkout, and a personalized shopping experience.
      </p>
      <div className="flex gap-4 mt-6">
        <a
          href="#"
          className="px-6 py-3 bg-black text-white font-bold uppercase border border-black hover:bg-white hover:text-black transition"
        >
          Download on iOS
        </a>
        <a
          href="#"
          className="px-6 py-3 bg-white text-black font-bold uppercase border border-black hover:bg-black hover:text-white transition"
        >
          Download on Android
        </a>
      </div>
    </div>
    <div className="flex-1 flex justify-center relative">
      <video
        src="/videos/app-preview.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full max-w-sm object-cover border-2 border-black"
      />
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
