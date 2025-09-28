import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FAQ from "@/components/Faq";
import FeaturesCarousel from "@/components/FeaturesCarousel";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/products?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.items || []));
  }, [q]);

  const categories = [
    {
      name: "Hoodies",
      image: "/images/3.avif",
      link: "/category/hoodies",
      description:
        "Stay cozy and stylish with our premium hoodies, designed for comfort and everyday wear.",
    },
    {
      name: "Jackets",
      image: "/images/4.avif",
      link: "/category/jackets",
      description:
        "Our jackets combine style and functionality, keeping you warm and trendy in all seasons.",
    },
    {
      name: "T-Shirts",
      image: "/images/1.avif",
      link: "/category/tshirts",
      description:
        "Versatile t-shirts crafted for comfort and style, perfect for casual outings or layering.",
    },
    // {
    //   name: "Pants",
    //   image: "/images/2.avif",
    //   link: "/category/pants",
    //   description:
    //     "Comfortable and durable pants designed for both work and leisure, keeping you confident all day.",
    // },
    {
      name: "Shirts",
      image: "/images/5.avif",
      link: "/category/shirts",
      description:
        "Smart and crisp shirts for every occasion, offering a perfect blend of elegance and ease.",
    },
  ];
  
  return (
    <div className="space-y-20">
      {/* Hero Banner */}
      <div className="relative w-full overflow-hidden text-center">
        {/* Desktop Image */}
        <img
          className="hidden md:block w-full"
          src="/images/banner_web.webp"
          alt="Hero Banner"
        />

        {/* Mobile Image */}
        <img
          className="block md:hidden w-full"
          src="/images/banner_pon.webp"
          alt="Hero Banner Mobile"
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-start max-w-7xl mx-auto justify-center text-white px-4">
          <h2 className="text-3xl md:text-7xl font-semibold mb-4 w-1/2 text-left">
            Drip in Comfort, Slay in Style
          </h2>

          <span className="block w-20 h-1 bg-gradient-to-r from-orange-500 to-pink-600 mb-6"></span>

          <div>
            <a
              href="/collections/drift-collection"
              className="inline-block bg-black hover:bg-pink-600 transition text-white px-6 py-3 rounded font-medium"
            >
              Shop The Drip
            </a>
          </div>
        </div>
      </div>


{/* Explore Categories */}

      <section className=" py-20">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
        <div className="text-4xl font-extrabold text-center mb-16 tracking-wide w-2/3">
        Every step forward, however gentle, carries relentless progress and inner peace, shaping who you are meant to be
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
          {categories.map((c, i) => (
            <Link
              key={i}
              to={c.link}
              className="relative group perspective cursor-pointer"
            >
              {/* Card */}
              <div className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105">
                {/* Image */}
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-[80vh] object-cover brightness-90 transition duration-500 group-hover:brightness-110"
                />

                {/* Glowing Border */}
                <div className="absolute inset-0 border-4 border-transparent rounded-xl group-hover:border-gray-500/70 animate-pulse"></div>

                {/* Text Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-2xl font-bold text-white mb-2">{c.name}</h3>
                  <p className="text-sm text-gray-300 mb-4">{c.description}</p>

                  {/* Floating Button */}
                  <Button className="bg-gray-900 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:bg-gray-800 transition transform hover:-translate-y-1">
                    Explore
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>








    {/* Featured / Best Selling */}
    <section className="bg-purple-50 pt-12 pb-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Section Header */}
    <div className="flex flex-col md:flex-row items-center justify-between mb-8">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <h2 className="text-3xl font-bold">FEATURED</h2>
        {/* Category Buttons */}
        <button
          onClick={() => hidediv("men-product")}
          className="px-4 py-2 rounded-md border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200 transition"
        >
          MEN
        </button>
        <button
          onClick={() => hidediv("women-product")}
          className="px-4 py-2 rounded-md border border-gray-900 bg-gray-900 text-white hover:bg-gray-700 transition"
        >
          WOMEN
        </button>
      </div>

      {/* Discover More */}
      <a
        href="/collections/bestseller"
        className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-purple-600 transition"
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
          <path d="m.75 7 3-3-3-3" fill="none" stroke="currentColor" strokeWidth="1.5"></path>
        </svg>
      </a>
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
            className="group overflow-hidden rounded-lg hover:shadow-lg transition relative bg-white"
          >
            <Link to={`/product/${p._id}`} className="relative">
              <div className="w-full h-56 bg-cover bg-center group-hover:scale-105 transition-transform"
                   style={{ backgroundImage: `url(${p.images?.[0] || "https://via.placeholder.com/400x400?text=No+Image"})` }}
              />

              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                {p.isNewProduct && (
                  <Badge className="bg-green-500 text-white px-2 py-1 text-xs animate-bounce">
                    New
                  </Badge>
                )}
                {p.onSale && discountPercent && (
                  <Badge className="bg-red-500 text-white px-2 py-1 text-xs animate-pulse">
                    {discountPercent}% Off
                  </Badge>
                )}
                {p.onSale && !discountPercent && (
                  <Badge className="bg-red-500 text-white px-2 py-1 text-xs animate-pulse">
                    Sale
                  </Badge>
                )}
              </div>
            </Link>

            <CardHeader className="px-4 pt-2">
              <h3 className="text-gray-900 font-semibold truncate">{p.title}</h3>
            </CardHeader>

            <CardContent className="px-4 pt-0 flex items-center justify-between">
              <p className="text-purple-600 font-bold">₹{p.price?.toFixed(2)}</p>
              {p.onSale && p.originalPrice && (
                <p className="text-gray-400 line-through text-sm">
                  ₹{p.originalPrice?.toFixed(2)}
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
      <section id="app" className="relative overflow-hidden text-gray-900 bg-purple-50">
        <div className="px-8 py-24 sm:px-12 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight">
              10% More Discount on App
            </h1>
            <p className="text-lg sm:text-xl max-w-xl text-gray-700">
              Download our mobile app for exclusive offers, faster checkout, and a personalized shopping experience.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="#"
                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition"
              >
                Download on iOS
              </a>
              <a
                href="#"
                className="px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-lg hover:bg-gray-200 transition"
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
              className="w-full max-w-sm rounded-xl shadow-lg object-cover border-4 border-white"
            />
            <div className="absolute top-0 left-0 w-20 h-20 bg-yellow-300/30 rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-400/30 rounded-full animate-pulse delay-500"></div>
          </div>
        </div>
      </section>


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
          className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none transition uppercase"
          required
        />
        <label
          htmlFor="ContactForm-name"
          className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs"
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
          className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none transition uppercase"
          required
        />
        <label
          htmlFor="ContactForm-email"
          className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs"
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
          className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none transition uppercase"
        />
        <label
          htmlFor="ContactForm-phone"
          className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs"
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
          className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-black focus:border-black focus:outline-none resize-none transition uppercase"
        />
        <label
          htmlFor="ContactForm-body"
          className="absolute left-4 top-0 -translate-y-1 text-black text-xs font-bold uppercase tracking-wide
          peer-placeholder-shown:top-6 peer-placeholder-shown:text-gray-500 peer-placeholder-shown:text-base
          peer-focus:top-0 peer-focus:-translate-y-1 peer-focus:text-black peer-focus:text-xs"
        >
          Comment
        </label>
      </div>

      {/* Submit */}
      <div className="md:col-span-2 text-center mt-4">
        <button
          type="submit"
          className="px-12 py-3 bg-black text-white font-bold uppercase tracking-wide transition hover:bg-gray-900"
        >
          Send
        </button>
      </div>
    </form>
  </div>
</section>



<FAQ />
<FeaturesCarousel />

    </div>
  );
}
