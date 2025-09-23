import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    },
    {
      name: "Jackets",
      image: "/images/4.avif",
      link: "/category/jackets",
    },
    {
      name: "T-Shirts",
      image: "/images/1.avif",
      link: "/category/tshirts",
    },
    {
      name: "Pants",
      image: "/images/2.avif",
      link: "/category/pants",
    },
    {
      name: "Shirts",
      image: "/images/5.avif",
      link: "/category/shirts",
    },
  ];

  return (
    <div className="space-y-20">

 {/* Hero Section */}
<section className="relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white">
  {/* Animated Blobs / Background Shapes */}
  <div className="absolute top-0 left-0 w-full h-full -z-10">
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-400 rounded-full opacity-40 animate-blob"></div>
    <div className="absolute top-10 right-0 w-72 h-72 bg-yellow-400 rounded-full opacity-30 animate-blob animation-delay-2000"></div>
    <div className="absolute bottom-0 left-20 w-80 h-80 bg-purple-600 rounded-full opacity-30 animate-blob animation-delay-4000"></div>
  </div>

  <div className="px-8 py-24 sm:px-12 lg:px-16 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10">
    {/* Text Content */}
    <div className="flex-1 space-y-6">
      <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight drop-shadow-lg animate-fade-in-up">
        Elevate Your <span className="text-yellow-300">Style</span>
      </h1>
      <p className="text-lg sm:text-xl max-w-xl text-white/90 animate-fade-in-up delay-500">
        Discover the latest streetwear trends and premium essentials designed to make a statement.
      </p>
      <div className="flex gap-4 mt-6 animate-fade-in-up delay-700">
        <a
          href="/products"
          className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg shadow-lg hover:scale-105 transition transform"
        >
          Shop Now
        </a>
        <a
          href="#app"
          className="px-6 py-3 border border-white text-white font-semibold rounded-lg hover:bg-white hover:text-purple-600 transition transform hover:scale-105"
        >
          Explore App
        </a>
      </div>
    </div>

    {/* Hero Media (Video / Carousel) */}
    <div className="flex-1 relative animate-fade-in delay-1000">
      <video
        src="https://player.vimeo.com/progressive_redirect/playback/720745027/rendition/720p/file.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full max-w-md rounded-xl shadow-2xl object-cover border-4 border-white"
      />
      {/* Optional floating product cards / icons */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-white/20 rounded-lg rotate-12 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-yellow-300/30 rounded-lg rotate-6 animate-pulse delay-500"></div>
    </div>
  </div>

  {/* Tailwind Animations */}
  <style>
    {`
      @keyframes blob {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(30px, -50px) scale(1.1); }
        66% { transform: translate(-20px, 20px) scale(0.9); }
      }
      .animate-blob { animation: blob 8s infinite; }
      .animation-delay-2000 { animation-delay: 2s; }
      .animation-delay-4000 { animation-delay: 4s; }

      @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-up { animation: fadeInUp 1s forwards; }
      .delay-500 { animation-delay: 0.5s; }
      .delay-700 { animation-delay: 0.7s; }
      .delay-1000 { animation-delay: 1s; }
    `}
  </style>
</section>


    


{/* <section className="max-w-7xl mx-auto  py-12">
      <h2 className="text-3xl font-bold mb-8 text-center">Featured Products</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {products.map((p) => (
          <Link
            key={p._id}
            to={`/product/${p._id}`}
            className="group relative bg-white overflow-hidden transition"
          >
            <div className="relative w-full h-96 overflow-hidden">
              <img
                src={p.images?.[0] || "https://via.placeholder.com/400x600"}
                alt={p.title}
                className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
              />
              {p.images?.[1] && (
                <img
                  src={p.images[1]}
                  alt={p.title + " hover"}
                  className="w-full h-full object-cover absolute top-0 left-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              )}

              {p.isNew && (
                <span className="absolute top-3 left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
                  NEW
                </span>
              )}
              {p.onSale && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                  SALE
                </span>
              )}
            </div>

            <div className="p-4 flex flex-col gap-1">
              <h3 className="text-sm font-medium text-gray-900 truncate hover:text-gray-500 transition">
                {p.title}
              </h3>
              <span className="text-purple-600 font-bold">₹{p.price}</span>
            </div>
          </Link>
        ))}
      </div>
    </section> */}

<section className="bg-purple-50 py-16">
  <div>
    <h2 className="text-3xl font-bold text-center mb-10">
      Shop by Category
    </h2>

    <div className="grid grid-cols-2">
      {categories.map((c, i) => (
        <Link
          key={i}
          to={c.link}
          className={`relative group overflow-hidden shadow hover:shadow-lg ${
            i === 2 ? "col-span-2" : "" // Make the 3rd category span both columns
          }`}
        >
          {/* Background Image */}
          <img
            src={c.image}
            alt={c.name}
            className="w-full  object-cover group-hover:scale-110 transition-transform"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition" />

          {/* Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-4">
            <h3 className="text-xl font-semibold">{c.name}</h3>
            <p className="text-sm opacity-80 mt-1">Explore More</p>
          </div>
        </Link>
      ))}
    </div>
  </div>
</section>



    {/* Featured / Best Selling */}
<section className="bg-purple-50 pt-12 pb-16">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <h2 className="text-3xl font-bold mb-6 text-center">Featured Products</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.slice(0, 8).map((p) => {
        const discountPercent = p.originalPrice
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : null;

        return (
          <Card
            key={p._id}
            className="group overflow-hidden rounded-2xl shadow hover:shadow-lg transition relative"
          >
            <Link to={`/product/${p._id}`} className="relative">
              <img
                src={p.images?.[0] || "https://via.placeholder.com/400x400?text=No+Image"}
                alt={p.title}
                className="w-full h-56 object-cover group-hover:scale-105 transition-transform"
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


      <section className="bg-purple-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading & Intro */}
        <div className="grid grid-cols-1 pb-10 gap-8 text-center">
          <h2 className="text-3xl font-bold">Reach out to us</h2>
          <div className="text-gray-700 space-y-2">
            <p><strong>Got questions, ideas, or just wanna vibe with us?</strong></p>
            <p>
              At <strong>Dream</strong>, we’re all ears—whether you’ve got a sick T-shirt idea, need help with an order, or just wanna say hey. Hit us up and we’ll get back to you real quick. Your thoughts fuel our fire.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="text-5xl font-bold">        Contact form          </div>
        <form
          method="post"
          action="/contact#ContactForm"
          className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6  rounded-lg "
        >

          {/* Name */}
          <div className="relative">
            <input
              type="text"
              name="contact[Name]"
              id="ContactForm-name"
              placeholder=" "
              className="peer w-full px-4 pt-5 pb-2 border border-gray-300  focus:ring-2 focus:ring-purple-400 focus:outline-none"
              required
            />
            <label
              htmlFor="ContactForm-name"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all 
                         peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                         peer-focus:top-2 peer-focus:text-purple-700 peer-focus:text-sm"
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
              className="peer w-full px-4 pt-5 pb-2 border border-gray-300  focus:ring-2 focus:ring-purple-400 focus:outline-none"
              required
            />
            <label
              htmlFor="ContactForm-email"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all 
                         peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                         peer-focus:top-2 peer-focus:text-purple-700 peer-focus:text-sm"
            >
              Email
            </label>
          </div>

          {/* Phone */}
          <div className="relative col-span-2">
            <input
              type="tel"
              name="contact[Phone number]"
              id="ContactForm-phone"
              placeholder=" "
              pattern="[0-9\-]*"
              className="peer w-full px-4 pt-5 pb-2 border border-gray-300  focus:ring-2 focus:ring-purple-400 focus:outline-none"
            />
            <label
              htmlFor="ContactForm-phone"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all 
                         peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                         peer-focus:top-2 peer-focus:text-purple-700 peer-focus:text-sm"
            >
              Phone number
            </label>
          </div>

          {/* Comment */}
          <div className="relative md:col-span-2">
            <textarea
              name="contact[Comment]"
              id="ContactForm-body"
              rows={6}
              placeholder=" "
              className="peer w-full px-4 pt-5 pb-2 border border-gray-300  focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none"
            />
            <label
              htmlFor="ContactForm-body"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all 
                         peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base
                         peer-focus:top-2 peer-focus:text-purple-700 peer-focus:text-sm"
            >
              Comment
            </label>
          </div>

          {/* Submit Button */}
          <div className="text-start md:col-span-2">
            <button
              type="submit"
              className="px-10 py-3 bg-purple-600 text-white font-semibold  hover:bg-purple-700 transition"
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
